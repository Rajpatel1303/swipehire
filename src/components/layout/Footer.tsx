import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  CheckCircle2,
  Cpu,
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

  // Close modal on Escape and prevent body scrolling while modal is open
  useEffect(() => {
    if (!activeModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModal(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [activeModal]);

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

      {/* Interactive Policy Modal - Rendered via Portal to document.body for true viewport centering */}
      {activeModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setActiveModal(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-auto animate-in zoom-in-95 duration-200 text-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                      activeModal === "privacy"
                        ? "bg-emerald-100 text-emerald-600"
                        : activeModal === "terms"
                        ? "bg-sky-100 text-sky-600"
                        : activeModal === "ethics"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    {activeModal === "privacy" && <ShieldCheck className="w-5 h-5" />}
                    {activeModal === "terms" && <Scale className="w-5 h-5" />}
                    {activeModal === "ethics" && <Sparkles className="w-5 h-5" />}
                    {activeModal === "status" && <Activity className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight leading-tight">
                      {activeModal === "privacy" && "In-Browser Privacy Guarantee"}
                      {activeModal === "terms" && "Direct Placement Terms"}
                      {activeModal === "ethics" && "AI Ethical Standards"}
                      {activeModal === "status" && "System Infrastructure Status"}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      {activeModal === "privacy" && "Zero-Knowledge Local Parsing • WebAssembly Engine"}
                      {activeModal === "terms" && "Transparent Compensation • 24h Review Turnaround"}
                      {activeModal === "ethics" && "Merit-Based Gemini 2.5 • Zero Demographic Bias"}
                      {activeModal === "status" && "Real-Time Telemetry & SLA Health"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-5 overflow-y-auto max-h-[70vh] space-y-3.5 text-xs text-slate-600 leading-relaxed">
                {activeModal === "privacy" && (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0 mt-0.5">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-950">Local WebAssembly &amp; PDF.js Parsing</h4>
                        <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                          Your resume is parsed 100% locally in your browser memory. No raw, unencrypted resume files are sold, scraped, or stored on external servers before you swipe.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-start gap-3">
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
                        <EyeOff className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Blind Talent Marketplace Anonymity</h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                          On reverse hiring auctions, your name, contact details, and employer stay strictly obscured until you explicitly accept a company’s upfront binding offer.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-start gap-3">
                      <div className="p-2 bg-violet-100 text-violet-700 rounded-xl shrink-0 mt-0.5">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Full Candidate Data Sovereignty</h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                          You retain complete ownership over your parsed skills and history. Export, modify, or permanently purge your account data with zero residual traces.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeModal === "terms" && (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-sky-50/80 border border-sky-200/80 rounded-2xl flex items-start gap-3">
                      <div className="p-2 bg-sky-100 text-sky-700 rounded-xl shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-sky-950">Mandatory Upfront Compensation</h4>
                        <p className="text-[11px] text-sky-800 leading-relaxed mt-0.5">
                          All job listings and direct bids must publish realistic, verified salary and equity brackets. Deceptive or zero-salary postings are prohibited.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-start gap-3">
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">24-Hour Review Turnaround SLA</h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                          Participating hiring teams commit to a strict 24-hour response window on applications to eliminate recruiter ghosting and speed up hiring.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-start gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0 mt-0.5">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Milestone Success Fee (Companies)</h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                          Free to browse and interview. Companies pay a transparent 10% milestone success fee only upon successful verified hire, backed by a 90-day guarantee.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeModal === "ethics" && (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-3">
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-amber-950">Semantic Vector Matching (Google Gemini 2.5)</h4>
                        <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                          Candidate-to-role matching evaluates verified project scope, system architecture experience, and core engineering abilities using high-dimensional vector embeddings.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-start gap-3">
                      <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5">
                        <EyeOff className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Zero Demographic or Visual Weighting</h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                          The AI pipeline strictly strips age, gender, ethnicity, photo imagery, and pedigree bias before computing candidate fit scores.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-start gap-3">
                      <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Candidate Agency &amp; Skill Calibration</h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                          Candidates can view explainable match breakdown reasons and retain full control to edit, correct, or add skills parsed by the model.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeModal === "status" && (
                  <div className="space-y-2.5">
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Cloudflare Edge &amp; SPA</p>
                          <p className="text-[10px] text-slate-400">Global CDN • 100% Cache Hit Rate</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Operational
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Supabase Postgres &amp; Realtime</p>
                          <p className="text-[10px] text-slate-400">Database &amp; Instant WebSockets</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Connected
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Google Gemini AI Engine</p>
                          <p className="text-[10px] text-slate-400">Vector Embeddings &amp; Match Scoring</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Available
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">WebAssembly PDF Parser</p>
                          <p className="text-[10px] text-slate-400">Local Browser In-Memory Sandbox</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Active
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">
                  SwipeHired Trust &amp; Safety
                </span>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
                    activeModal === "privacy"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : activeModal === "terms"
                      ? "bg-sky-600 hover:bg-sky-700"
                      : activeModal === "ethics"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  Got It
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </footer>
  );
};

