import React, { useState, useEffect } from "react";
import { Menu, Database, RefreshCw, Shield, Search } from "lucide-react";
import { useAdmin } from "../../app/AdminContext";
import { AdminView } from "../../types";
import { GlobalSearchModal } from "../common/GlobalSearchModal";

interface AdminHeaderProps {
  onOpenMobileMenu: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onOpenMobileMenu }) => {
  const { activeView, refreshMetrics, isMetricsLoading } = useAdmin();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getMeta = (view: AdminView) => {
    switch (view) {
      case "overview":
        return { title: "Command Center", subtitle: "Live aggregated platform telemetry from Supabase" };
      case "candidates":
        return { title: "Candidate Directory", subtitle: "Profiles, credentials, and 10% placement agreement compliance" };
      case "companies":
        return { title: "Employer Governance", subtitle: "Verification status, SLA metrics, and organization directory" };
      case "jobs":
        return { title: "Job Moderation Queue", subtitle: "Review salary transparency, approve, pause, or suspend listings" };
      case "applications":
        return { title: "Applications Pipeline", subtitle: "Inspect candidate applications, interview stages, and status transitions" };
      case "interviews":
        return { title: "Interview Operations", subtitle: "Monitor scheduled rounds, administrative rescheduling, and link sanity" };
      case "reports":
        return { title: "Reports & Platform Moderation", subtitle: "Investigate flagged content, safety reports, and enforce platform governance" };
      case "ai-operations":
        return { title: "AI Operations & Telemetry", subtitle: "Monitor Eden AI, Gemma 4, Affinda OCR latency, failure rates, and model retries" };
      case "system-errors":
        return { title: "System Errors & Exceptions", subtitle: "Centralized operational error logs, severity triage, and resolution workflows" };
      case "email-operations":
        return { title: "Email Outbound Operations", subtitle: "Inspect transactional emails, SMTP delivery logs, and retry dispatches" };
      case "whatsapp-operations":
        return { title: "WhatsApp Outbound Operations", subtitle: "Monitor Wasender messaging dispatches, delivery confirmations, and retry queues" };
      case "templates":
        return { title: "Communication Templates", subtitle: "Manage transactional message copy, placeholder tokens, and candidate notifications" };
      case "marketplace":
        return { title: "Reverse Marketplace Governance", subtitle: "Manage blind candidate profiles, 72-hour CTC bids, and identity reveal approvals" };
      case "rbac":
        return { title: "Team & Role-Based Access Control", subtitle: "Manage administrative roles, team assignments, and security permission boundaries" };
      case "audit-logs":
        return { title: "Security Audit Logs", subtitle: "Immutable chronological trail of all privileged mutations" };
      default:
        return { title: "Admin Console", subtitle: "Platform administrative management and operations" };
    }
  };

  const meta = getMeta(activeView);

  return (
    <>
      <header className="h-18 bg-slate-900 border-b border-slate-800 px-4 sm:px-8 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                {meta.title}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-700">
                <Shield className="w-3 h-3 text-orange-400" />
                Isolated Tier
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {meta.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Global Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Search platform...</span>
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-500 bg-slate-900 border border-slate-700/60 rounded">
              Ctrl K
            </kbd>
          </button>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="sm:hidden p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400">
            <Database className="w-3.5 h-3.5" />
            <span>Supabase Connected</span>
          </div>

          <button
            onClick={refreshMetrics}
            disabled={isMetricsLoading}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Refresh telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isMetricsLoading ? "animate-spin text-orange-400" : ""}`} />
            <span className="hidden sm:inline">Sync Data</span>
          </button>
        </div>
      </header>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};
