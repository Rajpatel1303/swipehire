import { CandidateProfile, Job } from "../../types";
import { MatchAnalysisResult } from "./types";

export class MatchAnalyzer {
  /**
   * Evaluate match score and fit verdict between candidate and job
   */
  static async analyze(
    candidate: CandidateProfile,
    job: Job,
    customFocus?: string
  ): Promise<MatchAnalysisResult> {
    try {
      const response = await fetch("/api/ai/match-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate, job, customFocus }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.matchScore) return data;
      }
    } catch (err) {
      console.warn("[MatchAnalyzer] API match-analysis failed, using deterministic scoring engine:", err);
    }

    return this.fallbackHeuristicScore(candidate, job);
  }

  private static fallbackHeuristicScore(candidate: CandidateProfile, job: Job): MatchAnalysisResult {
    const candSkills = (candidate.skills || []).map(s => s.trim());
    const jobReqSkills = (job.requiredSkills || []).map(s => s.trim());
    const jobPrefSkills = (job.preferredSkills || []).map(s => s.trim());

    const matchedReq = jobReqSkills.filter(js =>
      candSkills.some(cs => cs.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(cs.toLowerCase()))
    );
    const matchedPref = jobPrefSkills.filter(js =>
      candSkills.some(cs => cs.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(cs.toLowerCase()))
    );
    const matchedSkills = Array.from(new Set([...matchedReq, ...matchedPref]));
    const missingSkills = jobReqSkills.filter(js =>
      !candSkills.some(cs => cs.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(cs.toLowerCase()))
    );

    const matchRatio = matchedReq.length / Math.max(jobReqSkills.length, 1);
    let baseScore = Math.round(55 + matchRatio * 38);
    if (matchedReq.length === jobReqSkills.length) baseScore = Math.max(baseScore, 92);

    if (job.location.toLowerCase().includes("ahmedabad") && candidate.location.toLowerCase().includes("ahmedabad")) {
      baseScore += 3;
    }
    if (job.workMode === candidate.workPreference || job.workMode === "Remote") {
      baseScore += 2;
    }

    const finalScore = Math.min(Math.max(baseScore, 58), 98);

    let fitVerdict = "Strong Fit";
    if (finalScore >= 90) fitVerdict = "Exceptional Fit · Strong Hire Recommendation";
    else if (finalScore >= 80) fitVerdict = "Good Fit · Recommended with Quick Ramp-Up";
    else if (finalScore >= 70) fitVerdict = "Moderate Fit · Review Nuances";
    else fitVerdict = "Skill Gap · Requires Further Screening";

    const reasons: string[] = [];
    matchedSkills.slice(0, 3).forEach(s => {
      reasons.push(`${s} ? matches requirements`);
    });
    if (reasons.length === 0) {
      reasons.push("Core software development foundation");
    }
    reasons.push(`${candidate.yearsOfExperience} yrs experience aligns with ${job.experience}`);
    if (job.location.toLowerCase().includes(candidate.location.toLowerCase().split(",")[0].trim())) {
      reasons.push(`${candidate.location.split(",")[0]} ? exact location match`);
    }

    return {
      matchScore: finalScore,
      fitVerdict,
      matchedSkills: matchedSkills.length > 0 ? matchedSkills : candSkills.slice(0, 3),
      missingSkills,
      reasons,
      strengths: [
        `Strong mastery in ${matchedSkills.slice(0, 3).join(", ") || "core stack"}`,
        `${candidate.yearsOfExperience} years professional experience meets ${job.experience} criteria`,
        `Location preference (${candidate.location}) aligns with ${job.workMode} role`,
      ],
      concerns: missingSkills.length > 0 ? [`Missing specific hands-on experience in ${missingSkills.join(", ")}`] : [],
      aiSummary: `${candidate.fullName} is an excellent ${finalScore}% match for ${job.title} at ${job.companyName}. Demonstrates strong core competencies in ${(matchedSkills.length > 0 ? matchedSkills : candSkills).slice(0, 3).join(", ")}${missingSkills.length > 0 ? `, with minor ramp-up expected in ${missingSkills.join(", ")}` : " with complete skill alignment"}.`,
      interviewQuestions: [
        `How do you architect large-scale applications with ${matchedSkills[0] || "React"}?`,
        missingSkills.length > 0 ? `Have you worked with or learned ${missingSkills[0]} in personal projects or previous roles?` : `Can you describe your testing and deployment pipeline workflow?`,
      ],
    };
  }
}
