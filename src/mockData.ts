import { Vehiculo, Mantenimiento, RepuestoInventario, ActividadReciente, UserRole } from "./types";

export const INITIAL_INVENTORY: RepuestoInventario[] = [
  {
    id: "rep-1",
    codigo: "AC-10W40",
    nombre: "Aceite Sintético Mobil 10W-40 (Galón)",
    stock: 14,
    stockMinimo: 5,
    precioVenta: 45.0,
    costoCompra: 30.0,
    ubicacion: "Estantería A-2",
    categoria: "Lubricantes",
    imagenUrl: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=400&auto=format&fit=crop"
  },
  {
    id: "rep-2",
    codigo: "FILT-O1",
    nombre: "Filtro de Aceite Original Toyota/Suzuki",
    stock: 2, // Low stock warning!
    stockMinimo: 6,
    precioVenta: 12.5,
    costoCompra: 7.50,
    ubicacion: "Estantería B-1",
    categoria: "Filtros",
    imagenUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=400&auto=format&fit=crop"
  },
  {
    id: "rep-3",
    codigo: "PAST-F1",
    nombre: "Pastillas de Freno Delanteras (Cerámicas)",
    stock: 8,
    stockMinimo: 4,
    precioVenta: 55.0,
    costoCompra: 36.0,
    ubicacion: "Estantería C-3",
    categoria: "Frenos",
    imagenUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=400&auto=format&fit=crop"
  },
  {
    id: "rep-4",
    codigo: "BUJ-IRID",
    nombre: "Bujía de Iridio NGK (Unidad)",
    stock: 24,
    stockMinimo: 8,
    precioVenta: 8.5,
    costoCompra: 5.00,
    ubicacion: "Estantería A-5",
    categoria: "Encendido",
    imagenUrl: "https://images.unsplash.com/photo-1625047509168-a7026f36de04?q=80&w=400&auto=format&fit=crop"
  },
  {
    id: "rep-5",
    codigo: "FILT-A2",
    nombre: "Filtro de Aire Motor de Alto Flujo",
    stock: 3, // Low stock warning!
    stockMinimo: 5,
    precioVenta: 18.0,
    costoCompra: 11.00,
    ubicacion: "Estantería B-2",
    categoria: "Filtros",
    imagenUrl: "https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=400&auto=format&fit=crop"
  },
  {
    id: "rep-6",
    codigo: "AMORT-T1",
    nombre: "Amortiguador de Suspensión Trasera",
    stock: 4,
    stockMinimo: 2,
    precioVenta: 75.0,
    costoCompra: 48.00,
    ubicacion: "Pasillo D-Base",
    categoria: "Suspensión",
    imagenUrl: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=400&auto=format&fit=crop"
  },
  {
    id: "rep-7",
    codigo: "LIQ-FRE",
    nombre: "Líquido de Frenos DOT 4 Bosch (500ml)",
    stock: 12,
    stockMinimo: 4,
    precioVenta: 10.0,
    costoCompra: 6.00,
    ubicacion: "Estantería E-1",
    categoria: "Líquidos",
    imagenUrl: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?q=80&w=400&auto=format&fit=crop"
  }
];

export const INITIAL_VEHICLES: Vehiculo[] = [];

export const INITIAL_MAINTENANCE: Mantenimiento[] = [];

export const INITIAL_ACTIVITIES: ActividadReciente[] = [];
