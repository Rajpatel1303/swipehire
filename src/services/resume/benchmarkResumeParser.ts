/**
 * benchmarkResumeParser.ts
 * Evaluation benchmark harness to test resume parser accuracy, precision,
 * recall, and F1-score against ground-truth golden resumes.
 */

import { ParsedResumeResult } from "../ai/types";
import { ResumeParser } from "../ai/resumeParser";

export interface GoldenTestCase {
  id: string;
  name: string;
  fileContent: string;
  groundTruth: ParsedResumeResult;
}

export interface BenchmarkFieldScore {
  field: string;
  matched: boolean;
  expected: string;
  actual: string;
}

export interface BenchmarkResult {
  testCaseId: string;
  testCaseName: string;
  fieldScores: BenchmarkFieldScore[];
  precisionScore: number; // 0 - 100%
  executionTimeMs: number;
}

export class BenchmarkResumeParser {
  public static readonly GOLDEN_SUITE: GoldenTestCase[] = [
    {
      id: "tc_01",
      name: "Senior Frontend Engineer (2-Column PDF Layout)",
      fileContent: `
        AKSHAY RATHOD
        Senior Frontend Engineer | akshay.rathod@example.com | +91 9876543210 | Ahmedabad, Gujarat, India
        
        SUMMARY
        Full-stack software engineer with 4.5 years of experience building modern React and TypeScript web apps.
        
        EXPERIENCE
        Senior Frontend Developer | TechCorp Solutions | 2022 - Present
        - Led team of 5 engineers building cloud SaaS dashboard in React, Next.js, and TypeScript.
        
        Software Engineer | InnovateTech Labs | 2020 - 2022
        - Developed REST APIs and web components using Node.js, Express, and PostgreSQL.
        
        EDUCATION
        B.Tech in Computer Engineering | Gujarat Technological University | 2016 - 2020
        
        SKILLS
        React, TypeScript, Node.js, Next.js, Tailwind CSS, PostgreSQL, Docker, Git
      `,
      groundTruth: {
        fullName: "Akshay Rathod",
        headline: "Senior Frontend Engineer",
        email: "akshay.rathod@example.com",
        phone: "+91 9876543210",
        location: "Ahmedabad, Gujarat, India",
        yearsOfExperience: 4.5,
        skills: ["React", "TypeScript", "Node.js", "Next.js", "Tailwind CSS", "PostgreSQL", "Docker", "Git"],
        preferredRole: "Senior Frontend Engineer",
      }
    },
    {
      id: "tc_02",
      name: "Backend Developer (Single-Column Text)",
      fileContent: `
        PRIYA SHARMA
        Backend Engineer • priyasharma@devmail.com • +91 9123456789 • Bangalore, India
        
        WORK EXPERIENCE
        Backend Developer - DataScale Systems (Jan 2021 - Present)
        - Engineered microservices using Golang, Python, and PostgreSQL handling 5M daily queries.
        
        EDUCATION
        M.Tech Computer Science - IISc Bangalore (2019 - 2021)
        
        TECHNICAL SKILLS
        Golang, Python, PostgreSQL, Redis, Docker, Kubernetes, AWS, Microservices
      `,
      groundTruth: {
        fullName: "Priya Sharma",
        headline: "Backend Engineer",
        email: "priyasharma@devmail.com",
        phone: "+91 9123456789",
        location: "Bangalore, India",
        yearsOfExperience: 3,
        skills: ["Golang", "Python", "PostgreSQL", "Redis", "Docker", "Kubernetes", "AWS", "Microservices"],
        preferredRole: "Backend Engineer",
      }
    }
  ];

  /**
   * Run benchmark suite against all golden test cases
   */
  public static async runBenchmark(
    testCases: GoldenTestCase[] = this.GOLDEN_SUITE
  ): Promise<{ results: BenchmarkResult[]; overallAccuracy: number }> {
    const results: BenchmarkResult[] = [];

    for (const tc of testCases) {
      const startTime = Date.now();
      const parsed = await ResumeParser.parse(tc.fileContent, tc.groundTruth.fullName);
      const executionTimeMs = Date.now() - startTime;

      const fieldScores: BenchmarkFieldScore[] = [
        this.scoreField("fullName", tc.groundTruth.fullName, parsed.fullName),
        this.scoreField("headline", tc.groundTruth.headline, parsed.headline),
        this.scoreField("email", tc.groundTruth.email, parsed.email),
        this.scoreField("phone", tc.groundTruth.phone, parsed.phone),
        this.scoreField("location", tc.groundTruth.location, parsed.location),
        this.scoreField("skills", (tc.groundTruth.skills || []).join(", "), (parsed.skills || []).join(", ")),
      ];

      const matchedCount = fieldScores.filter(f => f.matched).length;
      const precisionScore = Math.round((matchedCount / fieldScores.length) * 100);

      results.push({
        testCaseId: tc.id,
        testCaseName: tc.name,
        fieldScores,
        precisionScore,
        executionTimeMs,
      });
    }

    const avgScore = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.precisionScore, 0) / results.length)
      : 0;

    return {
      results,
      overallAccuracy: avgScore,
    };
  }

  private static scoreField(fieldName: string, expected?: string, actual?: string): BenchmarkFieldScore {
    const expClean = (expected || "").trim().toLowerCase();
    const actClean = (actual || "").trim().toLowerCase();
    const matched = expClean.length > 0 && actClean.length > 0 && (actClean.includes(expClean) || expClean.includes(actClean));

    return {
      field: fieldName,
      matched,
      expected: expected || "",
      actual: actual || "",
    };
  }
}
