import React, { useState } from "react";
import { Lock, Mail, ShieldAlert, ArrowRight, Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import { useAdmin } from "../app/AdminContext";

export const LoginPage: React.FC = () => {
  const { signIn } = useAdmin();
  const [email, setEmail] = useState("admin@swipehired.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Please enter your administrative email and password.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await signIn(cleanEmail, cleanPassword);
      if (res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || "Failed to authenticate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillCredentials = () => {
    setEmail("admin@swipehired.com");
    setPassword("Admin@SwipeHired2026!");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand Badge */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20">
            <span className="text-white font-black text-2xl">S</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-black uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            <span>SwipeHired Internal Operations</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Administrator Sign In
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Restricted administrative gateway. Only verified platform operators with confirmed roles can enter.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@swipehired.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Master Password
              </label>
              <button
                type="button"
                onClick={handleFillCredentials}
                className="text-[10px] text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Fill Credentials
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin@SwipeHired2026!"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-orange-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Enclave...</span>
              </>
            ) : (
              <>
                <span>Enter Operations Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-[10px] text-slate-500 border-t border-slate-800/80">
          Public candidate and company accounts are strictly blocked. All attempts are monitored and recorded.
        </div>
      </div>
    </div>
  );
};
