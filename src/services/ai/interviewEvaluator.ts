/**
 * SwipeHired Intelligent Technical Interview Evaluator
 * High-precision heuristic and semantic assessment engine for candidate interviews.
 * Distinguishes genuine technical depth from buzzwords, hand-waving, evasions, and trivial fillers.
 */

export interface EvaluatedAnswer {
  answerQuality: number; // 0.00 to 1.00
  assessment: string;
  followUpRequired: boolean;
  nextQuestion: string | null;
  matchedKeywords: string[];
  isEvasive: boolean;
}

export interface DimensionScores {
  overallScore: number;
  technicalScore: number;
  problemSolvingScore: number;
  projectUnderstandingScore: number;
  communicationScore: number;
  roleKnowledgeScore: number;
  verdict: "Strong Hire" | "Hire" | "Borderline" | "No Hire";
  strengths: string[];
  areasToExplore: string[];
  aiSummary: string;
}

// 1. Common evasions, single-word fillers, non-answers, and conversational noise
const EVASIVE_PATTERNS = [
  /^(yes|no|yeah|yep|nah|nope|ok|okay|k|fine|sure|dunno|maybe|right|wrong)$/i,
  /^(i know|i dont know|idk|dont know|not sure|no idea|have no idea)$/i,
  /^(nothing|skip|pass|next|n\/a|na|none|nil|null)$/i,
  /^(cool|good|great|fine|hello|hi|hey|test|testing)$/i,
  /^(yes\s+yes|no\s+no|ok\s+ok|yeah\s+yeah|i\s+know\s+i\s+know|sure\s+sure)$/i,
  /^(i\s+said\s+no|i\s+said\s+yes|i\s+dont\s+know\s+this|skip\s+this)$/i,
  /^(hire\s+me|please\s+hire\s+me|select\s+me|i\s+am\s+good\s+developer|i\s+want\s+job)$/i,
  /^(ask\s+next|next\s+question|ask\s+something\s+else|i\s+know\s+everything)$/i,
];

// 2. Comprehensive technical dictionary organized by domain
const TECH_DICTIONARY: Record<string, string[]> = {
  javaSpring: [
    "spring", "spring boot", "springboot", "hibernate", "jpa", "entity", "repository",
    "transactional", "propagation", "isolation", "acid", "hikaricp", "datasource",
    "connection pool", "pool size", "concurrency", "deadlock", "dirty read", "phantom read",
    "thread", "synchronized", "volatile", "atomic", "executor", "future", "completablefuture",
    "virtual threads", "jvm", "garbage collection", "gc", "heap", "stack", "metaspace",
    "oom", "memory leak", "thread dump", "heap dump", "visualvm", "jprofiler",
    "g1gc", "zgc", "parallelgc", "jwt", "spring security", "securityfilterchain",
    "cors", "csrf", "bearer", "filter", "microservices", "feign", "eureka", "resilience4j",
    "maven", "gradle", "restcontroller", "autowired", "bean", "dependency injection", "ioc"
  ],
  pythonBackend: [
    "python", "django", "fastapi", "flask", "orm", "queryset", "select_related",
    "prefetch_related", "celery", "redis", "async", "await", "asyncio", "pydantic",
    "generator", "yield", "decorator", "gil", "multiprocessing", "threading",
    "pytest", "uvicorn", "gunicorn", "sqlalchemy", "alembic", "marshmallow"
  ],
  databasesStorage: [
    "database", "sql", "postgres", "postgresql", "mysql", "mongodb", "redis",
    "caching", "cache", "ttl", "invalidation", "lru", "b-tree", "index", "indexing",
    "composite index", "explain", "analyze", "sharding", "partitioning", "replica",
    "replication", "cdc", "kafka", "rabbitmq", "event driven", "pubsub", "nosql",
    "write-ahead log", "wal", "foreign key", "normalized", "denormalized", "migration"
  ],
  architectureCloud: [
    "api", "rest", "restful", "graphql", "grpc", "http", "https", "status code",
    "idempotent", "idempotency", "load balancer", "nginx", "gateway", "docker",
    "kubernetes", "k8s", "helm", "ci/cd", "pipeline", "github actions", "aws",
    "s3", "lambda", "ec2", "ecs", "cloud", "serverless", "circuit breaker",
    "retry", "rate limiting", "distributed tracing", "prometheus", "grafana"
  ],
  frontendReact: [
    "react", "typescript", "javascript", "hook", "useeffect", "usestate", "usememo",
    "usecallback", "useref", "redux", "zustand", "context", "tailwind", "nextjs",
    "virtual dom", "hydration", "ssr", "csr", "ssg", "props", "state", "re-render",
    "component lifecycle", "debounce", "throttle", "memoization", "bundle size"
  ],
  engineeringProcess: [
    "unit test", "integration test", "e2e", "mock", "stub", "tdd", "benchmark",
    "profiling", "latency", "throughput", "qps", "sla", "slo", "monitoring",
    "root cause", "post-mortem", "code review", "refactor", "race condition"
  ]
};

// Flattened set for quick lookup
const ALL_TECH_TERMS = new Set<string>();
Object.values(TECH_DICTIONARY).forEach((list) => {
  list.forEach((t) => ALL_TECH_TERMS.add(t.toLowerCase()));
});

/**
 * Check if candidate answer is an evasion, single-word reply, filler, or non-technical noise
 */
export function isEvasiveOrNonResponsive(answerText: string): boolean {
  if (!answerText) return true;
  const clean = answerText.trim().toLowerCase().replace(/[.,!?;:'"()[\]{}]/g, "");
  if (clean.length === 0) return true;

  // Check exact regex patterns
  for (const pat of EVASIVE_PATTERNS) {
    if (pat.test(clean)) return true;
  }

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 2) {
    // If only 1-2 words, check if any is a genuine technical term (e.g. "@Transactional", "HikariCP")
    const hasValidTech = words.some((w) => ALL_TECH_TERMS.has(w) || w.startsWith("@"));
    if (!hasValidTech) return true;
  }

  // Check if candidate is just repeating "yes yes yes" or similar
  const uniqueWords = new Set(words);
  if (words.length >= 3 && uniqueWords.size === 1) {
    return true;
  }

  return false;
}

/**
 * Extract matched technical keywords from an answer
 */
export function extractMatchedKeywords(text: string, customSkills: string[] = []): string[] {
  const lower = (text || "").toLowerCase();
  const matched: string[] = [];

  // Search dictionary
  ALL_TECH_TERMS.forEach((term) => {
    if (term.length > 2 && lower.includes(term)) {
      matched.push(term);
    }
  });

  // Search custom skills provided in job description
  customSkills.forEach((skill) => {
    const sLower = skill.toLowerCase().trim();
    if (sLower.length > 2 && lower.includes(sLower) && !matched.includes(sLower)) {
      matched.push(sLower);
    }
  });

  // Deduplicate and prioritize longer terms (e.g. "spring boot" over "spring")
  return matched.sort((a, b) => b.length - a.length).slice(0, 10);
}

/**
 * Check if the answer has semantic/technical relevance to the question asked
 */
export function checkQuestionRelevance(questionText: string, answerText: string): {
  isRelevant: boolean;
  overlapCount: number;
} {
  const qTokens = (questionText || "").toLowerCase().replace(/[^\w\s@]/g, " ").split(/\s+/).filter((w) => w.length > 3);
  const aTokens = (answerText || "").toLowerCase().replace(/[^\w\s@]/g, " ").split(/\s+/).filter((w) => w.length > 3);

  const aSet = new Set(aTokens);
  const overlap = qTokens.filter((token) => aSet.has(token));

  // Also check if any matched technical terms relate to the question domain
  const qMatched = extractMatchedKeywords(questionText);
  const aMatched = extractMatchedKeywords(answerText);
  const sharedTech = qMatched.filter((t) => aMatched.includes(t));

  const totalOverlap = overlap.length + sharedTech.length;
  return {
    isRelevant: totalOverlap > 0 || aMatched.length >= 2,
    overlapCount: totalOverlap,
  };
}

/**
 * Logically evaluate candidate answer without pity scoring or inappropriate follow-ups
 */
export function evaluateAnswerLogically(params: {
  questionText: string;
  answerText: string;
  jobTitle?: string;
  requiredSkills?: string[];
  hasTriggeredFollowUp?: boolean;
  audioDurationSeconds?: number;
}): EvaluatedAnswer {
  const { questionText, answerText, jobTitle = "Engineer", requiredSkills = [], hasTriggeredFollowUp = false, audioDurationSeconds } = params;
  const trimmed = (answerText || "").trim();
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const lowerAns = trimmed.toLowerCase();
  const lowerQ = (questionText || "").toLowerCase();

  const isSpokenAudioOnly =
    (audioDurationSeconds !== undefined && audioDurationSeconds >= 5) ||
    /\[(?:spoken|voice)\s+(?:voice\s+)?answer\s+recorded/i.test(trimmed);

  // If candidate submitted a genuine voice recording
  if (isSpokenAudioOnly) {
    const sec = audioDurationSeconds || 15;
    return {
      answerQuality: Math.min(0.85, Math.max(0.72, 0.70 + (sec > 20 ? 0.12 : 0.05))),
      assessment: `Candidate provided a spoken voice answer (${sec}s audio response). Spoken audio is recorded and attached for hiring team review.`,
      followUpRequired: !hasTriggeredFollowUp && sec >= 10,
      nextQuestion: !hasTriggeredFollowUp
        ? "Could you dive into how your proposed architecture addresses high concurrency and failure recovery?"
        : null,
      matchedKeywords: extractMatchedKeywords(trimmed, requiredSkills),
      isEvasive: false,
    };
  }

  // 1. Detect Evasion / Filler / Non-response
  if (isEvasiveOrNonResponsive(trimmed) || words === 0) {
    return {
      answerQuality: 0.00,
      assessment: `Non-responsive / evasive answer (${words} word${words === 1 ? "" : "s"}). The candidate failed to address the question and demonstrated no practical understanding on this topic.`,
      followUpRequired: false,
      nextQuestion: null,
      matchedKeywords: [],
      isEvasive: true,
    };
  }

  const matchedTech = extractMatchedKeywords(trimmed, requiredSkills);
  const relevance = checkQuestionRelevance(questionText, trimmed);

  // 2. Off-topic or Completely Non-technical
  if (matchedTech.length === 0 && !relevance.isRelevant && words < 25) {
    return {
      answerQuality: 0.05,
      assessment: `Answer lacks domain technical terminology and does not address the core mechanisms of the question asked.`,
      followUpRequired: false,
      nextQuestion: null,
      matchedKeywords: [],
      isEvasive: false,
    };
  }

  // 3. Superficial answer (1-2 buzzwords dropped without architectural explanation)
  if (words < 12 && matchedTech.length <= 2) {
    const terms = matchedTech.join(", ") || "the requested topic";
    return {
      answerQuality: Math.min(0.35, Math.max(0.18, matchedTech.length * 0.15)),
      assessment: `Superficial response (${words} words). Mentions relevant terminology (${terms}) but lacks implementation details, configuration parameters, and trade-off analysis.`,
      followUpRequired: false, // Do NOT ask generic follow-up on superficial answers
      nextQuestion: null,
      matchedKeywords: matchedTech,
      isEvasive: false,
    };
  }

  // 4. Moderate answer (some explanation and terminology, but missing deeper nuance)
  if (words < 25 || matchedTech.length <= 2) {
    let score = 0.45;
    if (words >= 15) score += 0.08;
    if (matchedTech.length >= 2) score += 0.07;
    score = Number(Math.min(0.65, Math.max(0.40, score)).toFixed(2));

    const terms = matchedTech.slice(0, 3).join(", ") || "core principles";
    return {
      answerQuality: score,
      assessment: `Moderate technical answer demonstrating basic familiarity with ${terms}, but lacks specific production edge cases and system performance trade-offs.`,
      followUpRequired: false,
      nextQuestion: null,
      matchedKeywords: matchedTech,
      isEvasive: false,
    };
  }

  // 5. Practical & Solid Technical Answer (clear reasoning, mechanisms, and tools)
  let baseScore = 0.70;
  if (words >= 25) baseScore += 0.05;
  if (words >= 45) baseScore += 0.05;
  if (matchedTech.length >= 3) baseScore += 0.06;
  if (matchedTech.length >= 5) baseScore += 0.04;
  if (/trade-off|tradeoff|versus|alternative|concurrency|race condition|deadlock|pool size|latency|benchmark|rollback/i.test(trimmed)) {
    baseScore += 0.05;
  }
  const quality = Number(Math.min(0.95, Math.max(0.68, baseScore)).toFixed(2));

  const topTerms = matchedTech.slice(0, 3).join(", ") || "system architecture";
  let followUpRequired = false;
  let nextFollowUp: string | null = null;

  // Only trigger follow-up if this answer was genuinely strong and hasn't had one yet
  if (!hasTriggeredFollowUp && quality >= 0.70) {
    followUpRequired = true;
    if (/transaction|isolation|propagation|hikaricp|connection pool/i.test(lowerQ) || /transaction|hikaricp/i.test(lowerAns)) {
      nextFollowUp = "How do you handle nested transactions with PROPAGATION_REQUIRES_NEW, and what monitoring metrics do you use to detect HikariCP connection pool exhaustion in production?";
    } else if (/security|jwt|auth|filter/i.test(lowerQ) || /jwt|security/i.test(lowerAns)) {
      nextFollowUp = "How do you implement refresh token rotation, prevent replay attacks, and invalidate stateless JWTs upon immediate user logout?";
    } else if (/jvm|memory|gc|cpu|leak/i.test(lowerQ) || /jvm|gc|leak/i.test(lowerAns)) {
      nextFollowUp = "When taking heap and thread dumps under high CPU load, how do you correlate top thread CPU usage with specific Java stack traces?";
    } else if (/database|sql|index|query|postgres/i.test(lowerQ) || /database|index/i.test(lowerAns)) {
      nextFollowUp = "What indexing strategy did you choose, and what were the write performance trade-offs under high concurrent traffic?";
    } else if (/cache|redis|invalidation/i.test(lowerQ) || /cache|redis/i.test(lowerAns)) {
      nextFollowUp = "How do you prevent cache stampede (thundering herd) and ensure data consistency during database write rollbacks?";
    } else {
      nextFollowUp = "What were the primary architectural failure modes or trade-offs you encountered with that approach, and how did you mitigate them?";
    }
  }

  return {
    answerQuality: quality,
    assessment: `Strong practical answer demonstrating clear grasp of ${topTerms}. Articulates relevant architectural reasoning (${Math.round(quality * 100)}% depth).`,
    followUpRequired,
    nextQuestion: nextFollowUp,
    matchedKeywords: matchedTech,
    isEvasive: false,
  };
}

/**
 * Compute calibrated, objective final evaluation across the 5 dimensions.
 * Strictly eliminates fake pity strengths and artificial score floors.
 */
export function computeCalibratedInterviewEvaluation(params: {
  qaHistory: Array<{
    question: string;
    answer: string;
    qualityScore?: number;
    answerQuality?: number;
    assessment?: string;
  }>;
  jobTitle?: string;
  requiredSkills?: string[];
  candidateName?: string;
}): DimensionScores {
  const { qaHistory = [], jobTitle = "Software Engineer", requiredSkills = [], candidateName = "Candidate" } = params;

  if (!qaHistory || qaHistory.length === 0) {
    return {
      overallScore: 0,
      technicalScore: 0,
      problemSolvingScore: 0,
      projectUnderstandingScore: 0,
      communicationScore: 0,
      roleKnowledgeScore: 0,
      verdict: "No Hire",
      strengths: ["No interview responses recorded"],
      areasToExplore: ["Candidate must complete technical assessment"],
      aiSummary: `No interview questions were completed for the ${jobTitle} position.`,
    };
  }

  // Calculate actual scores per answer
  const scoredQAs = qaHistory.map((qa) => {
    const rawQuality = Number(qa.qualityScore ?? qa.answerQuality);
    let quality = !isNaN(rawQuality) ? rawQuality : 0.0;
    const isEvasive = isEvasiveOrNonResponsive(qa.answer || "");
    if (isEvasive) quality = 0.0;
    return {
      ...qa,
      quality,
      isEvasive,
      matched: extractMatchedKeywords(qa.answer || "", requiredSkills),
    };
  });

  const totalQuestions = scoredQAs.length;
  const evasiveCount = scoredQAs.filter((q) => q.isEvasive || q.quality <= 0.15).length;
  const strongAnswers = scoredQAs.filter((q) => q.quality >= 0.65);
  const avgQuality = scoredQAs.reduce((sum, q) => sum + q.quality, 0) / totalQuestions;
  const rawPercentage = Math.round(avgQuality * 100);

  // Dimension 1: Technical Depth
  const technicalScore = Math.round(avgQuality * 100);

  // Dimension 2: Problem Solving (requires real explanations, edge cases, tradeoffs)
  let problemSolvingScore: number;
  if (strongAnswers.length === 0) {
    problemSolvingScore = Math.min(5, Math.round(technicalScore * 0.5));
  } else {
    const problemSolvingAvg = strongAnswers.reduce((sum, q) => sum + q.quality, 0) / totalQuestions;
    problemSolvingScore = Math.round(problemSolvingAvg * 100);
  }

  // Dimension 3: Project Understanding (authentic demonstration of tooling & stack)
  let projectUnderstandingScore: number;
  if (strongAnswers.length === 0) {
    projectUnderstandingScore = Math.min(5, Math.round(technicalScore * 0.6));
  } else {
    projectUnderstandingScore = Math.min(100, Math.round(technicalScore * 1.05));
  }

  // Dimension 4: Communication (clarity, responsiveness, avoiding single-word answers)
  let communicationScore: number;
  if (evasiveCount >= totalQuestions - 1) {
    // Almost all answers were evasive single words
    communicationScore = 5;
  } else if (evasiveCount > totalQuestions / 2) {
    // More than half answers were evasive
    communicationScore = 15;
  } else {
    communicationScore = Math.min(95, Math.max(30, Math.round(technicalScore * 1.1 + 10)));
  }

  // Dimension 5: Role Knowledge
  let roleKnowledgeScore: number;
  if (strongAnswers.length === 0) {
    roleKnowledgeScore = Math.min(8, Math.round(technicalScore * 0.7));
  } else {
    roleKnowledgeScore = Math.round(technicalScore * 0.95);
  }

  // Composite Weighted Fit Score (Technical 35%, Problem Solving 25%, Projects 15%, Communication 15%, Role Knowledge 10%)
  const overallScore = Math.round(
    technicalScore * 0.35 +
    problemSolvingScore * 0.25 +
    projectUnderstandingScore * 0.15 +
    communicationScore * 0.15 +
    roleKnowledgeScore * 0.10
  );

  // Calibrated Verdicts
  let verdict: "Strong Hire" | "Hire" | "Borderline" | "No Hire";
  if (overallScore >= 82) verdict = "Strong Hire";
  else if (overallScore >= 65) verdict = "Hire";
  else if (overallScore >= 45) verdict = "Borderline";
  else verdict = "No Hire";

  // Dynamic, authentic Strengths (NO PITY STRINGS!)
  let strengths: string[] = [];
  if (overallScore < 35 || strongAnswers.length === 0) {
    strengths = [
      "No verifiable technical or architectural competencies demonstrated in this session",
    ];
  } else {
    // Extract real strengths from answers where candidate scored >= 0.65
    strongAnswers.forEach((q) => {
      const topMatched = extractMatchedKeywords(q.answer, requiredSkills).slice(0, 2);
      if (topMatched.length > 0) {
        strengths.push(`Demonstrated practical command of ${topMatched.join(" and ")}`);
      }
    });

    if (strengths.length === 0) {
      strengths.push("Understands basic development terminology");
    }
    strengths = Array.from(new Set(strengths)).slice(0, 3);
  }

  // Strategic Areas to Explore
  let areasToExplore: string[] = [];
  if (overallScore < 45 || evasiveCount > 0) {
    if (evasiveCount >= totalQuestions / 2) {
      areasToExplore.push(
        `Candidate was non-responsive or provided single-word replies across ${evasiveCount} of ${totalQuestions} evaluation topics.`
      );
      areasToExplore.push(
        `Fundamental lack of verified hands-on engineering depth in ${requiredSkills.slice(0, 3).join(", ") || jobTitle}.`
      );
    } else {
      areasToExplore.push(
        `Candidate needs to articulate concrete architectural implementation details and trade-offs rather than high-level statements.`
      );
      areasToExplore.push(
        `Deeper hands-on verification required in ${requiredSkills.slice(0, 3).join(", ") || "core technical stack"}.`
      );
    }
  } else {
    areasToExplore.push(
      `Probe edge-case resiliency and high-concurrency failure modes in subsequent technical rounds.`
    );
    areasToExplore.push(
      `Examine performance benchmarking and distributed systems monitoring practices.`
    );
  }

  // Executive Summary for Hiring Manager
  let aiSummary: string;
  if (overallScore < 35 || verdict === "No Hire") {
    aiSummary = `Candidate evaluated for the ${jobTitle} position with an overall score of ${overallScore}/100 (Verdict: No Hire). Out of ${totalQuestions} technical questions, the candidate provided single-word, evasive, or non-responsive answers on ${evasiveCount} prompts, demonstrating no substantive engineering depth or technical reasoning. Strong recommendation against advancing candidate to next round.`;
  } else if (verdict === "Borderline") {
    aiSummary = `Candidate evaluated for the ${jobTitle} position with an overall score of ${overallScore}/100 (Verdict: Borderline). The candidate demonstrated foundational understanding in select areas but lacked consistency and deep trade-off analysis across complex scenarios. Recommend probing practical project code in subsequent interview rounds.`;
  } else {
    aiSummary = `Candidate demonstrated strong technical competence for the ${jobTitle} role with an overall score of ${overallScore}/100 (Verdict: ${verdict}). Responses showed authentic project ownership, clear architectural intuition, and practical engineering trade-off awareness across core competencies.`;
  }

  return {
    overallScore,
    technicalScore,
    problemSolvingScore,
    projectUnderstandingScore,
    communicationScore,
    roleKnowledgeScore,
    verdict,
    strengths,
    areasToExplore,
    aiSummary,
  };
}
