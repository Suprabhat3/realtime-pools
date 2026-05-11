import type { RequestHandler } from "express";

import { HttpError } from "../../middleware/error-handler";
import type { AuthUser } from "./auth.types";
import { getAccessTokenFromRequest, verifyAccessToken } from "../auth/auth.utils";

const parseAuthUser = (token: string | null): AuthUser | null => {
  if (!token) {
    return null;
  }

  const payload = verifyAccessToken(token);
  if (!payload?.sub) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name
  };
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  const user = parseAuthUser(getAccessTokenFromRequest(req));

  if (!user) {
    next(new HttpError(401, "Unauthorized"));
    return;
  }

  req.user = user;
  next();
};

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const user = parseAuthUser(getAccessTokenFromRequest(req));
  if (user) {
    req.user = user;
  }

  next();
};
