import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  User,
  Send,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  FileCheck,
  Loader2,
  ChevronRight,
  CornerDownRight,
  ShieldCheck,
} from "lucide-react";
import { Job, CandidateProfile, InterviewSession, InterviewQuestion } from "../../types";
import {
  isEvasiveOrNonResponsive,
  computeCalibratedInterviewEvaluation,
} from "../../services/ai/interviewEvaluator";
import { getAuthHeaders } from "../../services/supabase/client";

interface AIInterviewChatRoomProps {
  session: InterviewSession;
  initialQuestions: InterviewQuestion[];
  job: Job;
  candidate: CandidateProfile;
  onClose: () => void;
  onFinishInterview: (evaluation: any, fullQAs: any[]) => void | Promise<any>;
}

interface ChatMessage {
  id: string;
  sender: "ai" | "candidate";
  text: string;
  timestamp: string;
  isFollowUp?: boolean;
  questionOrder?: number;
  category?: string;
  evaluation?: {
    qualityScore: number;
    assessment: string;
  };
}

export const AIInterviewChatRoom: React.FC<AIInterviewChatRoomProps> = ({
  session,
  initialQuestions,
  job,
  candidate,
  onClose,
  onFinishInterview,
}) => {
  // Safe helper to extract non-empty question text
  const getQuestionText = (q: any): string => {
    if (!q) return "Could you describe your technical implementation and key trade-offs for this scenario?";
    const txt = q.questionText || q.question || q.question_text;
    if (typeof txt === "string" && txt.trim().length > 0) return txt.trim();
    return "Could you describe your technical implementation and key trade-offs for this scenario?";
  };

  // Pre-normalize incoming questions and eliminate any duplicate question texts
  const [questions, setQuestions] = useState<InterviewQuestion[]>(() => {
    const rawList = Array.isArray(initialQuestions) && initialQuestions.length > 0 ? initialQuestions : [];
    if (rawList.length === 0) {
      return [
        {
          id: `iq_fallback_1`,
          sessionId: session?.id || "sess_demo",
          questionOrder: 1,
          questionText: `Can you walk us through how you designed and implemented the architecture for your core projects with ${(job?.requiredSkills || ["your primary tech stack"])[0]}?`,
          category: "Architecture & Projects",
          difficulty: "Practical",
          source: "ai_generated",
          createdAt: new Date().toISOString(),
        },
      ];
    }
    const seenTexts = new Set<string>();
    const deduped: InterviewQuestion[] = [];
    rawList.forEach((q: any, i: number) => {
      const txt = getQuestionText(q);
      const norm = txt.toLowerCase().trim();
      if (!seenTexts.has(norm)) {
        seenTexts.add(norm);
        deduped.push({
          id: q.id || `iq_${i + 1}`,
          sessionId: q.sessionId || session?.id,
          questionOrder: deduped.length + 1,
          questionText: txt,
          category: q.category || "Technical Evaluation",
          difficulty: q.difficulty || "Practical",
          source: q.source || "ai_generated",
          idealCriteria: q.idealCriteria || q.ideal_criteria || "Demonstrates practical engineering depth",
          createdAt: q.createdAt || new Date().toISOString(),
        });
      }
    });
    return deduped;
  });

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [candidateAnswer, setCandidateAnswer] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [hasCurrentQuestionHadFollowUp, setHasCurrentQuestionHadFollowUp] = useState<boolean>(false);

  // Chat message history
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Completed QA records for evaluation transcript
  const [qaHistory, setQaHistory] = useState<Array<{
    question: string;
    answer: string;
    qualityScore: number;
    assessment: string;
  }>>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSubmitting]);

  // Seed question or restore ongoing interview on mount
  useEffect(() => {
    if (questions.length > 0 && messages.length === 0) {
      const existingAnswers = Array.isArray(session?.answers) ? session.answers : [];
      if (existingAnswers.length > 0) {
        // Reconstruct previous Q&A turns so candidate resumes seamlessly
        const restoredMessages: ChatMessage[] = [];
        const restoredQa: Array<{ question: string; answer: string; qualityScore: number; assessment: string }> = [];
        const answeredTexts = new Set<string>();

        existingAnswers.forEach((ans, idx) => {
          answeredTexts.add(ans.questionText.toLowerCase().trim());
          restoredMessages.push({
            id: `msg_prev_q_${idx}`,
            sender: "ai",
            text: ans.questionText,
            timestamp: ans.createdAt ? new Date(ans.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
            isFollowUp: ans.followUpTriggered,
            questionOrder: idx + 1,
            category: "Technical Evaluation",
          });
          restoredMessages.push({
            id: `msg_prev_a_${idx}`,
            sender: "candidate",
            text: ans.answerText,
            timestamp: ans.createdAt ? new Date(ans.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
            evaluation: {
              qualityScore: ans.answerQualityScore,
              assessment: ans.aiAssessment || "",
            },
          });
          restoredQa.push({
            question: ans.questionText,
            answer: ans.answerText,
            qualityScore: ans.answerQualityScore,
            assessment: ans.aiAssessment || "",
          });
        });

        setQaHistory(restoredQa);

        // Find index of first unanswered question in questions
        const firstUnansweredIdx = questions.findIndex(
          (q) => !answeredTexts.has(getQuestionText(q).toLowerCase().trim())
        );

        if (firstUnansweredIdx !== -1) {
          setCurrentQuestionIdx(firstUnansweredIdx);
          const nextQ = questions[firstUnansweredIdx];
          restoredMessages.push({
            id: `msg_next_${Date.now()}`,
            sender: "ai",
            text: getQuestionText(nextQ),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isFollowUp: nextQ.source === "follow_up",
            questionOrder: firstUnansweredIdx + 1,
            category: nextQ.category || "Technical Evaluation",
          });
          setMessages(restoredMessages);
        } else {
          // All questions were previously answered
          setCurrentQuestionIdx(questions.length);
          setIsCompleted(true);
          setMessages(restoredMessages);
        }
      } else {
        // Fresh interview: ask question 0
        const q = questions[0];
        setMessages([
          {
            id: `msg_init_${Date.now()}`,
            sender: "ai",
            text: getQuestionText(q),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isFollowUp: q.source === "follow_up",
            questionOrder: 1,
            category: q.category || "Architecture & Projects",
          },
        ]);
      }
    }
  }, [questions, session?.answers]);

  const activeQuestion = questions[currentQuestionIdx];
  const totalQuestionsCount = questions.length;

  const handleSubmitAnswer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!candidateAnswer.trim() || isSubmitting || !activeQuestion) return;

    const answerToSubmit = candidateAnswer.trim();
    setCandidateAnswer("");
    setIsSubmitting(true);

    // 1. Append candidate message to chat
    const candMsgId = `msg_cand_${Date.now()}`;
    const newCandMsg: ChatMessage = {
      id: candMsgId,
      sender: "candidate",
      text: answerToSubmit,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newCandMsg]);

    try {
      // 2. Call evaluate-answer API (Google Gemma 4 26B)
      const headers = await getAuthHeaders({ "Content-Type": "application/json" });
      const res = await fetch("/api/ai/interview/evaluate-answer", {
        method: "POST",
        headers,
        body: JSON.stringify({
          sessionId: session.id,
          questionId: activeQuestion.id,
          candidateId: candidate.id,
          questionText: activeQuestion.questionText,
          answerText: answerToSubmit,
          questionIndex: currentQuestionIdx + 1,
          totalPlannedQuestions: totalQuestionsCount,
          job,
          candidate,
          previousQAs: qaHistory,
          hasTriggeredFollowUp: hasCurrentQuestionHadFollowUp,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Answer evaluation failed.");
      }

      // Record QA in transcript
      const newQaItem = {
        question: activeQuestion.questionText,
        answer: answerToSubmit,
        qualityScore: data.answerQuality || 0.8,
        assessment: data.assessment || "Practical candidate answer.",
      };
      const updatedQaHistory = [...qaHistory, newQaItem];
      setQaHistory(updatedQaHistory);

      // Attach evaluation feedback to candidate's message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === candMsgId
            ? {
                ...m,
                evaluation: {
                  qualityScore: data.answerQuality,
                  assessment: data.assessment,
                },
              }
            : m
        )
      );

      // Check if follow-up was triggered (strictly prohibited on evasive answers or duplicate questions)
      const isCandidateEvasive = (data.answerQuality ?? 0) < 0.35 || isEvasiveOrNonResponsive(answerToSubmit);
      const isQuestionDuplicate = questions.some(
        (q) => getQuestionText(q).toLowerCase().trim() === (data.nextQuestion || "").toLowerCase().trim()
      );

      if (data.followUpRequired && data.nextQuestion && !isCandidateEvasive && !isQuestionDuplicate) {
        setHasCurrentQuestionHadFollowUp(true);

        const followUpQ: InterviewQuestion = {
          id: data.followUpQuestionRecord?.id || `iq_fu_${Date.now()}`,
          sessionId: session.id,
          questionOrder: currentQuestionIdx + 2,
          questionText: data.nextQuestion,
          category: "Deep Dive Follow-up",
          difficulty: "In-Depth",
          source: "follow_up",
          createdAt: new Date().toISOString(),
        };

        // Insert follow-up question right after current question
        const updatedQuestions = [
          ...questions.slice(0, currentQuestionIdx + 1),
          followUpQ,
          ...questions.slice(currentQuestionIdx + 1),
        ];
        setQuestions(updatedQuestions);

        // Move to the follow-up question
        const nextIdx = currentQuestionIdx + 1;
        setCurrentQuestionIdx(nextIdx);

        // Append AI follow-up message to chat
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_fu_${Date.now()}`,
            sender: "ai",
            text: data.nextQuestion,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isFollowUp: true,
            questionOrder: nextIdx + 1,
            category: "Deep Dive Follow-up",
          },
        ]);
      } else {
        // No follow-up; advance to next planned question
        setHasCurrentQuestionHadFollowUp(false);
        const nextIdx = currentQuestionIdx + 1;

        if (nextIdx < questions.length) {
          setCurrentQuestionIdx(nextIdx);
          const nextQ = questions[nextIdx];
          const nextText = getQuestionText(nextQ);

          setMessages((prev) => [
            ...prev,
            {
              id: `msg_q_${Date.now()}`,
              sender: "ai",
              text: nextText,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isFollowUp: nextQ.source === "follow_up",
              questionOrder: nextIdx + 1,
              category: nextQ.category || "Technical Evaluation",
            },
          ]);
        } else {
          // All questions answered! Trigger Finalize
          setIsCompleted(true);
          await triggerFinalizeReport(updatedQaHistory);
        }
      }
    } catch (err: any) {
      console.error("[Evaluate Answer Error]:", err);
      // Fallback: advance to next question
      const nextIdx = currentQuestionIdx + 1;
      if (nextIdx < questions.length) {
        setCurrentQuestionIdx(nextIdx);
        const nextQ = questions[nextIdx];
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_q_${Date.now()}`,
            sender: "ai",
            text: getQuestionText(nextQ),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            questionOrder: nextIdx + 1,
            category: nextQ?.category || "Technical Evaluation",
          },
        ]);
      } else {
        setIsCompleted(true);
        await triggerFinalizeReport(qaHistory);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerFinalizeReport = async (history: any[]) => {
    setIsFinalizing(true);
    setIsCompleted(true);
    try {
      let finalEval: any = null;
      try {
        const headers = await getAuthHeaders({ "Content-Type": "application/json" });
        const res = await fetch("/api/ai/interview/finalize", {
          method: "POST",
          headers,
          body: JSON.stringify({
            sessionId: session.id,
            companyId: session.companyId,
            candidateId: session.candidateId,
            job,
            candidate,
            qaHistory: history,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.evaluation) {
            finalEval = data.evaluation;
          }
        }
      } catch (callErr) {
        console.warn("[triggerFinalizeReport] /api/ai/interview/finalize error, using calibrated fallback:", callErr);
      }

      if (!finalEval) {
        finalEval = computeCalibratedInterviewEvaluation({
          qaHistory: history,
          jobTitle: job?.title,
          requiredSkills: job?.requiredSkills,
          candidateName: candidate?.fullName,
        });
      }

      await onFinishInterview(finalEval, history);
    } catch (err: any) {
      console.error("[Finalize Report Error]:", err);
      // Fallback calibrated evaluation based on actual answers
      const fallbackEval = computeCalibratedInterviewEvaluation({
        qaHistory: history,
        jobTitle: job?.title,
        requiredSkills: job?.requiredSkills,
        candidateName: candidate?.fullName,
      });
      await onFinishInterview(fallbackEval, history);
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full h-[94vh] flex flex-col overflow-hidden">
        {/* Header (Section 10 Spec) */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">{job.title}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Interview
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Candidate: <strong className="text-white">{candidate.fullName}</strong> • Powered by <span className="text-indigo-300 font-bold">Google Gemma 4 26B</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Question Progress Pill */}
            <div className="px-3.5 py-1.5 bg-white/10 rounded-xl border border-white/10 text-xs font-black tracking-wider flex items-center gap-2">
              <span className="text-slate-400 uppercase text-[10px]">Progress</span>
              <span className="text-indigo-300 font-mono">
                {isCompleted
                  ? `${totalQuestionsCount} / ${totalQuestionsCount} ✓`
                  : `${Math.min(currentQuestionIdx + 1, totalQuestionsCount)} / ${totalQuestionsCount}`}
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close Interview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Stream (Section 10 Spec) */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-50/70">
          {messages.map((msg) => {
            const isAi = msg.sender === "ai";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isAi ? "items-start" : "items-end"} space-y-1.5 max-w-3xl ${
                  isAi ? "mr-auto" : "ml-auto"
                }`}
              >
                {/* Sender badge & timestamp */}
                <div className="flex items-center gap-2 px-1 text-[11px] font-bold text-slate-500">
                  {isAi ? (
                    <>
                      <div className="flex items-center gap-1 text-indigo-700">
                        <Bot className="w-3.5 h-3.5" />
                        <span>AI Interviewer (Gemma 4)</span>
                      </div>
                      {msg.isFollowUp && (
                        <span className="px-2 py-0.2 bg-amber-100 text-amber-900 rounded-md text-[9px] font-black uppercase tracking-wide flex items-center gap-1 border border-amber-300">
                          <CornerDownRight className="w-2.5 h-2.5" />
                          Adaptive Follow-up
                        </span>
                      )}
                      {msg.category && (
                        <span className="px-2 py-0.2 bg-slate-200 text-slate-700 rounded-md text-[9px] font-bold">
                          {msg.category}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span>{candidate.fullName}</span>
                      <User className="w-3.5 h-3.5 text-slate-600" />
                    </>
                  )}
                  <span className="text-slate-400 font-normal">{msg.timestamp}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                    isAi
                      ? "bg-white border-2 border-indigo-100 text-slate-900 rounded-tl-sm"
                      : "bg-indigo-600 text-white rounded-tr-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap font-medium">
                    {msg.text || "Could you walk through your technical implementation and key trade-offs for this scenario?"}
                  </p>
                </div>

                {/* Real-time AI Evaluation Pill on Candidate answers */}
                {msg.evaluation && (
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 animate-in fade-in">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <strong>Gemma Assessment ({Math.round(msg.evaluation.qualityScore * 100)}% Depth):</strong>{" "}
                      <span>{msg.evaluation.assessment}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Submitting / Evaluating Loader */}
          {isSubmitting && (
            <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900 max-w-md animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <div className="space-y-0.5">
                <p className="font-bold">Gemma 4 is evaluating your technical answer...</p>
                <p className="text-[10px] text-indigo-700">Checking architectural depth & preparing follow-up...</p>
              </div>
            </div>
          )}

          {/* Finalizing Loader */}
          {isFinalizing && (
            <div className="flex flex-col items-center justify-center p-8 bg-white border border-indigo-200 rounded-3xl text-center space-y-3 shadow-lg">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <h3 className="text-base font-black text-slate-900">Gemma 4 is compiling your Final Evaluation Report</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Aggregating technical scores, problem solving, project understanding, communication, strengths, and areas to explore...
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area or Completed Status Banner */}
        {!isFinalizing && !isCompleted ? (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white">
            <form onSubmit={handleSubmitAnswer} className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-bold text-slate-700">
                  Question {Math.min(currentQuestionIdx + 1, totalQuestionsCount)} of {totalQuestionsCount}
                </span>
                <span>Type your authentic technical answer below</span>
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  value={candidateAnswer}
                  onChange={(e) => setCandidateAnswer(e.target.value)}
                  placeholder="Type your answer here (e.g. explain your architecture, technologies used, tradeoffs)..."
                  disabled={isSubmitting}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none transition-all font-medium resize-none disabled:opacity-60"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSubmitAnswer();
                    }
                  }}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400">
                  Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">Ctrl + Enter</kbd> to submit
                </span>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="submit"
                    disabled={!candidateAnswer.trim() || isSubmitting}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Evaluating...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Answer</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">Interview Round Completed</h4>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  {isFinalizing ? "Gemma 4 is compiling your evaluation and delivering application..." : "All technical answers submitted. Application delivered to company."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isFinalizing ? "Submitting..." : "View Final Scorecard"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
