import React, { useState } from "react";
import { Vehiculo, Cliente, UserRole } from "../types";
import CQMotorsLogo from "./CQMotorsLogo";
import { 
  Car, 
  Plus, 
  Search, 
  User, 
  Phone, 
  Mail, 
  Hash, 
  Activity, 
  Gauge, 
  Fuel, 
  CalendarRange,
  ChevronRight,
  Filter,
  CheckCircle2,
  Trash2,
  QrCode,
  X,
  Sparkles,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VehicleManagerProps {
  vehicles: Vehiculo[];
  userRole: UserRole;
  onRegisterVehicle: (newVehicle: Vehiculo) => void;
  onSelectVehicle: (v: Vehiculo) => void;
  onDeleteVehicle?: (vehicleId: string) => void;
}

export default function VehicleManager({
  vehicles,
  userRole,
  onRegisterVehicle,
  onSelectVehicle,
  onDeleteVehicle
}: VehicleManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBrand, setFilterBrand] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [justRegisteredVehicle, setJustRegisteredVehicle] = useState<Vehiculo | null>(null);

  // Form Fields State
  const [placa, setPlaca] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [correoCliente, setCorreoCliente] = useState("");
  const [kilometraje, setKilometraje] = useState<number | "">("");
  const [gasLevel, setGasLevel] = useState(50);
  const [tipoUso, setTipoUso] = useState<"Particular" | "Trabajo">("Particular");
  const [filterTipoUso, setFilterTipoUso] = useState<"All" | "Particular" | "Trabajo">("All");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehiculo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 360° DAMAGE INSPECTION APPLET STATES (6th of 8 improvements)
  const [damages, setDamages] = useState<Record<string, boolean>>({
    capo: false,
    parachoquesDel: false,
    puertaDer: false,
    puertaIzqr: false,
    parabrisas: false,
    techo: false,
    retrovisores: false,
    maletero: false
  });

  const toggleDamageZone = (zone: string) => {
    setDamages(prev => ({ ...prev, [zone]: !prev[zone] }));
  };

  // Distinct Brands for quick filtering
  const distinctBrands = Array.from(new Set(vehicles.map((v) => v.marca)));

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Basic Validations
    if (!placa.trim()) newErrors.placa = "La placa es obligatoria.";
    else if (placa.trim().length < 6) newErrors.placa = "Formato de placa inválido.";
    
    if (!marca.trim()) newErrors.marca = "Especifique el fabricante/marca.";
    if (!modelo.trim()) newErrors.modelo = "Especifique el modelo.";
    
    const currYear = new Date().getFullYear();
    if (anio < 1920 || anio > currYear + 1) {
      newErrors.anio = `El año debe estar entre 1920 y ${currYear + 1}.`;
    }

    if (!nombreCliente.trim()) newErrors.nombreCliente = "El nombre del cliente es obligatorio.";
    if (!telefonoCliente.trim()) newErrors.telefonoCliente = "El teléfono / WhatsApp es obligatorio.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newCliente: Cliente = {
      id: `cli-${Date.now()}`,
      nombre: nombreCliente,
      telefono: telefonoCliente,
      correo: correoCliente || `${nombreCliente.toLowerCase().replace(/\s+/g, '')}@example.com`
    };

    const newVehiculo: Vehiculo = {
      id: `veh-${Date.now()}`,
      placa: placa.toUpperCase().trim(),
      marca: marca,
      modelo: modelo,
      anio: Number(anio),
      cliente: newCliente,
      fechaIngreso: new Date().toISOString(),
      estado: "Ingresado",
      kilometraje: Number(kilometraje || 0),
      tipoUso: tipoUso,
      nivelCombustible: Number(gasLevel),
      inspeccionDanos: {
        frontal: damages.capo || damages.parachoquesDel ? "Abolladura / Golpe Delantero" : "Sin Daño",
        posterior: damages.maletero ? "Golpe en capota trasera" : "Sin Daño",
        lateralIzquierdo: damages.puertaIzqr ? "Rayón lateral izquierdo" : "Sin Daño",
        lateralDerecho: damages.puertaDer ? "Fisura lateral derecho" : "Sin Daño",
        techo: damages.techo ? "Abolladura superior de techo" : "Sin Daño",
        parabrisas: damages.parabrisas || damages.retrovisores ? "Trizadura o retrovisor afectado" : "Sin Daño"
      }
    };

    onRegisterVehicle(newVehiculo);
    setJustRegisteredVehicle(newVehiculo);

    // Reset Form Fields
    setPlaca("");
    setMarca("");
    setModelo("");
    setNombreCliente("");
    setTelefonoCliente("");
    setCorreoCliente("");
    setKilometraje("");
    setGasLevel(50);
    setTipoUso("Particular");
    setDamages({
      capo: false,
      parachoquesDel: false,
      puertaDer: false,
      puertaIzqr: false,
      parabrisas: false,
      techo: false,
      retrovisores: false,
      maletero: false
    });
    setErrors({});
    setShowRegisterForm(false);
  };

  // Filter vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = 
      v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.marca.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBrand = filterBrand === "All" || v.marca === filterBrand;
    const matchesStatus = filterStatus === "All" || v.estado === filterStatus;
    const matchesTipoUso = filterTipoUso === "All" || (v.tipoUso || "Particular") === filterTipoUso;

    return matchesSearch && matchesBrand && matchesStatus && matchesTipoUso;
  });

  return (
    <div className="space-y-6">
      {userRole === UserRole.Cliente && (
        <div className="animate-in fade-in zoom-in-5 duration-300">
          <CQMotorsLogo size="lg" className="w-full" />
        </div>
      )}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-900">Gestión de Patio y Flota</h2>
          <p className="text-xs text-slate-500">
            Filtre, registre e ingrese nuevos autos al taller central. Inicie hojas de ruta correspondientes.
          </p>
        </div>

        {/* Register Button (Hidden for pure Mechanics & Clients who only visualize) */}
        {userRole !== UserRole.Mecanico && userRole !== UserRole.Cliente && (
          <button
            onClick={() => setShowRegisterForm(!showRegisterForm)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-sm transition-all cursor-pointer self-start md:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Ingresar Vehículo Nuevo</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {showRegisterForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md space-y-5">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 font-display">
                <Car className="h-5 w-5 text-emerald-500" />
                <h3 className="font-bold text-slate-900 text-base">Ficha de Admisión y Recepción</h3>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* Vehicle Section */}
                <div className="md:col-span-6 space-y-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest border-b pb-1">
                    1. Datos de Maquinaria / Vehículo
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Número de Placa *</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={placa}
                          onChange={(e) => setPlaca(e.target.value)}
                          placeholder="Ej. PBA-2954"
                          className="w-full pl-9 pr-3 py-2 border rounded-xl bg-slate-50 border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs font-bold uppercase"
                        />
                      </div>
                      {errors.placa && <span className="text-[10px] text-red-500 font-medium block mt-1">{errors.placa}</span>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Firma / Marca *</label>
                      <input
                        type="text"
                        value={marca}
                        onChange={(e) => setMarca(e.target.value)}
                        placeholder="Ej. Toyota, Hyundai"
                        className="w-full px-3.5 py-2 border rounded-xl bg-slate-50 border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs font-medium"
                      />
                      {errors.marca && <span className="text-[10px] text-red-500 font-medium block mt-1">{errors.marca}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Modelo Comercial *</label>
                      <input
                        type="text"
                        value={modelo}
                        onChange={(e) => setModelo(e.target.value)}
                        placeholder="Ej. Hilux CD 4x4"
                        className="w-full px-3.5 py-2 border rounded-xl bg-slate-50 border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs font-medium"
                      />
                      {errors.modelo && <span className="text-[10px] text-red-500 font-medium block mt-1">{errors.modelo}</span>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Año de Fabricación *</label>
                      <input
                        type="number"
                        value={anio}
                        onChange={(e) => setAnio(Number(e.target.value))}
                        className="w-full px-3.5 py-2 border rounded-xl bg-slate-50 border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs font-medium"
                      />
                      {errors.anio && <span className="text-[10px] text-red-500 font-medium block mt-1">{errors.anio}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Odómetro (Km) *</label>
                      <div className="relative">
                        <Gauge className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="number"
                          value={kilometraje}
                          placeholder="50000"
                          onChange={(e) => {
                            const val = e.target.value;
                            setKilometraje(val === "" ? "" : Number(val));
                          }}
                          className="w-full pl-9 pr-3 py-2 border rounded-xl bg-slate-50 border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                        <span>Combustible del Tanque</span>
                        <span className="font-mono text-emerald-600 font-bold">{gasLevel}%</span>
                      </label>
                      <div className="flex items-center space-x-2 pt-2 bg-slate-50 border border-slate-200 p-2 rounded-xl">
                        <Fuel className="h-4 w-4 text-slate-500" />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={gasLevel}
                          onChange={(e) => setGasLevel(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Clasificación / Tipo de Uso *</label>
                    <select
                      value={tipoUso}
                      onChange={(e) => setTipoUso(e.target.value as "Particular" | "Trabajo")}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-250 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="Particular">🚗 Particular / Familiar (Frecuencia estándar)</option>
                      <option value="Trabajo">🛠️ Vehículo de Trabajo / Comercial (Frecuencia intensiva: cambios cada 90 días)</option>
                    </select>
                  </div>
                </div>

                {/* Client Section */}
                <div className="md:col-span-6 space-y-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest border-b pb-1">
                    2. Información del Propietario / Cliente
                  </span>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Nombre Completo *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={nombreCliente}
                        onChange={(e) => setNombreCliente(e.target.value)}
                        placeholder="Ej. Roberto Flores Pinela"
                        className="w-full pl-9 pr-3 py-2 border rounded-xl bg-slate-50 border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs font-medium"
                      />
                    </div>
                    {errors.nombreCliente && <span className="text-[10px] text-red-500 font-medium block mt-1">{errors.nombreCliente}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Teléfono / WhatsApp *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={telefonoCliente}
                          onChange={(e) => setTelefonoCliente(e.target.value)}
                          placeholder="+593 99..."
                          className="w-full pl-9 pr-3 py-2 border rounded-xl bg-slate-50 border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs font-medium"
                        />
                      </div>
                      {errors.telefonoCliente && <span className="text-[10px] text-red-500 font-medium block mt-1">{errors.telefonoCliente}</span>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Correo Electrónico</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          value={correoCliente}
                          onChange={(e) => setCorreoCliente(e.target.value)}
                          placeholder="propietario@mail.com"
                          className="w-full pl-9 pr-3 py-2 border rounded-xl bg-slate-50 border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs space-y-1 text-slate-500">
                    <span className="font-semibold text-slate-700 block">Condición Inicial de Registro:</span>
                    <span>El vehículo iniciará su estatus en <strong className="text-amber-500">Recién Ingresado</strong> con tareas básicas precargadas para la inspección multipuntos inicial del mecánico de CQ Motors.</span>
                  </div>
                </div>
              </div>

              {/* CHECKLIST 360° RECEPCIÓN DE PATIO CON CANVAS VISUAL (6th of 8 improvements) */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest font-mono">
                    3. Inspección Perimetral 360° (Checklist de Daños en Recepción)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-sans">
                    Haga click directamente sobre las zonas del diagrama del vehículo para registrar rayones, magulladuras o trizaduras previas. Las áreas seleccionadas se marcarán en rojo de advertencia.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* Interactive Visual Canvas Area */}
                  <div className="bg-slate-900 text-slate-300 p-5 rounded-3xl border border-slate-800 space-y-4 flex flex-col items-center select-none relative shadow-inner">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Silueta Interactiva de Patio</span>
                      {Object.values(damages).some(Boolean) && (
                        <button
                          type="button"
                          onClick={() => setDamages({
                            capo: false,
                            parachoquesDel: false,
                            puertaDer: false,
                            puertaIzqr: false,
                            parabrisas: false,
                            techo: false,
                            retrovisores: false,
                            maletero: false
                          })}
                          className="text-[9px] bg-slate-800 hover:bg-slate-700 text-rose-400 font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition-colors uppercase tracking-tight"
                        >
                          Limpiar Todos
                        </button>
                      )}
                    </div>
                    
                    {/* Simplified overhead vehicle chassis schematic */}
                    <div className="relative w-64 h-36 bg-slate-800 rounded-2xl border border-slate-750 flex items-center justify-center p-2">
                      <div className="absolute inset-x-12 inset-y-6 border border-slate-700/60 rounded-xl bg-slate-900/40 flex items-center justify-center font-mono text-[9px] text-slate-600">
                        Chasis / Cabina
                      </div>
                      
                      {/* Interactive Zones over Silhouette */}
                      {/* Front: Capo */}
                      <button
                        type="button"
                        onClick={() => toggleDamageZone("capo")}
                        className={`absolute left-3.5 top-12 w-9 h-12 rounded-lg border text-[9px] font-extrabold uppercase transition-all cursor-pointer flex items-center justify-center ${
                          damages.capo 
                            ? "bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse shadow-sm shadow-rose-505" 
                            : "bg-slate-850 border-slate-700 text-slate-400 hover:bg-slate-750 text-slate-400"
                        }`}
                      >
                        Capó
                      </button>

                      {/* Bumper Front */}
                      <button
                        type="button"
                        onClick={() => toggleDamageZone("parachoquesDel")}
                        className={`absolute left-0.5 top-4 w-2 h-28 rounded-sm border text-[8px] font-extrabold uppercase transition-all cursor-pointer flex items-center justify-center ${
                          damages.parachoquesDel 
                            ? "bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse" 
                            : "bg-slate-850 border-slate-700 text-slate-400 hover:bg-slate-750"
                        }`}
                        title="Parachoques Delantero"
                        style={{ writingMode: "vertical-rl" }}
                      >
                        PARACH DEL
                      </button>

                      {/* Rear: Maletero */}
                      <button
                        type="button"
                        onClick={() => toggleDamageZone("maletero")}
                        className={`absolute right-3.5 top-12 w-9 h-12 rounded-lg border text-[9px] font-extrabold uppercase transition-all cursor-pointer flex items-center justify-center ${
                          damages.maletero 
                            ? "bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse shadow-sm" 
                            : "bg-slate-850 border-slate-700 text-slate-400 hover:bg-slate-750"
                        }`}
                      >
                        Malet
                      </button>

                      {/* Left: Puerta Izqr */}
                      <button
                        type="button"
                        onClick={() => toggleDamageZone("puertaIzqr")}
                        className={`absolute left-14 top-1 w-16 h-4.5 rounded-md border text-[8px] font-extrabold uppercase transition-all cursor-pointer flex items-center justify-center ${
                          damages.puertaIzqr 
                            ? "bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse" 
                            : "bg-slate-850 border-slate-700 text-slate-400 hover:bg-slate-750"
                        }`}
                      >
                        Lado Izq
                      </button>

                      {/* Right: Puerta Der */}
                      <button
                        type="button"
                        onClick={() => toggleDamageZone("puertaDer")}
                        className={`absolute left-14 bottom-1 w-16 h-4.5 rounded-md border text-[8px] font-extrabold uppercase transition-all cursor-pointer flex items-center justify-center ${
                          damages.puertaDer 
                            ? "bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse" 
                            : "bg-slate-850 border-slate-700 text-slate-400 hover:bg-slate-750"
                        }`}
                      >
                        Lado Der
                      </button>

                      {/* Windshield */}
                      <button
                        type="button"
                        onClick={() => toggleDamageZone("parabrisas")}
                        className={`absolute left-12 top-11 w-4.5 h-14 rounded-md border text-[8px] font-extrabold uppercase transition-all cursor-pointer flex items-center justify-center ${
                          damages.parabrisas 
                            ? "bg-rose-500/20 border-rose-500 text-rose-200 animate-pulse" 
                            : "bg-slate-850 border-slate-700 text-slate-450 hover:bg-slate-750"
                        }`}
                        title="Vidrios / Parabrisas"
                        style={{ writingMode: "vertical-rl" }}
                      >
                        VIDRIO
                      </button>

                      {/* Roof / Techo */}
                      <button
                        type="button"
                        onClick={() => toggleDamageZone("techo")}
                        className={`absolute left-20 top-12 w-6 h-12 rounded-md border text-[8px] font-extrabold uppercase transition-all cursor-pointer flex items-center justify-center ${
                          damages.techo 
                            ? "bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse" 
                            : "bg-slate-850 border-slate-700 text-slate-400 hover:bg-slate-750"
                        }`}
                      >
                        Tech
                      </button>

                      {/* Retrovisores */}
                      <button
                        type="button"
                        onClick={() => toggleDamageZone("retrovisores")}
                        className={`absolute left-14 -top-3 w-5 h-4.5 rounded border text-[7.5px] font-extrabold uppercase transition-all cursor-pointer flex items-center justify-center ${
                          damages.retrovisores 
                            ? "bg-rose-500/10 border-rose-550 text-rose-300 animate-pulse" 
                            : "bg-slate-850 border-slate-700 text-slate-400 hover:bg-slate-750"
                        }`}
                        title="Espejos Retrovisores"
                      >
                        Espej
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium italic">
                      Las zonas rojas seleccionadas quedarán registradas en el acta física y digital de recepción.
                    </p>
                  </div>

                  {/* Standard checklist boxes mapped right next to it */}
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/60 grid grid-cols-2 gap-x-4 gap-y-2.5 font-sans">
                    {Object.keys(damages).map((zone) => {
                      let label = zone;
                      if (zone === "capo") label = "Capó Doblez / Golpe";
                      else if (zone === "parachoquesDel") label = "Parachoques Frontal";
                      else if (zone === "puertaDer") label = "Lateral Derecho Rayado";
                      else if (zone === "puertaIzqr") label = "Lateral Izquierdo Rayado";
                      else if (zone === "parabrisas") label = "Hendidura Parabrisas";
                      else if (zone === "techo") label = "Techo Hundido";
                      else if (zone === "retrovisores") label = "Fisura Espejos Retrovisores";
                      else if (zone === "maletero") label = "Maletero Golpe Trasero";

                      return (
                        <label 
                          key={zone} 
                          className={`flex items-center space-x-2 p-2 rounded-xl border text-[11px] cursor-pointer select-none transition-all ${
                            damages[zone] 
                              ? "bg-rose-50 border-rose-200 text-rose-900 font-bold" 
                              : "bg-white border-slate-200 hover:border-slate-350 text-slate-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={damages[zone]}
                            onChange={() => toggleDamageZone(zone)}
                            className="rounded text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
                          />
                          <span>{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterForm(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                >
                  Confirmar Recibo Vehicular
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Segmented Controls for Vehicle Classifications (Sección de Autos de Trabajo) */}
      <div className="flex border-b border-slate-200 bg-white p-1 rounded-xl shadow-sm border">
        <button
          onClick={() => setFilterTipoUso("All")}
          className={`flex-1 text-center py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            filterTipoUso === "All"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          Todos ({vehicles.length})
        </button>
        <button
          onClick={() => setFilterTipoUso("Particular")}
          className={`flex-1 text-center py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            filterTipoUso === "Particular"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          🚗 Particular / Familiar ({vehicles.filter(v => !v.tipoUso || v.tipoUso === "Particular").length})
        </button>
        <button
          onClick={() => setFilterTipoUso("Trabajo")}
          className={`flex-1 text-center py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
            filterTipoUso === "Trabajo"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <span>🛠️ Autos de Trabajo</span>
          <span className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-full ${
            filterTipoUso === "Trabajo" ? "bg-white text-emerald-800" : "bg-emerald-100 text-emerald-800"
          }`}>
            {vehicles.filter(v => v.tipoUso === "Trabajo").length}
          </span>
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/75 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por placa, modelo de auto, marca o nombre del cliente..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-450 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs font-medium transition-all"
            />
          </div>

          <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
            {/* Brand filter */}
            <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="All">Todas las Marcas</option>
                {distinctBrands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50">
              <Activity className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="All">Todos los Estados</option>
                <option value="Ingresado">Ingresado</option>
                <option value="En Proceso">En Mantenimiento</option>
                <option value="Listo para Entrega">Listo para Entrega</option>
                <option value="Entregado">Entregado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Vehicles cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredVehicles.map((v) => {
          let badgeColor = "bg-amber-100 text-amber-800 border-amber-250";
          if (v.estado === "En Proceso") badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-250";
          else if (v.estado === "Listo para Entrega") badgeColor = "bg-blue-100 text-blue-800 border-blue-250";
          else if (v.estado === "Entregado") badgeColor = "bg-slate-100 text-slate-800 border-slate-250";

          return (
            <motion.div
              layout
              key={v.id}
              whileHover={{ y: -2 }}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-extrabold bg-slate-900 text-white rounded-lg px-2.5 py-1 tracking-wider">
                      {v.placa}
                    </span>
                    {userRole !== UserRole.Cliente && onDeleteVehicle && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVehicleToDelete(v);
                        }}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                        title="Eliminar hoja de control de patio"
                      >
                        <Trash2 className="h-4 w-4 shrink-0" />
                      </button>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                    {v.estado === "En Proceso" ? "En Mantenimiento" : v.estado}
                  </span>
                </div>

                {/* Car Details */}
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <h4 className="font-display font-bold text-base text-slate-900 leading-tight">{v.marca} {v.modelo}</h4>
                    {v.tipoUso === "Trabajo" ? (
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-0.5 shrink-0" title="Vehículo de Trabajo - Frecuencia de cambio intensiva">
                        <span>Trabajo 🛠️</span>
                      </span>
                    ) : (
                      <span className="bg-slate-105 text-slate-600 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                        Particular
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono flex items-center space-x-2 mt-1">
                    <span>Año {v.anio}</span>
                    <span>•</span>
                    <span>{v.kilometraje.toLocaleString()} km</span>
                  </div>
                </div>

                {/* Combustible Progress */}
                <div className="space-y-1 bg-slate-50 border border-slate-200/40 p-2.5 rounded-xl text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                    <span className="flex items-center space-x-1">
                      <Fuel className="h-3 w-3 text-slate-500" />
                      <span>Combustible Inicial</span>
                    </span>
                    <span className="font-bold">{v.nivelCombustible}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${v.nivelCombustible}%` }} />
                  </div>
                </div>

                {/* Client detail */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Propietario / Contacto</span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{v.cliente.nombre}</span>
                    <span className="text-slate-500 font-mono">{v.cliente.telefono}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">{v.cliente.correo}</span>
                </div>
              </div>

              {/* Card Footer (Action buttons) */}
              <div className="grid grid-cols-5 border-t border-slate-100 divide-x divide-slate-100">
                <button
                  type="button"
                  onClick={() => onSelectVehicle(v)}
                  className="col-span-4 py-3.5 bg-slate-50 hover:bg-emerald-50/10 text-slate-900 hover:text-emerald-800 text-xs font-bold transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <span>Abrir Hoja de Mantenimiento</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setJustRegisteredVehicle(v)}
                  className="col-span-1 py-3.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 flex items-center justify-center cursor-pointer transition-all"
                  title="Ver QR Único y Sticker autoadherible de parabrisas"
                >
                  <QrCode className="h-4.5 w-4.5 shrink-0" />
                </button>
              </div>
            </motion.div>
          );
        })}

        {filteredVehicles.length === 0 && (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200/70 text-slate-400">
            <Car className="h-12 w-12 mx-auto text-slate-300 mb-2.5" />
            <h4 className="text-slate-800 font-bold text-sm">Sin resultados para la búsqueda</h4>
            <span className="text-xs text-slate-500">Pruebe ingresando otro criterio de búsqueda o marcando otra marca.</span>
          </div>
        )}
      </div>

      {/* 🔮 DYNAMIC QR REGISTRATION POPUP MODAL (First part of the QR code user requirement) */}
      <AnimatePresence>
        {justRegisteredVehicle && (
          <div 
            onClick={() => setJustRegisteredVehicle(null)}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200 no-print"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 font-sans p-6 space-y-5 my-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">Código QR del Vehículo</h3>
                    <span className="text-[10px] text-slate-400 font-mono">CQ Motors - Historial Clínico</span>
                  </div>
                </div>
                <button
                  onClick={() => setJustRegisteredVehicle(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer transition-colors bg-slate-100 dark:bg-slate-800"
                  title="Cerrar modal"
                  aria-label="Cerrar modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Informative description */}
              <div className="text-center space-y-1.5 px-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Escanee el código autoadherible en una zona visible para consultar el expediente digital perpetuo de <strong className="text-slate-800 dark:text-slate-200 font-bold">{justRegisteredVehicle.cliente.nombre}</strong>.
                </p>
              </div>

              {/* QR Code Presentation Box */}
              <div className="py-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-150/80 dark:border-slate-800 relative space-y-3.5">
                <div className="relative p-3 bg-white rounded-2xl border border-slate-200 shadow-sm-flat">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=0f172a&bgcolor=ffffff&data=${encodeURIComponent(
                      window.location.origin + "/?vehiculoId=" + justRegisteredVehicle.id
                    )}`}
                    alt={`Código QR para placa ${justRegisteredVehicle.placa}`}
                    referrerPolicy="no-referrer"
                    className="w-40 h-40 object-contain block"
                  />
                  
                  {/* Absolute small plate inside */}
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-mono text-[9.5px] font-black px-2.5 py-0.5 rounded-lg border border-slate-700 tracking-wider">
                    {justRegisteredVehicle.placa}
                  </div>
                </div>

                <div className="text-center pt-2.5">
                  <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight">
                    {justRegisteredVehicle.marca} {justRegisteredVehicle.modelo}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block mt-1">
                    Ficha ID: {justRegisteredVehicle.id}
                  </span>
                </div>
              </div>

              {/* Explanation of dynamic scanning */}
              <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100/60 dark:border-emerald-800/40 rounded-xl text-emerald-950 dark:text-emerald-200 text-[11px] leading-relaxed flex items-start space-x-2.5 font-sans">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 animate-spin" />
                <p>
                  Cuando el propietario escanee este código, se le redireccionará de forma directa al <strong className="font-extrabold uppercase text-emerald-900 dark:text-emerald-300">Historial de Mantenimientos</strong> en CQ Motors.
                </p>
              </div>

              {/* Actions row */}
              <div className="flex items-center space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 cursor-pointer shadow-sm transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimir Sticker</span>
                </button>
                <button
                  type="button"
                  onClick={() => setJustRegisteredVehicle(null)}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow-md shadow-emerald-600/10"
                >
                  Aceptar
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE VEHICLE / PATIO RECORD MODAL */}
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
                      Eliminar Ficha de Patio
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Placa: {vehicleToDelete.placa} ({vehicleToDelete.marca} {vehicleToDelete.modelo})
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-900 leading-relaxed">
                  ¿Está seguro de eliminar esta hoja de control de patio? Se borrará la ficha del vehículo, su historial de mantenimiento y registros de inspección.
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
                    <span>{isDeleting ? "Eliminando..." : "Sí, Eliminar Ficha"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
