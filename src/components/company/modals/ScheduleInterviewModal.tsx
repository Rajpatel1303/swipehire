import React, { useState } from "react";
import { X, Calendar, Clock, Video, CheckCircle2 } from "lucide-react";
import { useApp } from "../../../context/AppContext";

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  candidateName,
  jobTitle,
}) => {
  const { scheduleInterview, company, triggerCelebration } = useApp();

  const [date, setDate] = useState("2026-08-20");
  const [time, setTime] = useState("14:30");
  const [interviewType, setInterviewType] = useState("Technical Deep Dive (React & Systems)");
  const [notes, setNotes] = useState("We will discuss component architecture, state management, and past projects.");
  const [googleMeetLink, setGoogleMeetLink] = useState(
    `https://meet.google.com/abc-${Math.random().toString(36).substring(2, 6)}-tech`
  );
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    scheduleInterview(applicationId, {
      date,
      time,
      meetingLink: googleMeetLink,
      notes,
      interviewerName: company.contactPerson || "Hiring Lead",
      scheduledAt: new Date().toISOString(),
    });
    triggerCelebration();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl border-2 border-slate-900 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-6 border-b-2 border-slate-100 flex items-center justify-between gap-4 bg-sky-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Schedule Interview</h2>
              <p className="text-xs text-slate-500 font-medium">
                {candidateName} · {jobTitle}
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

        {isSaved ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Interview Scheduled!</h3>
            <p className="text-xs text-slate-500 font-medium">
              Notification and Google Meet link dispatched to candidate dashboard and email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-2xl border-2 border-slate-200 text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-2xl border-2 border-slate-200 text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">Interview Round / Title</label>
              <input
                type="text"
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 rounded-2xl border-2 border-slate-200 text-slate-900 font-bold focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">Video Meeting Link (Google Meet)</label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-2xl border-2 border-slate-200">
                <Video className="w-4 h-4 text-purple-600 shrink-0" />
                <input
                  type="text"
                  value={googleMeetLink}
                  onChange={(e) => setGoogleMeetLink(e.target.value)}
                  required
                  className="w-full bg-transparent text-slate-800 font-mono text-xs font-bold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">Preparation Notes for Candidate</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-md shadow-purple-600/25 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Confirm & Send Invite</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
