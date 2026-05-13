import { z } from "zod";

const optionSchema = z.string().trim().min(1).max(120);

const questionSchema = z.object({
  text: z.string().trim().min(2).max(300),
  isRequired: z.boolean(),
  options: z.array(optionSchema).min(2).max(10)
});

export const createPollSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).optional(),
  responseMode: z.enum(["ANONYMOUS", "AUTHENTICATED"]),
  isPublic: z.boolean().optional().default(true),
  expiresAt: z.iso.datetime(),
  maxResponses: z.number().int().positive().optional(),
  questions: z.array(questionSchema).min(1).max(30)
});

export const updatePollSchema = createPollSchema.partial().extend({
  questions: z.array(questionSchema).min(1).max(30).optional(),
  isPublished: z.never().optional()
});

export type CreatePollInput = z.infer<typeof createPollSchema>;
export type UpdatePollInput = z.infer<typeof updatePollSchema>;
