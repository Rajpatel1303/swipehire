import { supabase } from "./client";
import { AdminReport } from "../../types";

export class AdminService {
  /**
   * Fetch Admin Reports
   */
  static async getAdminReports(): Promise<AdminReport[]> {
    try {
      const { data, error } = await supabase.from("admin_reports").select("*");
      if (error || !data) return [];
      return data.map((r) => ({
        id: r.id,
        targetType: r.target_type as any,
        targetId: r.target_id,
        targetName: r.target_name,
        reason: r.reason,
        reportedBy: r.reported_by,
        createdAt: r.created_at,
        status: (r.status as any) || "pending",
      }));
    } catch {
      return [];
    }
  }
}
