/**
 * Structured Logger with Automatic Sensitive Data Redaction for SIEM & Audit Compliance
 */

const SENSITIVE_KEYS = [
  "password",
  "contrasena",
  "token",
  "authorization",
  "bearer",
  "apikey",
  "api_key",
  "secret",
  "creditcard",
  "tarjeta",
  "cvv",
  "access_token",
  "refresh_token",
  "privatekey",
  "gemini_api_key"
];

/**
 * Recursively redacts sensitive values from objects, arrays, and headers.
 */
export function redactSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    // Redact JWT tokens (Bearer eyJ...)
    if (/^Bearer\s+eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/i.test(data)) {
      return "Bearer [REDACTED_JWT]";
    }
    // Redact raw JWT tokens
    if (/^eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/i.test(data)) {
      return "[REDACTED_JWT]";
    }
    // Redact Credit Card numbers (13 to 19 digits)
    if (/^\b(?:\d[ -]*?){13,19}\b$/.test(data)) {
      return "[REDACTED_CARD]";
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  if (typeof data === "object") {
    const redactedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((sensitiveKey) => lowerKey.includes(sensitiveKey))) {
        redactedObj[key] = "[REDACTED]";
      } else {
        redactedObj[key] = redactSensitiveData(value);
      }
    }
    return redactedObj;
  }

  return data;
}

export interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "SECURITY";
  message: string;
  category?: string;
  ip?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  meta?: unknown;
}

export const logger = {
  info(message: string, meta?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "INFO",
      message,
      meta: redactSensitiveData(meta)
    };
    console.log(JSON.stringify(entry));
  },

  warn(message: string, meta?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "WARN",
      message,
      meta: redactSensitiveData(meta)
    };
    console.warn(JSON.stringify(entry));
  },

  error(message: string, error?: unknown, meta?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "ERROR",
      message,
      meta: {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        details: redactSensitiveData(meta)
      }
    };
    console.error(JSON.stringify(entry));
  },

  security(message: string, ip?: string, method?: string, path?: string, statusCode?: number, meta?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "SECURITY",
      message,
      category: "SIEM_AUDIT",
      ip,
      method,
      path,
      statusCode,
      meta: redactSensitiveData(meta)
    };
    console.warn(JSON.stringify(entry));
  }
};
