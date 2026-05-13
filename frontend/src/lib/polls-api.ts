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

// Types
export type PollQuestionOption = { id?: string; label: string; orderIndex?: number };
export type PollQuestion = { id?: string; text: string; isRequired: boolean; options: PollQuestionOption[] };

export type CreatePollQuestionInput = { text: string; isRequired: boolean; options: string[] };

export type CreatePollInput = {
  title: string;
  description?: string;
  responseMode: "ANONYMOUS" | "AUTHENTICATED";
  expiresAt: string;
  questions: CreatePollQuestionInput[];
};

export type PollSummary = {
  id: string;
  slug: string;
  title: string;
  responseMode: string;
  isPublished: boolean;
  expiresAt: string;
  createdAt: string;
};

export type DashboardPollsResponse = { data: PollSummary[] };
export type PollResponse = { data: any }; // Using any for brevity, map exactly if needed

// APIs
export const getCreatorPolls = () => request<DashboardPollsResponse>("/api/polls");
export const getCreatorPollById = (pollId: string) => request<PollResponse>(`/api/polls/${pollId}`);
export const createPoll = (data: CreatePollInput) => request<PollResponse>("/api/polls", { method: "POST", body: JSON.stringify(data) });
export const updatePoll = (pollId: string, data: Partial<CreatePollInput>) => request<PollResponse>(`/api/polls/${pollId}`, { method: "PATCH", body: JSON.stringify(data) });
export const publishPoll = (pollId: string) => request<PollResponse>(`/api/polls/${pollId}/publish`, { method: "POST" });
export const getPollAnalytics = (pollId: string) => request<any>(`/api/polls/${pollId}/analytics`);

// Public APIs
export const getPublicPoll = (slug: string) => request<any>(`/api/public/polls/${slug}`);
export const getPublicPollResults = (slug: string) => request<any>(`/api/public/polls/${slug}/results`);
export const submitPublicResponse = (slug: string, answers: { questionId: string; optionId: string }[], submitAsAnonymous?: boolean) => 
  request<any>(`/api/public/polls/${slug}/submissions`, { method: "POST", body: JSON.stringify({ answers, submitAsAnonymous }) });
