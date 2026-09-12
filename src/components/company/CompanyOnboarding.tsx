import React, { useState } from "react";
import {
  Building2,
  Sparkles,
  Globe,
  MapPin,
  Users,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Camera,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export const CompanyOnboarding: React.FC = () => {
  const { company, updateCompany, setActiveView, triggerCelebration } = useApp();

  const [companyName, setCompanyName] = useState(company.companyName || "");
  const [website, setWebsite] = useState(company.website || "");
  const [industry, setIndustry] = useState(company.industry || "");
  const [size, setSize] = useState(company.size || "10-50 Employees");
  const [location, setLocation] = useState(company.location || "");
  const [about, setAbout] = useState(company.about || "");
  const [culture, setCulture] = useState(company.culture || "");
  const [logo, setLogo] = useState(
    company.logo ||
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80"
  );
  const [benefits, setBenefits] = useState<string[]>(
    company.benefits || []
  );

  const logoPresets = [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=200&auto=format&fit=crop&q=80",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCompany({
        companyName,
        website,
        industry,
        size,
        location,
        about,
        culture,
        logo,
        benefits,
        isCompleted: true,
      });
      triggerCelebration();
      // Redirect to Company Hiring Cockpit (Spec #18)
      setActiveView("company-cockpit");
    } catch (err: any) {
      console.error("[CompanyOnboarding] Submission failed:", err);
      alert(`Failed to save onboarding details: ${err.message || "Please try again."}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-in fade-in duration-200">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold border border-sky-100">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hiring Profile Setup</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          "Set up your company hiring cockpit."
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Help top tech candidates discover your culture, mission, and benefits.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
        {/* Logo Selection */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
          <div className="relative">
            <img
              src={logo}
              alt="logo"
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-sky-50 shadow-md"
            />
            <button
              type="button"
              onClick={() => {
                const next = (logoPresets.indexOf(logo) + 1) % logoPresets.length;
                setLogo(logoPresets[next]);
              }}
              className="absolute -bottom-2 -right-2 p-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Change logo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Company Logo</h3>
            <p className="text-xs text-slate-500">Pick from company presets or upload:</p>
            <div className="flex items-center gap-2 pt-1">
              {logoPresets.map((preset, idx) => (
                <img
                  key={idx}
                  src={preset}
                  alt={`logo-${idx}`}
                  onClick={() => setLogo(preset)}
                  className={`w-8 h-8 rounded-lg object-cover cursor-pointer ring-2 transition-all ${
                    logo === preset ? "ring-sky-500 scale-110" : "ring-transparent opacity-60 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Company Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Company Name</label>
            <input
              id="company-setup-name"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Website</label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="company-setup-website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://abctechnologies.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Industry</label>
            <input
              id="company-setup-industry"
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Cloud Software / FinTech"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Company Size</label>
            <select
              id="company-setup-size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
            >
              <option value="1-10 Employees">1-10 Employees (Early Startup)</option>
              <option value="11-50 Employees">11-50 Employees (Growth)</option>
              <option value="50-200 Employees">50-200 Employees (Scale-up)</option>
              <option value="200-1000 Employees">200-1000 Employees (Enterprise)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Headquarters Location</label>
            <input
              id="company-setup-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Ahmedabad, India"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">About Company</label>
            <textarea
              id="company-setup-about"
              rows={3}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium leading-relaxed"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Culture & Perks</label>
            <textarea
              id="company-setup-culture"
              rows={2}
              value={culture}
              onChange={(e) => setCulture(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium leading-relaxed"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            id="company-save-profile-btn"
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-md shadow-sky-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Save & Open Hiring Cockpit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
