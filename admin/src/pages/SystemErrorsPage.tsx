import React, { useState, useEffect, useCallback } from "react";
import {
  AlertOctagon,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Check,
  Filter,
  Layers,
  FileText,
} from "lucide-react";
import { AdminApi } from "../services/adminApi";
import { SystemErrorRecord, SystemErrorMetrics } from "../types";
import { StatCard } from "../components/common/StatCard";
import { DataTable, Column } from "../components/common/DataTable";
import { AdminModal } from "../components/common/AdminModal";
import { StatusBadge } from "../components/common/StatusBadge";
import { useAdmin } from "../app/AdminContext";

export const SystemErrorsPage: React.FC = () => {
  const { hasPermission } = useAdmin();
  const [metrics, setMetrics] = useState<SystemErrorMetrics | null>(null);
  const [errors, setErrors] = useState<SystemErrorRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [selectedService, setSelectedService] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Inspect & Status Update
  const [inspectingError, setInspectingError] = useState<SystemErrorRecord | null>(null);
  const [actionError, setActionError] = useState<SystemErrorRecord | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>("resolved");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const canManageErrors = hasPermission("errors.manage");

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMsg(null);

    try {
      const [mRes, errRes] = await Promise.all([
        AdminApi.getErrorMetrics(),
        AdminApi.getSystemErrors({
          page,
          limit: pageSize,
          service: selectedService !== "all" ? selectedService : undefined,
          severity: selectedSeverity !== "all" ? selectedSeverity : undefined,
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          search: searchQuery.trim() || undefined,
        }),
      ]);

      setMetrics(mRes);
      setErrors(errRes.errors || []);
      setTotal(errRes.total || 0);
    } catch (err: any) {
      console.error("[SystemErrorsPage Load Error]:", err);
      setErrorMsg(err.message || "Failed to load system errors.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, pageSize, selectedService, selectedSeverity, selectedStatus, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionError) return;
    setIsUpdating(true);

    try {
      await AdminApi.updateSystemErrorStatus(actionError.id, targetStatus, adminNotes);
      setActionError(null);
      setAdminNotes("");
      await loadData(true);
    } catch (err: any) {
      alert(`Update Error Status Failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const columns: Column<SystemErrorRecord>[] = [
    {
      key: "service",
      header: "Service & Code",
      render: (err) => {
        const serviceColors: Record<string, string> = {
          api: "bg-blue-50 text-blue-700 border-blue-200",
          ai: "bg-purple-50 text-purple-700 border-purple-200",
          email: "bg-emerald-50 text-emerald-700 border-emerald-200",
          whatsapp: "bg-teal-50 text-teal-700 border-teal-200",
          database: "bg-amber-50 text-amber-700 border-amber-200",
          frontend: "bg-rose-50 text-rose-700 border-rose-200",
        };
        const color = serviceColors[err.service] || "bg-slate-50 text-slate-700 border-slate-200";

        return (
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${color}`}>
              {err.service}
            </span>
            <span className="font-mono text-xs font-bold text-slate-900">{err.error_code}</span>
          </div>
        );
      },
    },
    {
      key: "severity",
      header: "Severity",
      render: (err) => {
        const severityConfig = {
          critical: { label: "CRITICAL", variant: "danger" as const },
          high: { label: "HIGH", variant: "warning" as const },
          medium: { label: "MEDIUM", variant: "info" as const },
          low: { label: "LOW", variant: "neutral" as const },
        };
        const cfg = severityConfig[err.severity] || { label: (err.severity || "info").toUpperCase(), variant: "neutral" as const };
        return <StatusBadge status={err.severity} label={cfg.label} variant={cfg.variant} />;
      },
    },
    {
      key: "message",
      header: "Message",
      render: (err) => (
        <span className="text-xs text-slate-800 font-medium truncate max-w-[320px] block" title={err.message}>
          {err.message}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (err) => {
        const statusConfig = {
          open: { label: "OPEN", variant: "danger" as const },
          investigating: { label: "INVESTIGATING", variant: "warning" as const },
          resolved: { label: "RESOLVED", variant: "success" as const },
          ignored: { label: "IGNORED", variant: "neutral" as const },
        };
        const cfg = statusConfig[err.status] || { label: (err.status || "open").toUpperCase(), variant: "neutral" as const };
        return <StatusBadge status={err.status} label={cfg.label} variant={cfg.variant} />;
      },
    },
    {
      key: "created_at",
      header: "Logged At",
      render: (err) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {new Date(err.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "medium" })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (err) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setInspectingError(err)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Inspect Error"
          >
            <Eye className="w-4 h-4" />
          </button>
          {canManageErrors && (
            <button
              onClick={() => {
                setActionError(err);
                setTargetStatus(err.status === "open" ? "investigating" : "resolved");
                setAdminNotes(err.admin_notes || "");
              }}
              className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
              title="Triage Status"
            >
              <Check className="w-4 h-4" />
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
            <AlertOctagon className="w-6 h-6 text-rose-600" />
            System Errors & Incident Monitoring
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Centralized operational error logs across API, AI, Communications, and Database.
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
          title="Open Incidents"
          value={metrics ? metrics.open.toLocaleString() : "—"}
          icon={AlertTriangle}
          subtitle={metrics ? `${metrics.investigating} investigating` : "Awaiting triage"}
          colorVariant="danger"
        />
        <StatCard
          title="Critical Severity"
          value={metrics ? metrics.critical.toLocaleString() : "—"}
          icon={AlertOctagon}
          subtitle="Immediate priority"
          colorVariant={metrics && metrics.critical > 0 ? "danger" : "neutral"}
        />
        <StatCard
          title="Resolved Errors"
          value={metrics ? metrics.resolved.toLocaleString() : "—"}
          icon={CheckCircle2}
          subtitle="Fixed or addressed"
          colorVariant="success"
        />
        <StatCard
          title="Errors Logged Today"
          value={metrics ? metrics.today.toLocaleString() : "—"}
          icon={Clock}
          subtitle="24h incoming rate"
          colorVariant="warning"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search message or code..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedService}
            onChange={(e) => {
              setSelectedService(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="all">All Services</option>
            <option value="api">API</option>
            <option value="ai">AI</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="database">Database</option>
            <option value="frontend">Frontend</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => {
              setSelectedSeverity(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="ignored">Ignored</option>
          </select>
        </div>
      </div>

      {/* Error Message Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-bold">Error loading system errors</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Errors Table */}
      <DataTable
        columns={columns}
        data={errors}
        keyExtractor={(err) => err.id}
        isLoading={isLoading}
        emptyMessage="No system errors found matching your filter criteria."
        pagination={{
          currentPage: page,
          pageSize,
          totalItems: total,
          onPageChange: setPage,
        }}
      />

      {/* Error Inspector Modal */}
      {inspectingError && (
        <AdminModal
          isOpen={true}
          onClose={() => setInspectingError(null)}
          title="System Error Diagnostic"
          subtitle={`Incident Record: ${inspectingError.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Service</span>
                <span className="font-bold text-slate-900 uppercase">{inspectingError.service}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Severity</span>
                <span className="font-bold text-rose-600 uppercase">{inspectingError.severity}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Error Code</span>
                <span className="font-mono text-slate-900 font-bold">{inspectingError.error_code}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Status</span>
                <span className="font-bold text-slate-900 uppercase">{inspectingError.status}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Message</span>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-medium">
                {inspectingError.message}
              </div>
            </div>

            {inspectingError.stack_trace && (
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Stack Trace</span>
                <pre className="p-3 bg-slate-900 text-slate-100 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48">
                  {inspectingError.stack_trace}
                </pre>
              </div>
            )}

            {inspectingError.admin_notes && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <span className="text-[10px] font-bold uppercase block text-amber-700 mb-1">Admin Notes</span>
                <p>{inspectingError.admin_notes}</p>
                {inspectingError.resolved_by && (
                  <span className="text-[10px] text-amber-600 block mt-1">
                    Resolved by {inspectingError.resolved_by} at {new Date(inspectingError.resolved_at || "").toLocaleString()}
                  </span>
                )}
              </div>
            )}

            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Metadata</span>
              <pre className="p-3 bg-slate-50 text-slate-700 font-mono text-[11px] rounded-xl border border-slate-200 overflow-x-auto max-h-36">
                {JSON.stringify(inspectingError.metadata || {}, null, 2)}
              </pre>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Triage Action Modal */}
      {actionError && (
        <AdminModal
          isOpen={true}
          onClose={() => setActionError(null)}
          title="Triage Incident Status"
          subtitle={`Error ID: ${actionError.id}`}
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                Update Status To
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="ignored">Ignored</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                Admin Notes / Root Cause Analysis
              </label>
              <textarea
                rows={3}
                placeholder="Explain the resolution or investigation notes..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
              >
                {isUpdating ? "Saving..." : "Save Status"}
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
};
