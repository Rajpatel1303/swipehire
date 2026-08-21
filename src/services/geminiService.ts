export * from "./ai";
import { AIService } from "./ai";

export const GeminiService = {
  parseResume: AIService.parseResume.bind(AIService),
  generateJob: AIService.generateJob.bind(AIService),
  analyzeMatch: AIService.analyzeMatch.bind(AIService),
  generateInterviewKit: AIService.generateInterviewKit.bind(AIService),
};
