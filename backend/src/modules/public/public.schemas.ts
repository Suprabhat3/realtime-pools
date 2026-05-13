import { z } from "zod";

export const publicSubmissionSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      optionId: z.string().min(1)
    })
  ),
  submitAsAnonymous: z.boolean().optional().default(true),
  fingerprintId: z.string().max(128).optional()
});

export type PublicSubmissionInput = z.infer<typeof publicSubmissionSchema>;
