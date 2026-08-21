# ? SwipeHired — Modern AI-Powered Recruitment & Blind Hiring Platform

SwipeHired is a next-generation hiring platform connecting ambitious engineering talent with high-growth companies through an AI-powered swipe matching deck, Kanban pipeline management, and an anonymous 72-hour blind marketplace.

---

## ??? Architecture Overview

```text
SwipeHired Architecture:
+-- Frontend (React 19 + TypeScript + Vite + Tailwind CSS v4)
¦   +-- src/components/         # Domain UI components (candidate, company, marketplace, admin)
¦   +-- src/context/            # AppContext centralized reactive state engine
¦   +-- src/hooks/              # Domain hooks (useAuth, useMarketplace, useSwipeDeck, useNotifications)
¦   +-- src/services/supabase/  # Modular domain database & auth services
¦   +-- src/services/ai/        # Provider-abstracted AI services (Resume parsing, Job Architect, Match Scoring)
¦
+-- Serverless Edge Backend (Cloudflare Pages Functions)
¦   +-- functions/api/health.ts           # Health check endpoint
¦   +-- functions/api/ai/parse-resume.ts  # Edge OCR & LLM resume parser
¦   +-- functions/api/ai/generate-job.ts  # Edge job description architect
¦   +-- functions/api/ai/match-analysis.ts# Edge candidate-job match scoring
¦
+-- Database & Security (Supabase PostgreSQL + RLS)
¦   +-- Row Level Security (RLS) active across all 13 PostgreSQL tables
¦   +-- Performance B-Tree indexes on frequent query paths
¦   +-- Audit Logging table (`audit_logs`) tracking security & status transitions
```

---

## ?? Security & Environment Variables

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | **Client-Safe** | Supabase Project URL (`https://czrswxwefgiwjhalljui.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | **Client-Safe** | Supabase Public Anonymous API Key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only** | Privileged server-side key (NEVER exposed to frontend bundle) |
| `EDENAI_API_KEY` | **Server-Only** | Eden AI / OpenAI API key used exclusively in backend proxy routes |
| `APP_URL` | **Server/Build** | Production application origin |

---

## ?? Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Rajpatel1303/swipehire.git
   cd swipehire
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your keys.

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Type Check & Lint**:
   ```bash
   npm run lint
   ```

6. **Production Build**:
   ```bash
   npm run build
   ```

---

## ?? Cloudflare Pages Deployment

1. Connect your GitHub repository (`Rajpatel1303/swipehire`) in the **Cloudflare Dashboard** under **Workers & Pages**.
2. **Build Settings**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `EDENAI_API_KEY`
4. Click **Save and Deploy**.

---

## ??? Supabase Row Level Security (RLS)

- **`profiles`**: Users can only update their own identity.
- **`candidates`**: Candidates only modify their own profile; public profiles are safely browsable.
- **`companies`**: Recruiters can only modify their own company profile and job postings.
- **`applications`**: Candidates only see applications they submitted; companies only see applications for their jobs.
- **`blind_talent_profiles`**: Zero personal contact info is exposed until a candidate explicitly accepts an upfront bid.
- **`audit_logs`**: Immutable append-only audit trail for compliance and status change history.
