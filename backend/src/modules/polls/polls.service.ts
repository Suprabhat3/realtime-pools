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

// ── Analytics helpers ─────────────────────────────────────────────────────────

const DEMOGRAPHICS_MIN_VOTERS = 3;

/** Compute age in full years from a Date of birth. */
const ageFromBirthday = (birthday: Date): number => {
  const now = new Date();
  let age = now.getFullYear() - birthday.getFullYear();
  const m = now.getMonth() - birthday.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthday.getDate())) age--;
  return age;
};

const ageGroup = (age: number): string => {
  if (age < 18) return "Under 18";
  if (age <= 24) return "18–24";
  if (age <= 34) return "25–34";
  if (age <= 44) return "35–44";
  if (age <= 54) return "45–54";
  return "55+";
};

export const getPollAnalytics = async (pollId: string, creatorId: string) => {
  const poll = await ensurePollOwned(pollId, creatorId);

  const submissions = await prisma.submission.findMany({
    where: { pollId },
    include: {
      answers: { include: { option: true } },
      respondentUser: {
        select: { id: true, name: true, email: true, image: true, gender: true, birthday: true }
      }
    }
  });

  const totalResponses = submissions.length;
  const authenticatedResponses = submissions.filter((s) => !s.isAnonymous).length;
  const anonymousResponses = submissions.filter((s) => s.isAnonymous).length;

  // Minimum threshold for demographic breakdowns to be meaningful
  const hasSufficientDemoData = authenticatedResponses >= DEMOGRAPHICS_MIN_VOTERS;

  const questionSummaries = poll.questions.map((question) => {
    const optionCounts = new Map<string, number>();
    // Per-option: voter cards (name, image, gender, ageGroup)
    const optionVoterCards = new Map<
      string,
      { name: string; image: string | null; isAnonymous: boolean; gender: string | null; ageGroup: string | null }[]
    >();
    // Per-option gender tallies
    const optionGenderMap = new Map<string, Map<string, number>>();
    // Per-option age-group tallies
    const optionAgeGroupMap = new Map<string, Map<string, number>>();

    for (const option of question.options) {
      optionCounts.set(option.id, 0);
      optionVoterCards.set(option.id, []);
      optionGenderMap.set(option.id, new Map());
      optionAgeGroupMap.set(option.id, new Map());
    }

    let answeredCount = 0;
    for (const submission of submissions) {
      const answer = submission.answers.find((entry) => entry.questionId === question.id);
      if (!answer) continue;
      answeredCount += 1;
      const oid = answer.optionId;
      optionCounts.set(oid, (optionCounts.get(oid) ?? 0) + 1);

      // Voter card (all voters, anonymous included)
      const cards = optionVoterCards.get(oid) ?? [];
      cards.push({
        name: submission.isAnonymous
          ? "Anonymous"
          : (submission.respondentUser?.name ?? submission.respondentUser?.email ?? "User"),
        image: submission.isAnonymous ? null : (submission.respondentUser?.image ?? null),
        isAnonymous: submission.isAnonymous,
        gender: submission.respondentUser?.gender ?? null,
        ageGroup: submission.respondentUser?.birthday
          ? ageGroup(ageFromBirthday(submission.respondentUser.birthday))
          : null
      });
      optionVoterCards.set(oid, cards);

      // Gender tally (only for authenticated with data)
      if (!submission.isAnonymous && submission.respondentUser?.gender) {
        const gMap = optionGenderMap.get(oid)!;
        const gKey = submission.respondentUser.gender;
        gMap.set(gKey, (gMap.get(gKey) ?? 0) + 1);
      }

      // Age-group tally
      if (!submission.isAnonymous && submission.respondentUser?.birthday) {
        const ag = ageGroup(ageFromBirthday(submission.respondentUser.birthday));
        const aMap = optionAgeGroupMap.get(oid)!;
        aMap.set(ag, (aMap.get(ag) ?? 0) + 1);
      }
    }

    const buildBreakdown = (countMap: Map<string, number>, base: number) =>
      Array.from(countMap.entries()).map(([label, count]) => ({
        label,
        count,
        percentage: base === 0 ? 0 : Number(((count / base) * 100).toFixed(1))
      }));

    return {
      questionId: question.id,
      questionText: question.text,
      isRequired: question.isRequired,
      answeredCount,
      skippedCount: totalResponses - answeredCount,
      optionCounts: question.options.map((option) => {
        const optCount = optionCounts.get(option.id) ?? 0;
        const gMap = optionGenderMap.get(option.id)!;
        const aMap = optionAgeGroupMap.get(option.id)!;
        const cards = optionVoterCards.get(option.id) ?? [];

        return {
          optionId: option.id,
          optionLabel: option.label,
          count: optCount,
          percentage:
            answeredCount === 0
              ? 0
              : Number(((optCount / answeredCount) * 100).toFixed(2)),
          // All voter cards (name + image) for this option
          voterCards: cards,
          // Avatar stack preview (first 8)
          voterPreviews: cards.slice(0, 8).map((c) => ({
            name: c.name,
            image: c.image,
            isAnonymous: c.isAnonymous
          })),
          // Demographic breakdowns — suppressed when below threshold
          demographics: hasSufficientDemoData
            ? {
                gender: buildBreakdown(gMap, optCount),
                ageGroups: buildBreakdown(aMap, optCount)
              }
            : null
        };
      })
    };
  });

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
      anonymousResponses,
      hasSufficientDemoData
    },
    questions: questionSummaries,
    updatedAt: new Date().toISOString()
  };
};
