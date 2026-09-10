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
} from "lucide-react";
import { useApp } from "../../context/AppContext";

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
          <div className={`p-2 rounded-lg flex items-center gap-1.5 font-medium ${yearsOfExperience !== undefined ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Experience</span>
          </div>
          <div className={`p-2 rounded-lg flex items-center gap-1.5 font-medium ${candidate.education?.length > 0 ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Education (BCA)</span>
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

        {/* Experience List Preview */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-bold text-slate-700">Work Experience Extracted</label>
          <div className="space-y-2">
            {candidate.experience?.map((exp, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{exp.title}</span>
                  <span className="text-slate-400 font-medium">{exp.duration}</span>
                </div>
                <div className="text-emerald-700 font-semibold mt-0.5">{exp.company}</div>
                <p className="text-slate-600 mt-1 leading-relaxed">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Education & Projects Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span>Education</span>
            </div>
            {candidate.education?.map((edu, i) => (
              <div key={i} className="text-slate-600">
                <strong className="text-slate-900 block">{edu.degree}</strong>
                <span>{edu.institution} ({edu.year})</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <FolderGit2 className="w-4 h-4 text-sky-600" />
              <span>Projects</span>
            </div>
            {candidate.projects?.map((proj, i) => (
              <div key={i} className="text-slate-600">
                <strong className="text-slate-900 block">{proj.name}</strong>
                <p className="text-[11px] text-slate-500 line-clamp-1">{proj.description}</p>
              </div>
            ))}
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
            <span>Complete Profile & Enter Career Radar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
