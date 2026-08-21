import React, { useState } from 'react';
import { AccessibleModal } from './AccessibleModal';
import { AccessibleButton } from './AccessibleButton';
import { AccessibleInput, AccessibleSelect } from './AccessibleInput';
import { AccessibleTable } from './AccessibleTable';
import { Vehiculo } from '../../types';

export const AccessibleVehicleRegistrationForm: React.FC<{ onAdd?: (v: Vehiculo)=>void }> = ({ onAdd }) => {
  const [formData, setFormData] = useState<Partial<Vehiculo>>({ placa: '', marca: '', modelo: '', anio: '' as any, kilometraje: '' as any });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if(errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string,string> = {};
    if(!formData.placa) newErrors.placa='La placa es requerida';
    if(!formData.marca) newErrors.marca='La marca es requerida';
    if(!formData.modelo) newErrors.modelo='El modelo es requerido';
    if(!formData.anio) newErrors.anio='El año es requerido';
    setErrors(newErrors);
    if(Object.keys(newErrors).length){
      setMsg('Corrige los campos marcados');
      return;
    }
    const nuevo: Vehiculo = {
      id: 'demo-'+Date.now(),
      placa: formData.placa!,
      marca: formData.marca!,
      modelo: formData.modelo!,
      anio: Number(formData.anio) || 2024,
      kilometraje: Number(formData.kilometraje) || 0,
      estado: 'Ingresado',
      fechaIngreso: new Date().toISOString(),
      cliente: { id:'cli-demo', nombre:'Cliente Demo', telefono:'0999999999', correo:'demo@cqmotors.ec' },
      nivelCombustible: 100,
      tipoUso: 'Particular',
    } as any;
    onAdd?.(nuevo);
    setMsg('Vehículo demo agregado a la tabla inferior (solo demo, no se guarda en Firestore)');
    setFormData({ placa:'', marca:'', modelo:'', anio:'' as any, kilometraje:'' as any });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white border rounded-xl">
      <h2 className="text-xl font-bold mb-4 text-center">Registro de Vehículo (Demo Accesible)</h2>
      <div className="space-y-4">
        <AccessibleInput type="text" label="Placa" name="placa" value={String(formData.placa||'')} onChange={handleChange} required placeholder="ABC-123" error={errors.placa} showError={!!errors.placa} />
        <AccessibleInput type="text" label="Marca" name="marca" value={String(formData.marca||'')} onChange={handleChange} required error={errors.marca} showError={!!errors.marca} />
        <AccessibleInput type="text" label="Modelo" name="modelo" value={String(formData.modelo||'')} onChange={handleChange} required error={errors.modelo} showError={!!errors.modelo} />
        <AccessibleInput type="text" label="Año" name="anio" value={String(formData.anio||'')} onChange={handleChange} required placeholder="2024" error={errors.anio} showError={!!errors.anio} />
        <AccessibleInput type="text" label="Kilometraje" name="kilometraje" value={String(formData.kilometraje||'')} onChange={handleChange} placeholder="15000" />
      </div>
      {msg && <p className="mt-3 text-sm p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-800" role="status" aria-live="polite">{msg}</p>}
      <div className="mt-4">
        <AccessibleButton variant="primary" onClick={()=>{}} title="Registrar vehículo demo">Registrar Vehículo (Demo)</AccessibleButton>
        <button type="submit" className="sr-only">submit</button>
      </div>
      <p className="text-xs text-slate-400 mt-2">* Este formulario es solo demostrativo de WCAG (labels asociados, aria-invalid, aria-required). No guarda en base de datos.</p>
    </form>
  );
};

export const AccessibleVehiclesTable: React.FC<{ vehicles: Vehiculo[]; onDelete?: (id:string)=>void }> = ({ vehicles, onDelete }) => {
  return (
    <AccessibleTable
      title="Vehículos Registrados en el Taller"
      columns={[
        { header: 'Placa', accessor: (v: Vehiculo)=> v.placa },
        { header: 'Marca', accessor: (v: Vehiculo)=> v.marca },
        { header: 'Modelo', accessor: (v: Vehiculo)=> v.modelo },
        { header: 'Año', accessor: (v: Vehiculo)=> String(v.anio) },
        { header: 'Kilometraje', accessor: (v: Vehiculo)=> String(v.kilometraje) },
        { header: 'Estado', accessor: (v: Vehiculo)=> v.estado },
        { header: 'Acciones', accessor: (v: Vehiculo)=> (
            <AccessibleButton variant="danger" onClick={()=>onDelete?.(v.id)} title="Eliminar vehículo demo">Eliminar</AccessibleButton>
          )},
      ]}
      data={vehicles}
    />
  );
};

export const AccessibilityDemoPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([
    { id:'1', placa:'ABC-123', marca:'Chevrolet', modelo:'Camaro', anio:2022, kilometraje:15000, estado:'Ingresado', fechaIngreso: new Date().toISOString(), cliente:{id:'1', nombre:'Demo', telefono:'', correo:''}, nivelCombustible:100, tipoUso:'Particular' } as any,
    { id:'2', placa:'DEF-456', marca:'Ford', modelo:'F-150', anio:2021, kilometraje:28000, estado:'En Proceso', fechaIngreso: new Date().toISOString(), cliente:{id:'2', nombre:'Demo', telefono:'', correo:''}, nivelCombustible:80, tipoUso:'Particular' } as any,
  ]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-center">Demostración Accesibilidad WCAG 2.1</h1>
        <p className="text-center text-slate-500 mt-2">Prueba foco con Tab, Shift+Tab, Escape para modales y lectura con lector de pantalla</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-3">1. Formulario Accesible (ahora guarda en demo)</h2>
        <AccessibleVehicleRegistrationForm onAdd={(v)=> setVehiculos(prev=>[v, ...prev])} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">2. Tabla Accesible (prueba Eliminar)</h2>
        <AccessibleVehiclesTable vehicles={vehiculos} onDelete={(id)=> setVehiculos(prev=> prev.filter(v=>v.id!==id))} />
        <p className="text-xs text-slate-400 mt-2">Tabla con &lt;th scope="col/row"&gt; y paginación accesible</p>
      </section>

      <section className="bg-white border rounded-xl p-6 text-center">
        <h2 className="text-xl font-semibold mb-3">3. Modal con Focus Trap</h2>
        <p className="text-sm text-slate-600 mb-4">Al abrir, el foco queda atrapado dentro. Prueba Tab / Shift+Tab y Escape.</p>
        <AccessibleButton variant="primary" onClick={()=>setShowModal(true)}>Abrir Modal de Ayuda</AccessibleButton>
        <AccessibleModal isOpen={showModal} onToggle={()=>setShowModal(false)} title="Ayuda de Accesibilidad">
          <h3 className="text-lg font-medium">Ayuda del Sistema</h3>
          <p className="mt-2 text-sm text-slate-600">Este modal demuestra focus trap WCAG 2.1.1. El foco no sale del modal con Tab.</p>
          <ul className="list-disc ml-5 mt-2 text-sm text-slate-600 text-left">
            <li>Tab navega entre botones</li>
            <li>Shift+Tab retrocede</li>
            <li>Escape o botón Cerrar cierra y devuelve foco</li>
          </ul>
          <div className="mt-4 flex gap-2 justify-end">
            <AccessibleButton variant="secondary" onClick={()=>setShowModal(false)}>Cerrar</AccessibleButton>
          </div>
        </AccessibleModal>
      </section>

      <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="font-bold text-amber-800">¿De qué te sirve esta sección?</h3>
        <ul className="list-disc ml-5 text-sm text-amber-900 mt-1">
          <li><b>Desarrolladores:</b> copia <span className="font-mono">AccessibleInput / Button / Table / Modal</span> a tus formularios reales (ya están listos en <span className="font-mono">src/components/Accessibility/</span>)</li>
          <li><b>QA:</b> prueba con Tab y con lector NVDA/VoiceOver que todo se anuncia</li>
          <li><b>Producción:</b> reemplaza los inputs normales de <span className="font-mono">VehicleManager.tsx</span> por estos sin romper Firestore</li>
        </ul>
      </section>
    </div>
  );
};
