export * from "./client";
export * from "./auth";
export * from "./candidates";
export * from "./companies";
export * from "./jobs";
export * from "./applications";
export * from "./marketplace";
export * from "./notifications";
export * from "./sla";
export * from "./templates";
export * from "./admin";
export * from "./audit";

import { AuthService } from "./auth";
import { CandidatesService } from "./candidates";
import { CompaniesService } from "./companies";
import { JobsService } from "./jobs";
import { ApplicationsService } from "./applications";
import { MarketplaceService } from "./marketplace";
import { NotificationsService } from "./notifications";
import { SLAService } from "./sla";
import { TemplatesService } from "./templates";
import { AdminService } from "./admin";
import { AuditService } from "./audit";

export const SupabaseService = {
  // Auth
  signUp: AuthService.signUp.bind(AuthService),
  resendConfirmationEmail: AuthService.resendConfirmationEmail.bind(AuthService),
  signInWithGoogle: AuthService.signInWithGoogle.bind(AuthService),
  fetchUserProfile: AuthService.fetchUserProfile.bind(AuthService),
  signIn: AuthService.signIn.bind(AuthService),
  signOut: AuthService.signOut.bind(AuthService),
  getSession: AuthService.getSession.bind(AuthService),
  ping: AuthService.ping.bind(AuthService),

  // Candidates
  getCandidates: CandidatesService.getCandidates.bind(CandidatesService),
  saveCandidate: CandidatesService.saveCandidate.bind(CandidatesService),

  // Companies
  getCompanies: CompaniesService.getCompanies.bind(CompaniesService),
  saveCompany: CompaniesService.saveCompany.bind(CompaniesService),

  // Jobs
  getJobs: JobsService.getJobs.bind(JobsService),
  saveJob: JobsService.saveJob.bind(JobsService),
  deleteJob: JobsService.deleteJob.bind(JobsService),

  // Applications
  getApplications: ApplicationsService.getApplications.bind(ApplicationsService),
  saveApplication: ApplicationsService.saveApplication.bind(ApplicationsService),
  logSwipe: ApplicationsService.logSwipe.bind(ApplicationsService),

  // Marketplace
  getBlindTalentProfiles: MarketplaceService.getBlindTalentProfiles.bind(MarketplaceService),
  saveBlindTalentProfile: MarketplaceService.saveBlindTalentProfile.bind(MarketplaceService),
  getTalentBids: MarketplaceService.getTalentBids.bind(MarketplaceService),
  saveTalentBid: MarketplaceService.saveTalentBid.bind(MarketplaceService),

  // SLAs & Templates & Reports & Notifications
  getCompanySLAs: SLAService.getCompanySLAs.bind(SLAService),
  getNotifications: NotificationsService.getNotifications.bind(NotificationsService),
  saveNotification: NotificationsService.saveNotification.bind(NotificationsService),
  getAdminReports: AdminService.getAdminReports.bind(AdminService),
  getEmailTemplates: TemplatesService.getEmailTemplates.bind(TemplatesService),
  getWhatsAppTemplates: TemplatesService.getWhatsAppTemplates.bind(TemplatesService),

  // Audit
  logAudit: AuditService.log.bind(AuditService),
};
