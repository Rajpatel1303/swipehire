import React, { useState } from "react";
import {
  X,
  Sparkles,
  Bot,
  User,
  Briefcase,
  Layers,
  HelpCircle,
  ArrowRight,
  Loader2,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Job, CandidateProfile, InterviewType } from "../../types";
import { getAuthHeaders } from "../../services/supabaseClient";

interface DemoInterviewSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartInterview: (sessionData: {
    session: any;
    questions: any[];
    job: Job;
    candidate: CandidateProfile;
  }) => void;
}

export const DemoInterviewSetupModal: React.FC<DemoInterviewSetupModalProps> = ({
  isOpen,
  onClose,
  onStartInterview,
}) => {
  const { jobs, allCandidates, candidate, company } = useApp();

  // Safe Job selection with fallback demo jobs
  const availableJobs = jobs && jobs.length > 0 ? jobs : [
    {
      id: "job_demo_python",
      companyId: company?.id || "comp_demo",
      companyName: company?.companyName || "Acme Tech",
      companyLogo: company?.logo || "",
      title: "Python Django Senior Engineer",
      department: "Backend Engineering",
      location: "Bengaluru, India",
      workMode: "Hybrid" as const,
      experience: "3–5 Years",
      salary: "₹18–26 LPA",
      openings: 2,
      description: "Scale high-throughput Django REST APIs and event-driven data pipelines.",
      responsibilities: ["Design resilient microservices", "Optimize database queries and caching", "Enforce security standards"],
      requirements: ["Strong Django, PostgreSQL, and Redis knowledge", "Experience with Celery and async workers"],
      requiredSkills: ["Python", "Django", "PostgreSQL", "Redis", "Docker"],
      preferredSkills: ["FastAPI", "Celery", "AWS"],
      status: "active" as const,
      createdAt: new Date().toISOString(),
    },
  ];

  // Safe Candidate pool with diverse demo personas
  const candidatePool: CandidateProfile[] = (allCandidates && allCandidates.length > 0)
    ? allCandidates
    : (candidate && candidate.isCompleted ? [candidate] : []);

  const availableCandidates: CandidateProfile[] = candidatePool.length > 0 ? candidatePool : [
    {
      id: "cand_demo_alex",
      fullName: "Alex Rivera",
      headline: "Senior Backend Engineer (Python / Django)",
      email: "alex.rivera@example.com",
      phone: "+91 98765 43210",
      location: "Bengaluru, India",
      workPreference: "Hybrid",
      yearsOfExperience: 4,
      skills: ["Python", "Django", "PostgreSQL", "Docker", "JWT", "Redis", "Celery"],
      possibleRoles: ["Backend Engineer", "Full Stack Developer"],
      education: [{ degree: "B.Tech in Computer Science", institution: "IIT Madras", year: "2021" }],
      experience: [{
        title: "Senior Backend Developer",
        company: "Nexus Fintech",
        duration: "2022 - Present",
        description: "Architected real-time transaction processing API with Django REST and JWT token rotation.",
      }],
      projects: [{
        name: "PayFlow Payment Gateway",
        description: "Built high-throughput payment webhook processor in Django with PostgreSQL partitioning and Redis queues.",
        technologies: ["Python", "Django", "PostgreSQL", "Redis"],
      }],
      certifications: ["AWS Certified Developer"],
      expectedSalary: "₹22–28 LPA",
      preferredRole: "Senior Backend Engineer",
      bio: "Passionate backend engineer with extensive experience designing resilient microservices in Python and Django.",
      profilePhoto: "",
      profileStrength: 92,
      isCompleted: true,
      commissionAgreementSigned: true,
      resumeText: "Experienced with Python Django, JWT authentication, PostgreSQL query optimization, and Celery asynchronous task queues.",
    },
    {
      id: "cand_demo_priya",
      fullName: "Priya Sharma",
      headline: "Full Stack Engineer (React / Node.js / TypeScript)",
      email: "priya.sharma@example.com",
      phone: "+91 98123 45678",
      location: "Hyderabad, India",
      workPreference: "Remote",
      yearsOfExperience: 3,
      skills: ["React", "TypeScript", "Node.js", "GraphQL", "Tailwind CSS", "Next.js"],
      possibleRoles: ["Full Stack Engineer", "Frontend Specialist"],
      education: [{ degree: "B.E. in Information Technology", institution: "BITS Pilani", year: "2022" }],
      experience: [{
        title: "Software Engineer",
        company: "CloudScale Systems",
        duration: "2022 - Present",
        description: "Developed real-time analytics dashboard in Next.js and optimized client-side bundle size.",
      }],
      projects: [{
        name: "OmniMetrics Analytics",
        description: "Built high-performance charting interface processing 50k events/sec using WebSockets and React canvas.",
        technologies: ["React", "TypeScript", "GraphQL", "Tailwind CSS"],
      }],
      certifications: ["Meta Frontend Certified"],
      expectedSalary: "₹18–24 LPA",
      preferredRole: "Full Stack Engineer",
      bio: "Frontend focused full stack engineer specializing in performant React architectures and modern web apps.",
      profilePhoto: "",
      profileStrength: 88,
      isCompleted: true,
      commissionAgreementSigned: true,
      resumeText: "Specializes in React component architecture, state management with Zustand, and modern responsive design.",
    },
  ];

  const [selectedJobId, setSelectedJobId] = useState<string>(availableJobs[0]?.id || "");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(availableCandidates[0]?.id || "");
  const [interviewType, setInterviewType] = useState<InterviewType>("ai_generated");
  const [totalQuestions, setTotalQuestions] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedJob = availableJobs.find((j) => j.id === selectedJobId) || availableJobs[0];
  const selectedCandidate = availableCandidates.find((c) => c.id === selectedCandidateId) || availableCandidates[0];

  const handleGenerateInterview = async () => {
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const headers = await getAuthHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/ai/interview/initialize", {
        method: "POST",
        headers,
        body: JSON.stringify({
          jobId: selectedJob?.id,
          candidateId: selectedCandidate?.id,
          companyId: company.id || selectedJob?.companyId || "comp_demo",
          interviewType,
          totalQuestions,
          companyQuestions: selectedJob?.interviewSettings?.questions || [
            "Explain how you design resilient APIs and handle authentication state.",
            "How do you diagnose and eliminate database query bottlenecks?",
          ],
          job: selectedJob,
          candidate: selectedCandidate,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to initialize AI interview.");
      }

      onStartInterview({
        session: data.session,
        questions: data.questions || [],
        job: selectedJob,
        candidate: selectedCandidate,
      });
      onClose();
    } catch (err: any) {
      console.error("[Demo Setup Error]:", err);
      setErrorMessage(err.message || "Failed to generate interview with Gemma 4.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">AI Interview Demo Module</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-400/20 text-indigo-300 border border-indigo-400/30">
                  Gemma 4 26B
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Test adaptive questioning & live answer evaluation before full recruitment rollout.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          {/* 1. Job Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700">
              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
              <span>Select Job Position</span>
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none cursor-pointer"
            >
              {availableJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} • {j.department} ({j.experience})
                </option>
              ))}
            </select>
            {selectedJob && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(selectedJob.requiredSkills || []).map((skill, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 2. Candidate Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Select Candidate Profile</span>
            </label>
            <select
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none cursor-pointer"
            >
              {availableCandidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} • {c.headline} ({c.yearsOfExperience} yrs exp)
                </option>
              ))}
            </select>
            {selectedCandidate && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{selectedCandidate.fullName}</span>
                  <span className="text-[10px] font-bold text-slate-500">{selectedCandidate.location}</span>
                </div>
                {selectedCandidate.projects && selectedCandidate.projects.length > 0 && (
                  <p className="text-[11px] text-slate-600">
                    <strong className="text-slate-700">Key Project:</strong> {selectedCandidate.projects[0].name} — {selectedCandidate.projects[0].description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 3. Interview Type (Section 2 & 9) */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Interview Strategy</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setInterviewType("ai_generated")}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  interviewType === "ai_generated"
                    ? "border-indigo-600 bg-indigo-50/80 shadow-xs"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-slate-900">AI Generated</span>
                  <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-indigo-600 text-white rounded">Recommended</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Gemma analyzes job + candidate background to craft tailored questions.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setInterviewType("company_questions")}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  interviewType === "company_questions"
                    ? "border-indigo-600 bg-indigo-50/80 shadow-xs"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="text-xs font-black text-slate-900 mb-1">Company Questions</div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Uses predefined company questions with dynamic AI follow-ups.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setInterviewType("hybrid")}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  interviewType === "hybrid"
                    ? "border-indigo-600 bg-indigo-50/80 shadow-xs"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="text-xs font-black text-slate-900 mb-1">Hybrid Mode</div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Combines company questions + AI project questions + follow-ups.
                </p>
              </button>
            </div>
          </div>

          {/* 4. Number of Questions */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Question Count</span>
            </label>
            <div className="flex items-center gap-3">
              {[3, 5, 8].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setTotalQuestions(count)}
                  className={`flex-1 py-2.5 rounded-xl border-2 font-black text-xs transition-all cursor-pointer ${
                    totalQuestions === count
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {count} Questions
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateInterview}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gemma 4 Analyzing Candidate & Job...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate & Start Interview</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
