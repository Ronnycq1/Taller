import React, { useState, useEffect } from "react";
import { 
  Vehiculo, 
  Mantenimiento, 
  TareaMantenimiento, 
  RepuestoRequerido, 
  RepuestoInventario, 
  UserRole 
} from "../types";
import { 
  Wrench, 
  CheckCircle, 
  Plus, 
  ShoppingBag, 
  AlertCircle, 
  Send, 
  ShieldAlert, 
  MessageSquare, 
  CalendarClock, 
  DollarSign, 
  Layout, 
  CheckSquare, 
  Clock, 
  Sparkles,
  ArrowLeft,
  ChevronRight,
  User,
  Activity,
  Camera,
  UploadCloud,
  Trash2,
  Save,
  History,
  FileText,
  Printer,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "./Toast";
import { getSmartPartsForVehicle } from "../utils/crmPredictive";

interface MaintenanceSheetProps {
  vehicle: Vehiculo;
  vehicleMaintenances: Mantenimiento[];
  inventory: RepuestoInventario[];
  userRole: UserRole;
  onGoBack: () => void;
  onUpdateMaintenance: (m: Mantenimiento) => void;
  onUpdateVehicleStatus: (vehicleId: string, status: "Ingresado" | "En Proceso" | "Listo para Entrega" | "Entregado") => void;
  onUpdateVehiclePhotos?: (vehicleId: string, photos: string[]) => void;
  onUpdateVehicleCoverImage?: (vehicleId: string, coverUrl: string | null) => void;
  onDeleteVehicle?: (vehicleId: string) => void;
}

export default function MaintenanceSheet({
  vehicle,
  vehicleMaintenances,
  inventory,
  userRole,
  onGoBack,
  onUpdateMaintenance,
  onUpdateVehicleStatus,
  onUpdateVehiclePhotos,
  onUpdateVehicleCoverImage,
  onDeleteVehicle,
}: MaintenanceSheetProps) {
  // Selected maintenance log state inside the bitácora
  const [selectedMaintId, setSelectedMaintId] = useState<string>("");
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Initialize local states with safely loaded maintenance logs or fallback
  const fallbackMaint: Mantenimiento = {
    id: `maint-new-${vehicle.id}`,
    vehiculoId: vehicle.id,
    fechaRegistro: new Date().toISOString(),
    mecanicoAsignado: userRole === UserRole.Mecanico ? "Tec. David Mendoza" : "Ing. Washington Cadena",
    tareasRealizadas: [
      { id: "t-init-1", nombre: "Inspección Multipuntos Inicial", completada: true, categoria: "Preventivo", costoEstimado: 20.0 },
      { id: "t-init-2", nombre: "Revisión básica de niveles", completada: false, categoria: "Lubricantes", costoEstimado: 15.0 },
      { id: "t-init-3", nombre: "Ajuste e inspección de frenos", completada: false, categoria: "Frenos", costoEstimado: 30.0 }
    ],
    observaciones: "",
    repuestosNecesarios: [],
    diagnosticoFuturo: "",
    recordatorioProximoMeses: 3,
    costoManoObra: 40.0,
    totalCalculado: 105.0
  };

  // Find or calculate the active selected sheet
  const sortedMaints = [...vehicleMaintenances].sort((a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime());

  // Set the default selection to the most recently registered sheet
  const preferredMaintId = selectedMaintId || (sortedMaints.length > 0 ? sortedMaints[0].id : "");
  const activeMaint = sortedMaints.find(m => m.id === preferredMaintId) || sortedMaints[0] || fallbackMaint;

  // Local state managers
  const [tareas, setTareas] = useState<TareaMantenimiento[]>(activeMaint.tareasRealizadas);
  const [observaciones, setObservaciones] = useState(activeMaint.observaciones);
  const [diagnostico, setDiagnostico] = useState(activeMaint.diagnosticoFuturo);
  const [recordatorioMeses, setRecordatorioMeses] = useState(activeMaint.recordatorioProximoMeses);
  const [costoManoObra, setCostoManoObra] = useState(activeMaint.costoManoObra);
  const [repuestosExp, setRepuestosExp] = useState<RepuestoRequerido[]>(activeMaint.repuestosNecesarios);

  // Sync state whenever the selected active maintenance or vehicle updates
  useEffect(() => {
    setTareas(activeMaint.tareasRealizadas);
    setObservaciones(activeMaint.observaciones);
    setDiagnostico(activeMaint.diagnosticoFuturo);
    setRecordatorioMeses(activeMaint.recordatorioProximoMeses);
    setCostoManoObra(activeMaint.costoManoObra);
    setRepuestosExp(activeMaint.repuestosNecesarios);
  }, [activeMaint.id, vehicle.id]);

  // New task utility
  const [nuevaTareaText, setNuevaTareaText] = useState("");
  const [nuevaTareaCat, setNuevaTareaCat] = useState<TareaMantenimiento["categoria"]>("Preventivo");
  const [nuevaTareaPrecioStr, setNuevaTareaPrecioStr] = useState<string>("15");
  const [tempCostoInput, setTempCostoInput] = useState<Record<string, string>>({});

  // New spare parts utility
  const [selectedRepuestoId, setSelectedRepuestoId] = useState("");
  const [selectedRepuestoCant, setSelectedRepuestoCant] = useState(1);
  const [dispenseError, setDispenseError] = useState("");

  // Toast notification alert simulator
  const [simulationToast, setSimulationToast] = useState("");

  // Photo gallery local controllers
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  const vehiclePhotoPresets = [
    "https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507133750040-4a8f57021571?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=600&auto=format&fit=crop"
  ];

  const handleAddPhoto = (urlToUse: string) => {
    if (!urlToUse.trim()) return;
    const currentPhotos = activeMaint.fotos || [];
    const nextPhotos = [...currentPhotos, urlToUse.trim()];
    onUpdateMaintenance({
      ...activeMaint,
      fotos: nextPhotos
    });
    setNewPhotoUrl("");
    setShowUrlInput(false);
    triggerNotification("¡Imagen de control cargada con éxito!");
  };

  const handleSimulateCamera = () => {
    const currentPhotos = activeMaint.fotos || [];
    const unusedPresets = vehiclePhotoPresets.filter(p => !currentPhotos.includes(p));
    const finalUrl = unusedPresets.length > 0 
      ? unusedPresets[Math.floor(Math.random() * unusedPresets.length)]
      : vehiclePhotoPresets[Math.floor(Math.random() * vehiclePhotoPresets.length)];
    
    handleAddPhoto(finalUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerNotification("Procesando y optimizando imagen...");

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          handleAddPhoto(dataUrl);
        } else {
          if (typeof event.target?.result === "string") {
            handleAddPhoto(event.target.result);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      triggerNotification("⚠️ Error al leer el archivo.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDeletePhoto = (urlToRemove: string) => {
    const currentPhotos = activeMaint.fotos || [];
    const nextPhotos = currentPhotos.filter(p => p !== urlToRemove);
    onUpdateMaintenance({
      ...activeMaint,
      fotos: nextPhotos
    });
    triggerNotification("Evidencia fotográfica removida.");
  };

  const handleDeleteCoverPhoto = () => {
    onUpdateVehicleCoverImage?.(vehicle.id, null);
    triggerNotification("📸 Foto de ingreso original eliminada con éxito.");
  };

  const handleAddNewMaintenanceRecord = () => {
    const newMaintId = `maint-${Date.now()}`;
    const newMaint: Mantenimiento = {
      id: newMaintId,
      vehiculoId: vehicle.id,
      fechaRegistro: new Date().toISOString(),
      mecanicoAsignado: userRole === UserRole.Mecanico ? "Tec. David Mendoza" : "Ing. Washington Cadena",
      tareasRealizadas: [
        { id: `t-${Date.now()}-1`, nombre: "Inspección General Multipuntos", completada: true, categoria: "Preventivo", costoEstimado: 25.0 }
      ],
      observaciones: "",
      repuestosNecesarios: [],
      diagnosticoFuturo: "",
      recordatorioProximoMeses: 3,
      costoManoObra: 45.0,
      totalCalculado: 70.0
    };
    onUpdateMaintenance(newMaint);
    setSelectedMaintId(newMaintId);
    triggerNotification("➕ ¡Nueva Hoja de Mantenimiento incorporada a la bitácora!");
  };

  // Calculating overall progress
  const completedCount = tareas.filter(t => t.completada).length;
  const progressPercent = tareas.length ? Math.round((completedCount / tareas.length) * 100) : 0;

  // Calculate spare parts cost sum
  const totalRepuestosCosto = repuestosExp.reduce((acc, r) => acc + (r.costoUnitario * r.cantidad), 0);
  const totalFinalCompleto = totalRepuestosCosto + costoManoObra;

  // Save updates helper
  const handlePersistChanges = (
    updatedTareas = tareas, 
    updatedParts = repuestosExp, 
    updatedManoObra = costoManoObra,
    overrideObservaciones?: string,
    overrideDiagnostico?: string,
    overrideRecordatorioMeses?: number
  ) => {
    const partsSum = updatedParts.reduce((acc, r) => acc + (r.costoUnitario * r.cantidad), 0);
    const calculatedTotal = partsSum + updatedManoObra;

    // Costo Primo (CPr) = direct labor + sum of raw materials purchase cost
    const partsPurchaseSum = updatedParts.reduce((acc, r) => acc + ((r.costoCompraUnitario || r.costoUnitario * 0.7) * r.cantidad), 0);
    const calculatedCPr = updatedManoObra + partsPurchaseSum;

    onUpdateMaintenance({
      ...activeMaint,
      tareasRealizadas: updatedTareas,
      observaciones: overrideObservaciones !== undefined ? overrideObservaciones : observaciones,
      diagnosticoFuturo: overrideDiagnostico !== undefined ? overrideDiagnostico : diagnostico,
      repuestosNecesarios: updatedParts,
      recordatorioProximoMeses: overrideRecordatorioMeses !== undefined ? overrideRecordatorioMeses : recordatorioMeses,
      costoManoObra: updatedManoObra,
      totalCalculado: calculatedTotal,
      cpr: calculatedCPr
    });
  };

  // Toggle tasks check
  const handleToggleTarea = (id: string) => {
    const nextTareas = tareas.map(t => t.id === id ? { ...t, completada: !t.completada } : t);
    setTareas(nextTareas);
    handlePersistChanges(nextTareas);
  };

  // Delete checklist task (only for Admin and Gerente)
  const handleDeleteTarea = (id: string) => {
    const nextTareas = tareas.filter(t => t.id !== id);
    setTareas(nextTareas);
    handlePersistChanges(nextTareas);
    triggerNotification("Ítem eliminado del checklist.");
  };

  // Add custom manual task
  const handleAddCustomTarea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaTareaText.trim()) return;

    const parsedPrice = parseFloat(nuevaTareaPrecioStr) || 0;
    const newTask: TareaMantenimiento = {
      id: `task-custom-${Date.now()}`,
      nombre: nuevaTareaText.trim(),
      completada: false,
      categoria: nuevaTareaCat,
      costoEstimado: (userRole === UserRole.Administrador || userRole === UserRole.Gerencia) ? parsedPrice : (nuevaTareaCat === "Motor" ? 45 : nuevaTareaCat === "Frenos" ? 25 : 15)
    };

    const nextTareas = [...tareas, newTask];
    setTareas(nextTareas);
    setNuevaTareaText("");
    setNuevaTareaPrecioStr("15"); // Reset custom task price to default
    handlePersistChanges(nextTareas);
    triggerNotification(`Nueva tarea "${newTask.nombre}" añadida a la hoja de ruta.`);
  };

  // Link spare parts from inventory
  const handleRequestSparePart = (e: React.FormEvent) => {
    e.preventDefault();
    setDispenseError("");

    if (!selectedRepuestoId) {
      setDispenseError("Seleccione un componente válido.");
      return;
    }

    const itemInventario = inventory.find(i => i.id === selectedRepuestoId);
    if (!itemInventario) return;

    // Check inventory stock safety
    if (itemInventario.stock < selectedRepuestoCant) {
      setDispenseError(`Reserva insuficiente en Almacén. Quedan solo ${itemInventario.stock} unidades de ${itemInventario.nombre}.`);
      return;
    }

    // Check if parts are already in repair worksheet list
    const existingIndex = repuestosExp.findIndex(r => r.repuestoId === selectedRepuestoId);
    let nextParts = [...repuestosExp];

    if (existingIndex > -1) {
      // increase count
      nextParts[existingIndex].cantidad += selectedRepuestoCant;
    } else {
      nextParts.push({
        id: `req-part-${Date.now()}`,
        repuestoId: selectedRepuestoId,
        nombre: itemInventario.nombre,
        cantidad: selectedRepuestoCant,
        costoUnitario: itemInventario.precioVenta,
        costoCompraUnitario: itemInventario.costoCompra || (itemInventario.precioVenta * 0.7),
        surtido: true // Pre-approved in demo
      });
    }

    // Deduct stock from the mock state (this runs in App.tsx dynamically under handleUpdateMaintenance)
    setRepuestosExp(nextParts);
    setSelectedRepuestoId("");
    setSelectedRepuestoCant(1);
    
    // Deduct stock immediately
    itemInventario.stock -= selectedRepuestoCant;

    handlePersistChanges(tareas, nextParts);
    triggerNotification(`Despachado: ${selectedRepuestoCant} unidad(es) de "${itemInventario.nombre}" asignadas a la Orden.`);
  };

  // COTIZADOR VELOZ - INTERACTION HANDLER (7th of 8 improvements)
  const handleQuickAddRecommendedPart = (partId: string) => {
    const itemInventario = inventory.find(i => i.id === partId);
    if (!itemInventario) return;

    if (itemInventario.stock < 1) {
      showWarning("Stock Insuficiente", `No quedan existencias de ${itemInventario.nombre} en perchas.`);
      return;
    }

    const existingIndex = repuestosExp.findIndex(r => r.repuestoId === partId);
    let nextParts = [...repuestosExp];

    if (existingIndex > -1) {
      nextParts[existingIndex].cantidad += 1;
    } else {
      nextParts.push({
        id: `req-part-${Date.now()}`,
        repuestoId: partId,
        nombre: itemInventario.nombre,
        cantidad: 1,
        costoUnitario: itemInventario.precioVenta,
        costoCompraUnitario: itemInventario.costoCompra || (itemInventario.precioVenta * 0.7),
        surtido: true
      });
    }

    setRepuestosExp(nextParts);
    itemInventario.stock -= 1;
    handlePersistChanges(tareas, nextParts);
    showSuccess("Añadido Veloz", `Se integró 1 u. de "${itemInventario.nombre}" de forma directa.`);
  };

  // Trigger simulated reminder
  const handleTriggerSimulatedReminder = (type: "whatsapp" | "email") => {
    const formattedMes = recordatorioMeses === 3 ? "Septiembre 2026" : recordatorioMeses === 6 ? "Diciembre 2026" : "Junio 2027";
    const msg = type === "whatsapp" 
      ? `CQ Motors Alert: Enviando plantilla de WhatsApp a ${vehicle.cliente.nombre} (${vehicle.cliente.telefono}) agendando evaluación técnica obligatoria para ${formattedMes}.`
      : `CQ Motors Correo: Remitido reporte PDF completo a ${vehicle.cliente.correo} sugiriendo preventivo para ${formattedMes}.`;
    
    triggerNotification(msg);
  };

  const triggerNotification = (msg: string) => {
    if (msg.includes("correctamente") || msg.includes("Satis") || msg.includes("¡") || msg.includes("Despachado")) {
      showSuccess("Operación Exitosa", msg);
    } else {
      showInfo("Información Técnica", msg);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast alert simulation feedback banner */}
      <AnimatePresence>
        {simulationToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 max-w-md bg-emerald-950 text-emerald-100 p-4 rounded-xl border border-emerald-500 shadow-2xl flex items-start space-x-3"
          >
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-white block">Servicio Integrado de Red</span>
              <span className="leading-relaxed block mt-0.5">{simulationToast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sheet Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onGoBack}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-700"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <span className="font-mono text-[10px] bg-emerald-500 text-black px-2 py-0.5 rounded font-bold uppercase tracking-wider block w-max mb-1">
              {vehicle.placa}
            </span>
            <h2 className="font-display font-medium text-lg text-white">Hoja de Ruta del Vehículo</h2>
            <p className="text-[11px] text-slate-400">
              Operador: {activeMaint.mecanicoAsignado} • Registrado el {new Date(activeMaint.fechaRegistro).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Change status combo & Save Button */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <span className="text-xs text-slate-400 font-mono hidden md:inline">Estado Ficha:</span>
          <select
            value={vehicle.estado}
            disabled={userRole === UserRole.Mecanico || userRole === UserRole.Cliente}
            onChange={(e) => onUpdateVehicleStatus(vehicle.id, e.target.value as any)}
            className="bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700/60 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="Ingresado">Ingresado (Admisión)</option>
            <option value="En Proceso">En Mantenimiento</option>
            <option value="Listo para Entrega">Listo para Entrega</option>
            <option value="Entregado">Entregado</option>
          </select>

          {userRole !== UserRole.Cliente && onDeleteVehicle && (
            <button
              onClick={() => {
                if (confirm(`¿Está seguro de eliminar esta hoja de control de patio para el vehículo ${vehicle.placa}? Esta acción borrará la ficha, historial y no se puede deshacer.`)) {
                  onDeleteVehicle(vehicle.id);
                  onGoBack();
                }
              }}
              className="px-3.5 py-2 bg-rose-900/60 hover:bg-rose-700 text-rose-100 hover:text-white border border-rose-800/80 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
              title="Eliminar hoja de control de patio"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>
          )}

          {userRole !== UserRole.Cliente && (
            <button
              onClick={() => {
                handlePersistChanges();
                triggerNotification("💾 ¡Informe y Hoja de Mantenimiento guardada!");
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-md border border-emerald-500 hover:scale-[1.02]"
              title="Guardar cambios de la hoja"
            >
              <Save className="h-4 w-4 text-emerald-100" />
              <span className="hidden sm:inline">Guardar Hoja</span>
            </button>
          )}
        </div>
      </div>

      {/* BITÁCORA / HISTORIAL DE MANTENIMIENTOS DEL VEHÍCULO */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <History className="h-5 w-5 shrink-0" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base tracking-tight">Expediente & Bitácora Automotriz</h3>
              <p className="text-xs text-slate-400">Historial técnico multipuntos y registros cronológicos de servicio</p>
            </div>
          </div>

          {userRole !== UserRole.Cliente && (
            <button
              type="button"
              onClick={handleAddNewMaintenanceRecord}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-md hover:shadow-emerald-500/10 cursor-pointer active:scale-95"
            >
              <Plus className="h-4 w-4 shrink-0 stroke-[2.5]" />
              <span>Añadir Nueva Ficha Técnica</span>
            </button>
          )}
        </div>

        {/* Chronological Grid of Maintenance Sessions / Timeline */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {sortedMaints.length === 0 ? (
            <div className="text-xs text-slate-400 italic py-2">
              No hay reportes de mantenimiento guardados anteriormente. Haga click en el botón superior para crear el primero.
            </div>
          ) : (
            sortedMaints.map((maintRecord, index) => {
              const isSelected = maintRecord.id === activeMaint.id;
              const completedTasksCount = maintRecord.tareasRealizadas ? maintRecord.tareasRealizadas.filter(t => t.completada).length : 0;
              const totalTasksCount = maintRecord.tareasRealizadas ? maintRecord.tareasRealizadas.length : 0;
              const progressPct = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
              const recordDate = new Date(maintRecord.fechaRegistro).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric"
              });

              return (
                <button
                  key={maintRecord.id}
                  type="button"
                  onClick={() => setSelectedMaintId(maintRecord.id)}
                  className={`px-5 py-4 rounded-xl border text-left transition-all shrink-0 cursor-pointer flex flex-col space-y-2 relative overflow-hidden min-w-[195px] ${
                    isSelected
                      ? "bg-slate-800 border-emerald-500 shadow-xl ring-2 ring-emerald-500/20"
                      : "bg-slate-900 border-slate-800 hover:bg-slate-850 hover:border-slate-700"
                  }`}
                >
                  {/* Decorative Progress indicator left side-accent */}
                  <div 
                    className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${
                      isSelected ? "bg-emerald-500" : "bg-slate-700"
                    }`} 
                  />

                  <div className="flex items-center justify-between space-x-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      Reporte #{sortedMaints.length - index}
                    </span>
                    {isSelected ? (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                    )}
                  </div>

                  <div className="font-display font-bold text-sm text-white">
                    {recordDate}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>Progreso:</span>
                      <span className="font-mono font-bold text-slate-300">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          progressPct === 100 ? "bg-emerald-500" : "bg-amber-500"
                        }`} 
                        style={{ width: `${progressPct}%` }} 
                      />
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between font-mono text-[9.5px]">
                    <span className="text-slate-400 truncate max-w-[100px]" title={maintRecord.mecanicoAsignado}>
                      👤 {maintRecord.mecanicoAsignado.split(" ").slice(-2).join(" ")}
                    </span>
                    {userRole !== UserRole.Cliente && (
                      <span className="text-emerald-400 font-bold">
                        ${maintRecord.totalCalculado.toFixed(2)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content Layout Grid */}
      {selectedMaintId ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in slide-in-from-top-1 duration-300">
          {/* LEFT COLUMN: Vehicle profile & Executed Checklist (7/12 Cols) */}
          <div className="lg:col-span-7 space-y-5">
          
          {/* Quick Vehicle Stats Display */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Vehículo</span>
              <span className="text-sm font-bold text-slate-900 block">{vehicle.marca}</span>
              <span className="text-xs text-slate-500 block truncate">{vehicle.modelo} ({vehicle.anio})</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Odómetro</span>
              <span className="text-sm font-bold text-slate-900 block">{vehicle.kilometraje.toLocaleString()} km</span>
              <span className="text-xs text-slate-400 block font-mono">Registro inicial</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Cliente Principal</span>
              <span className="text-sm font-bold text-slate-900 block truncate">{vehicle.cliente.nombre}</span>
              <span className="text-xs text-slate-500 block underline font-mono">{vehicle.cliente.telefono}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Progreso Tareas</span>
              <span className="text-sm font-bold text-emerald-600 block">{progressPercent}% completado</span>
              <div className="w-full bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>

          {/* CHECKLIST: MANTENIMIENTO REALIZADO */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 font-display">
              <div className="flex items-center space-x-2">
                <CheckSquare className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Checklist de Tareas Realizadas</h3>
              </div>
              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">
                {completedCount} de {tareas.length} listas
              </span>
            </div>

            {/* List with clean action triggers */}
            <div className="space-y-2.5">
              {tareas.map((t) => (
                <div 
                  key={t.id}
                  onClick={() => {
                    if (userRole === UserRole.Cliente) return;
                    handleToggleTarea(t.id);
                  }}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                    userRole === UserRole.Cliente ? "cursor-default" : "cursor-pointer hover:bg-slate-50"
                  } ${
                    t.completada 
                      ? "bg-emerald-50/40 border-emerald-100 shadow-sm-flat" 
                      : "bg-slate-50/50 border-slate-200/60"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={t.completada}
                      disabled={userRole === UserRole.Cliente}
                      onChange={() => {}} // handled by div click
                      className={`h-4.5 w-4.5 text-emerald-600 border-slate-300 focus:ring-emerald-500 rounded accent-emerald-500 ${
                        userRole === UserRole.Cliente ? "cursor-default" : "cursor-pointer"
                      }`}
                    />
                    <div>
                      <span className={`text-xs font-bold transition-all ${
                        t.completada ? "text-slate-500 line-through" : "text-slate-900"
                      }`}>
                        {t.nombre}
                      </span>
                      <span className="text-[10px] bg-slate-150 text-slate-600 rounded px-1.5 py-0.5 ml-2 font-semibold">
                        {t.categoria}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2.5">
                    {(userRole === UserRole.Administrador || userRole === UserRole.Gerencia) ? (
                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={tempCostoInput[t.id] !== undefined ? tempCostoInput[t.id] : (t.costoEstimado === 0 ? "" : String(t.costoEstimado))}
                          onChange={(e) => {
                            const rawVal = e.target.value;
                            setTempCostoInput(prev => ({ ...prev, [t.id]: rawVal }));
                            const parsed = parseFloat(rawVal) || 0;
                            const nextTareas = tareas.map(item => item.id === t.id ? { ...item, costoEstimado: parsed } : item);
                            setTareas(nextTareas);
                            handlePersistChanges(nextTareas);
                          }}
                          onBlur={() => {
                            setTempCostoInput(prev => {
                              const copy = { ...prev };
                              delete copy[t.id];
                              return copy;
                            });
                          }}
                          className="w-16 px-1.5 py-0.5 text-xs text-right font-mono font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded border border-transparent focus:outline-none"
                          title="Definir costo para esta tarea"
                        />
                      </div>
                    ) : (
                      userRole !== UserRole.Cliente ? (
                        <span className="text-xs font-mono font-bold text-slate-500">
                          Est. ${t.costoEstimado.toFixed(2)}
                        </span>
                      ) : null
                    )}
                    {(userRole === UserRole.Administrador || userRole === UserRole.Gerencia) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTarea(t.id);
                        }}
                        className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors cursor-pointer group"
                        title="Eliminar ítem"
                      >
                        <Trash2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Form to insert custom item checklist */}
            {userRole !== UserRole.Cliente && (
              <form onSubmit={handleAddCustomTarea} className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={nuevaTareaText}
                  onChange={(e) => setNuevaTareaText(e.target.value)}
                  placeholder="Ej. Sincronizar cilindros, sopletear bujías..."
                  className="flex-1 min-w-[200px] px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs font-medium"
                />

                {(userRole === UserRole.Administrador || userRole === UserRole.Gerencia) && (
                  <div className="flex items-center space-x-1 border rounded-xl bg-slate-50 border-slate-200 px-2.5 py-1.5" title="Asignar precio inicial a la nueva tarea">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={nuevaTareaPrecioStr === "0" ? "" : nuevaTareaPrecioStr}
                      onChange={(e) => setNuevaTareaPrecioStr(e.target.value)}
                      className="w-14 bg-transparent text-xs font-bold font-mono focus:outline-none text-slate-800 text-right"
                      placeholder="Precio"
                    />
                  </div>
                )}

                <select
                  value={nuevaTareaCat}
                  onChange={(e) => setNuevaTareaCat(e.target.value as any)}
                  className="bg-slate-100 text-slate-700 text-xs py-2 px-2 border rounded-xl focus:outline-none cursor-pointer border-slate-200 font-bold"
                >
                  <option value="Preventivo">Preventivo</option>
                  <option value="Frenos">Frenos</option>
                  <option value="Motor">Motor</option>
                  <option value="Lubricantes">Lubricantes</option>
                  <option value="Transmision">Transmisión</option>
                </select>
                <button
                  type="submit"
                  className="p-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>

          {/* HISTORICAL OBSERVATIONS & COMMENTS TEXTAREA (MANTENIMIENTO POR REALIZAR) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 font-display">
              <MessageSquare className="h-5 w-5 text-slate-600" />
              <h3 className="font-bold text-slate-900 text-base">Mantenimientos Pendientes y Observaciones</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Observación Técnica Actual (Texto Enriquecido) *</label>
                <textarea
                  value={observaciones}
                  disabled={userRole === UserRole.Cliente}
                  onChange={(e) => {
                    const val = e.target.value;
                    setObservaciones(val);
                    handlePersistChanges(tareas, repuestosExp, costoManoObra, val);
                  }}
                  rows={3}
                  placeholder={userRole === UserRole.Cliente ? "Sin observaciones técnicas registradas todavía." : "Detalle ruidos, estado de correas, mangueras, fugas de lubricante o advertencias..."}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs font-medium leading-relaxed disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Plan de Reparaciones Futuras y Diagnósticos pendientes *</label>
                <textarea
                  value={diagnostico}
                  disabled={userRole === UserRole.Cliente}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDiagnostico(val);
                    handlePersistChanges(tareas, repuestosExp, costoManoObra, undefined, val);
                  }}
                  rows={2}
                  placeholder={userRole === UserRole.Cliente ? "No hay acciones futuras sugeridas temporalmente." : "Ej. Programar rectificación de discos para el próximo mes de mantenimiento."}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs font-medium leading-relaxed disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* VEHICLE PICTURES GALLERY & LIVE UPLOADER */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 font-display">
              <div className="flex items-center space-x-2">
                <Camera className="h-5 w-5 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-base">Control de Fotos del Vehículo</h3>
              </div>
              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">
                {(activeMaint.fotos || []).length} fotos
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Registre imágenes del estado físico, abolladuras de recepción o confirmaciones de repuestos cambiados para el expediente digital de CQ Motors.
            </p>

            {/* Thumbnail Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Primary Cover Image */}
              <div className="relative group rounded-xl overflow-hidden border border-slate-205 aspect-[4/3] bg-slate-50 transition-all hover:ring-2 hover:ring-red-550/40">
                <img 
                  src={vehicle.imagenUrl || "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=600"} 
                  alt="Foto de Ingreso" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                
                {vehicle.imagenUrl && userRole !== UserRole.Cliente && (
                  <button
                    type="button"
                    onClick={handleDeleteCoverPhoto}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg opacity-100 transition-all cursor-pointer shadow-md z-10"
                    title="Eliminar primera foto (ingreso)"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}

                <div className="absolute inset-x-0 bottom-0 bg-slate-900/70 p-1.5 text-center text-[10px] font-bold text-white uppercase tracking-wider font-mono">
                  Ingreso Original
                </div>
              </div>

              {/* Client uploaded photos */}
              {(activeMaint.fotos || []).map((photoUrl, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[4/3] bg-slate-50 transition-all hover:ring-2 hover:ring-emerald-500">
                  <img 
                    src={photoUrl} 
                    alt={`Foto Control ${idx + 1}`} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  
                  {userRole !== UserRole.Cliente && (
                    <button
                      onClick={() => handleDeletePhoto(photoUrl)}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg opacity-100 transition-all cursor-pointer shadow-md z-10"
                      title="Remover foto de control"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <div className="absolute inset-x-0 bottom-0 bg-emerald-950/80 p-1.5 text-center text-[10px] font-bold text-white uppercase tracking-wider font-mono">
                    Evidencia #{idx + 1}
                  </div>
                </div>
              ))}

              {/* No additional photos state */}
              {(!activeMaint.fotos || activeMaint.fotos.length === 0) && (
                <div className="col-span-2 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 p-4 rounded-xl text-slate-400 text-center">
                  <UploadCloud className="h-6 w-6 text-slate-300 mb-1" />
                  <span className="text-[10.5px] font-bold block">No hay fotos de control</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Las imágenes aparecerán aquí cuando sean cargadas por el taller.</span>
                </div>
              )}
            </div>

            {/* Interactive Upload Panel */}
            {userRole !== UserRole.Cliente && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap gap-2">
                  {/* Real Camera Uploader */}
                  <label className="px-4 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow active:translate-y-px">
                    <Camera className="h-4 w-4" />
                    <span>Tomar Foto (Cámara 📸)</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>

                  {/* Real Gallery Uploader */}
                  <label className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm active:translate-y-px">
                    <UploadCloud className="h-4 w-4" />
                    <span>Subir de Galería 📁</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>

                  {/* PC Demo Simulator */}
                  <button
                    type="button"
                    onClick={handleSimulateCamera}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                    title="Simular carga de imagen preestablecida si no tiene cámara"
                  >
                    <span>Simular Foto Test ⚙️</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Dirección URL</span>
                  </button>
                </div>

                {/* URL manual input form */}
                {showUrlInput && (
                  <div className="p-3 bg-slate-50 border border-slate-205 rounded-xl flex items-center gap-2">
                    <input
                      type="url"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      placeholder="Pegue la dirección URL de la fotografía..."
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddPhoto(newPhotoUrl)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-emerald-605 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Insertar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Spare parts lookup, alerts, financial metrics (5/12 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* ASSIGN SPARE PARTS & STOCK CHECK */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 font-display">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Plan de Repuestos del Vehículo</h3>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest font-mono">
                Inventario Integrado
              </span>
            </div>

            {/* Dynamic part request form (Hidden for Client) */}
            {userRole !== UserRole.Cliente ? (
              <form onSubmit={handleRequestSparePart} className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Seleccionar Repuesto Bodega *</label>
                  <select
                    value={selectedRepuestoId}
                    onChange={(e) => { setSelectedRepuestoId(e.target.value); setDispenseError(""); }}
                    className="w-full bg-white border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Buscar Componente en Existencia --</option>
                    {inventory.map((item) => (
                      <option key={item.id} value={item.id} disabled={item.stock === 0}>
                        {item.nombre} - [Código {item.codigo}] (Disp: {item.stock} u. | ${item.precioVenta.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2 items-end">
                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Cantidad *</label>
                    <input
                      type="number"
                      min="1"
                      value={selectedRepuestoCant}
                      onChange={(e) => setSelectedRepuestoCant(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 border rounded-xl bg-white border-slate-200 focus:outline-none focus:border-emerald-500 text-xs font-bold font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <button
                      type="submit"
                      className="w-full py-2 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Asignar y Despachar
                    </button>
                  </div>
                </div>

                {dispenseError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-800 text-[11px] font-medium rounded-lg flex items-start space-x-1.5">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{dispenseError}</span>
                  </div>
                )}

                {/* 💡 RECOMENDADOR INTELIGENTE DE REPUESTOS POR MODELO (7th of 8 improvements) */}
                <div className="pt-2.5 border-t border-slate-200/50 mt-3.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1 font-mono">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500 hover:animate-spin" />
                    <span>Sugeridos para {vehicle.marca} {vehicle.modelo}</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {getSmartPartsForVehicle(vehicle.marca, vehicle.modelo, inventory).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleQuickAddRecommendedPart(p.id)}
                        className="p-2 bg-white hover:bg-emerald-50/25 border border-slate-200 hover:border-emerald-405 rounded-xl flex items-center justify-between text-slate-700 hover:text-emerald-950 transition-all font-sans text-left cursor-pointer group shadow-sm-flat"
                      >
                        <div className="truncate pr-1.5 flex-1 min-w-0">
                          <span className="font-bold block truncate text-[11.5px] text-slate-800 group-hover:text-emerald-900">{p.nombre}</span>
                          <span className="text-[9.5px] text-slate-400 font-mono block mt-0.5">${p.precioVenta.toFixed(2)} • x{p.stock}</span>
                        </div>
                        <span className="text-[10px] bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-800 p-1 rounded px-2 font-extrabold shrink-0 transition-all uppercase tracking-wider text-[8.5px]">
                          + Añadir
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-emerald-50/55 rounded-xl border border-emerald-100/70 text-emerald-950 flex items-start space-x-3 text-xs leading-relaxed">
                <CheckSquare className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-900 block mb-0.5">Certificación y Garantía CQ Motors S.A.</span>
                  <span>Todos los repuestos detallados a continuación corresponden a partes genuinas certificadas por el fabricante con garantía técnica de 12 meses.</span>
                </div>
              </div>
            )}

            {/* List of associated parts with cost */}
            <div className="space-y-3 pt-1 font-sans">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Repuestos Nuevos Instalados / por Instalar</span>
              {repuestosExp.length > 0 ? (
                repuestosExp.map((part) => {
                  // Find matching inventory item to obtain its premium snapshot picture
                  const matchPartInInv = inventory.find(i => i.id === part.repuestoId);
                  const displayPartImg = part.imagenUrl || matchPartInInv?.imagenUrl || "https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=200&auto=format&fit=crop";

                  return (
                    <div key={part.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-3 MIN-W-0">
                        <img 
                          src={displayPartImg} 
                          alt={part.nombre} 
                          referrerPolicy="no-referrer"
                          className="h-12 w-12 object-cover rounded-xl border border-slate-200 shrink-0" 
                        />
                        <div>
                          <h5 className="font-bold text-slate-800 truncate">{part.nombre}</h5>
                          <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                            {part.cantidad} unidad(es) {userRole !== UserRole.Cliente && `x $${part.costoUnitario.toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                      {userRole !== UserRole.Cliente && (
                        <span className="font-bold text-slate-900 font-mono shrink-0">
                          ${(part.cantidad * part.costoUnitario).toFixed(2)}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <span className="text-xs text-slate-400 italic block text-center py-2">
                  Ningún repuesto de bodega asociado a esta reparación todavía.
                </span>
              )}
            </div>
          </div>

          {/* FINANCIALS & LABOUR COSTS */}
          {userRole !== UserRole.Cliente && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 font-display">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Costos y Cierre Tecnico</h3>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Costo Mano de Obra ($) *</label>
                    {userRole === UserRole.Mecanico && <span className="text-[9px] text-slate-400 font-mono uppercase bg-slate-100 px-1 rounded">(Solo Admin)</span>}
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      value={costoManoObra === 0 ? "" : costoManoObra}
                      disabled={userRole === UserRole.Mecanico}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const val = raw === "" ? 0 : Math.max(0, parseFloat(raw) || 0);
                        setCostoManoObra(val);
                        handlePersistChanges(tareas, repuestosExp, val);
                      }}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 border rounded-xl bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-xs font-bold font-mono"
                    />
                  </div>
                </div>

                {/* Cost Summary Box */}
                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 border border-slate-800 font-sans shadow-md">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Mano de obra técnica:</span>
                    <span className="font-mono font-medium">${costoManoObra.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-850">
                    <span>Suma de Repuestos:</span>
                    <span className="font-mono font-medium">${totalRepuestosCosto.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold pt-1.5 pb-2">
                    <span className="text-emerald-400">Total Proyectado:</span>
                    <span className="font-mono text-white text-base">${totalFinalCompleto.toFixed(2)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handlePersistChanges(tareas, repuestosExp, costoManoObra, observaciones, diagnostico, recordatorioMeses);
                      triggerNotification("💾 ¡Ficha de Mantenimiento persistida correctamente!");
                    }}
                    className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold rounded-lg text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer border border-emerald-500 shadow"
                  >
                    <Save className="h-4 w-4" />
                    <span>Guardar Informe Técnico</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handlePersistChanges(tareas, repuestosExp, costoManoObra, observaciones, diagnostico, recordatorioMeses);
                      setIsInvoiceOpen(true);
                      showInfo("Factura Proforma", "Abriendo comprobante técnico detallado para el cliente.");
                    }}
                    className="w-full mt-2 py-2 bg-slate-850 hover:bg-slate-800 active:bg-slate-900 text-slate-100 hover:text-white border border-slate-700 font-bold rounded-lg text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow"
                  >
                    <FileText className="h-4 w-4 text-emerald-400" />
                    <span>Generar Presupuesto / Factura</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUGGESTED EXTENSION: WHATSAPP REMINDERS GENERATOR */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-250/60 font-display">
              <CalendarClock className="h-5 w-5 text-slate-700" />
              <h3 className="font-bold text-slate-900 text-sm">Próximo Mantenimiento y Alertas</h3>
            </div>

            <div className="space-y-3.5 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Calcular Próxima Cita (Intervalo)</label>
                <div className="grid grid-cols-3 gap-1">
                  {[3, 6, 12].map((mes) => (
                    <button
                      key={mes}
                      type="button"
                      disabled={userRole === UserRole.Cliente}
                      onClick={() => {
                        setRecordatorioMeses(mes);
                        handlePersistChanges(tareas, repuestosExp, costoManoObra, undefined, undefined, mes);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                        recordatorioMeses === mes
                          ? "bg-slate-900 text-white shadow-sm border border-slate-900"
                          : "bg-white text-slate-600 border border-slate-200"
                      } ${userRole === UserRole.Cliente ? "cursor-default opacity-90" : "hover:bg-slate-50 cursor-pointer"}`}
                    >
                      {mes} meses {mes === 3 ? "(Filtros)" : mes === 6 ? "(Medios)" : "(Anual)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Call reminders action */}
              {userRole !== UserRole.Cliente && (
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => handleTriggerSimulatedReminder("whatsapp")}
                    className="py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 active:bg-emerald-200 font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-[11px]"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span>Cita por WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleTriggerSimulatedReminder("email")}
                    className="py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 active:bg-blue-200 font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-[11px]"
                  >
                    <Send className="h-4 w-4 shrink-0" />
                    <span>Cita por Correo</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    ) : (
        <div className="bg-white p-10 rounded-2xl border border-slate-200/80 text-center max-w-xl mx-auto space-y-4 shadow-sm my-8">
          <div className="p-4 bg-slate-50 text-slate-400 rounded-full w-max mx-auto border border-slate-200 shadow-inner">
            <Wrench className="h-8 w-8 text-emerald-500 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-800 text-sm">Ningún reporte de mantenimiento cargado</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Seleccione un reporte anterior en la <span className="font-bold text-emerald-600">Bitácora Automotriz</span> superior o cree una nueva ficha de mantenimiento para ver el checklist, agregar repuestos, registrar observaciones y subir fotos.
            </p>
          </div>
        </div>
      )}

      {/* Invoice / Proforma Preview Modal */}
      <AnimatePresence>
        {isInvoiceOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              id="invoice-modal"
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full overflow-hidden flex flex-col font-sans text-slate-800"
            >
              {/* Modal Header Controls (Non-printable) */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
                <div className="flex items-center space-x-2.5">
                  <FileText className="h-5 w-5 text-emerald-450 animate-pulse" />
                  <span className="font-display font-black text-sm tracking-wide uppercase">Comprobante y Presupuesto Técnico</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const clientPhoneClean = vehicle.cliente.telefono.replace(/\D/g, "");
                      let formattedPhone = clientPhoneClean;
                      if (clientPhoneClean.startsWith("0")) {
                        formattedPhone = "593" + clientPhoneClean.substring(1);
                      } else if (clientPhoneClean.length === 9 && !clientPhoneClean.startsWith("593")) {
                        formattedPhone = "593" + clientPhoneClean;
                      }

                      const subtotal = totalFinalCompleto;
                      const iva = subtotal * 0.15;
                      const totalFinal = subtotal + iva;

                      const textMsg = `*CQ MOTORS - DETALLE DE PRESUPUESTO Y ENTREGA*\n\n` +
                        `Estimado(a) *${vehicle.cliente.nombre}*,\n` +
                        `Le compartimos la liquidación de servicios de mantenimiento para su vehículo:\n\n` +
                        `🚗 *Vehículo:* ${vehicle.marca} ${vehicle.modelo} (${vehicle.placa.toUpperCase()})\n` +
                        `👤 *Responsable:* ${activeMaint.mecanicoAsignado}\n` +
                        `📅 *Fecha:* ${new Date(activeMaint.fechaRegistro).toLocaleDateString("es-ES")}\n\n` +
                        `*DETALLE ECONÓMICO:*\n` +
                        `🔧 Mano de Obra: $${costoManoObra.toFixed(2)}\n` +
                        `📦 Repuestos/Insumos: $${totalRepuestosCosto.toFixed(2)}\n` +
                        `📊 Subtotal: $${subtotal.toFixed(2)}\n` +
                        `💰 *TOTAL CON IVA (15%): $${totalFinal.toFixed(2)}*\n\n` +
                        `*Observaciones Técnicas:*\n` +
                        `"${observaciones || 'Vehículo revisado y listo para rodar correctamente.'}"\n\n` +
                        `¡Su auto se encuentra listo! Ante cualquier duda escríbanos de vuelta. 📲🔧`;

                      const waUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(formattedPhone)}&text=${encodeURIComponent(textMsg)}`;
                      window.open(waUrl, "_blank");
                      showSuccess("WhatsApp Generado", "Se abrió la plantilla detallada del presupuesto en WhatsApp.");
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1 border border-emerald-500 shadow-sm"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Compartir por WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                    }}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 border border-slate-700"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Imprimir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsInvoiceOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Printable Body Area */}
              <div className="p-8 md:p-12 overflow-y-auto max-h-[80vh] print:max-h-none print:p-0 flex-1 space-y-8">
                {/* Visual Letterhead invoice header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-100 gap-4">
                  <div className="space-y-1">
                    <div className="text-xl font-display font-black text-slate-900 tracking-tight flex items-center space-x-1.5">
                      <span className="text-emerald-600">CQ</span>
                      <span>MOTORS S.A.</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
                      R.U.C: 1792435532001 &bull; Taller de Colisión y Mecánica de Alta Precisión<br />
                      Dirección: Av. Galo Plaza Lasso N52-23 y Capitán Ramón Borja &bull; Quito<br />
                      Teléfono: 0996287338 &bull; Correo: info@cqmotors.com.ec
                    </p>
                  </div>
                  <div className="text-right md:text-right space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 print:bg-transparent print:border-none print:p-0">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full inline-block mb-1">
                      PRESUPUESTO TÉCNICO PROFORMA
                    </span>
                    <h3 className="font-mono font-bold text-slate-800 text-sm">
                      Nº CQ-{activeMaint.id.substring(activeMaint.id.length - 6).toUpperCase()}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Emisión: {new Date(activeMaint.fechaRegistro).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })} hs
                    </p>
                  </div>
                </div>

                {/* Cliente and Vehicle Information Blocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50/60 rounded-2xl border border-slate-100">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 pb-1 border-b border-slate-200/60">DATOS DEL PROPIETARIO</h4>
                    <div className="grid grid-cols-3 text-xs leading-relaxed">
                      <span className="text-slate-400">Cliente:</span>
                      <span className="col-span-2 font-bold text-slate-800">{vehicle.cliente.nombre}</span>
                      
                      <span className="text-slate-400">Teléfono:</span>
                      <span className="col-span-2 font-mono font-semibold text-slate-700">{vehicle.cliente.telefono}</span>
                      
                      <span className="text-slate-400">E-mail:</span>
                      <span className="col-span-2 text-slate-600 truncate">{vehicle.cliente.correo}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 pb-1 border-b border-slate-200/60">DETALLES DEL VEHÍCULO</h4>
                    <div className="grid grid-cols-3 text-xs leading-relaxed">
                      <span className="text-slate-400">Placa:</span>
                      <span className="col-span-2 font-mono font-bold text-emerald-700 text-sm tracking-wider uppercase">{vehicle.placa}</span>
                      
                      <span className="text-slate-400">Vehículo:</span>
                      <span className="col-span-2 font-semibold text-slate-800">{vehicle.marca} {vehicle.modelo} ({vehicle.anio})</span>
                      
                      <span className="text-slate-400">Kilometraje:</span>
                      <span className="col-span-2 font-mono text-slate-700">{vehicle.kilometraje.toLocaleString()} Km</span>
                    </div>
                  </div>
                </div>

                {/* Services Checklist / Mano de Obra Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-1.5 pb-1 border-b border-slate-100">
                    <span className="p-1 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                      <Wrench className="h-4 w-4" />
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 font-display">I. SERVICIOS Y MANO DE OBRA EVALUADA</h4>
                  </div>
                  <div className="overflow-hidden border border-slate-150 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150">
                          <th className="py-2.5 px-4 font-bold text-slate-700">Descripción de Tarea</th>
                          <th className="py-2.5 px-4 font-bold text-slate-700 text-center w-28">Categoría</th>
                          <th className="py-2.5 px-4 font-bold text-slate-700 text-center w-24">Estado</th>
                          <th className="py-2.5 px-4 font-bold text-slate-700 text-right w-24">Precio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tareas.map((task) => (
                          <tr key={task.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 text-slate-850 font-medium">{task.nombre}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg uppercase">
                                {task.categoria}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`inline-block px-2.5 py-0.5 text-[9.5px] font-extrabold rounded-lg ${
                                task.completada ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-100 text-slate-450 border border-slate-200"
                              }`}>
                                {task.completada ? "COMPLETADO" : "PENDIENTE"}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-650">
                              ${task.costoEstimado.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50/45 font-semibold border-t border-slate-205">
                          <td colSpan={3} className="py-3 px-4 text-left font-sans text-slate-705">Mano de Obra y Servicios del Especialista ({activeMaint.mecanicoAsignado})</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-900">${costoManoObra.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Replacement Parts Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-1.5 pb-1 border-b border-slate-100">
                    <span className="p-1 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                      <ShoppingBag className="h-4 w-4" />
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 font-display">II. REPUESTOS E INSUMOS REQUERIDOS EN ORDEN</h4>
                  </div>
                  <div className="overflow-hidden border border-slate-150 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150">
                          <th className="py-2.5 px-4 font-bold text-slate-700">Denominación del Repuesto</th>
                          <th className="py-2.5 px-4 font-bold text-slate-700 text-center w-24">Cantidad</th>
                          <th className="py-2.5 px-4 font-bold text-slate-700 text-right w-28">Precio Unit.</th>
                          <th className="py-2.5 px-4 font-bold text-slate-700 text-center w-24">Surtido</th>
                          <th className="py-2.5 px-4 font-bold text-slate-700 text-right w-28">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {repuestosExp.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 px-4 text-center text-slate-400 italic">
                              Ninguno asignado. No se cargaron repuestos a este informe todavía.
                            </td>
                          </tr>
                        ) : (
                          repuestosExp.map((part) => (
                            <tr key={part.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-4 text-slate-850 font-medium">{part.nombre}</td>
                              <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-700">{part.cantidad}</td>
                              <td className="py-2.5 px-4 text-right font-mono text-slate-650">${part.costoUnitario.toFixed(2)}</td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded ${
                                  part.surtido ? "bg-emerald-55 text-emerald-800 border border-emerald-100" : "bg-amber-55 text-amber-800 border border-amber-100"
                                }`}>
                                  {part.surtido ? "BODEGA OK" : "PENDIENTE"}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono text-slate-850 font-bold">
                                ${(part.costoUnitario * part.cantidad).toFixed(2)}
                              </td>
                            </tr>
                          ))
                        )}
                        <tr className="bg-slate-50/45 font-semibold border-t border-slate-205">
                          <td colSpan={4} className="py-3 px-4 text-left font-sans text-slate-705">Subtotal de Repuestos e Insumos Entregados</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-900">${totalRepuestosCosto.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Proforma Totals breakdown block */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-stretch gap-6 pt-2">
                  <div className="flex-1 space-y-3.5 max-w-md w-full">
                    <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-150 text-xs">
                      <span className="font-bold text-slate-800 block">OBSERVACIONES TÉCNICAS Y RECOMENDACIÓN</span>
                      <p className="text-slate-600 leading-relaxed font-sans font-medium">
                        {observaciones || "Ingreso vehicular estándar de mantenimiento preventivo. Se completó verificación multipunto exitosa."}
                      </p>
                    </div>

                    {diagnostico && (
                      <div className="space-y-1.5 p-4 bg-amber-50/40 rounded-2xl border border-amber-100/60 text-xs text-slate-700">
                        <span className="font-bold text-amber-850 block">PRÓXIMA ALERTA RECOMENDADA</span>
                        <p className="leading-relaxed font-medium">
                          {diagnostico} (Próxima revisión planificada en un lapso de {recordatorioMeses} meses).
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="w-full md:w-80 bg-slate-900 text-white rounded-3xl p-6 flex flex-col justify-between border border-slate-850 shadow-lg shrink-0 space-y-3">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Servicios & Mano de Obra:</span>
                        <span className="font-mono font-medium">${costoManoObra.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 pb-2 border-b border-slate-800">
                        <span>Insumos & Repuestos:</span>
                        <span className="font-mono font-medium">${totalRepuestosCosto.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300 font-semibold pt-1">
                        <span>SUBTOTAL NETO:</span>
                        <span className="font-mono">${totalFinalCompleto.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>I.V.A. Ley (15%):</span>
                        <span className="font-mono">${(totalFinalCompleto * 0.15).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="pt-3.5 border-t border-slate-850 flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-lg tracking-wider">
                        A PAGAR TOTAL
                      </span>
                      <span className="text-xl font-mono font-black text-white shrink-0">
                        ${(totalFinalCompleto * 1.15).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sign-off footer lines signature */}
                <div className="grid grid-cols-2 gap-12 pt-16 border-t border-slate-100 text-center text-xs text-slate-400 max-w-2xl mx-auto">
                  <div className="space-y-1.5">
                    <div className="h-0.5 bg-slate-200 w-full" />
                    <span className="font-bold text-slate-700 block">MECÁNICO / COORDINADOR DE PATIO</span>
                    <span className="text-[10px] font-mono">Firma y Sello CQ Motors S.A.</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-0.5 bg-slate-200 w-full" />
                    <span className="font-bold text-slate-700 block">CLIENTE CONFORME</span>
                    <span className="text-[10px] font-mono">Aceptación de Presupuesto y Entrega</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
