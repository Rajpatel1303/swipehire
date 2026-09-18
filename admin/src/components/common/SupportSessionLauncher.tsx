import React, { useState, useEffect } from "react";
import { ShieldAlert, ExternalLink, Clock, AlertTriangle, CheckCircle, RefreshCw, KeyRound } from "lucide-react";
import { AdminApi } from "../../services/adminApi";

interface SupportSessionLauncherProps {
  targetUserId: string;
  targetRole: "candidate" | "company";
  targetEntityId: string;
  targetName: string;
}

export const SupportSessionLauncher: React.FC<SupportSessionLauncherProps> = ({
  targetUserId,
  targetRole,
  targetEntityId,
  targetName,
}) => {
  const [reason, setReason] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [activeSessionUrl, setActiveSessionUrl] = useState<string | null>(null);
  const [sessionsHistory, setSessionsHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await AdminApi.getSupportSessions(targetUserId);
      setSessionsHistory(history);
    } catch (err) {
      console.warn("[SupportSessionLauncher] Could not fetch sessions history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [targetUserId]);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg("A ticket reference or reason is strictly required to initiate support mode.");
      return;
    }

    setErrorMsg(null);
    setIsStarting(true);
    try {
      const res = await AdminApi.startSupportSession({
        targetUserId,
        targetRole,
        targetEntityId,
        targetName,
        reason: reason.trim(),
      });

      if (res.success && res.redirectUrl) {
        setActiveSessionUrl(res.redirectUrl);
        setReason("");
        await fetchHistory();
        // Launch main app in new tab
        window.open(res.redirectUrl, "_blank");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start support session.");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="space-y-6 text-xs text-slate-300">
      {/* Informative Security Warning Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <span>Zero-Password Support Mode Authorization</span>
        </div>
        <p className="leading-relaxed text-amber-200/90 text-xs">
          You are about to enter Support Mode for <strong className="text-white underline">{targetName}</strong> ({targetRole}).
          This creates a time-limited (60-minute), cryptographically authenticated session.
        </p>
        <div className="p-3 bg-black/40 rounded-xl border border-amber-500/20 font-mono text-[11px] text-amber-100 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" /> Mandatory Audit Policy:
          </div>
          <div>• All mutations performed during this session are permanently linked to your admin account.</div>
          <div>• The user's password is never displayed, retrieved, stored, or copied.</div>
          <div>• Strict multi-tenant isolation is enforced. Tenant data cannot be crossed.</div>
        </div>
      </div>

      {/* Start Session Form */}
      <form onSubmit={handleStartSession} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h4 className="font-black text-white text-xs uppercase tracking-wider flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-orange-400" />
          Initiate Temporary Support Session
        </h4>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Ticket Reference / Reason <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Support ticket #892 - Reproducing profile save issue"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Session duration: 60 minutes
          </span>
          <button
            type="submit"
            disabled={isStarting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition active:scale-95 cursor-pointer"
          >
            {isStarting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Session...</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Launch Support Session</span>
              </>
            )}
          </button>
        </div>

        {activeSessionUrl && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between gap-3 animate-in fade-in">
            <span className="text-xs font-semibold">Active session launched in new browser tab.</span>
            <a
              href={activeSessionUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold underline flex items-center gap-1 hover:text-white"
            >
              Open Window <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </form>

      {/* Historical Support Sessions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">
            Prior Support Sessions ({sessionsHistory.length})
          </span>
          <button
            onClick={fetchHistory}
            className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {sessionsHistory.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-center text-slate-500 text-xs">
            No support sessions recorded for this user yet.
          </div>
        ) : (
          <div className="space-y-2">
            {sessionsHistory.map((sess) => (
              <div
                key={sess.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span>Admin: {sess.admin_email}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        sess.status === "active"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {sess.status}
                    </span>
                  </div>
                  <div className="italic text-slate-400 text-[11px] mt-0.5">"{sess.reason}"</div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 sm:text-right">
                  <div>Started: {new Date(sess.created_at).toLocaleString()}</div>
                  {sess.ended_at && <div>Ended: {new Date(sess.ended_at).toLocaleTimeString()}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
