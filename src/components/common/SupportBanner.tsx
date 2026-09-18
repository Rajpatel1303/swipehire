import React, { useState, useEffect } from "react";
import { AlertTriangle, ShieldAlert, LogOut, Clock } from "lucide-react";
import { SupportSessionData } from "../../utils/supportSession";

interface SupportBannerProps {
  session: SupportSessionData;
  onExit: () => void;
}

export const SupportBanner: React.FC<SupportBannerProps> = ({ session, onExit }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const updateCountdown = () => {
      const expiresAtMs = new Date(session.expiresAt).getTime();
      const nowMs = Date.now();
      const diffMs = expiresAtMs - nowMs;

      if (diffMs <= 0) {
        setTimeLeft("00:00");
        setIsExpired(true);
        // Automatically trigger exit when session expires
        setTimeout(() => {
          onExit();
        }, 1500);
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setTimeLeft(
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [session.expiresAt, onExit]);

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white shadow-xl border-b-2 border-amber-300/40 px-4 py-2.5 transition-all animate-in slide-in-from-top duration-300"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-medium">
        {/* Left: Mode Title & Warning Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-black/20 text-amber-200 border border-amber-300/30 flex items-center justify-center animate-pulse">
            <ShieldAlert className="w-4 h-4 text-amber-200" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black uppercase tracking-wider text-amber-100 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
              SUPPORT MODE ACTIVE
            </span>
            <span className="hidden sm:inline text-amber-200/60">|</span>
            <span className="text-white">
              Viewing as:{" "}
              <strong className="font-bold underline decoration-amber-300/60">
                {session.targetName}
              </strong>{" "}
              <span className="text-amber-200 capitalize font-mono text-[11px] bg-black/25 px-1.5 py-0.5 rounded">
                ({session.targetRole})
              </span>
            </span>
          </div>
        </div>

        {/* Center: Admin info & Reason */}
        <div className="hidden lg:flex items-center gap-3 text-amber-100 text-xs">
          <span>
            Admin: <strong className="font-mono text-white">{session.adminEmail}</strong>
          </span>
          <span className="text-amber-200/60">•</span>
          <span className="truncate max-w-xs" title={session.reason}>
            Reason: <span className="italic text-white">"{session.reason}"</span>
          </span>
        </div>

        {/* Right: Countdown & Exit Action */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div
            className={`flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-md bg-black/30 border ${
              isExpired
                ? "border-red-400 text-red-200 animate-bounce"
                : "border-amber-300/30 text-amber-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isExpired ? "Session Expired" : `Expires in ${timeLeft}`}</span>
          </div>

          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white font-bold text-xs uppercase tracking-wider border border-white/20 hover:border-white/40 shadow-sm transition active:scale-95 cursor-pointer"
            title="End this support session and return to admin portal"
          >
            <LogOut className="w-3.5 h-3.5 text-amber-300" />
            <span>Exit Support Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
};
