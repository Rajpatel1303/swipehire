import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  isPositive?: boolean;
  isLoading?: boolean;
  colorVariant?: "blue" | "emerald" | "orange" | "purple" | "rose" | "amber";
}

const colorMap = {
  blue: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  rose: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  isPositive = true,
  isLoading = false,
  colorVariant = "blue",
}) => {
  const colors = colorMap[colorVariant] || colorMap.blue;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={`p-2 rounded-xl border ${colors.bg} ${colors.border} ${colors.text}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="h-8 w-24 bg-slate-800 rounded animate-pulse" />
        ) : (
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {value}
          </div>
        )}

        {(subtitle || trend) && (
          <div className="mt-1 flex items-center justify-between text-xs">
            {subtitle && <span className="text-slate-400 font-medium">{subtitle}</span>}
            {trend && (
              <span className={`font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                {trend}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
