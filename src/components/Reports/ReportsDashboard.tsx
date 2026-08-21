import React, { useMemo } from 'react';
import { Vehiculo, Mantenimiento, RepuestoInventario } from '../../types';

type Props = { vehicles: Vehiculo[]; maintenances: Mantenimiento[]; inventory: RepuestoInventario[]; };

export const ReportsDashboard: React.FC<Props> = ({ vehicles, maintenances, inventory }) => {
  const stats = useMemo(()=>{
    const ingresos = maintenances.reduce((s,m)=> s + (m.totalCalculado||0),0);
    const porEstado = vehicles.reduce((acc:Record<string,number>,v)=>{ acc[v.estado]=(acc[v.estado]||0)+1; return acc; },{});
    const criticos = inventory.filter(i=> i.stock <= i.stockMinimo).length;
    const ticketPromedio = maintenances.length ? ingresos / maintenances.length : 0;
    return { ingresos, porEstado, criticos, ticketPromedio, totalVeh: vehicles.length };
  },[vehicles, maintenances, inventory]);

  const exportCSV = ()=>{
    const rows = [['placa','marca','modelo','estado','fechaIngreso'], ...vehicles.map(v=>[v.placa, v.marca, v.modelo, v.estado, v.fechaIngreso])];
    const csv = rows.map(r=> r.map(c=> `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='vehiculos.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4"><p className="text-xs text-slate-500 uppercase">Vehículos</p><p className="text-2xl font-bold">{stats.totalVeh}</p></div>
        <div className="bg-white border rounded-xl p-4"><p className="text-xs text-slate-500 uppercase">Ingresos acumulados</p><p className="text-2xl font-bold">${stats.ingresos.toFixed(2)}</p></div>
        <div className="bg-white border rounded-xl p-4"><p className="text-xs text-slate-500 uppercase">Ticket promedio</p><p className="text-2xl font-bold">${stats.ticketPromedio.toFixed(2)}</p></div>
        <div className="bg-white border rounded-xl p-4"><p className="text-xs text-slate-500 uppercase">Repuestos críticos</p><p className={`text-2xl font-bold ${stats.criticos?'text-rose-600':''}`}>{stats.criticos}</p></div>
      </div>
      <div className="bg-white border rounded-xl p-4">
        <h4 className="font-bold mb-2">Vehículos por estado</h4>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(stats.porEstado).map(([k,v])=> <span key={k} className="px-3 py-1 bg-slate-100 rounded-full text-sm">{k}: <b>{v}</b></span>)}
        </div>
      </div>
      <button onClick={exportCSV} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm">Exportar vehículos CSV</button>
    </div>
  );
};
