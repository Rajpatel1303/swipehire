import { supabase } from "./client";
import { sanitizeAuditData } from "../../utils/auditSanitizer";
import { SupportSessionClient } from "../../utils/supportSession";

export interface AuditLogEntry {
  actorUserId?: string;
  actorId?: string;
  actorRole?: "candidate" | "company" | "admin" | "system";
  targetUserId?: string;
  companyId?: string;
  action: string;
  entityType: "application" | "job" | "candidate" | "company" | "bid" | "auth" | "admin" | "support_session" | "template";
  entityId: string;
  oldData?: any;
  newData?: any;
  metadata?: Record<string, any>;
}

export interface StoredAuditLog {
  id: string;
  actorUserId?: string;
  actorId?: string;
  actorRole?: string;
  targetUserId?: string;
  companyId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
}

export class AuditService {
  /**
   * Log a security or business operation audit record
   * Only called AFTER the underlying operation succeeds.
   * Never stores sensitive credentials or secrets.
   */
  static async log(entry: AuditLogEntry): Promise<boolean> {
    try {
      const activeSupport = SupportSessionClient.get();
      let finalActorUserId = entry.actorUserId;
      let finalActorRole = entry.actorRole;
      let finalTargetUserId = entry.targetUserId;
      let finalMetadata = { ...(entry.metadata || {}) };

      if (activeSupport?.session) {
        // Enforce dual identity during Support Mode
        finalActorUserId = activeSupport.session.adminUserId;
        finalActorRole = "admin";
        if (!finalTargetUserId) {
          finalTargetUserId = activeSupport.session.targetUserId;
        }
        finalMetadata.support_session_id = activeSupport.session.id;
        finalMetadata.is_support_session = true;
        finalMetadata.support_reason = activeSupport.session.reason;
        finalMetadata.support_admin_email = activeSupport.session.adminEmail;
      } else if (!finalActorUserId) {
        try {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user?.id) {
            finalActorUserId = authData.user.id;
          }
        } catch {
          // No active auth session
        }
      }

      const sanitizedOldData = entry.oldData ? sanitizeAuditData(entry.oldData) : {};
      const sanitizedNewData = entry.newData ? sanitizeAuditData(entry.newData) : {};
      const sanitizedMetadata = sanitizeAuditData(finalMetadata);

      const payload: any = {
        actor_user_id: finalActorUserId || null,
        actor_id: entry.actorId || finalActorUserId || "anonymous",
        actor_role: finalActorRole || "system",
        target_user_id: finalTargetUserId || null,
        company_id: entry.companyId || null,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        old_data: sanitizedOldData,
        new_data: sanitizedNewData,
        metadata: sanitizedMetadata,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("audit_logs" as any).insert(payload);

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

  /**
   * Fetch audit logs scoped to authorized user/company
   */
  static async getAuditLogs(options?: {
    limit?: number;
    offset?: number;
    entityType?: string;
    action?: string;
    companyId?: string;
    targetUserId?: string;
  }): Promise<StoredAuditLog[]> {
    try {
      let query = supabase
        .from("audit_logs" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (options?.entityType && options.entityType !== "all") {
        query = query.eq("entity_type", options.entityType);
      }
      if (options?.action && options.action !== "all") {
        query = query.ilike("action", `%${options.action}%`);
      }
      if (options?.companyId) {
        query = query.eq("company_id", options.companyId);
      }
      if (options?.targetUserId) {
        query = query.eq("target_user_id", options.targetUserId);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      } else {
        query = query.limit(100);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
      }

      const { data, error } = await query;
      if (error || !data) {
        console.warn("[AuditService] Failed to fetch audit logs:", error?.message);
        return [];
      }

      return data.map((r: any) => ({
        id: r.id,
        actorUserId: r.actor_user_id,
        actorId: r.actor_id,
        actorRole: r.actor_role,
        targetUserId: r.target_user_id,
        companyId: r.company_id,
        action: r.action,
        entityType: r.entity_type,
        entityId: r.entity_id,
        oldData: r.old_data || {},
        newData: r.new_data || {},
        metadata: r.metadata || {},
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.warn("[AuditService] Unexpected error querying audit logs:", err);
      return [];
    }
  }
}
