import { supabase } from "./client";

export interface AuditLogEntry {
  actorId?: string;
  actorRole?: "candidate" | "company" | "admin" | "system";
  action: string;
  entityType: "application" | "job" | "candidate" | "company" | "bid" | "auth" | "admin";
  entityId: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  /**
   * Log a security or business operation audit record
   */
  static async log(entry: AuditLogEntry): Promise<boolean> {
    try {
      const { error } = await supabase.from("audit_logs" as any).insert({
        actor_id: entry.actorId || "anonymous",
        actor_role: entry.actorRole || "system",
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        metadata: entry.metadata || {},
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.warn("[AuditService] Failed to record audit log:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn("[AuditService] Unexpected error recording audit:", err);
      return false;
    }
  }
}
