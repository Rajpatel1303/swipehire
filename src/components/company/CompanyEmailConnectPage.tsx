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
  ArrowLeft,
  Info,
  Loader2,
  Trash2,
  Sparkles,
  Plus,
  Palette,
  Layout,
  Smartphone,
  Monitor,
  Wand2,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { DEFAULT_EMAIL_TEMPLATES } from "../../services/defaultTemplates";
import { CustomSelect } from "../common/CustomSelect";
import { EmailPreviewModal } from "../common/EmailPreviewModal";
import { EmailDesignTheme, EMAIL_THEMES, buildDesignedEmailHtml } from "../../utils/emailDesigner";

export const CompanyEmailConnectPage: React.FC = () => {
  const {
    company,
    updateCompany,
    emailTemplates,
    addEmailTemplate,
    updateEmailTemplate,
    deleteEmailTemplate,
    triggerCelebration,
  } = useApp();

  const currentIntegration = company.emailIntegration || {
    provider: "none" as const,
    connectedEmail: company.email || "",
    senderName: company.contactPerson || company.companyName || "Recruiting Team",
    isConnected: false,
  };

  const [activeTab, setActiveTab] = useState<"connect" | "templates">("connect");

  // SMTP Configuration State
  const [smtpHost, setSmtpHost] = useState(currentIntegration.smtpHost || "smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(currentIntegration.smtpPort || 587);
  const [smtpSecure, setSmtpSecure] = useState(currentIntegration.smtpSecure || false);
  const [smtpUser, setSmtpUser] = useState(currentIntegration.smtpUser || currentIntegration.connectedEmail || company.email || "");
  const [smtpPassword, setSmtpPassword] = useState(currentIntegration.smtpPassword || "");
  const [senderName, setSenderName] = useState(currentIntegration.senderName || `${company.companyName || "Company"} Recruiting Team`);
  const [fromEmail, setFromEmail] = useState(currentIntegration.fromEmail || currentIntegration.smtpUser || currentIntegration.connectedEmail || company.email || "");
  const [showPassword, setShowPassword] = useState(false);

  // Multi-step Connect Custom Email Wizard Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [isSavingDirectly, setIsSavingDirectly] = useState(false);
  const [directSaveError, setDirectSaveError] = useState("");

  // Test Email Checking State
  const [testRecipient, setTestRecipient] = useState(company.email || "");
  const [testStage, setTestStage] = useState<"idle" | "connecting" | "authenticating" | "sending" | "success" | "error">("idle");
  const [testErrorMessage, setTestErrorMessage] = useState("");
  const [testSuccessMessage, setTestSuccessMessage] = useState("");

  // Template editor states
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    return emailTemplates[0]?.id || DEFAULT_EMAIL_TEMPLATES[0].id;
  });

  const activeTemplate =
    emailTemplates.find((t) => t.id === selectedTemplateId) ||
    emailTemplates[0] ||
    DEFAULT_EMAIL_TEMPLATES[0];

  const [currentTitle, setCurrentTitle] = useState(activeTemplate?.title || "");
  const [currentCategory, setCurrentCategory] = useState<
    "received" | "shortlisted" | "interview" | "rejection" | "custom"
  >(activeTemplate?.category || "interview");
  const [currentSubject, setCurrentSubject] = useState(activeTemplate?.subject || "");
  const [currentBody, setCurrentBody] = useState(activeTemplate?.bodyTemplate || "");

  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateSaveError, setTemplateSaveError] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Email Designer & Live Preview State
  const [designTheme, setDesignTheme] = useState<EmailDesignTheme>("modern");
  const [editorTab, setEditorTab] = useState<"edit" | "preview">("edit");
  const [inLineDevice, setInLineDevice] = useState<"desktop" | "mobile">("desktop");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [ctaText, setCtaText] = useState("Schedule Interview Round →");
  const [ctaUrl, setCtaUrl] = useState("https://swipehire.ownmylands.workers.dev");

  const handleBeautifyEmail = () => {
    const body = currentBody.trim();
    if (!body) return;

    if (!body.includes("•") && !body.includes("- ") && !body.includes("1.")) {
      const paragraphs = body.split(/\n+/).filter(Boolean);
      const greeting = paragraphs[0] || "Hi {{candidate_name}},";
      const middle =
        paragraphs.slice(1, -1).join("\n\n") ||
        "We are impressed by your profile and verified engineering skills on SwipeHired!";
      const signoff = paragraphs[paragraphs.length - 1] || "Warm regards,\n{{company_name}} Hiring Team";

      const beautified = `${greeting}

${middle}

Key Discussion & Agenda:
• Overview of technical architecture and relevant stack experience
• Key responsibilities, impact areas, and growth for the {{job_title}} role
• Our engineering culture, team cadence, and product roadmap
• Open Q&A with our engineering leadership

Next Steps:
• Review your scheduled availability via your SwipeHired dashboard.
• A calendar invitation with meeting coordinates will be dispatched shortly.

${signoff}`;
      setCurrentBody(beautified);
    }
  };

  // Add Template Modal State
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState<
    "received" | "shortlisted" | "interview" | "rejection" | "custom"
  >("custom");
  const [newTemplateSubject, setNewTemplateSubject] = useState("");
  const [newTemplateBody, setNewTemplateBody] = useState("");
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [addTemplateError, setAddTemplateError] = useState("");

  // Delete Template State
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);

  // Synchronize inputs whenever selected template changes
  React.useEffect(() => {
    if (activeTemplate) {
      setCurrentTitle(activeTemplate.title || "");
      setCurrentCategory(activeTemplate.category || "custom");
      setCurrentSubject(activeTemplate.subject || "");
      setCurrentBody(activeTemplate.bodyTemplate || "");
      setTemplateSaveError("");
    }
  }, [activeTemplate?.id]);

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const tmpl = emailTemplates.find((t) => t.id === id);
    if (tmpl) {
      setCurrentTitle(tmpl.title || "");
      setCurrentCategory(tmpl.category || "custom");
      setCurrentSubject(tmpl.subject || "");
      setCurrentBody(tmpl.bodyTemplate || "");
    }
  };

  const handleResetToDefault = async () => {
    const defaultTmpl =
      DEFAULT_EMAIL_TEMPLATES.find((t) => t.id === activeTemplate.id) ||
      DEFAULT_EMAIL_TEMPLATES.find((t) => t.category === activeTemplate.category) ||
      DEFAULT_EMAIL_TEMPLATES[0];

    if (defaultTmpl) {
      setCurrentTitle(defaultTmpl.title);
      setCurrentCategory(defaultTmpl.category);
      setCurrentSubject(defaultTmpl.subject);
      setCurrentBody(defaultTmpl.bodyTemplate);
      try {
        await updateEmailTemplate(activeTemplate.id, {
          title: defaultTmpl.title,
          category: defaultTmpl.category,
          subject: defaultTmpl.subject,
          bodyTemplate: defaultTmpl.bodyTemplate,
        });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      } catch (err: any) {
        setTemplateSaveError(err.message || "Failed to reset template.");
      }
    }
  };

  const handleSaveTemplates = async (e: React.FormEvent) => {
    e.preventDefault();
    setTemplateSaveError("");
    if (!currentTitle.trim()) {
      setTemplateSaveError("Please enter a template title.");
      return;
    }
    if (!currentSubject.trim()) {
      setTemplateSaveError("Please enter an email subject line.");
      return;
    }

    setIsSavingTemplate(true);
    try {
      await updateEmailTemplate(activeTemplate.id, {
        title: currentTitle.trim(),
        category: currentCategory,
        subject: currentSubject.trim(),
        bodyTemplate: currentBody,
      });
      setSavedSuccess(true);
      triggerCelebration();
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      console.error("[Save Template Error]:", err);
      setTemplateSaveError(err.message || "Failed to save template changes to Supabase.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${activeTemplate.title}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeletingTemplate(true);
    setTemplateSaveError("");
    try {
      await deleteEmailTemplate(activeTemplate.id);
      const remaining = emailTemplates.filter((t) => t.id !== activeTemplate.id);
      if (remaining.length > 0) {
        setSelectedTemplateId(remaining[0].id);
      } else {
        setSelectedTemplateId(DEFAULT_EMAIL_TEMPLATES[0].id);
      }
    } catch (err: any) {
      console.error("[Delete Template Error]:", err);
      setTemplateSaveError(err.message || "Failed to delete template from database.");
    } finally {
      setIsDeletingTemplate(false);
    }
  };

  const handleCreateNewTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddTemplateError("");
    if (!newTemplateTitle.trim()) {
      setAddTemplateError("Please enter a template title.");
      return;
    }
    if (!newTemplateSubject.trim()) {
      setAddTemplateError("Please enter an email subject line.");
      return;
    }

    setIsCreatingTemplate(true);
    try {
      const created = await addEmailTemplate({
        title: newTemplateTitle.trim(),
        category: newTemplateCategory,
        subject: newTemplateSubject.trim(),
        bodyTemplate:
          newTemplateBody.trim() ||
          `Hi {{candidate_name}},\n\nThank you for connecting with {{company_name}}!\n\nBest regards,\n{{company_name}} Recruiting Team`,
      });

      setSelectedTemplateId(created.id);
      setShowAddTemplateModal(false);
      setNewTemplateTitle("");
      setNewTemplateSubject("");
      setNewTemplateBody("");
      triggerCelebration();
    } catch (err: any) {
      console.error("[Create Template Error]:", err);
      setAddTemplateError(err.message || "Failed to create email template in database.");
    } finally {
      setIsCreatingTemplate(false);
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

  const openConnectModal = (step: 1 | 2 = 1) => {
    setModalStep(step);
    setTestStage("idle");
    setTestErrorMessage("");
    setTestSuccessMessage("");
    setDirectSaveError("");
    if (!testRecipient) {
      setTestRecipient(fromEmail || smtpUser || company.email || "");
    }
    setShowConfigModal(true);
  };

  const openUpdateEmailModal = () => {
    setSmtpHost(currentIntegration.smtpHost || "smtp.gmail.com");
    setSmtpPort(currentIntegration.smtpPort || 587);
    setSmtpSecure(currentIntegration.smtpSecure || false);
    setSmtpUser(currentIntegration.smtpUser || currentIntegration.connectedEmail || company.email || "");
    setSmtpPassword(currentIntegration.smtpPassword || "");
    setSenderName(currentIntegration.senderName || `${company.companyName || "Company"} Recruiting Team`);
    setFromEmail(currentIntegration.fromEmail || currentIntegration.smtpUser || currentIntegration.connectedEmail || company.email || "");
    setTestRecipient(currentIntegration.fromEmail || currentIntegration.smtpUser || company.email || "");
    setModalStep(1);
    setTestStage("idle");
    setTestErrorMessage("");
    setTestSuccessMessage("");
    setDirectSaveError("");
    setShowConfigModal(true);
  };

  const openNewConnectionModal = () => {
    setSmtpHost("smtp.gmail.com");
    setSmtpPort(587);
    setSmtpSecure(false);
    setSmtpUser("");
    setSmtpPassword("");
    setSenderName(`${company.companyName || "Company"} Recruiting Team`);
    setFromEmail("");
    setTestRecipient(company.email || "");
    setModalStep(1);
    setTestStage("idle");
    setTestErrorMessage("");
    setTestSuccessMessage("");
    setDirectSaveError("");
    setShowConfigModal(true);
  };

  const handleSaveAndConnectDirectly = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDirectSaveError("");
    if (!smtpHost.trim()) {
      setDirectSaveError("Please enter an SMTP Host.");
      return;
    }
    const resolvedEmail = (fromEmail || smtpUser || company.email || "").trim();
    if (!resolvedEmail) {
      setDirectSaveError("Please enter an Email Address or SMTP Username.");
      return;
    }

    setIsSavingDirectly(true);
    try {
      // Must await Supabase persistence before reporting success or updating state
      await updateCompany({
        emailIntegration: {
          provider: "smtp",
          connectedEmail: resolvedEmail,
          senderName: senderName || company.companyName || "Recruiting Team",
          isConnected: true,
          connectedAt: currentIntegration.connectedAt || new Date().toISOString(),
          smtpHost: smtpHost.trim(),
          smtpPort: Number(smtpPort) || 587,
          smtpUser: smtpUser.trim() || resolvedEmail,
          smtpPassword: smtpPassword.trim(),
          smtpSecure,
          fromEmail: resolvedEmail,
          lastTestedAt: currentIntegration.lastTestedAt || new Date().toISOString(),
        },
      });

      triggerCelebration();
      setShowConfigModal(false);
    } catch (err: any) {
      console.error("[Email Connect Persistence Error]:", err);
      setDirectSaveError(err.message || "Failed to save email integration to Supabase database.");
    } finally {
      setIsSavingDirectly(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm("Are you sure you want to disconnect your custom email integration? Candidates will not receive automatic email notifications until reconnected.")) {
      try {
        await updateCompany({
          emailIntegration: {
            provider: "none",
            connectedEmail: "",
            senderName: "",
            isConnected: false,
          },
        });
      } catch (err: any) {
        console.error("[Disconnect Persistence Error]:", err);
        alert(`Failed to disconnect email integration: ${err.message}`);
      }
    }
  };

  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpHost.trim()) {
      alert("Please enter an SMTP Host.");
      return;
    }
    if (!smtpUser.trim()) {
      alert("Please enter your SMTP Username / Email.");
      return;
    }
    if (!smtpPassword.trim()) {
      alert("Please enter your SMTP Password or App Password.");
      return;
    }
    setTestStage("idle");
    setTestErrorMessage("");
    setTestSuccessMessage("");
    if (!testRecipient) {
      setTestRecipient(fromEmail || smtpUser || company.email || "");
    }
    setModalStep(2);
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
          try {
            // Save verified SMTP settings to company profile in Supabase
            await updateCompany({
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

            setTestStage("success");
            setTestSuccessMessage(data.message || `Test email successfully delivered to ${testRecipient}!`);
            triggerCelebration();
          } catch (dbErr: any) {
            console.error("[runSmtpTest] Failed to persist connection to database:", dbErr);
            setTestStage("error");
            setTestErrorMessage(`Test email delivered, but failed to save connection to Supabase database: ${dbErr.message}`);
          }
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
        <div className="space-y-6">
          {currentIntegration.isConnected ? (
            /* Connected State: Single unified card showing connection status */
            <div className="bg-white rounded-[32px] border-2 border-emerald-600 shadow-xl p-6 sm:p-10 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20 shrink-0">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                        Your Email is Connected
                      </h2>
                      <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        Connected & Active
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500 font-medium">Connected Address:</span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-black text-slate-900 font-mono">
                        <Mail className="w-3.5 h-3.5 text-emerald-600" />
                        {currentIntegration.fromEmail || currentIntegration.connectedEmail || currentIntegration.smtpUser || "careers@company.com"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                      All candidate invitations, outreach messages, and job offer letters are dispatched directly from this verified email address.
                    </p>
                  </div>
                </div>

                {/* Connected Action Buttons: Update Email, New Connection, Check Connection, Disconnect */}
                <div className="flex items-center gap-2.5 flex-wrap md:justify-end shrink-0">
                  <button
                    type="button"
                    onClick={openUpdateEmailModal}
                    className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Update Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={openNewConnectionModal}
                    className="px-5 py-3 bg-sky-50 hover:bg-sky-100 text-sky-900 border-2 border-sky-200 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5 text-sky-600" />
                    <span>New Connection</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openConnectModal(2)}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Send a live test verification email"
                  >
                    <Send className="w-3.5 h-3.5 text-sky-600" />
                    <span>Check Connection</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-full transition-colors cursor-pointer"
                    title="Disconnect Email"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Connection Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Connected Sender</p>
                  <p className="text-xs font-black text-slate-900 truncate">
                    {currentIntegration.fromEmail || currentIntegration.connectedEmail || currentIntegration.smtpUser || "Configured"}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">SMTP Host</p>
                  <p className="text-xs font-black text-slate-900 truncate">
                    {currentIntegration.smtpHost || "smtp.gmail.com"}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Port & Security</p>
                  <p className="text-xs font-black text-slate-900">
                    {currentIntegration.smtpPort || 587} {currentIntegration.smtpSecure ? "(SSL/TLS)" : "(STARTTLS)"}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sender Identity</p>
                  <p className="text-xs font-black text-slate-900 truncate">
                    {currentIntegration.senderName || company.companyName}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Not Connected State: Single Box to Connect Custom Email */
            <div className="bg-white rounded-[32px] border-2 border-slate-900 shadow-xl p-6 sm:p-10 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black shadow-md shrink-0">
                    <Mail className="w-7 h-7 text-sky-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                        Connect Custom Email
                      </h2>
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                        Not Connected
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1 max-w-2xl leading-relaxed">
                      Send recruitment invites, automatic interview requests, and job offer letters directly from your own business email or custom SMTP server.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openConnectModal(1)}
                  className="w-full md:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-xl hover:shadow-2xl transition-all cursor-pointer shrink-0"
                >
                  <Mail className="w-4 h-4 text-sky-400" />
                  <span>Connect Custom Email</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-sky-600 shadow-xs">
                    <Server className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Any SMTP Provider</h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Connect Google Workspace, Gmail, SendGrid, Mailgun, Amazon SES, or any private mail server.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Automated Outreach</h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Automatically deliver customized invitation emails to candidates with your company branding and details.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Real-Time Verification</h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Verify server credentials and test deliverability with live progress feedback before activating.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Dynamic Template Customizer & Manager */
        <div className="space-y-6">
          <form onSubmit={handleSaveTemplates} className="bg-white rounded-[32px] border-2 border-slate-900 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Automated Template Editor</h2>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  <span className="text-xs text-slate-500 font-medium">Click variable to insert:</span>
                  <button
                    type="button"
                    onClick={() => setCurrentBody((prev) => `${prev} {{candidate_name}}`)}
                    className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[11px] font-bold hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                    title="Click to insert {{candidate_name}}"
                  >
                    + &#123;&#123;candidate_name&#125;&#125;
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentBody((prev) => `${prev} {{job_title}}`)}
                    className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-mono text-[11px] font-bold hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                    title="Click to insert {{job_title}}"
                  >
                    + &#123;&#123;job_title&#125;&#125;
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentBody((prev) => `${prev} {{company_name}}`)}
                    className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-mono text-[11px] font-bold hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                    title="Click to insert {{company_name}}"
                  >
                    + &#123;&#123;company_name&#125;&#125;
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {savedSuccess && (
                  <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Saved to Database</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  title="Open full interactive preview"
                >
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span>Preview Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewTemplateTitle("");
                    setNewTemplateCategory("custom");
                    setNewTemplateSubject("");
                    setNewTemplateBody("");
                    setAddTemplateError("");
                    setShowAddTemplateModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Template</span>
                </button>
              </div>
            </div>

            {/* Dynamic Template Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {emailTemplates.map((tmpl, idx) => {
                const isSelected = tmpl.id === activeTemplate.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl.id)}
                    className={`px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                        isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span>{tmpl.title}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                        isSelected ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-500"
                      }`}
                    >
                      {tmpl.category}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setNewTemplateTitle("");
                  setNewTemplateCategory("custom");
                  setNewTemplateSubject("");
                  setNewTemplateBody("");
                  setAddTemplateError("");
                  setShowAddTemplateModal(true);
                }}
                className="px-3 py-2.5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-900 text-slate-500 hover:text-slate-900 text-[11px] font-black uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Template</span>
              </button>
            </div>

            {templateSaveError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{templateSaveError}</span>
              </div>
            )}

            {/* Template Form Inputs */}
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">
                    Template Name / Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={currentTitle}
                    onChange={(e) => setCurrentTitle(e.target.value)}
                    placeholder="e.g. Technical Interview Invite"
                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">
                    Category
                  </label>
                  <CustomSelect
                    value={currentCategory}
                    onChange={(val) => setCurrentCategory(val as any)}
                    variant="card"
                    size="md"
                    options={[
                      { value: "interview", label: "Interview Invite", badge: "Stage" },
                      { value: "shortlisted", label: "Shortlisted", badge: "Stage" },
                      { value: "received", label: "App Received", badge: "Auto" },
                      { value: "rejection", label: "Rejection", badge: "Stage" },
                      { value: "custom", label: "Custom Outreach", badge: "Direct" },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">
                  Email Subject Line <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={currentSubject}
                  onChange={(e) => setCurrentSubject(e.target.value)}
                  placeholder="e.g. Interview Invitation: {{job_title}} at {{company_name}}"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                />
              </div>

              {/* Design Theme & Template Mode Strip */}
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-sky-600" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                      Email Design Style:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(Object.keys(EMAIL_THEMES) as EmailDesignTheme[]).map((themeKey) => {
                        const isSelected = designTheme === themeKey;
                        const t = EMAIL_THEMES[themeKey];
                        return (
                          <button
                            key={themeKey}
                            type="button"
                            onClick={() => setDesignTheme(themeKey)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-slate-900 text-white shadow-xs scale-102"
                                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-300"
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: t.accentColor }}
                            />
                            <span>{t.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mode Switcher: Edit vs Live Preview */}
                  <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setEditorTab("edit")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        editorTab === "edit"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Edit Template
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab("preview")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        editorTab === "preview"
                          ? "bg-sky-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>Live Preview</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleBeautifyEmail}
                      className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Auto-format plain text with structured bullet points and agenda"
                    >
                      <Wand2 className="w-3 h-3 text-amber-600" />
                      <span>✨ Beautify into Designed Layout</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPreviewModal(true)}
                      className="px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-700 border border-sky-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Layout className="w-3 h-3 text-sky-600" />
                      <span>Fullscreen Device Preview</span>
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-500 font-medium">
                    Converts plain text to responsive HTML with company branding & CTA button
                  </span>
                </div>
              </div>

              {editorTab === "edit" ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                      Message Template Body
                    </label>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <span>Insert:</span>
                      <button
                        type="button"
                        onClick={() => setCurrentBody((prev) => `${prev} {{candidate_name}}`)}
                        className="text-emerald-700 hover:underline font-bold cursor-pointer"
                      >
                        Name
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setCurrentBody((prev) => `${prev} {{job_title}}`)}
                        className="text-sky-700 hover:underline font-bold cursor-pointer"
                      >
                        Role
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setCurrentBody((prev) => `${prev} {{company_name}}`)}
                        className="text-amber-700 hover:underline font-bold cursor-pointer"
                      >
                        Company
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={8}
                    required
                    value={currentBody}
                    onChange={(e) => setCurrentBody(e.target.value)}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 leading-relaxed font-mono focus:border-slate-900 focus:outline-none"
                  />

                  {/* Primary CTA Button Config */}
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                        Primary CTA Button Text
                      </label>
                      <input
                        type="text"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        placeholder="e.g. Schedule Interview Round →"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                        Primary Button Link URL
                      </label>
                      <input
                        type="text"
                        value={ctaUrl}
                        onChange={(e) => setCtaUrl(e.target.value)}
                        placeholder="https://yourcompany.com or candidate portal"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* In-line Live Designed Preview */
                <div className="border-2 border-slate-300 rounded-2xl overflow-hidden bg-slate-100 space-y-2">
                  <div className="p-3 bg-slate-900 text-white flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold">Live Designed Email Simulation</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        (With sample candidate: Alex Johnson)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInLineDevice("desktop")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                          inLineDevice === "desktop" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <Monitor className="w-3 h-3" />
                        <span>Desktop</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInLineDevice("mobile")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                          inLineDevice === "mobile" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <Smartphone className="w-3 h-3" />
                        <span>Mobile</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex justify-center">
                    <div
                      className={`transition-all ${
                        inLineDevice === "mobile" ? "w-[380px]" : "w-full max-w-[620px]"
                      } rounded-xl overflow-hidden shadow-md border border-slate-300 bg-white`}
                    >
                      <iframe
                        title="Inline Email Preview"
                        srcDoc={buildDesignedEmailHtml({
                          theme: designTheme,
                          subject: currentSubject,
                          bodyText: currentBody,
                          companyName: company.companyName || "SwipeHired Partner",
                          candidateName: "Alex Johnson",
                          jobTitle: currentSubject.includes("{{job_title}}") ? "Senior Full-Stack Engineer" : "Engineering Role",
                          senderName: senderName || company.companyName,
                          ctaText,
                          ctaUrl,
                        })}
                        className="w-full h-[520px] border-none bg-white"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Template Actions Footer */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset to Prebuilt</span>
                </button>

                <button
                  type="button"
                  disabled={isDeletingTemplate || emailTemplates.length <= 1}
                  onClick={handleDeleteTemplate}
                  className="text-xs font-black uppercase tracking-wider text-rose-500 hover:text-rose-700 disabled:opacity-30 cursor-pointer flex items-center gap-1.5 transition-colors"
                  title="Permanently delete this template"
                >
                  {isDeletingTemplate ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Delete Template</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isSavingTemplate}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-md shadow-sky-600/25 cursor-pointer transition-all"
              >
                {isSavingTemplate ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Template Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Create New Template Modal */}
          {showAddTemplateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl border-2 border-slate-900 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
                <div className="p-6 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50/75 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                        Create New Email Template
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Configure customized outreach copy saved directly to your workspace.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddTemplateModal(false)}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateNewTemplate} className="p-6 space-y-4 overflow-y-auto">
                  {addTemplateError && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{addTemplateError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">
                        Template Name / Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Round 2 Architecture Interview"
                        value={newTemplateTitle}
                        onChange={(e) => setNewTemplateTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">
                        Category
                      </label>
                      <CustomSelect
                        value={newTemplateCategory}
                        onChange={(val) => setNewTemplateCategory(val as any)}
                        variant="card"
                        size="md"
                        options={[
                          { value: "interview", label: "Interview Invite", badge: "Stage" },
                          { value: "shortlisted", label: "Shortlisted", badge: "Stage" },
                          { value: "received", label: "App Received", badge: "Auto" },
                          { value: "rejection", label: "Rejection", badge: "Stage" },
                          { value: "custom", label: "Custom Outreach", badge: "Direct" },
                        ]}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">
                      Email Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Interview Invitation: {{job_title}} at {{company_name}}"
                      value={newTemplateSubject}
                      onChange={(e) => setNewTemplateSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                        Template Body
                      </label>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <span>Insert:</span>
                        <button
                          type="button"
                          onClick={() => setNewTemplateBody((prev) => `${prev} {{candidate_name}}`)}
                          className="text-emerald-700 hover:underline font-bold cursor-pointer"
                        >
                          Name
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => setNewTemplateBody((prev) => `${prev} {{job_title}}`)}
                          className="text-sky-700 hover:underline font-bold cursor-pointer"
                        >
                          Role
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => setNewTemplateBody((prev) => `${prev} {{company_name}}`)}
                          className="text-amber-700 hover:underline font-bold cursor-pointer"
                        >
                          Company
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={6}
                      placeholder={`Hi {{candidate_name}},\n\nWe would love to invite you to discuss the {{job_title}} opportunity at {{company_name}}.\n\nWarm regards,\n{{company_name}} Team`}
                      value={newTemplateBody}
                      onChange={(e) => setNewTemplateBody(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-mono leading-relaxed focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      disabled={isCreatingTemplate}
                      onClick={() => setShowAddTemplateModal(false)}
                      className="px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingTemplate}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      {isCreatingTemplate ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Create & Save Template</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connect Custom Email Multi-Step Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl border-2 border-slate-900 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50/75 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black shadow-xs">
                  <Mail className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {modalStep === 1
                      ? currentIntegration.isConnected
                        ? "Update Custom Email"
                        : "Connect Custom Email"
                      : "Verify Email Connection"}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {modalStep === 1 ? "Step 1 of 2: SMTP & Sender Configuration" : "Step 2 of 2: Connection Test & Verification"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="px-6 py-3 bg-slate-100/60 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    modalStep === 1 ? "bg-slate-900 text-white" : "bg-emerald-600 text-white"
                  }`}
                >
                  {modalStep === 2 ? <CheckCircle2 className="w-4 h-4" /> : "1"}
                </span>
                <span className={`text-xs font-bold ${modalStep === 1 ? "text-slate-900" : "text-slate-500"}`}>
                  Credentials
                </span>
              </div>
              <div className="flex-1 h-0.5 bg-slate-200 mx-2" />
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    modalStep === 2 ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  2
                </span>
                <span className={`text-xs font-bold ${modalStep === 2 ? "text-slate-900" : "text-slate-400"}`}>
                  Check Connection
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {modalStep === 1 ? (
                /* STEP 1: Enter Email & SMTP Credentials */
                <form onSubmit={handleProceedToStep2} className="space-y-4">
                  {/* Presets */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Quick Presets:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
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

                  {/* Gmail Help Tip */}
                  <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 text-xs text-sky-900 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-sky-800 leading-relaxed font-medium">
                      <strong>Google Workspace or Gmail users:</strong> Use a 16-character Google App Password (found in Google Account &rarr; Security &rarr; App Passwords) for your SMTP Password.
                    </p>
                  </div>

                  {/* Sender Profile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">
                        Sender Name (Branding)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Acme Hiring Team"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">
                        From Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. careers@company.com"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* SMTP Server & Port */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">
                        SMTP Host / Server <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. smtp.gmail.com"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">
                        Port & SSL
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(Number(e.target.value))}
                          className="w-20 px-2.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                        />
                        <label className="flex items-center gap-1 text-[11px] text-slate-700 font-bold cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={smtpSecure}
                            onChange={(e) => setSmtpSecure(e.target.checked)}
                            className="rounded text-sky-600 focus:ring-sky-500"
                          />
                          <span>SSL</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Username & Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">
                        SMTP Username / Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. careers@company.com"
                        value={smtpUser}
                        onChange={(e) => handleUserChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">
                        SMTP Password / App Key <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="••••••••••••••••"
                          value={smtpPassword}
                          onChange={(e) => setSmtpPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {directSaveError && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{directSaveError}</span>
                    </div>
                  )}

                  {/* Step 1 Footer */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setShowConfigModal(false)}
                      disabled={isSavingDirectly}
                      className="px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <button
                        type="button"
                        disabled={isSavingDirectly}
                        onClick={() => handleSaveAndConnectDirectly()}
                        className="flex-1 sm:flex-initial px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-full font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-colors"
                      >
                        {isSavingDirectly ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving to Database...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Save & Connect Email</span>
                          </>
                        )}
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingDirectly}
                        className="flex-1 sm:flex-initial px-5 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-full font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors"
                      >
                        <span>Next: Check Connection</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                /* STEP 2: Check Connection & Send Test Email */
                <div className="space-y-4">
                  {/* Summary of credentials */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Server & Port:</span>
                      <span className="font-bold text-slate-900">{smtpHost}:{smtpPort} {smtpSecure ? "(SSL)" : "(STARTTLS)"}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>SMTP User:</span>
                      <span className="font-bold text-slate-900 truncate max-w-[200px]">{smtpUser}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>From Email:</span>
                      <span className="font-bold text-slate-900 truncate max-w-[200px]">{fromEmail || smtpUser}</span>
                    </div>
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setTestStage("idle");
                          setModalStep(1);
                        }}
                        className="text-[11px] font-bold text-sky-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Edit Credentials</span>
                      </button>
                    </div>
                  </div>

                  {testStage === "success" ? (
                    /* Success State */
                    <div className="text-center py-4 space-y-4 animate-in fade-in">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                          Connection Successful!
                        </h3>
                        <p className="text-xs text-slate-600 font-medium">
                          {testSuccessMessage}
                        </p>
                      </div>

                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 text-left space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Integration Verified & Active</span>
                        </p>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                          A real verification email was successfully delivered to <strong>{testRecipient}</strong>. Candidate notifications will now be automatically dispatched through this connection.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowConfigModal(false)}
                        className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-md transition-colors cursor-pointer"
                      >
                        Done & Close
                      </button>
                    </div>
                  ) : (
                    /* Check Connection Form */
                    <form onSubmit={runSmtpTest} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1.5">
                          Recipient Email for Connection Check <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. your-email@gmail.com"
                          value={testRecipient}
                          onChange={(e) => setTestRecipient(e.target.value)}
                          disabled={testStage === "connecting" || testStage === "authenticating" || testStage === "sending"}
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                        />
                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                          We will send a live verification email to this address to verify your SMTP host, port, and credentials.
                        </p>
                      </div>

                      {/* Progress Animation */}
                      {(testStage === "connecting" || testStage === "authenticating" || testStage === "sending") && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-800">
                            <span className="flex items-center gap-2">
                              <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                              <span>Checking Connection...</span>
                            </span>
                            <span className="text-sky-600">
                              {testStage === "connecting" && "1 / 3 Socket Handshake"}
                              {testStage === "authenticating" && "2 / 3 Authenticating"}
                              {testStage === "sending" && "3 / 3 Transmitting"}
                            </span>
                          </div>

                          {/* Progress Bar */}
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
                            {testStage === "connecting" && `Opening socket connection to ${smtpHost}:${smtpPort}...`}
                            {testStage === "authenticating" && `Validating credentials for ${smtpUser}...`}
                            {testStage === "sending" && `Sending verification email to ${testRecipient}...`}
                          </p>
                        </div>
                      )}

                      {/* Error Message Display */}
                      {testStage === "error" && (
                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2">
                          <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Connection Verification Failed</span>
                          </div>
                          <p className="text-xs text-rose-800 leading-relaxed font-medium">
                            {testErrorMessage}
                          </p>
                          <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setTestStage("idle");
                                setModalStep(1);
                              }}
                              className="text-xs font-bold text-rose-900 underline cursor-pointer"
                            >
                              ← Go Back to Step 1 & Check Credentials
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveAndConnectDirectly()}
                              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Save & Connect Anyway</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step 2 Footer Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setTestStage("idle");
                            setModalStep(1);
                          }}
                          disabled={testStage === "connecting" || testStage === "authenticating" || testStage === "sending"}
                          className="px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 cursor-pointer flex items-center gap-1.5"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveAndConnectDirectly()}
                            disabled={testStage === "connecting" || testStage === "authenticating" || testStage === "sending"}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full font-black text-xs uppercase tracking-wider cursor-pointer transition-colors"
                          >
                            <span>Connect Without Test</span>
                          </button>

                          <button
                            type="submit"
                            disabled={testStage === "connecting" || testStage === "authenticating" || testStage === "sending"}
                            className="px-6 py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-md shadow-sky-600/25 cursor-pointer"
                          >
                            {testStage === "connecting" || testStage === "authenticating" || testStage === "sending" ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Testing Connection...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                <span>Check Connection</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPreviewModal && (
        <EmailPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          subject={currentSubject}
          bodyText={currentBody}
          companyName={company.companyName || "SwipeHired Partner"}
          candidateName="Alex Johnson"
          jobTitle={currentSubject.includes("{{job_title}}") ? "Senior Full-Stack Engineer" : "Engineering Role"}
          senderName={senderName || company.companyName}
          initialTheme={designTheme}
          ctaText={ctaText}
          ctaUrl={ctaUrl}
        />
      )}
    </div>
  );
};
