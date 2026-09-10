import { CandidateProfile, Job } from "../../types";
import { ParsedResumeResult, GeneratedJobResult, MatchAnalysisResult, InterviewKitResult } from "./types";
import { ResumeParser } from "./resumeParser";
import { JobGenerator } from "./jobGenerator";
import { MatchAnalyzer } from "./matchAnalyzer";
import { InterviewKitGenerator } from "./interviewKitGenerator";

export class AIService {
  /**
   * Parse Resume (Text string or binary File)
   */
  static async parseResume(
    input: string | File | Blob,
    candidateName?: string,
    originalFileName?: string,
    onProgress?: (state: any, message: string, progressPct?: number) => void
  ): Promise<ParsedResumeResult> {
    return ResumeParser.parse(input, candidateName, originalFileName, onProgress);
  }

  /**
   * Generate Job posting spec
   */
  static async generateJob(
    prompt: string,
    companyName?: string,
    companyLocation?: string
  ): Promise<GeneratedJobResult> {
    return JobGenerator.generate(prompt, companyName, companyLocation);
  }

  /**
   * Analyze candidate-job fit
   */
  static async analyzeMatch(
    candidate: CandidateProfile,
    job: Job,
    customFocus?: string
  ): Promise<MatchAnalysisResult> {
    return MatchAnalyzer.analyze(candidate, job, customFocus);
  }

  /**
   * Generate role interview question kit
   */
  static generateInterviewKit(
    roleTitle: string,
    requiredSkills: string[] = []
  ): InterviewKitResult {
    return InterviewKitGenerator.generateKit(roleTitle, requiredSkills);
  }
}
