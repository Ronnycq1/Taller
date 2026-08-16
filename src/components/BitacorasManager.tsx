import React, { useState } from "react";
import { Vehiculo, Mantenimiento, UserRole } from "../types";
import { calculatePredictiveCRM } from "../utils/crmPredictive";
import { 
  Search, 
  Car, 
  History, 
  ChevronRight, 
  TrendingUp, 
  DollarSign, 
  User, 
  Clock, 
  ArrowLeft, 
  Sparkles,
  BookOpen,
  Calendar,
  Trash2,
  QrCode,
  Printer,
  X,
  Gauge,
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BitacorasManagerProps {
  vehicles: Vehiculo[];
  maintenances: Mantenimiento[];
  userRole: UserRole;
  onSelectVehicle: (v: Vehiculo) => void;
  onDeleteVehicle?: (vehicleId: string) => void;
}

export default function BitacorasManager({
  vehicles,
  maintenances,
  userRole,
  onSelectVehicle,
  onDeleteVehicle
}: BitacorasManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQRVehicle, setSelectedQRVehicle] = useState<Vehiculo | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehiculo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter vehicles (All of them, including active & delivered)
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = 
      v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.marca.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculation for stats summary
  const totalVehicles = vehicles.length;
  const deliveredVehicles = vehicles.filter((v) => v.estado === "Entregado").length;
  const activeVehicles = vehicles.filter((v) => v.estado !== "Entregado").length;
  
  // Total historical spending calculated
  const totalHistoricalMoney = maintenances.reduce((acc, curr) => acc + (curr.totalCalculado || 0), 0);
  const totalRecords = maintenances.length;

  return (
    <div className="space-y-6 font-sans">
      {/* PRINT STICKER INJECTED PORTAL FOR STANDARD DESKTOP PRINTER DIALOGS */}
      <style>{`
        @media print {
          body {
            background: white !important;
          }
          header, nav, main > div > *:not(#printable-sticker-modal), footer {
            display: none !important;
          }
          #printable-sticker-modal {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            z-index: 99999 !important;
          }
          #sticker-container-box {
            border: 3px dashed #0f172a !important;
            box-shadow: none !important;
            margin: 20px auto !important;
            page-break-inside: avoid;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* HEADER BAR */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 font-mono">
              Expediente Digital Perpetuo & CRM Predictivo
            </span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-100 tracking-tight">
            Archivo y Bitácora General
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Historial de bitácoras guardado de forma segura y organizado por vehículo. Al marcar un auto como <span className="text-emerald-400 font-semibold uppercase">Entregado</span> en Control de Patio, se archiva de forma automática en esta sección.
          </p>
        </div>
      </div>

      {/* STATS HIGHLIGHT GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block font-mono">
              Total Fichero Fórmulas
            </span>
            <span className="text-xl font-bold font-display text-slate-900 block leading-none">
              {totalVehicles} <span className="text-xs text-slate-450 font-normal">Máquinas</span>
            </span>
          </div>
          <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl border border-slate-200/50">
            <Car className="h-5 w-5" />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block font-mono">
              Fichas Entregadas
            </span>
            <span className="text-xl font-bold font-display text-emerald-650 block leading-none">
              {deliveredVehicles} <span className="text-xs text-slate-450 font-normal">Archivados</span>
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/50">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block font-mono">
              Mantenimientos Guardados
            </span>
            <span className="text-xl font-bold font-display text-slate-900 block leading-none">
              {totalRecords} <span className="text-xs text-slate-450 font-normal">Reportes</span>
            </span>
          </div>
          <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl border border-slate-200/50">
            <History className="h-5 w-5" />
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block font-mono">
              Valor de Servicios ($)
            </span>
            <span className="text-xl font-bold font-mono text-slate-950 block leading-none">
              ${totalHistoricalMoney.toFixed(2)}
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50/50 text-emerald-700 rounded-xl border border-emerald-100/50">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTAINER */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar vehículo por placa, marca, modelo o nombre del cliente..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs font-semibold transition-all"
          />
        </div>
        <div className="text-[11px] text-slate-500 font-medium font-mono shrink-0">
          Resultados: <span className="font-bold text-slate-800">{filteredVehicles.length} vehículos</span>
        </div>
      </div>

      {/* VEHICLES BITACORA GRID */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 max-w-lg mx-auto space-y-3.5 my-8">
          <div className="p-3 bg-slate-50 text-slate-400 rounded-full w-max mx-auto border border-dashed border-slate-200">
            <Car className="h-6 w-6 text-slate-400" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-sm">No se encontraron vehículos</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pruebe refinando su término de búsqueda. Asegúrese de ingresar placas correctas o nombres de clientes.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map((v) => {
            const vehicleMaints = maintenances.filter(m => m.vehiculoId === v.id);
            const totalVehMaintVal = vehicleMaints.reduce((sum, current) => sum + (current.totalCalculado || 0), 0);
            
            // CRM Math calculation integration
            const crmPred = calculatePredictiveCRM(v, vehicleMaints);

            let statusBadge = "bg-amber-100 text-amber-800 border-amber-250";
            if (v.estado === "En Proceso") statusBadge = "bg-emerald-100 text-emerald-800 border-emerald-250";
            else if (v.estado === "Listo para Entrega") statusBadge = "bg-blue-100 text-blue-800 border-blue-250";
            else if (v.estado === "Entregado") statusBadge = "bg-slate-100 text-slate-800 border-slate-200";

            return (
              <motion.div
                layout
                key={v.id}
                whileHover={{ y: -3 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5 flex flex-col h-full justify-between space-y-4">
                  {/* Top line with Plate & State Badge */}
                  <div className="flex items-center justify-between">
                    {/* Metal automotive plate style */}
                    <div className="flex items-center space-x-2">
                      <div className="border-2 border-slate-900 bg-white px-2.5 py-1 rounded shadow-xs font-mono font-extrabold text-[12px] text-slate-950 flex items-center space-x-1 tracking-wider uppercase">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
                        <span>{v.placa}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
                      </div>
                      {userRole !== UserRole.Cliente && onDeleteVehicle && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVehicleToDelete(v);
                          }}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                          title="Eliminar bitácora y hoja de patio"
                        >
                          <Trash2 className="h-4 w-4 shrink-0" />
                        </button>
                      )}
                    </div>

                    <span className={`text-[9.5px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${statusBadge}`}>
                      {v.estado === "En Proceso" ? "Mantenimiento" : v.estado}
                    </span>
                  </div>

                  {/* Vehicle Headline */}
                  <div>
                    <h3 className="font-display font-extrabold text-[16px] text-slate-900 leading-tight">
                      {v.marca} {v.modelo}
                    </h3>
                    <div className="text-[11px] text-slate-500 font-mono mt-1 flex items-center space-x-2">
                      <span>Año {v.anio}</span>
                      <span>&bull;</span>
                      <span>{v.kilometraje.toLocaleString("es-EC")} km</span>
                    </div>
                  </div>

                  {/* Owner Contact */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/40 space-y-1.5 text-xs">
                    <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">
                      Cliente Asociado
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 truncate pr-2 flex items-center space-x-1">
                        <User className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{v.cliente.nombre}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">{v.cliente.telefono}</span>
                    </div>
                  </div>

                  {/* CRM Predictivo Insights Section (1st of 8 improvements) */}
                  <div className={`border rounded-xl p-3 space-y-2 text-xs transition-colors ${
                    crmPred.alertState === "urgent" ? "bg-rose-50/70 border-rose-200" :
                    crmPred.alertState === "warning" ? "bg-amber-50/70 border-amber-200" :
                    "bg-emerald-50/40 border-emerald-500/10"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-extrabold uppercase tracking-wider flex items-center space-x-1 font-mono ${
                        crmPred.alertState === "urgent" ? "text-rose-700 font-black animate-pulse" :
                        crmPred.alertState === "warning" ? "text-amber-700" :
                        "text-emerald-700"
                      }`}>
                        <TrendingUp className="h-3 w-3 inline" />
                        <span>CRM Inteligente Predictivo</span>
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className={`text-[8px] font-mono font-bold px-1 rounded ${
                          crmPred.confidence === "Alta-Estable" ? "bg-emerald-100 text-emerald-800" :
                          crmPred.confidence === "Media-Ajustada" ? "bg-amber-100 text-amber-800" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          Conf: {crmPred.confidence}
                        </span>
                        <span className="text-[9px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-mono font-bold">
                          +{crmPred.kmPerDay} Km/D
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-450 block text-[9px] uppercase font-semibold">Odómetro Estimado</span>
                        <span className="font-mono font-bold text-slate-800 flex items-center space-x-1 mt-0.5">
                          <Gauge className="h-3 w-3 inline text-emerald-650" />
                          <span>{crmPred.estimatedCurrentKm.toLocaleString("es-EC")} Km</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-450 block text-[9px] uppercase font-semibold">Próximo Filtro & Aceite</span>
                        <span className="font-sans font-bold text-slate-800 flex items-center space-x-1 mt-0.5">
                          <Calendar className={`h-3 w-3 inline ${crmPred.alertState === "urgent" ? "text-rose-600 animate-bounce" : "text-emerald-650"}`} />
                          <span className={crmPred.alertState === "urgent" ? "text-rose-700 font-black" : ""}>
                            {crmPred.nextServiceDateStr}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-200/40 pt-1.5 text-[10px] text-slate-600 space-y-1">
                      <div className="leading-snug">
                        <span className="text-slate-500 font-semibold">Rutina Sugerida:</span>{" "}
                        <strong className="text-slate-800 font-extrabold">{crmPred.recommendedService}</strong>
                        <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                          {crmPred.daysRemaining} días restantes (Por {crmPred.triggerType})
                        </span>
                      </div>
                      
                      {/* Live Diagnostic checklist checklist */}
                      <div className="mt-1.5 space-y-0.5 bg-white/70 border border-slate-100 p-1.5 rounded-lg">
                        <span className="text-[8px] uppercase tracking-wider text-slate-450 font-extrabold block">Recomendaciones Preventivas Activas:</span>
                        {crmPred.diagnosticChecklist.slice(0, 3).map((chk, cIdx) => (
                          <div key={cIdx} className="flex items-start space-x-1 text-[9.5px] text-slate-600 leading-tight">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{chk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary of Maintenance count & historical spending */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">
                        Historial Clínico
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {vehicleMaints.length} {vehicleMaints.length === 1 ? "Ficha Guardada" : "Fichas Guardadas"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">
                        Gastos Históricos
                      </span>
                      <span className="text-xs font-extrabold text-emerald-650 font-mono">
                        ${totalVehMaintVal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Chronological minitimeline preview */}
                  {vehicleMaints.length > 0 && (
                    <div className="bg-slate-50/50 border border-slate-200/30 rounded-xl p-2.5 space-y-1 text-[11px] text-slate-600">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase block font-mono tracking-wider">
                        Últimos Mantenimientos:
                      </span>
                      <div className="space-y-1">
                        {vehicleMaints.slice(0, 2).map((m, mIdx) => {
                          const dateObj = new Date(m.fechaRegistro);
                          const dateFmt = dateObj.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "2-digit" });
                          return (
                            <div key={m.id} className="flex justify-between items-center bg-white border border-slate-200/30 px-2 py-1 rounded-lg">
                              <span className="font-medium text-slate-700 truncate pr-1">
                                #{vehicleMaints.length - mIdx}: {m.mecanicoAsignado.split(" ").slice(-1)[0]}
                              </span>
                              <span className="font-mono text-slate-500 font-medium shrink-0 flex items-center space-x-1">
                                <Calendar className="h-2.5 w-2.5 text-slate-400 inline" />
                                <span>{dateFmt}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action row with Worksheet Verifier & Windshield QR Code Sticker (2nd of 8 improvements) */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => onSelectVehicle(v)}
                      className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl flex items-center justify-center space-x-1 transition-all shadow-sm cursor-pointer"
                    >
                      <span>Ver Historial</span>
                      <ChevronRight className="h-3 w-3 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedQRVehicle(v)}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl flex items-center justify-center space-x-1 transition-all shadow-sm cursor-pointer"
                    >
                      <QrCode className="h-3.5 w-3.5 shrink-0" />
                      <span>Sticker QR</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* MODAL WINDOW FOR WINDSHIELD STICKER GENERATION & PHYSICAL PRINTING (Sticker QR de CQ Motors S.A.) */}
      <AnimatePresence>
        {selectedQRVehicle && (
          <div 
            onClick={() => setSelectedQRVehicle(null)}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200 no-print"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 my-auto"
              id="printable-sticker-modal"
            >
              {/* Modal Top controls */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between no-print">
                <div className="flex items-center space-x-2">
                  <QrCode className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-bold text-sm">Generador de Sticker Clinico CQ Motors</h3>
                </div>
                <button
                  onClick={() => setSelectedQRVehicle(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* STICKER CONTAINER DISPLAY */}
              <div className="p-8 flex flex-col items-center text-center space-y-6">
                
                {/* Visual Windshield Badge Sticker */}
                <div 
                  id="sticker-container-box"
                  className="w-80 bg-white border-2 border-slate-900 rounded-3xl p-6 shadow-md relative flex flex-col items-center space-y-5"
                >
                  {/* Decorative Header */}
                  <div className="w-full flex items-center justify-between border-b pb-3 border-slate-200">
                    <div className="text-left">
                      <span className="text-[14px] font-extrabold text-slate-950 tracking-tight font-display flex items-center space-x-1">
                        <span className="text-emerald-600 block">CQ</span> MOTORS S.A.
                      </span>
                      <span className="text-[8px] text-slate-500 uppercase font-mono tracking-widest block">
                        Control de Calidad
                      </span>
                    </div>
                    <div className="bg-slate-900 text-white text-[8px] font-mono font-bold uppercase rounded px-1.5 py-0.5 shrink-0">
                      ECUADOR
                    </div>
                  </div>

                  {/* License Plate Banner */}
                  <div className="w-full bg-slate-900 text-white py-1.5 px-3 rounded-lg font-mono font-extrabold text-sm flex justify-between items-center">
                    <span className="text-[10px] text-slate-400">PLACA AUTORIZADA:</span>
                    <span className="tracking-widest">{selectedQRVehicle.placa}</span>
                  </div>

                  {/* Real dynamic image generated QR matrix design */}
                  <div className="relative p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=0f172a&bgcolor=ffffff&data=${encodeURIComponent(
                        window.location.origin + "/?vehiculoId=" + selectedQRVehicle.id
                      )}`}
                      alt={`Código QR para placa ${selectedQRVehicle.placa}`}
                      referrerPolicy="no-referrer"
                      className="w-[120px] h-[120px] object-contain block"
                    />
                    
                    {/* Floating label */}
                    <span className="absolute -bottom-1.5 bg-white border border-slate-200 px-2 py-0.5 rounded text-[8px] font-bold text-slate-600 font-mono scale-90 shadow-sm">
                      ESCANEAR CLINICO
                    </span>
                  </div>

                  {/* Vehicle context sticker lines */}
                  <div className="w-full space-y-1.5 text-left text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Propietario:</span>
                      <strong className="font-bold text-slate-900 truncate pl-4 max-w-[150px]">
                        {selectedQRVehicle.cliente.nombre}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Máquina:</span>
                      <strong className="font-bold text-slate-900">
                        {selectedQRVehicle.marca} {selectedQRVehicle.modelo}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 border-t pt-1 border-slate-200">
                      <span>Próximo Servicio:</span>
                      <strong className="font-extrabold text-emerald-600">
                        {calculatePredictiveCRM(selectedQRVehicle, findMaint(selectedQRVehicle.id)).nextServiceDateStr}
                      </strong>
                    </div>
                  </div>

                  {/* Instructions Footer */}
                  <div className="w-full text-center text-[8px] text-slate-450 border-t pt-3 border-dashed border-slate-200">
                    Pegar en el margen superior del parabrisas del auto.
                    <br />
                    <span>Soporte CQ Motors &bull; Historial Médico QR</span>
                  </div>
                </div>

                {/* Print instructions no-print section */}
                <div className="text-slate-500 text-xs text-left leading-relaxed space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 no-print">
                  <p className="font-bold text-slate-800">¿Cómo funciona la fidelización por QR?</p>
                  <p>
                    1. Imprima este sticker y péguelo en una zona visible (frecuentemente el vidrio frontal).
                  </p>
                  <p>
                    2. Cuando el cliente escanea el código, accede directamente a su bitácora digital de mantenimiento y fotos de evidencia sin contraseñas engorrosas.
                  </p>
                </div>

                {/* Print layout buttons actions no-print */}
                <div className="flex items-center space-x-3 w-full no-print">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-3 bg-slate-900 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Imprimir Sticker</span>
                  </button>
                  <button
                    onClick={() => setSelectedQRVehicle(null)}
                    className="px-5 py-3 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-sm rounded-xl transition-all cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE BITACORA / VEHICLE MODAL */}
      <AnimatePresence>
        {vehicleToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                    <Trash2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-display">
                      Eliminar Bitácora de Patio
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Placa: {vehicleToDelete.placa} ({vehicleToDelete.marca} {vehicleToDelete.modelo})
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-900 leading-relaxed">
                  ¿Está seguro de eliminar esta hoja de control de patio y bitácora histórica? Esta acción borrará el registro del vehículo, su historial de mantenimiento y no se puede deshacer.
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setVehicleToDelete(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={async () => {
                      if (!onDeleteVehicle) return;
                      setIsDeleting(true);
                      try {
                        await onDeleteVehicle(vehicleToDelete.id);
                        setVehicleToDelete(null);
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                    className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{isDeleting ? "Eliminando..." : "Sí, Eliminar Bitácora"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  // Helper search list mapping
  function findMaint(velId: string) {
    return maintenances.filter(m => m.vehiculoId === velId);
  }
}

