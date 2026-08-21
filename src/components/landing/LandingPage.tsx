import React, { useState } from "react";
import {
  Compass,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Building2,
  Users,
  ShieldCheck,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Briefcase,
  Star,
  MapPin,
  Clock,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../../context/AppContext";

export const LandingPage: React.FC = () => {
  const { setActiveView, setRole, triggerCelebration } = useApp();

  // Interactive mini card state for the live preview on hero
  const [demoIndex, setDemoIndex] = useState(0);
  const [demoAction, setDemoAction] = useState<"apply" | "skip" | null>(null);

  const demoJobs = [
    {
      title: "FRONTEND DEVELOPER",
      company: "ABC Technologies",
      location: "Ahmedabad · Hybrid",
      salary: "₹7–10 LPA",
      exp: "2–4 Years",
      score: 94,
      skills: ["React", "TypeScript", "Tailwind CSS", "REST APIs"],
      logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
    },
    {
      title: "FULL STACK ENGINEER",
      company: "Zephyr Cloud",
      location: "Ahmedabad · Hybrid",
      salary: "₹9–12 LPA",
      exp: "2–5 Years",
      score: 96,
      skills: ["React", "Node.js", "PostgreSQL", "Docker"],
      logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=80",
    },
    {
      title: "SENIOR UI/REACT DEVELOPER",
      company: "FinFlow Tech",
      location: "Bangalore · Remote",
      salary: "₹14–19 LPA",
      exp: "3–6 Years",
      score: 88,
      skills: ["React", "TypeScript", "Next.js", "State Arch"],
      logo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&auto=format&fit=crop&q=80",
    },
  ];

  const currentDemo = demoJobs[demoIndex % demoJobs.length];

  const handleDemoSwipe = (action: "apply" | "skip") => {
    setDemoAction(action);
    if (action === "apply") {
      triggerCelebration();
    }
    setTimeout(() => {
      setDemoIndex((prev) => prev + 1);
      setDemoAction(null);
    }, 450);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* Subtle Aura Lights */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-300 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-sky-300 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[450px] h-[450px] bg-orange-300 rounded-full blur-[120px]" />
      </div>

      {/* 1. HERO SECTION - BOLD TYPOGRAPHY STYLE */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Micro Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 shadow-2xs mb-6">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
            Next-Gen AI Career Radar & Recruiter Cockpit
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-slate-900 uppercase leading-[0.92] mb-6">
          HIRE <span className="text-orange-500 italic">FASTER.</span>
          <br />
          MATCH <span className="text-emerald-500">SMARTER.</span>
        </h1>

        <p className="text-slate-500 text-base sm:text-xl font-medium leading-relaxed max-w-2xl mx-auto mb-8">
          The intelligence-driven discovery platform where candidates swipe dream opportunities on a consumer-grade Career Radar, and hiring teams command candidate discovery in seconds.
        </p>

        {/* High Visibility Auth Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <button
            id="hero-signup-btn"
            onClick={() => setActiveView("auth-select")}
            className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-black text-xs sm:text-sm uppercase tracking-widest shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all cursor-pointer flex items-center gap-2 transform hover:-translate-y-0.5"
          >
            <span>Sign Up Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            id="hero-login-btn"
            onClick={() => setActiveView("candidate-login")}
            className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-black text-xs sm:text-sm uppercase tracking-widest shadow-md transition-all cursor-pointer flex items-center gap-2 transform hover:-translate-y-0.5"
          >
            <span>Log In</span>
          </button>
        </div>

        {/* Two High-Impact Experience Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-5xl mx-auto mb-16">
          {/* Candidate Card */}
          <div
            id="hero-candidate-card"
            onClick={() => {
              setActiveView("candidate-signup");
            }}
            className="group relative bg-emerald-50/80 border-2 border-emerald-500 rounded-[32px] p-8 sm:p-10 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/10 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="inline-block bg-emerald-500 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6">
                Candidate Experience
              </div>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none mb-4 text-slate-900">
                I'M LOOKING
                <br />
                FOR A JOB
              </h2>
              <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
                Upload your resume, let AI extract your superpower stack, and swipe through hyper-personalized opportunities with 90%+ match scoring.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-emerald-200">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-600 group-hover:text-emerald-700 flex items-center gap-2">
                Sign Up as Candidate <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
              </span>
              <span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs">
                →
              </span>
            </div>
          </div>

          {/* Company Card */}
          <div
            id="hero-company-card"
            onClick={() => {
              setActiveView("company-signup");
            }}
            className="group relative bg-sky-50/80 border-2 border-sky-500 rounded-[32px] p-8 sm:p-10 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-sky-500/10 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="inline-block bg-sky-500 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6">
                Company Experience
              </div>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none mb-4 text-slate-900">
                I'M LOOKING
                <br />
                FOR TALENT
              </h2>
              <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
                Draft high-converting job specs with ✦ AI, discover ranked talent with deep compatibility breakdowns, and trigger authentic Gmail/WhatsApp outreach.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-sky-200">
              <span className="text-xs font-black uppercase tracking-widest text-sky-600 group-hover:text-sky-700 flex items-center gap-2">
                Sign Up as Company <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
              </span>
              <span className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-black text-xs">
                →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE LIVE RADAR DEMO SECTION */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                Live Interactive Preview
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight uppercase leading-[0.95] text-slate-900">
                SWIPE RIGHT TO APPLY.
                <br />
                <span className="text-emerald-600">ZERO FORM FATIGUE.</span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed">
                Experience the exact consumer-grade interaction that candidates love. Swiping right applies instantly with your AI-verified profile; swiping left refines your recommendation vectors in real-time.
              </p>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="text-2xl font-black text-slate-900">94%</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Match Precision</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="text-2xl font-black text-emerald-600">3.2x</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Response Speed</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="text-2xl font-black text-orange-500">0</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clunky Forms</div>
                </div>
              </div>
            </div>

            {/* Interactive Card */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md bg-white rounded-[32px] shadow-xl border-2 border-slate-900 p-6">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Live Match Deck</span>
                  </div>
                  <span className="px-3 py-1 text-xs font-black uppercase tracking-widest bg-orange-500 text-white rounded-full">
                    {currentDemo.score}% MATCH
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={demoIndex}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      x: demoAction === "apply" ? 120 : demoAction === "skip" ? -120 : 0,
                      rotate: demoAction === "apply" ? 8 : demoAction === "skip" ? -8 : 0,
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 text-left"
                  >
                    <div className="flex items-start gap-3.5">
                      <img
                        src={currentDemo.logo}
                        alt="company"
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0"
                      />
                      <div>
                        <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight">{currentDemo.title}</h3>
                        <p className="text-xs font-bold text-slate-500">{currentDemo.company}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl text-xs text-slate-700 font-semibold border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-sky-500" />
                        <span>{currentDemo.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                        <span>{currentDemo.exp}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5 text-emerald-700 font-black">
                        <span>💰 {currentDemo.salary}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Required Core Stack</p>
                      <div className="flex flex-wrap gap-1.5">
                        {currentDemo.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-slate-100 text-slate-800 rounded-lg font-bold border border-slate-200"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Interactive Action Buttons */}
                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <button
                    id="landing-demo-skip-btn"
                    onClick={() => handleDemoSwipe("skip")}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50 text-slate-800 hover:text-orange-600 font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    <ThumbsDown className="w-4 h-4 text-orange-500" />
                    <span>← Skip</span>
                  </button>

                  <button
                    id="landing-demo-apply-btn"
                    onClick={() => handleDemoSwipe("apply")}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>Apply →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS - BOLD TYPOGRAPHY CARDS */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            System Workflow
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 uppercase tracking-tight mt-3">
            HOW SWIPEHIRED WORKS
          </h2>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-2">
            Two synchronized experiences built for speed, signal, and discovery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Candidate Workflow */}
          <div className="p-8 rounded-[32px] bg-slate-50 border-2 border-slate-200 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black">
                👤
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">For Candidates</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Swipe & Discovery Radar</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black flex items-center justify-center text-xs shrink-0">1</span>
                <div>
                  <strong className="text-slate-900 block text-xs uppercase font-black">AI Resume Ingestion</strong>
                  <p className="text-slate-600 font-medium mt-0.5">Upload PDF/DOC. Instant vector extraction of skills, projects, and target bands.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black flex items-center justify-center text-xs shrink-0">2</span>
                <div>
                  <strong className="text-slate-900 block text-xs uppercase font-black">Career Radar & Blind Bidding</strong>
                  <p className="text-slate-600 font-medium mt-0.5">Swipe to apply or list anonymously in the Reverse Marketplace where companies compete for you.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black flex items-center justify-center text-xs shrink-0">3</span>
                <div>
                  <strong className="text-slate-900 block text-xs uppercase font-black">Application Pulse & Anti-Ghosting SLA</strong>
                  <p className="text-slate-600 font-medium mt-0.5">Step-by-step review transparency, guaranteed response SLA badges, and AI constructive feedback.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setRole("candidate");
                setActiveView("candidate-radar");
              }}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              Open Candidate Experience →
            </button>
          </div>

          {/* Recruiter Workflow */}
          <div className="p-8 rounded-[32px] bg-slate-50 border-2 border-slate-200 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black">
                🏢
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">For Hiring Teams</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Intelligence Cockpit</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-black flex items-center justify-center text-xs shrink-0">1</span>
                <div>
                  <strong className="text-slate-900 block text-xs uppercase font-black">✦ Create with AI Job Builder</strong>
                  <p className="text-slate-600 font-medium mt-0.5">Prompt your role in plain English. AI crafts a verified JD in 5 seconds.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-black flex items-center justify-center text-xs shrink-0">2</span>
                <div>
                  <strong className="text-slate-900 block text-xs uppercase font-black">Ranked Radar & Blind Talent Bidding</strong>
                  <p className="text-slate-600 font-medium mt-0.5">Rank candidates by multidimensional match scores or bid upfront CTC on anonymous high-intent talent.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-black flex items-center justify-center text-xs shrink-0">3</span>
                <div>
                  <strong className="text-slate-900 block text-xs uppercase font-black">Direct Connect & SLA Badges</strong>
                  <p className="text-slate-600 font-medium mt-0.5">Earn verified "Fast Responder" response SLA badges and connect directly via Gmail or WhatsApp.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setRole("company");
                setActiveView("company-cockpit");
              }}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              Open Recruiter Cockpit →
            </button>
          </div>
        </div>
      </section>

      {/* 4. TESTIMONIALS */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Verified Testimonials</span>
            <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 mt-1">
              LOVED BY BUILDERS & HIRING LEADERS
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-white rounded-[24px] border border-slate-200 shadow-2xs space-y-3">
              <div className="flex text-orange-500 text-xs">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-orange-500" />
                ))}
              </div>
              <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                "Uploaded my resume, swiped on 4 roles, and had 2 interviews booked by afternoon. 10x faster than traditional job portals."
              </p>
              <div className="pt-2 flex items-center gap-2.5 border-t border-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                  alt="user"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-900">Raj Patel</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Full Stack Developer</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-[24px] border border-slate-200 shadow-2xs space-y-3">
              <div className="flex text-orange-500 text-xs">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-orange-500" />
                ))}
              </div>
              <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                "The ✦ AI Job Builder generates exact specs in seconds. The talent pipeline is pre-ranked so I don't waste hours filtering spam."
              </p>
              <div className="pt-2 flex items-center gap-2.5 border-t border-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=80"
                  alt="user"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-900">Sneha Kapadia</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Head of Talent @ ABC Tech</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-[24px] border border-slate-200 shadow-2xs space-y-3">
              <div className="flex text-orange-500 text-xs">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-orange-500" />
                ))}
              </div>
              <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                "Direct WhatsApp messaging and Google Calendar integration made interview scheduling instant. Game changer for high-growth tech teams."
              </p>
              <div className="pt-2 flex items-center gap-2.5 border-t border-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"
                  alt="user"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-900">Vikram Joshi</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Engineering Lead</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FINAL CALL TO ACTION */}
      <section className="py-20 max-w-5xl mx-auto px-4 text-center">
        <div className="p-10 sm:p-14 rounded-[36px] bg-slate-900 text-white shadow-2xl space-y-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-white/10 px-4 py-1.5 rounded-full">
            Ready to Begin?
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter leading-tight">
            ACCELERATE YOUR HIRING <br />
            &amp; CAREER TRAJECTORY
          </h2>
          <p className="text-sm max-w-lg mx-auto text-slate-400 font-medium">
            Join modern tech builders and high-velocity recruitment teams on SwipeHired today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => {
                setActiveView("candidate-signup");
              }}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-md transition-all cursor-pointer"
            >
              Sign Up as Candidate →
            </button>
            <button
              onClick={() => {
                setActiveView("company-signup");
              }}
              className="w-full sm:w-auto px-8 py-3.5 bg-sky-500 hover:bg-sky-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-md transition-all cursor-pointer"
            >
              Sign Up as Recruiter →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

