import type { Request } from "express";
import { OAuth2Client } from "google-auth-library";

import { env } from "../../config/env";

export type GoogleProfile = {
  email: string;
  name?: string;
  picture?: string;
  emailVerified?: boolean;
};

const oauthClient = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);

const getBaseUrl = (req: Request): string => {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto ? forwardedProto.split(",")[0] : req.protocol;
  const host = req.get("host");

  if (!host) {
    throw new Error("Unable to determine request host");
  }

  return `${protocol}://${host}`;
};

export const getGoogleRedirectUri = (req: Request): string => {
  return `${getBaseUrl(req)}/api/auth/google/callback`;
};

export const buildGoogleAuthUrl = (req: Request, state: string): string => {
  return oauthClient.generateAuthUrl({
    redirect_uri: getGoogleRedirectUri(req),
    access_type: "offline",
    prompt: "consent",
    scope: ["openid", "email", "profile"],
    state
  });
};

export const fetchGoogleProfile = async (req: Request, code: string): Promise<GoogleProfile> => {
  const { tokens } = await oauthClient.getToken({
    code,
    redirect_uri: getGoogleRedirectUri(req)
  });

  if (!tokens.id_token) {
    throw new Error("Missing id token from Google");
  }

  const ticket = await oauthClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new Error("Missing email from Google profile");
  }

  return {
    email: payload.email,
    ...(payload.name ? { name: payload.name } : {}),
    ...(payload.picture ? { picture: payload.picture } : {}),
    ...(typeof payload.email_verified === "boolean"
      ? { emailVerified: payload.email_verified }
      : {})
  };
};
