# Especificación de Seguridad de Base de Datos (Capa 4: Cifrado en Reposo / Menor Privilegio)

Esta especificación documenta las políticas de menor privilegio y la matriz de mitigación de los 12 vectores del **"Dirty Dozen"** en Google Cloud Firestore para la aplicación **Taller-main** (`CQ Motors`).

---

## 1. Cifrado en Reposo y en Tránsito (AES-256 / TLS 1.3)

1. **Cifrado en Reposo (Encryption at Rest)**:
   - Google Cloud Firestore cifra automáticamente todos los datos en reposo a nivel de almacenamiento físico utilizando claves AES de 256 bits (AES-256) administradas por Google.
   - Las copias de seguridad e índices secundarios también están cifrados con claves rotadas periódicamente.

2. **Cifrado en Tránsito (Encryption in Transit)**:
   - Todas las conexiones entre clientes (Web / Mobile SDK) y los servidores de Firestore se transportan obligatoriamente sobre canales cifrados TLS 1.3 (con TLS 1.2 como fallback mínimo).

---

## 2. Matriz de Mitigación del "Dirty Dozen" (Threat Vectors)

| Vector | Ataque intentado | Mecanismo de Mitigación en `firestore.rules` | Estado |
| :--- | :--- | :--- | :--- |
| **Payload 1** | Modificación de Placa (`placa`) de vehículo | `isFieldUnchanged("placa")` en actualización de `/vehicles/{vehicleId}` | **MITIGADO** |
| **Payload 2** | Inyección de ID Masivo (Denial of Wallet) | `isValidDocId(docId)` (longitud `<= 128` caracteres y patrón alfanumérico) | **MITIGADO** |
| **Payload 3** | Falsificación de Timestamp del Servidor | Comparación con `request.time` e inmutabilidad de fecha de creación | **MITIGADO** |
| **Payload 4** | Registro de Mantenimiento Huérfano | Validante `exists(/databases/$(database)/documents/vehicles/$(vehiculoId))` | **MITIGADO** |
| **Payload 5** | Filtración No Autenticada de Citas | Denegación de consulta `read` si `request.auth == null` | **MITIGADO** |
| **Payload 6** | Precios / Costos Negativos en Mantenimiento | Regla `isNonNegative(costoManoObra)` y `isNonNegative(totalCalculado)` | **MITIGADO** |
| **Payload 7** | Manipulación de Estado Terminal de Cita | Candado de estado: Citas en `Completada` o `Cancelada` solo modificables por Admin | **MITIGADO** |
| **Payload 8** | Eliminación de Registros de Auditoría | Denegación explícita `allow delete: if false;` en colección `/activities` | **MITIGADO** |
| **Payload 9** | Inyección de Campos Sombra en Inventario | Validante `keys().hasOnly([...])` restringiendo el esquema exacto permitido | **MITIGADO** |
| **Payload 10**| Creación Anónima de Repuestos de Inventario | Restricción de escritura exclusiva para roles `isAdmin()` o `isManager()` | **MITIGADO** |
| **Payload 11**| Falsificación de Teléfono / Cliente | Restricción de modificación de perfil de cliente a usuarios autenticados / Admin | **MITIGADO** |
| **Payload 12**| Inyección de Caracteres Inválidos en IDs (`../admin`)| Expresión regular `docId.matches('^[a-zA-Z0-9_-]+$')` | **MITIGADO** |

---

## 3. Matriz de Roles y Permisos (RBAC)

| Colección | Cliente | Mecánico | Gerente de Operaciones | Administrador |
| :--- | :---: | :---: | :---: | :---: |
| `/vehicles` | Leer | Leer / Crear / Editar | Leer / Crear / Editar | Leer / Crear / Editar / Borrar |
| `/appointments` | Leer / Crear | Leer / Editar | Leer / Crear / Editar | Leer / Crear / Editar / Borrar |
| `/maintenances` | Leer | Leer / Crear / Editar | Leer / Crear / Editar | Leer / Crear / Editar / Borrar |
| `/inventory` | Leer | Leer | Leer / Crear / Editar | Leer / Crear / Editar / Borrar |
| `/activities` | Leer | Leer / Crear | Leer / Crear | Leer / Crear (Inmutable/Sin borrar) |
| `/users` | Leer propio | Leer propio | Leer propio | Leer / Crear / Editar / Borrar |
