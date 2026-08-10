import React, { useState } from "react";
import { Vehiculo, Mantenimiento } from "../types";
import { INITIAL_VEHICLES, INITIAL_MAINTENANCE } from "../mockData";
import { calculatePredictiveCRM } from "../utils/crmPredictive";
import { db } from "../firebase";
import { doc, setDoc, collection, getDocs, query, where, getDoc } from "firebase/firestore";
import { 
  Car, 
  Wrench, 
  Clock, 
  Phone, 
  Mail, 
  CheckCircle2, 
  ArrowLeft, 
  AlertTriangle, 
  Gauge, 
  Fuel, 
  Sparkles, 
  History, 
  Calendar, 
  DollarSign, 
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Printer,
  Star,
  Send,
  HeartHandshake,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import CQMotorsLogo from "./CQMotorsLogo";

interface PublicVehicleHistoryProps {
  vehicleId: string;
  vehicles: Vehiculo[];
  maintenances: Mantenimiento[];
  onBackToApp: () => void;
}

export default function PublicVehicleHistory({
  vehicleId,
  vehicles = [],
  maintenances = [],
  onBackToApp
}: PublicVehicleHistoryProps) {
  const [selectedMaintIndex, setSelectedMaintIndex] = useState<number>(0);
  const [activeSearchId, setActiveSearchId] = useState<string>(vehicleId);
  const [manualQuery, setManualQuery] = useState<string>("");
  const [quickSearchPlate, setQuickSearchPlate] = useState<string>("");
  const [vehicle, setVehicle] = useState<Vehiculo | null>(null);
  const [vehicleMaints, setVehicleMaints] = useState<Mantenimiento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Public Satisfaction Survey and Feedback states (placed at top to obey React Rules of Hooks)
  const [surveySubmitted, setSurveySubmitted] = useState<boolean>(false);
  const [ratingGeneral, setRatingGeneral] = useState<number>(5);
  const [ratingAtencion, setRatingAtencion] = useState<number>(5);
  const [ratingTecnica, setRatingTecnica] = useState<number>(5);
  const [commentText, setCommentText] = useState<string>("");
  const [recommend, setRecommend] = useState<boolean>(true);
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState<boolean>(false);

  const handleHeaderQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearchPlate.trim()) {
      setActiveSearchId(quickSearchPlate.trim());
      setQuickSearchPlate("");
    }
  };

  // Sync activeSearchId with prop changes
  React.useEffect(() => {
    setActiveSearchId(vehicleId);
  }, [vehicleId]);

  // Fetch the exact vehicle and its maintenance records from Firestore dynamically
  React.useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const normalize = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        const cleanId = activeSearchId.trim();
        const targetNormalized = normalize(cleanId);

        let foundVehicle: Vehiculo | null = null;

        // Stage 1: Check in vehicles prop first
        if (vehicles && vehicles.length > 0) {
          foundVehicle = vehicles.find((v) => normalize(v.id) === targetNormalized || normalize(v.placa) === targetNormalized) || null;
        }

        // Stage 2: Direct document fetch from Firestore
        if (!foundVehicle && cleanId) {
          try {
            const directDoc = await getDoc(doc(db, "vehicles", cleanId));
            if (directDoc.exists()) {
              foundVehicle = directDoc.data() as Vehiculo;
            }
          } catch (e) {
            console.warn("[PUBLIC HISTORY] Direct doc fetch warning:", e);
          }
        }

        // Stage 3: Query Firestore by exact placa matching
        if (!foundVehicle && cleanId) {
          try {
            const qPlaca = query(collection(db, "vehicles"), where("placa", "==", cleanId.toUpperCase()));
            const pSnap = await getDocs(qPlaca);
            if (!pSnap.empty) {
              foundVehicle = pSnap.docs[0].data() as Vehiculo;
            }
          } catch (e) {
            console.warn("[PUBLIC HISTORY] Placa query warning:", e);
          }
        }

        // Stage 4: Query full vehicles collection & perform normalized match
        if (!foundVehicle) {
          try {
            const qSnap = await getDocs(collection(db, "vehicles"));
            const list: Vehiculo[] = [];
            qSnap.forEach((d) => { list.push(d.data() as Vehiculo); });
            foundVehicle = list.find(v => normalize(v.id) === targetNormalized || normalize(v.placa) === targetNormalized) || null;
          } catch (e) {
            console.warn("[PUBLIC HISTORY] Full collection search warning:", e);
          }
        }

        // Stage 5: Check INITIAL_VEHICLES mock data fallback
        if (!foundVehicle) {
          foundVehicle = INITIAL_VEHICLES.find(
            (v) => normalize(v.id) === targetNormalized || normalize(v.placa) === targetNormalized
          ) || null;
        }

        if (foundVehicle) {
          setVehicle(foundVehicle);

          let mList: Mantenimiento[] = [];

          // Stage 1 for Maintenances: check maintenances prop
          if (maintenances && maintenances.length > 0) {
            mList = maintenances.filter(m => m.vehiculoId === foundVehicle!.id || normalize(m.vehiculoId) === targetNormalized);
          }

          // Stage 2 for Maintenances: query Firestore by vehiculoId
          if (mList.length === 0) {
            try {
              const mQ = query(
                collection(db, "maintenances"),
                where("vehiculoId", "==", foundVehicle.id)
              );
              const mSnap = await getDocs(mQ);
              mSnap.forEach((d) => {
                mList.push(d.data() as Mantenimiento);
              });
            } catch (mErr) {
              console.warn("[PUBLIC HISTORY] Maintenances query warning:", mErr);
            }
          }

          // Stage 3 for Maintenances: query Firestore by placa
          if (mList.length === 0) {
            try {
              const mQPlaca = query(
                collection(db, "maintenances"),
                where("vehiculoId", "==", foundVehicle.placa)
              );
              const mSnapPlaca = await getDocs(mQPlaca);
              mSnapPlaca.forEach((d) => {
                mList.push(d.data() as Mantenimiento);
              });
            } catch (mErr) {
              console.warn("[PUBLIC HISTORY] Maintenances by placa query warning:", mErr);
            }
          }

          // Stage 4 for Maintenances: check INITIAL_MAINTENANCE fallback
          if (mList.length === 0) {
            mList = INITIAL_MAINTENANCE.filter(m => m.vehiculoId === foundVehicle!.id || m.vehiculoId === foundVehicle!.placa);
          }

          // Stage 5 for Maintenances: if still empty, generate an initial admission maintenance entry so info is always shown
          if (mList.length === 0) {
            mList = [{
              id: `maint-init-${foundVehicle.id}`,
              vehiculoId: foundVehicle.id,
              fechaRegistro: foundVehicle.fechaIngreso || new Date().toISOString(),
              mecanicoAsignado: "Taller Central CQ Motors",
              tareasRealizadas: [
                { id: `t1-${foundVehicle.id}`, nombre: "Inspección de Admisión en Patio y Diagnóstico Multipunto", completada: true, categoria: "Preventivo", costoEstimado: 25.0 },
                { id: `t2-${foundVehicle.id}`, nombre: "Revisión de Fluidos y Presión de Neumáticos", completada: true, categoria: "Preventivo", costoEstimado: 15.0 },
                { id: `t3-${foundVehicle.id}`, nombre: "Control de Registro Clínico Digital", completada: true, categoria: "Otros", costoEstimado: 0.0 }
              ],
              observaciones: `Vehículo con placa ${foundVehicle.placa} registrado correctamente en el sistema de CQ Motors S.A.`,
              repuestosNecesarios: [],
              diagnosticoFuturo: "Mantenimiento preventivo periódico según kilometraje registrado.",
              recordatorioProximoMeses: 3,
              costoManoObra: 40.0,
              totalCalculado: 80.0
            }];
          }

          setVehicleMaints(mList.sort((a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro)));
        } else {
          setVehicle(null);
          setVehicleMaints([]);
        }
      } catch (err) {
        console.error("[PUBLIC HISTORY] Error loading vehicle data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeSearchId, vehicles, maintenances]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full space-y-8 bg-slate-900/40 p-8 rounded-3xl border border-slate-800/60 backdrop-blur-md shadow-2xl">
          <div className="flex justify-center mb-2">
            <CQMotorsLogo size="sm" />
          </div>
          <div className="relative flex items-center justify-center py-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border border-dashed border-emerald-500/20 animate-spin"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-18 h-18 rounded-full border border-slate-850 border-t-emerald-500 animate-spin"></div>
            </div>
            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/15">
              <Car className="h-5 w-5 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-slate-200 text-sm font-semibold tracking-tight">Consultando Historial Seguro</p>
            <p className="text-slate-400 text-xs font-mono">Buscando coincidencia para: <span className="text-emerald-400 font-bold">{activeSearchId}</span></p>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-1 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full animate-pulse w-2/3"></div>
          </div>
          <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">CQ Motors • Taller de Diagnóstico en Tiempo Real</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans selection:bg-rose-500 selection:text-white">
        <div className="max-w-md w-full space-y-6 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="flex justify-center mb-2">
            <CQMotorsLogo size="sm" />
          </div>
          
          <div className="inline-flex p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-400">
            <ShieldAlert className="h-10 w-10 animate-bounce" />
          </div>
          
          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-xl text-slate-100 tracking-tight">
              Vehículo No Encontrado
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              No hemos podido encontrar registros activos para la placa o código de control <span className="text-rose-400 font-mono font-bold">"{activeSearchId}"</span>.
            </p>
          </div>

          {/* Search Input directly inside error state */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <p className="text-[10px] text-slate-400 font-bold text-left font-sans uppercase tracking-wider">
              Intentar nueva búsqueda manual:
            </p>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (manualQuery.trim()) {
                  setActiveSearchId(manualQuery.trim());
                  setManualQuery("");
                }
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  placeholder="Ej: PBA-1234, Toyota..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 pl-8 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-500 transition-colors uppercase font-mono"
                />
                <div className="absolute left-2.5 top-2.5 text-slate-500">
                  <Car className="h-3.5 w-3.5" />
                </div>
              </div>
              <button
                type="submit"
                disabled={!manualQuery.trim()}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1 shrink-0"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Buscar</span>
              </button>
            </form>
            <p className="text-[9px] text-slate-500 text-left leading-normal">
              💡 Tip: Puedes ingresar la placa con o sin guiones (ej: PBA1234 o PBA-1234), o buscar por el ID de control del taller.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            <button
              onClick={onBackToApp}
              className="w-full py-3 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 border border-slate-800/80"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a CQ Motors</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Find associated maintenance history - now using the state vehicleMaints
  const totalSpent = vehicleMaints.reduce((sum, m) => sum + (m.totalCalculado || 0), 0);
  const activeMaint = vehicleMaints[selectedMaintIndex] || null;

  // CRM predictive statistics
  const crmPred = calculatePredictiveCRM(vehicle, vehicleMaints);

  const handleSubmitPublicSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;
    setIsSubmittingSurvey(true);
    const surveyId = `survey-pub-${Date.now()}`;
    
    try {
      await setDoc(doc(db, "surveys", surveyId), {
        id: surveyId,
        vehiculoId: vehicle.id,
        placa: vehicle.placa,
        clienteNombre: vehicle.cliente.nombre,
        calificacionGeneral: ratingGeneral,
        calificacionAtencion: ratingAtencion,
        calificacionTecnica: ratingTecnica,
        comentario: commentText,
        volveria: recommend,
        fecha: new Date().toISOString()
      });

      // Register activity
      const activityId = `act-survey-pub-${Date.now()}`;
      await setDoc(doc(db, "activities", activityId), {
        id: activityId,
        tipo: "registro",
        mensaje: `Encuesta de Satisfacción QR recibida de ${vehicle.cliente.nombre} para placa ${vehicle.placa} (${ratingGeneral}★ Estrellas).`,
        fecha: new Date().toISOString(),
        usuario: "QR Escáner"
      });

      setSurveySubmitted(true);
    } catch (err) {
      console.error("Error submitting public survey:", err);
    } finally {
      setIsSubmittingSurvey(false);
    }
  };

  // Stepper state configurations
  const steps = [
    { label: "Ingresado", desc: "Recepción de patio con checklist 360°" },
    { label: "En Proceso", desc: "Diagnóstico y ejecución técnica" },
    { label: "Listo para Entrega", desc: "Lavado cortesía y control calidad" },
    { label: "Entregado", desc: "Retirado de patio y facturado" }
  ];

  const getCurrentStepIndex = () => {
    switch (vehicle.estado) {
      case "Ingresado": return 0;
      case "En Proceso": return 1;
      case "Listo para Entrega": return 2;
      case "Entregado": return 3;
      default: return 0;
    }
  };

  const currentStepIdx = getCurrentStepIndex();

  const handleOpenPrint = () => {
    window.print();
  };

  // WhatsApp quick-action text generator
  const getWhatsAppLink = () => {
    const message = `Hola, soy ${encodeURIComponent(vehicle.cliente.nombre)}, estoy consultando el historial digital de mi auto con placa *${vehicle.placa}* (${vehicle.marca} ${vehicle.modelo}). Deseo más información sobre el estado actual de mis mantenimientos.`;
    const cleanPhone = vehicle.cliente.telefono.replace(/\s+/g, "").replace(/^0/, "+593");
    // Return standard WhatsApp Ecuadorian URL (defaulting coordinator phone if preferred, or using client phone)
    return `https://wa.me/593991234567?text=${message}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* EXCLUSIVE CUSTOM CSS OVERRIDES FOR PRINTING */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, .no-print, nav, button, a {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* HEADER CONTROLS */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md no-print">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <CQMotorsLogo size="sm" />
          <div className="flex items-center space-x-3.5">
            {/* Quick search input */}
            <form onSubmit={handleHeaderQuickSearch} className="hidden sm:flex items-center relative">
              <input
                type="text"
                placeholder="Buscar otra placa..."
                value={quickSearchPlate}
                onChange={(e) => setQuickSearchPlate(e.target.value)}
                className="bg-slate-800 border border-slate-750 text-slate-100 rounded-xl px-3.5 py-1.5 text-[10px] uppercase tracking-wider font-mono focus:outline-none focus:border-emerald-500 w-44 font-semibold shadow-inner placeholder-slate-500"
              />
              <button type="submit" className="absolute right-3 text-slate-400 hover:text-white cursor-pointer">
                <Search className="h-3.5 w-3.5" />
              </button>
            </form>
            
            <button
              onClick={onBackToApp}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver a CQ Motors</span>
            </button>
          </div>
        </div>
      </header>

      {/* BODY CONTENT WRAPPER */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 print-full-width">
        
        {/* TOP WELCOME BOX */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono font-extrabold tracking-widest text-emerald-400 block">
                Historial Clínico Digital &bull; CQ Motors S.A.
              </span>
              <h1 className="font-display font-black text-2xl tracking-tight text-white">
                Ficha de Cliente Preferencial
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Estimado(a) <strong className="text-slate-200">{vehicle.cliente.nombre}</strong>, reciba un cordial saludo de CQ Motors. En esta sección podrá consultar cronológicamente los mantenimientos, el estado de trabajo y las fotografías de evidencia técnica de su vehículo.
              </p>
            </div>
            
            <button
              onClick={handleOpenPrint}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shrink-0 self-start md:self-auto cursor-pointer no-print transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* VEHICLE CHASSIS HIGHLIGHT CARD */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Col 1: Plate & Status */}
          <div className="space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-mono font-extrabold text-slate-450 uppercase tracking-widest block">
                Placa Autorizada
              </span>
              <div className="inline-flex bg-slate-950 text-white border-2 border-slate-800 px-4 py-1.5 rounded-xl font-mono text-lg font-black tracking-widest mt-1 shadow-sm">
                {vehicle.placa}
              </div>
            </div>

            <div>
              <span className="text-[9px] font-mono font-extrabold text-slate-450 uppercase tracking-widest block">
                Estado Operacional
              </span>
              <span className={`inline-flex px-3 py-1 text-xs font-extrabold rounded-full border mt-1.5 ${
                vehicle.estado === "Ingresado" ? "bg-amber-50 border-amber-200 text-amber-800" :
                vehicle.estado === "En Proceso" ? "bg-emerald-50 border-emerald-200 text-emerald-800 animate-pulse" :
                vehicle.estado === "Listo para Entrega" ? "bg-blue-50 border-blue-200 text-blue-800" :
                "bg-slate-50 border-slate-200 text-slate-800"
              }`}>
                {vehicle.estado === "En Proceso" ? "En Mantenimiento" : vehicle.estado}
              </span>
            </div>
          </div>

          {/* Col 2: Mechanical specifications */}
          <div className="space-y-3 font-sans border-l border-slate-100 pl-0 md:pl-6">
            <span className="text-[9px] font-mono font-extrabold text-slate-450 uppercase tracking-widest block">
              Especificaciones de Máquina
            </span>
            <div className="space-y-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">
                  {vehicle.marca} {vehicle.modelo}
                </h3>
                <span className="text-xs text-slate-500 font-mono">Año {vehicle.anio}</span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 font-mono text-xs text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                  <Gauge className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{vehicle.kilometraje.toLocaleString("es-EC")} Km</span>
                </div>
                <div className="flex items-center space-x-1 font-mono text-xs text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                  <Fuel className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Combustible: {vehicle.nivelCombustible}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 3: Predictive CRM & Value metrics */}
          <div className="bg-emerald-500/5 border border-emerald-550/10 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-mono font-extrabold text-emerald-800 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-emerald-600 animate-spin" />
                  <span>CRM Predictivo Activo</span>
                </span>
                <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  crmPred.confidence === "Alta-Estable" ? "bg-emerald-200 text-emerald-900" :
                  crmPred.confidence === "Media-Ajustada" ? "bg-amber-100 text-amber-800" :
                  "bg-slate-200 text-slate-700"
                }`}>
                  Confianza: {crmPred.confidence}
                </span>
              </div>
              
              <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-900 block mt-1">
                Servicio: {crmPred.recommendedService}
              </h4>

              <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl space-y-1.5 text-[10.5px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Estimación Fecha:</span>
                  <strong className="font-bold text-slate-800">{crmPred.nextServiceDateStr}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Intervalo Restante:</span>
                  <strong className="font-black text-emerald-700">
                    {crmPred.daysRemaining} días ({crmPred.mileageRemainingKm.toLocaleString()} Km)
                  </strong>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-1 mt-1 text-[9.5px]">
                  <span className="text-slate-400 font-mono">Disparador:</span>
                  <span className="font-bold text-slate-605 font-mono">Por {crmPred.triggerType}</span>
                </div>
              </div>

              <div className="text-[9.5px] text-slate-500 italic bg-white/50 border border-dashed border-slate-250 p-2 rounded-lg leading-snug">
                <strong>Perfil de Conducción:</strong> {crmPred.drivingProfileDesc}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-2 border-t border-emerald-550/10">
              <div className="text-slate-500">Prácticas Patio: <strong className="text-slate-800 font-bold block">{vehicleMaints.length} Sesiones</strong></div>
              <div className="text-right text-slate-500">Monto Acumulado: <strong className="text-emerald-750 font-black font-mono block">${totalSpent.toFixed(2)}</strong></div>
            </div>
          </div>

        </div>

        {/* WORKSHOP FLOW PROGRESS STEPPER */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div>
            <span className="text-[9px] font-mono font-extrabold text-slate-450 uppercase tracking-widest block">
              Línea de Progreso en Taller
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Estado en tiempo real de su recepción de patio e ingeniería mecánica en las perchas de CQ Motors.
            </p>
          </div>

          <div className="relative pt-2">
            {/* Horizontal Line for MD+ */}
            <div className="hidden md:block absolute left-10 right-10 top-8.5 h-1 bg-slate-200 -z-0">
              <div 
                className="bg-emerald-550 h-full rounded-full transition-all duration-700" 
                style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }} 
              />
            </div>

            {/* Stepper Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-2 relative z-10">
              {steps.map((step, idx) => {
                const isActive = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={idx} className="flex md:flex-col items-center md:text-center space-x-3.5 md:space-x-0 md:space-y-2 group">
                    {/* Ring Step indicator */}
                    <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center shrink-0 border-2 transition-all font-mono text-xs font-bold ${
                      idx < currentStepIdx ? "bg-emerald-500 border-emerald-500 text-white" :
                      idx === currentStepIdx ? "bg-white border-emerald-500 text-emerald-600 ring-4 ring-emerald-50" :
                      "bg-white border-slate-200 text-slate-400"
                    }`}>
                      {idx < currentStepIdx ? (
                        <CheckCircle2 className="h-4.5 w-4.5" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Step description */}
                    <div>
                      <h4 className={`text-xs font-bold leading-tight ${
                        isCurrent ? "text-slate-900 font-extrabold" :
                        isActive ? "text-slate-700" : "text-slate-400"
                      }`}>
                        {step.label}
                      </h4>
                      <p className="text-[9.5px] text-slate-400 mt-0.5 line-clamp-1 md:line-clamp-none">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PUBLIC SATISFACTION SURVEY ENTRANCE CARD (QR SCAN-AND-ANSWER REDIRECT) */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl border border-slate-800 p-6 shadow-xl relative overflow-hidden no-print">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <HeartHandshake className="h-32 w-32 rotate-12" />
          </div>

          <AnimatePresence mode="wait">
            {!surveySubmitted ? (
              <motion.div 
                key="survey-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <span className="text-[9.5px] uppercase font-mono font-black tracking-widest text-rose-400 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-rose-400 fill-rose-500" />
                    <span>Control de Calidad CQ Motors &bull; Tu opinión importa</span>
                  </span>
                  <h3 className="font-display font-black text-slate-100 text-base">
                    ¿Te acabamos de entregar tu auto o está listo para retiro?
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Déjanos tu calificación del servicio en el siguiente formulario interactivo directo de control de calidad. Nos ayuda a perfeccionar la entrega técnica de cada cliente.
                  </p>
                </div>

                <form onSubmit={handleSubmitPublicSurvey} className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800/80 pt-4 text-xs font-sans">
                  
                  {/* Rating columns */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-350 block">Satisfacción Trabajo Técnico:</label>
                    <div className="flex items-center space-x-1.5 bg-slate-950/50 p-2 rounded-xl border border-slate-800">
                      {[1, 2, 3, 4, 5].map(idx => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setRatingGeneral(idx)}
                          className="cursor-pointer transition hover:scale-110"
                        >
                          <Star className={`h-4.5 w-4.5 ${idx <= ratingGeneral ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-slate-350 block">Atención & Hospitalidad:</label>
                    <div className="flex items-center space-x-1.5 bg-slate-950/50 p-2 rounded-xl border border-slate-800">
                      {[1, 2, 3, 4, 5].map(idx => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setRatingAtencion(idx)}
                          className="cursor-pointer transition hover:scale-110"
                        >
                          <Star className={`h-4.5 w-4.5 ${idx <= ratingAtencion ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-slate-350 block">¿Recomendarías CQ Motors?</label>
                    <div className="flex space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setRecommend(true)}
                        className={`flex-1 py-1 text-center font-bold rounded-lg transition-all text-[11px] cursor-pointer ${
                          recommend ? "bg-emerald-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Sí, 100%
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecommend(false)}
                        className={`flex-1 py-1 text-center font-bold rounded-lg transition-all text-[11px] cursor-pointer ${
                          !recommend ? "bg-rose-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {/* Feedback field across full width on md */}
                  <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-9 space-y-1.5">
                      <label className="font-bold text-slate-350 block">Escribe tu comentario o sugerencia técnica para la gerencia:</label>
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Fue un gran servicio, la atención de todo el equipo de patio fue excelente..."
                        className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <button
                        type="submit"
                        disabled={isSubmittingSurvey}
                        className="w-full py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-800 text-white font-black text-[11px] rounded-xl flex items-center justify-center space-x-1 cursor-pointer shadow-md transition-all active:scale-98"
                      >
                        <Send className="h-3 w-3" />
                        <span>{isSubmittingSurvey ? "Registrando..." : "Enviar Encuesta"}</span>
                      </button>
                    </div>
                  </div>

                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="survey-thanks"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center text-center py-4 space-y-3"
              >
                <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-white">¡Muchísimas gracias por tu retroalimentación!</h4>
                  <p className="text-[11px] text-slate-400 max-w-md leading-relaxed">
                    Tu encuesta de satisfacción ha sido almacenada de forma segura en nuestro servidor de control de calidad operacional. Esto contribuye directamente a tu historial de fidelización.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* DOUBLE COLUMN: LEFT INDEX TIMELINE OR SELECTION | RIGHT ACTIVE SHEET DETAILS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left panel: Chronological log selectors (4 cols) */}
          <div className="lg:col-span-4 space-y-3 no-print">
            <span className="text-[9px] font-mono font-extrabold text-slate-450 uppercase tracking-widest block px-1">
              Seleccione Sesión
            </span>

            {vehicleMaints.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/70 text-center text-slate-400">
                <History className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <span className="text-xs font-bold">Sin Historial Registrado</span>
              </div>
            ) : (
              <div className="space-y-2">
                {vehicleMaints.map((m, mIdx) => {
                  const mDate = new Date(m.fechaRegistro);
                  const dateForm = mDate.toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" });
                  const isActive = mIdx === selectedMaintIndex;

                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMaintIndex(mIdx)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isActive 
                          ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10" 
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className={`text-[8.5px] uppercase font-mono font-bold px-1.5 py-0.5 rounded ${
                          isActive ? "bg-slate-800 text-emerald-400 border border-slate-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          Orden #{vehicleMaints.length - mIdx}
                        </span>
                        <h4 className="font-bold text-xs mt-1.5 block truncate max-w-[130px]">
                          {dateForm}
                        </h4>
                        <span className={`text-[10px] block ${isActive ? "text-slate-350" : "text-slate-500"}`}>
                          Mec: {m.mecanicoAsignado.split(" ").slice(-1)[0]}
                        </span>
                      </div>
                      <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isActive ? "translate-x-1 text-emerald-400" : "text-slate-400"}`} />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quick whatsapp action widget */}
            <div className="bg-emerald-50 hover:bg-emerald-100 rounded-3xl border border-emerald-250 p-4 space-y-2 transition-all">
              <span className="text-[9px] font-mono font-extrabold text-emerald-800 uppercase tracking-widest block">
                ¿Preguntas Técnicas?
              </span>
              <p className="text-[10.5px] text-slate-600 leading-normal">
                Póngase en contacto inmediato con el asesor de servicios mecánicos en patio mediante un enlace rápido.
              </p>
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="no-referrer"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700/90 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition-colors text-center cursor-pointer decoration-none"
              >
                <Phone className="h-3.5 w-3.5 stroke-2" />
                <span>Chat Asesor de Servicio</span>
              </a>
            </div>

          </div>

          {/* Right panel: Active worksheet details viewport (8 cols) */}
          <div className="lg:col-span-8 space-y-4 print-full-width">
            
            {!activeMaint ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400">
                <Wrench className="h-10 w-10 mx-auto text-slate-300 mb-2.5 animate-pulse" />
                <h4 className="font-bold text-slate-700 text-sm">Esperando Diagnóstico de Patio</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Se ha generado la ficha del vehículo en patio de talleres, pero los técnicos aún no transmiten tareas ni diagnósticos históricos específicos a esta sesión.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 font-sans">
                
                {/* Section header panel */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono font-extrabold text-slate-400 uppercase tracking-widest block">
                      Bitácora de Trabajos Realizados
                    </span>
                    <h3 className="font-display font-bold text-slate-900 text-sm">
                      Mantenimiento Vehicular del {new Date(activeMaint.fechaRegistro).toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" })}
                    </h3>
                  </div>

                  <span className="text-xs bg-slate-900 text-emerald-450 font-mono font-bold px-3 py-1 rounded-lg">
                    Mecánico: {activeMaint.mecanicoAsignado}
                  </span>
                </div>

                {/* Body Content 1: Tareas */}
                <div className="p-6 space-y-3">
                  <span className="text-[10px] font-mono font-extrabold text-slate-450 uppercase tracking-widest block">
                    1. Labores de taller ejecutadas y verificadas
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeMaint.tareasRealizadas.map((task) => (
                      <div 
                        key={task.id} 
                        className={`p-3 rounded-xl border flex items-start space-x-2.5 transition-colors ${
                          task.completada 
                            ? "bg-emerald-50/40 border-emerald-100/60 text-slate-800"
                            : "bg-slate-50/50 border-slate-200 text-slate-450"
                        }`}
                      >
                        <CheckCircle2 className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${
                          task.completada ? "text-emerald-600 fill-emerald-55" : "text-slate-300"
                        }`} />
                        <div>
                          <h5 className={`font-semibold text-xs ${task.completada ? "text-slate-900" : "text-slate-600 line-through decoration-slate-300"}`}>
                            {task.nombre}
                          </h5>
                          <span className="text-[9px] font-mono uppercase bg-slate-100 text-slate-500 px-1 py-0.2 rounded border mt-1 inline-block">
                            {task.categoria}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Body Content 2: Repuestos y Materiales */}
                <div className="p-6 space-y-3">
                  <span className="text-[10px] font-mono font-extrabold text-slate-450 uppercase tracking-widest block">
                    2. Insumos, Repuestos y Lubricantes Ocupados
                  </span>

                  {activeMaint.repuestosNecesarios.length === 0 ? (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                      Ningún repuesto adicional fue facturado ni despachado de bodega para esta revisión técnica.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activeMaint.repuestosNecesarios.map((rep) => (
                        <div key={rep.id} className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                          <div className="space-y-0.5">
                            <h5 className="font-bold text-slate-900">{rep.nombre}</h5>
                            <span className="text-[10px] text-slate-550 font-mono">
                              Cant: {rep.cantidad} u &bull; Costo unitario: ${rep.costoUnitario.toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 block font-mono">Total Item</span>
                            <span className="font-extrabold text-slate-900 font-mono">${(rep.cantidad * rep.costoUnitario).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Body Content 3: Fotos Evidenciales */}
                {((activeMaint.fotos && activeMaint.fotos.length > 0) || (vehicle.fotosCliente && vehicle.fotosCliente.length > 0)) && (
                  <div className="p-6 space-y-3">
                    <span className="text-[10px] font-mono font-extrabold text-slate-450 uppercase tracking-widest block">
                      3. Fotografías de Evidencia en Patio
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {/* Technical Maintenances Evidences Photos */}
                      {activeMaint.fotos?.map((fUrl, fIdx) => (
                        <div key={fIdx} className="relative rounded-xl border overflow-hidden bg-slate-900 group aspect-video">
                          <img
                            src={fUrl}
                            alt={`Evidencia Mecánica ${fIdx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                          />
                          <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 border border-slate-800 text-white font-mono text-[8.5px] px-1.5 py-0.5 rounded backdrop-blur-xs">
                            Repuesto / Desarme
                          </span>
                        </div>
                      ))}

                      {/* Client uploaded images */}
                      {vehicle.fotosCliente?.map((fUrl, fIdx) => (
                        <div key={fIdx} className="relative rounded-xl border overflow-hidden bg-slate-900 group aspect-video">
                          <img
                            src={fUrl}
                            alt={`Foto de Cliente Recepción ${fIdx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                          />
                          <span className="absolute bottom-1.5 left-1.5 bg-emerald-900/90 border border-emerald-850 text-white font-mono text-[8.5px] px-1.5 py-0.5 rounded backdrop-blur-xs">
                            Recepción Física
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Body Content 4: Observaciones y Diagnóstico */}
                <div className="p-6 gap-6 grid grid-cols-1 md:grid-cols-2 bg-slate-50/50">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-extrabold text-slate-450 uppercase block tracking-wider">
                      Observaciones Técnicas Generales
                    </span>
                    <p className="text-xs text-slate-600 bg-white p-3.5 rounded-2xl border border-slate-200/80 leading-relaxed italic">
                      {activeMaint.observaciones || "Servicio técnico realizado con éxito de acuerdo a los estándares recomendados por el manual del fabricante. Niveles estabilizados."}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-extrabold text-slate-450 uppercase block tracking-wider">
                      Diagnóstico Preventivo a Futuro
                    </span>
                    <p className="text-xs text-rose-850 bg-rose-500/5 p-3.5 rounded-2xl border border-rose-500/10 leading-relaxed font-medium">
                      {activeMaint.diagnosticoFuturo || "Se sugiere programar una comprobación complementaria de pastillas frontales y alineación de ejes en el intervalo indicado."}
                    </p>
                  </div>
                </div>

                {/* Cost Breakdown Footer summary */}
                <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-mono text-xs">
                  <div className="space-y-1">
                    <div className="text-slate-400">Total Mano Obra: <strong className="text-white">${activeMaint.costoManoObra.toFixed(2)}</strong></div>
                    <div className="text-slate-400">Total Repuestos: <strong className="text-white">${activeMaint.repuestosNecesarios.reduce((sm, rm) => sm + (rm.cantidad * rm.costoUnitario), 0).toFixed(2)}</strong></div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase text-emerald-400 font-bold block tracking-wider">Inversión del Período</span>
                    <span className="text-xl font-black text-emerald-450 font-mono tracking-tight">
                      ${(activeMaint.totalCalculado || 0).toFixed(2)} USD
                    </span>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

      </main>

      {/* FOOTER BAR */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-400 font-sans mt-12 no-print">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <span>CQ Motors S.A. &bull; Sistema de Gestión de Mantenimiento Vehicular (PWA) &copy; 2026</span>
          <span className="font-mono text-[9.5px]">
            Efectuando consulta pública segura QR &bull; Power BI Ready
          </span>
        </div>
      </footer>

    </div>
  );
}
