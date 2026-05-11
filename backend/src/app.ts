import cors from "cors";
import express from "express";
import type { Express } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import { allowedOrigins } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { healthRouter } from "./modules/health/health.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { pollsRouter } from "./modules/polls/polls.routes";
import { publicRouter } from "./modules/public/public.routes";

export const createApp = (): Express => {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin not allowed: ${origin}`));
      },
      credentials: true
    })
  );
  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());

  app.use(
    "/api/public",
    rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.use(healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/polls", pollsRouter);
  app.use("/api/public", publicRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
