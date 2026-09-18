import React, { useState, useEffect, useMemo } from "react";
import {
  User,
  Shield,
  FileText,
  Trash2,
  Ban,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
} from "lucide-react";
import { CandidateRecord, ApplicationRecord } from "../types";
import { AdminApi } from "../services/adminApi";
import { DataTable, Column } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { AdminModal } from "../components/common/AdminModal";
import { ActivityTimeline } from "../components/common/ActivityTimeline";
import { SupportSessionLauncher } from "../components/common/SupportSessionLauncher";
import { useAdmin } from "../app/AdminContext";

export const CandidatesPage: React.FC = () => {
  const { refreshMetrics } = useAdmin();
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedSkill, setSelectedSkill] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedAgreement, setSelectedAgreement] = useState<string>("all");

  // Selected candidate for inspection modal
  const [inspectCandidate, setInspectCandidate] = useState<CandidateRecord | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"overview" | "experience" | "applications" | "activity" | "support">("overview");
  const [candidateApps, setCandidateApps] = useState<ApplicationRecord[]>([]);
  const [candidateAppsLoading, setCandidateAppsLoading] = useState(false);

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

  // Fetch candidates from Supabase via AdminApi
  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const data = await AdminApi.getCandidates();
      setCandidates(data);
    } catch (err) {
      console.error("[Candidates Page Error]:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Filter options
  const allSkills = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => (c.skills || []).forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [candidates]);

  const allLocations = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.location) set.add(c.location.split(",")[0].trim());
    });
    return Array.from(set).sort();
  }, [candidates]);

  // Filtered dataset
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (selectedSkill !== "all" && !c.skills.includes(selectedSkill)) return false;
      if (selectedLocation !== "all" && !c.location.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
      if (selectedAgreement === "signed" && !c.commissionAgreementSigned) return false;
      if (selectedAgreement === "unsigned" && c.commissionAgreementSigned) return false;
      return true;
    });
  }, [candidates, selectedSkill, selectedLocation, selectedAgreement]);

  // Actions
  const handleToggleSuspend = (c: CandidateRecord) => {
    const willSuspend = !c.isSuspended;
    setConfirmState({
      isOpen: true,
      title: willSuspend ? "Suspend Candidate Account" : "Reactivate Candidate Account",
      message: willSuspend
        ? `Are you sure you want to suspend ${c.fullName}? Their profile will be hidden from employers and job matching feeds.`
        : `Reactivate ${c.fullName}'s account to restore visibility in employer radars.`,
      isDestructive: willSuspend,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await AdminApi.toggleCandidateSuspension(c.id, willSuspend);
          await fetchCandidates();
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

  const handleVerifySkills = (c: CandidateRecord) => {
    setConfirmState({
      isOpen: true,
      title: "Verify Candidate Skill Stack",
      message: `Formally mark all ${c.skills.length} skills for ${c.fullName} as platform-verified.`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await AdminApi.verifyCandidateSkills(c.id, c.skills);
          await fetchCandidates();
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

  const handleResetPreferences = (c: CandidateRecord) => {
    setConfirmState({
      isOpen: true,
      title: "Reset Learned Matching Preferences",
      message: `Reset algorithmic weight vectors for ${c.fullName}. Matching feeds will revert to initial baseline scoring.`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await AdminApi.resetCandidatePreferences(c.id);
          await fetchCandidates();
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

  const handleDelete = (c: CandidateRecord) => {
    setConfirmState({
      isOpen: true,
      title: "Delete Candidate Record",
      message: `Permanently delete candidate ${c.fullName} (${c.email}) and associated data. This action is irreversible.`,
      isDestructive: true,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await AdminApi.deleteCandidate(c.id);
          await fetchCandidates();
          await refreshMetrics();
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          alert(`Deletion failed: ${err.message}`);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // Columns definition
  const columns: Column<CandidateRecord>[] = [
    {
      key: "fullName",
      header: "Candidate",
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-slate-300 shrink-0">
            {c.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
              <span>{c.fullName}</span>
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
      key: "headline",
      header: "Role / Headline",
      render: (c) => (
        <div className="max-w-xs truncate">
          <div className="text-white text-xs font-semibold truncate">{c.headline || "Tech Professional"}</div>
          <div className="text-[11px] text-slate-400 truncate">{c.preferredRole || "Open to roles"}</div>
        </div>
      ),
    },
    {
      key: "skills",
      header: "Skills",
      render: (c) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {(c.skills || []).slice(0, 3).map((skill, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded text-[10px] font-mono"
            >
              {skill}
            </span>
          ))}
          {(c.skills || []).length > 3 && (
            <span className="px-1.5 py-0.5 bg-slate-950 text-slate-500 rounded text-[10px] font-mono">
              +{(c.skills || []).length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "agreement",
      header: "10% Agreement",
      render: (c) => (
        <div>
          {c.commissionAgreementSigned ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3" /> Signed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px] font-bold">
              <XCircle className="w-3 h-3" /> Unsigned
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
            onClick={() => setInspectCandidate(c)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
            title="Inspect Details & Agreement"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleVerifySkills(c)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition"
            title="Verify Skill Stack"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleResetPreferences(c)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg transition"
            title="Reset Learned Preferences"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleToggleSuspend(c)}
            className={`p-1.5 rounded-lg transition ${
              c.isSuspended
                ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
            }`}
            title={c.isSuspended ? "Reactivate Candidate" : "Suspend Candidate"}
          >
            <Ban className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(c)}
            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
            title="Delete Account"
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Skill Stack
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">All Skills ({allSkills.length})</option>
              {allSkills.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">All Locations ({allLocations.length})</option>
              {allLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              10% Agreement
            </label>
            <select
              value={selectedAgreement}
              onChange={(e) => setSelectedAgreement(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">All Statuses</option>
              <option value="signed">Signed Agreement</option>
              <option value="unsigned">Unsigned Agreement</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchCandidates}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
        >
          Refresh Candidates
        </button>
      </div>

      {/* Candidates Data Table */}
      <DataTable
        data={filteredCandidates}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search candidates by name, email, headline..."
        searchFilter={(c, q) =>
          c.fullName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.headline.toLowerCase().includes(q) ||
          c.skills.some((s) => s.toLowerCase().includes(q))
        }
      />

      {/* Inspection Modal with Overview, Activity, and Support tabs */}
      {inspectCandidate && (
        <AdminModal
          isOpen={!!inspectCandidate}
          onClose={() => setInspectCandidate(null)}
          title={`Candidate: ${inspectCandidate.fullName}`}
          subtitle={`ID: ${inspectCandidate.id} • User ID: ${inspectCandidate.userId || "None"}`}
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
                onClick={() => setInspectorTab("experience")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  inspectorTab === "experience"
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                Experience & Resume
              </button>
              <button
                onClick={() => {
                  setInspectorTab("applications");
                  if (inspectCandidate) {
                    setCandidateAppsLoading(true);
                    AdminApi.getCandidateApplications(inspectCandidate.id)
                      .then(setCandidateApps)
                      .catch(console.error)
                      .finally(() => setCandidateAppsLoading(false));
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
                {/* Primary Details */}
                <div className="grid grid-cols-2 gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Email</span>
                    <p className="text-xs text-white font-mono">{inspectCandidate.email}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Location</span>
                    <p className="text-xs text-white">{inspectCandidate.location || "Remote"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Experience</span>
                    <p className="text-xs text-white">{inspectCandidate.yearsOfExperience} Years</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Expected CTC</span>
                    <p className="text-xs text-white">{inspectCandidate.expectedSalary || "Negotiable"}</p>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2">Declared Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectCandidate.skills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 10% Placement Commission Compliance Details */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      10% Placement Agreement Compliance
                    </span>
                    {inspectCandidate.commissionAgreementSigned ? (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-black uppercase">
                        Legally Binding
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10px] font-black uppercase">
                        Pending Signature
                      </span>
                    )}
                  </div>

                  {inspectCandidate.commissionAgreementSigned ? (
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Document ID:</span>
                        <span className="text-white font-bold">{inspectCandidate.commissionAgreementDocId || "SH-DOC-AUTO"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Signed At:</span>
                        <span className="text-slate-300">{inspectCandidate.commissionAgreementSignedAt || "Recorded"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Legal Name:</span>
                        <span className="text-white">{inspectCandidate.commissionAgreementSignature?.fullLegalName || inspectCandidate.fullName}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800">
                        <span className="text-slate-500 block mb-1">SHA-256 Audit Hash:</span>
                        <span className="text-[10px] text-emerald-400 break-all bg-slate-900 p-2 rounded-lg block">
                          {inspectCandidate.commissionAgreementSignature?.sha256AuditHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-400">
                      Candidate has not signed the 10% first-year placement fee agreement yet. Their job applications cannot be completed until executed.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: EXPERIENCE & RESUME */}
            {inspectorTab === "experience" && (
              <div className="space-y-5 animate-in fade-in duration-150 text-xs">
                {/* Resume info */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-orange-400" />
                    Resume Attachment
                  </span>
                  {inspectCandidate.resumeFilename ? (
                    <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="font-mono text-white text-xs">{inspectCandidate.resumeFilename}</span>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase">Uploaded</span>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No resume file uploaded yet.</p>
                  )}
                  {inspectCandidate.resumeText && (
                    <div className="mt-2 pt-2 border-t border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Parsed Text Summary</span>
                      <div className="max-h-36 overflow-y-auto bg-slate-900/60 p-2.5 rounded-xl text-slate-300 font-mono text-[11px] whitespace-pre-wrap">
                        {inspectCandidate.resumeText}
                      </div>
                    </div>
                  )}
                </div>

                {/* Work Experience */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                    Work Experience
                  </span>
                  {inspectCandidate.experience && inspectCandidate.experience.length > 0 ? (
                    <div className="space-y-3">
                      {inspectCandidate.experience.map((exp, i) => (
                        <div key={i} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{exp.title || "Role"}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{exp.duration}</span>
                          </div>
                          <div className="text-[11px] text-orange-400">{exp.company}</div>
                          {exp.description && (
                            <p className="text-[11px] text-slate-400 mt-1 whitespace-pre-wrap">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No work experience entries recorded.</p>
                  )}
                </div>

                {/* Education */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                    Education Credentials
                  </span>
                  {inspectCandidate.education && inspectCandidate.education.length > 0 ? (
                    <div className="space-y-2">
                      {inspectCandidate.education.map((edu, i) => (
                        <div key={i} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white">{edu.degree || "Degree"}</div>
                            <div className="text-[11px] text-slate-400">{edu.institution}</div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{edu.year}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No education entries recorded.</p>
                  )}
                </div>

                {/* Projects */}
                {inspectCandidate.projects && inspectCandidate.projects.length > 0 && (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      Projects & Portfolio
                    </span>
                    <div className="space-y-2">
                      {inspectCandidate.projects.map((proj, i) => (
                        <div key={i} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{proj.title}</span>
                            {proj.link && (
                              <a href={proj.link} target="_blank" rel="noreferrer" className="text-orange-400 text-[10px] underline flex items-center gap-1">
                                Link <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                          {proj.description && (
                            <p className="text-[11px] text-slate-400">{proj.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: APPLICATIONS */}
            {inspectorTab === "applications" && (
              <div className="space-y-4 animate-in fade-in duration-150 text-xs">
                {candidateAppsLoading ? (
                  <div className="py-8 text-center text-slate-500">Loading submitted applications...</div>
                ) : candidateApps.length > 0 ? (
                  <div className="space-y-2">
                    {candidateApps.map((app) => (
                      <div key={app.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-xs">{app.jobTitle || "Job Listing"}</div>
                          <div className="text-[11px] text-orange-400">{app.companyName || "Employer"}</div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            Applied on {new Date(app.createdAt).toLocaleDateString()}
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
                  <div className="py-8 text-center text-slate-500">No applications submitted by this candidate yet.</div>
                )}
              </div>
            )}

            {/* TAB 4: ACTIVITY TIMELINE */}
            {inspectorTab === "activity" && (
              <div className="animate-in fade-in duration-150">
                <ActivityTimeline
                  entityId={inspectCandidate.id}
                  targetUserId={inspectCandidate.userId}
                />
              </div>
            )}

            {/* TAB 5: SUPPORT MODE */}
            {inspectorTab === "support" && (
              <div className="animate-in fade-in duration-150">
                <SupportSessionLauncher
                  targetUserId={inspectCandidate.userId || inspectCandidate.id}
                  targetRole="candidate"
                  targetEntityId={inspectCandidate.id}
                  targetName={inspectCandidate.fullName}
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
