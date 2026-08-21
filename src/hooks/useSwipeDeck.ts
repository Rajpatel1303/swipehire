import { useState, useCallback } from "react";
import { Job, SwipeInteraction, CandidateProfile } from "../types";
import { ApplicationsService } from "../services/supabase";

export function useSwipeDeck(initialSwipes: SwipeInteraction[] = []) {
  const [swipes, setSwipes] = useState<SwipeInteraction[]>(initialSwipes);

  const recordSwipe = useCallback(
    async (
      candidateId: string,
      jobId: string,
      action: "applied" | "skipped" | "saved",
      job?: Job
    ): Promise<boolean> => {
      const interaction: SwipeInteraction = {
        candidateId,
        jobId,
        action,
        timestamp: new Date().toISOString(),
        jobTags: job?.requiredSkills || [],
        workMode: job?.workMode,
      };

      setSwipes((prev) => [...prev, interaction]);
      return await ApplicationsService.logSwipe(interaction);
    },
    []
  );

  return {
    swipes,
    setSwipes,
    recordSwipe,
  };
}
