import crypto from "node:crypto";
import bcrypt from "bcryptjs";

import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/error-handler";
import type { AuthUser } from "../shared/auth.types";
import { sendLoginOtpEmail, sendPasswordResetEmail } from "./auth.emails";
import type { GoogleProfile } from "./auth.google";
import {
  generateOtpCode,
  generateRefreshTokenId,
  hashToken,
  signAccessToken,
  signRefreshToken
} from "./auth.utils";

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const addMinutes = (minutes: number): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

const addDays = (days: number): Date => {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

const toAuthUser = (user: { id: string; email: string; name: string | null }): AuthUser => ({
  id: user.id,
  email: user.email,
  ...(user.name ? { name: user.name } : {})
});

export const createUser = async (name: string, email: string, password: string): Promise<AuthUser> => {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (existingUser) {
    throw new HttpError(409, "Email already in use");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash
    }
  });

  return toAuthUser(user);
};

export const verifyPassword = async (email: string, password: string): Promise<AuthUser> => {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    throw new HttpError(401, "Invalid credentials");
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw new HttpError(401, "Invalid credentials");
  }

  return toAuthUser(user);
};

export const sendLoginOtp = async (user: AuthUser): Promise<void> => {
  if (!user.email) {
    throw new HttpError(400, "Email is required for verification");
  }

  const code = generateOtpCode();
  const codeHash = hashToken(code);
  const expiresAt = addMinutes(env.LOGIN_OTP_TTL_MINUTES);

  await prisma.loginOtp.deleteMany({
    where: {
      userId: user.id,
      consumedAt: null
    }
  });

  await prisma.loginOtp.create({
    data: {
      userId: user.id,
      codeHash,
      expiresAt
    }
  });

  await sendLoginOtpEmail(user.email, code, env.LOGIN_OTP_TTL_MINUTES);
};

export const verifyLoginOtp = async (email: string, code: string): Promise<AuthUser> => {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    throw new HttpError(401, "Invalid verification code");
  }

  const codeHash = hashToken(code);
  const otp = await prisma.loginOtp.findFirst({
    where: {
      userId: user.id,
      codeHash,
      consumedAt: null,
      expiresAt: {
        gt: new Date()
      }
    }
  });

  if (!otp) {
    throw new HttpError(401, "Invalid verification code");
  }

  await prisma.loginOtp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() }
  });

  return toAuthUser(user);
};

export const issueTokens = async (user: AuthUser): Promise<{ accessToken: string; refreshToken: string }> => {
  const refreshTokenId = generateRefreshTokenId();
  const refreshToken = signRefreshToken(user.id, refreshTokenId);
  const refreshTokenHash = hashToken(refreshToken);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: addDays(env.REFRESH_TOKEN_TTL_DAYS)
    }
  });

  const accessToken = signAccessToken(user);

  return { accessToken, refreshToken };
};

export const rotateRefreshToken = async (refreshToken: string): Promise<AuthUser> => {
  const tokenHash = hashToken(refreshToken);
  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: true
    }
  });

  if (!storedToken) {
    throw new HttpError(401, "Invalid refresh token");
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() }
  });

  return toAuthUser(storedToken.user);
};

export const revokeRefreshToken = async (refreshToken: string): Promise<void> => {
  const tokenHash = hashToken(refreshToken);

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
};

export const createPasswordReset = async (email: string): Promise<void> => {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = addMinutes(env.RESET_TOKEN_TTL_MINUTES);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt
    }
  });

  const resetUrl = `${env.FRONTEND_URL.replace(/\/$/, "")}/reset-password?token=${token}`;

  await sendPasswordResetEmail(user.email, resetUrl, env.RESET_TOKEN_TTL_MINUTES);
};

export const resetPassword = async (token: string, password: string): Promise<void> => {
  const tokenHash = hashToken(token);
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: true
    }
  });

  if (!resetToken) {
    throw new HttpError(400, "Reset token is invalid or expired");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash }
    }),
    prisma.refreshToken.updateMany({
      where: {
        userId: resetToken.userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() }
    })
  ]);
};

export const findOrCreateGoogleUser = async (profile: GoogleProfile): Promise<AuthUser> => {
  const normalizedEmail = normalizeEmail(profile.email);
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (existingUser) {
    const updates: { name?: string; image?: string } = {};

    if (!existingUser.name && profile.name) {
      updates.name = profile.name;
    }

    if (profile.picture && existingUser.image !== profile.picture) {
      updates.image = profile.picture;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: updates
      });
    }

    return {
      id: existingUser.id,
      email: existingUser.email,
      ...((existingUser.name ?? profile.name) ? { name: existingUser.name ?? profile.name } : {})
    };
  }

  const randomPassword = crypto.randomBytes(32).toString("hex");
  const passwordHash = await bcrypt.hash(randomPassword, 12);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: profile.name ?? null,
      image: profile.picture ?? null,
      passwordHash
    }
  });

  return toAuthUser(user);
};
