import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  User,
  Briefcase,
  GraduationCap,
  FolderGit2,
  MapPin,
  IndianRupee,
  Camera,
  ArrowRight,
  ShieldAlert,
  Edit2,
  Trash2,
  Globe,
  ExternalLink,
  GitBranch,
  Star,
  GitFork,
  RefreshCw,
  Check,
  Loader2,
  Sliders,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { EducationItem, ExperienceItem, ProjectItem, GitHubRepoItem, ProfilePhotoSettings } from "../../types";
import { GitHubProjectModal } from "../common/GitHubProjectModal";
import { CustomSelect } from "../common/CustomSelect";
import { UserAvatar } from "../common/UserAvatar";
import { ProfilePhotoModal } from "../common/ProfilePhotoModal";

export const CandidateProfileReview: React.FC = () => {
  const {
    candidate,
    updateCandidate,
    setActiveView,
    missingProfileFields,
    isCandidateProfileComplete,
    triggerCelebration,
    authSignInWithGitHub,
    connectCandidateGitHub,
  } = useApp();

  // Local editable states
  const [fullName, setFullName] = useState(candidate.fullName || "");
  const [headline, setHeadline] = useState(candidate.headline || "");
  const [email, setEmail] = useState(candidate.email || "");
  const [phone, setPhone] = useState(candidate.phone || "");
  const [location, setLocation] = useState(candidate.location || "");
  const [workPreference, setWorkPreference] = useState(candidate.workPreference || "Hybrid");
  const [yearsOfExperience, setYearsOfExperience] = useState(candidate.yearsOfExperience || 0);
  const [expectedSalary, setExpectedSalary] = useState(candidate.expectedSalary || "");
  const [preferredRole, setPreferredRole] = useState(candidate.preferredRole || "");
  const [bio, setBio] = useState(candidate.bio || "");
  const [profilePhoto, setProfilePhoto] = useState(
    candidate.profilePhoto ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
  );
  const [photoSettings, setPhotoSettings] = useState<ProfilePhotoSettings>(
    candidate.photoSettings || { shape: "squircle", frame: "minimal", filter: "normal", zoom: 1.0 }
  );
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [showStudioSplit, setShowStudioSplit] = useState(false);

  const [skills, setSkills] = useState<string[]>(candidate.skills || []);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [showErrorBanner, setShowErrorBanner] = useState(false);

  // Education state & form
  const [education, setEducation] = useState<EducationItem[]>(candidate.education || []);
  const [isAddingEdu, setIsAddingEdu] = useState(false);
  const [editingEduIndex, setEditingEduIndex] = useState<number | null>(null);
  const [eduDegree, setEduDegree] = useState("");
  const [eduInstitution, setEduInstitution] = useState("");
  const [eduYear, setEduYear] = useState("");

  // Projects state & form
  const [projects, setProjects] = useState<ProjectItem[]>(candidate.projects || []);
  const [isAddingProj, setIsAddingProj] = useState(false);
  const [editingProjIndex, setEditingProjIndex] = useState<number | null>(null);
  const [projName, setProjName] = useState("");
  const [projDescription, setProjDescription] = useState("");
  const [projTechnologies, setProjTechnologies] = useState("");
  const [projLink, setProjLink] = useState("");

  // Experience state & form
  const [experience, setExperience] = useState<ExperienceItem[]>(candidate.experience || []);
  const [isAddingExp, setIsAddingExp] = useState(false);
  const [editingExpIndex, setEditingExpIndex] = useState<number | null>(null);
  const [expTitle, setExpTitle] = useState("");
  const [expCompany, setExpCompany] = useState("");
  const [expDuration, setExpDuration] = useState("");
  const [expDescription, setExpDescription] = useState("");

  // GitHub connection & verification state
  const [gitHubUsernameInput, setGitHubUsernameInput] = useState("");
  const [isConnectingGitHub, setIsConnectingGitHub] = useState(false);
  const [gitHubError, setGitHubError] = useState("");
  const [gitHubSuccess, setGitHubSuccess] = useState("");
  const [inspectingProject, setInspectingProject] = useState<{ repo: GitHubRepoItem; username: string } | null>(null);

  const handleConnectGitHubUsername = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gitHubUsernameInput.trim()) return;
    setGitHubError("");
    setGitHubSuccess("");
    setIsConnectingGitHub(true);
    const res = await connectCandidateGitHub(gitHubUsernameInput.trim());
    setIsConnectingGitHub(false);
    if (!res.success) {
      setGitHubError(res.error || "Failed to verify and connect GitHub profile.");
    } else {
      setGitHubSuccess("GitHub profile verified and connected successfully!");
      setGitHubUsernameInput("");
    }
  };

  const handleConnectGitHubOAuth = async () => {
    setGitHubError("");
    setGitHubSuccess("");
    setIsConnectingGitHub(true);
    const res = await authSignInWithGitHub("candidate");
    setIsConnectingGitHub(false);
    if (res.error) {
      setGitHubError(res.error);
    }
  };

  // Sync state whenever candidate object is updated (e.g. via AI extraction)
  React.useEffect(() => {
    if (candidate) {
      if (candidate.fullName) setFullName(candidate.fullName);
      if (candidate.headline) setHeadline(candidate.headline);
      if (candidate.email) setEmail(candidate.email);
      if (candidate.phone) setPhone(candidate.phone);
      if (candidate.location) setLocation(candidate.location);
      if (candidate.workPreference) setWorkPreference(candidate.workPreference);
      if (candidate.yearsOfExperience !== undefined) setYearsOfExperience(candidate.yearsOfExperience);
      if (candidate.expectedSalary) {
        setExpectedSalary(candidate.expectedSalary);
      } else {
        const exp = candidate.yearsOfExperience || 0;
        const defaultSal = exp <= 1 ? "₹4–7 LPA" : exp <= 3 ? "₹7–11 LPA" : exp <= 6 ? "₹12–18 LPA" : "₹20–30 LPA";
        setExpectedSalary(defaultSal);
      }
      if (candidate.preferredRole) {
        setPreferredRole(candidate.preferredRole);
      } else if (candidate.headline) {
        setPreferredRole(candidate.headline);
      }
      if (candidate.bio) setBio(candidate.bio);
      if (candidate.profilePhoto) setProfilePhoto(candidate.profilePhoto);
      if (candidate.photoSettings) setPhotoSettings(candidate.photoSettings);
      if (candidate.skills && candidate.skills.length > 0) setSkills(candidate.skills);
      if (candidate.education) setEducation(candidate.education);
      if (candidate.projects) setProjects(candidate.projects);
      if (candidate.experience) setExperience(candidate.experience);
    }
  }, [candidate]);

  const avatarPresets = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
  ];

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    if (!skills.includes(newSkillInput.trim())) {
      setSkills([...skills, newSkillInput.trim()]);
    }
    setNewSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Education Handlers
  const handleSaveEducation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduDegree.trim() || !eduInstitution.trim()) return;

    const newEdu: EducationItem = {
      id: editingEduIndex !== null ? education[editingEduIndex]?.id || `edu_${Date.now()}` : `edu_${Date.now()}`,
      degree: eduDegree.trim(),
      institution: eduInstitution.trim(),
      year: eduYear.trim() || new Date().getFullYear().toString(),
    };

    if (editingEduIndex !== null) {
      const copy = [...education];
      copy[editingEduIndex] = newEdu;
      setEducation(copy);
      setEditingEduIndex(null);
    } else {
      setEducation([...education, newEdu]);
      setIsAddingEdu(false);
    }

    setEduDegree("");
    setEduInstitution("");
    setEduYear("");
  };

  const handleStartEditEducation = (index: number) => {
    const item = education[index];
    if (!item) return;
    setEditingEduIndex(index);
    setIsAddingEdu(false);
    setEduDegree(item.degree);
    setEduInstitution(item.institution);
    setEduYear(item.year);
  };

  const handleDeleteEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
    if (editingEduIndex === index) {
      setEditingEduIndex(null);
      setEduDegree("");
      setEduInstitution("");
      setEduYear("");
    }
  };

  // Projects Handlers
  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;

    const techsArray = projTechnologies
      ? projTechnologies.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const newProj: ProjectItem = {
      id: editingProjIndex !== null ? projects[editingProjIndex]?.id || `proj_${Date.now()}` : `proj_${Date.now()}`,
      name: projName.trim(),
      description: projDescription.trim(),
      technologies: techsArray,
      link: projLink.trim() || undefined,
    };

    if (editingProjIndex !== null) {
      const copy = [...projects];
      copy[editingProjIndex] = newProj;
      setProjects(copy);
      setEditingProjIndex(null);
    } else {
      setProjects([...projects, newProj]);
      setIsAddingProj(false);
    }

    setProjName("");
    setProjDescription("");
    setProjTechnologies("");
    setProjLink("");
  };

  const handleStartEditProject = (index: number) => {
    const item = projects[index];
    if (!item) return;
    setEditingProjIndex(index);
    setIsAddingProj(false);
    setProjName(item.name);
    setProjDescription(item.description);
    setProjTechnologies((item.technologies || []).join(", "));
    setProjLink(item.link || "");
  };

  const handleDeleteProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
    if (editingProjIndex === index) {
      setEditingProjIndex(null);
      setProjName("");
      setProjDescription("");
      setProjTechnologies("");
      setProjLink("");
    }
  };

  // Experience Handlers
  const handleSaveExperience = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !expCompany.trim()) return;

    const newExp: ExperienceItem = {
      id: editingExpIndex !== null ? experience[editingExpIndex]?.id || `exp_${Date.now()}` : `exp_${Date.now()}`,
      title: expTitle.trim(),
      company: expCompany.trim(),
      duration: expDuration.trim() || "Present",
      description: expDescription.trim(),
    };

    if (editingExpIndex !== null) {
      const copy = [...experience];
      copy[editingExpIndex] = newExp;
      setExperience(copy);
      setEditingExpIndex(null);
    } else {
      setExperience([...experience, newExp]);
      setIsAddingExp(false);
    }

    setExpTitle("");
    setExpCompany("");
    setExpDuration("");
    setExpDescription("");
  };

  const handleStartEditExperience = (index: number) => {
    const item = experience[index];
    if (!item) return;
    setEditingExpIndex(index);
    setIsAddingExp(false);
    setExpTitle(item.title);
    setExpCompany(item.company);
    setExpDuration(item.duration);
    setExpDescription(item.description);
  };

  const handleDeleteExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
    if (editingExpIndex === index) {
      setEditingExpIndex(null);
      setExpTitle("");
      setExpCompany("");
      setExpDuration("");
      setExpDescription("");
    }
  };

  const handleSaveAndContinue = () => {
    // Validate mandatory fields as per Spec #7
    if (!fullName.trim() || !email.trim() || skills.length === 0 || !preferredRole.trim() || !expectedSalary.trim()) {
      setShowErrorBanner(true);
      return;
    }

    // Enforce mandatory GitHub connection
    if (!candidate.githubData?.connected) {
      setShowErrorBanner(true);
      setGitHubError("⚠️ GitHub connection is mandatory to complete your profile. Please connect your GitHub account below.");
      const el = document.getElementById("github-connection-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    const nextIsCompleted = true;

    updateCandidate({
      fullName,
      headline,
      email,
      phone,
      location,
      workPreference,
      yearsOfExperience: Number(yearsOfExperience),
      expectedSalary,
      preferredRole,
      bio,
      profilePhoto,
      photoSettings,
      skills,
      education,
      projects,
      experience,
      isCompleted: nextIsCompleted,
    });

    if (candidate.commissionAgreementSigned) {
      triggerCelebration();
      setActiveView("candidate-radar");
    } else {
      // Proceed to mandatory 10% Placement Commission Agreement & E-Signature
      setActiveView("candidate-agreement");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-in fade-in duration-200">
      {/* AI Extraction & Verification Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-50 via-sky-50 to-indigo-50 border border-emerald-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-sky-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  Profile Auto-Filled & Verified
                </h2>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                  {candidate.confidence?.overallScore || 95}% Accuracy Verified ✦
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Multi-pass extraction complete. Review fields below or use Studio Split View to verify against original text.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowStudioSplit(!showStudioSplit)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            <span>{showStudioSplit ? "Hide Source Text" : "Studio Split View"}</span>
          </button>
        </div>

        {/* Verification Flags */}
        {candidate.verificationFlags && candidate.verificationFlags.length > 0 && (
          <div className="pt-3 border-t border-emerald-200/60 flex flex-wrap gap-2 text-[11px]">
            <span className="font-bold text-slate-500 uppercase tracking-wider">Automated Verification Checks:</span>
            {candidate.verificationFlags.map((flag, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-white/80 border border-slate-200 rounded-md text-slate-700 font-medium">
                ✓ {flag}
              </span>
            ))}
          </div>
        )}

        {/* Studio Split Source Text Panel */}
        {showStudioSplit && candidate.resumeText && (
          <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono space-y-2 max-h-60 overflow-y-auto border border-slate-800 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-sans pb-1 border-b border-slate-800">
              <span className="font-bold">Original Extracted Document Tokens</span>
              <span>100% In-Browser Layout Reconstruction</span>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed text-slate-300 font-mono text-[11px]">
              {candidate.resumeText}
            </pre>
          </div>
        )}
      </div>

      {/* Missing Information Guard Box (Spec #7) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-500" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Profile Readiness & Verification Check
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {missingProfileFields.length === 0 ? "100% Ready" : `${missingProfileFields.length} field(s) pending`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className={`p-2 rounded-lg flex items-center gap-1.5 font-medium ${fullName ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
            {fullName ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
            <span>Full Name</span>
          </div>
          <div className={`p-2 rounded-lg flex items-center gap-1.5 font-medium ${email ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
            {email ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
            <span>Email</span>
          </div>
          <div className={`p-2 rounded-lg flex items-center gap-1.5 font-medium ${skills.length > 0 ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
            {skills.length > 0 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
            <span>Skills ({skills.length})</span>
          </div>
          <div className={`p-2 rounded-lg flex items-center gap-1.5 font-medium ${experience.length > 0 ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
            {experience.length > 0 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400" />}
            <span>Experience ({experience.length})</span>
          </div>
          <div className={`p-2 rounded-lg flex items-center gap-1.5 font-medium ${education.length > 0 ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
            {education.length > 0 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400" />}
            <span>Education ({education.length})</span>
          </div>
          <div className={`p-2 rounded-lg flex items-center gap-1.5 font-medium ${projects.length > 0 ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
            {projects.length > 0 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400" />}
            <span>Projects ({projects.length})</span>
          </div>
          <div className={`p-2 rounded-lg flex items-center gap-1.5 font-medium ${profilePhoto ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
            {profilePhoto ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
            <span>Profile Photo</span>
          </div>
          <div className={`p-2 rounded-lg flex items-center gap-1.5 font-medium ${preferredRole ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
            {preferredRole ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
            <span>Preferred Role</span>
          </div>
          <div className={`p-2 rounded-lg flex items-center gap-1.5 font-medium ${expectedSalary ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
            {expectedSalary ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
            <span>Expected Salary</span>
          </div>
          <div className={`p-2 rounded-lg flex items-center gap-1.5 font-medium ${candidate.githubData?.connected ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
            {candidate.githubData?.connected ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
            <span>GitHub ({candidate.githubData?.connected ? "Connected" : "Required"})</span>
          </div>
        </div>

        {showErrorBanner && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              {!candidate.githubData?.connected
                ? "⚠️ GitHub profile connection is mandatory. Please connect your GitHub profile below before proceeding."
                : "⚠️ Your profile needs all required details before entering the Career Radar."}
            </span>
          </div>
        )}
      </div>

      {/* Main Review Form */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-8">
        {/* Photo Selection & Shape Customizer */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
          <div className="relative group cursor-pointer" onClick={() => setIsPhotoModalOpen(true)}>
            <UserAvatar
              src={profilePhoto}
              size="3xl"
              settings={photoSettings}
              fallbackText={fullName}
              className="transition-transform group-hover:scale-105"
            />
            <button
              type="button"
              id="change-photo-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsPhotoModalOpen(true);
              }}
              className="absolute -bottom-2 -right-2 p-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl shadow-md transition-colors cursor-pointer"
              title="Customize photo, shape & frames"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center sm:text-left space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center justify-center sm:justify-start gap-2">
                  <span>Profile Photo & Shape Styling</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                    {photoSettings?.shape || "Squircle"}
                  </span>
                  {photoSettings?.frame && photoSettings.frame !== "none" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 uppercase tracking-wide">
                      {photoSettings.frame} Frame
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  Upload custom photo or capture webcam, adjust custom shape, frame border, and zoom visible to recruiters.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>Customize Photo</span>
              </button>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets:</span>
              {avatarPresets.map((preset, idx) => (
                <img
                  key={idx}
                  src={preset}
                  alt={`preset-${idx}`}
                  onClick={() => setProfilePhoto(preset)}
                  className={`w-7 h-7 rounded-lg object-cover cursor-pointer ring-2 transition-all ${
                    profilePhoto === preset ? "ring-emerald-500 scale-110" : "ring-transparent opacity-60 hover:opacity-100"
                  }`}
                />
              ))}
              {candidate.githubData?.avatarUrl && (
                <button
                  type="button"
                  onClick={() => setProfilePhoto(candidate.githubData!.avatarUrl!)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Use GitHub
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Basic Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
            <input
              id="review-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Profile Headline</label>
            <input
              id="review-headline"
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
            <input
              id="review-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
            <input
              id="review-phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Location</label>
            <input
              id="review-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Ahmedabad, India"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Work Preference</label>
            <CustomSelect
              value={workPreference}
              onChange={(val) => setWorkPreference(val)}
              variant="card"
              size="md"
              options={[
                { value: "Hybrid", label: "Hybrid", sublabel: "Preferred flexible balance" },
                { value: "Remote", label: "Remote", sublabel: "100% remote positions" },
                { value: "Onsite", label: "Onsite", sublabel: "Full-time in office" },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Years of Experience</label>
            <input
              id="review-experience-years"
              type="number"
              min="0"
              max="30"
              step="any"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Expected Salary</label>
            <input
              id="review-salary"
              type="text"
              value={expectedSalary}
              onChange={(e) => setExpectedSalary(e.target.value)}
              placeholder="e.g. ₹8–11 LPA"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Preferred Target Role</label>
            <input
              id="review-preferred-role"
              type="text"
              value={preferredRole}
              onChange={(e) => setPreferredRole(e.target.value)}
              placeholder="e.g. Full Stack Developer"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Professional Bio & Summary</label>
            <textarea
              id="review-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell recruiters about your key achievements, superpowers, and what roles excite you..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
          </div>
        </div>

        {/* Skills Chip Manager */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-bold text-slate-700">
            Skills <span className="text-slate-400 font-normal">({skills.length} extracted/added)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          {/* Add skill input */}
          <div className="flex items-center gap-2 max-w-sm pt-1">
            <input
              id="add-skill-input"
              type="text"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              placeholder="Type skill & press Add..."
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill(e);
                }
              }}
            />
            <button
              id="add-skill-btn"
              type="button"
              onClick={handleAddSkill}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Work Experience Section */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Work Experience ({experience.length})
              </label>
            </div>
            {!isAddingExp && editingExpIndex === null && (
              <button
                type="button"
                onClick={() => {
                  setIsAddingExp(true);
                  setExpTitle("");
                  setExpCompany("");
                  setExpDuration("");
                  setExpDescription("");
                }}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Experience</span>
              </button>
            )}
          </div>

          {/* Add / Edit Experience Form */}
          {(isAddingExp || editingExpIndex !== null) && (
            <form onSubmit={handleSaveExperience} className="p-4 bg-emerald-50/60 border-2 border-emerald-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-tight text-emerald-900">
                  {editingExpIndex !== null ? "Edit Work Experience" : "Add Work Experience"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingExp(false);
                    setEditingExpIndex(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend Engineer"
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Company *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Tech Solutions"
                    value={expCompany}
                    onChange={(e) => setExpCompany(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Duration *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2022 – Present"
                    value={expDuration}
                    onChange={(e) => setExpDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Responsibilities & Impact</label>
                <textarea
                  rows={2}
                  placeholder="Key contributions, architectures built, metrics moved..."
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingExp(false);
                    setEditingExpIndex(null);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {editingExpIndex !== null ? "Save Changes" : "Add Experience"}
                </button>
              </div>
            </form>
          )}

          {/* Experience List */}
          <div className="space-y-2.5">
            {experience.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center text-xs text-slate-500">
                No work experience added yet. Click "+ Add Experience" to showcase your roles.
              </div>
            ) : (
              experience.map((exp, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3 group hover:border-slate-300 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-slate-900">{exp.title}</strong>
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-semibold">
                        {exp.duration}
                      </span>
                    </div>
                    <div className="text-emerald-700 font-bold">{exp.company}</div>
                    {exp.description && (
                      <p className="text-slate-600 leading-relaxed pt-1">{exp.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEditExperience(idx)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Edit Experience"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteExperience(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Delete Experience"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Education Section */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Education ({education.length})
              </label>
            </div>
            {!isAddingEdu && editingEduIndex === null && (
              <button
                type="button"
                onClick={() => {
                  setIsAddingEdu(true);
                  setEduDegree("");
                  setEduInstitution("");
                  setEduYear(new Date().getFullYear().toString());
                }}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Education</span>
              </button>
            )}
          </div>

          {/* Add / Edit Education Form */}
          {(isAddingEdu || editingEduIndex !== null) && (
            <form onSubmit={handleSaveEducation} className="p-4 bg-emerald-50/60 border-2 border-emerald-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-tight text-emerald-900">
                  {editingEduIndex !== null ? "Edit Education" : "Add Education"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingEdu(false);
                    setEditingEduIndex(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Degree / Qualification *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BCA, B.Tech Computer Science"
                    value={eduDegree}
                    onChange={(e) => setEduDegree(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Institution / University *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gujarat University"
                    value={eduInstitution}
                    onChange={(e) => setEduInstitution(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Passing Year *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2024"
                    value={eduYear}
                    onChange={(e) => setEduYear(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingEdu(false);
                    setEditingEduIndex(null);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {editingEduIndex !== null ? "Save Changes" : "Add Education"}
                </button>
              </div>
            </form>
          )}

          {/* Education List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {education.length === 0 ? (
              <div className="sm:col-span-2 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center text-xs text-slate-500">
                No education records added yet. Click "+ Add Education" to add your degrees.
              </div>
            ) : (
              education.map((edu, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs flex items-start justify-between gap-3 group hover:border-slate-300 transition-colors">
                  <div className="space-y-1">
                    <strong className="text-sm font-bold text-slate-900 block">{edu.degree}</strong>
                    <div className="text-slate-600 font-medium">{edu.institution}</div>
                    <span className="text-[11px] text-slate-400 font-semibold block">Class of {edu.year}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEditEducation(idx)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Edit Education"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEducation(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Delete Education"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Projects Section */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-sky-600" />
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Featured Projects ({projects.length})
              </label>
            </div>
            {!isAddingProj && editingProjIndex === null && (
              <button
                type="button"
                onClick={() => {
                  setIsAddingProj(true);
                  setProjName("");
                  setProjDescription("");
                  setProjTechnologies("");
                  setProjLink("");
                }}
                className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project</span>
              </button>
            )}
          </div>

          {/* Add / Edit Project Form */}
          {(isAddingProj || editingProjIndex !== null) && (
            <form onSubmit={handleSaveProject} className="p-4 bg-sky-50/60 border-2 border-sky-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-tight text-sky-900">
                  {editingProjIndex !== null ? "Edit Project" : "Add Project"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingProj(false);
                    setEditingProjIndex(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI Portfolio Engine"
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Project URL / GitHub Link (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={projLink}
                    onChange={(e) => setProjLink(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Technologies Used (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. React, TypeScript, Node.js, PostgreSQL"
                  value={projTechnologies}
                  onChange={(e) => setProjTechnologies(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Project Summary & Impact</label>
                <textarea
                  rows={2}
                  placeholder="What problem did this project solve? What did you build?"
                  value={projDescription}
                  onChange={(e) => setProjDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingProj(false);
                    setEditingProjIndex(null);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {editingProjIndex !== null ? "Save Changes" : "Add Project"}
                </button>
              </div>
            </form>
          )}

          {/* Projects List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.length === 0 ? (
              <div className="sm:col-span-2 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center text-xs text-slate-500">
                No projects added yet. Click "+ Add Project" to highlight your portfolio.
              </div>
            ) : (
              projects.map((proj, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs flex flex-col justify-between gap-2.5 group hover:border-slate-300 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <strong className="text-sm font-bold text-slate-900 block">{proj.name}</strong>
                      <div className="flex items-center gap-1 shrink-0">
                        {proj.link && (
                          <a
                            href={proj.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-sky-600 hover:text-sky-800 rounded transition-colors"
                            title="Visit Project"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEditProject(idx)}
                          className="p-1 text-slate-400 hover:text-slate-800 hover:bg-white rounded transition-colors cursor-pointer"
                          title="Edit Project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded transition-colors cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {proj.description && (
                      <p className="text-slate-600 leading-relaxed line-clamp-3">{proj.description}</p>
                    )}
                  </div>

                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200/60">
                      {proj.technologies.map((t, ti) => (
                        <span key={ti} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold rounded-md">
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

        {/* GitHub Verification & Telemetry Section (Mandatory) */}
        <div id="github-connection-section" className="pt-6 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    GitHub Verification & Code Telemetry
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                      Mandatory
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Companies verify your public code repositories, tech stack breakdown, and recent activity.
                  </p>
                </div>
              </div>
            </div>

            {candidate.githubData?.connected && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Verified & Connected
              </span>
            )}
          </div>

          {/* Feedback banners */}
          {gitHubError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{gitHubError}</span>
            </div>
          )}

          {gitHubSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{gitHubSuccess}</span>
            </div>
          )}

          {/* If Connected: Show Rich GitHub Telemetry */}
          {candidate.githubData?.connected ? (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
                <div className="flex items-center gap-3">
                  <img
                    src={candidate.githubData.avatarUrl || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"}
                    alt={candidate.githubData.username}
                    className="w-12 h-12 rounded-xl border border-slate-600 object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{candidate.githubData.name || candidate.githubData.username}</h4>
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
                  <button
                    type="button"
                    disabled={isConnectingGitHub}
                    onClick={() => handleConnectGitHubUsername()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Refresh latest GitHub repositories & stats"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isConnectingGitHub ? "animate-spin" : ""}`} />
                    <span>Re-sync</span>
                  </button>
                </div>
              </div>

              {/* Stats Strip */}
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
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Status</span>
                  <span className="text-xs font-bold text-emerald-400 mt-1 inline-block">Verified Proof</span>
                </div>
              </div>

              {/* Languages breakdown */}
              {candidate.githubData.languages && candidate.githubData.languages.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Top Languages Detected</span>
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

              {/* Featured Repos */}
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
            /* If NOT Connected: Connect Form */
            <div className="p-6 rounded-2xl bg-amber-50/60 border-2 border-dashed border-amber-300 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    GitHub profile connection is mandatory
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    SwipeHire guarantees verified candidate credentials to hiring companies. Connect your GitHub to showcase your repositories, primary languages, and coding activity.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Method 1: Connect with GitHub OAuth */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Method 1</span>
                    <strong className="text-xs font-bold text-slate-900 block mt-0.5">Quick Connect with GitHub</strong>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Authorize your GitHub account securely with one click.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isConnectingGitHub}
                    onClick={handleConnectGitHubOAuth}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isConnectingGitHub ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                    )}
                    <span>Connect with GitHub</span>
                  </button>
                </div>

                {/* Method 2: Enter Public GitHub Username */}
                <form
                  onSubmit={handleConnectGitHubUsername}
                  className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-3"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Method 2</span>
                    <strong className="text-xs font-bold text-slate-900 block mt-0.5">Verify by GitHub Username</strong>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Enter your public GitHub username (e.g. <span className="font-mono text-slate-700">octocat</span>).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">@</span>
                      <input
                        type="text"
                        placeholder="github_username"
                        value={gitHubUsernameInput}
                        onChange={(e) => setGitHubUsernameInput(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isConnectingGitHub || !gitHubUsernameInput.trim()}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-60 cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      {isConnectingGitHub ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Verify</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Save & Enter Career Radar CTA */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            onClick={() => setActiveView("candidate-onboarding")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer text-center sm:text-left py-1"
          >
            ← Re-upload Resume
          </button>

          <button
            id="complete-profile-and-enter-radar-btn"
            onClick={handleSaveAndContinue}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span>{candidate.commissionAgreementSigned ? "Save Profile Changes" : "Complete Profile & Enter Career Radar"}</span>
            <ArrowRight className="w-4 h-4" />
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
        currentPhoto={profilePhoto}
        currentSettings={photoSettings}
        githubAvatarUrl={candidate.githubData?.avatarUrl}
        githubUsername={candidate.githubData?.username}
        candidateName={fullName}
        onSave={(newPhoto, newSettings) => {
          setProfilePhoto(newPhoto);
          setPhotoSettings(newSettings);
          updateCandidate({
            profilePhoto: newPhoto,
            photoSettings: newSettings,
          });
        }}
      />
    </div>
  );
};
