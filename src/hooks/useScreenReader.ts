import { useEffect, useState } from 'react';

/**
 * Hook para detectar si el usuario está usando un lector de pantalla.
 * Utiliza la API de prefers-reduced-motion y detección de ARIA live regions.
 */
export const useScreenReader = () => {
  const [isScreenReader, setIsScreenReader] = useState(false);

  useEffect(() => {
    // Detectar características de tecnologías asistivas
    const nonVisual = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isReducedMotion = nonVisual.matches;

    // Verificar si hay live regions activas (indicador de screen reader)
    const liveRegions = document.querySelectorAll('[aria-live]');
    const hasLiveRegions = liveRegions.length > 0;

    // Lógica heurística: si hay múltiples live regions o reduced motion preferente
    const detected = hasLiveRegions || isReducedMotion;

    setIsScreenReader(detected);
  }, []);

  return isScreenReader;
};

/**
 * Hook para manejar la anunciación de cambios importantes
 * a lectores de pantalla en tiempo real.
 */
export const useScreenReaderAnnounce = () => {
  const [announce, setAnnounce] = useState('');

  useEffect(() => {
    if (!announce) return;

    const liveRegion = document.querySelector('[aria-live="polite"]');
    if (liveRegion) {
      liveRegion.textContent = announce;
    }

    // Limpiar después de un corto retraso
    const timeout = setTimeout(() => {
      setAnnounce('');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [announce]);

  const announceToScreenReader = (message: string) => {
    setAnnounce(message);
  };

  return { announceToScreenReader };
};

/**
 * Hook para gestionar el order de tab focus en componentes complejos
 */
export const useFocusOrder = (items: string[]) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const previous = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const first = () => setCurrentIndex(0);
  const last = () => setCurrentIndex(items.length - 1);

  return {
    currentIndex,
    focusNext: () => {
      next();
      const element = document.getElementById(items[currentIndex]);
      if (element) element.focus();
    },
    focusPrevious: () => {
      previous();
      const element = document.getElementById(items[currentIndex]);
      if (element) element.focus();
    },
  };
};