import { supabase } from "./client";
import { CandidateProfile, CompanyProfile } from "../../types";
import { AuditService } from "./audit";

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
   * Supabase Auth: Sign In / Sign Up with Google OAuth
   */
  static async signInWithGoogle(
    role: "candidate" | "company"
  ): Promise<{ error: string | null }> {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("swipehired_oauth_role", role);
      }

      const redirectTo =
        typeof window !== "undefined" && window.location
          ? window.location.origin
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
   * Supabase Auth: Fetch or Auto-Provision Profile from Supabase User
   */
  static async fetchUserProfile(
    user: any,
    roleHint?: "candidate" | "company" | "admin"
  ): Promise<{
    role: "candidate" | "company" | "admin";
    candidateProfile: CandidateProfile | null;
    companyProfile: CompanyProfile | null;
  }> {
    let candidateProfile: CandidateProfile | null = null;
    let companyProfile: CompanyProfile | null = null;
    let detectedRole: "candidate" | "company" | "admin" | null = roleHint || null;

    try {
      if (!detectedRole) {
        let profileRows: any = null;
        if (user.id) {
          const res = await supabase.from("profiles").select("*").eq("id", user.id).limit(1);
          profileRows = res.data;
        }
        if ((!profileRows || profileRows.length === 0) && user.email) {
          const res = await supabase.from("profiles").select("*").eq("email", user.email).limit(1);
          profileRows = res.data;
        }

        if (profileRows && profileRows.length > 0 && profileRows[0].role) {
          detectedRole = profileRows[0].role as "candidate" | "company" | "admin";
        }
      }

      let compData: any = null;
      if (user.id) {
        const res = await supabase.from("companies").select("*").eq("user_id", user.id).limit(1);
        compData = res.data;
      }
      if ((!compData || compData.length === 0) && user.email) {
        const res = await supabase.from("companies").select("*").eq("email", user.email).limit(1);
        compData = res.data;
      }

      let candData: any = null;
      if (user.id) {
        const res = await supabase.from("candidates").select("*").eq("user_id", user.id).limit(1);
        candData = res.data;
      }
      if ((!candData || candData.length === 0) && user.email) {
        const res = await supabase.from("candidates").select("*").eq("email", user.email).limit(1);
        candData = res.data;
      }

      if (!detectedRole) {
        if (compData && compData.length > 0 && (!candData || candData.length === 0)) {
          detectedRole = "company";
        } else if (candData && candData.length > 0 && (!compData || compData.length === 0)) {
          detectedRole = "candidate";
        } else {
          const metaRole = user?.user_metadata?.role || user?.app_metadata?.role;
          if (metaRole === "company" || metaRole === "admin" || metaRole === "candidate") {
            detectedRole = metaRole;
          } else {
            detectedRole = "candidate";
          }
        }
      }

      const effectiveRole = detectedRole || "candidate";

      if (effectiveRole === "candidate") {
        if (candData && candData.length > 0) {
          const c = candData[0];
          candidateProfile = {
            id: c.id,
            fullName: c.full_name || user.user_metadata?.full_name || "Candidate",
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
            profilePhoto: c.profile_photo || user.user_metadata?.avatar_url || "",
            profileStrength: c.profile_strength || 50,
            isCompleted: c.is_completed ?? true,
            resumeFilename: c.resume_filename || undefined,
            resumeText: c.resume_text || undefined,
            learnedPreferences: c.learned_preferences || undefined,
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
            profilePhoto: user.user_metadata?.avatar_url || "",
            profileStrength: 30,
            isCompleted: false,
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
      } else if (effectiveRole === "company") {
        if (compData && compData.length > 0) {
          const cp = compData[0];
          companyProfile = {
            id: cp.id,
            companyName: cp.company_name || "Company",
            contactPerson: cp.contact_person || user.user_metadata?.full_name || "Recruiter",
            email: cp.email || user.email || "",
            phone: cp.phone || "",
            logo: cp.logo || user.user_metadata?.avatar_url || "",
            website: cp.website || "",
            industry: cp.industry || "Technology",
            size: cp.size || "10-50 employees",
            location: cp.location || "Ahmedabad, India",
            about: cp.about || "",
            culture: cp.culture || [],
            benefits: cp.benefits || [],
            isCompleted: cp.is_completed ?? true,
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
            companyName,
            contactPerson: user.user_metadata?.contact_person || "Recruiter",
            email: user.email || "",
            phone: "",
            logo: "",
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
        role: effectiveRole,
        candidateProfile,
        companyProfile,
      };
    } catch (err: any) {
      console.error("fetchUserProfile failed:", err);
      return {
        role: roleHint || "candidate",
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

      await AuditService.log({
        actorId: user.id,
        actorRole: role,
        action: "user_signin",
        entityType: "auth",
        entityId: user.id,
        metadata: { role, email: params.email.trim() },
      });

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
