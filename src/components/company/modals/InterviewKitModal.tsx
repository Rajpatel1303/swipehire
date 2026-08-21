import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Star,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  FileText,
  UserCheck,
  Building2,
  Calendar,
  Save,
  Check,
  Copy,
  ChevronRight,
  BrainCircuit,
  Award,
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { Application, Job, CandidateProfile } from "../../../types";

interface InterviewKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  job: Job;
  candidateProfile?: CandidateProfile;
}

export const InterviewKitModal: React.FC<InterviewKitModalProps> = ({
  isOpen,
  onClose,
  application,
  job,
  candidateProfile,
}) => {
  const { triggerCelebration, updateApplicationStatus } = useApp();

  // Ratings for scorecards
  const [techRating, setTechRating] = useState<number>(4);
  const [problemSolvingRating, setProblemSolvingRating] = useState<number>(4);
  const [communicationRating, setCommunicationRating] = useState<number>(5);
  const [cultureFitRating, setCultureFitRating] = useState<number>(4);
  const [overallVerdict, setOverallVerdict] = useState<"strong_hire" | "hire" | "neutral" | "do_not_hire">("strong_hire");
  const [interviewerNotes, setInterviewerNotes] = useState<string>(
    `Demonstrated solid architectural intuition during live discussion. Strong grasp of ${job.requiredSkills.slice(0, 2).join(" & ")}. Communicates thoughts clearly with structured problem breakdown.`
  );
  const [isSaved, setIsSaved] = useState(false);
  const [copiedQuestion, setCopiedQuestion] = useState<number | null>(null);

  if (!isOpen) return null;

  const averageRating = (
    (techRating + problemSolvingRating + communicationRating + cultureFitRating) /
    4
  ).toFixed(1);

  const questions = [
    {
      category: "Technical Mastery & Deep Dive",
      difficulty: "Advanced",
      question: `How would you architect a high-throughput, low-latency client experience using ${job.requiredSkills[0] || "React"} and ${job.requiredSkills[1] || "TypeScript"}?`,
      lookFor: `Clean state separation, memoization, proper error boundaries, and predictable asynchronous data flow.`,
    },
    {
      category: "Real-World Problem Solving",
      difficulty: "Practical",
      question: `Describe a production bottleneck you diagnosed in your previous role. What metrics did you evaluate to isolate the issue?`,
      lookFor: `Systematic debugging process, understanding of profiling tools (Chrome DevTools, APM, network payloads), and quantifiable outcomes.`,
    },
    {
      category: "Role Alignment & Scalability",
      difficulty: "Intermediate",
      question: `For ${job.title} at ${job.companyName}, how would you balance rapid feature delivery against tech debt and automated testing?`,
      lookFor: `Pragmatism, testing pyramid awareness (unit vs integration), and proactive team communication.`,
    },
    {
      category: "Behavioral & Team Culture",
      difficulty: "Collaboration",
      question: `Tell us about a time you disagreed with a technical design proposal from a teammate. How did you resolve the deadlock?`,
      lookFor: `Constructive empathy, data-driven decisions, consensus building, and focus on product velocity.`,
    },
  ];

  const handleCopyQuestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestion(index);
    setTimeout(() => setCopiedQuestion(null), 2000);
  };

  const handleSaveScorecard = () => {
    setIsSaved(true);
    triggerCelebration();
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[32px] shadow-2xl border-2 border-slate-900 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b-2 border-slate-100 flex items-center justify-between gap-4 bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-xs">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">AI Interview Kit & Scorecard</h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider">
                  Live Rubric
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Tailored for {application.candidateName} • Candidate for {job.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Candidate Overview Quick Banner */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={
                  application.candidatePhoto ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                }
                alt={application.candidateName}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-400"
              />
              <div>
                <h3 className="text-base font-black uppercase tracking-tight">{application.candidateName}</h3>
                <p className="text-xs text-slate-300 font-medium">
                  {candidateProfile?.headline || "Full Stack Engineer"} • {candidateProfile?.yearsOfExperience || 3} Yrs Exp • {candidateProfile?.location || "Ahmedabad"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/10 text-center">
                <span className="text-lg font-black text-emerald-400 block">{application.matchScore}%</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black">AI Radar Fit</span>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-center">
                <span className="text-lg font-black text-purple-300 block">{averageRating} / 5</span>
                <span className="text-[9px] uppercase tracking-wider text-purple-200 font-black">Live Score</span>
              </div>
            </div>
          </div>

          {/* Section 1: Tailored Interview Questions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Targeted Question Bank ({questions.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Click copy to share with interviewers</span>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-2xl border-2 border-slate-200 hover:border-slate-400 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-black uppercase tracking-wider border border-purple-100">
                        {q.category}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{q.difficulty}</span>
                    </div>

                    <button
                      onClick={() => handleCopyQuestion(q.question, idx)}
                      className="px-2.5 py-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 border border-slate-200"
                    >
                      {copiedQuestion === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-sm font-bold text-slate-900 leading-snug">{q.question}</p>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600 font-medium">
                    <span className="font-black text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">
                      Expected Strong Answer Indicators:
                    </span>
                    {q.lookFor}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Interactive Interview Scorecard Rubric */}
          <div className="bg-slate-50 rounded-3xl p-6 border-2 border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>Evaluation Scorecard & Debrief Rubric</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Rate key competencies to compute hiring consensus.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 font-black uppercase tracking-wider block">Total Rating</span>
                <span className="text-xl font-black text-purple-700">{averageRating} / 5.0</span>
              </div>
            </div>

            {/* Rubrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Technical Depth */}
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">1. Technical Depth</span>
                  <span className="text-xs font-black text-purple-600">{techRating} / 5</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setTechRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= techRating ? "text-amber-400 fill-amber-400" : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Core framework mastery, code quality, and debugging proficiency.</p>
              </div>

              {/* Problem Solving & Architecture */}
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">2. Problem Solving</span>
                  <span className="text-xs font-black text-purple-600">{problemSolvingRating} / 5</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setProblemSolvingRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= problemSolvingRating ? "text-amber-400 fill-amber-400" : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">System architecture intuition, algorithmic clarity, edge cases.</p>
              </div>

              {/* Communication */}
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">3. Communication</span>
                  <span className="text-xs font-black text-purple-600">{communicationRating} / 5</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCommunicationRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= communicationRating ? "text-amber-400 fill-amber-400" : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Thought articulation, listening skills, cross-team collaboration.</p>
              </div>

              {/* Culture Fit & Velocity */}
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">4. Culture & Velocity</span>
                  <span className="text-xs font-black text-purple-600">{cultureFitRating} / 5</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCultureFitRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= cultureFitRating ? "text-amber-400 fill-amber-400" : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Startup alignment, continuous learning mindset, execution energy.</p>
              </div>
            </div>

            {/* Hiring Decision Recommendation */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                Final Hiring Recommendation
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "strong_hire", label: "Strong Hire", color: "bg-emerald-600 text-white" },
                  { id: "hire", label: "Hire", color: "bg-sky-600 text-white" },
                  { id: "neutral", label: "Borderline", color: "bg-amber-600 text-white" },
                  { id: "do_not_hire", label: "Do Not Hire", color: "bg-red-600 text-white" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOverallVerdict(item.id as any)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
                      overallVerdict === item.id
                        ? `${item.color} shadow-sm border-transparent`
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recruiter / Interviewer Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                Interviewer Debrief Notes
              </label>
              <textarea
                value={interviewerNotes}
                onChange={(e) => setInterviewerNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white rounded-2xl border-2 border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-600 transition-colors"
                placeholder="Add synthesis notes on strengths, concerns, and compensation positioning..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 border-slate-100 flex items-center justify-between gap-4 bg-slate-50/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border-2 border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveScorecard}
            disabled={isSaved}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Scorecard Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Scorecard & Submit</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
