import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Lock,
  Scale,
  Activity,
  ArrowUpRight,
  X,
  Radio,
  Target,
  EyeOff,
  Briefcase,
  ChevronRight,
  Shield,
  Layers,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

type PolicyModalType = "privacy" | "terms" | "ethics" | "status" | null;

export const Footer: React.FC = () => {
  const {
    setActiveView,
    role,
    authStatus,
    setIsAddJobModalOpen,
  } = useApp();

  const [activeModal, setActiveModal] = useState<PolicyModalType>(null);

  const handleCandidateNav = (view: string) => {
    if (authStatus === "authenticated" && role === "candidate") {
      setActiveView(view);
    } else if (authStatus === "authenticated") {
      setActiveView(view);
    } else {
      setActiveView("candidate-login");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCompanyNav = (view: string, openPostJob?: boolean) => {
    if (openPostJob) {
      if (authStatus === "authenticated" && role === "company") {
        setIsAddJobModalOpen(true);
      } else {
        setActiveView("company-login");
      }
      return;
    }

    if (authStatus === "authenticated" && role === "company") {
      setActiveView(view);
    } else if (authStatus === "authenticated") {
      setActiveView(view);
    } else {
      setActiveView("company-login");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="no-print print:hidden relative overflow-hidden border-t border-slate-200/80 bg-linear-to-b from-white via-slate-50/80 to-slate-100/90 text-slate-900 font-sans">
      {/* Ambient Animated Glow Background */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-10000"></div>
      <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-7000"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        {/* Animated Brand & Core Mission Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-14">
          {/* Pulsing Radar Icon */}
          <div className="relative mb-6 flex items-center justify-center">
            <span className="absolute -inset-3 rounded-full bg-orange-500/20 animate-ping opacity-60"></span>
            <span className="absolute -inset-1.5 rounded-full border border-orange-500/30 animate-pulse"></span>
            <div className="relative w-14 h-14 rounded-2xl bg-linear-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <Radio className="w-7 h-7 animate-pulse" />
            </div>
          </div>

          {/* Shimmering Logo */}
          <div
            onClick={() => {
              setActiveView("landing");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="cursor-pointer group flex items-center gap-2.5 mb-3"
          >
            <span className="text-3xl sm:text-4xl font-black tracking-tighter uppercase italic text-slate-900">
              Swipe<span className="text-orange-500 group-hover:text-orange-600 transition-colors">Hired</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-orange-100 text-orange-700 border border-orange-200">
              Radar v2.4
            </span>
          </div>

          {/* SwipeHired Value Proposition */}
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl">
            The intelligence-driven discovery platform where top talent and forward-thinking companies connect directly with binding upfront compensation, 100% in-browser privacy, and zero recruiter spam.
          </p>

          {/* Quick Action Floating Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mt-7">
            <button
              type="button"
              onClick={() => handleCandidateNav("candidate-radar")}
              className="group relative px-6 py-2.5 rounded-full bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
            >
              <Zap className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span>Launch Career Radar</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => handleCompanyNav("company-jobs", true)}
              className="group px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-black shadow-2xs hover:shadow-xs transition-all duration-300 hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-sky-600 group-hover:rotate-12 transition-transform" />
              <span>Post a Role with AI Spec Builder</span>
            </button>
          </div>
        </div>

        {/* 3 Animated Feature & Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {/* Card 1: Career Radar */}
          <div
            onClick={() => handleCandidateNav("candidate-radar")}
            className="group relative p-6 bg-white/90 hover:bg-white rounded-3xl border border-slate-200/80 hover:border-orange-300 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-1.5 flex items-center gap-1.5">
                <span>Intelligent Career Radar</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Swipe through high-precision roles scored by Google Gemini 2.5 vectors. Transparent matched skills, salary brackets, and constructive gap feedback.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] font-bold text-orange-600">
              <span>Dual-Directional Swipe Matching</span>
            </div>
          </div>

          {/* Card 2: Reverse Marketplace */}
          <div
            onClick={() => {
              setActiveView("blind-marketplace");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="group relative p-6 bg-white/90 hover:bg-white rounded-3xl border border-slate-200/80 hover:border-sky-300 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200/60 flex items-center justify-center text-sky-600 mb-4 group-hover:scale-110 transition-transform">
                <EyeOff className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-1.5 flex items-center gap-1.5">
                <span>Blind Reverse Marketplace</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Flip the script. Stay completely anonymous while companies submit binding upfront compensation bids to connect with you.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] font-bold text-sky-600">
              <span>Binding Upfront Compensation</span>
            </div>
          </div>

          {/* Card 3: In-Browser Privacy */}
          <div
            onClick={() => setActiveModal("privacy")}
            className="group relative p-6 bg-white/90 hover:bg-white rounded-3xl border border-slate-200/80 hover:border-emerald-300 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-1.5 flex items-center gap-1.5">
                <span>In-Browser Privacy Shield</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Zero resume scraping or selling. Your CV is parsed locally inside your browser memory via WebAssembly and PDF.js before any transmission.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] font-bold text-emerald-600">
              <span>Client-Side Document Sandbox</span>
            </div>
          </div>
        </div>

        {/* Minimal Bottom Bar */}
        <div className="pt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-3">
            <p>&copy; 2026 SwipeHired. Built with Google AI Studio &amp; Supabase.</p>
          </div>

          {/* System Indicator & Legal Modals */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <button
              type="button"
              onClick={() => setActiveModal("status")}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 rounded-full border border-slate-200 text-slate-700 font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Systems Live</span>
            </button>

            <span className="text-slate-300">&bull;</span>

            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="hover:text-slate-900 transition-colors cursor-pointer font-bold"
            >
              Privacy Policy
            </button>

            <span className="text-slate-300">&bull;</span>

            <button
              type="button"
              onClick={() => setActiveModal("terms")}
              className="hover:text-slate-900 transition-colors cursor-pointer font-bold"
            >
              Terms of Service
            </button>

            <span className="text-slate-300">&bull;</span>

            <button
              type="button"
              onClick={() => setActiveModal("ethics")}
              className="hover:text-slate-900 transition-colors cursor-pointer font-bold"
            >
              AI Ethical Standards
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Policy & Architecture Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                {activeModal === "privacy" && <Lock className="w-5 h-5 text-emerald-600" />}
                {activeModal === "terms" && <Scale className="w-5 h-5 text-sky-600" />}
                {activeModal === "ethics" && <Sparkles className="w-5 h-5 text-orange-500" />}
                {activeModal === "status" && <Activity className="w-5 h-5 text-emerald-600" />}
                <h3 className="text-base font-black text-slate-900">
                  {activeModal === "privacy" && "In-Browser Privacy Architecture & Policy"}
                  {activeModal === "terms" && "Direct Placement & Reverse Marketplace Terms"}
                  {activeModal === "ethics" && "AI Ethical Standards & Transparency"}
                  {activeModal === "status" && "SwipeHired Live Infrastructure Status"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
              {activeModal === "privacy" && (
                <>
                  <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-emerald-950 flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Client-Side First Guarantee</strong>
                      Resumes are extracted entirely in your browser memory via WebAssembly and PDF.js. Your raw resume document is never transmitted to an AI vendor or stored on third-party servers without your explicit swipe application.
                    </div>
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">1. Data Minimization &amp; Anonymity</h4>
                  <p>
                    On the Blind Talent Marketplace, your name, contact details, email, and social profiles remain cryptographically masked. Hiring companies can only see your verified technical skill vectors, portfolio achievements, and compensation expectations.
                  </p>
                  <h4 className="font-black text-slate-900 text-sm">2. Zero Data Brokering</h4>
                  <p>
                    SwipeHired does not sell, lease, or monetize candidate data with recruiters, headhunters, or advertisement networks. Our revenue comes strictly from verified company placement milestone commissions.
                  </p>
                  <h4 className="font-black text-slate-900 text-sm">3. Instant Purge &amp; Right to Be Forgotten</h4>
                  <p>
                    You retain total autonomy over your data. Deleting your candidate profile permanently purges your vector embeddings, parsed history, and contact metadata immediately.
                  </p>
                </>
              )}

              {activeModal === "terms" && (
                <>
                  <div className="p-3.5 bg-sky-50/80 border border-sky-200/80 rounded-2xl text-sky-950 flex items-start gap-2.5">
                    <Scale className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">10% Milestone Success Protocol</strong>
                      SwipeHired operates under a direct company-to-candidate protocol with a fair 10% milestone placement fee payable strictly after successful candidate onboarding.
                    </div>
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">1. Upfront Salary Transparency</h4>
                  <p>
                    Every opportunity posted on SwipeHired must include realistic compensation brackets. Blanket "competitive" salaries or undisclosed pay bands are flagged and prohibited on the platform.
                  </p>
                  <h4 className="font-black text-slate-900 text-sm">2. 24-Hour SLA Commitment</h4>
                  <p>
                    Participating hiring teams agree to process candidate applications within 24 business hours. If an application cannot proceed, constructive skill-gap feedback is delivered to the applicant.
                  </p>
                  <h4 className="font-black text-slate-900 text-sm">3. Direct Hiring Relationship</h4>
                  <p>
                    No recruiter middlemen. Communications sent via SwipeHired route directly to the hiring manager’s or founder’s official email or verified WhatsApp channel.
                  </p>
                </>
              )}

              {activeModal === "ethics" && (
                <>
                  <div className="p-3.5 bg-orange-50/80 border border-orange-200/80 rounded-2xl text-orange-950 flex items-start gap-2.5">
                    <Sparkles className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Explainable AI Match Scoring</strong>
                      Every match percentage is accompanied by transparent positive drivers and missing skill indicators. Candidates always know why an opportunity was recommended.
                    </div>
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">1. Demographic &amp; Visual Neutrality</h4>
                  <p>
                    Matching algorithms analyze technical proficiencies, project outcomes, and functional scope. Age, gender, physical appearance, and socioeconomic markers are strictly excluded from AI scoring vectors.
                  </p>
                  <h4 className="font-black text-slate-900 text-sm">2. Candidate Overrides &amp; Control</h4>
                  <p>
                    Candidates can manually edit or refine any skill, project, or role suggestion generated by Google Gemini AI before their profile is indexed.
                  </p>
                  <h4 className="font-black text-slate-900 text-sm">3. Ethical Reverse Bidding</h4>
                  <p>
                    Reverse marketplace offers require companies to propose binding starting ranges, preventing asymmetric negotiations and wage suppression.
                  </p>
                </>
              )}

              {activeModal === "status" && (
                <>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <div>
                          <p className="font-bold text-slate-800">Cloudflare Edge Worker &amp; SPA</p>
                          <p className="text-[11px] text-slate-400">Global routing &amp; sub-second delivery</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Operational</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <div>
                          <p className="font-bold text-slate-800">Supabase PostgreSQL &amp; Realtime</p>
                          <p className="text-[11px] text-slate-400">Encrypted data store &amp; live bid channels</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Connected</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <div>
                          <p className="font-bold text-slate-800">Google Gemini AI Engine</p>
                          <p className="text-[11px] text-slate-400">Skills extraction &amp; radar matching vectors</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Available</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <div>
                          <p className="font-bold text-slate-800">Client-Side Web Workers OCR</p>
                          <p className="text-[11px] text-slate-400">In-browser PDF/DOCX privacy parsing</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

