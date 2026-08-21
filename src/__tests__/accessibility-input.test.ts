import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'jest';
import { axe } from 'jest-axe';
import { AccessibleInput } from '../components/Accessibility/AccessibleInput';

describe('AccessibleInput - Accessibility Tests', () => {
  it('debe tener label asociado y aria-required', () => {
    render(
      <AccessibleInput
        type="text"
        label="Placa"
        name="placa"
        value=""
        onChange={(e) => {}}
        required
      />
    );
    
    // Verificar que el label existe y está asociado
    const label = screen.getByLabelText(/Placa/);
    expect(label).toBeInTheDocument();
    
    // Verificar aria-required=true
    const input = screen.getByLabelText(/Placa/);
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('debe tener aria-invalid cuando hay error', () => {
    render(
      <AccessibleInput
        type="text"
        label="Placa"
        name="placa"
        value=""
        onChange={(e) => {}}
        required
        error="La placa debe tener 6 caracteres"
        showError
      />
    );
    
    const input = screen.getByLabelText(/Placa/);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
  });

  it('debe pasar axe accessibility check', async () => {
    const { container } = render(
      <AccessibleInput
        type="text"
        label="Placa"
        name="placa"
        value="ABC-123"
        onChange={(e) => {}}
        required
      />
    );
    
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('debe aceptar el Enter en inputs de tipo text', () => {
    render(
      <AccessibleInput
        type="text"
        label="Búsqueda"
        name="busqueda"
        value=""
        onChange={(e) => {}}
      />
    );
    
    const input = screen.getByLabelText(/Búsqueda/);
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    // El input debe aceptar el evento sin errores
    expect(input).toBeEnabled();
  });
});