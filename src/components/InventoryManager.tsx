import React, { useState } from "react";
import { RepuestoInventario, UserRole } from "../types";
import { sanitizeInput } from "../utils/security";
import { 
  Package, 
  Plus, 
  Search, 
  ShoppingCart, 
  AlertTriangle, 
  CheckCircle, 
  Grid, 
  DollarSign, 
  Tag, 
  Navigation,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  Upload,
  FileText,
  Sparkles,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InventoryManagerProps {
  inventory: RepuestoInventario[];
  userRole: UserRole;
  onRestockItem: (id: string, amount?: number, nuevoCosto?: number) => void;
  onAddNewPart: (newPart: RepuestoInventario) => void;
  onDeletePart?: (id: string) => void;
}

export default function InventoryManager({
  inventory,
  userRole,
  onRestockItem,
  onAddNewPart,
  onDeletePart
}: InventoryManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);

  // Form Fields
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [stock, setStock] = useState(10);
  const [stockMinimo, setStockMinimo] = useState(5);
  const [precioVenta, setPrecioVenta] = useState(25.0);
  const [ubicacion, setUbicacion] = useState("Estantería A-1");
  const [categoria, setCategoria] = useState("Lubricantes");
  const [formError, setFormError] = useState("");

  // AI Electronic Invoice parsing states
  const [showAiForm, setShowAiForm] = useState(false);
  const [copiedInvoiceText, setCopiedInvoiceText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [extractedItems, setExtractedItems] = useState<any[]>([]);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // AUTOMATIZACIÓN DE PEDIDOS A PROVEEDORES (5th of 8 improvements)
  const [showPurchaseOrders, setShowPurchaseOrders] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<"idle" | "sending" | "success">("idle");
  const [customOrderAmounts, setCustomOrderAmounts] = useState<Record<string, number>>({});

  const [selectedRestockItem, setSelectedRestockItem] = useState<RepuestoInventario | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockCost, setRestockCost] = useState<number>(0);

  const handleOpenRestockModal = (item: RepuestoInventario) => {
    setSelectedRestockItem(item);
    setRestockQty(10);
    setRestockCost(item.costoCompra || Number((item.precioVenta * 0.7).toFixed(2)));
  };

  const criticalItemsList = inventory.filter(item => item.stock <= item.stockMinimo);

  const handleTriggerAutoPurchase = () => {
    setPurchaseStatus("sending");
    setTimeout(() => {
      criticalItemsList.forEach(item => {
        const orderQty = customOrderAmounts[item.id] !== undefined 
          ? customOrderAmounts[item.id] 
          : (item.stockMinimo * 3 - item.stock);
        if (orderQty > 0) {
          onRestockItem(item.id, orderQty);
        }
      });
      setPurchaseStatus("success");
      setTimeout(() => {
        setShowPurchaseOrders(false);
        setPurchaseStatus("idle");
        setCustomOrderAmounts({});
      }, 3000);
    }, 1800);
  };

  const distinctCategories = Array.from(new Set(inventory.map((item) => item.categoria)));

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!codigo.trim() || !nombre.trim() || !ubicacion.trim()) {
      setFormError("Todos los campos marcados con asterisco (*) son requeridos.");
      return;
    }

    const newPart: RepuestoInventario = {
      id: `rep-${Date.now()}`,
      codigo: codigo.toUpperCase().trim(),
      nombre: nombre.trim(),
      stock: Number(stock),
      stockMinimo: Number(stockMinimo),
      precioVenta: Number(precioVenta),
      costoCompra: Number(precioVenta) * 0.7, // Sugerir 70% del valor de venta como costo de compra predeterminado
      ubicacion: ubicacion.trim(),
      categoria: categoria
    };

    onAddNewPart(newPart);

    // Reset fields
    setCodigo("");
    setNombre("");
    setStock(10);
    setStockMinimo(5);
    setPrecioVenta(25.0);
    setUbicacion("Estantería A-1");
    setFormError("");
    setShowAddForm(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    setAnalysisError("");
    setExtractedItems([]);
    setSuccessCount(null);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setCopiedInvoiceText(text);
    };
    reader.onerror = () => {
      setAnalysisError("Hubo un problema de lectura del archivo de factura electrónica.");
    };
    reader.readAsText(file);
  };

  const handleProcessInvoice = async () => {
    if (!copiedInvoiceText.trim()) {
      setAnalysisError("Por favor, pegue el contenido de texto/XML o cargue una factura primero.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError("");
    setExtractedItems([]);
    setSuccessCount(null);

    try {
      const sanitizedText = sanitizeInput(copiedInvoiceText, 50000);
      const response = await fetch("/api/analyze-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          invoiceText: sanitizedText,
          fileName: sanitizeInput(selectedFileName || "factura_manual.txt", 100)
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Fallo en la comunicación con el servidor central de análisis.");
      }

      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        setAnalysisError("No se reconocieron repuestos detallados de este texto. Compruebe que la factura de ejemplo tenga descripciones claras de productos.");
      } else {
        setExtractedItems(data.items);
      }
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "Fallo inesperado al conectar con el motor de IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBulkRegister = () => {
    if (extractedItems.length === 0) return;

    let addedCount = 0;
    extractedItems.forEach((item, index) => {
      const newPart: RepuestoInventario = {
        id: `rep-invoice-${Date.now()}-${index}`,
        codigo: item.codigo ? item.codigo.toUpperCase().trim() : `REP-SRI-${Date.now()}-${index}`,
        nombre: item.nombre || "Compomente extraído por IA",
        stock: Number(item.cantidad) || 10,
        stockMinimo: 5,
        precioVenta: Number(item.precioVenta) || 20.0,
        costoCompra: Number(item.costoCompra) || (Number(item.precioVenta) || 20.0) * 0.7, // Sugerir 70% del valor de venta si no viene especificado en la extracción
        ubicacion: item.ubicacion || "Estantería A-1",
        categoria: item.categoria || "Lubricantes"
      };
      onAddNewPart(newPart);
      addedCount++;
    });

    setSuccessCount(addedCount);
    setExtractedItems([]);
    setCopiedInvoiceText("");
    setSelectedFileName("");
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = 
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ubicacion.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === "All" || item.categoria === filterCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-900">Almacén e Inventario de Autopartes</h2>
          <p className="text-xs text-slate-500">
            Monitoree el stock de componentes consumibles, filtre por estantería física y reabastesca líneas de lubricantes, filtros y frenos.
          </p>
        </div>

        {/* Create options only for managers / admin */}
        {userRole !== UserRole.Mecanico && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                if (showAiForm) setShowAiForm(false);
              }}
              className={`px-4 py-2.5 font-bold rounded-xl text-xs flex items-center space-x-2 shadow-sm transition-all cursor-pointer self-start md:self-auto ${
                showAddForm ? "bg-emerald-600 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>{showAddForm ? "Cerrar Formulario" : "Registrar Repuesto Manual"}</span>
            </button>

            <button
              onClick={() => {
                setShowAiForm(!showAiForm);
                if (showAddForm) setShowAddForm(false);
              }}
              className={`px-4 py-2.5 font-bold rounded-xl text-xs flex items-center space-x-2 shadow-sm transition-all cursor-pointer border self-start md:self-auto ${
                showAiForm 
                  ? "bg-orange-600 border-orange-600 text-white" 
                  : "bg-white border-2 border-dashed border-orange-350 hover:border-orange-500 hover:bg-orange-50/40 text-orange-600 animate-pulse hover:animate-none"
              }`}
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Cargar Factura Electrónica (IA)</span>
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreatePart} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md space-y-4">
              <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100 font-display">
                <Package className="h-5 w-5 text-emerald-500" />
                <h3 className="font-bold text-slate-900 text-base">Registrar Nuevo Ítem en Catálogo</h3>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Código Inventario *</label>
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Ej. FILT-AC-XT"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs font-bold font-mono tracking-widest uppercase"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Nombre Descriptor *</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Filtro de Aceite Sintético de Alta Duración"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Categoría *</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-3 focus:outline-none focus:border-emerald-500 focus:bg-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <option value="Lubricantes">Lubricantes</option>
                    <option value="Filtros">Filtros</option>
                    <option value="Frenos">Frenos</option>
                    <option value="Encendido">Encendido</option>
                    <option value="Suspensión">Suspresión</option>
                    <option value="Líquidos">Líquidos / Refrigerantes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Stock Inicial *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 focus:outline-none focus:bg-white text-xs font-bold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Stock de Reserva Mínimo *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 focus:outline-none focus:bg-white text-xs font-bold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Precio de Venta ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 focus:outline-none focus:bg-white text-xs font-bold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Ubicación Física *</label>
                  <input
                    type="text"
                    required
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    placeholder="Ej. Estantería F-3"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 border-slate-200 focus:outline-none focus:bg-white text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  Confirmar Ingreso Bodega
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showAiForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-gradient-to-br from-white to-orange-50/20 p-6 rounded-2xl border border-orange-200/50 shadow-md space-y-5">
              <div className="flex items-center space-x-2 pb-2.5 border-b border-orange-100 font-display">
                <Sparkles className="h-5 w-5 text-orange-500 animate-pulse" />
                <h3 className="font-bold text-slate-900 text-base">Carga de Inventario Inteligente (Factura Electrónica)</h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                Cargue o pegue el contenido de una factura electrónica (formato de texto plano, RIDE de Ecuador, archivo XML o copia directa de PDF). Nuestro motor de <strong>Inteligencia Artificial (Gemini)</strong> extraerá detalladamente los repuestos, cantidades y costes para su registro automático.
              </p>

              {analysisError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 flex items-start space-x-2.5">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{analysisError}</span>
                </div>
              )}

              {successCount !== null && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-start space-x-2.5 font-sans">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block text-emerald-950">¡Carga Masiva Exitosa!</strong>
                    <span>Se han registrado automáticamente <strong className="font-extrabold text-emerald-900">{successCount} repuestos nuevos</strong> en el catálogo de CQ Motors.</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                {/* File picker */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center space-x-1">
                    <Upload className="h-3 w-3 text-slate-505" />
                    <span>Cargar archivo de Factura (XML / TXT / PDF extraído)</span>
                  </label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-orange-400 bg-slate-50/50 rounded-xl p-4 transition-all flex flex-col items-center justify-center text-center cursor-pointer relative min-h-[120px]">
                    <input 
                      type="file" 
                      accept=".xml,.txt,.json,.csv"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                    <FileText className="h-8 w-8 text-orange-400 mb-1.5" />
                    <span className="text-xs font-bold text-slate-700 block">
                      {selectedFileName ? selectedFileName : "Seleccionar Factura Electrónica"}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {selectedFileName ? "Click para cambiar de archivo" : "Arrastre el archivo XML/TXT del SRI o haga click"}
                    </span>
                  </div>
                </div>

                {/* Plain Text Box */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase">O Pegar Texto de Factura / XML Crudo</label>
                  <textarea
                    rows={4}
                    value={copiedInvoiceText}
                    onChange={(e) => {
                      setCopiedInvoiceText(e.target.value);
                      if (selectedFileName) setSelectedFileName("");
                    }}
                    placeholder="Pegue aquí el XML crudo que genera el sistema de facturación o el texto copiado de su PDF RIDE..."
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 focus:outline-none focus:border-orange-500 rounded-xl text-xs font-mono font-medium focus:bg-white placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Action trigger button */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 font-sans">
                <span className="text-[10px] text-slate-400 font-mono">Generado por Gemini 2.5 Flash API</span>
                <div className="flex items-center space-x-2.5">
                  {copiedInvoiceText && (
                    <button
                      type="button"
                      onClick={() => {
                        setCopiedInvoiceText("");
                        setSelectedFileName("");
                        setExtractedItems([]);
                      }}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-500 hover:bg-slate-50 cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isAnalyzing || !copiedInvoiceText.trim()}
                    onClick={handleProcessInvoice}
                    className="px-5 py-2.5 bg-orange-650 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Cerebro de IA Analizando Factura...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-orange-200" />
                        <span>Comenzar Análisis Técnico con IA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Extracted results table inside uploader UI */}
              {extractedItems.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-4 border-t border-orange-100 font-sans space-y-4"
                >
                  <div className="flex items-center justify-between pb-1.5">
                    <div>
                      <span className="text-xs font-bold text-orange-950 block">Análisis Completado con Éxito</span>
                      <span className="text-[10px] text-slate-500">Se identificaron de forma estructurada <strong>{extractedItems.length} componentes</strong> compatibles. Por favor, revíselos y confirme su ingreso.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleBulkRegister}
                      className="px-4.5 py-2 bg-emerald-650 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs transition-colors shadow-md shadow-emerald-500/10 cursor-pointer flex items-center space-x-1.5 shrink-0 animate-bounce"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Confirmar e Registrar en Bodega ({extractedItems.length})</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs bg-white">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase font-mono border-b border-slate-200">
                        <tr>
                          <th className="px-3.5 py-2.5">Código SRI</th>
                          <th className="px-3.5 py-2.5">Componente / Repuesto</th>
                          <th className="px-3.5 py-2.5">Cantidad</th>
                          <th className="px-3.5 py-2.5">P.V.P Sugerido</th>
                          <th className="px-3.5 py-2.5">Categoría</th>
                          <th className="px-3.5 py-2.5">Ubicación Asignada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {extractedItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 text-slate-800">
                            <td className="px-3.5 py-2 font-mono text-[10.5px] text-orange-600 font-bold">{item.codigo}</td>
                            <td className="px-3.5 py-2 text-[11px] font-bold">{item.nombre}</td>
                            <td className="px-3.5 py-2 font-mono text-slate-600">{item.cantidad} u</td>
                            <td className="px-3.5 py-2 font-mono text-emerald-700 font-bold">${Number(item.precioVenta || 0).toFixed(2)}</td>
                            <td className="px-3.5 py-2 text-slate-550">
                              <span className="bg-slate-100 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-200/50 font-bold uppercase">{item.categoria}</span>
                            </td>
                            <td className="px-3.5 py-2 text-[11px] italic text-slate-500">{item.ubicacion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ⚠️ BANNER DE ALERTA DE STOCK Y ENLACE DE PEDIDO AUTOMATIZADO A PROVEEDORES (5th of 8 improvements) */}
      {criticalItemsList.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md font-sans">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-rose-400 font-mono">
                Alerta de Surtido Crítico
              </span>
              <h4 className="text-xs font-bold text-white mt-0.5">
                Hay {criticalItemsList.length} repuestos por debajo del mínimo en perchas de taller
              </h4>
              <p className="text-[11px] text-slate-400">
                Se requiere canalizar cotización de compras para restaurar stock operacional.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPurchaseOrders(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer flex items-center space-x-2 shrink-0 self-start sm:self-auto uppercase tracking-wide"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Generar Orden Automatizada</span>
          </button>
        </div>
      )}

      {/* MODAL DE COMPILACIÓN DE ÓRDENES DE PEDIDO AUTOMATIZADAS (5th of 8 improvements) */}
      <AnimatePresence>
        {showPurchaseOrders && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-slate-200/60 shadow-2xl max-w-2xl w-full p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 font-sans">
                <div className="flex items-center space-x-2">
                  <Package className="h-5.5 w-5.5 text-emerald-500" />
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 text-base leading-tight">Consolidado Autónomo de Reabastecimiento</h3>
                    <p className="text-[11px] text-slate-500">Compilado inteligente de repuestos faltantes agrupados por lineamiento logístico</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPurchaseOrders(false)}
                  className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-bold cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {purchaseStatus === "success" ? (
                <div className="p-8 text-center space-y-3.5 font-sans">
                  <div className="inline-flex p-4 bg-emerald-50 rounded-full text-emerald-555 border border-emerald-100 animate-bounce">
                    <CheckCircle className="h-10 w-10 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">¡Órdenes Generadas Correctamente!</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Se han generado y enviado las cotizaciones de pedido electrónico automáticamente a los distribuidores autorizados en Guayaquil y Quito. El inventario ha sido reabastecido para simular la confirmación de la carga.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-xs text-slate-600 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 font-sans leading-relaxed">
                    <strong>Automatización ERP:</strong> Se calcula la cantidad de pedido idónea para cada ítem crítico utilizando la fórmula de lote económico: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-900">Q = (Mínimo * 3) - Stock Actual</code>. Puede ajustar las unidades de reposición manualmente en los encasillados antes de transmitir la orden.
                  </div>

                  <div className="max-h-[280px] overflow-y-auto space-y-3 pr-1">
                    {criticalItemsList.map((item) => {
                      const calculatedQty = item.stockMinimo * 3 - item.stock;
                      const userQty = customOrderAmounts[item.id] !== undefined ? customOrderAmounts[item.id] : calculatedQty;
                      const estimatedUnitCost = item.costoCompra || (item.precioVenta * 0.55); // Use actual purchase cost or fallback to 55% estimation
                      const totalCost = userQty * estimatedUnitCost;

                      return (
                        <div key={item.id} className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 font-sans hover:bg-slate-50 transition-colors">
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <span className="font-mono text-[9px] font-bold text-emerald-600 bg-emerald-50/50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase">{item.codigo}</span>
                            <span className="font-bold text-xs text-slate-900 block truncate max-w-[280px] mt-1">{item.nombre}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Percha: {item.stock} u | Min Recom: {item.stockMinimo} u</span>
                          </div>

                          <div className="flex items-center space-x-4 shrink-0">
                            <div className="text-right">
                              <span className="text-[9px] text-slate-400 block uppercase font-mono">Costo Lote Est.</span>
                              <span className="font-bold text-xs text-slate-900 font-mono">${totalCost.toFixed(2)}</span>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[8px] text-slate-400 block font-mono uppercase text-right">Cant. Pedir</span>
                              <input
                                type="number"
                                min="1"
                                value={userQty}
                                onChange={(e) => {
                                  const val = Math.max(1, Number(e.target.value));
                                  setCustomOrderAmounts(prev => ({ ...prev, [item.id]: val }));
                                }}
                                className="w-16 px-2 py-1 border bg-white rounded-lg text-center text-xs font-bold font-mono text-slate-950 focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between font-mono text-[10.5px]">
                    <div className="text-slate-500">
                      Total Lotes Solicitados: <strong className="font-bold text-slate-900">{criticalItemsList.length} ítems</strong>
                    </div>
                    <div className="text-slate-850">
                      Costo Fob Total Previsto: <strong className="font-bold text-emerald-700 font-mono">
                        ${criticalItemsList.reduce((sum, item) => {
                          const calculatedQty = item.stockMinimo * 3 - item.stock;
                          const userQty = customOrderAmounts[item.id] !== undefined ? customOrderAmounts[item.id] : calculatedQty;
                          return sum + (userQty * (item.costoCompra || (item.precioVenta * 0.55)));
                        }, 0).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-2 font-sans">
                    <button
                      type="button"
                      disabled={purchaseStatus === "sending"}
                      onClick={() => setShowPurchaseOrders(false)}
                      className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={purchaseStatus === "sending"}
                      onClick={handleTriggerAutoPurchase}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      {purchaseStatus === "sending" ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Procesando ERP de Compras...</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 shrink-0 hover:animate-bounce" />
                          <span>Transmitir Pedido Electrónico</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Search and Filters panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/75 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por código de barra, descripción del repuesto o armario..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-450 focus:outline-none focus:border-emerald-500 focus:bg-white text-xs font-medium transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 bg-slate-100 px-3.5 py-1.5 rounded-lg border border-slate-200/50 shrink-0">
          <Grid className="h-4 w-4 text-slate-500" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="All">Todos los Rubros</option>
            {distinctCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Spare parts with visual alert levels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredInventory.map((item) => {
          const isLowStock = item.stock <= item.stockMinimo;

          return (
            <div 
              key={item.id}
              className={`bg-white rounded-2xl border p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all ${
                isLowStock ? "border-rose-200 shadow-sm shadow-rose-50/20" : "border-slate-200/70 shadow-sm"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  {/* Category badge */}
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded border border-slate-200/50 uppercase tracking-widest font-mono">
                    {item.categoria}
                  </span>
                  
                  {/* Stock flag */}
                  {isLowStock ? (
                    <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 border border-red-100">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>Stock Crítico</span>
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100">
                      Suficiente
                    </span>
                  )}
                </div>

                <div>
                  <span className="font-mono text-[10px] text-slate-400 block tracking-wider uppercase">
                    Cód: {item.codigo}
                  </span>
                  <h4 className="font-semibold text-sm text-slate-900 mt-0.5 leading-snug">
                    {item.nombre}
                  </h4>
                </div>

                {/* Stock Gauges */}
                <div className="space-y-1.5 pt-1.5 font-sans">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Unidades en Percha:</span>
                    <span className={`font-mono font-bold ${isLowStock ? "text-red-600 text-sm" : "text-slate-900"}`}>
                      {item.stock} unidades
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${isLowStock ? "bg-red-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min((item.stock / (item.stockMinimo * 3)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Reserva mínima recomendada: <strong className="font-bold text-slate-600">{item.stockMinimo} unidades</strong>
                  </span>
                </div>
              </div>

              {/* Price and restock trigger */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 font-semibold uppercase block">Precio Público</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    ${item.precioVenta.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] text-slate-500 font-mono flex items-center space-x-1 px-2 py-1 bg-slate-50 border border-slate-150 rounded" title="Ubicación física en taller">
                    <Navigation className="h-3 w-3 text-slate-400" />
                    <span>{item.ubicacion}</span>
                  </span>

                  <button
                    onClick={() => handleOpenRestockModal(item)}
                    className="p-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md"
                    title="Abastecer stock (Promedio Ponderado)"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>

                  {onDeletePart && userRole !== UserRole.Cliente && (
                    <button
                      onClick={() => {
                        if (confirm(`¿Está seguro que desea eliminar "${item.nombre}" del inventario?`)) {
                          onDeletePart(item.id);
                        }
                      }}
                      className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 rounded-xl transition-all cursor-pointer shadow-sm"
                      title="Eliminar del inventario"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE ABASTECIMIENTO DE BODEGA CON PROMEDIO PONDERADO */}
      <AnimatePresence>
        {selectedRestockItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden text-left"
            >
              {/* Header */}
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg">Abastecimiento de Bodega</h3>
                  <p className="text-[11px] text-slate-300">Método de Valoración de Inventario: Promedio Ponderado</p>
                </div>
                <button 
                  onClick={() => setSelectedRestockItem(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span className="font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded uppercase">
                      {selectedRestockItem.codigo}
                    </span>
                    <span>{selectedRestockItem.categoria}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">{selectedRestockItem.nombre}</h4>
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs border-t border-slate-200 text-slate-600">
                    <div>Stock Actual: <strong className="text-slate-900 font-bold">{selectedRestockItem.stock} u</strong></div>
                    <div>Costo Actual: <strong className="text-slate-900 font-bold">${(selectedRestockItem.costoCompra || 0).toFixed(2)}</strong></div>
                  </div>
                </div>

                {/* Inputs */}
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Cantidad Recibida (Unidades) <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="number"
                      min={1}
                      value={restockQty}
                      onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Costo de Adquisición Unitario ($) <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={restockCost}
                      onChange={(e) => setRestockCost(Math.max(0.01, parseFloat(e.target.value) || 0))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Valuation Projection Calculation Card */}
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-2">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Cálculo del Promedio Ponderado</span>
                  
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Valor de Inventario Existente:</span>
                      <span className="font-mono">${((selectedRestockItem.stock) * (selectedRestockItem.costoCompra || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor de Nueva Recepción:</span>
                      <span className="font-mono">${(restockQty * restockCost).toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-emerald-100 my-1" />
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>Nuevo Stock Total:</span>
                      <span className="font-mono">{selectedRestockItem.stock + restockQty} unidades</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-950 text-sm">
                      <span>Nuevo Costo Promedio Ponderado:</span>
                      <span className="font-mono">
                        ${(((selectedRestockItem.stock * (selectedRestockItem.costoCompra || 0)) + (restockQty * restockCost)) / (selectedRestockItem.stock + restockQty)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedRestockItem(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRestockItem(selectedRestockItem.id, restockQty, restockCost);
                    setSelectedRestockItem(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-colors"
                >
                  Confirmar e Ingresar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
