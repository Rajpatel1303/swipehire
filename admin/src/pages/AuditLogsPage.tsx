import React, { useState, useEffect } from "react";
import { History, Shield, RefreshCw, Code, Lock, Search, Filter, Calendar, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";
import { AuditRecord } from "../types";
import { AdminApi } from "../services/adminApi";
import { DataTable, Column } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { AdminModal } from "../components/common/AdminModal";

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [supportModeOnly, setSupportModeOnly] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Inspector
  const [inspectLog, setInspectLog] = useState<AuditRecord | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { logs: fetchedLogs, total } = await AdminApi.getAuditLogs({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        search: searchTerm.trim() || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        entityType: entityFilter !== "all" ? entityFilter : undefined,
        action: actionFilter !== "all" ? actionFilter : undefined,
        fromDate: fromDate ? new Date(fromDate).toISOString() : undefined,
        toDate: toDate ? new Date(toDate).toISOString() : undefined,
      });

      let filtered = fetchedLogs;
      if (supportModeOnly) {
        filtered = filtered.filter(
          (l) => l.metadata?.is_support_session || l.action.startsWith("support_session")
        );
      }

      setLogs(filtered);
      setTotalCount(total);
    } catch (err) {
      console.error("[Audit Logs Page Error]:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, roleFilter, entityFilter, actionFilter, fromDate, toDate, supportModeOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const columns: Column<AuditRecord>[] = [
    {
      key: "created_at",
      header: "Timestamp",
      render: (log) => (
        <div className="font-mono text-slate-400 text-[11px]">
          <div>{new Date(log.created_at).toLocaleDateString()}</div>
          <div className="text-[10px] text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</div>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action & Mode",
      render: (log) => {
        const isSupport = log.metadata?.is_support_session || log.action.startsWith("support_session");
        return (
          <div className="space-y-1">
            <div className="font-mono font-bold text-orange-400 text-xs">
              {log.action}
            </div>
            {isSupport && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <ShieldAlert className="w-2.5 h-2.5" />
                Support Mode
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "actor",
      header: "Actor (Real Identity)",
      render: (log) => (
        <div>
          <div className="text-white text-xs font-semibold flex items-center gap-1.5">
            <span>{log.actor_email || log.actor_id || "System"}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 uppercase font-mono">
              {log.actor_role}
            </span>
          </div>
          {log.actor_user_id && (
            <div className="text-[10px] text-slate-500 font-mono truncate max-w-[180px]" title={log.actor_user_id}>
              {log.actor_user_id}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "target",
      header: "Target / Affected",
      render: (log) => {
        if (!log.target_user_id && !log.company_id) {
          return <span className="text-slate-600 text-xs">—</span>;
        }
        return (
          <div className="text-[11px] font-mono text-slate-300 space-y-0.5">
            {log.target_user_id && (
              <div className="truncate max-w-[160px]" title={`Target User: ${log.target_user_id}`}>
                <span className="text-slate-500">User:</span> {log.target_user_id.slice(0, 8)}...
              </div>
            )}
            {log.company_id && (
              <div className="truncate max-w-[160px]" title={`Company: ${log.company_id}`}>
                <span className="text-slate-500">Comp:</span> {log.company_id}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "entity",
      header: "Entity",
      render: (log) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={log.entity_type} />
          <span className="font-mono text-[11px] text-slate-400 truncate max-w-[140px]" title={log.entity_id}>
            {log.entity_id}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Inspect",
      className: "text-right",
      render: (log) => (
        <button
          onClick={() => setInspectLog(log)}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
          title="Inspect Diff & Payload"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Security Indicator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Immutable Platform Audit Ledger
            </h3>
            <p className="text-xs text-slate-400">
              Cryptographically verified, append-only PostgreSQL security log with recursive credential redaction.
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchLogs()}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition self-end sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-orange-400" : ""}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by action, actor, entity ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Role Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Actor Role</label>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Roles</option>
              <option value="candidate">Candidate</option>
              <option value="company">Company</option>
              <option value="admin">Admin</option>
              <option value="system">System</option>
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Entity Type</label>
            <select
              value={entityFilter}
              onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Entities</option>
              <option value="candidate">Candidate</option>
              <option value="company">Company</option>
              <option value="job">Job</option>
              <option value="application">Application</option>
              <option value="bid">Talent Bid</option>
              <option value="template">Template</option>
              <option value="support_session">Support Session</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Support Mode Toggle */}
          <div className="col-span-2 flex items-end">
            <label className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 cursor-pointer w-full hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={supportModeOnly}
                onChange={(e) => { setSupportModeOnly(e.target.checked); setPage(1); }}
                className="rounded border-slate-700 text-orange-500 focus:ring-orange-500"
              />
              <span className="font-semibold text-amber-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Support Sessions Only
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        data={logs}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No audit logs matched your query."
      />

      {/* Pagination Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-2">
        <div>
          Showing {logs.length} of {totalCount} total audit records
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 rounded-lg font-medium text-slate-200 transition"
          >
            Previous
          </button>
          <span className="font-mono text-white px-2">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={logs.length < pageSize || isLoading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 rounded-lg font-medium text-slate-200 transition"
          >
            Next
          </button>
        </div>
      </div>

      {/* Event Details & Diff Inspector Modal */}
      {inspectLog && (
        <AdminModal
          isOpen={!!inspectLog}
          onClose={() => setInspectLog(null)}
          title={`Audit Event: ${inspectLog.action}`}
        >
          <div className="space-y-5 text-xs text-slate-300">
            {/* Metadata Summary Banner */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-mono text-[11px]">Event ID: {inspectLog.id}</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {new Date(inspectLog.created_at).toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-900">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Actor (Real Identity)</span>
                  <span className="text-white font-mono font-semibold">{inspectLog.actor_email || inspectLog.actor_id}</span>
                  <span className="text-slate-500 text-[10px] block">Role: {inspectLog.actor_role}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Target Entity</span>
                  <span className="text-orange-400 font-mono font-semibold">{inspectLog.entity_type}</span>
                  <span className="text-slate-400 text-[10px] font-mono block truncate">{inspectLog.entity_id}</span>
                </div>
              </div>

              {/* Support Session Info (if applicable) */}
              {(inspectLog.metadata?.is_support_session || inspectLog.action.startsWith("support_session")) && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 mt-2">
                  <div className="font-bold flex items-center gap-1.5 text-[11px]">
                    <ShieldAlert className="w-3.5 h-3.5" /> Action Performed Under Support Mode
                  </div>
                  {inspectLog.metadata?.support_session_id && (
                    <div className="font-mono text-[10px] text-amber-300/80 mt-0.5">
                      Session ID: {inspectLog.metadata.support_session_id}
                    </div>
                  )}
                  {inspectLog.metadata?.support_reason && (
                    <div className="italic text-[10px] text-amber-200 mt-0.5">
                      Reason: "{inspectLog.metadata.support_reason}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Side-by-Side State Diff */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-2">
                <span>State Transition Diff</span>
                <span className="text-[10px] text-slate-500 font-normal normal-case">(Sanitized)</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Previous State (old_data) */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Previous State (old_data)</span>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-400 overflow-x-auto max-h-48">
                    {inspectLog.old_data && Object.keys(inspectLog.old_data).length > 0
                      ? JSON.stringify(inspectLog.old_data, null, 2)
                      : "/* No prior snapshot */"}
                  </pre>
                </div>

                {/* New State (new_data) */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">New State (new_data)</span>
                  <pre className="p-3 bg-slate-950 border border-emerald-900/40 rounded-xl font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-48">
                    {inspectLog.new_data && Object.keys(inspectLog.new_data).length > 0
                      ? JSON.stringify(inspectLog.new_data, null, 2)
                      : "/* No modification recorded */"}
                  </pre>
                </div>
              </div>
            </div>

            {/* Metadata Payload */}
            <div className="space-y-1">
              <h4 className="font-bold text-white text-[11px] uppercase tracking-wider">
                Full Event Metadata
              </h4>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-amber-300/80 overflow-x-auto max-h-48">
                {JSON.stringify(inspectLog.metadata || {}, null, 2)}
              </pre>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
};
