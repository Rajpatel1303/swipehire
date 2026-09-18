import React, { useState } from "react";
import { X, MessageSquare, ArrowRight, Building2, Sparkles, Send } from "lucide-react";
import { TalentBid, WorkMode } from "../../types";

interface CompanyReplyCounterModalProps {
  bid: TalentBid;
  onClose: () => void;
  onConfirm: (replyData: { revisedSalary: string; revisedWorkMode: string; note: string }) => void;
}

export const CompanyReplyCounterModal: React.FC<CompanyReplyCounterModalProps> = ({
  bid,
  onClose,
  onConfirm,
}) => {
  const candidateProposedSalary = bid.counterOfferDetails?.proposedSalary || bid.salaryOffer;
  const candidateProposedWorkMode = bid.counterOfferDetails?.proposedWorkMode || bid.workMode;

  const [revisedSalary, setRevisedSalary] = useState(candidateProposedSalary);
  const [revisedWorkMode, setRevisedWorkMode] = useState<string>(candidateProposedWorkMode);
  const [note, setNote] = useState(
    bid.companyCounterDetails?.note || ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ revisedSalary, revisedWorkMode, note });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl border-2 border-slate-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-white">
                Reply to Counter-Offer
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Role: <strong className="text-white">{bid.jobTitle}</strong> ({bid.seniorityTier})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Candidate's Counter Details Card */}
          {bid.counterOfferDetails && (
            <div className="p-4 bg-sky-50/80 border-2 border-sky-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-800">
                  Candidate's Proposed Terms
                </span>
                <span className="text-[10px] text-sky-600 font-bold">
                  Received {new Date(bid.counterOfferDetails.counteredAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between font-black text-slate-900 text-sm">
                <span>{bid.counterOfferDetails.proposedSalary}</span>
                <span className="text-xs font-bold text-slate-600">
                  {bid.counterOfferDetails.proposedWorkMode}
                </span>
              </div>
              {bid.counterOfferDetails.note && (
                <p className="text-xs text-slate-600 font-medium italic border-t border-sky-100 pt-1.5 leading-relaxed">
                  "{bid.counterOfferDetails.note}"
                </p>
              )}
            </div>
          )}

          {/* Original Pitch Reference */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold px-1">
            <span>Original Pitch: {bid.salaryOffer} ({bid.workMode})</span>
            <span className="text-emerald-700">72-Hour Fast-Track SLA</span>
          </div>

          {/* Revised Compensation Input */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">
              Your Revised Compensation Offer *
            </label>
            <input
              type="text"
              value={revisedSalary}
              onChange={(e) => setRevisedSalary(e.target.value)}
              placeholder="e.g. ₹6–8 LPA or ₹18 LPA Base"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Work Arrangement Selector */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">
              Work Arrangement
            </label>
            <div className="flex gap-2">
              {["Remote", "Hybrid", "Onsite"].map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setRevisedWorkMode(mode)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    revisedWorkMode === mode
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Note from Hiring Team */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">
              Personal Message to Candidate *
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Explain why this revised offer matches your team's budget and how excited you are to interview them..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 text-xs focus:outline-none focus:border-sky-500 focus:bg-white transition-colors leading-relaxed"
            />
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-md shadow-sky-600/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Revised Counter</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
