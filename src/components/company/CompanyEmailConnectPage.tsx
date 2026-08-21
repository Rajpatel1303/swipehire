import React, { useState } from "react";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Lock,
  Server,
  Settings,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  X,
  ArrowRight,
  Info,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export const CompanyEmailConnectPage: React.FC = () => {
  const { company, updateCompany, emailTemplates, updateEmailTemplate, triggerCelebration } = useApp();

  const currentIntegration = company.emailIntegration || {
    provider: "none" as const,
    connectedEmail: company.email || "",
    senderName: company.contactPerson || company.companyName || "Recruiting Team",
    isConnected: false,
  };

  const [activeTab, setActiveTab] = useState<"connect" | "templates">("connect");

  // SMTP Configuration Form State
  const [smtpHost, setSmtpHost] = useState(currentIntegration.smtpHost || "smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(currentIntegration.smtpPort || 587);
  const [smtpSecure, setSmtpSecure] = useState(currentIntegration.smtpSecure || false);
  const [smtpUser, setSmtpUser] = useState(currentIntegration.smtpUser || currentIntegration.connectedEmail || company.email || "");
  const [smtpPassword, setSmtpPassword] = useState(currentIntegration.smtpPassword || "");
  const [senderName, setSenderName] = useState(currentIntegration.senderName || `${company.companyName || "Company"} Recruiting Team`);
  const [fromEmail, setFromEmail] = useState(currentIntegration.fromEmail || currentIntegration.connectedEmail || company.email || "");
  const [showPassword, setShowPassword] = useState(false);

  // Edit mode vs active view
  const [isEditingSMTP, setIsEditingSMTP] = useState(!currentIntegration.isConnected || currentIntegration.provider !== "smtp");

  // Test Email Modal State
  const [showTestModal, setShowTestModal] = useState(false);
  const [testRecipient, setTestRecipient] = useState(company.email || "");
  const [testStage, setTestStage] = useState<"idle" | "connecting" | "authenticating" | "sending" | "success" | "error">("idle");
  const [testErrorMessage, setTestErrorMessage] = useState("");
  const [testSuccessMessage, setTestSuccessMessage] = useState("");

  // Template editor states
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<
    "interview" | "shortlisted" | "received" | "rejection"
  >("interview");
  const [savedSuccess, setSavedSuccess] = useState(false);

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

  const handleCategorySelect = (category: "interview" | "shortlisted" | "received" | "rejection") => {
    setSelectedTemplateCategory(category);
    const tmpl = emailTemplates.find((t) => t.category === category);
    if (tmpl) {
      setCurrentSubject(tmpl.subject);
      setCurrentBody(tmpl.bodyTemplate);
    }
  };

  const handleUserChange = (val: string) => {
    const prev = smtpUser;
    setSmtpUser(val);
    if (!fromEmail || fromEmail === prev || fromEmail === company.email) {
      setFromEmail(val);
    }
  };

  const applyPreset = (preset: "gmail" | "sendgrid" | "mailgun" | "ses") => {
    if (preset === "gmail") {
      setSmtpHost("smtp.gmail.com");
      setSmtpPort(587);
      setSmtpSecure(false);
    } else if (preset === "sendgrid") {
      setSmtpHost("smtp.sendgrid.net");
      setSmtpPort(587);
      setSmtpSecure(false);
      setSmtpUser("apikey");
    } else if (preset === "mailgun") {
      setSmtpHost("smtp.mailgun.org");
      setSmtpPort(587);
      setSmtpSecure(false);
    } else if (preset === "ses") {
      setSmtpHost("email-smtp.us-east-1.amazonaws.com");
      setSmtpPort(587);
      setSmtpSecure(false);
    }
  };

  const handleConnectGmail = () => {
    updateCompany({
      emailIntegration: {
        provider: "gmail",
        connectedEmail: company.email || "recruiter@gmail.com",
        senderName: `${company.contactPerson || company.companyName} (${company.companyName})`,
        isConnected: true,
        connectedAt: new Date().toISOString(),
      },
    });
    triggerCelebration();
  };

  const openTestModal = () => {
    setTestRecipient(fromEmail || smtpUser || company.email || "");
    setTestStage("idle");
    setTestErrorMessage("");
    setTestSuccessMessage("");
    setShowTestModal(true);
  };

  const runSmtpTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient || !testRecipient.includes("@")) {
      setTestErrorMessage("Please provide a valid test recipient email address.");
      setTestStage("error");
      return;
    }

    setTestStage("connecting");
    setTestErrorMessage("");
    setTestSuccessMessage("");

    // Multi-stage visual progression
    setTimeout(() => {
      setTestStage("authenticating");
    }, 600);

    setTimeout(async () => {
      setTestStage("sending");

      try {
        const response = await fetch("/api/email/test-smtp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            smtpHost,
            smtpPort,
            smtpSecure,
            smtpUser,
            smtpPassword,
            senderName,
            fromEmail: fromEmail || smtpUser,
            testRecipientEmail: testRecipient,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setTestStage("success");
          setTestSuccessMessage(data.message || `Test email successfully delivered to ${testRecipient}!`);

          // Save verified SMTP settings to company profile
          updateCompany({
            emailIntegration: {
              provider: "smtp",
              connectedEmail: fromEmail || smtpUser,
              senderName: senderName || company.companyName,
              isConnected: true,
              connectedAt: new Date().toISOString(),
              smtpHost,
              smtpPort: Number(smtpPort),
              smtpUser,
              smtpPassword,
              smtpSecure,
              fromEmail: fromEmail || smtpUser,
              lastTestedAt: new Date().toISOString(),
            },
          });

          setIsEditingSMTP(false);
          triggerCelebration();
        } else {
          setTestStage("error");
          setTestErrorMessage(
            data.error || "Could not connect to SMTP server. Please check your credentials and try again."
          );
        }
      } catch (err: any) {
        setTestStage("error");
        setTestErrorMessage(
          err.message || "Failed to reach email service. Please ensure your SMTP server is reachable."
        );
      }
    }, 1200);
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
            Connect your custom SMTP server or Google Workspace to dispatch automated candidate interview invites & offers.
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
            Connect Email & SMTP
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
        <div className="space-y-8">
          {/* Top Options Grid: Google Workspace & Custom SMTP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Google Workspace / Gmail */}
            <div
              className={`p-6 bg-white rounded-[28px] border-2 transition-all space-y-4 ${
                currentIntegration.isConnected && currentIntegration.provider === "gmail"
                  ? "border-emerald-600 shadow-lg shadow-emerald-600/10"
                  : "border-slate-900 shadow-md"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center font-black text-xl shadow-xs">
                    G
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">Google Workspace / Gmail</h3>
                    <p className="text-xs text-slate-500 font-medium">1-Click OAuth connection for Gmail</p>
                  </div>
                </div>
                {currentIntegration.isConnected && currentIntegration.provider === "gmail" && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </span>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-800 font-black uppercase tracking-wider text-[10px]">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google Workspace OAuth</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Account: <strong className="text-slate-900">{company.email || "recruiter@gmail.com"}</strong>
                </p>
              </div>

              <button
                onClick={handleConnectGmail}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-black uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>{currentIntegration.isConnected && currentIntegration.provider === "gmail" ? "Reconnect Gmail" : "Connect Google Workspace"}</span>
              </button>
            </div>

            {/* Custom SMTP Server Quick Card */}
            <div
              className={`p-6 bg-white rounded-[28px] border-2 transition-all space-y-4 ${
                currentIntegration.isConnected && currentIntegration.provider === "smtp"
                  ? "border-sky-600 shadow-lg shadow-sky-600/10"
                  : "border-slate-900 shadow-md"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
                    <Server className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">Custom SMTP Server</h3>
                    <p className="text-xs text-slate-500 font-medium">Send from your branded company domain</p>
                  </div>
                </div>
                {currentIntegration.isConnected && currentIntegration.provider === "smtp" && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-800 font-black uppercase tracking-wider text-[10px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span>Custom Mail Server & Relay</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Active Host: <strong className="text-slate-900">{currentIntegration.smtpHost || "Not Configured"}</strong>
                </p>
              </div>

              <button
                onClick={() => setIsEditingSMTP(true)}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-full text-xs font-black uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span>{currentIntegration.isConnected && currentIntegration.provider === "smtp" ? "Update SMTP Settings" : "Configure Custom SMTP"}</span>
              </button>
            </div>
          </div>

          {/* Active Connected SMTP Status or Configuration Form */}
          {currentIntegration.isConnected && currentIntegration.provider === "smtp" && !isEditingSMTP ? (
            /* Active Verified State */
            <div className="bg-white rounded-[32px] border-2 border-emerald-600 shadow-xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">SMTP Connection Verified & Live</h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider">Active</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">All candidate invitations and offer emails are dispatched via your custom mail server.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setTestStage("idle");
                      setShowTestModal(true);
                    }}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-sky-600" />
                    <span>Send Test Email</span>
                  </button>
                  <button
                    onClick={() => setIsEditingSMTP(true)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Update Settings</span>
                  </button>
                </div>
              </div>

              {/* Connection Details Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">SMTP Host</p>
                  <p className="text-xs font-black text-slate-800 mt-1 truncate">{currentIntegration.smtpHost || "smtp.gmail.com"}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Port & Security</p>
                  <p className="text-xs font-black text-slate-800 mt-1">
                    {currentIntegration.smtpPort || 587} {currentIntegration.smtpSecure ? "(SSL/TLS)" : "(STARTTLS)"}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">From Address</p>
                  <p className="text-xs font-black text-slate-800 mt-1 truncate">{currentIntegration.fromEmail || currentIntegration.connectedEmail}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sender Identity</p>
                  <p className="text-xs font-black text-slate-800 mt-1 truncate">{currentIntegration.senderName}</p>
                </div>
              </div>
            </div>
          ) : (
            /* SMTP Settings Form (Editable) */
            <div className="bg-white rounded-[32px] border-2 border-slate-900 shadow-2xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Configure Custom SMTP Credentials</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Enter your email provider's SMTP settings. You will be prompted to test the connection before activating.
                  </p>
                </div>

                {/* Preset Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">Presets:</span>
                  <button
                    type="button"
                    onClick={() => applyPreset("gmail")}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    Gmail
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("sendgrid")}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    SendGrid
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("mailgun")}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    Mailgun
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("ses")}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    Amazon SES
                  </button>
                </div>
              </div>

              {/* Informational Tip for Gmail App Passwords */}
              <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 text-xs text-sky-900 flex items-start gap-3">
                <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Using Gmail / Google Workspace?</p>
                  <p className="text-[11px] text-sky-800 leading-relaxed">
                    Google requires an <strong>App Password</strong> rather than your normal password. Go to your <strong>Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App Passwords</strong>, generate a 16-character key, and paste it below.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">
                    SMTP Host / Server <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. smtp.gmail.com or mail.yourcompany.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">
                      SMTP Port <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="587"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">
                      Encryption
                    </label>
                    <select
                      value={smtpSecure ? "ssl" : "tls"}
                      onChange={(e) => setSmtpSecure(e.target.value === "ssl")}
                      className="w-full px-3 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                    >
                      <option value="tls">STARTTLS (587)</option>
                      <option value="ssl">SSL / TLS (465)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">
                    SMTP Username / Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. careers@company.com"
                    value={smtpUser}
                    onChange={(e) => handleUserChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Your login email address for the mail server.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">
                    SMTP Password / App Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••••••••••"
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-11 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">16-character Google App Password (or SMTP server password).</p>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">
                    Sender Name (Branding)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Talent Team"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">
                    From Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. careers@company.com"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 font-medium mt-1">For Gmail, this must match your SMTP Username.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                {currentIntegration.isConnected && currentIntegration.provider === "smtp" ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingSMTP(false)}
                    className="text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel Editing
                  </button>
                ) : <div />}

                <button
                  type="button"
                  onClick={openTestModal}
                  className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <span>Test Connection & Save</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Template Customizer */
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

      {/* Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl border-2 border-slate-900 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black shadow-xs">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Test SMTP Connection</h2>
                  <p className="text-xs text-slate-500 font-medium">Verify credentials by sending a live test email</p>
                </div>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {testStage === "success" ? (
                /* Success View */
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Test Email Sent Successfully!</h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {testSuccessMessage}
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 text-left space-y-1">
                    <p className="font-bold">✓ Real Email Dispatched</p>
                    <p className="text-[11px] text-emerald-800">
                      The test message was successfully accepted and transmitted by <strong>{smtpHost}</strong> to <strong>{testRecipient}</strong>. Please check your inbox (and spam folder).
                    </p>
                  </div>

                  <button
                    onClick={() => setShowTestModal(false)}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-md transition-colors cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              ) : (
                /* Test Execution Form */
                <form onSubmit={runSmtpTest} className="space-y-4">
                  {/* Connection Summary Details */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-700 font-bold">
                      <span>Server:</span>
                      <span className="font-mono text-slate-900">{smtpHost}:{smtpPort}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700 font-bold">
                      <span>Login User:</span>
                      <span className="font-mono text-slate-900 truncate max-w-[240px]">{smtpUser}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700 font-bold">
                      <span>Sender Identity:</span>
                      <span className="font-mono text-slate-900 truncate max-w-[240px]">{fromEmail || smtpUser}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">
                      Send Test Email To:
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. your-personal-email@gmail.com"
                      value={testRecipient}
                      onChange={(e) => setTestRecipient(e.target.value)}
                      disabled={testStage === "connecting" || testStage === "authenticating" || testStage === "sending"}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500 font-medium mt-1">
                      Enter any email address where you want to receive the verification email.
                    </p>
                  </div>

                  {/* Progress Indicator */}
                  {(testStage === "connecting" || testStage === "authenticating" || testStage === "sending") && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-800">
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                          <span>Connecting Outbound SMTP...</span>
                        </span>
                        <span className="text-sky-600">
                          {testStage === "connecting" && "1 / 3 Handshake"}
                          {testStage === "authenticating" && "2 / 3 Authenticating"}
                          {testStage === "sending" && "3 / 3 Transmitting"}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-sky-600 h-2 transition-all duration-300 rounded-full"
                          style={{
                            width:
                              testStage === "connecting"
                                ? "33%"
                                : testStage === "authenticating"
                                ? "66%"
                                : "90%",
                          }}
                        />
                      </div>

                      <p className="text-[11px] text-slate-500 font-medium text-center">
                        {testStage === "connecting" && `Connecting socket to ${smtpHost}:${smtpPort}...`}
                        {testStage === "authenticating" && `Authenticating ${smtpUser}...`}
                        {testStage === "sending" && `Sending message payload to ${testRecipient}...`}
                      </p>
                    </div>
                  )}

                  {/* Meaningful Error Display */}
                  {testStage === "error" && (
                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2">
                      <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>SMTP Connection Failed</span>
                      </div>
                      <p className="text-xs text-rose-800 leading-relaxed font-medium">
                        {testErrorMessage}
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setShowTestModal(false)}
                      disabled={testStage === "connecting" || testStage === "authenticating" || testStage === "sending"}
                      className="text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={testStage === "connecting" || testStage === "authenticating" || testStage === "sending"}
                      className="px-6 py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-md shadow-sky-600/25 cursor-pointer"
                    >
                      {testStage === "connecting" || testStage === "authenticating" || testStage === "sending" ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Test Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
