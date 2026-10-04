import { supabase } from "./client";
import {
  InterviewSession,
  InterviewQuestion,
  InterviewAnswer,
  InterviewEvaluation,
  InterviewType,
  InterviewMode,
} from "../../types";

export class SupabaseInterviewsService {
  /**
   * Create a new interview session in Supabase
   */
  static async createSession(params: {
    companyId: string;
    candidateId: string;
    jobId?: string;
    templateId?: string;
    interviewType: InterviewType;
    mode?: InterviewMode;
    totalPlannedQuestions?: number;
  }): Promise<InterviewSession> {
    const { data, error } = await supabase
      .from("interview_sessions" as any)
      .insert({
        company_id: params.companyId,
        candidate_id: params.candidateId,
        job_id: params.jobId || null,
        template_id: params.templateId || null,
        interview_type: params.interviewType,
        mode: params.mode || "chat",
        status: "in_progress",
        current_question_index: 1,
        total_planned_questions: params.totalPlannedQuestions || 5,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[Supabase createSession error]:", error);
      throw error;
    }

    return this.mapSession(data);
  }

  /**
   * Save initial generated questions for an interview session
   */
  static async saveQuestions(
    sessionId: string,
    questions: Array<{
      order: number;
      text: string;
      category?: string;
      difficulty?: string;
      source?: "company" | "ai_generated" | "follow_up";
      parentQuestionId?: string;
      idealCriteria?: string;
    }>
  ): Promise<InterviewQuestion[]> {
    const records = questions.map((q) => ({
      session_id: sessionId,
      question_order: q.order,
      question_text: q.text,
      category: q.category || "Technical",
      difficulty: q.difficulty || "Practical",
      source: q.source || "ai_generated",
      parent_question_id: q.parentQuestionId || null,
      ideal_criteria: q.idealCriteria || null,
    }));

    const { data, error } = await supabase
      .from("interview_questions" as any)
      .insert(records)
      .select()
      .order("question_order", { ascending: true });

    if (error) {
      console.error("[Supabase saveQuestions error]:", error);
      throw error;
    }

    return (data || []).map(this.mapQuestion);
  }

  /**
   * Save a single candidate answer & Gemma evaluation
   */
  static async saveAnswer(params: {
    sessionId: string;
    questionId: string;
    candidateId: string;
    questionText: string;
    answerText: string;
    answerQualityScore: number;
    aiAssessment?: string;
    followUpTriggered?: boolean;
    followUpQuestionId?: string;
    responseTimeSeconds?: number;
  }): Promise<InterviewAnswer> {
    const { data, error } = await supabase
      .from("interview_answers" as any)
      .insert({
        session_id: params.sessionId,
        question_id: params.questionId,
        candidate_id: params.candidateId,
        question_text: params.questionText,
        answer_text: params.answerText,
        answer_quality_score: params.answerQualityScore,
        ai_assessment: params.aiAssessment || null,
        follow_up_triggered: !!params.followUpTriggered,
        follow_up_question_id: params.followUpQuestionId || null,
        response_time_seconds: params.responseTimeSeconds || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("[Supabase saveAnswer error]:", error);
      throw error;
    }

    return this.mapAnswer(data);
  }

  /**
   * Save dynamic follow-up question
   */
  static async addFollowUpQuestion(params: {
    sessionId: string;
    order: number;
    text: string;
    parentQuestionId: string;
    category?: string;
  }): Promise<InterviewQuestion> {
    const { data, error } = await supabase
      .from("interview_questions" as any)
      .insert({
        session_id: params.sessionId,
        question_order: params.order,
        question_text: params.text,
        category: params.category || "Follow-up Deep Dive",
        difficulty: "In-Depth",
        source: "follow_up",
        parent_question_id: params.parentQuestionId,
      })
      .select()
      .single();

    if (error) {
      console.error("[Supabase addFollowUpQuestion error]:", error);
      throw error;
    }

    return this.mapQuestion(data);
  }

  /**
   * Save final comprehensive evaluation
   */
  static async saveEvaluation(params: {
    sessionId: string;
    companyId: string;
    candidateId: string;
    overallScore: number;
    technicalScore: number;
    problemSolvingScore: number;
    projectUnderstandingScore: number;
    communicationScore: number;
    roleKnowledgeScore: number;
    verdict: string;
    strengths: string[];
    areasToExplore: string[];
    aiSummary: string;
    detailedFeedback?: Record<string, any>;
  }): Promise<InterviewEvaluation> {
    const { data, error } = await supabase
      .from("interview_evaluations" as any)
      .upsert({
        session_id: params.sessionId,
        company_id: params.companyId,
        candidate_id: params.candidateId,
        overall_score: params.overallScore,
        technical_score: params.technicalScore,
        problem_solving_score: params.problemSolvingScore,
        project_understanding_score: params.projectUnderstandingScore,
        communication_score: params.communicationScore,
        role_knowledge_score: params.roleKnowledgeScore,
        verdict: params.verdict,
        strengths: params.strengths,
        areas_to_explore: params.areasToExplore,
        ai_summary: params.aiSummary,
        detailed_feedback: params.detailedFeedback || {},
      }, { onConflict: "session_id" })
      .select()
      .single();

    if (error) {
      console.error("[Supabase saveEvaluation error]:", error);
      throw error;
    }

    // Also update session to completed
    await supabase
      .from("interview_sessions" as any)
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.sessionId);

    return this.mapEvaluation(data);
  }

  /**
   * Get complete interview session with questions, answers, and evaluation
   */
  static async getSession(sessionId: string): Promise<InterviewSession | null> {
    const { data: sessionData, error: sessionErr } = await supabase
      .from("interview_sessions" as any)
      .select(`
        *,
        companies (id, company_name),
        candidates (id, full_name, headline, profile_photo),
        jobs (id, title)
      `)
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionErr || !sessionData) {
      if (sessionErr) console.warn("[Supabase getSession error]:", sessionErr);
      return null;
    }

    // Load questions
    const { data: qData } = await supabase
      .from("interview_questions" as any)
      .select("*")
      .eq("session_id", sessionId)
      .order("question_order", { ascending: true });

    // Load answers
    const { data: aData } = await supabase
      .from("interview_answers" as any)
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    // Load evaluation
    const { data: evalData } = await supabase
      .from("interview_evaluations" as any)
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();

    const s: any = sessionData;
    const session = this.mapSession(s);
    session.jobTitle = s.jobs?.title || "Position";
    session.companyName = s.companies?.company_name || "Company";
    session.candidateName = s.candidates?.full_name || "Candidate";
    session.candidateHeadline = s.candidates?.headline || "";
    session.candidatePhoto = s.candidates?.profile_photo || "";
    session.questions = (qData || []).map(this.mapQuestion);
    session.answers = (aData || []).map(this.mapAnswer);
    session.evaluation = evalData ? this.mapEvaluation(evalData) : undefined;

    return session;
  }

  /**
   * List all sessions for a company
   */
  static async listCompanySessions(companyId: string): Promise<InterviewSession[]> {
    const { data, error } = await supabase
      .from("interview_sessions" as any)
      .select(`
        *,
        companies (id, company_name),
        candidates (id, full_name, headline, profile_photo),
        jobs (id, title)
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    // Also fetch evaluations for these sessions
    const sessionIds = data.map((s: any) => s.id);
    let evalMap: Record<string, any> = {};
    if (sessionIds.length > 0) {
      const { data: evals } = await supabase
        .from("interview_evaluations" as any)
        .select("*")
        .in("session_id", sessionIds);
      (evals || []).forEach((e: any) => {
        evalMap[e.session_id] = this.mapEvaluation(e);
      });
    }

    return data.map((s: any) => {
      const mapped = this.mapSession(s);
      mapped.jobTitle = s.jobs?.title || "Role";
      mapped.companyName = s.companies?.company_name || "Company";
      mapped.candidateName = s.candidates?.full_name || "Candidate";
      mapped.candidateHeadline = s.candidates?.headline || "";
      mapped.candidatePhoto = s.candidates?.profile_photo || "";
      mapped.evaluation = evalMap[s.id];
      return mapped;
    });
  }

  /**
   * Update session question index
   */
  static async updateCurrentQuestionIndex(sessionId: string, newIndex: number): Promise<void> {
    await supabase
      .from("interview_sessions" as any)
      .update({
        current_question_index: newIndex,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);
  }

  // Mapper helpers
  private static mapSession(row: any): InterviewSession {
    return {
      id: row.id,
      companyId: row.company_id,
      candidateId: row.candidate_id,
      jobId: row.job_id,
      templateId: row.template_id,
      interviewType: row.interview_type,
      mode: row.mode,
      status: row.status,
      currentQuestionIndex: row.current_question_index,
      totalPlannedQuestions: row.total_planned_questions,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapQuestion(row: any): InterviewQuestion {
    return {
      id: row.id,
      sessionId: row.session_id,
      templateId: row.template_id,
      questionOrder: row.question_order,
      questionText: row.question_text,
      category: row.category,
      difficulty: row.difficulty,
      source: row.source,
      parentQuestionId: row.parent_question_id,
      idealCriteria: row.ideal_criteria,
      createdAt: row.created_at,
    };
  }

  private static mapAnswer(row: any): InterviewAnswer {
    return {
      id: row.id,
      sessionId: row.session_id,
      questionId: row.question_id,
      candidateId: row.candidate_id,
      questionText: row.question_text,
      answerText: row.answer_text,
      answerQualityScore: Number(row.answer_quality_score) || 0,
      aiAssessment: row.ai_assessment,
      followUpTriggered: row.follow_up_triggered,
      followUpQuestionId: row.follow_up_question_id,
      responseTimeSeconds: row.response_time_seconds,
      audioUrl: row.audio_url || undefined,
      audioDurationSeconds: row.audio_duration_seconds ? Number(row.audio_duration_seconds) : undefined,
      createdAt: row.created_at,
    };
  }

  private static mapEvaluation(row: any): InterviewEvaluation {
    return {
      id: row.id,
      sessionId: row.session_id,
      companyId: row.company_id,
      candidateId: row.candidate_id,
      overallScore: row.overall_score,
      technicalScore: row.technical_score,
      problemSolvingScore: row.problem_solving_score,
      projectUnderstandingScore: row.project_understanding_score,
      communicationScore: row.communication_score,
      roleKnowledgeScore: row.role_knowledge_score,
      verdict: row.verdict,
      strengths: row.strengths || [],
      areasToExplore: row.areas_to_explore || [],
      aiSummary: row.ai_summary,
      detailedFeedback: row.detailed_feedback,
      proctoringMetrics: row.detailed_feedback?.proctoring || undefined,
      createdAt: row.created_at,
    };
  }
}
