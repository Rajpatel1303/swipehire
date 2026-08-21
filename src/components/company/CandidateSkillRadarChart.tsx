import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Sparkles, CheckCircle2, AlertCircle, TrendingUp, Info } from "lucide-react";
import { Application, Job } from "../../types";

export interface RadarMetric {
  axis: string;
  candidateValue: number; // 0 to 100
  jobValue: number; // 0 to 100 (baseline requirement)
  category: "tech" | "experience" | "architecture" | "tooling" | "soft_skills" | "domain";
  candidateDetails: string;
  jobDetails: string;
}

interface CandidateSkillRadarChartProps {
  candidate: Application;
  job: Job;
  compact?: boolean;
}

export const CandidateSkillRadarChart: React.FC<CandidateSkillRadarChartProps> = ({
  candidate,
  job,
  compact = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredMetric, setHoveredMetric] = useState<RadarMetric | null>(null);
  const [showJobBaseline, setShowJobBaseline] = useState(true);
  const [showCandidateOverlay, setShowCandidateOverlay] = useState(true);

  // Derive 6 dynamic radar axes based on candidate & job specs
  const generateRadarMetrics = (): RadarMetric[] => {
    const candidateSkills = (candidate.candidateSkills || []).map((s) => s.toLowerCase());
    const reqSkills = (job.requiredSkills || []).map((s) => s.toLowerCase());
    const prefSkills = (job.preferredSkills || []).map((s) => s.toLowerCase());

    // 1. Primary Required Tech Stack
    const matchedReq = reqSkills.filter((rs) =>
      candidateSkills.some((cs) => cs.includes(rs) || rs.includes(cs))
    );
    const techScore =
      reqSkills.length > 0 ? Math.min(100, Math.round((matchedReq.length / reqSkills.length) * 100) + 15) : 85;

    // 2. Preferred & Tooling Stack
    const matchedPref = prefSkills.filter((ps) =>
      candidateSkills.some((cs) => cs.includes(ps) || ps.includes(cs))
    );
    const toolingScore =
      prefSkills.length > 0
        ? Math.min(100, Math.round((matchedPref.length / Math.max(1, prefSkills.length)) * 100) + 20)
        : 88;

    // 3. Experience & Seniority Depth
    const reqExpYears = parseInt(job.experience) || 3;
    const candExpYears = candidate.candidateExpYears || 4;
    const expScore = Math.min(100, Math.round((candExpYears / Math.max(1, reqExpYears)) * 85));

    // 4. Architecture & System Design
    const archSkills = ["system design", "architecture", "microservices", "scalable", "cloud", "aws", "docker", "kubernetes", "database"];
    const hasArch = candidateSkills.some((s) => archSkills.some((a) => s.includes(a)));
    const archScore = hasArch ? 92 : Math.min(95, Math.max(65, (candidate.matchScore || 80) - 5));

    // 5. Code Quality & Problem Solving
    const problemSolvingScore = Math.min(98, Math.max(70, candidate.matchScore || 85));

    // 6. Role & Culture Fit (based on work mode, location, preferences)
    const workModeMatch =
      candidate.candidateWorkPreference?.toLowerCase() === job.workMode.toLowerCase() ||
      job.workMode === "Remote";
    const cultureScore = workModeMatch ? 95 : 82;

    const primaryTechLabel = (job.requiredSkills && job.requiredSkills[0])
      ? `${job.requiredSkills[0]} & Core Tech`
      : "Core Stack";

    return [
      {
        axis: primaryTechLabel,
        candidateValue: Math.min(100, Math.max(40, techScore)),
        jobValue: 90,
        category: "tech",
        candidateDetails: `Matched ${matchedReq.length}/${Math.max(1, reqSkills.length)} required skills`,
        jobDetails: `Must have: ${job.requiredSkills?.slice(0, 3).join(", ") || "Core frameworks"}`,
      },
      {
        axis: "System Architecture",
        candidateValue: archScore,
        jobValue: 85,
        category: "architecture",
        candidateDetails: `Evaluated across scalability, API design & patterns`,
        jobDetails: `High-availability and modular code design standards`,
      },
      {
        axis: "Experience & Seniority",
        candidateValue: Math.min(100, Math.max(45, expScore)),
        jobValue: 80,
        category: "experience",
        candidateDetails: `${candExpYears} yrs verified industry experience`,
        jobDetails: `Target seniority requirement: ${job.experience}`,
      },
      {
        axis: "Ecosystem & Tooling",
        candidateValue: Math.min(100, Math.max(40, toolingScore)),
        jobValue: 75,
        category: "tooling",
        candidateDetails: `Familiarity with DevOps, CI/CD, and secondary toolchains`,
        jobDetails: `Preferred tools: ${job.preferredSkills?.slice(0, 3).join(", ") || "Git, Cloud, Testing"}`,
      },
      {
        axis: "Problem Solving & CS",
        candidateValue: problemSolvingScore,
        jobValue: 85,
        category: "domain",
        candidateDetails: `Algorithms, real-world project complexity & execution`,
        jobDetails: `Rigorous technical assessment benchmark`,
      },
      {
        axis: "Culture & Work Style",
        candidateValue: cultureScore,
        jobValue: 80,
        category: "soft_skills",
        candidateDetails: `Preferences: ${candidate.candidateWorkPreference || "Flexible"} · ${candidate.candidateLocation}`,
        jobDetails: `${job.workMode} · ${job.location}`,
      },
    ];
  };

  const metrics = generateRadarMetrics();

  // D3 Render Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Dimensions
    const width = compact ? 360 : 440;
    const height = compact ? 360 : 440;
    const margin = compact ? 45 : 60;
    const radius = Math.min(width, height) / 2 - margin;
    const levels = 5; // 20%, 40%, 60%, 80%, 100%
    const totalAxes = metrics.length;
    const angleSlice = (Math.PI * 2) / totalAxes;

    // Scale
    const rScale = d3.scaleLinear().range([0, radius]).domain([0, 100]);

    // Clear previous elements
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%")
      .style("overflow", "visible");

    // Defs for gradients & glowing filters
    const defs = svg.append("defs");

    // Candidate gradient
    const candGradient = defs
      .append("radialGradient")
      .attr("id", `cand-radar-grad-${candidate.id}`)
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "70%");

    candGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#0284c7") // sky-600
      .attr("stop-opacity", 0.55);

    candGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#0ea5e9") // sky-500
      .attr("stop-opacity", 0.2);

    // Job benchmark gradient
    const jobGradient = defs
      .append("radialGradient")
      .attr("id", `job-radar-grad-${job.id}`)
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "70%");

    jobGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#f97316") // orange-500
      .attr("stop-opacity", 0.25);

    jobGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#fb923c") // orange-400
      .attr("stop-opacity", 0.08);

    // Center group
    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // 1. Draw Concentric Background Polygons / Circles
    const axisGrid = g.append("g").attr("class", "axis-grid");

    for (let level = 1; level <= levels; level++) {
      const levelRadius = (radius / levels) * level;
      const levelFactor = (100 / levels) * level;

      // Polygon points for level
      const levelPoints: [number, number][] = metrics.map((_, i) => [
        levelRadius * Math.cos(angleSlice * i - Math.PI / 2),
        levelRadius * Math.sin(angleSlice * i - Math.PI / 2),
      ]);

      const polygonPath = d3.line<[number, number]>()
        .x((d) => d[0])
        .y((d) => d[1])
        .curve(d3.curveLinearClosed);

      axisGrid
        .append("path")
        .attr("d", polygonPath(levelPoints) || "")
        .attr("fill", level % 2 === 0 ? "#f8fafc" : "#ffffff")
        .attr("stroke", "#e2e8f0")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", level === levels ? "none" : "2,2");

      // Level percentage labels
      axisGrid
        .append("text")
        .attr("x", 4)
        .attr("y", -levelRadius + 4)
        .attr("font-size", "9px")
        .attr("font-weight", "800")
        .attr("fill", "#94a3b8")
        .text(`${levelFactor}%`);
    }

    // 2. Draw Radial Axis Lines & Labels
    const axis = axisGrid
      .selectAll(".axis")
      .data(metrics)
      .enter()
      .append("g")
      .attr("class", "axis");

    // Axis line
    axis
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (_, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (_, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 1);

    // Axis outer labels
    axis
      .append("text")
      .attr("class", "legend")
      .attr("font-size", compact ? "10px" : "11px")
      .attr("font-weight", "900")
      .attr("font-family", "inherit")
      .attr("fill", (d) => {
        if (hoveredMetric?.axis === d.axis) return "#0284c7";
        return "#1e293b";
      })
      .attr("text-anchor", (_, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const cos = Math.cos(angle);
        if (Math.abs(cos) < 0.2) return "middle";
        return cos > 0 ? "start" : "end";
      })
      .attr("dy", (_, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const sin = Math.sin(angle);
        if (sin < -0.8) return "-0.6em";
        if (sin > 0.8) return "1.2em";
        return "0.35em";
      })
      .attr("x", (_, i) => (rScale(100) + (compact ? 12 : 18)) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (_, i) => (rScale(100) + (compact ? 12 : 18)) * Math.sin(angleSlice * i - Math.PI / 2))
      .text((d) => d.axis)
      .style("cursor", "pointer")
      .on("mouseenter", (_, d) => setHoveredMetric(d))
      .on("mouseleave", () => setHoveredMetric(null));

    // Radar line generator
    const radarLine = d3
      .lineRadial<number>()
      .radius((d) => rScale(d))
      .angle((_, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    // 3. Draw Job Benchmark Polygon (Target Metric)
    if (showJobBaseline) {
      const jobData = metrics.map((m) => m.jobValue);
      const jobPath = radarLine(jobData);

      g.append("path")
        .attr("class", "radar-area-job")
        .attr("d", jobPath || "")
        .attr("fill", `url(#job-radar-grad-${job.id})`)
        .attr("stroke", "#f97316")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,4")
        .style("opacity", 0)
        .transition()
        .duration(600)
        .style("opacity", 1);

      // Job nodes
      metrics.forEach((m, i) => {
        const x = rScale(m.jobValue) * Math.cos(angleSlice * i - Math.PI / 2);
        const y = rScale(m.jobValue) * Math.sin(angleSlice * i - Math.PI / 2);

        g.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 3)
          .attr("fill", "#ea580c")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 1.5);
      });
    }

    // 4. Draw Candidate Skill Polygon (Candidate Profile)
    if (showCandidateOverlay) {
      const candData = metrics.map((m) => m.candidateValue);
      const candPath = radarLine(candData);

      const candidatePolygon = g
        .append("path")
        .attr("class", "radar-area-candidate")
        .attr("d", candPath || "")
        .attr("fill", `url(#cand-radar-grad-${candidate.id})`)
        .attr("stroke", "#0284c7")
        .attr("stroke-width", 2.5)
        .style("filter", "drop-shadow(0px 4px 12px rgba(14, 165, 233, 0.25))")
        .style("opacity", 0);

      candidatePolygon.transition().duration(800).style("opacity", 1);

      // Candidate interactive vertex nodes
      metrics.forEach((m, i) => {
        const x = rScale(m.candidateValue) * Math.cos(angleSlice * i - Math.PI / 2);
        const y = rScale(m.candidateValue) * Math.sin(angleSlice * i - Math.PI / 2);

        const isHovered = hoveredMetric?.axis === m.axis;

        const nodeGroup = g
          .append("g")
          .attr("class", "radar-node")
          .style("cursor", "pointer")
          .on("mouseenter", () => setHoveredMetric(m))
          .on("mouseleave", () => setHoveredMetric(null));

        // Outer glow on hover
        if (isHovered) {
          nodeGroup
            .append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 9)
            .attr("fill", "#38bdf8")
            .attr("opacity", 0.4);
        }

        // Inner solid dot
        nodeGroup
          .append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", isHovered ? 6 : 4.5)
          .attr("fill", m.candidateValue >= m.jobValue ? "#0284c7" : "#f59e0b")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 2)
          .transition()
          .duration(200);
      });
    }

    // Center Anchor Badge
    g.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 4)
      .attr("fill", "#0f172a");

  }, [candidate, job, compact, showJobBaseline, showCandidateOverlay, hoveredMetric]);

  // Compute overall match stats
  const averageCandidateScore = Math.round(
    metrics.reduce((acc, m) => acc + m.candidateValue, 0) / metrics.length
  );
  const averageJobRequirement = Math.round(
    metrics.reduce((acc, m) => acc + m.jobValue, 0) / metrics.length
  );
  const delta = averageCandidateScore - averageJobRequirement;

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-[28px] border-2 border-slate-900 p-5 sm:p-6 shadow-xl space-y-5"
    >
      {/* Header with Candidate & Job Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <img
            src={
              candidate.candidatePhoto ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            }
            alt={candidate.candidateName}
            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-sky-500 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-base text-slate-900 uppercase tracking-tight">
                {candidate.candidateName}
              </h4>
              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-sky-600" />
                <span>{candidate.matchScore}% Match</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Evaluating for <strong className="text-slate-800">{job.title}</strong>
            </p>
          </div>
        </div>

        {/* Legend / Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCandidateOverlay(!showCandidateOverlay)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
              showCandidateOverlay
                ? "bg-sky-50 border-sky-300 text-sky-900 shadow-xs"
                : "bg-slate-50 border-slate-200 text-slate-400"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            <span>Candidate ({averageCandidateScore}%)</span>
          </button>

          <button
            onClick={() => setShowJobBaseline(!showJobBaseline)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
              showJobBaseline
                ? "bg-orange-50 border-orange-300 text-orange-900 shadow-xs"
                : "bg-slate-50 border-slate-200 text-slate-400"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full border border-dashed border-orange-500 bg-orange-200"></span>
            <span>Job Req ({averageJobRequirement}%)</span>
          </button>
        </div>
      </div>

      {/* Main Radar SVG Visualization */}
      <div className="relative flex items-center justify-center p-2 bg-slate-50/50 rounded-2xl border border-slate-100 min-h-[340px]">
        <svg ref={svgRef} className="w-full max-w-[420px] aspect-square select-none" />

        {/* Live Hover Detail Card Overlay */}
        {hoveredMetric && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-xs p-3.5 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-150 z-20 space-y-2 pointer-events-none">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                {hoveredMetric.axis}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                  hoveredMetric.candidateValue >= hoveredMetric.jobValue
                    ? "bg-emerald-500 text-white"
                    : "bg-amber-500 text-white"
                }`}
              >
                {hoveredMetric.candidateValue >= hoveredMetric.jobValue ? "Exceeds Target" : "Slight Gap"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Candidate</span>
                <p className="font-black text-sky-300 text-sm">{hoveredMetric.candidateValue}%</p>
                <p className="text-[10px] text-slate-300 leading-tight">{hoveredMetric.candidateDetails}</p>
              </div>
              <div className="space-y-0.5 border-l border-slate-800 pl-2">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Job Baseline</span>
                <p className="font-black text-orange-400 text-sm">{hoveredMetric.jobValue}%</p>
                <p className="text-[10px] text-slate-300 leading-tight">{hoveredMetric.jobDetails}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metric Breakdown Pill Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
        {metrics.map((m, idx) => {
          const isHigher = m.candidateValue >= m.jobValue;
          const diff = m.candidateValue - m.jobValue;
          const isSelected = hoveredMetric?.axis === m.axis;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredMetric(m)}
              onMouseLeave={() => setHoveredMetric(null)}
              className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                isSelected
                  ? "bg-sky-50 border-sky-400 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 truncate">
                  {m.axis}
                </span>
                {isHigher ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                )}
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xs font-black text-slate-900">{m.candidateValue}%</span>
                <span
                  className={`text-[9px] font-black uppercase tracking-wider ${
                    diff >= 0 ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {diff >= 0 ? `+${diff}%` : `${diff}%`}
                </span>
              </div>

              {/* Mini progress bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isHigher ? "bg-sky-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${m.candidateValue}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Fit Verdict */}
      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Info className="w-4 h-4 text-sky-600 shrink-0" />
          <span className="font-medium text-xs">
            Overall Skill Delta: <strong className="font-black text-slate-900">{delta >= 0 ? `+${delta}% above target` : `${delta}% under target`}</strong> across 6 competency axes.
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Verdict:</span>
          <span
            className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full ${
              candidate.matchScore >= 90
                ? "bg-emerald-100 text-emerald-800"
                : candidate.matchScore >= 80
                ? "bg-sky-100 text-sky-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {candidate.matchScore >= 90 ? "Strong Fit" : candidate.matchScore >= 80 ? "Good Fit" : "Moderate Fit"}
          </span>
        </div>
      </div>
    </div>
  );
};
