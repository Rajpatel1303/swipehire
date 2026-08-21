import React, { useState } from "react";
import { X, Mail, Send, CheckCircle2 } from "lucide-react";
import { useApp } from "../../../context/AppContext";

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
  const { company, sendEmailFromCompany } = useApp();

  const [templateType, setTemplateType] = useState<"shortlist" | "interview" | "custom">("interview");
  const [subject, setSubject] = useState(`Next Steps: ${jobTitle} Opportunity at ${company.companyName}`);
  const [body, setBody] = useState(
    `Hi ${candidateName.split(" ")[0]},\n\nWe were really impressed with your experience and verified skill match for our ${jobTitle} role.\n\nWe would love to invite you for a 30-minute technical conversation with our team.\n\nBest regards,\n${company.contactPerson}\n${company.companyName}`
  );
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleTemplateChange = (type: "shortlist" | "interview" | "custom") => {
    setTemplateType(type);
    if (type === "shortlist") {
      setSubject(`Your application for ${jobTitle} has been shortlisted!`);
      setBody(
        `Hi ${candidateName.split(" ")[0]},\n\nGreat news! Your profile for the ${jobTitle} position at ${company.companyName} has been shortlisted by our engineering leadership.\n\nOur team is reviewing your availability and will reach out with scheduling details shortly.\n\nWarm regards,\n${company.contactPerson}`
      );
    } else if (type === "interview") {
      setSubject(`Interview Invitation: ${jobTitle} @ ${company.companyName}`);
      setBody(
        `Hi ${candidateName.split(" ")[0]},\n\nWe would love to invite you for a technical interview for the ${jobTitle} role.\n\nPlease find the Google Meet link attached to your SwipeHired dashboard.\n\nBest regards,\n${company.contactPerson}\n${company.companyName}`
      );
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    await sendEmailFromCompany(candidateEmail, subject, body);
    setIsSending(false);
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl border-2 border-slate-900 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-6 border-b-2 border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Send Email to {candidateName}</h2>
              <p className="text-xs text-slate-500 font-medium">
                Connected: {company.emailIntegration?.connectedEmail || company.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSent ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Email Dispatched!</h3>
            <p className="text-xs text-slate-500 font-medium">Delivered directly to {candidateEmail}</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-6 space-y-4 text-xs">
            {/* Template selector */}
            <div className="flex items-center gap-2">
              <span className="font-black uppercase tracking-wider text-[10px] text-slate-600">Quick Template:</span>
              <button
                type="button"
                onClick={() => handleTemplateChange("interview")}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                  templateType === "interview"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                Interview Invite
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange("shortlist")}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                  templateType === "shortlist"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                Shortlisted
              </button>
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
                className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-md shadow-sky-600/25 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? "Sending..." : "Send Email"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
