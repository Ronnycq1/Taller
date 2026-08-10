import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
import pyodbc
from datetime import datetime

# ---------------------------------------------------------
# Configuración y Conexión
# ---------------------------------------------------------

# Inicializar Firebase
# Asegúrate de tener el archivo serviceAccountKey.json en el mismo directorio
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Configuración de SQL Server
# Cambia estos valores según tu instancia
SQL_SERVER = 'localhost'
SQL_DATABASE = 'CQMotors_BI'
SQL_USERNAME = 'sa'
SQL_PASSWORD = 'YourStrongPassword!'

connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={SQL_SERVER};DATABASE={SQL_DATABASE};UID={SQL_USERNAME};PWD={SQL_PASSWORD}'

# ---------------------------------------------------------
# Extracción desde Firestore
# ---------------------------------------------------------
def extract_collection(collection_name):
    print(f"Extrayendo colección: {collection_name}...")
    docs = db.collection(collection_name).stream()
    data = []
    for doc in docs:
        doc_dict = doc.to_dict()
        doc_dict['id'] = doc.id
        data.append(doc_dict)
    return data

# ---------------------------------------------------------
# Transformación (Limpieza y Normalización)
# ---------------------------------------------------------
def transform_data(vehicles_data, maintenance_data, clients_data):
    print("Transformando datos con Pandas...")
    
    # DataFrames
    df_vehicles = pd.DataFrame(vehicles_data)
    df_maintenance = pd.DataFrame(maintenance_data)
    df_clients = pd.DataFrame(clients_data)

    # Limpieza básica
    # Convertir fechas de ISO string a datetime
    if not df_maintenance.empty:
        df_maintenance['fechaRegistro'] = pd.to_datetime(df_maintenance['fechaRegistro'], errors='coerce')
    
    if not df_vehicles.empty:
        df_vehicles['fechaIngreso'] = pd.to_datetime(df_vehicles['fechaIngreso'], errors='coerce')

    # Dimensión Cliente (Extrayendo de vehicles_data si no hay colección de clientes aislada)
    if 'cliente' in df_vehicles.columns:
        # Extraer subdocumento de cliente
        clients_list = df_vehicles['cliente'].apply(pd.Series)
        df_dim_clients = clients_list.drop_duplicates(subset=['id']).reset_index(drop=True)
        # Limpieza de nulos
        df_dim_clients.fillna('N/A', inplace=True)
    else:
        df_dim_clients = pd.DataFrame(columns=['id', 'nombre', 'telefono', 'correo'])

    # Dimensión Vehículo
    if not df_vehicles.empty:
        df_dim_vehicles = df_vehicles[['id', 'placa', 'marca', 'modelo', 'anio', 'kilometraje']].drop_duplicates(subset=['id']).reset_index(drop=True)
        df_dim_vehicles.fillna('N/A', inplace=True)
    else:
        df_dim_vehicles = pd.DataFrame(columns=['id', 'placa', 'marca', 'modelo', 'anio', 'kilometraje'])

    # Tabla de Hechos: Mantenimientos
    if not df_maintenance.empty:
        df_fact_maintenance = df_maintenance[['id', 'vehiculoId', 'fechaRegistro', 'costoManoObra', 'totalCalculado', 'cpr']].copy()
        df_fact_maintenance['cpr'] = df_fact_maintenance['cpr'].fillna(0.0)
        df_fact_maintenance['costoManoObra'] = df_fact_maintenance['costoManoObra'].fillna(0.0)
        df_fact_maintenance['totalCalculado'] = df_fact_maintenance['totalCalculado'].fillna(0.0)
    else:
        df_fact_maintenance = pd.DataFrame(columns=['id', 'vehiculoId', 'fechaRegistro', 'costoManoObra', 'totalCalculado', 'cpr'])

    return df_dim_clients, df_dim_vehicles, df_fact_maintenance

# ---------------------------------------------------------
# Carga a SQL Server
# ---------------------------------------------------------
def load_to_sql(df, table_name, conn):
    print(f"Cargando {len(df)} registros a la tabla {table_name}...")
    cursor = conn.cursor()
    
    if df.empty:
        print(f"Tabla {table_name} sin datos para cargar.")
        return

    columns = ",".join(df.columns)
    placeholders = ",".join(["?"] * len(df.columns))
    insert_query = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
    
    # Preparar datos (convertir NaN a None)
    df_clean = df.where(pd.notnull(df), None)
    
    for index, row in df_clean.iterrows():
        try:
            cursor.execute(insert_query, tuple(row))
        except Exception as e:
            print(f"Error insertando fila {index} en {table_name}: {e}")
            
    conn.commit()
    print(f"Carga completa para {table_name}.")

# ---------------------------------------------------------
# Ejecución Principal
# ---------------------------------------------------------
def main():
    try:
        print("Iniciando Pipeline ETL: Firestore -> SQL Server")
        
        # 1. Extracción
        raw_vehicles = extract_collection('vehicles')
        raw_maintenances = extract_collection('maintenances')
        raw_users = extract_collection('users') # Opcional: si existen usuarios como clientes
        
        # 2. Transformación
        df_clients, df_vehicles, df_fact = transform_data(raw_vehicles, raw_maintenances, raw_users)
        
        # 3. Carga
        conn = pyodbc.connect(connection_string)
        
        # Se recomienda truncar o manejar upserts (MERGE) en un pipeline real.
        # Aquí insertamos directamente por simplicidad.
        load_to_sql(df_clients, 'DimClientes', conn)
        load_to_sql(df_vehicles, 'DimVehiculos', conn)
        load_to_sql(df_fact, 'FactMantenimientos', conn)
        
        conn.close()
        print("Pipeline finalizado con éxito.")
        
    except Exception as e:
        print(f"Error crítico en el pipeline: {e}")

if __name__ == '__main__':
    main()
