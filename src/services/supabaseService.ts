import { supabase } from "./supabaseClient";
import {
  CandidateProfile,
  CompanyProfile,
  Job,
  Application,
  BlindTalentProfile,
  TalentBid,
  NotificationItem,
  CompanySLAInfo,
  EmailTemplate,
  WhatsAppTemplate,
  AdminReport,
  SwipeInteraction,
} from "../types";

export class SupabaseService {
  /**
   * Supabase Auth: Sign Up
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
      // When email confirmation is required, session is null or email_confirmed_at is false
      const needsEmailConfirmation = !session || !user?.email_confirmed_at;

      if (user) {
        try {
          // Upsert into profiles
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
        } catch (dbErr) {
          console.warn("Notice during post-signup profile init:", dbErr);
        }
      }

      // Sign out any instant session immediately so the user must log in from login screen
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
      // 1. Check profiles table first if no explicit roleHint provided
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

      // 2. Check companies table
      let compData: any = null;
      if (user.id) {
        const res = await supabase.from("companies").select("*").eq("user_id", user.id).limit(1);
        compData = res.data;
      }
      if ((!compData || compData.length === 0) && user.email) {
        const res = await supabase.from("companies").select("*").eq("email", user.email).limit(1);
        compData = res.data;
      }

      // 3. Check candidates table
      let candData: any = null;
      if (user.id) {
        const res = await supabase.from("candidates").select("*").eq("user_id", user.id).limit(1);
        candData = res.data;
      }
      if ((!candData || candData.length === 0) && user.email) {
        const res = await supabase.from("candidates").select("*").eq("email", user.email).limit(1);
        candData = res.data;
      }

      // 4. Resolve detectedRole if still not set
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

      // 5. Ensure profile row in profiles table is persisted/updated
      try {
        await supabase.from("profiles").upsert({
          id: user.id,
          email: user.email,
          role: detectedRole,
          updated_at: new Date().toISOString(),
        });
      } catch (profileUpsertErr) {
        console.warn("Notice: profiles table upsert:", profileUpsertErr);
      }

      // 6. Populate or Provision Company or Candidate Profile
      if (detectedRole === "company") {
        if (compData && compData.length > 0) {
          const comp = compData[0];
          companyProfile = {
            id: comp.id,
            userId: user.id,
            companyName: comp.company_name,
            contactPerson: comp.contact_person,
            email: comp.email,
            phone: comp.phone || "",
            logo: comp.logo || "",
            website: comp.website || "",
            industry: comp.industry,
            size: comp.size,
            location: comp.location,
            about: comp.about || "",
            culture: comp.culture || [],
            benefits: comp.benefits || [],
            isCompleted: !!comp.is_completed,
            isVerified: !!comp.is_verified,
            emailIntegration: (comp.email_integration as any) || {
              provider: "none",
              connectedEmail: "",
              senderName: "",
              isConnected: false,
            },
          };
        } else {
          // Provision company profile
          const newCompId = `comp_${user.id.substring(0, 8)}`;
          const userMeta = user.user_metadata || {};
          const newComp: CompanyProfile = {
            id: newCompId,
            userId: user.id,
            companyName: userMeta.company_name || userMeta.full_name || "My Company",
            contactPerson: userMeta.contact_person || userMeta.name || "Recruiter",
            email: user.email,
            phone: "",
            logo: userMeta.avatar_url || userMeta.picture || "",
            website: "",
            industry: "Technology",
            size: "10-50 employees",
            location: "Ahmedabad, India",
            about: "",
            culture: [],
            benefits: [],
            isCompleted: false,
            isVerified: true,
            emailIntegration: {
              provider: "none",
              connectedEmail: "",
              senderName: "",
              isConnected: false,
            },
          };
          companyProfile = newComp;
          await supabase.from("companies").upsert({
            id: newCompId,
            user_id: user.id,
            company_name: newComp.companyName,
            contact_person: newComp.contactPerson,
            email: newComp.email,
            logo: newComp.logo,
            industry: newComp.industry,
            size: newComp.size,
            location: newComp.location,
            is_completed: false,
          });
        }
      } else if (detectedRole === "candidate") {
        if (candData && candData.length > 0) {
          const c = candData[0];
          candidateProfile = {
            id: c.id,
            userId: user.id,
            fullName: c.full_name,
            headline: c.headline,
            email: c.email,
            phone: c.phone || "",
            location: c.location,
            workPreference: (c.work_preference as any) || "Hybrid",
            yearsOfExperience: Number(c.years_of_experience || 0),
            skills: c.skills || [],
            possibleRoles: c.possible_roles || [],
            education: (c.education as any) || [],
            experience: (c.experience as any) || [],
            projects: (c.projects as any) || [],
            certifications: c.certifications || [],
            expectedSalary: c.expected_salary || "",
            preferredRole: c.preferred_role || "",
            bio: c.bio || "",
            profilePhoto: c.profile_photo || "",
            profileStrength: Number(c.profile_strength || 0),
            isCompleted: !!c.is_completed,
            resumeFilename: c.resume_filename || undefined,
            resumeText: c.resume_text || undefined,
            learnedPreferences: (c.learned_preferences as any) || undefined,
          };
        } else {
          // Provision candidate profile
          const newCandId = `cand_${user.id.substring(0, 8)}`;
          const userMeta = user.user_metadata || {};
          const newCand: CandidateProfile = {
            id: newCandId,
            userId: user.id,
            fullName: userMeta.full_name || userMeta.name || "Candidate",
            headline: "Tech Professional",
            email: user.email,
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
            profilePhoto: userMeta.avatar_url || userMeta.picture || "",
            profileStrength: 30,
            isCompleted: false,
          };
          candidateProfile = newCand;
          await supabase.from("candidates").upsert({
            id: newCandId,
            user_id: user.id,
            full_name: newCand.fullName,
            headline: newCand.headline,
            email: newCand.email,
            location: newCand.location,
            work_preference: newCand.workPreference,
            years_of_experience: newCand.yearsOfExperience,
            skills: newCand.skills,
            is_completed: false,
          });
        }
      }
    } catch (err) {
      console.warn("Error fetching user profile:", err);
    }

    return {
      role: detectedRole || "candidate",
      candidateProfile,
      companyProfile,
    };
  }

  /**
   * Supabase Auth: Sign In
   */
  static async signIn(params: {
    email: string;
    password: string;
    roleHint?: "candidate" | "company" | "admin";
  }): Promise<{
    user: any;
    session: any;
    role: "candidate" | "company" | "admin" | null;
    candidateProfile: CandidateProfile | null;
    companyProfile: CompanyProfile | null;
    isEmailNotConfirmed?: boolean;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: params.email.trim(),
        password: params.password,
      });

      if (error) {
        const isNotConfirmed =
          error.message?.toLowerCase().includes("email not confirmed") ||
          error.message?.toLowerCase().includes("not confirmed") ||
          false;

        return {
          user: null,
          session: null,
          role: null,
          candidateProfile: null,
          companyProfile: null,
          isEmailNotConfirmed: isNotConfirmed,
          error: isNotConfirmed
            ? "Email not confirmed. Please check your inbox and verify your email before logging in."
            : error.message,
        };
      }

      const user = data.user;
      if (!user) {
        return {
          user: null,
          session: null,
          role: null,
          candidateProfile: null,
          companyProfile: null,
          error: "User not found.",
        };
      }

      const profileResult = await this.fetchUserProfile(user, params.roleHint);

      return {
        user: data.user,
        session: data.session,
        role: profileResult.role,
        candidateProfile: profileResult.candidateProfile,
        companyProfile: profileResult.companyProfile,
        error: null,
      };
    } catch (err: any) {
      const isNotConfirmed =
        err.message?.toLowerCase().includes("email not confirmed") || false;
      return {
        user: null,
        session: null,
        role: null,
        candidateProfile: null,
        companyProfile: null,
        isEmailNotConfirmed: isNotConfirmed,
        error: isNotConfirmed
          ? "Email not confirmed. Please check your inbox and verify your email before logging in."
          : err.message || "Failed to sign in.",
      };
    }
  }

  /**
   * Supabase Auth: Sign Out
   */
  static async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error ? error.message : null };
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
   * Check connection status
   */
  static async ping(): Promise<boolean> {
    try {
      const { error } = await supabase.from("companies").select("id").limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Fetch all companies
   */
  static async getCompanies(): Promise<CompanyProfile[]> {
    const { data, error } = await supabase.from("companies").select("*");
    if (error || !data) {
      console.warn("Failed to fetch companies from Supabase:", error);
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
  }

  /**
   * Save or update company
   */
  static async saveCompany(company: CompanyProfile): Promise<boolean> {
    const payload: any = {
      id: company.id,
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
    if (company.userId) {
      payload.user_id = company.userId;
    }
    const { error } = await supabase.from("companies").upsert(payload);
    return !error;
  }

  /**
   * Fetch all candidates
   */
  static async getCandidates(): Promise<CandidateProfile[]> {
    const { data, error } = await supabase.from("candidates").select("*");
    if (error || !data) {
      console.warn("Failed to fetch candidates from Supabase:", error);
      return [];
    }

    return data.map((cand) => ({
      id: cand.id,
      userId: cand.user_id,
      fullName: cand.full_name,
      headline: cand.headline,
      email: cand.email,
      phone: cand.phone || "",
      location: cand.location,
      workPreference: cand.work_preference || "Hybrid",
      yearsOfExperience: Number(cand.years_of_experience || 0),
      skills: cand.skills || [],
      possibleRoles: cand.possible_roles || [],
      education: (cand.education as any) || [],
      experience: (cand.experience as any) || [],
      projects: (cand.projects as any) || [],
      certifications: cand.certifications || [],
      expectedSalary: cand.expected_salary || "",
      preferredRole: cand.preferred_role || "",
      bio: cand.bio || "",
      profilePhoto: cand.profile_photo || "",
      profileStrength: Number(cand.profile_strength || 0),
      isCompleted: !!cand.is_completed,
      resumeFilename: cand.resume_filename || undefined,
      resumeText: cand.resume_text || undefined,
      learnedPreferences: (cand.learned_preferences as any) || undefined,
    }));
  }

  /**
   * Save or update candidate
   */
  static async saveCandidate(cand: CandidateProfile): Promise<boolean> {
    const payload: any = {
      id: cand.id,
      full_name: cand.fullName,
      headline: cand.headline,
      email: cand.email,
      phone: cand.phone,
      location: cand.location,
      work_preference: cand.workPreference,
      years_of_experience: cand.yearsOfExperience,
      skills: cand.skills,
      possible_roles: cand.possibleRoles,
      education: cand.education as any,
      experience: cand.experience as any,
      projects: cand.projects as any,
      certifications: cand.certifications,
      expected_salary: cand.expectedSalary,
      preferred_role: cand.preferredRole,
      bio: cand.bio,
      profile_photo: cand.profilePhoto,
      profile_strength: cand.profileStrength,
      is_completed: cand.isCompleted,
      resume_filename: cand.resumeFilename,
      resume_text: cand.resumeText,
      learned_preferences: cand.learnedPreferences as any,
      updated_at: new Date().toISOString(),
    };
    if (cand.userId) {
      payload.user_id = cand.userId;
    }
    const { error } = await supabase.from("candidates").upsert(payload);
    return !error;
  }

  /**
   * Fetch all jobs with joined company info
   */
  static async getJobs(): Promise<Job[]> {
    const { data, error } = await supabase
      .from("jobs")
      .select("*, companies(*)");

    if (error || !data) {
      console.warn("Failed to fetch jobs from Supabase:", error);
      return [];
    }

    return data.map((j: any) => {
      const comp = j.companies || {};
      return {
        id: j.id,
        companyId: j.company_id,
        companyName: comp.company_name || "Company",
        companyLogo: comp.logo || "",
        companyIndustry: comp.industry,
        companySize: comp.size,
        title: j.title,
        department: j.department,
        location: j.location,
        workMode: j.work_mode,
        experience: j.experience,
        salary: j.salary,
        openings: j.openings || 1,
        description: j.description,
        responsibilities: j.responsibilities || [],
        requirements: j.requirements || [],
        requiredSkills: j.required_skills || [],
        preferredSkills: j.preferred_skills || [],
        status: j.status || "active",
        matchScore: j.match_score || undefined,
        matchReasons: j.match_reasons || [],
        matchConcerns: j.match_concerns || [],
        aiSummary: j.ai_summary || undefined,
        createdAt: j.created_at,
        updatedAt: j.updated_at,
      };
    });
  }

  /**
   * Save or insert job
   */
  static async saveJob(job: Job): Promise<boolean> {
    const { error } = await supabase.from("jobs").upsert({
      id: job.id,
      company_id: job.companyId,
      title: job.title,
      department: job.department,
      location: job.location,
      work_mode: job.workMode,
      experience: job.experience,
      salary: job.salary,
      openings: job.openings,
      description: job.description,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      required_skills: job.requiredSkills,
      preferred_skills: job.preferredSkills,
      status: job.status,
      match_score: job.matchScore,
      match_reasons: job.matchReasons,
      match_concerns: job.matchConcerns,
      ai_summary: job.aiSummary,
      created_at: job.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return !error;
  }

  /**
   * Fetch all applications with joined candidate, job, and company info
   */
  static async getApplications(): Promise<Application[]> {
    const { data, error } = await supabase
      .from("applications")
      .select("*, candidates(*), jobs(*), companies(*)");

    if (error || !data) {
      console.warn("Failed to fetch applications from Supabase:", error);
      return [];
    }

    return data.map((app: any) => {
      const cand = app.candidates || {};
      const job = app.jobs || {};
      const comp = app.companies || {};

      return {
        id: app.id,
        jobId: app.job_id,
        candidateId: app.candidate_id,
        companyId: app.company_id,
        candidateName: cand.full_name || "Applicant",
        candidateHeadline: cand.headline || "",
        candidatePhoto: cand.profile_photo || "",
        candidateLocation: cand.location || "",
        candidateSkills: cand.skills || [],
        candidateExpYears: Number(cand.years_of_experience || 0),
        candidateEmail: cand.email || "",
        candidatePhone: cand.phone || "",
        candidateBio: cand.bio || "",
        candidateExpectedSalary: cand.expected_salary,
        candidateWorkPreference: cand.work_preference,
        candidateExperienceList: cand.experience,
        candidateEducationList: cand.education,
        candidateProjectsList: cand.projects,
        jobTitle: job.title || "Position",
        companyName: comp.company_name || "Company",
        companyLogo: comp.logo || "",
        jobLocation: job.location || "",
        jobSalary: job.salary || "",
        jobWorkMode: job.work_mode || "Hybrid",
        status: app.status || "applied",
        appliedAt: app.applied_at,
        lastUpdatedAt: app.last_updated_at,
        matchScore: app.match_score || 85,
        matchReasons: app.match_reasons || [],
        matchConcerns: app.match_concerns || [],
        aiSummary: app.ai_summary || "",
        matchedSkills: app.matched_skills || [],
        missingSkills: app.missing_skills || [],
        fitVerdict: app.fit_verdict || undefined,
        strengths: app.strengths || [],
        interviewQuestions: app.interview_questions || [],
        interviewDetails: app.interview_details || undefined,
        notes: app.notes || undefined,
        isExpired: !!app.is_expired,
        companySlaBadge: app.company_sla_badge || undefined,
        companySlaAvgHours: app.company_sla_avg_hours ? Number(app.company_sla_avg_hours) : undefined,
        slaDeadline: app.sla_deadline || undefined,
        pulseSteps: app.pulse_steps || [],
        constructiveFeedback: app.constructive_feedback || undefined,
        timeline: app.timeline || [],
        hiddenFromCompany: !!app.hidden_from_company,
        deletedByCompany: !!app.deleted_by_company,
        rejectedAt: app.rejected_at || undefined,
        rejectionReason: app.rejection_reason || undefined,
      };
    });
  }

  /**
   * Save or update an application
   */
  static async saveApplication(app: Application): Promise<boolean> {
    const { error } = await supabase.from("applications").upsert({
      id: app.id,
      job_id: app.jobId,
      candidate_id: app.candidateId,
      company_id: app.companyId,
      status: app.status,
      match_score: app.matchScore,
      fit_verdict: app.fitVerdict,
      matched_skills: app.matchedSkills,
      missing_skills: app.missingSkills,
      match_reasons: app.matchReasons,
      match_concerns: app.matchConcerns,
      strengths: app.strengths,
      ai_summary: app.aiSummary,
      interview_questions: app.interviewQuestions,
      interview_details: app.interviewDetails as any,
      notes: app.notes,
      company_sla_badge: app.companySlaBadge,
      company_sla_avg_hours: app.companySlaAvgHours,
      sla_deadline: app.slaDeadline,
      pulse_steps: app.pulseSteps as any,
      constructive_feedback: app.constructiveFeedback as any,
      timeline: app.timeline as any,
      is_expired: app.isExpired,
      hidden_from_company: app.hiddenFromCompany,
      deleted_by_company: app.deletedByCompany,
      rejected_at: app.rejectedAt,
      rejection_reason: app.rejectionReason,
      applied_at: app.appliedAt || new Date().toISOString(),
      last_updated_at: new Date().toISOString(),
    });
    return !error;
  }

  /**
   * Fetch Blind Talent Profiles
   */
  static async getBlindTalentProfiles(): Promise<BlindTalentProfile[]> {
    const { data, error } = await supabase
      .from("blind_talent_profiles")
      .select("*");

    if (error || !data) {
      console.warn("Failed to fetch blind talent profiles from Supabase:", error);
      return [];
    }

    return data.map((b) => ({
      id: b.id,
      candidateId: b.candidate_id,
      anonymousHandle: b.anonymous_handle,
      avatarSeed: b.avatar_seed,
      headline: b.headline,
      experienceYears: Number(b.experience_years),
      location: b.location,
      workPreference: b.work_preference,
      verifiedSkills: (b.verified_skills as any) || [],
      proofOfWork: (b.proof_of_work as any) || [],
      targetSalaryRange: b.target_salary_range,
      preferredRoles: b.preferred_roles || [],
      availabilityNotice: b.availability_notice,
      superpowers: b.superpowers || [],
      isListed: !!b.is_listed,
      activeBidsCount: b.active_bids_count || 0,
    }));
  }

  /**
   * Save or update a Blind Talent Profile
   */
  static async saveBlindTalentProfile(profile: BlindTalentProfile): Promise<boolean> {
    const { error } = await supabase.from("blind_talent_profiles").upsert({
      id: profile.id,
      candidate_id: profile.candidateId,
      anonymous_handle: profile.anonymousHandle,
      avatar_seed: profile.avatarSeed,
      headline: profile.headline,
      experience_years: profile.experienceYears,
      location: profile.location,
      work_preference: profile.workPreference,
      verified_skills: profile.verifiedSkills as any,
      proof_of_work: profile.proofOfWork as any,
      target_salary_range: profile.targetSalaryRange,
      preferred_roles: profile.preferredRoles,
      availability_notice: profile.availabilityNotice,
      superpowers: profile.superpowers,
      is_listed: profile.isListed,
      active_bids_count: profile.activeBidsCount,
    });
    if (error) {
      console.warn("Failed to save blind talent profile to Supabase:", error);
    }
    return !error;
  }

  /**
   * Fetch Talent Bids with joined company details
   */
  static async getTalentBids(): Promise<TalentBid[]> {
    const { data, error } = await supabase
      .from("talent_bids")
      .select("*, companies(*)");

    if (error || !data) {
      console.warn("Failed to fetch talent bids from Supabase:", error);
      return [];
    }

    return data.map((b: any) => {
      const comp = b.companies || {};
      return {
        id: b.id,
        blindTalentId: b.blind_talent_id,
        candidateId: b.candidate_id,
        companyId: b.company_id,
        companyName: comp.company_name || "Company",
        companyLogo: comp.logo || "",
        companyIndustry: comp.industry || "Tech",
        companyLocation: comp.location || "Remote",
        jobId: b.job_id || undefined,
        jobTitle: b.job_title,
        seniorityTier: b.seniority_tier,
        salaryOffer: b.salary_offer,
        bonusAndEquity: b.bonus_and_equity || undefined,
        workMode: b.work_mode,
        pitchMessage: b.pitch_message,
        perks: b.perks || [],
        status: b.status || "pending",
        candidateRevealedName: b.candidate_revealed_name || undefined,
        candidateRevealedEmail: b.candidate_revealed_email || undefined,
        candidateRevealedPhone: b.candidate_revealed_phone || undefined,
        candidateRevealedPhoto: b.candidate_revealed_photo || undefined,
        counterOfferDetails: b.counter_offer_details || undefined,
        expiresAt: b.expires_at,
        createdAt: b.created_at,
      };
    });
  }

  /**
   * Save or update a talent bid
   */
  static async saveTalentBid(bid: TalentBid): Promise<boolean> {
    const { error } = await supabase.from("talent_bids").upsert({
      id: bid.id,
      blind_talent_id: bid.blindTalentId,
      candidate_id: bid.candidateId,
      company_id: bid.companyId,
      job_id: bid.jobId,
      job_title: bid.jobTitle,
      seniority_tier: bid.seniorityTier,
      salary_offer: bid.salaryOffer,
      bonus_and_equity: bid.bonusAndEquity,
      work_mode: bid.workMode,
      pitch_message: bid.pitchMessage,
      perks: bid.perks,
      status: bid.status,
      candidate_revealed_name: bid.candidateRevealedName,
      candidate_revealed_email: bid.candidateRevealedEmail,
      candidate_revealed_phone: bid.candidateRevealedPhone,
      candidate_revealed_photo: bid.candidateRevealedPhoto,
      counter_offer_details: bid.counterOfferDetails as any,
      expires_at: bid.expiresAt,
      created_at: bid.createdAt || new Date().toISOString(),
    });
    return !error;
  }

  /**
   * Log swipe interaction
   */
  static async logSwipe(interaction: SwipeInteraction): Promise<boolean> {
    const { error } = await supabase.from("swipe_interactions").insert({
      candidate_id: interaction.candidateId,
      job_id: interaction.jobId,
      action: interaction.action,
      job_tags: interaction.jobTags,
      work_mode: interaction.workMode,
    });
    return !error;
  }

  /**
   * Fetch company SLAs
   */
  static async getCompanySLAs(): Promise<Record<string, CompanySLAInfo>> {
    const { data, error } = await supabase.from("company_slas").select("*");
    if (error || !data) return {};

    const map: Record<string, CompanySLAInfo> = {};
    data.forEach((s) => {
      map[s.company_id] = {
        companyId: s.company_id,
        companyName: s.company_name,
        avgResponseHours: Number(s.avg_response_hours),
        ghostingRatePct: Number(s.ghosting_rate_pct),
        feedbackGuaranteePct: Number(s.feedback_guarantee_pct),
        badgeLabel: s.badge_label,
        badgeTier: s.badge_tier as any,
        totalApplicationsReviewed: s.total_applications_reviewed,
      };
    });
    return map;
  }

  /**
   * Fetch Notifications
   */
  static async getNotifications(): Promise<NotificationItem[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((n) => ({
      id: n.id,
      recipientId: n.recipient_id,
      role: n.role as any,
      title: n.title,
      message: n.message,
      type: n.type as any,
      timestamp: n.created_at,
      read: !!n.is_read,
      linkAction: n.link_action || undefined,
    }));
  }

  /**
   * Save notification
   */
  static async saveNotification(n: NotificationItem): Promise<boolean> {
    const { error } = await supabase.from("notifications").upsert({
      id: n.id,
      recipient_id: n.recipientId,
      role: n.role,
      title: n.title,
      message: n.message,
      type: n.type,
      is_read: n.read,
      link_action: n.linkAction,
      created_at: n.timestamp || new Date().toISOString(),
    });
    return !error;
  }

  /**
   * Fetch Admin Reports
   */
  static async getAdminReports(): Promise<AdminReport[]> {
    const { data, error } = await supabase.from("admin_reports").select("*");
    if (error || !data) return [];
    return data.map((r) => ({
      id: r.id,
      targetType: r.target_type as any,
      targetId: r.target_id,
      targetName: r.target_name,
      reason: r.reason,
      reportedBy: r.reported_by,
      createdAt: r.created_at,
      status: (r.status as any) || "pending",
    }));
  }

  /**
   * Fetch Email & WhatsApp templates
   */
  static async getEmailTemplates(): Promise<EmailTemplate[]> {
    const { data, error } = await supabase.from("email_templates").select("*");
    if (error || !data) return [];
    return data.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category as any,
      subject: t.subject,
      bodyTemplate: t.body_template,
    }));
  }

  static async getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
    const { data, error } = await supabase
      .from("whatsapp_templates")
      .select("*");
    if (error || !data) return [];
    return data.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category as any,
      messageTemplate: t.message_template,
    }));
  }
}
