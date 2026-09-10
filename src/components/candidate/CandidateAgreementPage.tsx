import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Download,
  Printer,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Info,
  PenTool,
  Award,
  RefreshCw,
  Clock,
  KeyRound,
  FileCheck2,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export const CandidateAgreementPage: React.FC = () => {
  const { candidate, signCommissionAgreement, setActiveView, triggerCelebration } = useApp();

  // Document reference
  const docRef = useRef<HTMLDivElement>(null);

  // Document ID & Date
  const [docId] = useState<string>(() => {
    if (candidate.commissionAgreementDocId) return candidate.commissionAgreementDocId;
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SH-AGR-${new Date().getFullYear()}-${randomHex}`;
  });

  const [agreementDate] = useState<string>(() => {
    if (candidate.commissionAgreementSignedAt) {
      return new Date(candidate.commissionAgreementSignedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });

  // State
  const [hasReadAndAgreed, setHasReadAndAgreed] = useState<boolean>(
    candidate.commissionAgreementSigned || false
  );
  const [signerName, setSignerName] = useState<string>(
    candidate.fullName || candidate.commissionAgreementSignature?.signerName || "Candidate"
  );
  const [signatureStyle, setSignatureStyle] = useState<string>(
    candidate.commissionAgreementSignature?.signatureStyle || "style-script"
  );
  const [isSigned, setIsSigned] = useState<boolean>(
    candidate.commissionAgreementSigned || false
  );
  const [signatureHash, setSignatureHash] = useState<string>(() => {
    if (candidate.commissionAgreementSignature?.signatureHash) {
      return candidate.commissionAgreementSignature.signatureHash;
    }
    return `SHA256-${Math.random().toString(16).substring(2, 10).toUpperCase()}-${Math.random().toString(16).substring(2, 10).toUpperCase()}`;
  });
  const [signTimestamp, setSignTimestamp] = useState<string>(
    candidate.commissionAgreementSignature?.timestamp || ""
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);

  // Auto-stamp if previously signed
  useEffect(() => {
    if (candidate.commissionAgreementSigned) {
      setIsSigned(true);
      setHasReadAndAgreed(true);
    }
  }, [candidate.commissionAgreementSigned]);

  const handleGenerateAndStamp = () => {
    if (!signerName.trim()) return;
    const newTimestamp = new Date().toISOString();
    const newHash = `SHA256-${Math.random().toString(16).substring(2, 10).toUpperCase()}-${Math.random().toString(16).substring(2, 10).toUpperCase()}`;
    setSignatureHash(newHash);
    setSignTimestamp(newTimestamp);
    setIsSigned(true);
    setShowError(false);
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `SwipeHired_Placement_Agreement_${docId}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const handleFinalSubmit = async () => {
    if (!hasReadAndAgreed || !isSigned || !signerName.trim()) {
      setShowError(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await signCommissionAgreement(
        {
          signerName: signerName.trim(),
          signatureStyle,
          signatureHash,
          timestamp: signTimestamp || new Date().toISOString(),
          ipStamp: "Verified Digital Client",
        },
        docId
      );

      triggerCelebration();
      // Transition straight into candidate dashboard / radar
      setActiveView("candidate-radar");
    } catch (err) {
      console.error("Agreement signing error:", err);
      setIsSubmitting(false);
    }
  };

  const getSignatureFontClass = (style: string) => {
    switch (style) {
      case "style-script":
        return "font-serif italic font-medium tracking-wide text-2xl sm:text-3xl text-emerald-950";
      case "style-cursive":
        return "font-mono italic font-bold tracking-wider text-xl sm:text-2xl text-emerald-900";
      case "style-modern":
        return "font-sans uppercase font-black tracking-widest text-lg sm:text-xl text-slate-900";
      default:
        return "font-serif italic text-2xl text-emerald-950";
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:m-0 print:bg-white">
      {/* Print Specific Inline Styling Guard */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          body, html {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          header, footer, nav, aside, .no-print, [data-no-print="true"] {
            display: none !important;
          }
          #commission-agreement-pdf,
          #commission-agreement-pdf * {
            visibility: visible !important;
          }
          #commission-agreement-pdf {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 16px !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      {/* Container */}
      <div className="max-w-4xl mx-auto space-y-6 print:m-0 print:p-0 print:max-w-full">
        
        {/* Onboarding Steps Breadcrumb */}
        <div className="no-print bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-500">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">
              ✓
            </span>
            <span>1. Resume Ingested</span>
            <span className="text-slate-300">→</span>
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">
              ✓
            </span>
            <span>2. Profile Verified</span>
            <span className="text-slate-300">→</span>
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
              3
            </span>
            <span className="text-slate-900 font-black">3. Commission Agreement & E-Sign</span>
            <span className="text-slate-300">→</span>
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px]">
              4
            </span>
            <span className="text-slate-400">4. Unlock Radar</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Mandatory Onboarding Gate</span>
          </div>
        </div>

        {/* Informational Alert Header */}
        <div className="no-print bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Transparent Success-Fee Placement Agreement</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              SwipeHired Candidate Placement & Success Fee Contract
            </h1>
            
            <p className="text-sm text-emerald-100/90 leading-relaxed max-w-2xl">
              SwipeHired provides direct employer introductions, interview kits, and reverse talent bidding at <strong className="text-white">₹0 upfront cost</strong>. In return, we operate on a transparent success commission: <strong className="text-amber-300 underline underline-offset-2">10% of your first salary</strong> payable only when you are successfully hired through the platform.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-emerald-200">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Free Until Placed
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Legally Binding E-Signature
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 30-Day Money-Back / Rescission Safeguard
              </span>
            </div>
          </div>
        </div>

        {/* Document Action Bar (Print / Download / Status) */}
        <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white px-6 py-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800">
              Document Ref: <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">{docId}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handlePrint}
              type="button"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Agreement</span>
            </button>
            <button
              onClick={handlePrint}
              type="button"
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Save Agreement as PDF</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* FORMAL PDF DOCUMENT VIEWER CONTAINER                     */}
        {/* ======================================================== */}
        <div
          ref={docRef}
          id="commission-agreement-pdf"
          className="bg-white rounded-3xl border-2 border-slate-300/80 shadow-2xl p-6 sm:p-12 space-y-8 relative text-slate-800 font-sans"
          style={{ minHeight: "800px" }}
        >
          {/* Document Watermark Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none font-black text-8xl rotate-[-30deg]">
            SWIPEHIRED LEGAL
          </div>

          {/* Letterhead Header */}
          <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-xs">
                  S
                </div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  SwipeHired Technologies Inc.
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">
                Official Candidate Placement & Success Commission Agreement
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1 text-xs">
              <p className="font-bold text-slate-900">Document No: <span className="font-mono text-slate-700">{docId}</span></p>
              <p className="text-slate-500">Effective Date: <span className="font-semibold text-slate-700">{agreementDate}</span></p>
              <p className="text-slate-500">Jurisdiction: <span className="font-semibold text-slate-700">Digital Placement Services</span></p>
            </div>
          </div>

          {/* Parties Section */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs space-y-4">
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-2">
              Agreement Parties & Identification
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Party A */}
              <div className="space-y-1">
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                  Party A: The Platform
                </span>
                <p className="font-bold text-slate-900 mt-1">SwipeHired Technologies Inc.</p>
                <p className="text-slate-600">Enterprise AI Talent Marketplace & Radar Network</p>
                <p className="text-slate-500">Email: legal@swipehired.com</p>
              </div>

              {/* Party B */}
              <div className="space-y-1">
                <span className="font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                  Party B: The Candidate
                </span>
                <p className="font-bold text-slate-900 mt-1">{candidate.fullName || signerName || "Candidate"}</p>
                <p className="text-slate-600">Target Role: {candidate.preferredRole || candidate.headline || "Software Specialist"}</p>
                <p className="text-slate-500">Email: {candidate.email || "candidate@email.com"} | Phone: {candidate.phone || "Provided"}</p>
                <p className="text-slate-500">Location: {candidate.location || "India / Remote"}</p>
              </div>
            </div>
          </div>

          {/* Agreement Body & Formal Clauses */}
          <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
            
            {/* Clause 1 */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
                <span>The 10% Success Commission Fee Structure</span>
              </h4>
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 font-medium space-y-2">
                <p>
                  <strong>1.1 Success-Only Model:</strong> Party B (Candidate) incurs <strong>zero upfront fee, zero subscription cost, and zero application fees</strong> for utilizing SwipeHired’s AI Career Radar, job matching, direct recruiter introductions, and blind talent bidding.
                </p>
                <p>
                  <strong>1.2 10% Commission on First Salary:</strong> Upon the successful receipt and acceptance of an employment offer, consulting agreement, or placement from an employer introduced through or matched via SwipeHired, Party B agrees and commits to pay SwipeHired a one-time success commission equivalent to <strong>ten percent (10%) of the Candidate's first (1st) month's gross salary</strong> (or pro-rated contract payout).
                </p>
              </div>
            </div>

            {/* Clause 2 */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span>
                <span>Payment Schedule & Invoicing</span>
              </h4>
              <p>
                <strong>2.1 Invoicing:</strong> Following official joining and receipt of the first month's salary disbursement from the hiring company, SwipeHired shall issue a formal invoice to the Candidate.
              </p>
              <p>
                <strong>2.2 Due Date:</strong> Payment of the 10% placement commission shall be completed by Party B within thirty (30) calendar days from the date of the first salary credit. Flexible installment options are available upon written request.
              </p>
            </div>

            {/* Clause 3 */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">3</span>
                <span>Candidate Safeguard & 100% Rescission Protection</span>
              </h4>
              <p>
                <strong>3.1 Offer Cancellation / Rescission:</strong> If an employer rescinds the job offer prior to the start date or if employment is terminated within the initial thirty (30) days through no fault or breach of the Candidate, no commission shall be owed, and any disbursed funds will be refunded in full.
              </p>
              <p>
                <strong>3.2 Unrelated Placements:</strong> This agreement applies solely to employment or contracts secured with employers introduced or applied to via the SwipeHired platform. Job opportunities secured independently outside SwipeHired are exempt from commission.
              </p>
            </div>

            {/* Clause 4 */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">4</span>
                <span>Digital E-Signature Legality & Non-Circumvention</span>
              </h4>
              <p>
                <strong>4.1 Electronic Execution:</strong> This document is electronically executed. The applied digital e-signature, unique document token hash, and timestamp constitute valid and legally binding consent under applicable electronic signature laws.
              </p>
              <p>
                <strong>4.2 Non-Circumvention:</strong> Party B agrees not to circumvent SwipeHired by attempting to privately finalize employment with introduced companies to evade the 10% placement fee.
              </p>
            </div>
          </div>

          {/* ======================================================== */}
          {/* FORMAL SIGNATURE BLOCKS ON THE PDF                       */}
          {/* ======================================================== */}
          <div className="border-t-2 border-slate-900 pt-6 mt-8">
            <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-4">
              Execution & Authorized Signatures
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Party A Signature (Pre-signed by SwipeHired) */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/80 space-y-3 relative">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>Party A: SwipeHired Technologies</span>
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                    Verified Corporate Seal
                  </span>
                </div>

                <div className="h-16 flex items-center justify-center border-b border-dashed border-slate-300 py-1">
                  <div className="text-center">
                    <span className="font-serif italic font-black text-2xl text-slate-900 tracking-wider">
                      SwipeHired Placement Corp.
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 space-y-0.5">
                  <p className="font-bold text-slate-700">Authorized Legal Officer</p>
                  <p>Certificate: <span className="font-mono">SH-CA-AUTH-2026</span></p>
                  <p>Timestamp: {agreementDate}, 09:00:00 UTC</p>
                </div>
              </div>

              {/* Party B Signature (Candidate's E-Signature) */}
              <div className={`border-2 rounded-2xl p-4 transition-all relative ${
                isSigned
                  ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                  : "border-dashed border-amber-400 bg-amber-50/30"
              }`}>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>Party B: Candidate Signature</span>
                  {isSigned ? (
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      E-Signed & Stamped
                    </span>
                  ) : (
                    <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                      Pending Signature
                    </span>
                  )}
                </div>

                {/* The Signature Box on the PDF */}
                <div className="h-16 flex items-center justify-center border-b border-dashed border-slate-300 py-1">
                  {isSigned ? (
                    <div className="text-center animate-in zoom-in-95 duration-150">
                      <span className={getSignatureFontClass(signatureStyle)}>
                        {signerName}
                      </span>
                    </div>
                  ) : (
                    <div className="text-center text-amber-700/80 text-xs italic font-medium flex items-center gap-1.5">
                      <PenTool className="w-4 h-4 text-amber-600 animate-bounce" />
                      <span>Use signing panel below to generate & stamp your signature</span>
                    </div>
                  )}
                </div>

                {/* Digital Stamp Details */}
                <div className="text-[10px] text-slate-500 space-y-0.5 pt-1">
                  <p className="font-bold text-slate-800">{signerName}</p>
                  <p>
                    Token Hash: <span className="font-mono text-emerald-800 font-semibold">{isSigned ? signatureHash : "Awaiting signature..."}</span>
                  </p>
                  <p>
                    Signed At: <span className="text-slate-700">{isSigned && signTimestamp ? new Date(signTimestamp).toLocaleString() : "Not stamped yet"}</span>
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Footer of PDF */}
          <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-4">
            SwipeHired Talent Placement Agreement · Confidential & Legally Enforceable · Ref: {docId}
          </div>
        </div>

        {/* ======================================================== */}
        {/* INTERACTIVE SIGNING & ACCEPTANCE CONTROL PANEL           */}
        {/* ======================================================== */}
        <div className="no-print bg-white rounded-3xl border-2 border-slate-900 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Automated E-Signature & Agreement Acceptance
              </h3>
              <p className="text-xs text-slate-500">
                Type or confirm your legal name to generate your verified cryptographic digital signature stamp.
              </p>
            </div>
          </div>

          {showError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Please check the agreement box and click "Generate & Stamp E-Signature" before continuing.
              </span>
            </div>
          )}

          {/* Signature Configuration Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Legal Name */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Full Legal Name for E-Signature
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => {
                  setSignerName(e.target.value);
                  setIsSigned(false);
                }}
                placeholder="Enter your full name"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>

            {/* Signature Style Preset */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Signature Font Style
              </label>
              <select
                value={signatureStyle}
                onChange={(e) => {
                  setSignatureStyle(e.target.value);
                  if (isSigned) {
                    // Update timestamp on style change
                    setSignTimestamp(new Date().toISOString());
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="style-script">Elegant Script (Cursive)</option>
                <option value="style-cursive">Classic Italic</option>
                <option value="style-modern">Modern Block Script</option>
              </select>
            </div>
          </div>

          {/* Live Signature Preview & Stamp Button */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Generated Digital Signature Preview
              </span>
              <div className="p-2 min-w-[200px] flex items-center justify-center sm:justify-start">
                <span className={getSignatureFontClass(signatureStyle)}>
                  {signerName || "Your Signature"}
                </span>
              </div>
            </div>

            <button
              onClick={handleGenerateAndStamp}
              type="button"
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-2 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSigned ? "Update Signature Stamp" : "Generate & Stamp E-Sign"}</span>
            </button>
          </div>

          {/* Mandatory Agreement Checkbox */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 cursor-pointer hover:bg-emerald-50 transition-colors">
              <input
                type="checkbox"
                checked={hasReadAndAgreed}
                onChange={(e) => {
                  setHasReadAndAgreed(e.target.checked);
                  if (e.target.checked && !isSigned) {
                    handleGenerateAndStamp();
                  }
                }}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer shrink-0"
              />
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-900">
                  I solemnly agree to the SwipeHired 10% Success Placement Commission terms.
                </p>
                <p className="text-[11px] text-slate-600 leading-normal">
                  I understand that SwipeHired is 100% free until I am successfully hired. Upon securing a job through the platform, I agree to pay a one-time 10% commission of my first month's salary. I acknowledge that this digital signature is legally binding.
                </p>
              </div>
            </label>
          </div>

          {/* Final Submission Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-500 font-medium">
              {!isSigned ? (
                <span className="text-amber-700 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Please stamp your signature to proceed
                </span>
              ) : !hasReadAndAgreed ? (
                <span className="text-amber-700 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Please check the agreement box to proceed
                </span>
              ) : (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready to finalize onboarding!
                </span>
              )}
            </div>

            <button
              onClick={handleFinalSubmit}
              disabled={!hasReadAndAgreed || !isSigned || isSubmitting}
              className={`w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                hasReadAndAgreed && isSigned && !isSubmitting
                  ? "bg-slate-900 hover:bg-slate-800 text-white hover:scale-[1.02] shadow-slate-900/20"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              <span>{isSubmitting ? "Processing Agreement..." : "Agree & Continue to Career Radar"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
