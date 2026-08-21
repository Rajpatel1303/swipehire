import React, { useState } from "react";
import { X, Send, MessageSquare, CheckCircle2, Phone } from "lucide-react";
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

  const [message, setMessage] = useState(
    `Hi ${candidateName.split(" ")[0]} 👋 This is ${company.contactPerson} from ${company.companyName}. We saw your profile on SwipeHired for the ${jobTitle} role and would love to schedule a quick conversation!`
  );
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
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
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">WhatsApp Message Dispatched!</h3>
            <p className="text-xs text-slate-500 font-medium">Sent to {candidatePhone}</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-6 space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">WhatsApp Number</label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{candidatePhone || "+91 98765 43210"}</span>
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
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-md shadow-emerald-500/25 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send WhatsApp</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
