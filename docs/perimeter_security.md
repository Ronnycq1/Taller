# Especificación de Seguridad de Perímetro (Capa 1: CDN / WAF / Anti-DDoS / DNSSEC)

Esta especificación documenta las políticas y la arquitectura de protección perimetral para la aplicación **Taller-main** (`CQ Motors`).

---

## 1. Perímetro CDN y DNSSEC

1. **DNSSEC (Domain Name System Security Extensions)**:
   - Debe estar habilitado a nivel de registrador de dominio (e.g. Cloudflare DNS o Google Cloud DNS).
   - Garantiza la autenticidad e integridad de las respuestas DNS impidiendo ataques de DNS Spoofing o Cache Poisoning.

2. **CDN (Content Delivery Network)**:
   - Enrutamiento de tráfico HTTP/S a través del Anycast Edge de Cloudflare o Google Cloud CDN.
   - Caching estático optimizado de activos (JS, CSS, imágenes) reduciendo el tráfico directo al servidor de origen en Express.

---

## 2. Web Application Firewall (WAF) y Anti-DDoS

1. **Protección Anti-DDoS Volumétrica**:
   - Mitigación automática de ataques DDoS en Capa 3/4 (SYN floods, UDP amplification) y Capa 7 (HTTP floods).
   - Rate limiting a nivel perimetral de 100 req/min por dirección IP hacia rutas `/api/*`.

2. **Reglas Gestionadas WAF**:
   - Bloqueo de vectores OWASP Top 10 (SQL Injection, Cross-Site Scripting, Remote File Inclusion).
   - Bloqueo de peticiones sospechosas provenientes de IPs con baja reputación o redes de bots conocidas.

---

## 3. Configuración SSL/TLS Perimetral

- **Versión Mínima de TLS**: TLS 1.3 obligado (TLS 1.2 como fallback mínimo). TLS 1.0 y 1.1 deshabilitados.
- **Cifrado SSL Modo**: "Full (Strict)" requiriendo certificado SSL válido firmado por autoridad certificadora (CA) en el servidor de origen.
- **HSTS Preload**: Activación de la bandera `preload` en la lista global de navegadores.

---

## 4. Integración con Servidor Express (`server.ts`)

El servidor Express utiliza `app.set("trust proxy", 1)` para confiar en el primer salto del proxy perimetral (Cloudflare / GCP Cloud Armor / Firebase Hosting), asegurando la lectura correcta de `req.ip` y la cabecera `X-Forwarded-For`.
