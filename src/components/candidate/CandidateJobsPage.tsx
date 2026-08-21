import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  MapPin,
  Clock,
  IndianRupee,
  Sparkles,
  Building2,
  CheckCircle2,
  Send,
  Eye,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Target,
  Briefcase,
  Layers,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { CandidateJobDetailModal } from "./CandidateJobDetailModal";
import { Job } from "../../types";
import { calculateJobMatch } from "../../utils/matchingEngine";

export const CandidateJobsPage: React.FC = () => {
  const { jobs, candidate, applications, handleSwipe } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [matchFilterType, setMatchFilterType] = useState<"matched_all" | "skills" | "location" | "role" | "all_jobs">("matched_all");
  const [selectedWorkMode, setSelectedWorkMode] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [minSalary, setMinSalary] = useState<number>(0);
  const [viewLayout, setViewLayout] = useState<"grid" | "list">("grid");
  const [selectedJobModal, setSelectedJobModal] = useState<Job | null>(null);

  // Compute multi-attribute match data for each active job
  const enrichedJobs = useMemo(() => {
    return jobs
      .filter((j) => j.status === "active")
      .map((job) => {
        const matchData = calculateJobMatch(candidate, job);
        return {
          ...job,
          matchScore: matchData.matchScore,
          matchedSkills: matchData.matchedSkills,
          matchedReasons: matchData.matchedReasons,
          isCandidateMatch: matchData.isMatch,
          matchCriteria: matchData.matchCriteria,
          aiSummary: matchData.aiSummary,
        };
      })
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [jobs, candidate]);

  // Counts
  const totalActive = enrichedJobs.length;
  const totalMatched = enrichedJobs.filter((j) => j.isCandidateMatch).length;
  const skillsMatchedCount = enrichedJobs.filter((j) => j.matchCriteria?.skills).length;
  const locationMatchedCount = enrichedJobs.filter((j) => j.matchCriteria?.location).length;
  const roleMatchedCount = enrichedJobs.filter((j) => j.matchCriteria?.role).length;

  // Filter jobs based on matching selection and user controls
  const filteredJobs = useMemo(() => {
    return enrichedJobs.filter((job) => {
      // Matching criterion filter
      if (matchFilterType === "matched_all" && !job.isCandidateMatch) {
        return false;
      }
      if (matchFilterType === "skills" && !job.matchCriteria?.skills) {
        return false;
      }
      if (matchFilterType === "location" && !job.matchCriteria?.location) {
        return false;
      }
      if (matchFilterType === "role" && !job.matchCriteria?.role) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = job.title.toLowerCase().includes(q);
        const matchCompany = job.companyName.toLowerCase().includes(q);
        const matchSkills = (job.requiredSkills || []).some((s) => s.toLowerCase().includes(q));
        const matchCandidateSkills = (job.matchedSkills || []).some((s) => s.toLowerCase().includes(q));
        if (!matchTitle && !matchCompany && !matchSkills && !matchCandidateSkills) return false;
      }

      // Work mode filter
      if (selectedWorkMode !== "all" && job.workMode !== selectedWorkMode) {
        return false;
      }

      // Location filter
      if (selectedLocation !== "all" && !job.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
        return false;
      }

      // Salary filter
      if (minSalary > 0) {
        const numMatch = job.salary?.match(/\d+/g);
        const maxNum = numMatch ? Math.max(...numMatch.map(Number)) : 0;
        if (maxNum < minSalary) return false;
      }

      return true;
    });
  }, [enrichedJobs, matchFilterType, searchQuery, selectedWorkMode, selectedLocation, minSalary]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Header & Match Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <Target className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Expertise Matcher Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Matching Tech Roles
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Found <strong className="text-slate-900 font-black">{totalMatched} matching roles</strong> where at least one skill, location, role, or experience overlaps with your profile.
          </p>
        </div>

        {/* Layout toggle */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setViewLayout("grid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewLayout === "grid" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewLayout("list")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewLayout === "list" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Matching Criterion Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setMatchFilterType("matched_all")}
          className={`py-2 px-4 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            matchFilterType === "matched_all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>All Matches ({totalMatched})</span>
        </button>

        <button
          onClick={() => setMatchFilterType("skills")}
          className={`py-2 px-4 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            matchFilterType === "skills"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Skills Match ({skillsMatchedCount})</span>
        </button>

        <button
          onClick={() => setMatchFilterType("location")}
          className={`py-2 px-4 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            matchFilterType === "location"
              ? "bg-sky-600 text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-sky-400" />
          <span>City Match ({locationMatchedCount})</span>
        </button>

        <button
          onClick={() => setMatchFilterType("role")}
          className={`py-2 px-4 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            matchFilterType === "role"
              ? "bg-orange-600 text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-orange-400" />
          <span>Role Match ({roleMatchedCount})</span>
        </button>

        <button
          onClick={() => setMatchFilterType("all_jobs")}
          className={`py-2 px-4 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            matchFilterType === "all_jobs"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>All Open Roles ({totalActive})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="candidate-job-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roles, skills (e.g. React, Node)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
            />
          </div>

          {/* Work mode select */}
          <div className="sm:col-span-3">
            <select
              value={selectedWorkMode}
              onChange={(e) => setSelectedWorkMode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none font-bold"
            >
              <option value="all">All Work Modes</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
              <option value="Onsite">Onsite</option>
            </select>
          </div>

          {/* Location select */}
          <div className="sm:col-span-2">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none font-bold"
            >
              <option value="all">All Locations</option>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Pune">Pune</option>
            </select>
          </div>

          {/* Min salary filter */}
          <div className="sm:col-span-2">
            <select
              value={minSalary}
              onChange={(e) => setMinSalary(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none font-bold"
            >
              <option value={0}>Any Salary</option>
              <option value={8}>Min ₹8 LPA</option>
              <option value={12}>Min ₹12 LPA</option>
              <option value={15}>Min ₹15 LPA</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Container */}
      {filteredJobs.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mx-auto shadow-xs">
            🔍
          </div>
          <div className="space-y-1">
            <p className="text-base font-black text-slate-900">No matching jobs for this filter.</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              We couldn't find active postings matching your current criteria. Try viewing all open roles or adding more skills to your profile.
            </p>
          </div>
          <button
            onClick={() => {
              setMatchFilterType("all_jobs");
              setSearchQuery("");
              setSelectedWorkMode("all");
              setSelectedLocation("all");
              setMinSalary(0);
            }}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            Explore All Open Roles ({totalActive})
          </button>
        </div>
      ) : viewLayout === "grid" ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJobs.map((job) => {
            const isApplied = applications.some((a) => a.jobId === job.id);
            const matchedSkillsList = job.matchedSkills || [];
            return (
              <div
                key={job.id}
                className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-slate-900 shadow-xs hover:shadow-md transition-all p-5 sm:p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3.5">
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          job.companyLogo ||
                          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"
                        }
                        alt={job.companyName}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 shadow-2xs shrink-0"
                      />
                      <div>
                        <h3 className="font-black text-sm sm:text-base text-slate-900 line-clamp-1">{job.title}</h3>
                        <p className="text-xs text-slate-500 font-bold">{job.companyName}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className="px-2.5 py-1 text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full shadow-2xs">
                        🎯 {job.matchScore || 85}% Match
                      </span>
                    </div>
                  </div>

                  {/* Metadata chips */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700">
                    <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-[11px]">
                      <MapPin className="w-3 h-3 text-sky-500" />
                      {job.location.split(",")[0]} · {job.workMode}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-[11px]">
                      <Clock className="w-3 h-3 text-orange-500" />
                      {job.experience}
                    </span>
                    <span className="inline-flex items-center gap-1 font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-[11px]">
                      {job.salary}
                    </span>
                  </div>

                  {/* Highlighted Overlapping Skills */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      {matchedSkillsList.length > 0 ? `Matched Skills (${matchedSkillsList.length})` : "Required Skills"}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {matchedSkillsList.length > 0 ? (
                        matchedSkillsList.map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-[10px] font-black"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{skill}</span>
                          </span>
                        ))
                      ) : (
                        (job.requiredSkills || []).slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold"
                          >
                            {skill}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Match Reason Snippet */}
                  {job.matchReasons && job.matchReasons.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 font-medium leading-snug">
                      <span className="text-emerald-700 font-bold">Why it matches: </span>
                      {job.matchReasons.slice(0, 2).join(" • ")}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedJobModal(job)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-xs font-black uppercase tracking-wider flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View JD</span>
                  </button>

                  <button
                    disabled={isApplied}
                    onClick={() => handleSwipe(job.id, "right")}
                    className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                      isApplied
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-not-allowed"
                        : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Applied</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>1-Click Apply</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Layout */
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredJobs.map((job) => {
            const isApplied = applications.some((a) => a.jobId === job.id);
            return (
              <div
                key={job.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={
                      job.companyLogo ||
                      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"
                    }
                    alt={job.companyName}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0 shadow-2xs"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm sm:text-base text-slate-900">{job.title}</h3>
                      <span className="px-2.5 py-0.5 text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
                        🎯 {job.matchScore || 85}% Match
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">{job.companyName}</p>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-2">
                      <span>{job.location} · {job.workMode}</span>
                      <span>•</span>
                      <span>{job.experience}</span>
                      <span>•</span>
                      <span className="font-black text-emerald-700">{job.salary}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedJobModal(job)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    View JD
                  </button>

                  <button
                    disabled={isApplied}
                    onClick={() => handleSwipe(job.id, "right")}
                    className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                      isApplied
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    }`}
                  >
                    {isApplied ? "Applied" : "1-Click Apply"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Job Details Modal */}
      <CandidateJobDetailModal
        job={selectedJobModal}
        onClose={() => setSelectedJobModal(null)}
        onApply={(jobId) => handleSwipe(jobId, "right")}
        isApplied={
          selectedJobModal ? applications.some((a) => a.jobId === selectedJobModal.id) : false
        }
      />
    </div>
  );
};
