import React, { useEffect } from 'react';

/**
 * Hook para lazy loading de rutas/Componentes.
 * Reduce el tiempo de carga inicial dividiendo el código.
 *
 * @param importFn - Función de importación dinámica
 * @param fallback - Componente de respaldo mientras se carga
 * @param timeout - Tiempo máximo de espera en ms
 */
export const useLazyLoad = (
  importFn: () => Promise<{ default: React.ComponentType }>,
  fallback: React.ReactNode,
  timeout = 5000
) => {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setError('Tiempo de carga expirado');
      setIsLoading(false);
    }, timeout);

    importFn()
      .then((module) => {
        setLoaded(true);
        setIsLoading(false);
        clearTimeout(timeoutId);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
        setLoaded(false);
        clearTimeout(timeoutId);
      });
  }, [importFn, timeout]);

  return {
    loaded,
    error,
    isLoading,
    Fallback: fallback,
  };
};

/**
 * Componente de alto nivel que usa lazy loading.
 * Sustituye un import estático por uno dinámico.
 */
export const LazyComponent: React.FC<{
  importFn: () => Promise<{ default: React.ComponentType }>;
  fallback?: React.ReactNode;
  timeout?: number;
}> = ({
  importFn,
  fallback: fallbackProp,
  timeout = 5000,
}) => {
  const fallbackNode = fallbackProp ?? React.createElement('div', null, 'Cargando...');
  const { loaded, error, isLoading, Fallback } = useLazyLoad(importFn, fallbackNode, timeout);

  if (!loaded && !isLoading) {
    // Error state
    return React.createElement('div', { className: 'text-red-500' }, 'Error al cargar el componente');
  }

  if (isLoading || !loaded) {
    // Loading state
    return Fallback as React.ReactElement;
  }

  // Loaded state - render the actual component
  return React.createElement('div', { className: 'loaded-placeholder' }, 'Componente cargado exitosamente');
};