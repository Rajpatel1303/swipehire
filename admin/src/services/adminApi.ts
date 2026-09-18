import { supabase } from "./supabase";
import {
  CandidateRecord,
  CompanyRecord,
  JobRecord,
  AuditRecord,
  PlatformMetrics,
  ReportRecord,
  ApplicationRecord,
  InterviewRecord,
  GlobalSearchResult,
  AIOperationRecord,
  AIMetrics,
  SystemErrorRecord,
  SystemErrorMetrics,
  CommunicationLogRecord,
  CommunicationMetrics,
  CommunicationTemplateRecord,
  MarketplaceBidRecord,
  BlindProfileRecord,
  MarketplaceMetrics,
  AdminRoleRecord,
  AdminMemberRecord,
} from "../types";

class AdminApiService {
  private async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("No active admin session found. Please sign in.");
    }
    return session.access_token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errBody.error || `Admin API Error ${res.status}: ${res.statusText}`);
    }

    return res.json();
  }

  // ==================== METRICS & OVERVIEW ====================
  async getMetrics(): Promise<PlatformMetrics> {
    return this.request<PlatformMetrics>("/api/admin/metrics");
  }

  // ==================== CANDIDATE MANAGEMENT ====================
  async getCandidates(): Promise<CandidateRecord[]> {
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      fullName: c.full_name || "Unnamed Candidate",
      email: c.email || "",
      headline: c.headline || "",
      location: c.location || "",
      yearsOfExperience: c.years_of_experience || 0,
      expectedSalary: c.expected_salary,
      skills: Array.isArray(c.skills) ? c.skills : [],
      possibleRoles: c.possible_roles || [],
      preferredRole: c.preferred_role,
      workPreference: c.work_preference,
      bio: c.bio,
      education: Array.isArray(c.education) ? c.education : [],
      experience: Array.isArray(c.experience) ? c.experience : [],
      projects: Array.isArray(c.projects) ? c.projects : [],
      resumeFilename: c.resume_filename,
      resumeText: c.resume_text,
      isCompleted: c.is_completed,
      isSuspended: c.is_suspended,
      commissionAgreementSigned: c.commission_agreement_signed,
      commissionAgreementSignedAt: c.commission_agreement_signed_at,
      commissionAgreementDocId: c.commission_agreement_doc_id,
      commissionAgreementSignature: c.commission_agreement_signature,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  }

  async toggleCandidateSuspension(id: string, isSuspended: boolean): Promise<any> {
    return this.request(`/api/admin/candidates/${id}/suspend`, {
      method: "POST",
      body: JSON.stringify({ isSuspended }),
    });
  }

  async verifyCandidateSkills(id: string, skills: string[]): Promise<any> {
    return this.request(`/api/admin/candidates/${id}/verify-skills`, {
      method: "POST",
      body: JSON.stringify({ skills }),
    });
  }

  async resetCandidatePreferences(id: string): Promise<any> {
    return this.request(`/api/admin/candidates/${id}/reset-preferences`, {
      method: "POST",
    });
  }

  async deleteCandidate(id: string): Promise<any> {
    return this.request(`/api/admin/candidates/${id}`, {
      method: "DELETE",
    });
  }

  // ==================== COMPANY MANAGEMENT ====================
  async getCompanies(): Promise<CompanyRecord[]> {
    const [companiesRes, slasRes, jobsRes] = await Promise.all([
      supabase.from("companies").select("*").order("created_at", { ascending: false }),
      supabase.from("company_slas").select("*"),
      supabase.from("jobs").select("id, company_id, status"),
    ]);

    if (companiesRes.error) throw companiesRes.error;

    const slasMap = new Map((slasRes.data || []).map((s: any) => [s.company_id, s]));
    const jobsData = jobsRes.data || [];

    return (companiesRes.data || []).map((co: any) => {
      const sla = slasMap.get(co.id);
      const activeJobs = jobsData.filter((j: any) => j.company_id === co.id && j.status === "active").length;

      return {
        id: co.id,
        userId: co.user_id,
        companyName: co.company_name || "Unnamed Company",
        email: co.email || "",
        contactPerson: co.contact_person || "",
        industry: co.industry || "",
        location: co.location || "",
        size: co.size || "",
        website: co.website,
        about: co.about,
        isVerified: co.is_verified,
        isSuspended: co.is_suspended,
        isCompleted: co.is_completed,
        activeJobCount: activeJobs,
        slaInfo: sla
          ? {
              avgResponseHours: sla.avg_response_hours,
              ghostingRatePct: sla.ghosting_rate_pct,
              feedbackGuaranteePct: sla.feedback_guarantee_pct,
              badgeTier: sla.badge_tier,
            }
          : null,
        createdAt: co.created_at,
        updatedAt: co.updated_at,
      };
    });
  }

  async toggleCompanyVerification(id: string, isVerified: boolean): Promise<any> {
    return this.request(`/api/admin/companies/${id}/verify`, {
      method: "POST",
      body: JSON.stringify({ isVerified }),
    });
  }

  async toggleCompanySuspension(id: string, isSuspended: boolean): Promise<any> {
    return this.request(`/api/admin/companies/${id}/suspend`, {
      method: "POST",
      body: JSON.stringify({ isSuspended }),
    });
  }

  // ==================== JOB MODERATION ====================
  async getJobs(): Promise<JobRecord[]> {
    const [jobsRes, companiesRes] = await Promise.all([
      supabase.from("jobs").select("*").order("created_at", { ascending: false }),
      supabase.from("companies").select("id, company_name"),
    ]);

    if (jobsRes.error) throw jobsRes.error;

    const companyMap = new Map((companiesRes.data || []).map((c: any) => [c.id, c.company_name]));

    return (jobsRes.data || []).map((j: any) => ({
      id: j.id,
      companyId: j.company_id,
      companyName: companyMap.get(j.company_id) || "Direct Employer",
      title: j.title || "Untitled Role",
      department: j.department || "",
      location: j.location || "",
      workMode: j.work_mode || "On-site",
      salary: j.salary || "Not specified",
      experience: j.experience || "",
      description: j.description || "",
      openings: j.openings || 1,
      status: j.status || "active",
      isFeatured: j.is_featured,
      requiredSkills: j.required_skills || [],
      preferredSkills: j.preferred_skills || [],
      createdAt: j.created_at,
      updatedAt: j.updated_at,
    }));
  }

  async updateJobStatus(id: string, status: "active" | "draft" | "paused" | "closed"): Promise<any> {
    return this.request(`/api/admin/jobs/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  }

  async toggleJobFeatured(id: string, isFeatured: boolean): Promise<any> {
    return this.request(`/api/admin/jobs/${id}/feature`, {
      method: "POST",
      body: JSON.stringify({ isFeatured }),
    });
  }

  async deleteJob(id: string): Promise<any> {
    return this.request(`/api/admin/jobs/${id}`, {
      method: "DELETE",
    });
  }

  // ==================== SUPPORT SESSIONS ====================
  async startSupportSession(params: {
    targetUserId: string;
    targetRole: "candidate" | "company";
    targetEntityId: string;
    targetName: string;
    reason: string;
  }): Promise<{ success: boolean; sessionId: string; sessionToken: string; expiresAt: string; redirectUrl: string }> {
    return this.request("/api/admin/support-sessions/start", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async getSupportSessions(targetUserId?: string): Promise<any[]> {
    const query = targetUserId ? `?targetUserId=${encodeURIComponent(targetUserId)}` : "";
    const res = await this.request<{ success: boolean; sessions: any[] }>(`/api/admin/support-sessions${query}`);
    return res.sessions || [];
  }

  // ==================== AUDIT LOGS ====================
  async getAuditLogs(options?: {
    entityType?: string;
    action?: string;
    role?: string;
    companyId?: string;
    targetUserId?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditRecord[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.entityType && options.entityType !== "all") params.append("entityType", options.entityType);
    if (options?.action && options.action !== "all") params.append("action", options.action);
    if (options?.role && options.role !== "all") params.append("role", options.role);
    if (options?.companyId) params.append("companyId", options.companyId);
    if (options?.targetUserId) params.append("targetUserId", options.targetUserId);
    if (options?.fromDate) params.append("fromDate", options.fromDate);
    if (options?.toDate) params.append("toDate", options.toDate);
    if (options?.search) params.append("search", options.search);
    if (options?.limit) params.append("limit", String(options.limit));
    if (options?.offset) params.append("offset", String(options.offset));

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const res = await this.request<{ success: boolean; logs: AuditRecord[]; total: number }>(`/api/admin/audit-logs${queryStr}`);
    return { logs: res.logs || [], total: res.total || 0 };
  }

  async getEntityAuditTimeline(entityId: string, targetUserId?: string): Promise<AuditRecord[]> {
    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (targetUserId) {
      query = query.or(`entity_id.eq.${entityId},target_user_id.eq.${targetUserId},company_id.eq.${entityId}`);
    } else {
      query = query.or(`entity_id.eq.${entityId},company_id.eq.${entityId}`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("[AdminApi] getEntityAuditTimeline warning:", error.message);
      return [];
    }
    return (data || []).map((r: any) => ({
      id: r.id,
      actor_user_id: r.actor_user_id,
      actor_id: r.actor_id,
      actor_email: r.actor_email,
      actor_role: r.actor_role,
      target_user_id: r.target_user_id,
      company_id: r.company_id,
      action: r.action,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      old_data: r.old_data,
      new_data: r.new_data,
      metadata: r.metadata,
      created_at: r.created_at,
    }));
  }

  // ==================== GLOBAL SEARCH ====================
  async globalSearch(q: string): Promise<GlobalSearchResult> {
    return this.request<GlobalSearchResult>(`/api/admin/search?q=${encodeURIComponent(q)}`);
  }

  // ==================== REPORTS & MODERATION ====================
  async getReports(params?: {
    status?: string;
    targetType?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ reports: ReportRecord[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== "all") searchParams.append("status", params.status);
    if (params?.targetType && params.targetType !== "all") searchParams.append("targetType", params.targetType);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.offset) searchParams.append("offset", String(params.offset));

    const q = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const res = await this.request<{ success: boolean; reports: ReportRecord[]; total: number }>(`/api/admin/reports${q}`);
    return { reports: res.reports || [], total: res.total || 0 };
  }

  async updateReportStatus(id: string, status: string): Promise<any> {
    return this.request(`/api/admin/reports/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  }

  async takeReportAction(id: string, actionType: string, resolutionNotes: string): Promise<any> {
    return this.request(`/api/admin/reports/${id}/action`, {
      method: "POST",
      body: JSON.stringify({ actionType, resolutionNotes }),
    });
  }

  // ==================== APPLICATIONS MANAGEMENT ====================
  async getApplications(params?: {
    status?: string;
    companyId?: string;
    jobId?: string;
    candidateId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ applications: ApplicationRecord[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== "all") searchParams.append("status", params.status);
    if (params?.companyId) searchParams.append("companyId", params.companyId);
    if (params?.jobId) searchParams.append("jobId", params.jobId);
    if (params?.candidateId) searchParams.append("candidateId", params.candidateId);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.offset) searchParams.append("offset", String(params.offset));

    const q = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const res = await this.request<{ success: boolean; applications: ApplicationRecord[]; total: number }>(`/api/admin/applications${q}`);
    return { applications: res.applications || [], total: res.total || 0 };
  }

  async updateApplicationStatus(id: string, status: string, notes?: string): Promise<any> {
    return this.request(`/api/admin/applications/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status, notes }),
    });
  }

  // ==================== INTERVIEWS MANAGEMENT ====================
  async getInterviews(params?: {
    timeFilter?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ interviews: InterviewRecord[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.timeFilter && params.timeFilter !== "all") searchParams.append("timeFilter", params.timeFilter);
    if (params?.status && params.status !== "all") searchParams.append("status", params.status);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.offset) searchParams.append("offset", String(params.offset));

    const q = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const res = await this.request<{ success: boolean; interviews: InterviewRecord[]; total: number }>(`/api/admin/interviews${q}`);
    return { interviews: res.interviews || [], total: res.total || 0 };
  }

  async updateInterviewAction(id: string, payload: {
    action: "reschedule" | "cancel" | "complete";
    date?: string;
    time?: string;
    meetingLink?: string;
    notes?: string;
  }): Promise<any> {
    return this.request(`/api/admin/interviews/${id}/action`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // ==================== ENTITY DRILLDOWNS ====================
  async rejectCompanyVerification(id: string, reason: string): Promise<any> {
    return this.request(`/api/admin/companies/${id}/reject-verification`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async getCandidateApplications(id: string): Promise<any[]> {
    const res = await this.request<{ success: boolean; applications: any[] }>(`/api/admin/candidates/${id}/applications`);
    return res.applications || [];
  }

  async getCompanyJobs(id: string): Promise<any[]> {
    const res = await this.request<{ success: boolean; jobs: any[] }>(`/api/admin/companies/${id}/jobs`);
    return res.jobs || [];
  }

  async getCompanyApplications(id: string): Promise<any[]> {
    const res = await this.request<{ success: boolean; applications: any[] }>(`/api/admin/companies/${id}/applications`);
    return res.applications || [];
  }

  async getJobApplicants(id: string): Promise<any[]> {
    const res = await this.request<{ success: boolean; applicants: any[] }>(`/api/admin/jobs/${id}/applicants`);
    return res.applicants || [];
  }

  // ==================== PHASE 2: AI OPERATIONS ====================
  async getAIMetrics(): Promise<AIMetrics> {
    const res = await this.request<{ success: boolean; metrics: AIMetrics }>("/api/admin/ai/metrics");
    return res.metrics;
  }

  async getAIOperations(params: { page?: number; limit?: number; feature?: string; status?: string; search?: string } = {}): Promise<{ operations: AIOperationRecord[]; total: number; page: number; limit: number }> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.feature) query.set("feature", params.feature);
    if (params.status) query.set("status", params.status);
    if (params.search) query.set("search", params.search);
    return this.request(`/api/admin/ai/operations?${query.toString()}`);
  }

  async retryAIOperation(id: string): Promise<any> {
    return this.request(`/api/admin/ai/operations/${id}/retry`, { method: "POST" });
  }

  // ==================== PHASE 2: SYSTEM ERRORS ====================
  async getErrorMetrics(): Promise<SystemErrorMetrics> {
    const res = await this.request<{ success: boolean; metrics: SystemErrorMetrics }>("/api/admin/errors/metrics");
    return res.metrics;
  }

  async getSystemErrors(params: { page?: number; limit?: number; service?: string; severity?: string; status?: string; search?: string } = {}): Promise<{ errors: SystemErrorRecord[]; total: number; page: number; limit: number }> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.service) query.set("service", params.service);
    if (params.severity) query.set("severity", params.severity);
    if (params.status) query.set("status", params.status);
    if (params.search) query.set("search", params.search);
    return this.request(`/api/admin/errors?${query.toString()}`);
  }

  async updateSystemErrorStatus(id: string, status: string, adminNotes?: string): Promise<any> {
    return this.request(`/api/admin/errors/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status, adminNotes }),
    });
  }

  // ==================== PHASE 2: COMMUNICATIONS ====================
  async getCommunicationMetrics(): Promise<CommunicationMetrics> {
    const res = await this.request<{ success: boolean; metrics: CommunicationMetrics }>("/api/admin/communications/metrics");
    return res.metrics;
  }

  async getCommunicationLogs(params: { page?: number; limit?: number; channel?: string; status?: string; search?: string } = {}): Promise<{ logs: CommunicationLogRecord[]; total: number; page: number; limit: number }> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.channel) query.set("channel", params.channel);
    if (params.status) query.set("status", params.status);
    if (params.search) query.set("search", params.search);
    return this.request(`/api/admin/communications/logs?${query.toString()}`);
  }

  async retryCommunication(id: string): Promise<any> {
    return this.request(`/api/admin/communications/logs/${id}/retry`, { method: "POST" });
  }

  async getCommunicationTemplates(): Promise<{ emailTemplates: CommunicationTemplateRecord[]; whatsAppTemplates: CommunicationTemplateRecord[] }> {
    return this.request("/api/admin/communications/templates");
  }

  async updateCommunicationTemplate(channel: "email" | "whatsapp", id: string, updates: any): Promise<any> {
    return this.request(`/api/admin/communications/templates/${channel}/${id}`, {
      method: "POST",
      body: JSON.stringify(updates),
    });
  }

  // ==================== PHASE 2: MARKETPLACE ====================
  async getMarketplaceMetrics(): Promise<MarketplaceMetrics> {
    const res = await this.request<{ success: boolean; metrics: MarketplaceMetrics }>("/api/admin/marketplace/metrics");
    return res.metrics;
  }

  async getMarketplaceBids(params: { page?: number; limit?: number; status?: string; search?: string } = {}): Promise<{ bids: MarketplaceBidRecord[]; total: number; page: number; limit: number }> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.status) query.set("status", params.status);
    if (params.search) query.set("search", params.search);
    return this.request(`/api/admin/marketplace/bids?${query.toString()}`);
  }

  async getMarketplaceProfiles(): Promise<BlindProfileRecord[]> {
    const res = await this.request<{ success: boolean; profiles: BlindProfileRecord[] }>("/api/admin/marketplace/profiles");
    return res.profiles;
  }

  async actionMarketplaceBid(id: string, action: "expire" | "cancel" | "flag"): Promise<any> {
    return this.request(`/api/admin/marketplace/bids/${id}/action`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
  }

  // ==================== PHASE 2: RBAC ====================
  async getRBACRoles(): Promise<{ roles: AdminRoleRecord[]; permissions: { id: string; category: string; description: string }[] }> {
    return this.request("/api/admin/rbac/roles");
  }

  async getRBACAdmins(): Promise<AdminMemberRecord[]> {
    const res = await this.request<{ success: boolean; admins: AdminMemberRecord[] }>("/api/admin/rbac/admins");
    return res.admins;
  }

  async assignAdminRole(userId: string, roleId: string): Promise<any> {
    return this.request(`/api/admin/rbac/admins/${userId}/role`, {
      method: "POST",
      body: JSON.stringify({ roleId }),
    });
  }

  // ==================== PHASE 2: REPORT PRIORITY ====================
  async updateReportPriority(id: string, priority: "high" | "normal" | "low"): Promise<any> {
    return this.request(`/api/admin/reports/${id}/priority`, {
      method: "POST",
      body: JSON.stringify({ priority }),
    });
  }
}

export const AdminApi = new AdminApiService();
