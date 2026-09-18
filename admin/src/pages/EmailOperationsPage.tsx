import React, { useState, useEffect, useCallback } from "react";
import {
  Mail,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Eye,
  AlertTriangle,
  Send,
} from "lucide-react";
import { AdminApi } from "../services/adminApi";
import { CommunicationLogRecord, CommunicationMetrics } from "../types";
import { StatCard } from "../components/common/StatCard";
import { DataTable, Column } from "../components/common/DataTable";
import { AdminModal } from "../components/common/AdminModal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { StatusBadge } from "../components/common/StatusBadge";
import { useAdmin } from "../app/AdminContext";

export const EmailOperationsPage: React.FC = () => {
  const { hasPermission } = useAdmin();
  const [metrics, setMetrics] = useState<CommunicationMetrics | null>(null);
  const [logs, setLogs] = useState<CommunicationLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Inspect & Retry
  const [inspectingLog, setInspectingLog] = useState<CommunicationLogRecord | null>(null);
  const [retryingLog, setRetryingLog] = useState<CommunicationLogRecord | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const canManageComms = hasPermission("communications.manage");

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMsg(null);

    try {
      const [mRes, logRes] = await Promise.all([
        AdminApi.getCommunicationMetrics(),
        AdminApi.getCommunicationLogs({
          page,
          limit: pageSize,
          channel: "email",
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          search: searchQuery.trim() || undefined,
        }),
      ]);

      setMetrics(mRes);
      setLogs(logRes.logs || []);
      setTotal(logRes.total || 0);
    } catch (err: any) {
      console.error("[EmailOperationsPage Load Error]:", err);
      setErrorMsg(err.message || "Failed to load email dispatch logs.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, pageSize, selectedStatus, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRetry = async () => {
    if (!retryingLog) return;
    setIsRetrying(true);
    try {
      await AdminApi.retryCommunication(retryingLog.id);
      setRetryingLog(null);
      await loadData(true);
    } catch (err: any) {
      alert(`Retry Failed: ${err.message}`);
    } finally {
      setIsRetrying(false);
    }
  };

  const columns: Column<CommunicationLogRecord>[] = [
    {
      key: "recipient",
      header: "Recipient & Subject",
      render: (log) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{log.recipient}</span>
          <span className="text-[10px] text-slate-500 truncate max-w-[240px] block" title={log.subject || "No Subject"}>
            {log.subject || "(No Subject)"}
          </span>
        </div>
      ),
    },
    {
      key: "provider",
      header: "Provider",
      render: (log) => (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
          {log.provider.toUpperCase()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (log) => {
        const statusConfig = {
          sent: { label: "SENT", variant: "success" as const },
          delivered: { label: "DELIVERED", variant: "success" as const },
          failed: { label: "FAILED", variant: "danger" as const },
          pending: { label: "PENDING", variant: "warning" as const },
          retried: { label: "RETRIED", variant: "info" as const },
        };
        const cfg = statusConfig[log.status] || { label: log.status.toUpperCase(), variant: "neutral" as const };
        return <StatusBadge label={cfg.label} variant={cfg.variant} />;
      },
    },
    {
      key: "error_message",
      header: "Diagnostic",
      render: (log) => {
        if (log.status === "failed") {
          return (
            <span className="text-xs text-rose-600 font-medium truncate max-w-[180px] block" title={log.error_message || "Dispatch error"}>
              {log.error_message || "Dispatch failed"}
            </span>
          );
        }
        return <span className="text-xs text-emerald-600 font-medium">Delivered Successfully</span>;
      },
    },
    {
      key: "created_at",
      header: "Timestamp",
      render: (log) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {new Date(log.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "medium" })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (log) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setInspectingLog(log)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Inspect Email"
          >
            <Eye className="w-4 h-4" />
          </button>
          {log.status === "failed" && canManageComms && (
            <button
              onClick={() => setRetryingLog(log)}
              className="p-1.5 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors"
              title="Retry Email"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const emailStats = metrics?.email || { total: 0, sent: 0, failed: 0 };
  const failureRate = emailStats.total > 0 ? Math.round((emailStats.failed / emailStats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Mail className="w-6 h-6 text-emerald-600" />
            Email Operations
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Outbound candidate interview invites, recruiter notifications, and SMTP deliverability.
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
          title="Total Dispatches"
          value={emailStats.total.toLocaleString()}
          icon={Send}
          subtitle="Outbound emails"
          colorVariant="primary"
        />
        <StatCard
          title="Delivered Successfully"
          value={emailStats.sent.toLocaleString()}
          icon={CheckCircle2}
          subtitle="Confirmed delivery"
          colorVariant="success"
        />
        <StatCard
          title="Dispatch Failures"
          value={emailStats.failed.toLocaleString()}
          icon={XCircle}
          subtitle={`${failureRate}% failure rate`}
          colorVariant={emailStats.failed > 0 ? "danger" : "neutral"}
        />
        <StatCard
          title="Provider Infrastructure"
          value="Custom SMTP"
          icon={Clock}
          subtitle="TLS / STARTTLS Encrypted"
          colorVariant="neutral"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search recipient or subject..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="retried">Retried</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-bold">Error loading email logs</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Email Logs Table */}
      <DataTable
        columns={columns}
        data={logs}
        keyExtractor={(l) => l.id}
        isLoading={isLoading}
        emptyMessage="No email dispatch logs found matching your filters."
        pagination={{
          currentPage: page,
          pageSize,
          totalItems: total,
          onPageChange: setPage,
        }}
      />

      {/* Email Inspector Modal */}
      {inspectingLog && (
        <AdminModal
          isOpen={true}
          onClose={() => setInspectingLog(null)}
          title="Email Dispatch Inspector"
          subtitle={`Message ID: ${inspectingLog.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Recipient</span>
                <span className="font-bold text-slate-900">{inspectingLog.recipient}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Sender</span>
                <span className="font-mono text-slate-900">{inspectingLog.sender}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Status</span>
                <span className={`font-bold ${inspectingLog.status === "failed" ? "text-rose-600" : "text-emerald-600"}`}>
                  {inspectingLog.status.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Provider</span>
                <span className="font-mono text-slate-900 uppercase">{inspectingLog.provider}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Subject</span>
              <div className="p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-800">
                {inspectingLog.subject || "(No Subject)"}
              </div>
            </div>

            {inspectingLog.error_message && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                <span className="text-[10px] font-bold uppercase block text-rose-700 mb-1">Delivery Failure Reason</span>
                <p className="font-mono">{inspectingLog.error_message}</p>
              </div>
            )}

            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Metadata</span>
              <pre className="p-3 bg-slate-50 text-slate-700 font-mono text-[11px] rounded-xl border border-slate-200 overflow-x-auto max-h-36">
                {JSON.stringify(inspectingLog.metadata || {}, null, 2)}
              </pre>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Retry Confirmation */}
      <ConfirmDialog
        isOpen={!!retryingLog}
        onClose={() => setRetryingLog(null)}
        onConfirm={handleRetry}
        title="Retry Email Dispatch"
        message={`Are you sure you want to retry sending email to ${retryingLog?.recipient}? The original message parameters will be re-queued.`}
        confirmText="Confirm Retry"
        variant="warning"
        isLoading={isRetrying}
      />
    </div>
  );
};
