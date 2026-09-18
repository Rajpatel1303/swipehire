import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  User,
  Building2,
  Briefcase,
  FileText,
  Loader2,
  ExternalLink,
  AlertTriangle,
  AlertOctagon,
  Mail,
  Sparkles,
} from "lucide-react";
import { AdminApi } from "../../services/adminApi";
import { GlobalSearchResult, AdminView } from "../../types";
import { useAdmin } from "../../app/AdminContext";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: AdminView, entityId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { setActiveView } = useAdmin();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [results, setResults] = useState<GlobalSearchResult>({
    candidates: [],
    companies: [],
    jobs: [],
    applications: [],
    reports: [],
    errors: [],
    communications: [],
    bids: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults({
        candidates: [],
        companies: [],
        jobs: [],
        applications: [],
        reports: [],
        errors: [],
        communications: [],
        bids: [],
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({
        candidates: [],
        companies: [],
        jobs: [],
        applications: [],
        reports: [],
        errors: [],
        communications: [],
        bids: [],
      });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await AdminApi.globalSearch(query.trim());
        setResults(data || {
          candidates: [],
          companies: [],
          jobs: [],
          applications: [],
          reports: [],
          errors: [],
          communications: [],
          bids: [],
        });
      } catch (err) {
        console.error("[Global Search Error]:", err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    (results.candidates?.length || 0) +
    (results.companies?.length || 0) +
    (results.jobs?.length || 0) +
    (results.applications?.length || 0) +
    (results.reports?.length || 0) +
    (results.errors?.length || 0) +
    (results.communications?.length || 0) +
    (results.bids?.length || 0);

  const handleSelect = (view: AdminView, entityId?: string) => {
    if (onNavigate) {
      onNavigate(view, entityId);
    } else {
      setActiveView(view);
    }
    onClose();
  };

  const showCandidates = (activeFilter === "all" || activeFilter === "candidates") && (results.candidates?.length || 0) > 0;
  const showCompanies = (activeFilter === "all" || activeFilter === "companies") && (results.companies?.length || 0) > 0;
  const showJobs = (activeFilter === "all" || activeFilter === "jobs") && (results.jobs?.length || 0) > 0;
  const showApplications = (activeFilter === "all" || activeFilter === "applications") && (results.applications?.length || 0) > 0;
  const showReports = (activeFilter === "all" || activeFilter === "reports") && (results.reports?.length || 0) > 0;
  const showErrors = (activeFilter === "all" || activeFilter === "errors") && (results.errors?.length || 0) > 0;
  const showComms = (activeFilter === "all" || activeFilter === "comms") && (results.communications?.length || 0) > 0;
  const showBids = (activeFilter === "all" || activeFilter === "bids") && (results.bids?.length || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-12 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 my-auto">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/90 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search candidates, companies, jobs, reports, errors, comms, bids..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-hidden"
          />
          {isLoading && <Loader2 className="w-4 h-4 text-orange-400 animate-spin shrink-0" />}
          {query && !isLoading && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-800 border border-slate-700 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Entity Type Filter Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-800 bg-slate-950/40 text-xs overflow-x-auto">
          {[
            { id: "all", label: "All Types" },
            { id: "candidates", label: "Candidates" },
            { id: "companies", label: "Companies" },
            { id: "jobs", label: "Jobs" },
            { id: "applications", label: "Applications" },
            { id: "reports", label: "Reports" },
            { id: "errors", label: "Errors" },
            { id: "comms", label: "Comms" },
            { id: "bids", label: "Bids" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer shrink-0 ${
                activeFilter === tab.id
                  ? "bg-orange-500 text-white font-bold shadow-xs"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Results Display Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {query.length >= 2 && totalResults === 0 && !isLoading && (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching records found for "{query}".
            </div>
          )}

          {query.length < 2 && (
            <div className="py-10 text-center text-slate-500 text-xs">
              Type at least 2 characters to search across candidates, companies, listings, reports, and system telemetry...
            </div>
          )}

          {/* CANDIDATES */}
          {showCandidates && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                <User className="w-3 h-3 text-blue-400" />
                Candidates ({results.candidates.length})
              </div>
              <div className="grid gap-1">
                {results.candidates.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect("candidates", c.id)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition flex items-center justify-between group cursor-pointer border border-transparent hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                        {c.title.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                          {c.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {c.subtitle}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* COMPANIES */}
          {showCompanies && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-orange-400" />
                Companies ({results.companies.length})
              </div>
              <div className="grid gap-1">
                {results.companies.map((co) => (
                  <button
                    key={co.id}
                    onClick={() => handleSelect("companies", co.id)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition flex items-center justify-between group cursor-pointer border border-transparent hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                        {co.title.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                          {co.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {co.subtitle}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* JOBS */}
          {showJobs && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                <Briefcase className="w-3 h-3 text-emerald-400" />
                Jobs ({results.jobs.length})
              </div>
              <div className="grid gap-1">
                {results.jobs.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => handleSelect("jobs", j.id)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition flex items-center justify-between group cursor-pointer border border-transparent hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                          {j.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {j.subtitle}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* APPLICATIONS */}
          {showApplications && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-purple-400" />
                Applications ({results.applications.length})
              </div>
              <div className="grid gap-1">
                {results.applications.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleSelect("applications", a.id)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition flex items-center justify-between group cursor-pointer border border-transparent hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                          {a.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {a.subtitle}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* REPORTS */}
          {showReports && results.reports && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                Safety & Reports ({results.reports.length})
              </div>
              <div className="grid gap-1">
                {results.reports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect("reports", r.id)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition flex items-center justify-between group cursor-pointer border border-transparent hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                          {r.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {r.subtitle}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SYSTEM ERRORS */}
          {showErrors && results.errors && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                <AlertOctagon className="w-3 h-3 text-rose-400" />
                System Errors ({results.errors.length})
              </div>
              <div className="grid gap-1">
                {results.errors.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => handleSelect("system-errors", e.id)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition flex items-center justify-between group cursor-pointer border border-transparent hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                        <AlertOctagon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                          {e.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-md">
                          {e.subtitle}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* COMMUNICATIONS */}
          {showComms && results.communications && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-blue-400" />
                Communications ({results.communications.length})
              </div>
              <div className="grid gap-1">
                {results.communications.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect("email-operations", c.id)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition flex items-center justify-between group cursor-pointer border border-transparent hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                          {c.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {c.subtitle}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* REVERSE MARKETPLACE BIDS */}
          {showBids && results.bids && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Reverse Marketplace Bids ({results.bids.length})
              </div>
              <div className="grid gap-1">
                {results.bids.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleSelect("marketplace", b.id)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition flex items-center justify-between group cursor-pointer border border-transparent hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                          {b.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {b.subtitle}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Search spans candidates, companies, listings, reports, system errors, and marketplace bids</span>
          <span>Press ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
};
