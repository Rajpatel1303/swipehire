import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Shield,
  Clock,
  DollarSign,
  Briefcase,
  Building2,
  CheckCircle2,
  Zap,
  Filter,
  Eye,
  EyeOff,
  Send,
  ArrowRight,
  TrendingUp,
  Award,
  Code2,
  ChevronRight,
  Lock,
  Unlock,
  AlertCircle,
  HelpCircle,
  Search,
  MessageSquare,
  Gift,
  RefreshCw,
} from "lucide-react";
import { useApp, generateCandidateBlindProfile } from "../../context/AppContext";
import { BlindTalentProfile, TalentBid, WorkMode } from "../../types";
import { SubmitBidModal } from "./SubmitBidModal";
import { CounterBidModal } from "./CounterBidModal";
import { CompanyReplyCounterModal } from "./CompanyReplyCounterModal";

export const ReverseMarketplacePage: React.FC = () => {
  const {
    role,
    candidate,
    company,
    blindTalentProfiles,
    talentBids,
    toggleCandidateListing,
    respondToTalentBid,
    companyRespondToCounterOffer,
    simulateCandidateCounterOffer,
    setActiveView,
    setSelectedJobId,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"browse" | "my-bids" | "my-pitch">(
    role === "candidate" ? "my-bids" : "browse"
  );
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>("All");
  const [selectedWorkModeFilter, setSelectedWorkModeFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTalentForBid, setSelectedTalentForBid] = useState<BlindTalentProfile | null>(null);
  const [selectedBidForCounter, setSelectedBidForCounter] = useState<TalentBid | null>(null);
  const [selectedBidForCompanyReply, setSelectedBidForCompanyReply] = useState<TalentBid | null>(null);

  // Time remaining calculator helper
  const calculateTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m left`;
  };

  // Find candidate's own blind profile
  const myBlindProfile =
    blindTalentProfiles.find((p) => p.candidateId === candidate.id) ||
    generateCandidateBlindProfile(candidate, false);

  // Filter bids for candidate
  const myCandidateBids = talentBids.filter(
    (b) => b.candidateId === candidate.id
  );

  // Filter bids for company
  const myCompanyBids = talentBids.filter(
    (b) => b.companyId === company.id
  );

  // Filter anonymous profiles
  const filteredProfiles = blindTalentProfiles.filter((profile) => {
    if (!profile.isListed) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRole = profile.preferredRoles.some((r) => r.toLowerCase().includes(q));
      const matchSkill = profile.verifiedSkills.some((s) => s.name.toLowerCase().includes(q));
      const matchHandle = profile.anonymousHandle.toLowerCase().includes(q);
      if (!matchRole && !matchSkill && !matchHandle) return false;
    }
    if (selectedSkillFilter !== "All") {
      const hasSkill = profile.verifiedSkills.some(
        (s) => s.name.toLowerCase() === selectedSkillFilter.toLowerCase()
      );
      if (!hasSkill) return false;
    }
    if (selectedWorkModeFilter !== "All") {
      if (profile.workPreference !== selectedWorkModeFilter && profile.workPreference !== "Any") {
        return false;
      }
    }
    return true;
  });

  const allSkillsList = ["All", "React", "Node.js", "TypeScript", "Python", "Go", "AWS", "PostgreSQL", "Next.js", "FastAPI"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 border-2 border-slate-900 shadow-xl mb-8">
        <div className="absolute top-0 right-0 translate-x-10 -translate-y-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Reverse Hiring Marketplace · Blind Bidding</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Where Top Talent Gets Pitched With <span className="text-emerald-400">Upfront Offers</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
              No bias, no resume blackholes. Top candidates list verified proof-of-work anonymously. Verified companies compete by submitting binding salary bids within a fast-track 72-hour decision window.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center">
              <span className="text-emerald-400 font-black text-lg block">₹18.4L</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Avg Bid CTC</span>
            </div>
            <div className="text-center border-x border-white/10 px-3">
              <span className="text-amber-400 font-black text-lg block">72h</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Max SLA</span>
            </div>
            <div className="text-center">
              <span className="text-sky-400 font-black text-lg block">100%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Unbiased</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 flex overflow-x-auto no-scrollbar sm:flex-wrap items-center gap-2 pt-6 border-t border-white/10 -mx-2 px-2 sm:mx-0 sm:px-0">
          {role === "candidate" ? (
            <>
              <button
                onClick={() => setActiveTab("my-bids")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === "my-bids"
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>My Incoming Bids ({myCandidateBids.length})</span>
                {myCandidateBids.filter((b) => b.status === "pending").length > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black animate-pulse">
                    {myCandidateBids.filter((b) => b.status === "pending").length} Actionable
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("my-pitch")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === "my-pitch"
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>My Blind Pitch & Privacy</span>
              </button>

              <button
                onClick={() => setActiveTab("browse")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === "browse"
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Explore Talent ({filteredProfiles.length})</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab("browse")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === "browse"
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Discover Anonymous Talent ({filteredProfiles.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("my-bids")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === "my-bids"
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Company Sent Bids ({myCompanyBids.length})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* VIEW: MY CANDIDATE BIDS (72H COUNTDOWN & ACTIONS) */}
      {activeTab === "my-bids" && role === "candidate" && (
        <div className="space-y-6">
          {/* Quick Pitch Status Bar */}
          <div className="bg-white p-5 rounded-3xl border-2 border-slate-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                {myBlindProfile?.isListed ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-900">
                    Your Blind Pitch Status:
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      myBlindProfile?.isListed
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {myBlindProfile?.isListed ? "● LIVE IN MARKETPLACE" : "○ PAUSED"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {myBlindProfile?.isListed
                    ? "Verified tech companies can browse your proof-of-work and submit fast-track bids."
                    : "Your profile is hidden. Turn it LIVE to receive upfront compensation offers."}
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleCandidateListing(!myBlindProfile?.isListed)}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                myBlindProfile?.isListed
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              }`}
            >
              {myBlindProfile?.isListed ? "Pause Anonymous Pitch" : "🚀 Go LIVE in Marketplace"}
            </button>
          </div>

          {/* Bids List */}
          {myCandidateBids.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border-2 border-slate-900 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
                ⏳
              </div>
              <h3 className="text-lg font-black text-slate-900">No Bids Received Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Once verified tech companies discover your anonymous superpowers, their upfront CTC pitches with 72-hour countdown timers will appear here in real time.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setActiveTab("my-pitch")}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-full text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 cursor-pointer transition-all"
                >
                  Configure My Blind Pitch
                </button>
                <button
                  onClick={() => setActiveTab("browse")}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-black uppercase tracking-wider cursor-pointer transition-all"
                >
                  Explore Talent Market
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {myCandidateBids.map((bid) => {
                const isPending = bid.status === "pending";
                const isAccepted = bid.status === "accepted";
                const isCountered = bid.status === "countered";
                const isDeclined = bid.status === "declined";

                return (
                  <div
                    key={bid.id}
                    className={`bg-white rounded-3xl border-2 border-slate-900 shadow-sm overflow-hidden flex flex-col justify-between transition-all ${
                      isPending ? "ring-2 ring-emerald-500/30" : ""
                    }`}
                  >
                    {/* Bid Header */}
                    <div className="p-6 border-b border-slate-100 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={bid.companyLogo}
                            alt={bid.companyName}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                          />
                          <div>
                            <h3 className="font-black text-slate-900 text-base flex items-center gap-1.5">
                              {bid.companyName}
                              <span className="text-[10px] text-slate-400 font-bold">· {bid.companyIndustry}</span>
                            </h3>
                            <p className="text-xs text-slate-600 font-medium">
                              Offering: <strong className="text-slate-900">{bid.jobTitle}</strong> ({bid.seniorityTier})
                            </p>
                          </div>
                        </div>

                        {/* Status Badge & SLA Countdown */}
                        <div className="text-right shrink-0">
                          {isPending && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-full text-xs font-black">
                              <Clock className="w-3.5 h-3.5 animate-spin" />
                              <span>{calculateTimeRemaining(bid.expiresAt)}</span>
                            </div>
                          )}
                          {isAccepted && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-black">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Bid Accepted</span>
                            </span>
                          )}
                          {isCountered && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-sky-100 text-sky-800 border border-sky-300 rounded-full text-xs font-black">
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Counter Sent</span>
                            </span>
                          )}
                          {isDeclined && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                              Passed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Upfront Compensation Banner */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-teal-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 block">
                            Upfront Guaranteed CTC
                          </span>
                          <span className="text-xl font-black text-emerald-950">
                            {bid.salaryOffer}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                            Work Arrangement
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {bid.workMode} · {bid.companyLocation}
                          </span>
                        </div>
                      </div>

                      {/* Bonus & Perks */}
                      {bid.bonusAndEquity && (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{bid.bonusAndEquity}</span>
                        </div>
                      )}

                      {/* Recruiter Pitch Message */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
                        "{bid.pitchMessage}"
                      </div>

                      {/* Perks */}
                      {bid.perks && bid.perks.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {bid.perks.map((p, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-full text-[10px] font-bold"
                            >
                              ✓ {p}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Counter offer details if exists */}
                      {bid.counterOfferDetails && (
                        <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 space-y-1">
                          <div className="flex items-center justify-between font-bold">
                            <span>Your Counter-Proposal:</span>
                            <span className="text-[10px] text-sky-600 font-normal">
                              {new Date(bid.counterOfferDetails.counteredAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div>Proposed Salary: <strong>{bid.counterOfferDetails.proposedSalary}</strong> ({bid.counterOfferDetails.proposedWorkMode})</div>
                          <div className="italic text-slate-600">"{bid.counterOfferDetails.note}"</div>
                        </div>
                      )}

                      {/* Company Revised Counter Reply */}
                      {bid.companyCounterDetails && (
                        <div className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-xs text-emerald-950 space-y-1.5 shadow-xs animate-in fade-in duration-150">
                          <div className="flex items-center justify-between font-black">
                            <span className="text-emerald-800 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{bid.companyName} Replied With Revised Offer</span>
                            </span>
                            <span className="text-[10px] text-emerald-700 font-bold">
                              {new Date(bid.companyCounterDetails.repliedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between font-black text-sm text-slate-900">
                            <span>{bid.companyCounterDetails.revisedSalary}</span>
                            <span className="text-xs font-bold text-slate-600">
                              {bid.companyCounterDetails.revisedWorkMode}
                            </span>
                          </div>
                          {bid.companyCounterDetails.note && (
                            <p className="italic text-slate-700 leading-relaxed border-t border-emerald-100 pt-1">
                              "{bid.companyCounterDetails.note}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => respondToTalentBid(bid.id, "decline")}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer text-center"
                          >
                            Pass
                          </button>
                          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => setSelectedBidForCounter(bid)}
                              className="px-3 sm:px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                            >
                              Counter Offer
                            </button>
                            <button
                              onClick={() => respondToTalentBid(bid.id, "accept")}
                              className="px-4 sm:px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                            >
                              <Unlock className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">Accept & Reveal</span>
                            </button>
                          </div>
                        </>
                      ) : isAccepted ? (
                        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-800 font-bold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Contact info revealed · Interview fast-tracked</span>
                          </span>
                          <button
                            onClick={() => setActiveView("candidate-applications")}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer text-center"
                          >
                            Track in Applications →
                          </button>
                        </div>
                      ) : isCountered && (bid.lastActionBy === "company" || !!bid.companyCounterDetails) ? (
                        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <button
                            onClick={() => respondToTalentBid(bid.id, "decline")}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer text-center"
                          >
                            Pass
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedBidForCounter(bid)}
                              className="px-3.5 py-2 bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                              <span>Reply / Counter Offer</span>
                            </button>
                            <button
                              onClick={() => respondToTalentBid(bid.id, "accept")}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Unlock className="w-3.5 h-3.5 shrink-0" />
                              <span>Accept Revised Offer</span>
                            </button>
                          </div>
                        </div>
                      ) : isCountered ? (
                        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs text-amber-700 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                            <span>Awaiting company response on your counter</span>
                          </div>
                          <button
                            onClick={() => setSelectedBidForCounter(bid)}
                            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Edit / Follow Up
                          </button>
                        </div>
                      ) : (
                        <div className="w-full text-right text-xs text-slate-400 font-medium">
                          Offer passed
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW: MY BLIND PITCH & PRIVACY SETTINGS */}
      {activeTab === "my-pitch" && role === "candidate" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings & Explainer */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border-2 border-slate-900 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase tracking-wide">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Zero-Bias Anonymity Guarantee</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                To guarantee zero unconscious bias, your <strong>real name, gender, photos, and contact info</strong> remain encrypted and hidden from all company recruiters until you willingly accept their upfront salary bid.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Marketplace Listing</span>
                    <span className="text-[10px] text-slate-500">Allow companies to pitch bids</span>
                  </div>
                  <button
                    onClick={() => toggleCandidateListing(!myBlindProfile?.isListed)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      myBlindProfile?.isListed ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        myBlindProfile?.isListed ? "left-6.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-emerald-950 text-emerald-100 p-6 rounded-3xl border-2 border-emerald-900 space-y-3">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <span>How Reverse Hiring Works</span>
              </div>
              <ul className="text-xs space-y-2 text-emerald-200/90 font-medium">
                <li className="flex items-start gap-2">
                  <span className="font-black text-emerald-400">1.</span>
                  <span>Your verified proof-of-work & benchmarks are showcased anonymously.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black text-emerald-400">2.</span>
                  <span>Recruiters send binding upfront CTC offers + perks.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black text-emerald-400">3.</span>
                  <span>You have 72 hours to Accept, Counter, or Pass.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Live Preview of Anonymous Card */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                Live Preview: How Companies See You
              </span>
              <span className="px-2.5 py-1 bg-slate-200 text-slate-800 rounded-full text-[10px] font-bold flex items-center gap-1">
                <EyeOff className="w-3 h-3 text-slate-600" />
                Identity Encrypted
              </span>
            </div>

            {/* Candidate Anonymous Card Preview */}
            <div className="bg-white rounded-3xl border-2 border-slate-900 shadow-md p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center text-2xl font-black shadow-md">
                    #704
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {myBlindProfile?.anonymousHandle || "Anonymous React & Node Specialist"}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold">
                      {myBlindProfile?.experienceYears || candidate.yearsOfExperience || "3"} Years Experience · {myBlindProfile?.workPreference || "Ahmedabad / Remote"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    Target Band
                  </span>
                  <span className="text-base font-black text-emerald-600">
                    {myBlindProfile?.targetSalaryRange || candidate.expectedSalary || "₹14–18 LPA"}
                  </span>
                </div>
              </div>

              {/* Verified Superpowers */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                  Verified Proof-Of-Work & Superpowers
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(myBlindProfile?.superpowers || [
                    "Engineered real-time sync engine supporting 10k concurrent websocket streams",
                    "Authored automated CI/CD pipeline reducing build latencies by 60%",
                  ]).map((power, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 flex items-start gap-2"
                    >
                      <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{power}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Skills */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                  Verified Technical Benchmarks
                </span>
                <div className="flex flex-wrap gap-2">
                  {(myBlindProfile?.verifiedSkills || [
                    { name: "React 19", level: "Expert", benchmarkPercentile: 96 },
                    { name: "TypeScript", level: "Expert", benchmarkPercentile: 94 },
                    { name: "Node.js", level: "Advanced", benchmarkPercentile: 91 },
                  ]).map((s, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {s.name} ({s.level} · Top {100 - (s.benchmarkPercentile || 90)}%)
                    </span>
                  ))}
                </div>
              </div>

              {/* Pedigree without names */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-amber-400" />
                  <div className="text-xs">
                    <strong className="block text-white">Tier-1 Engineering Pedigree</strong>
                    <span className="text-slate-400">B.Tech in Computer Science & Engineering</span>
                  </div>
                </div>
                <span className="text-xs text-emerald-400 font-bold">Verified Background ✓</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: BROWSE ANONYMOUS TALENT (FOR RECRUITERS & EXPLORATION) */}
      {activeTab === "browse" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-5 rounded-3xl border-2 border-slate-900 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by skill, role or handle..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Work Mode filter */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                {["All", "Remote", "Hybrid", "Onsite"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSelectedWorkModeFilter(mode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      selectedWorkModeFilter === mode
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Skill Tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">
                Filter Skill:
              </span>
              {allSkillsList.map((skill) => (
                <button
                  key={skill}
                  onClick={() => setSelectedSkillFilter(skill)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedSkillFilter === skill
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Talent Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProfiles.map((talent) => (
              <div
                key={talent.id}
                className="bg-white rounded-3xl border-2 border-slate-900 shadow-sm p-6 space-y-5 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black text-base flex items-center justify-center shadow-xs">
                        {talent.anonymousHandle.slice(-4)}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-base">
                          {talent.anonymousHandle}
                        </h3>
                        <p className="text-xs text-slate-500 font-bold">
                          {talent.experienceYears} Years Exp · {talent.workPreference}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                        Target Band
                      </span>
                      <span className="text-sm font-black text-emerald-600">
                        {talent.targetSalaryRange}
                      </span>
                    </div>
                  </div>

                  {/* Superpowers */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                      Verified Proof-of-Work
                    </span>
                    {talent.superpowers.slice(0, 2).map((power, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 flex items-start gap-2"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{power}</span>
                      </div>
                    ))}
                  </div>

                  {/* Skills badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {talent.verifiedSkills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-[11px] font-bold"
                      >
                        ✓ {s.name} ({s.level})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{talent.activeBidsCount} Active Bids</span>
                  </div>

                  {role === "company" ? (
                    <button
                      onClick={() => setSelectedTalentForBid(talent)}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Place Upfront Bid</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-slate-400">
                      Company Recruiters can bid
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: COMPANY SENT BIDS */}
      {activeTab === "my-bids" && role === "company" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Your Outgoing Bids</h2>
              <p className="text-xs text-slate-500">
                Track candidate responses and unlocked identities in real time.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("browse")}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              + Place New Bid
            </button>
          </div>

          {myCompanyBids.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border-2 border-slate-900 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
                💎
              </div>
              <h3 className="text-lg font-black text-slate-900">No Upfront Bids Sent Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Explore the Anonymous Talent Arena and send upfront compensation offers to top verified engineers.
              </p>
              <button
                onClick={() => setActiveTab("browse")}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-wider"
              >
                Browse Anonymous Talent
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myCompanyBids.map((bid) => {
                const isAccepted = bid.status === "accepted";
                const isCountered = bid.status === "countered";
                const isPending = bid.status === "pending";

                return (
                  <div
                    key={bid.id}
                    className={`bg-white rounded-3xl border-2 border-slate-900 shadow-sm p-6 space-y-4 flex flex-col justify-between ${
                      isAccepted ? "ring-2 ring-emerald-500/30 bg-emerald-50/20" : ""
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-black text-slate-900 text-base">
                            Role: {bid.jobTitle}
                          </h3>
                          <p className="text-xs text-slate-500 font-bold">
                            Offered: {bid.salaryOffer} · {bid.workMode}
                          </p>
                        </div>
                        <div>
                          {isAccepted && (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-black">
                              🎉 Accepted & Identity Unlocked
                            </span>
                          )}
                          {isPending && (
                            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-full text-xs font-bold">
                              ⏳ {calculateTimeRemaining(bid.expiresAt)}
                            </span>
                          )}
                          {isCountered && (
                            <span className="px-3 py-1 bg-sky-100 text-sky-800 border border-sky-300 rounded-full text-xs font-black">
                              💬 Counter Received
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Revealed Identity Card */}
                      {isAccepted && bid.candidateRevealedName && (
                        <div className="p-4 rounded-2xl bg-white border-2 border-emerald-500 space-y-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={bid.candidateRevealedPhoto}
                              alt={bid.candidateRevealedName}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <strong className="text-sm font-black text-slate-900 block">
                                {bid.candidateRevealedName}
                              </strong>
                              <span className="text-xs text-slate-500 font-medium">
                                {bid.candidateRevealedEmail} · {bid.candidateRevealedPhone}
                              </span>
                            </div>
                          </div>
                          <div className="pt-2 flex items-center justify-end">
                            <button
                              onClick={() => setActiveView("company-pipeline")}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <span>Open in Pipeline</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Counter proposal & Recruiter Reply Actions */}
                      {isCountered && bid.counterOfferDetails && (
                        <div className="p-4 bg-sky-50 border-2 border-sky-200 rounded-2xl text-xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-sky-900 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                              <span>Candidate Proposed Counter-Offer</span>
                            </span>
                            <span className="text-[10px] text-sky-700 font-bold">
                              {new Date(bid.counterOfferDetails.counteredAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between font-black text-slate-900 text-sm bg-white p-2.5 rounded-xl border border-sky-100">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-normal">Candidate Expectation:</span>
                              <span>{bid.counterOfferDetails.proposedSalary}</span>
                            </div>
                            <span className="px-2.5 py-1 bg-sky-100 text-sky-800 rounded-lg text-xs font-bold">
                              {bid.counterOfferDetails.proposedWorkMode}
                            </span>
                          </div>
                          {bid.counterOfferDetails.note && (
                            <p className="italic text-slate-600 text-xs leading-relaxed">
                              "{bid.counterOfferDetails.note}"
                            </p>
                          )}

                          {/* Company previous reply if any */}
                          {bid.companyCounterDetails && (
                            <div className="p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 space-y-1">
                              <div className="flex items-center justify-between font-black text-[10px] text-emerald-800 uppercase">
                                <span>Your Reply Sent</span>
                                <span>{new Date(bid.companyCounterDetails.repliedAt).toLocaleDateString()}</span>
                              </div>
                              <div>Revised Offer: <strong>{bid.companyCounterDetails.revisedSalary}</strong> ({bid.companyCounterDetails.revisedWorkMode})</div>
                              {bid.companyCounterDetails.note && (
                                <p className="italic text-slate-600">"{bid.companyCounterDetails.note}"</p>
                              )}
                            </div>
                          )}

                          {/* Recruiter Action Buttons to Reply or Accept */}
                          <div className="pt-2 border-t border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => companyRespondToCounterOffer(bid.id, "decline")}
                              className="w-full sm:w-auto px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold text-xs transition-colors cursor-pointer text-center"
                            >
                              Decline
                            </button>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <button
                                type="button"
                                onClick={() => setSelectedBidForCompanyReply(bid)}
                                className="flex-1 sm:flex-initial px-3.5 py-2 bg-white border border-sky-300 hover:bg-sky-100 text-sky-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Reply / Revise</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => companyRespondToCounterOffer(bid.id, "accept")}
                                className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Accept Counter</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Simulator tester button for pending outgoing bids */}
                      {isPending && (
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-bold">Awaiting candidate action</span>
                          <button
                            type="button"
                            onClick={() => simulateCandidateCounterOffer(bid.id)}
                            title="Test the recruiter reply flow by simulating a candidate counter"
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1 shadow-xs"
                          >
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>Simulate Candidate Counter</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedTalentForBid && (
        <SubmitBidModal
          talent={selectedTalentForBid}
          onClose={() => setSelectedTalentForBid(null)}
        />
      )}

      {selectedBidForCounter && (
        <CounterBidModal
          bid={selectedBidForCounter}
          onClose={() => setSelectedBidForCounter(null)}
          onConfirm={(counterData) =>
            respondToTalentBid(selectedBidForCounter.id, "counter", counterData)
          }
        />
      )}

      {selectedBidForCompanyReply && (
        <CompanyReplyCounterModal
          bid={selectedBidForCompanyReply}
          onClose={() => setSelectedBidForCompanyReply(null)}
          onConfirm={(replyData) =>
            companyRespondToCounterOffer(selectedBidForCompanyReply.id, "counter", replyData)
          }
        />
      )}
    </div>
  );
};
