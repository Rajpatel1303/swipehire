-- Phase 3 Migration: SwipeHired AI Interview Module
-- Creates tables: interview_templates, interview_questions, interview_sessions, interview_answers, interview_evaluations
-- Adds interview_settings to jobs table

-- 1. Add interview_settings to jobs table if not exists
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS interview_settings jsonb DEFAULT '{"type": "ai_generated", "questions": []}'::jsonb;

-- 2. Create interview_templates table
CREATE TABLE IF NOT EXISTS public.interview_templates (
  id text PRIMARY KEY DEFAULT ('tmpl_' || substr(md5(random()::text), 1, 16)),
  company_id text REFERENCES public.companies(id) ON DELETE CASCADE,
  job_id text REFERENCES public.jobs(id) ON DELETE CASCADE,
  title text NOT NULL,
  interview_type text NOT NULL CHECK (interview_type IN ('company_questions', 'ai_generated', 'hybrid')),
  total_questions integer NOT NULL DEFAULT 5,
  target_skills text[] DEFAULT '{}'::text[],
  company_questions jsonb DEFAULT '[]'::jsonb,
  guidelines text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Create interview_sessions table
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id text PRIMARY KEY DEFAULT ('isess_' || substr(md5(random()::text), 1, 16)),
  company_id text REFERENCES public.companies(id) ON DELETE CASCADE,
  candidate_id text REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_id text REFERENCES public.jobs(id) ON DELETE CASCADE,
  template_id text REFERENCES public.interview_templates(id) ON DELETE SET NULL,
  interview_type text NOT NULL CHECK (interview_type IN ('company_questions', 'ai_generated', 'hybrid')),
  mode text NOT NULL DEFAULT 'chat' CHECK (mode IN ('chat', 'voice', 'video', 'coding')),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('pending', 'in_progress', 'completed', 'abandoned')),
  current_question_index integer NOT NULL DEFAULT 1,
  total_planned_questions integer NOT NULL DEFAULT 5,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Create interview_questions table
CREATE TABLE IF NOT EXISTS public.interview_questions (
  id text PRIMARY KEY DEFAULT ('iq_' || substr(md5(random()::text), 1, 16)),
  session_id text REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  template_id text REFERENCES public.interview_templates(id) ON DELETE CASCADE,
  question_order integer NOT NULL,
  question_text text NOT NULL,
  category text NOT NULL DEFAULT 'Technical',
  difficulty text DEFAULT 'Practical',
  source text NOT NULL DEFAULT 'ai_generated' CHECK (source IN ('company', 'ai_generated', 'follow_up')),
  parent_question_id text REFERENCES public.interview_questions(id) ON DELETE SET NULL,
  ideal_criteria text,
  created_at timestamptz DEFAULT now()
);

-- 5. Create interview_answers table
CREATE TABLE IF NOT EXISTS public.interview_answers (
  id text PRIMARY KEY DEFAULT ('ians_' || substr(md5(random()::text), 1, 16)),
  session_id text NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  question_id text NOT NULL REFERENCES public.interview_questions(id) ON DELETE CASCADE,
  candidate_id text NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  answer_text text NOT NULL,
  answer_quality_score numeric(4, 2) DEFAULT 0.0,
  ai_assessment text,
  follow_up_triggered boolean DEFAULT false,
  follow_up_question_id text,
  response_time_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 6. Create interview_evaluations table
CREATE TABLE IF NOT EXISTS public.interview_evaluations (
  id text PRIMARY KEY DEFAULT ('ieval_' || substr(md5(random()::text), 1, 16)),
  session_id text NOT NULL UNIQUE REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  candidate_id text NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  overall_score integer NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  technical_score integer NOT NULL CHECK (technical_score >= 0 AND technical_score <= 100),
  problem_solving_score integer NOT NULL CHECK (problem_solving_score >= 0 AND problem_solving_score <= 100),
  project_understanding_score integer NOT NULL CHECK (project_understanding_score >= 0 AND project_understanding_score <= 100),
  communication_score integer NOT NULL CHECK (communication_score >= 0 AND communication_score <= 100),
  role_knowledge_score integer NOT NULL CHECK (role_knowledge_score >= 0 AND role_knowledge_score <= 100),
  verdict text NOT NULL,
  strengths text[] DEFAULT '{}'::text[],
  areas_to_explore text[] DEFAULT '{}'::text[],
  ai_summary text NOT NULL,
  detailed_feedback jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_company ON public.interview_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate ON public.interview_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_job ON public.interview_sessions(job_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_session ON public.interview_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_answers_session ON public.interview_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_evaluations_session ON public.interview_evaluations(session_id);

-- 8. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.interview_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_evaluations ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies: interview_templates
CREATE POLICY interview_templates_select ON public.interview_templates
  FOR SELECT TO authenticated, anon
  USING (
    company_id IS NULL OR
    company_id = get_auth_company_id() OR
    is_admin()
  );

CREATE POLICY interview_templates_all ON public.interview_templates
  FOR ALL TO authenticated, anon
  USING (
    company_id = get_auth_company_id() OR
    is_admin()
  )
  WITH CHECK (
    company_id = get_auth_company_id() OR
    is_admin()
  );

-- 10. RLS Policies: interview_sessions
CREATE POLICY interview_sessions_select ON public.interview_sessions
  FOR SELECT TO authenticated, anon
  USING (
    company_id = get_auth_company_id() OR
    candidate_id = get_auth_candidate_id() OR
    is_admin()
  );

CREATE POLICY interview_sessions_write ON public.interview_sessions
  FOR ALL TO authenticated, anon
  USING (
    company_id = get_auth_company_id() OR
    candidate_id = get_auth_candidate_id() OR
    is_admin()
  )
  WITH CHECK (
    company_id = get_auth_company_id() OR
    candidate_id = get_auth_candidate_id() OR
    is_admin()
  );

-- 11. RLS Policies: interview_questions
CREATE POLICY interview_questions_select ON public.interview_questions
  FOR SELECT TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions s
      WHERE s.id = interview_questions.session_id
      AND (s.company_id = get_auth_company_id() OR s.candidate_id = get_auth_candidate_id() OR is_admin())
    ) OR
    EXISTS (
      SELECT 1 FROM public.interview_templates t
      WHERE t.id = interview_questions.template_id
      AND (t.company_id = get_auth_company_id() OR is_admin() OR t.company_id IS NULL)
    )
  );

CREATE POLICY interview_questions_write ON public.interview_questions
  FOR ALL TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions s
      WHERE s.id = interview_questions.session_id
      AND (s.company_id = get_auth_company_id() OR is_admin())
    ) OR is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interview_sessions s
      WHERE s.id = interview_questions.session_id
      AND (s.company_id = get_auth_company_id() OR is_admin())
    ) OR is_admin()
  );

-- 12. RLS Policies: interview_answers
CREATE POLICY interview_answers_select ON public.interview_answers
  FOR SELECT TO authenticated, anon
  USING (
    candidate_id = get_auth_candidate_id() OR
    EXISTS (
      SELECT 1 FROM public.interview_sessions s
      WHERE s.id = interview_answers.session_id
      AND (s.company_id = get_auth_company_id() OR is_admin())
    ) OR is_admin()
  );

CREATE POLICY interview_answers_write ON public.interview_answers
  FOR ALL TO authenticated, anon
  USING (
    candidate_id = get_auth_candidate_id() OR
    EXISTS (
      SELECT 1 FROM public.interview_sessions s
      WHERE s.id = interview_answers.session_id
      AND (s.company_id = get_auth_company_id() OR is_admin())
    ) OR is_admin()
  )
  WITH CHECK (
    candidate_id = get_auth_candidate_id() OR
    EXISTS (
      SELECT 1 FROM public.interview_sessions s
      WHERE s.id = interview_answers.session_id
      AND (s.company_id = get_auth_company_id() OR is_admin())
    ) OR is_admin()
  );

-- 13. RLS Policies: interview_evaluations
CREATE POLICY interview_evaluations_select ON public.interview_evaluations
  FOR SELECT TO authenticated, anon
  USING (
    company_id = get_auth_company_id() OR
    candidate_id = get_auth_candidate_id() OR
    is_admin()
  );

CREATE POLICY interview_evaluations_write ON public.interview_evaluations
  FOR ALL TO authenticated, anon
  USING (
    company_id = get_auth_company_id() OR
    is_admin()
  )
  WITH CHECK (
    company_id = get_auth_company_id() OR
    is_admin()
  );
