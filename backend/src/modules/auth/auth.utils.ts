import crypto from "node:crypto";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../../config/env";
import type { AuthUser } from "../shared/auth.types";

const ACCESS_COOKIE = "zp_access";
const REFRESH_COOKIE = "zp_refresh";

const usesSecureCookies = env.NODE_ENV === "production" || env.FRONTEND_URL.startsWith("https://");
const authCookieOptions = {
  secure: usesSecureCookies,
  sameSite: usesSecureCookies ? "none" : "lax"
} as const;

export type AccessTokenPayload = {
  sub: string;
  email?: string;
  name?: string;
};

export type RefreshTokenPayload = {
  sub: string;
  jti: string;
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const generateOtpCode = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};

export const generateRefreshTokenId = (): string => {
  return crypto.randomUUID();
};

export const signAccessToken = (user: AuthUser): string => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m` }
  );
};

export const signRefreshToken = (userId: string, tokenId: string): string => {
  return jwt.sign(
    {
      sub: userId,
      jti: tokenId
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` }
  );
};

export const verifyAccessToken = (token: string): AccessTokenPayload | null => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload | null => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    return null;
  }
};

export const getAccessTokenFromRequest = (req: Request): string | null => {
  const cookieToken = req.cookies?.[ACCESS_COOKIE];
  if (cookieToken && typeof cookieToken === "string") {
    return cookieToken;
  }

  const header = req.header("authorization");
  if (!header) {
    return null;
  }

  const [scheme, value] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) {
    return null;
  }

  return value;
};

export const getRefreshTokenFromRequest = (req: Request): string | null => {
  const cookieToken = req.cookies?.[REFRESH_COOKIE];
  if (cookieToken && typeof cookieToken === "string") {
    return cookieToken;
  }

  return null;
};

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  res.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    ...authCookieOptions,
    path: "/",
    maxAge: env.ACCESS_TOKEN_TTL_MINUTES * 60 * 1000
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    ...authCookieOptions,
    path: "/",
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(ACCESS_COOKIE, { 
    path: "/",
    ...authCookieOptions
  });
  res.clearCookie(REFRESH_COOKIE, { 
    path: "/",
    ...authCookieOptions
  });
};
