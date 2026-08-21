import React from 'react';
import { useFocusTrap } from './AccessibleModal';

/**
 * Botón accesible con características WCAG 2.1.
 * Proporciona etiquetas ARIA adecuadas, manejador de focus y estados deshabilitados.
 */
export const AccessibleButton: React.FC<{
  /** Texto visible del botón */
  children: React.ReactNode;
  /** Etiqueta aria-label (si los niños no son texto descriptivo) */
  'aria-label'?: string;
  /** Descripción adicional para lectores de pantalla */
  'aria-describedby'?: string;
  /** Estilo visual: primary, secondary, danger, link */
  variant?: 'primary' | 'secondary' | 'danger' | 'link';
  /** Si el botón está deshabilitado */
  disabled?: boolean;
  /** Función al hacer clic */
  onClick: () => void;
  /** Título/tooltip para sighted users */
  title?: string;
  /** Clase CSS adicional */
  className?: string;
}> = ({
  children,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  variant = 'primary',
  disabled = false,
  onClick,
  title,
  className,
}) => {
  // Determinar aria-label del prop o del texto del niño
  const effectiveAriaLabel = ariaLabel || children?.toString().substring(0, 50) || 'Botón';

  // Clases variantes
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    link: 'underline-offset-4 hover:underline text-primary underline-blue-600',
  };

  // Estados de disabled
  const isDisabled = disabled || variant === 'link' ? false : disabled;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={
        `inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${
          variantClasses[variant as keyof typeof variantClasses] || variantClasses.primary
        } ${className || ''}`
      }
      aria-label={effectiveAriaLabel}
      aria-describedby={ariaDescribedby}
      title={title}
    >
      {children}
      {/* SVG spinner para estado loading (si se necesita) */}
      {/* <span className="sr-only" aria-live="polite">Cargando...</span> */}
    </button>
  );
};

/**
 * Hook para habilitar/deshabilitar botón basado en estado del formulario
 */
export const useButtonState = (
  formValid: boolean,
  disabledCondition: boolean = false
) => {
  const [isDisabled, setIsDisabled] = React.useState(
    disabledCondition || !formValid
  );

  const toggleDisabled = (formValid: boolean) => {
    setIsDisabled(formValid ? false : true);
  };

  return { isDisabled, toggleDisabled };
};