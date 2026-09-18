/**
 * Safe Storage & JSON Parsing Utility
 * Resilient against iOS WebKit / Safari Private Browsing restrictions,
 * DOMException SecurityErrors, quota exhaustion, and malformed JSON values.
 */

// In-memory fallback map for environments where localStorage is restricted or throws
const memoryStore = new Map<string, string>();

/**
 * Checks if window.localStorage is accessible and writable.
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__sh_storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const storageAvailable = isLocalStorageAvailable();

export const safeStorage = {
  /**
   * Safely retrieves a string item from localStorage with in-memory fallback.
   */
  getItem(key: string): string | null {
    try {
      if (storageAvailable && typeof window !== "undefined") {
        const item = window.localStorage.getItem(key);
        if (item !== null) return item;
      }
    } catch {
      // Fall through to memoryStore on SecurityError / access restriction
    }
    return memoryStore.has(key) ? memoryStore.get(key)! : null;
  },

  /**
   * Safely sets a string item into localStorage with in-memory fallback.
   */
  setItem(key: string, value: string): void {
    try {
      if (storageAvailable && typeof window !== "undefined") {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Storage quota exceeded or SecurityError
    }
    memoryStore.set(key, value);
  },

  /**
   * Safely removes an item from localStorage and in-memory store.
   */
  removeItem(key: string): void {
    try {
      if (storageAvailable && typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore errors
    }
    memoryStore.delete(key);
  },

  /**
   * Safely parses JSON with fallback, guarding against "undefined", null, empty string,
   * corrupted old cache, and syntax errors.
   */
  parseJson<T>(raw: string | null | undefined, fallback: T): T {
    if (!raw || raw === "undefined" || raw === "null" || raw.trim() === "") {
      return fallback;
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed === null || parsed === undefined) {
        return fallback;
      }
      return parsed as T;
    } catch {
      return fallback;
    }
  },

  /**
   * Convenience helper to retrieve and parse JSON in one safe operation.
   */
  getJSON<T>(key: string, fallback: T): T {
    const raw = this.getItem(key);
    return safeStorage.parseJson<T>(raw, fallback);
  },

  /**
   * Convenience helper to serialize and store JSON in one safe operation.
   */
  setJSON<T>(key: string, value: T): void {
    try {
      this.setItem(key, JSON.stringify(value));
    } catch {
      // Handle serialization errors gracefully
    }
  },
};
