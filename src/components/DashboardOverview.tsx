import React, { useState } from "react";
import { Vehiculo, Mantenimiento, RepuestoInventario, ActividadReciente, UserRole } from "../types";
import CQMotorsLogo from "./CQMotorsLogo";
import { 
  Car, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Coins, 
  Layers, 
  Clock, 
  Plus, 
  FileText,
  UserCheck,
  ChevronRight,
  Package,
  Calendar,
  MessageCircle,
  Sparkles,
  PhoneCall
} from "lucide-react";
import { calculatePredictiveCRM } from "../utils/crmPredictive";
import DashboardMetrics from "./DashboardMetrics";
import { motion, AnimatePresence } from "motion/react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";

interface DashboardOverviewProps {
  vehicles: Vehiculo[];
  maintenances: Mantenimiento[];
  inventory: RepuestoInventario[];
  activities: ActividadReciente[];
  userRole: UserRole;
  onNavigateToTab: (tab: string) => void;
  onRestockItem: (id: string, amount?: number, nuevoCosto?: number) => void;
  onOpenVehicleMaint: (v: Vehiculo) => void;
  onUpdateVehicleStatus?: (id: string, status: Vehiculo["estado"]) => void;
}

export default function DashboardOverview({
  vehicles,
  maintenances,
  inventory,
  activities,
  userRole,
  onNavigateToTab,
  onRestockItem,
  onOpenVehicleMaint,
  onUpdateVehicleStatus,
}: DashboardOverviewProps) {
  // Math Calculations for Dashboard metrics
  const totalVehicles = vehicles.length;
  const inReparation = vehicles.filter((v) => v.estado === "En Proceso").length;
  const readyForDelivery = vehicles.filter((v) => v.estado === "Listo para Entrega").length;
  const incomingVehicles = vehicles.filter((v) => v.estado === "Ingresado").length;
  const lowStockParts = inventory.filter((item) => item.stock <= item.stockMinimo).length;

  // Financial Estimates (Business Intelligence focus!)
  const totalEstimationRevenue = maintenances.reduce((acc, m) => acc + m.totalCalculado, 0);
  const avgServiceCost = totalEstimationRevenue / (maintenances.length || 1);

  // State for toggling between ring (donut) chart and comparison bars for inventory analytics
  const [inventoryChartType, setInventoryChartType] = useState<"anillo" | "barras">("anillo");
  const [viewMode, setViewMode] = useState<"lista" | "kanban">("kanban");
  const [crmFilter, setCrmFilter] = useState<"All" | "Particular" | "Trabajo">("All");
  const [visibleActivitiesCount, setVisibleActivitiesCount] = useState<number>(10);

  // 1. Process monthly data for volume of entered vehicles (Vehículos Ingresados por Mes)
  const monthNamesInSpanish = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  
  // Historical seed values from previous months to make the chart look realistic and engaging
  const vehicleMonthlyCounts: { [key: string]: number } = {
    "Ene": 6,
    "Feb": 10,
    "Mar": 8,
    "Abr": 15,
    "May": 21,
    "Jun": 0,
  };

  // Populate from active vehicles dynamically
  vehicles.forEach(v => {
    if (!v.fechaIngreso) return;
    try {
      const d = new Date(v.fechaIngreso);
      if (!isNaN(d.getTime())) {
        const monthName = monthNamesInSpanish[d.getMonth()];
        if (vehicleMonthlyCounts[monthName] !== undefined) {
          vehicleMonthlyCounts[monthName] += 1;
        } else {
          // Fallback dynamic initialization
          vehicleMonthlyCounts[monthName] = 1;
        }
      }
    } catch (e) {
      // ignore
    }
  });

  const monthlyVolumeData = Object.entries(vehicleMonthlyCounts)
    .filter(([name]) => ["Ene", "Feb", "Mar", "Abr", "May", "Jun"].includes(name))
    .map(([name, count]) => ({
      name,
      "Vehículos": count
    }));

  // 2. Process spare parts cost distribution (Legacy compatibility just in case)
  const repuestosAgrupados: { [key: string]: number } = {};
  maintenances.forEach(m => {
    if (m.repuestosNecesarios && m.repuestosNecesarios.length > 0) {
      m.repuestosNecesarios.forEach(rep => {
        const totalCost = rep.cantidad * rep.costoUnitario;
        const words = rep.nombre.split(" ");
        const shortName = words[0] + " " + (words[1] || "");
        repuestosAgrupados[shortName] = (repuestosAgrupados[shortName] || 0) + totalCost;
      });
    }
  });

  let partsCostData = Object.entries(repuestosAgrupados).map(([name, total]) => ({
    name,
    "Costo": Number(total.toFixed(2))
  }));

  if (partsCostData.length === 0) {
    partsCostData = [
      { name: "Aceite Sintético", Costo: 45.00 },
      { name: "Filtro Aceite", Costo: 12.50 },
      { name: "Pastillas Freno", Costo: 55.00 },
      { name: "Bujía NGK", Costo: 34.00 }
    ];
  }

  // 3. Process spare parts by category for the Ring Chart (Anillo)
  const categoryStockCounts: { [key: string]: number } = {};
  inventory.forEach(item => {
    const cat = item.categoria || "Otros";
    categoryStockCounts[cat] = (categoryStockCounts[cat] || 0) + item.stock;
  });

  let partsCategoryData = Object.entries(categoryStockCounts).map(([name, total]) => ({
    name,
    "Stock": total
  }));

  if (partsCategoryData.length === 0) {
    partsCategoryData = [
      { name: "Motor", Stock: 45 },
      { name: "Frenos", Stock: 30 },
      { name: "Suspensión", Stock: 25 },
      { name: "Filtros", Stock: 60 }
    ];
  }

  // 4. Process Top 5 parts stock vs minimum stock for the comparison Bar Chart (Barras)
  const inventoryStockLevelsData = inventory.slice(0, 5).map(item => ({
    name: item.nombre.split(" ").slice(0, 2).join(" "), // short label
    "Stock Actual": item.stock,
    "Stock Mínimo": item.stockMinimo
  }));

  const CHART_COLORS = ["#f97316", "#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b", "#64748b"];

  return (
    <div className="space-y-6">
      {/* Central Landmark Brand Logo Banner */}
      <div className="animate-in fade-in zoom-in-95 duration-500">
        <CQMotorsLogo size="lg" className="w-full" />
      </div>

      {/* Dynamic Alerts Banner if parts are low */}
      {lowStockParts > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500/15 p-2 rounded-xl text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-950">Atención: Repuestos Críticos con Stock Bajo</h4>
              <p className="text-xs text-slate-600">
                Se detectaron {lowStockParts} repuestos en el inventario por debajo de la reserva mínima de seguridad.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab("inventory")}
            className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200/80 transition-all rounded-xl px-4 py-2 self-start md:self-auto cursor-pointer"
          >
            Surtir Repuestos Ahora &rarr;
          </button>
        </motion.div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Vehículos Ingresados</span>
            <span className="font-display text-2xl font-extrabold text-slate-900 block">{totalVehicles}</span>
            <span className="text-[11px] text-slate-500 flex items-center space-x-1">
              <Clock className="h-3 w-3 inline text-emerald-500" />
              <span>{incomingVehicles} por diagnosticar</span>
            </span>
          </div>
          <div className="bg-slate-100 p-3 rounded-xl text-slate-700">
            <Car className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">En Reparación</span>
            <span className="font-display text-2xl font-extrabold text-emerald-600 block">{inReparation}</span>
            <span className="text-[11px] text-slate-500 flex items-center space-x-1">
              <Wrench className="h-3 w-3 inline text-emerald-500" />
              <span>Personal mecánico activo</span>
            </span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
            <Wrench className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Para Entrega</span>
            <span className="font-display text-2xl font-extrabold text-blue-600 block">{readyForDelivery}</span>
            <span className="text-[11px] text-slate-500 flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3 inline text-blue-500" />
              <span>Listos en patio de despacho</span>
            </span>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 4 (BI Focused for Admins, Brand/Help Support for Clients) */}
        {userRole !== UserRole.Cliente ? (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Operaciones Estimadas</span>
              <span className="font-display text-2xl font-extrabold text-slate-900 block">
                ${totalEstimationRevenue.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                <Coins className="h-3 w-3 inline text-amber-500" />
                <span>Mano de obra + repuestos</span>
              </span>
            </div>
            <div className="bg-slate-900 p-3 rounded-xl text-white">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Mi Taller Preferido</span>
              <span className="font-display text-lg font-extrabold text-emerald-600 block">CQ Motors S.A.</span>
              <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                <CheckCircle2 className="h-3.5 w-3.5 inline text-emerald-500" />
                <span>Atención y Soporte 24/7</span>
              </span>
            </div>
            <div className="bg-slate-100 p-3 rounded-xl text-emerald-600">
              <Car className="h-6 w-6" />
            </div>
          </div>
        )}
      </div>

      {/* Dashboard BI Metrics Segment */}
      <DashboardMetrics 
        maintenances={maintenances}
        inventory={inventory}
        userRole={userRole}
      />

      {/* Charts & Graphs Module with Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recharts - Monthly Inbound Vehicles Volume (12 Cols for Clients, 7 Cols otherwise) */}
        <div className={`${userRole === UserRole.Cliente ? "lg:col-span-12" : "lg:col-span-7"} bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col justify-between space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">Ingreso de Vehículos por Mes</h3>
              <p className="text-[11px] text-slate-500">Cantidad de vehículos ingresados a diagnóstico y mantenimiento mensual</p>
            </div>
            <div className="bg-emerald-50 text-[10px] font-mono font-bold text-emerald-700 px-2.5 py-1 rounded-lg">
              Volumen de Entrada
            </div>
          </div>

          <div className="h-60 w-full pt-1" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyVolumeData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={5}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  allowDecimals={false}
                />
                <RechartsTooltip 
                  cursor={{ fill: '#f8fafc', opacity: 0.6 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div id={`tooltip-vehiculos-${label}`} className="bg-slate-900 text-white p-2.5 rounded-xl border border-slate-800 text-xs shadow-xl font-sans">
                          <p className="font-bold mb-0.5">{label}</p>
                          <p className="text-emerald-400 font-mono">
                            Ingresos: <span className="font-bold">{payload[0].value} vehículos</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="Vehículos" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recharts - Spare Parts Inventory Analytics (5/12 Cols) */}
        {userRole !== UserRole.Cliente && (
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col justify-between space-y-4">
            <div className="pb-2 border-b border-slate-100 flex items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">Estado de Inventario</h3>
                <p className="text-[11px] text-slate-500">Métricas analíticas de repuestos en bodega</p>
              </div>
              
              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 border border-slate-200/40">
                <button 
                  id="btn-inventory-anillo"
                  type="button"
                  onClick={() => setInventoryChartType("anillo")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    inventoryChartType === "anillo" 
                      ? "bg-white text-slate-950 shadow-sm font-extrabold" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Anillo
                </button>
                <button 
                  id="btn-inventory-barras"
                  type="button"
                  onClick={() => setInventoryChartType("barras")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    inventoryChartType === "barras" 
                      ? "bg-white text-slate-950 shadow-sm font-extrabold" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Barras
                </button>
              </div>
            </div>

            <div className="h-44 w-full flex items-center justify-center pt-1" style={{ minWidth: 0 }}>
              {inventoryChartType === "anillo" ? (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center w-full h-full">
                  {/* Pie/Donut Chart Representation */}
                  <div className="sm:col-span-6 h-40 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={partsCategoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="Stock"
                        >
                          {partsCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div id={`tooltip-category-${payload[0].name}`} className="bg-slate-900 text-white p-2.5 rounded-xl border border-slate-800 text-xs shadow-xl font-sans text-left">
                                  <p className="font-bold line-clamp-1">{payload[0].name}</p>
                                  <p className="text-orange-400 font-mono mt-0.5 font-bold">
                                    Disponibles: {payload[0].value} un.
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Inner Label for total replacement parts in stock */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Items</span>
                      <span className="text-xs font-extrabold text-slate-800 font-mono">
                        {partsCategoryData.reduce((sum, item) => sum + item.Stock, 0)}
                      </span>
                    </div>
                  </div>

                  {/* Explanatory Legend with actual listings */}
                  <div className="sm:col-span-6 space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {partsCategoryData.map((item, idx) => {
                      const totalSum = partsCategoryData.reduce((sum, i) => sum + i.Stock, 0) || 1;
                      const percentage = Math.round((item.Stock / totalSum) * 100);
                      return (
                        <div key={item.name} className="flex items-center justify-between text-[11px] gap-1">
                          <span className="text-slate-600 font-medium truncate flex items-center space-x-1.5" title={item.name}>
                            <span 
                              className="w-2 h-2 rounded-full inline-block shrink-0" 
                              style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} 
                            />
                            <span className="truncate max-w-[85px]">{item.name}</span>
                          </span>
                          <span className="font-mono text-slate-900 font-bold text-right shrink-0">
                            {item.Stock} <span className="text-[9px] text-slate-400 font-normal">({percentage}%)</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Double Bar Chart Comparison: Stock Actual vs Stock Minimo */
                <div className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventoryStockLevelsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={3}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false} 
                        allowDecimals={false}
                      />
                      <RechartsTooltip 
                        cursor={{ fill: '#f8fafc', opacity: 0.6 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div id="tooltip-stock-comparis" className="bg-slate-900 text-white p-2.5 rounded-xl border border-slate-800 text-xs shadow-xl font-sans text-left space-y-1">
                                <p className="font-bold border-b border-slate-800 pb-1 mb-1">{payload[0].payload.name}</p>
                                <p className="text-emerald-400 font-mono flex justify-between gap-4 text-xs">
                                  <span>Stock Actual:</span>
                                  <span className="font-bold text-emerald-500">{payload[0].value} u</span>
                                </p>
                                <p className="text-rose-400 font-mono flex justify-between gap-4 text-xs">
                                  <span>Stock Mínimo:</span>
                                  <span className="font-bold text-rose-500">{payload[1].value} u</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={20} 
                        iconSize={8} 
                        fontSize={9} 
                        wrapperStyle={{ top: -10, fontSize: 10, fontFamily: 'sans-serif' }}
                      />
                      <Bar dataKey="Stock Actual" fill="#10b981" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Stock Mínimo" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 text-center font-medium">
              Análisis dinámico obtenido de {inventory.length} referencias de repuestos registradas
            </div>
          </div>
        )}
      </div>

      {/* CRM Predictive Intelligence Centre */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-100 text-emerald-800 text-[9.5px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles className="h-3 w-3 animate-spin text-emerald-600" />
                <span>Módulo Inteligente</span>
              </span>
              <h3 className="font-display font-black text-slate-900 text-lg">
                Fidelización & Monitoreo CRM Colectivo
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Vehículos ordenados cronológicamente por aproximación al límite preventivo (Faltante en Km o tiempo de permanencia).
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-600 block">
              Algoritmo de Predicción:
            </span>
            <span className="text-[10px] font-mono text-emerald-700 font-bold block bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg mt-0.5">
              {crmFilter === "Trabajo" ? "Trabajo: 5,000 Km o 90 Días" : crmFilter === "Particular" ? "Particular: 5,000 Km o 180 Días" : "Híbrido Inteligente"}
            </span>
          </div>
        </div>

        {/* Filtros de Frecuencia CRM / Sección Especializada */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-150 p-1 rounded-2xl border border-slate-200 w-fit">
          <button
            onClick={() => setCrmFilter("All")}
            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              crmFilter === "All"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Todos los Autos ({vehicles.length})
          </button>
          <button
            onClick={() => setCrmFilter("Particular")}
            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              crmFilter === "Particular"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🚗 Particular ({vehicles.filter(v => !v.tipoUso || v.tipoUso === "Particular").length})
          </button>
          <button
            onClick={() => setCrmFilter("Trabajo")}
            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              crmFilter === "Trabajo"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-850"
            }`}
          >
            <span>🛠️ Sección Trabajo ({vehicles.filter(v => v.tipoUso === "Trabajo").length})</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(() => {
            let list = vehicles.map(v => {
              const vMaints = maintenances.filter(m => m.vehiculoId === v.id);
              const crm = calculatePredictiveCRM(v, vMaints);
              return { vehicle: v, crm };
            });

            if (crmFilter !== "All") {
              list = list.filter(item => (item.vehicle.tipoUso || "Particular") === crmFilter);
            }

            list = list.sort((a, b) => a.crm.daysRemaining - b.crm.daysRemaining);

            if (list.length === 0) {
              return (
                <div className="col-span-full p-8 text-center bg-white border border-dashed border-slate-200 rounded-2xl text-slate-400">
                  <Car className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">No se encontraron vehículos registrados en la base de datos.</p>
                </div>
              );
            }

            return list.slice(0, 6).map(({ vehicle, crm }) => {
              const urgent = crm.alertState === "urgent";
              const warning = crm.alertState === "warning";
              
              const phoneClean = vehicle.cliente.telefono.replace(/\s+/g, "").replace(/\+/g, "");
              const messageBody = `Hola ${vehicle.cliente.nombre}, le saluda CQ Motors. En base a nuestro sistema de CRM Inteligente, estimamos que su ${vehicle.marca} ${vehicle.modelo} (Placa: ${vehicle.placa}) se encuentra por recorrer los ${crm.estimatedCurrentKm.toLocaleString("es-EC")} Km. 

Le sugerimos agendar una cita para su *${crm.recommendedService}*. 
Detalle técnico preventivo sugerido:
${crm.diagnosticChecklist.slice(0, 3).map((item: string) => `• ${item}`).join("\n")}

¿Le gustaría que reservemos su turno en CQ Motors?`;
              
              const waLink = `https://wa.me/${phoneClean}?text=${encodeURIComponent(messageBody)}`;

              return (
                <div 
                  key={vehicle.id} 
                  className={`bg-white rounded-2xl border p-4.5 space-y-4 flex flex-col justify-between transition-all hover:shadow-md ${
                    urgent ? "border-rose-400 ring-2 ring-rose-500/10 hover:border-rose-500" :
                    warning ? "border-amber-400 ring-2 ring-amber-500/5 hover:border-amber-500" :
                    "border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[9.5px] bg-slate-900 text-white px-2 py-0.5 rounded-md font-extrabold uppercase">
                            {vehicle.placa}
                          </span>
                          {vehicle.tipoUso === "Trabajo" ? (
                            <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md border border-amber-200">
                              Trabajo 🛠️
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md border border-slate-200">
                              Particular
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-extrabold text-slate-900 mt-1.5 leading-tight">
                          {vehicle.marca} {vehicle.modelo} <span className="font-normal font-sans text-slate-500 text-[11px]">({vehicle.anio})</span>
                        </h4>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Cliente: <span className="font-semibold text-slate-700">{vehicle.cliente.nombre}</span>
                        </div>
                      </div>

                      <span className={`text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded-full ${
                        crm.confidence === "Alta-Estable" ? "bg-emerald-100 text-emerald-800" :
                        crm.confidence === "Media-Ajustada" ? "bg-amber-100 text-amber-800" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        Con: {crm.confidence}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs font-sans">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-slate-500">Km Estimado:</span>
                        <strong className="text-slate-800">{crm.estimatedCurrentKm.toLocaleString("es-EC")} Km</strong>
                      </div>
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-slate-500">Diferencial:</span>
                        <span className="font-semibold text-emerald-700 font-mono">+{crm.kmPerDay} Km/Día</span>
                      </div>
                      <div className="flex justify-between items-center text-[10.5px] border-t border-slate-200/50 pt-1.5 mt-1.5">
                        <span className="text-slate-500 font-semibold">Siguiente Servicio:</span>
                        <strong className={`font-black ${urgent ? "text-rose-600 font-black animate-pulse" : "text-slate-800"}`}>
                          {crm.nextServiceDateStr}
                        </strong>
                      </div>
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-slate-500">Margen Restante:</span>
                        <span className={`font-extrabold ${urgent ? "text-rose-700" : warning ? "text-amber-700" : "text-emerald-700"}`}>
                          {crm.daysRemaining} días ({crm.mileageRemainingKm.toLocaleString("es-EC")} Km)
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8.5px] uppercase tracking-wider text-slate-450 font-bold block">Rutina Preventiva Recomendada:</span>
                      <div className="text-[11px] font-bold text-slate-800 mb-1 leading-snug">{crm.recommendedService}</div>
                      <div className="space-y-0.5">
                        {crm.diagnosticChecklist.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex items-start text-[10px] text-slate-600 leading-tight">
                            <span className="text-emerald-600 font-bold mr-1 shrink-0">✓</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5 mt-3">
                    <button
                      onClick={() => onOpenVehicleMaint(vehicle)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <FileText className="h-3 w-3" />
                      <span>Ficha Técnica</span>
                    </button>
                    
                    {userRole !== UserRole.Cliente && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex-1 px-3 py-1.5 rounded-lg text-[10.5px] font-extrabold transition-all text-center flex items-center justify-center gap-1 ${
                          urgent ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm" :
                          warning ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm" :
                          "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        }`}
                        title="Enviar recordatorio interactivo por WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Notificar Cliente</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Grid: Active Vehicules Queue & Low Stock Spare parts list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Active vehicles workflow (8/12 cols) with Toggle list/kanban */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 flex items-center space-x-1.5">
                <Layers className="h-5 w-5 text-emerald-500" />
                <span>Flujo de Trabajo del Taller</span>
              </h3>
              <p className="text-xs text-slate-500">Gestión de patio activa y control de procesos en tiempo real</p>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Toggle Switch */}
              <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200/40 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("lista")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "lista"
                      ? "bg-white text-slate-950 shadow-sm font-extrabold"
                      : "text-slate-500 hover:text-slate-950"
                  }`}
                >
                  Lista
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("kanban")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "kanban"
                      ? "bg-white text-slate-950 shadow-sm font-extrabold"
                      : "text-slate-500 hover:text-slate-950"
                  }`}
                >
                  Kanban
                </button>
              </div>

              <button
                onClick={() => onNavigateToTab("vehicles")}
                className="text-xs font-bold text-slate-900 hover:text-slate-700 underline text-right cursor-pointer"
              >
                Ingreso +
              </button>
            </div>
          </div>

          {viewMode === "lista" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Placa / Vehículo</th>
                    <th className="p-3">Propietario / Cliente</th>
                    <th className="p-3">Avance Técnico</th>
                    <th className="p-3">Ficha Mantenimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicles.filter(v => v.estado !== "Entregado").map((v) => {
                    const hasMaint = maintenances.find(m => m.vehiculoId === v.id);
                    const totalTasks = hasMaint?.tareasRealizadas.length || 0;
                    const completedTasks = hasMaint?.tareasRealizadas.filter(t => t.completada).length || 0;
                    const progressPercentage = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

                    return (
                      <tr key={v.id} className="hover:bg-slate-50/50 transition-all font-sans group">
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">{v.placa}</div>
                          <div className="text-[11px] text-slate-400">{v.marca} {v.modelo} ({v.anio})</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-800">{v.cliente.nombre}</div>
                          <div className="text-[11px] text-slate-400">{v.cliente.telefono}</div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                              <span className="font-mono">{completedTasks}/{totalTasks} tareas</span>
                              <span className="font-bold">{progressPercentage}%</span>
                            </div>
                            <div className="w-24 sm:w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  v.estado === "Listo para Entrega" ? "bg-blue-500" : "bg-emerald-500"
                                }`} 
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => onOpenVehicleMaint(v)}
                            className={`inline-flex items-center space-x-1 font-bold text-[11px] py-1 px-2.5 rounded-lg transition-all border ${
                              v.estado === "Ingresado"
                                ? "bg-slate-900 border-slate-900 text-white hover:bg-slate-800"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                            } cursor-pointer`}
                          >
                            <FileText className="h-3 w-3 shrink-0" />
                            <span>Mantenimiento</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {vehicles.filter(v => v.estado !== "Entregado").length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400 font-mono text-xs">
                        No hay vehículos activos en patio en este momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* TABLERO KANBAN DE ESTADO DE PATIO (3rd of 8 improvements) */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1.5">
              {[
                { id: "Ingresado", title: "Admisión / Ingresados", color: "border-t-amber-400 text-amber-800 bg-amber-50/5" },
                { id: "En Proceso", title: "Mantenimiento Técnico", color: "border-t-emerald-550 text-emerald-800 bg-emerald-50/5" },
                { id: "Listo para Entrega", title: "Listo / Control Calidad", color: "border-t-blue-500 text-blue-800 bg-blue-50/5" },
              ].map((col) => {
                const colVehicles = vehicles.filter(v => v.estado === col.id);
                return (
                  <div 
                    key={col.id}
                    className={`rounded-2xl border-t-4 border p-3 flex flex-col space-y-3 min-h-[320px] ${col.color}`}
                  >
                    <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                      <span className="text-[11px] uppercase font-bold tracking-wider text-slate-800 font-sans">
                        {col.title}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded-full text-slate-600 font-mono">
                        {colVehicles.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[380px] pr-0.5">
                      {colVehicles.map((v) => {
                        const hasMaint = maintenances.find(m => m.vehiculoId === v.id);
                        const totalTasks = hasMaint?.tareasRealizadas.length || 0;
                        const completedTasks = hasMaint?.tareasRealizadas.filter(t => t.completada).length || 0;
                        const pct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

                        return (
                          <div 
                            key={v.id} 
                            className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-2.5 transition-all hover:shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="border border-slate-900 bg-white px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-slate-950 uppercase tracking-tight shrink-0">
                                {v.placa}
                              </span>
                              
                              {/* Workflow fast navigation controls in Kanban */}
                              {userRole !== UserRole.Cliente && onUpdateVehicleStatus && (
                                <div className="flex items-center space-x-1 shrink-0 bg-slate-50 border p-0.5 rounded-lg">
                                  {col.id !== "Ingresado" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const prevStatus = col.id === "Listo para Entrega" ? "En Proceso" : "Ingresado";
                                        onUpdateVehicleStatus(v.id, prevStatus as any);
                                      }}
                                      className="p-1 hover:bg-slate-200 text-slate-600 hover:text-slate-950 rounded transition-colors text-[9px] font-extrabold cursor-pointer"
                                      title="Mover columna anterior"
                                    >
                                      &larr;
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextStatus = col.id === "Ingresado" ? "En Proceso" : "Listo para Entrega";
                                      onUpdateVehicleStatus(v.id, nextStatus as any);
                                    }}
                                    className="p-1 hover:bg-slate-200 text-slate-600 hover:text-slate-950 rounded transition-colors text-[9px] font-extrabold cursor-pointer"
                                    title="Mover columna siguiente"
                                  >
                                    &rarr;
                                  </button>
                                </div>
                              )}
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-slate-950 line-clamp-1">{v.marca} {v.modelo}</h4>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">Prop: {v.cliente.nombre}</p>
                            </div>

                            {/* Mini Progress */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                                <span>{completedTasks}/{totalTasks} Tareas</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-550 transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onOpenVehicleMaint(v)}
                              className="w-full py-1.5 bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                            >
                              <FileText className="h-3 w-3 shrink-0" />
                              <span>Ficha Técnica</span>
                            </button>
                          </div>
                        );
                      })}
                      {colVehicles.length === 0 && (
                        <div className="h-full border border-dashed border-slate-200 rounded-xl flex items-center justify-center p-6 text-center">
                          <span className="text-[10px] text-slate-400 font-medium">Vacío</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* BALANCE DE CARGA Y PRODUCTIVIDAD DE MECÁNICOS (4th of 8 improvements) */}
          <div className="border-t border-slate-100 pt-5 mt-5 space-y-3.5">
            <div>
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest font-mono">
                Balance de Carga y Capacidad de Técnicos
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">Productividad Global de Mecánicos</h4>
              <p className="text-[11px] text-slate-500">
                Monitoreo continuo de órdenes en patio sobre el umbral de capacidad ideal.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/40">
              {(() => {
                const mechanicsList = ["David Mendoza", "Carlos Solís", "Juan Carlos Pérez", "Galo Chimbo"];
                return mechanicsList.map((meca) => {
                  const activeMaints = maintenances.filter(m => {
                    const veh = vehicles.find(v => v.id === m.vehiculoId);
                    return m.mecanicoAsignado === meca && veh && veh.estado !== "Entregado";
                  });
                  
                  const activeJobs = activeMaints.length;
                  const totalTasks = activeMaints.reduce((sum, m) => sum + m.tareasRealizadas.length, 0);
                  const completedTasks = activeMaints.reduce((sum, m) => sum + m.tareasRealizadas.filter(t => t.completada).length, 0);
                  
                  const pendingTasks = totalTasks - completedTasks;
                  const loadPercentage = Math.min(100, Math.round((activeJobs / 3) * 100)); // 3 active orders = full workload
                  
                  let statusLabel = "Disponible";
                  let statusBg = "bg-emerald-100 text-emerald-800 border-emerald-200";
                  if (loadPercentage > 30 && loadPercentage <= 75) {
                    statusLabel = "Trabajo Óptimo";
                    statusBg = "bg-amber-100 text-amber-800 border-amber-200";
                  } else if (loadPercentage > 75) {
                    statusLabel = "Capacidad Límite";
                    statusBg = "bg-rose-100 text-rose-800 border-rose-200";
                  }

                  return (
                    <div 
                      key={meca} 
                      className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-xs flex flex-col justify-between space-y-2.5"
                    >
                      <div>
                        <span className="font-bold text-xs text-slate-900 truncate block">{meca.split(" ")[0]} {meca.split(" ")[1] || ""}</span>
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border mt-1 select-none ${statusBg}`}>
                          {statusLabel}
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-600 font-sans">
                        <div className="flex justify-between items-center text-[10px]">
                          <span>Autos Asignados:</span>
                          <span className="font-bold text-slate-900 font-mono">{activeJobs}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span>Pendientes ABC:</span>
                          <span className="font-bold text-slate-900 font-mono">{pendingTasks}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-slate-500">
                          <span>Saturación</span>
                          <span className="font-bold">{loadPercentage}%</span>
                        </div>
                        <div className="bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              loadPercentage <= 30 ? "bg-emerald-500" : loadPercentage <= 75 ? "bg-amber-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${loadPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Right: Low Stock alerts & Quick Restock (4/12 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col justify-between space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="font-display font-bold text-md text-slate-900 flex items-center space-x-1.5">
              <Package className="h-4.5 w-4.5 text-slate-600" />
              <span>Inventario de Repuestos Críticos</span>
            </h3>
            <p className="text-xs text-slate-500">Repuestos con niveles por debajo del stock mínimo de reserva</p>
          </div>

          <div className="space-y-3.5 flex-1 max-h-[280px] overflow-y-auto custom-scrollbar">
            {inventory.some(item => item.stock <= item.stockMinimo) ? (
              inventory
                .filter((item) => item.stock <= item.stockMinimo)
                .map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 bg-rose-50/50 border border-rose-100/60 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-mono text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold uppercase">
                        {item.codigo}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">{item.nombre}</h4>
                      <p className="text-[11px] text-slate-500">
                        Disponibles: <span className="font-bold text-red-600">{item.stock}</span> (Mín: {item.stockMinimo})
                      </p>
                    </div>
                    
                    <button
                      onClick={() => {
                        const defaultCost = item.costoCompra || Number((item.precioVenta * 0.7).toFixed(2));
                        const qtyStr = prompt(`Cantidad recibida en la Orden de Compra para "${item.nombre}":`, "10");
                        if (!qtyStr) return;
                        const qty = parseInt(qtyStr);
                        if (isNaN(qty) || qty <= 0) {
                          alert("La cantidad debe ser un número positivo.");
                          return;
                        }
                        const costStr = prompt(`Costo de adquisición unitario para "${item.nombre}" ($):`, defaultCost.toFixed(2));
                        if (!costStr) return;
                        const cost = parseFloat(costStr);
                        if (isNaN(cost) || cost <= 0) {
                          alert("El costo de adquisición debe ser un número positivo.");
                          return;
                        }
                        onRestockItem(item.id, qty, cost);
                      }}
                      className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 hover:text-emerald-700 border border-rose-200 hover:border-emerald-200 text-rose-700 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer"
                      title="Surtir unidades de este repuesto (Promedio Ponderado)"
                    >
                      Restock
                    </button>
                  </div>
                ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                <span className="text-xs font-bold">Reserva de Inventario Segura</span>
                <span className="text-[11px] text-slate-500">Todos los repuestos superan el límite crítico.</span>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateToTab("inventory")}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
          >
            <span>Ver Inventario Completo</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Operations Logs / Activity History */}
      <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Logger de Taller</span>
            <h3 className="font-display font-medium text-lg text-white">Actividades y Historial Técnico</h3>
            <p className="text-xs text-slate-400">Monitoreo automático de ingresos y alertas de stock de CQ Motors</p>
          </div>
          <div className="text-[11px] font-mono text-slate-400 shrink-0">
            Mostrando <span className="font-bold text-emerald-400">{Math.min(activities.length, visibleActivitiesCount)}</span> de <span className="font-bold text-slate-200">{activities.length}</span> registros
          </div>
        </div>

        <div className="space-y-3.5">
          {activities.length === 0 ? (
            <div className="p-6 text-center text-slate-500 font-mono text-xs">
              No hay actividades registradas en el historial aún.
            </div>
          ) : (
            activities.slice(0, visibleActivitiesCount).map((act) => {
              let badgeBg = "bg-slate-800 text-slate-200";
              if (act.tipo === "registro") badgeBg = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
              else if (act.tipo === "bajo_stock") badgeBg = "bg-rose-500/15 text-rose-400 border border-rose-500/20";
              else if (act.tipo === "recordatorio") badgeBg = "bg-amber-500/10 text-amber-400 border border-amber-500/20";

              return (
                <div 
                  key={act.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-800/40 hover:bg-slate-800/80 rounded-xl transition-all border border-slate-800/40"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono tracking-wider shrink-0 mt-0.5 ${badgeBg}`}>
                      {act.tipo}
                    </div>
                    <p className="text-xs text-slate-200 leading-normal font-sans">{act.mensaje}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2 shrink-0 pl-1 sm:pl-0">
                    <div className="text-[11px] text-slate-400 font-mono">
                      {new Date(act.fecha).toLocaleTimeString("es-EC", { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <span className="text-slate-600 font-mono">|</span>
                    <div className="text-[11px] text-slate-300 font-medium">{act.usuario}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Load More / Collapse Controls */}
        {activities.length > 10 && (
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {activities.length > visibleActivitiesCount ? (
              <button
                type="button"
                onClick={() => setVisibleActivitiesCount(prev => prev + 10)}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Cargar más registros (+10)</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-500 font-mono">Todos los registros cargados ({activities.length})</span>
            )}

            {visibleActivitiesCount > 10 && (
              <button
                type="button"
                onClick={() => setVisibleActivitiesCount(10)}
                className="text-[11px] text-slate-400 hover:text-white underline font-mono cursor-pointer transition-colors"
              >
                Mostrar solo los 10 más recientes
              </button>
            )}
          </div>
        )}
      </div>


    </div>
  );
}
