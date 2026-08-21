import { supabase } from "./client";
import { Application, SwipeInteraction } from "../../types";
import { AuditService } from "./audit";

export class ApplicationsService {
  /**
   * Fetch all applications with joined candidate, job, and company info
   */
  static async getApplications(): Promise<Application[]> {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*, candidates(*), jobs(*), companies(*)");

      if (error || !data) {
        console.warn("[ApplicationsService] Failed to fetch applications:", error?.message);
        return [];
      }

      return data.map((app: any) => {
        const cand = app.candidates || {};
        const job = app.jobs || {};
        const comp = app.companies || {};

        return {
          id: app.id,
          jobId: app.job_id,
          candidateId: app.candidate_id,
          companyId: app.company_id,
          candidateName: cand.full_name || "Applicant",
          candidateHeadline: cand.headline || "",
          candidatePhoto: cand.profile_photo || "",
          candidateLocation: cand.location || "",
          candidateSkills: cand.skills || [],
          candidateExpYears: Number(cand.years_of_experience || 0),
          candidateEmail: cand.email || "",
          candidatePhone: cand.phone || "",
          candidateBio: cand.bio || "",
          candidateExpectedSalary: cand.expected_salary,
          candidateWorkPreference: cand.work_preference,
          candidateExperienceList: cand.experience,
          candidateEducationList: cand.education,
          candidateProjectsList: cand.projects,
          jobTitle: job.title || "Position",
          companyName: comp.company_name || "Company",
          companyLogo: comp.logo || "",
          jobLocation: job.location || "",
          jobSalary: job.salary || "",
          jobWorkMode: job.work_mode || "Hybrid",
          status: app.status || "applied",
          appliedAt: app.applied_at,
          lastUpdatedAt: app.last_updated_at,
          matchScore: app.match_score || 85,
          matchReasons: app.match_reasons || [],
          matchConcerns: app.match_concerns || [],
          aiSummary: app.ai_summary || "",
          matchedSkills: app.matched_skills || [],
          missingSkills: app.missing_skills || [],
          fitVerdict: app.fit_verdict || undefined,
          strengths: app.strengths || [],
          interviewQuestions: app.interview_questions || [],
          interviewDetails: app.interview_details || undefined,
          notes: app.notes || undefined,
          isExpired: !!app.is_expired,
          companySlaBadge: app.company_sla_badge || undefined,
          companySlaAvgHours: app.company_sla_avg_hours ? Number(app.company_sla_avg_hours) : undefined,
          slaDeadline: app.sla_deadline || undefined,
          pulseSteps: app.pulse_steps || [],
          constructiveFeedback: app.constructive_feedback || undefined,
          timeline: app.timeline || [],
          hiddenFromCompany: !!app.hidden_from_company,
          deletedByCompany: !!app.deleted_by_company,
          rejectedAt: app.rejected_at || undefined,
          rejectionReason: app.rejection_reason || undefined,
        };
      });
    } catch (err) {
      console.warn("[ApplicationsService] Error fetching applications:", err);
      return [];
    }
  }

  /**
   * Save or update an application
   */
  static async saveApplication(app: Application): Promise<boolean> {
    try {
      const { error } = await supabase.from("applications").upsert({
        id: app.id,
        job_id: app.jobId,
        candidate_id: app.candidateId,
        company_id: app.companyId,
        status: app.status,
        match_score: app.matchScore,
        fit_verdict: app.fitVerdict,
        matched_skills: app.matchedSkills,
        missing_skills: app.missingSkills,
        match_reasons: app.matchReasons,
        match_concerns: app.matchConcerns,
        strengths: app.strengths,
        ai_summary: app.aiSummary,
        interview_questions: app.interviewQuestions,
        interview_details: app.interviewDetails as any,
        notes: app.notes,
        company_sla_badge: app.companySlaBadge,
        company_sla_avg_hours: app.companySlaAvgHours,
        sla_deadline: app.slaDeadline,
        pulse_steps: app.pulseSteps as any,
        constructive_feedback: app.constructiveFeedback as any,
        timeline: app.timeline as any,
        is_expired: app.isExpired,
        hidden_from_company: app.hiddenFromCompany,
        deleted_by_company: app.deletedByCompany,
        rejected_at: app.rejectedAt,
        rejection_reason: app.rejectionReason,
        applied_at: app.appliedAt || new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
      });

      if (error) {
        console.warn("[ApplicationsService] Failed to save application:", error.message);
        return false;
      }

      await AuditService.log({
        actorId: app.companyId || app.candidateId,
        actorRole: "system",
        action: `application_status_${app.status}`,
        entityType: "application",
        entityId: app.id,
        metadata: { jobId: app.jobId, status: app.status, matchScore: app.matchScore },
      });

      return true;
    } catch (err) {
      console.warn("[ApplicationsService] Unexpected error saving application:", err);
      return false;
    }
  }

  /**
   * Log candidate swipe interaction
   */
  static async logSwipe(interaction: SwipeInteraction): Promise<boolean> {
    try {
      const { error } = await (supabase.from("swipe_interactions" as any) as any).insert({
        candidate_id: interaction.candidateId,
        job_id: interaction.jobId,
        action: interaction.action,
        job_tags: interaction.jobTags || [],
        work_mode: interaction.workMode,
      });

      if (error) {
        console.warn("[ApplicationsService] Failed to log swipe interaction:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn("[ApplicationsService] Swipe interaction logging failed:", err);
      return false;
    }
  }
}
