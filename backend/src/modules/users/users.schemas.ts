import { z } from "zod";

export const genderEnum = z.enum(["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"]);
export type Gender = z.infer<typeof genderEnum>;

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).nullable().optional(),
  gender: genderEnum.nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  location: z.string().max(120).nullable().optional(),
  birthday: z.string().nullable().optional(),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Phone must be in E.164 format")
    .nullable()
    .optional(),
  timezone: z.string().max(120).nullable().optional(),
  pronouns: z.string().max(80).nullable().optional(),
  image: z.string().url().nullable().optional(),
  imageFileId: z.string().max(200).nullable().optional()
});
