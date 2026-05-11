import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { getSocketServer } from "../realtime/socket";
import { optionalAuth } from "../shared/require-auth";
import { publicSubmissionSchema } from "./public.schemas";
import { getPublicPoll, getPublicPollResults, submitPublicResponse } from "./public.service";

export const publicRouter: ExpressRouter = Router();

const getSingleParam = (value: string | string[] | undefined): string | null => {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && value.length > 0 && value[0]) return value[0];
  return null;
};

publicRouter.get("/polls/:slug", async (req, res, next) => {
  try {
    const slug = getSingleParam(req.params.slug);
    if (!slug) {
      res.status(400).json({ error: { message: "Invalid poll slug" } });
      return;
    }

    const poll = await getPublicPoll(slug);
    res.status(200).json({ data: poll });
  } catch (error) {
    next(error);
  }
});

publicRouter.post("/polls/:slug/submissions", optionalAuth, async (req, res, next) => {
  try {
    const slug = getSingleParam(req.params.slug);
    if (!slug) {
      res.status(400).json({ error: { message: "Invalid poll slug" } });
      return;
    }

    const payload = publicSubmissionSchema.parse(req.body);
    const result = await submitPublicResponse(slug, payload, req.user);

    const io = getSocketServer();
    io.to(`poll:${result.pollId}:owner`).emit("responses:count", {
      pollId: result.pollId,
      totalResponses: result.totalResponses
    });

    io.to(`poll:${result.pollId}:owner`).emit("analytics:update", {
      pollId: result.pollId,
      updatedAt: new Date().toISOString()
    });

    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
});

publicRouter.get("/polls/:slug/results", async (req, res, next) => {
  try {
    const slug = getSingleParam(req.params.slug);
    if (!slug) {
      res.status(400).json({ error: { message: "Invalid poll slug" } });
      return;
    }

    const results = await getPublicPollResults(slug);
    res.status(200).json({ data: results });
  } catch (error) {
    next(error);
  }
});
