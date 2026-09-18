import React from "react";

export interface StatusBadgeProps {
  status?: string;
  label?: string;
  variant?: "success" | "danger" | "warning" | "info" | "neutral";
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status = "",
  label,
  variant,
  size = "sm",
}) => {
  const normalized = (status || label || "").toLowerCase();

  const getStyle = () => {
    if (variant) {
      switch (variant) {
        case "success":
          return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        case "danger":
          return "bg-rose-500/10 text-rose-400 border-rose-500/20";
        case "warning":
          return "bg-amber-500/10 text-amber-400 border-amber-500/20";
        case "info":
          return "bg-sky-500/10 text-sky-400 border-sky-500/20";
        case "neutral":
        default:
          return "bg-slate-800 text-slate-300 border-slate-700";
      }
    }

    switch (normalized) {
      case "active":
      case "verified":
      case "approved":
      case "hired":
      case "accepted":
      case "signed":
      case "resolved":
      case "success":
      case "delivered":
      case "sent":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "pending":
      case "draft":
      case "review":
      case "screening":
      case "interview":
      case "investigating":
      case "high":
      case "retried":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "suspended":
      case "rejected":
      case "closed":
      case "blocked":
      case "failed":
      case "critical":
      case "open":
      case "error":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "paused":
      case "medium":
      case "countered":
      case "company_countered":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const sizeCls = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-md border ${sizeCls} ${getStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{label || status || "UNKNOWN"}</span>
    </span>
  );
};
