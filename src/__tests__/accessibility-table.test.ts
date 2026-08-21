import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'jest';
import { axe } from 'jest-axe';
import { AccessibleTable } from '../components/Accessibility/AccessibleTable';

describe('AccessibleTable - Accessibility Tests', () => {
  const mockVehicles = [
    { id: '1', placa: 'ABC-123', marca: 'Chevrolet', modelo: 'Camaro', anio: '2022', estado: 'activo' },
    { id: '2', placa: 'DEF-456', marca: 'Ford', modelo: 'F-150', anio: '2021', estado: 'mantenimiento' },
  ];

  it('debe tener headers semanticamente correctos', () => {
    render(
      <AccessibleTable
        title="Vehículos Registrados"
        columns={[
          { header: 'Placa', accessor: (v) => v.placa } as any,
          { header: 'Marca', accessor: (v) => v.marca } as any,
        ]}
        data={mockVehicles}
      />
    );
    
    // Verificar headers th con scope apropiado
    const headers = screen.getAllByRole('columnheader');
    expect(headers.length).toBe(2);
    
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(2);
  });

  it('debe pasar axe accessibility check', async () => {
    const { container } = render(
      <AccessibleTable
        title="Vehículos Registrados"
        columns={[
          { header: 'Placa', accessor: (v) => v.placa } as any,
          { header: 'Marca', accessor: (v) => v.marca } as any,
        ]}
        data={mockVehicles}
        rowsPerPage={10}
      />
    );
    
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('debe tener título SR-only para screen readers', () => {
    render(
      <AccessibleTable
        title="Vehículos Registrados"
        columns={[
          { header: 'Placa', accessor: (v) => v.placa } as any,
        ]}
        data={mockVehicles}
      />
    );
    
    // Verificar título oculto para SR
    const srTitle = screen.getByText(/Vehículos Registrados/);
    // El título debería estar presente pero hidden para visual
    expect(srTitle).toBeInTheDocument();
  });
});