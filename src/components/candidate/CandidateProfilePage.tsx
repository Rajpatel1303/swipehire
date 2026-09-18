import React, { useState } from "react";
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
  ExternalLink,
  Star,
  Camera,
  Sliders,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { GitHubRepoItem } from "../../types";
import { GitHubProjectModal } from "../common/GitHubProjectModal";
import { UserAvatar } from "../common/UserAvatar";
import { ProfilePhotoModal } from "../common/ProfilePhotoModal";

export const CandidateProfilePage: React.FC = () => {
  const { candidate, updateCandidate, setActiveView } = useApp();
  const [inspectingProject, setInspectingProject] = useState<{ repo: GitHubRepoItem; username: string } | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

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
            <div className="relative group cursor-pointer" onClick={() => setIsPhotoModalOpen(true)}>
              <UserAvatar
                src={candidate.profilePhoto}
                alt={candidate.fullName}
                size="3xl"
                settings={candidate.photoSettings}
                fallbackText={candidate.fullName}
                className="transition-transform group-hover:scale-105"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPhotoModalOpen(true);
                }}
                className="absolute -bottom-1 -right-1 p-1.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg shadow-md transition-colors cursor-pointer"
                title="Customize photo, shape & frames"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-black text-slate-900">{candidate.fullName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  AI Verified ✦
                </span>
                {candidate.photoSettings?.shape && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                    {candidate.photoSettings.shape}
                  </span>
                )}
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

          <div className="flex items-center gap-2 self-center sm:self-start shrink-0">
            <button
              onClick={() => setIsPhotoModalOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              <span>Customize Photo</span>
            </button>
            <button
              onClick={() => setActiveView("candidate-review")}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>
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
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <span>Work Experience ({candidate.experience?.length || 0})</span>
            </h3>
            <button
              onClick={() => setActiveView("candidate-review")}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>
          <div className="space-y-3">
            {(!candidate.experience || candidate.experience.length === 0) ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500 text-center">
                No work experience listed yet.{" "}
                <button
                  onClick={() => setActiveView("candidate-review")}
                  className="font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Click to add experience →
                </button>
              </div>
            ) : (
              candidate.experience.map((exp, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="text-sm">{exp.title}</span>
                    <span className="text-slate-400 font-normal">{exp.duration}</span>
                  </div>
                  <div className="text-emerald-700 font-semibold mt-0.5">{exp.company}</div>
                  {exp.description && (
                    <p className="text-slate-600 mt-2 leading-relaxed">{exp.description}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Education & Projects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>Education ({candidate.education?.length || 0})</span>
              </h3>
              <button
                onClick={() => setActiveView("candidate-review")}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
            {(!candidate.education || candidate.education.length === 0) ? (
              <div className="text-slate-500 py-3 text-center border border-dashed border-slate-200 rounded-xl">
                No education added.{" "}
                <button
                  onClick={() => setActiveView("candidate-review")}
                  className="font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Add education →
                </button>
              </div>
            ) : (
              candidate.education.map((edu, i) => (
                <div key={i} className="text-slate-600 space-y-0.5 border-b border-slate-100 last:border-b-0 pb-2 last:pb-0">
                  <strong className="text-slate-900 block">{edu.degree}</strong>
                  <p>{edu.institution}</p>
                  <span className="text-[11px] text-slate-400">Class of {edu.year}</span>
                </div>
              ))
            )}
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <FolderGit2 className="w-4 h-4 text-sky-600" />
                <span>Featured Projects ({candidate.projects?.length || 0})</span>
              </h3>
              <button
                onClick={() => setActiveView("candidate-review")}
                className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
            {(!candidate.projects || candidate.projects.length === 0) ? (
              <div className="text-slate-500 py-3 text-center border border-dashed border-slate-200 rounded-xl">
                No projects added.{" "}
                <button
                  onClick={() => setActiveView("candidate-review")}
                  className="font-bold text-sky-700 hover:underline cursor-pointer"
                >
                  Add projects →
                </button>
              </div>
            ) : (
              candidate.projects.map((proj, i) => (
                <div key={i} className="text-slate-600 space-y-1 border-b border-slate-100 last:border-b-0 pb-2 last:pb-0">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 block">{proj.name}</strong>
                    {proj.link && (
                      <a
                        href={proj.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 hover:text-sky-800 text-[11px] font-bold"
                      >
                        Link ↗
                      </a>
                    )}
                  </div>
                  {proj.description && (
                    <p className="text-[11px] text-slate-500 leading-snug">{proj.description}</p>
                  )}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {proj.technologies.map((t, ti) => (
                        <span key={ti} className="px-1.5 py-0.5 bg-slate-200/70 text-slate-700 rounded text-[9px] font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* GitHub Verification & Code Activity Section */}
        {candidate.githubData?.connected ? (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
              <div className="flex items-center gap-3">
                <img
                  src={candidate.githubData.avatarUrl || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"}
                  alt={candidate.githubData.username}
                  className="w-12 h-12 rounded-2xl border border-slate-600 object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{candidate.githubData.name || candidate.githubData.username}</span>
                    <a
                      href={candidate.githubData.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sky-400 hover:text-sky-300 font-mono inline-flex items-center gap-1"
                    >
                      @{candidate.githubData.username}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  {candidate.githubData.bio && (
                    <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">{candidate.githubData.bio}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] text-emerald-300 font-medium">
                      {candidate.githubData.lastActiveSummary || "Active on GitHub"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  GitHub Verified
                </span>
                <button
                  onClick={() => setActiveView("candidate-review")}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Manage
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Public Repos</span>
                <span className="text-lg font-black text-white">
                  {candidate.githubData.publicRepos ?? (candidate.githubData as any).publicReposCount ?? candidate.githubData.topRepos?.length ?? 0}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Stars</span>
                <span className="text-lg font-black text-amber-400">
                  ★ {candidate.githubData.totalStars ?? candidate.githubData.topRepos?.reduce((acc: number, r: any) => acc + (r.starsCount ?? r.stars ?? 0), 0) ?? 0}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Followers</span>
                <span className="text-lg font-black text-sky-400">
                  {candidate.githubData.followers ?? (candidate.githubData as any).followersCount ?? 0}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Recency</span>
                <span className="text-xs font-bold text-emerald-400 mt-1 inline-block">Active Contributor</span>
              </div>
            </div>

            {/* Languages */}
            {candidate.githubData.languages && candidate.githubData.languages.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Top Languages</span>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.githubData.languages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium"
                    >
                      {lang.name} <span className="text-[10px] text-slate-400">({lang.percentage}%)</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Featured GitHub Repos */}
            {candidate.githubData.topRepos && candidate.githubData.topRepos.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-700/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    <span>Featured Repositories & AI Intel ({candidate.githubData.topRepos.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Click to preview project & README</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {candidate.githubData.topRepos.map((repo, idx) => (
                    <div
                      key={idx}
                      onClick={() => setInspectingProject({ repo, username: candidate.githubData?.username || "" })}
                      className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-sky-500 hover:bg-slate-800 transition-all text-xs group cursor-pointer flex flex-col justify-between gap-2.5"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-bold text-white group-hover:text-sky-300 transition-colors truncate">
                              {repo.name}
                            </span>
                            {repo.homepage && (
                              <a
                                href={repo.homepage}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0 hover:bg-emerald-500/30 transition-colors inline-flex items-center gap-0.5"
                                title="Open Live App"
                              >
                                <span>Live</span>
                                <ExternalLink className="w-2 h-2" />
                              </a>
                            )}
                          </div>
                          <span className="text-[10px] text-amber-400 shrink-0 flex items-center gap-0.5 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                            ★ {repo.starsCount ?? repo.stars ?? 0}
                          </span>
                        </div>
                        <p className="text-slate-300 line-clamp-2 text-[11px] leading-relaxed">
                          {repo.description || "Public repository on GitHub"}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-2 text-slate-400">
                          {repo.language && (
                            <span className="inline-flex items-center gap-1 text-slate-200 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                              {repo.language}
                            </span>
                          )}
                          {(repo.forksCount ?? repo.forks ?? 0) > 0 && <span>• {repo.forksCount ?? repo.forks} forks</span>}
                        </div>
                        <span className="text-sky-400 font-semibold group-hover:underline flex items-center gap-1">
                          Explain Project →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>
              <div>
                <span className="font-bold text-amber-900 block">GitHub Profile Not Connected</span>
                <span className="text-amber-700 text-[11px]">Connect your GitHub to verify code proof and activate maximum radar visibility.</span>
              </div>
            </div>
            <button
              onClick={() => setActiveView("candidate-review")}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              Connect GitHub →
            </button>
          </div>
        )}

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

      {inspectingProject && (
        <GitHubProjectModal
          isOpen={true}
          onClose={() => setInspectingProject(null)}
          repo={inspectingProject.repo}
          username={inspectingProject.username}
        />
      )}

      {/* Profile Photo Customizer Modal */}
      <ProfilePhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        currentPhoto={candidate.profilePhoto}
        currentSettings={candidate.photoSettings}
        githubAvatarUrl={candidate.githubData?.avatarUrl}
        githubUsername={candidate.githubData?.username}
        candidateName={candidate.fullName}
        onSave={(newPhoto, newSettings) => {
          updateCandidate({
            profilePhoto: newPhoto,
            photoSettings: newSettings,
          });
        }}
      />
    </div>
  );
};
