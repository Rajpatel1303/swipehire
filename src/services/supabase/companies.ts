import { supabase } from "./client";
import { CompanyProfile } from "../../types";
import { AuditService } from "./audit";

export class CompaniesService {
  /**
   * Fetch all companies
   */
  static async getCompanies(): Promise<CompanyProfile[]> {
    try {
      const { data, error } = await supabase.from("companies").select("*");
      if (error || !data) {
        console.warn("[CompaniesService] Failed to fetch companies:", error?.message);
        return [];
      }

      return data.map((c) => ({
        id: c.id,
        userId: c.user_id,
        companyName: c.company_name,
        contactPerson: c.contact_person,
        email: c.email,
        phone: c.phone || "",
        logo: c.logo || "",
        website: c.website || "",
        industry: c.industry,
        size: c.size,
        location: c.location,
        about: c.about || "",
        culture: c.culture || [],
        benefits: c.benefits || [],
        isCompleted: !!c.is_completed,
        isVerified: !!c.is_verified,
        isSuspended: !!c.is_suspended,
        photoSettings: (c.photo_settings as any) || undefined,
        emailIntegration: (c.email_integration as any) || {
          provider: "none",
          connectedEmail: "",
          senderName: "",
          isConnected: false,
        },
      }));
    } catch (err) {
      console.warn("[CompaniesService] Error fetching companies:", err);
      return [];
    }
  }

  /**
   * Save or update company profile
   */
  static async saveCompany(company: CompanyProfile): Promise<boolean> {
    try {
      // 1. Authenticated Supabase user must be the authorization source
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const authUser = authData?.user;
      if (!authUser || authError) {
        const errMsg = "Unauthorized: No active authenticated user session found.";
        console.error("[CompaniesService] saveCompany authorization failed:", errMsg);
        throw new Error(errMsg);
      }

      // 2. Multi-tenant ownership verification: verify target company belongs to authenticated user
      let existingCompany: any = null;
      if (company.id) {
        const { data: fetchedComp, error: checkError } = await supabase
          .from("companies")
          .select("*")
          .eq("id", company.id)
          .maybeSingle();

        if (checkError) {
          console.error("[CompaniesService] Error verifying company ownership:", checkError.message);
          throw new Error(`Database error verifying company ownership: ${checkError.message}`);
        }
        existingCompany = fetchedComp;

        if (existingCompany && existingCompany.user_id && existingCompany.user_id !== authUser.id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", authUser.id)
            .maybeSingle();

          if (profile?.role !== "admin") {
            const errMsg = "Forbidden: Cannot modify a company profile owned by another user.";
            console.error("[CompaniesService] Multi-tenant security check failed:", errMsg, {
              targetCompanyId: company.id,
              authenticatedUserId: authUser.id,
            });
            throw new Error(errMsg);
          }
        }
      }

      // 3. Construct database payload ensuring user_id is the authenticated user ID
      const targetUserId = existingCompany?.user_id || authUser.id;
      const payload: any = {
        id: company.id,
        user_id: targetUserId,
        company_name: company.companyName,
        contact_person: company.contactPerson,
        email: company.email,
        phone: company.phone,
        logo: company.logo,
        photo_settings: (company.photoSettings as any) || null,
        website: company.website,
        industry: company.industry,
        size: company.size,
        location: company.location,
        about: company.about,
        culture: company.culture,
        benefits: company.benefits,
        is_completed: company.isCompleted,
        is_verified: company.isVerified,
        is_suspended: company.isSuspended || false,
        email_integration: company.emailIntegration as any,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("companies").upsert(payload);
      if (error) {
        console.error("[CompaniesService] Failed to upsert company to database:", {
          code: error.code,
          message: error.message,
          details: error.details,
          companyId: company.id,
        });
        throw new Error(`Database error saving company profile: ${error.message}`);
      }

      // 4. Granular email integration audit events
      const prevEmailConn = !!existingCompany?.email_integration?.isConnected;
      const nextEmailConn = !!company.emailIntegration?.isConnected;
      if (!prevEmailConn && nextEmailConn) {
        await AuditService.log({
          actorUserId: authUser.id,
          actorRole: "company",
          targetUserId,
          companyId: company.id,
          action: "email_integration_connected",
          entityType: "company",
          entityId: company.id,
          oldData: { emailIntegration: existingCompany?.email_integration || {} },
          newData: {
            provider: company.emailIntegration?.provider,
            connectedEmail: company.emailIntegration?.connectedEmail,
            senderName: company.emailIntegration?.senderName,
          },
          metadata: { provider: company.emailIntegration?.provider },
        });
      } else if (prevEmailConn && !nextEmailConn) {
        await AuditService.log({
          actorUserId: authUser.id,
          actorRole: "company",
          targetUserId,
          companyId: company.id,
          action: "email_integration_disconnected",
          entityType: "company",
          entityId: company.id,
          oldData: { emailIntegration: existingCompany?.email_integration || {} },
          newData: { isConnected: false },
        });
      }

      // 5. Main profile update event
      await AuditService.log({
        actorUserId: authUser.id,
        actorRole: "company",
        targetUserId,
        companyId: company.id,
        action: existingCompany ? "update_company_profile" : "create_company_profile",
        entityType: "company",
        entityId: company.id,
        oldData: existingCompany
          ? {
              companyName: existingCompany.company_name,
              contactPerson: existingCompany.contact_person,
              email: existingCompany.email,
              location: existingCompany.location,
              industry: existingCompany.industry,
              size: existingCompany.size,
            }
          : {},
        newData: {
          companyName: company.companyName,
          contactPerson: company.contactPerson,
          email: company.email,
          location: company.location,
          industry: company.industry,
          size: company.size,
        },
        metadata: { companyName: company.companyName, isVerified: company.isVerified },
      });

      return true;
    } catch (err: any) {
      console.error("[CompaniesService] Unexpected error saving company:", err.message || err);
      throw err;
    }
  }

  /**
   * Toggle Verified Employer badge (Admin Action)
   */
  static async toggleCompanyVerification(id: string, isVerified: boolean, actorId = "admin"): Promise<boolean> {
    try {
      const { data: existing } = await supabase.from("companies").select("user_id, company_name, is_verified").eq("id", id).maybeSingle();

      const { error } = await supabase
        .from("companies")
        .update({ is_verified: isVerified, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("[CompaniesService] Failed to toggle company verification:", error.message);
        return false;
      }

      await AuditService.log({
        actorId,
        actorRole: "admin",
        targetUserId: existing?.user_id,
        companyId: id,
        action: isVerified ? "company_verified" : "company_verification_removed",
        entityType: "company",
        entityId: id,
        oldData: { isVerified: existing?.is_verified },
        newData: { isVerified },
        metadata: { isVerified, companyName: existing?.company_name },
      });

      return true;
    } catch (err) {
      console.error("[CompaniesService] Error updating company verification:", err);
      return false;
    }
  }

  /**
   * Suspend or unsuspend a company account (Admin Action)
   */
  static async suspendCompany(id: string, isSuspended: boolean, actorId = "admin"): Promise<boolean> {
    try {
      const { data: existing } = await supabase.from("companies").select("user_id, company_name, is_suspended").eq("id", id).maybeSingle();

      const { error } = await supabase
        .from("companies")
        .update({ is_suspended: isSuspended, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("[CompaniesService] Failed to suspend/unsuspend company:", error.message);
        return false;
      }

      await AuditService.log({
        actorId,
        actorRole: "admin",
        targetUserId: existing?.user_id,
        companyId: id,
        action: isSuspended ? "company_suspended" : "company_unsuspended",
        entityType: "company",
        entityId: id,
        oldData: { isSuspended: existing?.is_suspended },
        newData: { isSuspended },
        metadata: { isSuspended, companyName: existing?.company_name },
      });

      return true;
    } catch (err) {
      console.error("[CompaniesService] Error updating company suspension:", err);
      return false;
    }
  }
}
