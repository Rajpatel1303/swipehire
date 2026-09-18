export type AdminView =
  | "overview"
  | "candidates"
  | "companies"
  | "jobs"
  | "applications"
  | "interviews"
  | "reports"
  | "ai-operations"
  | "system-errors"
  | "email-operations"
  | "whatsapp-operations"
  | "templates"
  | "marketplace"
  | "rbac"
  | "audit-logs";

export interface AdminUser {
  id: string;
  email: string;
  role: "super_admin" | "admin" | "moderator" | "support" | "company" | "candidate";
  permissions?: string[];
  fullName?: string;
  createdAt?: string;
}

export interface CandidateRecord {
  id: string;
  userId?: string | null;
  fullName: string;
  email: string;
  headline: string;
  location: string;
  yearsOfExperience: number;
  expectedSalary?: string | null;
  skills: string[];
  possibleRoles?: string[];
  preferredRole?: string | null;
  workPreference?: string | null;
  bio?: string | null;
  education?: any[] | null;
  experience?: any[] | null;
  projects?: any[] | null;
  resumeFilename?: string | null;
  resumeText?: string | null;
  isCompleted?: boolean | null;
  isSuspended?: boolean | null;
  commissionAgreementSigned?: boolean | null;
  commissionAgreementSignedAt?: string | null;
  commissionAgreementDocId?: string | null;
  commissionAgreementSignature?: {
    fullLegalName?: string;
    agreedPlacementFeePct?: number;
    signatureType?: string;
    signedAt?: string;
    sha256AuditHash?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyRecord {
  id: string;
  userId?: string | null;
  companyName: string;
  email: string;
  contactPerson: string;
  industry: string;
  location: string;
  size: string;
  website?: string | null;
  about?: string | null;
  isVerified?: boolean | null;
  isSuspended?: boolean | null;
  isCompleted?: boolean | null;
  activeJobCount?: number;
  slaInfo?: {
    avgResponseHours: number;
    ghostingRatePct: number;
    feedbackGuaranteePct: number;
    badgeTier: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobRecord {
  id: string;
  companyId: string;
  companyName?: string;
  title: string;
  department: string;
  location: string;
  workMode: string;
  salary: string;
  experience: string;
  description: string;
  openings: number;
  status: "active" | "draft" | "paused" | "closed";
  isFeatured?: boolean | null;
  requiredSkills?: string[];
  preferredSkills?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditRecord {
  id: string;
  actorUserId?: string | null;
  actorId: string;
  actorEmail?: string | null;
  actorRole: "candidate" | "company" | "admin" | "system";
  targetUserId?: string | null;
  companyId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface SupportSessionRecord {
  id: string;
  adminUserId: string;
  adminEmail: string;
  targetUserId: string;
  targetUserRole: "candidate" | "company";
  targetCompanyId?: string | null;
  reason: string;
  sessionToken: string;
  status: "active" | "ended" | "expired";
  startedAt: string;
  expiresAt: string;
  endedAt?: string | null;
}

export interface ReportRecord {
  id: string;
  targetType: "candidate" | "company" | "job" | "application" | "marketplace" | "communication" | "other";
  targetId: string;
  targetName: string;
  reason: string;
  description?: string | null;
  reportedBy: string;
  status: "open" | "investigating" | "action_taken" | "dismissed" | "resolved";
  priority?: "high" | "normal" | "low";
  category?: string;
  adminNotes?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  createdAt: string;
}

export interface ApplicationRecord {
  id: string;
  candidateId: string;
  candidateName?: string;
  candidateHeadline?: string;
  candidateEmail?: string;
  companyId: string;
  companyName?: string;
  jobId: string;
  jobTitle?: string;
  jobDepartment?: string;
  status: "applied" | "screening" | "shortlisted" | "interview" | "offered" | "hired" | "rejected" | "withdrawn";
  appliedAt: string;
  lastUpdatedAt: string;
  matchScore?: number;
  stageHistory?: any[];
  interviewDetails?: any;
}

export interface InterviewRecord {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  companyId: string;
  companyName: string;
  jobId: string;
  jobTitle: string;
  scheduledAt: string;
  durationMinutes: number;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  interviewerName?: string;
  meetingLink?: string;
  stage: string;
  notes?: string;
  feedback?: string;
  rating?: number;
  createdAt: string;
}

export interface SearchResultItem {
  type: "candidate" | "company" | "job" | "application" | "report" | "error" | "communication" | "bid";
  id: string;
  title: string;
  subtitle: string;
}

export interface GlobalSearchResult {
  candidates: SearchResultItem[];
  companies: SearchResultItem[];
  jobs: SearchResultItem[];
  applications: SearchResultItem[];
  reports?: SearchResultItem[];
  errors?: SearchResultItem[];
  communications?: SearchResultItem[];
  bids?: SearchResultItem[];
}

export interface PlatformMetrics {
  totalCandidates: number;
  totalCompanies: number;
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  newCandidatesToday: number;
  newCompaniesToday: number;
  jobsPostedToday: number;
  applicationsToday: number;
  pendingReports: number;
  upcomingInterviews: number;
  activeSupportSessions: number;
  recentAuditEvents: AuditRecord[];
}

// Phase 2 Operational Types
export interface AIOperationRecord {
  id: string;
  feature: string;
  model: string;
  status: "success" | "failed" | "retried";
  duration_ms: number;
  user_id?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  requestsToday: number;
  failuresToday: number;
  avgDurationMs: number;
  featureStats: Record<string, { requests: number; successes: number; failures: number; avgDuration: number }>;
}

export interface SystemErrorRecord {
  id: string;
  service: "api" | "ai" | "email" | "whatsapp" | "database" | "frontend";
  severity: "critical" | "high" | "medium" | "low";
  error_code: string;
  message: string;
  stack_trace?: string | null;
  request_id?: string | null;
  user_id?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata?: Record<string, any>;
  status: "open" | "investigating" | "resolved" | "ignored";
  admin_notes?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  created_at: string;
}

export interface SystemErrorMetrics {
  total: number;
  open: number;
  investigating: number;
  resolved: number;
  critical: number;
  today: number;
}

export interface CommunicationLogRecord {
  id: string;
  channel: "email" | "whatsapp";
  recipient: string;
  sender: string;
  template_id?: string | null;
  template_name?: string | null;
  subject?: string | null;
  status: "sent" | "delivered" | "failed" | "pending" | "retried";
  error_message?: string | null;
  error_code?: string | null;
  provider: string;
  provider_message_id?: string | null;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CommunicationMetrics {
  email: { total: number; sent: number; failed: number };
  whatsapp: { total: number; sent: number; failed: number };
  todayCount: number;
}

export interface CommunicationTemplateRecord {
  id: string;
  company_id?: string | null;
  title: string;
  category: string;
  subject?: string;
  body_template?: string;
  message_template?: string;
  created_at: string;
}

export interface MarketplaceBidRecord {
  id: string;
  blind_talent_id: string;
  company_id: string;
  job_id?: string | null;
  job_title: string;
  seniority_tier: string;
  salary_offer: string;
  work_mode: string;
  pitch_message: string;
  status: string;
  candidate_revealed_name?: string | null;
  expires_at: string;
  created_at: string;
  companies?: {
    id: string;
    company_name: string;
    logo?: string;
  };
}

export interface BlindProfileRecord {
  id: string;
  candidate_id: string;
  anonymous_handle: string;
  avatar_seed: string;
  headline: string;
  experience_years: number;
  location: string;
  work_preference: string;
  verified_skills: any;
  target_salary_range: string;
  preferred_roles?: string[];
  availability_notice: string;
  superpowers?: string[];
  is_listed: boolean;
  active_bids_count: number;
  created_at: string;
}

export interface MarketplaceMetrics {
  activeProfiles: number;
  activeBids: number;
  acceptedBids: number;
  expiredBids: number;
  todayBids: number;
}

export interface AdminRoleRecord {
  id: string;
  name: string;
  description: string;
  created_at: string;
  permissions: string[];
}

export interface AdminMemberRecord {
  id: string;
  email: string;
  createdAt: string;
  assignedRole: string;
  assignedAt: string;
}
