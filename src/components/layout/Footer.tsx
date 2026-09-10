import React from "react";
import { Sparkles, ShieldCheck, Zap } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="no-print print:hidden border-t border-slate-100 bg-slate-50 text-slate-900 font-sans">
      {/* Bold Platform Telemetry Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-200/80 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-wrap items-center gap-8 sm:gap-12">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-tighter">Active Candidates</p>
            <p className="text-xl font-black tracking-tight">24.8K</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-tighter">Open Opportunities</p>
            <p className="text-xl font-black tracking-tight">1,420</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-tighter">Successful Matches</p>
            <p className="text-xl font-black text-emerald-500 tracking-tight">89%</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-tighter">Avg. Response Time</p>
            <p className="text-xl font-black text-orange-500 tracking-tight">&lt; 24 hrs</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Platform Status: Optimized</p>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                <span className="font-black text-sm">S</span>
              </div>
              <span className="text-lg font-black tracking-tighter uppercase italic text-slate-900">
                Swipe<span className="text-orange-500">Hired</span>
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              The intelligence-driven discovery platform for modern top talent and forward-thinking companies.
            </p>
          </div>

          <div>
            <h4 className="text-slate-900 font-black text-xs uppercase tracking-widest mb-3">For Candidates</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-600">
              <li><span className="hover:text-orange-500 transition-colors cursor-pointer">Career Radar Deck</span></li>
              <li><span className="hover:text-orange-500 transition-colors cursor-pointer">AI Resume Extraction</span></li>
              <li><span className="hover:text-orange-500 transition-colors cursor-pointer">Interactive Swipe Matching</span></li>
              <li><span className="hover:text-orange-500 transition-colors cursor-pointer">Visual Application Journey</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 font-black text-xs uppercase tracking-widest mb-3">For Hiring Teams</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-600">
              <li><span className="hover:text-sky-600 transition-colors cursor-pointer">Intelligent Hiring Radar</span></li>
              <li><span className="hover:text-sky-600 transition-colors cursor-pointer">✦ AI Job Spec Builder</span></li>
              <li><span className="hover:text-sky-600 transition-colors cursor-pointer">Talent Match Scoring</span></li>
              <li><span className="hover:text-sky-600 transition-colors cursor-pointer">Direct Gmail & WhatsApp</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 font-black text-xs uppercase tracking-widest mb-3">Platform Guarantee</h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Zero Fake Platform Listings</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <Zap className="w-4 h-4 text-orange-500" />
                <span>Sub-second Vector Recommendations</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Bold Typography Design System: Orange, Emerald & Sky Accents.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs font-medium">
          <p>© 2026 SwipeHired. Built with Google AI Studio.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-700 cursor-pointer uppercase tracking-wider text-[11px] font-bold">Privacy Policy</span>
            <span className="hover:text-slate-700 cursor-pointer uppercase tracking-wider text-[11px] font-bold">Terms of Service</span>
            <span className="hover:text-slate-700 cursor-pointer uppercase tracking-wider text-[11px] font-bold">AI Ethical Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

