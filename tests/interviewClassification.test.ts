import {
  classifyJobRole,
  createInterviewBlueprint,
  validateGeneratedQuestions,
  getRoleSpecificFallbackQuestions,
  InterviewCategory,
} from "../src/services/ai/interviewRoleClassifier";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log("=== RUNNING AI INTERVIEW ROLE CLASSIFICATION & RELIABILITY TEST SUITE ===\n");

// TC-01: Root Cause Case - Computer Operator with Candidate claiming to be Software Engineer
console.log("--- TC-01: Computer Operator Job + Software Engineer Candidate ---");
const tc01Job = {
  title: "Computer operator",
  requiredSkills: ["MS Office", "Data Entry", "Typing", "Excel"],
  department: "Administration",
  description: "Responsible for managing computer records, entering customer data into spreadsheets, and maintaining documentation.",
};
const tc01Candidate = {
  fullName: "Akki Rathod",
  headline: "Software Engineer | React | Node.js", // Polluted candidate profile
  skills: ["React", "TypeScript", "Node.js", "Docker"],
};

// Candidate profile MUST NOT affect classification
const tc01Classification = classifyJobRole(tc01Job);
assert(
  tc01Classification.category === "office_admin",
  `Computer operator classified as office_admin (actual: ${tc01Classification.category})`
);
assert(
  tc01Classification.role === "computer_operator",
  `Specific role identified as computer_operator (actual: ${tc01Classification.role})`
);
assert(
  tc01Classification.confidence >= 0.8,
  `Confidence is high (actual: ${tc01Classification.confidence})`
);

const tc01Blueprint = createInterviewBlueprint(tc01Job, tc01Classification);
assert(
  tc01Blueprint.forbiddenTopics.includes("state management"),
  "Forbidden topics include 'state management'"
);
assert(
  tc01Blueprint.forbiddenTopics.includes("microservices"),
  "Forbidden topics include 'microservices'"
);

// TC-02: Backend Developer with Office Assistant Candidate
console.log("\n--- TC-02: Backend Developer Job + Office Assistant Candidate ---");
const tc02Classification = classifyJobRole({
  title: "Senior Backend Developer",
  requiredSkills: ["Node.js", "PostgreSQL", "Redis", "Distributed Systems"],
  description: "Architect high-throughput microservices and API gateways.",
});
assert(
  tc02Classification.category === "software",
  `Backend Developer classified as software (actual: ${tc02Classification.category})`
);

// TC-03: Accountant Job + Software Engineer Candidate
console.log("\n--- TC-03: Senior Accountant Job + Software Engineer Candidate ---");
const tc03Classification = classifyJobRole({
  title: "Senior Accountant",
  requiredSkills: ["Tally Prime", "GST Filing", "Bank Reconciliation", "Taxation"],
  department: "Finance",
});
assert(
  tc03Classification.category === "accounting",
  `Accountant classified as accounting (actual: ${tc03Classification.category})`
);

// TC-04: Sales Executive Job + DevOps Candidate
console.log("\n--- TC-04: Business Development / Sales Executive Job ---");
const tc04Classification = classifyJobRole({
  title: "Business Development Executive (B2B Sales)",
  requiredSkills: ["Lead Generation", "Cold Calling", "Client Pitching", "CRM"],
  department: "Sales",
});
assert(
  tc04Classification.category === "sales",
  `Sales Executive classified as sales (actual: ${tc04Classification.category})`
);

// TC-05: HR Recruiter Job + Full Stack Candidate
console.log("\n--- TC-05: Talent Acquisition Specialist / HR Recruiter ---");
const tc05Classification = classifyJobRole({
  title: "Talent Acquisition Specialist",
  requiredSkills: ["Tech Sourcing", "Interview Scheduling", "HR Operations", "Onboarding"],
  department: "Human Resources",
});
assert(
  tc05Classification.category === "hr",
  `HR Specialist classified as hr (actual: ${tc05Classification.category})`
);

// TC-06: Customer Support Job
console.log("\n--- TC-06: Customer Support Executive ---");
const tc06Classification = classifyJobRole({
  title: "Customer Support Executive (Voice/Chat)",
  requiredSkills: ["Zendesk", "Customer Escalation", "Issue Resolution", "Communication"],
});
assert(
  tc06Classification.category === "customer_support",
  `Customer support classified as customer_support (actual: ${tc06Classification.category})`
);

// TC-07: Operations / Logistics Job
console.log("\n--- TC-07: Warehouse Operations Coordinator ---");
const tc07Classification = classifyJobRole({
  title: "Supply Chain & Warehouse Operations Coordinator",
  requiredSkills: ["Inventory Control", "Dispatch Planning", "Vendor Management"],
});
assert(
  tc07Classification.category === "operations",
  `Operations role classified as operations (actual: ${tc07Classification.category})`
);

// TC-08: Marketing Job
console.log("\n--- TC-08: Digital Marketing Specialist ---");
const tc08Classification = classifyJobRole({
  title: "Digital Marketing Specialist",
  requiredSkills: ["SEO", "Google Ads", "Meta Ads", "Content Strategy"],
});
assert(
  tc08Classification.category === "marketing",
  `Digital Marketing classified as marketing (actual: ${tc08Classification.category})`
);

// TC-09: Ambiguous / Vague Job falls back to General safely
console.log("\n--- TC-09: Vague Job Title with minimal context ---");
const tc09Classification = classifyJobRole({
  title: "General Management Trainee",
});
assert(
  tc09Classification.category === "general",
  `Vague role classified as general (actual: ${tc09Classification.category})`
);

// TC-10: Cross-Domain Hallucination Rejection
console.log("\n--- TC-10: Cross-Domain Hallucination Rejection ---");
const hallucinatedQuestions = [
  {
    order: 1,
    question: "In your past projects using MS Office, how did you handle state management, edge cases, and performance?",
    category: "Core Skills",
    difficulty: "Practical",
    idealCriteria: "Clear explanation of data flow and state management.",
  },
  {
    order: 2,
    question: "How do you configure Kubernetes microservices with high API latency?",
    category: "Infrastructure",
    difficulty: "Advanced",
    idealCriteria: "Cluster autoscaling.",
  },
];

const rejectionResult = validateGeneratedQuestions(hallucinatedQuestions, tc01Blueprint);
assert(
  !rejectionResult.isValid,
  "Hallucinated questions with forbidden software engineering topics are REJECTED"
);
assert(
  Boolean(rejectionResult.failedReason?.includes("Forbidden cross-domain topic") && rejectionResult.failedReason?.includes("state management")),
  `Rejection reason identifies forbidden topic (actual: "${rejectionResult.failedReason}")`
);

// TC-11: Valid Generated Questions Acceptance
console.log("\n--- TC-11: Valid Non-Technical Questions Acceptance ---");
const validOfficeQuestions = [
  {
    order: 1,
    question: "How do you organize and verify large Excel spreadsheets using formulas like VLOOKUP and Pivot Tables?",
    category: "Core Skills",
    difficulty: "Practical",
    idealCriteria: "Demonstrates accuracy with Excel data processing.",
  },
  {
    order: 2,
    question: "When entering high volumes of customer records, what systematic checklist do you use to ensure zero typos?",
    category: "Data Integrity",
    difficulty: "Practical",
    idealCriteria: "Double-entry checking and formatting rules.",
  },
];
const acceptanceResult = validateGeneratedQuestions(validOfficeQuestions, tc01Blueprint);
assert(
  acceptanceResult.isValid,
  "Authentic office admin questions are accepted"
);
assert(
  acceptanceResult.questions.length === 2,
  "Accepted questions count matches input"
);

// TC-12: Fallback Question Banks for All 9 Categories
console.log("\n--- TC-12: Fallback Question Banks for All Categories ---");
const allCategories: InterviewCategory[] = [
  "software",
  "office_admin",
  "accounting",
  "sales",
  "hr",
  "customer_support",
  "operations",
  "marketing",
  "general",
];

for (const category of allCategories) {
  const blueprint = createInterviewBlueprint(
    { title: `Sample ${category} Role`, requiredSkills: ["Core Skill A", "Core Skill B"] },
    { category, role: "sample", roleKey: "sample", confidence: 0.9, signals: [] }
  );
  const fallbacks = getRoleSpecificFallbackQuestions(blueprint, 4);
  assert(fallbacks.length === 4, `Category '${category}' produces 4 fallback questions`);
  
  // Verify each fallback has valid question string and idealCriteria
  for (const q of fallbacks) {
    assert(q.question.length > 20, `Question length > 20 chars: "${q.question.slice(0, 30)}..."`);
    assert(q.idealCriteria.length > 10, `Ideal criteria valid for: "${q.question.slice(0, 20)}..."`);
    assert(q.source === "fallback", `Source is correctly tagged as 'fallback'`);

    // Verify non-software categories contain no forbidden terms
    if (category !== "software") {
      for (const forbidden of blueprint.forbiddenTopics) {
        const forbiddenPattern = new RegExp(`\\b${forbidden}\\b`, "i");
        assert(
          !forbiddenPattern.test(q.question),
          `Category '${category}' fallback does NOT contain forbidden topic '${forbidden}'`
        );
      }
    }
  }
}

console.log("\n🎉 ALL 12 TEST CASES PASSED SUCCESSFULLY!");
