# SwipeHired QA Remediation & Fix Plan
**Prioritized Engineering Action Plan Following QA Audit**

* **Document Version:** 1.0.0
* **Date:** October 3, 2026
* **Companion Document:** [SWIPEHIRED_QA_REPORT.md](./SWIPEHIRED_QA_REPORT.md)
* **Status:** Ready for Implementation Review

---

## 1. Critical Bugs (P0 — Blockers)

*No P0 architectural blockers were found that cause total service unavailability or unhandled core process crashes.*

---

## 2. High Severity Bugs (P1)

### BUG-SEC-01: Unauthenticated Public AI Route Consumption
- **Affected Files:** `server.ts` (routes `/api/ai/generate-job` and `/api/ai/match-analysis`)
- **Risk:** Denial-of-wallet / upstream AI API quota exhaustion. Any public actor can make unbounded requests that invoke Eden AI / Gemma 4.
- **Required Fix:**
  1. Add authentication middleware (`requireAuth` or `requireCompanyAuth`) to both routes.
  2. Validate caller's Supabase JWT before invoking AI pipelines.
  3. Reject unauthorized requests with HTTP 401 Unauthorized.

### BUG-SEC-02: Open Row-Level Security Insert Policy on Notifications Table
- **Affected Table:** `public.notifications` in Supabase Postgres
- **Current Policy:** `notifications_insert_policy` with `WITH CHECK (true)` for `TO public`.
- **Risk:** Any client using the public anon key can push forged notifications, phishing links, or spoofed alerts into any user's inbox.
- **Required Fix:**
  1. Drop the permissive `notifications_insert_policy`.
  2. Implement strict authenticated policy:
     ```sql
     DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
     CREATE POLICY "notifications_insert_policy" ON public.notifications
       FOR INSERT TO authenticated
       WITH CHECK (user_id = auth.uid() OR is_admin());
     ```
  3. Ensure server-side system notifications use the Supabase `service_role` client to bypass RLS safely.

---

## 3. Medium Severity Bugs (P2)

### BUG-SEC-03: Unrestricted Select Policy on Companies Table Exposes Internal Metadata
- **Affected Table:** `public.companies`
- **Current Policy:** `companies_select_policy` with `USING (true)` for `TO public`.
- **Risk:** Unauthenticated users can scrape non-public company attributes such as contact details, verification documents, and billing identifiers.
- **Required Fix:**
  1. Restrict public read queries to public-facing columns (e.g. `id`, `name`, `logo_url`, `description`, `website`, `industry`).
  2. Create a secure Postgres view `public_companies` or tighten column-level security.

### BUG-INTV-01: Speech-to-Text Fails with HTTP 422 When STT Credit Exhausted or Silence Recorded
- **Affected Component:** `AIVideoInterviewRoom.tsx` / `transcriptionService.ts`
- **Issue:** When STT fails (due to silent recording or API credit exhaustion), the UI prompts for a retry or re-record, but does not provide an immediate option to switch to a typed text answer.
- **Required Fix:**
  1. In `AIVideoInterviewRoom.tsx`, add a clear "Type Your Answer Instead" button on the transcription error dialog.
  2. Clicking the button opens a text area allowing the candidate to input their response directly and submit it to Gemma 4 evaluation without losing their interview progress.

---

## 4. Low & Cosmetic Bugs (P3 & P4)

### BUG-A11Y-01: Form Controls Missing Explicit Label Associations
- **Affected Components:** `AuthModal.tsx` and registration form components.
- **Issue:** Form input fields lack `<label for="...">` or `aria-label` attributes, triggering browser accessibility warnings.
- **Required Fix:** Add semantic `<label>` elements or `aria-label` attributes to all form controls.

### BUG-UI-01: Sentry Initialization Error on Dummy DSN
- **Affected File:** `src/main.tsx` or Sentry initialization script.
- **Issue:** `Invalid Sentry Dsn` is logged to the console when placeholder credentials are used.
- **Required Fix:** Guard `Sentry.init()` so it only runs if `VITE_SENTRY_DSN` is a valid `https://` URL.

---

## 5. Security Action Items Summary

| ID | Vulnerability | Severity | Target Area | Fix Type |
| :--- | :--- | :--- | :--- | :--- |
| `BUG-SEC-01` | Public LLM Token Consumption | High | Express API (`server.ts`) | Code (Add auth middleware) |
| `BUG-SEC-02` | Unrestricted Notification Insert | High | Supabase Postgres RLS | SQL Migration |
| `BUG-SEC-03` | Company Metadata Exposure | Medium | Supabase Postgres RLS | SQL Migration / View |

---

## 6. Data Integrity & Consistency Items

1. **Transaction Wrapping on Interview Completion:**
   - Ensure the final scorecard write to `interview_evaluations` and the session status update in `interview_sessions` occur atomically so an evaluation is never orphaned without a completed session status.
2. **Application Status Invariants:**
   - Verify that candidates cannot submit duplicate applications for the same `job_id`. Enforce unique constraint `UNIQUE(candidate_id, job_id)` in Postgres if not already indexed.

---

## 7. Performance & Optimization Items

1. **Frontend Code-Splitting:**
   - Implement `React.lazy` on heavy interview components (`AIVideoInterviewRoom`, Lucide chart visualization bundles) to reduce the initial bundle size below 400KB gzipped.
2. **AI Stream Buffer Management:**
   - Ensure streaming responses on Gemma 4 question generation properly dispose of abort controllers on component unmount to prevent leaked open sockets.

---

## 8. Recommended Fix Order (Phase by Phase)

```
┌────────────────────────────────────────────────────────┐
│  Phase 1: Security & RLS Hardening (Immediate)         │
│  - Fix BUG-SEC-01 (Protect /api/ai/* endpoints)        │
│  - Fix BUG-SEC-02 (Lock down notifications RLS)        │
│  - Fix BUG-SEC-03 (Constrain companies select policy)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│  Phase 2: Interview Flow Resilience (High Priority)    │
│  - Fix BUG-INTV-01 (Text-based answer fallback on STT) │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│  Phase 3: Frontend Polish & Accessibility (Standard)   │
│  - Fix BUG-A11Y-01 (Add labels / aria attributes)      │
│  - Fix BUG-UI-01 (Guard Sentry initialization)         │
│  - Implement component lazy-loading                    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│  Phase 4: Verification & Regression Testing            │
│  - Run RS-SEC, RS-INTV, RS-AUTH regression suites      │
│  - Final sign-off for Production Release               │
└────────────────────────────────────────────────────────┘
```

---

## 9. Regression Test Requirements

Before approving the platform for production deployment, the following automated and manual regression tests must be executed and confirmed passing:

### Suite RS-SEC (Security & Access Control)
- [ ] Send unauthenticated request to `POST /api/ai/generate-job`; verify response is `401 Unauthorized`.
- [ ] Send unauthenticated request to `POST /api/ai/match-analysis`; verify response is `401 Unauthorized`.
- [ ] Attempt unauthenticated insertion into `notifications` via Supabase client; verify Postgres error `42501 (insufficient_privilege)`.
- [ ] Query `companies` table using public anon key; verify internal private fields are not exposed.

### Suite RS-INTV (Interview & AI Pipeline)
- [ ] Start technical interview for candidate; verify questions generated by Gemma 4 are role-relevant.
- [ ] Submit a typed answer; verify answer quality score and constructive feedback are returned by Gemma 4.
- [ ] Submit an evasive response ("idk", "pass"); verify evasion score is appropriately low (<= 0.25).
- [ ] Trigger STT failure; verify candidate can switch to typed answer without losing session state.
- [ ] Complete interview session; verify status updates to `completed` and final scorecard is rendered.

### Suite RS-AUTH (Authentication & Session)
- [ ] Sign in with valid credentials; verify session token is persisted and user redirected to appropriate dashboard.
- [ ] Attempt sign in with invalid password; verify clean error message is displayed and no crash occurs.
- [ ] Attempt access to `/admin` as regular candidate/company; verify access denied redirect.

---
*Fix Plan approved for developer handoff.*
