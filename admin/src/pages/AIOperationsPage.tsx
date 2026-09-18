import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Eye,
  Activity,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { AdminApi } from "../services/adminApi";
import { AIOperationRecord, AIMetrics } from "../types";
import { StatCard } from "../components/common/StatCard";
import { DataTable, Column } from "../components/common/DataTable";
import { AdminModal } from "../components/common/AdminModal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { StatusBadge } from "../components/common/StatusBadge";
import { useAdmin } from "../app/AdminContext";

export const AIOperationsPage: React.FC = () => {
  const { hasPermission } = useAdmin();
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [operations, setOperations] = useState<AIOperationRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedFeature, setSelectedFeature] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Inspector & Retry Modals
  const [inspectingOp, setInspectingOp] = useState<AIOperationRecord | null>(null);
  const [retryingOp, setRetryingOp] = useState<AIOperationRecord | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const canManageAI = hasPermission("ai.manage");

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const [mRes, opRes] = await Promise.all([
        AdminApi.getAIMetrics(),
        AdminApi.getAIOperations({
          page,
          limit: pageSize,
          feature: selectedFeature !== "all" ? selectedFeature : undefined,
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          search: searchQuery.trim() || undefined,
        }),
      ]);

      setMetrics(mRes);
      setOperations(opRes.operations || []);
      setTotal(opRes.total || 0);
    } catch (err: any) {
      console.error("[AIOperationsPage Load Error]:", err);
      setError(err.message || "Failed to load AI operations telemetry.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, pageSize, selectedFeature, selectedStatus, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRetry = async () => {
    if (!retryingOp) return;
    setIsRetrying(true);
    try {
      await AdminApi.retryAIOperation(retryingOp.id);
      setRetryingOp(null);
      await loadData(true);
    } catch (err: any) {
      alert(`Retry Failed: ${err.message}`);
    } finally {
      setIsRetrying(false);
    }
  };

  const columns: Column<AIOperationRecord>[] = [
    {
      key: "feature",
      header: "Feature",
      render: (op) => {
        const featureLabels: Record<string, string> = {
          parse_resume: "Resume Parsing",
          generate_job: "Job Spec Generator",
          match_analysis: "Match Analysis",
          candidate_summary: "Candidate Summary",
        };
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block text-xs">
                {featureLabels[op.feature] || op.feature}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{op.model}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (op) => {
        const statusConfig = {
          success: { label: "SUCCESS", variant: "success" as const },
          failed: { label: "FAILED", variant: "danger" as const },
          retried: { label: "RETRIED", variant: "info" as const },
        };
        const cfg = statusConfig[op.status] || { label: op.status.toUpperCase(), variant: "neutral" as const };
        return <StatusBadge label={cfg.label} variant={cfg.variant} />;
      },
    },
    {
      key: "duration_ms",
      header: "Latency",
      render: (op) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{op.duration_ms} ms</span>
        </div>
      ),
    },
    {
      key: "error_code",
      header: "Diagnostic",
      render: (op) => {
        if (op.status === "failed") {
          return (
            <span className="text-xs text-rose-600 font-mono font-medium truncate max-w-[180px] block" title={op.error_message || op.error_code || "Unknown Error"}>
              {op.error_code || op.error_message || "Error"}
            </span>
          );
        }
        return <span className="text-xs text-emerald-600 font-medium">Completed Normally</span>;
      },
    },
    {
      key: "created_at",
      header: "Timestamp",
      render: (op) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {new Date(op.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "medium" })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (op) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setInspectingOp(op)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Inspect Operation"
          >
            <Eye className="w-4 h-4" />
          </button>
          {op.status === "failed" && canManageAI && (
            <button
              onClick={() => setRetryingOp(op)}
              className="p-1.5 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors"
              title="Retry Operation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-purple-600" />
            AI Operations & Telemetry
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time inference diagnostics, latency measurements, and feature telemetry.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Inferences"
          value={metrics ? metrics.totalRequests.toLocaleString() : "—"}
          icon={Activity}
          subtitle={metrics ? `${metrics.requestsToday} requests today` : "Live telemetry"}
          colorVariant="primary"
        />
        <StatCard
          title="Success Rate"
          value={
            metrics && metrics.totalRequests > 0
              ? `${Math.round((metrics.successfulRequests / metrics.totalRequests) * 100)}%`
              : metrics ? "100%" : "—"
          }
          icon={CheckCircle2}
          subtitle={metrics ? `${metrics.successfulRequests} successful` : "Measured rate"}
          colorVariant="success"
        />
        <StatCard
          title="Failed Requests"
          value={metrics ? metrics.failedRequests.toLocaleString() : "—"}
          icon={XCircle}
          subtitle={metrics ? `${metrics.failuresToday} failures today` : "Zero tolerance"}
          colorVariant="danger"
        />
        <StatCard
          title="Average Latency"
          value={metrics ? `${metrics.avgDurationMs} ms` : "—"}
          icon={Clock}
          subtitle="Last 100 calls"
          colorVariant="warning"
        />
      </div>

      {/* Feature Breakdown Table */}
      {metrics && metrics.featureStats && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Feature Breakdown
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { key: "parse_resume", title: "Resume Parser", model: "Gemma 4 31B (Eden AI)" },
              { key: "generate_job", title: "Job Spec Generator", model: "OpenAI (Eden AI)" },
              { key: "match_analysis", title: "Match Analysis", model: "OpenAI (Eden AI)" },
              { key: "candidate_summary", title: "Candidate Summary", model: "Gemma 4 26B (Workers AI)" },
            ].map((f) => {
              const stat = metrics.featureStats[f.key] || { requests: 0, successes: 0, failures: 0, avgDuration: 0 };
              return (
                <div key={f.key} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">{f.title}</span>
                    <span className="text-[10px] font-black text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {stat.requests} reqs
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mb-2">{f.model}</p>
                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60">
                    <span className="text-emerald-700 font-bold">{stat.successes} ok</span>
                    <span className="text-rose-700 font-bold">{stat.failures} failed</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by model name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedFeature}
            onChange={(e) => {
              setSelectedFeature(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="all">All Features</option>
            <option value="parse_resume">Resume Parsing</option>
            <option value="generate_job">Job Spec Generator</option>
            <option value="match_analysis">Match Analysis</option>
            <option value="candidate_summary">Candidate Summary</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="retried">Retried</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-bold">Error loading AI telemetry</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Telemetry Table */}
      <DataTable
        columns={columns}
        data={operations}
        keyExtractor={(op) => op.id}
        isLoading={isLoading}
        emptyMessage="No AI operations telemetry found matching your current filters."
        pagination={{
          currentPage: page,
          pageSize,
          totalItems: total,
          onPageChange: setPage,
        }}
      />

      {/* Inspector Modal */}
      {inspectingOp && (
        <AdminModal
          isOpen={true}
          onClose={() => setInspectingOp(null)}
          title="AI Operation Inspector"
          subtitle={`Telemetry Record: ${inspectingOp.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Feature</span>
                <span className="font-bold text-slate-900">{inspectingOp.feature}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Model</span>
                <span className="font-mono text-slate-900">{inspectingOp.model}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Status</span>
                <span className={`font-bold ${inspectingOp.status === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                  {inspectingOp.status.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Latency</span>
                <span className="font-mono text-slate-900">{inspectingOp.duration_ms} ms</span>
              </div>
            </div>

            {inspectingOp.error_message && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                <span className="text-[10px] font-bold uppercase block text-rose-600 mb-1">
                  Diagnostic Error Message
                </span>
                <p className="font-mono text-[11px] break-all">{inspectingOp.error_message}</p>
              </div>
            )}

            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                Safe Telemetry Metadata (Sanitized)
              </span>
              <pre className="p-3 bg-slate-900 text-slate-100 font-mono text-[11px] rounded-xl overflow-x-auto max-h-56">
                {JSON.stringify(inspectingOp.metadata || {}, null, 2)}
              </pre>
            </div>

            <div className="text-[10px] text-slate-400">
              Recorded at {new Date(inspectingOp.created_at).toLocaleString()}
            </div>
          </div>
        </AdminModal>
      )}

      {/* Retry Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!retryingOp}
        onClose={() => setRetryingOp(null)}
        onConfirm={handleRetry}
        title="Retry AI Operation"
        message={`Are you sure you want to trigger a retry for ${retryingOp?.feature} (ID: ${retryingOp?.id})? This will mark the operation as retried and execute server-side.`}
        confirmText="Confirm Retry"
        variant="warning"
        isLoading={isRetrying}
      />
    </div>
  );
};
