import React from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  History,
  LogOut,
  ShieldCheck,
  X,
  FileText,
  Calendar,
  AlertTriangle,
  Bot,
  AlertOctagon,
  Mail,
  MessageSquare,
  FileCode,
  Sparkles,
  Key,
} from "lucide-react";
import { useAdmin } from "../../app/AdminContext";
import { AdminView } from "../../types";

interface AdminSidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavSection {
  title: string;
  items: {
    id: AdminView;
    label: string;
    icon: React.FC<{ className?: string }>;
    permission?: string;
  }[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
}) => {
  const { activeView, setActiveView, currentAdmin, adminUser, signOut, hasPermission } = useAdmin();

  const sections: NavSection[] = [
    {
      title: "Platform Core",
      items: [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "candidates", label: "Candidates", icon: Users, permission: "candidates.view" },
        { id: "companies", label: "Companies", icon: Building2, permission: "companies.view" },
        { id: "jobs", label: "Job Moderation", icon: Briefcase, permission: "jobs.view" },
        { id: "applications", label: "Applications", icon: FileText, permission: "applications.view" },
        { id: "interviews", label: "Interviews", icon: Calendar, permission: "interviews.view" },
        { id: "reports", label: "Reports & Safety", icon: AlertTriangle, permission: "reports.view" },
      ],
    },
    {
      title: "Advanced Operations",
      items: [
        { id: "ai-operations", label: "AI Operations", icon: Bot, permission: "ai.view" },
        { id: "system-errors", label: "System Errors", icon: AlertOctagon, permission: "errors.view" },
        { id: "marketplace", label: "Reverse Marketplace", icon: Sparkles, permission: "marketplace.view" },
      ],
    },
    {
      title: "Communications",
      items: [
        { id: "email-operations", label: "Email Operations", icon: Mail, permission: "comms.view" },
        { id: "whatsapp-operations", label: "WhatsApp Logs", icon: MessageSquare, permission: "comms.view" },
        { id: "templates", label: "Templates", icon: FileCode, permission: "comms.view" },
      ],
    },
    {
      title: "Governance & Security",
      items: [
        { id: "rbac", label: "Team & RBAC", icon: Key, permission: "rbac.manage" },
        { id: "audit-logs", label: "Audit Logs", icon: History, permission: "audit.view" },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
              <span className="text-white font-black text-lg leading-none">S</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-white uppercase italic">
                  Swipe<span className="text-orange-400">Hired</span>
                </span>
                <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded text-[9px] font-black uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                Operations Console
              </p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {sections.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.permission || hasPermission(item.permission)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  {section.title}
                </div>

                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-orange-500 text-white shadow-md shadow-orange-500/20 font-black"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Admin Footer & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="overflow-hidden min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {currentAdmin?.fullName || adminUser?.fullName || "Platform Admin"}
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                {currentAdmin?.role ? `${currentAdmin.role.toUpperCase()} • ` : ""}
                {currentAdmin?.email || adminUser?.email || "admin@swipehired.com"}
              </div>
            </div>
          </div>

          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
