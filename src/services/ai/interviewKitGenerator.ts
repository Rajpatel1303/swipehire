import { InterviewKitResult } from "./types";

export class InterviewKitGenerator {
  /**
   * Generate role-specific technical interview questions and scoring criteria
   */
  static generateKit(roleTitle: string, requiredSkills: string[] = []): InterviewKitResult {
    const primarySkill = requiredSkills[0] || "Software Engineering";
    const secondarySkill = requiredSkills[1] || "System Design";

    return {
      roleTitle,
      technicalQuestions: [
        {
          question: `Explain how you approach component lifecycle, state management, and performance optimization when using ${primarySkill}.`,
          idealAnswer: `Candidate should explain architectural decoupling, immutable state updates, memoization techniques, and profiling bottlenecks.`,
          evaluationCriteria: `Depth of practical knowledge, edge case awareness, and performance metrics consideration.`,
        },
        {
          question: `How do you design high-throughput RESTful or GraphQL APIs with ${secondarySkill} while maintaining data integrity?`,
          idealAnswer: `Candidate covers validation layers, database transactions, idempotency, rate limiting, and caching layers.`,
          evaluationCriteria: `System safety, defensive engineering principles, and scalable pattern familiarity.`,
        },
        {
          question: `Describe a production incident or tough bug you investigated. What was your root cause analysis workflow?`,
          idealAnswer: `Structured debugging: log analysis, reproduction in staging, hypothesis testing, zero-downtime hotfix, and post-mortem mitigation.`,
          evaluationCriteria: `Methodical problem-solving and proactive risk prevention.`,
        },
      ],
      behavioralQuestions: [
        {
          question: `How do you handle scope changes or tight release timelines with conflicting stakeholders?`,
          whatToLookFor: `Pragmatic prioritization, transparent communication, and focus on delivering core business value.`,
        },
        {
          question: `Tell us about a time you gave constructive feedback during code review that improved code quality.`,
          whatToLookFor: `Collaborative mentorship mindset, clear technical rationale, and empathy for peers.`,
        },
      ],
      systemDesignPrompt: `Architect a scalable, real-time event pipeline supporting 100k concurrent users with low latency.`,
    };
  }
}
