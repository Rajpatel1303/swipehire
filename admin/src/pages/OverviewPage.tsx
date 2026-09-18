import React, { useState, useEffect } from "react";
import {
  Users,
  Building2,
  Briefcase,
  Layers,
  Sparkles,
  Trophy,
  History,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Bot,
  AlertOctagon,
  Mail,
  MessageSquare,
  Activity,
  Key,
} from "lucide-react";
import { useAdmin } from "../app/AdminContext";
import { AdminApi } from "../services/adminApi";
import { StatCard } from "../components/common/StatCard";
import { StatusBadge } from "../components/common/StatusBadge";

export const OverviewPage: React.FC = () => {
  const { metrics, isMetricsLoading, setActiveView } = useAdmin();
  const [opsHealth, setOpsHealth] = useState<{
    aiSuccessRate: string;
    aiTotal: number;
    unresolvedErrors: number;
    totalEmails: number;
    totalWhatsApp: number;
    marketplaceActiveBids: number;
  }>({
    aiSuccessRate: "100%",
    aiTotal: 0,
    unresolvedErrors: 0,
    totalEmails: 0,
    totalWhatsApp: 0,
    marketplaceActiveBids: 0,
  });

  useEffect(() => {
    const fetchOps = async () => {
      try {
        const [ai, errs, comms, mkt] = await Promise.allSettled([
          AdminApi.getAIMetrics(),
          AdminApi.getErrorMetrics(),
          AdminApi.getCommunicationMetrics(),
          AdminApi.getMarketplaceMetrics(),
        ]);
        const aiData = ai.status === "fulfilled" ? ai.value : null;
        const errData = errs.status === "fulfilled" ? errs.value : null;
        const commData = comms.status === "fulfilled" ? comms.value : null;
        const mktData = mkt.status === "fulfilled" ? mkt.value : null;

        setOpsHealth({
          aiSuccessRate: aiData?.metrics?.successRate !== undefined ? `${aiData.metrics.successRate.toFixed(1)}%` : "100%",
          aiTotal: aiData?.metrics?.totalRequests || 0,
          unresolvedErrors: errData?.metrics?.unresolved || 0,
          totalEmails: commData?.metrics?.totalEmails || 0,
          totalWhatsApp: commData?.metrics?.totalWhatsApp || 0,
          marketplaceActiveBids: mktData?.metrics?.activeBids || 0,
        });
      } catch (e) {
        console.error("Ops telemetry load error:", e);
      }
    };
    fetchOps();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Platform Command Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Live Platform Telemetry
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Real-time operational statistics aggregated directly from live Supabase production tables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-center min-w-28">
            <div className="text-xl font-black text-emerald-400">
              {metrics?.verifiedCompanies ?? 0} / {metrics?.totalCompanies ?? 0}
            </div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Verified Orgs
            </div>
          </div>
          <div className="px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-center min-w-28">
            <div className="text-xl font-black text-orange-400">
              {metrics?.totalAuditLogs ?? 0}
            </div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Audit Events
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Candidates"
          value={metrics?.totalCandidates ?? "..."}
          subtitle="Registered in database"
          icon={Users}
          colorVariant="blue"
          isLoading={isMetricsLoading}
        />
        <StatCard
          title="Total Companies"
          value={metrics?.totalCompanies ?? "..."}
          subtitle="Hiring organizations"
          icon={Building2}
          colorVariant="orange"
          isLoading={isMetricsLoading}
        />
        <StatCard
          title="Active Job Listings"
          value={metrics?.activeJobs ?? "..."}
          subtitle={`${metrics?.totalJobs || 0} total listings`}
          icon={Briefcase}
          colorVariant="emerald"
          isLoading={isMetricsLoading}
        />
        <StatCard
          title="Active Applications"
          value={metrics?.activeApplications ?? "..."}
          subtitle={`${metrics?.totalApplications || 0} total submitted`}
          icon={Layers}
          colorVariant="purple"
          isLoading={isMetricsLoading}
        />
        <StatCard
          title="Active Marketplace Bids"
          value={metrics?.activeBids ?? "..."}
          subtitle="72-hr upfront CTC bids"
          icon={Sparkles}
          colorVariant="amber"
          isLoading={isMetricsLoading}
        />
        <StatCard
          title="Confirmed Placements"
          value={metrics?.totalHired ?? "..."}
          subtitle="10% placement fee pipeline"
          icon={Trophy}
          colorVariant="emerald"
          isLoading={isMetricsLoading}
        />
      </div>

      {/* System Health & Operations Telemetry (Phase 2) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
            <Activity className="w-4 h-4" />
            <span>Operational Subsystems Health</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Live Ingestion Telemetry</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveView("ai-operations")}
            className="p-4 bg-slate-950 border border-slate-800 hover:border-orange-500/50 rounded-2xl text-left transition group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <Bot className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">
                {opsHealth.aiSuccessRate}
              </span>
            </div>
            <div className="text-lg font-black text-white group-hover:text-orange-400 transition">
              {opsHealth.aiTotal}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold">AI Operations</div>
          </button>

          <button
            onClick={() => setActiveView("system-errors")}
            className="p-4 bg-slate-950 border border-slate-800 hover:border-orange-500/50 rounded-2xl text-left transition group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${opsHealth.unresolvedErrors > 0 ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                {opsHealth.unresolvedErrors > 0 ? "Attention" : "Clean"}
              </span>
            </div>
            <div className="text-lg font-black text-white group-hover:text-orange-400 transition">
              {opsHealth.unresolvedErrors}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold">Unresolved Errors</div>
          </button>

          <button
            onClick={() => setActiveView("email-operations")}
            className="p-4 bg-slate-950 border border-slate-800 hover:border-orange-500/50 rounded-2xl text-left transition group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <Mail className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                Outbound
              </span>
            </div>
            <div className="text-lg font-black text-white group-hover:text-orange-400 transition">
              {opsHealth.totalEmails + opsHealth.totalWhatsApp}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold">Comms Dispatched</div>
          </button>

          <button
            onClick={() => setActiveView("marketplace")}
            className="p-4 bg-slate-950 border border-slate-800 hover:border-orange-500/50 rounded-2xl text-left transition group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                Reverse
              </span>
            </div>
            <div className="text-lg font-black text-white group-hover:text-orange-400 transition">
              {opsHealth.marketplaceActiveBids}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold">Active Bids</div>
          </button>
        </div>
      </div>

      {/* Quick Navigation Cards & Live Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Operations Navigation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-orange-400" />
            <span>Administrative Actions</span>
          </h3>

          <div className="space-y-2">
            <button
              onClick={() => setActiveView("applications")}
              className="w-full p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between group transition cursor-pointer"
            >
              <div className="text-left">
                <div className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                  Applications Pipeline
                </div>
                <div className="text-[11px] text-slate-500">
                  Inspect candidate applications and stage transitions
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => setActiveView("interviews")}
              className="w-full p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between group transition cursor-pointer"
            >
              <div className="text-left">
                <div className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                  Interview Operations
                </div>
                <div className="text-[11px] text-slate-500">
                  Reschedule, cancel, or verify scheduled rounds
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => setActiveView("reports")}
              className="w-full p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between group transition cursor-pointer"
            >
              <div className="text-left">
                <div className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                  Safety & Moderation Reports
                </div>
                <div className="text-[11px] text-slate-500">
                  Investigate flagged entities and disciplinary actions
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => setActiveView("candidates")}
              className="w-full p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between group transition cursor-pointer"
            >
              <div className="text-left">
                <div className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                  Manage Candidates
                </div>
                <div className="text-[11px] text-slate-500">
                  Inspect credentials, agreements, and suspension controls
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => setActiveView("companies")}
              className="w-full p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between group transition cursor-pointer"
            >
              <div className="text-left">
                <div className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                  Manage Companies
                </div>
                <div className="text-[11px] text-slate-500">
                  Verify employer organizations and review SLA performance
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => setActiveView("jobs")}
              className="w-full p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between group transition cursor-pointer"
            >
              <div className="text-left">
                <div className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                  Moderate Jobs
                </div>
                <div className="text-[11px] text-slate-500">
                  Approve, suspend, pause, or feature job opportunities
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => setActiveView("marketplace")}
              className="w-full p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between group transition cursor-pointer"
            >
              <div className="text-left">
                <div className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                  Reverse Marketplace
                </div>
                <div className="text-[11px] text-slate-500">
                  Inspect blind profiles, 72h company bids & reveals
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => setActiveView("rbac")}
              className="w-full p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between group transition cursor-pointer"
            >
              <div className="text-left">
                <div className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                  Admin Team & RBAC
                </div>
                <div className="text-[11px] text-slate-500">
                  Role assignments and security permission boundaries
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => setActiveView("audit-logs")}
              className="w-full p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between group transition cursor-pointer"
            >
              <div className="text-left">
                <div className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                  Security Audit Logs
                </div>
                <div className="text-[11px] text-slate-500">
                  Review immutable chronological trail of admin mutations
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>

        {/* Live Audit Feed */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Recent Security Events</span>
            </h3>
            <button
              onClick={() => setActiveView("audit-logs")}
              className="text-[11px] font-bold text-orange-400 hover:text-orange-300 transition cursor-pointer"
            >
              View Full Audit Log →
            </button>
          </div>

          <div className="space-y-2.5">
            {isMetricsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-950 rounded-xl animate-pulse" />
              ))
            ) : !metrics?.recentAuditLogs || metrics.recentAuditLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-semibold">
                No recent security actions logged yet. All actions in Candidate, Company, and Job modules will appear here.
              </div>
            ) : (
              metrics.recentAuditLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[11px] font-bold text-orange-400 truncate">
                      {log.action}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 text-[11px] truncate">
                      {log.actor_email || "System"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={log.entity_type} size="sm" />
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
