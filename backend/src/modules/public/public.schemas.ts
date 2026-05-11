import { z } from "zod";

export const publicSubmissionSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      optionId: z.string().min(1)
    })
  ),
  submitAsAnonymous: z.boolean().optional().default(true)
});

export type PublicSubmissionInput = z.infer<typeof publicSubmissionSchema>;
