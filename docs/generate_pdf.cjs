const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SwipeHired - Product Requirement Document</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

  @page {
    size: A4 portrait;
    margin: 14mm 14mm 14mm 14mm;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    line-height: 1.5;
    font-size: 11pt;
    margin: 0;
    padding: 0;
  }

  /* Page Break Utilities */
  .page-break {
    page-break-before: always;
    break-before: page;
  }

  .avoid-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Cover & Header */
  .doc-header {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #064e3b 100%);
    color: #ffffff;
    padding: 32px 30px;
    border-radius: 16px;
    margin-bottom: 24px;
    border: 1px solid #334155;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.15);
  }

  .brand-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 5px 12px;
    border-radius: 9999px;
    font-size: 8.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #38bdf8;
    margin-bottom: 12px;
  }

  .brand-pill .dot {
    width: 7px;
    height: 7px;
    background-color: #10b981;
    border-radius: 50%;
  }

  .doc-title {
    font-size: 24pt;
    font-weight: 900;
    line-height: 1.15;
    margin: 0 0 8px 0;
    letter-spacing: -0.02em;
    background: linear-gradient(to right, #ffffff, #e2e8f0, #a7f3d0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .doc-subtitle {
    font-size: 11pt;
    color: #cbd5e1;
    margin: 0 0 18px 0;
    font-weight: 400;
    max-width: 90%;
    line-height: 1.4;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    padding-top: 14px;
  }

  .meta-item {
    font-size: 8.5pt;
  }

  .meta-label {
    color: #94a3b8;
    text-transform: uppercase;
    font-weight: 700;
    font-size: 7.5pt;
    letter-spacing: 0.05em;
    display: block;
    margin-bottom: 2px;
  }

  .meta-value {
    color: #f8fafc;
    font-weight: 600;
  }

  /* Typography */
  h1, h2, h3, h4 {
    color: #0f172a;
    font-weight: 800;
    letter-spacing: -0.015em;
  }

  h2 {
    font-size: 14pt;
    margin: 22px 0 10px 0;
    padding-bottom: 6px;
    border-bottom: 2px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  h2 .section-num {
    background: #0f172a;
    color: #ffffff;
    font-size: 9pt;
    padding: 3px 8px;
    border-radius: 6px;
    font-weight: 800;
  }

  h3 {
    font-size: 11.5pt;
    margin: 14px 0 6px 0;
    color: #1e293b;
  }

  p {
    margin: 0 0 8px 0;
    font-size: 9.5pt;
    color: #334155;
    line-height: 1.5;
  }

  ul, ol {
    margin: 4px 0 10px 18px;
    padding: 0;
    font-size: 9.5pt;
    color: #334155;
  }

  li {
    margin-bottom: 4px;
    line-height: 1.45;
  }

  strong {
    color: #0f172a;
    font-weight: 700;
  }

  code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8.5pt;
    background: #f1f5f9;
    color: #0f172a;
    padding: 1px 5px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }

  /* Cards & Callouts */
  .card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 12px;
  }

  .card-header {
    font-size: 10pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
  }

  .grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .kpi-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    text-align: center;
  }

  .kpi-num {
    font-size: 16pt;
    font-weight: 900;
    color: #059669;
    line-height: 1.1;
    margin-bottom: 2px;
  }

  .kpi-label {
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    color: #64748b;
    letter-spacing: 0.04em;
  }

  .alert-box {
    padding: 10px 14px;
    border-radius: 8px;
    margin-bottom: 10px;
    font-size: 9pt;
    border-left: 4px solid;
  }

  .alert-info {
    background: #f0fdf4;
    border-color: #10b981;
    color: #065f46;
  }

  .alert-warning {
    background: #fffbeb;
    border-color: #f59e0b;
    color: #92400e;
  }

  .alert-dark {
    background: #0f172a;
    border-color: #38bdf8;
    color: #f8fafc;
  }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 9999px;
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .badge-emerald { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
  .badge-sky { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
  .badge-purple { background: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }
  .badge-amber { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 14px 0;
    font-size: 8.5pt;
  }

  th {
    background: #0f172a;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
    padding: 7px 10px;
    font-size: 8pt;
    letter-spacing: 0.03em;
    border: 1px solid #1e293b;
  }

  th:first-child { border-top-left-radius: 6px; }
  th:last-child { border-top-right-radius: 6px; }

  td {
    padding: 6px 10px;
    border: 1px solid #e2e8f0;
    color: #334155;
    vertical-align: middle;
  }

  tr:nth-child(even) td {
    background: #f8fafc;
  }

  /* Workflow Steps */
  .flow-container {
    display: flex;
    gap: 6px;
    margin: 8px 0 12px 0;
  }

  .flow-step {
    flex: 1;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 8px;
    text-align: center;
    position: relative;
  }

  .flow-step.active {
    border-color: #10b981;
    background: #f0fdf4;
  }

  .flow-step-num {
    display: inline-block;
    width: 18px;
    height: 18px;
    line-height: 18px;
    background: #0f172a;
    color: #ffffff;
    font-size: 7.5pt;
    font-weight: 800;
    border-radius: 50%;
    margin-bottom: 3px;
  }

  .flow-step.active .flow-step-num {
    background: #10b981;
  }

  .flow-step-title {
    font-size: 7.5pt;
    font-weight: 700;
    color: #0f172a;
    display: block;
    line-height: 1.2;
  }

  /* Formula Box */
  .formula-box {
    background: #0f172a;
    color: #38bdf8;
    padding: 10px 14px;
    border-radius: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 8pt;
    margin: 8px 0 10px 0;
    border: 1px solid #1e293b;
    line-height: 1.4;
  }

  /* Sign-Off Block */
  .sign-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 14px;
  }

  .sign-card {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 10px 12px;
    background: #ffffff;
  }

  .sign-title {
    font-size: 8pt;
    font-weight: 800;
    color: #0f172a;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .sign-line {
    border-bottom: 1px dashed #94a3b8;
    margin: 16px 0 6px 0;
  }

  .sign-meta {
    font-size: 7.5pt;
    color: #64748b;
  }

  /* Footer */
  .doc-footer {
    border-top: 1px solid #e2e8f0;
    padding-top: 8px;
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
    font-size: 7.5pt;
    color: #94a3b8;
  }
</style>
</head>
<body>

  <!-- ==================== PAGE 1 ==================== -->
  <div class="doc-header">
    <div class="brand-pill">
      <span class="dot"></span>
      SwipeHired Engineering · Enterprise PRD
    </div>
    <div class="doc-title">SwipeHired — Product Requirement Document</div>
    <div class="doc-subtitle">AI-Powered Recruitment Platform, Interactive Career Radar Swiping & 72-Hour Blind Reverse Hiring Marketplace</div>
    
    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Document Version</span>
        <span class="meta-value">1.0.0 (Production)</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Author & Architect</span>
        <span class="meta-value">DeepMind Agentic Suite</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Target Release</span>
        <span class="meta-value">Q1 / Q2 2026</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Security Clearance</span>
        <span class="meta-value">Confidential / Public Ready</span>
      </div>
    </div>
  </div>

  <h2><span class="section-num">1</span> Executive Summary & Vision</h2>
  <p><strong>SwipeHired</strong> is a full-stack, AI-native talent discovery and recruitment platform engineered to eradicate the friction, bias, and ghosting endemic to technical hiring. By uniting consumer-grade card swiping ergonomics with enterprise Applicant Tracking System (ATS) workflows, SwipeHired delivers an end-to-end ecosystem connecting verified engineering talent with high-growth companies.</p>

  <div class="grid-4" style="margin-bottom: 12px;">
    <div class="kpi-card">
      <div class="kpi-num">&lt; 14 Days</div>
      <div class="kpi-label">Time-to-Offer Target</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-num">70%</div>
      <div class="kpi-label">Screening Time Reduction</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-num">&lt; 5%</div>
      <div class="kpi-label">Ghosting SLA Rate</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-num">100%</div>
      <div class="kpi-label">Zero-PII Blind Guarantee</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-header">
        <span>🎯</span> Core Candidate Value Proposition
      </div>
      <ul>
        <li><strong>Sub-Second Applications:</strong> Swipe right to apply with algorithmic match transparency.</li>
        <li><strong>72-Hour Blind Marketplace:</strong> Receive binding upfront compensation bids without revealing identity.</li>
        <li><strong>Anti-Ghosting Guarantee:</strong> Guaranteed SLA turnaround, live pulse steps, and structured constructive gap analysis.</li>
        <li><strong>Legally Sound 10% Commission:</strong> Pre-authorized digital placement agreement with SHA-256 signatures.</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-header">
        <span>🏢</span> Core Recruiter / Employer Value Proposition
      </div>
      <ul>
        <li><strong>AI Job Architect:</strong> Prompt-driven job generation creating full specifications and salary bands.</li>
        <li><strong>Comparison Arena:</strong> Head-to-head multi-candidate trade-off analysis with radar chart overlays.</li>
        <li><strong>Integrated Communications:</strong> Native custom SMTP/Gmail connection tester and WhatsApp dispatch.</li>
        <li><strong>AI Interview & Offer Suite:</strong> Instant tailored technical rubrics and customized legal offer letters.</li>
      </ul>
    </div>
  </div>

  <h2><span class="section-num">2</span> Product Strategy & Key Metrics (OKRs)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Strategic Objective</th>
        <th style="width: 45%;">Key Results (KRs)</th>
        <th style="width: 15%;">Benchmark</th>
        <th style="width: 15%;">Target</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Sourcing Velocity</strong></td>
        <td>Reduce candidate onboarding time via Affinda/Eden AI OCR parser.</td>
        <td>15 mins (Manual)</td>
        <td><span class="badge badge-emerald">&lt; 60 Seconds</span></td>
      </tr>
      <tr>
        <td><strong>2. Match Precision</strong></td>
        <td>Vectorized multi-attribute skill, role, salary & location matching engine.</td>
        <td>45% Relevance</td>
        <td><span class="badge badge-emerald">&gt; 85% Precision</span></td>
      </tr>
      <tr>
        <td><strong>3. Anti-Ghosting Compliance</strong></td>
        <td>Applications resolved or progressed within company SLA guarantees.</td>
        <td>32% Industry Avg</td>
        <td><span class="badge badge-emerald">&gt; 95% Compliant</span></td>
      </tr>
      <tr>
        <td><strong>4. Blind Marketplace</strong></td>
        <td>Upfront salary bid resolution and candidate unmasking rate.</td>
        <td>12% Cold Outreach</td>
        <td><span class="badge badge-emerald">&gt; 40% Accept Rate</span></td>
      </tr>
      <tr>
        <td><strong>5. Revenue Compliance</strong></td>
        <td>Mandatory 10% commission digital agreement execution prior to job deck access.</td>
        <td>0% (Standard)</td>
        <td><span class="badge badge-emerald">100% Signed</span></td>
      </tr>
    </tbody>
  </table>

  <!-- ==================== PAGE 2 ==================== -->
  <div class="page-break"></div>

  <h2><span class="section-num">3</span> User Personas & Journey Workflows</h2>
  
  <div class="grid-3" style="margin-bottom: 12px;">
    <div class="card">
      <div class="card-header">👨‍💻 Alex — Senior Candidate</div>
      <p style="font-size:8pt; margin-bottom:4px;"><strong>Profile:</strong> 5 YOE Full Stack (React/Node/TS), seeking ₹18-24 LPA.</p>
      <p style="font-size:8pt; margin-bottom:0;"><strong>Needs:</strong> Salary transparency, bias-free blind evaluation, zero ghosting, instant applications.</p>
    </div>
    <div class="card">
      <div class="card-header">👩‍💼 Priya — Tech Talent Lead</div>
      <p style="font-size:8pt; margin-bottom:4px;"><strong>Profile:</strong> Fast-scaling Series-B startup hiring 8-10 devs/quarter.</p>
      <p style="font-size:8pt; margin-bottom:0;"><strong>Needs:</strong> Pre-screened candidates, head-to-head comparison, custom domain SMTP emailing, Kanban velocity.</p>
    </div>
    <div class="card">
      <div class="card-header">🛡️ Admin — Platform Ops</div>
      <p style="font-size:8pt; margin-bottom:4px;"><strong>Profile:</strong> Operations & Trust compliance officer.</p>
      <p style="font-size:8pt; margin-bottom:0;"><strong>Needs:</strong> Job moderation, abuse resolution, SLA performance monitoring, vector telemetry.</p>
    </div>
  </div>

  <h3>Candidate End-to-End Workflow</h3>
  <div class="flow-container">
    <div class="flow-step active">
      <span class="flow-step-num">1</span>
      <span class="flow-step-title">Resume OCR Parse</span>
    </div>
    <div class="flow-step active">
      <span class="flow-step-num">2</span>
      <span class="flow-step-title">10% Agreement Sign</span>
    </div>
    <div class="flow-step active">
      <span class="flow-step-num">3</span>
      <span class="flow-step-title">Radar Deck Swipe</span>
    </div>
    <div class="flow-step active">
      <span class="flow-step-num">4</span>
      <span class="flow-step-title">Blind Talent Bid</span>
    </div>
    <div class="flow-step active">
      <span class="flow-step-num">5</span>
      <span class="flow-step-title">Live Pulse SLA</span>
    </div>
    <div class="flow-step active">
      <span class="flow-step-num">6</span>
      <span class="flow-step-title">Offer Letter</span>
    </div>
  </div>

  <h2><span class="section-num">4</span> Functional Requirements & Domain Modules</h2>

  <div class="card">
    <div class="card-header">4.1 Authentication, Role Guards & Access Control</div>
    <p>Role-based authentication powered by Supabase with client-side state enforcement in <code>AppContext.tsx</code>. Strictly isolates candidate and company routing contexts:</p>
    <ul>
      <li><strong>Role Isolation:</strong> Recruiters navigating to candidate URLs are auto-redirected to the Cockpit; candidates attempting recruiter routes are bounced to Career Radar.</li>
      <li><strong>Agreement Gateway:</strong> Candidates are hard-locked from swiping, job lists, and marketplace bids until the 10% commission agreement is cryptographically signed.</li>
    </ul>
  </div>

  <div class="card">
    <div class="card-header">4.2 AI Resume OCR Parser & Smart Profile Builder</div>
    <p>Dual-stage resume extraction via Eden AI Affinda OCR and GPT-4o-mini / Gemini structuring prompt:</p>
    <ul>
      <li>Accepts PDF, DOCX, TXT, and MD formats up to 25MB via memory buffer.</li>
      <li>Extracts 15 structured parameters including Skills, Experience, Education, Projects, Target Roles, and Salary expectations.</li>
      <li>Dynamic Profile Strength scoring (0–100%) providing immediate optimization feedback.</li>
    </ul>
  </div>

  <div class="card">
    <div class="card-header">4.3 Mandatory 10% Placement Agreement & E-Signature</div>
    <p>Legally enforceable digital commission agreement locking platform monetization:</p>
    <ul>
      <li><strong>Cryptographic Stamping:</strong> Assigns unique Document ID <code>SH-AGR-YYYY-[HEX]</code> and calculates SHA-256 digital signature hash.</li>
      <li><strong>Audit Trail:</strong> Captures Signer Full Name, Timestamp, Signature Typography Style, and Client IP Stamp.</li>
      <li><strong>Export:</strong> One-click print-ready preview and PDF download for personal record keeping.</li>
    </ul>
  </div>

  <div class="card">
    <div class="card-header">4.4 Career Radar & Algorithmic Matching Engine</div>
    <p>Real-time multi-attribute matching algorithm evaluating domain overlap, skills, experience, and compensation:</p>
    <div class="formula-box">
      MatchScore = Base(55) + S_skills(35) + R_role(15) + L_loc(10) + E_exp(8) + C_salary(8) + W_mode(5)<br>
      Rule: Must have >= 1 verified skill match or role overlap to qualify (Clamped 60%–98%)
    </div>
    <ul>
      <li><strong>Learned Swipe Preferences:</strong> Analyzes swipe patterns (apply, skip, bookmark) to iteratively adjust candidate skill weights.</li>
      <li><strong>Match Reasons:</strong> Highlights dimensional alignment (e.g. <em>"City Match · Ahmedabad"</em>, <em>"Salary Match · ₹12-16 LPA"</em>).</li>
    </ul>
  </div>

  <!-- ==================== PAGE 3 ==================== -->
  <div class="page-break"></div>

  <h2><span class="section-num">5</span> Reverse Blind Marketplace & Recruiter ATS</h2>

  <div class="grid-2">
    <div class="card">
      <div class="card-header">5.1 72-Hour Blind Reverse Marketplace</div>
      <p>Anonymous talent bidding eliminating pedigree and demographic bias:</p>
      <ul>
        <li><strong>Zero-PII Handles:</strong> Profiles displayed as <em>"Anonymous Full Stack Architect #704"</em> with verified skills and metrics.</li>
        <li><strong>Upfront Binding Bids:</strong> Employers place explicit salary offers (e.g. ₹18–22 LPA) and perks.</li>
        <li><strong>72-Hour Countdown:</strong> Built-in ticking timer forcing quick resolution.</li>
        <li><strong>Candidate Choice:</strong> Accept (unmasks identity), Counter-Offer (propose new terms), or Decline.</li>
      </ul>
    </div>

    <div class="card">
      <div class="card-header">5.2 Visual Kanban Pipeline & Fast Actions</div>
      <p>High-throughput drag-and-drop recruiter pipeline with 6 stages:</p>
      <ul>
        <li><strong>Stages:</strong> Applied → Screening → Shortlisted → Interview → Offer → Hired.</li>
        <li><strong>Fast-Action Badges:</strong> Visual SLA indicators highlighting applications nearing response deadlines.</li>
        <li><strong>Quick-Action Modals:</strong> Direct 1-click triggers for email, WhatsApp, interview scheduling, interview kits, and offer letters.</li>
      </ul>
    </div>
  </div>

  <div class="card">
    <div class="card-header">5.3 Candidate Comparison Arena & AI Verdict</div>
    <p>Side-by-side head-to-head comparison of 2 to 4 candidates against any target job opening:</p>
    <ul>
      <li><strong>Multi-Dimensional Radar Chart:</strong> Visualizes candidate skill breadth, experience alignment, salary fit, and education.</li>
      <li><strong>AI Comparative Verdict:</strong> Synthesizes candidate strengths, concerns, and delivers an objective "Top Pick" recommendation with trade-off rationale.</li>
    </ul>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-header">5.4 Anti-Ghosting SLA & Constructive Feedback</div>
      <ul>
        <li><strong>Company SLA Tiers:</strong> Gold (&lt;24h), Silver (&lt;48h), Bronze (&lt;72h) badges displayed on job cards.</li>
        <li><strong>Live Pulse Steps:</strong> Step-by-step progress tracker for candidates.</li>
        <li><strong>Constructive Rejection Plan:</strong> AI-generated gap analysis and 30-day learning roadmap when applications are rejected.</li>
      </ul>
    </div>

    <div class="card">
      <div class="card-header">5.5 Multi-Channel Communication & Offer Suite</div>
      <ul>
        <li><strong>Custom SMTP Integration:</strong> Connect recruiter SMTP/Gmail with live diagnostic connection verification.</li>
        <li><strong>WhatsApp Outreach:</strong> Pre-formatted interview and shortlist dispatch templates.</li>
        <li><strong>AI Offer Letter:</strong> Instant customized CTC breakdown, joining terms, and digital offer dispatch.</li>
      </ul>
    </div>
  </div>

  <h2><span class="section-num">6</span> Technical Architecture & Database Design</h2>

  <div class="alert-box alert-dark">
    <strong>Full-Stack Architecture:</strong> React 19 Frontend + Vite 6 + Tailwind CSS v4 + Motion UI · Express Server + Cloudflare Edge Functions · Supabase PostgreSQL with Row Level Security (RLS) · Eden AI / Gemini 2.5 Engine · Nodemailer Transport.
  </div>

  <h3>Database Entity Schema (13 Relational Tables)</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 22%;">Table Name</th>
        <th style="width: 48%;">Purpose & Key Attributes</th>
        <th style="width: 30%;">Security / RLS Policy</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>profiles</code></td>
        <td>User identity, email, role (<code>candidate</code> | <code>company</code> | <code>admin</code>), timestamps.</td>
        <td>Self-read & update only</td>
      </tr>
      <tr>
        <td><code>candidates</code></td>
        <td>Full profile, skills, salary, 10% e-signature hash, learned swipe preferences.</td>
        <td>Candidate owner write; public browsable</td>
      </tr>
      <tr>
        <td><code>companies</code></td>
        <td>Branding, culture, verified status, custom SMTP config (encrypted).</td>
        <td>Company owner write; public browsable</td>
      </tr>
      <tr>
        <td><code>jobs</code></td>
        <td>AI job specs, required/preferred skills, salary, openings, status.</td>
        <td>Recruiter write; public read (active)</td>
      </tr>
      <tr>
        <td><code>applications</code></td>
        <td>Match score, status, SLA deadline, pulse steps, constructive feedback.</td>
        <td>Participant candidate & company only</td>
      </tr>
      <tr>
        <td><code>blind_talent_profiles</code></td>
        <td>Zero-PII anonymous handles, verified skills, proof-of-work metrics.</td>
        <td>Public read (PII masked strictly)</td>
      </tr>
      <tr>
        <td><code>talent_bids</code></td>
        <td>Upfront salary offers, 72h expiration, counter offers, status.</td>
        <td>Target candidate & bidding company</td>
      </tr>
      <tr>
        <td><code>swipe_interactions</code></td>
        <td>Candidate swipe telemetry (applied, skipped, saved) for AI tuning.</td>
        <td>Candidate owner & system only</td>
      </tr>
      <tr>
        <td><code>company_slas</code></td>
        <td>Response metrics, ghosting rate, feedback guarantee, tier badges.</td>
        <td>Public read; system computed</td>
      </tr>
      <tr>
        <td><code>notifications</code></td>
        <td>Real-time in-app alerts across candidate, recruiter, and admin roles.</td>
        <td>Recipient user only</td>
      </tr>
    </tbody>
  </table>

  <!-- ==================== PAGE 4 ==================== -->
  <div class="page-break"></div>

  <h2><span class="section-num">7</span> Monetization Strategy & Business Model</h2>
  
  <div class="grid-3" style="margin-bottom: 14px;">
    <div class="card" style="border-top: 3px solid #10b981;">
      <div class="card-header">10% Placement Commission</div>
      <div style="font-size:14pt; font-weight:900; color:#059669; margin:4px 0;">10% 1st Year CTC</div>
      <p style="font-size:8pt;">Mandatory digital agreement pre-authorized at candidate onboarding. Invoiced directly upon successful candidate placement and offer execution.</p>
    </div>
    <div class="card" style="border-top: 3px solid #0284c7;">
      <div class="card-header">Recruiter Pro Subscription</div>
      <div style="font-size:14pt; font-weight:900; color:#0284c7; margin:4px 0;">$199 / mo</div>
      <p style="font-size:8pt;">Unlimited active job postings, 25 monthly blind marketplace bids, custom SMTP connection, and priority AI candidate matching.</p>
    </div>
    <div class="card" style="border-top: 3px solid #7c3aed;">
      <div class="card-header">Enterprise ATS Bridge</div>
      <div style="font-size:14pt; font-weight:900; color:#7c3aed; margin:4px 0;">$999+ / mo</div>
      <p style="font-size:8pt;">Bidirectional sync with Greenhouse, Lever, and Workday, dedicated account manager, custom SLAs, and multi-team recruiter seats.</p>
    </div>
  </div>

  <h2><span class="section-num">8</span> Release Roadmap & Phased Execution</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 18%;">Phase</th>
        <th style="width: 22%;">Timeline</th>
        <th style="width: 42%;">Key Capabilities & Deliverables</th>
        <th style="width: 18%;">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Phase 1: MVP Core</strong></td>
        <td>Current / Production</td>
        <td>AI OCR Resume Parser, 10% E-Signature, Swipe Deck, 72h Blind Marketplace, Kanban ATS, Comparison Arena, Custom SMTP.</td>
        <td><span class="badge badge-emerald">Completed (v1.0)</span></td>
      </tr>
      <tr>
        <td><strong>Phase 2: AI Voice & Integrations</strong></td>
        <td>Q3 2026</td>
        <td>Autonomous AI phone screener, webhook alerts (Slack/Discord), bidirectional Greenhouse/Lever ATS sync.</td>
        <td><span class="badge badge-sky">In Development</span></td>
      </tr>
      <tr>
        <td><strong>Phase 3: Global Scale</strong></td>
        <td>Q4 2026</td>
        <td>Web3 cryptographic proof-of-work credentials, multi-currency salary bidding (USD/EUR/INR), native iOS & Android apps.</td>
        <td><span class="badge badge-purple">Planned</span></td>
      </tr>
    </tbody>
  </table>

  <h2><span class="section-num">9</span> Risk Assessment & Mitigation Matrix</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Risk Factor</th>
        <th style="width: 15%;">Severity</th>
        <th style="width: 60%;">Mitigation Architecture</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Blind Identity Leakage</strong></td>
        <td><span class="badge badge-amber">Critical</span></td>
        <td>Zero-PII server-side sanitization. Contact details strictly omitted from API responses until explicit candidate bid acceptance.</td>
      </tr>
      <tr>
        <td><strong>Recruiter Ghosting</strong></td>
        <td><span class="badge badge-amber">High</span></td>
        <td>Public SLA trust badges (Gold/Silver/Bronze), automated countdown escalation, and mandatory constructive feedback generation.</td>
      </tr>
      <tr>
        <td><strong>Commission Circumvention</strong></td>
        <td><span class="badge badge-amber">High</span></td>
        <td>Cryptographically signed legal agreement with SHA-256 hash stamp, IP logging, and enforceable candidate digital record.</td>
      </tr>
    </tbody>
  </table>

  <h2><span class="section-num">10</span> Document Sign-Off & Approvals</h2>
  <div class="sign-grid">
    <div class="sign-card">
      <div class="sign-title">Lead Product Architect</div>
      <div class="sign-line"></div>
      <div class="sign-meta">
        <strong>DeepMind Agentic Lead</strong><br>
        Status: Approved · Aug 25, 2026
      </div>
    </div>
    <div class="sign-card">
      <div class="sign-title">Engineering Lead</div>
      <div class="sign-line"></div>
      <div class="sign-meta">
        <strong>SwipeHired Full-Stack Lead</strong><br>
        Status: Approved · Aug 25, 2026
      </div>
    </div>
    <div class="sign-card">
      <div class="sign-title">Head of Security & Trust</div>
      <div class="sign-line"></div>
      <div class="sign-meta">
        <strong>Platform Security Lead</strong><br>
        Status: Approved · Aug 25, 2026
      </div>
    </div>
  </div>

  <div class="doc-footer">
    <span>SwipeHired Inc. · Confidential & Proprietary</span>
    <span>Product Requirement Document · Version 1.0.0</span>
    <span>Page 4 of 4</span>
  </div>

</body>
</html>
`;

const htmlPath = path.join(__dirname, 'prd_template.html');
const pdfPath = path.join(__dirname, '..', 'SwipeHired_Product_Requirement_Document.pdf');

fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('HTML template written to:', htmlPath);

// Locate Chrome or Edge
let browserPath = '';
if (fs.existsSync('C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe')) {
  browserPath = 'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe';
} else if (fs.existsSync('C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe')) {
  browserPath = 'C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe';
} else {
  console.error('No suitable browser found for PDF generation');
  process.exit(1);
}

console.log('Using browser at:', browserPath);

const cmd = `"${browserPath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
console.log('Executing:', cmd);

execSync(cmd, { stdio: 'inherit' });

if (fs.existsSync(pdfPath)) {
  const stats = fs.statSync(pdfPath);
  console.log(`\n✅ PDF Generated Successfully!`);
  console.log(`Path: ${pdfPath}`);
  console.log(`Size: ${(stats.size / 1024).toFixed(2)} KB`);
} else {
  console.error('❌ Failed to generate PDF.');
  process.exit(1);
}
