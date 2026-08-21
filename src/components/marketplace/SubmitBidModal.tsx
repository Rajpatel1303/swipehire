import React, { useState } from "react";
import {
  X,
  Send,
  Sparkles,
  DollarSign,
  Building2,
  Briefcase,
  Gift,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { BlindTalentProfile, WorkMode } from "../../types";

interface SubmitBidModalProps {
  talent: BlindTalentProfile;
  onClose: () => void;
}

export const SubmitBidModal: React.FC<SubmitBidModalProps> = ({ talent, onClose }) => {
  const { company, jobs, submitTalentBid } = useApp();

  const [selectedJobId, setSelectedJobId] = useState<string>(
    jobs[0]?.id || ""
  );
  const [jobTitle, setJobTitle] = useState<string>(
    jobs[0]?.title || talent.preferredRoles[0] || "Senior Engineer"
  );
  const [seniorityTier, setSeniorityTier] = useState<
    "Mid-Level" | "Senior" | "Lead" | "Staff / Principal"
  >("Senior");
  const [salaryOffer, setSalaryOffer] = useState<string>(talent.targetSalaryRange || "₹14–18 LPA");
  const [bonusAndEquity, setBonusAndEquity] = useState<string>(
    "₹1.5 Lakh Sign-On Bonus + 0.15% ESOPs"
  );
  const [workMode, setWorkMode] = useState<WorkMode>("Hybrid");
  const [pitchMessage, setPitchMessage] = useState<string>(
    `Hi! We reviewed your anonymous proof-of-work in ${talent.verifiedSkills[0]?.name || "modern architecture"} and were thoroughly impressed by your benchmarks. We are offering an immediate fast-track technical discussion with our engineering lead.`
  );
  const [selectedPerks, setSelectedPerks] = useState<string[]>([
    "MacBook Pro M3 Max provided",
    "₹50,000 Annual Learning Budget",
    "Comprehensive Health Insurance",
  ]);

  const availablePerks = [
    "MacBook Pro M3 Max provided",
    "₹50,000 Annual Learning Budget",
    "Comprehensive Health Insurance",
    "100% Remote / Home Setup Stipend",
    "Flexible Working Hours",
    "Quarterly Performance Bonuses",
    "Gym & Wellness Allowance",
  ];

  const handleJobSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const jId = e.target.value;
    setSelectedJobId(jId);
    const matchedJob = jobs.find((j) => j.id === jId);
    if (matchedJob) {
      setJobTitle(matchedJob.title);
      setWorkMode(matchedJob.workMode);
    }
  };

  const togglePerk = (perk: string) => {
    if (selectedPerks.includes(perk)) {
      setSelectedPerks(selectedPerks.filter((p) => p !== perk));
    } else {
      setSelectedPerks([...selectedPerks, perk]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryOffer.trim() || !pitchMessage.trim()) return;

    submitTalentBid({
      blindTalentId: talent.id,
      candidateId: talent.candidateId,
      companyId: company.id,
      companyName: company.companyName,
      companyLogo: company.logo || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
      companyIndustry: company.industry,
      companyLocation: company.location,
      jobId: selectedJobId,
      jobTitle,
      seniorityTier,
      salaryOffer,
      bonusAndEquity,
      workMode,
      pitchMessage,
      perks: selectedPerks,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl border-2 border-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b-2 border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-lg">
              💎
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">
                  Submit Upfront Talent Bid
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  72h Window
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Bidding on: <strong className="text-emerald-400">{talent.anonymousHandle}</strong>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Target Candidate Snapshot */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Candidate Target Band
              </span>
              <span className="text-sm font-black text-slate-900">
                {talent.targetSalaryRange} · {talent.experienceYears} Years Exp · {talent.workPreference}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {talent.verifiedSkills.slice(0, 4).map((s, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded-full font-bold text-slate-700 text-[10px]"
                >
                  ✓ {s.name} ({s.level})
                </span>
              ))}
            </div>
          </div>

          {/* Job & Seniority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">
                Associate with Job Opening
              </label>
              <select
                value={selectedJobId}
                onChange={handleJobSelect}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">
                Seniority Tier Offered
              </label>
              <select
                value={seniorityTier}
                onChange={(e) => setSeniorityTier(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="Mid-Level">Mid-Level Engineer</option>
                <option value="Senior">Senior Engineer</option>
                <option value="Lead">Team / Tech Lead</option>
                <option value="Staff / Principal">Staff / Principal Architect</option>
              </select>
            </div>
          </div>

          {/* Compensation Pitch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">
                Guaranteed Upfront Base CTC *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={salaryOffer}
                  onChange={(e) => setSalaryOffer(e.target.value)}
                  placeholder="e.g. ₹15–18 LPA"
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Must match or exceed candidate's target band.</p>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">
                Bonus & Equity (Optional)
              </label>
              <input
                type="text"
                value={bonusAndEquity}
                onChange={(e) => setBonusAndEquity(e.target.value)}
                placeholder="e.g. ₹2L Joining Bonus + 0.2% ESOPs"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Work Mode */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">
              Work Mode Arrangement
            </label>
            <div className="flex gap-3">
              {(["Remote", "Hybrid", "Onsite"] as WorkMode[]).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setWorkMode(mode)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    workMode === mode
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Personalized Pitch Message */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">
              Personalized Engineering Pitch *
            </label>
            <textarea
              rows={3}
              value={pitchMessage}
              onChange={(e) => setPitchMessage(e.target.value)}
              placeholder="Highlight why their verified proof-of-work matches your team and what they will build..."
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Perks selector */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1.5">
              Included Company Perks & Benefits
            </label>
            <div className="flex flex-wrap gap-2">
              {availablePerks.map((perk) => {
                const isSelected = selectedPerks.includes(perk);
                return (
                  <button
                    type="button"
                    key={perk}
                    onClick={() => togglePerk(perk)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "} {perk}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fast track guarantee info */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-[11px] leading-tight">
              <strong>72-Hour Fast-Track SLA Guarantee:</strong> If the candidate accepts your upfront bid, their full contact details will be unlocked and added to your interview schedule automatically.
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-md shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send Upfront Bid</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
