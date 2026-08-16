import React, { useState, useMemo } from "react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { Vehiculo, Mantenimiento, UserRole, EncuestaSatisfaccion, CanjePremio, LoyaltyState } from "../types";
import { db } from "../firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { 
  Award, 
  Sparkles, 
  PartyPopper, 
  CheckCircle2, 
  Star, 
  Gift, 
  HeartHandshake, 
  TrendingUp, 
  Barcode, 
  Ticket, 
  MessageSquareHeart, 
  Plus, 
  Send,
  Users,
  Search,
  Check,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "./Toast";

interface LoyaltyRewardsCenterProps {
  vehicles: Vehiculo[];
  maintenances: Mantenimiento[];
  surveys: EncuestaSatisfaccion[];
  redemptions: CanjePremio[];
  userRole: UserRole;
  clienteId?: string; // Linked client ID if current user is Cliente
  clienteNombre?: string;
  onRefreshRedemptions?: () => void;
  onRefreshSurveys?: () => void;
}

// Fixed catalog of rewards that clients can redeem
const REWARDS_CATALOG = [
  {
    id: "prem-1",
    nombre: "Lavado Express & Aspirado Pro",
    puntosRequeridos: 100,
    descripcion: "Lavado de carrocería premium con shampoo encerador y aspirado detallado de todo el habitáculo.",
    categoria: "Limpieza",
    color: "from-cyan-500 to-blue-500"
  },
  {
    id: "prem-2",
    nombre: "Líquido de Frenos Bosch DOT4",
    puntosRequeridos: 150,
    descripcion: "Envase de 500ml de líquido de frenos Bosch sellada e instalación con purgado de cortesía.",
    categoria: "Insumo",
    color: "from-amber-500 to-orange-500"
  },
  {
    id: "prem-3",
    nombre: "Filtro de Aire Motor Gratis",
    puntosRequeridos: 250,
    descripcion: "Filtro de aire de alta duración adecuado para la cilindrada y modelo de su vehículo.",
    categoria: "Repuestos",
    color: "from-indigo-500 to-purple-500"
  },
  {
    id: "prem-4",
    nombre: "Alineación y Balanceo Computarizado",
    puntosRequeridos: 350,
    descripcion: "Ajuste de ángulos de dirección en las 4 ruedas mediante sensores láser para garantizar un desgaste uniforme.",
    categoria: "Servicio",
    color: "from-emerald-500 to-teal-500"
  },
  {
    id: "prem-5",
    nombre: "Kit Cambio Aceite 10W40 Mobil 1",
    puntosRequeridos: 600,
    descripcion: "Galón completo de aceite sintético Mobil 1 Premium más filtro original y mano de obra sin recargo.",
    categoria: "Mantenimiento VIP",
    color: "from-rose-500 to-red-500"
  }
];

export default function LoyaltyRewardsCenter({
  vehicles,
  maintenances,
  surveys,
  redemptions,
  userRole,
  clienteId,
  clienteNombre
}: LoyaltyRewardsCenterProps) {
  const { showSuccess, showError, showInfo } = useToast();
  
  // Interactive client state
  const isCliente = userRole === UserRole.Cliente;
  const [selectedVehicleForSurvey, setSelectedVehicleForSurvey] = useState<Vehiculo | null>(null);
  const [selectedRedemptionSlip, setSelectedRedemptionSlip] = useState<CanjePremio | null>(null);
  
  // Search state for administrators
  const [adminSearch, setAdminSearch] = useState("");
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<"ranking" | "surveys" | "redemptions" | "stats">("stats");

  // Survey Form States
  const [ratingGeneral, setRatingGeneral] = useState<number>(5);
  const [ratingAtencion, setRatingAtencion] = useState<number>(5);
  const [ratingTecnico, setRatingTecnico] = useState<number>(5);
  const [commentText, setCommentText] = useState<string>("");
  const [recommend, setRecommend] = useState<boolean>(true);
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState<boolean>(false);

  // 1. DYNAMIC COMPILATION OF ALL CLIENTS' LOYALTY SCORES
  const clientsLoyaltyList = useMemo(() => {
    // Map with all unique clients across vehicles
    const clientMap: { [key: string]: { id: string; nombre: string; phone: string; email: string; vehiclesPlacas: string[] } } = {};
    
    vehicles.forEach(v => {
      const c = v.cliente;
      if (!clientMap[c.id]) {
        clientMap[c.id] = {
          id: c.id,
          nombre: c.nombre,
          phone: c.telefono,
          email: c.correo,
          vehiclesPlacas: []
        };
      }
      if (!clientMap[c.id].vehiclesPlacas.includes(v.placa)) {
        clientMap[c.id].vehiclesPlacas.push(v.placa);
      }
    });

    // Compute loyalty state for each client based on their vehicles' historical maintenances
    return Object.values(clientMap).map(client => {
      // Find all vehicles owned by this client
      const myVehicles = vehicles.filter(v => v.cliente.id === client.id);
      const myVehicleIds = myVehicles.map(v => v.id);

      // Filter completed maintenances for these vehicles
      const myMaints = maintenances.filter(m => myVehicleIds.includes(m.vehiculoId));
      
      // Calculate total revenue contributed
      const totalSpent = myMaints.reduce((sum, m) => sum + (m.totalCalculado || 0), 0);
      
      // Points earned is 1 point per $1.00 spent
      const puntosAcumulados = Math.floor(totalSpent);

      // Points redeemed by this client (aggregated from Firestore redemptions)
      const myRedemptions = redemptions.filter(r => r.clienteId === client.id);
      const puntosCanjeados = myRedemptions.reduce((sum, r) => sum + r.puntosCanjeados, 0);

      // Remaining available balance
      const puntosCanjeables = Math.max(0, puntosAcumulados - puntosCanjeados);

      // Loyalty Rank Hierarchy
      let nivelClub: "Bronce" | "Plata" | "Oro" | "Platino" = "Bronce";
      if (puntosAcumulados >= 1200) nivelClub = "Platino";
      else if (puntosAcumulados >= 600) nivelClub = "Oro";
      else if (puntosAcumulados >= 250) nivelClub = "Plata";

      return {
        id: client.id,
        nombre: client.nombre,
        phone: client.phone,
        email: client.email,
        puntosAcumulados,
        puntosCanjeables,
        puntosCanjeados,
        nivelClub,
        totalVisitas: myMaints.length,
        vehiclesPlacas: client.vehiclesPlacas
      };
    });
  }, [vehicles, maintenances, redemptions]);

  // 2. EXTRACT DYNAMIC PERSONAL PROFILE IF CLIENT IS ACTIVE
  const activeClientProfile = useMemo(() => {
    if (!isCliente || !clienteId) return null;
    return clientsLoyaltyList.find(c => c.id === clienteId) || {
      id: clienteId,
      nombre: clienteNombre || "Cliente Invitado",
      puntosAcumulados: 0,
      puntosCanjeables: 0,
      puntosCanjeados: 0,
      nivelClub: "Bronce" as const,
      totalVisitas: 0,
      vehiclesPlacas: []
    };
  }, [clientsLoyaltyList, isCliente, clienteId, clienteNombre]);

  // Client specific vehicles
  const clientVehicles = useMemo(() => {
    if (!isCliente || !clienteId) return [];
    return vehicles.filter(v => v.cliente.id === clienteId);
  }, [vehicles, isCliente, clienteId]);

  // Filter lists for admin
  const filteredClientsForAdmin = useMemo(() => {
    return clientsLoyaltyList.filter(c => 
      c.nombre.toLowerCase().includes(adminSearch.toLowerCase()) ||
      c.vehiclesPlacas.some(p => p.toLowerCase().includes(adminSearch.toLowerCase()))
    ).sort((a, b) => b.puntosAcumulados - a.puntosAcumulados);
  }, [clientsLoyaltyList, adminSearch]);

  // Compute statistics
  const totalPointsAwarded = useMemo(() => {
    return clientsLoyaltyList.reduce((sum, c) => sum + c.puntosAcumulados, 0);
  }, [clientsLoyaltyList]);

  const totalRewardsRedeemed = useMemo(() => {
    return redemptions.length;
  }, [redemptions]);

  const surveysSummary = useMemo(() => {
    if (surveys.length === 0) return { generalAvg: 0, count: 0, recommendationRate: 0 };
    const sumG = surveys.reduce((sum, s) => sum + s.calificacionGeneral, 0);
    const count = surveys.length;
    const recommendCount = surveys.filter(s => s.volveria).length;
    return {
      generalAvg: Math.round((sumG / count) * 10) / 10,
      count,
      recommendationRate: Math.round((recommendCount / count) * 100)
    };
  }, [surveys]);

  // Analytical datasets for RECHARTS visualizer
  const visitFrequencyDistribution = useMemo(() => {
    const labelMap = {
      "1 Visita": 0,
      "2 Visitas": 0,
      "3 Visitas": 0,
      "4+ Visitas": 0
    };
    clientsLoyaltyList.forEach(c => {
      if (c.totalVisitas === 1) labelMap["1 Visita"]++;
      else if (c.totalVisitas === 2) labelMap["2 Visitas"]++;
      else if (c.totalVisitas === 3) labelMap["3 Visitas"]++;
      else if (c.totalVisitas >= 4) labelMap["4+ Visitas"]++;
    });
    return Object.entries(labelMap).map(([visitas, count]) => ({
      name: visitas,
      clientes: count
    }));
  }, [clientsLoyaltyList]);

  const topClientsByVisits = useMemo(() => {
    return [...clientsLoyaltyList]
      .sort((a, b) => b.totalVisitas - a.totalVisitas)
      .slice(0, 6)
      .map(c => ({
        name: c.nombre.length > 14 ? c.nombre.substring(0, 14) + "..." : c.nombre,
        visitas: c.totalVisitas
      }));
  }, [clientsLoyaltyList]);

  const surveyResponseComparison = useMemo(() => {
    const totalMaints = Math.max(maintenances.length, 1);
    const totalSubmittedSurveys = surveys.length;
    const responseRate = Math.min(100, Math.round((totalSubmittedSurveys / totalMaints) * 100));
    const pendingRate = Math.max(0, 100 - responseRate);
    return [
      { name: "Respondido", valor: responseRate, count: totalSubmittedSurveys, color: "#10b981" },
      { name: "Pendiente", valor: pendingRate, count: Math.max(0, totalMaints - totalSubmittedSurveys), color: "#f43f5e" }
    ];
  }, [maintenances, surveys]);

  const surveyRatingBreakdown = useMemo(() => {
    const breakdown = { "5 ★": 0, "4 ★": 0, "3 ★": 0, "2 ★": 0, "1 ★": 0 };
    surveys.forEach(s => {
      const general = Math.min(5, Math.max(1, Math.round(s.calificacionGeneral)));
      if (general === 5) breakdown["5 ★"]++;
      else if (general === 4) breakdown["4 ★"]++;
      else if (general === 3) breakdown["3 ★"]++;
      else if (general === 2) breakdown["2 ★"]++;
      else if (general === 1) breakdown["1 ★"]++;
    });
    return Object.entries(breakdown).map(([rango, cantidad]) => ({
      calificacion: rango,
      cantidad
    })).reverse();
  }, [surveys]);

  const loyaltyPointsByTier = useMemo(() => {
    const pointsMap = { Bronce: 0, Plata: 0, Oro: 0, Platino: 0 };
    clientsLoyaltyList.forEach(c => {
      pointsMap[c.nivelClub] += c.puntosAcumulados;
    });
    return Object.entries(pointsMap).map(([tier, puntos]) => ({
      tier,
      puntos,
      color: tier === "Platino" ? "#6366f1" : tier === "Oro" ? "#f59e0b" : tier === "Plata" ? "#64748b" : "#94a3b8"
    }));
  }, [clientsLoyaltyList]);

  const totalPointsRedeemed = useMemo(() => {
    return redemptions.reduce((sum, r) => sum + r.puntosCanjeados, 0);
  }, [redemptions]);


  // 3. SUBMIT REWARD REDEMPTION MECHANICS
  const handleRedeemReward = async (reward: typeof REWARDS_CATALOG[0]) => {
    if (!activeClientProfile) return;
    
    if (activeClientProfile.puntosCanjeables < reward.puntosRequeridos) {
      showError("Saldo Insuficiente", `Necesitas ${reward.puntosRequeridos} puntos para canjear este premio. Tienes ${activeClientProfile.puntosCanjeables} puntos.`);
      return;
    }

    const uniqueCode = `CQ-REWARD-${Math.floor(100000 + Math.random() * 900000)}`;
    const newRedemption: CanjePremio = {
      id: `redem-${Date.now()}`,
      clienteId: activeClientProfile.id,
      clienteNombre: activeClientProfile.nombre,
      premioId: reward.id,
      nombrePremio: reward.nombre,
      puntosCanjeados: reward.puntosRequeridos,
      fecha: new Date().toISOString(),
      codigoUnico: uniqueCode
    };

    try {
      await setDoc(doc(db, "redemptions", newRedemption.id), newRedemption);
      
      // Also register as an official logger activity
      const activityId = `act-redem-${Date.now()}`;
      await setDoc(doc(db, "activities", activityId), {
        id: activityId,
        tipo: "recordatorio",
        mensaje: `Premio Canjeado: ${activeClientProfile.nombre} canjeó "${reward.nombre}" (${reward.puntosRequeridos} puntos) con código ${uniqueCode}.`,
        fecha: new Date().toISOString(),
        usuario: activeClientProfile.nombre
      });

      setSelectedRedemptionSlip(newRedemption);
      showSuccess("¡Canje Exitoso!", `Has redimido "${reward.nombre}" de forma satisfactoria.`);
    } catch (err) {
      showError("Error en Canje", "Hubo un error de base de datos procesando la redención.");
      console.error(err);
    }
  };


  // 4. SUBMIT SATISFACTION SURVEY MECHANICS
  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleForSurvey || !activeClientProfile) return;

    setIsSubmittingSurvey(true);
    const surveyId = `survey-${Date.now()}`;
    const newSurvey: EncuestaSatisfaccion = {
      id: surveyId,
      vehiculoId: selectedVehicleForSurvey.id,
      placa: selectedVehicleForSurvey.placa,
      clienteNombre: activeClientProfile.nombre,
      calificacionGeneral: ratingGeneral,
      calificacionAtencion: ratingAtencion,
      calificacionTecnica: ratingTecnico,
      comentario: commentText,
      volveria: recommend,
      fecha: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "surveys", newSurvey.id), newSurvey);
      
      // Register activity
      const activityId = `act-survey-${Date.now()}`;
      await setDoc(doc(db, "activities", activityId), {
        id: activityId,
        tipo: "registro",
        mensaje: `Nueva Encuesta de Satisfacción recibida de ${activeClientProfile.nombre} para placa ${selectedVehicleForSurvey.placa} (${ratingGeneral}★ Estrellas).`,
        fecha: new Date().toISOString(),
        usuario: "Sistema Inteligente"
      });

      showSuccess("Encuesta Registrada", "Muchas gracias por tu valiosa retroalimentación. Nos ayuda a brindarte el mejor servicio.");
      setSelectedVehicleForSurvey(null);
      
      // Reset form variables
      setRatingGeneral(5);
      setRatingAtencion(5);
      setRatingTecnico(5);
      setCommentText("");
      setRecommend(true);
    } catch (err) {
      showError("Error de Base de Datos", "No se pudo registrar tu encuesta de satisfacción.");
      console.error(err);
    } finally {
      setIsSubmittingSurvey(false);
    }
  };

  // Helper colors for tiers
  const getTierDetails = (tier: string) => {
    switch (tier) {
      case "Platino":
        return {
          bg: "bg-radial from-slate-900 to-indigo-950 text-white border-indigo-500/30",
          badge: "bg-indigo-500/20 text-indigo-300 border-indigo-400/30",
          description: "Membresía Ultimate Platinum - 15% Descuento directo en mano de obra + Aspirado y Lavado gratis ilimitados.",
          progressLimit: 1200,
          benefits: ["15% de Descuento directo", "Lavado & Aspirado Pro GRATIS", "Soporte y Prioridad Mecánica", "Mecánico asignado prioritario"]
        };
      case "Oro":
        return {
          bg: "bg-gradient-to-br from-amber-900/90 to-amber-950 text-amber-50 border-amber-500/40",
          badge: "bg-amber-100 text-amber-800 border-amber-300",
          description: "Nivel Oro Experto - 10% Descuento directo en labor técnica + Diagnóstico informatizado gratuito.",
          progressLimit: 1200,
          benefits: ["10% Descuento en mano de obra", "Diagnósticos computarizados", "Acceso a repuestos VIP", "Preferencia en sala de espera"]
        };
      case "Plata":
        return {
          bg: "bg-gradient-to-br from-slate-700 to-slate-900 text-slate-100 border-slate-600/50",
          badge: "bg-slate-200 text-slate-800 border-slate-350",
          description: "Siguiente parada Oro. Nivel Plata - 5% Descuento directo en labor.",
          progressLimit: 600,
          benefits: ["5% Descuento en servicio", "Inspección 360 gratis", "Prioridad agendamiento"]
        };
      default:
        return {
          bg: "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800 border-slate-250",
          badge: "bg-slate-100 text-slate-600 border-slate-200",
          description: "Fidelización Inicial. ¡Comienza a acumular puntos para escalar de nivel!",
          progressLimit: 250,
          benefits: ["Control Digital Perpetuo", "Estimación predictiva de kilometraje por IA"]
        };
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER BANNER */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/15 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-12 opacity-5 pointer-events-none">
          <Award className="h-64 w-64 text-indigo-400 rotate-12" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Award className="h-5 w-5" />
            </div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 font-mono flex items-center gap-1.5">
              <span>Club de Recompensas y Calidad {"•"} CQ Motors</span>
              <Sparkles className="h-3 w-3 text-amber-400" />
            </span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-100 tracking-tight">
             {isCliente ? "Mis Premios & Calificación Certera" : "Fidelización & Centro de Satisfacción de Clientes"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-350 max-w-2xl leading-relaxed">
            {isCliente 
              ? "Canjea tus puntos acumulados por repuestos e insumos Premium y ayúdanos a calibrar la precisión del taller llenando encuestas de satisfacción de tus vehículos."
              : "Consola integral para monitorear el ranking de fidelidad del Club de Clientes, acumulado de puntos de cortesía y análisis analítico de encuestas recibidas."}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ⚠️ CLIENTE VIEW PANEL */}
      {/* ========================================================================= */}
      {isCliente && activeClientProfile && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT SIDE: Loyalty Membership Status (5/12 cols) */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Membership Card card */}
              {(() => {
                const tier = getTierDetails(activeClientProfile.nivelClub);
                const nextPointsRequired = tier.progressLimit;
                const ratio = Math.min(100, Math.round((activeClientProfile.puntosAcumulados / nextPointsRequired) * 100));

                return (
                  <div className={`p-6 rounded-3xl border shadow-sm space-y-5 relative overflow-hidden transition-all duration-300 hover:shadow-md ${tier.bg}`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Gift className="h-20 w-20" />
                    </div>
                    
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold uppercase font-mono tracking-widest opacity-80">CLUB DE FIDELIDAD REWARDS</span>
                        <h4 className="text-lg font-black font-display tracking-tight text-white">
                          Tarjetahabiente VIP
                        </h4>
                        <p className="text-xs font-semibold opacity-90">{activeClientProfile.nombre}</p>
                      </div>
                      
                      <span className={`px-3 py-1 text-xs font-black uppercase rounded-full border ${tier.badge}`}>
                        Club: {activeClientProfile.nivelClub}
                      </span>
                    </div>

                    {/* Points balances list */}
                    <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 pb-1">
                      <div>
                        <span className="text-[9.5px] uppercase opacity-75 font-mono block">Puntos Canjeables (Neto)</span>
                        <strong className="text-2xl font-black text-rose-300 block leading-tight">{activeClientProfile.puntosCanjeables} <span className="text-xs font-normal">pts</span></strong>
                        <p className="text-[9.5px] uppercase opacity-60 font-mono mt-0.5">Disponibles ahora</p>
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase opacity-75 font-mono block">Acumulado Histórico</span>
                        <strong className="text-2xl font-black text-emerald-300 block leading-tight">{activeClientProfile.puntosAcumulados} <span className="text-xs font-normal">pts</span></strong>
                        <p className="text-[9.5px] uppercase opacity-60 font-mono mt-0.5">Gasto de ${activeClientProfile.puntosAcumulados.toLocaleString("es-EC")} USD</p>
                      </div>
                    </div>

                    {/* Progress to next tier */}
                    {activeClientProfile.nivelClub !== "Platino" && (
                      <div className="space-y-2 border-t border-white/10 pt-4">
                        <div className="flex justify-between text-[11px] font-semibold opacity-90">
                          <span>Siguiente Rango</span>
                          <span>{activeClientProfile.puntosAcumulados} / {nextPointsRequired} pts</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800/60 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="bg-indigo-400 h-full transition-all duration-500 rounded-full"
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                        <p className="text-[10.5px] font-medium opacity-80 leading-normal">
                          Te faltan <strong className="text-white">{nextPointsRequired - activeClientProfile.puntosAcumulados} puntos</strong> para subir al rango superior y desbloquear beneficios élite de taller.
                        </p>
                      </div>
                    )}

                    {/* Tier Benefits */}
                    <div className="border-t border-white/10 pt-4 space-y-1.5">
                      <span className="text-[9.5px] font-extrabold uppercase font-mono tracking-widest opacity-80 block">MIS BENEFICIOS DIRECTOS:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] font-medium">
                        {tier.benefits.map((b, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="text-emerald-400 font-bold shrink-0">✓</span>
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* SURVEY TRIGGERS FOR MY OUTSTANDING VEHICLES */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <MessageSquareHeart className="h-4 w-4 text-rose-500 animate-pulse" />
                    <span>Dar Encuestas de Satisfacción</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                    Toma 1 minuto. Califica los trabajos concluidos en carrocería, frenos, motor y atención general de tus vehículos activos.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {clientVehicles.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                      No hay autos registrados bajo tu nombre.
                    </div>
                  ) : (
                    clientVehicles.map(v => {
                      const hasSurvey = surveys.some(s => s.vehiculoId === v.id);
                      
                      return (
                        <div key={v.id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                          <div>
                            <span className="font-mono text-[9px] bg-slate-900 text-white px-1.5 py-0.2 rounded font-extrabold uppercase">{v.placa}</span>
                            <strong className="text-slate-800 font-bold ml-1.5 block sm:inline mt-1 sm:mt-0">{v.marca} {v.modelo}</strong>
                            <div className="text-[10px] text-slate-400 mt-0.5">Estado actual: <span className="font-semibold text-slate-600">{v.estado}</span></div>
                          </div>
                          
                          {hasSurvey ? (
                            <span className="text-[10px] text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 font-sans">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Enviada</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedVehicleForSurvey(v)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10.5px] font-extrabold transition-all cursor-pointer shadow-xs flex items-center gap-1"
                            >
                              <HeartHandshake className="h-3.5 w-3.5" />
                              <span>Calificar Servicio</span>
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT SIDE: CUSTOMER REWARDS CATALOG TEMPORARILY HIDDEN UPON ORDER */}
            <div className="lg:col-span-7 bg-gradient-to-br from-slate-50 to-slate-100/90 p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-center items-center text-center space-y-4">
              <div className="p-4 bg-amber-50 text-amber-500 rounded-full border border-amber-100 shadow-xs">
                <Gift className="h-8 w-8 text-amber-500 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-black text-slate-900 text-base tracking-tight">Catálogo de Premios en Calibración</h3>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed mx-auto">
                  La gerencia de <strong className="text-slate-800">CQ Motors S.A.</strong> está reestructurando la matriz de recompensas físicas oficiales del Club de Clientes para ofrecerte consumibles y repuestos homologados de óptima calidad técnica.
                </p>
              </div>
              <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200/60 text-[11px] text-slate-600 font-semibold flex items-center gap-2 max-w-sm">
                <Award className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>¡Sigue acumulando puntos con tus visitas de taller! Podrás canjearlos tan pronto se habilite el nuevo catálogo.</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛠️ ADMINISTRATOR MANAGER PANEL */}
      {/* ========================================================================= */}
      {!isCliente && (
        <div className="space-y-6">
          
          {/* STATS TILES HERO SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Stat 1 */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-450 block font-mono">Puntos Totales Entregados</span>
                <strong className="text-xl font-black text-slate-900 block leading-none">{totalPointsAwarded.toLocaleString("es-EC")} <span className="text-xs font-normal text-slate-450">PTS</span></strong>
                <p className="text-[9.5px] text-slate-400 font-medium">Equivale a ${totalPointsAwarded.toLocaleString("es-EC")} USD facturados</p>
              </div>
              <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                <Award className="h-5 w-5" />
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-450 block font-mono">Satisfacción Promedio</span>
                <strong className="text-xl font-black font-display text-slate-900 block leading-none">
                  {surveysSummary.generalAvg > 0 ? `${surveysSummary.generalAvg} ★` : "S/F"}
                </strong>
                <p className="text-[9.5px] text-slate-400 font-medium">En base a {surveysSummary.count} encuestas de clientes</p>
              </div>
              <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl border border-yellow-100">
                <Star className="h-5 w-5 fill-yellow-500 stroke-yellow-500" />
              </div>
            </div>

            {/* Stat 3 */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-450 block font-mono">Índice Recomendación (NPS)</span>
                <strong className="text-xl font-black font-display text-slate-900 block leading-none">{surveysSummary.recommendationRate}%</strong>
                <p className="text-[9.5px] text-slate-400 font-medium">Volverían al Taller Central</p>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

          </div>

          {/* NESTED NAVIGATION FOR ADMINISTRATIVE DATA VIEWS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-5 shadow-xs">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold self-start sm:self-auto">
                <button
                  onClick={() => setActiveAdminSubTab("stats")}
                  className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeAdminSubTab === "stats" 
                      ? "bg-white text-slate-900 shadow-xs" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Estadísticas CRM</span>
                </button>
                <button
                  onClick={() => setActiveAdminSubTab("ranking")}
                  className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeAdminSubTab === "ranking" 
                      ? "bg-white text-slate-900 shadow-xs" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Ranking Fidelidad</span>
                </button>
                <button
                  onClick={() => setActiveAdminSubTab("surveys")}
                  className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeAdminSubTab === "surveys" 
                      ? "bg-white text-slate-900 shadow-xs" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <MessageSquareHeart className="h-3.5 w-3.5" />
                  <span>Encuestas Recibidas</span>
                  {surveys.length > 0 && (
                    <span className="bg-rose-100 text-rose-700 font-black text-[9px] px-1.5 py-0.2 rounded-full font-mono">{surveys.length}</span>
                  )}
                </button>
                <button
                  onClick={() => setActiveAdminSubTab("redemptions")}
                  className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeAdminSubTab === "redemptions" 
                      ? "bg-white text-slate-900 shadow-xs" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Gift className="h-3.5 w-3.5" />
                  <span>Canjes Solicitados</span>
                  {redemptions.length > 0 && (
                    <span className="bg-indigo-100 text-indigo-700 font-black text-[9px] px-1.5 py-0.2 rounded-full font-mono">{redemptions.length}</span>
                  )}
                </button>
              </div>

              {activeAdminSubTab === "ranking" && (
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por cliente o placa..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* CONTENT AREA: stats of loyalty */}
            {activeAdminSubTab === "stats" && (
              <div className="space-y-6">
                
                {/* GRID 1: VISITING FREQUENCY AND RANKS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Visitas: Distribución general */}
                  <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase font-mono tracking-widest text-indigo-600">Distribución de Frecuencia de Visitas</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">Mapeo del volumen de visitas por cada cliente para medir lealtad repetitiva.</p>
                    </div>
                    {clientsLoyaltyList.length === 0 ? (
                      <div className="h-56 flex items-center justify-center text-slate-400 italic text-xs">Sin información de visitas.</div>
                    ) : (
                      <div className="h-56 w-full text-xs font-sans">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={visitFrequencyDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "11px" }}
                              itemStyle={{ color: "#a5b4fc" }}
                            />
                            <Bar dataKey="clientes" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={35} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Top Clientes con más visitas */}
                  <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase font-mono tracking-widest text-indigo-600">Top Clientes con Mayor Asistencia</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">Clientes que más órdenes de servicio técnico y preventivo han ejecutado.</p>
                    </div>
                    {topClientsByVisits.length === 0 ? (
                      <div className="h-56 flex items-center justify-center text-slate-400 italic text-xs">Sin registros de visitas aún.</div>
                    ) : (
                      <div className="h-56 w-full text-xs font-sans">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topClientsByVisits} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <YAxis dataKey="name" type="category" stroke="#0f172a" fontSize={10} tickLine={false} width={100} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "11px" }}
                            />
                            <Bar dataKey="visitas" fill="#10b981" radius={[0, 6, 6, 0]} maxBarSize={15} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                </div>

                {/* GRID 2: SURVEYS & LOYALTY POINTS TIERS BREAKDOWNS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Encuestas: Tasa de Respuesta */}
                  <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4 lg:col-span-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase font-mono tracking-widest text-emerald-600">Tasa de Respuesta Activa</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">Porcentaje de encuestas devueltas respecto al total de hojas de taller.</p>
                    </div>
                    
                    <div className="h-44 w-full flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={surveyResponseComparison}
                            innerRadius={50}
                            outerRadius={65}
                            paddingAngle={5}
                            dataKey="valor"
                          >
                            {surveyResponseComparison.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Central label */}
                      <div className="absolute inset-x-0 inset-y-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                        <span className="text-xl font-mono font-black text-slate-900">{surveyResponseComparison[0].valor}%</span>
                        <span className="text-[9px] uppercase tracking-wider font-mono font-black opacity-60 text-slate-500">Completadas</span>
                      </div>
                    </div>

                    <div className="flex gap-4 justify-center text-[10px] font-mono border-t border-slate-200/50 pt-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                        <span className="text-slate-600">Respondido ({surveyResponseComparison[0].count})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span>
                        <span className="text-slate-600">Pendiente ({surveyResponseComparison[1].count})</span>
                      </div>
                    </div>
                  </div>

                  {/* Encuestas: Star distribution breakdown */}
                  <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4 lg:col-span-1">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase font-mono tracking-widest text-emerald-600">Desglose de Calificaciones</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">Esquema cuantitativo de satisfacción general provisto por QR y web.</p>
                    </div>
                    {surveys.length === 0 ? (
                      <div className="h-44 flex items-center justify-center text-slate-400 italic text-xs">Sin registros de calificación.</div>
                    ) : (
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={surveyRatingBreakdown} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="calificacion" stroke="#94a3b8" fontSize={9} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                            <Bar dataKey="cantidad" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={25} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Puntos: Acumulación por Tiers */}
                  <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4 lg:col-span-1">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase font-mono tracking-widest text-indigo-600">Puntos Totales por Categoría</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">Concentración del volumen de puntos acumulados por cada nivel del Club.</p>
                    </div>
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={loyaltyPointsByTier}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="puntos"
                            nameKey="tier"
                            labelLine={false}
                          >
                            {loyaltyPointsByTier.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value.toLocaleString("es-EC")} pts`} />
                          <Legend verticalAlign="bottom" height={36} iconSize={8} fontSize={9} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* HISTORICAL RECONCILIATION SUMMARY DETAILS */}
                <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wide">Puntos Acumulados Taller</span>
                    <strong className="text-xl text-indigo-300 font-mono font-black">{totalPointsAwarded.toLocaleString("es-EC")} pts</strong>
                    <p className="text-[10px] text-slate-500 font-medium">Masa total de puntos de cortesía ganados</p>
                  </div>
                  <div className="space-y-1 border-y md:border-y-0 md:border-x border-slate-800 py-4 md:py-0">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wide">Puntos Canjeados (Histórico)</span>
                    <strong className="text-xl text-rose-300 font-mono font-black">{totalPointsRedeemed.toLocaleString("es-EC")} pts</strong>
                    <p className="text-[10px] text-slate-500 font-medium">Coste de regalos retirados por clientes</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wide">Saldo Neto de Puntos</span>
                    <strong className="text-xl text-emerald-300 font-mono font-black">
                      {(totalPointsAwarded - totalPointsRedeemed).toLocaleString("es-EC")} pts
                    </strong>
                    <p className="text-[10px] text-slate-500 font-medium">Disponibles en cuentas del Club</p>
                  </div>
                </div>

              </div>
            )}

            {/* CONTENT AREA: ranking of loyalty */}
            {activeAdminSubTab === "ranking" && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-mono font-bold bg-slate-50/50">
                      <th className="py-2.5 px-4">Cliente</th>
                      <th className="py-2.5 px-4 text-center">Nivel Club</th>
                      <th className="py-2.5 px-4 text-center">Máquinas Placas</th>
                      <th className="py-2.5 px-4 text-center">Visitas Completadas</th>
                      <th className="py-2.5 px-4 text-right">Puntos Acumulados</th>
                      <th className="py-2.5 px-4 text-right">Saldo Actual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClientsForAdmin.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 italic">No se encontraron clientes registrados con historial.</td>
                      </tr>
                    ) : (
                      filteredClientsForAdmin.map((client, idx) => {
                        const tier = getTierDetails(client.nivelClub);
                        return (
                          <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50/60 font-sans">
                            <td className="py-3 px-4">
                              <span className="font-extrabold text-slate-900 block leading-snug">{client.nombre}</span>
                              <span className="text-[10px] text-slate-450 block font-mono">{client.phone} • {client.email}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${tier.badge}`}>
                                {client.nivelClub}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex flex-wrap justify-center gap-1">
                                {client.vehiclesPlacas.map(p => (
                                  <span key={p} className="bg-slate-900 text-white px-1.5 py-0.2 rounded font-extrabold text-[9px] font-mono">{p}</span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-800 font-mono">
                              {client.totalVisitas}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <strong className="text-slate-800 font-mono font-extrabold">{client.puntosAcumulados} pts</strong>
                              <span className="text-[9px] text-slate-450 block font-sans">${client.puntosAcumulados.toLocaleString("es-EC")} USD</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <strong className="text-rose-650 font-mono font-black">{client.puntosCanjeables} pts</strong>
                              <span className="text-[9px] text-slate-400 block font-sans">{client.puntosCanjeados} canjeados</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* CONTENT AREA: surveys received */}
            {activeAdminSubTab === "surveys" && (
              <div className="space-y-4">
                {surveys.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs">
                    No se han registrado encuestas de satisfacción aún.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {surveys.map((survey) => (
                      <div key={survey.id} className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-2xs">
                        <div className="flex justify-between items-start border-b border-slate-200/50 pb-2.5">
                          <div>
                            <span className="font-mono text-[9px] bg-slate-900 text-white px-1.5 py-0.2 rounded font-extrabold uppercase">{survey.placa}</span>
                            <span className="text-[10px] text-slate-400 block mt-1 font-sans">Cliente: <strong className="text-slate-700 font-semibold">{survey.clienteNombre}</strong></span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9.5px] font-mono text-slate-400 block">{new Date(survey.fecha).toLocaleDateString("es-EC")}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5 ${survey.volveria ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                              {survey.volveria ? "Recomienda ✓" : "No Recomienda ✗"}
                            </span>
                          </div>
                        </div>

                        {/* Internal ratings details */}
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] py-1 bg-white rounded-xl border border-slate-200/50 font-sans">
                          <div>
                            <span className="text-slate-400 block uppercase tracking-wide">General</span>
                            <div className="flex items-center justify-center text-slate-800 font-bold font-mono">
                              {survey.calificacionGeneral} <Star className="h-3 w-3 text-amber-500 fill-amber-500 ml-0.5" />
                            </div>
                          </div>
                          <div className="border-x border-slate-100">
                            <span className="text-slate-400 block uppercase tracking-wide">Atención</span>
                            <div className="flex items-center justify-center text-slate-800 font-bold font-mono">
                              {survey.calificacionAtencion} <Star className="h-3 w-3 text-amber-500 fill-amber-500 ml-0.5" />
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase tracking-wide">Técnica</span>
                            <div className="flex items-center justify-center text-slate-800 font-bold font-mono">
                              {survey.calificacionTecnica} <Star className="h-3 w-3 text-amber-500 fill-amber-500 ml-0.5" />
                            </div>
                          </div>
                        </div>

                        {survey.comentario && (
                          <p className="bg-slate-100 p-2.5 rounded-xl text-[11px] text-slate-600 leading-normal italic font-medium">
                            &ldquo;{survey.comentario}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CONTENT AREA: redemptions logged */}
            {activeAdminSubTab === "redemptions" && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-mono font-bold bg-slate-50/50">
                      <th className="py-2.5 px-4">Cliente</th>
                      <th className="py-2.5 px-4">Premio Redimido</th>
                      <th className="py-2.5 px-4 text-center">Fecha Canje</th>
                      <th className="py-2.5 px-4 text-center">Puntos Canjeados</th>
                      <th className="py-2.5 px-4 text-right">Código Unico QR Ticket</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 italic">No se han solicitado canjes de premios históricos aún.</td>
                      </tr>
                    ) : (
                      redemptions.map((redem) => (
                        <tr key={redem.id} className="border-b border-slate-100 hover:bg-slate-50/60 font-sans">
                          <td className="py-3 px-4 font-extrabold text-slate-930">
                            {redem.clienteNombre}
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-indigo-50 border border-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded-lg text-[10.5px]">
                              {redem.nombrePremio}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500 font-mono text-[10.5px]">
                            {new Date(redem.fecha).toLocaleString("es-EC")}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-800 font-mono">
                            {redem.puntosCanjeados} pts
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-mono text-[11px] font-extrabold border border-indigo-200 bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-md self-end tracking-wider">
                              {redem.codigoUnico}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔮 SATISFACTION SURVEY POPUP MODAL */}
      {/* ========================================================================= */}
      {selectedVehicleForSurvey && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xl max-w-lg w-full space-y-6 relative max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="bg-rose-100 text-rose-800 text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Star className="h-3 w-3 text-rose-600 fill-rose-600 animate-spin-slow" />
                  <span>Control de Calidad CQ</span>
                </span>
                <h3 className="font-display font-black text-slate-900 text-lg mt-1.5">
                  Calificar Servicio: {selectedVehicleForSurvey.placa}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedVehicleForSurvey.marca} {selectedVehicleForSurvey.modelo} ({selectedVehicleForSurvey.anio})
                </p>
              </div>
              <button 
                onClick={() => setSelectedVehicleForSurvey(null)}
                className="p-1 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 font-black cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSurvey} className="space-y-4 text-xs">
              
              {/* Question 1: General satisfaction */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">1. Sastifacción General del Trabajo:</label>
                <div className="flex items-center space-x-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                  {[1, 2, 3, 4, 5].map(idx => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRatingGeneral(idx)}
                      className="cursor-pointer focus:outline-hidden transition-all duration-150 transform hover:scale-110"
                    >
                      <Star className={`h-7 w-7 ${idx <= ratingGeneral ? "text-yellow-500 fill-yellow-400" : "text-slate-350"}`} />
                    </button>
                  ))}
                  <span className="font-mono font-black text-slate-700 text-sm pl-2">({ratingGeneral}/5)</span>
                </div>
              </div>

              {/* Question 2: Service attention */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">2. Hospitalidad {"&"} Atención al Cliente:</label>
                <div className="flex items-center space-x-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                  {[1, 2, 3, 4, 5].map(idx => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRatingAtencion(idx)}
                      className="cursor-pointer focus:outline-hidden transition-all duration-150 transform hover:scale-110"
                    >
                      <Star className={`h-7 w-7 ${idx <= ratingAtencion ? "text-yellow-500 fill-yellow-400" : "text-slate-350"}`} />
                    </button>
                  ))}
                  <span className="font-mono font-black text-slate-700 text-sm pl-2">({ratingAtencion}/5)</span>
                </div>
              </div>

              {/* Question 3: Technical Execution */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">3. Calidad Técnica / Trabajo Mecánico:</label>
                <div className="flex items-center space-x-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                  {[1, 2, 3, 4, 5].map(idx => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRatingTecnico(idx)}
                      className="cursor-pointer focus:outline-hidden transition-all duration-150 transform hover:scale-110"
                    >
                      <Star className={`h-7 w-7 ${idx <= ratingTecnico ? "text-yellow-500 fill-yellow-400" : "text-slate-350"}`} />
                    </button>
                  ))}
                  <span className="font-mono font-black text-slate-700 text-sm pl-2">({ratingTecnico}/5)</span>
                </div>
              </div>

              {/* Recommendation toggle and Comment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">¿Recomendarías CQ Motors?</label>
                  <div className="flex space-x-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setRecommend(true)}
                      className={`flex-1 py-1.5 text-center font-bold rounded-lg cursor-pointer transition-all ${
                        recommend ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Sí Seguro
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecommend(false)}
                      className={`flex-1 py-1.5 text-center font-bold rounded-lg cursor-pointer transition-all ${
                        !recommend ? "bg-rose-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-2 border border-slate-150 rounded-xl flex items-center justify-center">
                  <div className="text-center font-semibold text-slate-500 font-sans leading-relaxed text-[11px]">
                    Al enviar, ganarás prestigio y contribuirás al Club de Fidelidad.
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Sugerencia, Crítica Constructiva o Comentario:</label>
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escribe aquí tu retroalimentación sobre el servicio recibido..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-rose-500 leading-normal"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingSurvey}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-extrabold transition-all cursor-pointer shadow-sm flex items-center justify-center space-x-1.5"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmittingSurvey ? "Registrando en Base de Datos..." : "Enviar Formulario de Satisfacción"}</span>
              </button>

            </form>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔮 TICKET REDEMPTION PREVIEW MODAL */}
      {/* ========================================================================= */}
      {selectedRedemptionSlip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200/85 p-6 shadow-2xl max-w-sm w-full space-y-5 text-center relative"
          >
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 inline-block">
              <PartyPopper className="h-8 w-8 animate-bounce text-indigo-600" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-black text-slate-900 text-lg">¡Canje Autorizado!</h3>
              <p className="text-xs text-slate-400">CQ Motors S.A. {"•"} Club de Fidelidad VIP</p>
            </div>

            {/* Simulated Printed Voucher ticket */}
            <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50 space-y-4 text-xs font-sans text-left">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-mono text-[9px] text-slate-400">TICKET PREMIO</span>
                <span className="font-mono font-bold text-slate-800">{new Date(selectedRedemptionSlip.fecha).toLocaleDateString("es-EC")}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[9.5px] uppercase text-slate-400 block font-mono">Nombre del Beneficiario</span>
                <strong className="text-slate-800 text-xs font-bold block">{selectedRedemptionSlip.clienteNombre}</strong>
              </div>

              <div className="space-y-1">
                <span className="text-[9.5px] uppercase text-slate-400 block font-mono">Detalle del Premio</span>
                <span className="text-indigo-900 bg-indigo-105 border border-indigo-200 font-extrabold px-2 py-0.5 rounded-md inline-block text-xs">
                  {selectedRedemptionSlip.nombrePremio}
                </span>
              </div>

              <div className="space-y-1.5 border-t border-slate-200/50 pt-3 flex flex-col items-center">
                <span className="text-[9px] uppercase text-slate-400 font-mono text-center">Código único de validación</span>
                
                {/* Simulated dynamic code with a barcode visual accent line */}
                <div className="flex flex-col items-center space-y-1 text-center bg-white border p-2 rounded-xl w-full">
                  <div className="flex items-center space-x-1.5">
                    <Barcode className="h-5 w-5 text-slate-800" />
                    <span className="font-mono text-xs font-black tracking-widest text-slate-900">
                      {selectedRedemptionSlip.codigoUnico}
                    </span>
                  </div>
                  <span className="text-[8.5px] text-slate-400 block">Presente este código en caja del taller central</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedRedemptionSlip(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-extrabold text-xs transition-all cursor-pointer shadow-sm"
            >
              Entendido / Cerrar Ticket
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
}
