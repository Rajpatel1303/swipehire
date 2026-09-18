import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";
import { AdminUser, AdminView, PlatformMetrics } from "../types";
import { AdminApi } from "../services/adminApi";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "access_denied";

interface AdminContextType {
  authStatus: AuthStatus;
  adminUser: AdminUser | null;
  activeView: AdminView;
  setActiveView: (view: AdminView) => void;
  metrics: PlatformMetrics | null;
  isMetricsLoading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  accessDeniedEmail: string | null;
  hasPermission: (permission: string) => boolean;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [accessDeniedEmail, setAccessDeniedEmail] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<AdminView>("overview");
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [isMetricsLoading, setIsMetricsLoading] = useState(false);

  // Validate admin authorization against Supabase profiles table
  const verifyAdminRole = async (userId: string, email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, email")
        .eq("id", userId)
        .single();

      if (error || !data) {
        console.warn("[Admin Auth] Profile check error:", error);
        return false;
      }

      if (data.role === "admin") {
        // Fetch verified role & permissions from backend
        let resolvedRole: any = "admin";
        let resolvedPermissions: string[] = [];
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const res = await fetch("/api/admin/auth/verify", {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
              const resData = await res.json();
              if (resData.user) {
                resolvedRole = resData.user.role || "admin";
                resolvedPermissions = resData.user.permissions || [];
              }
            }
          }
        } catch (vErr) {
          console.warn("[Admin Context] Auth verify lookup warning:", vErr);
        }

        setAdminUser({
          id: userId,
          email,
          role: resolvedRole,
          permissions: resolvedPermissions,
          fullName: resolvedRole === "super_admin" ? "SwipeHired Super Admin" : `SwipeHired ${resolvedRole.charAt(0).toUpperCase() + resolvedRole.slice(1)}`,
        });
        return true;
      }

      return false;
    } catch (err) {
      console.error("[Admin Auth] Verification failure:", err);
      return false;
    }
  };

  // Restore and verify active session on boot
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (isMounted) {
            setAuthStatus("unauthenticated");
            setAdminUser(null);
          }
          return;
        }

        const isAdmin = await verifyAdminRole(session.user.id, session.user.email || "");
        if (isMounted) {
          if (isAdmin) {
            setAuthStatus("authenticated");
          } else {
            await supabase.auth.signOut();
            setAccessDeniedEmail(session.user.email || null);
            setAuthStatus("access_denied");
          }
        }
      } catch (err) {
        console.error("[Admin Session Restore Error]:", err);
        if (isMounted) setAuthStatus("unauthenticated");
      }
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setAdminUser(null);
        setAuthStatus("unauthenticated");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch telemetry metrics
  const refreshMetrics = useCallback(async () => {
    if (authStatus !== "authenticated") return;
    setIsMetricsLoading(true);
    try {
      const data = await AdminApi.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error("[Admin Refresh Metrics Error]:", err);
    } finally {
      setIsMetricsLoading(false);
    }
  }, [authStatus]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      refreshMetrics();
    }
  }, [authStatus, refreshMetrics]);

  // Sign in with explicit role verification
  const signIn = async (email: string, pass: string): Promise<{ error?: string }> => {
    try {
      setAuthStatus("loading");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error || !data.user) {
        setAuthStatus("unauthenticated");
        return { error: error?.message || "Invalid administrative credentials." };
      }

      const isAdmin = await verifyAdminRole(data.user.id, data.user.email || "");
      if (!isAdmin) {
        // Immediately revoke session for non-admin accounts
        await supabase.auth.signOut();
        setAccessDeniedEmail(data.user.email || email);
        setAuthStatus("access_denied");
        return { error: "Access Denied: Account does not possess verified administrator privileges." };
      }

      setAuthStatus("authenticated");
      setActiveView("overview");
      return {};
    } catch (err: any) {
      setAuthStatus("unauthenticated");
      return { error: err.message || "Failed to authenticate." };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAdminUser(null);
    setMetrics(null);
    setAuthStatus("unauthenticated");
  };

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!adminUser) return false;
      if (adminUser.role === "super_admin") return true;
      return (adminUser.permissions || []).includes(permission);
    },
    [adminUser]
  );

  return (
    <AdminContext.Provider
      value={{
        hasPermission,
        authStatus,
        adminUser,
        activeView,
        setActiveView,
        metrics,
        isMetricsLoading,
        signIn,
        signOut,
        refreshMetrics,
        accessDeniedEmail,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};
