import React, { useState } from 'react';
import { AccessibleInput, AccessibleSelect } from '../Accessibility/AccessibleInput';
import { AccessibleButton } from '../Accessibility/AccessibleButton';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CitaMantenimiento, Vehiculo } from '../../types';

type Props = {
  vehicles: Vehiculo[];
  onScheduled?: (cita: CitaMantenimiento) => void;
  clienteId?: string;
};

export const AppointmentScheduler: React.FC<Props> = ({ vehicles, onScheduled, clienteId }) => {
  const [vehiculoId, setVehiculoId] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('09:00');
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehiculoId || !fecha || !motivo) { setMsg('Complete todos los campos requeridos'); return; }
    setSaving(true);
    try {
      const veh = vehicles.find(v=>v.id===vehiculoId);
      const cita: CitaMantenimiento = {
        id: `cita-${Date.now()}`,
        vehiculoId,
        placa: veh?.placa || '',
        clienteId: clienteId || veh?.cliente.id || '',
        fecha: `${fecha}T${hora}:00`,
        fechaRegistro: new Date().toISOString(),
        motivo,
        estado: 'Pendiente',
        mecanicoAsignado: '',
      } as any;
      await setDoc(doc(db, 'appointments', cita.id), cita);
      setMsg('Cita agendada correctamente');
      onScheduled?.(cita);
      setMotivo(''); setFecha('');
    } catch(err){ setMsg('Error al agendar cita'); }
    finally{ setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4 max-w-xl">
      <h3 className="text-lg font-bold">Agendar Cita de Mantenimiento</h3>
      <AccessibleSelect
        label="Vehículo"
        name="vehiculoId"
        value={vehiculoId}
        onChange={setVehiculoId}
        options={vehicles.map(v=>({ value: v.id, label: `${v.placa} - ${v.marca} ${v.modelo}`}))}
        placeholder="Seleccione vehículo"
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <AccessibleInput type="date" label="Fecha" name="fecha" value={fecha} onChange={e=>setFecha(e.target.value)} required />
        <AccessibleInput type="text" label="Hora" name="hora" value={hora} onChange={e=>setHora(e.target.value)} placeholder="09:00" required />
      </div>
      <AccessibleInput type="text" label="Motivo / Servicio solicitado" name="motivo" value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Ej: Cambio de aceite, revisión frenos" required />
      {msg && <p className="text-sm text-slate-600" role="status" aria-live="polite">{msg}</p>}
      <AccessibleButton variant="primary" disabled={saving} onClick={()=>{}} title={saving?'Agendando...':'Agendar Cita'}>
        {saving ? 'Agendando...' : 'Agendar Cita'}
      </AccessibleButton>
    </form>
  );
};
