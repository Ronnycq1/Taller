import { Vehiculo, Mantenimiento, RepuestoInventario } from "../types";

/**
 * Interface detailing the full predictive CRM analysis returned by the algorithm.
 */
export interface PredictiveAnalysis {
  estimatedCurrentKm: number;
  kmPerDay: number;
  nextServiceDateStr: string;
  recommendedService: string;
  daysRemaining: number;
  timeRemainingDays: number;
  mileageRemainingKm: number;
  triggerType: "Kilometraje" | "Tiempo" | "Inmediato";
  confidence: "Alta-Estable" | "Media-Ajustada" | "Baja-Estimada";
  alertState: "normal" | "warning" | "urgent";
  diagnosticChecklist: string[];
  vehicleAgeYears: number;
  drivingProfileDesc: string;
}

/**
 * PATH CLEAN helper to prevent normalization issues when mapping names.
 */
function cleanText(text: string): string {
  return text?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() || "";
}

/**
 * Calculates predictive odometer mileage and estimated next service calendar date.
 * Incorporates:
 * 1. Odometer progression based on typical regional averages.
 * 2. Multi-point calendar history regression if multiple maintenances are present.
 * 3. 5,000 Km OR 6-Month (180 days) dual-trigger rule.
 * 4. Prediction confidence grading.
 * 5. Dynamic list of targeted machine checkpoints.
 */
export function calculatePredictiveCRM(
  vehicle: Vehiculo,
  maintenances: Mantenimiento[]
): PredictiveAnalysis {
  const now = new Date();
  const dateIngreso = new Date(vehicle.fechaIngreso);
  const vehicleAgeYears = Math.max(0, now.getFullYear() - vehicle.anio);
  
  // Sort previous maintenance sessions chronologically
  const sortedHistory = [...maintenances].sort(
    (a, b) => new Date(a.fechaRegistro).getTime() - new Date(b.fechaRegistro).getTime()
  );

  const isTrabajo = vehicle.tipoUso === "Trabajo";

  // 1. DYNAMIC KM PER DAY ESTIMATION (Driving multiplier profiles)
  let kmPerDay = isTrabajo ? 135.5 : 41.1; // Default average (approx 15,000 km/year for normal, 50,000 km/year for work)
  let confidence: "Alta-Estable" | "Media-Ajustada" | "Baja-Estimada" = "Baja-Estimada";
  let drivingProfileDesc = isTrabajo 
    ? "Uso intensivo comercial (Vehículo de Trabajo)" 
    : "Uso promedio general (Ecuador)";

  // Substring categories of vehicle models for baseline daily rates
  const brand = cleanText(vehicle.marca);
  const model = cleanText(vehicle.modelo);
  
  if (!isTrabajo) {
    if ((brand.includes("toyota") && model.includes("hilux")) || model.includes("dmax") || model.includes("fortuner")) {
      kmPerDay = 48.5; // Heavy-duty pickup / SUV usage
      drivingProfileDesc = "Trabajo pesado / Extrapolación de carga";
    } else if ((brand.includes("kia") && model.includes("picanto")) || model.includes("aveo") || model.includes("spark") || model.includes("rio")) {
      kmPerDay = 35.8; // Compact urban vehicles
      drivingProfileDesc = "Urbano utilitario / Desplazamiento local";
    }
  } else {
    // For work vehicles, let's have some models be even higher
    if ((brand.includes("toyota") && model.includes("hilux")) || model.includes("dmax") || brand.includes("hino")) {
      kmPerDay = 165.0; // Heavy-duty fleet work vehicle
      drivingProfileDesc = "Trabajo extremo / Carga comercial continua (Flota)";
    } else if ((brand.includes("kia") && model.includes("picanto")) || model.includes("soluto") || model.includes("rio")) {
      kmPerDay = 120.0; // Commercial taxi or courier urban vehicle
      drivingProfileDesc = "Taxi / Courier urbano intensivo de alta rotación";
    }
  }

  // Regression based on customer service calendars
  if (sortedHistory.length >= 2) {
    const minMaint = sortedHistory[0];
    const maxMaint = sortedHistory[sortedHistory.length - 1];
    
    const daysDelta = Math.max(1, Math.ceil(
      (new Date(maxMaint.fechaRegistro).getTime() - new Date(minMaint.fechaRegistro).getTime()) / 
      (1000 * 60 * 60 * 24)
    ));
    
    // In automotive practice, preventative services occur approximately every 5,000 Km.
    // Therefore, we can interpolate the distance spanned by the frequency of servicing.
    const approximateSpannedKm = 5000 * (sortedHistory.length - 1);
    
    if (daysDelta > 15) {
      if (isTrabajo) {
        kmPerDay = Math.min(350, Math.max(60, approximateSpannedKm / daysDelta));
        confidence = "Alta-Estable";
        drivingProfileDesc = "Cálculo empírico basado en visitas (Uso de Trabajo)";
      } else {
        kmPerDay = Math.min(180, Math.max(8, approximateSpannedKm / daysDelta));
        confidence = "Alta-Estable";
        drivingProfileDesc = "Cálculo empírico basado en frecuencia de visitas a taller";
      }
    } else {
      confidence = "Media-Ajustada";
    }
  } else if (sortedHistory.length === 1) {
    // 1 historic maintenance - compare against original vehicle ingress date
    const singleMaint = sortedHistory[0];
    const daysDelta = Math.max(1, Math.ceil(
      (new Date(singleMaint.fechaRegistro).getTime() - dateIngreso.getTime()) / 
      (1000 * 60 * 60 * 24)
    ));
    
    if (daysDelta > 10) {
      if (isTrabajo) {
        kmPerDay = Math.min(300, Math.max(50, 5000 / daysDelta));
        confidence = "Media-Ajustada";
        drivingProfileDesc = "Extrapolación inicial de uso comercial (Ficha Única)";
      } else {
        kmPerDay = Math.min(150, Math.max(10, 5000 / daysDelta));
        confidence = "Media-Ajustada";
        drivingProfileDesc = "Extrapolación de intervalo inicial (Ficha de patio única)";
      }
    }
  }

  // 2. REAL-TIME ODOMETER PREDICTION
  // Determine date of last completed service to start counting days
  const lastServiceDate = sortedHistory.length > 0 
    ? new Date(sortedHistory[sortedHistory.length - 1].fechaRegistro) 
    : dateIngreso;

  const daysSinceLastService = Math.max(0, Math.ceil(
    (now.getTime() - lastServiceDate.getTime()) / (1000 * 60 * 60 * 24)
  ));

  const daysSinceIngreso = Math.max(0, Math.ceil(
    (now.getTime() - dateIngreso.getTime()) / (1000 * 60 * 60 * 24)
  ));

  // Current predicted mileage on vehicle
  const estimatedCurrentKm = Math.round(vehicle.kilometraje + (daysSinceIngreso * kmPerDay));

  // 3. DUAL-TRIGGER ESTIMATOR (5,000 KM OR 180 DAYS / 6 MONTHS for Particular, 90 DAYS / 3 MONTHS for Trabajo)
  // Distance remaining to reach next 5,000 Km milestone
  const currentIntervalMilestone = 5000;
  const mileageRemainingKm = Math.max(0, currentIntervalMilestone - (daysSinceLastService * kmPerDay));
  const mileageDaysRemaining = Math.max(0, mileageRemainingKm / kmPerDay);

  // Calendar time remaining to hit limits (Trabajo has tighter 90 days limit due to intense work usage)
  const maxAllowedServiceDays = isTrabajo ? 90 : 180;
  const timeRemainingDays = maxAllowedServiceDays - daysSinceLastService;

  // Let's decide which threshold triggers the service recommendation first
  let daysRemaining = Math.round(Math.min(mileageDaysRemaining, timeRemainingDays));
  let triggerType: "Kilometraje" | "Tiempo" | "Inmediato" = "Kilometraje";

  if (timeRemainingDays < mileageDaysRemaining) {
    triggerType = "Tiempo";
  }

  if (daysRemaining <= 0) {
    daysRemaining = 0;
    triggerType = "Inmediato";
  }

  // 4. NEXT ESTIMATED SERVICE DATE
  const estimatedNextServiceDate = new Date();
  estimatedNextServiceDate.setDate(now.getDate() + (daysRemaining > 0 ? daysRemaining : 1));

  // 5. DIAGNOSTIC CHECKLIST GENERATOR & OUTSTANDING SUBROUTINES
  const diagnosticChecklist: string[] = [];

  if (isTrabajo) {
    diagnosticChecklist.push("Sustitución de Aceite de Alto Rendimiento (Heavy Duty) y Filtro Reforzado");
    diagnosticChecklist.push("Inspección de Viscosidad y Presión de Lubricación en Caliente");
    diagnosticChecklist.push("Revisión de Desgaste de Pastillas de Freno por Frenado Continuo");
    diagnosticChecklist.push("Alineación Completa de Dirección por Vibración de Trabajo");
  } else {
    diagnosticChecklist.push("Sustitución de Aceite Multigrado y Filtro Cartucho de Motor");
    diagnosticChecklist.push("Calibración de Presiones y Balanceo de Ejes Dinámico");
  }

  let recommendedService = isTrabajo ? "Cambio de Aceite de Taller Intensivo (Trabajo)" : "Mantenimiento Preventivo Básico";

  if (isTrabajo) {
    if (estimatedCurrentKm >= 80000) {
      diagnosticChecklist.push("Inspección Crítica de Transmisión / Corona de Carga (Esfuerzo Continuo)");
      diagnosticChecklist.push("Verificación de Kit de Embrague e Hidráulicos de Caja");
      recommendedService = "Mantenimiento Mayor de Flota";
    } else if (estimatedCurrentKm >= 40000) {
      diagnosticChecklist.push("Reemplazo de Bujías de Encendido de Alto Rendimiento Térmico");
      diagnosticChecklist.push("Verificación e Inspección de Suspensión de Carga (Espirales / Ballestas)");
      recommendedService = "Mantenimiento Preventivo de Trabajo Intermedio";
    } else if (estimatedCurrentKm >= 20000) {
      diagnosticChecklist.push("Limpieza Integral de Cuerpo de Aceleración y Sensores MAP/MAF");
      diagnosticChecklist.push("Rotación Cruzada y Medición de Banda de Rodadura");
      recommendedService = "Afinamiento y Lubricación de Tarea Pesada";
    }
  } else {
    if (estimatedCurrentKm >= 80000) {
      diagnosticChecklist.push("Revisión de Banda de Distribución de Motor (Prevención de Rotura)");
      diagnosticChecklist.push("Diagnóstico de Desgaste de Horquillas y Amortigüadores Hidráulicos");
      recommendedService = "Mantenimiento Correctivo Mayor";
    } else if (estimatedCurrentKm >= 40000) {
      diagnosticChecklist.push("Reemplazo de Bujías de Iridio / Cobre de Alto Rendimiento");
      diagnosticChecklist.push("Limpieza e Inspección Completa de Zapatas y Pastillas de Freno");
      recommendedService = "Mantenimiento Preventivo Intermedio Integral";
    } else if (estimatedCurrentKm >= 20000) {
      diagnosticChecklist.push("Limpieza de Cuerpo de Aceleración y Válvula IAC");
      diagnosticChecklist.push("Rotación Cruzada de Labrado de Neumáticos (Prevención Desgaste Alabeado)");
      recommendedService = "Ficha de Afinamiento y Rotaciones";
    } else {
      diagnosticChecklist.push("Inspección Visual de Fugas y Verificación de Niveles de Fluidos Básicos");
    }
  }

  // Vehicle Aging factors
  if (vehicleAgeYears > 10) {
    diagnosticChecklist.push("Verificación de Corrosión de Ductos de Freno y Líneas de Inyección");
    diagnosticChecklist.push("Evaluación de Diagnóstico de Gases / Sonda Lambda OBD2");
  }

  // 6. ALERT CLASSIFICATION
  let alertState: "normal" | "warning" | "urgent" = "normal";
  const limitUrgentDays = isTrabajo ? 100 : 200;
  if (daysRemaining <= 0 || daysSinceLastService >= limitUrgentDays) {
    alertState = "urgent";
  } else if (daysRemaining <= 15) {
    alertState = "warning";
  }

  return {
    estimatedCurrentKm,
    kmPerDay: Math.round(kmPerDay * 10) / 10,
    nextServiceDateStr: estimatedNextServiceDate.toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }),
    recommendedService,
    daysRemaining,
    timeRemainingDays,
    mileageRemainingKm: Math.round(mileageRemainingKm),
    triggerType,
    confidence,
    alertState,
    diagnosticChecklist,
    vehicleAgeYears,
    drivingProfileDesc
  };
}

/**
 * Associates specific inventory categories and parts according to vehicle make/marca and model.
 * Matches substrings to recommend fast addition during worksheet audits.
 */
export function getSmartPartsForVehicle(
  marca: string,
  modelo: string,
  inventory: RepuestoInventario[]
): RepuestoInventario[] {
  const brandLower = cleanText(marca);
  const modelLower = cleanText(modelo);
  
  // Define custom recommendation algorithms based on brand/model text mapping matches
  if (brandLower.includes("toyota") || modelLower.includes("hilux") || modelLower.includes("fortuner")) {
    return inventory.filter(i => 
      cleanText(i.nombre).includes("toyota") || 
      cleanText(i.nombre).includes("aceite") || 
      cleanText(i.nombre).includes("filtro") ||
      i.categoria === "Frenos" || 
      i.categoria === "Lubricantes"
    ).slice(0, 4);
  }
  
  if (brandLower.includes("kia") || modelLower.includes("sportage") || modelLower.includes("rio") || modelLower.includes("picanto")) {
    return inventory.filter(i => 
      cleanText(i.nombre).includes("kia") || 
      cleanText(i.nombre).includes("filtro") ||
      cleanText(i.nombre).includes("aceite") ||
      i.categoria === "Lubricantes" ||
      i.categoria === "Encendido"
    ).slice(0, 4);
  }

  if (brandLower.includes("chevrolet") || modelLower.includes("dmax") || modelLower.includes("aveo") || modelLower.includes("sail")) {
    return inventory.filter(i => 
      cleanText(i.nombre).includes("chevrolet") || 
      cleanText(i.nombre).includes("dmax") ||
      cleanText(i.nombre).includes("bujia") ||
      cleanText(i.nombre).includes("aceite") ||
      i.categoria === "Lubricantes"
    ).slice(0, 4);
  }
  
  // Custom rule for Suzuki / Hyundai
  if (brandLower.includes("suzuki") || brandLower.includes("hyundai") || modelLower.includes("tucson") || modelLower.includes("grand vitara")) {
    return inventory.filter(i => 
      cleanText(i.nombre).includes("suzuki") || 
      cleanText(i.nombre).includes("hyundai") || 
      cleanText(i.nombre).includes("filtro") ||
      i.categoria === "Lubricantes" ||
      i.categoria === "Filtros"
    ).slice(0, 4);
  }
  
  // Global generic fallback recommendations
  return inventory.filter(i => 
    i.categoria === "Lubricantes" || 
    i.categoria === "Filtros" ||
    cleanText(i.nombre).includes("filtro") ||
    cleanText(i.nombre).includes("aceite")
  ).slice(0, 4);
}
