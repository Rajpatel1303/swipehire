import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import {
  UserRole,
  AuthStatus,
  CandidateProfile,
  CompanyProfile,
  Job,
  Application,
  ApplicationStatus,
  SwipeInteraction,
  NotificationItem,
  EmailTemplate,
  WhatsAppTemplate,
  AdminReport,
  InterviewDetails,
  BlindTalentProfile,
  TalentBid,
  WorkMode,
  CompanySLAInfo,
  ConstructiveFeedback,
} from "../types";
import { GeminiService } from "../services/geminiService";
import { SupabaseService } from "../services/supabaseService";
import { supabase } from "../services/supabaseClient";
import { calculateJobMatch } from "../utils/matchingEngine";
import { DEFAULT_EMAIL_TEMPLATES, DEFAULT_WHATSAPP_TEMPLATES } from "../services/defaultTemplates";
import { safeStorage } from "../utils/safeStorage";
import { SupportSessionClient, SupportSessionData } from "../utils/supportSession";
import { GitHubService } from "../services/githubService";
import { buildDesignedEmailHtml } from "../utils/emailDesigner";

export const emptyCandidateProfile: CandidateProfile = {
  id: "",
  fullName: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  workPreference: "Hybrid",
  yearsOfExperience: 0,
  skills: [],
  possibleRoles: [],
  education: [],
  experience: [],
  projects: [],
  certifications: [],
  expectedSalary: "",
  preferredRole: "",
  bio: "",
  profilePhoto: "",
  profileStrength: 0,
  isCompleted: false,
  commissionAgreementSigned: false,
};

export const emptyCompanyProfile: CompanyProfile = {
  id: "",
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  logo: "",
  website: "",
  industry: "",
  size: "",
  location: "",
  about: "",
  culture: [],
  benefits: [],
  isCompleted: false,
  emailIntegration: {
    provider: "none",
    connectedEmail: "",
    senderName: "",
    isConnected: false,
  },
  isVerified: false,
};

export const generateCandidateBlindProfile = (c: CandidateProfile, isListed = false): BlindTalentProfile => {
  const shortId = (c.id || "cand").replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "704";
  return {
    id: `blind_${c.id || "cand_self"}`,
    candidateId: c.id || "cand_self",
    anonymousHandle: `Anonymous ${c.preferredRole || "Tech Specialist"} #${shortId}`,
    avatarSeed: shortId,
    headline: c.headline || `${c.yearsOfExperience || 3}+ Years Experience in ${(c.skills || ["React", "TypeScript"]).slice(0, 2).join(" & ")}`,
    experienceYears: c.yearsOfExperience || 3,
    location: c.location || "Bengaluru / Remote",
    workPreference: (c.workPreference as any) || "Hybrid",
    verifiedSkills: (c.skills && c.skills.length > 0 ? c.skills : ["React", "TypeScript", "Node.js"]).map((s, idx) => ({
      name: s,
      level: idx === 0 ? "Expert" : idx === 1 ? "Advanced" : "Proficient",
      years: Math.max(1, (c.yearsOfExperience || 3) - idx),
    })),
    proofOfWork: (c.projects && c.projects.length > 0 ? c.projects : [
      { title: "Core Platform Architecture", description: "Designed and implemented scalable multi-tenant services with high uptime.", technologies: ["React", "Node.js", "PostgreSQL"] }
    ]).map((p: any) => ({
      title: p.title || "Production Architecture",
      metrics: "Sub-50ms p99 latency under peak user traffic",
      technologies: p.technologies || c.skills || ["TypeScript", "React"],
    })),
    targetSalaryRange: c.expectedSalary || "₹16–22 LPA",
    preferredRoles: [c.preferredRole || "Senior Software Engineer", "Full Stack Specialist"],
    availabilityNotice: "15 Days / Immediate",
    superpowers: [
      "Engineered real-time sync engine supporting high concurrent throughput",
      "Authored automated CI/CD pipeline reducing build latencies by 60%",
    ],
    isListed: isListed,
    activeBidsCount: 0,
  };
};

export type ActiveView =
  | "landing"
  | "auth-select"
  | "candidate-signup"
  | "candidate-login"
  | "candidate-onboarding"
  | "candidate-review"
  | "candidate-agreement"
  | "candidate-radar"
  | "candidate-jobs"
  | "candidate-job-detail"
  | "candidate-applications"
  | "candidate-profile"
  | "company-signup"
  | "company-login"
  | "company-onboarding"
  | "company-cockpit"
  | "company-applications"
  | "company-jobs"
  | "company-add-job"
  | "company-job-detail"
  | "company-pipeline"
  | "company-email-connect"
  | "company-interviews"
  | "company-compare"
  | "blind-marketplace";

interface AppContextType {
  // Supabase Live Status
  isSupabaseConnected: boolean;
  isSupabaseSyncing: boolean;
  refreshFromSupabase: () => Promise<void>;

  // Supabase Auth & State Machine
  authStatus: AuthStatus;
  isAuthLoading: boolean;
  authUser: any | null;
  authSignUp: (params: {
    email: string;
    password: string;
    role: "candidate" | "company";
    fullName?: string;
    companyName?: string;
    contactPerson?: string;
  }) => Promise<{
    success: boolean;
    needsEmailConfirmation: boolean;
    email?: string;
    error?: string;
  }>;
  authSignIn: (params: {
    email: string;
    password: string;
    roleHint?: "candidate" | "company" | "admin";
  }) => Promise<{
    success: boolean;
    role?: UserRole;
    isEmailNotConfirmed?: boolean;
    error?: string;
  }>;
  authSignInWithGoogle: (
    role: "candidate" | "company"
  ) => Promise<{ error?: string }>;
  authSignInWithGitHub: (
    role?: "candidate"
  ) => Promise<{ error?: string }>;
  connectCandidateGitHub: (
    username: string
  ) => Promise<{ success: boolean; error?: string }>;
  resendConfirmationEmail: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  authSignOut: () => Promise<void>;

  // Navigation & Auth
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedJobId: string | null;
  setSelectedJobId: (id: string | null) => void;
  selectedApplicationId: string | null;
  setSelectedApplicationId: (id: string | null) => void;

  // Candidate State
  candidate: CandidateProfile;
  updateCandidate: (updated: Partial<CandidateProfile>) => void;
  setCandidate: React.Dispatch<React.SetStateAction<CandidateProfile>>;
  missingProfileFields: string[];
  isCandidateProfileComplete: boolean;
  signCommissionAgreement: (
    signatureData: {
      signerName: string;
      signatureStyle?: string;
      signatureHash: string;
      timestamp: string;
      ipStamp?: string;
    },
    docId?: string
  ) => Promise<boolean>;

  // Company State
  company: CompanyProfile;
  updateCompany: (updated: Partial<CompanyProfile>) => Promise<boolean>;
  setCompany: React.Dispatch<React.SetStateAction<CompanyProfile>>;
  isCompanyProfileComplete: boolean;

  // All Candidate records (for recruiters & admin)
  allCandidates: CandidateProfile[];

  // Jobs State
  jobs: Job[];
  addJob: (job: Omit<Job, "id" | "createdAt">) => Job;
  updateJob: (id: string, updated: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  duplicateJob: (id: string) => void;
  toggleJobStatus: (id: string, newStatus: Job["status"]) => void;
  isAddJobModalOpen: boolean;
  setIsAddJobModalOpen: (open: boolean) => void;
  openAddJobModal: () => void;

  // Applications & Pipeline
  applications: Application[];
  applyToJob: (jobId: string, customCandidate?: CandidateProfile) => Promise<boolean>;
  updateApplicationStatus: (
    applicationId: string,
    newStatus: ApplicationStatus,
    note?: string
  ) => void;
  rejectApplication: (applicationId: string, reason?: string) => void;
  deleteApplication: (applicationId: string) => void;
  deleteCandidate: (applicationId: string, deletePermanently?: boolean) => void;
  expireApplication: (applicationId: string) => void;
  purgeExpiredApplications: () => void;
  simulateFastForwardApplication: (applicationId: string, hours?: number) => void;
  scheduleInterview: (
    applicationId: string,
    interviewDetails: InterviewDetails
  ) => void;

  // Reverse Hiring Marketplace (Blind Talent Bidding)
  blindTalentProfiles: BlindTalentProfile[];
  talentBids: TalentBid[];
  updateBlindTalentProfile: (id: string, updated: Partial<BlindTalentProfile>) => void;
  toggleCandidateListing: (isListed: boolean) => void;
  submitTalentBid: (
    bid: Omit<TalentBid, "id" | "createdAt" | "expiresAt" | "status">
  ) => void;
  respondToTalentBid: (
    bidId: string,
    action: "accept" | "counter" | "decline" | "withdraw_counter",
    counterDetails?: {
      proposedSalary: string;
      proposedWorkMode: string;
      note: string;
    }
  ) => void;
  companyRespondToCounterOffer: (
    bidId: string,
    action: "accept" | "counter" | "decline",
    details?: {
      revisedSalary?: string;
      revisedWorkMode?: string;
      note?: string;
    }
  ) => void;

  // Anti-Ghosting SLA Database & Feedback Generator
  companySLAs: Record<string, CompanySLAInfo>;
  requestConstructiveFeedback: (applicationId: string) => Promise<ConstructiveFeedback>;

  // Swipe & Recommendation State
  swipes: SwipeInteraction[];
  handleSwipe: (jobId: string, direction: "left" | "right") => Promise<void> | void;
  handleSwipeLeft: (jobId: string) => void;
  handleSwipeRight: (jobId: string) => Promise<void>;
  radarDeck: Job[];
  candidateMatchedJobs: Job[];
  recommendationNote: string;
  resetSwipes: () => void;

  // Notifications
  notifications: NotificationItem[];
  addNotification: (
    notif: Omit<NotificationItem, "id" | "timestamp" | "read">
  ) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  unreadCount: number;

  // Communication & Templates
  emailTemplates: EmailTemplate[];
  addEmailTemplate: (template: Omit<EmailTemplate, "id"> & { id?: string }) => Promise<EmailTemplate>;
  updateEmailTemplate: (id: string, template: Partial<EmailTemplate>) => Promise<boolean>;
  deleteEmailTemplate: (id: string) => Promise<boolean>;
  whatsAppTemplates: WhatsAppTemplate[];
  updateWhatsAppTemplate: (id: string, template: Partial<WhatsAppTemplate>) => void;
  sendEmailFromCompany: (
    candidateEmail: string,
    subject: string,
    body: string,
    html?: string
  ) => Promise<{ success: boolean; message: string }>;

  // Admin Data & Operations
  adminReports: AdminReport[];
  resolveAdminReport: (id: string, status?: "resolved" | "dismissed") => Promise<void>;
  adminSuspendCandidate: (candidateId: string, isSuspended: boolean) => Promise<boolean>;
  adminVerifyCandidateSkills: (candidateId: string, skills: string[]) => Promise<boolean>;
  adminResetCandidatePreferences: (candidateId: string) => Promise<boolean>;
  adminDeleteCandidate: (candidateId: string) => Promise<boolean>;
  adminVerifyCompany: (companyId: string, isVerified: boolean) => Promise<boolean>;
  adminSuspendCompany: (companyId: string, isSuspended: boolean) => Promise<boolean>;
  adminUpdateJobStatus: (jobId: string, status: Job["status"], isFeatured?: boolean) => Promise<boolean>;
  adminDeleteJob: (jobId: string) => Promise<boolean>;

  // Support Session (Admin Support Mode)
  supportSession: SupportSessionData | null;
  exitSupportMode: () => Promise<void>;

  // Helpers
  triggerCelebration: () => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Support Session State (Tab scoped, initialized from sessionStorage)
  const [supportSession, setSupportSession] = useState<SupportSessionData | null>(() => {
    return SupportSessionClient.get()?.session || null;
  });

  // Supabase connection & Auth Lifecycle State Machine
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(true);
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState<boolean>(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("AUTH_LOADING");
  const isAuthLoading = authStatus === "AUTH_LOADING";
  const [authUser, setAuthUser] = useState<any | null>(null);

  // Local storage persisted state or defaults (using safeStorage with in-memory fallback)
  const [role, setRole] = useState<UserRole>(() => {
    const saved = safeStorage.getItem("swipehired_role");
    return (saved as UserRole) || null;
  });

  const [activeView, setActiveView] = useState<ActiveView>(() => {
    const savedView = safeStorage.getItem("swipehired_activeView");
    if (savedView) return savedView as ActiveView;
    return "landing";
  });

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState<boolean>(false);

  const openAddJobModal = useCallback(() => {
    setIsAddJobModalOpen(true);
  }, []);

  // Profiles
  const [candidate, setCandidate] = useState<CandidateProfile>(() => {
    return safeStorage.getJSON<CandidateProfile>("swipehired_candidate", emptyCandidateProfile);
  });

  const [company, setCompany] = useState<CompanyProfile>(() => {
    return safeStorage.getJSON<CompanyProfile>("swipehired_company", emptyCompanyProfile);
  });

  const [allCandidates, setAllCandidates] = useState<CandidateProfile[]>([]);

  // Jobs
  const [jobs, setJobs] = useState<Job[]>(() => {
    return safeStorage.getJSON<Job[]>("swipehired_jobs", []);
  });

  // Applications
  const [applications, setApplications] = useState<Application[]>(() => {
    return safeStorage.getJSON<Application[]>("swipehired_applications", []);
  });

  // Reverse Hiring Marketplace (Blind Talent & Bids)
  const [blindTalentProfiles, setBlindTalentProfiles] = useState<BlindTalentProfile[]>(() => {
    const raw = safeStorage.getJSON<BlindTalentProfile[]>("swipehired_blind_talent", []);
    return Array.isArray(raw) ? raw : [];
  });

  const [talentBids, setTalentBids] = useState<TalentBid[]>(() => {
    return safeStorage.getJSON<TalentBid[]>("swipehired_talent_bids", []);
  });

  // Company SLAs
  const [companySLAs, setCompanySLAs] = useState<Record<string, CompanySLAInfo>>({});

  // Swipes
  const [swipes, setSwipes] = useState<SwipeInteraction[]>(() => {
    return safeStorage.getJSON<SwipeInteraction[]>("swipehired_swipes", []);
  });

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    return safeStorage.getJSON<NotificationItem[]>("swipehired_notifications", []);
  });

  // Templates
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(DEFAULT_EMAIL_TEMPLATES);
  const [whatsAppTemplates, setWhatsAppTemplates] = useState<WhatsAppTemplate[]>(DEFAULT_WHATSAPP_TEMPLATES);
  const [adminReports, setAdminReports] = useState<AdminReport[]>([]);

  // Hydrate state from Supabase on mount
  const refreshFromSupabase = useCallback(async () => {
    try {
      setIsSupabaseSyncing(true);
      const isOnline = await SupabaseService.ping();
      setIsSupabaseConnected(isOnline);

      if (isOnline) {
        const [
          dbCompanies,
          dbCandidates,
          dbJobs,
          dbApps,
          dbBlind,
          dbBids,
          dbSlas,
          dbNotifs,
          dbReports,
          dbEmailTmpl,
          dbWaTmpl,
        ] = await Promise.all([
          SupabaseService.getCompanies(),
          SupabaseService.getCandidates(),
          SupabaseService.getJobs(),
          SupabaseService.getApplications(),
          SupabaseService.getBlindTalentProfiles(),
          SupabaseService.getTalentBids(),
          SupabaseService.getCompanySLAs(),
          SupabaseService.getNotifications(),
          SupabaseService.getAdminReports(),
          SupabaseService.getEmailTemplates(company.id || undefined),
          SupabaseService.getWhatsAppTemplates(),
        ]);

        let activeCompanyId = company.id;
        if (authUser) {
          if (role === "company" && dbCompanies && dbCompanies.length > 0) {
            const currentCompany = dbCompanies.find(
              (c) => c.userId === authUser.id || c.email === authUser.email || (company.id && c.id === company.id)
            );
            if (currentCompany) {
              setCompany(currentCompany);
              activeCompanyId = currentCompany.id;
            }
          } else if (role === "candidate" && dbCandidates && dbCandidates.length > 0) {
            const currentCandidate = dbCandidates.find(
              (c) => c.userId === authUser.id || c.email === authUser.email || (candidate.id && c.id === candidate.id)
            );
            if (currentCandidate) setCandidate(currentCandidate);
          }
        } else {
          if (company.id && dbCompanies && dbCompanies.length > 0) {
            const currentCompany = dbCompanies.find((c) => c.id === company.id);
            if (currentCompany) {
              setCompany(currentCompany);
              activeCompanyId = currentCompany.id;
            }
          }
          if (candidate.id && dbCandidates && dbCandidates.length > 0) {
            const currentCandidate = dbCandidates.find((c) => c.id === candidate.id);
            if (currentCandidate) setCandidate(currentCandidate);
          }
        }
        setAllCandidates(dbCandidates || []);
        if (role === "company" && activeCompanyId) {
          setJobs((dbJobs || []).filter((j) => j.companyId === activeCompanyId));
          setApplications((dbApps || []).filter((a) => a.companyId === activeCompanyId));
        } else {
          setJobs(dbJobs || []);
          setApplications(dbApps || []);
        }
        setBlindTalentProfiles(dbBlind || []);
        setTalentBids(dbBids || []);
        setCompanySLAs(dbSlas || {});
        setNotifications(dbNotifs || []);
        setAdminReports(dbReports || []);
        setEmailTemplates(dbEmailTmpl && dbEmailTmpl.length > 0 ? dbEmailTmpl : DEFAULT_EMAIL_TEMPLATES);
        setWhatsAppTemplates(dbWaTmpl && dbWaTmpl.length > 0 ? dbWaTmpl : DEFAULT_WHATSAPP_TEMPLATES);
      }
    } catch (err) {
      console.warn("Supabase initial sync notice:", err);
      setIsSupabaseConnected(false);
    } finally {
      setIsSupabaseSyncing(false);
    }
  }, [candidate.id, company.id, authUser, role]);

  useEffect(() => {
    refreshFromSupabase();
  }, [refreshFromSupabase]);

  // Window Focus, Visibility & Cross-Tab Storage Sync
  useEffect(() => {
    const handleFocus = () => {
      refreshFromSupabase();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshFromSupabase();
      }
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "swipehired_talent_bids" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setTalentBids(parsed);
          }
        } catch {
          // ignore parsing error
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshFromSupabase]);

  // Real-time Supabase postgres_changes listener for talent_bids
  useEffect(() => {
    const channel = supabase
      .channel("public_talent_bids_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "talent_bids" },
        async () => {
          try {
            const updated = await SupabaseService.getTalentBids();
            if (updated && updated.length > 0) {
              setTalentBids(updated);
              safeStorage.setJSON("swipehired_talent_bids", updated);
            }
          } catch (e) {
            console.warn("[RealtimeSync] Failed to pull updated bids:", e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Support Session Bootstrap Effect
  useEffect(() => {
    const initSupportSession = async () => {
      try {
        if (typeof window === "undefined") return;
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("support_token");

        if (token) {
          // Immediately strip token from URL to protect against history leakage
          SupportSessionClient.stripTokenFromUrl();

          const res = await fetch(`/api/support-session/validate?token=${encodeURIComponent(token)}`);
          const data = await res.json();

          if (data.valid && data.session) {
            SupportSessionClient.set(token, data.session);
            setSupportSession(data.session);

            const targetRole = data.session.targetRole;
            setRole(targetRole);
            safeStorage.setItem("swipehired_role", targetRole);

            if (targetRole === "candidate") {
              setAuthStatus("AUTHENTICATED_CANDIDATE");
              const cands = await SupabaseService.getCandidates();
              const found = cands.find(
                (c) => c.id === data.session.targetEntityId || c.userId === data.session.targetUserId
              );
              if (found) {
                setCandidate(found);
                safeStorage.setJSON("swipehired_candidate", found);
                setActiveView(found.isCompleted ? "candidate-radar" : "candidate-profile");
              }
            } else if (targetRole === "company") {
              setAuthStatus("AUTHENTICATED_COMPANY");
              const comps = await SupabaseService.getCompanies();
              const found = comps.find(
                (c) => c.id === data.session.targetEntityId || c.userId === data.session.targetUserId
              );
              if (found) {
                setCompany(found);
                safeStorage.setJSON("swipehired_company", found);
                setActiveView("company-cockpit");
              }
            }
          } else {
            console.warn("[SupportSession] Token validation failed:", data.error);
            SupportSessionClient.clear();
            setSupportSession(null);
          }
        } else {
          // Verify if tab already has an active support session
          const existing = SupportSessionClient.get();
          if (existing?.session) {
            setSupportSession(existing.session);
          }
        }
      } catch (err) {
        console.error("[SupportSession Bootstrap Error]:", err);
      }
    };

    initSupportSession();
  }, []);

  // Sync to safe storage
  useEffect(() => {
    if (role) safeStorage.setItem("swipehired_role", role);
    else safeStorage.removeItem("swipehired_role");
  }, [role]);

  useEffect(() => {
    safeStorage.setItem("swipehired_activeView", activeView);
  }, [activeView]);

  useEffect(() => {
    safeStorage.setJSON("swipehired_candidate", candidate);
  }, [candidate]);

  useEffect(() => {
    safeStorage.setJSON("swipehired_company", company);
  }, [company]);

  useEffect(() => {
    safeStorage.setJSON("swipehired_jobs", jobs);
  }, [jobs]);

  useEffect(() => {
    safeStorage.setJSON("swipehired_applications", applications);
  }, [applications]);

  useEffect(() => {
    safeStorage.setJSON("swipehired_swipes", swipes);
  }, [swipes]);

  useEffect(() => {
    safeStorage.setJSON("swipehired_notifications", notifications);
  }, [notifications]);

  useEffect(() => {
    safeStorage.setJSON("swipehired_blind_talent", blindTalentProfiles);
  }, [blindTalentProfiles]);

  useEffect(() => {
    safeStorage.setJSON("swipehired_talent_bids", talentBids);
  }, [talentBids]);

  // 72-Hour SLA Automatic Inactivity Expiration Checker
  useEffect(() => {
    const checkExpiration = () => {
      const now = Date.now();
      let expiredCount = 0;

      setApplications((prev) => {
        let modified = false;
        const next = prev.map((app) => {
          if (app.status === "applied" && !app.isExpired) {
            const appliedTime = new Date(app.appliedAt).getTime();
            const targetDeadline = app.slaDeadline
              ? new Date(app.slaDeadline).getTime()
              : appliedTime + 72 * 3600 * 1000;

            if (now >= targetDeadline) {
              modified = true;
              expiredCount += 1;
              const expiredApp: Application = {
                ...app,
                status: "expired" as ApplicationStatus,
                isExpired: true,
                isLockedDueToInactivity: true,
                expiredAt: new Date().toISOString(),
                timeline: [
                  ...app.timeline,
                  {
                    status: "expired" as ApplicationStatus,
                    timestamp: new Date().toISOString(),
                    note: "72-Hour SLA Expired: Recruiter took no action within 72 hours. Profile is now locked and inaccessible to protect candidate privacy.",
                  },
                ],
              };
              // Persist expiration to Supabase
              SupabaseService.saveApplication(expiredApp).catch(console.warn);
              return expiredApp;
            }
          }
          return app;
        });

        return modified ? next : prev;
      });

      if (expiredCount > 0) {
        addNotification({
          recipientId: company.id,
          role: "company",
          title: "⚠️ 72h Window Expired: Application Inaccessible",
          message: `${expiredCount} unreviewed application(s) exceeded the 72-hour anti-ghosting window and were auto-withdrawn.`,
          type: "status",
          linkAction: "candidates",
        });
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 15000);
    return () => clearInterval(interval);
  }, [company.id]);

  // Candidate completeness calculation
  const missingProfileFields = useMemo(() => {
    const missing: string[] = [];
    if (!candidate.fullName?.trim()) missing.push("Full Name");
    if (!candidate.email?.trim()) missing.push("Email Address");
    if (!candidate.skills || candidate.skills.length === 0) missing.push("Skills");
    if (!candidate.yearsOfExperience && candidate.yearsOfExperience !== 0) missing.push("Years of Experience");
    if (!candidate.education || candidate.education.length === 0) missing.push("Education");
    if (!candidate.profilePhoto?.trim()) missing.push("Profile Photo");
    if (!candidate.preferredRole?.trim()) missing.push("Preferred Job Role");
    if (!candidate.expectedSalary?.trim()) missing.push("Expected Salary");
    if (!candidate.githubData?.connected) missing.push("Connected GitHub Account");
    return missing;
  }, [candidate]);

  const isCandidateProfileComplete = useMemo(() => {
    return (
      !!candidate.fullName &&
      !!candidate.email &&
      candidate.skills?.length > 0 &&
      !!candidate.preferredRole &&
      !!candidate.expectedSalary &&
      !!candidate.githubData?.connected
    );
  }, [candidate]);

  const isCompanyProfileComplete = useMemo(() => {
    return !!company.companyName && !!company.email && !!company.industry && !!company.location;
  }, [company]);

  // Trigger celebration confetti
  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#f97316", "#38bdf8", "#ffffff"],
      });
    } catch {
      // safe fallback
    }
  };

  // Reverse Hiring Marketplace Methods
  const updateBlindTalentProfile = (id: string, updated: Partial<BlindTalentProfile>) => {
    setBlindTalentProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
  };

  const toggleCandidateListing = (isListed: boolean) => {
    const candId = candidate.id || "cand_self";
    let targetProfile: BlindTalentProfile | null = null;

    setBlindTalentProfiles((prev) => {
      const existingIndex = prev.findIndex((p) => p.candidateId === candId);
      if (existingIndex >= 0) {
        const updated = { ...prev[existingIndex], isListed };
        targetProfile = updated;
        const next = [...prev];
        next[existingIndex] = updated;
        return next;
      } else {
        const newProfile = generateCandidateBlindProfile(candidate, isListed);
        targetProfile = newProfile;
        return [newProfile, ...prev];
      }
    });

    setTimeout(() => {
      if (targetProfile) {
        SupabaseService.saveBlindTalentProfile(targetProfile).catch(console.warn);
      }
    }, 50);

    addNotification({
      recipientId: candId,
      role: "candidate",
      title: isListed ? "✨ Blind Talent Pitch is Now LIVE!" : "🔒 Pitch Set to Private",
      message: isListed
        ? "Top companies can now review your verified proof-of-work anonymously and submit upfront salary bids."
        : "Your anonymous pitch has been unlisted from the marketplace.",
      type: "status",
    });

    if (isListed) {
      triggerCelebration();
    }
  };

  const submitTalentBid = (
    bidData: Omit<TalentBid, "id" | "createdAt" | "expiresAt" | "status">
  ) => {
    const newBidId = `bid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 72 * 3600 * 1000).toISOString(); // 72 hour fast-track window

    const newBid: TalentBid = {
      ...bidData,
      id: newBidId,
      createdAt: now.toISOString(),
      expiresAt,
      status: "pending",
    };

    setTalentBids((prev) => [newBid, ...prev]);

    // Persist to Supabase
    SupabaseService.saveTalentBid(newBid).catch(console.warn);

    // Increment candidate's active bids count
    setBlindTalentProfiles((prev) =>
      prev.map((p) =>
        p.id === bidData.blindTalentId
          ? { ...p, activeBidsCount: (p.activeBidsCount || 0) + 1 }
          : p
      )
    );

    // Notify candidate
    addNotification({
      recipientId: bidData.candidateId,
      role: "candidate",
      title: `💎 New Blind Bid: ${bidData.companyName} (${bidData.salaryOffer})`,
      message: `${bidData.companyName} pitched an upfront offer of ${bidData.salaryOffer} for '${bidData.jobTitle}'. You have 72 hours to accept, counter, or pass.`,
      type: "offer",
      linkAction: "marketplace",
    });

    triggerCelebration();
  };

  const respondToTalentBid = (
    bidId: string,
    action: "accept" | "counter" | "decline" | "withdraw_counter",
    counterDetails?: {
      proposedSalary: string;
      proposedWorkMode: string;
      note: string;
    }
  ) => {
    setTalentBids((prev) =>
      prev.map((bid) => {
        if (bid.id !== bidId) return bid;

        if (action === "accept") {
          const agreedSalary = bid.companyCounterDetails?.revisedSalary || bid.salaryOffer;
          const agreedWorkMode = (bid.companyCounterDetails?.revisedWorkMode || bid.workMode) as any;

          // Reveal candidate details
          const updatedBid: TalentBid = {
            ...bid,
            salaryOffer: agreedSalary,
            workMode: agreedWorkMode,
            status: "accepted",
            candidateRevealedName: candidate.fullName,
            candidateRevealedEmail: candidate.email,
            candidateRevealedPhone: candidate.phone,
            candidateRevealedPhoto: candidate.profilePhoto,
            negotiationHistory: [
              ...(bid.negotiationHistory || []),
              {
                sender: "candidate",
                senderName: candidate.fullName || "Anonymous Candidate",
                salary: agreedSalary,
                workMode: agreedWorkMode,
                note: "Candidate accepted offer terms and revealed full profile details.",
                timestamp: new Date().toISOString(),
              },
            ],
          };

          // Automatically convert into an active application in the company's pipeline
          const existingApp = applications.find(
            (a) => a.candidateId === bid.candidateId && a.companyId === bid.companyId
          );

          if (!existingApp) {
            const newApp: Application = {
              id: `app_bid_${Date.now()}`,
              jobId: bid.jobId || "job_custom_bid",
              candidateId: bid.candidateId,
              candidateName: candidate.fullName,
              candidateHeadline: candidate.headline,
              candidatePhoto: candidate.profilePhoto,
              candidateLocation: candidate.location,
              candidateSkills: candidate.skills,
              candidateExpYears: candidate.yearsOfExperience,
              candidateEmail: candidate.email,
              candidatePhone: candidate.phone,
              candidateBio: candidate.bio,
              candidateExpectedSalary: agreedSalary,
              candidateWorkPreference: agreedWorkMode,
              jobTitle: bid.jobTitle,
              companyId: bid.companyId,
              companyName: bid.companyName,
              companyLogo: bid.companyLogo,
              jobLocation: bid.companyLocation,
              jobSalary: agreedSalary,
              jobWorkMode: agreedWorkMode,
              status: "interview",
              appliedAt: new Date().toISOString(),
              lastUpdatedAt: new Date().toISOString(),
              matchScore: 98,
              fitVerdict: "Fast-Track Blind Bid Accepted · Direct Interview",
              matchedSkills: candidate.skills.slice(0, 5),
              matchReasons: [
                `Direct upfront offer accepted (${agreedSalary})`,
                "Fast-track 72h talent bid converted",
              ],
              strengths: [
                "Top-tier anonymous proof of work verified",
                "Immediate alignment on upfront compensation offer",
              ],
              matchConcerns: [],
              aiSummary: `Candidate accepted ${bid.companyName}'s upfront talent bid for ${bid.jobTitle}. Identity revealed and fast-tracked to interview stage.`,
              timeline: [
                {
                  status: "applied",
                  timestamp: bid.createdAt,
                  note: "Company pitched upfront offer in Blind Marketplace",
                },
                {
                  status: "interview",
                  timestamp: new Date().toISOString(),
                  note: `Candidate accepted upfront offer of ${agreedSalary} & revealed identity`,
                },
              ],
            };
            setApplications((apps) => [newApp, ...apps]);
            SupabaseService.saveApplication(newApp).catch(console.warn);
          }

          // Persist updated bid to Supabase
          SupabaseService.saveTalentBid(updatedBid).catch(console.warn);

          // Notify company recruiter
          addNotification({
            recipientId: bid.companyId,
            role: "company",
            title: `🎉 Bid Accepted! Candidate Identity Revealed`,
            message: `${candidate.fullName} accepted your ${agreedSalary} bid for '${bid.jobTitle}'. Full contact info and portfolio are now unlocked!`,
            type: "status",
            linkAction: "pipeline",
          });

          triggerCelebration();
          return updatedBid;
        }

        if (action === "counter") {
          const proposedSalary = counterDetails?.proposedSalary || bid.salaryOffer;
          const proposedWorkMode = counterDetails?.proposedWorkMode || bid.workMode;
          const note = counterDetails?.note || "";

          const updatedBid: TalentBid = {
            ...bid,
            status: "countered",
            lastActionBy: "candidate",
            counterOfferDetails: {
              proposedSalary,
              proposedWorkMode,
              note,
              counteredAt: new Date().toISOString(),
            },
            negotiationHistory: [
              ...(bid.negotiationHistory || []),
              {
                sender: "candidate",
                senderName: candidate.fullName || "Anonymous Candidate",
                salary: proposedSalary,
                workMode: proposedWorkMode,
                note,
                timestamp: new Date().toISOString(),
              },
            ],
          };

          SupabaseService.saveTalentBid(updatedBid).catch(console.warn);

          addNotification({
            recipientId: bid.companyId,
            role: "company",
            title: `💬 Counter-Offer Proposed on Blind Bid`,
            message: `The candidate proposed ${proposedSalary} (${proposedWorkMode}) for '${bid.jobTitle}'.`,
            type: "status",
            linkAction: "marketplace",
          });

          return updatedBid;
        }

        if (action === "decline") {
          const updatedBid: TalentBid = { ...bid, status: "declined", lastActionBy: "candidate" };
          SupabaseService.saveTalentBid(updatedBid).catch(console.warn);
          return updatedBid;
        }

        if (action === "withdraw_counter") {
          const updatedBid: TalentBid = {
            ...bid,
            status: "pending",
            lastActionBy: "candidate",
            counterOfferDetails: undefined,
            companyCounterDetails: undefined,
          };
          SupabaseService.saveTalentBid(updatedBid).catch(console.warn);
          return updatedBid;
        }

        return bid;
      })
    );
  };

  const companyRespondToCounterOffer = (
    bidId: string,
    action: "accept" | "counter" | "decline",
    details?: {
      revisedSalary?: string;
      revisedWorkMode?: string;
      note?: string;
    }
  ) => {
    setTalentBids((prev) =>
      prev.map((bid) => {
        if (bid.id !== bidId) return bid;

        const targetCandidate = allCandidates.find((c) => c.id === bid.candidateId) || candidate;

        if (action === "accept") {
          // Recruiter accepts candidate's proposed counter-offer
          const agreedSalary = bid.counterOfferDetails?.proposedSalary || bid.salaryOffer;
          const agreedWorkMode = (bid.counterOfferDetails?.proposedWorkMode as WorkMode) || bid.workMode;

          const updatedBid: TalentBid = {
            ...bid,
            status: "accepted",
            salaryOffer: agreedSalary,
            workMode: agreedWorkMode,
            lastActionBy: "company",
            candidateRevealedName: targetCandidate.fullName || "Verified Candidate",
            candidateRevealedEmail: targetCandidate.email || "candidate@swipehired.dev",
            candidateRevealedPhone: targetCandidate.phone || "+91 98765 43210",
            candidateRevealedPhoto: targetCandidate.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
            negotiationHistory: [
              ...(bid.negotiationHistory || []),
              {
                sender: "company",
                senderName: company.companyName || "Hiring Team",
                salary: agreedSalary,
                workMode: agreedWorkMode,
                note: details?.note || `Counter-offer accepted at ${agreedSalary}. Fast-tracking to interview!`,
                timestamp: new Date().toISOString(),
              },
            ],
          };

          // Automatically convert into an active application in the company's pipeline
          const existingApp = applications.find(
            (a) => a.candidateId === bid.candidateId && a.companyId === bid.companyId
          );

          if (!existingApp) {
            const newApp: Application = {
              id: `app_bid_${Date.now()}`,
              jobId: bid.jobId || "job_custom_bid",
              candidateId: bid.candidateId,
              candidateName: targetCandidate.fullName || "Verified Candidate",
              candidateHeadline: targetCandidate.headline || "Engineering Talent",
              candidatePhoto: targetCandidate.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
              candidateLocation: targetCandidate.location || "Ahmedabad, India",
              candidateSkills: targetCandidate.skills?.length ? targetCandidate.skills : ["Software Engineering"],
              candidateExpYears: targetCandidate.yearsOfExperience || 3,
              candidateEmail: targetCandidate.email || "candidate@swipehired.dev",
              candidatePhone: targetCandidate.phone || "+91 98765 43210",
              candidateBio: targetCandidate.bio || "",
              candidateExpectedSalary: agreedSalary,
              candidateWorkPreference: agreedWorkMode,
              jobTitle: bid.jobTitle,
              companyId: bid.companyId,
              companyName: bid.companyName,
              companyLogo: bid.companyLogo,
              jobLocation: bid.companyLocation,
              jobSalary: agreedSalary,
              jobWorkMode: agreedWorkMode,
              status: "interview",
              appliedAt: new Date().toISOString(),
              lastUpdatedAt: new Date().toISOString(),
              matchScore: 99,
              fitVerdict: "Agreed on Counter-Offer · Identity Unlocked & Fast-Tracked",
              matchedSkills: targetCandidate.skills?.slice(0, 5) || [],
              matchReasons: [
                `Agreed on candidate counter-offer (${agreedSalary})`,
                "Fast-track 72h talent bid converted",
              ],
              matchConcerns: [],
              aiSummary: `${bid.companyName} accepted candidate's counter-offer for ${bid.jobTitle} at ${agreedSalary}. Identity unlocked and moved to Interview.`,
              timeline: [
                {
                  status: "applied",
                  timestamp: bid.createdAt,
                  note: `Company pitched upfront offer (${bid.salaryOffer}) in Blind Marketplace`,
                },
                {
                  status: "interview",
                  timestamp: new Date().toISOString(),
                  note: `Company accepted candidate counter-offer of ${agreedSalary} (${agreedWorkMode}) & unlocked candidate identity`,
                },
              ],
            };
            setApplications((apps) => [newApp, ...apps]);
            SupabaseService.saveApplication(newApp).catch(console.warn);
          }

          SupabaseService.saveTalentBid(updatedBid).catch(console.warn);

          // Notify Candidate
          addNotification({
            recipientId: bid.candidateId,
            role: "candidate",
            title: `🎉 Counter Accepted by ${bid.companyName}!`,
            message: `${bid.companyName} accepted your counter-offer of ${agreedSalary} for '${bid.jobTitle}'. Your identity is now unlocked and you are in their interview pipeline!`,
            type: "offer",
            linkAction: "applications",
          });

          // Notify Company
          addNotification({
            recipientId: bid.companyId,
            role: "company",
            title: `🤝 Counter-Offer Accepted`,
            message: `You accepted the counter-offer for '${bid.jobTitle}' at ${agreedSalary}. ${targetCandidate.fullName}'s profile is now available in your Pipeline.`,
            type: "status",
            linkAction: "candidates",
          });

          triggerCelebration();
          return updatedBid;
        }

        if (action === "counter") {
          // Company sends a revised counter offer
          const revisedSalary = details?.revisedSalary || bid.salaryOffer;
          const revisedWorkMode = (details?.revisedWorkMode as WorkMode) || bid.workMode;
          const replyNote = details?.note || "";

          const updatedBid: TalentBid = {
            ...bid,
            status: "countered",
            salaryOffer: revisedSalary,
            workMode: revisedWorkMode,
            lastActionBy: "company",
            companyCounterDetails: {
              revisedSalary,
              revisedWorkMode,
              note: replyNote,
              repliedAt: new Date().toISOString(),
            },
            negotiationHistory: [
              ...(bid.negotiationHistory || []),
              {
                sender: "company",
                senderName: company.companyName || "Hiring Team",
                salary: revisedSalary,
                workMode: revisedWorkMode,
                note: replyNote,
                timestamp: new Date().toISOString(),
              },
            ],
          };

          SupabaseService.saveTalentBid(updatedBid).catch(console.warn);

          // Notify Candidate
          addNotification({
            recipientId: bid.candidateId,
            role: "candidate",
            title: `💬 Revised Counter-Offer: ${bid.companyName}`,
            message: `${bid.companyName} replied to your counter with a revised offer: ${revisedSalary} (${revisedWorkMode}). "${replyNote}"`,
            type: "offer",
            linkAction: "marketplace",
          });

          // Notify Company
          addNotification({
            recipientId: bid.companyId,
            role: "company",
            title: `📨 Revised Offer Sent to Candidate`,
            message: `Your revised offer of ${revisedSalary} (${revisedWorkMode}) was dispatched to the candidate in the Blind Marketplace.`,
            type: "status",
          });

          triggerCelebration();
          return updatedBid;
        }

        if (action === "decline") {
          const updatedBid: TalentBid = {
            ...bid,
            status: "declined",
            lastActionBy: "company",
            negotiationHistory: [
              ...(bid.negotiationHistory || []),
              {
                sender: "company",
                senderName: company.companyName || "Hiring Team",
                salary: bid.salaryOffer,
                workMode: bid.workMode,
                note: details?.note || "Offer negotiation concluded.",
                timestamp: new Date().toISOString(),
              },
            ],
          };

          SupabaseService.saveTalentBid(updatedBid).catch(console.warn);

          addNotification({
            recipientId: bid.candidateId,
            role: "candidate",
            title: `Offer Negotiation Closed (${bid.companyName})`,
            message: `${bid.companyName} could not meet the requested counter-offer terms for '${bid.jobTitle}'.`,
            type: "status",
          });

          return updatedBid;
        }

        return bid;
      })
    );
  };

  // Anti-Ghosting Constructive Feedback Generator
  const requestConstructiveFeedback = async (
    applicationId: string
  ): Promise<ConstructiveFeedback> => {
    const targetApp = applications.find((a) => a.id === applicationId);
    if (!targetApp) {
      throw new Error("Application not found");
    }

    if (targetApp.constructiveFeedback) {
      return targetApp.constructiveFeedback;
    }

    const generatedFeedback: ConstructiveFeedback = {
      decision: targetApp.status === "rejected" ? "rejected" : "deferred",
      overallFeedbackSummary: `Thank you for your application for ${targetApp.jobTitle} at ${targetApp.companyName}. Our engineering committee conducted a detailed review of your verified technical background and problem-solving benchmarks.`,
      keyStrengths: [
        `Strong foundational alignment in ${targetApp.matchedSkills?.slice(0, 3).join(", ") || "Core Software Engineering"}`,
        `Solid communication clarity and clean project portfolio documentation`,
        `Hands-on practical experience across modern development tooling`,
      ],
      gapAnalysis: [
        {
          skillOrRequirement: targetApp.missingSkills?.[0] || "Advanced Distributed Architecture",
          roleExpectation: "3+ years production experience with high-throughput distributed architectures & caching",
          candidateObserved: "Demonstrated intermediate fluency; primarily focused on standard API services",
          recommendation: "Build a production-grade playground showcasing queue backpressure, Redis pub/sub, and circuit breaking.",
        },
      ],
      actionPlan: [
        {
          title: `Level Up ${targetApp.missingSkills?.[0] || "System Architecture"}`,
          description: "Follow the system design primer and build an end-to-end benchmarked microservice repository.",
          suggestedResource: "High-Scalability Architecture Guides & System Design Roadmap",
          estimatedTimeToBridge: "3–4 Weeks",
        },
      ],
      reapplyEligibleDate: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
      recruiterEncouragingNote: `${candidate.fullName.split(" ")[0]}, your foundation is exceptionally promising. We encourage you to bridge these milestones and re-apply in 90 days for our fast-track pipeline!`,
    };

    setApplications((prev) =>
      prev.map((a) => {
        if (a.id !== applicationId) return a;
        const updated = { ...a, constructiveFeedback: generatedFeedback };
        SupabaseService.saveApplication(updated).catch(console.warn);
        return updated;
      })
    );

    return generatedFeedback;
  };

  // Update Candidate
  const updateCandidate = (updated: Partial<CandidateProfile>) => {
    setCandidate((prev) => {
      const next = { ...prev, ...updated };
      let strength = 30;
      if (next.fullName) strength += 10;
      if (next.headline) strength += 10;
      if (next.skills?.length >= 3) strength += 15;
      if (next.experience?.length >= 1) strength += 15;
      if (next.education?.length >= 1) strength += 10;
      if (next.projects?.length >= 1) strength += 5;
      if (next.profilePhoto) strength += 5;
      next.profileStrength = Math.min(strength, 100);

      // Persist to Supabase
      SupabaseService.saveCandidate(next).catch(console.warn);

      // Immediately sync local applications in state for real-time recruiter visibility
      if (updated.profilePhoto !== undefined || updated.photoSettings !== undefined) {
        setApplications((prevApps) =>
          prevApps.map((app) =>
            app.candidateId === next.id
              ? {
                  ...app,
                  candidatePhoto: next.profilePhoto || app.candidatePhoto,
                  candidatePhotoSettings: next.photoSettings || app.candidatePhotoSettings,
                }
              : app
          )
        );
      }

      return next;
    });
  };

  // Sign Mandatory 10% Placement Commission Agreement
  const signCommissionAgreement = async (
    signatureData: {
      signerName: string;
      signatureStyle?: string;
      signatureHash: string;
      timestamp: string;
      ipStamp?: string;
    },
    docId?: string
  ): Promise<boolean> => {
    const generatedDocId =
      docId ||
      `SH-AGR-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestamp = signatureData.timestamp || new Date().toISOString();

    updateCandidate({
      commissionAgreementSigned: true,
      commissionAgreementSignedAt: timestamp,
      commissionAgreementDocId: generatedDocId,
      commissionAgreementSignature: {
        ...signatureData,
        timestamp,
      },
      isCompleted: true,
    });

    return true;
  };

  // Update Company
  const updateCompany = async (updated: Partial<CompanyProfile>): Promise<boolean> => {
    const next: CompanyProfile = {
      ...company,
      ...updated,
      userId: updated.userId || company.userId || authUser?.id,
    };
    // Persist to Supabase as single source of truth FIRST
    await SupabaseService.saveCompany(next);
    // Only commit to local state after persistence succeeds
    setCompany(next);
    return true;
  };

  // Add Job
  const addJob = (jobData: Omit<Job, "id" | "createdAt">): Job => {
    const newJob: Job = {
      ...jobData,
      id: `job_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setJobs((prev) => [newJob, ...prev]);

    // Persist to Supabase
    SupabaseService.saveJob(newJob).catch(console.warn);

    // Recruiter notification
    addNotification({
      recipientId: company.id,
      role: "company",
      title: "🚀 Job Published Successfully",
      message: `"${newJob.title}" is now live and matching with top talent on Career Radar!`,
      type: "match",
      linkAction: "jobs",
    });

    return newJob;
  };

  const updateJob = (id: string, updated: Partial<Job>) => {
    const target = jobs.find((j) => j.id === id);
    if (role === "company" && target && company.id && target.companyId !== company.id) {
      console.error("[AppContext] Unauthorized update: Job belongs to another company");
      return;
    }
    // Prevent changing companyId
    const safeUpdated = { ...updated };
    if (target) {
      safeUpdated.companyId = target.companyId;
    }

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== id) return j;
        const next = { ...j, ...safeUpdated, updatedAt: new Date().toISOString() };
        SupabaseService.saveJob(next).catch(console.warn);
        return next;
      })
    );
  };

  const deleteJob = (id: string) => {
    const target = jobs.find((j) => j.id === id);
    if (role === "company" && target && company.id && target.companyId !== company.id) {
      console.error("[AppContext] Unauthorized delete: Job belongs to another company");
      return;
    }
    setJobs((prev) => prev.filter((j) => j.id !== id));
    SupabaseService.deleteJob(id).catch(console.warn);
  };

  const duplicateJob = (id: string) => {
    const target = jobs.find((j) => j.id === id);
    if (!target) return;
    if (role === "company" && company.id && target.companyId !== company.id) {
      console.error("[AppContext] Unauthorized duplicate: Job belongs to another company");
      return;
    }
    const duplicated: Job = {
      ...target,
      id: `job_${Date.now()}`,
      companyId: company.id || target.companyId,
      title: `${target.title} (Copy)`,
      createdAt: new Date().toISOString(),
      status: "draft",
    };
    setJobs((prev) => [duplicated, ...prev]);
    SupabaseService.saveJob(duplicated).catch(console.warn);
  };

  const toggleJobStatus = (id: string, newStatus: Job["status"]) => {
    const target = jobs.find((j) => j.id === id);
    if (role === "company" && target && company.id && target.companyId !== company.id) {
      console.error("[AppContext] Unauthorized status change: Job belongs to another company");
      return;
    }
    updateJob(id, { status: newStatus });
  };

  // Apply to Job
  const applyToJob = async (jobId: string, customCandidate?: CandidateProfile): Promise<boolean> => {
    const activeCandidate = customCandidate || candidate;
    const targetJob = jobs.find((j) => j.id === jobId);
    if (!targetJob) return false;

    // Check if already applied
    const existing = applications.find(
      (a) => a.jobId === jobId && a.candidateId === activeCandidate.id
    );
    if (existing) return true;

    // Get AI match breakdown
    const analysis = await GeminiService.analyzeMatch(activeCandidate, targetJob);

    const newApp: Application = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      jobId: targetJob.id,
      candidateId: activeCandidate.id,
      candidateName: activeCandidate.fullName,
      candidateHeadline: activeCandidate.headline,
      candidatePhoto: activeCandidate.profilePhoto,
      candidateLocation: activeCandidate.location,
      candidateSkills: activeCandidate.skills,
      candidateExpYears: activeCandidate.yearsOfExperience,
      candidateEmail: activeCandidate.email,
      candidatePhone: activeCandidate.phone,
      candidateBio: activeCandidate.bio,
      candidateExpectedSalary: activeCandidate.expectedSalary,
      candidateWorkPreference: activeCandidate.workPreference,
      candidateExperienceList: activeCandidate.experience,
      candidateEducationList: activeCandidate.education,
      candidateProjectsList: activeCandidate.projects,
      jobTitle: targetJob.title,
      companyId: targetJob.companyId,
      companyName: targetJob.companyName,
      companyLogo: targetJob.companyLogo,
      jobLocation: targetJob.location,
      jobSalary: targetJob.salary,
      jobWorkMode: targetJob.workMode,
      status: "applied",
      appliedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      matchScore: analysis.matchScore,
      matchReasons: analysis.reasons,
      matchConcerns: analysis.concerns,
      aiSummary: analysis.aiSummary,
      timeline: [
        {
          status: "applied",
          timestamp: new Date().toISOString(),
          note: "Applied via Swipe Right on Career Radar",
        },
      ],
    };

    setApplications((prev) => [newApp, ...prev]);

    // Persist to Supabase
    SupabaseService.saveApplication(newApp).catch(console.warn);

    // Send notifications to both candidate & company
    addNotification({
      recipientId: activeCandidate.id,
      role: "candidate",
      title: `🎯 Application Sent to ${targetJob.companyName}`,
      message: `Your profile for "${targetJob.title}" has been delivered directly to their hiring cockpit with a ${analysis.matchScore}% Match.`,
      type: "application",
      linkAction: "applications",
    });

    addNotification({
      recipientId: targetJob.companyId,
      role: "company",
      title: `⚡ New ${analysis.matchScore}% Match Application!`,
      message: `${activeCandidate.fullName} applied for ${targetJob.title}.`,
      type: "application",
      linkAction: "candidates",
    });

    triggerCelebration();
    return true;
  };

  // Update Application Status in Pipeline
  const updateApplicationStatus = (
    applicationId: string,
    newStatus: ApplicationStatus,
    note?: string
  ) => {
    if (newStatus === "rejected") {
      rejectApplication(applicationId, note);
      return;
    }

    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) return app;
        const updatedTimeline = [
          ...app.timeline,
          {
            status: newStatus,
            timestamp: new Date().toISOString(),
            note: note || `Status updated to ${newStatus.toUpperCase()}`,
          },
        ];

        const statusTitles: Record<ApplicationStatus, string> = {
          applied: "Application Submitted",
          screening: "👀 Resume Under Screening",
          shortlisted: "🌟 You've Been Shortlisted!",
          interview: "📅 Interview Scheduled!",
          offer: "🎉 Official Offer Extended!",
          hired: "🏆 Hired! Welcome to the Team!",
          rejected: "Application Status Update",
          expired: "🔒 72h SLA Window Expired",
        };

        addNotification({
          recipientId: app.candidateId,
          role: "candidate",
          title: `${statusTitles[newStatus]} (${app.companyName})`,
          message:
            note ||
            `Your application for ${app.jobTitle} has advanced to the ${newStatus} stage.`,
          type: newStatus === "interview" ? "interview" : newStatus === "offer" ? "offer" : "status",
          linkAction: "applications",
        });

        if (newStatus === "shortlisted" || newStatus === "offer" || newStatus === "hired") {
          triggerCelebration();
        }

        const nextApp: Application = {
          ...app,
          status: newStatus,
          lastUpdatedAt: new Date().toISOString(),
          notes: note || app.notes,
          timeline: updatedTimeline,
        };

        SupabaseService.saveApplication(nextApp).catch(console.warn);
        return nextApp;
      })
    );
  };

  // Reject Candidate
  const rejectApplication = (
    applicationId: string,
    reason?: string
  ) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) return app;
        const note = reason || "Application concluded after evaluation. Profile archived from active pipeline.";
        const updatedTimeline = [
          ...app.timeline,
          {
            status: "rejected" as ApplicationStatus,
            timestamp: new Date().toISOString(),
            note: note,
          },
        ];

        const feedback: ConstructiveFeedback = app.constructiveFeedback || {
          decision: "rejected" as const,
          overallFeedbackSummary: `Thank you for taking the time to apply for ${app.jobTitle}. While our team was impressed by your profile and skills in ${(app.candidateSkills || []).slice(0, 3).join(", ") || "software development"}, we have decided to proceed with other candidates whose current skill profile more directly aligns with the immediate opening.`,
          keyStrengths: (app.candidateSkills || []).slice(0, 4),
          gapAnalysis: (app.missingSkills && app.missingSkills.length > 0 ? app.missingSkills : ["Target Architecture Depth"]).slice(0, 2).map((skill) => ({
            skillOrRequirement: skill,
            roleExpectation: `Deep practical experience in ${skill}`,
            candidateObserved: "Foundational exposure or adjacent toolchain expertise",
            recommendation: `Develop a production-grade portfolio project incorporating ${skill}`,
          })),
          actionPlan: [
            {
              title: `Hands-on Portfolio Showcase`,
              description: `Implement live microservices or end-to-end applications demonstrating core requirements.`,
              suggestedResource: "GitHub Open Source Projects & Official Framework Docs",
              estimatedTimeToBridge: "2–4 Weeks",
            },
          ],
          reapplyEligibleDate: new Date(Date.now() + 60 * 24 * 3600 * 1000).toLocaleDateString(),
          recruiterEncouragingNote: "We welcome and encourage you to reapply after building your portfolio for future openings with our team!",
        };

        addNotification({
          recipientId: app.candidateId,
          role: "candidate",
          title: `Application Status Update · ${app.companyName}`,
          message: `Your application for "${app.jobTitle}" has been reviewed and concluded. Constructive feedback is available in your Feedback Hub.`,
          type: "status",
          linkAction: "applications",
        });

        addNotification({
          recipientId: app.companyId,
          role: "company",
          title: `Candidate Rejected & Pipeline Updated`,
          message: `${app.candidateName} was rejected and removed from your company view. Status & feedback delivered to candidate.`,
          type: "status",
          linkAction: "applications",
        });

        const nextApp: Application = {
          ...app,
          status: "rejected" as ApplicationStatus,
          hiddenFromCompany: true,
          deletedByCompany: true,
          rejectedAt: new Date().toISOString(),
          rejectionReason: note,
          constructiveFeedback: feedback,
          lastUpdatedAt: new Date().toISOString(),
          notes: note,
          timeline: updatedTimeline,
        };

        SupabaseService.saveApplication(nextApp).catch(console.warn);
        return nextApp;
      })
    );
  };

  const deleteCandidate = (applicationId: string, deletePermanently = false) => {
    if (deletePermanently) {
      setApplications((prev) => prev.filter((a) => a.id !== applicationId));
      return;
    }

    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) return app;
        const note = "Candidate application deleted from company hiring pipeline.";
        const nextApp: Application = {
          ...app,
          status: app.status === "applied" ? ("rejected" as ApplicationStatus) : app.status,
          hiddenFromCompany: true,
          deletedByCompany: true,
          lastUpdatedAt: new Date().toISOString(),
          notes: note,
          timeline: [
            ...app.timeline,
            {
              status: app.status === "applied" ? ("rejected" as ApplicationStatus) : app.status,
              timestamp: new Date().toISOString(),
              note: note,
            },
          ],
        };
        SupabaseService.saveApplication(nextApp).catch(console.warn);
        return nextApp;
      })
    );

    const app = applications.find((a) => a.id === applicationId);
    if (app) {
      addNotification({
        recipientId: app.candidateId,
        role: "candidate",
        title: `Application Closed (${app.companyName})`,
        message: `The hiring team for "${app.jobTitle}" has concluded reviews and archived this application.`,
        type: "status",
        linkAction: "applications",
      });

      addNotification({
        recipientId: app.companyId,
        role: "company",
        title: `Candidate Deleted`,
        message: `${app.candidateName} has been deleted and removed from your company pipeline.`,
        type: "status",
        linkAction: "applications",
      });
    }
  };

  // Schedule Interview
  const scheduleInterview = (
    applicationId: string,
    interviewDetails: InterviewDetails
  ) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) return app;
        const nextApp: Application = {
          ...app,
          status: "interview",
          interviewDetails,
          lastUpdatedAt: new Date().toISOString(),
          timeline: [
            ...app.timeline,
            {
              status: "interview",
              timestamp: new Date().toISOString(),
              note: `Interview scheduled for ${interviewDetails.date} at ${interviewDetails.time} (${interviewDetails.meetingLink})`,
            },
          ],
        };
        SupabaseService.saveApplication(nextApp).catch(console.warn);
        return nextApp;
      })
    );

    const app = applications.find((a) => a.id === applicationId);
    if (app) {
      addNotification({
        recipientId: app.candidateId,
        role: "candidate",
        title: `📅 Interview Scheduled: ${app.companyName}`,
        message: `Your interview for ${app.jobTitle} is set for ${interviewDetails.date} at ${interviewDetails.time}. Google Meet: ${interviewDetails.meetingLink}`,
        type: "interview",
        linkAction: "applications",
      });
      triggerCelebration();
    }
  };

  // Delete Application
  const deleteApplication = (applicationId: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== applicationId));
  };

  // Explicitly Expire & Lock Application
  const expireApplication = (applicationId: string) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) return app;
        const nextApp: Application = {
          ...app,
          status: "expired",
          isExpired: true,
          isLockedDueToInactivity: true,
          expiredAt: new Date().toISOString(),
          timeline: [
            ...app.timeline,
            {
              status: "expired",
              timestamp: new Date().toISOString(),
              note: "72-Hour SLA Expired: Recruiter inactivity. Profile and contact channels are now locked & inaccessible.",
            },
          ],
        };
        SupabaseService.saveApplication(nextApp).catch(console.warn);
        return nextApp;
      })
    );
  };

  // Purge All Expired / Inaccessible Applications
  const purgeExpiredApplications = () => {
    setApplications((prev) => prev.filter((a) => a.status !== "expired" && !a.isExpired));
    triggerCelebration();
  };

  // Simulation Helper for Testing 72h SLA Expiration Live
  const simulateFastForwardApplication = (applicationId: string, hours = 73) => {
    const targetPast = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) return app;
        const nextApp: Application = {
          ...app,
          appliedAt: targetPast,
          slaDeadline: new Date(Date.now() - 1000).toISOString(),
          status: "expired",
          isExpired: true,
          isLockedDueToInactivity: true,
          expiredAt: new Date().toISOString(),
          timeline: [
            ...app.timeline,
            {
              status: "expired",
              timestamp: new Date().toISOString(),
              note: `⚡ Simulated Fast-Forward (+${hours}h): 72h SLA expired. Candidate profile locked & inaccessible.`,
            },
          ],
        };
        SupabaseService.saveApplication(nextApp).catch(console.warn);
        return nextApp;
      })
    );

    addNotification({
      recipientId: company.id,
      role: "company",
      title: "🔒 72h SLA Simulation Triggered",
      message: `Candidate application simulated +${hours} hours elapsed. Profile is now locked and inaccessible.`,
      type: "status",
      linkAction: "candidates",
    });
  };

  // Recommendation & Adaptive Swipe Feedback
  const handleSwipeLeft = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    const newSwipe: SwipeInteraction = {
      candidateId: candidate.id,
      jobId,
      action: "skipped",
      timestamp: new Date().toISOString(),
      jobTags: job?.requiredSkills,
      workMode: job?.workMode,
    };
    setSwipes((prev) => [...prev, newSwipe]);
    SupabaseService.logSwipe(newSwipe).catch(console.warn);

    // Update candidate's learned preferences
    if (job) {
      const dislikes = job.requiredSkills.filter(
        (s) => !candidate.skills.map((cs) => cs.toLowerCase()).includes(s.toLowerCase())
      );
      updateCandidate({
        learnedPreferences: {
          preferredSkills: candidate.learnedPreferences?.preferredSkills || [],
          dislikedSkills: Array.from(
            new Set([...(candidate.learnedPreferences?.dislikedSkills || []), ...dislikes])
          ).slice(0, 8),
          preferredLocations: candidate.learnedPreferences?.preferredLocations || ["Ahmedabad"],
          preferredWorkModes: candidate.learnedPreferences?.preferredWorkModes || ["Hybrid"],
          swipesCount: (candidate.learnedPreferences?.swipesCount || 0) + 1,
        },
      });
    }
  };

  const handleSwipeRight = async (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    const newSwipe: SwipeInteraction = {
      candidateId: candidate.id,
      jobId,
      action: "applied",
      timestamp: new Date().toISOString(),
      jobTags: job?.requiredSkills,
      workMode: job?.workMode,
    };
    setSwipes((prev) => [...prev, newSwipe]);
    SupabaseService.logSwipe(newSwipe).catch(console.warn);

    // Update candidate's learned preferences
    if (job) {
      updateCandidate({
        learnedPreferences: {
          preferredSkills: Array.from(
            new Set([...(candidate.learnedPreferences?.preferredSkills || []), ...job.requiredSkills])
          ).slice(0, 10),
          dislikedSkills: candidate.learnedPreferences?.dislikedSkills || [],
          preferredLocations: Array.from(
            new Set([
              ...(candidate.learnedPreferences?.preferredLocations || []),
              job.location.split(",")[0].trim(),
            ])
          ),
          preferredWorkModes: Array.from(
            new Set([...(candidate.learnedPreferences?.preferredWorkModes || []), job.workMode])
          ),
          swipesCount: (candidate.learnedPreferences?.swipesCount || 0) + 1,
        },
      });
    }

    await applyToJob(jobId);
  };

  const handleSwipe = async (jobId: string, direction: "left" | "right") => {
    if (direction === "right") {
      await handleSwipeRight(jobId);
    } else {
      handleSwipeLeft(jobId);
    }
  };

  // Real-time Candidate Matched Jobs (matches on ANY attribute: skills, city, role, salary, exp, work mode)
  const candidateMatchedJobs = useMemo(() => {
    return jobs
      .filter((j) => j.status === "active")
      .map((job) => {
        const matchResult = calculateJobMatch(candidate, job);
        return {
          ...job,
          matchScore: matchResult.matchScore,
          matchedSkills: matchResult.matchedSkills,
          matchReasons: matchResult.matchedReasons,
          isCandidateMatch: matchResult.isMatch,
          aiSummary: matchResult.aiSummary,
        };
      })
      .filter((j) => j.isCandidateMatch)
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [jobs, candidate]);

  // Dynamic Radar Deck - unswiped matching jobs prioritized by highest match
  const radarDeck = useMemo(() => {
    const interactedJobIds = new Set(swipes.map((s) => s.jobId));
    return candidateMatchedJobs.filter((j) => !interactedJobIds.has(j.id));
  }, [candidateMatchedJobs, swipes]);

  const recommendationNote = useMemo(() => {
    const swipesCount = candidate.learnedPreferences?.swipesCount || 0;
    if (swipesCount === 0) {
      return "AI Vector Radar initialized based on your resume skills and Ahmedabad hybrid preferences.";
    }
    const preferredSkills = candidate.learnedPreferences?.preferredSkills?.slice(0, 3).join(", ");
    const locationCity = candidate.location ? candidate.location.split(",")[0] : "your preferred location";
    return `AI Radar tuned from ${swipesCount} swipe actions: Prioritizing ${preferredSkills || "React & Node"} roles in ${locationCity}.`;
  }, [candidate]);

  const resetSwipes = () => {
    setSwipes([]);
  };

  // Notifications helpers
  const addNotification = (
    notif: Omit<NotificationItem, "id" | "timestamp" | "read">
  ) => {
    const newItem: NotificationItem = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newItem, ...prev]);
    SupabaseService.saveNotification(newItem).catch(console.warn);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const next = { ...n, read: true };
        SupabaseService.saveNotification(next).catch(console.warn);
        return next;
      })
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => {
        const next = { ...n, read: true };
        SupabaseService.saveNotification(next).catch(console.warn);
        return next;
      })
    );
  };

  const unreadCount = useMemo(() => {
    const currentRole = role || "candidate";
    return notifications.filter((n) => !n.read && (n.role === currentRole || role === "admin")).length;
  }, [notifications, role]);

  // Email Templates CRUD with Supabase Persistence
  const addEmailTemplate = async (
    templateData: Omit<EmailTemplate, "id"> & { id?: string }
  ): Promise<EmailTemplate> => {
    const newId = templateData.id || `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTemplate: EmailTemplate = {
      ...templateData,
      id: newId,
      companyId: company.id || undefined,
    };

    if (company.id) {
      await SupabaseService.saveEmailTemplate(newTemplate, company.id);
    }
    setEmailTemplates((prev) => [...prev, newTemplate]);
    return newTemplate;
  };

  const updateEmailTemplate = async (
    id: string,
    updated: Partial<EmailTemplate>
  ): Promise<boolean> => {
    const existing = emailTemplates.find((t) => t.id === id);
    if (!existing) {
      throw new Error(`Email template with ID "${id}" not found.`);
    }

    const nextTemplate: EmailTemplate = {
      ...existing,
      ...updated,
      companyId: company.id || existing.companyId,
    };

    if (company.id) {
      await SupabaseService.saveEmailTemplate(nextTemplate, company.id);
    }
    setEmailTemplates((prev) => prev.map((t) => (t.id === id ? nextTemplate : t)));
    return true;
  };

  const deleteEmailTemplate = async (id: string): Promise<boolean> => {
    if (company.id) {
      await SupabaseService.deleteEmailTemplate(id).catch((err) => {
        console.warn("[deleteEmailTemplate] Database delete notice:", err.message);
      });
    }
    setEmailTemplates((prev) => prev.filter((t) => t.id !== id));
    return true;
  };

  const updateWhatsAppTemplate = (id: string, updated: Partial<WhatsAppTemplate>) => {
    setWhatsAppTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
  };

  // Connected Email Sender
  const sendEmailFromCompany = async (
    candidateEmail: string,
    subject: string,
    body: string,
    html?: string
  ): Promise<{ success: boolean; message: string }> => {
    const integration = company.emailIntegration;
    const isConnected = Boolean(integration?.isConnected);

    if (!isConnected) {
      return {
        success: false,
        message: "Email integration is not connected. Please connect your custom business email or SMTP server first.",
      };
    }

    const sender = `${integration.senderName || company.companyName} <${integration.fromEmail || integration.connectedEmail || integration.smtpUser}>`;

    const effectiveHtml = html || buildDesignedEmailHtml({
      subject,
      bodyText: body,
      companyName: company.companyName || "SwipeHired Partner",
      senderName: integration.senderName || company.companyName,
    });

    try {
      if (integration?.provider === "smtp" && integration?.smtpHost && integration?.smtpUser) {
        const res = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            smtpConfig: {
              smtpHost: integration.smtpHost,
              smtpPort: integration.smtpPort,
              smtpSecure: integration.smtpSecure,
              smtpUser: integration.smtpUser,
              smtpPassword: integration.smtpPassword,
              senderName: integration.senderName || company.companyName,
              fromEmail: integration.fromEmail || integration.connectedEmail || integration.smtpUser,
            },
            to: candidateEmail,
            subject,
            body,
            html: effectiveHtml,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          return {
            success: true,
            message: data.message || `Email dispatched successfully from ${sender} to ${candidateEmail}`,
          };
        }
        return {
          success: false,
          message: data.error || data.message || `Failed to dispatch email (status ${res.status}).`,
        };
      }
      return {
        success: false,
        message: "Incomplete SMTP settings. Please verify your host, user credentials, and port.",
      };
    } catch (err: any) {
      console.warn("[sendEmailFromCompany] API dispatch failed:", err);
      return {
        success: false,
        message: err.message || "Failed to dispatch email. Please check your network and SMTP credentials.",
      };
    }
  };

  // Admin Operations
  const resolveAdminReport = async (id: string, status: "resolved" | "dismissed" = "resolved") => {
    setAdminReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    await SupabaseService.resolveAdminReport(id, status, authUser?.id || "admin");
  };

  const adminSuspendCandidate = async (candidateId: string, isSuspended: boolean): Promise<boolean> => {
    const success = await SupabaseService.suspendCandidate(candidateId, isSuspended, authUser?.id || "admin");
    if (success) {
      setAllCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, isSuspended } : c))
      );
    }
    return success;
  };

  const adminVerifyCandidateSkills = async (candidateId: string, skills: string[]): Promise<boolean> => {
    const success = await SupabaseService.verifyCandidateSkills(candidateId, skills, authUser?.id || "admin");
    if (success) {
      setAllCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, skills } : c))
      );
    }
    return success;
  };

  const adminResetCandidatePreferences = async (candidateId: string): Promise<boolean> => {
    const success = await SupabaseService.resetLearnedPreferences(candidateId, authUser?.id || "admin");
    if (success) {
      setAllCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? {
                ...c,
                learnedPreferences: {
                  swipesCount: 0,
                  dislikedSkills: [],
                  preferredSkills: [],
                  preferredLocations: [],
                  preferredWorkModes: [],
                },
              }
            : c
        )
      );
    }
    return success;
  };

  const adminDeleteCandidate = async (candidateId: string): Promise<boolean> => {
    const success = await SupabaseService.deleteCandidate(candidateId, authUser?.id || "admin");
    if (success) {
      setAllCandidates((prev) => prev.filter((c) => c.id !== candidateId));
      setApplications((prev) => prev.filter((a) => a.candidateId !== candidateId));
    }
    return success;
  };

  const adminVerifyCompany = async (companyId: string, isVerified: boolean): Promise<boolean> => {
    const success = await SupabaseService.toggleCompanyVerification(companyId, isVerified, authUser?.id || "admin");
    if (success) {
      if (company.id === companyId) {
        setCompany((prev) => ({ ...prev, isVerified }));
      }
    }
    return success;
  };

  const adminSuspendCompany = async (companyId: string, isSuspended: boolean): Promise<boolean> => {
    const success = await SupabaseService.suspendCompany(companyId, isSuspended, authUser?.id || "admin");
    if (success) {
      if (company.id === companyId) {
        setCompany((prev) => ({ ...prev, isSuspended }));
      }
    }
    return success;
  };

  const adminUpdateJobStatus = async (
    jobId: string,
    status: Job["status"],
    isFeatured?: boolean
  ): Promise<boolean> => {
    const success = await SupabaseService.updateJobStatus(jobId, status, isFeatured, authUser?.id || "admin");
    if (success) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, status, ...(isFeatured !== undefined ? { isFeatured } : {}) }
            : j
        )
      );
    }
    return success;
  };

  const adminDeleteJob = async (jobId: string): Promise<boolean> => {
    const success = await SupabaseService.deleteJob(jobId, authUser?.id || "admin");
    if (success) {
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setApplications((prev) => prev.filter((a) => a.jobId !== jobId));
    }
    return success;
  };

  const sessionSeqRef = useRef<number>(0);

  // Listen for auth state changes (e.g., email confirmation link callback / OAuth Google redirect / session restore)
  useEffect(() => {
    const handleAuthSession = async (session: any, _event?: string) => {
      const currentSeq = ++sessionSeqRef.current;
      if (!session?.user) {
        setAuthUser(null);
        setRole(null);
        setAuthStatus("UNAUTHENTICATED");
        safeStorage.removeItem("swipehired_role");
        return;
      }

      setAuthUser(session.user);

      let savedOauthRole: UserRole | null = null;
      try {
        savedOauthRole =
          typeof window !== "undefined"
            ? ((new URLSearchParams(window.location.search).get("oauth_role") as UserRole | null) ||
              (window.location.hash
                ? (new URLSearchParams(window.location.hash.replace(/^#/, "?")).get("oauth_role") as UserRole | null)
                : null) ||
              (sessionStorage.getItem("swipehired_oauth_role") as UserRole | null) ||
              (safeStorage.getItem("swipehired_oauth_role") as UserRole | null))
            : null;
      } catch {}

      const profileResult = await SupabaseService.fetchUserProfile(
        session.user,
        (savedOauthRole as any) || undefined
      );

      // Discard stale responses if a newer auth event fired
      if (currentSeq !== sessionSeqRef.current) return;

      const resolvedRole: UserRole = profileResult.role;

      safeStorage.removeItem("swipehired_oauth_role");
      try {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("swipehired_oauth_role");
          document.cookie = "swipehired_oauth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        }
      } catch {}

      // Check if user is returning from a fresh OAuth callback
      const isFreshOAuthCallback =
        typeof window !== "undefined" &&
        (window.location.hash.includes("access_token") ||
          window.location.search.includes("code") ||
          window.location.hash.includes("type=signup") ||
          window.location.hash.includes("type=recovery"));

      if (window.history.replaceState && (window.location.hash || window.location.search)) {
        window.history.replaceState(null, "", window.location.pathname);
      }

      if (resolvedRole === "company") {
        setRole("company");
        setAuthStatus("AUTHENTICATED_COMPANY");
        safeStorage.setItem("swipehired_role", "company");
        if (profileResult.companyProfile) {
          setCompany(profileResult.companyProfile);
        }

        // Check if view needs to be routed to company workspace
        const currentSavedView = safeStorage.getItem("swipehired_activeView") || "landing";
        const isCandidateOrAuthView =
          currentSavedView.startsWith("candidate-") ||
          currentSavedView === "landing" ||
          currentSavedView === "auth-select" ||
          currentSavedView === "company-login" ||
          currentSavedView === "company-signup";

        if (isFreshOAuthCallback || isCandidateOrAuthView) {
          setActiveView(profileResult.companyProfile?.isCompleted ? "company-cockpit" : "company-onboarding");
        }
      } else if (resolvedRole === "candidate") {
        setRole("candidate");
        setAuthStatus("AUTHENTICATED_CANDIDATE");
        safeStorage.setItem("swipehired_role", "candidate");
        if (profileResult.candidateProfile) {
          let cand = profileResult.candidateProfile;
          const ghUsername =
            session.user.user_metadata?.user_name ||
            session.user.user_metadata?.preferred_username;
          if (ghUsername && (!cand.githubData || !cand.githubData.connected)) {
            try {
              const ghData = await GitHubService.buildCandidateGitHubProfile(ghUsername);
              cand = { ...cand, githubData: ghData };
              await SupabaseService.saveCandidate(cand);
            } catch (ghErr) {
              console.warn("[AppContext] GitHub auto-sync notice:", ghErr);
            }
          }
          setCandidate(cand);
        }

        // Check if view needs to be routed to candidate workspace
        const currentSavedView = safeStorage.getItem("swipehired_activeView") || "landing";
        const isCompanyOrAuthView =
          currentSavedView.startsWith("company-") ||
          currentSavedView === "landing" ||
          currentSavedView === "auth-select" ||
          currentSavedView === "candidate-login" ||
          currentSavedView === "candidate-signup";

        if (isFreshOAuthCallback || isCompanyOrAuthView) {
          if (!profileResult.candidateProfile?.isCompleted) {
            setActiveView("candidate-onboarding");
          } else if (!profileResult.candidateProfile?.commissionAgreementSigned) {
            setActiveView("candidate-agreement");
          } else {
            setActiveView("candidate-radar");
          }
        }
      } else if (resolvedRole === "admin") {
        setRole("admin");
        setAuthStatus("AUTHENTICATED_ADMIN");
        safeStorage.setItem("swipehired_role", "admin");
        setActiveView("landing");
      } else {
        setRole(null);
        setAuthStatus("ROLE_UNSET");
        setActiveView("auth-select");
      }

      // Only celebrate on an explicit fresh OAuth login callback, never on passive page reloads
      if (isFreshOAuthCallback && resolvedRole) {
        triggerCelebration();
        addNotification({
          recipientId:
            resolvedRole === "company"
              ? profileResult.companyProfile?.id || "comp"
              : profileResult.candidateProfile?.id || "cand",
          role: resolvedRole === "company" ? "company" : "candidate",
          title: resolvedRole === "company" ? "🏢 Welcome to SwipeHired!" : "✨ Welcome to SwipeHired!",
          message:
            resolvedRole === "company"
              ? "Recruiter workspace authenticated successfully."
              : "Authenticated successfully. Your candidate radar is ready.",
          type: "status",
        });
      }
    };

    const initAuthListener = async () => {
      try {
        // 1. Initial session check on mount
        const currentSession = await SupabaseService.getSession();
        if (currentSession?.user) {
          await handleAuthSession(currentSession, "INITIAL_SESSION");
        } else {
          setAuthStatus("UNAUTHENTICATED");
        }

        // 2. Auth state change listener
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (
              session?.user &&
              (event === "SIGNED_IN" ||
                event === "USER_UPDATED" ||
                event === "INITIAL_SESSION" ||
                event === "TOKEN_REFRESHED")
            ) {
              await handleAuthSession(session, event);
            } else if (event === "SIGNED_OUT") {
              setAuthUser(null);
              setRole(null);
              setAuthStatus("UNAUTHENTICATED");
            }
          }
        );

        return () => {
          authListener?.subscription?.unsubscribe();
        };
      } catch (err) {
        console.warn("Auth state change listener notice:", err);
        setAuthStatus("UNAUTHENTICATED");
      }
    };

    initAuthListener();
  }, []);

  // Sign up with Supabase Auth
  const authSignUp = async (params: {
    email: string;
    password: string;
    role: "candidate" | "company";
    fullName?: string;
    companyName?: string;
    contactPerson?: string;
  }): Promise<{
    success: boolean;
    needsEmailConfirmation: boolean;
    email?: string;
    error?: string;
  }> => {
    const res = await SupabaseService.signUp(params);
    if (res.error) {
      return { success: false, needsEmailConfirmation: false, error: res.error };
    }

    // Never auto-login on signup; user must log in from login page after confirming email
    setAuthUser(null);
    return {
      success: true,
      needsEmailConfirmation: true,
      email: params.email.trim(),
    };
  };

  // Resend Confirmation Email
  const resendConfirmationEmail = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await SupabaseService.resendConfirmationEmail(email);
    if (res.error) {
      return { success: false, error: res.error };
    }
    return { success: true };
  };

  // Sign in with Supabase Auth
  const authSignIn = async (params: {
    email: string;
    password: string;
    roleHint?: "candidate" | "company" | "admin";
  }): Promise<{
    success: boolean;
    role?: UserRole;
    isEmailNotConfirmed?: boolean;
    error?: string;
  }> => {
    const res = await SupabaseService.signIn(params);
    if (res.error) {
      return {
        success: false,
        isEmailNotConfirmed: res.isEmailNotConfirmed,
        error: res.error,
      };
    }
    setAuthUser(res.user);
    const resolvedRole: UserRole = res.role;
    setRole(resolvedRole);
    if (resolvedRole) {
      safeStorage.setItem("swipehired_role", resolvedRole);
    }

    if (resolvedRole === "company") {
      setAuthStatus("AUTHENTICATED_COMPANY");
      if (res.companyProfile) {
        setCompany(res.companyProfile);
        setActiveView(res.companyProfile.isCompleted ? "company-cockpit" : "company-onboarding");
      } else {
        setActiveView("company-cockpit");
      }
    } else if (resolvedRole === "candidate") {
      setAuthStatus("AUTHENTICATED_CANDIDATE");
      if (res.candidateProfile) {
        setCandidate(res.candidateProfile);
        if (!res.candidateProfile.isCompleted) {
          setActiveView("candidate-onboarding");
        } else if (!res.candidateProfile.commissionAgreementSigned) {
          setActiveView("candidate-agreement");
        } else {
          setActiveView("candidate-radar");
        }
      } else {
        setActiveView("candidate-onboarding");
      }
    } else if (resolvedRole === "admin") {
      setAuthStatus("AUTHENTICATED_ADMIN");
      setActiveView("landing");
    } else {
      setAuthStatus("ROLE_UNSET");
      setActiveView("auth-select");
    }

    return { success: true, role: resolvedRole };
  };

  // Sign in / Sign up with Google OAuth
  const authSignInWithGoogle = async (
    role: "candidate" | "company"
  ): Promise<{ error?: string }> => {
    const res = await SupabaseService.signInWithGoogle(role);
    if (res.error) {
      return { error: res.error };
    }
    return {};
  };

  // Sign in / Sign up with GitHub OAuth (Candidate Only)
  const authSignInWithGitHub = async (
    role: "candidate" = "candidate"
  ): Promise<{ error?: string }> => {
    const res = await SupabaseService.signInWithGitHub(role);
    if (res.error) {
      return { error: res.error };
    }
    return {};
  };

  // Connect GitHub profile to Candidate and sync telemetry
  const connectCandidateGitHub = async (
    username: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const gitHubData = await GitHubService.buildCandidateGitHubProfile(username);
      const updatedCandidate: CandidateProfile = {
        ...candidate,
        githubData: gitHubData,
      };

      // If candidate has no projects, import top 3 GitHub repos as projects
      if ((!candidate.projects || candidate.projects.length === 0) && gitHubData.topRepos.length > 0) {
        updatedCandidate.projects = gitHubData.topRepos.slice(0, 3).map((r) => ({
          id: `gh_${r.id}`,
          name: r.name,
          description: r.description || "Open source project on GitHub",
          technologies: [r.language].filter(Boolean),
          link: r.htmlUrl,
        }));
      }

      setCandidate(updatedCandidate);
      safeStorage.setJSON("swipehired_candidate", updatedCandidate);
      await SupabaseService.saveCandidate(updatedCandidate);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to fetch GitHub profile." };
    }
  };

  // Sign out
  const authSignOut = async () => {
    await SupabaseService.signOut();
    setAuthUser(null);
    setRole(null);
    setAuthStatus("UNAUTHENTICATED");
    setCandidate(emptyCandidateProfile);
    setCompany(emptyCompanyProfile);
    setJobs([]);
    setApplications([]);
    setTalentBids([]);
    setNotifications([]);
    setSwipes([]);
    safeStorage.removeItem("swipehired_candidate");
    safeStorage.removeItem("swipehired_company");
    safeStorage.removeItem("swipehired_role");
    safeStorage.removeItem("swipehired_oauth_role");
    safeStorage.removeItem("swipehired_activeView");
    safeStorage.removeItem("swipehired_jobs");
    safeStorage.removeItem("swipehired_applications");
    safeStorage.removeItem("swipehired_talent_bids");
    safeStorage.removeItem("swipehired_notifications");
    safeStorage.removeItem("swipehired_swipes");
    safeStorage.removeItem("swipehired_new_job_draft");
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("swipehired_oauth_role");
        document.cookie = "swipehired_oauth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      }
    } catch {}
    setActiveView("landing");
  };

  // Support Mode Exit
  const exitSupportMode = useCallback(async () => {
    try {
      const current = SupportSessionClient.get();
      if (current?.token || current?.session?.id) {
        await fetch("/api/support-session/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: current.token,
            sessionId: current.session?.id,
          }),
        }).catch(console.warn);
      }
    } finally {
      SupportSessionClient.clear();
      setSupportSession(null);
      // Cleanly leave support mode and return to admin portal
      window.location.href = "http://localhost:3001";
    }
  }, []);

  // Log Out
  const logout = () => {
    authSignOut();
  };

  return (
    <AppContext.Provider
      value={{
        isSupabaseConnected,
        isSupabaseSyncing,
        refreshFromSupabase,
        authStatus,
        isAuthLoading,
        authUser,
        authSignUp,
        authSignIn,
        authSignInWithGoogle,
        authSignInWithGitHub,
        connectCandidateGitHub,
        resendConfirmationEmail,
        authSignOut,
        role,
        setRole,
        activeView,
        setActiveView,
        selectedJobId,
        setSelectedJobId,
        selectedApplicationId,
        setSelectedApplicationId,
        candidate,
        updateCandidate,
        setCandidate,
        missingProfileFields,
        isCandidateProfileComplete,
        signCommissionAgreement,
        company,
        updateCompany,
        setCompany,
        isCompanyProfileComplete,
        allCandidates,
        jobs,
        addJob,
        updateJob,
        deleteJob,
        duplicateJob,
        toggleJobStatus,
        isAddJobModalOpen,
        setIsAddJobModalOpen,
        openAddJobModal,
        applications,
        applyToJob,
        updateApplicationStatus,
        rejectApplication,
        deleteApplication,
        deleteCandidate,
        expireApplication,
        purgeExpiredApplications,
        simulateFastForwardApplication,
        scheduleInterview,
        blindTalentProfiles,
        talentBids,
        updateBlindTalentProfile,
        toggleCandidateListing,
        submitTalentBid,
        respondToTalentBid,
        companyRespondToCounterOffer,
        companySLAs,
        requestConstructiveFeedback,
        swipes,
        handleSwipe,
        handleSwipeLeft,
        handleSwipeRight,
        radarDeck,
        candidateMatchedJobs,
        recommendationNote,
        resetSwipes,
        notifications,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        unreadCount,
        emailTemplates,
        addEmailTemplate,
        updateEmailTemplate,
        deleteEmailTemplate,
        whatsAppTemplates,
        updateWhatsAppTemplate,
        sendEmailFromCompany,
        adminReports,
        resolveAdminReport,
        adminSuspendCandidate,
        adminVerifyCandidateSkills,
        adminResetCandidatePreferences,
        adminDeleteCandidate,
        adminVerifyCompany,
        adminSuspendCompany,
        adminUpdateJobStatus,
        adminDeleteJob,
        supportSession,
        exitSupportMode,
        triggerCelebration,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
