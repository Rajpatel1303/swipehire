import React from "react";
import { Loader2 } from "lucide-react";
import { useAdmin } from "../../app/AdminContext";
import { LoginPage } from "../../pages/LoginPage";
import { AccessDeniedPage } from "../../pages/AccessDeniedPage";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authStatus } = useAdmin();

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center animate-pulse">
          <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-sm font-bold tracking-wide uppercase text-slate-300">
            Validating Admin Session
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Verifying cryptographic credentials with Supabase security enclave...
          </p>
        </div>
      </div>
    );
  }

  if (authStatus === "access_denied") {
    return <AccessDeniedPage />;
  }

  if (authStatus === "unauthenticated") {
    return <LoginPage />;
  }

  return <>{children}</>;
};
