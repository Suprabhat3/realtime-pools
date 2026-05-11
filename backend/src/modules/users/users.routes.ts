import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import { HttpError } from "../../middleware/error-handler";
import { requireAuth } from "../shared/require-auth";
import { type Gender, updateProfileSchema } from "./users.schemas";
import { getUserProfile, updateUserProfile } from "./users.service";

export const usersRouter: ExpressRouter = Router();

const parseBirthday = (value: string | null | undefined): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, "Birthday must be a valid date");
  }

  return date;
};

usersRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const profile = await getUserProfile(req.user!.id);
    res.status(200).json({ data: profile });
  } catch (error) {
    next(error);
  }
});

usersRouter.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const payload = updateProfileSchema.parse(req.body);
    const birthday = parseBirthday(payload.birthday);
    const data: Parameters<typeof updateUserProfile>[1] = {};

    if (payload.name !== undefined) data.name = payload.name;
    if (payload.gender !== undefined) data.gender = payload.gender as Gender | null;
    if (payload.bio !== undefined) data.bio = payload.bio;
    if (payload.location !== undefined) data.location = payload.location;
    if (birthday !== undefined) data.birthday = birthday;
    if (payload.phone !== undefined) data.phone = payload.phone;
    if (payload.timezone !== undefined) data.timezone = payload.timezone;
    if (payload.pronouns !== undefined) data.pronouns = payload.pronouns;
    if (payload.image !== undefined) data.image = payload.image;
    if (payload.imageFileId !== undefined) data.imageFileId = payload.imageFileId;

    const profile = await updateUserProfile(req.user!.id, data);

    res.status(200).json({ data: profile });
  } catch (error) {
    next(error);
  }
});
