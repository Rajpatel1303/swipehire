import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Ban,
  Mail,
  MapPin,
  Users,
  Briefcase,
  Zap,
  ShieldAlert,
  FileText,
} from "lucide-react";
import { CompanyRecord, JobRecord, ApplicationRecord } from "../types";
import { AdminApi } from "../services/adminApi";
import { DataTable, Column } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { AdminModal } from "../components/common/AdminModal";
import { ActivityTimeline } from "../components/common/ActivityTimeline";
import { SupportSessionLauncher } from "../components/common/SupportSessionLauncher";
import { useAdmin } from "../app/AdminContext";

export const CompaniesPage: React.FC = () => {
  const { refreshMetrics } = useAdmin();
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  const [inspectCompany, setInspectCompany] = useState<CompanyRecord | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"overview" | "jobs" | "applications" | "activity" | "support">("overview");

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [companyToReject, setCompanyToReject] = useState<CompanyRecord | null>(null);

  // Inspector sub-data
  const [companyJobs, setCompanyJobs] = useState<JobRecord[]>([]);
  const [companyJobsLoading, setCompanyJobsLoading] = useState(false);
  const [companyApps, setCompanyApps] = useState<ApplicationRecord[]>([]);
  const [companyAppsLoading, setCompanyAppsLoading] = useState(false);

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

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const data = await AdminApi.getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error("[Companies Page Error]:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (verificationFilter === "verified" && !c.isVerified) return false;
      if (verificationFilter === "unverified" && c.isVerified) return false;
      return true;
    });
  }, [companies, verificationFilter]);

  // Actions
  const handleToggleVerify = (c: CompanyRecord) => {
    const willVerify = !c.isVerified;
    setConfirmState({
      isOpen: true,
      title: willVerify ? "Grant Verified Employer Badge" : "Revoke Employer Verification",
      message: willVerify
        ? `Grant Verified Employer status to ${c.companyName}. A verified badge will appear on all job postings.`
        : `Revoke verified employer badge from ${c.companyName}.`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await AdminApi.toggleCompanyVerification(c.id, willVerify);
          await fetchCompanies();
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

  const handleOpenReject = (c: CompanyRecord) => {
    setCompanyToReject(c);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleExecuteReject = async () => {
    if (!companyToReject || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await AdminApi.rejectCompanyVerification(companyToReject.id, rejectReason.trim());
      await fetchCompanies();
      await refreshMetrics();
      setRejectModalOpen(false);
      setRejectReason("");
      setCompanyToReject(null);
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuspend = (c: CompanyRecord) => {
    const willSuspend = !c.isSuspended;
    setConfirmState({
      isOpen: true,
      title: willSuspend ? "Suspend Employer Organization" : "Reactivate Employer Organization",
      message: willSuspend
        ? `Are you sure you want to suspend ${c.companyName}? All active job postings will be suppressed from candidate discovery.`
        : `Reactivate ${c.companyName}. Their active jobs will be restored.`,
      isDestructive: willSuspend,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await AdminApi.toggleCompanySuspension(c.id, willSuspend);
          await fetchCompanies();
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

  const columns: Column<CompanyRecord>[] = [
    {
      key: "companyName",
      header: "Employer Organization",
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-slate-300 shrink-0">
            {c.companyName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
              <span>{c.companyName}</span>
              {c.isVerified && (
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" title="Verified Employer" />
              )}
              {c.isSuspended && (
                <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[9px] font-black uppercase">
                  Suspended
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">{c.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "industry",
      header: "Industry & Location",
      render: (c) => (
        <div>
          <div className="text-white text-xs font-semibold">{c.industry || "Technology"}</div>
          <div className="text-[11px] text-slate-400">{c.location || "Remote"}</div>
        </div>
      ),
    },
    {
      key: "jobs",
      header: "Active Roles",
      render: (c) => (
        <span className="font-mono text-xs text-orange-400 font-bold">
          {c.activeJobCount || 0} active
        </span>
      ),
    },
    {
      key: "sla",
      header: "SLA Telemetry",
      render: (c) => {
        if (!c.slaInfo) {
          return <span className="text-slate-600 text-[11px]">No SLA Record</span>;
        }
        return (
          <div className="text-[11px] space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-500">Resp:</span>
              <span className="font-mono font-bold text-emerald-400">{c.slaInfo.avgResponseHours}h avg</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-slate-500">Ghosting:</span>
              <span className="font-mono">{c.slaInfo.ghostingRatePct}%</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "verification",
      header: "Status",
      render: (c) => (
        <div>
          {c.isVerified ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[10px] font-bold">
              Standard
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setInspectCompany(c)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
            title="Inspect Details"
          >
            <Briefcase className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleToggleVerify(c)}
            className={`p-1.5 rounded-lg transition ${
              c.isVerified
                ? "bg-sky-500/20 text-sky-400 hover:bg-sky-500/30"
                : "bg-slate-800 hover:bg-slate-700 text-slate-400"
            }`}
            title={c.isVerified ? "Revoke Verification" : "Verify Employer"}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </button>
          {!c.isVerified && (
            <button
              onClick={() => handleOpenReject(c)}
              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
              title="Reject Verification"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => handleToggleSuspend(c)}
            className={`p-1.5 rounded-lg transition ${
              c.isSuspended
                ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
            }`}
            title={c.isSuspended ? "Reactivate Company" : "Suspend Company"}
          >
            <Ban className="w-3.5 h-3.5" />
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
              Verification Status
            </label>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">All Employers</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchCompanies}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
        >
          Refresh Employers
        </button>
      </div>

      {/* Table */}
      <DataTable
        data={filteredCompanies}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search employers by company name, contact, industry..."
        searchFilter={(c, q) =>
          c.companyName.toLowerCase().includes(q) ||
          (c.contactPerson || "").toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.industry || "").toLowerCase().includes(q) ||
          (c.location || "").toLowerCase().includes(q)
        }
      />

      {/* Inspector Modal with Overview, Jobs, Applications, Activity, Support */}
      {inspectCompany && (
        <AdminModal
          isOpen={!!inspectCompany}
          onClose={() => setInspectCompany(null)}
          title={`Employer: ${inspectCompany.companyName}`}
          subtitle={`ID: ${inspectCompany.id} • User ID: ${inspectCompany.userId || "None"}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Tabs Header */}
            <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
              <button
                onClick={() => setInspectorTab("overview")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  inspectorTab === "overview"
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => {
                  setInspectorTab("jobs");
                  if (inspectCompany) {
                    setCompanyJobsLoading(true);
                    AdminApi.getCompanyJobs(inspectCompany.id)
                      .then(setCompanyJobs)
                      .catch(console.error)
                      .finally(() => setCompanyJobsLoading(false));
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  inspectorTab === "jobs"
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                Posted Jobs
              </button>
              <button
                onClick={() => {
                  setInspectorTab("applications");
                  if (inspectCompany) {
                    setCompanyAppsLoading(true);
                    AdminApi.getCompanyApplications(inspectCompany.id)
                      .then(setCompanyApps)
                      .catch(console.error)
                      .finally(() => setCompanyAppsLoading(false));
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  inspectorTab === "applications"
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                Applications
              </button>
              <button
                onClick={() => setInspectorTab("activity")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  inspectorTab === "activity"
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                Activity Timeline
              </button>
              <button
                onClick={() => setInspectorTab("support")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  inspectorTab === "support"
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                Support Mode
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {inspectorTab === "overview" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Contact Person</span>
                    <p className="text-xs text-white">{inspectCompany.contactPerson || "Not listed"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Contact Email</span>
                    <p className="text-xs text-white font-mono">{inspectCompany.email}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Company Size</span>
                    <p className="text-xs text-white">{inspectCompany.size || "10-50"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Website</span>
                    <p className="text-xs text-sky-400 truncate">{inspectCompany.website || "None"}</p>
                  </div>
                </div>

                {inspectCompany.about && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">About Organization</span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                      {inspectCompany.about}
                    </p>
                  </div>
                )}

                {inspectCompany.slaInfo && (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <span className="text-xs font-black text-white uppercase tracking-wider block">
                      Employer SLA Performance
                    </span>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <div className="text-sm font-black text-emerald-400">{inspectCompany.slaInfo.avgResponseHours}h</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Avg Response</div>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <div className="text-sm font-black text-sky-400">{inspectCompany.slaInfo.ghostingRatePct}%</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Ghosting Rate</div>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <div className="text-sm font-black text-orange-400">{inspectCompany.slaInfo.feedbackGuaranteePct}%</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Feedback Guarantee</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: POSTED JOBS */}
            {inspectorTab === "jobs" && (
              <div className="space-y-4 animate-in fade-in duration-150 text-xs">
                {companyJobsLoading ? (
                  <div className="py-8 text-center text-slate-500">Loading posted jobs...</div>
                ) : companyJobs.length > 0 ? (
                  <div className="space-y-2">
                    {companyJobs.map((j) => (
                      <div key={j.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-xs">{j.title}</div>
                          <div className="text-[11px] text-slate-400">
                            {j.location || "Remote"} • {j.type}
                          </div>
                          <div className="text-[10px] text-emerald-400 font-mono mt-1">
                            ${(j.salaryMin / 1000).toFixed(0)}k - ${(j.salaryMax / 1000).toFixed(0)}k • {j.applicantsCount} applicants
                          </div>
                        </div>
                        <StatusBadge status={j.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500">No jobs posted by this employer yet.</div>
                )}
              </div>
            )}

            {/* TAB 3: APPLICATIONS */}
            {inspectorTab === "applications" && (
              <div className="space-y-4 animate-in fade-in duration-150 text-xs">
                {companyAppsLoading ? (
                  <div className="py-8 text-center text-slate-500">Loading applications...</div>
                ) : companyApps.length > 0 ? (
                  <div className="space-y-2">
                    {companyApps.map((a) => (
                      <div key={a.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-xs">{a.candidateName || "Candidate"}</div>
                          <div className="text-[11px] text-orange-400">{a.jobTitle || "Job Listing"}</div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            Applied {new Date(a.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <StatusBadge status={a.status} />
                          <div className="text-[10px] text-slate-400 font-bold uppercase">
                            Stage: {a.currentStage || "applied"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500">No applications received for this employer yet.</div>
                )}
              </div>
            )}

            {/* TAB 4: ACTIVITY TIMELINE */}
            {inspectorTab === "activity" && (
              <div className="animate-in fade-in duration-150">
                <ActivityTimeline
                  entityId={inspectCompany.id}
                  targetUserId={inspectCompany.userId || undefined}
                />
              </div>
            )}

            {/* TAB 5: SUPPORT MODE */}
            {inspectorTab === "support" && (
              <div className="animate-in fade-in duration-150">
                <SupportSessionLauncher
                  targetUserId={inspectCompany.userId || inspectCompany.id}
                  targetRole="company"
                  targetEntityId={inspectCompany.id}
                  targetName={inspectCompany.companyName}
                />
              </div>
            )}
          </div>
        </AdminModal>
      )}

      {/* Reject Verification Modal */}
      {rejectModalOpen && companyToReject && (
        <AdminModal
          isOpen={rejectModalOpen}
          onClose={() => {
            setRejectModalOpen(false);
            setCompanyToReject(null);
          }}
          title="Reject Employer Verification"
          subtitle={`Rejecting verification for ${companyToReject.companyName}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Mandatory Rejection Reason
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Specify why verification cannot be granted (e.g. Unverified business registration, suspicious email domain)..."
                className="w-full h-24 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setCompanyToReject(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/20 transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
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
