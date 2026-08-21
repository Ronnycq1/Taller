import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'jest';
import { axe } from 'jest-axe';
import { AccessibleButton } from '../components/Accessibility/AccessibleButton';

describe('AccessibleButton - Accessibility Tests', () => {
  it('debe renderizar botón con atributos ARIA apropiados', async () => {
    render(<AccessibleButton onClick={() => {}} aria-label="Botón de prueba">Enviar</AccessibleButton>);
    
    // Verificar que el botón tiene el atributo aria-label
    const button = screen.getByRole('button', { name: /Botón de prueba/ });
    expect(button).toBeInTheDocument();
  });

  it('debe pasar el axe accessibility check', async () => {
    const { container } = render(
      <AccessibleButton onClick={() => {}} aria-label="Test button">
        Test
      </AccessibleButton>
    );
    
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('debe tener role="button" por defecto', () => {
    render(<AccessibleButton onClick={() => {}}>Click me</AccessibleButton>);
    const button = screen.getByRole('button', { name: /Click me/ });
    expect(button).toBeInTheDocument();
  });

  it('debe aplicar clase disabled apropiada cuando disabled=true', () => {
    render(<AccessibleButton onClick={() => {}} disabled>Deshabilitado</AccessibleButton>);
    const button = screen.getByRole('button', { name: /Deshabilitado/ });
    // El botón debería tener clases que indiquen estado disabled
    expect(button).toBeDisabled();
  });
});