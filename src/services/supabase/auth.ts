import { supabase } from "./client";
import { CandidateProfile, CompanyProfile } from "../../types";
import { AuditService } from "./audit";
import { safeStorage } from "../../utils/safeStorage";

export class AuthService {
  /**
   * Supabase Auth: Sign Up with Email and Password
   */
  static async signUp(params: {
    email: string;
    password: string;
    role: "candidate" | "company";
    fullName?: string;
    companyName?: string;
    contactPerson?: string;
  }): Promise<{
    user: any;
    session: any;
    needsEmailConfirmation: boolean;
    error: string | null;
  }> {
    try {
      const redirectTo =
        typeof window !== "undefined" && window.location
          ? window.location.origin
          : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: params.email.trim(),
        password: params.password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            role: params.role,
            full_name: params.fullName,
            company_name: params.companyName,
            contact_person: params.contactPerson,
          },
        },
      });

      if (error) {
        return {
          user: null,
          session: null,
          needsEmailConfirmation: false,
          error: error.message,
        };
      }

      const user = data.user;
      const session = data.session;
      const needsEmailConfirmation = !session || !user?.email_confirmed_at;

      if (user) {
        try {
          await supabase.from("profiles").upsert({
            id: user.id,
            email: params.email.trim(),
            role: params.role,
            updated_at: new Date().toISOString(),
          });

          if (params.role === "candidate") {
            const candidateId = `cand_${user.id.substring(0, 8)}`;
            await supabase.from("candidates").upsert({
              id: candidateId,
              user_id: user.id,
              full_name: params.fullName || "Candidate",
              headline: "Tech Professional",
              email: params.email.trim(),
              location: "Ahmedabad, India",
              work_preference: "Hybrid",
              years_of_experience: 0,
              skills: [],
              is_completed: false,
            });
          } else if (params.role === "company") {
            const companyId = `comp_${user.id.substring(0, 8)}`;
            await supabase.from("companies").upsert({
              id: companyId,
              user_id: user.id,
              company_name: params.companyName || "My Company",
              contact_person: params.contactPerson || "Recruiter",
              email: params.email.trim(),
              industry: "Technology",
              size: "10-50 employees",
              location: "Ahmedabad, India",
              is_completed: false,
            });
          }

          await AuditService.log({
            actorId: user.id,
            actorRole: params.role,
            action: "user_signup",
            entityType: "auth",
            entityId: user.id,
            metadata: { role: params.role, email: params.email.trim() },
          });
        } catch (dbErr) {
          console.warn("Notice during post-signup profile init:", dbErr);
        }
      }

      await supabase.auth.signOut().catch(() => {});

      return {
        user: data.user,
        session: null,
        needsEmailConfirmation,
        error: null,
      };
    } catch (err: any) {
      return {
        user: null,
        session: null,
        needsEmailConfirmation: false,
        error: err.message || "Failed to sign up.",
      };
    }
  }

  /**
   * Supabase Auth: Resend Confirmation Email
   */
  static async resendConfirmationEmail(
    email: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const redirectTo =
        typeof window !== "undefined" && window.location
          ? window.location.origin
          : undefined;

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to resend confirmation email.",
      };
    }
  }

  /**
   * Helper to retrieve OAuth role intent from all available client vectors
   */
  static getSavedOAuthRole(): "candidate" | "company" | null {
    if (typeof window === "undefined") return null;

    try {
      // 1. URL search params
      const searchParams = new URLSearchParams(window.location.search);
      const urlRole = searchParams.get("oauth_role");
      if (urlRole === "candidate" || urlRole === "company") return urlRole;

      // 2. URL hash params (e.g. #oauth_role=company&access_token=...)
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, "?"));
        const hashRole = hashParams.get("oauth_role");
        if (hashRole === "candidate" || hashRole === "company") return hashRole;
      }

      // 3. sessionStorage
      let sessionRole: string | null = null;
      try {
        sessionRole = sessionStorage.getItem("swipehired_oauth_role");
      } catch {}
      if (sessionRole === "candidate" || sessionRole === "company") return sessionRole;

      // 4. safeStorage (localStorage with fallback)
      const localRole = safeStorage.getItem("swipehired_oauth_role");
      if (localRole === "candidate" || localRole === "company") return localRole;

      // 5. Document cookie fallback
      const match = document.cookie.match(/(?:^|;\s*)swipehired_oauth_role=([^;]+)/);
      if (match && (match[1] === "candidate" || match[1] === "company")) {
        return match[1] as "candidate" | "company";
      }
    } catch (e) {
      console.warn("Could not retrieve saved OAuth role:", e);
    }
    return null;
  }

  /**
   * Helper to clean up transient OAuth role intent keys
   */
  static clearSavedOAuthRole(): void {
    if (typeof window === "undefined") return;
    try {
      safeStorage.removeItem("swipehired_oauth_role");
      sessionStorage.removeItem("swipehired_oauth_role");
      document.cookie = "swipehired_oauth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    } catch {}
  }

  /**
   * Supabase Auth: Sign In / Sign Up with Google OAuth
   */
  static async signInWithGoogle(
    role: "candidate" | "company"
  ): Promise<{ error: string | null }> {
    try {
      safeStorage.setItem("swipehired_oauth_role", role);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("swipehired_oauth_role", role);
          document.cookie = `swipehired_oauth_role=${role}; path=/; max-age=600; SameSite=Lax`;
        } catch {}
      }

      const redirectTo =
        typeof window !== "undefined" && window.location
          ? `${window.location.origin}/?oauth_role=${role}`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.message || "Failed to initiate Google sign-in." };
    }
  }

  /**
   * Supabase Auth: Sign In / Sign Up with GitHub OAuth (Candidate Only)
   */
  static async signInWithGitHub(
    role: "candidate" = "candidate"
  ): Promise<{ error: string | null }> {
    try {
      safeStorage.setItem("swipehired_oauth_role", role);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("swipehired_oauth_role", role);
          document.cookie = `swipehired_oauth_role=${role}; path=/; max-age=600; SameSite=Lax`;
        } catch {}
      }

      const redirectTo =
        typeof window !== "undefined" && window.location
          ? `${window.location.origin}/?oauth_role=${role}&oauth_provider=github`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo,
          scopes: "read:user user:email",
        },
      });

      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.message || "Failed to initiate GitHub sign-in." };
    }
  }

  /**
   * Supabase Auth: Fetch or Auto-Provision Profile from Supabase User
   * Authoritative Source of Truth: public.profiles table
   */
  static async fetchUserProfile(
    user: any,
    roleHint?: "candidate" | "company" | "admin"
  ): Promise<{
    role: "candidate" | "company" | "admin" | null;
    candidateProfile: CandidateProfile | null;
    companyProfile: CompanyProfile | null;
  }> {
    let candidateProfile: CandidateProfile | null = null;
    let companyProfile: CompanyProfile | null = null;
    let authoritativeRole: "candidate" | "company" | "admin" | null = null;

    try {
      // 1. FIRST & FOREMOST: Query the authoritative public.profiles table
      let profileRows: any = null;
      if (user.id) {
        const res = await supabase.from("profiles").select("*").eq("id", user.id).limit(1);
        profileRows = res.data;
      }
      if ((!profileRows || profileRows.length === 0) && user.email) {
        const res = await supabase.from("profiles").select("*").eq("email", user.email.trim()).limit(1);
        profileRows = res.data;
      }

      if (profileRows && profileRows.length > 0 && profileRows[0].role) {
        authoritativeRole = profileRows[0].role as "candidate" | "company" | "admin";
      }

      // 2. If no profile exists yet in database (e.g., fresh Google OAuth login / signup)
      if (!authoritativeRole) {
        // Look in user metadata or multi-layered OAuth role intent
        const metaRole = user?.user_metadata?.role || user?.app_metadata?.role;
        const savedOauth = this.getSavedOAuthRole();

        if (metaRole === "candidate" || metaRole === "company" || metaRole === "admin") {
          authoritativeRole = metaRole;
        } else if (roleHint === "candidate" || roleHint === "company" || roleHint === "admin") {
          authoritativeRole = roleHint;
        } else if (savedOauth === "candidate" || savedOauth === "company") {
          authoritativeRole = savedOauth;
        }

        // If a role was determined, persist it into public.profiles immediately
        if (authoritativeRole && user.id) {
          try {
            await supabase.from("profiles").upsert({
              id: user.id,
              email: user.email ? user.email.trim() : "",
              role: authoritativeRole,
              updated_at: new Date().toISOString(),
            });
          } catch (profileInsertErr) {
            console.warn("Could not upsert profile for new user:", profileInsertErr);
          }
        }
      }

      // 3. Fallback check on existing domain tables if role is STILL unresolved
      let compData: any = null;
      let candData: any = null;

      if (user.id) {
        const compRes = await supabase.from("companies").select("*").eq("user_id", user.id).limit(1);
        compData = compRes.data;
        const candRes = await supabase.from("candidates").select("*").eq("user_id", user.id).limit(1);
        candData = candRes.data;
      }
      if ((!compData || compData.length === 0) && user.email) {
        const compRes = await supabase.from("companies").select("*").eq("email", user.email.trim()).limit(1);
        compData = compRes.data;
      }
      if ((!candData || candData.length === 0) && user.email) {
        const candRes = await supabase.from("candidates").select("*").eq("email", user.email.trim()).limit(1);
        candData = candRes.data;
      }

      if (!authoritativeRole) {
        if (compData && compData.length > 0 && (!candData || candData.length === 0)) {
          authoritativeRole = "company";
        } else if (candData && candData.length > 0 && (!compData || compData.length === 0)) {
          authoritativeRole = "candidate";
        }

        // Persist the inferred role if found
        if (authoritativeRole && user.id) {
          try {
            await supabase.from("profiles").upsert({
              id: user.id,
              email: user.email ? user.email.trim() : "",
              role: authoritativeRole,
              updated_at: new Date().toISOString(),
            });
          } catch {}
        }
      }

      // 4. Hydrate the specific profile corresponding strictly to the authoritative role
      if (authoritativeRole === "candidate") {
        if (!candData || candData.length === 0) {
          if (user.id) {
            const candRes = await supabase.from("candidates").select("*").eq("user_id", user.id).limit(1);
            candData = candRes.data;
          }
          if ((!candData || candData.length === 0) && user.email) {
            const candRes = await supabase.from("candidates").select("*").eq("email", user.email.trim()).limit(1);
            candData = candRes.data;
          }
        }

        if (candData && candData.length > 0) {
          const c = candData[0];
          candidateProfile = {
            id: c.id,
            fullName: c.full_name || user.user_metadata?.full_name || user.user_metadata?.name || "Candidate",
            headline: c.headline || "Tech Professional",
            email: c.email || user.email || "",
            phone: c.phone || "",
            location: c.location || "Ahmedabad, India",
            workPreference: (c.work_preference as any) || "Hybrid",
            yearsOfExperience: Number(c.years_of_experience) || 0,
            skills: c.skills || [],
            possibleRoles: c.possible_roles || [],
            education: Array.isArray(c.education) ? c.education : [],
            experience: Array.isArray(c.experience) ? c.experience : [],
            projects: Array.isArray(c.projects) ? c.projects : [],
            certifications: c.certifications || [],
            expectedSalary: c.expected_salary || "",
            preferredRole: c.preferred_role || "",
            bio: c.bio || "",
            profilePhoto: c.profile_photo || user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
            profileStrength: c.profile_strength || 50,
            isCompleted: !!c.is_completed,
            resumeFilename: c.resume_filename || undefined,
            resumeText: c.resume_text || undefined,
            commissionAgreementSigned: !!c.commission_agreement_signed,
            commissionAgreementSignedAt: c.commission_agreement_signed_at || undefined,
            commissionAgreementDocId: c.commission_agreement_doc_id || undefined,
            commissionAgreementSignature: c.commission_agreement_signature || undefined,
            learnedPreferences: c.learned_preferences || undefined,
            githubData: (c.github_data as any) || undefined,
          };
        } else {
          const candidateId = `cand_${user.id.substring(0, 8)}`;
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Candidate";
          const newCand: CandidateProfile = {
            id: candidateId,
            fullName,
            headline: "Tech Professional",
            email: user.email || "",
            phone: "",
            location: "Ahmedabad, India",
            workPreference: "Hybrid",
            yearsOfExperience: 0,
            skills: [],
            possibleRoles: [],
            education: [],
            experience: [],
            projects: [],
            certifications: [],
            expectedSalary: "",
            preferredRole: "",
            bio: "",
            profilePhoto: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
            profileStrength: 30,
            isCompleted: false,
            commissionAgreementSigned: false,
          };

          try {
            await supabase.from("candidates").insert({
              id: newCand.id,
              user_id: user.id,
              full_name: newCand.fullName,
              headline: newCand.headline,
              email: newCand.email,
              location: newCand.location,
              work_preference: newCand.workPreference,
              years_of_experience: newCand.yearsOfExperience,
              skills: newCand.skills,
              profile_photo: newCand.profilePhoto,
              profile_strength: newCand.profileStrength,
              is_completed: false,
            });
          } catch (insertErr) {
            console.warn("Could not insert default candidate profile:", insertErr);
          }
          candidateProfile = newCand;
        }
      } else if (authoritativeRole === "company") {
        if (!compData || compData.length === 0) {
          if (user.id) {
            const compRes = await supabase.from("companies").select("*").eq("user_id", user.id).limit(1);
            compData = compRes.data;
          }
          if ((!compData || compData.length === 0) && user.email) {
            const compRes = await supabase.from("companies").select("*").eq("email", user.email.trim()).limit(1);
            compData = compRes.data;
          }
        }

        if (compData && compData.length > 0) {
          const cp = compData[0];
          companyProfile = {
            id: cp.id,
            userId: cp.user_id || user.id,
            companyName: cp.company_name || "Company",
            contactPerson: cp.contact_person || user.user_metadata?.full_name || user.user_metadata?.name || "Recruiter",
            email: cp.email || user.email || "",
            phone: cp.phone || "",
            logo: cp.logo || user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
            website: cp.website || "",
            industry: cp.industry || "Technology",
            size: cp.size || "10-50 employees",
            location: cp.location || "Ahmedabad, India",
            about: cp.about || "",
            culture: cp.culture || [],
            benefits: cp.benefits || [],
            isCompleted: !!cp.is_completed,
            isVerified: cp.is_verified ?? true,
            emailIntegration: (cp.email_integration as any) || {
              provider: "none",
              isConnected: false,
              connectedEmail: "",
              senderName: "",
            },
          };
        } else {
          const companyId = `comp_${user.id.substring(0, 8)}`;
          const companyName =
            user.user_metadata?.company_name ||
            user.user_metadata?.full_name ||
            "My Company";
          const newComp: CompanyProfile = {
            id: companyId,
            userId: user.id,
            companyName,
            contactPerson: user.user_metadata?.contact_person || user.user_metadata?.full_name || user.user_metadata?.name || "Recruiter",
            email: user.email || "",
            phone: "",
            logo: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
            website: "",
            about: "",
            industry: "Technology",
            size: "10-50 employees",
            location: "Ahmedabad, India",
            culture: [],
            benefits: [],
            isCompleted: false,
            isVerified: true,
            emailIntegration: {
              provider: "none",
              isConnected: false,
              connectedEmail: "",
              senderName: "",
            },
          };

          try {
            await supabase.from("companies").insert({
              id: newComp.id,
              user_id: user.id,
              company_name: newComp.companyName,
              contact_person: newComp.contactPerson,
              email: newComp.email,
              industry: newComp.industry,
              size: newComp.size,
              location: newComp.location,
              is_completed: false,
              is_verified: true,
            });
          } catch (insertErr) {
            console.warn("Could not insert default company profile:", insertErr);
          }
          companyProfile = newComp;
        }
      }

      return {
        role: authoritativeRole,
        candidateProfile,
        companyProfile,
      };
    } catch (err: any) {
      console.error("fetchUserProfile failed:", err);
      return {
        role: authoritativeRole,
        candidateProfile: null,
        companyProfile: null,
      };
    }
  }

  /**
   * Supabase Auth: Sign In with Email and Password
   */
  static async signIn(params: {
    email: string;
    password: string;
    expectedRole?: "candidate" | "company" | "admin";
  }): Promise<{
    user: any;
    role: "candidate" | "company" | "admin" | null;
    candidateProfile: CandidateProfile | null;
    companyProfile: CompanyProfile | null;
    needsEmailConfirmation: boolean;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: params.email.trim(),
        password: params.password,
      });

      if (error) {
        const isEmailNotConfirmed =
          error.message?.toLowerCase().includes("email not confirmed") ||
          error.status === 400;

        return {
          user: null,
          role: null,
          candidateProfile: null,
          companyProfile: null,
          needsEmailConfirmation: isEmailNotConfirmed,
          error: error.message,
        };
      }

      const user = data.user;
      if (!user) {
        return {
          user: null,
          role: null,
          candidateProfile: null,
          companyProfile: null,
          needsEmailConfirmation: false,
          error: "No user found for these credentials.",
        };
      }

      const { role, candidateProfile, companyProfile } =
        await this.fetchUserProfile(user, params.expectedRole);

      if (role) {
        await AuditService.log({
          actorId: user.id,
          actorRole: role,
          action: "user_signin",
          entityType: "auth",
          entityId: user.id,
          metadata: { role, email: params.email.trim() },
        });
      }

      return {
        user,
        role,
        candidateProfile,
        companyProfile,
        needsEmailConfirmation: false,
        error: null,
      };
    } catch (err: any) {
      return {
        user: null,
        role: null,
        candidateProfile: null,
        companyProfile: null,
        needsEmailConfirmation: false,
        error: err.message || "Failed to sign in.",
      };
    }
  }

  /**
   * Supabase Auth: Sign Out
   */
  static async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message || "Failed to sign out." };
    }
  }

  /**
   * Supabase Auth: Get Current Session
   */
  static async getSession() {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch {
      return null;
    }
  }

  /**
   * Ping / Health check
   */
  static async ping(): Promise<boolean> {
    try {
      const { error } = await supabase.from("profiles").select("id").limit(1);
      return !error;
    } catch {
      return false;
    }
  }
}
