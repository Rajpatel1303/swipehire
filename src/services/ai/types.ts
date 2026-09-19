export interface ParsedResumeResult {
  fullName?: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  workPreference?: "Remote" | "Hybrid" | "Onsite" | string;
  yearsOfExperience?: number;
  skills?: string[];
  possibleRoles?: string[];
  education?: Array<{ degree: string; institution: string; year: string }>;
  experience?: Array<{ title: string; company: string; duration: string; description: string }>;
  projects?: Array<{ name: string; description: string; technologies: string[] }>;
  certifications?: string[];
  expectedSalary?: string;
  preferredRole?: string;
  bio?: string;
  confidence?: Record<string, number>;
  verificationFlags?: string[];
}

export interface GeneratedJobResult {
  title: string;
  department?: string;
  location: string;
  workMode: "Remote" | "Hybrid" | "Onsite";
  experience: string;
  salary: string;
  openings: number;
  description: string;
  responsibilities: string[];
  requirements: string[];
  requiredSkills: string[];
  preferredSkills: string[];
}

export interface MatchAnalysisResult {
  matchScore: number;
  fitVerdict?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  reasons: string[];
  strengths?: string[];
  concerns: string[];
  aiSummary: string;
  interviewQuestions?: string[];
}

export interface InterviewKitResult {
  roleTitle: string;
  technicalQuestions: Array<{ question: string; idealAnswer: string; evaluationCriteria: string }>;
  behavioralQuestions: Array<{ question: string; whatToLookFor: string }>;
  systemDesignPrompt?: string;
}
