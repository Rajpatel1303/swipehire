import { supabase } from "./client";
import { AdminReport } from "../../types";

export interface PlatformMetrics {
  totalCandidates: number;
  totalCompanies: number;
  activeJobs: number;
  totalJobs: number;
  activeApplications: number;
  totalApplications: number;
  activeBids: number;
  totalBids: number;
  totalHired: number;
  verifiedCompanies: number;
  slaCompliancePct: number;
}

export class AdminService {
  /**
   * Verify if a user ID is an authenticated Super Admin
   */
  static async verifyAdminAccess(userId: string): Promise<boolean> {
    try {
      if (!userId) return false;
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) return false;
      return data.role === "admin";
    } catch {
      return false;
    }
  }

  /**
   * Fetch aggregate platform metrics directly from Supabase tables
   */
  static async getPlatformMetrics(): Promise<PlatformMetrics> {
    try {
      const [
        candsRes,
        compsRes,
        jobsRes,
        appsRes,
        bidsRes,
      ] = await Promise.all([
        supabase.from("candidates").select("id, is_completed", { count: "exact" }),
        supabase.from("companies").select("id, is_verified", { count: "exact" }),
        supabase.from("jobs").select("id, status", { count: "exact" }),
        supabase.from("applications").select("id, status, is_expired", { count: "exact" }),
        supabase.from("talent_bids").select("id, status", { count: "exact" }),
      ]);

      const candidates = candsRes.data || [];
      const companies = compsRes.data || [];
      const jobs = jobsRes.data || [];
      const applications = appsRes.data || [];
      const bids = bidsRes.data || [];

      const activeJobs = jobs.filter((j) => j.status === "active").length;
      const activeApps = applications.filter((a) => a.status !== "rejected" && a.status !== "expired").length;
      const hiredCount = applications.filter((a) => a.status === "hired").length;
      const activeBids = bids.filter((b) => b.status === "pending" || b.status === "countered").length;
      const verifiedCompanies = companies.filter((c) => c.is_verified).length;

      // SLA Compliance calculation from real applications
      let compliancePct = 100;
      if (applications.length > 0) {
        const nonExpired = applications.filter((a) => !a.is_expired).length;
        compliancePct = Math.round((nonExpired / applications.length) * 100);
      }

      return {
        totalCandidates: candsRes.count ?? candidates.length,
        totalCompanies: compsRes.count ?? companies.length,
        activeJobs,
        totalJobs: jobsRes.count ?? jobs.length,
        activeApplications: activeApps,
        totalApplications: appsRes.count ?? applications.length,
        activeBids,
        totalBids: bidsRes.count ?? bids.length,
        totalHired: hiredCount,
        verifiedCompanies,
        slaCompliancePct: compliancePct,
      };
    } catch (err) {
      console.warn("[AdminService] Error fetching platform metrics:", err);
      return {
        totalCandidates: 0,
        totalCompanies: 0,
        activeJobs: 0,
        totalJobs: 0,
        activeApplications: 0,
        totalApplications: 0,
        activeBids: 0,
        totalBids: 0,
        totalHired: 0,
        verifiedCompanies: 0,
        slaCompliancePct: 100,
      };
    }
  }

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

  /**
   * Resolve or Dismiss an Admin Report
   */
  static async resolveAdminReport(
    id: string,
    status: "resolved" | "dismissed",
    actorId = "admin"
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("admin_reports")
        .update({ status })
        .eq("id", id);

      if (error) {
        console.error("[AdminService] Failed to resolve admin report:", error.message);
        return false;
      }

      await supabase.from("audit_logs" as any).insert({
        actor_id: actorId,
        actor_role: "admin",
        action: `report_${status}`,
        entity_type: "admin",
        entity_id: id,
        metadata: { status },
        created_at: new Date().toISOString(),
      });

      return true;
    } catch (err) {
      console.error("[AdminService] Error resolving report:", err);
      return false;
    }
  }
}
