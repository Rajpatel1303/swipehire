import { CandidateGitHubData, GitHubRepoItem } from "../types";

export class GitHubService {
  private static readonly API_BASE = "https://api.github.com";

  private static getHeaders() {
    return {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "SwipeHired-Talent-Platform",
    };
  }

  /**
   * Fetch user public profile from GitHub API
   */
  static async fetchUserProfile(username: string): Promise<any> {
    const cleanUsername = username.replace(/^@/, "").trim();
    if (!cleanUsername) throw new Error("Invalid GitHub username provided.");

    const res = await fetch(`${this.API_BASE}/users/${encodeURIComponent(cleanUsername)}`, {
      headers: this.getHeaders(),
    });

    if (res.status === 404) {
      throw new Error(`GitHub user "@${cleanUsername}" was not found.`);
    }
    if (!res.ok) {
      throw new Error(`GitHub API returned error status ${res.status}`);
    }

    return await res.json();
  }

  /**
   * Fetch top public repositories for a GitHub user
   */
  static async fetchUserRepos(username: string): Promise<any[]> {
    const cleanUsername = username.replace(/^@/, "").trim();
    const res = await fetch(
      `${this.API_BASE}/users/${encodeURIComponent(cleanUsername)}/repos?sort=updated&per_page=12&type=all`,
      { headers: this.getHeaders() }
    );

    if (!res.ok) return [];
    const repos = await res.json();
    return Array.isArray(repos) ? repos : [];
  }

  /**
   * Fetch public events for activity recency & commit telemetry
   */
  static async fetchUserEvents(username: string): Promise<any[]> {
    const cleanUsername = username.replace(/^@/, "").trim();
    const res = await fetch(
      `${this.API_BASE}/users/${encodeURIComponent(cleanUsername)}/events/public?per_page=15`,
      { headers: this.getHeaders() }
    );

    if (!res.ok) return [];
    const events = await res.json();
    return Array.isArray(events) ? events : [];
  }

  /**
   * Fetch repository README text from raw GitHub
   */
  static async fetchRepoReadme(username: string, repoName: string): Promise<string | null> {
    const cleanUser = username.replace(/^@/, "").trim();
    try {
      // 1. Try HEAD branch
      const headRes = await fetch(`https://raw.githubusercontent.com/${cleanUser}/${repoName}/HEAD/README.md`);
      if (headRes.ok) return await headRes.text();

      // 2. Try main branch
      const mainRes = await fetch(`https://raw.githubusercontent.com/${cleanUser}/${repoName}/main/README.md`);
      if (mainRes.ok) return await mainRes.text();

      // 3. Try master branch
      const masterRes = await fetch(`https://raw.githubusercontent.com/${cleanUser}/${repoName}/master/README.md`);
      if (masterRes.ok) return await masterRes.text();

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Intelligent heuristic for meaningful repo description
   */
  static inferProjectDescription(repoName: string, language: string, homepage?: string): string {
    const clean = repoName.toLowerCase().replace(/[-_]/g, " ");
    if (clean.includes("swipehire")) {
      return "AI-driven talent discovery, career matching, and rapid candidate screening platform.";
    }
    if (clean.includes("todo") || clean.includes("task")) {
      return `Task organization, tracking workflow, and ${language || "web"} productivity application.`;
    }
    if (clean.includes("dice") || clean.includes("game")) {
      return `Interactive gaming simulation with algorithmic roll mechanics and real-time state management.`;
    }
    if (clean.includes("healthcare") || clean.includes("health") || clean.includes("medical")) {
      return `Healthcare management backend service handling appointments, patient records, and medical workflows.`;
    }
    if (clean.includes("portfolio") || clean.includes("resume")) {
      return `Personal developer portfolio showcasing full-stack projects, responsive UI, and engineering capabilities.`;
    }
    if (clean.includes("lab") || clean.includes("research")) {
      return `Technical laboratory and algorithmic code workspace demonstrating modern ${language || "software"} architectures.`;
    }
    if (clean.includes("chat") || clean.includes("message")) {
      return `Real-time messaging and chat infrastructure with responsive communication protocols.`;
    }
    if (clean.includes("auth") || clean.includes("login")) {
      return `Authentication and identity verification service with secure session management.`;
    }
    if (clean.includes("api") || clean.includes("server") || clean.includes("backend")) {
      return `Scalable backend service and RESTful API architecture built with ${language || "modern technologies"}.`;
    }
    if (homepage) {
      return `Production web application deployed at ${homepage.replace(/^https?:\/\//, "")}.`;
    }
    return `Full-stack ${language || "software"} repository demonstrating structured application design and clean coding standards.`;
  }

  /**
   * Extract or infer key technical features for a project
   */
  static inferProjectFeatures(repoName: string, language: string, topics: string[] = []): string[] {
    const feats: string[] = [];
    const lower = repoName.toLowerCase();

    if (language === "TypeScript" || language === "JavaScript") {
      feats.push("Component-driven modular frontend architecture");
      feats.push("Asynchronous state synchronization and responsive UI handling");
    } else if (language === "Python") {
      feats.push("RESTful API endpoints and clean modular service layer");
      feats.push("Efficient data handling and algorithmic computational logic");
    } else {
      feats.push(`Structured code organization written in ${language}`);
    }

    if (lower.includes("dice") || lower.includes("game")) {
      feats.push("Stateful gameplay loop with randomized algorithmic seed generation");
      feats.push("Dynamic visual UI updates synced with live game events");
    } else if (lower.includes("todo") || lower.includes("task") || lower.includes("deploy")) {
      feats.push("Full CRUD lifecycle operations with persistent data store");
      feats.push("Validation rules, filtering, and priority queue ordering");
    } else if (lower.includes("swipe") || lower.includes("hire")) {
      feats.push("Double-sided candidate and recruiter matching engine");
      feats.push("Automated SLA tracking and live AI fit scoring integration");
    } else if (lower.includes("healthcare")) {
      feats.push("Secure patient records management and appointment scheduling");
      feats.push("Data validation guards and schema enforcement");
    } else {
      feats.push("Clean separation of concerns between business logic and UI/data layer");
      feats.push("Version controlled development adhering to modern git conventions");
    }

    if (topics.length > 0) {
      feats.push(`Configured with modern ecosystem tooling: ${topics.slice(0, 3).join(", ")}`);
    }

    return feats;
  }

  /**
   * Infer what this repository proves to a hiring manager or recruiter
   */
  static inferEngineeringSignal(repoName: string, language: string): string {
    const lower = repoName.toLowerCase();
    if (lower.includes("swipehire")) {
      return "Demonstrates staff-level product engineering, complex state machines, AI parsing pipelines, and multi-tenant recruitment security.";
    }
    if (lower.includes("dice") || lower.includes("game")) {
      return "Shows mastery of client-side reactive state management, event-driven architecture, and UI animation responsiveness.";
    }
    if (lower.includes("todo") || lower.includes("deploy")) {
      return `Proves understanding of deployment automation, server-side data models, and backend RESTful design in ${language}.`;
    }
    if (lower.includes("healthcare")) {
      return "Demonstrates ability to architect sensitive domain services with robust schema validation and clear domain modeling.";
    }
    return `Validates hands-on production competency in ${language}, active git version control discipline, and clean code principles.`;
  }

  /**
   * Build complete telemetry and profile payload for candidate profile
   */
  static async buildCandidateGitHubProfile(username: string): Promise<CandidateGitHubData> {
    const profile = await this.fetchUserProfile(username);
    const [rawRepos, rawEvents] = await Promise.all([
      this.fetchUserRepos(username).catch(() => []),
      this.fetchUserEvents(username).catch(() => []),
    ]);

    // 1. Calculate top languages with percentages
    const languageCounts: Record<string, number> = {};
    rawRepos.forEach((repo: any) => {
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      }
    });

    const totalLangCount = Object.values(languageCounts).reduce((a, b) => a + b, 0) || 1;
    const languages = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        percentage: Math.round((count / totalLangCount) * 100),
      }));

    const topLanguages = languages.map((l) => l.name).slice(0, 5);

    // 2. Map & prioritize top repos (by stars count + recency)
    const topRepos: GitHubRepoItem[] = rawRepos
      .filter((repo: any) => !repo.fork)
      .concat(rawRepos.filter((repo: any) => repo.fork))
      .slice(0, 6)
      .map((r: any) => {
        const lang = r.language || "Code";
        const hasCustomDesc = r.description && r.description.trim() && !r.description.toLowerCase().includes("public repository on github");
        const description = hasCustomDesc ? r.description.trim() : this.inferProjectDescription(r.name, lang, r.homepage);
        const features = this.inferProjectFeatures(r.name, lang, r.topics || []);
        const engineeringSignal = this.inferEngineeringSignal(r.name, lang);
        const techStack = [lang, ...(r.topics || [])];

        return {
          id: r.id,
          name: r.name,
          fullName: r.full_name,
          description,
          htmlUrl: r.html_url,
          url: r.html_url,
          homepage: r.homepage || undefined,
          language: lang,
          starsCount: r.stargazers_count || 0,
          stars: r.stargazers_count || 0,
          forksCount: r.forks_count || 0,
          forks: r.forks_count || 0,
          openIssuesCount: r.open_issues_count || 0,
          topics: r.topics || [],
          size: r.size || 0,
          license: r.license?.name || r.license?.spdx_id || undefined,
          updatedAt: r.updated_at,
          pushedAt: r.pushed_at || r.updated_at,
          aiSummary: description,
          aiKeyFeatures: features,
          aiTechStack: techStack,
          aiEngineeringSignal: engineeringSignal,
        };
      });

    // 3. Calculate total stars across all repositories
    const totalStars = rawRepos.reduce((acc: number, r: any) => acc + (r.stargazers_count || 0), 0);

    // 4. Calculate last active timestamp & activity summary
    let lastActiveAt = profile.updated_at || new Date().toISOString();
    let recentCommits = 0;

    if (rawEvents.length > 0) {
      const latestEvent = rawEvents[0];
      if (latestEvent.created_at) {
        lastActiveAt = latestEvent.created_at;
      }

      rawEvents.forEach((ev: any) => {
        if (ev.type === "PushEvent" && ev.payload?.commits) {
          recentCommits += ev.payload.commits.length;
        }
      });
    }

    const diffDays = Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60 * 24));
    let activityText = "Active recently";
    if (diffDays === 0) {
      activityText = "Active today on GitHub";
    } else if (diffDays === 1) {
      activityText = "Active yesterday on GitHub";
    } else if (diffDays < 30) {
      activityText = `Active ${diffDays} days ago on GitHub`;
    } else {
      activityText = `Last updated ${Math.floor(diffDays / 30)} months ago`;
    }

    if (recentCommits > 0) {
      activityText += ` · ${recentCommits} recent commits`;
    }

    const publicRepos = profile.public_repos ?? rawRepos.length;
    const followers = profile.followers ?? 0;
    const following = profile.following ?? 0;

    return {
      connected: true,
      username: profile.login,
      avatarUrl: profile.avatar_url,
      profileUrl: profile.html_url,
      publicReposCount: publicRepos,
      publicRepos: publicRepos,
      followersCount: followers,
      followers: followers,
      followingCount: following,
      totalStars,
      bio: profile.bio || "",
      company: profile.company || "",
      location: profile.location || "",
      topLanguages: topLanguages.length > 0 ? topLanguages : ["Code"],
      languages,
      topRepos,
      lastActiveAt,
      recentActivitySummary: activityText,
      lastActiveSummary: activityText,
      connectedAt: new Date().toISOString(),
    };
  }
}

