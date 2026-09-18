import React, { useState, useMemo } from "react";
import { X, Mail, Send, CheckCircle2, AlertCircle, ArrowRight, Eye, Palette, Sparkles, ChevronDown, FileText } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { EmailTemplate } from "../../../types";
import { DEFAULT_EMAIL_TEMPLATES } from "../../../services/defaultTemplates";
import { EmailPreviewModal } from "../../common/EmailPreviewModal";
import { CustomSelect } from "../../common/CustomSelect";
import { EmailDesignTheme, buildDesignedEmailHtml, EMAIL_THEMES } from "../../../utils/emailDesigner";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
}

export const SendEmailModal: React.FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  candidateName,
  candidateEmail,
  jobTitle,
}) => {
  const { company, emailTemplates, sendEmailFromCompany, setActiveView } = useApp();

  const isEmailConnected = Boolean(company.emailIntegration?.isConnected);

  // Combine customized templates with all default prebuilts so user has full suite
  const allTemplates: EmailTemplate[] = useMemo(() => {
    const list = [...(emailTemplates || [])];
    DEFAULT_EMAIL_TEMPLATES.forEach((dt) => {
      if (!list.some((t) => t.id === dt.id || t.title.toLowerCase() === dt.title.toLowerCase())) {
        list.push(dt);
      }
    });
    return list.length > 0 ? list : DEFAULT_EMAIL_TEMPLATES;
  }, [emailTemplates]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(allTemplates[0]?.id || "tmpl_interview");
  const [designTheme, setDesignTheme] = useState<EmailDesignTheme>("modern");
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [subject, setSubject] = useState(() => {
    const t = allTemplates[0] || DEFAULT_EMAIL_TEMPLATES[0];
    return t.subject
      .replace(/\{\{\s*candidate_name\s*\}\}/gi, candidateName)
      .replace(/\{\{\s*job_title\s*\}\}/gi, jobTitle)
      .replace(/\{\{\s*company_name\s*\}\}/gi, company.companyName || "SwipeHired Partner");
  });

  const [body, setBody] = useState(() => {
    const t = allTemplates[0] || DEFAULT_EMAIL_TEMPLATES[0];
    return t.bodyTemplate
      .replace(/\{\{\s*candidate_name\s*\}\}/gi, candidateName)
      .replace(/\{\{\s*job_title\s*\}\}/gi, jobTitle)
      .replace(/\{\{\s*company_name\s*\}\}/gi, company.companyName || "SwipeHired Partner");
  });

  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [sendError, setSendError] = useState<string>("");

  if (!isOpen) return null;

  const handleSelectTemplate = (tmpl: EmailTemplate) => {
    setSelectedTemplateId(tmpl.id);
    const s = tmpl.subject
      .replace(/\{\{\s*candidate_name\s*\}\}/gi, candidateName)
      .replace(/\{\{\s*job_title\s*\}\}/gi, jobTitle)
      .replace(/\{\{\s*company_name\s*\}\}/gi, company.companyName || "SwipeHired Partner");
    const b = tmpl.bodyTemplate
      .replace(/\{\{\s*candidate_name\s*\}\}/gi, candidateName)
      .replace(/\{\{\s*job_title\s*\}\}/gi, jobTitle)
      .replace(/\{\{\s*company_name\s*\}\}/gi, company.companyName || "SwipeHired Partner");
    setSubject(s);
    setBody(b);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError("");
    setIsSending(true);
    const html = buildDesignedEmailHtml({
      theme: designTheme,
      subject,
      bodyText: body,
      companyName: company.companyName || "SwipeHired Partner",
      candidateName,
      jobTitle,
      senderName: company.contactPerson || company.companyName,
    });
    const result = await sendEmailFromCompany(candidateEmail, subject, body, html);
    setIsSending(false);
    if (result.success) {
      setIsSent(true);
      setTimeout(() => {
        setIsSent(false);
        onClose();
      }, 1500);
    } else {
      setSendError(result.message || "Failed to dispatch email. Please check your SMTP settings.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl border-2 border-slate-900 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-6 border-b-2 border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center font-black shadow-md ${
                isEmailConnected ? "bg-sky-500 shadow-sky-500/20" : "bg-amber-500 shadow-amber-500/20"
              }`}
            >
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Send Email to {candidateName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {isEmailConnected ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Connected
                    </span>
                    <span className="text-[11px] text-slate-600 font-semibold truncate max-w-[230px]">
                      {company.emailIntegration?.fromEmail || company.emailIntegration?.connectedEmail || company.email}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      Not Connected
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">Integration Required</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isEmailConnected ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 border-2 border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Connect Your Email First
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                You haven't connected your custom business email or SMTP server yet. Candidates cannot receive emails until your outreach account is configured and verified.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left max-w-md mx-auto space-y-2.5">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Why connection is required
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-700">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">
                  ✓
                </div>
                <span>
                  <strong>Official Domain Sender:</strong> Delivers directly from your verified domain so messages don't land in spam.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-700">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">
                  ✓
                </div>
                <span>
                  <strong>Direct Replies:</strong> Candidate responses go straight to your recruiter mailbox.
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-full text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setActiveView("company-email-connect");
                }}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-900/20 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <span>Connect Custom Email</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : isSent ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Email Dispatched!</h3>
            <p className="text-xs text-slate-500 font-medium">Delivered directly to {candidateEmail}</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-6 space-y-4 text-xs">
            {sendError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-start gap-2.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-snug">{sendError}</span>
              </div>
            )}

            {/* Template selector & Design Style bar */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-black uppercase tracking-wider text-[10px] text-slate-700">
                    Templates ({allTemplates.length}):
                  </span>
                  <CustomSelect
                    value={selectedTemplateId}
                    onChange={(val) => {
                      const t = allTemplates.find((x) => x.id === val);
                      if (t) handleSelectTemplate(t);
                    }}
                    variant="card"
                    size="sm"
                    buttonClassName="max-w-[210px]"
                    options={allTemplates.map((t) => ({
                      value: t.id,
                      label: t.title,
                      badge: t.category,
                    }))}
                  />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    className="px-3 py-1 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-3 h-3 text-sky-600" />
                    <span>Preview Email</span>
                  </button>
                </div>
              </div>

              {/* Horizontal Scrollable Pills for 1-Click Template Switching */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {allTemplates.map((tmpl) => {
                  const isActive = selectedTemplateId === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                        isActive
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-slate-200"
                      }`}
                      title={tmpl.title}
                    >
                      {tmpl.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Design theme selector */}
            <div className="flex items-center justify-between gap-2 px-1 text-[10px]">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                <Palette className="w-3 h-3 text-slate-400" />
                <span>Theme:</span>
                {(Object.keys(EMAIL_THEMES) as EmailDesignTheme[]).map((themeKey) => {
                  const isSelected = designTheme === themeKey;
                  const t = EMAIL_THEMES[themeKey];
                  return (
                    <button
                      key={themeKey}
                      type="button"
                      onClick={() => setDesignTheme(themeKey)}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.accentColor }} />
                      <span>{t.name.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
              <span className="text-[9px] text-emerald-700 font-semibold flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                <span>Responsive HTML</span>
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">To</label>
              <input
                type="text"
                disabled
                value={`${candidateName} <${candidateEmail}>`}
                className="w-full px-4 py-2.5 bg-slate-100 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 rounded-2xl border-2 border-slate-200 text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">Message Body</label>
              <textarea
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 text-slate-900 leading-relaxed focus:border-slate-900 focus:outline-none font-medium"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="px-6 py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-md shadow-sky-600/25 cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? "Sending..." : "Send Email"}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {showPreviewModal && (
        <EmailPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          subject={subject}
          bodyText={body}
          companyName={company.companyName || "SwipeHired Partner"}
          candidateName={candidateName}
          jobTitle={jobTitle}
          senderName={company.contactPerson || company.companyName}
          initialTheme={designTheme}
        />
      )}
    </div>
  );
};
