import React, { useState } from "react";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Search, 
  Filter, 
  Check, 
  X, 
  Car, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserRole, CitaMantenimiento, Vehiculo, Cliente } from "../types";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { useToast } from "./Toast";

interface AppointmentsManagerProps {
  appointments: CitaMantenimiento[];
  userRole: UserRole;
  onRegisterVehicle: (newVehicle: Vehiculo) => void;
}

export default function AppointmentsManager({ 
  appointments, 
  userRole, 
  onRegisterVehicle 
}: AppointmentsManagerProps) {
  
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const { showSuccess, showError, showInfo } = useToast();
  
  // Convert appointment into an active patio vehicle state modal
  const [conversionTarget, setConversionTarget] = useState<CitaMantenimiento | null>(null);
  // Conversion state fields
  const [fuelLevel, setFuelLevel] = useState(50);
  const [assignedMechanic, setAssignedMechanic] = useState("David Mendoza");

  const formatWhatsAppNumber = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "593" + cleaned.substring(1);
    }
    if (cleaned.length === 9 && !cleaned.startsWith("593")) {
      cleaned = "593" + cleaned;
    }
    return cleaned;
  };

  const getWhatsAppMessageUrl = (appt: CitaMantenimiento): string => {
    const formattedDate = appt.fechaPreferencia ? new Date(appt.fechaPreferencia + "T00:00:00").toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }) : appt.fechaPreferencia;

    const message = `¡Hola, ${appt.nombreCliente}! 🚗 Te saludamos de *CQ Motors*.\n\nLe confirmamos que su solicitud de cita de mantenimiento ha sido *APROBADA* con éxito:\n\n` +
      `📌 *Vehículo:* ${appt.marca} ${appt.modelo} (Placa: ${appt.placa.toUpperCase()})\n` +
      `📅 *Fecha:* ${formattedDate}\n` +
      `⏰ *Hora:* ${appt.horaPreferencia} HS\n` +
      `🛠️ *Servicios:* ${appt.tipoServicios?.join(", ") || "General"}\n\n` +
      `Su vehículo ya está programado en nuestro sistema. ¡Le esperamos con gusto en nuestro taller! 🔧`;
    
    const formattedPhone = formatWhatsAppNumber(appt.telefonoCliente);
    return `https://api.whatsapp.com/send?phone=${encodeURIComponent(formattedPhone)}&text=${encodeURIComponent(message)}`;
  };

  const handleUpdateStatus = async (apptId: string, nextStatus: "Aprobada" | "Cancelada" | "Completada") => {
    setIsProcessing(apptId);
    try {
      await updateDoc(doc(db, "appointments", apptId), { estado: nextStatus });
      showSuccess("Estado Actualizado", `Cita de mantenimiento cambiada exitosamente a: ${nextStatus}.`);
    } catch (err) {
      showError("Error de Base de Datos", "No se pudo actualizar el estado de la cita.");
      handleFirestoreError(err, OperationType.WRITE, `appointments/${apptId}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleApproveAppointmentAndWhatsApp = async (appt: CitaMantenimiento) => {
    setIsProcessing(appt.id);
    let apiFailure = false;
    let fallbackMsg = "";

    try {
      // 1. Mark appointment as Approved in Firestore
      await updateDoc(doc(db, "appointments", appt.id), { estado: "Aprobada" });
      
      // 2. Trigger Automated WhatsApp Business Cloud API in background
      const res = await fetch("/api/whatsapp/send-approved-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appt })
      });
      
      const resData = await res.json().catch(() => ({}));
      
      if (res.ok && resData.success) {
        showSuccess("¡Cita Aprobada!", `Notificación enviada con éxito vía API de WhatsApp. 📲✨`);
      } else {
        apiFailure = true;
        if (resData.configured === false) {
          fallbackMsg = `Las credenciales de WhatsApp Cloud API no están configuradas en el servidor. Abriendo WhatsApp Web para envío manual...`;
        } else {
          fallbackMsg = `Error de API oficial: "${resData.error || "Falla en envío"}". Abriendo WhatsApp Web para enviar de forma manual...`;
        }
      }
    } catch (err: any) {
      console.error("Failed to approve appointment or execute WhatsApp notification:", err);
      apiFailure = true;
      fallbackMsg = `Error de conectividad de notificaciones. Redirigiendo a WhatsApp Web para enviar de forma manual...`;
    } finally {
      setIsProcessing(null);
      
      if (apiFailure) {
        showInfo("Cita Aprobada", fallbackMsg);
        // Manual fallback redirect
        const waUrl = getWhatsAppMessageUrl(appt);
        try {
          window.open(waUrl, "_blank");
        } catch (e) {
          console.warn("Popup blocker prevented automatic redirection to WhatsApp Web:", e);
        }
      }
    }
  };

  const handleConvertAppointmentToActiveVehicle = async (appt: CitaMantenimiento) => {
    setIsProcessing(appt.id);
    const clientObj: Cliente = {
      id: `cli-${Date.now()}`,
      nombre: appt.nombreCliente,
      telefono: appt.telefonoCliente,
      correo: appt.correoCliente
    };

    const newVehicle: Vehiculo = {
      id: `veh-${Date.now()}`,
      placa: appt.placa,
      marca: appt.marca,
      modelo: appt.modelo,
      anio: appt.anio,
      cliente: clientObj,
      fechaIngreso: new Date().toISOString().split('T')[0],
      estado: "Ingresado",
      kilometraje: appt.kilometraje,
      nivelCombustible: fuelLevel
    };

    try {
      // 1. Invoke App-level registration helper which saves to Firestore & initializes sheets!
      await onRegisterVehicle(newVehicle);
      
      // 2. Mark appointment as Completed in Firestore
      await updateDoc(doc(db, "appointments", appt.id), { estado: "Completada" });

      setConversionTarget(null);
      setSuccessMsg(`¡Registro Exitoso! El vehículo ${newVehicle.placa} ingresó a patio de taller.`);
      setTimeout(() => setSuccessMsg(""), 4500);
    } catch (err) {
      console.error("Conversion failed:", err);
    } finally {
      setIsProcessing(null);
    }
  };

  // Filtered lists
  const filteredAppointments = appointments.filter(a => {
    const statusMatch = filterStatus === "all" || a.estado === filterStatus;
    const cleanQuery = searchQuery.toLowerCase().trim();
    const txtMatch = cleanQuery === "" || 
                     a.nombreCliente.toLowerCase().includes(cleanQuery) ||
                     a.placa.toLowerCase().includes(cleanQuery) ||
                     a.marca.toLowerCase().includes(cleanQuery) ||
                     a.modelo.toLowerCase().includes(cleanQuery);
    return statusMatch && txtMatch;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-slate-900 flex items-center space-x-2.5">
            <Calendar className="h-6 w-6 text-orange-500" />
            <span>Gestión de Citas Recibidas</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Administre, apruebe y registre ingresos de clientes que realizaron su solicitud de reservaciones en tiempo real
          </p>
        </div>

        {/* Filters and search box */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 text-xs font-bold gap-1">
            {["all", "Pendiente", "Aprobada", "Completada", "Cancelada"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterStatus === st 
                    ? "bg-white text-slate-900 shadow-xs" 
                    : "text-slate-650 hover:text-slate-900"
                }`}
              >
                {st === "all" ? "Todas" : st}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar placa, cliente..."
              className="pl-9 pr-4 py-2 bg-slate-100 placeholder-slate-400 border-0 rounded-xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-orange-500/10 w-[200px] transition-all focus:w-[240px] focus:bg-white focus:border focus:border-slate-300"
            />
          </div>
        </div>
      </div>

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-xs font-bold flex items-center space-x-2.5"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {/* Grid or Table list */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredAppointments.length === 0 ? (
            <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-3">
              <AlertCircle className="h-10 w-10 text-slate-450 stroke-[1.5]" />
              <div>
                <h5 className="font-bold text-slate-700 text-sm">No se encontraron solicitudes</h5>
                <p className="text-slate-405 text-xs mt-1">Intente cambiar la categoría de filtrado o la consulta</p>
              </div>
            </div>
          ) : (
            filteredAppointments.map((appt) => (
              <motion.div
                key={appt.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-slate-200/80 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Header card state */}
                <div className="p-5 border-b border-slate-100 flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-1 rounded-lg tracking-wider">
                      {appt.placa}
                    </span>
                    <h4 className="font-display font-extrabold text-sm text-slate-900 pt-1.5">
                      {appt.marca} {appt.modelo}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Año: {appt.anio} &bull; {appt.kilometraje.toLocaleString()} Km
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase font-mono tracking-wider ${
                    appt.estado === "Pendiente" ? "bg-orange-100 text-orange-700" :
                    appt.estado === "Aprobada" ? "bg-indigo-100 text-indigo-700" :
                    appt.estado === "Completada" ? "bg-emerald-100 text-emerald-700" :
                    "bg-rose-100 text-rose-700"
                  }`}>
                    {appt.estado}
                  </span>
                </div>

                {/* Body details info */}
                <div className="p-5 space-y-3.5 text-xs flex-1">
                  
                  {/* Contact client info */}
                  <div className="space-y-1.5 p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-2 text-slate-700">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-bold">{appt.nombreCliente}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{appt.telefonoCliente}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-500 text-[11px] truncate">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{appt.correoCliente}</span>
                    </div>
                  </div>

                  {/* Date and hour preference */}
                  <div className="flex items-center justify-between py-1 border-y border-slate-100/60 font-mono text-[11px]">
                    <div className="flex items-center space-x-1.5 text-slate-600">
                      <Calendar className="h-3.5 w-3.5 text-orange-500" />
                      <span>{appt.fechaPreferencia}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-600">
                      <Clock className="h-3.5 w-3.5 text-orange-500" />
                      <span>{appt.horaPreferencia} HS</span>
                    </div>
                  </div>

                  {/* Services tags */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Servicios Requeridos</span>
                    <div className="flex flex-wrap gap-1">
                      {appt.tipoServicios?.map((srv, idx) => (
                        <span key={idx} className="bg-orange-50 text-orange-850 px-2 py-0.5 rounded text-[10px] font-semibold border border-orange-100/40">
                          {srv}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Comments */}
                  {appt.comentarios && (
                    <div className="p-2.5 bg-yellow-50/50 border border-yellow-101 rounded-xl text-[11px] text-slate-600 italic">
                      &ldquo;{appt.comentarios}&rdquo;
                    </div>
                  )}
                </div>

                {/* Footer Buttons triggers */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
                  
                  {appt.estado === "Pendiente" && (
                    <div className="flex items-center justify-between gap-2 w-full">
                      <button
                        onClick={() => handleUpdateStatus(appt.id, "Cancelada")}
                        disabled={isProcessing === appt.id}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                        title="Rechazar Cita"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleApproveAppointmentAndWhatsApp(appt)}
                        disabled={isProcessing === appt.id}
                        className="flex-1 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                        title="Aprobar y notificar por WhatsApp automáticamente"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span>Aprobar y Enviar WhatsApp 📲</span>
                      </button>
                    </div>
                  )}

                  {appt.estado === "Aprobada" && (
                    <div className="flex flex-col gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          const waUrl = getWhatsAppMessageUrl(appt);
                          window.open(waUrl, "_blank");
                        }}
                        className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                        title="Reenviar recordatorio o aviso por WhatsApp"
                      >
                        <span>Reabrir/Enviar WhatsApp 📲</span>
                      </button>

                      <button
                        onClick={() => setConversionTarget(appt)}
                        disabled={isProcessing === appt.id}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs transition-all flex items-center justify-center space-x-2 shadow-xs cursor-pointer active:translate-y-px"
                      >
                        <UserPlus className="h-4 w-4 stroke-[2.5]" />
                        <span>Ingresar a Patio (Admitir)</span>
                      </button>
                    </div>
                  )}

                  {appt.estado === "Completada" && (
                    <span className="w-full text-center text-slate-400 font-bold text-[11px] py-1">
                      &bull; Turno Completado &bull;
                    </span>
                  )}

                  {appt.estado === "Cancelada" && (
                    <span className="w-full text-center text-rose-400 font-bold text-[11px] py-1">
                      &bull; Cancelado / Inactivo &bull;
                    </span>
                  )}

                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* CONVERSION & ADMISSION MODAL DIALOG */}
      <AnimatePresence>
        {conversionTarget && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden"
            >
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserPlus className="h-5 w-5 text-emerald-450" />
                  <h4 className="font-display font-extrabold text-base">Registrar Admisión Vehicular</h4>
                </div>
                <button 
                  onClick={() => setConversionTarget(null)}
                  className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs font-sans">
                <div className="p-3.5 bg-emerald-50 border border-emerald-110 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Pre-llenado de datos</span>
                  <div className="font-bold text-slate-900 text-sm mt-1">
                    {conversionTarget.placa} &bull; {conversionTarget.marca} {conversionTarget.modelo} ({conversionTarget.anio})
                  </div>
                  <span className="text-slate-500 block text-[11px] mt-0.5">
                    Propietario: <strong>{conversionTarget.nombreCliente}</strong> ({conversionTarget.telefonoCliente})
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Nivel de Combustible Actual (%)</label>
                  <div className="flex items-center space-x-3.5">
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={fuelLevel}
                      onChange={(e) => setFuelLevel(Number(e.target.value))}
                      className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded w-12 text-center shrink-0">
                      {fuelLevel}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pb-2">
                  <label className="text-xs font-bold text-slate-700 block">Mecánico Asignado Inicialmente</label>
                  <select
                    value={assignedMechanic}
                    onChange={(e) => setAssignedMechanic(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-xs focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  >
                    <option value="Tec. David Mendoza">Tec. David Mendoza (Frenos / Suspensión)</option>
                    <option value="Ing. Washington Cadena">Ing. Washington Cadena (Motores / Diagnóstico)</option>
                    <option value="Tec. Carlos Solórzano">Tec. Carlos Solórzano (Transmisiones / Eléctrico)</option>
                  </select>
                </div>

                <button
                  onClick={() => handleConvertAppointmentToActiveVehicle(conversionTarget)}
                  disabled={isProcessing === conversionTarget.id}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Iniciar Admisión e Inspección Inicial</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
