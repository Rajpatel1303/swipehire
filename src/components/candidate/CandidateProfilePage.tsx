import React from "react";
import {
  User,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  FolderGit2,
  FileText,
  Edit3,
  CheckCircle2,
  TrendingUp,
  Award,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export const CandidateProfilePage: React.FC = () => {
  const { candidate, setActiveView } = useApp();

  // Profile strength calculation
  const strengthScore = candidate.skills && candidate.skills.length >= 3 ? 92 : 75;

  const candidateTargetRole = candidate.preferredRole || candidate.headline || "your field";
  const candidateCity = candidate.location?.split(",")[0] || "your region";

  const aiImprovementTips = [
    {
      tip: `Add portfolio projects and certifications relevant to ${candidateTargetRole} to boost interview invites by +15%.`,
      impact: "+15% Matches",
    },
    {
      tip: `Keep your verified skills up to date (${(candidate.skills || []).slice(0, 2).join(", ") || "core skills"}) to rank higher on recruiter radars.`,
      impact: "Top 5% Radar",
    },
    {
      tip: "Set your preferred notice period (e.g. Immediate / 15 Days) for instant recruiter shortlisting.",
      impact: "2x Fast-Track",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header Profile Summary */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <img
              src={
                candidate.profilePhoto ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
              }
              alt={candidate.fullName}
              className="w-24 h-24 rounded-3xl object-cover ring-4 ring-emerald-50 shadow-md"
            />
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-black text-slate-900">{candidate.fullName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  AI Verified ✦
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-700">{candidate.headline}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-500" />
                  {candidate.location} ({candidate.workPreference})
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.phone}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveView("candidate-review")}
            className="self-center sm:self-start px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Profile Strength Meter & AI Recommendations */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-sky-50 to-orange-50 border border-emerald-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                  Career Radar Profile Strength: {strengthScore}%
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                Your profile is optimized for <strong>{candidateTargetRole}</strong> roles in {candidateCity}.
              </p>
            </div>
            <div className="w-32 bg-slate-200 h-2.5 rounded-full overflow-hidden shrink-0">
              <div
                className="bg-gradient-to-r from-emerald-500 to-sky-500 h-full rounded-full"
                style={{ width: `${strengthScore}%` }}
              ></div>
            </div>
          </div>

          {/* AI Tips */}
          <div className="pt-2 border-t border-emerald-200/60 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              ✦ AI Tips to maximize match scores:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {aiImprovementTips.map((tip, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-white/90 rounded-xl border border-slate-200/70 space-y-1"
                >
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-800 rounded-md">
                    {tip.impact}
                  </span>
                  <p className="text-[11px] text-slate-600 leading-snug">{tip.tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Verified Skills</h3>
          <div className="flex flex-wrap gap-2">
            {candidate.skills?.map((skill, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{skill}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Experience Section */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <span>Work Experience</span>
          </h3>
          <div className="space-y-3">
            {candidate.experience?.map((exp, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span className="text-sm">{exp.title}</span>
                  <span className="text-slate-400 font-normal">{exp.duration}</span>
                </div>
                <div className="text-emerald-700 font-semibold mt-0.5">{exp.company}</div>
                <p className="text-slate-600 mt-2 leading-relaxed">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Education & Projects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span>Education</span>
            </h3>
            {candidate.education?.map((edu, i) => (
              <div key={i} className="text-slate-600 space-y-0.5">
                <strong className="text-slate-900 block">{edu.degree}</strong>
                <p>{edu.institution}</p>
                <span className="text-[11px] text-slate-400">Class of {edu.year}</span>
              </div>
            ))}
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <FolderGit2 className="w-4 h-4 text-sky-600" />
              <span>Featured Projects</span>
            </h3>
            {candidate.projects?.map((proj, i) => (
              <div key={i} className="text-slate-600 space-y-0.5">
                <strong className="text-slate-900 block">{proj.name}</strong>
                <p className="text-[11px] text-slate-500 leading-snug">{proj.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Resume Attachment Preview */}
        <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">
                {candidate.resumeFilename || "Candidate_Resume.pdf"}
              </span>
              <span className="text-[11px] text-slate-500">
                Uploaded and indexed by AI Resume Parser
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveView("candidate-onboarding")}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            Replace Resume →
          </button>
        </div>

        {/* Mandatory Placement & 10% Commission Agreement Card */}
        <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 rounded-2xl border border-emerald-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-sm">
                  10% Placement Commission Agreement
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {candidate.commissionAgreementSigned ? "E-Signed & Active" : "Action Required"}
                </span>
              </div>
              <p className="text-slate-600">
                {candidate.commissionAgreementSigned ? (
                  <>
                    Ref: <span className="font-mono font-bold text-slate-800">{candidate.commissionAgreementDocId || "SH-AGR-VERIFIED"}</span> · Signed by <strong className="text-slate-900">{candidate.commissionAgreementSignature?.signerName || candidate.fullName}</strong> on {candidate.commissionAgreementSignedAt ? new Date(candidate.commissionAgreementSignedAt).toLocaleDateString() : "Active"}
                  </>
                ) : (
                  "You must review and e-sign the 10% success fee placement agreement to activate radar matching."
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveView("candidate-agreement")}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            {candidate.commissionAgreementSigned ? "View / Print Agreement →" : "Sign Agreement →"}
          </button>
        </div>
      </div>
    </div>
  );
};
