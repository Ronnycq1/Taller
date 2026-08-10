import React, { useState } from "react";
import { Wrench, Calendar, Clock, User, Phone, Mail, Car, CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { CitaMantenimiento, ActividadReciente } from "../types";

interface RegisterAppointmentModalProps {
  onClose: () => void;
}

export default function RegisterAppointmentModal({ onClose }: RegisterAppointmentModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    nombreCliente: "",
    telefonoCliente: "",
    correoCliente: "",
    placa: "",
    marca: "",
    modelo: "",
    anio: new Date().getFullYear(),
    kilometraje: 0,
    tipoServicios: [] as string[],
    fechaPreferencia: "",
    horaPreferencia: "",
    comentarios: "",
  });

  const availableServices = [
    { label: "Cambio de Aceite y Filtros", cat: "Lubricantes" },
    { label: "Sistema de Frenos", cat: "Frenos" },
    { label: "Mantenimiento del Motor", cat: "Motor" },
    { label: "Transmisión y Embrague", cat: "Transmisión" },
    { label: "Alineación y Balanceo", cat: "Preventivo" },
    { label: "Sistema Eléctrico", cat: "Electrico" },
    { label: "Revisión Preventiva General", cat: "Otros" },
  ];

  const handleCheckboxChange = (service: string) => {
    setFormData(prev => {
      const exists = prev.tipoServicios.includes(service);
      if (exists) {
        return { ...prev, tipoServicios: prev.tipoServicios.filter(s => s !== service) };
      } else {
        return { ...prev, tipoServicios: [...prev.tipoServicios, service] };
      }
    });
  };

  const validateStep1 = () => {
    return formData.nombreCliente.trim() !== "" && 
           formData.telefonoCliente.trim() !== "" && 
           formData.correoCliente.trim() !== "";
  };

  const validateStep2 = () => {
    return formData.placa.trim() !== "" && 
           formData.marca.trim() !== "" && 
           formData.modelo.trim() !== "" && 
           formData.anio > 1950 && 
           formData.kilometraje >= 0;
  };

  const validateStep3 = () => {
    return formData.tipoServicios.length > 0 && 
           formData.fechaPreferencia !== "" && 
           formData.horaPreferencia !== "";
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;
    
    setIsSubmitting(true);
    const appointmentId = `appt-${Date.now()}`;
    const nowStr = new Date().toISOString();

    const newAppointment: CitaMantenimiento = {
      id: appointmentId,
      nombreCliente: formData.nombreCliente,
      telefonoCliente: formData.telefonoCliente,
      correoCliente: formData.correoCliente,
      placa: formData.placa.toUpperCase(),
      marca: formData.marca,
      modelo: formData.modelo,
      anio: Number(formData.anio),
      kilometraje: Number(formData.kilometraje),
      tipoServicios: formData.tipoServicios,
      fechaPreferencia: formData.fechaPreferencia,
      horaPreferencia: formData.horaPreferencia,
      comentarios: formData.comentarios,
      fechaRegistro: nowStr,
      estado: "Pendiente"
    };

    try {
      // 1. Save appointment in its respective collection
      await setDoc(doc(db, "appointments", appointmentId), newAppointment);

      // 2. Insert into activities list
      const activityId = `act-${Date.now()}`;
      const newActivity: ActividadReciente = {
        id: activityId,
        tipo: "registro",
        mensaje: `Cita Nueva: ${formData.nombreCliente} agendó revisión para la placa ${formData.placa.toUpperCase()}`,
        fecha: nowStr,
        usuario: "Cliente Externo",
      };
      await setDoc(doc(db, "activities", activityId), newActivity);

      setSubmittedId(appointmentId);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `appointments/${appointmentId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 relative my-auto"
      >
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-orange-500 rounded-xl text-white">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">Agendar Cita CQ Motors</h3>
              <p className="text-xs text-slate-300">Solicitud de mantenimiento para clientes sin credenciales</p>
            </div>
          </div>
          {!submittedId && (
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Form Container */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {!submittedId ? (
              <motion.form 
                key="form-steps"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                {/* Steps indicator */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center space-x-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step === s 
                          ? "bg-orange-500 text-white font-mono scale-110" 
                          : step > s 
                            ? "bg-slate-900 text-white" 
                            : "bg-slate-100 text-slate-400"
                      }`}>
                        {s}
                      </div>
                      <span className={`text-xs font-semibold ${step === s ? "text-slate-900" : "text-slate-400"}`}>
                        {s === 1 && "Datos"}
                        {s === 2 && "Vehículo"}
                        {s === 3 && "Servicio"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* STEP 1: Personal Contact Info */}
                {step === 1 && (
                  <div className="space-y-4 font-sans animate-fade-in">
                    <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Paso 1: Información de Contacto</h4>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Nombre Completo del Propietario</label>
                      <div className="relative">
                        <User className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                        <input 
                          type="text"
                          required
                          value={formData.nombreCliente}
                          onChange={(e) => setFormData({...formData, nombreCliente: e.target.value})}
                          placeholder="Ej: Juan Pérez"
                          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Número de Teléfono / Celular (WhatsApp)</label>
                      <div className="relative">
                        <Phone className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                        <input 
                          type="tel"
                          required
                          value={formData.telefonoCliente}
                          onChange={(e) => setFormData({...formData, telefonoCliente: e.target.value})}
                          placeholder="Ej: 0998765432"
                          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Correo Electrónico</label>
                      <div className="relative">
                        <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                        <input 
                          type="email"
                          required
                          value={formData.correoCliente}
                          onChange={(e) => setFormData({...formData, correoCliente: e.target.value})}
                          placeholder="Ej: juan.perez@correo.com"
                          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Vehicle Info */}
                {step === 2 && (
                  <div className="space-y-4 font-sans">
                    <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Paso 2: Información del Vehículo</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 block">Placa del Vehículo</label>
                        <div className="relative">
                          <Car className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                          <input 
                            type="text"
                            required
                            value={formData.placa}
                            onChange={(e) => setFormData({...formData, placa: e.target.value.toUpperCase()})}
                            placeholder="Ej: PBA-1234"
                            className="w-full pl-10 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all uppercase font-semibold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 block">Año</label>
                        <input 
                          type="number"
                          required
                          value={formData.anio}
                          onChange={(e) => setFormData({...formData, anio: parseInt(e.target.value) || new Date().getFullYear()})}
                          placeholder="Año"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 block">Marca</label>
                        <input 
                          type="text"
                          required
                          value={formData.marca}
                          onChange={(e) => setFormData({...formData, marca: e.target.value})}
                          placeholder="Ej: Chevrolet"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 block">Modelo</label>
                        <input 
                          type="text"
                          required
                          value={formData.modelo}
                          onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                          placeholder="Ej: Aveo"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Kilometraje Actual aproximado (Km)</label>
                      <input 
                        type="number"
                        required
                        value={formData.kilometraje}
                        onChange={(e) => setFormData({...formData, kilometraje: parseInt(e.target.value) || 0})}
                        placeholder="Ej: 45000"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-mono font-bold"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: Services Selection */}
                {step === 3 && (
                  <div className="space-y-4 font-sans">
                    <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Paso 3: Detalles de la Cita</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Seleccione los Servicios Solicitados (Mínimo 1)</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-h-[140px] overflow-y-auto">
                        {availableServices.map((service) => {
                          const isSelected = formData.tipoServicios.includes(service.label);
                          return (
                            <label 
                              key={service.label}
                              className={`flex items-center space-x-2 text-xs p-1 rounded-lg cursor-pointer transition-colors ${
                                isSelected ? "bg-orange-50 text-orange-950 font-semibold" : "hover:bg-white text-slate-700"
                              }`}
                            >
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleCheckboxChange(service.label)}
                                className="accent-orange-500 rounded h-3.5 w-3.5"
                              />
                              <span>{service.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 block">Fecha Solicitada</label>
                        <div className="relative">
                          <Calendar className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                          <input 
                            type="date"
                            required
                            min={new Date().toISOString().split("T")[0]}
                            value={formData.fechaPreferencia}
                            onChange={(e) => setFormData({...formData, fechaPreferencia: e.target.value})}
                            className="w-full pl-10 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 block">Hora Solicitada</label>
                        <div className="relative">
                          <Clock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                          <input 
                            type="time"
                            required
                            value={formData.horaPreferencia}
                            onChange={(e) => setFormData({...formData, horaPreferencia: e.target.value})}
                            className="w-full pl-10 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block">Comentarios u Observaciones adicionales</label>
                      <textarea 
                        value={formData.comentarios}
                        onChange={(e) => setFormData({...formData, comentarios: e.target.value})}
                        placeholder="Ej: Golpeteo en la suspensión delantera al pasar por baches, revisión de frenos..."
                        rows={2}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-row">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Atrás
                    </button>
                  ) : (
                    <div />
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={step === 1 ? !validateStep1() : !validateStep2()}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Continuar
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting || !validateStep3()}
                      className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Confirmando...</span>
                        </>
                      ) : (
                        <span>Agendar Cita de Mantenimiento</span>
                      )}
                    </button>
                  )}
                </div>
              </motion.form>
            ) : (
              <motion.div 
                key="success-message"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-4 font-sans animate-fade-in"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-display font-extrabold text-xl text-slate-900">¡Cita Solicitada con Éxito!</h4>
                  <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                    Hemos registrado su solicitud correctamente con el identificador <strong className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">{submittedId}</strong>.
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 max-w-sm mx-auto text-left space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cliente:</span>
                    <span className="font-bold text-slate-900">{formData.nombreCliente}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehículo:</span>
                    <span className="font-bold text-slate-900">{formData.placa} ({formData.marca} {formData.modelo})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Horario Solicitado:</span>
                    <span className="font-mono text-slate-900 font-bold">{formData.fechaPreferencia} a las {formData.horaPreferencia}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">
                  Nos comunicaremos con usted a su teléfono <strong>{formData.telefonoCliente}</strong> o a su correo para confirmar su asistencia. ¡Muchas gracias por elegir <strong>CQ Motors</strong>!
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all hover:bg-orange-600 cursor-pointer"
                >
                  Entendido y Volver
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
