# Security Specification & Threat Model for CQ Motors

This document specifies the security boundaries, data invariants, and vulnerability test vectors (the "Dirty Dozen" Payloads) designed to validate the protection of the CQ Motors Firestore backend.

---

## 1. Data Invariants

1. **Identity & Authorization**: Any write to a collection must be initiated by an authenticated user (`request.auth != null`).
2. **Vehicle Integrity**: A vehicle record cannot be updated to change its immutable fields (`id`, `placa`, `fechaIngreso`).
3. **Mantenimiento Relational Sync**: A maintenance record cannot exist without its corresponding `vehiculoId` pointing to an existing vehicle document in the `/vehicles` collection.
4. **Temporal Integrity**: Fields indicating record creation (`createdAt`, `fechaRegistro`) must be strictly immutable after creation and match `request.time`.
5. **Denial of Wallet Guarding**: All document IDs, names, plates, and comments must have strict length bounds (e.g., `id` length <= 128, description length <= 2000) to prevent resource exhaustion attacks.
6. **State Machine Locking**: Once a service or appointment reaches its terminal state (e.g., `estado == 'Completada'` or `estado == 'Cancelada'`), it cannot be updated except by authorized administrative action.
7. **Privilege Isolation**: Clients cannot self-assign roles or modify their system metadata.

---

## 2. The "Dirty Dozen" Payloads (Threat Vector Analysis)

Below are the 12 malicious payloads designed to test and breach our Firestore security boundary. All of these payloads must return `PERMISSION_DENIED` under the new security rules.

### Payload 1: Vehicle Plate Hijacking (Immutability Violation)
*   **Target Collection**: `/vehicles/{vehicleId}`
*   **Attack**: Trying to change the plate (`placa`) of an existing vehicle to spoof active records.
*   **Payload**:
    ```json
    {
      "id": "veh-1",
      "placa": "HACKED-99",
      "marca": "Toyota",
      "modelo": "Hilux",
      "anio": 2021,
      "kilometraje": 68000,
      "estado": "Ingresado"
    }
    ```

### Payload 2: Massive ID Resource Poisoning (Denial of Wallet)
*   **Target Collection**: `/vehicles/{extremelyLongJunkId}`
*   **Attack**: Attempting to write a document with a 20KB garbage string ID to pollute index size.
*   **Payload**:
    ```json
    { "id": "A_string_that_is_extremely_long_and_repeats_itself_to_exhaust_space_..." }
    ```

### Payload 3: Spoofed Server Timestamp
*   **Target Collection**: `/appointments/{appointmentId}`
*   **Attack**: Overriding `fechaRegistro` with a client-controlled future date to skip scheduling queues.
*   **Payload**:
    ```json
    {
      "id": "appt-test-1",
      "nombreCliente: "Atacante",
      "fechaRegistro": "2050-12-31T23:59:59Z"
    }
    ```

### Payload 4: Orphaned Maintenance Record (Relational Integrity Breach)
*   **Target Collection**: `/maintenances/{maintenanceId}`
*   **Attack**: Injecting a maintenance sheet pointing to a non-existent vehicle ID `null-vehicle-id`.
*   **Payload**:
    ```json
    {
      "id": "maint-fake-1",
      "vehiculoId": "non-existent-id-xyz",
      "mecanicoAsignado": "Atacante",
      "totalCalculado": 0
    }
    ```

### Payload 5: Unauthenticated Appointment Leak
*   **Target Collection**: `/appointments/{appointmentId}`
*   **Attack**: An unauthenticated user attempting to list all appointments to extract names and customer phone numbers.
*   **Operation**: `List` (Read query)
*   **Result**: Must fail with `PERMISSION_DENIED`.

### Payload 6: Negative Cost & Value Poisoning (Integrity Violation)
*   **Target Collection**: `/maintenances/{maintenanceId}`
*   **Attack**: Updating `costoManoObra` with a negative decimal value to create artificial billing credits.
*   **Payload**:
    ```json
    {
      "costoManoObra": -5000.0,
      "totalCalculado": -5000.0
    }
    ```

### Payload 7: Terminal State Manipulation
*   **Target Collection**: `/appointments/{appointmentId}`
*   **Attack**: Forcing an already `Completada` appointment back into a `Pendiente` status to re-trigger automations.
*   **Payload**:
    ```json
    {
      "estado": "Pendiente"
    }
    ```

### Payload 8: Direct Activity Log Tampering
*   **Target Collection**: `/activities/{activityId}`
*   **Attack**: Deleting logs of recent actions to cover up administrative manipulation.
*   **Operation**: `Delete`
*   **Result**: Must fail with `PERMISSION_DENIED`.

### Payload 9: Inventory Shadow Field Injection
*   **Target Collection**: `/inventory/{inventoryId}`
*   **Attack**: Injecting an unapproved field `"discountApplied": true` on a pricing object.
*   **Payload**:
    ```json
    {
      "id": "inv-1",
      "codigo": "FIL-01",
      "nombre": "Filtro Aceite",
      "stock": 10,
      "precioVenta": 5.99,
      "discountApplied": true
    }
    ```

### Payload 10: Anonymous Administrative Access
*   **Target Collection**: `/inventory`
*   **Attack**: Creating new inventory parts as an anonymous user without administrative role assignment.
*   **Operation**: `Create`
*   **Result**: Must fail with `PERMISSION_DENIED`.

### Payload 11: Customer Phone Spoofing
*   **Target Collection**: `/vehicles/{vehicleId}`
*   **Attack**: Overwriting client contact information with a malicious attacker's phone number to redirect SMS alerts.
*   **Payload**:
    ```json
    {
      "cliente": {
        "id": "cli-1",
        "nombre": "Carlos Quevedo",
        "telefono": "0990000000",
        "correo": "attacker@gmail.com"
      }
    }
    ```

### Payload 12: Invalid ID Characters (Injections)
*   **Target Collection**: `/vehicles/{vehicleId}`
*   **Attack**: Creating records where IDs contain path injection sequences (e.g., `../admin/profile`).
*   **Result**: Must fail with `PERMISSION_DENIED`.

---

## 3. The Security Verification Test Outline

A testing script validates that our Firestore rules actively reject all the specified "Dirty Dozen" vectors.

```typescript
// firestore.rules.test.ts
import { assertFails, assertSucceeds, initializeTestApp } from "@firebase/rules-unit-testing";

describe("CQ Motors Firestore Security Rules Test Suite", () => {
  it("rejects unauthenticated list operations", async () => {
    const db = initializeTestApp({ projectId: "cq-motors", auth: null }).firestore();
    await assertFails(db.collection("appointments").get());
  });

  it("rejects plate modification on existing vehicles", async () => {
    const db = initializeTestApp({ projectId: "cq-motors", auth: { uid: "user-123" } }).firestore();
    await assertFails(
      db.collection("vehicles").doc("veh-1").update({ placa: "HACKED-99" })
    );
  });
});
```
