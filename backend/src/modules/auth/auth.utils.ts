import crypto from "node:crypto";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../../config/env";
import type { AuthUser } from "../shared/auth.types";

const ACCESS_COOKIE = "zp_access";
const REFRESH_COOKIE = "zp_refresh";

/**
 * Determines cookie security settings based on the ACTUAL request protocol.
 * req.secure is true when the request arrived over HTTPS, which works correctly
 * on Railway because app.set("trust proxy", 1) is configured in app.ts.
 * This avoids relying on NODE_ENV or FRONTEND_URL being set correctly in the
 * host environment — the source of the cross-origin cookie bug.
 */
const getCookieOptions = (req: Request) => {
  const isProduction = env.NODE_ENV === "production";
  const secure =
    isProduction ||
    req.secure ||
    req.headers["x-forwarded-proto"] === "https";
  return {
    secure,
    sameSite: secure ? ("none" as const) : ("lax" as const)
  };
};

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

export const setAuthCookies = (
  req: Request,
  res: Response,
  accessToken: string,
  refreshToken: string
): void => {
  const cookieOptions = getCookieOptions(req);

  res.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    ...cookieOptions,
    path: "/",
    maxAge: env.ACCESS_TOKEN_TTL_MINUTES * 60 * 1000
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    ...cookieOptions,
    path: "/",
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  });
};

export const clearAuthCookies = (req: Request, res: Response): void => {
  const cookieOptions = getCookieOptions(req);
  res.clearCookie(ACCESS_COOKIE, {
    path: "/",
    ...cookieOptions
  });
  res.clearCookie(REFRESH_COOKIE, {
    path: "/",
    ...cookieOptions
  });
};
