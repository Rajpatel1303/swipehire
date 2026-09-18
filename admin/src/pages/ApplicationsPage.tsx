import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  User,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Video,
  ArrowRight,
} from "lucide-react";
import { ApplicationRecord } from "../types";
import { AdminApi } from "../services/adminApi";
import { DataTable, Column } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { AdminModal } from "../components/common/AdminModal";
import { SupportSessionLauncher } from "../components/common/SupportSessionLauncher";
import { useAdmin } from "../app/AdminContext";

export const ApplicationsPage: React.FC = () => {
  const { refreshMetrics } = useAdmin();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedStage, setSelectedStage] = useState<string>("all");

  // Selected application for inspection modal
  const [inspectApp, setInspectApp] = useState<ApplicationRecord | null>(null);

  // Status update state
  const [newStatus, setNewStatus] = useState<string>("");
  const [newStage, setNewStage] = useState<string>("");
  const [statusNote, setStatusNote] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  // Confirm dialog state
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

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const data = await AdminApi.getApplications();
      const list = Array.isArray(data) ? data : ((data as any)?.applications || []);
      setApplications(list);
    } catch (err) {
      console.error("[Applications Page Error]:", err);
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    if (!Array.isArray(applications)) return [];
    return applications.filter((app) => {
      if (selectedStatus !== "all" && app.status !== selectedStatus) return false;
      if (selectedStage !== "all" && app.currentStage !== selectedStage) return false;
      return true;
    });
  }, [applications, selectedStatus, selectedStage]);

  const handleOpenInspect = (app: ApplicationRecord) => {
    setInspectApp(app);
    setNewStatus(app.status);
    setNewStage(app.currentStage || "applied");
    setStatusNote("");
  };

  const handleSaveStatus = () => {
    if (!inspectApp) return;

    setConfirmState({
      isOpen: true,
      title: "Update Application Status / Stage",
      message: `Change application for ${inspectApp.candidateName || "Candidate"} to status "${newStatus}" and stage "${newStage}".`,
      isDestructive: newStatus === "rejected" || newStatus === "withdrawn",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await AdminApi.updateApplicationStatus(
            inspectApp.id,
            newStatus,
            newStage,
            statusNote || "Updated via Admin Console"
          );
          await fetchApplications();
          await refreshMetrics();
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          setInspectApp(null);
        } catch (err: any) {
          alert(`Update failed: ${err.message}`);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const columns: Column<ApplicationRecord>[] = [
    {
      header: "Candidate",
      accessor: (a) => (
        <div>
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span>{a.candidateName || "Candidate"}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {a.candidateEmail || a.candidateId}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Role & Company",
      accessor: (a) => (
        <div>
          <div className="text-xs font-bold text-white truncate max-w-[200px]">
            {a.jobTitle || "Job Listing"}
          </div>
          <div className="text-[11px] text-orange-400 font-medium flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            <span>{a.companyName || "Employer"}</span>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Status / Stage",
      accessor: (a) => (
        <div className="space-y-1">
          <StatusBadge status={a.status} />
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Stage: {a.currentStage || "applied"}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Interview",
      accessor: (a) => {
        if (!a.interviewDetails) {
          return <span className="text-[11px] text-slate-500 italic">None Scheduled</span>;
        }
        return (
          <div className="text-xs space-y-0.5">
            <div className="flex items-center gap-1 text-emerald-400 font-bold">
              <Calendar className="w-3 h-3" />
              <span>{a.interviewDetails.date || "Scheduled"}</span>
            </div>
            {a.interviewDetails.time && (
              <div className="text-[10px] text-slate-400">{a.interviewDetails.time}</div>
            )}
          </div>
        );
      },
    },
    {
      header: "Applied Date",
      accessor: (a) => (
        <div className="text-xs text-slate-300">
          <div>{new Date(a.createdAt).toLocaleDateString()}</div>
          <div className="text-[10px] text-slate-500">
            {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Actions",
      accessor: (a) => (
        <button
          onClick={() => handleOpenInspect(a)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1 text-xs"
          title="Inspect Application"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Inspect</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Filters */}
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
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="offered">Offered</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Stage Filter
            </label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">All Stages</option>
              <option value="applied">Applied</option>
              <option value="screening">Screening</option>
              <option value="technical">Technical</option>
              <option value="manager">Manager</option>
              <option value="offer">Offer</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchApplications}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
        >
          Refresh Applications
        </button>
      </div>

      {/* Applications Table */}
      <DataTable
        data={filteredApplications}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search by candidate, role, company..."
        searchFilter={(a, q) =>
          (a.candidateName || "").toLowerCase().includes(q) ||
          (a.candidateEmail || "").toLowerCase().includes(q) ||
          (a.jobTitle || "").toLowerCase().includes(q) ||
          (a.companyName || "").toLowerCase().includes(q) ||
          a.status.toLowerCase().includes(q)
        }
      />

      {/* Application Inspection Modal */}
      {inspectApp && (
        <AdminModal
          isOpen={!!inspectApp}
          onClose={() => setInspectApp(null)}
          title={`Application #${inspectApp.id.substring(0, 8)}`}
          subtitle={`${inspectApp.candidateName || "Candidate"} &rarr; ${inspectApp.jobTitle || "Role"}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Top overview boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Candidate</span>
                <p className="text-white font-bold mt-0.5">{inspectApp.candidateName || "Candidate"}</p>
                <p className="text-[11px] text-slate-400 font-mono">{inspectApp.candidateEmail}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Company / Role</span>
                <p className="text-white font-bold mt-0.5">{inspectApp.companyName || "Employer"}</p>
                <p className="text-[11px] text-slate-400">{inspectApp.jobTitle}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Submitted</span>
                <p className="text-white font-mono mt-0.5">
                  {new Date(inspectApp.createdAt).toLocaleDateString()}
                </p>
                <div className="mt-1">
                  <StatusBadge status={inspectApp.status} />
                </div>
              </div>
            </div>

            {/* Scheduled Interview Details if present */}
            {inspectApp.interviewDetails && (
              <div className="bg-slate-950 border border-emerald-500/20 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" />
                  Scheduled Interview Details
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Date & Time</span>
                    <span className="text-white font-bold">
                      {inspectApp.interviewDetails.date || "N/A"} {inspectApp.interviewDetails.time || ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Meeting Format</span>
                    <span className="text-slate-300">
                      {inspectApp.interviewDetails.type || "Online Video"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Status</span>
                    <span className="text-emerald-400 font-bold">
                      {inspectApp.interviewDetails.status || "Confirmed"}
                    </span>
                  </div>
                </div>
                {inspectApp.interviewDetails.meetingLink && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Meeting Link</span>
                    <a
                      href={inspectApp.interviewDetails.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-orange-400 underline font-mono break-all"
                    >
                      {inspectApp.interviewDetails.meetingLink}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Timeline Trail */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                Application Timeline
              </span>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 max-h-44 overflow-y-auto space-y-3">
                {inspectApp.timeline && inspectApp.timeline.length > 0 ? (
                  inspectApp.timeline.map((event, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white uppercase text-[11px]">{event.stage || event.status}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {event.timestamp ? new Date(event.timestamp).toLocaleString() : "Recorded"}
                          </span>
                        </div>
                        {event.note && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{event.note}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">Initial application submission recorded.</div>
                )}
              </div>
            </div>

            {/* Admin Intervention / Status Override */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Administrative Status Override
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Update Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
                  >
                    <option value="applied">Applied</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interview_scheduled">Interview Scheduled</option>
                    <option value="offered">Offered</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Update Stage
                  </label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
                  >
                    <option value="applied">Applied</option>
                    <option value="screening">Screening</option>
                    <option value="technical">Technical</option>
                    <option value="manager">Manager</option>
                    <option value="offer">Offer</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Reason / Audit Note
                </label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g., Manually advanced after offline client interview confirmation..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSaveStatus}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer"
                >
                  Save Status Change
                </button>
              </div>
            </div>

            {/* Launch Support Session */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2">
                Reproduce Issue via Support Mode
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SupportSessionLauncher
                  targetUserId={inspectApp.candidateId}
                  targetRole="candidate"
                  targetEntityId={inspectApp.candidateId}
                  targetName={inspectApp.candidateName || "Candidate"}
                />
                <SupportSessionLauncher
                  targetUserId={inspectApp.companyId}
                  targetRole="company"
                  targetEntityId={inspectApp.companyId}
                  targetName={inspectApp.companyName || "Company"}
                />
              </div>
            </div>
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
