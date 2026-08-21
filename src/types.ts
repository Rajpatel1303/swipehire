export type UserRole = "candidate" | "company" | "admin" | null;

export interface EducationItem {
  id?: string;
  degree: string;
  institution: string;
  year: string;
}

export interface ExperienceItem {
  id?: string;
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface ProjectItem {
  id?: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface CandidateProfile {
  id: string;
  userId?: string;
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  workPreference: "Remote" | "Hybrid" | "Onsite" | string;
  yearsOfExperience: number;
  skills: string[];
  possibleRoles: string[];
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications: string[];
  expectedSalary: string;
  preferredRole: string;
  bio: string;
  profilePhoto: string;
  profileStrength: number;
  isCompleted: boolean;
  resumeFilename?: string;
  resumeText?: string;
  // Dynamic learned preference weights from swipe behavior
  learnedPreferences?: {
    preferredSkills: string[];
    dislikedSkills: string[];
    preferredLocations: string[];
    preferredWorkModes: string[];
    swipesCount: number;
  };
}

export interface CompanyEmailIntegration {
  provider: "gmail" | "smtp" | "custom" | "none";
  connectedEmail: string;
  senderName: string;
  isConnected: boolean;
  connectedAt?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  fromEmail?: string;
  lastTestedAt?: string;
}

export interface CompanyProfile {
  id: string;
  userId?: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  logo: string;
  website: string;
  industry: string;
  size: string;
  location: string;
  about: string;
  culture: string[];
  benefits: string[];
  isCompleted: boolean;
  emailIntegration: CompanyEmailIntegration;
  isVerified?: boolean;
}

export type JobStatus = "active" | "draft" | "paused" | "closed";
export type WorkMode = "Remote" | "Hybrid" | "Onsite";

export interface Job {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  companyIndustry?: string;
  companySize?: string;
  title: string;
  department: string;
  location: string;
  workMode: WorkMode;
  experience: string;
  salary: string;
  openings: number;
  description: string;
  responsibilities: string[];
  requirements: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  status: JobStatus;
  createdAt: string;
  updatedAt?: string;
  matchScore?: number;
  matchReasons?: string[];
  matchedSkills?: string[];
  matchConcerns?: string[];
  isCandidateMatch?: boolean;
  aiSummary?: string;
}

export type ApplicationStatus =
  | "applied"
  | "screening"
  | "shortlisted"
  | "interview"
  | "offer"
  | "hired"
  | "rejected"
  | "expired";

export interface InterviewDetails {
  date: string;
  time: string;
  meetingLink: string;
  notes: string;
  interviewerName: string;
  scheduledAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  candidateHeadline: string;
  candidatePhoto: string;
  candidateLocation: string;
  candidateSkills: string[];
  candidateExpYears: number;
  candidateEmail: string;
  candidatePhone: string;
  candidateBio: string;
  candidateResumeUrl?: string;
  candidateExpectedSalary?: string;
  candidateWorkPreference?: string;
  candidateExperienceList?: ExperienceItem[];
  candidateEducationList?: EducationItem[];
  candidateProjectsList?: ProjectItem[];
  jobTitle: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  jobLocation: string;
  jobSalary: string;
  jobWorkMode: WorkMode;
  status: ApplicationStatus;
  appliedAt: string;
  lastUpdatedAt: string;
  matchScore: number;
  matchReasons: string[];
  matchConcerns: string[];
  aiSummary: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  fitVerdict?: string;
  strengths?: string[];
  interviewQuestions?: string[];
  interviewDetails?: InterviewDetails;
  notes?: string;
  isExpired?: boolean;
  expiredAt?: string;
  isLockedDueToInactivity?: boolean;
  timeline: {
    status: ApplicationStatus;
    timestamp: string;
    note?: string;
  }[];
  // Anti-Ghosting SLA & Pulse Fields
  companySlaBadge?: string; // e.g. "⚡ Fast Responder (Avg. 18h)"
  companySlaAvgHours?: number;
  slaDeadline?: string; // ISO date for guaranteed SLA response
  pulseSteps?: PulseStep[];
  constructiveFeedback?: ConstructiveFeedback;
  hiddenFromCompany?: boolean;
  deletedByCompany?: boolean;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface PulseStep {
  stepId: string;
  title: string;
  description: string;
  timestamp?: string;
  completed: boolean;
  active: boolean;
  actorRole?: "Talent Lead" | "Hiring Manager" | "Engineering Director" | "AI Screener" | "System";
  actorName?: string;
  metric?: string; // e.g. "Parsed 8 Skills · 94% Match" or "GitHub Repos Inspected"
}

export interface ConstructiveFeedback {
  decision: "rejected" | "deferred" | "passed";
  overallFeedbackSummary: string;
  keyStrengths: string[];
  gapAnalysis: {
    skillOrRequirement: string;
    roleExpectation: string;
    candidateObserved: string;
    recommendation: string;
  }[];
  actionPlan: {
    title: string;
    description: string;
    suggestedResource: string;
    estimatedTimeToBridge: string;
  }[];
  reapplyEligibleDate: string;
  recruiterEncouragingNote: string;
}

export interface CompanySLAInfo {
  companyId: string;
  companyName: string;
  avgResponseHours: number;
  ghostingRatePct: number;
  feedbackGuaranteePct: number;
  badgeLabel: string;
  badgeTier: "gold" | "silver" | "bronze";
  totalApplicationsReviewed: number;
}

export interface BlindTalentProfile {
  id: string;
  candidateId: string;
  anonymousHandle: string; // e.g. "Anonymous Full Stack Architect #704"
  avatarSeed: string;
  headline: string;
  experienceYears: number;
  location: string;
  workPreference: "Remote" | "Hybrid" | "Onsite" | string;
  verifiedSkills: { name: string; level: "Expert" | "Advanced" | "Proficient"; years: number }[];
  proofOfWork: {
    title: string;
    metrics: string;
    technologies: string[];
  }[];
  targetSalaryRange: string; // e.g. "₹12–16 LPA"
  preferredRoles: string[];
  availabilityNotice: string; // e.g. "Immediate / 15 Days"
  isListed: boolean;
  superpowers: string[];
  activeBidsCount: number;
}

export interface TalentBid {
  id: string;
  blindTalentId: string;
  candidateId: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  companyIndustry: string;
  companyLocation: string;
  jobId?: string;
  jobTitle: string;
  seniorityTier: "Mid-Level" | "Senior" | "Lead" | "Staff / Principal";
  salaryOffer: string; // upfront compensation offer, e.g. "₹15–18 LPA"
  bonusAndEquity?: string;
  workMode: WorkMode;
  pitchMessage: string;
  perks: string[];
  createdAt: string;
  expiresAt: string; // 72 hour countdown
  status: "pending" | "accepted" | "countered" | "declined" | "expired";
  candidateRevealedName?: string;
  candidateRevealedEmail?: string;
  candidateRevealedPhone?: string;
  candidateRevealedPhoto?: string;
  counterOfferDetails?: {
    proposedSalary: string;
    proposedWorkMode: string;
    note: string;
    counteredAt: string;
  };
}

export interface SwipeInteraction {
  candidateId: string;
  jobId: string;
  action: "applied" | "skipped" | "saved";
  timestamp: string;
  jobTags?: string[];
  workMode?: string;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  role: "candidate" | "company" | "admin";
  title: string;
  message: string;
  type: "match" | "status" | "message" | "interview" | "offer" | "application";
  timestamp: string;
  read: boolean;
  linkAction?: string;
}

export interface EmailTemplate {
  id: string;
  title: string;
  category: "received" | "shortlisted" | "interview" | "rejection" | "custom";
  subject: string;
  bodyTemplate: string;
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  category: "shortlist" | "interview" | "followup" | "update";
  messageTemplate: string;
}

export interface AdminReport {
  id: string;
  targetType: "job" | "company" | "candidate";
  targetId: string;
  targetName: string;
  reason: string;
  reportedBy: string;
  createdAt: string;
  status: "pending" | "resolved" | "dismissed";
}
