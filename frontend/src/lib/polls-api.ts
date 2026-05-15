import { API_BASE_URL } from "./auth-api";

/**
 * Attempts to silently refresh the access token using the refresh cookie.
 * Returns true if the refresh succeeded (new cookies are now set), false otherwise.
 */
const tryRefreshToken = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include"
    });
    return res.ok;
  } catch {
    return false;
  }
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const doFetch = () =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      }
    });

  let response = await doFetch();

  // If the access token is expired, try to refresh it and retry once.
  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      response = await doFetch();
    } else {
      // Both access and refresh tokens failed — session is fully expired.
      // Notify the app so it can redirect the user to sign-in.
      window.dispatchEvent(new CustomEvent("auth:expired"));
      throw new Error("Session expired. Please sign in again.");
    }
  }

  if (!response.ok) {
    let message = "Request failed";
    try {
      const body = await response.json();
      message = body?.error?.message ?? message;
    } catch {}
    throw new Error(message);
  }

  return (await response.json()) as T;
};

// ─── Types ───────────────────────────────────────────────────────────────────

export type PollQuestionOption = { id?: string; label: string; orderIndex?: number };
export type PollQuestion = { id?: string; text: string; isRequired: boolean; options: PollQuestionOption[] };

export type CreatePollQuestionInput = { text: string; isRequired: boolean; options: string[] };

export type CreatePollInput = {
  title: string;
  description?: string;
  responseMode: "ANONYMOUS" | "AUTHENTICATED";
  isPublic: boolean;
  expiresAt: string;
  maxResponses?: number;
  questions: CreatePollQuestionInput[];
};

export type PollSummary = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  responseMode: string;
  isPublished: boolean;
  isPublic: boolean;
  maxResponses?: number | null;
  expiresAt: string;
  createdAt: string;
  totalResponses: number;
  isAnnounced?: boolean;
  state: "draft" | "active" | "closed";
};

export type PublicPollCard = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  responseMode: string;
  maxResponses?: number | null;
  expiresAt: string;
  createdAt: string;
  totalVotes: number;
  isAnnounced?: boolean;
  creator: { name: string | null; image: string | null };
  firstQuestion: {
    id: string;
    text: string;
    options: { id: string; label: string }[];
  } | null;
};

export type DashboardPollsResponse = { data: PollSummary[] };
export type PollResponse = { data: any };
export type PublicPollsResponse = { data: PublicPollCard[] };

// ─── Creator APIs (authenticated) ────────────────────────────────────────────

export const getCreatorPolls = () => request<DashboardPollsResponse>("/api/polls");
export const getCreatorPollById = (pollId: string) => request<PollResponse>(`/api/polls/${pollId}`);
export const createPoll = (data: CreatePollInput) =>
  request<PollResponse>("/api/polls", { method: "POST", body: JSON.stringify(data) });
export const updatePoll = (pollId: string, data: Partial<CreatePollInput>) =>
  request<PollResponse>(`/api/polls/${pollId}`, { method: "PATCH", body: JSON.stringify(data) });
export const publishPoll = (pollId: string) =>
  request<PollResponse>(`/api/polls/${pollId}/publish`, { method: "POST" });
export const closePoll = (pollId: string) =>
  request<PollResponse>(`/api/polls/${pollId}/close`, { method: "POST" });
export const getPollAnalytics = (pollId: string) =>
  request<any>(`/api/polls/${pollId}/analytics`);
export const announcePollResults = (pollId: string) =>
  request<PollResponse>(`/api/polls/${pollId}/announce`, { method: "POST" });

// ─── Public APIs ─────────────────────────────────────────────────────────────

export const listPublicPolls = (category?: string) => {
  const qs = category && category !== "All Topics" ? `?category=${encodeURIComponent(category)}` : "";
  return request<PublicPollsResponse>(`/api/public/polls${qs}`);
};

export const getPublicPoll = (slug: string) => request<any>(`/api/public/polls/${slug}`);

export const getPublicPollResults = (slug: string) =>
  request<any>(`/api/public/polls/${slug}/results`);

export const submitPublicResponse = (
  slug: string,
  answers: { questionId: string; optionId: string }[],
  submitAsAnonymous?: boolean,
  fingerprintId?: string
) =>
  request<any>(`/api/public/polls/${slug}/submissions`, {
    method: "POST",
    body: JSON.stringify({ answers, submitAsAnonymous, fingerprintId })
  });

// ─── Fingerprint helpers ──────────────────────────────────────────────────────

const FINGERPRINT_KEY = "vp_fingerprint";

/** Returns a stable browser UUID stored in localStorage. */
export const getOrCreateFingerprint = (): string => {
  let fp = localStorage.getItem(FINGERPRINT_KEY);
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem(FINGERPRINT_KEY, fp);
  }
  return fp;
};

/** Returns the set of poll slugs this browser has already voted on. */
export const getVotedPolls = (): Set<string> => {
  try {
    const raw = localStorage.getItem("vp_voted") ?? "[]";
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
};

/** Mark a poll slug as voted in localStorage. */
export const markPollVoted = (slug: string): void => {
  const set = getVotedPolls();
  set.add(slug);
  localStorage.setItem("vp_voted", JSON.stringify([...set]));
};
