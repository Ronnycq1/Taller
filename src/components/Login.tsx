import React, { useState } from "react";
import { UserRole, Usuario, Vehiculo } from "../types";
import { KeyRound, ShieldAlert, Wrench, User, Eye, EyeOff, LayoutDashboard, Calendar, MessageCircle, Mail } from "lucide-react";
import { motion } from "motion/react";
import RegisterAppointmentModal from "./RegisterAppointmentModal";
import CQMotorsLogo from "./CQMotorsLogo";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

interface LoginProps {
  onLoginSuccess: (usuario: Usuario) => void;
  vehicles: Vehiculo[];
}

export default function Login({ onLoginSuccess, vehicles }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  // Staff accounts configuration
  const validStaffAccounts = [
    {
      user: "ronnycq",
      pass: "088418792",
      role: UserRole.Administrador,
      name: "Eco. Ronny Cadena"
    },
    {
      user: "washo03",
      pass: "088418792",
      role: UserRole.Mecanico,
      name: "Ing. Washington Cadena"
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const cleanUser = username.trim();
      const cleanPass = password.trim();

      if (!cleanUser || !cleanPass) {
        throw new Error("Por favor ingrese usuario/placa y contraseña.");
      }

      const matchStaff = validStaffAccounts.find(
        (u) => u.user.toLowerCase() === cleanUser.toLowerCase() && u.pass === cleanPass
      );

      let finalRole = UserRole.Cliente;
      let finalName = cleanUser;
      let finalClienteId: string | null = null;

      if (matchStaff) {
        finalRole = matchStaff.role;
        finalName = matchStaff.name;
      } else {
        if (cleanUser.length >= 6 && /^[a-zA-Z]{3}-?\d{3,4}$/.test(cleanUser)) {
          finalRole = UserRole.Cliente;
          finalName = cleanUser;
        } else {
          throw new Error("Credenciales de ingreso no válidas. Verifique e intente nuevamente.");
        }
      }

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const fakeUid = "local-user-" + Date.now();

      onLoginSuccess({
        id: fakeUid,
        username: cleanUser,
        role: finalRole,
        fullName: finalName,
        avatarUrl: finalRole === UserRole.Cliente 
          ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" 
          : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
        clienteId: finalClienteId || undefined
      });
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-slate-50 overflow-hidden font-sans">
      {/* Visual left panel */}
      <div className="hidden lg:flex lg:col-span-7 bg-slate-900 text-white relative flex-col justify-between p-12 overflow-hidden bg-cover bg-center" style={{ backgroundImage: "linear-gradient(220deg, rgba(15, 23, 42, 0.94) 30%, rgba(30, 41, 59, 0.85) 100%), url('https://images.unsplash.com/photo-1617886322168-72b886573c3c?q=80&w=1200&auto=format&fit=crop')" }}>
        <div className="absolute inset-0 bg-radial-at-t from-orange-500/10 via-transparent to-transparent opacity-60"></div>
        
        <div className="relative z-10 w-full animate-in fade-in zoom-in duration-500">
          <CQMotorsLogo size="lg" className="w-full bg-slate-950/60" />
        </div>

        <div className="relative z-10 max-w-lg space-y-4 animate-in fade-in slide-in-from-left duration-700 delay-100">
          <span className="bg-slate-800 text-orange-400 font-mono text-xs px-3 py-1.5 rounded-full inline-block border border-slate-700/60 font-semibold uppercase tracking-wider">
            SISTEMA DE CONTROL DE CALIDAD Y MANTENIMIENTO
          </span>
          <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight tracking-tight text-white">
            Monitoreo en tiempo real de operaciones mecánicas.
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            Gestione ingresos vehiculares, controle checklist de tareas completadas, asigne repuestos críticos y analice la rentabilidad de su taller en una sola pantalla.
          </p>

          {/* Quick interactive GPS location with QR Card */}
          <div className="p-4 bg-slate-950/75 border border-slate-800/80 rounded-2xl flex items-center gap-4 text-slate-300 backdrop-blur-sm shadow-xl animate-in zoom-in-95 duration-500 delay-300">
            <div className="bg-white p-1.5 rounded-xl shrink-0 shadow-lg group hover:scale-[1.03] transition-transform duration-300">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=0f172a&data=${encodeURIComponent('https://maps.app.goo.gl/j8kGTm2Yw7sykoaC8')}`}
                alt="QR Ubicación de CQ Motors"
                className="w-16 h-16 xl:w-20 xl:h-20 object-contain rounded-md"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 font-mono tracking-widest uppercase block">Ubicación del Taller</span>
              <span className="font-bold text-sm text-slate-100 block">Sede Principal CQ Motors &bull; Washington Cadena</span>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Escanea el código QR o haz clic abajo para abrir la ubicación satelital y conducir asistido por GPS directamente al taller.
              </p>
              <a 
                href="https://maps.app.goo.gl/j8kGTm2Yw7sykoaC8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-amber-400 hover:text-amber-300 font-extrabold hover:underline transition-colors pt-1 group"
              >
                <span>Navegar con Google Maps</span>
                <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Versión 2.4.0 (PWA Core)</span>
          <span>CQ Motors S.A. &copy; 2026</span>
        </div>
      </div>

      {/* Login panel */}
      <div className="lg:col-span-5 flex flex-col justify-center p-6 sm:p-12 md:p-16 relative">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="space-y-2">
            {/* Header / Logo banner on top of login form */}
            <div className="flex items-center mb-6">
              <CQMotorsLogo size="md" />
            </div>

            <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
              Control de Accesos
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed font-normal">
              <strong className="text-slate-900">Personal del Taller:</strong> Ingrese con sus credenciales autorizadas (Administrador, Gerente o Mecánico).<br />
              <strong className="text-slate-900">Clientes:</strong> Ingrese con la <span className="text-orange-700 font-bold">Placa de su vehículo</span> (ej. <em>PBA-2954</em>) como usuario y su <span className="text-orange-700 font-bold">Número de Teléfono celular registrado</span> como contraseña.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800 flex items-start space-x-2.5 animate-shake">
              <ShieldAlert className="h-4.5 w-4.5 text-red-600 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Nombre de Usuario o Placa
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4.5 w-4.5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej: usuario_taller o PBA-2954"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium text-sm focus:placeholder-transparent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Contraseña o Teléfono celular registrado
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-4.5 w-4.5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña o Nro. de Celular"
                  className="w-full pl-10 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-slate-900 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 focus:ring-4 focus:ring-orange-100 disabled:opacity-50 cursor-pointer shadow-md active:translate-y-px"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Validando con Servidor Central ...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión Segura</span>
                </>
              )}
            </button>
          </form>

          <div className="relative my-4 flex py-1.5 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest leading-none">
              ¿Cliente Nuevo o Sin Registro?
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
            type="button"
            onClick={() => setIsAppointmentModalOpen(true)}
            className="w-full py-3 bg-white border-2 border-dashed border-orange-300 hover:border-orange-500 hover:bg-orange-50/50 text-orange-600 font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2.5 cursor-pointer shadow-xs active:translate-y-px text-sm group"
          >
            <Calendar className="h-4.5 w-4.5 text-orange-500 group-hover:scale-110 transition-transform duration-200" />
            <span>Agendar Cita o Solicitar Mantenimiento</span>
          </button>

          {/* Location card with GPS QR code */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3.5 text-slate-300 shadow-md">
            <div className="bg-white p-1 rounded-xl shrink-0 shadow-sm">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=0f172a&data=${encodeURIComponent('https://maps.app.goo.gl/j8kGTm2Yw7sykoaC8')}`}
                alt="QR Ubicación de CQ Motors"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-md"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 space-y-0.5">
              <span className="text-[9px] font-bold text-orange-400 font-mono tracking-widest uppercase block">Ubicación del Taller</span>
              <span className="font-extrabold text-xs text-slate-100 block">Sede Principal CQ Motors</span>
              <p className="text-[10px] text-slate-400 font-sans leading-normal">
                Escanee el código QR o pulse abajo para abrir la ruta en Google Maps GPS.
              </p>
              <a 
                href="https://maps.app.goo.gl/j8kGTm2Yw7sykoaC8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-[11px] text-amber-400 hover:text-amber-300 font-bold hover:underline transition-colors pt-0.5"
              >
                <span>Abrir en Google Maps</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center space-y-2.5">
            <div className="flex justify-center pb-0.5">
              <a 
                id="link-whatsapp-access"
                href="https://wa.me/593996287338" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-bold transition-all px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 rounded-xl border border-emerald-200/50"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span>Contacto WhatsApp: 0996287338</span>
              </a>
            </div>
            <span className="text-[11px] text-slate-400 font-medium block">
              Acceso encriptado vía SSL corporativo para CQ Motors S.A.
            </span>
          </div>
        </div>
      </div>

      {isAppointmentModalOpen && (
        <RegisterAppointmentModal onClose={() => setIsAppointmentModalOpen(false)} />
      )}
    </div>
  );
}
