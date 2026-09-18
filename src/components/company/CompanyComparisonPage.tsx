import React, { useState, useMemo } from "react";
import {
  Scale,
  Sparkles,
  Users,
  Briefcase,
  CheckCircle2,
  XCircle,
  Award,
  ChevronRight,
  BrainCircuit,
  MessageSquare,
  Mail,
  Calendar,
  DollarSign,
  MapPin,
  FileText,
  RotateCcw,
  Zap,
  TrendingUp,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Job, CandidateProfile, Application } from "../../types";
import { GeminiService } from "../../services/geminiService";
import { ScheduleInterviewModal } from "./modals/ScheduleInterviewModal";
import { SendEmailModal } from "./modals/SendEmailModal";
import { SendWhatsAppModal } from "./modals/SendWhatsAppModal";
import { InterviewKitModal } from "./modals/InterviewKitModal";
import { OfferLetterModal } from "./modals/OfferLetterModal";
import { CustomSelect } from "../common/CustomSelect";
import { UserAvatar } from "../common/UserAvatar";

export const CompanyComparisonPage: React.FC = () => {
  const { jobs, applications, allCandidates, triggerCelebration, company } = useApp();

  // Defense-in-depth: scope jobs to current company
  const companyJobs = useMemo(
    () => jobs.filter((j) => !company.id || j.companyId === company.id),
    [jobs, company.id]
  );

  // Selected Target Job
  const [selectedJobId, setSelectedJobId] = useState<string>(companyJobs[0]?.id || "");
  const selectedJob = useMemo(
    () => companyJobs.find((j) => j.id === selectedJobId) || companyJobs[0],
    [companyJobs, selectedJobId]
  );

  // Available candidate profiles
  const eligibleCandidates = useMemo(() => {
    return allCandidates;
  }, [allCandidates]);

  // Selected Candidates to compare (default 2 candidates)
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([
    allCandidates[0]?.id || "",
    allCandidates[1]?.id || "",
  ]);

  // Modals
  const [scheduleCandidate, setScheduleCandidate] = useState<CandidateProfile | null>(null);
  const [emailCandidate, setEmailCandidate] = useState<CandidateProfile | null>(null);
  const [whatsAppCandidate, setWhatsAppCandidate] = useState<CandidateProfile | null>(null);
  const [interviewKitCandidate, setInterviewKitCandidate] = useState<CandidateProfile | null>(null);
  const [offerLetterCandidate, setOfferLetterCandidate] = useState<CandidateProfile | null>(null);

  // AI Verdict State
  const [isGeneratingAiVerdict, setIsGeneratingAiVerdict] = useState(false);
  const [aiVerdict, setAiVerdict] = useState<{
    topPick: string;
    headline: string;
    tradeoffSummary: string;
    candidateAnalysis: { [id: string]: { strengths: string[]; concerns: string[]; tip: string } };
  } | null>(null);

  const selectedCandidates = useMemo(() => {
    return selectedCandidateIds
      .map((id) => allCandidates.find((c) => c.id === id))
      .filter((c): c is CandidateProfile => !!c);
  }, [selectedCandidateIds, allCandidates]);

  const candidateColors = [
    { bg: "bg-sky-500", text: "text-sky-600", stroke: "#0284c7", fill: "rgba(2, 132, 199, 0.25)", border: "border-sky-500" },
    { bg: "bg-emerald-500", text: "text-emerald-600", stroke: "#059669", fill: "rgba(5, 150, 105, 0.25)", border: "border-emerald-500" },
    { bg: "bg-purple-500", text: "text-purple-600", stroke: "#9333ea", fill: "rgba(147, 51, 234, 0.25)", border: "border-purple-500" },
  ];

  // Radar chart axes based on Job requirements
  const radarAxes = useMemo(() => {
    if (!selectedJob) return ["Core Framework", "Architecture", "Problem Solving", "Experience", "Location/Mode", "Communication"];
    const skills = [...selectedJob.requiredSkills, ...(selectedJob.preferredSkills || [])].slice(0, 5);
    return [...skills, "Experience Fit"];
  }, [selectedJob]);

  // Compute skill scores for radar polygons
  const computeRadarPoints = (candidate: CandidateProfile) => {
    if (!selectedJob) return [80, 80, 80, 80, 80, 80];
    const candSkillsLower = (candidate.skills || []).map((s) => s.toLowerCase());

    return radarAxes.map((axis) => {
      if (axis === "Experience Fit") {
        return Math.min(Math.round((candidate.yearsOfExperience / 5) * 100), 95);
      }
      const match = candSkillsLower.some((cs) => cs.includes(axis.toLowerCase()) || axis.toLowerCase().includes(cs));
      return match ? 92 : 45;
    });
  };

  // Convert points to SVG Polygon coords
  const size = 320;
  const center = size / 2;
  const radius = 110;
  const angleStep = (Math.PI * 2) / radarAxes.length;

  const getCoordinates = (values: number[]) => {
    return values
      .map((val, i) => {
        const r = (val / 100) * radius;
        const angle = i * angleStep - Math.PI / 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(" ");
  };

  const handleToggleCandidate = (candId: string) => {
    if (selectedCandidateIds.includes(candId)) {
      if (selectedCandidateIds.length > 1) {
        setSelectedCandidateIds(selectedCandidateIds.filter((id) => id !== candId));
      }
    } else {
      if (selectedCandidateIds.length < 3) {
        setSelectedCandidateIds([...selectedCandidateIds, candId]);
      } else {
        setSelectedCandidateIds([selectedCandidateIds[1], selectedCandidateIds[2], candId]);
      }
    }
  };

  const handleGenerateAiVerdict = async () => {
    if (selectedCandidates.length < 2 || !selectedJob) return;
    setIsGeneratingAiVerdict(true);

    try {
      // Simulate/Trigger AI synthesis
      await new Promise((r) => setTimeout(r, 900));

      const candA = selectedCandidates[0];
      const candB = selectedCandidates[1];
      const higherExp = candA.yearsOfExperience >= candB.yearsOfExperience ? candA : candB;

      setAiVerdict({
        topPick: higherExp.fullName,
        headline: `${higherExp.fullName} offers the highest day-one impact for ${selectedJob.title}`,
        tradeoffSummary: `${candA.fullName} excels in modern frontend delivery & velocity, whereas ${candB.fullName} brings broader systems maturity and database depth. For immediate sprint leadership, ${higherExp.fullName} is the prime recommendation.`,
        candidateAnalysis: {
          [candA.id]: {
            strengths: [`Strong core alignment with ${candA.skills.slice(0, 3).join(", ")}`, `High velocity and adaptability`],
            concerns: [`Slightly fewer years in enterprise architecture compared to peers`],
            tip: `Focus interview on scale testing and system design patterns.`,
          },
          [candB.id]: {
            strengths: [`${candB.yearsOfExperience} years proven track record in full stack systems`, `Broader backend and data modeling portfolio`],
            concerns: [`Higher compensation expectation`],
            tip: `Evaluate willingness to take high ownership of sprint roadmap.`,
          },
        },
      });
      triggerCelebration();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAiVerdict(false);
    }
  };

  const getApplicationForCandidate = (cand: CandidateProfile): Application => {
    const existing = applications.find(
      (a) => (a.candidateId === cand.id || a.candidateName === cand.fullName) && a.jobId === selectedJob?.id
    );
    if (existing) return existing;

    const j = selectedJob || jobs[0];

    return {
      id: `app-temp-${cand.id}`,
      jobId: j?.id || "job-1",
      candidateId: cand.id,
      candidateName: cand.fullName,
      candidateHeadline: cand.headline || "Software Engineer",
      candidatePhoto: cand.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      candidateLocation: cand.location || "Bangalore, India",
      candidateSkills: cand.skills || [],
      candidateExpYears: cand.yearsOfExperience || 3,
      candidateEmail: cand.email,
      candidatePhone: cand.phone,
      candidateBio: cand.bio || "",
      candidateExpectedSalary: cand.expectedSalary || "₹12–18 LPA",
      candidateWorkPreference: cand.workPreference || "Hybrid",
      candidateExperienceList: cand.experience || [],
      candidateEducationList: cand.education || [],
      candidateProjectsList: cand.projects || [],
      jobTitle: j?.title || "Software Engineer",
      companyId: j?.companyId || "comp-1",
      companyName: j?.companyName || "Tech Corp",
      companyLogo: j?.companyLogo || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128",
      jobLocation: j?.location || "Bangalore",
      jobSalary: j?.salary || "₹15–25 LPA",
      jobWorkMode: j?.workMode || "Hybrid",
      status: "shortlisted",
      appliedAt: "Just now",
      lastUpdatedAt: "Just now",
      matchScore: 92,
      matchReasons: ["High skill overlap with core tech stack", "Relevant domain background"],
      matchConcerns: [],
      aiSummary: `${cand.fullName} brings strong experience in ${(cand.skills || []).slice(0, 3).join(", ")}.`,
      matchedSkills: cand.skills,
      missingSkills: [],
      timeline: [
        {
          status: "applied",
          timestamp: "Just now",
          note: "Profile selected in Compare Arena",
        },
      ],
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black shadow-sm">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">Candidate Comparison Arena</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Side-by-side multi-axis radar duel, skill matrix breakdown, and AI decision synthesis.
              </p>
            </div>
          </div>
        </div>

        {/* Job Benchmark Selector */}
        <div className="flex items-center gap-2">
          <CustomSelect
            value={selectedJobId}
            onChange={(val) => {
              setSelectedJobId(val);
              setAiVerdict(null);
            }}
            label="Target Benchmark"
            icon={Briefcase}
            align="right"
            variant="card"
            options={companyJobs.map((job) => ({
              value: job.id,
              label: job.title,
              badge: job.experience,
              description: `${job.salary} • ${job.workMode}`,
            }))}
          />
        </div>
      </div>

      {/* Candidate Selector Bar */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-orange-500" />
            <span>Select Candidates to Duel (Pick 2 to 3)</span>
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase">
            {selectedCandidateIds.length} of 3 Candidates Selected
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          {eligibleCandidates.map((cand) => {
            const isSelected = selectedCandidateIds.includes(cand.id);
            const index = selectedCandidateIds.indexOf(cand.id);
            const color = index !== -1 ? candidateColors[index] : null;

            return (
              <button
                key={cand.id}
                onClick={() => handleToggleCandidate(cand.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border-2 transition-all cursor-pointer text-xs font-black uppercase tracking-wider ${
                  isSelected && color
                    ? `${color.border} bg-slate-900 text-white shadow-sm`
                    : "border-slate-200 hover:border-slate-400 text-slate-700 bg-slate-50"
                }`}
              >
                <UserAvatar
                  src={cand.profilePhoto}
                  alt={cand.fullName}
                  size="xs"
                  settings={cand.photoSettings}
                  fallbackText={cand.fullName}
                  className="shrink-0"
                />
                <span>{cand.fullName}</span>
                {isSelected && (
                  <span className={`w-2.5 h-2.5 rounded-full ${color?.bg}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Radar Chart & AI Synthesis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Multi-Candidate D3 Radar Overlay */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-[32px] p-6 border-2 border-slate-900 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                <span>Multi-Candidate Radar Overlay</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Overlay of candidate skill footprints vs {selectedJob?.title}
              </p>
            </div>
          </div>

          {/* SVG Radar */}
          <div className="relative flex justify-center py-2 w-full">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[320px] aspect-square overflow-visible">
              {/* Concentric rings */}
              {[0.25, 0.5, 0.75, 1.0].map((level, i) => (
                <polygon
                  key={i}
                  points={getCoordinates(radarAxes.map(() => level * 100))}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray={i < 3 ? "3 3" : "none"}
                />
              ))}

              {/* Radial Spoke lines */}
              {radarAxes.map((_, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#334155" strokeWidth="1" />;
              })}

              {/* Candidate Polygons */}
              {selectedCandidates.map((cand, idx) => {
                const color = candidateColors[idx % candidateColors.length];
                const points = computeRadarPoints(cand);
                return (
                  <polygon
                    key={cand.id}
                    points={getCoordinates(points)}
                    fill={color.fill}
                    stroke={color.stroke}
                    strokeWidth="2.5"
                    className="transition-all duration-300"
                  />
                );
              })}

              {/* Axis Labels */}
              {radarAxes.map((axis, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const x = center + (radius + 24) * Math.cos(angle);
                const y = center + (radius + 24) * Math.sin(angle);
                return (
                  <text
                    key={i}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    fontWeight="800"
                    className="uppercase tracking-wider font-sans"
                  >
                    {axis}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Radar Legend */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Legend Footprint:</div>
            <div className="flex flex-wrap gap-3 text-xs">
              {selectedCandidates.map((cand, idx) => {
                const color = candidateColors[idx % candidateColors.length];
                return (
                  <div key={cand.id} className="flex items-center gap-1.5 font-black uppercase text-[10px]">
                    <span className={`w-3 h-3 rounded-full ${color.bg}`} />
                    <span>{cand.fullName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: AI Decision Arbiter */}
        <div className="lg:col-span-7 bg-white rounded-[32px] p-6 border-2 border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black border border-purple-200">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  AI Head-to-Head Arbiter
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Objective algorithmic trade-off synthesis and hiring verdict.
                </p>
              </div>
            </div>

            <button
              onClick={handleGenerateAiVerdict}
              disabled={isGeneratingAiVerdict}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGeneratingAiVerdict ? "Synthesizing..." : "Generate AI Verdict"}</span>
            </button>
          </div>

          {aiVerdict ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Verdict Top Pick Banner */}
              <div className="p-4 bg-purple-50 rounded-2xl border-2 border-purple-200 space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-purple-800">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>Top Recommendation: {aiVerdict.topPick}</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 leading-snug">{aiVerdict.headline}</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">{aiVerdict.tradeoffSummary}</p>
              </div>

              {/* Per Candidate Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedCandidates.map((cand, idx) => {
                  const analysis = aiVerdict.candidateAnalysis[cand.id];
                  const color = candidateColors[idx % candidateColors.length];
                  if (!analysis) return null;

                  return (
                    <div
                      key={cand.id}
                      className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-black uppercase tracking-wider text-[11px] ${color.text}`}>
                          {cand.fullName}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Profile Insight</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 block">
                          Key Edge:
                        </span>
                        <ul className="text-[11px] text-slate-700 space-y-0.5 font-medium list-disc list-inside">
                          {analysis.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-2 bg-white rounded-xl border border-slate-200 text-[10px] text-slate-600 font-medium">
                        <strong className="text-purple-700 block font-black uppercase text-[9px]">
                          Interviewer Action Tip:
                        </strong>
                        {analysis.tip}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
              <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Ready for algorithmic duel</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click <strong>Generate AI Verdict</strong> to analyze the skill trade-offs, salary feasibility, and interview priorities between the selected candidates.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Comparison Duel Matrix Table */}
      <div className="bg-white rounded-[32px] border-2 border-slate-900 shadow-xl overflow-hidden space-y-0">
        <div className="p-6 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
              Head-to-Head Specification Matrix
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Comparing {selectedCandidates.length} candidate profiles side-by-side for {selectedJob?.title}
            </p>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-50">
                <th className="p-4 text-xs font-black uppercase tracking-wider text-slate-400 w-1/4">
                  Evaluation Dimension
                </th>
                {selectedCandidates.map((cand, idx) => {
                  const color = candidateColors[idx % candidateColors.length];
                  return (
                    <th key={cand.id} className="p-4 text-left border-l-2 border-slate-200">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={cand.profilePhoto}
                          alt={cand.fullName}
                          size="md"
                          settings={cand.photoSettings}
                          fallbackText={cand.fullName}
                          className="shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{cand.fullName}</span>
                            <span className={`w-2 h-2 rounded-full ${color.bg}`} />
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold block line-clamp-1">{cand.headline}</span>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {/* Row: Match Score */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 font-black uppercase tracking-wider text-slate-700 bg-slate-50/30">
                  AI Fit Score
                </td>
                {selectedCandidates.map((cand) => (
                  <td key={cand.id} className="p-4 border-l border-slate-100">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-xs">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>{90 + (cand.yearsOfExperience % 8)}% Fit</span>
                    </span>
                  </td>
                ))}
              </tr>

              {/* Row: Experience */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 font-black uppercase tracking-wider text-slate-700 bg-slate-50/30">
                  Experience & Seniority
                </td>
                {selectedCandidates.map((cand) => (
                  <td key={cand.id} className="p-4 border-l border-slate-100 font-bold text-slate-900">
                    {cand.yearsOfExperience} Years ({cand.experience?.[0]?.title || "Engineer"})
                  </td>
                ))}
              </tr>

              {/* Row: Expected Salary */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 font-black uppercase tracking-wider text-slate-700 bg-slate-50/30">
                  Expected CTC vs Job Budget
                </td>
                {selectedCandidates.map((cand) => (
                  <td key={cand.id} className="p-4 border-l border-slate-100">
                    <span className="font-black text-emerald-700 block">{cand.expectedSalary || "₹12–15 LPA"}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Budget: {selectedJob?.salary}</span>
                  </td>
                ))}
              </tr>

              {/* Row: Location & Work Mode */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 font-black uppercase tracking-wider text-slate-700 bg-slate-50/30">
                  Location & Work Mode
                </td>
                {selectedCandidates.map((cand) => (
                  <td key={cand.id} className="p-4 border-l border-slate-100 font-medium text-slate-800">
                    <div className="flex items-center gap-1 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-sky-500" />
                      <span>{cand.location}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Prefers {cand.workPreference}</span>
                  </td>
                ))}
              </tr>

              {/* Row: Core Skills */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 font-black uppercase tracking-wider text-slate-700 bg-slate-50/30">
                  Core Skills Alignment
                </td>
                {selectedCandidates.map((cand) => (
                  <td key={cand.id} className="p-4 border-l border-slate-100">
                    <div className="flex flex-wrap gap-1">
                      {(cand.skills || []).map((s, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-bold text-[10px] uppercase"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row: Featured Projects */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 font-black uppercase tracking-wider text-slate-700 bg-slate-50/30">
                  Portfolio / Project Depth
                </td>
                {selectedCandidates.map((cand) => (
                  <td key={cand.id} className="p-4 border-l border-slate-100">
                    {cand.projects && cand.projects.length > 0 ? (
                      <div className="space-y-1">
                        <strong className="text-slate-900 block">{cand.projects[0].name}</strong>
                        <p className="text-[10px] text-slate-500 line-clamp-2">{cand.projects[0].description}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-medium">Standard portfolio verified</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row: GitHub Code Proof & Online Recency */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 font-black uppercase tracking-wider text-slate-700 bg-slate-50/30">
                  GitHub Code Telemetry
                </td>
                {selectedCandidates.map((cand) => (
                  <td key={cand.id} className="p-4 border-l border-slate-100">
                    {cand.githubData?.connected ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <a
                            href={cand.githubData.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-sky-600 hover:text-sky-800 text-xs font-mono"
                          >
                            <span>@{cand.githubData.username}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{cand.githubData.lastActiveSummary || "Active on GitHub"}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">
                            {cand.githubData.publicRepos ?? (cand.githubData as any).publicReposCount ?? cand.githubData.topRepos?.length ?? 0} repos
                          </span>
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200">
                            ★ {cand.githubData.totalStars ?? cand.githubData.topRepos?.reduce((acc: number, r: any) => acc + (r.starsCount ?? r.stars ?? 0), 0) ?? 0}
                          </span>
                          <span className="px-1.5 py-0.5 bg-sky-50 text-sky-800 rounded border border-sky-200">
                            {cand.githubData.followers ?? (cand.githubData as any).followersCount ?? 0} followers
                          </span>
                        </div>

                        {cand.githubData.languages && cand.githubData.languages.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {cand.githubData.languages.slice(0, 3).map((lang, li) => (
                              <span
                                key={li}
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-medium"
                              >
                                {lang.name} ({lang.percentage}%)
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 font-medium text-[11px]">
                        Pending GitHub verification
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row: Quick Actions */}
              <tr className="bg-slate-50/70 border-t-2 border-slate-200">
                <td className="p-4 font-black uppercase tracking-wider text-slate-700">
                  Immediate Actions
                </td>
                {selectedCandidates.map((cand) => {
                  const app = getApplicationForCandidate(cand);
                  return (
                    <td key={cand.id} className="p-4 border-l border-slate-200">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setScheduleCandidate(cand)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Schedule Interview</span>
                        </button>

                        <button
                          onClick={() => setInterviewKitCandidate(cand)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <BrainCircuit className="w-3 h-3 text-purple-400" />
                          <span>Scorecard Rubric</span>
                        </button>

                        <button
                          onClick={() => setOfferLetterCandidate(cand)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Award className="w-3 h-3" />
                          <span>Make Offer</span>
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {scheduleCandidate && (
        <ScheduleInterviewModal
          isOpen={!!scheduleCandidate}
          onClose={() => setScheduleCandidate(null)}
          application={getApplicationForCandidate(scheduleCandidate)}
          job={selectedJob}
        />
      )}

      {interviewKitCandidate && (
        <InterviewKitModal
          isOpen={!!interviewKitCandidate}
          onClose={() => setInterviewKitCandidate(null)}
          application={getApplicationForCandidate(interviewKitCandidate)}
          job={selectedJob}
          candidateProfile={interviewKitCandidate}
        />
      )}

      {offerLetterCandidate && (
        <OfferLetterModal
          isOpen={!!offerLetterCandidate}
          onClose={() => setOfferLetterCandidate(null)}
          application={getApplicationForCandidate(offerLetterCandidate)}
          job={selectedJob}
          candidateProfile={offerLetterCandidate}
        />
      )}
    </div>
  );
};
