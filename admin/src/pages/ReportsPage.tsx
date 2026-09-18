import React, { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Briefcase,
  User,
  Building2,
  ExternalLink,
  MessageSquare,
  Eye,
  Flame,
  Tag,
} from "lucide-react";
import { ReportRecord } from "../types";
import { AdminApi } from "../services/adminApi";
import { DataTable, Column } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { AdminModal } from "../components/common/AdminModal";
import { SupportSessionLauncher } from "../components/common/SupportSessionLauncher";
import { useAdmin } from "../app/AdminContext";

export const ReportsPage: React.FC = () => {
  const { refreshMetrics, hasPermission } = useAdmin();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTargetType, setSelectedTargetType] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Selected report for inspection / resolution modal
  const [inspectReport, setInspectReport] = useState<ReportRecord | null>(null);

  // Action dialog state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: async () => {},
  });

  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await AdminApi.getReports();
      const list = Array.isArray(data) ? data : ((data as any)?.reports || []);
      setReports(list);
    } catch (err) {
      console.error("[Reports Page Error]:", err);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = useMemo(() => {
    if (!Array.isArray(reports)) return [];
    return reports.filter((r) => {
      if (selectedStatus !== "all" && r.status !== selectedStatus) return false;
      if (selectedTargetType !== "all" && r.targetType !== selectedTargetType) return false;
      if (selectedPriority !== "all" && (r.priority || "normal") !== selectedPriority) return false;
      if (selectedCategory !== "all" && (r.category || "other") !== selectedCategory) return false;
      return true;
    });
  }, [reports, selectedStatus, selectedTargetType, selectedPriority, selectedCategory]);

  const handleUpdatePriority = async (reportId: string, priority: "high" | "normal" | "low") => {
    try {
      await AdminApi.updateReportPriority(reportId, priority);
      await fetchReports();
      if (inspectReport?.id === reportId) {
        setInspectReport((prev) => prev ? { ...prev, priority } : null);
      }
    } catch (err: any) {
      alert(`Failed to update priority: ${err.message}`);
    }
  };

  const handleUpdateStatus = (report: ReportRecord, newStatus: ReportRecord["status"]) => {
    setConfirmState({
      isOpen: true,
      title: `Mark Report as ${newStatus.toUpperCase()}`,
      message: `Update report #${report.id.substring(0, 8)} status to ${newStatus}.`,
      isDestructive: newStatus === "dismissed",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await AdminApi.updateReportStatus(report.id, newStatus, adminNotes);
          setAdminNotes("");
          await fetchReports();
          await refreshMetrics();
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          if (inspectReport?.id === report.id) {
            setInspectReport((prev) => prev ? { ...prev, status: newStatus } : null);
          }
        } catch (err: any) {
          alert(`Status update failed: ${err.message}`);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleTakeAction = (
    report: ReportRecord,
    action: "suspend_candidate" | "suspend_company" | "close_job"
  ) => {
    const actionLabel =
      action === "suspend_candidate"
        ? "Suspend Candidate"
        : action === "suspend_company"
        ? "Suspend Company"
        : "Close Job Listing";

    setConfirmState({
      isOpen: true,
      title: `Disciplinary Action: ${actionLabel}`,
      message: `This will execute "${actionLabel}" on the reported target and resolve this report. Are you sure?`,
      isDestructive: true,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await AdminApi.takeReportAction(report.id, action, adminNotes);
          setAdminNotes("");
          await fetchReports();
          await refreshMetrics();
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          setInspectReport(null);
        } catch (err: any) {
          alert(`Disciplinary action failed: ${err.message}`);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const columns: Column<ReportRecord>[] = [
    {
      header: "Report ID & Date",
      accessor: (r) => (
        <div>
          <div className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>#{r.id.substring(0, 8)}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Target Entity",
      accessor: (r) => {
        const getIcon = () => {
          switch (r.targetType) {
            case "candidate":
              return <User className="w-3.5 h-3.5 text-blue-400" />;
            case "company":
              return <Building2 className="w-3.5 h-3.5 text-orange-400" />;
            case "job":
              return <Briefcase className="w-3.5 h-3.5 text-emerald-400" />;
            default:
              return <Shield className="w-3.5 h-3.5 text-slate-400" />;
          }
        };

        return (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 uppercase">
              {getIcon()}
              <span>{r.targetType}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 truncate max-w-[160px]" title={r.targetId}>
              {r.targetId}
            </div>
          </div>
        );
      },
    },
    {
      header: "Reason & Details",
      accessor: (r) => (
        <div className="max-w-md">
          <div className="text-xs font-bold text-white truncate">{r.reason}</div>
          {r.description && (
            <div className="text-[11px] text-slate-400 line-clamp-1">{r.description}</div>
          )}
          <div className="text-[10px] text-slate-500 mt-0.5">
            Reported by: <span className="font-mono text-slate-400">{r.reportedBy?.substring(0, 8) || "Anonymous"}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Priority",
      accessor: (r) => {
        const priority = r.priority || "normal";
        const badgeColor =
          priority === "high"
            ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
            : priority === "low"
            ? "bg-slate-800 text-slate-400 border-slate-700"
            : "bg-blue-500/20 text-blue-300 border-blue-500/30";

        if (!hasPermission("reports.manage")) {
          return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border uppercase ${badgeColor}`}>
              {priority === "high" && <Flame className="w-3 h-3 text-rose-400" />}
              {priority}
            </span>
          );
        }

        return (
          <select
            value={priority}
            onChange={(e) => handleUpdatePriority(r.id, e.target.value as any)}
            className={`px-2 py-0.5 rounded-md text-[11px] font-bold border uppercase bg-slate-950 focus:outline-hidden ${badgeColor}`}
          >
            <option value="high" className="bg-slate-900 text-rose-400">High</option>
            <option value="normal" className="bg-slate-900 text-blue-400">Normal</option>
            <option value="low" className="bg-slate-900 text-slate-400">Low</option>
          </select>
        );
      },
      sortable: true,
    },
    {
      header: "Category",
      accessor: (r) => (
        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 uppercase">
          {r.category || "other"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (r) => <StatusBadge status={r.status} />,
      sortable: true,
    },
    {
      header: "Actions",
      accessor: (r) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setInspectReport(r)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Inspect Report"
          >
            <Eye className="w-4 h-4" />
          </button>
          {r.status === "pending" && (
            <button
              onClick={() => handleUpdateStatus(r, "investigating")}
              className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[11px] font-bold border border-blue-500/20 transition cursor-pointer"
            >
              Investigate
            </button>
          )}
          {r.status !== "resolved" && (
            <button
              onClick={() => handleUpdateStatus(r, "resolved")}
              className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/20 transition cursor-pointer"
            >
              Resolve
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Controls & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Status Filter
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Target Entity
            </label>
            <select
              value={selectedTargetType}
              onChange={(e) => setSelectedTargetType(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">All Targets</option>
              <option value="candidate">Candidate</option>
              <option value="company">Company</option>
              <option value="job">Job Listing</option>
              <option value="application">Application</option>
              <option value="platform">Platform</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">All Categories</option>
              <option value="harassment">Harassment</option>
              <option value="spam">Spam</option>
              <option value="fraud">Fraud / Scam</option>
              <option value="inappropriate_content">Inappropriate Content</option>
              <option value="terms_violation">Terms Violation</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchReports}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
        >
          Refresh Reports
        </button>
      </div>

      {/* Reports Table */}
      <DataTable
        data={filteredReports}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search reports by reason, target ID, reporter..."
        searchFilter={(r, q) =>
          r.reason.toLowerCase().includes(q) ||
          r.targetId.toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q) ||
          (r.reportedBy || "").toLowerCase().includes(q)
        }
      />

      {/* Detailed Report Inspection Modal */}
      {inspectReport && (
        <AdminModal
          isOpen={!!inspectReport}
          onClose={() => setInspectReport(null)}
          title={`Safety Report #${inspectReport.id.substring(0, 8)}`}
          subtitle={`Target: ${inspectReport.targetType.toUpperCase()} • ID: ${inspectReport.targetId}`}
          maxWidth="xl"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Status</span>
                <div className="mt-1">
                  <StatusBadge status={inspectReport.status} />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Submitted Date</span>
                <p className="text-white mt-1">
                  {new Date(inspectReport.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Reported By</span>
                <p className="text-slate-300 font-mono mt-1">
                  {inspectReport.reportedBy || "Anonymous User"}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Target ID</span>
                <p className="text-slate-300 font-mono mt-1 break-all">
                  {inspectReport.targetId}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Category</span>
                <p className="text-slate-300 font-mono mt-1 uppercase">
                  {inspectReport.category || "other"}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Priority</span>
                <div className="mt-1">
                  {hasPermission("reports.manage") ? (
                    <select
                      value={inspectReport.priority || "normal"}
                      onChange={(e) => handleUpdatePriority(inspectReport.id, e.target.value as any)}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-hidden"
                    >
                      <option value="high">High Priority</option>
                      <option value="normal">Normal Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  ) : (
                    <span className="text-xs font-bold uppercase text-slate-300">
                      {inspectReport.priority || "normal"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Violation Details */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                Reported Reason
              </span>
              <p className="text-sm font-bold text-rose-400">{inspectReport.reason}</p>
              {inspectReport.description && (
                <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 whitespace-pre-wrap">
                  {inspectReport.description}
                </div>
              )}
            </div>

            {/* Admin Notes / Action Log */}
            {inspectReport.adminNotes && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Admin Resolution Notes
                </span>
                <p className="text-xs text-slate-300 whitespace-pre-wrap">{inspectReport.adminNotes}</p>
              </div>
            )}

            {/* Admin Decision Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Add Resolution / Action Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Document investigation outcome or reasoning for action..."
                className="w-full h-20 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
              />
            </div>

            {/* Actions Toolbar */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                Disciplinary & Governance Actions
              </span>
              <div className="flex flex-wrap gap-2">
                {inspectReport.targetType === "candidate" && (
                  <button
                    onClick={() => handleTakeAction(inspectReport, "suspend_candidate")}
                    className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Suspend Candidate</span>
                  </button>
                )}

                {inspectReport.targetType === "company" && (
                  <button
                    onClick={() => handleTakeAction(inspectReport, "suspend_company")}
                    className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Suspend Company</span>
                  </button>
                )}

                {inspectReport.targetType === "job" && (
                  <button
                    onClick={() => handleTakeAction(inspectReport, "close_job")}
                    className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Close Listing</span>
                  </button>
                )}

                {inspectReport.status !== "investigating" && (
                  <button
                    onClick={() => handleUpdateStatus(inspectReport, "investigating")}
                    className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Mark Investigating</span>
                  </button>
                )}

                {inspectReport.status !== "resolved" && (
                  <button
                    onClick={() => handleUpdateStatus(inspectReport, "resolved")}
                    className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Resolved</span>
                  </button>
                )}

                {inspectReport.status !== "dismissed" && (
                  <button
                    onClick={() => handleUpdateStatus(inspectReport, "dismissed")}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Dismiss Report</span>
                  </button>
                )}
              </div>
            </div>

            {/* Launch Support Session if Candidate or Company */}
            {(inspectReport.targetType === "candidate" || inspectReport.targetType === "company") && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2">
                  Verify State in User Session
                </span>
                <SupportSessionLauncher
                  targetUserId={inspectReport.targetId}
                  targetRole={inspectReport.targetType as "candidate" | "company"}
                  targetEntityId={inspectReport.targetId}
                  targetName={`Reported ${inspectReport.targetType} (#${inspectReport.id.substring(0, 8)})`}
                />
              </div>
            )}
          </div>
        </AdminModal>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        isDestructive={confirmState.isDestructive}
        isLoading={actionLoading}
      />
    </div>
  );
};
