import React, { useState, useEffect } from "react";
import { Clock, ShieldAlert, CheckCircle, RefreshCw, Activity, ArrowRight } from "lucide-react";
import { AuditRecord } from "../../types";
import { AdminApi } from "../../services/adminApi";

interface ActivityTimelineProps {
  entityId: string;
  targetUserId?: string | null;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ entityId, targetUserId }) => {
  const [timeline, setTimeline] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTimeline = async () => {
    setIsLoading(true);
    try {
      const records = await AdminApi.getEntityAuditTimeline(entityId, targetUserId || undefined);
      setTimeline(records);
    } catch (err) {
      console.error("[ActivityTimeline] Error fetching timeline:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (entityId) {
      fetchTimeline();
    }
  }, [entityId, targetUserId]);

  const formatActionTitle = (action: string): string => {
    const map: Record<string, string> = {
      update_candidate_profile: "Updated candidate profile",
      create_candidate_profile: "Created candidate profile",
      resume_uploaded: "Uploaded resume",
      resume_replaced: "Replaced resume file",
      skills_updated: "Updated verified skills",
      education_experience_updated: "Updated education & experience",
      commission_agreement_signed: "Signed 10% placement agreement",
      candidate_suspended: "Candidate account suspended",
      candidate_unsuspended: "Candidate account reactivated",
      candidate_skills_verified: "Skills verified by platform admin",
      candidate_preferences_reset: "Algorithmic preferences reset",
      candidate_deleted: "Candidate account deleted",
      update_company_profile: "Updated company profile",
      create_company_profile: "Created company account",
      company_verified: "Granted verified employer badge",
      company_verification_removed: "Revoked verified employer badge",
      company_suspended: "Employer account suspended",
      company_unsuspended: "Employer account reactivated",
      email_integration_connected: "Connected company email integration",
      email_integration_disconnected: "Disconnected company email integration",
      job_created: "Created new job opening",
      job_updated: "Updated job posting",
      job_status_changed: "Changed job posting status",
      job_deleted: "Deleted job posting",
      application_submitted: "Applied to job",
      candidate_stage_changed: "Candidate stage changed",
      candidate_shortlisted: "Shortlisted candidate for review",
      candidate_rejected: "Candidate rejected",
      interview_scheduled: "Scheduled candidate interview",
      interview_rescheduled: "Rescheduled interview",
      interview_cancelled: "Cancelled interview",
      candidate_swipe_action: "Candidate swipe interaction",
      talent_bid_created: "Submitted reverse talent bid",
      talent_bid_updated: "Updated talent bid details",
      talent_bid_countered: "Countered talent bid terms",
      talent_bid_accepted: "Accepted talent offer",
      talent_bid_declined: "Declined talent offer",
      blind_profile_listed: "Listed on reverse talent marketplace",
      blind_profile_unlisted: "Unlisted from reverse marketplace",
      support_session_started: "Admin initiated support session",
      support_session_ended: "Support session concluded",
    };

    return map[action] || action.replace(/_/g, " ");
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-5 h-5 text-orange-400 animate-spin" />
        <span className="text-xs text-slate-400">Loading chronological activity from audit ledger...</span>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
        <Activity className="w-8 h-8 text-slate-600 mx-auto" />
        <p className="text-xs text-slate-400">No chronological audit records found for this entity yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Chronological Activity ({timeline.length} events)
        </span>
        <button
          onClick={fetchTimeline}
          className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="relative border-l-2 border-slate-800 ml-3 space-y-6 py-2">
        {timeline.map((event) => {
          const isSupport = event.metadata?.is_support_session || event.action.startsWith("support_session");
          const date = new Date(event.created_at);

          return (
            <div key={event.id} className="relative pl-6 group">
              {/* Dot icon */}
              <div
                className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border-2 bg-slate-950 flex items-center justify-center transition ${
                  isSupport
                    ? "border-amber-400 text-amber-400"
                    : "border-orange-500 text-orange-500"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isSupport ? "bg-amber-400" : "bg-orange-500"}`} />
              </div>

              {/* Event Content */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-1.5 hover:border-slate-700 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">
                      {formatActionTitle(event.action)}
                    </span>
                    {isSupport && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <ShieldAlert className="w-2.5 h-2.5" /> Support Mode
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">
                    {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} at {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <span>Actor:</span>
                  <span className="text-slate-300 font-semibold">{event.actor_email || event.actor_id}</span>
                  <span className="text-[10px] px-1 rounded bg-slate-900 text-slate-500 uppercase">
                    {event.actor_role}
                  </span>
                </div>

                {/* Sub-details from metadata */}
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div className="pt-1 text-[11px] text-slate-400 space-y-0.5">
                    {event.metadata.jobTitle && (
                      <div>Job: <span className="text-white">{event.metadata.jobTitle}</span></div>
                    )}
                    {event.metadata.previousStage && event.metadata.newStage && (
                      <div className="flex items-center gap-1 text-slate-300">
                        <span className="text-slate-500">{event.metadata.previousStage}</span>
                        <ArrowRight className="w-3 h-3 text-orange-400" />
                        <span className="text-orange-300 font-bold">{event.metadata.newStage}</span>
                      </div>
                    )}
                    {event.metadata.support_reason && (
                      <div className="italic text-amber-200/90">
                        "{event.metadata.support_reason}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
