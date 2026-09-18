import { supabase } from "./client";
import { CandidateProfile } from "../../types";
import { AuditService } from "./audit";

export class CandidatesService {
  /**
   * Fetch all candidate profiles
   */
  static async getCandidates(): Promise<CandidateProfile[]> {
    try {
      const { data, error } = await supabase.from("candidates").select("*");
      if (error || !data) {
        console.warn("[CandidatesService] Failed to fetch candidates:", error?.message);
        return [];
      }

      return data.map((cand) => ({
        id: cand.id,
        userId: cand.user_id,
        fullName: cand.full_name,
        headline: cand.headline,
        email: cand.email,
        phone: cand.phone || "",
        location: cand.location,
        workPreference: (cand.work_preference as any) || "Hybrid",
        yearsOfExperience: Number(cand.years_of_experience || 0),
        skills: cand.skills || [],
        possibleRoles: cand.possible_roles || [],
        education: (cand.education as any) || [],
        experience: (cand.experience as any) || [],
        projects: (cand.projects as any) || [],
        certifications: cand.certifications || [],
        expectedSalary: cand.expected_salary || "",
        preferredRole: cand.preferred_role || "",
        bio: cand.bio || "",
        profilePhoto: cand.profile_photo || "",
        photoSettings: (cand.photo_settings as any) || undefined,
        profileStrength: Number(cand.profile_strength || 0),
        isCompleted: !!cand.is_completed,
        resumeFilename: cand.resume_filename || undefined,
        resumeText: cand.resume_text || undefined,
        commissionAgreementSigned: !!cand.commission_agreement_signed,
        commissionAgreementSignedAt: cand.commission_agreement_signed_at || undefined,
        commissionAgreementDocId: cand.commission_agreement_doc_id || undefined,
        commissionAgreementSignature: (cand.commission_agreement_signature as any) || undefined,
        learnedPreferences: (cand.learned_preferences as any) || undefined,
        isSuspended: !!cand.is_suspended,
        githubData: (cand.github_data as any) || undefined,
      }));
    } catch (err) {
      console.warn("[CandidatesService] Error fetching candidates:", err);
      return [];
    }
  }

  /**
   * Save or update candidate profile
   */
  static async saveCandidate(cand: CandidateProfile): Promise<boolean> {
    try {
      // 1. Fetch existing candidate to calculate diff and granular events
      const { data: existing } = await supabase
        .from("candidates")
        .select("*")
        .eq("id", cand.id)
        .maybeSingle();

      const payload: any = {
        id: cand.id,
        full_name: cand.fullName,
        headline: cand.headline,
        email: cand.email,
        phone: cand.phone,
        location: cand.location,
        work_preference: cand.workPreference,
        years_of_experience: cand.yearsOfExperience,
        skills: cand.skills,
        possible_roles: cand.possibleRoles,
        education: cand.education as any,
        experience: cand.experience as any,
        projects: cand.projects as any,
        certifications: cand.certifications,
        expected_salary: cand.expectedSalary,
        preferred_role: cand.preferredRole,
        bio: cand.bio,
        profile_photo: cand.profilePhoto,
        photo_settings: (cand.photoSettings as any) || null,
        profile_strength: cand.profileStrength,
        is_completed: cand.isCompleted,
        resume_filename: cand.resumeFilename,
        resume_text: cand.resumeText,
        commission_agreement_signed: cand.commissionAgreementSigned || false,
        commission_agreement_signed_at: cand.commissionAgreementSignedAt || null,
        commission_agreement_doc_id: cand.commissionAgreementDocId || null,
        commission_agreement_signature: cand.commissionAgreementSignature || null,
        learned_preferences: cand.learnedPreferences as any,
        is_suspended: cand.isSuspended || false,
        github_data: cand.githubData as any,
        updated_at: new Date().toISOString(),
      };

      if (cand.userId) {
        payload.user_id = cand.userId;
      } else if (existing?.user_id) {
        payload.user_id = existing.user_id;
      }

      const { error } = await supabase.from("candidates").upsert(payload);
      if (error) {
        console.warn("[CandidatesService] Failed to upsert candidate:", error.message);
        return false;
      }

      const targetUserId = payload.user_id;

      // 2. Granular sub-events
      // A. Commission agreement signed
      if (!existing?.commission_agreement_signed && cand.commissionAgreementSigned) {
        await AuditService.log({
          actorUserId: targetUserId,
          actorRole: "candidate",
          targetUserId,
          action: "commission_agreement_signed",
          entityType: "candidate",
          entityId: cand.id,
          oldData: { commissionAgreementSigned: false },
          newData: {
            commissionAgreementSigned: true,
            docId: cand.commissionAgreementDocId,
            signedAt: cand.commissionAgreementSignedAt,
          },
          metadata: { docId: cand.commissionAgreementDocId },
        });
      }

      // B. Resume uploaded or replaced
      if (cand.resumeFilename && cand.resumeFilename !== existing?.resume_filename) {
        const isReplacement = !!existing?.resume_filename;
        await AuditService.log({
          actorUserId: targetUserId,
          actorRole: "candidate",
          targetUserId,
          action: isReplacement ? "resume_replaced" : "resume_uploaded",
          entityType: "candidate",
          entityId: cand.id,
          oldData: { resumeFilename: existing?.resume_filename },
          newData: { resumeFilename: cand.resumeFilename },
          metadata: { filename: cand.resumeFilename, isReplacement },
        });
      }

      // C. Skills updated
      const oldSkillsStr = JSON.stringify(existing?.skills || []);
      const newSkillsStr = JSON.stringify(cand.skills || []);
      if (oldSkillsStr !== newSkillsStr) {
        await AuditService.log({
          actorUserId: targetUserId,
          actorRole: "candidate",
          targetUserId,
          action: "skills_updated",
          entityType: "candidate",
          entityId: cand.id,
          oldData: { skills: existing?.skills || [] },
          newData: { skills: cand.skills || [] },
          metadata: { skillsCount: cand.skills?.length || 0 },
        });
      }

      // D. Education or Experience updated
      const oldEduStr = JSON.stringify(existing?.education || []);
      const newEduStr = JSON.stringify(cand.education || []);
      const oldExpStr = JSON.stringify(existing?.experience || []);
      const newExpStr = JSON.stringify(cand.experience || []);
      if (oldEduStr !== newEduStr || oldExpStr !== newExpStr) {
        await AuditService.log({
          actorUserId: targetUserId,
          actorRole: "candidate",
          targetUserId,
          action: "education_experience_updated",
          entityType: "candidate",
          entityId: cand.id,
          oldData: { education: existing?.education || [], experience: existing?.experience || [] },
          newData: { education: cand.education || [], experience: cand.experience || [] },
        });
      }

      // E. General profile update
      await AuditService.log({
        actorUserId: targetUserId,
        actorRole: "candidate",
        targetUserId,
        action: existing ? "update_candidate_profile" : "create_candidate_profile",
        entityType: "candidate",
        entityId: cand.id,
        oldData: existing
          ? {
              fullName: existing.full_name,
              headline: existing.headline,
              location: existing.location,
              workPreference: existing.work_preference,
              yearsOfExperience: existing.years_of_experience,
            }
          : {},
        newData: {
          fullName: cand.fullName,
          headline: cand.headline,
          location: cand.location,
          workPreference: cand.workPreference,
          yearsOfExperience: cand.yearsOfExperience,
        },
        metadata: { fullName: cand.fullName, isCompleted: cand.isCompleted },
      });

      return true;
    } catch (err) {
      console.warn("[CandidatesService] Unexpected error saving candidate:", err);
      return false;
    }
  }

  /**
   * Suspend or unsuspend a candidate (Admin Action)
   */
  static async suspendCandidate(id: string, isSuspended: boolean, actorId = "admin"): Promise<boolean> {
    try {
      const { data: existing } = await supabase.from("candidates").select("user_id").eq("id", id).maybeSingle();

      const { error } = await supabase
        .from("candidates")
        .update({ is_suspended: isSuspended, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("[CandidatesService] Failed to suspend/unsuspend candidate:", error.message);
        return false;
      }

      await AuditService.log({
        actorId,
        actorRole: "admin",
        targetUserId: existing?.user_id,
        action: isSuspended ? "candidate_suspended" : "candidate_unsuspended",
        entityType: "candidate",
        entityId: id,
        oldData: { isSuspended: !isSuspended },
        newData: { isSuspended },
        metadata: { isSuspended },
      });

      return true;
    } catch (err) {
      console.error("[CandidatesService] Error updating candidate suspension:", err);
      return false;
    }
  }

  /**
   * Verify candidate skills (Admin Action)
   */
  static async verifyCandidateSkills(id: string, skills: string[], actorId = "admin"): Promise<boolean> {
    try {
      const { data: existing } = await supabase.from("candidates").select("user_id, skills").eq("id", id).maybeSingle();

      const { error } = await supabase
        .from("candidates")
        .update({ skills, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("[CandidatesService] Failed to update candidate skills:", error.message);
        return false;
      }

      await AuditService.log({
        actorId,
        actorRole: "admin",
        targetUserId: existing?.user_id,
        action: "candidate_skills_verified",
        entityType: "candidate",
        entityId: id,
        oldData: { skills: existing?.skills || [] },
        newData: { skills },
        metadata: { skillsCount: skills.length },
      });

      return true;
    } catch (err) {
      console.error("[CandidatesService] Error verifying candidate skills:", err);
      return false;
    }
  }

  /**
   * Reset learned swipe preferences (Admin Action)
   */
  static async resetLearnedPreferences(id: string, actorId = "admin"): Promise<boolean> {
    try {
      const { data: existing } = await supabase.from("candidates").select("user_id, learned_preferences").eq("id", id).maybeSingle();

      const emptyPrefs = {
        swipesCount: 0,
        dislikedSkills: [],
        preferredSkills: [],
        preferredLocations: [],
        preferredWorkModes: [],
      };

      const { error } = await supabase
        .from("candidates")
        .update({ learned_preferences: emptyPrefs, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("[CandidatesService] Failed to reset learned preferences:", error.message);
        return false;
      }

      await AuditService.log({
        actorId,
        actorRole: "admin",
        targetUserId: existing?.user_id,
        action: "candidate_preferences_reset",
        entityType: "candidate",
        entityId: id,
        oldData: { learnedPreferences: existing?.learned_preferences },
        newData: { learnedPreferences: emptyPrefs },
      });

      return true;
    } catch (err) {
      console.error("[CandidatesService] Error resetting candidate preferences:", err);
      return false;
    }
  }

  /**
   * Permanently delete candidate account (Admin Action with Confirmation)
   */
  static async deleteCandidate(id: string, actorId = "admin"): Promise<boolean> {
    try {
      const { data: existing } = await supabase.from("candidates").select("user_id, full_name").eq("id", id).maybeSingle();

      // 1. Delete dependent records first to satisfy foreign keys
      await supabase.from("swipe_interactions").delete().eq("candidate_id", id);
      await supabase.from("talent_bids").delete().eq("candidate_id", id);
      await supabase.from("blind_talent_profiles").delete().eq("candidate_id", id);
      await supabase.from("applications").delete().eq("candidate_id", id);

      // 2. Delete candidate record
      const { error } = await supabase.from("candidates").delete().eq("id", id);
      if (error) {
        console.error("[CandidatesService] Failed to delete candidate:", error.message);
        return false;
      }

      await AuditService.log({
        actorId,
        actorRole: "admin",
        targetUserId: existing?.user_id,
        action: "candidate_deleted",
        entityType: "candidate",
        entityId: id,
        oldData: { candidateId: id, fullName: existing?.full_name },
      });

      return true;
    } catch (err) {
      console.error("[CandidatesService] Error deleting candidate:", err);
      return false;
    }
  }
}
