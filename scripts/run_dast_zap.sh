#!/usr/bin/env bash
# ==============================================================================
# Script de Ejecución DAST (OWASP ZAP & Strix Dynamic Security Audit)
# Target: http://localhost:3000
# ==============================================================================

set -euo pipefail

TARGET_URL="${1:-http://localhost:3000}"
OUTPUT_DIR="docs/reports"

mkdir -p "$OUTPUT_DIR"

echo "======================================================"
echo " Iniciando Análisis DAST sobre: $TARGET_URL"
echo "======================================================"

# Verificar disponibilidad del servidor objetivos
if ! curl -s --head "$TARGET_URL" > /dev/null; then
  echo "[ERROR] El servidor en $TARGET_URL no responde. Inicie la aplicación con 'npm run dev' o 'npm run start'."
  exit 1
fi

echo "[1/2] Ejecutando OWASP ZAP Baseline Scanner vía Docker..."
if command -v docker > /dev/null 2>&1; then
  docker run --rm -v "$(pwd)/$OUTPUT_DIR:/zap/wrk/:rw" \
    zaproxy/zap-stable zap-baseline.py \
    -t "$TARGET_URL" \
    -g gen.conf \
    -r zap_report.html || true
  echo "[OK] Reporte HTML de OWASP ZAP generado en: $OUTPUT_DIR/zap_report.html"
else
  echo "[WARN] Docker no está instalado localmente. Omitiendo contenedor ZAP."
fi

echo "[2/2] Verificación de Cabeceras de Seguridad DAST..."
curl -sI "$TARGET_URL" | grep -Ei "(strict-transport-security|x-frame-options|x-content-type-options|content-security-policy|permissions-policy)" || true

echo "======================================================"
echo " Auditoría DAST finalizada."
echo "======================================================"
