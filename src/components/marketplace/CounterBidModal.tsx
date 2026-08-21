import React, { useState } from "react";
import { X, MessageSquare, DollarSign, ArrowRight, Shield } from "lucide-react";
import { TalentBid, WorkMode } from "../../types";

interface CounterBidModalProps {
  bid: TalentBid;
  onClose: () => void;
  onConfirm: (counterData: { proposedSalary: string; proposedWorkMode: string; note: string }) => void;
}

export const CounterBidModal: React.FC<CounterBidModalProps> = ({ bid, onClose, onConfirm }) => {
  const [proposedSalary, setProposedSalary] = useState(bid.salaryOffer);
  const [proposedWorkMode, setProposedWorkMode] = useState<string>(bid.workMode);
  const [note, setNote] = useState(
    `Thank you for the upfront offer! Given my recent work on high-throughput systems, I would be excited to move forward with this adjusted compensation/work mode.`
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ proposedSalary, proposedWorkMode, note });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl border-2 border-slate-900 shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg">
              💬
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-white">
                Propose Counter-Offer
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                To {bid.companyName} · {bid.jobTitle}
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
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
              Current Company Pitch
            </span>
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>{bid.salaryOffer}</span>
              <span className="text-slate-500 font-medium">({bid.workMode})</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">
              Proposed CTC Expectation *
            </label>
            <input
              type="text"
              value={proposedSalary}
              onChange={(e) => setProposedSalary(e.target.value)}
              placeholder="e.g. ₹16–19 LPA"
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">
              Preferred Work Mode
            </label>
            <div className="flex gap-2">
              {["Remote", "Hybrid", "Onsite"].map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setProposedWorkMode(mode)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    proposedWorkMode === mode
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">
              Note to Hiring Team *
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-md shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Submit Counter-Offer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
