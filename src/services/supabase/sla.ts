import { supabase } from "./client";
import { CompanySLAInfo } from "../../types";

export class SLAService {
  /**
   * Fetch company SLA metrics
   */
  static async getCompanySLAs(): Promise<Record<string, CompanySLAInfo>> {
    try {
      const { data, error } = await supabase.from("company_slas").select("*");
      if (error || !data) return {};

      const map: Record<string, CompanySLAInfo> = {};
      data.forEach((s) => {
        map[s.company_id] = {
          companyId: s.company_id,
          companyName: s.company_name,
          avgResponseHours: Number(s.avg_response_hours),
          ghostingRatePct: Number(s.ghosting_rate_pct),
          feedbackGuaranteePct: Number(s.feedback_guarantee_pct),
          badgeLabel: s.badge_label,
          badgeTier: s.badge_tier as any,
          totalApplicationsReviewed: s.total_applications_reviewed,
        };
      });
      return map;
    } catch (err) {
      console.warn("[SLAService] Error fetching SLAs:", err);
      return {};
    }
  }
}
