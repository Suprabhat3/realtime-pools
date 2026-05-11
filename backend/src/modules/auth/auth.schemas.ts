import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8)
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8)
});
