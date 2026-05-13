import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/error-handler";
import type { AuthUser } from "../shared/auth.types";
import type { PublicSubmissionInput } from "./public.schemas";

type PublicPollRecord = Prisma.PollGetPayload<{
  include: {
    questions: {
      orderBy: { orderIndex: "asc" };
      include: { options: { orderBy: { orderIndex: "asc" } } };
    };
    creator: { select: { name: true; image: true } };
  };
}>;

const nowIso = () => new Date().toISOString();

const mapPublicPoll = (poll: PublicPollRecord) => {
  const expired = poll.expiresAt.getTime() < Date.now();

  return {
    id: poll.id,
    slug: poll.slug,
    title: poll.title,
    description: poll.description,
    responseMode: poll.responseMode,
    isPublished: poll.isPublished,
    isPublic: poll.isPublic,
    expiresAt: poll.expiresAt.toISOString(),
    createdAt: poll.createdAt.toISOString(),
    isExpired: expired,
    state: poll.isPublished ? "published" : expired ? "expired" : "active",
    creator: {
      name: poll.creator.name,
      image: poll.creator.image
    },
    questions: poll.questions.map((question) => ({
      id: question.id,
      text: question.text,
      isRequired: question.isRequired,
      options: question.options.map((option) => ({
        id: option.id,
        label: option.label
      }))
    }))
  };
};

const getPollBySlug = async (slug: string) => {
  const poll = await prisma.poll.findUnique({
    where: { slug },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
        include: {
          options: {
            orderBy: { orderIndex: "asc" }
          }
        }
      },
      creator: {
        select: { name: true, image: true }
      }
    }
  });

  if (!poll) {
    throw new HttpError(404, "Poll not found");
  }

  return poll;
};

export const listPublicPolls = async (category?: string) => {
  const where: Prisma.PollWhereInput = {
    isPublic: true,
    isPublished: false, // still accepting votes (not closed)
    expiresAt: { gt: new Date() } // not expired
  };

  const polls = await prisma.poll.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
        include: { options: { orderBy: { orderIndex: "asc" } } }
      },
      creator: { select: { name: true, image: true } },
      _count: { select: { submissions: true } }
    }
  });

  return polls
    .filter((poll) => {
      if (!category || category === "All Topics") return true;
      // Category is encoded in description as "Category: <name>"
      return poll.description?.includes(`Category: ${category}`);
    })
    .map((poll) => ({
      id: poll.id,
      slug: poll.slug,
      title: poll.title,
      description: poll.description,
      responseMode: poll.responseMode,
      expiresAt: poll.expiresAt.toISOString(),
      createdAt: poll.createdAt.toISOString(),
      totalVotes: poll._count.submissions,
      creator: { name: poll.creator.name, image: poll.creator.image },
      firstQuestion: poll.questions[0]
        ? {
            id: poll.questions[0].id,
            text: poll.questions[0].text,
            options: poll.questions[0].options.map((o) => ({ id: o.id, label: o.label }))
          }
        : null
    }));
};

export const getPublicPoll = async (slug: string) => {
  const poll = await getPollBySlug(slug);
  return mapPublicPoll(poll);
};

export const submitPublicResponse = async (
  slug: string,
  payload: PublicSubmissionInput,
  user?: AuthUser
) => {
  const poll = await getPollBySlug(slug);

  if (poll.expiresAt.getTime() < Date.now()) {
    throw new HttpError(410, "Poll link has expired");
  }

  if (poll.isPublished) {
    throw new HttpError(400, "Poll is already closed for responses");
  }

  if (poll.responseMode === "AUTHENTICATED" && !user) {
    throw new HttpError(401, "You must be signed in to vote on this poll");
  }

  const answerMap = new Map<string, string>();
  for (const entry of payload.answers) {
    answerMap.set(entry.questionId, entry.optionId);
  }

  for (const question of poll.questions) {
    const selectedOptionId = answerMap.get(question.id);

    if (question.isRequired && !selectedOptionId) {
      throw new HttpError(400, `Required question missing answer: ${question.text}`);
    }

    if (!selectedOptionId) {
      continue;
    }

    const validOption = question.options.some((option) => option.id === selectedOptionId);
    if (!validOption) {
      throw new HttpError(400, "Invalid option selected");
    }
  }

  const isAnonymousSubmission =
    poll.responseMode === "ANONYMOUS" ? (payload.submitAsAnonymous ?? true) : false;

  const respondentUserId = !isAnonymousSubmission && user ? user.id : null;

  if (poll.responseMode === "AUTHENTICATED" && !respondentUserId) {
    throw new HttpError(401, "You must be signed in to vote on this poll");
  }

  // Dedup for authenticated users: DB unique constraint handles it
  if (respondentUserId) {
    const existing = await prisma.submission.findFirst({
      where: { pollId: poll.id, respondentUserId },
      select: { id: true }
    });
    if (existing) {
      throw new HttpError(409, "You have already voted on this poll");
    }
  }

  // Dedup for anonymous users via fingerprintId
  if (isAnonymousSubmission && payload.fingerprintId) {
    const existing = await prisma.submission.findFirst({
      where: { pollId: poll.id, fingerprintId: payload.fingerprintId },
      select: { id: true }
    });
    if (existing) {
      throw new HttpError(409, "You have already voted on this poll");
    }
  }

  const submitted = await prisma.$transaction(async (tx) => {
    const answerCreates: Array<{ questionId: string; optionId: string }> = [];

    for (const question of poll.questions) {
      const optionId = answerMap.get(question.id);
      if (!optionId) continue;
      answerCreates.push({ questionId: question.id, optionId });
    }

    const submission = await tx.submission.create({
      data: {
        pollId: poll.id,
        respondentUserId,
        fingerprintId: isAnonymousSubmission ? (payload.fingerprintId ?? null) : null,
        isAnonymous: isAnonymousSubmission,
        answers: { create: answerCreates }
      }
    });

    const totalResponses = await tx.submission.count({ where: { pollId: poll.id } });

    return { submissionId: submission.id, pollId: poll.id, totalResponses };
  });

  return { ...submitted, submittedAt: nowIso() };
};

export const getPublicPollResults = async (slug: string) => {
  const poll = await getPollBySlug(slug);

  // Results are always visible (caller controls when to show them in the UI)
  const submissions = await prisma.submission.findMany({
    where: { pollId: poll.id },
    include: {
      answers: true,
      respondentUser: { select: { id: true, name: true, email: true } }
    }
  });

  const totalResponses = submissions.length;

  const questionSummaries = poll.questions.map((question) => {
    const optionCounts = new Map<string, number>();
    for (const option of question.options) {
      optionCounts.set(option.id, 0);
    }

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
      answeredCount,
      options: question.options.map((option) => ({
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

  // Return voter list for AUTHENTICATED polls
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
      description: poll.description,
      responseMode: poll.responseMode,
      expiresAt: poll.expiresAt.toISOString(),
      isPublished: poll.isPublished,
      publishedAt: poll.updatedAt.toISOString()
    },
    overview: { totalResponses },
    voters,
    questions: questionSummaries,
    updatedAt: nowIso()
  };
};
