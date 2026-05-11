export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

const request = async <T>(path: string, init: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.error?.message ?? "Request failed";
    throw new Error(message);
  }

  return (await response.json()) as T;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  gender: "MALE" | "FEMALE" | "NON_BINARY" | "PREFER_NOT_TO_SAY" | null;
  bio: string | null;
  location: string | null;
  birthday: string | null;
  phone: string | null;
  timezone: string | null;
  pronouns: string | null;
  image: string | null;
  imageFileId: string | null;
};

export type ImageKitSignature = {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
  folder: string;
};

export const getMyProfile = async (): Promise<UserProfile> => {
  const response = await request<{ data: UserProfile }>("/api/users/me", { method: "GET" });
  return response.data;
};

export const updateMyProfile = async (payload: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await request<{ data: UserProfile }>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

  return response.data;
};

export const getImageKitSignature = async (): Promise<ImageKitSignature> => {
  return request<ImageKitSignature>("/api/uploads/imagekit-signature", { method: "GET" });
};
