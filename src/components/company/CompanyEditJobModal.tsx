import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Briefcase,
  MapPin,
  IndianRupee,
  Clock,
  Users,
  Check,
  Plus,
  Trash2,
  Wand2,
  Layers,
  Save,
  AlertCircle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { GeminiService } from "../../services/geminiService";
import { Job, WorkMode, JobStatus } from "../../types";

interface CompanyEditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
}

export const CompanyEditJobModal: React.FC<CompanyEditJobModalProps> = ({
  isOpen,
  onClose,
  job,
}) => {
  const { updateJob, triggerCelebration } = useApp();

  // Form State
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("Hybrid");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [salary, setSalary] = useState("");
  const [openings, setOpenings] = useState<number>(1);
  const [status, setStatus] = useState<JobStatus>("active");
  const [description, setDescription] = useState("");
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [newResponsibility, setNewResponsibility] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [newRequiredSkill, setNewRequiredSkill] = useState("");
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [newPreferredSkill, setNewPreferredSkill] = useState("");

  // AI Refinement State
  const [isAiRefining, setIsAiRefining] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Active Tab inside Edit Modal
  const [activeTab, setActiveTab] = useState<"general" | "requirements" | "skills">("general");

  // Populate form state when job changes or modal opens
  useEffect(() => {
    if (job) {
      setTitle(job.title || "");
      setDepartment(job.department || "Engineering");
      setWorkMode(job.workMode || "Hybrid");
      setLocation(job.location || "");
      setExperience(job.experience || "2–4 Years");
      setSalary(job.salary || "₹8–12 LPA");
      setOpenings(job.openings || 1);
      setStatus(job.status || "active");
      setDescription(job.description || "");
      setResponsibilities(job.responsibilities ? [...job.responsibilities] : []);
      setRequirements(job.requirements ? [...job.requirements] : []);
      setRequiredSkills(job.requiredSkills ? [...job.requiredSkills] : []);
      setPreferredSkills(job.preferredSkills ? [...job.preferredSkills] : []);
      setAiPrompt(`Refine and optimize role for ${job.title} with updated skills and responsibilities.`);
    }
  }, [job, isOpen]);

  if (!isOpen || !job) return null;

  // Add item helpers
  const handleAddResponsibility = () => {
    if (newResponsibility.trim()) {
      setResponsibilities((prev) => [...prev, newResponsibility.trim()]);
      setNewResponsibility("");
    }
  };

  const handleRemoveResponsibility = (index: number) => {
    setResponsibilities((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements((prev) => [...prev, newRequirement.trim()]);
      setNewRequirement("");
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setRequirements((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddRequiredSkill = () => {
    if (newRequiredSkill.trim() && !requiredSkills.includes(newRequiredSkill.trim())) {
      setRequiredSkills((prev) => [...prev, newRequiredSkill.trim()]);
      setNewRequiredSkill("");
    }
  };

  const handleRemoveRequiredSkill = (skill: string) => {
    setRequiredSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleAddPreferredSkill = () => {
    if (newPreferredSkill.trim() && !preferredSkills.includes(newPreferredSkill.trim())) {
      setPreferredSkills((prev) => [...prev, newPreferredSkill.trim()]);
      setNewPreferredSkill("");
    }
  };

  const handleRemovePreferredSkill = (skill: string) => {
    setPreferredSkills((prev) => prev.filter((s) => s !== skill));
  };

  // AI Refinement handler
  const handleAiRefine = async () => {
    setIsAiRefining(true);
    try {
      const generated = await GeminiService.generateJob(
        aiPrompt || `Refine job posting for ${title} in ${department}`,
        job.companyName,
        location
      );

      if (generated.description) setDescription(generated.description);
      if (generated.responsibilities && generated.responsibilities.length > 0) {
        setResponsibilities(generated.responsibilities);
      }
      if (generated.requirements && generated.requirements.length > 0) {
        setRequirements(generated.requirements);
      }
      if (generated.requiredSkills && generated.requiredSkills.length > 0) {
        setRequiredSkills(generated.requiredSkills);
      }
      setShowAiPanel(false);
      triggerCelebration();
    } catch (error) {
      console.error("AI Refine Error:", error);
    } finally {
      setIsAiRefining(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    updateJob(job.id, {
      title: title.trim(),
      department: department.trim(),
      workMode,
      location: location.trim(),
      experience: experience.trim(),
      salary: salary.trim(),
      openings: Number(openings) || 1,
      status,
      description: description.trim(),
      responsibilities,
      requirements,
      requiredSkills,
      preferredSkills,
    });

    triggerCelebration();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[32px] shadow-2xl border-2 border-slate-900 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">
                  Edit Job Opening
                </h3>
                <span
                  className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full ${
                    status === "active"
                      ? "bg-emerald-500 text-white"
                      : status === "paused"
                      ? "bg-amber-500 text-white"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Updating position specifications for <strong className="text-slate-200">{job.title}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAiPanel(!showAiPanel)}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Polish</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Refinement Drawer Banner (When toggled) */}
        {showAiPanel && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 shrink-0 space-y-2 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
                <Wand2 className="w-4 h-4 text-amber-600" />
                <span>Gemini AI Job Description & Skills Optimizer</span>
              </div>
              <button
                onClick={() => setShowAiPanel(false)}
                className="text-amber-700 hover:text-amber-900 text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., Make the requirements more senior, emphasize GraphQL and AWS..."
                className="flex-1 px-4 py-2 bg-white rounded-xl border border-amber-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleAiRefine}
                disabled={isAiRefining}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isAiRefining ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Optimizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Apply AI Enhancement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
              activeTab === "general"
                ? "bg-white text-slate-900 border-orange-500 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 border-transparent"
            }`}
          >
            1. Role & Compensation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("requirements")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
              activeTab === "requirements"
                ? "bg-white text-slate-900 border-orange-500 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 border-transparent"
            }`}
          >
            2. Scope & Responsibilities
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("skills")}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
              activeTab === "skills"
                ? "bg-white text-slate-900 border-orange-500 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 border-transparent"
            }`}
          >
            3. Required & Preferred Skills
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: General Role Details */}
          {activeTab === "general" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Department / Division
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Engineering, Product, Design"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Work Mode & Status & Openings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Work Mode */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Work Arrangement
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                    {(["Remote", "Hybrid", "Onsite"] as WorkMode[]).map((mode) => (
                      <button
                        type="button"
                        key={mode}
                        onClick={() => setWorkMode(mode)}
                        className={`py-2 text-xs font-black rounded-xl uppercase tracking-wider transition-all cursor-pointer ${
                          workMode === mode
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Posting Status */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Posting Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as JobStatus)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                  >
                    <option value="active">Active (Visible on Radar)</option>
                    <option value="paused">Paused (Hide from Applicants)</option>
                    <option value="draft">Draft (Private)</option>
                    <option value="closed">Closed (Filled)</option>
                  </select>
                </div>

                {/* Openings */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Open Positions
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={openings}
                    onChange={(e) => setOpenings(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Location, Experience, Salary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-500" />
                    <span>Location</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bangalore, India"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span>Experience Level</span>
                  </label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 3–5 Years"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Salary Range</span>
                  </label>
                  <input
                    type="text"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. ₹12–18 LPA"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Role Overview & Context
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a compelling overview of what the candidate will work on..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Responsibilities & Requirements */}
          {activeTab === "requirements" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Responsibilities */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                    Key Responsibilities ({responsibilities.length})
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    Shown on Candidate Cards
                  </span>
                </div>

                <div className="space-y-2">
                  {responsibilities.map((resp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 group hover:border-slate-300 transition-colors"
                    >
                      <span className="text-xs text-slate-800 font-medium leading-relaxed">
                        • {resp}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveResponsibility(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newResponsibility}
                      onChange={(e) => setNewResponsibility(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddResponsibility();
                        }
                      }}
                      placeholder="Add a core responsibility and press enter..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddResponsibility}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                    Candidate Requirements ({requirements.length})
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    Used for AI Match Algorithm
                  </span>
                </div>

                <div className="space-y-2">
                  {requirements.map((req, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 group hover:border-slate-300 transition-colors"
                    >
                      <span className="text-xs text-slate-800 font-medium leading-relaxed">
                        ✓ {req}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRequirement(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddRequirement();
                        }
                      }}
                      placeholder="Add a required qualification and press enter..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddRequirement}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Skills Matrix */}
          {activeTab === "skills" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Required Skills */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                      Required Core Skills * ({requiredSkills.length})
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium">
                      These are strictly matched in the candidate evaluation radar.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border-2 border-slate-200 min-h-[50px]">
                  {requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRequiredSkill(skill)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}

                  {requiredSkills.length === 0 && (
                    <span className="text-xs text-slate-400 py-1">No required skills added yet.</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRequiredSkill}
                    onChange={(e) => setNewRequiredSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddRequiredSkill();
                      }
                    }}
                    placeholder="e.g. React, TypeScript, Node.js..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddRequiredSkill}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Skill</span>
                  </button>
                </div>
              </div>

              {/* Preferred Skills */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                      Preferred / Nice-to-Have Skills ({preferredSkills.length})
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Bonus technical proficiencies that boost candidate ranking.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 p-3 bg-orange-50/50 rounded-2xl border-2 border-orange-200 min-h-[50px]">
                  {preferredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePreferredSkill(skill)}
                        className="text-orange-200 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}

                  {preferredSkills.length === 0 && (
                    <span className="text-xs text-orange-400 py-1">No preferred skills added yet.</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPreferredSkill}
                    onChange={(e) => setNewPreferredSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddPreferredSkill();
                      }
                    }}
                    placeholder="e.g. AWS, Docker, GraphQL, System Design..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddPreferredSkill}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Preferred</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500 font-medium">
              Changes will immediately update active matching radars.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-3 rounded-full border-2 border-slate-200 text-slate-600 hover:bg-slate-100 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex-1 sm:flex-none px-7 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4 text-orange-400" />
                <span>Save Job Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
