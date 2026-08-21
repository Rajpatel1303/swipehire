import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Send,
  Inbox,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

interface CandidateAuthProps {
  initialMode?: "signup" | "login";
  isSignup?: boolean;
}

export const CandidateAuth: React.FC<CandidateAuthProps> = ({ initialMode, isSignup }) => {
  const {
    authUser,
    role,
    setActiveView,
    setRole,
    candidate,
    updateCandidate,
    authSignUp,
    authSignIn,
    resendConfirmationEmail,
    isSupabaseConnected,
  } = useApp();

  // Calculate default mode from either isSignup or initialMode
  const defaultMode = isSignup !== undefined ? (isSignup ? "signup" : "login") : (initialMode || "signup");
  const [mode, setMode] = useState<"signup" | "login">(defaultMode);

  useEffect(() => {
    if (isSignup !== undefined) {
      setMode(isSignup ? "signup" : "login");
    } else if (initialMode) {
      setMode(initialMode);
    }
  }, [isSignup, initialMode]);

  // If already authenticated as candidate, navigate to workspace
  useEffect(() => {
    if (authUser && role === "candidate") {
      setActiveView(candidate?.isCompleted ? "candidate-radar" : "candidate-onboarding");
    }
  }, [authUser, role, candidate?.isCompleted, setActiveView]);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Email confirmation states
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isLoginUnconfirmed, setIsLoginUnconfirmed] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { authSignInWithGoogle } = useApp();

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsGoogleLoading(true);
    try {
      const res = await authSignInWithGoogle("candidate");
      if (res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || "Failed to initiate Google sign-in.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoginUnconfirmed(false);

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Please provide your full name, email address, and a password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const signupEmail = email.trim();
      const res = await authSignUp({
        email: signupEmail,
        password,
        role: "candidate",
        fullName: fullName.trim(),
      });

      if (!res.success) {
        if (res.error?.toLowerCase().includes("rate limit")) {
          setError(
            "Supabase email limit reached (default free mailer allows 3-4 emails/hr). Please wait a few minutes before trying again or configure custom SMTP in your Supabase dashboard."
          );
        } else {
          setError(res.error || "Failed to create account. Please try again.");
        }
      } else {
        // Switch to login view immediately
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        setIsLoginUnconfirmed(true);
        setSuccessMsg(
          `✨ Account created! We have sent a confirmation email to ${signupEmail}. Please check your inbox and verify your email before logging in.`
        );
      }
    } catch (err: any) {
      if (err.message?.toLowerCase().includes("rate limit")) {
        setError(
          "Supabase email limit reached (default free mailer allows 3-4 emails/hr). Please wait a few minutes before trying again or configure custom SMTP in your Supabase dashboard."
        );
      } else {
        setError(err.message || "An unexpected error occurred during signup.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoginUnconfirmed(false);

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authSignIn({
        email: email.trim(),
        password,
        roleHint: "candidate",
      });

      if (!res.success) {
        if (res.isEmailNotConfirmed) {
          setIsLoginUnconfirmed(true);
          setError("Email not confirmed. Please check your inbox and verify your email before logging in.");
        } else {
          setError(res.error || "Invalid login credentials. Please check your email and password.");
        }
      } else {
        setSuccessMsg("Authenticated successfully! Loading your Career Radar...");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async (targetEmail: string) => {
    if (!targetEmail) return;
    setIsResending(true);
    setResendStatus(null);
    try {
      const res = await resendConfirmationEmail(targetEmail);
      if (res.success) {
        setResendStatus("Confirmation link has been resent! Please check your inbox.");
      } else {
        setResendStatus(`Failed to resend: ${res.error || "Please try again later."}`);
      }
    } catch {
      setResendStatus("Failed to resend confirmation email.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl border-2 border-slate-900 p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Role Identifier & Switcher */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Candidate Portal</span>
          </div>

          <button
            onClick={() => {
              if (mode === "signup") {
                setActiveView("company-signup");
              } else {
                setActiveView("company-login");
              }
            }}
            className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-sky-600 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Building2 className="w-3 h-3 text-sky-500" />
            <span>Are you hiring?</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl mx-auto shadow-xs">
            👤
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">
            {mode === "signup" ? "Candidate Sign Up" : "Candidate Login"}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {mode === "signup"
              ? "Create your account secured with Supabase Auth"
              : "Welcome back! Enter your verified Supabase credentials"}
          </p>

          <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md font-semibold">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Supabase Auth Protected</span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 text-red-700 text-xs flex flex-col gap-2 border border-red-200 font-semibold">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            {isLoginUnconfirmed && (
              <div className="mt-1 pt-2 border-t border-red-200/60 flex items-center justify-between">
                <span className="text-[11px] text-red-600">Need a new confirmation link?</span>
                <button
                  type="button"
                  disabled={isResending}
                  onClick={() => handleResendConfirmation(email)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all disabled:opacity-60"
                >
                  {isResending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  <span>Resend Email</span>
                </button>
              </div>
            )}
          </div>
        )}

        {resendStatus && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 border font-semibold ${
              resendStatus.includes("Failed")
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{resendStatus}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-900 text-xs flex flex-col gap-2 border border-emerald-300 font-semibold shadow-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
            {mode === "login" && email && (
              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                <span className="text-[11px] text-emerald-700">Didn't receive the email?</span>
                <button
                  type="button"
                  disabled={isResending}
                  onClick={() => handleResendConfirmation(email)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all disabled:opacity-60"
                >
                  {isResending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  <span>Resend Email</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          id="candidate-google-auth-btn"
          type="button"
          disabled={isLoading || isGoogleLoading}
          onClick={handleGoogleLogin}
          className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-slate-300 rounded-2xl font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-60"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span>{mode === "signup" ? "Sign up with Google" : "Continue with Google"}</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-1">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
            or continue with email
          </span>
          <div className="border-t border-slate-200 w-full"></div>
        </div>

            {/* Form */}
            <form onSubmit={mode === "signup" ? handleSignup : handleLogin} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="candidate-fullname-input"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Raj Patel"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="candidate-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700">Password</label>
                  {mode === "login" && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 cursor-pointer">
                      Min 6 characters
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="candidate-password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                    required
                  />
                </div>
              </div>

              {mode === "signup" && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="candidate-confirm-password-input"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                id="candidate-auth-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-md shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating with Supabase...</span>
                  </>
                ) : mode === "signup" ? (
                  <>
                    <span>Create Account (Supabase Auth)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Login with Supabase</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Toggle between Signup and Login */}
            <div className="text-center pt-2 border-t border-slate-100">
              {mode === "signup" ? (
                <p className="text-xs text-slate-500 font-medium">
                  Already have an account?{" "}
                  <button
                    id="candidate-toggle-to-login-btn"
                    onClick={() => {
                      setMode("login");
                      setError(null);
                      setSuccessMsg(null);
                      setIsLoginUnconfirmed(false);
                    }}
                    className="font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700 cursor-pointer ml-1"
                  >
                    Log In
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-500 font-medium">
                  Don't have an account?{" "}
                  <button
                    id="candidate-toggle-to-signup-btn"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                      setSuccessMsg(null);
                      setIsLoginUnconfirmed(false);
                    }}
                    className="font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700 cursor-pointer ml-1"
                  >
                    Create Account
                  </button>
                </p>
              )}
            </div>

        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
          <button
            onClick={() => setActiveView("auth-select")}
            className="hover:text-slate-600 cursor-pointer"
          >
            ← Switch Role
          </button>
          <button
            onClick={() => setActiveView("landing")}
            className="hover:text-slate-600 cursor-pointer"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};
