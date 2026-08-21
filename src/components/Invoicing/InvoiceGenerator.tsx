import React, { useMemo, useState } from 'react';
import { Mantenimiento, RepuestoInventario, Vehiculo } from '../../types';
import { AccessibleButton } from '../Accessibility/AccessibleButton';

type Props = { vehiculo: Vehiculo; mantenimiento: Mantenimiento; inventory: RepuestoInventario[]; onGenerate?: (total:number)=>void; };

export const InvoiceGenerator: React.FC<Props> = ({ vehiculo, mantenimiento, inventory, onGenerate }) => {
  const [descuento, setDescuento] = useState(0);
  const [iva] = useState(0.15);

  const subtotal = useMemo(()=>{
    const tareas = mantenimiento.tareasRealizadas.filter(t=>t.completada).reduce((s,t)=>s+(t.costoEstimado||0),0);
    const repuestos = mantenimiento.repuestosNecesarios?.reduce((s,r)=>{
      const inv = inventory.find(i=>i.id===r.repuestoId);
      return s + (inv ? inv.precioVenta * r.cantidad : 0);
    },0) || 0;
    return tareas + repuestos + (mantenimiento.costoManoObra||0);
  },[mantenimiento, inventory]);

  const total = useMemo(()=> {
    const conDescuento = subtotal * (1 - descuento/100);
    return conDescuento * (1 + iva);
  },[subtotal, descuento, iva]);

  const handlePrint = ()=>{
    onGenerate?.(total);
    window.print();
  };

  return (
    <div className="bg-white border rounded-xl p-6 print:shadow-none">
      <div className="flex justify-between items-start border-b pb-4 mb-4">
        <div>
          <h3 className="text-xl font-bold">CQ Motors - Factura Proforma</h3>
          <p className="text-sm text-slate-500">Vehículo: {vehiculo.placa} {vehiculo.marca} {vehiculo.modelo}</p>
          <p className="text-sm text-slate-500">Cliente: {vehiculo.cliente.nombre}</p>
          <p className="text-sm text-slate-500">Fecha: {new Date().toLocaleDateString('es-EC')}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-400">N° Factura</p>
          <p className="font-mono font-bold">FAC-{mantenimiento.id.slice(-6).toUpperCase()}</p>
        </div>
      </div>

      <table className="w-full text-sm mb-4">
        <thead><tr className="text-left border-b text-slate-500"><th className="py-2">Concepto</th><th className="text-right">Importe</th></tr></thead>
        <tbody>
          {mantenimiento.tareasRealizadas.filter(t=>t.completada).map(t=>(
            <tr key={t.id} className="border-b"><td className="py-2">{t.nombre} <span className="text-xs text-slate-400">({t.categoria})</span></td><td className="text-right">${t.costoEstimado?.toFixed(2)}</td></tr>
          ))}
          <tr className="border-b"><td className="py-2">Mano de obra</td><td className="text-right">${mantenimiento.costoManoObra.toFixed(2)}</td></tr>
        </tbody>
      </table>

      <div className="space-y-1 text-sm max-w-xs ml-auto">
        <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between items-center"><span>Descuento %</span><input type="number" value={descuento} onChange={e=>setDescuento(Number(e.target.value))} className="w-20 border rounded px-2 py-1 text-right" min={0} max={50} /></div>
        <div className="flex justify-between"><span>IVA 15%</span><span>${(subtotal*(1-descuento/100)*iva).toFixed(2)}</span></div>
        <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
      </div>

      <div className="mt-6 flex gap-2 print:hidden">
        <AccessibleButton variant="primary" onClick={handlePrint}>Imprimir / Guardar PDF</AccessibleButton>
        <AccessibleButton variant="secondary" onClick={()=>onGenerate?.(total)}>Confirmar Facturación</AccessibleButton>
      </div>
    </div>
  );
};
