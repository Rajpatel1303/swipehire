import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  ArrowRight,
  Briefcase,
  FileText,
  Wand2,
  Bookmark,
  Check,
  RotateCcw,
  Clock,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { GeminiService } from "../../services/geminiService";
import { Job, WorkMode } from "../../types";

const DRAFT_STORAGE_KEY = "swipehired_new_job_draft";

interface CompanyAddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanyAddJobModal: React.FC<CompanyAddJobModalProps> = ({ isOpen, onClose }) => {
  const { company, addJob, triggerCelebration } = useApp();

  const [mode, setMode] = useState<"choose" | "ai" | "manual">("choose");

  // AI Prompt Builder state
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [workMode, setWorkMode] = useState<WorkMode>("Hybrid");
  const [location, setLocation] = useState(company.location || "");
  const [experience, setExperience] = useState("1–3 Years");
  const [salary, setSalary] = useState("₹6–10 LPA");
  const [description, setDescription] = useState("");
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  // Draft Autosave tracking
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);

  // Load draft on mount / open
  useEffect(() => {
    if (isOpen) {
      const savedDraftRaw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraftRaw) {
        try {
          const draft = JSON.parse(savedDraftRaw);
          if (draft && draft.title) {
            setTitle(draft.title || "Frontend Developer");
            setDepartment(draft.department || "Engineering");
            setWorkMode(draft.workMode || "Hybrid");
            setLocation(draft.location || company.location || "Ahmedabad, India");
            setExperience(draft.experience || "2–4 Years");
            setSalary(draft.salary || "₹7–10 LPA");
            setDescription(draft.description || "");
            setResponsibilities(draft.responsibilities || []);
            setRequirements(draft.requirements || []);
            setRequiredSkills(draft.requiredSkills || ["React", "TypeScript", "Tailwind CSS"]);
            if (draft.aiPrompt) setAiPrompt(draft.aiPrompt);
            if (draft.mode) setMode(draft.mode);
            setDraftSavedTime(draft.savedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setHasLoadedDraft(true);
            setDraftNotice("Resumed draft from your previous session");
          }
        } catch (err) {
          console.error("Error reading draft", err);
        }
      }
    }
  }, [isOpen, company.location]);

  // Auto-save form fields to localStorage whenever they change
  useEffect(() => {
    if (!isOpen) return;

    const draftData = {
      title,
      department,
      workMode,
      location,
      experience,
      salary,
      description,
      responsibilities,
      requirements,
      requiredSkills,
      aiPrompt,
      mode,
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
    setDraftSavedTime(draftData.savedAt);
  }, [
    isOpen,
    title,
    department,
    workMode,
    location,
    experience,
    salary,
    description,
    responsibilities,
    requirements,
    requiredSkills,
    aiPrompt,
    mode,
  ]);

  if (!isOpen) return null;

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setTitle("Frontend Developer");
    setDepartment("Engineering");
    setWorkMode("Hybrid");
    setLocation(company.location || "Ahmedabad, India");
    setExperience("2–4 Years");
    setSalary("₹7–10 LPA");
    setDescription("");
    setResponsibilities([]);
    setRequirements([]);
    setRequiredSkills(["React", "TypeScript", "Tailwind CSS", "REST APIs"]);
    setMode("choose");
    setHasLoadedDraft(false);
    setDraftNotice(null);
    setDraftSavedTime(null);
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const generated = await GeminiService.generateJob(aiPrompt, company.companyName, company.location);
      setTitle(generated.title || "Frontend Developer");
      setDepartment(generated.department || "Engineering");
      setWorkMode(generated.workMode || "Hybrid");
      setLocation(generated.location || company.location || "Ahmedabad, India");
      setExperience(generated.experience || "2–4 Years");
      setSalary(generated.salary || "₹7–10 LPA");
      setDescription(generated.description || "");
      setResponsibilities(generated.responsibilities || []);
      setRequirements(generated.requirements || []);
      setRequiredSkills(generated.requiredSkills || ["React", "TypeScript", "Tailwind CSS"]);
      setMode("manual");
    } catch (err) {
      console.error(err);
      setMode("manual");
    } finally {
      setIsGenerating(false);
    }
  };

  // Explicit Save as Draft to the Company's Jobs list
  const handleSaveAsDraft = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    addJob({
      companyId: company.id,
      companyName: company.companyName,
      companyLogo: company.logo,
      companyIndustry: company.industry,
      companySize: company.size,
      title: title.trim(),
      department: department.trim(),
      location: location.trim(),
      workMode,
      experience: experience.trim(),
      salary: salary.trim(),
      openings: 2,
      description:
        description ||
        `[Draft] We are seeking a talented ${title} to join ${company.companyName}.`,
      responsibilities:
        responsibilities.length > 0
          ? responsibilities
          : [
              `Design and build robust ${title} features with clean architecture.`,
              "Collaborate closely with product, engineering, and design teams.",
            ],
      requirements:
        requirements.length > 0
          ? requirements
          : [
              `${experience} in production software development.`,
              `Proficiency in ${requiredSkills.slice(0, 3).join(", ")}.`,
            ],
      requiredSkills,
      preferredSkills: ["GraphQL", "Next.js", "Docker"],
      status: "draft",
      matchScore: 90,
    });

    // Clear the transient draft from localStorage once saved to jobs
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    triggerCelebration();
    onClose();
  };

  const handlePublishJob = (e: React.FormEvent) => {
    e.preventDefault();
    addJob({
      companyId: company.id,
      companyName: company.companyName,
      companyLogo: company.logo,
      companyIndustry: company.industry,
      companySize: company.size,
      title,
      department,
      location,
      workMode,
      experience,
      salary,
      openings: 2,
      description:
        description ||
        `We are seeking a talented ${title} to join ${company.companyName}. You will build and scale high-performance web products.`,
      responsibilities:
        responsibilities.length > 0
          ? responsibilities
          : [
              `Design and build robust ${title} features with clean architecture.`,
              "Collaborate closely with product, engineering, and design teams.",
              "Ensure high code quality and test coverage.",
            ],
      requirements:
        requirements.length > 0
          ? requirements
          : [
              `${experience} in production software development.`,
              `Proficiency in ${requiredSkills.slice(0, 3).join(", ")}.`,
              "Strong communication and problem-solving skills.",
            ],
      requiredSkills,
      preferredSkills: ["GraphQL", "Next.js", "Docker"],
      status: "active",
      matchScore: 94,
    });

    // Clear draft on publish
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    triggerCelebration();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-[32px] shadow-2xl border-2 border-slate-900 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b-2 border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Post a New Job Opportunity</h2>
                {draftSavedTime && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider">
                    <Check className="w-2.5 h-2.5" />
                    <span>Auto-Saved {draftSavedTime}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">{company.companyName} · Recruiting Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasLoadedDraft && (
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-3 py-1.5 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 border border-slate-200"
                title="Discard saved draft and start blank"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset Draft</span>
              </button>
            )}

            <button
              id="close-add-job-modal-btn"
              onClick={onClose}
              className="p-2.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Resumed Draft Alert Notification (if loaded from session) */}
        {draftNotice && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900 shrink-0">
            <div className="flex items-center gap-2 font-bold">
              <Bookmark className="w-3.5 h-3.5 text-amber-600" />
              <span>{draftNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setDraftNotice(null)}
              className="text-[10px] font-black text-amber-700 hover:text-amber-900 uppercase cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Step 1: Choice Screen */}
          {mode === "choose" && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-1 max-w-md mx-auto">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">How would you like to create this job?</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Use our AI Job Spec Builder to draft the complete JD in seconds, or enter details manually. All edits auto-save.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Option 2: ✦ Create with AI */}
                <button
                  id="choose-ai-job-btn"
                  onClick={() => setMode("ai")}
                  className="p-6 rounded-[28px] border-2 border-slate-900 hover:border-emerald-600 bg-emerald-50/30 hover:bg-emerald-50 transition-all text-left space-y-3 cursor-pointer shadow-lg group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-black text-base text-slate-900 uppercase tracking-tight group-hover:text-emerald-800">
                      <span>✦ Create with AI</span>
                      <span className="px-2 py-0.5 text-[9px] bg-emerald-500 text-white rounded-full font-black uppercase tracking-wider">
                        FAST
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                      Describe your role in plain English. AI drafts title, tech stack, responsibilities, and screening criteria.
                    </p>
                  </div>
                  <div className="pt-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-1">
                    <span>Try AI Builder</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>

                {/* Option 1: Manual Form */}
                <button
                  id="choose-manual-job-btn"
                  onClick={() => setMode("manual")}
                  className="p-6 rounded-[28px] border-2 border-slate-900 hover:border-slate-700 bg-white hover:bg-slate-50 transition-all text-left space-y-3 cursor-pointer shadow-lg group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-base text-slate-900 uppercase tracking-tight group-hover:text-slate-800">
                      Manual Standard Form
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                      Fill out standard form fields: title, department, salary brackets, skills chips, and descriptions.
                    </p>
                  </div>
                  <div className="pt-2 text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-1">
                    <span>Fill Standard Form</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* AI Prompt Input Mode */}
          {mode === "ai" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 space-y-1">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-slate-900">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>✦ AI Job Spec Builder (Gemini 2.5)</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Tell us what kind of person you're looking for, required skills, and salary expectations.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700">Role Prompt & Requirements</label>
                <textarea
                  id="ai-job-prompt-input"
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer with 4+ years in React, Next.js, and TypeScript. Remote role paying 15-20 LPA..."
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 focus:border-slate-900 focus:outline-none font-bold leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMode("choose")}
                  className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  ← Back
                </button>

                <button
                  id="generate-job-spec-btn"
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerateWithAI}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-md shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>✦ Generating Job Specification...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Generate & Review Specification</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Manual / Review Form */}
          {mode === "manual" && (
            <form id="publish-job-form" onSubmit={handlePublishJob} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">Job Title</label>
                  <input
                    id="job-title-input"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 focus:border-slate-900 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">Department</label>
                  <input
                    id="job-department-input"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 focus:border-slate-900 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">Work Mode</label>
                  <select
                    id="job-workmode-select"
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 focus:border-slate-900 focus:outline-none font-bold"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                    <option value="Onsite">Onsite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">Location</label>
                  <input
                    id="job-location-input"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 focus:border-slate-900 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">
                    Experience Range
                  </label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 2–4 Years"
                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 focus:border-slate-900 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">
                    Salary Range (LPA)
                  </label>
                  <input
                    type="text"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. ₹7–10 LPA"
                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 focus:border-slate-900 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Skills Chips */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700">Required Skills & Technologies</label>
                <div className="flex flex-wrap gap-2">
                  {requiredSkills.map((s, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-900 rounded-lg text-xs font-bold uppercase border border-slate-300"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => setRequiredSkills(requiredSkills.filter((item) => item !== s))}
                        className="text-slate-400 hover:text-slate-900 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 max-w-sm pt-1">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add skill (e.g. Docker)..."
                    className="flex-1 px-3.5 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold focus:border-slate-900 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newSkill.trim()) {
                          setRequiredSkills([...requiredSkills, newSkill.trim()]);
                          setNewSkill("");
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSkill.trim()) {
                        setRequiredSkills([...requiredSkills, newSkill.trim()]);
                        setNewSkill("");
                      }
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700">Job Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the mission, team, and day-to-day work..."
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 leading-relaxed focus:border-slate-900 focus:outline-none font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMode("choose")}
                  className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  ← Change Method
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    id="save-job-draft-btn"
                    onClick={handleSaveAsDraft}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-3 rounded-full border-2 border-slate-300 hover:border-slate-900 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    title="Save as Draft Job without publishing to candidates yet"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-orange-500" />
                    <span>Save as Draft</span>
                  </button>

                  <button
                    id="publish-job-submit-btn"
                    type="submit"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-md shadow-sky-600/25 transition-all cursor-pointer"
                  >
                    <span>Publish Job</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

