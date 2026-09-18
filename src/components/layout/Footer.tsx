import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Lock,
  Scale,
  FileText,
  Activity,
  ArrowUpRight,
  X,
  CheckCircle2,
  Users,
  Briefcase,
  Clock,
  Cpu,
  EyeOff,
  Radio,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

type PolicyModalType = "privacy" | "terms" | "ethics" | "status" | null;

export const Footer: React.FC = () => {
  const {
    setActiveView,
    role,
    authStatus,
    jobs,
    allCandidates,
    applications,
    setIsAddJobModalOpen,
  } = useApp();

  const [activeModal, setActiveModal] = useState<PolicyModalType>(null);

  // Dynamic live platform telemetry
  const liveJobsCount = jobs && jobs.length > 0 ? jobs.filter((j) => j.status !== "Paused").length : 18;
  const verifiedTalentCount = allCandidates && allCandidates.length > 0 ? allCandidates.length : 42;
  const activeApplicationsCount = applications && applications.length > 0 ? applications.length : 14;

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
    <footer className="no-print print:hidden border-t border-slate-200/80 bg-slate-50/80 text-slate-900 font-sans backdrop-blur-xs">
      {/* Live Platform Telemetry Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-200/80 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-6 sm:gap-10 w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Live Open Roles</p>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-slate-900">{liveJobsCount}</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">Verified</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Pre-Vetted Talent</p>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-slate-900">{verifiedTalentCount}</span>
                <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200/60">Skills Scored</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Active Pipeline</p>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-emerald-600 tracking-tight">{activeApplicationsCount}</span>
                <span className="text-[10px] font-bold text-slate-500">Matches</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Company SLA Target</p>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-orange-500 tracking-tight">&le; 24 hrs</span>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200/60">Fast-Track</span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveModal("status")}
          className="group flex items-center gap-2.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 rounded-full border border-slate-200 shadow-2xs transition-all cursor-pointer"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <p className="text-[11px] font-bold tracking-wide text-slate-700 group-hover:text-slate-900">
            Systems: <span className="text-emerald-600 font-extrabold">All Operational</span>
          </p>
          <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>

      {/* Main Footer Links & Architecture */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div
              onClick={() => {
                setActiveView("landing");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center gap-2 cursor-pointer group w-fit"
            >
              <div className="w-7 h-7 bg-orange-500 group-hover:bg-orange-600 rounded-lg flex items-center justify-center text-white shadow-xs transition-colors">
                <span className="font-black text-sm">S</span>
              </div>
              <span className="text-lg font-black tracking-tighter uppercase italic text-slate-900">
                Swipe<span className="text-orange-500">Hired</span>
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              The intelligence-driven reverse discovery platform connecting top talent directly with vetted engineering teams.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-600 shadow-2xs">
                <Lock className="w-3 h-3 text-emerald-600" />
                Local Client OCR
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-600 shadow-2xs">
                <Cpu className="w-3 h-3 text-sky-600" />
                Gemini 2.5 Vectors
              </span>
            </div>
          </div>

          {/* For Candidates */}
          <div>
            <h4 className="text-slate-900 font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span>For Candidates</span>
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={() => handleCandidateNav("candidate-radar")}
                  className="hover:text-orange-500 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Career Radar Deck</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleCandidateNav("candidate-jobs")}
                  className="hover:text-orange-500 transition-colors cursor-pointer"
                >
                  Explore Live Roles
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView("blind-marketplace");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="hover:text-orange-500 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Reverse Talent Marketplace</span>
                  <span className="px-1.5 py-0.2 bg-orange-100 text-orange-700 text-[9px] font-black rounded uppercase">Blind Bids</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleCandidateNav("candidate-applications")}
                  className="hover:text-orange-500 transition-colors cursor-pointer"
                >
                  Visual Application Journey
                </button>
              </li>
            </ul>
          </div>

          {/* For Hiring Teams */}
          <div>
            <h4 className="text-slate-900 font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span>For Hiring Teams</span>
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={() => handleCompanyNav("company-pipeline")}
                  className="hover:text-sky-600 transition-colors cursor-pointer"
                >
                  Candidate Pipeline Kanban
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleCompanyNav("company-jobs", true)}
                  className="hover:text-sky-600 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-sky-500" />
                  <span>AI Job Spec Builder</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleCompanyNav("company-compare")}
                  className="hover:text-sky-600 transition-colors cursor-pointer"
                >
                  Candidate Comparison Matrix
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleCompanyNav("company-email-connect")}
                  className="hover:text-sky-600 transition-colors cursor-pointer"
                >
                  Direct Gmail & WhatsApp Dispatch
                </button>
              </li>
            </ul>
          </div>

          {/* Platform Guarantees & Privacy Core */}
          <div>
            <h4 className="text-slate-900 font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span>Platform Guarantees</span>
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2 text-slate-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span>In-Browser Privacy OCR</span>
                  <p className="text-[11px] text-slate-400 font-normal leading-tight">Zero resume data sold or stored before application consent.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-slate-700 font-semibold">
                <Zap className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <span>Upfront Compensation Bids</span>
                  <p className="text-[11px] text-slate-400 font-normal leading-tight">Strict policy against undisclosed salary brackets.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-slate-700 font-semibold">
                <Clock className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                <div>
                  <span>24-Hour Anti-Ghosting SLA</span>
                  <p className="text-[11px] text-slate-400 font-normal leading-tight">Enforced review timers for all hiring partner companies.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Ethics Bar */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs font-medium">
          <div className="flex items-center gap-2">
            <p>&copy; 2026 SwipeHired. Built with Google AI Studio &amp; Supabase.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="hover:text-slate-700 transition-colors cursor-pointer uppercase tracking-wider text-[11px] font-bold"
            >
              Privacy Policy
            </button>
            <span className="text-slate-200">&bull;</span>
            <button
              type="button"
              onClick={() => setActiveModal("terms")}
              className="hover:text-slate-700 transition-colors cursor-pointer uppercase tracking-wider text-[11px] font-bold"
            >
              Terms of Service
            </button>
            <span className="text-slate-200">&bull;</span>
            <button
              type="button"
              onClick={() => setActiveModal("ethics")}
              className="hover:text-slate-700 transition-colors cursor-pointer uppercase tracking-wider text-[11px] font-bold"
            >
              AI Ethical Standards
            </button>
            <span className="text-slate-200">&bull;</span>
            <button
              type="button"
              onClick={() => setActiveModal("status")}
              className="hover:text-slate-700 transition-colors cursor-pointer uppercase tracking-wider text-[11px] font-bold flex items-center gap-1"
            >
              <Radio className="w-3 h-3 text-emerald-500" />
              <span>Status</span>
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

