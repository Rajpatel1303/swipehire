import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  Lock,
  Scale,
  Activity,
  X,
  Target,
  EyeOff,
  Briefcase,
  Heart,
  ShieldCheck,
  User,
  Building2,
  Columns3,
  GitCompare,
  MessageSquare,
  FileText,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

type PolicyModalType = "privacy" | "terms" | "ethics" | "status" | null;

export const Footer: React.FC = () => {
  const {
    activeView,
    setActiveView,
    role,
    authStatus,
    setIsAddJobModalOpen,
    openAddJobModal,
  } = useApp();

  const [activeModal, setActiveModal] = useState<PolicyModalType>(null);

  const isCompany =
    role === "company" ||
    authStatus === "AUTHENTICATED_COMPANY" ||
    (typeof activeView === "string" && activeView.startsWith("company-"));

  const isCandidate =
    !isCompany &&
    (role === "candidate" ||
      authStatus === "AUTHENTICATED_CANDIDATE" ||
      (typeof activeView === "string" && activeView.startsWith("candidate-")));

  const handleNav = (view: string) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenPostJob = () => {
    if (isCompany) {
      if (openAddJobModal) {
        openAddJobModal();
      } else {
        setIsAddJobModalOpen(true);
      }
    } else {
      handleNav("company-login");
    }
  };

  return (
    <footer className="no-print print:hidden border-t border-slate-200/60 bg-linear-to-b from-white/80 via-slate-50/90 to-amber-50/20 text-slate-800 font-sans backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-7">
        {/* Compact Single-Row Hero & Navigation */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Brand Identity Tailored to Role */}
          <div
            className="flex items-center gap-2.5 group cursor-pointer"
            onClick={() => {
              if (isCompany) {
                handleNav("company-cockpit");
              } else if (isCandidate) {
                handleNav("candidate-radar");
              } else {
                handleNav("landing");
              }
            }}
          >
            <div
              className={`relative flex items-center justify-center w-8 h-8 rounded-xl text-white shadow-xs group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 ${
                isCompany
                  ? "bg-linear-to-tr from-sky-600 to-indigo-500 shadow-sky-500/25"
                  : "bg-linear-to-tr from-orange-500 to-amber-400 shadow-orange-500/25"
              }`}
            >
              <span className="font-black text-sm">S</span>
              <Sparkles className="w-2.5 h-2.5 absolute -top-1 -right-1 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-slate-900 leading-tight">
                  Swipe<span className={isCompany ? "text-sky-600" : "text-orange-500"}>Hired</span>
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider rounded-full border ${
                    isCompany
                      ? "bg-sky-100 text-sky-700 border-sky-200"
                      : "bg-orange-100 text-orange-700 border-orange-200"
                  }`}
                >
                  {isCompany ? "Company Cockpit 🏢" : isCandidate ? "Career Radar ✨" : "Radar AI ✨"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {isCompany
                  ? "Pre-vetted engineering talent • 24h fast-track SLA"
                  : isCandidate
                  ? "Direct founder offers • 100% in-browser privacy"
                  : "Direct company-to-talent platform • Upfront compensation"}
              </p>
            </div>
          </div>

          {/* Strict Role-Based Feature Pills (No manual toggle) */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {isCompany ? (
              /* ONLY Company Buttons */
              <>
                <button
                  type="button"
                  onClick={handleOpenPostJob}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-sky-200" />
                  <span>Post a Role</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav("company-pipeline")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 border border-slate-200/80 hover:border-sky-300 text-xs font-bold text-slate-700 hover:text-sky-600 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  <Columns3 className="w-3.5 h-3.5 text-sky-500" />
                  <span>Pipeline Kanban</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav("company-compare")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-300 text-xs font-bold text-slate-700 hover:text-indigo-600 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  <GitCompare className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Compare Matrix</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav("company-email-connect")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 text-xs font-bold text-slate-700 hover:text-emerald-600 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Direct Outreach</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav("blind-marketplace")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 border border-slate-200/80 hover:border-amber-300 text-xs font-bold text-slate-700 hover:text-amber-600 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                  <span>Talent Bidding</span>
                </button>
              </>
            ) : isCandidate ? (
              /* ONLY Candidate Buttons */
              <>
                <button
                  type="button"
                  onClick={() => handleNav("candidate-radar")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-orange-50 border border-slate-200/80 hover:border-orange-300 text-xs font-bold text-slate-700 hover:text-orange-600 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5 text-orange-500" />
                  <span>Career Radar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav("candidate-jobs")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 border border-slate-200/80 hover:border-sky-300 text-xs font-bold text-slate-700 hover:text-sky-600 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5 text-sky-500" />
                  <span>Live Roles</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav("blind-marketplace")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 border border-slate-200/80 hover:border-amber-300 text-xs font-bold text-slate-700 hover:text-amber-600 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                  <span>Blind Bids</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav("candidate-applications")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 text-xs font-bold text-slate-700 hover:text-emerald-600 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span>My Applications</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav("candidate-profile")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-violet-50 border border-slate-200/80 hover:border-violet-300 text-xs font-bold text-slate-700 hover:text-violet-600 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-violet-500" />
                  <span>Profile</span>
                </button>
              </>
            ) : (
              /* Public / Landing Buttons */
              <>
                <button
                  type="button"
                  onClick={() => handleNav("candidate-login")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-orange-50 border border-slate-200/80 hover:border-orange-300 text-xs font-bold text-slate-700 hover:text-orange-600 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-orange-500" />
                  <span>Candidate Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav("company-login")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 border border-slate-200/80 hover:border-sky-300 text-xs font-bold text-slate-700 hover:text-sky-600 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-sky-500" />
                  <span>Company Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav("auth-select")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>Get Started</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Cute Bottom Micro-Bar */}
        <div className="mt-4 pt-3.5 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500 animate-pulse" />
            <span>
              {isCompany
                ? "for forward-thinking teams • 24h Fast-Track SLA"
                : isCandidate
                ? "for top 1% talent • 100% In-Browser Privacy"
                : "by SwipeHired • © 2026"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveModal("status")}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-600 transition-colors font-bold cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All Systems Green</span>
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="hover:text-slate-700 transition-colors font-semibold cursor-pointer"
            >
              Privacy
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => setActiveModal("terms")}
              className="hover:text-slate-700 transition-colors font-semibold cursor-pointer"
            >
              Terms
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => setActiveModal("ethics")}
              className="hover:text-slate-700 transition-colors font-semibold cursor-pointer"
            >
              AI Ethics
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Policy Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                {activeModal === "privacy" && <Lock className="w-4 h-4 text-emerald-600" />}
                {activeModal === "terms" && <Scale className="w-4 h-4 text-sky-600" />}
                {activeModal === "ethics" && <Sparkles className="w-4 h-4 text-orange-500" />}
                {activeModal === "status" && <Activity className="w-4 h-4 text-emerald-600" />}
                <h3 className="text-sm font-black text-slate-900">
                  {activeModal === "privacy" && "In-Browser Privacy Guarantee"}
                  {activeModal === "terms" && "Direct Placement Terms"}
                  {activeModal === "ethics" && "AI Ethical Standards"}
                  {activeModal === "status" && "System Infrastructure Status"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto space-y-3.5 text-xs text-slate-600 leading-relaxed">
              {activeModal === "privacy" && (
                <>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="font-semibold">
                      Your resume is parsed locally in browser memory using WebAssembly &amp; PDF.js. Zero raw resume data is sold or stored without your application swipe.
                    </p>
                  </div>
                  <p>
                    On the Blind Talent Marketplace, your identity stays completely anonymous until you choose to accept a company’s binding offer.
                  </p>
                </>
              )}

              {activeModal === "terms" && (
                <>
                  <p className="font-semibold text-slate-800">
                    Transparent 10% milestone success fee upon verified candidate placement.
                  </p>
                  <p>
                    All opportunities must list realistic salary brackets. Participating hiring teams commit to 24-hour review turnarounds to eliminate candidate ghosting.
                  </p>
                </>
              )}

              {activeModal === "ethics" && (
                <>
                  <p className="font-semibold text-slate-800">
                    Explainable AI matching powered by Google Gemini 2.5 vectors.
                  </p>
                  <p>
                    Scoring analyzes technical skills and verified project scope with zero demographic or visual weighting. Candidates retain full autonomy to tweak AI-parsed skills.
                  </p>
                </>
              )}

              {activeModal === "status" && (
                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <span className="font-bold text-slate-800">Cloudflare Edge &amp; SPA</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Operational</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <span className="font-bold text-slate-800">Supabase DB &amp; Realtime</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Connected</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <span className="font-bold text-slate-800">Google Gemini AI Engine</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Available</span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

