import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { requireAuth } from "../shared/require-auth";
import { createPollSchema, updatePollSchema } from "./polls.schemas";
import {
  closePoll,
  createPoll,
  getCreatorPollById,
  getPollAnalytics,
  listCreatorPolls,
  publishPoll,
  updateCreatorPoll
} from "./polls.service";

export const pollsRouter: ExpressRouter = Router();

const getSingleParam = (value: string | string[] | undefined): string | null => {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && value.length > 0 && value[0]) return value[0];
  return null;
};

pollsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const polls = await listCreatorPolls(req.user!.id);
    res.status(200).json({ data: polls });
  } catch (error) {
    next(error);
  }
});

pollsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const parsed = createPollSchema.parse(req.body);
    const poll = await createPoll(req.user!.id, parsed);
    res.status(201).json({ data: poll });
  } catch (error) {
    next(error);
  }
});

pollsRouter.get("/:pollId", requireAuth, async (req, res, next) => {
  try {
    const pollId = getSingleParam(req.params.pollId);
    if (!pollId) {
      res.status(400).json({ error: { message: "Invalid poll id" } });
      return;
    }

    const poll = await getCreatorPollById(pollId, req.user!.id);
    res.status(200).json({ data: poll });
  } catch (error) {
    next(error);
  }
});

pollsRouter.patch("/:pollId", requireAuth, async (req, res, next) => {
  try {
    const pollId = getSingleParam(req.params.pollId);
    if (!pollId) {
      res.status(400).json({ error: { message: "Invalid poll id" } });
      return;
    }

    const parsed = updatePollSchema.parse(req.body);
    const poll = await updateCreatorPoll(pollId, req.user!.id, parsed);
    res.status(200).json({ data: poll });
  } catch (error) {
    next(error);
  }
});

// Legacy: activate a draft poll
pollsRouter.post("/:pollId/publish", requireAuth, async (req, res, next) => {
  try {
    const pollId = getSingleParam(req.params.pollId);
    if (!pollId) {
      res.status(400).json({ error: { message: "Invalid poll id" } });
      return;
    }

    const result = await publishPoll(pollId, req.user!.id);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
});

// Close a poll early (sets expiresAt = now)
pollsRouter.post("/:pollId/close", requireAuth, async (req, res, next) => {
  try {
    const pollId = getSingleParam(req.params.pollId);
    if (!pollId) {
      res.status(400).json({ error: { message: "Invalid poll id" } });
      return;
    }

    const result = await closePoll(pollId, req.user!.id);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
});

pollsRouter.get("/:pollId/analytics", requireAuth, async (req, res, next) => {
  try {
    const pollId = getSingleParam(req.params.pollId);
    if (!pollId) {
      res.status(400).json({ error: { message: "Invalid poll id" } });
      return;
    }

    const analytics = await getPollAnalytics(pollId, req.user!.id);
    res.status(200).json({ data: analytics });
  } catch (error) {
    next(error);
  }
});
