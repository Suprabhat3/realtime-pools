import crypto from "node:crypto";

import type { Prisma, ResponseMode } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/error-handler";
import type { CreatePollInput, UpdatePollInput } from "./polls.schemas";

const pollWithRelationsInclude = {
  questions: {
    orderBy: { orderIndex: "asc" },
    include: { options: { orderBy: { orderIndex: "asc" } } }
  },
  _count: {
    select: { submissions: true }
  }
} as const;

type PollWithRelations = Prisma.PollGetPayload<{
  include: typeof pollWithRelationsInclude;
}>;

const createSlug = (title: string) => {
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);

  const base = normalized.length > 0 ? normalized : "poll";
  return `${base}-${crypto.randomBytes(3).toString("hex")}`;
};

/**
 * State machine (corrected):
 *   "draft"  → isPublished = false  (not yet live)
 *   "active" → isPublished = true   AND not time-expired AND votes < maxResponses
 *   "closed" → isPublished = true   AND (time-expired OR votes >= maxResponses)
 */
const pollState = (
  poll: { isPublished: boolean; expiresAt: Date; maxResponses: number | null },
  totalResponses: number
) => {
  if (!poll.isPublished) return "draft";
  const timeExpired = poll.expiresAt.getTime() < Date.now();
  const voteLimitReached = poll.maxResponses !== null && totalResponses >= poll.maxResponses;
  if (timeExpired || voteLimitReached) return "closed";
  return "active";
};

const mapPollSummary = (poll: PollWithRelations) => {
  const totalResponses = poll._count.submissions;
  return {
    id: poll.id,
    slug: poll.slug,
    title: poll.title,
    description: poll.description,
    responseMode: poll.responseMode,
    isPublished: poll.isPublished,
    isPublic: poll.isPublic,
    maxResponses: poll.maxResponses,
    expiresAt: poll.expiresAt.toISOString(),
    createdAt: poll.createdAt.toISOString(),
    updatedAt: poll.updatedAt.toISOString(),
    totalQuestions: poll.questions.length,
    totalResponses,
    state: pollState(poll, totalResponses)
  };
};

const mapPollDetails = (poll: PollWithRelations) => ({
  ...mapPollSummary(poll),
  questions: poll.questions.map((question) => ({
    id: question.id,
    text: question.text,
    isRequired: question.isRequired,
    orderIndex: question.orderIndex,
    options: question.options.map((option) => ({
      id: option.id,
      label: option.label,
      orderIndex: option.orderIndex
    }))
  }))
});

const ensurePollOwned = async (pollId: string, creatorId: string) => {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: pollWithRelationsInclude
  });

  if (!poll || poll.creatorId !== creatorId) {
    throw new HttpError(404, "Poll not found");
  }

  return poll;
};

const buildQuestionsCreate = (questions: CreatePollInput["questions"]) => ({
  create: questions.map((question, questionIndex) => ({
    text: question.text,
    isRequired: question.isRequired,
    orderIndex: questionIndex,
    options: {
      create: question.options.map((optionLabel, optionIndex) => ({
        label: optionLabel,
        orderIndex: optionIndex
      }))
    }
  }))
});

export const createPoll = async (creatorId: string, input: CreatePollInput) => {
  const poll = await prisma.poll.create({
    data: {
      creatorId,
      title: input.title,
      ...(input.description !== undefined ? { description: input.description } : {}),
      responseMode: input.responseMode as ResponseMode,
      isPublic: input.isPublic ?? true,
      isPublished: true, // Creating via the form = immediately live
      maxResponses: input.maxResponses ?? null,
      expiresAt: new Date(input.expiresAt),
      slug: createSlug(input.title),
      questions: buildQuestionsCreate(input.questions)
    },
    include: pollWithRelationsInclude
  });

  return mapPollDetails(poll);
};

export const listCreatorPolls = async (creatorId: string) => {
  const polls = await prisma.poll.findMany({
    where: { creatorId },
    orderBy: { createdAt: "desc" },
    include: pollWithRelationsInclude
  });

  return polls.map(mapPollSummary);
};

export const getCreatorPollById = async (pollId: string, creatorId: string) => {
  const poll = await ensurePollOwned(pollId, creatorId);
  return mapPollDetails(poll);
};

export const updateCreatorPoll = async (
  pollId: string,
  creatorId: string,
  input: UpdatePollInput
) => {
  await ensurePollOwned(pollId, creatorId);

  const updated = await prisma.$transaction(async (tx) => {
    if (input.questions) {
      await tx.option.deleteMany({ where: { question: { pollId } } });
      await tx.question.deleteMany({ where: { pollId } });
    }

    return tx.poll.update({
      where: { id: pollId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.responseMode !== undefined
          ? { responseMode: input.responseMode as ResponseMode }
          : {}),
        ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
        ...(input.maxResponses !== undefined ? { maxResponses: input.maxResponses } : {}),
        ...(input.expiresAt !== undefined ? { expiresAt: new Date(input.expiresAt) } : {}),
        ...(input.questions ? { questions: buildQuestionsCreate(input.questions) } : {})
      },
      include: pollWithRelationsInclude
    });
  });

  return mapPollDetails(updated);
};

/**
 * "Publish" in the context of the dashboard = close the poll and lock results.
 * We use isPublished=false to represent "closed/locked" for the creator action,
 * which is the inverse: creator explicitly closes → set isPublished=false.
 *
 * Actually: let's keep isPublished=true=live, and closing = setting expiresAt to now.
 * This avoids further confusion. Closing a poll early just backdates its expiresAt.
 */
export const closePoll = async (pollId: string, creatorId: string) => {
  const poll = await ensurePollOwned(pollId, creatorId);

  const updated = await prisma.poll.update({
    where: { id: pollId },
    data: { expiresAt: new Date() } // expire immediately
  });

  return {
    id: updated.id,
    slug: updated.slug,
    state: "closed",
    closedAt: updated.updatedAt.toISOString()
  };
};

/** Legacy endpoint — kept for backward compat but now it activates a draft. */
export const publishPoll = async (pollId: string, creatorId: string) => {
  await ensurePollOwned(pollId, creatorId);

  const updated = await prisma.poll.update({
    where: { id: pollId },
    data: { isPublished: true }
  });

  return {
    id: updated.id,
    slug: updated.slug,
    isPublished: updated.isPublished,
    publishedAt: updated.updatedAt.toISOString()
  };
};

export const getPollAnalytics = async (pollId: string, creatorId: string) => {
  const poll = await ensurePollOwned(pollId, creatorId);

  const submissions = await prisma.submission.findMany({
    where: { pollId },
    include: {
      answers: { include: { option: true } },
      respondentUser: { select: { id: true, name: true, email: true } }
    }
  });

  const totalResponses = submissions.length;
  const authenticatedResponses = submissions.filter((s) => !s.isAnonymous).length;
  const anonymousResponses = submissions.filter((s) => s.isAnonymous).length;

  const questionSummaries = poll.questions.map((question) => {
    const optionCounts = new Map<string, number>();
    for (const option of question.options) optionCounts.set(option.id, 0);

    let answeredCount = 0;
    for (const submission of submissions) {
      const answer = submission.answers.find((entry) => entry.questionId === question.id);
      if (!answer) continue;
      answeredCount += 1;
      optionCounts.set(answer.optionId, (optionCounts.get(answer.optionId) ?? 0) + 1);
    }

    return {
      questionId: question.id,
      questionText: question.text,
      isRequired: question.isRequired,
      answeredCount,
      skippedCount: totalResponses - answeredCount,
      optionCounts: question.options.map((option) => ({
        optionId: option.id,
        optionLabel: option.label,
        count: optionCounts.get(option.id) ?? 0,
        percentage:
          answeredCount === 0
            ? 0
            : Number((((optionCounts.get(option.id) ?? 0) / answeredCount) * 100).toFixed(2))
      }))
    };
  });

  const voters =
    poll.responseMode === "AUTHENTICATED"
      ? submissions
          .filter((s) => s.respondentUser)
          .map((s) => ({
            name: s.respondentUser!.name ?? s.respondentUser!.email ?? "User",
            submittedAt: s.submittedAt.toISOString()
          }))
      : undefined;

  return {
    poll: {
      id: poll.id,
      slug: poll.slug,
      title: poll.title,
      responseMode: poll.responseMode,
      isPublished: poll.isPublished,
      isPublic: poll.isPublic,
      maxResponses: poll.maxResponses,
      expiresAt: poll.expiresAt.toISOString(),
      state: pollState(poll, totalResponses)
    },
    overview: {
      totalResponses,
      authenticatedResponses,
      anonymousResponses
    },
    voters,
    questions: questionSummaries,
    updatedAt: new Date().toISOString()
  };
};
