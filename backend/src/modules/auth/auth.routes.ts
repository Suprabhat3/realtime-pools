import crypto from "node:crypto";
import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { env } from "../../config/env";
import { HttpError } from "../../middleware/error-handler";
import { optionalAuth } from "../shared/require-auth";
import { buildGoogleAuthUrl, fetchGoogleProfile } from "./auth.google";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  verifyOtpSchema
} from "./auth.schemas";
import {
  createPasswordReset,
  createUser,
  findOrCreateGoogleUser,
  issueTokens,
  resetPassword,
  revokeRefreshToken,
  rotateRefreshToken,
  sendLoginOtp,
  verifyLoginOtp,
  verifyPassword
} from "./auth.service";
import {
  clearAuthCookies,
  getRefreshTokenFromRequest,
  setAuthCookies,
  verifyRefreshToken
} from "./auth.utils";

export const authRouter: ExpressRouter = Router();

const GOOGLE_STATE_COOKIE = "zp_google_state";

const getOauthErrorUrl = (reason: string): string => {
  const url = new URL("/signin", env.FRONTEND_URL);
  url.searchParams.set("error", reason);
  return url.toString();
};

authRouter.get("/session", optionalAuth, (req, res) => {
  res.status(200).json({
    data: {
      authenticated: Boolean(req.user),
      user: req.user ?? null
    }
  });
});

authRouter.get("/google", (req, res, next) => {
  try {
    const state = crypto.randomUUID();
    const authUrl = buildGoogleAuthUrl(req, state);

    res.cookie(GOOGLE_STATE_COOKIE, state, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/google",
      maxAge: 10 * 60 * 1000
    });

    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
});

authRouter.get("/google/callback", async (req, res, next) => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : null;
    const state = typeof req.query.state === "string" ? req.query.state : null;
    const storedState = req.cookies?.[GOOGLE_STATE_COOKIE];

    res.clearCookie(GOOGLE_STATE_COOKIE, { path: "/api/auth/google" });

    if (!code) {
      res.redirect(getOauthErrorUrl("missing_code"));
      return;
    }

    if (!state || !storedState || storedState !== state) {
      res.redirect(getOauthErrorUrl("invalid_state"));
      return;
    }

    const profile = await fetchGoogleProfile(req, code);
    const user = await findOrCreateGoogleUser(profile);
    const { accessToken, refreshToken } = await issueTokens(user);

    setAuthCookies(res, accessToken, refreshToken);
    res.redirect(`${env.FRONTEND_URL.replace(/\/$/, "")}/auth/success`);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/sign-up/email", async (req, res, next) => {
  try {
    const payload = signUpSchema.parse(req.body);
    const user = await createUser(payload.name, payload.email, payload.password);
    await sendLoginOtp(user);

    res.status(200).json({
      message: "Verification code sent"
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/sign-in/email", async (req, res, next) => {
  try {
    const payload = signInSchema.parse(req.body);
    const user = await verifyPassword(payload.email, payload.password);
    await sendLoginOtp(user);

    res.status(200).json({
      message: "Verification code sent"
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/sign-in/verify", async (req, res, next) => {
  try {
    const payload = verifyOtpSchema.parse(req.body);
    const user = await verifyLoginOtp(payload.email, payload.code);
    const { accessToken, refreshToken } = await issueTokens(user);

    setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json({
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (!refreshToken) {
      throw new HttpError(401, "Missing refresh token");
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new HttpError(401, "Invalid refresh token");
    }

    const user = await rotateRefreshToken(refreshToken);
    const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user);

    setAuthCookies(res, accessToken, newRefreshToken);
    res.status(200).json({
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/sign-out", async (req, res, next) => {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    clearAuthCookies(res);
    res.status(200).json({
      message: "Signed out"
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/forgot-password", async (req, res, next) => {
  try {
    const payload = forgotPasswordSchema.parse(req.body);
    await createPasswordReset(payload.email);

    res.status(200).json({
      message: "If the account exists, a reset link has been sent"
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/reset-password", async (req, res, next) => {
  try {
    const payload = resetPasswordSchema.parse(req.body);
    await resetPassword(payload.token, payload.password);

    res.status(200).json({
      message: "Password updated"
    });
  } catch (error) {
    next(error);
  }
});
