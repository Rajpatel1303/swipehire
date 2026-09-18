import React from "react";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";
import { useAdmin } from "../app/AdminContext";

export const AccessDeniedPage: React.FC = () => {
  const { accessDeniedEmail, signOut } = useAdmin();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-rose-950/40">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            403 Forbidden
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            Administrative Access Denied
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your account <span className="font-mono text-white font-bold">{accessDeniedEmail || "Current User"}</span> is registered as a standard Candidate or Company account. Standard accounts cannot enter the SwipeHired Operations Console.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={signOut}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Login
          </button>
        </div>

        <p className="text-[10px] text-slate-500">
          Security Incident Logged · IP and Session dispatched to Security Enclave
        </p>
      </div>
    </div>
  );
};
