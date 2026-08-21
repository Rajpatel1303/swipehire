import React, { useState } from "react";
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Shield,
  Zap,
  Loader2,
  FileCheck,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { GeminiService } from "../../services/geminiService";

export const CandidateOnboarding: React.FC = () => {
  const { candidate, updateCandidate, setActiveView, triggerCelebration } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentScanStep, setCurrentScanStep] = useState<string>("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processResumeContent = async (
    input: File | string,
    originalName?: string,
    personName?: string
  ) => {
    setIsProcessing(true);
    setErrorMsg(null);
    const resolvedFileName = originalName || (input instanceof File ? input.name : "Resume.pdf");
    setFileName(resolvedFileName);

    // Scan steps animation
    setCurrentScanStep("Uploading & analyzing document stream with Eden AI...");
    await new Promise((r) => setTimeout(r, 600));

    setCurrentScanStep("✦ Eden AI extracting work history, skills, experience & achievements...");
    await new Promise((r) => setTimeout(r, 700));

    setCurrentScanStep("Mapping extracted skills to SwipeHired Career Profile...");

    try {
      const extracted = await GeminiService.parseResume(
        input,
        personName || candidate.fullName,
        resolvedFileName
      );

      updateCandidate({
        fullName: extracted.fullName || candidate.fullName || "",
        headline: extracted.headline || candidate.headline || "",
        email: extracted.email || candidate.email || "",
        phone: extracted.phone || candidate.phone || "",
        location: extracted.location || candidate.location || "",
        workPreference: extracted.workPreference || candidate.workPreference || "Hybrid",
        yearsOfExperience: extracted.yearsOfExperience !== undefined ? extracted.yearsOfExperience : (candidate.yearsOfExperience || 0),
        skills: extracted.skills && extracted.skills.length > 0 ? extracted.skills : (candidate.skills || []),
        possibleRoles: extracted.possibleRoles || candidate.possibleRoles || [],
        education: (extracted.education as any) || candidate.education || [],
        experience: (extracted.experience as any) || candidate.experience || [],
        projects: (extracted.projects as any) || candidate.projects || [],
        certifications: extracted.certifications || candidate.certifications || [],
        expectedSalary: extracted.expectedSalary || candidate.expectedSalary || "",
        preferredRole: extracted.preferredRole || candidate.preferredRole || "",
        bio: extracted.bio || candidate.bio || "",
        resumeFilename: resolvedFileName,
        resumeText: typeof input === "string" ? input : `Uploaded document: ${resolvedFileName}`,
      });

      triggerCelebration();
      setActiveView("candidate-review");
    } catch (err: any) {
      console.error("Resume processing error:", err);
      setErrorMsg("AI extraction encountered an issue reading the document format. Proceeding to manual review.");
      setActiveView("candidate-review");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processResumeContent(file, file.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processResumeContent(file, file.name);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-10 space-y-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Eden AI Resume Ingestion</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            "Let's build your career profile."
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Upload your resume. Our AI reads your background, extracts verified skills, work history, and auto-fills every field for you.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-800 text-xs flex items-center gap-2 border border-amber-200 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Upload Zone */}
        {!isProcessing ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-emerald-500 bg-emerald-50/50 scale-[1.01]"
                : "border-slate-300 hover:border-emerald-500 hover:bg-slate-50/50"
            }`}
          >
            <input
              id="resume-file-input"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="resume-file-input" className="cursor-pointer space-y-4 block">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Drop your resume here or <span className="text-emerald-600 underline">browse</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Supported formats: <strong>PDF, DOC, DOCX, TXT</strong> (Auto-extracted by Eden AI)
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[11px] text-slate-600 font-medium">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Private · AI encrypted parsing</span>
              </div>
            </label>
          </div>
        ) : (
          /* Processing State */
          <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200 text-center space-y-6">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-2xl bg-emerald-500 animate-ping opacity-25"></div>
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900">
                Extracting Details with Eden AI...
              </h3>
              <p className="text-xs text-emerald-700 font-semibold animate-pulse">
                {currentScanStep}
              </p>
              {fileName && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[11px] text-slate-600 font-medium">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{fileName}</span>
                </div>
              )}
            </div>

            <div className="max-w-xs mx-auto w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 via-sky-500 to-orange-500 h-full w-4/5 animate-pulse rounded-full"></div>
            </div>
          </div>
        )}

        {/* Manual Skip Option */}
        <div className="text-center pt-2 border-t border-slate-100">
          <button
            onClick={() => setActiveView("candidate-review")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Or fill details manually without resume →
          </button>
        </div>
      </div>
    </div>
  );
};
