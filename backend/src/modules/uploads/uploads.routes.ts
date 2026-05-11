import crypto from "node:crypto";
import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { env } from "../../config/env";
import { requireAuth } from "../shared/require-auth";

export const uploadsRouter: ExpressRouter = Router();

uploadsRouter.get("/imagekit-signature", requireAuth, (_req, res) => {
  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 10 * 60;
  const signature = crypto
    .createHmac("sha1", env.IMAGEKIT_PRIVATE_KEY)
    .update(token + expire)
    .digest("hex");

  res.status(200).json({
    token,
    expire,
    signature,
    publicKey: env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
    folder: "/profiles"
  });
});
