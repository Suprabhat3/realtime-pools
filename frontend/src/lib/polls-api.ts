import { API_BASE_URL } from "./auth-api";

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

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
