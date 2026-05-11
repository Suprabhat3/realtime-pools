import { Router } from "express";
import type { Router as ExpressRouter } from "express";

export const healthRouter: ExpressRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "backend",
    timestamp: new Date().toISOString()
  });
});
