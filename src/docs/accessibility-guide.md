# Guía de Accesibilidad WCAG 2.1 para Taller-main

## 📋 Tabla de Contenido
1. [Resumen General](#-resumen-general)
2. [Componentes Implementados](#componentes-implementados)
3. [Guías de Uso](#guías-de-uso)
4. [Testing de Accesibilidad](#testing-de-accesibilidad)
5. [Roadmap Futuro](#roadmap-futuro)

## 🎯 Resumen General

Esta guía documenta las mejoras de accesibilidad implementadas en la Fase 6 para cumplir con **WCAG 2.1 Level AA**. El proyecto Taller-main ahora incluye:

- ✅ Componentes de interfaz accesibles
- ✅ Hooks utilities para detección y announcement
- ✅ Utilidades de contraste de color
- ✅ Alertas accesibles con ARIA apropiado
- ✅ Focus management para modales

**Objetivo**: Garantizar que todos los usuarios, incluidos aquellos con discapacidades visuales, motoras o cognitivas, puedan usar la aplicación de manera efectiva.

---

## 📦 Componentes Implementados

### 1. `AccessibleModal`
- **Función**: Modal accesible con focus trap
- **WCAG**: Success Criterion 2.1.1 (Keyboard)
- **Características**:
  - Focus atrapado dentro del modal
  - Cierre con tecla Escape
  - Return focus al cerrar
  - Prevención de scroll en body
  - ARIA roles: `dialog`, `aria-modal="true"`

### 2. `AccessibleButton`
- **Función**: Botón con características WCAG completas
- **WCAG**: Success Criterion 2.4.7 (Focus Visible)
- **Características**:
  - Variants: primary, secondary, danger, link
  - aria-label y aria-describedby support
  - focus-visible styles nativos
  - Estados disabled apropiados

### 3. `AccessibleInput`
- **Función**: Inputs de formulario accesibles
- **WCAG**: Success Criterion 1.3.1 (Info y Relationships), 3.3.2 (Labels or Instructions)
- **Características**:
  - Labels asociados via htmlFor
  - required field asterisk visual
  - Error messages con aria-live="polite"
  - Validación de tipo (text, email, number, password, tel, date)
  - Estado invalid con shadow box

### 4. `AccessibleTable`
- **Función**: Tablas con headers semanticamente correctos
- **WCAG**: Success Criterion 1.3.1 (Info y Relationships)
- **Características**:
  - <th scope="col"> y <th scope="row">
  - SR-only title para screen readers
  - Paginación con ARIA labels
  - Contraste de colores adecuado

### 5. `AlertAccessible`
- **Función**: Alertas del sistema con ARIA live regions
- **WCAG**: Success Criterion 3.3.1 (Error Identification)
- **Características**:
  - Tipos: success, error, warning, info
  - aria-live="polite" para announcements
  - Dismissible con botón X
  - Auto-close timeout
  - Descripción adicional para screen readers

### 6. Hooks Utilitarios

#### `useScreenReader`
- Detecta si el usuario está usando un lector de pantalla
- Basado en live regions y prefers-reduced-motion

#### `useScreenReaderAnnounce`
- Función para anunciar cambios a screen readers
- Útil después de operaciones exitosas

#### `useFocusOrder`
- Gestión order de tab focus en componentes complejos
- Navegación next/previous/first/last

#### `useColorContrast`
- Verificación de contraste WCAG 2.1
- Generación de colores contrastantes automáticamente

---

## 📚 Guías de Uso

### 1. Formularios

```tsx
import { AccessibleInput, AccessibleSelect } from '@/components/Accessibility';

// Input con label y validación
<AccessibleInput
  type="text"
  label="Placa"
  name="placa"
  value={formData.placa}
  onChange={handleChange}
  required
  placeholder="ABC-123"
  error={errors.placa}
  showError={!!errors.placa}
/>

<AccessibleSelect
  label="Tipo de Vehículo"
  name="vehicleType"
  value={selectedType}
  onChange={(v) => setSelectedType(v)}
  options={[
    { value: 'car', label: 'Auto' },
    { value: 'truck', label: 'Camión' },
  ]}
  required
/>
```

### 2. Modales

```tsx
import { AccessibleModal } from '@/components/Accessibility';

<AccessibleModal
  isOpen={showModal}
  onToggle={() => setShowModal(false)}
  title="Confirmar Eliminación"
>
  <p>¿Está seguro de eliminar este vehículo? Esta acción no se puede deshacer.</p>
  <AccessibleButton
    variant="danger"
    onClick={() => {
      // Lógica de eliminación
      setShowModal(false);
    }}
  >
    Eliminar
  </AccessibleButton>
  <AccessibleButton onClick={() => setShowModal(false)} variant="secondary">
    Cancelar
  </AccessibleButton>
</AccessibleModal>
```

### 3. Tablas

```tsx
import { AccessibleTable } from '@/components/Accessibility';

<AccessibleTable
  title="Vehículos Registrados"
  columns={[
    { header: 'Placa', accessor: (v) => v.placa } as any,
    { header: 'Marca', accessor: (v) => v.marca } as any,
    { header: 'Año', accessor: (v) => v.anio } as any,
    { header: 'Estado', accessor: (v) => v.estado } as any,
  ]}
  data={vehicles}
  rowsPerPage={10}
  showPagination
/>
```

### 4. Alertas del Sistema

```tsx
import { AlertAccessible, useAlerts } from '@/components/Accessibility';

const { showAlert, alerts } = useAlerts();

// Mostrar alerta de error
showAlert('error', 'La placa ya existe en el sistema', {
  description: 'Por favor use una placa diferente o contacte al administrador.',
});

// Mostrar alerta de éxito
showAlert('success', 'Vehículo registrado correctamente');

// Renderizar alertas
{alerts.map((alert) => (
  <AlertAccessible
    key={alert.id}
    type={alert.type}
    message={alert.message}
    description={alert.description}
    dismissible={false}
  />
))}
```

### 4. Contraste de Colores

```tsx
import { calculateContrastRatio, getContrastingTextColor, RECOMMENDED_COLORS } from '@/utils/color-contrast';

// Verificar contraste
const result = calculateContrastRatio('#1E3A8A', '#FFFFFF');
console.log(result.ratio); // 8.97
console.log(result.wcagAA); // true
console.log(result.wcagAAA); // true

// Obtener color de texto contrastante
const { color } = getContrastingTextColor('#1E3A8A');
// color: '#FFFFFF'

// Usar colores recomendados del esquema
<Button className={RECOMMENDED_COLORS.primary.background}>
  {children}
</Button>
```

---

## 🧪 Testing de Accesibilidad

### Testing Manual Recomendado

1. **Navegación por Teclado**:
   - Tab through all interactive elements
   - Shift + Tab para retroceder
   - Enter/Space para activar botones
   - Focus visible debe ser evidente

2. **Screen Reader Testing**:
   - **NVDA** (Windows): `NVDA + Tab` para leer elementos
   - **VoiceOver** (Mac): `Control + Option + Flechas`
   - **TalkBack** (Android): `Tab` through elements

3. **Verificación de Contraste**:
   - Usar la utilidad `calculateContrastRatio`
   - Mínimo 4.5:1 para texto normal
   - Mínimo 3:1 para UI elements y large text

4. **Testing de Modales**:
   - Focus debe quedar atrapado dentro
   - Escape debe cerrar el modal
   - Focus debe regresar al abrir

### Testing Automatizado (Futuro)

```bash
# Instalar herramientas de testing
npm install -D jest-axe @testing-library/react @testing-library/jest-dom

# Ejemplo de test
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { AccessibleButton } from '@/components/Accessibility';

test('botón accessible pasa axe', async () => {
  const { container } = render(<AccessibleButton onClick={() => {}}>Hola</AccessibleButton>);
  const results = await axe(container);
  expect(results violations).toEqual([]);
});
```

---

## ♿ Roadmap Futuro

### Fase 7: Testing Automático (2-3 semanas)
- [ ] Integrar `jest-axe` en pipeline CI/CD
- [ ] Tests de screen reader con `@testing-library/react`
- [ ] Tests de contraste de color automatizados
- [ ] Testing de navegación por teclado

### Fase 8: Internationalización Accesible (2 semanas)
- [ ] i18n con accesibilidad en todos los idiomas
- [ ] Formatos de fecha/hora/number culturalmente apropiados
- [ ] Soporte RTL (Right-to-Left) para idiomas como árabe

### Fase 9: Performance + Accessibility (1 semana)
- [ ] Lazy loading con mantenimiento de focus
- [ ] Reduced motion preference respect
- [ ] Dark mode con contraste adecuado

### Fase 10: Certificación WCAG (Opcional, 4+ semanas)
- [ ] Auditoría externa con consultor WCAG
- [ ] Reporte de conformidad Level AA
- [ ] Plan de remediación de problemas identificados

---

## 📞 Recursos Adicionales

- **W3C WCAG 2.1**: https://www.w3.org/WAI/WCAG21/
- **A11y Project**: https://www.a11yproject.com/
- **Accessibility Insights**: https://accessibilityinsights.dev/
- **VS Code Extension**: "ESLint + Prettier" con plugins de a11y
- **Screen Readers**:
  - NVDA (Windows, gratis): https://nvda-free.github.io/
  - VoiceOver (Mac/iOS, integrado)
  - JAWS (Windows, de pago)

---

**Última actualización**: 20 de agosto de 2026  
**Mantenido por**: Equipo de Desarrollo Taller-main  
**Versión**: 1.0.0 (Fase 6 completa)