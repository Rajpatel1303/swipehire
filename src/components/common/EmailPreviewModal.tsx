import React, { useState } from "react";
import {
  X,
  Smartphone,
  Monitor,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Mail,
  Palette,
  Eye,
  Code,
} from "lucide-react";
import {
  EmailDesignTheme,
  EMAIL_THEMES,
  buildDesignedEmailHtml,
} from "../../utils/emailDesigner";

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
  bodyText: string;
  companyName: string;
  candidateName?: string;
  jobTitle?: string;
  senderName?: string;
  initialTheme?: EmailDesignTheme;
  ctaText?: string;
  ctaUrl?: string;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  onClose,
  subject,
  bodyText,
  companyName,
  candidateName = "Alex Johnson",
  jobTitle = "Senior Full-Stack Engineer",
  senderName,
  initialTheme = "modern",
  ctaText,
  ctaUrl,
}) => {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [activeTheme, setActiveTheme] = useState<EmailDesignTheme>(initialTheme);
  const [viewMode, setViewMode] = useState<"visual" | "html">("visual");
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const htmlContent = buildDesignedEmailHtml({
    theme: activeTheme,
    subject,
    bodyText,
    companyName: companyName || "Acme Corp",
    candidateName,
    jobTitle,
    senderName,
    ctaText,
    ctaUrl,
  });

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const currentDateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl border-2 border-slate-900 shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Control Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Interactive Email Designer Preview</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Simulation
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Responsive HTML preview with variable substitution and design theme rendering
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {/* Desktop / Mobile Toggle */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  device === "desktop"
                    ? "bg-slate-700 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Desktop 600px Preview"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  device === "mobile"
                    ? "bg-slate-700 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Mobile 375px Device Preview"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            {/* View Mode Toggle: Visual vs HTML Code */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode("visual")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "visual"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Visual</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("html")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "html"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>HTML</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyHtml}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy raw HTML email markup"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? "Copied!" : "Copy HTML"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Theme Selector Strip */}
        <div className="px-5 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Design Style:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(Object.keys(EMAIL_THEMES) as EmailDesignTheme[]).map((themeKey) => {
                const isSelected = activeTheme === themeKey;
                const t = EMAIL_THEMES[themeKey];
                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => setActiveTheme(themeKey)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-xs scale-102"
                        : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-300"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: t.accentColor }}
                    />
                    <span>{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <span className="text-[11px] text-slate-500 font-medium hidden md:inline">
            Variables: <strong>{candidateName}</strong> · <strong>{jobTitle}</strong> · <strong>{companyName}</strong>
          </span>
        </div>

        {/* Email Client Simulated Header */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 space-y-1.5 text-xs text-slate-700 shrink-0 font-sans shadow-2xs">
          <div className="flex items-baseline justify-between gap-2">
            <div className="font-bold text-sm text-slate-900 truncate">
              {subject.replace(/\{\{\s*job_title\s*\}\}/gi, jobTitle).replace(/\{\{\s*company_name\s*\}\}/gi, companyName)}
            </div>
            <span className="text-[11px] text-slate-400 shrink-0 font-mono">{currentDateStr}</span>
          </div>
          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-slate-500">
            <div>
              <span className="text-slate-400">From: </span>
              <strong className="text-slate-800">{senderName || companyName}</strong>{" "}
              <span className="font-mono text-slate-500">&lt;recruiting@{companyName.toLowerCase().replace(/\s+/g, "")}.com&gt;</span>
            </div>
            <div>
              <span className="text-slate-400">To: </span>
              <strong className="text-slate-800">{candidateName}</strong>{" "}
              <span className="font-mono text-slate-500">&lt;alex.j@example.com&gt;</span>
            </div>
          </div>
        </div>

        {/* Main Preview Screen */}
        <div className="flex-1 overflow-auto bg-slate-200/70 p-4 sm:p-6 flex justify-center items-start">
          {viewMode === "visual" ? (
            <div
              className={`transition-all duration-300 ${
                device === "mobile"
                  ? "w-[385px] bg-slate-900 p-3 rounded-[40px] shadow-2xl border-4 border-slate-800"
                  : "w-full max-w-[650px]"
              }`}
            >
              {/* Mobile Notch Bar */}
              {device === "mobile" && (
                <div className="flex items-center justify-between px-6 py-2 text-[10px] text-slate-400 font-bold mb-1">
                  <span>9:41</span>
                  <div className="w-16 h-3.5 bg-slate-950 rounded-full mx-auto" />
                  <span>5G 100%</span>
                </div>
              )}

              {/* Iframe with exact rendered HTML */}
              <div
                className={`overflow-hidden ${
                  device === "mobile"
                    ? "rounded-[28px] bg-white h-[680px] shadow-inner"
                    : "rounded-2xl shadow-xl border border-slate-200"
                }`}
              >
                <iframe
                  title="Email Visual Preview"
                  srcDoc={htmlContent}
                  className="w-full h-full min-h-[620px] border-none bg-white"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          ) : (
            /* HTML Code Viewer */
            <div className="w-full max-w-4xl bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-2xl text-xs font-mono text-slate-300 overflow-x-auto max-h-full">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <span className="text-slate-400 font-bold">Generated Client-Safe HTML Email</span>
                <span className="text-[10px] text-emerald-400 font-mono">100% Email Client Compatible</span>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed text-[11px] text-sky-200">
                {htmlContent}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Emails sent with this template will automatically render this designed layout for the candidate.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Done Previewing
          </button>
        </div>
      </div>
    </div>
  );
};
