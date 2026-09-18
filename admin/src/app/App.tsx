import React from "react";
import { AdminProvider, useAdmin } from "./AdminContext";
import { ProtectedRoute } from "../components/common/ProtectedRoute";
import { AdminLayout } from "../components/layout/AdminLayout";
import { OverviewPage } from "../pages/OverviewPage";
import { CandidatesPage } from "../pages/CandidatesPage";
import { CompaniesPage } from "../pages/CompaniesPage";
import { JobsPage } from "../pages/JobsPage";
import { ApplicationsPage } from "../pages/ApplicationsPage";
import { InterviewsPage } from "../pages/InterviewsPage";
import { ReportsPage } from "../pages/ReportsPage";
import { AuditLogsPage } from "../pages/AuditLogsPage";
import { AIOperationsPage } from "../pages/AIOperationsPage";
import { SystemErrorsPage } from "../pages/SystemErrorsPage";
import { EmailOperationsPage } from "../pages/EmailOperationsPage";
import { WhatsAppOperationsPage } from "../pages/WhatsAppOperationsPage";
import { TemplatesPage } from "../pages/TemplatesPage";
import { MarketplacePage } from "../pages/MarketplacePage";
import { RBACPage } from "../pages/RBACPage";
import { ErrorBoundary } from "../components/common/ErrorBoundary";

const AdminAppContent: React.FC = () => {
  const { activeView } = useAdmin();

  return (
    <ProtectedRoute>
      <AdminLayout>
        <ErrorBoundary fallbackTitle={`Error in ${activeView} module`}>
          {activeView === "overview" && <OverviewPage />}
          {activeView === "candidates" && <CandidatesPage />}
          {activeView === "companies" && <CompaniesPage />}
          {activeView === "jobs" && <JobsPage />}
          {activeView === "applications" && <ApplicationsPage />}
          {activeView === "interviews" && <InterviewsPage />}
          {activeView === "reports" && <ReportsPage />}
          {activeView === "ai-operations" && <AIOperationsPage />}
          {activeView === "system-errors" && <SystemErrorsPage />}
          {activeView === "email-operations" && <EmailOperationsPage />}
          {activeView === "whatsapp-operations" && <WhatsAppOperationsPage />}
          {activeView === "templates" && <TemplatesPage />}
          {activeView === "marketplace" && <MarketplacePage />}
          {activeView === "rbac" && <RBACPage />}
          {activeView === "audit-logs" && <AuditLogsPage />}
        </ErrorBoundary>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export const App: React.FC = () => {
  return (
    <AdminProvider>
      <AdminAppContent />
    </AdminProvider>
  );
};
