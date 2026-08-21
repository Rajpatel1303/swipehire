import React, { useState } from "react";
import {
  ShieldCheck,
  Users,
  Building2,
  Briefcase,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Activity,
  Layers,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export const AdminPortal: React.FC = () => {
  const { jobs, updateJobStatus, applications, deleteJob } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"jobs" | "metrics" | "engine">("jobs");

  const filteredJobs = jobs.filter((j) =>
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>SwipeHired Platform Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Super Admin & AI Radar Console</h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Live telemetry, automated AI job moderation, vector matching engine health, and candidate security.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white/10 rounded-2xl text-center border border-white/10">
            <span className="text-lg font-black text-emerald-400 block">99.9%</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Vector Latency</span>
          </div>
          <div className="px-4 py-2 bg-white/10 rounded-2xl text-center border border-white/10">
            <span className="text-lg font-black text-sky-400 block">Active</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Gemini 2.5 Engine</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Jobs</span>
            <Briefcase className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{jobs.length}</div>
          <span className="text-[11px] text-emerald-600 font-semibold">100% Parsed</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Swipes & Apps</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{applications.length + 142}</div>
          <span className="text-[11px] text-emerald-600 font-semibold">+18% today</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Companies Active</span>
            <Building2 className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">28</div>
          <span className="text-[11px] text-slate-500 font-medium">Ahmedabad & Remote</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Talent</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">412</div>
          <span className="text-[11px] text-emerald-600 font-semibold">Indexed Vectors</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("jobs")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "jobs" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          Job Moderation & Status ({filteredJobs.length})
        </button>
        <button
          onClick={() => setActiveTab("engine")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "engine" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          AI Vector & Scoring Settings
        </button>
      </div>

      {/* Tab: Job Moderation */}
      {activeTab === "jobs" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Search filter */}
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search postings by company or title..."
              className="w-full text-xs text-slate-900 bg-transparent focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-4">Role Title</th>
                  <th className="p-4">Company</th>
                  <th className="p-4">Location & Salary</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{job.title}</td>
                    <td className="p-4 text-slate-600 font-medium">{job.companyName}</td>
                    <td className="p-4 text-slate-500">
                      {job.location} · ₹{job.salaryMin}–{job.salaryMax} LPA
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          job.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : job.status === "draft"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {job.status !== "active" ? (
                          <button
                            onClick={() => updateJobStatus(job.id, "active")}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => updateJobStatus(job.id, "paused")}
                            className="px-2.5 py-1 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg font-medium text-[11px] transition-colors cursor-pointer"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => deleteJob(job.id)}
                          className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg font-medium text-[11px] transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Engine Configuration */}
      {activeTab === "engine" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">Career Radar AI Engine Parameters</h3>
            <p className="text-xs text-slate-500">
              Tune weights for semantic skill vectors, salary compatibility, and location proximity scoring.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 block">Skill Vector Weight</span>
              <p className="text-slate-500 text-[11px]">Core tech stack & framework matches</p>
              <div className="text-xl font-black text-emerald-700">55%</div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 block">Experience & Level Weight</span>
              <p className="text-slate-500 text-[11px]">Years in production & past titles</p>
              <div className="text-xl font-black text-sky-700">25%</div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 block">Location & Preference</span>
              <p className="text-slate-500 text-[11px]">Remote / Hybrid / City alignment</p>
              <div className="text-xl font-black text-orange-700">20%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
