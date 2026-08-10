import React, { useState } from "react";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { CitaMantenimiento } from "../types";
import { useToast } from "./Toast";
import { 
  Wrench, 
  Clock, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle, 
  FileText, 
  Activity, 
  Menu, 
  X,
  Gauge,
  Sparkles,
  Zap,
  ShieldCheck,
  ChevronRight,
  Car,
  Compass,
  Cpu,
  BookmarkCheck,
  Award,
  Search,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  Star,
  Quote,
  Camera,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Vehiculo, Mantenimiento } from "../types";

interface LandingPageProps {
  onOpenLogin: () => void;
  appointments: CitaMantenimiento[];
  onSearchPlate?: (plate: string) => void;
  vehicles?: Vehiculo[];
  maintenances?: Mantenimiento[];
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function LandingPage({ 
  onOpenLogin, 
  appointments,
  onSearchPlate,
  vehicles = [],
  maintenances = [],
  darkMode = false,
  onToggleDarkMode
}: LandingPageProps) {
  const { showSuccess, showError } = useToast();
  
  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Modal toggle
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  // Live plate search state
  const [searchPlateInput, setSearchPlateInput] = useState("");
  const [searchedVehicle, setSearchedVehicle] = useState<Vehiculo | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchMode, setSearchMode] = useState<"demo" | "real">("demo");

  // Accordion active FAQ state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  
  // Form values
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custMail, setCustMail] = useState("");
  const [custPlate, setCustPlate] = useState("");
  const [custBrand, setCustBrand] = useState("");
  const [custModel, setCustModel] = useState("");
  const [custYear, setCustYear] = useState<number>(new Date().getFullYear());
  const [custKm, setCustKm] = useState<number>(45000);
  const [custService, setCustService] = useState("Mantenimiento Preventivo");
  const [custDate, setCustDate] = useState("");
  const [custTime, setCustTime] = useState("09:00");
  const [custComments, setCustComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick live timer
  const [localTimeStr, setLocalTimeStr] = useState("");
  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLocalTimeStr(now.toLocaleTimeString("es-EC", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Selected quick specialization tab for visual feedback
  const [selectedSpec, setSelectedSpec] = useState("preventivo");

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSearchVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPlateInput.trim()) {
      showError("Campo vacío", "Por favor ingrese una placa para buscar.");
      return;
    }
    const cleanPlate = searchPlateInput.trim().toUpperCase();
    const cleanSearchStr = cleanPlate.replace(/[^A-Z0-9]/g, "");
    
    const found = vehicles.find(v => {
      const cleanVPlaca = v.placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
      return cleanVPlaca === cleanSearchStr || v.id.toUpperCase() === cleanPlate;
    });

    if (found) {
      setSearchedVehicle(found);
      showSuccess("Vehículo Encontrado", `Hemos recuperado el estado para el vehículo ${found.marca} ${found.modelo}.`);
    } else {
      setSearchedVehicle(null);
      showError("No Encontrado", `No se encontró ningún vehículo con la placa [${cleanPlate}]. Por favor intente con otra o agende una cita.`);
    }
    setHasSearched(true);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custPlate || !custDate) {
      showError("Datos Incompletos", "Por favor complete los campos obligatorios (*).");
      return;
    }

    setIsSubmitting(true);

    const newAppointment: CitaMantenimiento = {
      id: `appt-${Date.now()}`,
      nombreCliente: custName,
      telefonoCliente: custPhone || "0991112223",
      correoCliente: custMail || "correo@ejemplo.com",
      placa: custPlate.trim().toUpperCase(),
      marca: custBrand || "Toyota",
      modelo: custModel || "Insignia",
      anio: Number(custYear) || 2020,
      kilometraje: Number(custKm) || 50000,
      tipoServicios: [custService],
      fechaPreferencia: custDate,
      horaPreferencia: custTime,
      comentarios: custComments || "Cita agendada desde el portal premium.",
      fechaRegistro: new Date().toISOString(),
      estado: "Pendiente"
    };

    try {
      await setDoc(doc(db, "appointments", newAppointment.id), newAppointment);
      showSuccess(
        "¡Cita Agendada Exitosamente!", 
        `Estimado/a ${custName}, su cita para el vehículo [${custPlate.toUpperCase()}] está reservada para el día ${custDate} a las ${custTime}.`
      );
      
      // Reset form
      setCustName("");
      setCustPhone("");
      setCustMail("");
      setCustPlate("");
      setCustBrand("");
      setCustModel("");
      setCustYear(new Date().getFullYear());
      setCustKm(45000);
      setCustComments("");
      setIsModalOpen(false);
    } catch (err) {
      showError("Error de Conexión", "No se pudo registrar la reserva en la base de datos.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0f19] text-[#1d1d1f] dark:text-slate-100 font-sans antialiased overflow-x-hidden selection:bg-[#0066cc]/10 selection:text-[#0066cc]">
      
      {/* 1. FIXED HEADER WITH APPLE GLASSMORPHISM */}
      <header className="fixed top-0 left-0 w-full z-50 border-b border-[#e8e8ed] dark:border-slate-800 backdrop-blur-md bg-white/80 dark:bg-[#0b0f19]/90 py-3.5">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          
          {/* Logo (Apple inspired luxury branding) */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-[#1d1d1f] dark:bg-amber-500/20 flex items-center justify-center shadow-sm border border-transparent dark:border-amber-500/40">
              <Wrench className="w-4 h-4 text-white dark:text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-bold text-sm tracking-tight text-[#1d1d1f] dark:text-white group-hover:text-[#0066cc] dark:group-hover:text-amber-400 transition-colors uppercase">CQ Motors</span>
              <span className="text-[8px] font-semibold text-[#6e6e73] dark:text-slate-400 tracking-widest uppercase">High Performance</span>
            </div>
          </a>

          {/* Desktop Links - Apple Style Minimal text */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#inicio" className="text-xs font-normal text-[#6e6e73] dark:text-slate-300 hover:text-[#1d1d1f] dark:hover:text-white transition-all">Inicio</a>
            <a href="#servicios" className="text-xs font-normal text-[#6e6e73] dark:text-slate-300 hover:text-[#1d1d1f] dark:hover:text-white transition-all">Especialidades</a>
            <a href="#experiencia" className="text-xs font-normal text-[#6e6e73] dark:text-slate-300 hover:text-[#1d1d1f] dark:hover:text-white transition-all">Experiencia Digital</a>
            <a href="#preguntas-frecuentes" className="text-xs font-normal text-[#6e6e73] dark:text-slate-300 hover:text-[#1d1d1f] dark:hover:text-white transition-all">FAQ</a>
          </nav>

          {/* Right CTA Group */}
          <div className="flex items-center gap-3">
            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="p-2 rounded-full text-[#1d1d1f] dark:text-amber-400 hover:bg-[#F5F5F7] dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer border border-[#e8e8ed] dark:border-slate-700 flex items-center justify-center"
                title={darkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                aria-label="Alternar modo oscuro"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>
            )}

            <button 
              onClick={onOpenLogin}
              className="px-4 py-1.5 rounded-full text-xs font-medium text-[#1d1d1f] dark:text-slate-200 hover:bg-[#F5F5F7] dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer border border-transparent dark:border-slate-700"
            >
              Acceso Clientes
            </button>
            <button 
              onClick={handleOpenModal} 
              className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#0066cc] hover:bg-[#0077ed] text-white active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              Agendar Inspección
            </button>
            
            {/* Mobile Menu Toggle */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-[#1d1d1f] dark:text-white focus:outline-none">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-[#131c2e] border-t border-[#e8e8ed] dark:border-slate-800 absolute top-full left-0 w-full flex flex-col p-6 space-y-4 shadow-xl"
            >
              <a href="#inicio" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#6e6e73] dark:text-slate-300 hover:text-[#1d1d1f] dark:hover:text-white transition-colors">Inicio</a>
              <a href="#servicios" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#6e6e73] dark:text-slate-300 hover:text-[#1d1d1f] dark:hover:text-white transition-colors">Especialidades</a>
              <a href="#experiencia" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#6e6e73] dark:text-slate-300 hover:text-[#1d1d1f] dark:hover:text-white transition-colors">Experiencia Digital</a>
              <a href="#preguntas-frecuentes" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#6e6e73] dark:text-slate-300 hover:text-[#1d1d1f] dark:hover:text-white transition-colors">FAQ</a>
              <div className="pt-4 border-t border-[#e8e8ed] dark:border-slate-800 flex flex-col gap-2">
                <button 
                  onClick={() => { onOpenLogin(); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#F5F5F7] dark:bg-slate-800 text-[#1d1d1f] dark:text-white hover:bg-[#e8e8ed] dark:hover:bg-slate-700 transition-all text-center"
                >
                  Acceso Clientes
                </button>
                <button 
                  onClick={handleOpenModal}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#0066cc] hover:bg-[#0077ed] text-white transition-all text-center"
                >
                  Reservar Cita de Inspección
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. HERO SECTION - APPLE STORE STYLE */}
      <section id="inicio" className="pt-36 pb-20 px-6 bg-white relative overflow-hidden flex flex-col justify-center items-center">
        
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          
          {/* Top minimal badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#F5F5F7] px-4 py-1.5 rounded-full text-xs font-semibold text-[#1d1d1f]">
            <Sparkles className="w-3.5 h-3.5 text-[#0066cc]" />
            Nueva Tecnología de Escáner 3D y Telemetría Predictiva
          </div>

          {/* Main Massive Editorial Title */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-sans font-extrabold tracking-tight leading-[1.05] text-[#1d1d1f] max-w-4xl mx-auto">
            Ingeniería de precisión. <br />
            <span className="text-[#6e6e73]">Confianza absoluta.</span>
          </h1>

          {/* Editorial Subtitle */}
          <p className="text-lg sm:text-xl text-[#6e6e73] font-normal max-w-2xl mx-auto leading-relaxed">
            Su automóvil de alta gama merece un diagnóstico a la altura de su diseño. Unimos la experiencia de artesanos certificados con la transparencia absoluta del Cuadro de Mando Digital.
          </p>

          {/* Beautifully paired CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={handleOpenModal} 
              className="w-full sm:w-auto px-7 py-3 rounded-full text-sm font-medium bg-[#0066cc] hover:bg-[#0077ed] text-white active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
            >
              Agendar diagnóstico gratis <ChevronRight className="w-4 h-4" />
            </button>
            <a 
              href="#servicios" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-7 py-3 rounded-full text-sm font-medium bg-[#F5F5F7] hover:bg-[#e8e8ed] text-[#1d1d1f] transition-all"
            >
              Conocer especialidades
            </a>
          </div>

          {/* Apple Hardware styled Cinematic Showcase */}
          <div className="pt-14 max-w-5xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden bg-[#F5F5F7] p-1.5 border border-[#e8e8ed] shadow-2xl shadow-slate-100 group">
              <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-transparent z-10"></div>
              
              <img 
                src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1400&auto=format&fit=crop" 
                alt="Taller de Diagnóstico de Precisión" 
                className="w-full h-[320px] sm:h-[480px] object-cover rounded-[22px] filter brightness-[0.95] group-hover:scale-[1.01] transition-all duration-1000"
              />
              
              {/* Overlay Specs Card (Minimalist White Badge) */}
              <div className="absolute bottom-8 left-8 right-8 z-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-white/95 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl">
                <div className="text-left space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066cc] font-mono">DIAGNÓSTICO EN TIEMPO REAL</span>
                  <p className="text-sm font-bold text-[#1d1d1f]">Reportes inmediatos con fotografías del estado real de su auto.</p>
                </div>
                
                <div className="flex items-center gap-8 text-left">
                  <div>
                    <span className="text-xl font-extrabold text-[#1d1d1f] block">99.8%</span>
                    <span className="text-[10px] text-[#6e6e73] font-medium">Precisión de Falla</span>
                  </div>
                  <div className="w-px h-8 bg-neutral-200"></div>
                  <div>
                    <span className="text-xl font-extrabold text-[#1d1d1f] block">15,000+</span>
                    <span className="text-[10px] text-[#6e6e73] font-medium">Autos Atendidos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. MINIMAL SLIDING ICON NAVIGATION (Apple Category Nav style) */}
      <section className="py-10 bg-[#F5F5F7] border-y border-[#e8e8ed]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[10px] font-bold tracking-widest text-[#6e6e73] uppercase mb-6">
            Especialistas de Precisión Certificados por las Marcas Líderes
          </p>
          
          {/* Horizontal scrollbar-less items */}
          <div className="flex items-center justify-center gap-12 overflow-x-auto pb-2 scrollbar-none opacity-85">
            <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:scale-105 transition-all text-center">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#1d1d1f]">
                <Cpu className="w-5 h-5 text-[#6e6e73]" />
              </div>
              <span className="text-[11px] font-medium text-[#1d1d1f]">Toyota Tech</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:scale-105 transition-all text-center">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#1d1d1f]">
                <Gauge className="w-5 h-5 text-[#6e6e73]" />
              </div>
              <span className="text-[11px] font-medium text-[#1d1d1f]">Nissan Pro</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:scale-105 transition-all text-center">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#1d1d1f]">
                <Car className="w-5 h-5 text-[#6e6e73]" />
              </div>
              <span className="text-[11px] font-medium text-[#1d1d1f]">Ford Advanced</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:scale-105 transition-all text-center">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#1d1d1f]">
                <Activity className="w-5 h-5 text-[#6e6e73]" />
              </div>
              <span className="text-[11px] font-medium text-[#1d1d1f]">Chevrolet Specialist</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:scale-105 transition-all text-center">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#1d1d1f]">
                <Award className="w-5 h-5 text-[#0066cc]" />
              </div>
              <span className="text-[11px] font-medium text-[#0066cc]">Certificación ASE</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SERVICES REJILLA (APPLE STORE BENTO LAYOUT) */}
      <section id="servicios" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          {/* Section Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0066cc] block">Servicios de Vanguardia</span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1d1d1f]">
              Nuestras especialidades de taller.
            </h2>
            <p className="text-sm sm:text-base text-[#6e6e73]">
              Procesos minuciosos bajo estrictos estándares internacionales y control de calidad sistematizado.
            </p>
          </div>

          {/* Bento-style Grid (rounded-3xl, warm backgrounds, crisp text) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Bento Card 1: Preventivo */}
            <div className="bg-[#F5F5F7] p-9 rounded-3xl border border-[#e8e8ed] hover:shadow-lg hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between min-h-[380px] group">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#1d1d1f] shadow-sm">
                  <CheckCircle className="w-6 h-6 text-[#0066cc]" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#1d1d1f]">Mantenimiento Preventivo Premium</h3>
                  <p className="text-sm text-[#6e6e73] leading-relaxed">
                    Lubricantes sintéticos de alto rendimiento, filtros certificados de grado de equipo original y revisión multipunto exhaustiva bajo protocolo de seguridad 360°.
                  </p>
                </div>
              </div>
              
              <div className="pt-6 border-t border-neutral-200 mt-8 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-[#6e6e73]">DESDE 5,000 KM</span>
                <button onClick={handleOpenModal} className="text-xs font-bold text-[#0066cc] flex items-center gap-0.5 group-hover:translate-x-1 transition-transform cursor-pointer">
                  Reservar →
                </button>
              </div>
            </div>

            {/* Bento Card 2: Diagnóstico */}
            <div className="bg-[#F5F5F7] p-9 rounded-3xl border border-[#e8e8ed] hover:shadow-lg hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between min-h-[380px] group">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#1d1d1f] shadow-sm">
                  <Gauge className="w-6 h-6 text-[#1d1d1f]" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#1d1d1f]">Escáner de Precisión y ECU</h3>
                  <p className="text-sm text-[#6e6e73] leading-relaxed">
                    Escaneo computarizado exhaustivo y análisis de osciloscopio digital en tiempo real. Detectamos fallas latentes en sensores, encendido y módulo de inyección de combustible.
                  </p>
                </div>
              </div>
              
              <div className="pt-6 border-t border-neutral-200 mt-8 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-[#6e6e73]">TIEMPO: 45 MIN</span>
                <button onClick={handleOpenModal} className="text-xs font-bold text-[#0066cc] flex items-center gap-0.5 group-hover:translate-x-1 transition-transform cursor-pointer">
                  Reservar →
                </button>
              </div>
            </div>

            {/* Bento Card 3: Mecánica */}
            <div className="bg-[#F5F5F7] p-9 rounded-3xl border border-[#e8e8ed] hover:shadow-lg hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between min-h-[380px] group">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#1d1d1f] shadow-sm">
                  <Activity className="w-6 h-6 text-[#1d1d1f]" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#1d1d1f]">Motor, Dirección y Cajas</h3>
                  <p className="text-sm text-[#6e6e73] leading-relaxed">
                    Calibración de transmisiones manuales y automáticas de alta complejidad. Reparación certificada de cabezotes, bloques de motor y sistemas de dirección hidráulica y asistida.
                  </p>
                </div>
              </div>
              
              <div className="pt-6 border-t border-neutral-200 mt-8 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-[#6e6e73]">GARANTÍA: 1 AÑO</span>
                <button onClick={handleOpenModal} className="text-xs font-bold text-[#0066cc] flex items-center gap-0.5 group-hover:translate-x-1 transition-transform cursor-pointer">
                  Reservar →
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. EXPERIENCIA DIGITAL SECTION (WARM ASSETS BACKGROUND, CLEAN PHONE MOCKUP) */}
      <section id="experiencia" className="py-24 bg-[#F5F5F7] border-t border-[#e8e8ed] relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: Text */}
            <div className="space-y-8 text-left">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0066cc]">CONTROL DIGITAL INTEGRAL</span>
              
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1d1d1f] leading-tight">
                Transparencia radical en cada servicio.
              </h2>
              
              <p className="text-base text-[#6e6e73] leading-relaxed">
                Olvídese de las sospechas e incertidumbres de los talleres tradicionales. Mediante nuestro exclusivo sistema de <span className="text-[#1d1d1f] font-semibold">Bitácora Automotriz Digital</span>, usted recibirá actualizaciones en tiempo real accesibles desde cualquier dispositivo.
              </p>

              {/* Minimal bullet items */}
              <div className="space-y-6 pt-4">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-[#e8e8ed] text-[#0066cc] shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#1d1d1f] block">Mapeo Gráfico de Daños 360°</span>
                    <p className="text-xs text-[#6e6e73] mt-1">Registramos el estado físico exacto del vehículo (raspones, abolladuras o estado de pintura) al momento del ingreso.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-[#e8e8ed] text-[#0066cc] shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#1d1d1f] block">Informe y Fotos en un Clic</span>
                    <p className="text-xs text-[#6e6e73] mt-1">Cada reparación recomendada incluye evidencia fotográfica y detalle técnico de repuestos antes de iniciar el trabajo.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Premium iPhone-like Mockup */}
            <div className="flex justify-center">
              <div className="bg-white border border-[#e8e8ed] rounded-[40px] p-6 max-w-sm w-full shadow-2xl relative">
                
                {/* Notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-4.5 bg-[#1d1d1f] rounded-full z-20"></div>
                
                <div className="space-y-4 pt-4">
                  {/* Mode Selector */}
                  <div className="flex border border-[#e8e8ed] rounded-full p-0.5 bg-[#F5F5F7]">
                    <button 
                      type="button"
                      onClick={() => { setSearchMode("demo"); setHasSearched(false); }}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer ${searchMode === "demo" ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73]"}`}
                    >
                      Demo Interactivo
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setSearchMode("real"); setHasSearched(false); setSearchPlateInput(""); }}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer ${searchMode === "real" ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73]"}`}
                    >
                      Buscar Mi Auto
                    </button>
                  </div>

                  {searchMode === "demo" ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-[#1d1d1f] flex items-center justify-center text-white text-[10px] font-bold">
                            QR
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-[#6e6e73] block uppercase">BITÁCORA DE CONTROL</span>
                            <span className="text-xs font-bold text-[#1d1d1f]">Audi Q7 • PBX-9980</span>
                          </div>
                        </div>
                        
                        <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase">
                          En Proceso
                        </div>
                      </div>

                      {/* Diagnóstico content container */}
                      <div className="bg-[#F5F5F7] rounded-2xl p-4 border border-[#e8e8ed] space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#6e6e73]">Inspección física:</span>
                          <span className="text-emerald-600 font-bold">Completado 🟢</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#6e6e73]">Frenos y Pastillas:</span>
                          <span className="font-semibold text-[#1d1d1f]">Reemplazo Sugerido</span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#6e6e73]">Filtros & Bujías:</span>
                          <span className="text-amber-600 font-semibold font-mono">Próxima Alerta</span>
                        </div>
                      </div>

                      {/* Elegant Apple progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-semibold text-[#1d1d1f]">
                          <span>Avance de Reparación</span>
                          <span>80%</span>
                        </div>
                        <div className="w-full bg-[#e8e8ed] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#0066cc] h-full rounded-full" style={{ width: "80%" }}></div>
                        </div>
                      </div>

                      <button 
                        onClick={handleOpenModal} 
                        className="w-full py-3 bg-[#1d1d1f] hover:bg-black text-white text-xs font-medium rounded-2xl transition-all cursor-pointer text-center"
                      >
                        Ver Orden de Trabajo Oficial
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 min-h-[220px] flex flex-col justify-between">
                      {!hasSearched ? (
                        <form onSubmit={handleSearchVehicle} className="space-y-4 pt-2">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#6e6e73] uppercase block">Placa del Vehículo</label>
                            <div className="relative">
                              <input 
                                type="text"
                                required
                                value={searchPlateInput}
                                onChange={(e) => setSearchPlateInput(e.target.value)}
                                placeholder="Ej: PBY-8472 o GCA-5921"
                                className="w-full pl-4 pr-10 py-3 bg-[#F5F5F7] border border-[#e8e8ed] rounded-xl text-xs text-[#1d1d1f] uppercase font-bold focus:outline-none focus:border-[#0066cc]"
                              />
                              <Search className="w-4 h-4 text-[#6e6e73] absolute right-3.5 top-3.5" />
                            </div>
                            <p className="text-[9px] text-[#86868b] leading-tight">
                              Ingrese el número de placa asignado a su orden de trabajo para consultar el estado en tiempo real.
                            </p>
                          </div>
                          
                          <button 
                            type="submit"
                            className="w-full py-3 bg-[#0066cc] hover:bg-[#0077ed] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                          >
                            Consultar Bitácora en Vivo
                          </button>
                        </form>
                      ) : searchedVehicle ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#0066cc]/10 flex items-center justify-center text-[#0066cc]">
                                <Car className="w-4 h-4" />
                              </div>
                              <div className="text-left">
                                <span className="text-[10px] font-bold text-[#1d1d1f] block leading-tight">
                                  {searchedVehicle.marca} {searchedVehicle.modelo}
                                </span>
                                <span className="text-[9px] text-[#6e6e73] uppercase font-mono">{searchedVehicle.placa}</span>
                              </div>
                            </div>
                            
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              searchedVehicle.estado === "Terminado" || searchedVehicle.estado === "Entregado"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                : searchedVehicle.estado === "En Proceso"
                                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                                  : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}>
                              {searchedVehicle.estado}
                            </span>
                          </div>

                          <div className="bg-[#F5F5F7] rounded-xl p-3.5 border border-[#e8e8ed] space-y-2 text-[11px] text-left">
                            <div className="flex justify-between">
                              <span className="text-[#6e6e73]">Ingreso:</span>
                              <span className="font-semibold text-[#1d1d1f]">{searchedVehicle.fechaIngreso}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#6e6e73]">Kilometraje:</span>
                              <span className="font-semibold text-[#1d1d1f]">{searchedVehicle.kilometraje.toLocaleString("es-EC")} km</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#6e6e73]">Nivel Combustible:</span>
                              <span className="font-semibold text-[#1d1d1f]">{searchedVehicle.nivelCombustible}%</span>
                            </div>
                          </div>

                          {/* Action to show detailed public timeline */}
                          <div className="space-y-2">
                            <button 
                              type="button"
                              onClick={() => {
                                if (onSearchPlate) {
                                  onSearchPlate(searchedVehicle.placa);
                                }
                              }}
                              className="w-full py-2.5 bg-[#0066cc] hover:bg-[#0077ed] text-white text-[11px] font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              Ver Bitácora Digital Completa <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => setHasSearched(false)}
                              className="w-full py-1.5 text-[10px] text-[#6e6e73] hover:text-[#1d1d1f] font-medium transition-all"
                            >
                              Buscar otra placa
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 text-center py-4">
                          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto animate-pulse" />
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-[#1d1d1f]">Vehículo no registrado</h4>
                            <p className="text-[10px] text-[#6e6e73] leading-normal px-2">
                              No encontramos un vehículo activo con la placa <span className="font-semibold text-[#1d1d1f] uppercase">{searchPlateInput}</span> en nuestro taller actualmente.
                            </p>
                          </div>
                          
                          <div className="space-y-2 pt-2">
                            <button 
                              type="button"
                              onClick={handleOpenModal}
                              className="w-full py-2.5 bg-[#1d1d1f] hover:bg-black text-white text-[11px] font-semibold rounded-xl transition-all"
                            >
                              Agendar Inspección Gratis
                            </button>
                            <button 
                              type="button"
                              onClick={() => setHasSearched(false)}
                              className="w-full py-1.5 text-[10px] text-[#6e6e73] hover:text-[#1d1d1f] font-medium transition-all"
                            >
                              Volver a buscar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5.1 TESTIMONIOS (SOCIAL PROOF) */}
      <section className="py-24 bg-[#1d1d1f] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6e6e73] block">Experiencias Reales</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Lo que dicen nuestros clientes.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#2d2d2f] p-8 rounded-3xl border border-[#3d3d3f] space-y-6">
              <div className="flex text-[#0066cc]">
                <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-sm text-gray-300 leading-relaxed font-medium">
                "La bitácora digital es increíble. Pude ver las fotos de mis pastillas de freno gastadas antes de aprobar el cambio. Nunca había sentido tanta confianza en un taller."
              </p>
              <div className="pt-4 border-t border-[#3d3d3f]">
                <span className="text-xs font-bold text-white block">Roberto M.</span>
                <span className="text-[10px] text-[#6e6e73]">Audi Q5 - Mantenimiento Mayor</span>
              </div>
            </div>

            <div className="bg-[#2d2d2f] p-8 rounded-3xl border border-[#3d3d3f] space-y-6 transform md:-translate-y-4">
              <div className="flex text-[#0066cc]">
                <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-sm text-gray-300 leading-relaxed font-medium">
                "Atención impecable. Traje mi auto por un fallo de motor que nadie encontraba. Su escáner 3D lo detectó en 20 minutos. Reparación perfecta y entregado limpio."
              </p>
              <div className="pt-4 border-t border-[#3d3d3f]">
                <span className="text-xs font-bold text-white block">Camila V.</span>
                <span className="text-[10px] text-[#6e6e73]">BMW 320i - Diagnóstico de Motor</span>
              </div>
            </div>

            <div className="bg-[#2d2d2f] p-8 rounded-3xl border border-[#3d3d3f] space-y-6">
              <div className="flex text-[#0066cc]">
                <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-sm text-gray-300 leading-relaxed font-medium">
                "El nivel de profesionalismo es de primera. Las instalaciones parecen un quirófano y los técnicos te explican todo con detalle sin usar tecnicismos confusos."
              </p>
              <div className="pt-4 border-t border-[#3d3d3f]">
                <span className="text-xs font-bold text-white block">Andrés F.</span>
                <span className="text-[10px] text-[#6e6e73]">Ford Explorer - Suspensión y Frenos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5.3 GALERIA / INSTALACIONES (HIGH ENGINEERING VISUAL) */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0066cc]">Infraestructura de Clase Mundial</span>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1d1d1f] leading-tight">
                Diseñado para la máxima precisión.
              </h2>
              <p className="text-sm sm:text-base text-[#6e6e73] leading-relaxed">
                Nuestras instalaciones están equipadas con tecnología de punta europea, elevadores simétricos de alta capacidad y áreas de diagnóstico libres de polvo para garantizar intervenciones exactas. Todo en un ambiente impecable que refleja la calidad de nuestro trabajo.
              </p>
              
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div>
                  <span className="text-2xl font-bold text-[#1d1d1f] block">1,200 m²</span>
                  <span className="text-xs font-medium text-[#6e6e73]">de área técnica techada</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-[#1d1d1f] block">12</span>
                  <span className="text-xs font-medium text-[#6e6e73]">bahías de servicio simultáneo</span>
                </div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute inset-0 bg-[#0066cc] rounded-3xl blur-2xl opacity-10 group-hover:opacity-20 transition-all duration-700"></div>
              <img 
                src="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=1200&auto=format&fit=crop" 
                alt="Infraestructura del Taller Automotriz" 
                className="relative rounded-3xl shadow-2xl object-cover h-[400px] w-full"
              />
              <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1d1d1f] flex items-center justify-center text-white">
                  <Camera className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-[#1d1d1f] block">Bahía de Diagnóstico 3D</span>
                  <span className="text-[9px] text-[#6e6e73]">Operativa 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5.5. FAQ ACCORDION SECTION (Apple Store style) */}
      <section id="preguntas-frecuentes" className="py-24 bg-white border-t border-[#e8e8ed]">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0066cc] block">Preguntas Frecuentes</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f]">
              Respuestas claras a sus dudas.
            </h2>
            <p className="text-sm text-[#6e6e73]">
              Todo lo que necesita saber sobre nuestro servicio técnico especializado y la bitácora digital.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "¿Cómo puedo ver el progreso de reparación de mi auto en tiempo real?",
                a: "Muy fácil. Al ingresar su vehículo al taller, se genera una orden con un número de placa o código QR. Puede ingresar la placa de su auto en el panel superior 'Buscar Mi Auto' o escanear el código QR único de su orden. Eso cargará instantáneamente fotos, diagnósticos de escáner y el avance actual."
              },
              {
                q: "¿Qué incluye el diagnóstico de escáner de precisión y telemetría?",
                a: "Incluye el escaneo exhaustivo de códigos de error de todas las computadoras (ECU, ABS, Airbags), lectura en tiempo real de flujos de datos de sensores, pruebas mecánicas de compresión y un reporte fotográfico completo de 120 puntos críticos."
              },
              {
                q: "¿Qué tipo de repuestos y garantía ofrecen en CQ Motors?",
                a: "Utilizamos estrictamente repuestos originales y alternos premium homologados de fábrica con especificaciones idénticas a los originales. Todas nuestras intervenciones complejas y componentes instalados cuentan con garantía técnica escrita de hasta 1 año o 20,000 km."
              },
              {
                q: "¿Cómo funciona el sistema de acumulación de puntos y recompensas?",
                a: "Cada servicio realizado en CQ Motors acumula el 5% del valor neto facturado en puntos de lealtad. Estos puntos pueden ser canjeados directamente en su portal de cliente por servicios gratuitos, alineaciones en 3D, lavados premium de motor o descuentos en mantenimientos preventivos futuros."
              }
            ].map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="border-b border-[#e8e8ed] pb-4">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex justify-between items-center py-4 text-left font-semibold text-sm sm:text-base text-[#1d1d1f] hover:text-[#0066cc] transition-colors focus:outline-none cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="text-xs text-[#6e6e73] font-mono select-none ml-4">
                      {isOpen ? "[ − ]" : "[ + ]"}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed pb-4 pr-6">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. PIE DE PÁGINA (APPLE MINIMAL FOOTER) */}
      <footer className="bg-[#F5F5F7] border-t border-[#e8e8ed] py-16 text-[#6e6e73] text-xs font-normal">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#1d1d1f] flex items-center justify-center shadow-sm">
                <Wrench className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold text-[#1d1d1f] uppercase tracking-wider">CQ MOTORS</span>
            </div>
            <p className="leading-relaxed text-[#6e6e73]">
              Soporte automotriz premium bajo estrictos estándares de ingeniería de alta precisión y calidad de servicio certificada.
            </p>
            <p className="text-[10px] text-[#86868b] font-mono">
              © {new Date().getFullYear()} CQ Motors S.A. Todos los derechos reservados.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="text-[#1d1d1f] font-semibold text-[11px] uppercase tracking-wider">Horario de Atención</h4>
            <ul className="space-y-2 leading-relaxed">
              <li className="flex justify-between border-b border-[#e8e8ed] pb-1">
                <span>Lunes a Viernes:</span>
                <span className="text-[#1d1d1f] font-medium">08:00 - 18:30</span>
              </li>
              <li className="flex justify-between border-b border-[#e8e8ed] pb-1">
                <span>Sábados:</span>
                <span className="text-[#1d1d1f] font-medium">09:00 - 14:00</span>
              </li>
              <li className="flex justify-between pb-1">
                <span>Domingos:</span>
                <span className="text-[#0066cc] font-semibold">Cerrado</span>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="text-[#1d1d1f] font-semibold text-[11px] uppercase tracking-wider">Ubicación Central</h4>
            <p className="leading-relaxed">
              Av. de los Granados N44-20 y Eloy Alfaro,<br />
              Quito, Ecuador.
            </p>
            <p className="leading-relaxed">
              Telf: <a href="tel:+59322448899" className="text-[#1d1d1f] hover:text-[#0066cc] font-medium transition-colors">+593 2 244 8899</a><br />
              Email: <a href="mailto:soporte@cqmotors.com" className="text-[#1d1d1f] hover:text-[#0066cc] font-medium transition-colors">soporte@cqmotors.com</a>
            </p>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <h4 className="text-[#1d1d1f] font-semibold text-[11px] uppercase tracking-wider">Legalidad & Enlaces</h4>
            <ul className="space-y-1.5 flex flex-col items-start text-xs">
              <li>
                <button 
                  onClick={() => setShowPrivacyModal(true)} 
                  className="hover:text-[#1d1d1f] text-left transition-all cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                >
                  Política de Privacidad
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setShowPrivacyModal(true)} 
                  className="hover:text-[#1d1d1f] text-left transition-all cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                >
                  Gestión de Datos de IA
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    const el = document.getElementById("preguntas-frecuentes");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }} 
                  className="hover:text-[#1d1d1f] text-left transition-all cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                >
                  Preguntas Frecuentes
                </button>
              </li>
              <li>
                <button 
                  onClick={handleOpenModal} 
                  className="hover:text-[#1d1d1f] text-left transition-all cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                >
                  Agendar Cita
                </button>
              </li>
            </ul>
          </div>

        </div>
      </footer>

      {/* 8. POPUP MODAL PARA AGENDAR CITAS - APPLE PREMIUM LIGHT DESIGN */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#e8e8ed] w-full max-w-md rounded-3xl p-7 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              
              {/* Close button */}
              <button onClick={handleCloseModal} className="absolute top-5 right-5 text-[#6e6e73] hover:text-[#1d1d1f] cursor-pointer">
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066cc] font-mono block">CQ MOTORS SCHEDULER</span>
                <h3 className="text-xl font-bold text-[#1d1d1f]">Agendar Inspección de Diagnóstico</h3>
                <p className="text-xs text-[#6e6e73]">Complete los datos y nuestro sistema agendará su espacio inmediatamente.</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#6e6e73] block">Nombre Completo *</label>
                  <input 
                    type="text" 
                    required 
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="Ej. Ronny Cadena" 
                    className="w-full px-4 py-3 bg-[#F5F5F7] border border-[#e8e8ed] rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#6e6e73] block">Teléfono</label>
                    <input 
                      type="tel" 
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      placeholder="Ej. 0991234567" 
                      className="w-full px-4 py-3 bg-[#F5F5F7] border border-[#e8e8ed] rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#6e6e73] block">Correo Electrónico</label>
                    <input 
                      type="email" 
                      value={custMail}
                      onChange={(e) => setCustMail(e.target.value)}
                      placeholder="Ej. ronny@correo.com" 
                      className="w-full px-4 py-3 bg-[#F5F5F7] border border-[#e8e8ed] rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#6e6e73] block">Placa *</label>
                    <input 
                      type="text" 
                      required 
                      value={custPlate}
                      onChange={(e) => setCustPlate(e.target.value)}
                      placeholder="PBA-1234" 
                      className="w-full px-3 py-3 bg-[#F5F5F7] border border-[#e8e8ed] rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] font-medium uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#6e6e73] block">Marca</label>
                    <input 
                      type="text" 
                      value={custBrand}
                      onChange={(e) => setCustBrand(e.target.value)}
                      placeholder="Audi" 
                      className="w-full px-3 py-3 bg-[#F5F5F7] border border-[#e8e8ed] rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#6e6e73] block">Modelo</label>
                    <input 
                      type="text" 
                      value={custModel}
                      onChange={(e) => setCustModel(e.target.value)}
                      placeholder="Q5" 
                      className="w-full px-3 py-3 bg-[#F5F5F7] border border-[#e8e8ed] rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#6e6e73] block">Fecha Solicitada *</label>
                    <input 
                      type="date" 
                      required 
                      value={custDate}
                      onChange={(e) => setCustDate(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F5F5F7] border border-[#e8e8ed] rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#6e6e73] block">Servicio Requerido *</label>
                    <select 
                      value={custService}
                      onChange={(e) => setCustService(e.target.value)}
                      required 
                      className="w-full px-4 py-3 bg-[#F5F5F7] border border-[#e8e8ed] rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] font-medium cursor-pointer"
                    >
                      <option value="Mantenimiento Preventivo">Mantenimiento Preventivo</option>
                      <option value="Diagnóstico Escáner">Diagnóstico de Escáner</option>
                      <option value="Frenos / Suspensión">Frenos y Dirección</option>
                      <option value="Motor / Caja">Mecánica Compleja</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#6e6e73] block">Comentarios adicionales</label>
                  <textarea 
                    value={custComments}
                    onChange={(e) => setCustComments(e.target.value)}
                    placeholder="Escriba aquí si siente algún ruido, falla o requiere algún filtro específico..." 
                    className="w-full px-4 py-3 bg-[#F5F5F7] border border-[#e8e8ed] rounded-xl text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] font-medium h-16 resize-none"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#0066cc] hover:bg-[#0077ed] disabled:opacity-55 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {isSubmitting ? "Registrando su Cita..." : "Confirmar Reserva Técnica"}
                </button>
              </form>

            </motion.div>
          </div>
        )}

        {showPrivacyModal && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#e8e8ed] w-full max-w-2xl rounded-3xl p-7 sm:p-8 shadow-2xl space-y-6 relative max-h-[85vh] overflow-y-auto"
            >
              {/* Close button */}
              <button 
                onClick={() => setShowPrivacyModal(false)} 
                className="absolute top-5 right-5 text-[#6e6e73] hover:text-[#1d1d1f] cursor-pointer focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2 pb-2 border-b border-[#e8e8ed]">
                <div className="flex items-center gap-2 text-[#0066cc]">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono">SEGURIDAD Y TRANSPARENCIA</span>
                </div>
                <h3 className="text-2xl font-bold text-[#1d1d1f]">Política de Privacidad y Gestión de Datos</h3>
                <p className="text-xs text-[#6e6e73]">
                  Última actualización: {new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div className="space-y-6 text-[#1d1d1f] text-xs sm:text-sm leading-relaxed max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin">
                
                <section className="space-y-2">
                  <h4 className="font-bold text-[#1d1d1f] text-sm flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[10px] text-[#0066cc] font-mono">1</span>
                    Introducción
                  </h4>
                  <p className="text-[#6e6e73]">
                    En <strong>CQ Motors S.A.</strong> ("nosotros", "nuestro", "la plataforma"), nos comprometemos a proteger la privacidad y seguridad de los datos de nuestros usuarios. Esta política explica cómo recopilamos, utilizamos, almacenamos y protegemos la información personal cuando utilizas nuestros servicios digitales y herramientas de gestión impulsadas por Inteligencia Artificial.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-[#1d1d1f] text-sm flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[10px] text-[#0066cc] font-mono">2</span>
                    Datos que Recopilamos
                  </h4>
                  <p className="text-[#6e6e73]">
                    Para proporcionar nuestros servicios técnicos y de gestión automotriz, podemos recopilar las siguientes categorías de datos:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-[#6e6e73]">
                    <li><strong>Datos de identificación:</strong> Nombre completo, número telefónico, dirección de correo electrónico e información de contacto proporcionada al registrar citas o ingresar al sistema.</li>
                    <li><strong>Datos del vehículo:</strong> Placa del vehículo, marca, modelo, año, kilometraje, historial de mantenimientos anteriores y fotos de diagnósticos técnicos.</li>
                    <li><strong>Datos de interacción (Prompts):</strong> El texto, consultas, preguntas o contenido que introduces en nuestra plataforma de soporte para ser procesado por los modelos analíticos o de Inteligencia Artificial.</li>
                    <li><strong>Datos técnicos y de uso:</strong> Direcciones IP, tipo de navegador, sistema operativo y registros de actividad dentro de la página web para fines de auditoría de seguridad y mejoras continuas.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-[#1d1d1f] text-sm flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[10px] text-[#0066cc] font-mono">3</span>
                    Uso de la Información y Procesamiento con IA
                  </h4>
                  <p className="text-[#6e6e73]">
                    Los datos recopilados se utilizan exclusivamente para los siguientes fines:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-[#6e6e73]">
                    <li><strong>Provisión de servicios:</strong> Procesar tus solicitudes de citas mecánicas, generar bitácoras digitales de control y desplegar tus métricas e historial de mantenimiento en vivo.</li>
                    <li><strong>Mejora de la plataforma:</strong> Analizar patrones agregados de rendimiento para optimizar la velocidad del sistema, usabilidad y precisión predictiva de fallas.</li>
                    <li><strong>Comunicación directa:</strong> Notificar el estado de reparación de su auto, alertas automáticas de mantenimiento predictivo o respuestas personalizadas de soporte técnico.</li>
                  </ul>
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-1.5 mt-3">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block tracking-wider font-mono">⚠️ AVISO CRÍTICO DE SEGURIDAD EN INTELIGENCIA ARTIFICIAL</span>
                    <p className="text-amber-900 text-xs leading-relaxed">
                      El contenido que envías a través de nuestros canales de texto y prompts de consulta es procesado por modelos avanzados de inteligencia artificial de terceros (<strong>Google AI Studio / Gemini API</strong>). Recomendamos estrictamente <strong>no incluir información personal altamente sensible</strong> (como contraseñas, números de cuentas financieras directas o de identificación) dentro de las consultas abiertas a la IA.
                    </p>
                  </div>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-[#1d1d1f] text-sm flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[10px] text-[#0066cc] font-mono">4</span>
                    Compartición de Datos con Terceros
                  </h4>
                  <p className="text-[#6e6e73]">
                    Garantizamos que <strong>no vendemos, comercializamos ni transferimos</strong> tus datos personales a terceras partes con fines publicitarios. Para la correcta operatividad técnica, compartimos información exclusivamente con:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-[#6e6e73]">
                    <li><strong>Google (AI Studio & API):</strong> Los textos de consulta y prompts técnicos se transmiten de forma cifrada a través de la API oficial de Google para generar diagnósticos enriquecidos, operando bajo las políticas globales de seguridad de Google.</li>
                    <li><strong>Firebase (Google Cloud Platform):</strong> Proveedor de infraestructura crítica que almacena de forma segura la base de datos de bitácoras, fotos del taller, información de clientes y credenciales cifradas con los máximos niveles de seguridad de la industria.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-[#1d1d1f] text-sm flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[10px] text-[#0066cc] font-mono">5</span>
                    Retención de Datos
                  </h4>
                  <p className="text-[#6e6e73]">
                    Conservaremos tus datos personales únicamente durante el tiempo que sea estrictamente necesario para cumplir con los fines detallados de mantenimiento preventivo, soporte al historial de tu auto, o para dar estricto cumplimiento a normativas comerciales y de seguridad de datos.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-[#1d1d1f] text-sm flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[10px] text-[#0066cc] font-mono">6</span>
                    Tus Derechos (Derechos ARCO y LOPDP)
                  </h4>
                  <p className="text-[#6e6e73]">
                    Como usuario, ejerces control absoluto sobre tu información según la Ley Orgánica de Protección de Datos Personales (LOPDP). Tienes pleno derecho a:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-[#6e6e73]">
                    <li><strong>Acceso:</strong> Solicitar un informe detallado de toda la información de tus autos y bitácoras que mantenemos en la base de datos.</li>
                    <li><strong>Rectificación:</strong> Corregir de forma inmediata datos erróneos de placas, kilometrajes o datos de contacto.</li>
                    <li><strong>Eliminación (Olvido):</strong> Solicitar la desactivación total y el borrado seguro de tu registro histórico en nuestras bases de datos de Firebase.</li>
                    <li><strong>Oposición:</strong> Restringir el uso de tu correo electrónico o teléfono para avisos preventivos automatizados o boletines técnicos.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-[#1d1d1f] text-sm flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[10px] text-[#0066cc] font-mono">7</span>
                    Seguridad de los Datos
                  </h4>
                  <p className="text-[#6e6e73]">
                    Implementamos protocolos avanzados como cifrado de datos en tránsito (SSL/TLS de alta gama), firewalls activos de base de datos en Firebase y rigurosas reglas de autenticación para salvaguardar tu información frente a accesos maliciosos o destrucciones accidentales.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-[#1d1d1f] text-sm flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[10px] text-[#0066cc] font-mono">8</span>
                    Contacto Directo
                  </h4>
                  <p className="text-[#6e6e73]">
                    Si tienes consultas o deseas ejercer alguno de tus derechos de protección de datos, contáctanos directamente:
                  </p>
                  <p className="text-xs text-[#1d1d1f] font-medium bg-[#F5F5F7] p-3 rounded-xl border border-[#e8e8ed]">
                    📧 Correo de soporte: <a href="mailto:soporte@cqmotors.com" className="text-[#0066cc] hover:underline">soporte@cqmotors.com</a><br/>
                    🌐 Portal oficial: <a href="https://cqmotors.com" target="_blank" rel="noreferrer" className="text-[#0066cc] hover:underline">https://cqmotors.com</a>
                  </p>
                </section>

              </div>

              <div className="pt-4 border-t border-[#e8e8ed] flex justify-end">
                <button 
                  onClick={() => setShowPrivacyModal(false)} 
                  className="px-6 py-2.5 bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Entendido y Aceptar
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
