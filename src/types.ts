export enum UserRole {
  Administrador = "Administrador",
  Mecanico = "Mecánico",
  Gerencia = "Gerente de Operaciones",
  Cliente = "Cliente",
}

export interface Usuario {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  avatarUrl?: string;
  clienteId?: string; // Linked client ID if role is Cliente
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  correo: string;
}

export interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  cliente: Cliente;
  fechaIngreso: string;
  estado: "Ingresado" | "En Proceso" | "Listo para Entrega" | "Entregado";
  kilometraje: number;
  tipoUso?: "Particular" | "Trabajo"; // Add vehicle usage classification
  nivelCombustible: number; // 0 to 100
  imagenUrl?: string;
  fotosCliente?: string[]; // Added: customer's uploaded vehicle photos
  inspeccionDanos?: {
    frontal?: string;
    posterior?: string;
    lateralIzquierdo?: string;
    lateralDerecho?: string;
    techo?: string;
    parabrisas?: string;
  }; // For the 360 degree visual inspection damage map
  prediccionesCRM?: {
    kilometrajeEstimado?: number;
    kmPorDia?: number;
    fechaEstimadaProxoServicio?: string;
    servicioRecomendado?: string;
  }; // For first-class predictive CRM mechanics odometer math
}

export interface TareaMantenimiento {
  id: string;
  nombre: string;
  completada: boolean;
  categoria: "Motor" | "Frenos" | "Transmision" | "Electrico" | "Preventivo" | "Otros" | "Lubricantes" | "Encendido";
  costoEstimado: number;
}

export interface RepuestoRequerido {
  id: string;
  repuestoId: string;
  nombre: string;
  cantidad: number;
  costoUnitario: number;
  costoCompraUnitario?: number; // purchase cost for CPr calculations
  surtido: boolean;
  imagenUrl?: string; // photo of the spare part to be changed
}

export interface Mantenimiento {
  id: string;
  vehiculoId: string;
  fechaRegistro: string;
  mecanicoAsignado: string;
  tareasRealizadas: TareaMantenimiento[];
  observaciones: string;
  repuestosNecesarios: RepuestoRequerido[];
  diagnosticoFuturo: string;
  recordatorioProximoMeses: number; // e.g. 3, 6, 12 months
  costoManoObra: number;
  totalCalculado: number;
  cpr?: number; // CPr = costoManoObra + sum(repuestosNecesarios.costoCompraUnitario * cantidad)
  fotos?: string[];
}

export interface RepuestoInventario {
  id: string;
  codigo: string;
  nombre: string;
  stock: number;
  stockMinimo: number;
  precioVenta: number;
  costoCompra: number; // Purchase cost
  ubicacion: string; // e.g., "Estantería A-4"
  categoria: string;
  imagenUrl?: string; // Added: spare part image URL
}

export interface ActividadReciente {
  id: string;
  tipo: "registro" | "estado_cambio" | "tarea_completada" | "bajo_stock" | "recordatorio";
  mensaje: string;
  fecha: string;
  usuario: string;
  avatar?: string;
  userId?: string;
}

export interface CitaMantenimiento {
  id: string;
  nombreCliente: string;
  telefonoCliente: string;
  correoCliente: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  tipoServicios: string[];
  fechaPreferencia: string;
  horaPreferencia: string;
  comentarios: string;
  fechaRegistro: string;
  estado: "Pendiente" | "Aprobada" | "Completada" | "Cancelada";
}

export interface EncuestaSatisfaccion {
  id: string;
  vehiculoId: string;
  mantenimientoId?: string;
  placa: string;
  clienteNombre: string;
  calificacionGeneral: number; // 1-5 stars
  calificacionAtencion: number; // 1-5 stars
  calificacionTecnica: number; // 1-5 stars
  comentario: string;
  volveria: boolean;
  fecha: string;
}

export interface LoyaltyState {
  clienteId: string;
  clienteNombre: string;
  puntosAcumulados: number; // Lifetime points (1 per dollar spent)
  puntosCanjeables: number; // Current points balance
  nivelClub: "Bronce" | "Plata" | "Oro" | "Platino";
}

export interface PremioCatalogo {
  id: string;
  nombre: string;
  puntosRequeridos: number;
  descripcion: string;
  categoria: string;
}

export interface CanjePremio {
  id: string;
  clienteId: string;
  clienteNombre: string;
  premioId: string;
  nombrePremio: string;
  puntosCanjeados: number;
  fecha: string;
  codigoUnico: string;
}

