import { supabase } from "./client";
import { Job } from "../../types";
import { AuditService } from "./audit";

export class JobsService {
  /**
   * Fetch jobs with joined company info.
   * If companyId is passed, scopes specifically to that company in addition to database RLS.
   */
  static async getJobs(companyId?: string): Promise<Job[]> {
    try {
      let query = supabase.from("jobs").select("*, companies(*)");
      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query;

      if (error || !data) {
        console.warn("[JobsService] Failed to fetch jobs:", error?.message);
        return [];
      }

      return data.map((j: any) => {
        const comp = j.companies || {};
        return {
          id: j.id,
          companyId: j.company_id,
          companyName: comp.company_name || "Company",
          companyLogo: comp.logo || "",
          companyIndustry: comp.industry,
          companySize: comp.size,
          title: j.title,
          department: j.department,
          location: j.location,
          workMode: j.work_mode,
          experience: j.experience,
          salary: j.salary,
          openings: j.openings || 1,
          description: j.description,
          responsibilities: j.responsibilities || [],
          requirements: j.requirements || [],
          requiredSkills: j.required_skills || [],
          preferredSkills: j.preferred_skills || [],
          status: j.status || "active",
          matchScore: j.match_score || undefined,
          matchReasons: j.match_reasons || [],
          matchConcerns: j.match_concerns || [],
          aiSummary: j.ai_summary || undefined,
          isFeatured: !!j.is_featured,
          createdAt: j.created_at,
          updatedAt: j.updated_at,
        };
      });
    } catch (err) {
      console.warn("[JobsService] Error fetching jobs:", err);
      return [];
    }
  }

  /**
   * Save or insert job posting
   */
  static async saveJob(job: Job): Promise<boolean> {
    try {
      const { data: existing } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", job.id)
        .maybeSingle();

      const { error } = await supabase.from("jobs").upsert({
        id: job.id,
        company_id: job.companyId,
        title: job.title,
        department: job.department,
        location: job.location,
        work_mode: job.workMode,
        experience: job.experience,
        salary: job.salary,
        openings: job.openings,
        description: job.description,
        responsibilities: job.responsibilities,
        requirements: job.requirements,
        required_skills: job.requiredSkills,
        preferred_skills: job.preferredSkills,
        status: job.status,
        match_score: job.matchScore,
        match_reasons: job.matchReasons,
        match_concerns: job.matchConcerns,
        ai_summary: job.aiSummary,
        is_featured: job.isFeatured || false,
        created_at: job.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.warn("[JobsService] Failed to upsert job (possible RLS violation):", error.message);
        return false;
      }

      await AuditService.log({
        actorRole: "company",
        companyId: job.companyId,
        action: existing ? "job_updated" : "job_created",
        entityType: "job",
        entityId: job.id,
        oldData: existing
          ? {
              title: existing.title,
              department: existing.department,
              salary: existing.salary,
              status: existing.status,
              workMode: existing.work_mode,
            }
          : {},
        newData: {
          title: job.title,
          department: job.department,
          salary: job.salary,
          status: job.status,
          workMode: job.workMode,
        },
        metadata: { title: job.title, status: job.status, isFeatured: job.isFeatured },
      });

      return true;
    } catch (err) {
      console.warn("[JobsService] Unexpected error saving job:", err);
      return false;
    }
  }

  /**
   * Update Job Status or Feature Flag (Admin or Company Moderation Action)
   */
  static async updateJobStatus(
    id: string,
    status: Job["status"],
    isFeatured?: boolean,
    actorId = "admin"
  ): Promise<boolean> {
    try {
      const { data: existing } = await supabase
        .from("jobs")
        .select("title, status, is_featured, company_id")
        .eq("id", id)
        .maybeSingle();

      const payload: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (isFeatured !== undefined) {
        payload.is_featured = isFeatured;
      }

      const { error } = await supabase
        .from("jobs")
        .update(payload)
        .eq("id", id);

      if (error) {
        console.error("[JobsService] Failed to update job status:", error.message);
        return false;
      }

      await AuditService.log({
        actorId,
        actorRole: actorId === "admin" ? "admin" : "company",
        companyId: existing?.company_id,
        action: "job_status_changed",
        entityType: "job",
        entityId: id,
        oldData: { status: existing?.status, isFeatured: existing?.is_featured },
        newData: { status, isFeatured: isFeatured !== undefined ? isFeatured : existing?.is_featured },
        metadata: { title: existing?.title, status, isFeatured },
      });

      return true;
    } catch (err) {
      console.error("[JobsService] Error updating job status:", err);
      return false;
    }
  }

  /**
   * Delete job posting by ID
   */
  static async deleteJob(id: string, actorId = "admin"): Promise<boolean> {
    try {
      const { data: existing } = await supabase
        .from("jobs")
        .select("title, company_id")
        .eq("id", id)
        .maybeSingle();

      // 1. Delete dependent relations first to avoid foreign key errors
      await supabase.from("swipe_interactions").delete().eq("job_id", id);
      await supabase.from("talent_bids").delete().eq("job_id", id);
      await supabase.from("applications").delete().eq("job_id", id);

      const { error, count } = await supabase
        .from("jobs")
        .delete({ count: "exact" })
        .eq("id", id);

      if (error) {
        console.warn("[JobsService] Failed to delete job (possible RLS violation):", error.message);
        return false;
      }

      if (count === 0) {
        console.warn(`[JobsService] Delete job '${id}': 0 rows deleted`);
        return false;
      }

      await AuditService.log({
        actorId,
        actorRole: actorId === "admin" ? "admin" : "company",
        companyId: existing?.company_id,
        action: "job_deleted",
        entityType: "job",
        entityId: id,
        oldData: { id, title: existing?.title },
        metadata: { title: existing?.title },
      });

      return true;
    } catch (err) {
      console.warn("[JobsService] Unexpected error deleting job:", err);
      return false;
    }
  }
}
