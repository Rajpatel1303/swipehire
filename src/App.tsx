/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";

// Landing & Auth
import { LandingPage } from "./components/landing/LandingPage";
import { AuthSelectModal } from "./components/auth/AuthSelectModal";
import { CandidateAuth } from "./components/auth/CandidateAuth";
import { CompanyAuth } from "./components/auth/CompanyAuth";

// Candidate Views
import { CandidateOnboarding } from "./components/candidate/CandidateOnboarding";
import { CandidateProfileReview } from "./components/candidate/CandidateProfileReview";
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

// Admin View
import { AdminPortal } from "./components/admin/AdminPortal";

const MainContent: React.FC = () => {
  const { activeView, role, candidate, company, isAddJobModalOpen, setIsAddJobModalOpen } = useApp();

  const renderCurrentView = () => {
    // Guard against role/view mismatch: Company users should never see candidate onboarding/radar
    if (role === "company") {
      if (
        activeView === "candidate-onboarding" ||
        activeView === "candidate-review" ||
        activeView === "candidate-radar" ||
        activeView === "candidate-jobs" ||
        activeView === "candidate-applications" ||
        activeView === "candidate-profile"
      ) {
        return company.isCompleted ? <CompanyCockpitDashboard /> : <CompanyOnboarding />;
      }
    }

    // Guard against role/view mismatch: Candidate users should never see recruiter onboarding/cockpit
    if (role === "candidate") {
      if (
        activeView === "company-onboarding" ||
        activeView === "company-cockpit" ||
        activeView === "company-applications" ||
        activeView === "company-jobs" ||
        activeView === "company-add-job" ||
        activeView === "company-pipeline" ||
        activeView === "company-email-connect" ||
        activeView === "company-interviews" ||
        activeView === "company-compare"
      ) {
        return candidate.isCompleted ? <CareerRadarDashboard /> : <CandidateOnboarding />;
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

      // Admin Console
      case "admin-overview":
      case "admin-users":
      case "admin-companies":
      case "admin-jobs":
      case "admin-reports":
        return <AdminPortal />;

      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900 w-full overflow-x-hidden">
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
