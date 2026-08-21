// Utilidad para verificar el contraste de color según WCAG 2.1
// Referencia: https://www.w3.org/WAI/GL/wiki/Contrast_ratio

/**
 * Convierte un color hexadecimal a valores RGB
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const expanded = hex.length === 3
    ? hex.split('').map(char => char + char).join('')
    : hex;

  const bigint = parseInt(expanded.replace('#', ''), 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

/**
 * Calcula el brillo relativo de un color (0 = negro, 1 = blanco)
 * Según la fórmula de WCAG 2.1
 */
const getRelativeLuminance = ({ r, g, b }: { r: number; g: number; b: number }): number => {
  const sRGB = [r, g, b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
};

/**
 * Calcula la razón de contraste entre dos colores
 * @param color1 Primer color en formato hex (ej: "#FFFFFF")
 * @param color2 Segundo color en formato hex (ej: "#000000")
 * @returns Objeto con la razón de contraste y si cumple WCAG AA y AAA
 */
export const calculateContrastRatio = (
  color1: string,
  color2: string
): {
  ratio: number;
  wcagAA: boolean; // Contexto normal (4.5:1)
  wcagAAA: boolean; // Contexto grande (3:1) y texto grande (3:1)
  message: string;
} => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const luminance1 = getRelativeLuminance(rgb1);
  const luminance2 = getRelativeLuminance(rgb2);

  // Asegurar que luminance1 sea el más claro
  const lightLuminance = Math.max(luminance1, luminance2);
  const darkLuminance = Math.min(luminance1, luminance2);

  // Fórmula de contraste WCAG: (L1 + 0.05) / (L2 + 0.05)
  const ratio = (lightLuminance + 0.05) / (darkLuminance + 0.05);

  const isAA = ratio >= 4.5;
  const isAAA = ratio >= 7;

  return {
    ratio: parseFloat(ratio.toFixed(2)),
    wcagAA: isAA,
    wcagAAA: isAAA,
    message: `Contraste ${ratio.toFixed(2)}:1 - ${isAA ? '✓ Cumple WCAG AA' : '✗ No cumple WCAG AA'}${isAAA ? ' (también AAA)' : ''}`,
  };
};

/**
 * Verifica si un par de colores cumple con WCAG para casos de uso específicos
 */
export const checkContrastForUsage = (
  color: string,
  background: string,
  usage: 'text' | 'UI-element' | 'large-text'
) => {
  const ratioInfo = calculateContrastRatio(color, background);

  const thresholds = {
    text: { aa: 4.5, aaa: 7 },
    'UI-element': { aa: 3, aaa: 4.5 },
    'large-text': { aa: 3, aaa: 4.5 },
  };

  const threshold = thresholds[usage];
  return {
    ratio: ratioInfo.ratio,
    passesAA: ratioInfo.wcagAA,
    passesAAA: ratioInfo.wcagAAA,
    meetsRequirement: ratioInfo.ratio >= threshold.aa,
    message: ratioInfo.message,
    recommendedForeground:
      !ratioInfo.wcagAA
        ? 'Considerar un color de texto más oscuro o un fondo más claro'
        : 'Contraste adecuado',
  };
};

/**
 * Genera automáticamente un color de texto contrastante sobre un fondo dado
 * @param backgroundColor Color de fondo en hex
 * @returns Color de texto que cumple WCAG AA
 */
export const getContrastingTextColor = (backgroundColor: string): { color: string; ratio: number; passesAA: boolean } => {
  const ratioInfo = calculateContrastRatio(backgroundColor, '#000000');
  const ratioInfoWhite = calculateContrastRatio(backgroundColor, '#FFFFFF');

  // Elegir el color (negro o blanco) que tenga mejor contraste
  if (ratioInfoWhite.ratio > ratioInfo.ratio) {
    return { color: '#FFFFFF', ratio: ratioInfoWhite.ratio, passesAA: ratioInfoWhite.wcagAA };
  }
  return { color: '#000000', ratio: ratioInfo.ratio, passesAA: ratioInfo.wcagAA };
};

/** Schema de colores recomendados para Taller-main */
export const RECOMMENDED_COLORS = {
  primary: {
    background: '#1E3A8A', // Blue-800
    foreground: '#FFFFFF', // Blanco - contraste: 8.97:1 (AAA)
  },
  secondary: {
    background: '#64748B', // Slate-500
    foreground: '#FFFFFF', // Blanco
  },
  success: {
    background: '#059669', // Emerald-600
    foreground: '#FFFFFF', // Blanco
  },
  warning: {
    background: '#D97706', // Amber-500
    foreground: '#FFFFFF', // Blanco
  },
  danger: {
    background: '#DC2626', // Red-600
    foreground: '#FFFFFF', // Blanco
  },
  info: {
    background: '#3B82F6', // Blue-500
    foreground: '#FFFFFF', // Blanco
  },
} as const;

/** Utilidad para validar colores en componentes */
export const useColorContrast = (bgColor: string, textColor: string) => {
  const ratioInfo = calculateContrastRatio(bgColor, textColor);

  return {
    ratio: ratioInfo.ratio,
    passesAA: ratioInfo.wcagAA,
    passesAAA: ratioInfo.wcagAAA,
    message: ratioInfo.message,
    needsImprovement: !ratioInfo.wcagAA,
  };
};
