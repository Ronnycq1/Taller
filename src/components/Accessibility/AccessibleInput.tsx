import React, { useState, useRef, useEffect } from 'react';

/**
 * Input text accessible con validación y labels asociados.
 * WCAG 2.1: Success Criterion 1.3.1 Info and Relationships
 * WCAG 2.1: Success Criterion 3.3.2 Labels or Instructions
 */
export const AccessibleInput: React.FC<{
  /** Tipo de input: text, email, number, password, etc. */
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date';
  /** Label asociado al input */
  label: string;
  /** Nombre del campo (name attribute) */
  name: string;
  /** Valor controlado */
  value: string;
  /** Función de cambio onChange */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Si está deshabilitado */
  disabled?: boolean;
  /** Si es requerido (muestra asterisco y aria-required) */
  required?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** ID personalizado */
  id?: string;
  /** Clase CSS adicional */
  className?: string;
  /** Error message shown below input */
  error?: string;
  /** Si muestra el error */
  showError?: boolean;
}> = ({
  type,
  label,
  name,
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder,
  id: inputId,
  className,
  error: errorMessage,
  showError = false,
}) => {
  const inputId_ = inputId || `${name}-input`;
  const errorId_ = `${inputId_}-error`;

  return (
    <div className="accessible-input-wrapper">
      {/* Label asociado */}
      <label htmlFor={inputId_} className="input-label">
        {required && <span className="required-asterisk">*</span>}
        {label}
      </label>

      {/* Input */}
      <input
        type={type}
        name={name}
        id={inputId_}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className={
          `input-field ${
            showError || errorMessage ? 'input-field--error' : ''
          } ${className || ''}`
        }
        aria-required={required}
        aria-invalid={showError || errorMessage ? 'true' : 'false'}
        aria-describedby={showError || errorMessage ? errorId_ : undefined}
      />
      
      {/* Error message below input */}
      {showError || errorMessage ? (
        <p
          id={errorId_}
          className="input-error"
          role="alert"
        >
          {errorMessage || 'Por favor complete este campo correctamente'}
        </p>
      ) : null}
    </div>
  );
};

/** Wrapper para grupos de campos con validación */
export const AccessibleFormGroup: React.FC<{
  /** Label del grupo */
  label: string;
  /** Componente children que contiene los inputs */
  children: React.ReactNode;
  /** Si el grupo es requerido */
  required?: boolean;
  /** Error message del grupo */
  error?: string;
}> = ({
  label,
  children,
  required = false,
  error,
}) => {
  return (
    <div className="accessible-form-group">
      <label htmlFor="" className="form-group-label">
        {required && <span className="required-asterisk">*</span>}
        {label}
      </label>
      <div className="form-group-container">{children}</div>
      {error && (
        <p className="form-group-error">{error}</p>
      )}
    </div>
  );
};

/** Componente de select accesible */
export const AccessibleSelect: React.FC<{
  /** Label asociado */
  label: string;
  /** Nombre del campo */
  name: string;
  /** Valor seleccionado */
  value: string;
  /** Función de cambio */
  onChange: (value: string) => void;
  /** Opciones: {value, label} */
  options: { value: string; label: string; disabled?: boolean }[];
  /** Si está deshabilitado */
  disabled?: boolean;
  /** Si es requerido */
  required?: boolean;
  /** ID personalizado */
  id?: string;
  /** Placeholder inicial */
  placeholder?: string;
  /** Clase CSS adicional */
  className?: string;
}> = ({
  label,
  name,
  value,
  onChange,
  options,
  disabled = false,
  required = false,
  placeholder,
  id: selectId,
  className,
}) => {
  const selectId_ = selectId || `${name}-select`;

  return (
    <div className="accessible-select-wrapper">
      <label htmlFor={selectId_} className="select-label">
        {required && <span className="required-asterisk">*</span>}
        {label}
      </label>

      <select
        id={selectId_}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        aria-required={required}
        className={`select-field ${
          className || ''
        }`}
      >
        {/* Option placeholder si hay placeholder */}
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

/** Styles CSS para inputs (usaría Tailwind en producción) */
const inputStyles = `
  .accessible-input-wrapper {
    margin-bottom: 16px;
  }

  .input-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 4px;
    color: #374151;
  }

  .required-asterisk {
    color: #dc2626;
    margin-left: 2px;
  }

  .input-field {
    width: 100%;
    padding: 10px 12px;
    font-size: 1rem;
    line-height: 1.5;
    color: #1f2937;
    background-color: #fff;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    &:focus:invalid {
      box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
    }
  }

  .input-field--error {
    border-color: #dc2626;
  }

  .input-field--error:focus {
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  .input-error {
    margin-top: 4px;
    font-size: 0.75rem;
    color: #dc2626;
    background-color: #fef2f2;
    padding: 6px 8px;
    border-radius: 4px;
    border: 1px solid #fecaca;
  }

  .form-group-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 4px;
    color: #374151;
  }

  .required-asterisk {
    color: #dc2626;
    margin-left: 2px;
  }

  .form-group-container {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .form-group-error {
    margin-top: 4px;
    font-size: 0.75rem;
    color: #dc2626;
  }

  .accessible-select-wrapper {
    margin-bottom: 16px;
  }

  .select-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 4px;
    color: #374151;
  }

  .select-field {
    padding: 10px 12px;
    font-size: 1rem;
    line-height: 1.5;
    color: #1f2937;
    background-color: #fff;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    width: 100%;
    transition: border-color 0.15s ease;
    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
`;

/* export { inputStyles }; */