import React, { useState, useEffect } from "react";
import {
  Clock,
  Flame,
  CheckCircle2,
  Lock,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface FastActionCountdownBadgeProps {
  appliedAt: string;
  deadline?: string;
  status: string;
  compact?: boolean;
  variant?: "badge" | "card-timer" | "digital-clock" | "bar" | "banner";
  showSeconds?: boolean;
  candidateName?: string;
  onAutoExpire?: () => void;
  onAdvanceToScreening?: () => void;
  onShortlist?: () => void;
  onReject?: () => void;
}

export const FastActionCountdownBadge: React.FC<FastActionCountdownBadgeProps> = ({
  appliedAt,
  deadline,
  status,
  compact = false,
  variant = "badge",
  candidateName,
  onAutoExpire,
  onAdvanceToScreening,
  onShortlist,
  onReject,
}) => {
  const isExplicitlyExpired = status === "expired";
  const isActionTaken = status !== "applied" && !isExplicitlyExpired;

  // Calculate target deadline: precisely 72 hours from appliedAt timestamp or explicit deadline
  const appliedTimestamp = new Date(appliedAt).getTime();
  const targetTime = deadline
    ? new Date(deadline).getTime()
    : appliedTimestamp + 72 * 3600 * 1000;

  const totalDurationMs = 72 * 3600 * 1000;

  const [timeLeftMs, setTimeLeftMs] = useState<number>(() => {
    if (isExplicitlyExpired) return 0;
    return Math.max(0, targetTime - Date.now());
  });

  useEffect(() => {
    if (isActionTaken || isExplicitlyExpired) return;

    // Real-time ticking every single second
    const interval = setInterval(() => {
      const remaining = targetTime - Date.now();
      if (remaining <= 0) {
        setTimeLeftMs(0);
        clearInterval(interval);
        if (onAutoExpire) onAutoExpire();
      } else {
        setTimeLeftMs(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, isActionTaken, isExplicitlyExpired, onAutoExpire]);

  // Format hours, minutes, seconds
  const totalSeconds = Math.floor(timeLeftMs / 1000);
  const hoursLeft = Math.floor(totalSeconds / 3600);
  const minutesLeft = Math.floor((totalSeconds % 3600) / 60);
  const secondsLeft = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  const percentageRemaining = Math.max(0, Math.min(100, (timeLeftMs / totalDurationMs) * 100));
  const isUnder24Hours = hoursLeft < 24 && timeLeftMs > 0 && !isActionTaken && !isExplicitlyExpired;
  const isUnder48Hours = hoursLeft < 48 && !isUnder24Hours && timeLeftMs > 0 && !isActionTaken && !isExplicitlyExpired;

  const formattedAppliedDate = new Date(appliedTimestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedDeadlineDate = new Date(targetTime).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 1. EXPIRED STATE
  if (isExplicitlyExpired || (timeLeftMs <= 0 && !isActionTaken)) {
    if (compact) {
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider border border-rose-300 shadow-2xs"
          title="72-Hour review deadline exceeded. Candidate profile locked."
        >
          <Lock className="w-3 h-3 text-rose-600 shrink-0" />
          <span>72h Expired · Locked</span>
        </span>
      );
    }

    return (
      <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 sm:p-4 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-950">
                72h SLA Expired
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white uppercase">
                Auto-Withdrawn
              </span>
            </div>
            <p className="text-[11px] text-rose-700 font-medium">
              Action window elapsed on {formattedDeadlineDate}. Candidate details are protected and locked.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 font-mono text-xs font-black bg-rose-200/80 text-rose-950 px-2.5 py-1 rounded-xl border border-rose-300 shrink-0">
          <span>00h</span>:<span>00m</span>:<span>00s</span>
        </div>
      </div>
    );
  }

  // 2. ACTION TAKEN / SLA FULFILLED
  if (isActionTaken) {
    if (compact) {
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200"
          title="Action was taken within the 72-hour window."
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>SLA Met</span>
        </span>
      );
    }

    return (
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs">
        <div className="flex items-center gap-1.5 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>72h Anti-Ghosting SLA Fulfilled</span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md">
          Action Taken
        </span>
      </div>
    );
  }

  // 3. DEDICATED INDIVIDUAL CARD TIMER (High-Visibility Box For Candidate Cards)
  if (variant === "card-timer") {
    return (
      <div
        className={`rounded-2xl border transition-all p-3 sm:p-3.5 space-y-2.5 ${
          isUnder24Hours
            ? "bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 border-rose-500/80 text-white shadow-md shadow-rose-950/20"
            : isUnder48Hours
            ? "bg-slate-900 border-amber-500/60 text-white shadow-sm"
            : "bg-slate-900 border-slate-700/80 text-white shadow-sm"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Urgency Badge & Info */}
          <div className="flex items-center gap-2.5">
            {isUnder24Hours ? (
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 animate-bounce">
                <Flame className="w-4 h-4 fill-white" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                  {isUnder24Hours ? "🔥 Urgent Action SLA" : "⏳ 72-Hour Response SLA"}
                </span>
                <span className="text-[9px] font-bold text-slate-400">
                  Applied: <span className="text-slate-200">{formattedAppliedDate}</span>
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-300">
                Take review action before <strong className="text-emerald-300 font-bold">{formattedDeadlineDate}</strong> to prevent auto-lockout.
              </p>
            </div>
          </div>

          {/* Real-time Ticking Countdown Digits */}
          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 shadow-inner">
            <div className="flex items-center gap-1">
              <span className="font-mono text-sm sm:text-base font-black text-white">
                {pad(hoursLeft)}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">h</span>
            </div>
            <span className="font-mono text-xs text-white/40 font-bold">:</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-sm sm:text-base font-black text-white">
                {pad(minutesLeft)}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">m</span>
            </div>
            <span className="font-mono text-xs text-white/40 font-bold">:</span>
            <div className="flex items-center gap-1">
              <span
                className={`font-mono text-sm sm:text-base font-black ${
                  isUnder24Hours ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {pad(secondsLeft)}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">s</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 ml-1">Left</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                isUnder24Hours
                  ? "bg-gradient-to-r from-amber-500 to-rose-500 animate-pulse"
                  : isUnder48Hours
                  ? "bg-amber-400"
                  : "bg-emerald-400"
              }`}
              style={{ width: `${percentageRemaining}%` }}
            />
          </div>
        </div>

        {/* Optional Quick SLA Action Buttons on Card */}
        {(onAdvanceToScreening || onShortlist || onReject) && (
          <div className="pt-1.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-slate-400">
              Quick 1-Click Action:
            </span>
            <div className="flex items-center gap-1.5">
              {onAdvanceToScreening && (
                <button
                  onClick={onAdvanceToScreening}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Screen
                </button>
              )}
              {onShortlist && (
                <button
                  onClick={onShortlist}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Shortlist
                </button>
              )}
              {onReject && (
                <button
                  onClick={onReject}
                  className="px-2.5 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Reject
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. COMPACT BADGE (Live Ticking with seconds)
  if (compact) {
    if (isUnder24Hours) {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm animate-pulse"
          title={`Critical SLA: Action required by ${formattedDeadlineDate}`}
        >
          <Flame className="w-3 h-3 text-yellow-200 fill-yellow-200 shrink-0" />
          <span className="font-mono">
            {pad(hoursLeft)}h {pad(minutesLeft)}m {pad(secondsLeft)}s Left
          </span>
        </span>
      );
    }

    if (isUnder48Hours) {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs"
          title={`Action required by ${formattedDeadlineDate}`}
        >
          <Clock className="w-3 h-3 text-amber-100 shrink-0" />
          <span className="font-mono">
            {pad(hoursLeft)}h {pad(minutesLeft)}m {pad(secondsLeft)}s Left
          </span>
        </span>
      );
    }

    // Normal > 48h
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-emerald-400 text-[10px] font-black uppercase tracking-wider shadow-2xs border border-slate-800"
        title={`Guaranteed 72h SLA Deadline: ${formattedDeadlineDate}`}
      >
        <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
        <span className="font-mono">
          {pad(hoursLeft)}h {pad(minutesLeft)}m {pad(secondsLeft)}s Left
        </span>
      </span>
    );
  }

  // 5. BAR VARIANT
  if (variant === "bar") {
    return (
      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            {isUnder24Hours ? (
              <Flame className="w-4 h-4 text-rose-600 animate-bounce" />
            ) : (
              <Clock className="w-4 h-4 text-sky-600" />
            )}
            <span className={isUnder24Hours ? "text-rose-700 font-black" : "text-slate-700"}>
              Time Left to Action:
            </span>
          </div>
          <div
            className={`font-mono text-xs font-black px-2 py-0.5 rounded-md ${
              isUnder24Hours
                ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                : "bg-slate-900 text-emerald-400"
            }`}
          >
            {pad(hoursLeft)}h {pad(minutesLeft)}m {pad(secondsLeft)}s
          </div>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
          <div
            className={`h-full transition-all duration-1000 ${
              isUnder24Hours
                ? "bg-gradient-to-r from-amber-500 to-rose-600 animate-pulse"
                : isUnder48Hours
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${percentageRemaining}%` }}
          />
        </div>
      </div>
    );
  }

  // 6. DEFAULT STANDARD BADGE
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-emerald-400 rounded-full text-[11px] font-black uppercase tracking-wider shadow-xs border border-slate-800">
      <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
      <span>
        Action Window:{" "}
        <strong className="font-mono tracking-tight text-white">
          {pad(hoursLeft)}h {pad(minutesLeft)}m {pad(secondsLeft)}s
        </strong>
      </span>
    </div>
  );
};
