import React from "react";
import { CheckCircle2, Clock, Bot, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

interface InterviewCompletedModalProps {
  isOpen: boolean;
  jobTitle: string;
  companyName: string;
  score: number;
  verdict: string;
  integrityScore?: number;
  proctoringSummary?: string;
  onClose: () => void;
  onViewApplications: () => void;
}

export const InterviewCompletedModal: React.FC<InterviewCompletedModalProps> = ({
  isOpen,
  jobTitle,
  companyName,
  score,
  verdict,
  integrityScore = 100,
  proctoringSummary,
  onClose,
  onViewApplications,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-150">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
            Round 1 Complete • AI Technical Interview
          </span>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Interview Submitted to {companyName}!
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your technical responses, depth score, and AI evaluation for <strong>{jobTitle}</strong> have been securely delivered to their hiring cockpit.
          </p>
        </div>

        {/* Dual Scorecards: Technical Depth + Integrity */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 flex flex-col justify-between text-left space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">
                Depth Score
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-indigo-600 font-mono block">
                {score}%
              </span>
              <strong className="text-[11px] font-black text-indigo-950 truncate block mt-0.5">
                {verdict}
              </strong>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col justify-between text-left space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                Integrity Score
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-emerald-600 font-mono block">
                {integrityScore}%
              </span>
              <strong className="text-[11px] font-black text-emerald-950 block mt-0.5">
                {integrityScore >= 80 ? "Verified Clean" : "Audited Session"}
              </strong>
            </div>
          </div>
        </div>

        {/* What happens next */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>What happens next?</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            The recruiting team at <strong>{companyName}</strong> will review your transcript and score to decide whether to advance you to the next round. You will be notified the moment they make a decision.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
          <button
            type="button"
            onClick={onViewApplications}
            className="flex-1 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Track Application</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
