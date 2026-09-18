/**
 * Utility to recursively sanitize objects and remove sensitive fields
 * such as passwords, API keys, tokens, and credentials before writing to audit logs.
 */

const SENSITIVE_KEYS = new Set([
  "password",
  "confirmpassword",
  "token",
  "access_token",
  "accesstoken",
  "refresh_token",
  "refreshtoken",
  "sessiontoken",
  "session_token",
  "secret",
  "apikey",
  "api_key",
  "jwt",
  "bearer",
  "credential",
  "credentials",
  "cookie",
  "smtppassword",
  "smtp_password",
  "authorization",
  "signature_private_key",
  "client_secret",
  "clientsecret",
  "private_key",
  "privatekey",
  "service_role_key",
  "servicerolekey",
]);

export function sanitizeAuditData<T = any>(data: T, maxDepth = 6): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== "object") {
    return data;
  }

  if (maxDepth <= 0) {
    return "[Truncated: Max Depth]" as any;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAuditData(item, maxDepth - 1)) as any;
  }

  if (data instanceof Date) {
    return data.toISOString() as any;
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = key.toLowerCase().replace(/[-_]/g, "");

    if (SENSITIVE_KEYS.has(normalizedKey) || key.toLowerCase().includes("password") || key.toLowerCase().includes("secret")) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeAuditData(value, maxDepth - 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}
