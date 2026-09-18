import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  Video,
  User,
  Building2,
  Briefcase,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Edit,
  AlertCircle,
} from "lucide-react";
import { InterviewRecord } from "../types";
import { AdminApi } from "../services/adminApi";
import { DataTable, Column } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { AdminModal } from "../components/common/AdminModal";
import { SupportSessionLauncher } from "../components/common/SupportSessionLauncher";
import { useAdmin } from "../app/AdminContext";

export const InterviewsPage: React.FC = () => {
  const { refreshMetrics } = useAdmin();
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Time and status filters
  const [timeFilter, setTimeFilter] = useState<"all" | "upcoming" | "today" | "past">("upcoming");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Reschedule Modal State
  const [rescheduleInterview, setRescheduleInterview] = useState<InterviewRecord | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newMeetingLink, setNewMeetingLink] = useState("");
  const [adminNote, setAdminNote] = useState("");

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

  const [actionLoading, setActionLoading] = useState(false);

  const fetchInterviews = async () => {
    setIsLoading(true);
    try {
      const data = await AdminApi.getInterviews(timeFilter);
      const list = Array.isArray(data) ? data : ((data as any)?.interviews || []);
      setInterviews(list);
    } catch (err) {
      console.error("[Interviews Page Error]:", err);
      setInterviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [timeFilter]);

  const filteredInterviews = useMemo(() => {
    if (!Array.isArray(interviews)) return [];
    return interviews.filter((item) => {
      if (statusFilter !== "all" && (item.interviewDetails.status || "scheduled") !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [interviews, statusFilter]);

  const handleOpenReschedule = (interview: InterviewRecord) => {
    setRescheduleInterview(interview);
    setNewDate(interview.interviewDetails.date || "");
    setNewTime(interview.interviewDetails.time || "");
    setNewMeetingLink(interview.interviewDetails.meetingLink || "");
    setAdminNote("");
  };

  const handleExecuteReschedule = async () => {
    if (!rescheduleInterview) return;

    setActionLoading(true);
    try {
      await AdminApi.updateInterviewAction(rescheduleInterview.id, "reschedule", {
        date: newDate,
        time: newTime,
        meetingLink: newMeetingLink,
        note: adminNote || "Rescheduled by platform administrator",
      });
      await fetchInterviews();
      await refreshMetrics();
      setRescheduleInterview(null);
    } catch (err: any) {
      alert(`Reschedule failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelInterview = (interview: InterviewRecord) => {
    setConfirmState({
      isOpen: true,
      title: "Cancel Interview",
      message: `Cancel the interview between ${interview.candidateName || "Candidate"} and ${interview.companyName || "Employer"}?`,
      isDestructive: true,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await AdminApi.updateInterviewAction(interview.id, "cancel", {
            note: "Cancelled by platform administrator",
          });
          await fetchInterviews();
          await refreshMetrics();
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          alert(`Cancellation failed: ${err.message}`);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleCompleteInterview = (interview: InterviewRecord) => {
    setConfirmState({
      isOpen: true,
      title: "Mark Interview as Completed",
      message: `Record completion for this interview round?`,
      isDestructive: false,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await AdminApi.updateInterviewAction(interview.id, "complete", {
            note: "Marked completed by platform administrator",
          });
          await fetchInterviews();
          await refreshMetrics();
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          alert(`Action failed: ${err.message}`);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const columns: Column<InterviewRecord>[] = [
    {
      header: "Interview Schedule",
      accessor: (i) => (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Calendar className="w-3.5 h-3.5 text-orange-400" />
            <span>{i.interviewDetails.date || "Not set"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{i.interviewDetails.time || "Time unrecorded"}</span>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Candidate",
      accessor: (i) => (
        <div>
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span>{i.candidateName || "Candidate"}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {i.candidateEmail || i.candidateId}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Employer & Role",
      accessor: (i) => (
        <div>
          <div className="text-xs font-bold text-white truncate max-w-[180px]">
            {i.jobTitle || "Job Listing"}
          </div>
          <div className="text-[11px] text-orange-400 font-medium flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            <span>{i.companyName || "Employer"}</span>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Meeting Link",
      accessor: (i) => {
        const link = i.interviewDetails.meetingLink;
        if (!link) {
          return <span className="text-[11px] text-amber-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Missing link</span>;
        }
        return (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono transition"
          >
            <Video className="w-3.5 h-3.5 text-orange-400" />
            <span>Join Call</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        );
      },
    },
    {
      header: "Status",
      accessor: (i) => (
        <StatusBadge status={i.interviewDetails.status || "scheduled"} />
      ),
      sortable: true,
    },
    {
      header: "Actions",
      accessor: (i) => {
        const status = i.interviewDetails.status || "scheduled";
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleOpenReschedule(i)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Reschedule Interview"
            >
              <Edit className="w-4 h-4" />
            </button>
            {status !== "completed" && (
              <button
                onClick={() => handleCompleteInterview(i)}
                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition cursor-pointer"
                title="Mark Completed"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
            {status !== "cancelled" && (
              <button
                onClick={() => handleCancelInterview(i)}
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                title="Cancel Interview"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Time Horizon
            </label>
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
              {(["upcoming", "today", "past", "all"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeFilter(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer capitalize ${
                    timeFilter === t
                      ? "bg-orange-500 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Interview Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchInterviews}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
        >
          Refresh Interviews
        </button>
      </div>

      {/* Interviews Data Table */}
      <DataTable
        data={filteredInterviews}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search interviews by candidate, company, role..."
        searchFilter={(i, q) =>
          (i.candidateName || "").toLowerCase().includes(q) ||
          (i.candidateEmail || "").toLowerCase().includes(q) ||
          (i.companyName || "").toLowerCase().includes(q) ||
          (i.jobTitle || "").toLowerCase().includes(q) ||
          (i.interviewDetails.date || "").toLowerCase().includes(q)
        }
      />

      {/* Reschedule Administrative Modal */}
      {rescheduleInterview && (
        <AdminModal
          isOpen={!!rescheduleInterview}
          onClose={() => setRescheduleInterview(null)}
          title="Administrative Interview Rescheduling"
          subtitle={`Candidate: ${rescheduleInterview.candidateName || "Candidate"} • Employer: ${rescheduleInterview.companyName || "Employer"}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                New Date (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                New Time (e.g., 10:30 AM EST)
              </label>
              <input
                type="text"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                placeholder="10:30 AM EST"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Meeting Link (Zoom / Google Meet / Teams)
              </label>
              <input
                type="url"
                value={newMeetingLink}
                onChange={(e) => setNewMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Reason / Audit Note
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Reason for administrative schedule modification..."
                className="w-full h-20 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setRescheduleInterview(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReschedule}
                disabled={actionLoading || !newDate}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Updating..." : "Confirm Reschedule"}
              </button>
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
