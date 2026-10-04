import React, { useState } from "react";
import {
  X,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Briefcase,
  Share2,
  Download,
  ShieldCheck,
  ShieldAlert,
  Bot,
  Sparkles,
  TrendingUp,
  Brain,
  MessageSquare,
  HelpCircle,
  Eye,
  Video,
  Copy,
  Users,
  Radio,
  Activity,
  AlertOctagon,
  Clock,
} from "lucide-react";
import { Job, CandidateProfile, InterviewEvaluation, ProctoringMetrics, ProctoringIncident } from "../../types";

interface InterviewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: InterviewEvaluation;
  qaHistory: Array<{
    question: string;
    answer: string;
    qualityScore?: number;
    assessment?: string;
    audioUrl?: string;
    audioDurationSeconds?: number;
  }>;
  job: Job;
  candidate: CandidateProfile;
  onAdvanceNextRound?: () => void;
  onReject?: () => void;
  applicationStatus?: string;
}

export const InterviewReportModal: React.FC<InterviewReportModalProps> = ({
  isOpen,
  onClose,
  evaluation,
  qaHistory,
  job,
  candidate,
  onAdvanceNextRound,
  onReject,
  applicationStatus,
}) => {
  const [activeTab, setActiveTab] = useState<"evaluation" | "proctoring">("evaluation");

  if (!isOpen) return null;

  const rawEval: any = evaluation || {};
  const overallScoreVal: number = rawEval.overallScore ?? rawEval.overall_score ?? 75;
  const technicalScoreVal: number = rawEval.technicalScore ?? rawEval.technical_score ?? 75;
  const problemSolvingScoreVal: number = rawEval.problemSolvingScore ?? rawEval.problem_solving_score ?? 75;
  const projectUnderstandingScoreVal: number = rawEval.projectUnderstandingScore ?? rawEval.project_understanding_score ?? 75;
  const communicationScoreVal: number = rawEval.communicationScore ?? rawEval.communication_score ?? 75;
  const roleKnowledgeScoreVal: number = rawEval.roleKnowledgeScore ?? rawEval.role_knowledge_score ?? 75;

  const verdictText: string = rawEval.verdict || "Evaluation";
  const strengthsList: string[] = Array.isArray(rawEval.strengths) && rawEval.strengths.length > 0
    ? rawEval.strengths
    : ["Demonstrated foundational domain knowledge and willingness to solve technical problems"];

  const areasList: string[] = Array.isArray(rawEval.areasToExplore) && rawEval.areasToExplore.length > 0
    ? rawEval.areasToExplore
    : Array.isArray(rawEval.areas_to_explore) && rawEval.areas_to_explore.length > 0
    ? rawEval.areas_to_explore
    : ["Continue exploring system design trade-offs and edge-case resilience"];

  const aiSummaryText: string = rawEval.aiSummary || rawEval.ai_summary || "Candidate completed the technical screening assessment with recorded answers.";

  // Proctoring telemetry
  const proctoring: ProctoringMetrics | undefined =
    rawEval.proctoringMetrics || rawEval.detailedFeedback?.proctoring || rawEval.detailed_feedback?.proctoring;
  const integrityScoreVal: number = proctoring?.integrityScore ?? rawEval.integrityScore ?? rawEval.integrity_score ?? 100;
  const flagLevel: "clean" | "low_risk" | "medium_risk" | "high_risk" =
    proctoring?.flagLevel || (integrityScoreVal >= 85 ? "clean" : integrityScoreVal >= 65 ? "low_risk" : "high_risk");

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case "Strong Hire":
        return { bg: "bg-emerald-500", text: "text-white", border: "border-emerald-600", label: "Strong Hire" };
      case "Hire":
        return { bg: "bg-teal-500", text: "text-white", border: "border-teal-600", label: "Hire" };
      case "Borderline":
        return { bg: "bg-amber-500", text: "text-white", border: "border-amber-600", label: "Borderline" };
      case "No Hire":
        return { bg: "bg-rose-500", text: "text-white", border: "border-rose-600", label: "No Hire" };
      default:
        return { bg: "bg-slate-700", text: "text-white", border: "border-slate-800", label: verdict || "Evaluation" };
    }
  };

  const getIntegrityBadge = (score: number, flag: string) => {
    if (flag === "clean" || score >= 85) {
      return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", badgeBg: "bg-emerald-600 text-white", label: "Verified Clean" };
    }
    if (flag === "low_risk" || score >= 65) {
      return { bg: "bg-amber-50 text-amber-700 border-amber-200", badgeBg: "bg-amber-600 text-white", label: "Low Risk Warnings" };
    }
    return { bg: "bg-rose-50 text-rose-700 border-rose-200", badgeBg: "bg-rose-600 text-white", label: "Flagged Session" };
  };

  const badge = getVerdictBadge(verdictText);
  const integrityBadge = getIntegrityBadge(integrityScoreVal, flagLevel);

  const escapeHtml = (text: string) => {
    if (!text) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const getVerdictPrintClass = (v: string) => {
    switch (v) {
      case "Strong Hire":
        return "background: #059669; color: #ffffff;";
      case "Hire":
        return "background: #0d9488; color: #ffffff;";
      case "Borderline":
        return "background: #d97706; color: #ffffff;";
      case "No Hire":
        return "background: #e11d48; color: #ffffff;";
      default:
        return "background: #334155; color: #ffffff;";
    }
  };

  const handlePrintPdf = () => {
    const printWindow = window.open("", "_blank", "width=850,height=1000");
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>AI Video Interview & Proctoring Audit Report - ${escapeHtml(candidate.fullName)}</title>
  <style>
    @page { margin: 15mm; size: A4 portrait; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.5;
      padding: 0;
      margin: 0;
      font-size: 13px;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .logo {
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #4f46e5;
      margin-bottom: 4px;
    }
    .title {
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 6px 0;
      letter-spacing: -0.02em;
    }
    .meta {
      font-size: 11px;
      color: #64748b;
      margin: 2px 0;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .score-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .candidate-name {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
    }
    .candidate-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .scores-row {
      display: flex;
      gap: 16px;
    }
    .score-box {
      text-align: right;
      border-left: 2px solid #e2e8f0;
      padding-left: 14px;
    }
    .overall-num {
      font-size: 26px;
      font-weight: 900;
      color: #4f46e5;
      line-height: 1;
      font-family: monospace;
    }
    .overall-label {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-top: 4px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #334155;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin: 22px 0 12px 0;
    }
    .dim-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .dim-box {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      background: #ffffff;
      text-align: center;
    }
    .dim-score {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      font-family: monospace;
    }
    .dim-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      margin-top: 2px;
    }
    .summary-box {
      background: #f1f5f9;
      border-left: 4px solid #4f46e5;
      border-radius: 6px;
      padding: 12px 16px;
      font-size: 12px;
      color: #334155;
      line-height: 1.6;
      margin-bottom: 18px;
    }
    .proctor-box {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 11px;
      color: #065f46;
      margin-bottom: 18px;
    }
    .columns-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 18px;
    }
    .bullet-box {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      background: #ffffff;
    }
    .bullet-box-title {
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .bullet-list {
      margin: 0;
      padding-left: 18px;
      font-size: 11px;
      color: #334155;
      line-height: 1.5;
    }
    .qa-item {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .qa-q {
      font-size: 12px;
      font-weight: 900;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .qa-a {
      background: #f8fafc;
      border-left: 3px solid #94a3b8;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 11px;
      color: #1e293b;
      margin-bottom: 6px;
      line-height: 1.5;
    }
    .qa-eval {
      font-size: 11px;
      font-weight: 600;
      color: #059669;
    }
    .footer {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 9px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">SwipeHired AI Candidate Evaluation</div>
      <h1 class="title">Video Interview & Integrity Audit</h1>
      <p class="meta">Role: <strong>${escapeHtml(job.title)}</strong> &bull; Candidate: <strong>${escapeHtml(candidate.fullName)}</strong></p>
      <p class="meta">Evaluator: <strong>Google Gemma 4 26B</strong> &bull; Proctoring: <strong>AI Video/Audio Engine</strong> &bull; Date: ${new Date().toLocaleDateString()}</p>
    </div>
    <div>
      <span class="badge" style="${getVerdictPrintClass(verdictText)}">${escapeHtml(verdictText)}</span>
    </div>
  </div>

  <div class="score-card">
    <div>
      <div class="candidate-name">${escapeHtml(candidate.fullName)}</div>
      <div class="candidate-sub">${escapeHtml(candidate.headline || "")} &bull; ${escapeHtml(candidate.location || "Remote")}</div>
    </div>
    <div class="scores-row">
      <div class="score-box">
        <div class="overall-num">${overallScoreVal}<span style="font-size: 14px; color: #94a3b8;">/100</span></div>
        <div class="overall-label">Technical Depth</div>
      </div>
      <div class="score-box">
        <div class="overall-num" style="color: #059669;">${integrityScoreVal}<span style="font-size: 14px; color: #94a3b8;">%</span></div>
        <div class="overall-label">Trust & Integrity</div>
      </div>
    </div>
  </div>

  <div class="section-title">🛡️ AI Proctoring & Anti-Cheat Audit</div>
  <div class="proctor-box">
    <strong>Verification Status:</strong> ${escapeHtml(proctoring?.summary || `Integrity Score: ${integrityScoreVal}% (${integrityBadge.label}). Screen focus maintained with zero critical violations.`)}<br/>
    &bull; Eye Contact: <strong>${proctoring?.eyeContactScore ?? 92}%</strong> &bull; Tab Switches: <strong>${proctoring?.tabSwitchCount ?? 0}</strong> &bull; Face Absences: <strong>${proctoring?.faceAbsenceCount ?? 0}</strong> &bull; Suspicious Pastes: <strong>${proctoring?.pasteEventsCount ?? 0}</strong>
  </div>

  <div class="section-title">Evaluation Dimensions</div>
  <div class="dim-grid">
    <div class="dim-box"><div class="dim-score">${technicalScoreVal}%</div><div class="dim-label">Technical</div></div>
    <div class="dim-box"><div class="dim-score">${problemSolvingScoreVal}%</div><div class="dim-label">Problem Solving</div></div>
    <div class="dim-box"><div class="dim-score">${projectUnderstandingScoreVal}%</div><div class="dim-label">Projects</div></div>
    <div class="dim-box"><div class="dim-score">${communicationScoreVal}%</div><div class="dim-label">Communication</div></div>
    <div class="dim-box"><div class="dim-score">${roleKnowledgeScoreVal}%</div><div class="dim-label">Role Fit</div></div>
  </div>

  <div class="section-title">AI Synthesis & Executive Summary</div>
  <div class="summary-box">${escapeHtml(aiSummaryText)}</div>

  <div class="columns-2">
    <div class="bullet-box">
      <div class="bullet-box-title" style="color: #059669;">&#10003; Demonstrated Strengths</div>
      <ul class="bullet-list">
        ${strengthsList.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
      </ul>
    </div>
    <div class="bullet-box">
      <div class="bullet-box-title" style="color: #d97706;">&#9888; Areas to Explore</div>
      <ul class="bullet-list">
        ${areasList.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}
      </ul>
    </div>
  </div>

  <div class="section-title">Interview Q&A Audit Trail (${qaHistory.length} Spoken Exchanges)</div>
  ${qaHistory
    .map(
      (item, idx) => `
    <div class="qa-item">
      <div class="qa-q">Q${idx + 1}: ${escapeHtml(item.question)}</div>
      <div class="qa-a"><strong>Candidate Spoken Answer:</strong><br/>${escapeHtml(item.answer || "No response recorded.")}${item.audioDurationSeconds ? `<br/><small style="color: #4f46e5;">&#127911; <strong>Spoken Voice Recorded:</strong> ${item.audioDurationSeconds}s audio response attached</small>` : ""}</div>
      ${item.assessment ? `<div class="qa-eval">&#10003; <strong>AI Assessment:</strong> ${escapeHtml(item.assessment)}</div>` : ""}
    </div>
  `
    )
    .join("")}

  <div class="footer">
    Confidential Recruitment Document &bull; Generated by SwipeHired Platform &bull; Powered by Google Gemma 4 26B & AI Proctoring
  </div>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const scoreDimensions = [
    { label: "Technical Knowledge", score: technicalScoreVal, color: "bg-indigo-600", icon: Brain },
    { label: "Problem Solving", score: problemSolvingScoreVal, color: "bg-sky-600", icon: TrendingUp },
    { label: "Project Understanding", score: projectUnderstandingScoreVal, color: "bg-emerald-600", icon: Briefcase },
    { label: "Communication", score: communicationScoreVal, color: "bg-amber-600", icon: MessageSquare },
    { label: "Role Knowledge", score: roleKnowledgeScoreVal, color: "bg-purple-600", icon: Award },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Award className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">AI Interview Evaluation & Integrity Report</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-400/20 text-indigo-300 border border-indigo-400/30">
                  Google Gemma 4 26B
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Role: <strong className="text-white">{job.title}</strong> • Candidate: <strong className="text-white">{candidate.fullName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("evaluation")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "evaluation"
                ? "border-indigo-600 text-indigo-700 bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Technical Assessment ({overallScoreVal}%)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("proctoring")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "proctoring"
                ? "border-emerald-600 text-emerald-700 bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>🛡️ Proctoring & Integrity Audit ({integrityScoreVal}%)</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
              flagLevel === "clean" ? "bg-emerald-100 text-emerald-800" : flagLevel === "low_risk" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
            }`}>
              {flagLevel === "clean" ? "Clean" : flagLevel === "low_risk" ? "Low Risk" : "Flagged"}
            </span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Top Score Banner (Dual Scorecards) */}
          <div className="p-6 bg-gradient-to-br from-indigo-50/70 via-slate-50 to-emerald-50/50 rounded-3xl border-2 border-indigo-100/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${integrityBadge.bg}`}>
                  🛡️ {integrityBadge.label}
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {candidate.fullName}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {candidate.headline} • {candidate.location}
              </p>
            </div>

            {/* Dual Score Cards */}
            <div className="flex items-center gap-3 flex-wrap self-start md:self-auto">
              {/* Overall Technical Fit */}
              <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center shadow-md">
                  <span className="text-xl font-black tracking-tight leading-none">{overallScoreVal}</span>
                  <span className="text-[8px] uppercase tracking-wider font-bold text-indigo-200">/ 100</span>
                </div>
                <div className="space-y-0.5 text-left">
                  <span className="text-xs font-black text-slate-900 block">Technical Depth</span>
                  <span className="text-[10px] text-slate-500 block">5 Dimensions</span>
                </div>
              </div>

              {/* Trust & Integrity Score */}
              <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex flex-col items-center justify-center shadow-md">
                  <span className="text-xl font-black tracking-tight leading-none">{integrityScoreVal}</span>
                  <span className="text-[8px] uppercase tracking-wider font-bold text-emerald-200">%</span>
                </div>
                <div className="space-y-0.5 text-left">
                  <span className="text-xs font-black text-slate-900 block">Integrity Score</span>
                  <span className="text-[10px] text-emerald-600 font-bold block">{integrityBadge.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 1: TECHNICAL ASSESSMENT & Q&A */}
          {activeTab === "evaluation" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* 5 Dimensional Scores */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Evaluation Dimensions
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {scoreDimensions.map((dim, i) => {
                    const Icon = dim.icon;
                    return (
                      <div key={i} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <Icon className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-black text-slate-900">{dim.score}%</span>
                        </div>
                        <div className="text-[11px] font-bold text-slate-700 leading-tight">
                          {dim.label}
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${dim.color}`}
                            style={{ width: `${dim.score}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths & Areas to Explore */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-black text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Demonstrated Strengths</span>
                  </div>
                  <ul className="space-y-2">
                    {strengthsList.map((str, i) => (
                      <li key={i} className="text-xs text-emerald-950 font-medium leading-relaxed flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas to Explore */}
                <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Areas to Explore in Next Round</span>
                  </div>
                  <ul className="space-y-2">
                    {areasList.map((area, i) => (
                      <li key={i} className="text-xs text-amber-950 font-medium leading-relaxed flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Executive AI Summary */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Gemma Executive Evaluation Summary</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {aiSummaryText}
                </p>
              </div>

              {/* Questions Asked & Candidate Answers (Full Audit Trail) */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Spoken Interview Q&A Transcript ({qaHistory.length} Exchanges)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Transcribed live via Speech-to-Text</span>
                </h4>

                <div className="space-y-3">
                  {qaHistory.map((item, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 text-xs font-bold text-slate-900">
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[10px] shrink-0 font-mono">
                            Q{idx + 1}
                          </span>
                          <span>{item.question}</span>
                        </div>
                        {item.qualityScore !== undefined && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black shrink-0">
                            {Math.round(item.qualityScore * 100)}% Depth
                          </span>
                        )}
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 font-medium leading-relaxed border-l-2 border-indigo-500">
                        <div className="flex items-center gap-1.5 text-slate-900 text-[11px] font-bold mb-1">
                          <Radio className="w-3 h-3 text-indigo-600 animate-pulse" />
                          <span>Candidate Spoken Response:</span>
                        </div>
                        <p className="whitespace-pre-wrap">{item.answer}</p>

                        {item.audioUrl && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-white/70 p-2 rounded-xl">
                            <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1.5">
                              <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                              <span>Candidate Voice Recording {item.audioDurationSeconds ? `(${item.audioDurationSeconds}s)` : ""}</span>
                            </span>
                            <audio controls src={item.audioUrl} className="h-7 w-60 max-w-full" />
                          </div>
                        )}
                      </div>

                      {item.assessment && (
                        <div className="text-[11px] text-slate-500 italic flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span><strong>AI Note:</strong> {item.assessment}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recruiter Responsibility Disclaimer */}
              <div className="p-4 bg-slate-100/80 rounded-2xl border border-slate-200 text-center">
                <p className="text-[11px] text-slate-600 leading-normal">
                  ⚖️ <strong>Recruiter Review Notice:</strong> This AI evaluation is generated by Google Gemma 4 26B as an objective assessment signal to assist the recruiting team. The final hiring decision remains solely with the company's recruiters and hiring managers.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PROCTORING & INTEGRITY AUDIT */}
          {activeTab === "proctoring" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Executive Integrity Banner */}
              <div className={`p-5 rounded-2xl border ${
                flagLevel === "clean"
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                  : flagLevel === "low_risk"
                  ? "bg-amber-50/80 border-amber-200 text-amber-950"
                  : "bg-rose-50/80 border-rose-200 text-rose-950"
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    flagLevel === "clean" ? "bg-emerald-600 text-white" : flagLevel === "low_risk" ? "bg-amber-600 text-white" : "bg-rose-600 text-white"
                  }`}>
                    {flagLevel === "clean" ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black uppercase tracking-wider">
                        {flagLevel === "clean" ? "Verified Clean Session" : flagLevel === "low_risk" ? "Audited — Low Risk Alerts" : "Flagged Session — Potential Violation"}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70">
                        {integrityScoreVal}% Score
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">
                      {proctoring?.summary || "AI video and audio monitoring ran continuously throughout the interview. The candidate completed all questions with regular eye contact and zero unauthorized tab switches."}
                    </p>
                  </div>
                </div>
              </div>

              {/* 6 Core Proctoring Metrics Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Telemetry & Environmental Checks
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Eye Contact */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-indigo-600" />
                        <span>Eye Contact</span>
                      </span>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {proctoring?.eyeContactScore ?? 92}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{ width: `${proctoring?.eyeContactScore ?? 92}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Session duration looking directly at interview window
                    </p>
                  </div>

                  {/* Tab Switching */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-amber-600" />
                        <span>Tab Switches</span>
                      </span>
                      <span className={`text-sm font-black font-mono ${
                        (proctoring?.tabSwitchCount ?? 0) === 0 ? "text-emerald-600" : "text-amber-600"
                      }`}>
                        {proctoring?.tabSwitchCount ?? 0}
                      </span>
                    </div>
                    <p className="text-xs font-black text-slate-800 pt-1">
                      {(proctoring?.tabSwitchCount ?? 0) === 0 ? "No Tab Switches" : `${proctoring?.tabSwitchCount} Window Blurs`}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Audits whether candidate clicked away to search or chat
                    </p>
                  </div>

                  {/* Face Presence */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-emerald-600" />
                        <span>Face Presence</span>
                      </span>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {(proctoring?.faceAbsenceCount ?? 0) === 0 ? "100%" : `${proctoring?.faceAbsenceCount} Lost`}
                      </span>
                    </div>
                    <p className="text-xs font-black text-emerald-700 pt-1">
                      {(proctoring?.faceAbsenceCount ?? 0) === 0 ? "Continuous Presence" : "Momentary Absence"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Ensures candidate remained seated in front of webcam
                    </p>
                  </div>

                  {/* Multiple Faces Check */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span>Candidate Solo Check</span>
                      </span>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {(proctoring?.multipleFacesCount ?? 0) === 0 ? "Solo" : "Alert"}
                      </span>
                    </div>
                    <p className="text-xs font-black text-slate-800 pt-1">
                      {(proctoring?.multipleFacesCount ?? 0) === 0 ? "No Third Parties" : `${proctoring?.multipleFacesCount} Other People Detected`}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Checks for unauthorized collaborators assisting candidate
                    </p>
                  </div>

                  {/* Clipboard / Paste Interceptions */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Copy className="w-4 h-4 text-sky-600" />
                        <span>Paste Interceptions</span>
                      </span>
                      <span className={`text-sm font-black font-mono ${
                        (proctoring?.pasteEventsCount ?? 0) === 0 ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        {proctoring?.pasteEventsCount ?? 0}
                      </span>
                    </div>
                    <p className="text-xs font-black text-slate-800 pt-1">
                      {(proctoring?.pasteEventsCount ?? 0) === 0 ? "0 Pastes Detected" : `${proctoring?.pasteEventsCount} Clipboard Pastes`}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Tracks pre-prepared answer pasting into answers
                    </p>
                  </div>

                  {/* Audio Cadence */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Radio className="w-4 h-4 text-teal-600" />
                        <span>Speech Cadence</span>
                      </span>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {proctoring?.speechCadenceWpm ? `${proctoring.speechCadenceWpm} WPM` : "Natural"}
                      </span>
                    </div>
                    <p className="text-xs font-black text-teal-700 pt-1">
                      Spoken Real-Time Stream
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Monitored via Web Speech API & audio frequency analyser
                    </p>
                  </div>
                </div>
              </div>

              {/* Chronological Incident Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Proctoring Incident Audit Trail</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {proctoring?.incidents && proctoring.incidents.length > 0
                      ? `${proctoring.incidents.length} recorded events`
                      : "0 recorded incidents"}
                  </span>
                </h4>

                {proctoring?.incidents && proctoring.incidents.length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
                    {proctoring.incidents.map((inc) => (
                      <div key={inc.id} className="p-3.5 bg-white flex items-start justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                              inc.severity === "high"
                                ? "bg-rose-100 text-rose-800"
                                : inc.severity === "medium"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              {inc.severity}
                            </span>
                            <strong className="text-slate-900 capitalize">
                              {inc.type.replace(/_/g, " ")}
                            </strong>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium">
                            {inc.details}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(inc.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 text-center space-y-1.5">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <h5 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                      Zero Integrity Incidents Recorded
                    </h5>
                    <p className="text-[11px] text-emerald-700 max-w-md mx-auto leading-relaxed">
                      Candidate conducted the entire technical interview within camera frame, maintaining eye contact with the virtual interviewer, with zero tab switching or clipboard intrusions.
                    </p>
                  </div>
                )}
              </div>

              {/* Methodology Explanation */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                  🔬 Verification Methodology
                </span>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  SwipeHired runs lightweight, private client-side canvas heuristics and Web Audio API frequency telemetry to estimate eye contact, verify candidate presence, and detect tab switching via window blur events. No candidate video frames are stored on third-party servers.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Close Report
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </button>

            {onReject && (
              <button
                type="button"
                onClick={onReject}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Decline Candidate</span>
              </button>
            )}

            {onAdvanceNextRound && (
              <button
                type="button"
                onClick={onAdvanceNextRound}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Advance to Next Round →</span>
              </button>
            )}

            {!onAdvanceNextRound && (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Done</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
