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
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { EducationItem, ExperienceItem, ProjectItem } from "../../types";

export const CandidateProfileReview: React.FC = () => {
  const {
    candidate,
    updateCandidate,
    setActiveView,
    missingProfileFields,
    isCandidateProfileComplete,
    triggerCelebration,
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
      {/* AI Extraction Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-50 via-sky-50 to-orange-50 border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">
              "We've extracted your information. Please review it before continuing."
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Never automatically trust the AI. Every field below is fully editable to match your exact preferences.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-emerald-800 border border-emerald-200 shrink-0">
          AI Verified ✦
        </span>
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
        </div>

        {showErrorBanner && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>⚠️ Your profile needs all required details before entering the Career Radar.</span>
          </div>
        )}
      </div>

      {/* Main Review Form */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-8">
        {/* Photo Selection */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
          <div className="relative">
            <img
              src={profilePhoto}
              alt="candidate"
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-emerald-100 shadow-md"
            />
            <button
              id="change-photo-btn"
              onClick={() => {
                const nextIndex = (avatarPresets.indexOf(profilePhoto) + 1) % avatarPresets.length;
                setProfilePhoto(avatarPresets[nextIndex]);
              }}
              className="absolute -bottom-2 -right-2 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Click to cycle avatar"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Profile Photo</h3>
            <p className="text-xs text-slate-500">
              Click the camera icon to switch avatar or choose from presets:
            </p>
            <div className="flex items-center gap-2 pt-1">
              {avatarPresets.map((preset, idx) => (
                <img
                  key={idx}
                  src={preset}
                  alt={`preset-${idx}`}
                  onClick={() => setProfilePhoto(preset)}
                  className={`w-8 h-8 rounded-lg object-cover cursor-pointer ring-2 transition-all ${
                    profilePhoto === preset ? "ring-emerald-500 scale-110" : "ring-transparent opacity-60 hover:opacity-100"
                  }`}
                />
              ))}
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
            <select
              id="review-work-preference"
              value={workPreference}
              onChange={(e) => setWorkPreference(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            >
              <option value="Hybrid">Hybrid (Preferred in Ahmedabad)</option>
              <option value="Remote">Remote</option>
              <option value="Onsite">Onsite</option>
            </select>
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
    </div>
  );
};
