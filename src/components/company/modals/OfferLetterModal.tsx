import React, { useState } from "react";
import {
  X,
  Sparkles,
  FileText,
  DollarSign,
  Calendar,
  Building2,
  Send,
  Download,
  Printer,
  Check,
  CheckCircle2,
  Award,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { Application, Job, CandidateProfile } from "../../../types";

interface OfferLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  job: Job;
  candidateProfile?: CandidateProfile;
}

export const OfferLetterModal: React.FC<OfferLetterModalProps> = ({
  isOpen,
  onClose,
  application,
  job,
  candidateProfile,
}) => {
  const { company, triggerCelebration, updateApplicationStatus, addNotification } = useApp();

  // Compensation Parameters
  const [fixedCtc, setFixedCtc] = useState<string>("₹14,00,000");
  const [variableBonus, setVariableBonus] = useState<string>("₹2,00,000");
  const [stockEsops, setStockEsops] = useState<string>("₹4,00,000 (0.15% Equity)");
  const [joiningBonus, setJoiningBonus] = useState<string>("₹1,00,000");
  const [joiningDate, setJoiningDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [reportingTo, setReportingTo] = useState<string>("Director of Engineering / Tech Lead");
  const [workMode, setWorkMode] = useState<string>(job.workMode || "Hybrid");
  const [location, setLocation] = useState<string>(job.location || "Ahmedabad, India");
  const [probationMonths, setProbationMonths] = useState<string>("3 Months");
  const [offerValidityDays, setOfferValidityDays] = useState<string>("7 Days");

  const [isDispatched, setIsDispatched] = useState(false);
  const [previewTab, setPreviewTab] = useState<"calculator" | "letter">("calculator");

  if (!isOpen) return null;

  const handleDispatchOffer = (e: React.FormEvent) => {
    e.preventDefault();
    updateApplicationStatus(application.id, "offer");
    addNotification({
      title: `Offer Extended to ${application.candidateName}`,
      message: `Official Offer Letter for ${job.title} dispatched via email and WhatsApp.`,
      type: "match",
      read: false,
    });
    setIsDispatched(true);
    triggerCelebration();
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[32px] shadow-2xl border-2 border-slate-900 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b-2 border-slate-100 flex items-center justify-between gap-4 bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Offer Letter Generator</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                  Official Document
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Extend formal offer to {application.candidateName} for {job.title}
              </p>
            </div>
          </div>

          {/* Toggle Tab */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-full text-xs font-black uppercase tracking-wider">
            <button
              onClick={() => setPreviewTab("calculator")}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                previewTab === "calculator"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Compensation Breakdown
            </button>
            <button
              onClick={() => setPreviewTab("letter")}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                previewTab === "letter"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Offer Letter Preview
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {previewTab === "calculator" ? (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="bg-emerald-950 text-white rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={
                      application.candidatePhoto ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                    }
                    alt={application.candidateName}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-400"
                  />
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tight">{application.candidateName}</h3>
                    <p className="text-xs text-emerald-200 font-medium">
                      Target Role: <strong className="text-white">{job.title}</strong> • {job.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/10 text-center">
                    <span className="text-sm font-black text-emerald-400 block">{candidateProfile?.expectedSalary || "₹12–15 LPA"}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-300 font-black">Candidate Ask</span>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-center">
                    <span className="text-sm font-black text-white block">{job.salary}</span>
                    <span className="text-[9px] uppercase tracking-wider text-emerald-200 font-black">Budget Cap</span>
                  </div>
                </div>
              </div>

              {/* Compensation Input Grid */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Compensation & Package Components</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                      Fixed Base Salary (Annual CTC)
                    </label>
                    <input
                      type="text"
                      value={fixedCtc}
                      onChange={(e) => setFixedCtc(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-600"
                      placeholder="e.g. ₹14,00,000 / year"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                      Performance Bonus / Variable Pay
                    </label>
                    <input
                      type="text"
                      value={variableBonus}
                      onChange={(e) => setVariableBonus(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-600"
                      placeholder="e.g. ₹2,00,000 / year"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                      Stock Options / ESOPs
                    </label>
                    <input
                      type="text"
                      value={stockEsops}
                      onChange={(e) => setStockEsops(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-600"
                      placeholder="e.g. ₹4,00,000 (4-year vesting)"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                      Signing / Relocation Bonus
                    </label>
                    <input
                      type="text"
                      value={joiningBonus}
                      onChange={(e) => setJoiningBonus(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-600"
                      placeholder="e.g. ₹1,00,000 one-time"
                    />
                  </div>
                </div>
              </div>

              {/* Role & Terms Grid */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Employment Terms & Timeline</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                      Target Joining Date
                    </label>
                    <input
                      type="date"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                      Work Model & Location
                    </label>
                    <input
                      type="text"
                      value={`${workMode} • ${location}`}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                      Reporting Hierarchy
                    </label>
                    <input
                      type="text"
                      value={reportingTo}
                      onChange={(e) => setReportingTo(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Formal Letter Preview */
            <div className="bg-white rounded-3xl border-2 border-slate-300 p-8 space-y-6 shadow-xs font-sans">
              {/* Document Letterhead */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                  {company.logo ? (
                    <img src={company.logo} alt={company.companyName} className="w-12 h-12 rounded-xl object-contain border border-slate-200 p-1" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-lg">
                      {company.companyName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{company.companyName}</h2>
                    <p className="text-xs text-slate-500 font-medium">{company.location} • Talent Acquisition Team</p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500 font-bold">
                  <span>Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span className="block text-[10px] text-emerald-700 font-black uppercase mt-0.5">Ref: OFF-{Math.floor(100000 + Math.random() * 900000)}</span>
                </div>
              </div>

              {/* Letter Content */}
              <div className="space-y-4 text-xs text-slate-800 leading-relaxed">
                <div>
                  <p className="font-bold">Dear {application.candidateName},</p>
                  <p className="mt-2">
                    On behalf of <strong>{company.companyName}</strong>, we are thrilled to formally extend this offer of employment for the position of <strong className="text-slate-900">{job.title}</strong> within our {job.department} team.
                  </p>
                  <p className="mt-2">
                    Our team was deeply impressed with your technical background, domain problem-solving, and alignment with our mission. We believe you will make an exceptional contribution to our growth.
                  </p>
                </div>

                {/* Terms Table */}
                <div className="border-2 border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                  <div className="p-3 bg-slate-100 border-b border-slate-200 font-black uppercase text-[10px] tracking-wider text-slate-700">
                    Summary of Offer Terms
                  </div>
                  <div className="divide-y divide-slate-200 text-xs">
                    <div className="grid grid-cols-2 p-2.5">
                      <span className="font-bold text-slate-600">Position / Designation</span>
                      <span className="font-black text-slate-900">{job.title}</span>
                    </div>
                    <div className="grid grid-cols-2 p-2.5">
                      <span className="font-bold text-slate-600">Fixed Annual Base CTC</span>
                      <span className="font-black text-emerald-700">{fixedCtc}</span>
                    </div>
                    <div className="grid grid-cols-2 p-2.5">
                      <span className="font-bold text-slate-600">Variable Bonus / Incentives</span>
                      <span className="font-black text-slate-900">{variableBonus}</span>
                    </div>
                    <div className="grid grid-cols-2 p-2.5">
                      <span className="font-bold text-slate-600">Stock Options / ESOP Grant</span>
                      <span className="font-black text-purple-700">{stockEsops}</span>
                    </div>
                    <div className="grid grid-cols-2 p-2.5">
                      <span className="font-bold text-slate-600">Joining Date</span>
                      <span className="font-black text-slate-900">{joiningDate}</span>
                    </div>
                    <div className="grid grid-cols-2 p-2.5">
                      <span className="font-bold text-slate-600">Location & Work Arrangement</span>
                      <span className="font-black text-slate-900">{workMode} ({location})</span>
                    </div>
                  </div>
                </div>

                <p>
                  This offer is contingent upon successful completion of background checks and verification of academic & professional credentials. Please sign and return a copy of this letter within <strong>{offerValidityDays}</strong> to confirm your acceptance.
                </p>

                {/* Sign-off */}
                <div className="pt-6 flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">For {company.companyName},</p>
                    <div className="h-8 font-serif italic text-base text-slate-600">Authorized Signature</div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Head of Talent & Engineering</p>
                  </div>

                  <div className="text-right space-y-1">
                    <p className="font-bold text-slate-900">Accepted By Candidate:</p>
                    <div className="h-8 border-b border-dashed border-slate-400 w-40 ml-auto"></div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{application.candidateName}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t-2 border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-full border-2 border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border-2 border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDispatchOffer}
              disabled={isDispatched}
              className="flex items-center gap-2 px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
            >
              {isDispatched ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Offer Letter Dispatched!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Dispatch Official Offer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
