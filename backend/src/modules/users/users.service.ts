import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/error-handler";
import type { Gender } from "./users.schemas";

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  gender: Gender | null;
  bio: string | null;
  location: string | null;
  birthday: string | null;
  phone: string | null;
  timezone: string | null;
  pronouns: string | null;
  image: string | null;
  imageFileId: string | null;
};

const toIsoDate = (value: Date | null): string | null => {
  if (!value) return null;
  return value.toISOString().split("T")[0] ?? null;
};

const mapUserProfile = (user: {
  id: string;
  email: string;
  name: string | null;
  gender: Gender | null;
  bio: string | null;
  location: string | null;
  birthday: Date | null;
  phone: string | null;
  timezone: string | null;
  pronouns: string | null;
  image: string | null;
  imageFileId: string | null;
}): UserProfile => ({
  id: user.id,
  email: user.email,
  name: user.name,
  gender: user.gender,
  bio: user.bio,
  location: user.location,
  birthday: toIsoDate(user.birthday),
  phone: user.phone,
  timezone: user.timezone,
  pronouns: user.pronouns,
  image: user.image,
  imageFileId: user.imageFileId
});

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      gender: true,
      bio: true,
      location: true,
      birthday: true,
      phone: true,
      timezone: true,
      pronouns: true,
      image: true,
      imageFileId: true
    }
  });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return mapUserProfile(user);
};

export const updateUserProfile = async (
  userId: string,
  data: {
    name?: string | null;
    gender?: Gender | null;
    bio?: string | null;
    location?: string | null;
    birthday?: Date | null;
    phone?: string | null;
    timezone?: string | null;
    pronouns?: string | null;
    image?: string | null;
    imageFileId?: string | null;
  }
): Promise<UserProfile> => {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      gender: true,
      bio: true,
      location: true,
      birthday: true,
      phone: true,
      timezone: true,
      pronouns: true,
      image: true,
      imageFileId: true
    }
  });

  return mapUserProfile(user);
};
