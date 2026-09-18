import React, { useState, useEffect, useMemo } from "react";
import {
  Briefcase,
  Building2,
  MapPin,
  CheckCircle2,
  Ban,
  Trash2,
  Sparkles,
  Eye,
  Star,
  User,
  Users,
} from "lucide-react";
import { JobRecord, ApplicationRecord } from "../types";
import { AdminApi } from "../services/adminApi";
import { DataTable, Column } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { AdminModal } from "../components/common/AdminModal";
import { useAdmin } from "../app/AdminContext";

export const JobsPage: React.FC = () => {
  const { refreshMetrics } = useAdmin();
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const [inspectJob, setInspectJob] = useState<JobRecord | null>(null);
  const [jobTab, setJobTab] = useState<"spec" | "applicants">("spec");
  const [jobApplicants, setJobApplicants] = useState<ApplicationRecord[]>([]);
  const [jobApplicantsLoading, setJobApplicantsLoading] = useState(false);

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

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const data = await AdminApi.getJobs();
      setJobs(data);
    } catch (err) {
      console.error("[Jobs Page Error]:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const allCompanies = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.companyName) set.add(j.companyName);
    });
    return Array.from(set).sort();
  }, [jobs]);

  const allTypes = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.type) set.add(j.type);
    });
    return Array.from(set).sort();
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (selectedStatus !== "all" && j.status !== selectedStatus) return false;
      if (selectedCompany !== "all" && (j.companyName || "").toLowerCase() !== selectedCompany.toLowerCase()) return false;
      if (selectedType !== "all" && (j.type || "").toLowerCase() !== selectedType.toLowerCase()) return false;
      return true;
    });
  }, [jobs, selectedStatus, selectedCompany, selectedType]);

  // Actions
  const handleUpdateStatus = (job: JobRecord, newStatus: "active" | "draft" | "paused" | "closed") => {
    setConfirmState({
      isOpen: true,
      title: `Update Job Status to ${newStatus.toUpperCase()}`,
      message: `Change posting status of "${job.title}" at ${job.companyName} to ${newStatus}.`,
      isDestructive: newStatus === "closed" || newStatus === "paused",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await AdminApi.updateJobStatus(job.id, newStatus);
          await fetchJobs();
          await refreshMetrics();
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          alert(`Status update failed: ${err.message}`);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleToggleFeatured = async (job: JobRecord) => {
    const willFeature = !job.isFeatured;
    try {
      await AdminApi.toggleJobFeatured(job.id, willFeature);
      await fetchJobs();
      await refreshMetrics();
    } catch (err: any) {
      alert(`Feature toggle failed: ${err.message}`);
    }
  };

  const handleDeleteJob = (job: JobRecord) => {
    setConfirmState({
      isOpen: true,
      title: "Delete Job Posting",
      message: `Permanently delete "${job.title}" from the platform. Existing candidate applications for this role will be affected.`,
      isDestructive: true,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await AdminApi.deleteJob(job.id);
          await fetchJobs();
          await refreshMetrics();
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          alert(`Job deletion failed: ${err.message}`);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const columns: Column<JobRecord>[] = [
    {
      key: "title",
      header: "Position & Company",
      render: (j) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-slate-300 shrink-0">
            <Briefcase className="w-4 h-4 text-orange-400" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
              <span>{j.title}</span>
              {j.isFeatured && (
                <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" title="Featured Listing" />
              )}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
              <Building2 className="w-3 h-3 text-slate-500" />
              <span>{j.companyName}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location & Mode",
      render: (j) => (
        <div>
          <div className="text-white text-xs font-semibold">{j.location || "Remote"}</div>
          <div className="text-[11px] text-slate-400 font-mono">{j.workMode}</div>
        </div>
      ),
    },
    {
      key: "salary",
      header: "Budget / Salary",
      render: (j) => (
        <span className="font-mono text-xs font-bold text-emerald-400">
          {j.salary}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (j) => <StatusBadge status={j.status} />,
    },
    {
      key: "actions",
      header: "Moderation",
      className: "text-right",
      render: (j) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setInspectJob(j)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
            title="Inspect Job Requirements"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleToggleFeatured(j)}
            className={`p-1.5 rounded-lg transition ${
              j.isFeatured
                ? "bg-amber-500/20 text-amber-400"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
            title={j.isFeatured ? "Unfeature Role" : "Feature Role"}
          >
            <Star className="w-3.5 h-3.5" />
          </button>
          {j.status !== "active" ? (
            <button
              onClick={() => handleUpdateStatus(j, "active")}
              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition"
              title="Approve & Activate"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => handleUpdateStatus(j, "paused")}
              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition"
              title="Pause Listing"
            >
              <Ban className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => handleDeleteJob(j)}
            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
            title="Delete Job"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
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
              <option value="all">All Postings ({jobs.length})</option>
              <option value="active">Active ({jobs.filter((j) => j.status === "active").length})</option>
              <option value="draft">Draft ({jobs.filter((j) => j.status === "draft").length})</option>
              <option value="paused">Paused ({jobs.filter((j) => j.status === "paused").length})</option>
              <option value="closed">Closed ({jobs.filter((j) => j.status === "closed").length})</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Employer Filter
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500 max-w-[180px]"
            >
              <option value="all">All Employers</option>
              {allCompanies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Workplace / Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">All Types</option>
              {allTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={fetchJobs}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
        >
          Refresh Jobs
        </button>
      </div>

      {/* Jobs Data Table */}
      <DataTable
        data={filteredJobs}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search jobs by title, company, skills..."
        searchFilter={(j, q) =>
          j.title.toLowerCase().includes(q) ||
          (j.companyName || "").toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          (j.requiredSkills || []).some((s) => s.toLowerCase().includes(q))
        }
      />

      {/* Job Details Modal with Specification & Applicants tabs */}
      {inspectJob && (
        <AdminModal
          isOpen={!!inspectJob}
          onClose={() => setInspectJob(null)}
          title={`Job Moderation: ${inspectJob.title}`}
          subtitle={`${inspectJob.companyName} · ID: ${inspectJob.id}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
              <button
                onClick={() => setJobTab("spec")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  jobTab === "spec"
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                Specification
              </button>
              <button
                onClick={() => {
                  setJobTab("applicants");
                  if (inspectJob) {
                    setJobApplicantsLoading(true);
                    AdminApi.getJobApplicants(inspectJob.id)
                      .then(setJobApplicants)
                      .catch(console.error)
                      .finally(() => setJobApplicantsLoading(false));
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  jobTab === "applicants"
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                Applicants ({inspectJob.applicantsCount})
              </button>
            </div>

            {jobTab === "spec" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="grid grid-cols-3 gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Salary Transparency</span>
                    <p className="text-xs text-emerald-400 font-mono font-bold">{inspectJob.salary}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Experience Required</span>
                    <p className="text-xs text-white">{inspectJob.experience || "Any"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Open Positions</span>
                    <p className="text-xs text-white font-mono">{inspectJob.openings} headcount</p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Job Description</span>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-300 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                    {inspectJob.description}
                  </div>
                </div>

                {inspectJob.requiredSkills && inspectJob.requiredSkills.length > 0 && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2">Required Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectJob.requiredSkills.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {jobTab === "applicants" && (
              <div className="space-y-4 animate-in fade-in duration-150 text-xs">
                {jobApplicantsLoading ? (
                  <div className="py-8 text-center text-slate-500">Loading applicants...</div>
                ) : jobApplicants.length > 0 ? (
                  <div className="space-y-2">
                    {jobApplicants.map((app) => (
                      <div key={app.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{app.candidateName || "Candidate"}</div>
                            <div className="text-[11px] font-mono text-slate-400">{app.candidateEmail}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Applied {new Date(app.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <StatusBadge status={app.status} />
                          <div className="text-[10px] text-slate-400 font-bold uppercase">
                            Stage: {app.currentStage || "applied"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500">No applicants for this job listing yet.</div>
                )}
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
