import { Vehiculo, CitaMantenimiento, Mantenimiento } from "../types";

/**
 * Escapes HTML control characters to prevent Cross-Site Scripting (XSS).
 */
export function escapeHTML(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Sanitizes input string by stripping potential script tags and trimming whitespace.
 */
export function sanitizeInput(str: string, maxLength: number = 1000): string {
  if (typeof str !== "string") return "";
  const cleaned = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").trim();
  return escapeHTML(cleaned.slice(0, maxLength));
}

/**
 * Validates vehicle license plate format (e.g., ABC-1234 or ABC-123 or similar alphanumeric).
 */
export function isValidPlaca(placa: string): boolean {
  if (!placa || typeof placa !== "string") return false;
  const cleaned = placa.trim().toUpperCase();
  // Standard plate format validation (3-4 letters, dash or space optional, 3-4 numbers)
  return /^[A-Z0-9-]{3,10}$/.test(cleaned);
}

/**
 * Validates email format.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validates phone numbers (digits, +, -, spaces, length 7 to 15).
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== "string") return false;
  return /^[0-9+\s-]{7,15}$/.test(phone.trim());
}

/**
 * Validates non-negative numerical values (e.g. costs, mileage, stock).
 */
export function isNonNegativeNumber(val: unknown): boolean {
  return typeof val === "number" && !isNaN(val) && val >= 0;
}

/**
 * Validates Vehicle data integrity against "Dirty Dozen" Threat Vectors.
 */
export function validateVehicleInput(input: Partial<Vehiculo>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.placa || !isValidPlaca(input.placa)) {
    errors.push("La placa del vehículo no tiene un formato válido (ejemplo: ABC-1234).");
  }

  if (!input.marca || input.marca.trim().length === 0 || input.marca.length > 50) {
    errors.push("La marca es requerida y no debe superar 50 caracteres.");
  }

  if (!input.modelo || input.modelo.trim().length === 0 || input.modelo.length > 50) {
    errors.push("El modelo es requerido y no debe superar 50 caracteres.");
  }

  if (input.anio !== undefined && (typeof input.anio !== "number" || input.anio < 1900 || input.anio > 2100)) {
    errors.push("El año del vehículo no es válido.");
  }

  if (input.kilometraje !== undefined && !isNonNegativeNumber(input.kilometraje)) {
    errors.push("El kilometraje no puede ser negativo.");
  }

  if (input.cliente) {
    if (!input.cliente.nombre || input.cliente.nombre.trim().length === 0 || input.cliente.nombre.length > 100) {
      errors.push("El nombre del cliente es requerido (máximo 100 caracteres).");
    }
    if (input.cliente.correo && !isValidEmail(input.cliente.correo)) {
      errors.push("El correo electrónico del cliente no tiene un formato válido.");
    }
    if (input.cliente.telefono && !isValidPhone(input.cliente.telefono)) {
      errors.push("El teléfono del cliente no es válido.");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates Appointment data integrity.
 */
export function validateAppointmentInput(input: Partial<CitaMantenimiento>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.nombreCliente || input.nombreCliente.trim().length === 0 || input.nombreCliente.length > 100) {
    errors.push("El nombre del cliente es obligatorio (máx 100 caracteres).");
  }

  if (!input.correoCliente || !isValidEmail(input.correoCliente)) {
    errors.push("Se requiere un correo electrónico de cliente válido.");
  }

  if (!input.telefonoCliente || !isValidPhone(input.telefonoCliente)) {
    errors.push("Se requiere un teléfono de contacto válido.");
  }

  if (!input.placa || !isValidPlaca(input.placa)) {
    errors.push("La placa ingresada no es válida.");
  }

  if (input.kilometraje !== undefined && !isNonNegativeNumber(input.kilometraje)) {
    errors.push("El kilometraje ingresado no puede ser negativo.");
  }

  if (input.comentarios && input.comentarios.length > 2000) {
    errors.push("Los comentarios no pueden exceder 2000 caracteres.");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates Maintenance data against Negative Cost Poisoning.
 */
export function validateMaintenanceInput(input: Partial<Mantenimiento>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.vehiculoId || input.vehiculoId.trim().length === 0 || input.vehiculoId.length > 128) {
    errors.push("ID de vehículo no válido.");
  }

  if (input.costoManoObra !== undefined && !isNonNegativeNumber(input.costoManoObra)) {
    errors.push("El costo de mano de obra no puede ser negativo.");
  }

  if (input.totalCalculado !== undefined && !isNonNegativeNumber(input.totalCalculado)) {
    errors.push("El total calculado no puede ser negativo.");
  }

  if (input.observaciones && input.observaciones.length > 3000) {
    errors.push("Las observaciones no pueden exceder 3000 caracteres.");
  }

  return { valid: errors.length === 0, errors };
}
