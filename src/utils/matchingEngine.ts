import { CandidateProfile, Job } from "../types";

export interface JobMatchDetails {
  isMatch: boolean;
  matchScore: number;
  fitVerdict: string;
  matchedSkills: string[];
  missingSkills: string[];
  matchedReasons: string[];
  matchCriteria: {
    skills: boolean;
    location: boolean;
    role: boolean;
    experience: boolean;
    salary: boolean;
    workMode: boolean;
  };
  aiSummary: string;
}

/**
 * Normalizes strings for robust fuzzy comparison
 */
function normalize(str?: string): string {
  return (str || "").toLowerCase().trim();
}

/**
 * Extracts LPA numbers or base numbers from text
 */
function parseSalaryLPA(str?: string): number[] {
  if (!str) return [];
  const clean = str.replace(/,/g, "");
  const matches = clean.match(/\d+(?:\.\d+)?/g);
  if (!matches) return [];
  const nums = matches.map(Number);
  return nums.filter((n) => n > 0 && n <= 150);
}

function parseExperienceYears(str?: string): number[] {
  if (!str) return [];
  const matches = str.match(/\d+(?:\.\d+)?/g);
  return matches ? matches.map(Number).filter((n) => n >= 0 && n <= 40) : [];
}

/**
 * Checks if two role or skill words have a meaningful semantic or substring overlap
 */
function isKeywordOverlap(a: string, b: string): boolean {
  const normA = normalize(a);
  const normB = normalize(b);
  if (!normA || !normB) return false;

  // Direct substring
  if (normA.includes(normB) || normB.includes(normA)) return true;

  // Token word match (e.g. "financial" in "financial analyst" and "financial management")
  const tokensA = normA.split(/[\s,/-]+/).filter((t) => t.length > 2);
  const tokensB = normB.split(/[\s,/-]+/).filter((t) => t.length > 2);

  return tokensA.some((ta) => tokensB.some((tb) => ta === tb || ta.includes(tb) || tb.includes(ta)));
}

/**
 * Comprehensive Multi-Attribute Job Matching Engine
 * Rule:
 * 1. A job qualifies as a MATCH only if there is a core Domain / Skill / Role connection:
 *    - At least 1 matching skill OR
 *    - Meaningful role / title / department overlap.
 * 2. Location, Experience, Salary, and Work Mode are secondary scoring factors.
 */
export function calculateJobMatch(candidate: CandidateProfile, job: Job): JobMatchDetails {
  const candidateSkills = (candidate.skills || []).map((s) => s.trim()).filter(Boolean);
  const jobReqSkills = (job.requiredSkills || []).map((s) => s.trim()).filter(Boolean);
  const jobPrefSkills = (job.preferredSkills || []).map((s) => s.trim()).filter(Boolean);
  const allJobSkills = [...jobReqSkills, ...jobPrefSkills];

  const candidateCity = normalize(candidate.location?.split(",")[0]);
  const jobCity = normalize(job.location?.split(",")[0]);

  const candidateRole = normalize(candidate.preferredRole || candidate.headline);
  const candidateHeadline = normalize(candidate.headline);
  const candidatePossibleRoles = (candidate.possibleRoles || []).map(normalize);
  const jobTitle = normalize(job.title);
  const jobDept = normalize(job.department);
  const jobDesc = normalize(job.description);

  const matchedReasons: string[] = [];

  // 1. SKILLS MATCH (Compare candidate skills against job requiredSkills, preferredSkills, title, JD)
  const matchedSkills: string[] = [];
  candidateSkills.forEach((candSkill) => {
    const isDirectMatch = allJobSkills.some((js) => isKeywordOverlap(candSkill, js));
    const isInTitleOrDesc = isKeywordOverlap(candSkill, job.title) || isKeywordOverlap(candSkill, job.department);

    if (isDirectMatch || isInTitleOrDesc) {
      if (!matchedSkills.includes(candSkill)) {
        matchedSkills.push(candSkill);
      }
    }
  });

  const missingSkills = jobReqSkills.filter(
    (js) => !candidateSkills.some((cs) => isKeywordOverlap(cs, js))
  );

  const hasSkillsMatch = matchedSkills.length > 0;
  if (hasSkillsMatch) {
    matchedReasons.push(`Skills Match (${matchedSkills.slice(0, 3).join(", ")}${matchedSkills.length > 3 ? ` +${matchedSkills.length - 3} more` : ""})`);
  }

  // 2. ROLE / TITLE / DEPARTMENT MATCH
  const isRoleMatch = Boolean(
    (candidateRole && isKeywordOverlap(candidateRole, job.title)) ||
    (candidateHeadline && isKeywordOverlap(candidateHeadline, job.title)) ||
    (candidateRole && jobDept && isKeywordOverlap(candidateRole, job.department)) ||
    candidatePossibleRoles.some((pr) => pr && isKeywordOverlap(pr, job.title))
  );

  if (isRoleMatch) {
    matchedReasons.push(`Role Match (${job.title})`);
  }

  // CORE QUALIFIER: Candidate MUST have at least 1 matching skill OR matching role/domain!
  const hasDomainAlignment = hasSkillsMatch || isRoleMatch;

  // 3. CITY / LOCATION MATCH
  const isLocationMatch = Boolean(
    (candidateCity && jobCity && (candidateCity.includes(jobCity) || jobCity.includes(candidateCity))) ||
    job.workMode === "Remote" ||
    candidate.workPreference === "Remote"
  );

  if (isLocationMatch && hasDomainAlignment) {
    if (job.workMode === "Remote") {
      matchedReasons.push("Remote Work Mode Alignment");
    } else {
      matchedReasons.push(`City Match (${candidate.location?.split(",")[0] || "Location Alignment"})`);
    }
  }

  // 4. EXPERIENCE MATCH
  const candExp = Number(candidate.yearsOfExperience) || 0;
  const jobExpNums = parseExperienceYears(job.experience);
  let isExpMatch = false;

  if (jobExpNums.length >= 2) {
    const minExp = jobExpNums[0];
    const maxExp = jobExpNums[1];
    isExpMatch = candExp >= Math.max(0, minExp - 1) && candExp <= maxExp + 2;
  } else if (jobExpNums.length === 1) {
    isExpMatch = Math.abs(candExp - jobExpNums[0]) <= 2;
  } else {
    isExpMatch = candExp > 0;
  }

  if (isExpMatch && candExp > 0 && hasDomainAlignment) {
    matchedReasons.push(`Experience Match (${candExp} yrs aligns with ${job.experience})`);
  }

  // 5. SALARY MATCH (in LPA band)
  const candSalaryNums = parseSalaryLPA(candidate.expectedSalary);
  const jobSalaryNums = parseSalaryLPA(job.salary);
  let isSalaryMatch = false;

  if (candSalaryNums.length > 0 && jobSalaryNums.length > 0) {
    const candMidSalary = candSalaryNums.reduce((a, b) => a + b, 0) / candSalaryNums.length;
    const jobMaxSalary = Math.max(...jobSalaryNums);
    const jobMinSalary = Math.min(...jobSalaryNums);
    isSalaryMatch = candMidSalary <= jobMaxSalary * 1.3 && candMidSalary >= jobMinSalary * 0.7;
  }

  if (isSalaryMatch && candidate.expectedSalary && job.salary && hasDomainAlignment) {
    matchedReasons.push(`Salary Match (${job.salary} budget matches expected ${candidate.expectedSalary})`);
  }

  // 6. WORK MODE MATCH
  const isWorkModeMatch = Boolean(
    candidate.workPreference === job.workMode ||
    job.workMode === "Remote" ||
    candidate.workPreference === "Remote" ||
    (candidate.workPreference === "Hybrid" && job.workMode === "Hybrid")
  );

  if (isWorkModeMatch && candidate.workPreference && hasDomainAlignment) {
    matchedReasons.push(`Work Preference Match (${job.workMode})`);
  }

  // QUALIFYING CRITERIA:
  // Strictly requires domain alignment (Skill Match OR Role Match)
  const isMatch = Boolean(hasDomainAlignment);

  // Compute fine-grained Match Score (50 - 98%)
  let score = 30;

  if (isMatch) {
    score = 55;

    // Skills contribution (up to 35 points)
    if (jobReqSkills.length > 0) {
      const skillRatio = matchedSkills.length / Math.max(jobReqSkills.length, 1);
      score += Math.min(Math.round(skillRatio * 35), 35);
    } else if (hasSkillsMatch) {
      score += 20;
    }

    // Role contribution (up to 15 points)
    if (isRoleMatch) score += 15;

    // Location contribution (up to 10 points)
    if (isLocationMatch) score += 10;

    // Experience contribution (up to 8 points)
    if (isExpMatch) score += 8;

    // Salary contribution (up to 8 points)
    if (isSalaryMatch) score += 8;

    // Work mode contribution (up to 5 points)
    if (isWorkModeMatch) score += 5;
  } else {
    // If no skill or role match, calculate low baseline
    score = 25;
  }

  // Clamp score
  const finalScore = isMatch ? Math.min(Math.max(score, 60), 98) : Math.min(score, 40);

  let fitVerdict = "Low Match";
  if (finalScore >= 90) fitVerdict = "Exceptional Match · High Fit";
  else if (finalScore >= 80) fitVerdict = "Strong Match · Recommended";
  else if (finalScore >= 70) fitVerdict = "Good Match · Skill Alignment";
  else if (isMatch) fitVerdict = "Qualifying Match · Partial Fit";

  let aiSummary = "";
  if (isMatch) {
    aiSummary = `${candidate.fullName} matches this ${job.title} opening on ${matchedReasons.length} key dimension(s): ${matchedReasons.slice(0, 2).join(", ")}. ${matchedSkills.length > 0 ? `Core overlapping skills include ${matchedSkills.slice(0, 3).join(", ")}.` : ""}`;
  } else {
    aiSummary = `This role is outside your primary domain (${candidate.preferredRole || candidate.headline || "Profile"}). No direct skill or role overlap was identified.`;
  }

  return {
    isMatch,
    matchScore: finalScore,
    fitVerdict,
    matchedSkills,
    missingSkills,
    matchedReasons,
    matchCriteria: {
      skills: hasSkillsMatch,
      location: isLocationMatch && hasDomainAlignment,
      role: isRoleMatch,
      experience: isExpMatch && hasDomainAlignment,
      salary: isSalaryMatch && hasDomainAlignment,
      workMode: isWorkModeMatch && hasDomainAlignment,
    },
    aiSummary,
  };
}
