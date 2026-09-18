import React, { useState } from "react";
import { X, Send, MessageSquare, CheckCircle2, Phone, ExternalLink, AlertCircle } from "lucide-react";
import { useApp } from "../../../context/AppContext";

interface SendWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  candidatePhone: string;
  jobTitle: string;
}

export const SendWhatsAppModal: React.FC<SendWhatsAppModalProps> = ({
  isOpen,
  onClose,
  candidateName,
  candidatePhone,
  jobTitle,
}) => {
  const { company } = useApp();

  const [phoneNumber, setPhoneNumber] = useState(candidatePhone || "");
  const [templateType, setTemplateType] = useState<"intro" | "interview" | "shortlist">("intro");
  const [message, setMessage] = useState(
    `Hi ${candidateName.split(" ")[0]} 👋 This is ${company.contactPerson || "our recruitment team"} from ${company.companyName}. We saw your profile on SwipeHired for the ${jobTitle} role and would love to schedule a quick conversation!`
  );
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleTemplateChange = (type: "intro" | "interview" | "shortlist") => {
    setTemplateType(type);
    const firstName = candidateName.split(" ")[0];
    if (type === "intro") {
      setMessage(
        `Hi ${firstName} 👋 This is ${company.contactPerson || "our recruitment team"} from ${company.companyName}. We saw your profile on SwipeHired for the ${jobTitle} role and would love to schedule a quick conversation!`
      );
    } else if (type === "interview") {
      setMessage(
        `Hi ${firstName} 👋 We are pleased to invite you for an interview for the *${jobTitle}* position at *${company.companyName}*. Please let us know your availability for a 30-min conversation this week!`
      );
    } else if (type === "shortlist") {
      setMessage(
        `Congratulations ${firstName} 🎉! Your profile has been shortlisted for the *${jobTitle}* role at *${company.companyName}*. Our talent acquisition team will connect with you shortly with next steps.`
      );
    }
  };

  const getCleanPhone = () => {
    let clean = (phoneNumber || "").replace(/[^\d+]/g, "").trim();
    if (clean.startsWith("+")) clean = clean.slice(1);
    if (clean.length === 10) clean = `91${clean}`;
    else if (clean.length === 11 && clean.startsWith("0")) clean = `91${clean.slice(1)}`;
    return clean;
  };

  const handleSend = (target: "web" | "app" = "web") => {
    setError("");
    const cleanPhone = getCleanPhone();

    if (!cleanPhone || cleanPhone.length < 7) {
      setError("Please enter a valid phone number with country code.");
      return;
    }

    const encodedText = encodeURIComponent(message.trim());
    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    let destinationUrl = "";
    if (isMobile) {
      destinationUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    } else if (target === "app") {
      destinationUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
    } else {
      // web.whatsapp.com directly opens WhatsApp Web into the candidate's chat without the intermediate landing page
      destinationUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    }

    // Open directly in a new window/tab
    window.open(destinationUrl, "_blank", "noopener,noreferrer");

    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border-2 border-slate-900 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-6 border-b-2 border-slate-100 flex items-center justify-between gap-4 bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Direct WhatsApp Message</h2>
              <p className="text-xs text-slate-500 font-medium">Recipient: {candidateName}</p>
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
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Opening Chat...</h3>
            <p className="text-xs text-slate-500 font-medium">Redirected directly to chat with {phoneNumber || candidatePhone}</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend("web");
            }}
            className="p-6 space-y-4 text-xs"
          >
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Template Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black uppercase tracking-wider text-[10px] text-slate-600 mr-1">Template:</span>
              <button
                type="button"
                onClick={() => handleTemplateChange("intro")}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                  templateType === "intro"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                Intro
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange("interview")}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                  templateType === "interview"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                Interview
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange("shortlist")}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                  templateType === "shortlist"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                Shortlisted
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">
                WhatsApp Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setError("");
                  }}
                  placeholder="+91 8128385448"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-2xl border-2 border-slate-200 text-slate-800 font-bold focus:border-slate-900 focus:outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">Message</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 text-slate-900 leading-relaxed focus:border-slate-900 focus:outline-none font-medium"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 cursor-pointer px-2"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSend("app")}
                    title="Open in WhatsApp Desktop App if installed"
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-black text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Open App
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-500/25 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp Web</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 text-center font-medium">
                Opens directly in chat with message pre-filled
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
