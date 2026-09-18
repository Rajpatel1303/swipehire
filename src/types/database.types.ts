export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reported_by: string
          status: string | null
          target_id: string
          target_name: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id: string
          reason: string
          reported_by: string
          status?: string | null
          target_id: string
          target_name: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reported_by?: string
          status?: string | null
          target_id?: string
          target_name?: string
          target_type?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          ai_summary: string | null
          applied_at: string
          candidate_id: string
          company_id: string
          company_sla_avg_hours: number | null
          company_sla_badge: string | null
          constructive_feedback: Json | null
          deleted_by_company: boolean | null
          fit_verdict: string | null
          hidden_from_company: boolean | null
          id: string
          interview_details: Json | null
          interview_questions: string[] | null
          is_expired: boolean | null
          job_id: string
          last_updated_at: string
          match_concerns: string[] | null
          match_reasons: string[] | null
          match_score: number | null
          matched_skills: string[] | null
          missing_skills: string[] | null
          notes: string | null
          pulse_steps: Json | null
          rejected_at: string | null
          rejection_reason: string | null
          sla_deadline: string | null
          status: string | null
          strengths: string[] | null
          timeline: Json | null
        }
        Insert: {
          ai_summary?: string | null
          applied_at?: string
          candidate_id: string
          company_id: string
          company_sla_avg_hours?: number | null
          company_sla_badge?: string | null
          constructive_feedback?: Json | null
          deleted_by_company?: boolean | null
          fit_verdict?: string | null
          hidden_from_company?: boolean | null
          id: string
          interview_details?: Json | null
          interview_questions?: string[] | null
          is_expired?: boolean | null
          job_id: string
          last_updated_at?: string
          match_concerns?: string[] | null
          match_reasons?: string[] | null
          match_score?: number | null
          matched_skills?: string[] | null
          missing_skills?: string[] | null
          notes?: string | null
          pulse_steps?: Json | null
          rejected_at?: string | null
          rejection_reason?: string | null
          sla_deadline?: string | null
          status?: string | null
          strengths?: string[] | null
          timeline?: Json | null
        }
        Update: {
          ai_summary?: string | null
          applied_at?: string
          candidate_id?: string
          company_id?: string
          company_sla_avg_hours?: number | null
          company_sla_badge?: string | null
          constructive_feedback?: Json | null
          deleted_by_company?: boolean | null
          fit_verdict?: string | null
          hidden_from_company?: boolean | null
          id?: string
          interview_details?: Json | null
          interview_questions?: string[] | null
          is_expired?: boolean | null
          job_id?: string
          last_updated_at?: string
          match_concerns?: string[] | null
          match_reasons?: string[] | null
          match_score?: number | null
          matched_skills?: string[] | null
          missing_skills?: string[] | null
          notes?: string | null
          pulse_steps?: Json | null
          rejected_at?: string | null
          rejection_reason?: string | null
          sla_deadline?: string | null
          status?: string | null
          strengths?: string[] | null
          timeline?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      blind_talent_profiles: {
        Row: {
          active_bids_count: number | null
          anonymous_handle: string
          availability_notice: string
          avatar_seed: string
          candidate_id: string
          created_at: string
          experience_years: number
          headline: string
          id: string
          is_listed: boolean | null
          location: string
          preferred_roles: string[] | null
          proof_of_work: Json
          superpowers: string[] | null
          target_salary_range: string
          verified_skills: Json
          work_preference: string
        }
        Insert: {
          active_bids_count?: number | null
          anonymous_handle: string
          availability_notice: string
          avatar_seed: string
          candidate_id: string
          created_at?: string
          experience_years: number
          headline: string
          id: string
          is_listed?: boolean | null
          location: string
          preferred_roles?: string[] | null
          proof_of_work?: Json
          superpowers?: string[] | null
          target_salary_range: string
          verified_skills?: Json
          work_preference: string
        }
        Update: {
          active_bids_count?: number | null
          anonymous_handle?: string
          availability_notice?: string
          avatar_seed?: string
          candidate_id?: string
          created_at?: string
          experience_years?: number
          headline?: string
          id?: string
          is_listed?: boolean | null
          location?: string
          preferred_roles?: string[] | null
          proof_of_work?: Json
          superpowers?: string[] | null
          target_salary_range?: string
          verified_skills?: Json
          work_preference?: string
        }
        Relationships: [
          {
            foreignKeyName: "blind_talent_profiles_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          bio: string | null
          certifications: string[] | null
          created_at: string
          education: Json | null
          email: string
          expected_salary: string | null
          experience: Json | null
          full_name: string
          headline: string
          id: string
          is_completed: boolean | null
          is_suspended?: boolean | null
          learned_preferences: Json | null
          location: string
          phone: string | null
          possible_roles: string[] | null
          preferred_role: string | null
          profile_photo: string | null
          photo_settings?: Json | null
          profile_strength: number | null
          projects: Json | null
          resume_filename: string | null
          resume_text: string | null
          commission_agreement_signed: boolean | null
          commission_agreement_signed_at: string | null
          commission_agreement_doc_id: string | null
          commission_agreement_signature: Json | null
          github_data?: Json | null
          skills: string[] | null
          updated_at: string
          user_id: string | null
          work_preference: string | null
          years_of_experience: number
        }
        Insert: {
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          education?: Json | null
          email: string
          expected_salary?: string | null
          experience?: Json | null
          full_name: string
          headline: string
          id: string
          is_completed?: boolean | null
          is_suspended?: boolean | null
          learned_preferences?: Json | null
          location: string
          phone?: string | null
          possible_roles?: string[] | null
          preferred_role?: string | null
          profile_photo?: string | null
          photo_settings?: Json | null
          profile_strength?: number | null
          projects?: Json | null
          resume_filename?: string | null
          resume_text?: string | null
          commission_agreement_signed?: boolean | null
          commission_agreement_signed_at?: string | null
          commission_agreement_doc_id?: string | null
          commission_agreement_signature?: Json | null
          github_data?: Json | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string | null
          work_preference?: string | null
          years_of_experience?: number
        }
        Update: {
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          education?: Json | null
          email?: string
          expected_salary?: string | null
          experience?: Json | null
          full_name?: string
          headline?: string
          id?: string
          is_completed?: boolean | null
          is_suspended?: boolean | null
          learned_preferences?: Json | null
          location?: string
          phone?: string | null
          possible_roles?: string[] | null
          preferred_role?: string | null
          profile_photo?: string | null
          photo_settings?: Json | null
          profile_strength?: number | null
          projects?: Json | null
          resume_filename?: string | null
          resume_text?: string | null
          commission_agreement_signed?: boolean | null
          commission_agreement_signed_at?: string | null
          commission_agreement_doc_id?: string | null
          commission_agreement_signature?: Json | null
          github_data?: Json | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string | null
          work_preference?: string | null
          years_of_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "candidates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          about: string | null
          benefits: string[] | null
          company_name: string
          contact_person: string
          created_at: string
          culture: string[] | null
          email: string
          email_integration: Json | null
          id: string
          industry: string
          is_completed: boolean | null
          is_verified: boolean | null
          is_suspended?: boolean | null
          location: string
          logo: string | null
          photo_settings?: Json | null
          phone: string | null
          size: string
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          about?: string | null
          benefits?: string[] | null
          company_name: string
          contact_person: string
          created_at?: string
          culture?: string[] | null
          email: string
          email_integration?: Json | null
          id: string
          industry: string
          is_completed?: boolean | null
          is_verified?: boolean | null
          is_suspended?: boolean | null
          location: string
          logo?: string | null
          photo_settings?: Json | null
          phone?: string | null
          size: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          about?: string | null
          benefits?: string[] | null
          company_name?: string
          contact_person?: string
          created_at?: string
          culture?: string[] | null
          email?: string
          email_integration?: Json | null
          id?: string
          industry?: string
          is_completed?: boolean | null
          is_verified?: boolean | null
          is_suspended?: boolean | null
          location?: string
          logo?: string | null
          photo_settings?: Json | null
          phone?: string | null
          size?: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_slas: {
        Row: {
          avg_response_hours: number
          badge_label: string
          badge_tier: string
          company_id: string
          company_name: string
          feedback_guarantee_pct: number
          ghosting_rate_pct: number
          total_applications_reviewed: number
          updated_at: string
        }
        Insert: {
          avg_response_hours?: number
          badge_label: string
          badge_tier: string
          company_id: string
          company_name: string
          feedback_guarantee_pct?: number
          ghosting_rate_pct?: number
          total_applications_reviewed?: number
          updated_at?: string
        }
        Update: {
          avg_response_hours?: number
          badge_label?: string
          badge_tier?: string
          company_id?: string
          company_name?: string
          feedback_guarantee_pct?: number
          ghosting_rate_pct?: number
          total_applications_reviewed?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_slas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_template: string
          category: string
          company_id: string | null
          created_at: string
          id: string
          subject: string
          title: string
        }
        Insert: {
          body_template: string
          category: string
          company_id?: string | null
          created_at?: string
          id: string
          subject: string
          title: string
        }
        Update: {
          body_template?: string
          category?: string
          company_id?: string | null
          created_at?: string
          id?: string
          subject?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          ai_summary: string | null
          company_id: string
          created_at: string
          department: string
          description: string
          experience: string
          id: string
          is_featured?: boolean | null
          location: string
          match_concerns: string[] | null
          match_reasons: string[] | null
          match_score: number | null
          openings: number
          preferred_skills: string[] | null
          required_skills: string[] | null
          requirements: string[] | null
          responsibilities: string[] | null
          salary: string
          status: string | null
          title: string
          updated_at: string
          work_mode: string
        }
        Insert: {
          ai_summary?: string | null
          company_id: string
          created_at?: string
          department: string
          description: string
          experience: string
          id: string
          is_featured?: boolean | null
          location: string
          match_concerns?: string[] | null
          match_reasons?: string[] | null
          match_score?: number | null
          openings?: number
          preferred_skills?: string[] | null
          required_skills?: string[] | null
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary: string
          status?: string | null
          title: string
          updated_at?: string
          work_mode: string
        }
        Update: {
          ai_summary?: string | null
          company_id?: string
          created_at?: string
          department?: string
          description?: string
          experience?: string
          id?: string
          is_featured?: boolean | null
          location?: string
          match_concerns?: string[] | null
          match_reasons?: string[] | null
          match_score?: number | null
          openings?: number
          preferred_skills?: string[] | null
          required_skills?: string[] | null
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary?: string
          status?: string | null
          title?: string
          updated_at?: string
          work_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link_action: string | null
          message: string
          recipient_id: string
          role: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id: string
          is_read?: boolean | null
          link_action?: string | null
          message: string
          recipient_id: string
          role: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link_action?: string | null
          message?: string
          recipient_id?: string
          role?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      swipe_interactions: {
        Row: {
          action: string
          candidate_id: string
          created_at: string
          id: string
          job_id: string
          job_tags: string[] | null
          work_mode: string | null
        }
        Insert: {
          action: string
          candidate_id: string
          created_at?: string
          id?: string
          job_id: string
          job_tags?: string[] | null
          work_mode?: string | null
        }
        Update: {
          action?: string
          candidate_id?: string
          created_at?: string
          id?: string
          job_id?: string
          job_tags?: string[] | null
          work_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "swipe_interactions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipe_interactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_bids: {
        Row: {
          blind_talent_id: string
          bonus_and_equity: string | null
          candidate_id: string
          candidate_revealed_email: string | null
          candidate_revealed_name: string | null
          candidate_revealed_phone: string | null
          candidate_revealed_photo: string | null
          company_id: string
          counter_offer_details: Json | null
          created_at: string
          expires_at: string
          id: string
          job_id: string | null
          job_title: string
          perks: string[] | null
          pitch_message: string
          salary_offer: string
          seniority_tier: string
          status: string | null
          work_mode: string
        }
        Insert: {
          blind_talent_id: string
          bonus_and_equity?: string | null
          candidate_id: string
          candidate_revealed_email?: string | null
          candidate_revealed_name?: string | null
          candidate_revealed_phone?: string | null
          candidate_revealed_photo?: string | null
          company_id: string
          counter_offer_details?: Json | null
          created_at?: string
          expires_at: string
          id: string
          job_id?: string | null
          job_title: string
          perks?: string[] | null
          pitch_message: string
          salary_offer: string
          seniority_tier: string
          status?: string | null
          work_mode: string
        }
        Update: {
          blind_talent_id?: string
          bonus_and_equity?: string | null
          candidate_id?: string
          candidate_revealed_email?: string | null
          candidate_revealed_name?: string | null
          candidate_revealed_phone?: string | null
          candidate_revealed_photo?: string | null
          company_id?: string
          counter_offer_details?: Json | null
          created_at?: string
          expires_at?: string
          id?: string
          job_id?: string | null
          job_title?: string
          perks?: string[] | null
          pitch_message?: string
          salary_offer?: string
          seniority_tier?: string
          status?: string | null
          work_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_bids_blind_talent_id_fkey"
            columns: ["blind_talent_id"]
            isOneToOne: false
            referencedRelation: "blind_talent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_bids_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_bids_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_bids_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          category: string
          company_id: string | null
          created_at: string
          id: string
          message_template: string
          title: string
        }
        Insert: {
          category: string
          company_id?: string | null
          created_at?: string
          id: string
          message_template: string
          title: string
        }
        Update: {
          category?: string
          company_id?: string | null
          created_at?: string
          id?: string
          message_template?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
