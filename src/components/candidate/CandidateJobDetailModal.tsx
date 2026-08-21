import React from "react";
import {
  X,
  Building2,
  MapPin,
  Clock,
  Briefcase,
  IndianRupee,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Send,
  Calendar,
  Layers,
} from "lucide-react";
import { Job, Application } from "../../types";
import { useApp } from "../../context/AppContext";
import { calculateJobMatch } from "../../utils/matchingEngine";

interface CandidateJobDetailModalProps {
  job: Job | null;
  onClose: () => void;
  onApply: (jobId: string) => void;
  isApplied: boolean;
}

export const CandidateJobDetailModal: React.FC<CandidateJobDetailModalProps> = ({
  job,
  onClose,
  onApply,
  isApplied,
}) => {
  const { candidate } = useApp();
  if (!job) return null;

  const matchData = calculateJobMatch(candidate, job);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
          <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
            <img
              src={job.companyLogo || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"}
              alt={job.companyName}
              className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl object-cover ring-1 ring-slate-200 shrink-0 shadow-2xs"
            />
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-black text-slate-900 leading-snug truncate">{job.title}</h2>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">{job.companyName}</p>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
                <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-slate-600 bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 font-bold">
                  <MapPin className="w-3 h-3 text-sky-500" />
                  <span>{job.location} · {job.workMode}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-slate-600 bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 font-bold">
                  <Clock className="w-3 h-3 text-orange-500" />
                  <span>{job.experience}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-emerald-200">
                  <IndianRupee className="w-3 h-3" />
                  <span>{job.salary}</span>
                </span>
              </div>
            </div>
          </div>

          <button
            id="close-job-modal-btn"
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 text-xs text-slate-700">
          {/* AI Match Overview Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                  AI Fit Score: {matchData.matchScore}%
                </span>
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white rounded-full">
                {matchData.fitVerdict}
              </span>
            </div>

            {/* Matched dimensions breakdown */}
            {matchData.matchedReasons.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {matchData.matchedReasons.map((reason, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 text-emerald-900 rounded-lg text-[10px] font-bold border border-emerald-200 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{reason}</span>
                  </span>
                ))}
              </div>
            )}

            <p className="text-slate-700 leading-relaxed font-medium pt-1">
              {matchData.aiSummary}
            </p>
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">About the Role</h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line font-medium">{job.description}</p>
          </div>

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">Key Responsibilities</h3>
              <ul className="space-y-1.5 list-disc list-inside text-slate-600 font-medium">
                {job.responsibilities.map((r, i) => (
                  <li key={i} className="leading-relaxed">{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements & Skills */}
          <div className="space-y-2">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">Required Skills & Stack</h3>
            <div className="flex flex-wrap gap-2">
              {(job.requiredSkills || []).map((skill, i) => {
                const isMatched = matchData.matchedSkills.some(
                  (s) => s.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.toLowerCase())
                );
                return (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold uppercase text-[11px] border ${
                      isMatched
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    {isMatched && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    <span>{skill}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Benefits & Perks */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Perks & Benefits</h3>
              <div className="grid grid-cols-2 gap-2">
                {job.benefits.map((b, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="text-slate-700 font-medium">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            id="modal-apply-btn"
            disabled={isApplied}
            onClick={() => {
              onApply(job.id);
              onClose();
            }}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
              isApplied
                ? "bg-emerald-100 text-emerald-800 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
            }`}
          >
            {isApplied ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Application Submitted</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>1-Click Apply Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
