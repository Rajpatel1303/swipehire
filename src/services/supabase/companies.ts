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
      if (company.id) {
        const { data: existingCompany, error: checkError } = await supabase
          .from("companies")
          .select("id, user_id")
          .eq("id", company.id)
          .maybeSingle();

        if (checkError) {
          console.error("[CompaniesService] Error verifying company ownership:", checkError.message);
          throw new Error(`Database error verifying company ownership: ${checkError.message}`);
        }

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
      const payload: any = {
        id: company.id,
        user_id: authUser.id,
        company_name: company.companyName,
        contact_person: company.contactPerson,
        email: company.email,
        phone: company.phone,
        logo: company.logo,
        website: company.website,
        industry: company.industry,
        size: company.size,
        location: company.location,
        about: company.about,
        culture: company.culture,
        benefits: company.benefits,
        is_completed: company.isCompleted,
        is_verified: company.isVerified,
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

      await AuditService.log({
        actorId: authUser.id,
        actorRole: "company",
        action: "update_company_profile",
        entityType: "company",
        entityId: company.id,
        metadata: { companyName: company.companyName, isVerified: company.isVerified },
      });

      return true;
    } catch (err: any) {
      console.error("[CompaniesService] Unexpected error saving company:", err.message || err);
      throw err;
    }
  }
}
