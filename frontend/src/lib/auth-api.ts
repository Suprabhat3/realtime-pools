export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};

const readErrorMessage = async (response: Response) => {
  try {
    const body = (await response.json()) as ApiErrorResponse;
    return body.error?.message ?? "Request failed";
  } catch {
    return "Request failed";
  }
};

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
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as T;
};

export type SessionUser = {
  id: string;
  email?: string;
  name?: string;
};

export type SessionPayload = {
  data: {
    authenticated: boolean;
    user: SessionUser | null;
  };
};

export type AuthResult = {
  message: string;
};

type MessageResponse = {
  message: string;
};

type UserResponse = {
  data: {
    user: SessionUser;
  };
};

export const getSession = () => request<SessionPayload>("/api/auth/session", { method: "GET" });

export const signInWithGoogle = (): void => {
  window.location.href = `${API_BASE_URL}/api/auth/google`;
};

export const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  const payload = await request<MessageResponse>("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  return { message: payload.message };
};

export const signUpWithEmail = async (
  name: string,
  email: string,
  password: string
): Promise<AuthResult> => {
  const payload = await request<MessageResponse>("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password
    })
  });

  return { message: payload.message };
};

export const verifyEmailCode = async (email: string, code: string): Promise<UserResponse> => {
  return request<UserResponse>("/api/auth/sign-in/verify", {
    method: "POST",
    body: JSON.stringify({ email, code })
  });
};

export const requestPasswordReset = async (email: string): Promise<AuthResult> => {
  const payload = await request<MessageResponse>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email })
  });

  return { message: payload.message };
};

export const resetPassword = async (token: string, password: string): Promise<AuthResult> => {
  const payload = await request<MessageResponse>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password })
  });

  return { message: payload.message };
};

export const signOut = async (): Promise<AuthResult> => {
  const payload = await request<MessageResponse>("/api/auth/sign-out", {
    method: "POST"
  });

  return { message: payload.message };
};
