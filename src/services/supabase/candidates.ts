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
        profileStrength: Number(cand.profile_strength || 0),
        isCompleted: !!cand.is_completed,
        resumeFilename: cand.resume_filename || undefined,
        resumeText: cand.resume_text || undefined,
        commissionAgreementSigned: !!cand.commission_agreement_signed,
        commissionAgreementSignedAt: cand.commission_agreement_signed_at || undefined,
        commissionAgreementDocId: cand.commission_agreement_doc_id || undefined,
        commissionAgreementSignature: (cand.commission_agreement_signature as any) || undefined,
        learnedPreferences: (cand.learned_preferences as any) || undefined,
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
        profile_strength: cand.profileStrength,
        is_completed: cand.isCompleted,
        resume_filename: cand.resumeFilename,
        resume_text: cand.resumeText,
        commission_agreement_signed: cand.commissionAgreementSigned || false,
        commission_agreement_signed_at: cand.commissionAgreementSignedAt || null,
        commission_agreement_doc_id: cand.commissionAgreementDocId || null,
        commission_agreement_signature: cand.commissionAgreementSignature || null,
        learned_preferences: cand.learnedPreferences as any,
        updated_at: new Date().toISOString(),
      };
      if (cand.userId) {
        payload.user_id = cand.userId;
      }
      const { error } = await supabase.from("candidates").upsert(payload);
      if (error) {
        console.warn("[CandidatesService] Failed to upsert candidate:", error.message);
        return false;
      }

      await AuditService.log({
        actorId: cand.userId || cand.id,
        actorRole: "candidate",
        action: "update_candidate_profile",
        entityType: "candidate",
        entityId: cand.id,
        metadata: { fullName: cand.fullName, isCompleted: cand.isCompleted },
      });

      return true;
    } catch (err) {
      console.warn("[CandidatesService] Unexpected error saving candidate:", err);
      return false;
    }
  }
}
