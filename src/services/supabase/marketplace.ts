import { supabase } from "./client";
import { BlindTalentProfile, TalentBid } from "../../types";
import { AuditService } from "./audit";

export class MarketplaceService {
  /**
   * Fetch all Blind Talent Profiles
   */
  static async getBlindTalentProfiles(): Promise<BlindTalentProfile[]> {
    try {
      const { data, error } = await supabase
        .from("blind_talent_profiles")
        .select("*");

      if (error || !data) {
        console.warn("[MarketplaceService] Failed to fetch blind talent profiles:", error?.message);
        return [];
      }

      return data.map((b) => ({
        id: b.id,
        candidateId: b.candidate_id,
        anonymousHandle: b.anonymous_handle,
        avatarSeed: b.avatar_seed,
        headline: b.headline,
        experienceYears: Number(b.experience_years),
        location: b.location,
        workPreference: b.work_preference,
        verifiedSkills: (b.verified_skills as any) || [],
        proofOfWork: (b.proof_of_work as any) || [],
        targetSalaryRange: b.target_salary_range,
        preferredRoles: b.preferred_roles || [],
        availabilityNotice: b.availability_notice,
        superpowers: b.superpowers || [],
        isListed: !!b.is_listed,
        activeBidsCount: b.active_bids_count || 0,
      }));
    } catch (err) {
      console.warn("[MarketplaceService] Error fetching blind talent:", err);
      return [];
    }
  }

  /**
   * Save or update a Blind Talent Profile
   */
  static async saveBlindTalentProfile(profile: BlindTalentProfile): Promise<boolean> {
    try {
      const { error } = await supabase.from("blind_talent_profiles").upsert({
        id: profile.id,
        candidate_id: profile.candidateId,
        anonymous_handle: profile.anonymousHandle,
        avatar_seed: profile.avatarSeed,
        headline: profile.headline,
        experience_years: profile.experienceYears,
        location: profile.location,
        work_preference: profile.workPreference,
        verified_skills: profile.verifiedSkills as any,
        proof_of_work: profile.proofOfWork as any,
        target_salary_range: profile.targetSalaryRange,
        preferred_roles: profile.preferredRoles,
        availability_notice: profile.availabilityNotice,
        superpowers: profile.superpowers,
        is_listed: profile.isListed,
        active_bids_count: profile.activeBidsCount,
      });

      if (error) {
        console.warn("[MarketplaceService] Failed to save blind talent profile:", error.message);
        return false;
      }

      await AuditService.log({
        actorId: profile.candidateId,
        actorRole: "candidate",
        action: profile.isListed ? "publish_blind_pitch" : "pause_blind_pitch",
        entityType: "bid",
        entityId: profile.id,
        metadata: { handle: profile.anonymousHandle, isListed: profile.isListed },
      });

      return true;
    } catch (err) {
      console.warn("[MarketplaceService] Unexpected error saving blind profile:", err);
      return false;
    }
  }

  /**
   * Fetch Talent Bids with joined company details
   */
  static async getTalentBids(): Promise<TalentBid[]> {
    try {
      const { data, error } = await supabase
        .from("talent_bids")
        .select("*, companies(*)");

      if (error || !data) {
        console.warn("[MarketplaceService] Failed to fetch talent bids:", error?.message);
        return [];
      }

      return data.map((b: any) => {
        const comp = b.companies || {};
        return {
          id: b.id,
          blindTalentId: b.blind_talent_id,
          candidateId: b.candidate_id,
          companyId: b.company_id,
          companyName: comp.company_name || "Company",
          companyLogo: comp.logo || "",
          companyIndustry: comp.industry || "Tech",
          companyLocation: comp.location || "Remote",
          jobId: b.job_id || undefined,
          jobTitle: b.job_title,
          seniorityTier: b.seniority_tier,
          salaryOffer: b.salary_offer,
          bonusAndEquity: b.bonus_and_equity || undefined,
          workMode: b.work_mode,
          pitchMessage: b.pitch_message,
          perks: b.perks || [],
          status: b.status || "pending",
          candidateRevealedName: b.candidate_revealed_name || undefined,
          candidateRevealedEmail: b.candidate_revealed_email || undefined,
          candidateRevealedPhone: b.candidate_revealed_phone || undefined,
          candidateRevealedPhoto: b.candidate_revealed_photo || undefined,
          counterOfferDetails: b.counter_offer_details || undefined,
          expiresAt: b.expires_at,
          createdAt: b.created_at,
        };
      });
    } catch (err) {
      console.warn("[MarketplaceService] Error fetching bids:", err);
      return [];
    }
  }

  /**
   * Save or update a talent bid
   */
  static async saveTalentBid(bid: TalentBid): Promise<boolean> {
    try {
      const { error } = await supabase.from("talent_bids").upsert({
        id: bid.id,
        blind_talent_id: bid.blindTalentId,
        candidate_id: bid.candidateId,
        company_id: bid.companyId,
        job_id: bid.jobId,
        job_title: bid.jobTitle,
        seniority_tier: bid.seniorityTier,
        salary_offer: bid.salaryOffer,
        bonus_and_equity: bid.bonusAndEquity,
        work_mode: bid.workMode,
        pitch_message: bid.pitchMessage,
        perks: bid.perks,
        status: bid.status,
        candidate_revealed_name: bid.candidateRevealedName,
        candidate_revealed_email: bid.candidateRevealedEmail,
        candidate_revealed_phone: bid.candidateRevealedPhone,
        candidate_revealed_photo: bid.candidateRevealedPhoto,
        counter_offer_details: bid.counterOfferDetails as any,
        expires_at: bid.expiresAt,
        created_at: bid.createdAt || new Date().toISOString(),
      });

      if (error) {
        console.warn("[MarketplaceService] Failed to save talent bid:", error.message);
        return false;
      }

      await AuditService.log({
        actorId: bid.companyId,
        actorRole: "company",
        action: `talent_bid_${bid.status}`,
        entityType: "bid",
        entityId: bid.id,
        metadata: { candidateId: bid.candidateId, status: bid.status, salaryOffer: bid.salaryOffer },
      });

      return true;
    } catch (err) {
      console.warn("[MarketplaceService] Unexpected error saving bid:", err);
      return false;
    }
  }
}
