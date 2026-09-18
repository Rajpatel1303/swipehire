/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { SupportBanner } from "./components/common/SupportBanner";

// Landing & Auth
import { LandingPage } from "./components/landing/LandingPage";
import { AuthSelectModal } from "./components/auth/AuthSelectModal";
import { CandidateAuth } from "./components/auth/CandidateAuth";
import { CompanyAuth } from "./components/auth/CompanyAuth";

// Candidate Views
import { CandidateOnboarding } from "./components/candidate/CandidateOnboarding";
import { CandidateProfileReview } from "./components/candidate/CandidateProfileReview";
import { CandidateAgreementPage } from "./components/candidate/CandidateAgreementPage";
import { CareerRadarDashboard } from "./components/candidate/CareerRadarDashboard";
import { CandidateJobsPage } from "./components/candidate/CandidateJobsPage";
import { CandidateApplicationsPage } from "./components/candidate/CandidateApplicationsPage";
import { CandidateProfilePage } from "./components/candidate/CandidateProfilePage";

// Company Views
import { CompanyOnboarding } from "./components/company/CompanyOnboarding";
import { CompanyCockpitDashboard } from "./components/company/CompanyCockpitDashboard";
import { CompanyApplicationsPage } from "./components/company/CompanyApplicationsPage";
import { CompanyJobsPage } from "./components/company/CompanyJobsPage";
import { CompanyPipelineKanban } from "./components/company/CompanyPipelineKanban";
import { CompanyEmailConnectPage } from "./components/company/CompanyEmailConnectPage";
import { CompanyInterviewsPage } from "./components/company/CompanyInterviewsPage";
import { CompanyComparisonPage } from "./components/company/CompanyComparisonPage";
import { CompanyAddJobModal } from "./components/company/CompanyAddJobModal";

// Reverse Hiring Marketplace (Blind Talent Bidding)
import { ReverseMarketplacePage } from "./components/marketplace/ReverseMarketplacePage";

const MainContent: React.FC = () => {
  const {
    authUser,
    activeView,
    role,
    authStatus,
    isAuthLoading,
    candidate,
    company,
    isAddJobModalOpen,
    setIsAddJobModalOpen,
    supportSession,
    exitSupportMode,
  } = useApp();

  // 1. Loading Screen Gate: Never flash dashboard or wrong role while session is hydrating
  if (isAuthLoading && !supportSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
        <div className="flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25 animate-pulse">
            <span className="text-white font-black text-3xl leading-none">S</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
              Swipe<span className="text-orange-500">Hired</span>
            </span>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              <span>Authenticating Workspace...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderCurrentView = () => {
    // 2. Unauthenticated Guard: Protected views require an active authenticated session unless in Support Mode
    if ((!role || authStatus === "UNAUTHENTICATED") && !supportSession) {
      const publicViews = [
        "landing",
        "auth-select",
        "candidate-login",
        "candidate-signup",
        "company-login",
        "company-signup",
      ];
      if (!publicViews.includes(activeView)) {
        return <LandingPage />;
      }
    }

    // 3. Strict Company Guard: Company users should never see candidate views
    if ((authUser || supportSession) && role === "company") {
      if (
        activeView === "candidate-onboarding" ||
        activeView === "candidate-review" ||
        activeView === "candidate-agreement" ||
        activeView === "candidate-radar" ||
        activeView === "candidate-jobs" ||
        activeView === "candidate-applications" ||
        activeView === "candidate-profile" ||
        activeView === "candidate-login" ||
        activeView === "candidate-signup"
      ) {
        return company.isCompleted ? <CompanyCockpitDashboard /> : <CompanyOnboarding />;
      }
    }

    // 4. Strict Candidate Guard: Candidate users should never see company views
    if ((authUser || supportSession) && role === "candidate") {
      if (
        activeView === "company-onboarding" ||
        activeView === "company-cockpit" ||
        activeView === "company-applications" ||
        activeView === "company-jobs" ||
        activeView === "company-add-job" ||
        activeView === "company-pipeline" ||
        activeView === "company-email-connect" ||
        activeView === "company-interviews" ||
        activeView === "company-compare" ||
        activeView === "company-login" ||
        activeView === "company-signup"
      ) {
        if (!candidate.isCompleted) return <CandidateOnboarding />;
        if (!candidate.commissionAgreementSigned && !supportSession) return <CandidateAgreementPage />;
        return <CareerRadarDashboard />;
      }

      // Mandatory gate for candidate dashboard views: must sign 10% commission agreement (bypassed for support review if admin)
      if (
        !supportSession &&
        !candidate.commissionAgreementSigned &&
        (activeView === "candidate-radar" ||
          activeView === "candidate-jobs" ||
          activeView === "candidate-applications" ||
          activeView === "candidate-profile" ||
          activeView === "blind-marketplace")
      ) {
        return candidate.isCompleted ? <CandidateAgreementPage /> : <CandidateOnboarding />;
      }
    }

    switch (activeView) {
      case "landing":
        return <LandingPage />;

      // Auth Views
      case "auth-select":
        return <AuthSelectModal />;
      case "candidate-login":
        return <CandidateAuth isSignup={false} />;
      case "candidate-signup":
        return <CandidateAuth isSignup={true} />;
      case "company-login":
        return <CompanyAuth isSignup={false} />;
      case "company-signup":
        return <CompanyAuth isSignup={true} />;

      // Candidate Experience
      case "candidate-onboarding":
        return <CandidateOnboarding />;
      case "candidate-review":
        return <CandidateProfileReview />;
      case "candidate-agreement":
        return <CandidateAgreementPage />;
      case "candidate-radar":
        return <CareerRadarDashboard />;
      case "candidate-jobs":
        return <CandidateJobsPage />;
      case "candidate-applications":
        return <CandidateApplicationsPage />;
      case "candidate-profile":
        return <CandidateProfilePage />;

      // Company Experience
      case "company-onboarding":
        return <CompanyOnboarding />;
      case "company-cockpit":
        return <CompanyCockpitDashboard />;
      case "company-applications":
        return <CompanyApplicationsPage />;
      case "company-jobs":
      case "company-add-job":
        return <CompanyJobsPage />;
      case "company-pipeline":
        return <CompanyPipelineKanban />;
      case "company-email-connect":
        return <CompanyEmailConnectPage />;
      case "company-interviews":
        return <CompanyInterviewsPage />;
      case "company-compare":
        return <CompanyComparisonPage />;

      // Reverse Hiring Marketplace (Blind Talent Bidding)
      case "blind-marketplace":
        return <ReverseMarketplacePage />;

      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900 w-full overflow-x-hidden">
      {supportSession && (
        <SupportBanner session={supportSession} onExit={exitSupportMode} />
      )}
      <Navbar />
      <main className="flex-1 w-full overflow-x-hidden">{renderCurrentView()}</main>
      <Footer />
      {/* Global Post Job Modal */}
      <CompanyAddJobModal
        isOpen={isAddJobModalOpen}
        onClose={() => setIsAddJobModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
