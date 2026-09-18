/**
 * Support Session Client Utility (Tab-scoped in sessionStorage)
 * Strictly avoids localStorage, logs, or analytics.
 */

export interface SupportSessionData {
  id: string;
  adminUserId: string;
  adminEmail: string;
  targetUserId: string;
  targetRole: "candidate" | "company";
  targetEntityId: string;
  targetName: string;
  reason: string;
  expiresAt: string;
}

const STORAGE_KEY = "swipehired_support_session";

export const SupportSessionClient = {
  get(): { token: string; session: SupportSessionData } | null {
    try {
      if (typeof window === "undefined" || !window.sessionStorage) return null;
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.session || !parsed.token) return null;

      // Check if expired locally
      if (new Date(parsed.session.expiresAt).getTime() <= Date.now()) {
        this.clear();
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  },

  set(token: string, session: SupportSessionData): void {
    try {
      if (typeof window === "undefined" || !window.sessionStorage) return;
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token, session })
      );
    } catch (err) {
      console.warn("[SupportSession] Failed to persist session to tab storage:", err);
    }
  },

  clear(): void {
    try {
      if (typeof window === "undefined" || !window.sessionStorage) return;
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  },

  isSupportMode(): boolean {
    const data = this.get();
    return !!data && !!data.session;
  },

  /**
   * Safely strip ?support_token= from URL using history replacement
   * Never leave token sitting in visible browser address bar or history.
   */
  stripTokenFromUrl(): void {
    try {
      if (typeof window === "undefined" || !window.history || !window.location) return;
      const url = new URL(window.location.href);
      if (url.searchParams.has("support_token")) {
        url.searchParams.delete("support_token");
        const cleanUrl = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "") + url.hash;
        window.history.replaceState(null, "", cleanUrl);
      }
    } catch (err) {
      console.warn("[SupportSession] Failed to strip token from URL:", err);
    }
  },
};
