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
        created_at: job.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.warn("[JobsService] Failed to upsert job (possible RLS violation):", error.message);
        return false;
      }

      await AuditService.log({
        actorId: job.companyId,
        actorRole: "company",
        action: "save_job_posting",
        entityType: "job",
        entityId: job.id,
        metadata: { title: job.title, status: job.status },
      });

      return true;
    } catch (err) {
      console.warn("[JobsService] Unexpected error saving job:", err);
      return false;
    }
  }

  /**
   * Delete job posting by ID
   */
  static async deleteJob(id: string): Promise<boolean> {
    try {
      const { error, count } = await supabase
        .from("jobs")
        .delete({ count: "exact" })
        .eq("id", id);

      if (error) {
        console.warn("[JobsService] Failed to delete job (possible RLS violation):", error.message);
        return false;
      }

      if (count === 0) {
        console.warn(`[JobsService] Delete job '${id}': 0 rows deleted (blocked by RLS or not found)`);
        return false;
      }

      await AuditService.log({
        actorId: "company_actor",
        actorRole: "company",
        action: "delete_job_posting",
        entityType: "job",
        entityId: id,
      });

      return true;
    } catch (err) {
      console.warn("[JobsService] Unexpected error deleting job:", err);
      return false;
    }
  }
}
