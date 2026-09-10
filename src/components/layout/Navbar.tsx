import React, { useState, useRef, useEffect } from "react";
import {
  Compass,
  Briefcase,
  Layers,
  User,
  Building2,
  Bell,
  Sparkles,
  Shield,
  LogOut,
  ChevronDown,
  Mail,
  Calendar,
  Send,
  PlusCircle,
  Menu,
  X,
  UserCheck,
  Scale,
  Database as DatabaseIcon,
  RefreshCw,
} from "lucide-react";
import { useApp, ActiveView } from "../../context/AppContext";

export const Navbar: React.FC = () => {
  const {
    authUser,
    isSupabaseConnected,
    isSupabaseSyncing,
    refreshFromSupabase,
    role,
    activeView,
    setActiveView,
    candidate,
    company,
    notifications,
    applications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadCount,
    logout,
    openAddJobModal,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = () => {
    if (role === "candidate") {
      return [
        { id: "candidate-radar", label: "Career Radar", icon: Compass, badge: "AI" },
        { id: "blind-marketplace", label: "Blind Marketplace", icon: Sparkles, badge: "72h Bid" },
        { id: "candidate-jobs", label: "Browse Jobs", icon: Briefcase },
        { id: "candidate-applications", label: "My Applications", icon: Layers },
        { id: "candidate-profile", label: "My Profile", icon: User },
      ];
    }
    if (role === "company") {
      return [
        { id: "company-cockpit", label: "Hiring Radar", icon: Compass, badge: "Live" },
        { id: "company-applications", label: "Applications", icon: UserCheck, badge: `${applications.length}` },
        { id: "blind-marketplace", label: "Blind Marketplace", icon: Sparkles, badge: "Upfront CTC" },
        { id: "company-jobs", label: "Manage Jobs", icon: Briefcase },
        { id: "company-pipeline", label: "Pipeline", icon: Layers },
        { id: "company-compare", label: "Compare Arena", icon: Scale, badge: "AI" },
        { id: "company-interviews", label: "Interviews", icon: Calendar },
        { id: "company-email-connect", label: "Email & WhatsApp", icon: Mail },
      ];
    }
    if (role === "admin") {
      return [
        { id: "admin-overview", label: "Overview", icon: Layers },
        { id: "blind-marketplace", label: "Talent Arena", icon: Sparkles },
        { id: "admin-users", label: "Candidates", icon: User },
        { id: "admin-companies", label: "Companies", icon: Building2 },
        { id: "admin-jobs", label: "Moderation", icon: Shield },
      ];
    }
    return [];
  };

  return (
    <header className="no-print print:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      {/* Row 1: Primary Header Bar (Brand Identity & Global Actions) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          {/* Left: Brand Logo & Role Tag */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5 text-left group shrink-0">
              <button
                id="nav-logo-btn"
                onClick={() => {
                  if (authUser && role === "candidate") setActiveView("candidate-radar");
                  else if (authUser && role === "company") setActiveView("company-cockpit");
                  else if (authUser && role === "admin") setActiveView("admin-overview");
                  else setActiveView("landing");
                }}
                className="flex items-center gap-2.5 cursor-pointer focus:outline-none"
              >
                <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 shrink-0">
                  <span className="text-white font-black text-xl leading-none">S</span>
                </div>
                <span className="text-xl sm:text-2xl font-black tracking-tighter text-slate-900 uppercase italic whitespace-nowrap">
                  Swipe<span className="text-orange-500">Hired</span>
                </span>
              </button>

              {authUser && role && (
                <span className="px-2 py-0.5 text-[9px] font-black bg-slate-100 text-slate-700 rounded-full uppercase tracking-widest border border-slate-200 shrink-0">
                  {role === "candidate" ? "Candidate" : role === "company" ? "Recruiter" : "Admin"}
                </span>
              )}
              {/* Supabase Live DB Badge */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  refreshFromSupabase();
                }}
                title="Supabase PostgreSQL Database Status (Click to sync)"
                className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors cursor-pointer ${
                  isSupabaseConnected
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <DatabaseIcon className="w-2.5 h-2.5" />
                <span>{isSupabaseSyncing ? "Syncing..." : isSupabaseConnected ? "Supabase Live" : "Local Sync"}</span>
                {isSupabaseSyncing && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
              </button>
            </div>
          </div>

          {/* Right: Controls & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Post Job shortcut for recruiter */}
            {authUser && role === "company" && (
              <button
                id="nav-quick-add-job"
                onClick={openAddJobModal}
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider shadow-xs hover:shadow-sm transition-all cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4 text-emerald-100" />
                <span>Post Job</span>
              </button>
            )}

            {/* Notifications Dropdown */}
            {authUser && role && (
              <div className="relative shrink-0" ref={notificationsRef}>
                <button
                  id="notifications-toggle"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 sm:p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200/80 hover:border-slate-300 focus:outline-none flex items-center justify-center min-w-[38px] min-h-[38px]"
                  aria-label="Notifications"
                >
                  <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white shadow-xs animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto right-0 sm:right-0 top-18 sm:top-auto sm:mt-2 w-auto sm:w-96 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-slate-200 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer transition-colors"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.slice(0, 6).map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              markNotificationAsRead(notif.id);
                              if (notif.linkAction) {
                                if (role === "candidate") {
                                  if (notif.linkAction === "applications") setActiveView("candidate-applications");
                                  if (notif.linkAction === "radar") setActiveView("candidate-radar");
                                } else if (role === "company") {
                                  if (notif.linkAction === "candidates") setActiveView("company-pipeline");
                                  if (notif.linkAction === "interviews") setActiveView("company-interviews");
                                  if (notif.linkAction === "jobs") setActiveView("company-jobs");
                                }
                              }
                              setShowNotifications(false);
                            }}
                            className={`p-3.5 text-left hover:bg-slate-50 cursor-pointer transition-colors ${
                              !notif.read ? "bg-orange-50/30" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-bold text-slate-800">{notif.title}</p>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1"></span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1.5 block font-medium">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Avatar / Auth Buttons */}
            {authUser && role ? (
              <div className="relative shrink-0" ref={profileRef}>
                <button
                  id="profile-menu-toggle"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 text-left bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer focus:outline-none"
                >
                  <img
                    src={
                      role === "candidate"
                        ? candidate.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                        : role === "company"
                        ? company.logo || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"
                        : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    }
                    alt="avatar"
                    className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <span className="hidden sm:inline-block text-xs font-bold text-slate-800 truncate max-w-[100px] lg:max-w-[130px]">
                    {role === "candidate" ? candidate.fullName.split(" ")[0] : role === "company" ? company.companyName : "Admin"}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showProfileMenu ? "rotate-180" : ""}`} />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-black text-slate-900">
                        {role === "candidate"
                          ? candidate.fullName || authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || "Candidate"
                          : role === "company"
                          ? company.companyName || authUser?.user_metadata?.company_name || authUser?.user_metadata?.name || "Company Workspace"
                          : "Platform Admin"}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate font-medium mt-0.5">
                        {authUser?.email || (role === "candidate" ? candidate.email : role === "company" ? company.email : "admin@swipehired.io")}
                      </p>
                    </div>

                    <div className="py-1">
                      {role === "candidate" && (
                        <button
                          onClick={() => {
                            setActiveView("candidate-profile");
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-semibold transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>Edit Candidate Profile</span>
                        </button>
                      )}

                      {role === "company" && (
                        <button
                          onClick={() => {
                            setActiveView("company-onboarding");
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-semibold transition-colors"
                        >
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span>Company Profile Settings</span>
                        </button>
                      )}

                      <div className="border-t border-slate-100 my-1"></div>
                      <button
                        id="logout-btn"
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer font-bold transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  id="landing-nav-login-btn"
                  onClick={() => setActiveView("auth-select")}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 sm:px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs focus:outline-none shrink-0"
                >
                  Log In
                </button>
                <button
                  id="landing-nav-signup-btn"
                  onClick={() => setActiveView("auth-select")}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm shadow-orange-500/20 hover:shadow-orange-500/30 transition-all cursor-pointer focus:outline-none shrink-0"
                >
                  Sign Up
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Row 2: Universal Sub-Navigation Bar (Horizontal pill tabs for all viewports) */}
      {authUser && role && (
        <div className="border-t border-slate-200/80 bg-slate-50/95 px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <nav className="flex items-center gap-2 min-w-max">
              {navItems().map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`subnav-tab-${item.id}`}
                    onClick={() => setActiveView(item.id as ActiveView)}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer shrink-0 focus:outline-none ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs font-black"
                        : "text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200/90"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-orange-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest ${
                          isActive ? "bg-orange-500 text-white" : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Mobile quick action for recruiter */}
            {role === "company" && (
              <button
                onClick={openAddJobModal}
                className="sm:hidden flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-wider shrink-0 transition-colors shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Job</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

