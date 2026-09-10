import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Video,
  ExternalLink,
  PlusCircle,
  CheckCircle2,
  User,
  Building2,
  Sparkles,
  Phone,
  MessageSquare,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ScheduleInterviewModal } from "./modals/ScheduleInterviewModal";
import { Application } from "../../types";

export const CompanyInterviewsPage: React.FC = () => {
  const { applications, company } = useApp();

  const [activeScheduleModal, setActiveScheduleModal] = useState<Application | null>(null);

  const interviewApps = applications.filter(
    (app) => (!company.id || app.companyId === company.id) && app.status === "interview"
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Interview Command Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upcoming conversations with candidate profiles and Google Meet video rooms.
          </p>
        </div>

        <span className="px-3.5 py-1.5 bg-sky-50 text-sky-800 rounded-xl text-xs font-bold border border-sky-200">
          {interviewApps.length} Upcoming Scheduled
        </span>
      </div>

      {/* Interviews List (Spec #28 & #29) */}
      {interviewApps.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center text-xl mx-auto">
            📅
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No interviews scheduled yet.</h3>
            <p className="text-xs text-slate-500">
              Shortlist candidates from your Hiring Radar or Pipeline to schedule technical rounds.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {interviewApps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-6 space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Candidate Info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={
                        app.candidatePhoto ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      }
                      alt={app.candidateName}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-sky-50"
                    />
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{app.candidateName}</h3>
                      <p className="text-xs text-slate-500 font-medium">{app.jobTitle}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
                    {app.matchScore}% Match
                  </span>
                </div>

                {/* Scheduled Time & Room */}
                <div className="p-4 bg-gradient-to-r from-sky-50 to-blue-50/60 rounded-2xl border border-sky-100 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-sky-900">
                    <Calendar className="w-4 h-4 text-sky-600" />
                    <span>{app.interviewDate || "Scheduled Discussion"}</span>
                  </div>

                  {app.recruiterNotes && (
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      <strong>Focus:</strong> {app.recruiterNotes}
                    </p>
                  )}
                </div>

                {/* Candidate Skills */}
                <div className="flex flex-wrap gap-1">
                  {app.candidateSkills.map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-lg font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => setActiveScheduleModal(app)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Reschedule
                </button>

                {app.interviewLink && (
                  <a
                    href={
                      app.interviewLink.startsWith("http")
                        ? app.interviewLink
                        : `https://${app.interviewLink}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Google Meet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      {activeScheduleModal && (
        <ScheduleInterviewModal
          isOpen={!!activeScheduleModal}
          onClose={() => setActiveScheduleModal(null)}
          applicationId={activeScheduleModal.id}
          candidateName={activeScheduleModal.candidateName}
          jobTitle={activeScheduleModal.jobTitle}
        />
      )}
    </div>
  );
};
