/**
 * SwipeHired AI Interview Role Classifier & Domain Guardian
 *
 * Responsibilities:
 * 1. Deterministic, multi-category job classification based STRICTLY on Job Opening data.
 * 2. Complete isolation of Candidate Profile from job classification.
 * 3. Generation of Interview Blueprints with allowed and forbidden domain competencies.
 * 4. Semantic validation of AI-generated questions to reject cross-domain hallucinations.
 * 5. High-fidelity, domain-accurate fallback question banks across 9 job categories.
 */

export type JobCategory =
  | "software"
  | "office_admin"
  | "accounting"
  | "sales"
  | "hr"
  | "customer_support"
  | "operations"
  | "marketing"
  | "general";

export type InterviewCategory = JobCategory;

export interface JobClassificationInput {
  title?: string;
  department?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  description?: string;
  responsibilities?: string[];
}

export interface RoleClassificationResult {
  category: JobCategory;
  role: string;
  roleKey: string;
  confidence: number; // 0.00 to 1.00
  signals: string[];
}

export interface InterviewBlueprint {
  jobTitle: string;
  category: JobCategory;
  roleKey: string;
  confidence: number;
  primarySkills: string[];
  forbiddenTopics: string[];
  allowedCompetencies: string[];
}

export interface ValidatedQuestion {
  order: number;
  question: string;
  category: string;
  difficulty: string;
  idealCriteria: string;
  source: "ai_generated" | "fallback" | "company";
}

export interface QuestionValidationResult {
  isValid: boolean;
  failedReason?: string;
  questions: ValidatedQuestion[];
}

// ---------------------------------------------------------------------------
// 1. DOMAIN PATTERN DICTIONARIES
// ---------------------------------------------------------------------------

const CATEGORY_DEFINITIONS: Record<
  JobCategory,
  {
    titlePatterns: RegExp[];
    skillKeywords: string[];
    forbiddenInNonTech: string[];
    defaultCompetencies: string[];
  }
> = {
  software: {
    titlePatterns: [
      /\b(?:software|frontend|front-end|backend|back-end|fullstack|full-stack|web)\s*(?:engineer|developer|architect|lead)\b/i,
      /\b(?:python|java|javascript|typescript|react|node|golang|rust|php|c\+\+|c\#|\.net|ruby|ios|android|mobile|flutter)\s*(?:developer|engineer|programmer)\b/i,
      /\b(?:qa|quality assurance|sdet|test automation|devops|sre|cloud|infrastructure|database|data)\s*(?:engineer|architect|specialist)\b/i,
      /\b(?:programmer|coder|system architect)\b/i,
    ],
    skillKeywords: [
      "react", "typescript", "javascript", "node.js", "python", "java", "sql", "postgresql",
      "mongodb", "docker", "kubernetes", "aws", "git", "rest api", "graphql", "ci/cd",
      "microservices", "system design", "html", "css", "tailwind", "next.js", "c++", "c#"
    ],
    forbiddenInNonTech: [
      "state management", "component lifecycle", "react", "redux", "zustand", "useeffect",
      "kubernetes", "docker", "microservices", "api latency", "compute cost", "distributed systems",
      "circuit breaker", "ci/cd pipeline", "pull request", "sql injection", "cache invalidation",
      "grpc", "graphql schema", "orm mapping", "deadlock", "race condition", "garbage collection"
    ],
    defaultCompetencies: [
      "Architecture & Clean Code", "Production Debugging", "Data Flow & State", "Testing & Resilience"
    ],
  },

  office_admin: {
    titlePatterns: [
      /\b(?:computer\s*operator|data\s*entry\s*operator|data\s*entry)\b/i,
      /\b(?:office\s*assistant|office\s*executive|back\s*office|back-office|admin\s*executive|administrative\s*assistant)\b/i,
      /\b(?:clerk|receptionist|front\s*desk|typist|office\s*administrator)\b/i,
    ],
    skillKeywords: [
      "ms office", "excel", "ms excel", "word", "ms word", "powerpoint", "data entry",
      "typing", "tally", "spreadsheet", "documentation", "filing", "computer operations",
      "internet browsing", "email management", "vlookup", "pivot table"
    ],
    forbiddenInNonTech: [],
    defaultCompetencies: [
      "Data Entry Accuracy", "MS Office Proficiency", "Document Management", "Task Organization"
    ],
  },

  accounting: {
    titlePatterns: [
      /\b(?:accountant|accounts\s*executive|senior\s*accountant|junior\s*accountant)\b/i,
      /\b(?:chartered\s*accountant|ca\s*inter|finance\s*executive|financial\s*analyst)\b/i,
      /\b(?:billing\s*executive|audit\s*assistant|bookkeeper|tax\s*consultant)\b/i,
    ],
    skillKeywords: [
      "tally", "tally prime", "gst", "tds", "income tax", "balance sheet", "p&l",
      "ledger", "voucher", "bank reconciliation", "financial reporting", "auditing",
      "accounts payable", "accounts receivable", "payroll", "invoicing", "excel"
    ],
    forbiddenInNonTech: [],
    defaultCompetencies: [
      "Voucher & Ledger Accuracy", "Bank Reconciliation", "Tax Compliance (GST/TDS)", "Financial Reporting"
    ],
  },

  sales: {
    titlePatterns: [
      /\b(?:sales\s*executive|business\s*development|bde|bda|relationship\s*manager)\b/i,
      /\b(?:account\s*executive|sales\s*manager|telesales|inside\s*sales|field\s*sales)\b/i,
    ],
    skillKeywords: [
      "lead generation", "cold calling", "crm", "negotiation", "client relationship",
      "pipeline management", "sales closing", "pitching", "presentation", "prospecting"
    ],
    forbiddenInNonTech: [],
    defaultCompetencies: [
      "Lead Qualification", "Objection Handling", "Pipeline & CRM Tracking", "Deal Closing"
    ],
  },

  hr: {
    titlePatterns: [
      /\b(?:hr\s*executive|human\s*resources|recruiter|talent\s*acquisition)\b/i,
      /\b(?:hr\s*generalist|hr\s*manager|recruitment\s*specialist|people\s*operations)\b/i,
    ],
    skillKeywords: [
      "talent sourcing", "screening", "interviewing", "onboarding", "employee engagement",
      "payroll coordination", "hr policies", "ats", "grievance handling", "performance appraisal"
    ],
    forbiddenInNonTech: [],
    defaultCompetencies: [
      "Candidate Sourcing & Screening", "Behavioral Evaluation", "Employee Relations", "Onboarding"
    ],
  },

  customer_support: {
    titlePatterns: [
      /\b(?:customer\s*support|customer\s*care|support\s*executive|help\s*desk)\b/i,
      /\b(?:call\s*center|bpo\s*executive|client\s*support|technical\s*support\s*rep)\b/i,
    ],
    skillKeywords: [
      "customer satisfaction", "ticketing", "zendesk", "freshdesk", "call handling",
      "complaint resolution", "active listening", "sla", "chat support", "email support"
    ],
    forbiddenInNonTech: [],
    defaultCompetencies: [
      "Customer De-escalation", "Ticket Resolution & SLA", "Active Listening", "Product Troubleshooting"
    ],
  },

  operations: {
    titlePatterns: [
      /\b(?:operations\s*executive|operations\s*manager|ops\s*coordinator)\b/i,
      /\b(?:logistics\s*coordinator|supply\s*chain|procurement|inventory\s*executive)\b/i,
    ],
    skillKeywords: [
      "logistics", "supply chain", "inventory management", "vendor coordination",
      "process improvement", "kpi tracking", "scheduling", "workflow optimization"
    ],
    forbiddenInNonTech: [],
    defaultCompetencies: [
      "Process Optimization", "Vendor Coordination", "Quality Control", "Discrepancy Resolution"
    ],
  },

  marketing: {
    titlePatterns: [
      /\b(?:digital\s*marketing|marketing\s*executive|social\s*media|seo\s*specialist)\b/i,
      /\b(?:content\s*writer|copywriter|growth\s*marketer|performance\s*marketing)\b/i,
    ],
    skillKeywords: [
      "seo", "sem", "google ads", "social media", "content marketing", "meta ads",
      "google analytics", "email marketing", "copywriting", "campaign management"
    ],
    forbiddenInNonTech: [],
    defaultCompetencies: [
      "Campaign Planning", "Audience Engagement", "Marketing Analytics", "Content Strategy"
    ],
  },

  general: {
    titlePatterns: [],
    skillKeywords: [],
    forbiddenInNonTech: [],
    defaultCompetencies: [
      "Workplace Problem Solving", "Task Prioritization", "Communication & Collaboration", "Quality & Detail"
    ],
  },
};

// ---------------------------------------------------------------------------
// 2. DETERMINISTIC JOB ROLE CLASSIFIER
// ---------------------------------------------------------------------------

/**
 * Classifies a job opening based EXCLUSIVELY on Job Opening data.
 * Candidate profiles or applicant headlines are strictly excluded.
 */
export function classifyJobRole(job: JobClassificationInput): RoleClassificationResult {
  const title = (job?.title || "").trim();
  const department = (job?.department || "").trim();
  const skills = Array.isArray(job?.requiredSkills) ? job.requiredSkills : [];
  const description = (job?.description || "").trim();
  const responsibilities = Array.isArray(job?.responsibilities) ? job.responsibilities.join(" ") : "";

  const titleLower = title.toLowerCase();
  const deptLower = department.toLowerCase();
  const textCorpus = `${title} ${department} ${skills.join(" ")} ${description} ${responsibilities}`.toLowerCase();

  // Step 1: Direct Title Regex Matching (Weight: 0.85)
  for (const [catKey, def] of Object.entries(CATEGORY_DEFINITIONS)) {
    if (catKey === "general") continue;
    for (const pattern of def.titlePatterns) {
      if (pattern.test(titleLower)) {
        const cleanRole = titleLower.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 32);
        return {
          category: catKey as JobCategory,
          role: cleanRole,
          roleKey: cleanRole,
          confidence: 0.95,
          signals: [`Title matched pattern: ${pattern.toString()}`],
        };
      }
    }
  }

  // Step 2: Department Signal Matching (Weight: 0.60)
  if (deptLower) {
    const cleanRole = titleLower.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 32);
    if (deptLower.includes("engineer") || deptLower.includes("software") || deptLower.includes("tech") || deptLower.includes("it")) {
      return {
        category: "software",
        role: cleanRole || "software_role",
        roleKey: cleanRole || "software_role",
        confidence: 0.80,
        signals: [`Department matched engineering/tech: "${department}"`],
      };
    }
    if (deptLower.includes("account") || deptLower.includes("finance")) {
      return {
        category: "accounting",
        role: cleanRole || "accounting_role",
        roleKey: cleanRole || "accounting_role",
        confidence: 0.85,
        signals: [`Department matched accounting/finance: "${department}"`],
      };
    }
    if (deptLower.includes("admin") || deptLower.includes("office")) {
      return {
        category: "office_admin",
        role: cleanRole || "office_role",
        roleKey: cleanRole || "office_role",
        confidence: 0.85,
        signals: [`Department matched administration/office: "${department}"`],
      };
    }
    if (deptLower.includes("sales") || deptLower.includes("business dev")) {
      return {
        category: "sales",
        role: cleanRole || "sales_role",
        roleKey: cleanRole || "sales_role",
        confidence: 0.85,
        signals: [`Department matched sales: "${department}"`],
      };
    }
    if (deptLower.includes("hr") || deptLower.includes("human resource") || deptLower.includes("people")) {
      return {
        category: "hr",
        role: cleanRole || "hr_role",
        roleKey: cleanRole || "hr_role",
        confidence: 0.85,
        signals: [`Department matched HR: "${department}"`],
      };
    }
  }

  // Step 3: Score Skill and Corpus Density
  const categoryScores: Record<JobCategory, number> = {
    software: 0,
    office_admin: 0,
    accounting: 0,
    sales: 0,
    hr: 0,
    customer_support: 0,
    operations: 0,
    marketing: 0,
    general: 0,
  };

  const detectedSignals: Record<JobCategory, string[]> = {
    software: [],
    office_admin: [],
    accounting: [],
    sales: [],
    hr: [],
    customer_support: [],
    operations: [],
    marketing: [],
    general: [],
  };

  for (const [catKey, def] of Object.entries(CATEGORY_DEFINITIONS)) {
    const category = catKey as JobCategory;
    if (category === "general") continue;

    for (const skill of def.skillKeywords) {
      if (textCorpus.includes(skill)) {
        categoryScores[category] += 1;
        detectedSignals[category].push(skill);
      }
    }
  }

  let bestCategory: JobCategory = "general";
  let maxScore = 0;

  for (const [cat, score] of Object.entries(categoryScores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = cat as JobCategory;
    }
  }

  const cleanRole = titleLower.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 32);

  // Confidence calculation based on score differential
  if (maxScore >= 2) {
    const confidence = Math.min(0.90, 0.60 + maxScore * 0.08);
    return {
      category: bestCategory,
      role: cleanRole || "classified_role",
      roleKey: cleanRole || "classified_role",
      confidence,
      signals: detectedSignals[bestCategory].slice(0, 5).map(s => `Skill match: "${s}"`),
    };
  }

  // Step 4: Unknown / Ambiguous Role -> Fall safely to "general" with low confidence
  return {
    category: "general",
    role: cleanRole || "general_role",
    roleKey: cleanRole || "general_role",
    confidence: 0.40,
    signals: ["No decisive domain pattern found, using neutral general classification"],
  };
}

// ---------------------------------------------------------------------------
// 3. INTERVIEW BLUEPRINT CREATOR
// ---------------------------------------------------------------------------

export function createInterviewBlueprint(
  job: JobClassificationInput,
  classification: RoleClassificationResult
): InterviewBlueprint {
  const category = classification.category;
  const def = CATEGORY_DEFINITIONS[category] || CATEGORY_DEFINITIONS.general;

  // Forbidden topics for non-software roles (prevent cross-domain contamination)
  const forbiddenTopics = category !== "software"
    ? [...CATEGORY_DEFINITIONS.software.forbiddenInNonTech]
    : [];

  const primarySkills = (job.requiredSkills && job.requiredSkills.length > 0)
    ? job.requiredSkills.slice(0, 4)
    : def.skillKeywords.slice(0, 3);

  return {
    jobTitle: job.title || "Position",
    category,
    roleKey: classification.roleKey,
    confidence: classification.confidence,
    primarySkills,
    forbiddenTopics,
    allowedCompetencies: def.defaultCompetencies,
  };
}

// ---------------------------------------------------------------------------
// 4. QUESTION VALIDATOR
// ---------------------------------------------------------------------------

/**
 * Deterministically validates generated questions against the interview blueprint.
 * Discards any question set that contains cross-domain hallucinations (e.g. MS Office + React).
 */
export function validateGeneratedQuestions(
  rawQuestions: any[],
  blueprint: InterviewBlueprint
): QuestionValidationResult {
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return { isValid: false, failedReason: "Empty or non-array question payload", questions: [] };
  }

  const validated: ValidatedQuestion[] = [];
  const forbidden = blueprint.forbiddenTopics.map(t => t.toLowerCase());

  for (let i = 0; i < rawQuestions.length; i++) {
    const q = rawQuestions[i];
    const text = String(q?.question || q?.questionText || "").trim();

    if (!text || text.length < 15) {
      return {
        isValid: false,
        failedReason: `Question at index ${i} is too short or empty`,
        questions: [],
      };
    }

    const textLower = text.toLowerCase();

    // Check forbidden cross-domain leaks
    for (const badTopic of forbidden) {
      if (textLower.includes(badTopic)) {
        return {
          isValid: false,
          failedReason: `Forbidden cross-domain topic "${badTopic}" detected in non-software role question: "${text}"`,
          questions: [],
        };
      }
    }

    validated.push({
      order: i + 1,
      question: text,
      category: q.category || blueprint.allowedCompetencies[i % blueprint.allowedCompetencies.length] || "Practical",
      difficulty: q.difficulty || "Practical",
      idealCriteria: q.idealCriteria || "Demonstrates practical domain competence.",
      source: "ai_generated",
    });
  }

  return {
    isValid: true,
    questions: validated,
  };
}

// ---------------------------------------------------------------------------
// 5. ROLE-SPECIFIC FALLBACK QUESTION BANKS (9 CATEGORIES)
// ---------------------------------------------------------------------------

const FALLBACK_QUESTION_BANKS: Record<JobCategory, Array<{ question: string; category: string; difficulty: string; idealCriteria: string }>> = {
  office_admin: [
    {
      question: "Which MS Office or Google Workspace tools do you use most frequently, and what is an example of a regular document or report you prepare?",
      category: "Tools & Workflows",
      difficulty: "Practical",
      idealCriteria: "Candidate demonstrates hands-on proficiency with Word, Excel, or spreadsheets for workplace tasks.",
    },
    {
      question: "When performing high-volume data entry or updates, what steps do you take to ensure 100% data accuracy and prevent duplicate records?",
      category: "Data Integrity & Accuracy",
      difficulty: "Practical",
      idealCriteria: "Mentions data validation, proofreading, double-entry verification, or cross-referencing source records.",
    },
    {
      question: "In Microsoft Excel, how do you sort, filter, or use formulas like VLOOKUP or SUM to organize and summarize raw data?",
      category: "Spreadsheet Management",
      difficulty: "Practical",
      idealCriteria: "Explains standard formula usage, sorting/filtering techniques, or organizing structured tabular information.",
    },
    {
      question: "How do you handle confidential office records, sensitive employee data, or official correspondence to prevent unauthorized access?",
      category: "Document Confidentiality",
      difficulty: "Practical",
      idealCriteria: "Awareness of access privacy, secure filing, password protection, and maintaining professional discretion.",
    },
    {
      question: "If your computer freezes or an office printer/scanner stops responding during urgent work, how do you troubleshoot the issue?",
      category: "Hardware & Operational Troubleshooting",
      difficulty: "Practical",
      idealCriteria: "Shows calm, structured basic troubleshooting (checking connections, restarting, clearing queue) and knowing when to alert IT.",
    },
  ],

  accounting: [
    {
      question: "Can you walk me through your daily workflow for recording financial transactions, and how you verify that the ledger remains balanced?",
      category: "Ledger & Transaction Verification",
      difficulty: "Practical",
      idealCriteria: "Candidate explains voucher entry (sales, purchase, payment, receipt) and verification of debit/credit totals.",
    },
    {
      question: "How do you perform a bank reconciliation, and how do you investigate an unexpected difference between bank statements and cash books?",
      category: "Bank Reconciliation",
      difficulty: "Practical",
      idealCriteria: "Explains identifying unpresented checks, bank charges, timing differences, and correcting unauthorized errors.",
    },
    {
      question: "What accounting software (such as Tally Prime, QuickBooks, or Zoho Books) have you worked with, and how do you generate trial balances?",
      category: "Accounting Systems",
      difficulty: "Practical",
      idealCriteria: "Demonstrates practical operational competence in generating standard statutory and internal reports.",
    },
    {
      question: "When preparing statutory filings like GST, TDS, or invoicing, how do you verify tax rates and ensure compliance deadlines are met?",
      category: "Tax Compliance",
      difficulty: "Practical",
      idealCriteria: "Mentions correct tax category assignment, reconciliation with GSTR reports, and avoiding late penalties.",
    },
    {
      question: "How do you maintain strict confidentiality and audit trails when handling company financial records and payroll figures?",
      category: "Audit & Confidentiality",
      difficulty: "Practical",
      idealCriteria: "Explains adherence to internal controls, proper documentation of supporting vouchers, and privacy of payroll.",
    },
  ],

  software: [
    {
      question: "Walk us through the architecture of a production feature you built. What were the key technical trade-offs you made?",
      category: "Architecture & Design",
      difficulty: "Practical",
      idealCriteria: "Explains component modularity, separation of concerns, scalability considerations, and trade-off rationale.",
    },
    {
      question: "Describe a difficult bug, memory leak, or performance bottleneck you diagnosed in production. What was your root cause investigation workflow?",
      category: "Production Debugging",
      difficulty: "Practical",
      idealCriteria: "Methodical debugging approach: log inspection, reproduction, profiling, hotfix rollout, and defensive prevention.",
    },
    {
      question: "How do you structure automated tests (unit, integration) and error boundaries to ensure application resilience against unexpected failures?",
      category: "Testing & Resilience",
      difficulty: "Practical",
      idealCriteria: "Covers balanced testing pyramid, mocking external dependencies, graceful degradation, and structured logging.",
    },
    {
      question: "How do you design database queries, indexes, or API contracts to maintain low latency under high concurrent read/write traffic?",
      category: "Performance & Scalability",
      difficulty: "Practical",
      idealCriteria: "Discusses indexing strategies, query plan analysis, caching strategies, and idempotent API contracts.",
    },
    {
      question: "How do you manage breaking changes, database migrations, and zero-downtime releases in a continuous deployment environment?",
      category: "Engineering Operations",
      difficulty: "Practical",
      idealCriteria: "Explains backward-compatible schema changes, feature flags, staging verification, and rollback readiness.",
    },
  ],

  sales: [
    {
      question: "Walk me through your lead qualification process. How do you distinguish high-potential prospects from unqualified leads?",
      category: "Lead Qualification",
      difficulty: "Practical",
      idealCriteria: "Covers BANT (Budget, Authority, Need, Timeline) or equivalent structured qualification frameworks.",
    },
    {
      question: "When a qualified prospect objects strongly to pricing or claims a competitor is cheaper, how do you reframe the value proposition?",
      category: "Objection Handling",
      difficulty: "Practical",
      idealCriteria: "Demonstrates consultative selling: validating concerns, isolating price vs. ROI, and highlighting unique differentiation.",
    },
    {
      question: "How do you organize your daily outreach and maintain pipeline hygiene in CRM systems like Salesforce or HubSpot?",
      category: "CRM & Pipeline Management",
      difficulty: "Practical",
      idealCriteria: "Explains disciplined follow-up schedules, logging call notes, tracking stage velocity, and forecasting.",
    },
    {
      question: "Describe a complex deal you closed from initial outreach to contract signing. What was your key strategy to get it over the finish line?",
      category: "Deal Closing",
      difficulty: "Practical",
      idealCriteria: "Shows stakeholder mapping, identifying decision-makers, navigating procurement, and creating urgency.",
    },
    {
      question: "How do you manage post-sale handoffs to customer success or implementation teams to ensure client retention and avoid churn?",
      category: "Account Retention & Handover",
      difficulty: "Practical",
      idealCriteria: "Discusses alignment on client expectations, handover documentation, and maintaining high customer satisfaction.",
    },
  ],

  hr: [
    {
      question: "What active sourcing channels and Boolean search strategies do you utilize to engage passive candidates for hard-to-fill roles?",
      category: "Talent Sourcing",
      difficulty: "Practical",
      idealCriteria: "Discusses LinkedIn Recruiter, specialized communities, personalized outreach messaging, and pipeline nurturing.",
    },
    {
      question: "How do you conduct structured behavioral interviews to assess culture add and team compatibility without introducing bias?",
      category: "Interviewing & Assessment",
      difficulty: "Practical",
      idealCriteria: "Uses STAR methodology (Situation, Task, Action, Result) with standardized scorecards and objective criteria.",
    },
    {
      question: "If a workplace conflict arises between a team lead and an employee regarding expectations, how do you mediate constructively?",
      category: "Employee Relations",
      difficulty: "Practical",
      idealCriteria: "Shows active listening, neutral fact-finding, focusing on mutually agreed solutions, and documenting resolutions.",
    },
    {
      question: "How do you design a smooth onboarding workflow to ensure new hires feel welcomed and become productive within their first 30 days?",
      category: "Onboarding & Engagement",
      difficulty: "Practical",
      idealCriteria: "Covers pre-boarding paperwork, equipment coordination, buddy systems, 30-60-90 day check-ins, and feedback loops.",
    },
    {
      question: "How do you track and maintain employee records, confidentiality, and statutory compliance (such as labor laws and workplace policies)?",
      category: "HR Compliance & Records",
      difficulty: "Practical",
      idealCriteria: "Explains secure HRIS record-keeping, statutory audits, leave/attendance policies, and confidentiality.",
    },
  ],

  customer_support: [
    {
      question: "When dealing with an extremely frustrated customer demanding an immediate refund or resolution you cannot authorize, how do you de-escalate?",
      category: "Conflict De-escalation",
      difficulty: "Practical",
      idealCriteria: "Empathetic listening, acknowledging frustration without making false promises, explaining what CAN be done, and escalating smoothly.",
    },
    {
      question: "How do you manage high incoming ticket volumes while maintaining high first-response and customer satisfaction (CSAT) scores?",
      category: "Queue Management & SLA",
      difficulty: "Practical",
      idealCriteria: "Prioritizing by urgency/SLA, utilizing canned snippets with personal touches, and avoiding queue pileups.",
    },
    {
      question: "If you notice multiple customers reporting the same unexplained issue or bug, what is your process to document and alert the technical team?",
      category: "Bug Escalation",
      difficulty: "Practical",
      idealCriteria: "Gathering steps to reproduce, browser/device info, user IDs, and filing clear, actionable escalation tickets.",
    },
    {
      question: "How do you handle difficult omnichannel communications (e.g. transitioning from email to a live phone call) to clarify ambiguous customer problems?",
      category: "Omnichannel Communication",
      difficulty: "Practical",
      idealCriteria: "Active listening, summarizing key points, confirming mutual understanding, and documenting ticket history.",
    },
    {
      question: "When a customer requests a feature or capability that your product does not currently support, how do you communicate this gracefully while keeping them satisfied?",
      category: "Customer Expectation Management",
      difficulty: "Practical",
      idealCriteria: "Acknowledges the use case, explains alternative workarounds, sets realistic expectations, and logs product feedback.",
    },
  ],

  operations: [
    {
      question: "When tracking a multi-step operational workflow, how do you identify bottlenecks and implement process optimizations?",
      category: "Process Optimization",
      difficulty: "Practical",
      idealCriteria: "Data-driven bottleneck diagnosis, streamlining unnecessary handoffs, and establishing clear accountability.",
    },
    {
      question: "How do you manage vendor relationships and service-level agreements (SLAs) to guarantee timely deliveries and cost efficiency?",
      category: "Vendor Coordination",
      difficulty: "Practical",
      idealCriteria: "Clear contract expectations, regular performance check-ins, proactive risk identification, and alternative vendor planning.",
    },
    {
      question: "Describe how you handled an operational disruption (such as missing inventory or shipment delay) under tight deadlines.",
      category: "Crisis Management",
      difficulty: "Practical",
      idealCriteria: "Rapid problem identification, transparent stakeholder communication, activating contingency plans, and post-incident review.",
    },
    {
      question: "How do you design and monitor Key Performance Indicators (KPIs) to evaluate daily operational efficiency across your team?",
      category: "Operational Metrics & KPIs",
      difficulty: "Practical",
      idealCriteria: "Setting measurable benchmarks, tracking throughput and error rates, and reviewing weekly dashboards.",
    },
    {
      question: "When implementing a new operational tool or workflow, how do you train team members and overcome resistance to adoption?",
      category: "Change Management & Training",
      difficulty: "Practical",
      idealCriteria: "Hands-on training sessions, clear SOP documentation, answering team concerns, and phased transition.",
    },
  ],

  marketing: [
    {
      question: "How do you measure the performance and ROI of a marketing campaign across organic and paid acquisition channels?",
      category: "Campaign Analytics & ROI",
      difficulty: "Practical",
      idealCriteria: "Tracking CAC, LTV, conversion rates, attribution models, and using Google Analytics or ads managers.",
    },
    {
      question: "When launching a new campaign, how do you define your target customer persona and tailor messaging across different platforms?",
      category: "Audience Segmentation",
      difficulty: "Practical",
      idealCriteria: "Audience research, pain-point identification, messaging hierarchy, and platform-specific format optimization.",
    },
    {
      question: "How do you conduct A/B testing on ad creatives, landing pages, or email subject lines to systematically improve conversion rates?",
      category: "Conversion Optimization",
      difficulty: "Practical",
      idealCriteria: "Formulating clear hypotheses, isolating single variables, ensuring statistical significance, and scaling winning variants.",
    },
    {
      question: "How do you build and maintain an editorial calendar for content marketing, ensuring consistent brand voice across all touchpoints?",
      category: "Content Planning & Brand Voice",
      difficulty: "Practical",
      idealCriteria: "Content themes, publishing cadences, SEO keyword mapping, and cross-channel distribution.",
    },
    {
      question: "When evaluating an underperforming marketing campaign mid-flight, what criteria do you use to pivot the strategy versus shutting it down?",
      category: "Campaign Troubleshooting",
      difficulty: "Practical",
      idealCriteria: "Analyzing cost-per-click, drop-off funnels, testing new hooks, and disciplined budget reallocation.",
    },
  ],

  general: [
    {
      question: "Can you describe your daily approach to organizing and prioritizing tasks when managing multiple competing deadlines?",
      category: "Task Organization",
      difficulty: "Practical",
      idealCriteria: "Structured prioritization (urgent vs. important), realistic time management, and proactive communication on timelines.",
    },
    {
      question: "Describe a situation where a process or requirement changed unexpectedly. How did you adapt your workflow to stay on schedule?",
      category: "Adaptability & Problem Solving",
      difficulty: "Practical",
      idealCriteria: "Composure, quick learning, positive attitude towards change, and collaborative problem-solving.",
    },
    {
      question: "How do you ensure clear, professional communication when collaborating with team members across different departments?",
      category: "Professional Communication",
      difficulty: "Practical",
      idealCriteria: "Active listening, conciseness, appropriate documentation, and following up on action items.",
    },
    {
      question: "What steps do you take to double-check your work and ensure high standards of quality before final submission?",
      category: "Quality Assurance",
      difficulty: "Practical",
      idealCriteria: "Self-review checklists, verification against requirements, and attention to detail.",
    },
    {
      question: "Can you share an example of how you proactively identified a workplace improvement or solved a recurring bottleneck without being asked?",
      category: "Proactive Initiative",
      difficulty: "Practical",
      idealCriteria: "Identifies inefficiencies independently, proposes practical solutions, and takes ownership of implementation.",
    },
  ],
};

/**
 * Returns role-specific, high-quality fallback questions matching the Interview Blueprint.
 * Completely eliminates mismatched software questions on non-technical roles.
 */
export function getRoleSpecificFallbackQuestions(
  blueprint: InterviewBlueprint,
  count = 3
): ValidatedQuestion[] {
  const bank = FALLBACK_QUESTION_BANKS[blueprint.category] || FALLBACK_QUESTION_BANKS.general;
  const primarySkill = blueprint.primarySkills[0] || "";
  const targetCount = Math.max(1, count);
  const result: ValidatedQuestion[] = [];

  for (let index = 0; index < targetCount; index++) {
    const item = bank[index % bank.length];
    let questionText = item.question;
    // Contextualize with primary skill if applicable and non-software
    if (primarySkill && blueprint.category === "office_admin" && index === 0 && !questionText.includes(primarySkill)) {
      questionText = `In your previous experience with ${primarySkill}, what tools or workflows do you rely on to manage your daily tasks efficiently?`;
    }

    result.push({
      order: index + 1,
      question: questionText,
      category: item.category,
      difficulty: item.difficulty,
      idealCriteria: item.idealCriteria,
      source: "fallback",
    });
  }

  return result;
}
