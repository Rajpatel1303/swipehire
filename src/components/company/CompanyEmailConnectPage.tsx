import React, { useState } from "react";
import {
  Mail,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Edit3,
  Save,
  Send,
  Lock,
  Globe,
  Settings,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export const CompanyEmailConnectPage: React.FC = () => {
  const { company, updateCompany, emailTemplates, updateEmailTemplate, triggerCelebration } = useApp();

  const currentIntegration = company.emailIntegration || {
    provider: "gmail" as const,
    connectedEmail: company.email || "hr@abctech.com",
    senderName: company.contactPerson || company.companyName || "Recruiting Team",
    isConnected: true,
  };

  const [activeTab, setActiveTab] = useState<"connect" | "templates">("connect");
  const [provider, setProvider] = useState<"gmail" | "outlook" | "custom" | "none">(
    currentIntegration.provider || "gmail"
  );
  const [connectedAccount, setConnectedAccount] = useState(
    currentIntegration.connectedEmail || company.email || "hr@abctech.com"
  );
  const [isConnected, setIsConnected] = useState(currentIntegration.isConnected ?? true);

  // Template editor states
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<
    "interview" | "shortlisted" | "received" | "rejection"
  >("interview");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Active template from context or fallback
  const activeTemplate =
    emailTemplates.find((t) => t.category === selectedTemplateCategory) ||
    emailTemplates[0] || {
      id: "tmpl_default",
      title: "Interview Invitation",
      category: "interview",
      subject: "Interview Invitation: {{job_title}} @ {{company_name}}",
      bodyTemplate: "Hi {{candidate_name}},\n\nWe would love to invite you for an interview.",
    };

  const [currentSubject, setCurrentSubject] = useState(activeTemplate.subject);
  const [currentBody, setCurrentBody] = useState(activeTemplate.bodyTemplate);

  // Sync editor when category changes
  const handleCategorySelect = (category: "interview" | "shortlisted" | "received" | "rejection") => {
    setSelectedTemplateCategory(category);
    const tmpl = emailTemplates.find((t) => t.category === category);
    if (tmpl) {
      setCurrentSubject(tmpl.subject);
      setCurrentBody(tmpl.bodyTemplate);
    }
  };

  const handleConnect = (prov: "gmail" | "outlook") => {
    setProvider(prov);
    setIsConnected(true);
    updateCompany({
      emailIntegration: {
        provider: prov,
        connectedEmail: connectedAccount,
        senderName: `${company.contactPerson || company.companyName} (${company.companyName})`,
        isConnected: true,
        connectedAt: new Date().toISOString(),
      },
    });
    triggerCelebration();
  };

  const handleSaveTemplates = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTemplate) {
      updateEmailTemplate(activeTemplate.id, {
        subject: currentSubject,
        bodyTemplate: currentBody,
      });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
            Email & Outreach Integration
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Connect your company email to send branded invitations and status updates directly.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="w-full sm:w-auto flex items-center p-1 bg-slate-100 rounded-xl sm:rounded-full border border-slate-200">
          <button
            onClick={() => setActiveTab("connect")}
            className={`flex-1 sm:flex-initial px-4 sm:px-5 py-2 rounded-lg sm:rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap text-center ${
              activeTab === "connect" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Connect Account
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex-1 sm:flex-initial px-4 sm:px-5 py-2 rounded-lg sm:rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap text-center ${
              activeTab === "templates" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Email Templates
          </button>
        </div>
      </div>

      {activeTab === "connect" ? (
        /* Connect Account View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Google Workspace / Gmail */}
            <div className="p-6 bg-white rounded-[28px] border-2 border-slate-900 hover:border-slate-800 shadow-xl space-y-4 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center font-black text-xl shadow-xs">
                    G
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">Google Workspace / Gmail</h3>
                    <p className="text-xs text-slate-500 font-medium">Send directly from your @company.com inbox</p>
                  </div>
                </div>
                {isConnected && provider === "gmail" && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </span>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-800 font-black uppercase tracking-wider text-[10px]">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Google OAuth Scope</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Account: <strong className="text-slate-900">{connectedAccount}</strong>
                </p>
              </div>

              <button
                onClick={() => handleConnect("gmail")}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
              >
                {isConnected && provider === "gmail" ? "Reconnect Gmail Account" : "Connect Google Workspace"}
              </button>
            </div>

            {/* Microsoft 365 / Outlook */}
            <div className="p-6 bg-white rounded-[28px] border-2 border-slate-900 hover:border-slate-800 shadow-xl space-y-4 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-xl shadow-xs">
                    M
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">Microsoft 365 / Outlook</h3>
                    <p className="text-xs text-slate-500 font-medium">Enterprise Exchange & Teams Sync</p>
                  </div>
                </div>
                {isConnected && provider === "outlook" && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </span>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-800 font-black uppercase tracking-wider text-[10px]">
                  <Lock className="w-3.5 h-3.5 text-sky-600" />
                  <span>Microsoft Graph Integration</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Account: <strong className="text-slate-900">{connectedAccount}</strong>
                </p>
              </div>

              <button
                onClick={() => handleConnect("outlook")}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-full text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
              >
                {isConnected && provider === "outlook" ? "Reconnect Outlook" : "Connect Microsoft 365"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Template Customizer (Spec #25) */
        <form onSubmit={handleSaveTemplates} className="bg-white rounded-[32px] border-2 border-slate-900 shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Automated Template Editor</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Variables: <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono font-bold">&#123;&#123;candidate_name&#125;&#125;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono font-bold">&#123;&#123;job_title&#125;&#125;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono font-bold">&#123;&#123;company_name&#125;&#125;</code>
              </p>
            </div>

            {savedSuccess && (
              <span className="px-3.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Templates Saved</span>
              </span>
            )}
          </div>

          {/* Template Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleCategorySelect("interview")}
              className={`p-3 rounded-2xl text-[10px] font-black uppercase tracking-wider text-left transition-colors cursor-pointer ${
                selectedTemplateCategory === "interview"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              1. Interview Invite
            </button>

            <button
              type="button"
              onClick={() => handleCategorySelect("shortlisted")}
              className={`p-3 rounded-2xl text-[10px] font-black uppercase tracking-wider text-left transition-colors cursor-pointer ${
                selectedTemplateCategory === "shortlisted"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              2. Shortlisted
            </button>

            <button
              type="button"
              onClick={() => handleCategorySelect("received")}
              className={`p-3 rounded-2xl text-[10px] font-black uppercase tracking-wider text-left transition-colors cursor-pointer ${
                selectedTemplateCategory === "received"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              3. App Received
            </button>

            <button
              type="button"
              onClick={() => handleCategorySelect("rejection")}
              className={`p-3 rounded-2xl text-[10px] font-black uppercase tracking-wider text-left transition-colors cursor-pointer ${
                selectedTemplateCategory === "rejection"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              4. Rejection
            </button>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">Email Subject</label>
              <input
                type="text"
                value={currentSubject}
                onChange={(e) => setCurrentSubject(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">Message Template Body</label>
              <textarea
                rows={7}
                value={currentBody}
                onChange={(e) => setCurrentBody(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 leading-relaxed font-medium focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-md shadow-sky-600/25 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Template Changes</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
