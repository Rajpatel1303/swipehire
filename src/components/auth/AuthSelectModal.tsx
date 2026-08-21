import React, { useState } from "react";
import { User, Building2, ArrowRight, Sparkles, CheckCircle2, LogIn, UserPlus } from "lucide-react";
import { useApp } from "../../context/AppContext";

export const AuthSelectModal: React.FC = () => {
  const { setActiveView } = useApp();
  const [authIntent, setAuthIntent] = useState<"signup" | "login">("signup");

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-[32px] shadow-2xl border-2 border-slate-900 p-6 sm:p-10 space-y-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Toggle Intent Pill */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-slate-100 rounded-full border border-slate-200 shadow-inner">
            <button
              onClick={() => setAuthIntent("signup")}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                authIntent === "signup"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
            <button
              onClick={() => setAuthIntent("login")}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                authIntent === "login"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-[10px] font-black uppercase tracking-widest border border-orange-200">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Select Account Role</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
            {authIntent === "signup" ? "How do you want to join?" : "How do you want to log in?"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto font-medium">
            {authIntent === "signup"
              ? "Select your profile type to unlock tailored AI Career Radar & Cockpit matching."
              : "Choose your workspace role to sign in to your active dashboard."}
          </p>
        </div>

        {/* 2 High Impact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Candidate Option */}
          <button
            id="auth-select-candidate-btn"
            onClick={() => {
              if (authIntent === "signup") {
                setActiveView("candidate-signup");
              } else {
                setActiveView("candidate-login");
              }
            }}
            className="group relative p-6 text-left rounded-3xl border-2 border-emerald-500 hover:border-emerald-600 bg-emerald-50/40 hover:bg-emerald-50/80 transition-all transform hover:-translate-y-1.5 shadow-lg shadow-emerald-500/5 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-xs">
                  👤
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-200/70 text-emerald-900">
                  Job Seeker
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-emerald-700 transition-colors">
                  {authIntent === "signup" ? "Sign Up as Candidate" : "Log In as Candidate"}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                  {authIntent === "signup"
                    ? "Upload your resume, build your AI radar, and discover dream tech jobs."
                    : "Access your Career Radar, track applications, and view interview invites."}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-emerald-200/60">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>✦ AI Resume Extraction & Radar</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Interactive 90%+ Match Swiping</span>
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between text-xs font-black uppercase tracking-wider text-emerald-700 group-hover:text-emerald-800">
              <span>{authIntent === "signup" ? "Continue to Sign Up" : "Continue to Log In"}</span>
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </button>

          {/* Company Option */}
          <button
            id="auth-select-company-btn"
            onClick={() => {
              if (authIntent === "signup") {
                setActiveView("company-signup");
              } else {
                setActiveView("company-login");
              }
            }}
            className="group relative p-6 text-left rounded-3xl border-2 border-sky-500 hover:border-sky-600 bg-sky-50/40 hover:bg-sky-50/80 transition-all transform hover:-translate-y-1.5 shadow-lg shadow-sky-500/5 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-xs">
                  🏢
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-sky-200/70 text-sky-900">
                  Employer
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-sky-700 transition-colors">
                  {authIntent === "signup" ? "Sign Up as Company" : "Log In as Company"}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                  {authIntent === "signup"
                    ? "Create job specs with ✦ AI, discover top ranked talent, and close hires fast."
                    : "Access your Recruiter Cockpit, manage pipeline stages, and message candidates."}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-sky-200/60">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>✦ AI Job Builder & Match Scoring</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>72-Hour Guaranteed Review Pipeline</span>
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between text-xs font-black uppercase tracking-wider text-sky-700 group-hover:text-sky-800">
              <span>{authIntent === "signup" ? "Continue to Sign Up" : "Continue to Log In"}</span>
              <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </button>
        </div>

        {/* Footer info & toggle */}
        <div className="pt-3 text-center border-t border-slate-100 space-y-3">
          <p className="text-xs text-slate-500 font-medium">
            {authIntent === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setAuthIntent("login")}
                  className="font-black uppercase tracking-wider text-orange-600 hover:text-orange-700 cursor-pointer ml-1"
                >
                  Log In instead
                </button>
              </>
            ) : (
              <>
                Don't have an account yet?{" "}
                <button
                  onClick={() => setAuthIntent("signup")}
                  className="font-black uppercase tracking-wider text-orange-600 hover:text-orange-700 cursor-pointer ml-1"
                >
                  Create one now
                </button>
              </>
            )}
          </p>

          <div>
            <button
              id="auth-select-back-btn"
              onClick={() => setActiveView("landing")}
              className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              ← Back to Landing Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
