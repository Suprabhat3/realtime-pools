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
    _count: { select: { submissions: true } };
  };
}>;

const nowIso = () => new Date().toISOString();

/**
 * A poll is "open" (accepting votes) when:
 *   - isPublished = true  (creator made it live)
 *   - expiresAt > now     (not time-expired)
 *   - totalSubmissions < maxResponses  (vote cap not reached, if set)
 */
const isPollOpen = (
  poll: { isPublished: boolean; isAnnounced: boolean; expiresAt: Date; maxResponses: number | null },
  totalResponses: number
) => {
  if (!poll.isPublished) return false;
  if (poll.isAnnounced) return false;
  if (poll.expiresAt.getTime() < Date.now()) return false;
  if (poll.maxResponses !== null && totalResponses >= poll.maxResponses) return false;
  return true;
};

const mapPublicPoll = (poll: PublicPollRecord) => {
  const totalResponses = poll._count.submissions;
  const open = isPollOpen(poll, totalResponses);
  const timeExpired = poll.expiresAt.getTime() < Date.now();
  const voteLimitReached =
    poll.maxResponses !== null && totalResponses >= poll.maxResponses;

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
    isExpired: timeExpired || voteLimitReached,
    isAnnounced: poll.isAnnounced,
    state: !poll.isPublished ? "draft" : open ? "active" : "closed",
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
        include: { options: { orderBy: { orderIndex: "asc" } } }
      },
      creator: { select: { name: true, image: true } },
      _count: { select: { submissions: true } }
    }
  });

  if (!poll) throw new HttpError(404, "Poll not found");
  return poll;
};

export const listPublicPolls = async (category?: string) => {
  // Fetch isPublic + isPublished (live) polls that are either active or announced
  const polls = await prisma.poll.findMany({
    where: {
      isPublic: true,
      isPublished: true,        // must be live (not a draft)
      OR: [
        { expiresAt: { gt: new Date() } }, // not time-expired
        { isAnnounced: true }
      ]
    },
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
      // Filter out polls that hit their vote cap unless they are announced
      if (!poll.isAnnounced && poll.maxResponses !== null && poll._count.submissions >= poll.maxResponses) {
        return false;
      }
      // Category filter
      if (!category || category === "All Topics") return true;
      return poll.description?.includes(`Category: ${category}`);
    })
    .map((poll) => ({
      id: poll.id,
      slug: poll.slug,
      title: poll.title,
      description: poll.description,
      responseMode: poll.responseMode,
      maxResponses: poll.maxResponses,
      expiresAt: poll.expiresAt.toISOString(),
      createdAt: poll.createdAt.toISOString(),
      totalVotes: poll._count.submissions,
      isAnnounced: poll.isAnnounced,
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
  const totalResponses = poll._count.submissions;

  // --- Closed checks ---
  if (!poll.isPublished) {
    throw new HttpError(404, "Poll not found");
  }

  if (poll.expiresAt.getTime() < Date.now()) {
    throw new HttpError(410, "This poll has expired");
  }

  if (poll.maxResponses !== null && totalResponses >= poll.maxResponses) {
    throw new HttpError(410, "This poll has reached its maximum number of votes");
  }

  // --- Auth check ---
  if (poll.responseMode === "AUTHENTICATED" && !user) {
    throw new HttpError(401, "You must be signed in to vote on this poll");
  }

  // --- Validate answers ---
  const answerMap = new Map<string, string>();
  for (const entry of payload.answers) {
    answerMap.set(entry.questionId, entry.optionId);
  }

  for (const question of poll.questions) {
    const selectedOptionId = answerMap.get(question.id);
    if (question.isRequired && !selectedOptionId) {
      throw new HttpError(400, `Required question missing answer: ${question.text}`);
    }
    if (!selectedOptionId) continue;
    const validOption = question.options.some((o) => o.id === selectedOptionId);
    if (!validOption) throw new HttpError(400, "Invalid option selected");
  }

  // A submission is anonymous only when the user is genuinely NOT authenticated.
  // If the user IS authenticated, we always link their identity (even on ANONYMOUS polls)
  // so analytics can show real demographics. An ANONYMOUS poll means auth isn't required
  // to vote — not that authenticated voters become invisible.
  const isAnonymousSubmission = !user;

  const respondentUserId = user ? user.id : null;

  // Dedup for authenticated users
  if (respondentUserId) {
    const existing = await prisma.submission.findFirst({
      where: { pollId: poll.id, respondentUserId },
      select: { id: true }
    });
    if (existing) throw new HttpError(409, "You have already voted on this poll");
  }

  // Dedup for anonymous users via fingerprint
  if (isAnonymousSubmission && payload.fingerprintId) {
    const existing = await prisma.submission.findFirst({
      where: { pollId: poll.id, fingerprintId: payload.fingerprintId },
      select: { id: true }
    });
    if (existing) throw new HttpError(409, "You have already voted on this poll");
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

    const newTotal = await tx.submission.count({ where: { pollId: poll.id } });

    return { submissionId: submission.id, pollId: poll.id, totalResponses: newTotal };
  });

  return { ...submitted, submittedAt: nowIso() };
};

export const getPublicPollResults = async (slug: string) => {
  const poll = await getPollBySlug(slug);
  const totalResponses = poll._count.submissions;

  const submissions = await prisma.submission.findMany({
    where: { pollId: poll.id },
    include: {
      answers: true,
      respondentUser: { select: { id: true, name: true, email: true, image: true, gender: true, birthday: true } }
    }
  });

  const authenticatedResponses = submissions.filter((s) => !s.isAnonymous).length;
  const hasSufficientDemoData = authenticatedResponses >= 3; // DEMOGRAPHICS_MIN_VOTERS
  const includeDemographics = poll.isAnnounced && hasSufficientDemoData;

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

  const questionSummaries = poll.questions.map((question) => {
    const optionCounts = new Map<string, number>();
    const optionVoterPreviews = new Map<string, { name: string | null; image: string | null; isAnonymous: boolean }[]>();
    const optionGenderMap = new Map<string, Map<string, number>>();
    const optionAgeGroupMap = new Map<string, Map<string, number>>();

    for (const option of question.options) {
      optionCounts.set(option.id, 0);
      optionVoterPreviews.set(option.id, []);
      optionGenderMap.set(option.id, new Map());
      optionAgeGroupMap.set(option.id, new Map());
    }

    let answeredCount = 0;
    for (const submission of submissions) {
      const answer = submission.answers.find((e) => e.questionId === question.id);
      if (!answer) continue;
      answeredCount += 1;
      const oid = answer.optionId;
      optionCounts.set(oid, (optionCounts.get(oid) ?? 0) + 1);

      // Accumulate voter previews
      const previews = optionVoterPreviews.get(oid) ?? [];
      if (previews.length < 8) {
        previews.push({
          name: submission.isAnonymous
            ? null
            : (submission.respondentUser?.name ?? submission.respondentUser?.email ?? null),
          image: submission.isAnonymous ? null : (submission.respondentUser?.image ?? null),
          isAnonymous: submission.isAnonymous
        });
        optionVoterPreviews.set(oid, previews);
      }

      // Tally demographics if needed
      if (includeDemographics && !submission.isAnonymous && submission.respondentUser) {
        if (submission.respondentUser.gender) {
          const gMap = optionGenderMap.get(oid)!;
          const gKey = submission.respondentUser.gender;
          gMap.set(gKey, (gMap.get(gKey) ?? 0) + 1);
        }
        if (submission.respondentUser.birthday) {
          const ag = ageGroup(ageFromBirthday(submission.respondentUser.birthday));
          const aMap = optionAgeGroupMap.get(oid)!;
          aMap.set(ag, (aMap.get(ag) ?? 0) + 1);
        }
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
      answeredCount,
      options: question.options.map((option) => {
        const optCount = optionCounts.get(option.id) ?? 0;
        return {
          optionId: option.id,
          optionLabel: option.label,
          count: optCount,
          percentage:
            answeredCount === 0
              ? 0
              : Number(((optCount / answeredCount) * 100).toFixed(2)),
          // Avatar stack data
          voterPreviews: optionVoterPreviews.get(option.id) ?? [],
          // Demographics if announced
          demographics: includeDemographics
            ? {
                gender: buildBreakdown(optionGenderMap.get(option.id)!, optCount),
                ageGroups: buildBreakdown(optionAgeGroupMap.get(option.id)!, optCount)
              }
            : null
        };
      })
    };
  });

  const voters =
    poll.responseMode === "AUTHENTICATED"
      ? submissions
          .filter((s) => s.respondentUser)
          .map((s) => ({
            name: s.respondentUser!.name ?? s.respondentUser!.email ?? "User",
            image: s.respondentUser!.image ?? null,
            submittedAt: s.submittedAt.toISOString()
          }))
      : undefined;

  const open = isPollOpen(poll, totalResponses);

  return {
    poll: {
      id: poll.id,
      slug: poll.slug,
      title: poll.title,
      description: poll.description,
      responseMode: poll.responseMode,
      maxResponses: poll.maxResponses,
      expiresAt: poll.expiresAt.toISOString(),
      isPublished: poll.isPublished,
      isAnnounced: poll.isAnnounced,
      state: !poll.isPublished ? "draft" : open ? "active" : "closed"
    },
    overview: { totalResponses, hasSufficientDemoData },
    voters,
    questions: questionSummaries,
    updatedAt: nowIso()
  };
};
