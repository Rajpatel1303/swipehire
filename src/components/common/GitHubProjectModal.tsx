import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  ExternalLink,
  Star,
  GitFork,
  AlertCircle,
  FileText,
  Code,
  Globe,
  Clock,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { GitHubRepoItem } from "../../types";
import { GitHubService } from "../../services/githubService";

interface GitHubProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  repo: GitHubRepoItem | null;
  username?: string;
}

export const GitHubProjectModal: React.FC<GitHubProjectModalProps> = ({
  isOpen,
  onClose,
  repo,
  username = "",
}) => {
  const [activeTab, setActiveTab] = useState<"ai-intel" | "readme">("ai-intel");
  const [readmeContent, setReadmeContent] = useState<string | null>(null);
  const [isLoadingReadme, setIsLoadingReadme] = useState(false);
  const [readmeError, setReadmeError] = useState(false);

  useEffect(() => {
    if (!isOpen || !repo) {
      setReadmeContent(null);
      setReadmeError(false);
      return;
    }

    // Auto-fetch README when modal opens
    let isMounted = true;
    const fetchReadme = async () => {
      setIsLoadingReadme(true);
      setReadmeError(false);
      try {
        const text = await GitHubService.fetchRepoReadme(username || repo.fullName?.split("/")[0] || "", repo.name);
        if (isMounted) {
          if (text && text.trim().length > 0) {
            setReadmeContent(text);
          } else {
            setReadmeError(true);
          }
        }
      } catch {
        if (isMounted) setReadmeError(true);
      } finally {
        if (isMounted) setIsLoadingReadme(false);
      }
    };

    fetchReadme();
    return () => {
      isMounted = false;
    };
  }, [isOpen, repo, username]);

  if (!isOpen || !repo) return null;

  const repoUrl = repo.htmlUrl || repo.url || `https://github.com/${username}/${repo.name}`;
  const stars = repo.starsCount ?? repo.stars ?? 0;
  const forks = repo.forksCount ?? repo.forks ?? 0;
  const issues = repo.openIssuesCount ?? 0;
  const techStack = repo.aiTechStack && repo.aiTechStack.length > 0 ? repo.aiTechStack : [repo.language, ...(repo.topics || [])].filter(Boolean);
  const features = repo.aiKeyFeatures && repo.aiKeyFeatures.length > 0 ? repo.aiKeyFeatures : GitHubService.inferProjectFeatures(repo.name, repo.language, repo.topics);
  const engineeringSignal = repo.aiEngineeringSignal || GitHubService.inferEngineeringSignal(repo.name, repo.language);
  const description = repo.description && !repo.description.toLowerCase().includes("public repository on github")
    ? repo.description
    : GitHubService.inferProjectDescription(repo.name, repo.language, repo.homepage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl border-2 border-slate-900 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white border-b border-slate-800 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white truncate">
                    {repo.name}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-sky-400 border border-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    {repo.language || "Code"}
                  </span>
                  {repo.license && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {repo.license}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 font-medium line-clamp-1 mt-0.5">
                  {username ? `@${username} / ${repo.name}` : repo.fullName}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <span>View on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {repo.homepage && (
              <a
                href={repo.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Live Demo / App</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Metrics Strip */}
        <div className="grid grid-cols-4 divide-x divide-slate-100 bg-slate-50 border-b border-slate-200 text-center py-2.5 text-xs">
          <div>
            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Stars</span>
            <span className="text-sm font-black text-amber-600 flex items-center justify-center gap-0.5">
              <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
              {stars}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Forks</span>
            <span className="text-sm font-black text-slate-700 flex items-center justify-center gap-0.5">
              <GitFork className="w-3.5 h-3.5 text-slate-500" />
              {forks}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Issues</span>
            <span className="text-sm font-black text-slate-700">{issues}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Language</span>
            <span className="text-sm font-black text-sky-700 truncate px-1 block">{repo.language || "Code"}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-100">
          <button
            onClick={() => setActiveTab("ai-intel")}
            className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === "ai-intel"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Project Intelligence</span>
          </button>

          <button
            onClick={() => setActiveTab("readme")}
            className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === "readme"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-sky-600" />
            <span>README Documentation</span>
            {readmeContent && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* Modal Body Scroll Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
          {activeTab === "ai-intel" ? (
            <>
              {/* Project Executive Summary */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-sky-50/70 to-slate-50 border border-emerald-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold uppercase text-[11px] tracking-wider">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Executive Overview & Purpose</span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {description}
                </p>
              </div>

              {/* Key Architectural Highlights */}
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                  <span>Key Features & Architecture</span>
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium leading-relaxed">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recruiter Skill Takeaway */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-black uppercase tracking-wider text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Recruiter Skill Proof & Engineering Takeaway</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-medium">
                  {engineeringSignal}
                </p>
              </div>

              {/* Detected Tech Stack & Ecosystem */}
              {techStack.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-purple-600" />
                    <span>Identified Technologies & Topics</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {techStack.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold border border-slate-200"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* README Tab */
            <div className="space-y-3">
              {isLoadingReadme ? (
                <div className="p-10 text-center space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-600 mx-auto" />
                  <p className="text-slate-500 font-medium text-xs">
                    Fetching repository README from GitHub...
                  </p>
                </div>
              ) : readmeContent ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 overflow-x-auto max-h-96">
                  {readmeContent}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-600 font-medium">
                    No public README file was found for this repository.
                  </p>
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-sky-600 font-bold hover:underline"
                  >
                    Browse source code on GitHub ↗
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
          <span className="text-[11px] text-slate-500 font-medium">
            Verified candidate codebase telemetry · Powered by SwipeHire
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
