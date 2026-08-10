import React, { useState } from "react";
import { 
  Database, 
  FolderTree, 
  BarChart4, 
  Layers, 
  Copy, 
  Check, 
  Terminal, 
  HelpCircle,
  FileCode,
  LineChart,
  HardDrive,
  GitFork,
  RefreshCw,
  Server
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Vehiculo, Mantenimiento, RepuestoInventario } from "../types";

interface ArchitectureGuideProps {
  vehicles?: Vehiculo[];
  maintenances?: Mantenimiento[];
  inventory?: RepuestoInventario[];
}

export default function ArchitectureGuide({
  vehicles = [],
  maintenances = [],
  inventory = []
}: ArchitectureGuideProps) {
  const [activeTab, setActiveTab] = useState<"database" | "folders" | "bi_pipeline" | "libraries">("database");
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSyncToSQL = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch("/api/replicate-to-sql-server", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ vehicles, maintenances, inventory })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncResult(data);
      } else {
        setSyncError(data.error || "Error de red al replicar.");
      }
    } catch (err: any) {
      setSyncError(err.message || "Error al conectar con la API de sincronización.");
    } finally {
      setSyncing(false);
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sqlSchema = `-- =========================================================
-- MODELO DE BASE DE DATOS RELACIONAL PARA CQ MOTORS (SQL SERVER)
-- Diseñado por Arquitecto UX/UI & DB Senior
-- =========================================================

-- 1. Tabla de Usuarios (Soporte Multi-Rol Autorizado)
CREATE TABLE dbo.Usuarios (
    UsuarioID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    NombreCompleto NVARCHAR(150) NOT NULL,
    Rol NVARCHAR(30) NOT NULL CHECK (Rol IN ('Administrador', 'Mecanico', 'Gerente', 'Cliente')),
    ClienteID INT NULL, -- Vinculado si es Rol 'Cliente' (evita redundancias)
    FechaCreacion DATETIME2 DEFAULT GETDATE(),
    Activo BIT DEFAULT 1
);

-- 2. Tabla de Clientes (No redundancia de datos)
CREATE TABLE dbo.Clientes (
    ClienteID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(150) NOT NULL,
    Telefono NVARCHAR(20) NOT NULL,
    Correo NVARCHAR(150) NULL,
    FechaRegistro DATETIME2 DEFAULT GETDATE()
);

-- 3. Tabla de Vehículos (Relación Muchos a Uno con Clientes)
CREATE TABLE dbo.Vehiculos (
    VehiculoID INT IDENTITY(1,1) PRIMARY KEY,
    Placa NVARCHAR(15) NOT NULL UNIQUE,
    Marca NVARCHAR(50) NOT NULL,
    Modelo NVARCHAR(80) NOT NULL,
    Anio INT CHECK (Anio >= 1900 AND Anio <= YEAR(GETDATE()) + 1),
    ClienteID INT NOT NULL,
    Kilometraje INT NOT NULL CHECK (Kilometraje >= 0),
    NivelCombustible INT DEFAULT 0 CHECK (NivelCombustible >= 0 AND NivelCombustible <= 100),
    FechaIngreso DATETIME2 DEFAULT GETDATE(),
    Estado NVARCHAR(25) DEFAULT 'Ingresado' CHECK (Estado IN ('Ingresado', 'En Proceso', 'Listo para Entrega', 'Entregado')),
    CONSTRAINT FK_Vehiculos_Clientes FOREIGN KEY (ClienteID) 
        REFERENCES dbo.Clientes(ClienteID) ON DELETE CASCADE
);

-- 4. Tabla de Hojas de Mantenimiento (Master-Detail Core)
CREATE TABLE dbo.Mantenimientos (
    MantenimientoID INT IDENTITY(1,1) PRIMARY KEY,
    VehiculoID INT NOT NULL UNIQUE, -- Una hoja activa de seguimiento por vehículo en reparación
    FechaRegistro DATETIME2 DEFAULT GETDATE(),
    OperadorMecanico NVARCHAR(100) NOT NULL,
    Observaciones NVARCHAR(MAX) NULL,
    DiagnosticoFuturo NVARCHAR(MAX) NULL,
    RecordatorioProximoMeses INT DEFAULT 3 CHECK (RecordatorioProximoMeses IN (3, 6, 12)),
    CostoManoObra DECIMAL(10, 2) DEFAULT 0.00,
    CONSTRAINT FK_Mantenimientos_Vehiculos FOREIGN KEY (VehiculoID) 
        REFERENCES dbo.Vehiculos(VehiculoID) ON DELETE CASCADE
);

-- 5. Tabla de Tareas/Checklist de Mantenimientos Realizadas
CREATE TABLE dbo.TareasMantenimiento (
    TareaID INT IDENTITY(1,1) PRIMARY KEY,
    MantenimientoID INT NOT NULL,
    Nombre NVARCHAR(150) NOT NULL,
    Categoria NVARCHAR(30) CHECK (Categoria IN ('Lubricantes', 'Filtros', 'Frenos', 'Encendido', 'Transmision', 'Preventivo', 'Otros')),
    Completada BIT DEFAULT 0,
    CostoEstimado DECIMAL(10,2) DEFAULT 0.00,
    CONSTRAINT FK_Tareas_Mantenimientos FOREIGN KEY (MantenimientoID) 
        REFERENCES dbo.Mantenimientos(MantenimientoID) ON DELETE CASCADE
);

-- 6. Tabla de Repuestos en Inventario (Control de bodega físico)
CREATE TABLE dbo.RepuestosInventario (
    RepuestoID INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(50) NOT NULL UNIQUE,
    Nombre NVARCHAR(200) NOT NULL,
    Stock INT NOT NULL DEFAULT 0 CHECK (Stock >= 0),
    StockMinimo INT NOT NULL DEFAULT 5 CHECK (StockMinimo >= 0),
    PrecioVenta DECIMAL(10,2) NOT NULL CHECK (PrecioVenta >= 0),
    Ubicacion NVARCHAR(100) NULL, -- Ej. Estantería A-2
    Categoria NVARCHAR(50) NULL,
    ImagenUrl NVARCHAR(2083) NULL -- Imagen de referencia del componente/repuesto
);

-- 7. Tabla Detalle de Repuestos Solicitados/Asignados por Mantenimiento
CREATE TABLE dbo.RepuestosMantenimiento (
    DetalleID INT IDENTITY(1,1) PRIMARY KEY,
    MantenimientoID INT NOT NULL,
    RepuestoID INT NOT NULL,
    Cantidad INT NOT NULL CHECK (Cantidad > 0),
    PrecioHistorico DECIMAL(10,2) NOT NULL, -- Resguarda precio de venta en fecha de reporte
    CONSTRAINT FK_Detalle_Mantenimientos FOREIGN KEY (MantenimientoID) 
        REFERENCES dbo.Mantenimientos(MantenimientoID) ON DELETE CASCADE,
    CONSTRAINT FK_Detalle_Repuestos FOREIGN KEY (RepuestoID) 
        REFERENCES dbo.RepuestosInventario(RepuestoID)
);

-- 8. Tabla de Fotos de Control de Patio (Evidencia Física de Recepción y Control de Calidad en 3NF)
CREATE TABLE dbo.VehiculoFotosControl (
    FotoID INT IDENTITY(1,1) PRIMARY KEY,
    VehiculoID INT NOT NULL,
    FotoUrl NVARCHAR(2083) NOT NULL,
    FechaCarga DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_FotosControl_Vehiculos FOREIGN KEY (VehiculoID) 
        REFERENCES dbo.Vehiculos(VehiculoID) ON DELETE CASCADE
);
`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-6">
      
      {/* Blueprint Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-3 font-display">
        <div>
          <h2 className="font-bold text-xl text-slate-900 flex items-center space-x-2">
            <Database className="h-5.5 w-5.5 text-emerald-600" />
            <span>Guía de Arquitectura, Base de Datos y BI</span>
          </h2>
          <p className="text-xs text-slate-500">Documento técnico interactivo y especificaciones relacionales para CQ Motors</p>
        </div>

        {/* Action micro-tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
          <button
            onClick={() => setActiveTab("database")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "database" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Esquema SQL (DDL)
          </button>
          <button
            onClick={() => setActiveTab("folders")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "folders" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Carpetas y Capas
          </button>
          <button
            onClick={() => setActiveTab("bi_pipeline")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "bi_pipeline" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            BI Pipeline (Power BI)
          </button>
          <button
            onClick={() => setActiveTab("libraries")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "libraries" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Librerías Sugeridas
          </button>
        </div>
      </div>

      {/* Render Active Area */}
      <div className="font-sans">
        {activeTab === "database" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <HardDrive className="h-4.5 w-4.5 text-slate-500" />
                  <span>Modelo de Datos Relacional de Tercera Forma Normal (3NF)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Previene la redundancia ligando Clientes con múltiples Vehículos e Hojas de Historial.
                </p>
              </div>

              <button
                onClick={handleCopySQL}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copiar DDL</span>
                  </>
                )}
              </button>
            </div>

            {/* SQL Terminal Viewer */}
            <div className="relative rounded-2xl bg-slate-900 text-slate-100 p-4 border border-slate-800 shadow-xl overflow-x-auto max-h-[380px] custom-scrollbar">
              <div className="absolute right-4 top-4 text-[10px] uppercase font-bold text-slate-500 font-mono">
                Transact-SQL
              </div>
              <pre className="text-[11px] font-mono leading-normal whitespace-pre text-left text-teal-400">
                <code>{sqlSchema}</code>
              </pre>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-105 rounded-xl text-xs text-blue-800 flex items-start space-x-2">
              <HelpCircle className="h-4.5 w-4.5 text-blue-600 mt-0.5 shrink-0" />
              <p className="leading-relaxed">
                <strong>Consejo de Producción:</strong> Agregue un índice no agrupado (<code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-bold">NONCLUSTERED INDEX</code>) sobre la columna <code className="font-mono font-bold">Placa</code> en <code className="font-mono">Vehiculos</code> para acelerar las búsquedas de recepción de taller a menos de 1 milisegundo.
              </p>
            </div>
          </div>
        )}

        {activeTab === "folders" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <FolderTree className="h-4.5 w-4.5 text-slate-500" />
                <span>Estructura de Carpetas Recomendada (Full-Stack PWA)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Arquitectura desacoplada modular con Backend de servicios REST y Frontend React SPA con capacidades Offline (Service Workers).
              </p>
            </div>

            {/* Visual Folder Tree Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 font-mono text-xs text-slate-800 leading-6 text-left">
                <span className="font-bold text-slate-900 block border-b pb-1 mb-2">📁 frontend-cqmotors/ (React + Vite)</span>
                <div>├── 📁 public/ <span className="text-slate-400 ml-2"># Iconos de PWA, manifest.json, sw.js</span></div>
                <div>├── 📁 src/</div>
                <div>│   ├── 📁 components/ <span className="text-slate-400 ml-2"># UI Widgets (Login, Dashboard...)</span></div>
                <div>│   ├── 📁 hooks/ <span className="text-slate-400 ml-2"># useOfflineQueries, useInventoryStore</span></div>
                <div>│   ├── 📁 store/ <span className="text-slate-400 ml-2"># Global State Manager (Zustand/Redux)</span></div>
                <div>│   ├── 📄 App.tsx <span className="text-slate-400 ml-2"># Enrutador principal</span></div>
                <div>│   ├── 📄 index.css <span className="text-slate-400 ml-2"># Tailwind Imports</span></div>
                <div>│   └── 📄 main.tsx <span className="text-slate-400 ml-2"># Registro del Service Worker</span></div>
                <div>├── 📄 vite.config.ts <span className="text-slate-400 ml-2"># Config de plugins y PWA offline asset compiler</span></div>
                <div>└── 📄 package.json <span className="text-slate-400 ml-2"># Dependencias</span></div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 font-mono text-xs text-slate-800 leading-6 text-left">
                <span className="font-bold text-slate-900 block border-b pb-1 mb-2">📁 backend-cqmotors/ (Node + TS + NestJS/Express)</span>
                <div>├── 📁 src/</div>
                <div>│   ├── 📁 modules/ <span className="text-slate-400 ml-2"># Módulos por dominio de negocio</span></div>
                <div>│   │   ├── 📁 vehicles/ <span className="text-slate-400 ml-2"># controller, service, entity</span></div>
                <div>│   │   ├── 📁 maintenances/ <span className="text-slate-400 ml-2"># check-lists, audits logs</span></div>
                <div>│   │   └── 📁 inventory/ <span className="text-slate-400 ml-2"># Bodega, stock counts</span></div>
                <div>│   ├── 📁 database/ <span className="text-slate-400 ml-2"># ORM, migraciones SQL Server (Prisma)</span></div>
                <div>│   ├── 📄 app.module.ts <span className="text-slate-400 ml-2"># Inyección de Dependencias central</span></div>
                <div>│   └── 📄 main.ts <span className="text-slate-400 ml-2"># Punto de arranque (Puerto 3000)</span></div>
                <div>├── 📄 drizzle.config.ts <span className="text-slate-400 ml-2"># Config y mapeo relacional</span></div>
                <div>└── 📄 package.json <span className="text-slate-400 ml-2"># Librerías de backend</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "bi_pipeline" && (
          <div className="space-y-4 text-left animate-in fade-in duration-350">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <BarChart4 className="h-4.5 w-4.5 text-slate-500" />
                <span>Estrategia de Inteligencia de Negocios y Conexión Power BI</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cómo aprovechar los mantenimientos registrados por el mecánico para generar análisis gerencial de alta rentabilidad.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-2">
                <div className="font-bold text-slate-900 flex items-center space-x-1">
                  <span className="p-1 bg-slate-200 text-slate-700 font-mono text-[10px] rounded">Paso 1</span>
                  <span>Estructura Star Schema</span>
                </div>
                <p className="text-slate-600 leading-normal">
                  Diseñe un Modelo Estrella en Power BI. Cree una tabla de Hechos (<code className="font-mono">Fact_Mantenimiento</code>) conteniendo costos de repuestos, mano de obra y horas-taller, ligada con Dimensiones de búsqueda (<code className="font-mono">Dim_Cliente</code>, <code className="font-mono">Dim_Vehiculo</code>, <code className="font-mono">Dim_Tiempo</code>).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-2">
                <div className="font-bold text-slate-900 flex items-center space-x-1">
                  <span className="p-1 bg-slate-200 text-slate-700 font-mono text-[10px] rounded">Paso 2</span>
                  <span>Métricas Analíticas DAX</span>
                </div>
                <p className="text-slate-600 leading-normal">
                  Programe métricas automáticas:
                  <code className="text-[10px] bg-slate-200 px-1 rounded block my-1 font-mono">MargenManoObra% = DIVIDE([SumaManoObra], [TotalVentas], 0)</code>
                  <code className="text-[10px] bg-slate-200 px-1 rounded block my-1 font-mono">SLA_Taller_Horas = AVERAGE([DuracionReparacion])</code>
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-2">
                <div className="font-bold text-slate-900 flex items-center space-x-1">
                  <span className="p-1 bg-slate-200 text-slate-700 font-mono text-[10px] rounded">Paso 3</span>
                  <span>Predicción de Demanda</span>
                </div>
                <p className="text-slate-600 leading-normal">
                  Utilice el conector directo nativo SQL Server de Power BI en modo Incremental. Configure Alertas Proactivas para que Gerencia identifique qué marca vehicular es la que más ingresos genera por mes de servicio técnico.
                </p>
              </div>
            </div>

            {/* PIPELINE LIVE CONTROLLER (Answers Duality feedback with operational code) */}
            <div className="bg-slate-950 border border-slate-800 text-slate-200 rounded-2xl p-4.5 mt-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400">
                    <Server className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">Pipeline de Replicación Relacional a SQL Server 3NF</h4>
                    <p className="text-[10px] text-slate-400">Sincronizador activo de documentos NoSQL Firestore hacia base estructurada relacional.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSyncToSQL}
                  disabled={syncing}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md shrink-0 hover:scale-[1.01] active:scale-95 cursor-pointer font-sans"
                >
                  {syncing ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  <span>{syncing ? "Replicando..." : "Sincronizar SQL Server"}</span>
                </button>
              </div>

              {syncError && (
                <div className="p-3 bg-rose-950/40 border border-rose-900 text-rose-300 text-xs rounded-xl font-sans">
                  {syncError}
                </div>
              )}

              {syncResult ? (
                <div className="space-y-3.5 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 text-center">
                    <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-mono">Clientes (Dim_C)</span>
                      <span className="text-base font-black font-mono text-emerald-400 block mt-0.5">{syncResult.stats.clientes}</span>
                    </div>
                    <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-mono">Vehículos (Dim_V)</span>
                      <span className="text-base font-black font-mono text-emerald-400 block mt-0.5">{syncResult.stats.vehiculos}</span>
                    </div>
                    <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-mono">Inventario (Dim_R)</span>
                      <span className="text-base font-black font-mono text-emerald-400 block mt-0.5">{syncResult.stats.repuestoInventario}</span>
                    </div>
                    <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-mono">Fact_Mantenim.</span>
                      <span className="text-base font-black font-mono text-emerald-400 block mt-0.5">{syncResult.stats.mantenimientos}</span>
                    </div>
                    <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-mono">Rel_Repuestos</span>
                      <span className="text-base font-black font-mono text-emerald-400 block mt-0.5">{syncResult.stats.repuestosNecesarios}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-300 font-sans">
                      <span className="font-bold flex items-center gap-1">
                        <Terminal className="h-3.5 w-3.5 text-emerald-500" />
                        Script SQL de Replicación Transaccional (Líneas SQL generadas: {syncResult.totalStatements})
                      </span>
                      <span className="font-mono text-slate-500 text-[10px]">Sincronización: exitosa</span>
                    </div>
                    <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto max-h-40 p-2.5 bg-slate-950 rounded-lg leading-normal select-all">
                      {syncResult.queries.join("\n")}
                      {syncResult.totalStatements > syncResult.queries.length && "\n-- ... [Líneas restantes omitidas de la previsualización del Buffer] ..."}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-5 text-center text-slate-400 space-y-2 font-sans">
                  <HardDrive className="h-8 w-8 text-slate-600 animate-pulse" />
                  <div>
                    <p className="text-xs font-bold text-slate-300">Esquema en espera de Sincronización</p>
                    <p className="text-[10px] text-slate-500 font-medium">Haz clic en el botón superior para realizar un ETL en caliente de las colecciones activas.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "libraries" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <GitFork className="h-4.5 w-4.5 text-slate-500" />
                <span>Recomendación de Librerías del Ecosistema Productivo</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Herramientas probadas en entornos empresariales con alto volumen de carga de datos para acelerar el desarrollo del taller.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-slate-200/70 rounded-xl space-y-1.5 text-left">
                <span className="font-bold text-xs text-slate-900 block">📊 Recharts o d3.js</span>
                <span className="text-xs text-slate-500 block"><strong>Propósito:</strong> Gráficos de Telemetría analíticos.</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Permite pintar tendencias de facturación del taller mensual, carga laboral por operario técnico e indicadores circulares de stock en tiempo real de forma ultra-ligera y con animaciones CSS fluidas.
                </p>
              </div>

              <div className="p-4 border border-slate-200/70 rounded-xl space-y-1.5 text-left">
                <span className="font-bold text-xs text-slate-900 block">⚡ TanStack Table / ag-grid-react</span>
                <span className="text-xs text-slate-500 block"><strong>Propósito:</strong> Tablas dinámicas administrativas.</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Permite a Gerencia ordenar miles de registros, exportar reportes en formato Excel/CSV, paginar resultados del inventario o agrupar por taller mecánico al instante con menos de 10 líneas de código.
                </p>
              </div>

              <div className="p-4 border border-slate-200/70 rounded-xl space-y-1.5 text-left">
                <span className="font-bold text-xs text-slate-900 block">🛠️ Prisma ORM / Drizzle ORM</span>
                <span className="text-xs text-slate-500 block"><strong>Propósito:</strong> Mapeo rápido de Base de Datos.</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Establecen esquemas auto-migrables con soporte nativo de TypeScript para que insertar ingresos vehiculares, buscar placas comprometidas y liquidar facturas no dependa de sentencias de texto propenso a inyecciones.
                </p>
              </div>

              <div className="p-4 border border-slate-200/70 rounded-xl space-y-1.5 text-left">
                <span className="font-bold text-xs text-slate-900 block">📩 Twilio API o WhatsApp Cloud API</span>
                <span className="text-xs text-slate-500 block"><strong>Propósito:</strong> Recordatorios Automáticos de Próxima Cita.</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Una vez que el odómetro calcula que al vehículo le corresponde el cambio trimestral, dispara un webhook seguro para notificar directamente al teléfono del cliente agendándolo de forma automática.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
