-- ============================================================================
-- SWIPEHIRED PHASE 2 DATABASE MIGRATION
-- ============================================================================

-- 1. AI Operations Telemetry Table
CREATE TABLE IF NOT EXISTS public.ai_operations (
  id text PRIMARY KEY DEFAULT 'ai_op_' || substr(md5(random()::text), 1, 16),
  feature text NOT NULL,
  model text NOT NULL,
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'retried')),
  duration_ms integer NOT NULL DEFAULT 0,
  user_id text,
  error_code text,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_operations_created_at ON public.ai_operations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_operations_feature ON public.ai_operations(feature);
CREATE INDEX IF NOT EXISTS idx_ai_operations_status ON public.ai_operations(status);

ALTER TABLE public.ai_operations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access to ai_operations" ON public.ai_operations;
CREATE POLICY "Admins full access to ai_operations" ON public.ai_operations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2. System Errors Table
CREATE TABLE IF NOT EXISTS public.system_errors (
  id text PRIMARY KEY DEFAULT 'err_' || substr(md5(random()::text), 1, 16),
  service text NOT NULL CHECK (service IN ('api', 'ai', 'email', 'whatsapp', 'database', 'frontend')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  error_code text NOT NULL,
  message text NOT NULL,
  stack_trace text,
  request_id text,
  user_id text,
  entity_type text,
  entity_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'ignored')),
  admin_notes text,
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_errors_created_at ON public.system_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_errors_status ON public.system_errors(status);
CREATE INDEX IF NOT EXISTS idx_system_errors_service ON public.system_errors(service);
CREATE INDEX IF NOT EXISTS idx_system_errors_severity ON public.system_errors(severity);

ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access to system_errors" ON public.system_errors;
CREATE POLICY "Admins full access to system_errors" ON public.system_errors
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. Communication Logs Table
CREATE TABLE IF NOT EXISTS public.communication_logs (
  id text PRIMARY KEY DEFAULT 'comm_' || substr(md5(random()::text), 1, 16),
  channel text NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  recipient text NOT NULL,
  sender text NOT NULL,
  template_id text,
  template_name text,
  subject text,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'pending', 'retried')),
  error_message text,
  error_code text,
  provider text NOT NULL DEFAULT 'smtp',
  provider_message_id text,
  related_entity_type text,
  related_entity_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communication_logs_created_at ON public.communication_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_logs_channel ON public.communication_logs(channel);
CREATE INDEX IF NOT EXISTS idx_communication_logs_status ON public.communication_logs(status);

ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access to communication_logs" ON public.communication_logs;
CREATE POLICY "Admins full access to communication_logs" ON public.communication_logs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. Admin RBAC Infrastructure
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id text PRIMARY KEY,
  category text NOT NULL,
  description text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admin_role_permissions (
  role_id text NOT NULL REFERENCES public.admin_roles(id) ON DELETE CASCADE,
  permission_id text NOT NULL REFERENCES public.admin_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.admin_user_roles (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id text NOT NULL REFERENCES public.admin_roles(id) ON DELETE CASCADE,
  assigned_by uuid,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view rbac" ON public.admin_roles;
CREATE POLICY "Admins can view rbac" ON public.admin_roles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view permissions" ON public.admin_permissions;
CREATE POLICY "Admins can view permissions" ON public.admin_permissions FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view role_permissions" ON public.admin_role_permissions;
CREATE POLICY "Admins can view role_permissions" ON public.admin_role_permissions FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view user_roles" ON public.admin_user_roles;
CREATE POLICY "Admins can view user_roles" ON public.admin_user_roles FOR SELECT USING (public.is_admin());

-- 5. Extend admin_reports with priority and category
ALTER TABLE public.admin_reports
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general' CHECK (category IN ('candidate', 'company', 'job', 'application', 'marketplace', 'communication', 'general'));
