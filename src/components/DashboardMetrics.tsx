import React, { useState, useMemo } from "react";
import { Mantenimiento, RepuestoInventario, UserRole } from "../types";
import { 
  Sparkles, 
  Target, 
  ArrowUpRight, 
  CheckCircle2, 
  PackageCheck, 
  RotateCw, 
  Info,
  Sliders,
  DollarSign,
  Briefcase
} from "lucide-react";
import { motion } from "motion/react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Cell
} from "recharts";

interface DashboardMetricsProps {
  maintenances: Mantenimiento[];
  inventory: RepuestoInventario[];
  userRole: UserRole;
}

export default function DashboardMetrics({
  maintenances,
  inventory,
  userRole
}: DashboardMetricsProps) {
  // Configurable targets for gamification & control
  const [maintTarget, setMaintTarget] = useState<number>(8); // default: 8 maintenances / month
  const [revenueTarget, setRevenueTarget] = useState<number>(1500); // default: $1500 USD / month
  const [metricTab, setMetricTab] = useState<"mantenimientos" | "finanzas">("mantenimientos");
  const [isChangingTargets, setIsChangingTargets] = useState<boolean>(false);

  // 1. Process Monthly Maintenance Performance
  const monthlyData = useMemo(() => {
    // Generate months list of the current year or last few months
    // Let's dynamically aggregate by Year-Month from dates
    const aggregations: { [key: string]: { count: number; revenue: number } } = {};
    
    // Default last 6 months (Ecuador standard names)
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const now = new Date();
    
    // Pre-populate last 6 months to ensure we have continuous data
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      aggregations[key] = { count: 0, revenue: 0 };
    }

    // Accumulate real maintenances data
    maintenances.forEach(m => {
      const mDate = new Date(m.fechaRegistro);
      if (isNaN(mDate.getTime())) return;
      const key = `${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, "0")}`;
      
      // If key is outside the pre-populated range, we can still gather it or ignore it
      if (!aggregations[key]) {
        aggregations[key] = { count: 0, revenue: 0 };
      }
      aggregations[key].count += 1;
      aggregations[key].revenue += m.totalCalculado || 0;
    });

    // Format for Recharts
    return Object.entries(aggregations)
      .map(([key, value]) => {
        const [year, month] = key.split("-");
        const monthNum = parseInt(month, 10) - 1;
        const name = `${monthNames[monthNum]} ${year.slice(2)}`;
        
        // Target calculations
        const targetCountVal = maintTarget;
        const targetRevenueVal = revenueTarget;
        const countPercentage = Math.round((value.count / targetCountVal) * 100);
        const revenuePercentage = Math.round((value.revenue / targetRevenueVal) * 100);

        return {
          monthKey: key,
          name,
          "Mantenimientos Logrados": value.count,
          "Meta de Mantenimientos": targetCountVal,
          "Facturación Lograda ($)": Math.round(value.revenue * 100) / 100,
          "Meta de Facturación ($)": targetRevenueVal,
          countPercentage,
          revenuePercentage
        };
      })
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [maintenances, maintTarget, revenueTarget]);

  // Current month's execution metrics helper
  const currentMonthMetrics = useMemo(() => {
    if (monthlyData.length === 0) return { count: 0, countPct: 0, rev: 0, revPct: 0 };
    const latest = monthlyData[monthlyData.length - 1];
    return {
      name: latest.name,
      count: latest["Mantenimientos Logrados"],
      countPct: latest.countPercentage,
      rev: latest["Facturación Lograda ($)"],
      revPct: latest.revenuePercentage
    };
  }, [monthlyData]);

  // 2. Process Spare Parts Rotation / Turnover rate index
  // Rotation Index % = (Units Consumed / (Current Stock + Units Consumed)) * 100
  const partsRotationData = useMemo(() => {
    const usageMap: { [key: string]: { id: string; name: string; quantityUsed: number } } = {};

    // Calculate usage from maintenances
    maintenances.forEach(m => {
      m.repuestosNecesarios?.forEach(req => {
        if (!req.surtido) return; // Only count fully delivered/served items
        const id = req.repuestoId;
        if (!usageMap[id]) {
          usageMap[id] = {
            id,
            name: req.nombre,
            quantityUsed: 0
          };
        }
        usageMap[id].quantityUsed += req.cantidad;
      });
    });

    // Merge with current inventory stock details to compute Rotation % & Status
    const results = inventory.map(item => {
      const usage = usageMap[item.id] || { quantityUsed: 0 };
      const totalUsed = usage.quantityUsed;
      const currentStock = item.stock;
      const initialStock = currentStock + totalUsed;

      // Turnover rate index ratio (%)
      const rotationPct = initialStock > 0 
        ? Math.round((totalUsed / initialStock) * 100) 
        : 0;

      return {
        id: item.id,
        code: item.codigo,
        name: item.nombre,
        categoria: item.categoria,
        stockActual: currentStock,
        unidadesUsadas: totalUsed,
        rotationPct,
        // Classification indicator
        rotationLevel: rotationPct >= 60 ? "Alta Rotación 🔥" : rotationPct >= 25 ? "Media Rotación ⚙️" : "Rotación Baja ❄️"
      };
    });

    // Sort by rotation % or absolute quantity used, and pick Top 5
    return results
      .sort((a, b) => b.unidadesUsadas - a.unidadesUsadas || b.rotationPct - a.rotationPct)
      .slice(0, 5);
  }, [maintenances, inventory]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/85 p-6 shadow-sm space-y-6">
      
      {/* Header section with badge actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-100 text-indigo-800 text-[9.5px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
              <RotateCw className="h-3 w-3 text-indigo-600 animate-spin-slow" />
              <span>Analítica BI de Taller</span>
            </span>
            <h3 className="font-display font-black text-slate-900 text-lg">
              Rendimiento Operativo & Rotación de Repuestos
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Análisis predictivo de inventario de repuestos y cumplimiento de metas operativas de taller de CQ Motors.
          </p>
        </div>

        {/* Configurations buttons */}
        {userRole !== UserRole.Cliente && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsChangingTargets(!isChangingTargets)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer ${
                isChangingTargets 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Ajustar Metas</span>
            </button>
          </div>
        )}
      </div>

      {/* Target Setting Form Container */}
      {isChangingTargets && (
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"
        >
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <Target className="h-3.5 w-3.5 text-indigo-600" />
              <span>Meta mensual de órdenes de mantenimiento</span>
            </label>
            <div className="flex items-center space-x-2">
              <input 
                type="range" 
                min="2" 
                max="25" 
                value={maintTarget} 
                onChange={(e) => setMaintTarget(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="font-mono font-black text-slate-900 text-sm bg-white px-2 py-1 rounded border min-w-[40px] text-center">
                {maintTarget}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Total de vehículos atendidos esperados para el mes.</p>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
              <span>Meta de facturación mensual (USD)</span>
            </label>
            <div className="flex items-center space-x-2">
              <input 
                type="range" 
                min="500" 
                max="5000" 
                step="250"
                value={revenueTarget} 
                onChange={(e) => setRevenueTarget(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="font-mono font-black text-slate-900 text-sm bg-white px-2.5 py-1 rounded border min-w-[70px] text-center">
                ${revenueTarget}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Gasto total acumulado por repuestos y mano de obra.</p>
          </div>
        </motion.div>
      )}

      {/* Main Charts & Progress Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Section 1: Goals and Fulfilment Chart */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-4.5 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Target className="h-4 w-4 text-indigo-600" />
                <span>Cumplimiento de Metas Mensuales</span>
              </h4>
              <p className="text-[10.5px] text-slate-500">Comportamiento histórico y aproximación del negocio hacia los objetivos definidos</p>
            </div>

            {/* Toggle tabs for Metas */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                onClick={() => setMetricTab("mantenimientos")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  metricTab === "mantenimientos" 
                    ? "bg-white text-slate-900 shadow-xs" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Mantenimientos
              </button>
              <button
                onClick={() => setMetricTab("finanzas")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  metricTab === "finanzas" 
                    ? "bg-white text-slate-900 shadow-xs" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Facturación ($)
              </button>
            </div>
          </div>

          {/* Current Month Gauge Highlight banner */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-55 bg-slate-50/50 rounded-xl border border-slate-100 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Meta del Mes Actual ({currentMonthMetrics.name || "N/A"})</span>
              <div className="flex items-baseline space-x-1.5">
                {metricTab === "mantenimientos" ? (
                  <>
                    <strong className="text-xl font-black text-slate-900">{currentMonthMetrics.count}</strong>
                    <span className="text-slate-400 font-medium">/ {maintTarget} ordenes</span>
                  </>
                ) : (
                  <>
                    <strong className="text-xl font-black text-slate-900">${currentMonthMetrics.rev.toLocaleString("es-EC")}</strong>
                    <span className="text-slate-400 font-medium">/ ${revenueTarget} USD</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1 text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Porcentaje Alcanzado</span>
              <div className="flex items-center justify-end space-x-2.5">
                <span className={`text-base font-black px-2 py-0.5 rounded-lg ${
                  (metricTab === "mantenimientos" ? currentMonthMetrics.countPct : currentMonthMetrics.revPct) >= 100 
                    ? "bg-emerald-100 text-emerald-800" 
                    : "bg-indigo-50 text-indigo-800"
                }`}>
                  {metricTab === "mantenimientos" ? currentMonthMetrics.countPct : currentMonthMetrics.revPct}%
                </span>
                <span className="text-[10px] text-slate-400 font-sans block">vs meta</span>
              </div>
              {/* Little progress-bar */}
              <div className="w-2.5/3 ml-auto h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    (metricTab === "mantenimientos" ? currentMonthMetrics.countPct : currentMonthMetrics.revPct) >= 100 
                      ? "bg-emerald-500 animate-pulse" 
                      : "bg-indigo-600"
                  }`}
                  style={{ width: `${Math.min(100, metricTab === "mantenimientos" ? currentMonthMetrics.countPct : currentMonthMetrics.revPct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Recharts Composed Chart showing Goal vs Actual */}
          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {metricTab === "mantenimientos" ? (
                <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" fontSize={9.5} stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis fontSize={9.5} stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const logs = payload[0].value as number;
                        const meta = payload[1].value as number;
                        const pct = Math.round((logs / meta) * 100);
                        return (
                          <div className="bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl text-[11px] shadow-xl font-sans space-y-1 text-left">
                            <p className="font-mono font-bold border-b border-slate-800 pb-1 text-slate-300">{payload[0].payload.name}</p>
                            <p className="font-semibold text-indigo-300">Meta Mensual: <span className="font-mono font-bold text-white">{meta} u</span></p>
                            <p className="font-semibold text-emerald-400">Logrado: <span className="font-mono font-bold text-white">{logs} u</span></p>
                            <div className="pt-1 border-t border-slate-800 mt-1 flex justify-between font-mono text-[9px] text-slate-400">
                              <span>Cumplimiento:</span>
                              <span className="font-bold text-emerald-400">{pct}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={25} wrapperStyle={{ fontSize: 10, top:-5 }} />
                  <Bar dataKey="Mantenimientos Logrados" fill="#6366f1" radius={[3, 3, 0, 0]} barSize={26} />
                  <Line dataKey="Meta de Mantenimientos" stroke="#f43f5e" strokeWidth={2} dot={{ fill: '#f43f5e', r: 3 }} activeDot={{ r: 5 }} strokeDasharray="5 5" name="Meta Máxima" />
                </ComposedChart>
              ) : (
                <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" fontSize={9.5} stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis fontSize={9.5} stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const revVal = payload[0].value as number;
                        const metaVal = payload[1].value as number;
                        const pctVal = Math.round((revVal / metaVal) * 100);
                        return (
                          <div className="bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl text-[11px] shadow-xl font-sans space-y-1 text-left">
                            <p className="font-mono font-bold border-b border-slate-800 pb-1 text-slate-300">{payload[0].payload.name}</p>
                            <p className="font-semibold text-emerald-300">Meta Ingreso: <span className="font-mono font-bold text-white">${metaVal} USD</span></p>
                            <p className="font-semibold text-emerald-400">Recaudado: <span className="font-mono font-bold text-white">${revVal.toLocaleString("es-EC")} USD</span></p>
                            <div className="pt-1 border-t border-slate-800 mt-1 flex justify-between font-mono text-[9px] text-slate-400">
                              <span>Cumplimiento:</span>
                              <span className="font-bold text-emerald-400">{pctVal}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={25} wrapperStyle={{ fontSize: 10, top:-5 }} />
                  <Bar dataKey="Facturación Lograda ($)" fill="#10b981" radius={[3, 3, 0, 0]} barSize={26} />
                  <Line dataKey="Meta de Facturación ($)" stroke="#f43f5e" strokeWidth={2} dot={{ fill: '#f43f5e', r: 3 }} activeDot={{ r: 5 }} strokeDasharray="5 5" name="Meta USD" />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 2: Spare Parts Rotation / usage index Chart */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-4.5 flex flex-col justify-between space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <PackageCheck className="h-4 w-4 text-emerald-600" />
              <span>Índice de Rotación de Repuestos</span>
            </h4>
            <p className="text-[10.5px] text-slate-500">Top 5 repuestos más consumidos en el taller con índice (%) de giro</p>
          </div>

          {/* Table index preview summary */}
          <div className="space-y-2 text-[10.5px] max-h-[105px] overflow-y-auto font-sans">
            {partsRotationData.length === 0 ? (
              <p className="text-slate-400 italic text-center py-2">No hay repuestos suministrados en órdenes pendientes.</p>
            ) : (
              partsRotationData.slice(0, 3).map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="truncate pr-2">
                    <span className="font-mono text-[9px] bg-indigo-100 text-indigo-800 px-1 py-0.2 rounded font-bold mr-1.5">{item.code}</span>
                    <strong className="text-slate-800 font-bold">{item.name}</strong>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-extrabold text-slate-900 block">{item.rotationPct}% Rotación</span>
                    <span className="text-[9px] text-slate-400 block">{item.unidadesUsadas} u. utilizadas</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Recharts - Horizontal Bar Chart showing Rotation % & Units used */}
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={partsRotationData}
                layout="vertical"
                margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" fontSize={9} stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis dataKey="code" type="category" fontSize={9} stroke="#94a3b8" tickLine={false} axisLine={false} />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-800 text-white p-2.5 rounded-xl text-[11px] shadow-xl font-sans space-y-1 text-left max-w-[210px]">
                          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1 truncate">{data.name}</p>
                          <p className="font-semibold text-amber-300">Categoría: <span className="font-mono text-white">{data.categoria}</span></p>
                          <p className="font-semibold text-emerald-400">Cantidad Usada: <span className="font-mono font-bold text-white">{data.unidadesUsadas} un.</span></p>
                          <p className="font-semibold text-indigo-300">Stock Disponible: <span className="font-mono font-bold text-white">{data.stockActual} un.</span></p>
                          <div className="pt-1.5 border-t border-slate-800 mt-1 px-1 flex justify-between items-center text-[10px]">
                            <span className="font-mono font-bold uppercase text-slate-400">Rotación:</span>
                            <span className="font-mono font-black text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">{data.rotationPct}%</span>
                          </div>
                          <p className="text-[9.5px] italic text-slate-400 text-right font-semibold pt-1">{data.rotationLevel}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="unidadesUsadas" name="Unidades Suministradas" radius={[0, 3, 3, 0]}>
                  {partsRotationData.map((entry, index) => {
                    // Dynamic coloring based on rotation percentage code
                    let color = "#10b981"; // high (emerald)
                    if (entry.rotationPct < 25) color = "#6374f1"; // low (indigo)
                    else if (entry.rotationPct < 60) color = "#f59e0b"; // moderate (amber)
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="flex items-start space-x-2.5 p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-2xl text-[11px] text-slate-600 leading-normal">
        <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
        <span className="font-medium text-slate-500">
          <strong>Anotación Logística:</strong> El índice (%) de rotación se actualiza en tiempo real de forma dinámica relacionando los repuestos físicamente surtidos en las bitácoras con el stock real disponible en estanterías. Los repuestos bajo la etiqueta de <strong className="text-indigo-700">Media/Alta Rotación 🔥</strong> son candidatos recomendados para automatizar su reposición urgente de inventario en CQ Motors.
        </span>
      </div>
    </div>
  );
}
