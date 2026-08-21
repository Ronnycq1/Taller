import React, { useEffect, useState } from 'react';

/** Componente de métricas de performance en tiempo real */
export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    memoryUsage: 0,
    fps: 0,
    networkInfo: 'Desconocido',
  });

  useEffect(() => {
    // Medir tiempo de carga de la página
    const navigationEntries = performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
      setMetrics((prev) => ({
        ...prev,
        loadTime: Math.round(navEntry.duration || (navEntry.loadEventStart - navEntry.startTime)),
      }));
    }

    // Monitoreo de memoria
    const checkMemory = () => {
      const perfMemory = (performance as any).memory;
      if (perfMemory) {
        const usedMem = Math.round(perfMemory.usedJSHeapSize / 1024 / 1024);
        setMetrics((prev) => ({
          ...prev,
          memoryUsage: usedMem,
        }));
      }
    };
    checkMemory();
    const memoryInterval = setInterval(checkMemory, 5000);

    // Monitoreo de FPS
    let frameCount = 0;
    let lastTime = performance.now();
    const fpsInterval = setInterval(() => {
      const now = performance.now();
      const delta = now - lastTime;
      if (delta >= 1000) {
        const fps = Math.round((frameCount * 1000) / delta);
        setMetrics((prev) => ({ ...prev, fps }));
        frameCount = 0;
        lastTime = now;
      }
      frameCount++;
    }, 1000);

    // Información de red
    const connection = (navigator as any).connection;
    if (connection) {
      setMetrics((prev) => ({
        ...prev,
        networkInfo: `${connection.effectiveType || 'online'} / ${connection.downlink || 'N/A'} Mbps`,
      }));
    }

    return () => {
      clearInterval(memoryInterval);
      clearInterval(fpsInterval);
    };
  }, []);

  // Formateo de tiempo de carga
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(1)} s`;
  };

  return (
    <div className="performance-monitor fixed top-0 right-0 m-4 z-50 bg-slate-950/80 backdrop-blur-xl p-4 rounded-xl border border-slate-700/50 text-sm shadow-2xl">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">⚡</span>
        <span className="font-medium text-slate-100">T: {formatTime(metrics.loadTime)}</span>
        <span className="mx-2 text-xs text-slate-400">|</span>
        <span className="text-xs text-slate-400">M: {metrics.memoryUsage}MB</span>
        <span className="mx-2 text-xs text-slate-400">|</span>
        <span className="text-xs text-slate-400">F: {metrics.fps} FPS</span>
        <span className="text-xs text-slate-400">/</span>
        <span className="text-xs text-slate-400">{metrics.networkInfo}</span>
      </div>
    </div>
  );
};
