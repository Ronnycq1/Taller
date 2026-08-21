import React, { useEffect, useRef } from 'react';

/**
 * Hook de focus trap para modales accesibles.
 * Garantiza que el focus quede dentro del modal cuando esté abierto.
 * WCAG 2.1: Success Criterion 2.1.1 Keyboard
 */
export const useFocusTrap = (
  elementRef: React.RefObject<HTMLDivElement | null>,
  options: {
    /** Si es true, el focus se restablece al primer elemento enfocable al abrir */
    resetOnOpen?: boolean;
    /** Si es true, el focus se devuelve al elemento que lo abrió al cerrar */
    returnFocusOnClose?: boolean;
    /** Elemento que tenía el focus antes de abrir el modal */
    initialFocus?: HTMLElement;
  } = {}
) => {
  const { resetOnOpen = true, returnFocusOnClose = true, initialFocus } = options;
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const focusedElement = document.activeElement;
    
    // Guardar el elemento que tenía focus antes
    if (resetOnOpen && !previouslyFocusedRef.current) {
      previouslyFocusedRef.current = focusedElement as HTMLElement;
    }

    // Si hay un initialFocus, usarlo en lugar de buscar los primeros/últimos
    if (initialFocus) {
      firstFocusableRef.current = initialFocus;
      lastFocusableRef.current = initialFocus;
    }

    const tabbableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[contenteditable="true"]',
      '[tabindex]:not([tabindex="-1"])',
    ];

    const getTabbableElements = (): HTMLElement[] => {
      const allElements = Array.from(element.querySelectorAll(tabbableSelectors.join(', '))) as HTMLElement[];
      return allElements.filter(
        (el) => el.offsetParent !== null && !el.hasAttribute('data-disabled')
      );
    };

    const focusableElements = getTabbableElements();
    firstFocusableRef.current = focusableElements[0] || null;
    lastFocusableRef.current = focusableElements[focusableElements.length - 1] || null;

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      if (event.shiftKey) {
        // Shift + Tab: ir al último elemento enfocable
        if (event.target === firstFocusableRef.current) {
          event.preventDefault();
          lastFocusableRef.current?.focus({ preventScroll: true });
        }
      } else {
        // Tab: ir al primer elemento enfocable
        if (event.target === lastFocusableRef.current) {
          event.preventDefault();
          firstFocusableRef.current?.focus({ preventScroll: true });
        }
      }
    };

    element.addEventListener('keydown', handleKeydown);

    // Mover focus al primer elemento enfocable al abrir
    if (resetOnOpen && focusableElements.length > 0) {
      requestAnimationFrame(() => {
        firstFocusableRef.current?.focus({ preventScroll: true });
      });
    }

    return () => {
      element.removeEventListener('keydown', handleKeydown);
    };
  }, [elementRef, resetOnOpen, returnFocusOnClose, initialFocus]);

  return { previouslyFocusedRef, firstFocusableRef, lastFocusableRef };
};

/**
 * Componente de alto nivel para modales accesibles.
 * Maneja el focus trap y la gestión de apertura/cerrado.
 */
export const AccessibleModal: React.FC<{
  /** Si el modal está visible */
  isOpen: boolean;
  /** Función para abrir/cerrar el modal */
  onToggle: () => void;
  /** Contenido del modal */
  children: React.ReactNode;
  /** Título del modal (se lee con screen readers) */
  title: string;
  /** Clase CSS opcional */
  className?: string;
  /** ID opcional */
  id?: string;
}> = ({
  isOpen,
  onToggle,
  children,
  title,
  className,
  id = 'accessible-modal',
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const { previouslyFocusedRef } =
    useFocusTrap(modalRef, {
      resetOnOpen: isOpen,
      returnFocusOnClose: isOpen === false,
    });

  // Efecto para manejar el focus al abrir/cerrar
  useEffect(() => {
    if (!isOpen) return;

    // Evitar scroll en body mientras modal está abierto
    const body = document.body;
    body.style.overflow = 'hidden';

    // Restaurar focus al cerrar
    if (!isOpen && previouslyFocusedRef.current) {
      requestAnimationFrame(() => {
        previouslyFocusedRef.current?.focus({ preventScroll: true });
      });
    }
  }, [isOpen, previouslyFocusedRef]);

  // Efecto de limpieza
  useEffect(() => {
    return () => {
      if (modalRef.current) {
        modalRef.current.style.overflow = '';
      }
    };
  }, []);

  return (
    <div
      ref={modalRef}
      id={id}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      className={className}
      tabIndex={isOpen ? 0 : -1}
    >
      {/* Background overlay que cierra el modal al hacer clic */}
      <div
        onClick={isOpen ? onToggle : undefined}
        className="modal-overlay"
        aria-hidden={!isOpen}
      ></div>

      {/* Contenido del modal */}
      <div className="modal-content" role="document">
        {/* Header con título y botón de cerrar */}
        <div className="modal-header">
          <h2 id={`${id}-title`} className="sr-only">
            {title}
          </h2>
          <h3 className="modal-title">{title}</h3>
          <button
            type="button"
            className="modal-close-button"
            onClick={onToggle}
            aria-label="Cerrar modal"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

/** estilo CSS inline para el modal */
const modalStyles = `
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 1050;
    cursor: pointer;
  }

  .modal-content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    margin: 20px;
    max-width: 90%;
    max-height: 90%;
    overflow-y: auto;
    z-index: 1051;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes modalIn {
    from { opacity: 0; transform: translate(-50%, -40%) scale(0.9); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .modal-close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #6b7280;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: color 0.15s ease;
  }

  .modal-close-button:hover {
    color: #ef4444;
  }

  .modal-body {
    padding: 20px;
  }
`;

export { modalStyles };
