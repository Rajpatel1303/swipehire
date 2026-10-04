# SwipeHired — AI Interview Role Classification & Generation Reliability Report

## 1. Executive Summary

This engineering initiative resolves the root-cause defect where non-technical job candidates (e.g., Computer Operator, Accountant, Office Assistant) were being asked software engineering interview questions (e.g., *"In your past projects using MS Office, how did you handle state management, edge cases, and performance?"*).

### The Root Cause Breakdown:
1. **Candidate Profile Pollution**: The emergency fallback classifier evaluated:
   ```ts
   // PREVIOUS DEFECTIVE LOGIC:
   const isTechRole = /developer|engineer|coder|architect|programmer/i.test(
     safeJobTitle + " " + (candidate?.headline || "")
   );
   ```
   When a user with a technical profile (e.g. signed up via GitHub with a headline like *"Software Engineer"*) applied for a non-technical job (e.g. *"Computer operator"*), the regex matched their applicant headline, misclassifying the job opening as software engineering.
2. **Template Skill Slot Inversion**: The software fallback template inserted the first job skill (`MS Office`) into a software architecture question:
   ```
   "In your past projects using MS Office, how did you handle state management...?"
   ```
3. **Timeout / Token Mismatch**: Eden AI / Gemma 4 generates chain-of-thought tokens during inference. With an uncalibrated timeout and output token limit, requests were aborting prematurely or truncating, triggering the polluted fallback generator.

---

## 2. Architecture of the Solution

```
┌────────────────────────────────────────────────────────┐
│               JOB OPENING DATA ONLY                    │
│   (Title, Department, Required Skills, Description)   │
└──────────────────────────┬─────────────────────────────┘
                           │ 0% Candidate Contamination
                           ▼
┌────────────────────────────────────────────────────────┐
│         DETERMINISTIC ROLE CLASSIFIER                  │
│       (9-Category Multi-Signal Classifier)             │
│   • software         • office_admin    • accounting    │
│   • sales            • hr              • customer_care │
│   • operations       • marketing       • general       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│              SERVER INTERVIEW BLUEPRINT                │
│  - jobTitle: "Computer operator"                       │
│  - category: "office_admin"                            │
│  - forbiddenTopics: ["state management", "react", ...] │
│  - allowedCompetencies: ["Data Entry", "MS Office", ..]│
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│            OPTIMIZED GEMMA 4 31B INFERENCE             │
│  - Timeout: 40,000ms (Generates in ~23s)               │
│  - max_tokens: 1200                                    │
│  - Strict JSON schema + forbidden topics directive     │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│            QUESTION VALIDATION & GATEWAY               │
│  - Checks question length & JSON structure             │
│  - Enforces forbidden topic rejection (zero tolerance) │
└────────────┬───────────────────────────────┬───────────┘
             │ PASS                          │ FAIL / TIMEOUT
             ▼                               ▼
┌─────────────────────────┐     ┌────────────────────────┐
│ Live Verified Questions │     │ Curated Role Fallback  │
│ (Excel, Word, Filing)   │     │ (5 Questions per Role) │
└─────────────────────────┘     └────────────────────────┘
```

---

## 3. Key Components Implemented

### A. Role Classifier (`src/services/ai/interviewRoleClassifier.ts`)
- **Strict Decoupling**: Candidate headlines and resumes are strictly omitted from classification input.
- **Hierarchical Signal Engine**:
  1. Title Regex Matching (Weight: 0.95)
  2. Department Signal Matching (Weight: 0.80)
  3. Skill/Corpus Density Differential (Confidence: 0.60–0.90)
  4. Neutral Graceful Fallback (`general`, Confidence: 0.40)
- **Zero Tech Force**: Unmatched or low-confidence jobs are assigned to `general`, never forced into software engineering.

### B. Interview Blueprint & Anti-Hallucination Guardrails
- **Forbidden Topics Dictionary**: Non-software roles automatically receive an anti-hallucination dictionary including:
  `state management`, `component lifecycle`, `react`, `redux`, `kubernetes`, `docker`, `microservices`, `api latency`, `compute cost`, `distributed systems`, `ci/cd pipeline`, `pull request`, `sql injection`, `cache invalidation`, `orm mapping`, `deadlock`, `race condition`.
- **Validation Engine (`validateGeneratedQuestions`)**: Any question containing cross-domain software terms in a non-software interview is rejected immediately.

### C. Curated Fallback Banks (5 Questions per Category)
- 45 handcrafted, high-depth scenario questions covering all 9 categories:
  - **Office & Administration**: Excel VLOOKUP/Pivot tables, high-volume duplicate elimination, Word formatting, troubleshooting frozen PCs, document confidentiality.
  - **Accounting**: Bank reconciliation differences, ledger voucher verification, GST/TDS tax verification, Tally Prime / QuickBooks trial balances, audit trail integrity.
  - **Sales**: BANT lead qualification, pricing objection handling, CRM pipeline hygiene, deal closing, handover to customer success.
  - **HR**: Boolean passive candidate sourcing, STAR structured behavioral interviews, workplace conflict mediation, onboarding workflows, statutory compliance.
  - **Customer Support**: De-escalating refund requests, queue SLA management, bug escalation, omnichannel clarity, handling unsupported feature requests.
  - **Operations**: Workflow bottleneck diagnosis, vendor SLA coordination, supply chain disruptions, KPI dashboards, change management.
  - **Marketing**: Cross-channel ROI attribution, persona segmentation, A/B ad testing, content calendars, mid-flight campaign troubleshooting.
  - **Software**: Production architecture trade-offs, debugging memory leaks, resilient testing, low-latency DB design, zero-downtime releases.
  - **General**: Task prioritization, adapting to unexpected changes, cross-department communication, self-review checklists, proactive initiative.

### D. Synchronized Server & Cloudflare Worker
- Updated both `src/worker.ts` and `server.ts` with identical logic:
  - 40-second execution safety timeout
  - 1200 bounded output tokens
  - Direct integration with `interviewRoleClassifier.ts`

---

## 4. Test & Verification Results

### Automated Regression Suite (`tests/interviewClassification.test.ts`)
12 of 12 comprehensive unit and regression tests passed:
- `TC-01`: "Computer Operator" with Software Engineer candidate $\rightarrow$ classified as `office_admin` (confidence: 0.95), forbidden topics verified.
- `TC-02`: "Backend Developer" with Office Assistant candidate $\rightarrow$ classified as `software`.
- `TC-03`: "Senior Accountant" with Software Engineer candidate $\rightarrow$ classified as `accounting`.
- `TC-04`: "Sales Executive" with DevOps candidate $\rightarrow$ classified as `sales`.
- `TC-05`: "HR Recruiter" with Full Stack candidate $\rightarrow$ classified as `hr`.
- `TC-06`: "Customer Support Executive" $\rightarrow$ classified as `customer_support`.
- `TC-07`: "Warehouse Operations Coordinator" $\rightarrow$ classified as `operations`.
- `TC-08`: "Digital Marketing Specialist" $\rightarrow$ classified as `marketing`.
- `TC-09`: "General Management Trainee" (ambiguous) $\rightarrow$ safely classified as `general`.
- `TC-10`: Cross-domain hallucination rejection verified (state management in office admin rejected).
- `TC-11`: Authentic office admin questions accepted.
- `TC-12`: Fallback bank integrity verified for all 9 categories (zero forbidden words across all generated questions).

### Live Gemma 4 API Benchmark (`tests/liveGemmaPromptTest.ts`)
- **Latency**: 23,772ms (under 25s, well within 40s safety limit).
- **Generated Questions**:
  1. *"You are tasked with entering 500 daily transactional records into an Excel spreadsheet. What specific steps do you take to ensure 100% accuracy and prevent typing errors during this process?"*
  2. *"You need to format a multi-page official document in Microsoft Word to ensure it looks professional and consistent. How do you handle headings, page numbering, and layout alignment?"*
  3. *"While managing a large dataset in Excel, you find that several entries have been duplicated. Which Excel features would you use to quickly identify and remove these duplicates?"*
- **Validation**: 100% Valid, 0% Technical Cross-Pollution.

---

## 5. Build Verification
- `npm run lint` (`tsc --noEmit`): **Passed with 0 errors**.
- `npm run build` (`vite build` + `esbuild`): **Passed successfully**.
- `wrangler deploy --dry-run`: **Passed successfully**.
