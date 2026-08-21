import React, { useEffect, useState } from 'react';

/** Genera un reporte de performance después de la carga inicial */
export const usePerformanceReport = () => {
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const report: any = {

      // Métricas de tiempo de carga
      domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
      loadEvent: performance.timing.loadEventEnd - performance.timing.navigationStart,

      // Métricas de interacción
      firstContentfulPaint: (performance.getEntriesByName('first-contentful-paint')[0] as any)?.duration || 0,
      largestContentfulPaint: (performance.getEntriesByName('largest-contentful-paint')[0] as any)?.duration || 0,
      firstInputDelay: (performance.getEntriesByName('first-input')[0] as any)?.duration || 0,

      // Métricas de recursos
      totalResources: performance.getEntriesByType('resource').length,
      jsResources: performance.getEntriesByType('resource').filter((r: any) => r.type === 'script').length,
      cssResources: performance.getEntriesByType('resource').filter((r: any) => r.type === 'style').length,

      // Información del navegador
      userAgent: navigator.userAgent,
      platform: navigator.platform,

      // Marca de tiempo
      timestamp: new Date().toISOString(),
    };

    setReport(report);
  }, []);

  return report;
};

/** Componente que muestra el reporte de performance */
export const PerformanceReport: React.FC = () => {
  const report = usePerformanceReport();

  if (!report) {
    return null;
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="fixed bottom-0 left-0 m-4 z-50 bg-slate-950/90 backdrop-blur-xl p-4 rounded-xl border border-slate-700/50 text-sm max-w-xs">
      <h4 className="text-xs font-medium text-slate-200 mb-2">📈 Performance Report</h4>
      <div className="space-y-2 text-xs text-slate-300">
        <div>
          <span className="font-medium">FCP:</span> {Math.round(report.firstContentfulPaint)}ms
        </div>
        <div>
          <span className="font-medium">LCP:</span> {Math.round(report.largestContentfulPaint)}ms
        </div>
        <div>
          <span className="font-medium">FID:</span> {Math.round(report.firstInputDelay)}ms
        </div>
        <div>
          <span className="font-medium">Recursos:</span> ${report.totalResources} total (${report.jsResources} JS, ${report.cssResources} CSS)
        </div>
        <div>
          <span className="font-medium">JS Heap:</span> ${report.heapSize ? formatBytes(report.heapSize) : 'N/A'}
        </div>
        <div>
          <span className="font-medium">Navegador:</span> {report.platform} - {report.userAgent.split(' ')[0]}
        </div>
        <div>
          <span className="font-medium">Carga:</span> {report.domContentLoaded}ms (DOM) / ${report.loadEvent}ms (load)
        </div>
      </div>
    </div>
  );
};