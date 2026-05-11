import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  LOGIN_OTP_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  FRONTEND_URL: z.url(),
  ALLOWED_ORIGINS: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = parsed.data;

const toOrigin = (value: string) => new URL(value).origin;

const configuredOrigins = [
  toOrigin(env.FRONTEND_URL),
  ...(env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
        .map(toOrigin)
    : [])
];

export const allowedOrigins = Array.from(new Set(configuredOrigins));
