import React from "react";
import {
  X,
  AlertTriangle,
  Bot,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Flame,
  Briefcase,
  MapPin,
  Building2,
  HelpCircle,
} from "lucide-react";
import { Job, CandidateProfile } from "../../types";

interface CandidateInterviewGateModalProps {
  isOpen: boolean;
  job: Job | null;
  candidate: CandidateProfile;
  isLoading?: boolean;
  onClose: () => void;
  onStartInterview: (job: Job) => void;
}

export const CandidateInterviewGateModal: React.FC<CandidateInterviewGateModalProps> = ({
  isOpen,
  job,
  candidate,
  isLoading = false,
  onClose,
  onStartInterview,
}) => {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 block">
                Round 1 Mandatory Assessment
              </span>
              <h2 className="text-base font-black tracking-tight text-white line-clamp-1">
                AI Technical Interview Gate
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs leading-relaxed">
          {/* Job Snapshot */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
            <img
              src={
                job.companyLogo ||
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"
              }
              alt={job.companyName}
              className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 shrink-0 bg-white"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black text-slate-900 truncate">{job.title}</h3>
              <p className="text-xs text-slate-500 font-bold">{job.companyName}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-600 font-medium">
                <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  <MapPin className="w-3 h-3 text-sky-500" />
                  {job.location} · {job.workMode}
                </span>
                <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold text-emerald-700">
                  {job.salary}
                </span>
              </div>
            </div>
          </div>

          {/* Strict 1-Attempt Policy Alert */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-black text-amber-900 text-xs">
                <span>Strict 1-Attempt Limit Policy</span>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-200/80 text-amber-900 text-[10px] uppercase font-black">
                  Important
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-normal font-medium">
                You get <strong>only ONE opportunity</strong> to interview for this position. Once you finish, your score, Q&amp;A transcript, and evaluation are permanently locked and submitted to the company.
              </p>
            </div>
          </div>

          {/* Coach Advice Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2">
            <div className="flex items-center gap-2 font-black text-indigo-900 text-xs">
              <Flame className="w-4 h-4 text-indigo-600" />
              <span>Advice for Success — Do Your Absolute Best!</span>
            </div>
            <p className="text-[11px] text-indigo-950 leading-relaxed font-normal">
              The hiring team at <strong>{job.companyName}</strong> will directly inspect your AI interview scorecard, technical depth, and actual answers to decide whether to advance you to the next round.
            </p>
            <ul className="space-y-1.5 text-[11px] text-indigo-900/90 pt-1">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>Explain real-world projects and design trade-offs you encountered.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>Mention architecture, edge cases, and performance considerations.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>Answer clearly and avoid generic or evasive responses.</span>
              </li>
            </ul>
          </div>

          {/* Round Details */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
              <Clock className="w-4 h-4 text-slate-500 mx-auto" />
              <span className="text-[10px] text-slate-500 uppercase font-black block">Time</span>
              <strong className="text-xs text-slate-800 font-black">5 - 8 Mins</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
              <HelpCircle className="w-4 h-4 text-indigo-600 mx-auto" />
              <span className="text-[10px] text-slate-500 uppercase font-black block">Format</span>
              <strong className="text-xs text-slate-800 font-black">3 Technical Qs</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
              <Bot className="w-4 h-4 text-emerald-600 mx-auto" />
              <span className="text-[10px] text-slate-500 uppercase font-black block">AI Engine</span>
              <strong className="text-xs text-slate-800 font-black">Gemma 4 26B</strong>
            </div>
          </div>

          {/* Skills Tested */}
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Skills Evaluated in this Round:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {job.requiredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            Prepare &amp; Take Later
          </button>

          <button
            type="button"
            onClick={() => onStartInterview(job)}
            disabled={isLoading}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01]"
          >
            {isLoading ? (
              <>
                <Bot className="w-4 h-4 animate-spin" />
                <span>Preparing Interview Room...</span>
              </>
            ) : (
              <>
                <span>Start AI Interview Now</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
