import { useState, useCallback } from "react";
import { BlindTalentProfile, TalentBid, CandidateProfile, Application } from "../types";
import { MarketplaceService, ApplicationsService } from "../services/supabase";

export function useMarketplace(
  initialProfiles: BlindTalentProfile[] = [],
  initialBids: TalentBid[] = []
) {
  const [blindTalentProfiles, setBlindTalentProfiles] = useState<BlindTalentProfile[]>(initialProfiles);
  const [talentBids, setTalentBids] = useState<TalentBid[]>(initialBids);

  /**
   * Save or update Blind Talent Profile
   */
  const saveBlindProfile = useCallback(async (profile: BlindTalentProfile): Promise<boolean> => {
    setBlindTalentProfiles((prev) => {
      const idx = prev.findIndex((p) => p.id === profile.id || p.candidateId === profile.candidateId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = profile;
        return copy;
      }
      return [profile, ...prev];
    });

    return await MarketplaceService.saveBlindTalentProfile(profile);
  }, []);

  /**
   * Submit Recruiter Upfront Bid with 72-Hour SLA
   */
  const submitRecruiterBid = useCallback(
    async (
      bidData: Omit<TalentBid, "id" | "status" | "createdAt" | "expiresAt">,
      onNotify?: (notif: any) => void
    ): Promise<{ success: boolean; bidId?: string }> => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();
      const bidId = `bid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const newBid: TalentBid = {
        ...bidData,
        id: bidId,
        status: "pending",
        createdAt: now.toISOString(),
        expiresAt,
      };

      setTalentBids((prev) => [newBid, ...prev]);

      // Update active bids count on blind profile
      setBlindTalentProfiles((prev) =>
        prev.map((p) =>
          p.id === bidData.blindTalentId || p.candidateId === bidData.candidateId
            ? { ...p, activeBidsCount: (p.activeBidsCount || 0) + 1 }
            : p
        )
      );

      const saved = await MarketplaceService.saveTalentBid(newBid);

      if (onNotify) {
        onNotify({
          recipientId: bidData.candidateId,
          role: "candidate",
          type: "offer",
          title: `Exclusive Upfront Bid from ${bidData.companyName || "a Recruiter"}!`,
          message: `${bidData.companyName || "A top company"} offered ${bidData.salaryOffer} for ${bidData.jobTitle}. You have 72 hours to respond!`,
          linkAction: "blind-marketplace",
        });
      }

      return { success: saved, bidId };
    },
    []
  );

  /**
   * Candidate Responds to Talent Bid (Accept & Reveal, Counter, Decline)
   */
  const respondToTalentBid = useCallback(
    async (
      bidId: string,
      action: "accept" | "counter" | "decline",
      candidate: CandidateProfile,
      counterDetails?: { targetSalary: string; notes: string },
      onApplicationCreated?: (app: Application) => void,
      onNotify?: (notif: any) => void,
      onCelebrate?: () => void
    ): Promise<{ success: boolean }> => {
      const targetBid = talentBids.find((b) => b.id === bidId);
      if (!targetBid) return { success: false };

      // Ensure not already expired
      if (new Date(targetBid.expiresAt).getTime() < Date.now()) {
        const expiredBid: TalentBid = { ...targetBid, status: "expired" };
        setTalentBids((prev) => prev.map((b) => (b.id === bidId ? expiredBid : b)));
        await MarketplaceService.saveTalentBid(expiredBid);
        return { success: false };
      }

      let updatedStatus: "accepted" | "countered" | "declined" = "declined";
      let updatedBid: TalentBid = { ...targetBid };

      if (action === "accept") {
        updatedStatus = "accepted";
        updatedBid = {
          ...targetBid,
          status: "accepted",
          candidateRevealedName: candidate.fullName || "Candidate",
          candidateRevealedEmail: candidate.email || "",
          candidateRevealedPhone: candidate.phone || "",
          candidateRevealedPhoto: candidate.profilePhoto || "",
        };

        // Create fast-track interview application in hiring pipeline
        const newApp: Application = {
          id: `app_bid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          jobId: targetBid.jobId || `job_${targetBid.id}`,
          candidateId: candidate.id,
          companyId: targetBid.companyId,
          candidateName: candidate.fullName || "Candidate",
          candidateHeadline: candidate.headline || "",
          candidatePhoto: candidate.profilePhoto || "",
          candidateLocation: candidate.location || "",
          candidateSkills: candidate.skills || [],
          candidateExpYears: candidate.yearsOfExperience || 0,
          candidateEmail: candidate.email || "",
          candidatePhone: candidate.phone || "",
          candidateBio: candidate.bio || "",
          jobTitle: targetBid.jobTitle,
          companyName: targetBid.companyName,
          companyLogo: targetBid.companyLogo,
          jobLocation: targetBid.companyLocation,
          jobSalary: targetBid.salaryOffer,
          jobWorkMode: targetBid.workMode,
          status: "interview",
          appliedAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
          matchScore: 95,
          fitVerdict: "Exceptional Fit · Upfront Bid Accepted",
          matchedSkills: candidate.skills?.slice(0, 5) || [],
          missingSkills: [],
          matchReasons: [
            `Accepted upfront market offer of ${targetBid.salaryOffer}`,
            `Direct recruitment via Reverse Blind Marketplace`,
          ],
          matchConcerns: [],
          aiSummary: `Candidate accepted ${targetBid.companyName}'s upfront offer of ${targetBid.salaryOffer} for ${targetBid.jobTitle}. Identity revealed for immediate interview scheduling.`,
          timeline: [
            {
              status: "applied",
              timestamp: targetBid.createdAt,
              note: "Bid Placed in Blind Marketplace",
            },
            {
              status: "interview",
              timestamp: new Date().toISOString(),
              note: "Candidate Accepted Offer & Revealed Profile",
            },
          ],
        };

        if (onApplicationCreated) onApplicationCreated(newApp);
        await ApplicationsService.saveApplication(newApp);

        if (onNotify) {
          onNotify({
            recipientId: targetBid.companyId,
            role: "company",
            type: "offer",
            title: `Offer Accepted! Identity Revealed`,
            message: `${candidate.fullName} accepted your upfront offer for ${targetBid.jobTitle}. Fast-track interview application created in your pipeline!`,
            linkAction: "company-pipeline",
          });
        }

        if (onCelebrate) onCelebrate();
      } else if (action === "counter") {
        updatedStatus = "countered";
        updatedBid = {
          ...targetBid,
          status: "countered",
          counterOfferDetails: counterDetails,
        };

        if (onNotify) {
          onNotify({
            recipientId: targetBid.companyId,
            role: "company",
            type: "offer",
            title: `Counter-Offer Proposed for ${targetBid.jobTitle}`,
            message: `A candidate proposed a counter offer of ${counterDetails?.targetSalary || targetBid.salaryOffer}.`,
            linkAction: "blind-marketplace",
          });
        }
      } else {
        updatedStatus = "declined";
        updatedBid = { ...targetBid, status: "declined" };
      }

      setTalentBids((prev) => prev.map((b) => (b.id === bidId ? updatedBid : b)));
      const saved = await MarketplaceService.saveTalentBid(updatedBid);
      return { success: saved };
    },
    [talentBids]
  );

  return {
    blindTalentProfiles,
    setBlindTalentProfiles,
    talentBids,
    setTalentBids,
    saveBlindProfile,
    submitRecruiterBid,
    respondToTalentBid,
  };
}
