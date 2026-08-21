import React from 'react';

/**
 * Tabla accesible con headers semanticamente correctos.
 * WCAG 2.1: Success Criterion 1.3.1 Info and Relationships
 * WCAG 2.1: Success Criterion 1.4.3 Contrast (Minimum)
 */
export const AccessibleTable: React.FC<{
  /** Columnas definidas: [{ header, accessor, headerClassName?, cellClassName? }] */
  columns: {
    header: string;
    accessor: (row: any) => string | number | React.ReactNode;
    headerClassName?: string;
    cellClassName?: string;
    style?: React.CSSProperties;
  }[];
  /** Datos de la tabla */
  data: any[];
  /** Título de la tabla para screen readers */
  title?: string;
  /** Clase CSS adicional para el container */
  className?: string;
  /** Si hay paginación */
  showPagination?: boolean;
  /** Número total de filas */
  totalRows?: number;
  /** Número de filas por página */
  rowsPerPage?: number;
  /** Página actual */
  page?: number;
  /** Función de cambio de página */
  onPageChange?: (page: number) => void;
  /** Función de cambio de filas por página */
  onRowsPerPageChange?: (rows: number) => void;
}> = ({
  columns,
  data,
  title,
  className,
  showPagination = false,
  totalRows,
  rowsPerPage = 10,
  page = 1,
  onPageChange,
  onRowsPerPageChange,
}) => {
  // Calcular filas de la página actual
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const pageData = data.slice(startIndex, endIndex);

  // Generar eladHeaderRow con th semanticamente correctos
  const headerRow = (
    <tr>
      {columns.map((column, index) => (
        <th
          key={index}
          scope="col"
          className={column.headerClassName || ''}
          style={column.style}
        >
          {column.header}
        </th>
      ))}
    </tr>
  );

  // Generar filas de datos
  const dataRows = pageData.map((row, rowIndex) => (
    <tr key={rowIndex}>
      {columns.map((column, colIndex) => (
        <td
          key={colIndex}
          scope="row"
          className={column.cellClassName || ''}
          style={column.style}
        >
          {column.accessor(row)}
        </td>
      ))}
    </tr>
  ));

  return (
    <div className={`accessible-table ${className || ''}`}>
      {/* Título de la tabla */}
      {title && (
        <p className="sr-only table-title">
          {title}
        </p>
      )}

      {/* Tabla */}
      <table>
        <thead>{headerRow}</thead>
        <tbody>{dataRows}</tbody>
      </table>

      {/* Paginación opcional */}
      {showPagination && totalRows && onPageChange && (
        <div className="accessible-pagination">
          {/* Controles de paginación */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
            className="pagination-button"
          >
            Anterior
          </button>

          <span>
            Página {page} de {Math.ceil(totalRows / rowsPerPage)}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={endIndex >= totalRows}
            aria-label="Página siguiente"
            className="pagination-button"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

/** Styles CSS para tabla */
const tableStyles = `
  .accessible-table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 0.875rem;
    background-color: white;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .accessible-table thead th {
    background-color: #f3f4f6;
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    color: #1f2937;
    border-bottom: 2px solid #e5e7eb;
  }

  .accessible-table tbody tr {
    border-bottom: 1px solid #e5e7eb;
  }

  .accessible-table tbody tr:hover {
    background-color: #f9fafb;
  }

  .accessible-table tbody tr:last-child {
    border-bottom: none;
  }

  .accessible-table td,
  .accessible-table th {
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
  }

  .accessible-table tbody tr:hover td {
    background-color: #f9fafb;
  }

  .pagination-button {
    padding: 6px 12px;
    margin: 0 4px;
    font-size: 0.875rem;
    color: #374151;
    background: none;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .pagination-button:hover {
    background-color: #f3f4f6;
  }

  .pagination-button:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  .pagination-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .table-title {
    margin-bottom: 8px;
    color: #6b7280;
  }
`;

/* export { tableStyles }; */