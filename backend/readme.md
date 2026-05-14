# Backend README - ZenPoll API

## Overview

This backend is a TypeScript Express API for poll creation, public response collection, analytics, auth, and real-time updates.

Stack:
- Express 5
- Prisma ORM + PostgreSQL
- Zod validation
- JWT access/refresh cookies
- Socket.io (real-time owner analytics updates)
- Resend (OTP, password reset, announcement emails)

Entry points:
- `src/server.ts` - HTTP + Socket.io server startup
- `src/app.ts` - middleware + route registration

## Module Architecture

- `src/modules/auth` - auth flows + token lifecycle
- `src/modules/polls` - creator poll CRUD, close, announce, analytics
- `src/modules/public` - public poll listing/viewing/submission/results
- `src/modules/users` - profile read/update
- `src/modules/uploads` - ImageKit upload signature endpoint
- `src/modules/realtime` - socket server registry
- `src/modules/shared` - auth middleware + shared types

## Security & Platform Middleware

Configured in `src/app.ts`:
- CORS allowlist based on `FRONTEND_URL` + `ALLOWED_ORIGINS`
- `helmet()` headers
- JSON parsing + cookie parser
- public API rate limiting on `/api/public`
- centralized 404 and error handlers

## Authentication Design

Auth routes: `src/modules/auth/auth.routes.ts`

Implemented flows:
- `POST /api/auth/sign-up/email` -> create account + send OTP
- `POST /api/auth/sign-in/email` -> validate password + send OTP
- `POST /api/auth/sign-in/verify` -> verify OTP + issue access/refresh cookies
- `GET /api/auth/google` + callback -> Google OAuth login
- `POST /api/auth/refresh` -> rotate refresh token + issue new tokens
- `POST /api/auth/sign-out` -> revoke refresh + clear cookies
- `POST /api/auth/forgot-password` -> send reset link
- `POST /api/auth/reset-password` -> set new password + revoke active refresh tokens
- `GET /api/auth/session` -> current session snapshot

Token model:
- short-lived access JWT
- long-lived refresh JWT stored hashed in DB
- refresh rotation on use

Guards:
- `requireAuth` for protected APIs
- `optionalAuth` where both public and signed-in access is allowed

## Poll Domain Model

Schema: `prisma/schema.prisma`

Main entities:
- `Poll` with `responseMode`, `expiresAt`, `isPublished`, `isPublic`, `isAnnounced`, `maxResponses`
- `Question` with `isRequired`, ordered by `orderIndex`
- `Option` with `orderIndex`
- `Submission` linked to poll and optional respondent user
- `Answer` linking submission -> selected option per question

Constraints:
- one submission per authenticated user per poll (`@@unique([pollId, respondentUserId])`)
- one answer per question per submission (`@@unique([submissionId, questionId])`)
- ordered uniqueness for question/option ordering

## Poll Lifecycle Rules

State logic (`polls.service.ts` / `public.service.ts`):
- `draft`: not published
- `active`: published, not expired, not maxed, not announced
- `closed`: expired or max responses reached or announced

Creator control:
- close early endpoint sets `expiresAt = now`
- announce endpoint marks `isAnnounced = true` (only after closure conditions)

## Validation Strategy

Zod schemas:
- `polls.schemas.ts` for create/update
- `public.schemas.ts` for submission payloads
- `auth.schemas.ts` for auth forms
- `users.schemas.ts` for profile updates

Enforced examples:
- poll title length
- min/max options per question
- required questions must be answered
- option must belong to that question
- ISO datetime for `expiresAt`

## Creator APIs (`/api/polls`)

- `GET /api/polls` - list creator polls
- `POST /api/polls` - create poll
- `GET /api/polls/:pollId` - poll details
- `PATCH /api/polls/:pollId` - update poll
- `POST /api/polls/:pollId/close` - close poll immediately
- `POST /api/polls/:pollId/announce` - publish/announce final results
- `GET /api/polls/:pollId/analytics` - creator analytics

All are protected by `requireAuth`.

## Public APIs (`/api/public`)

- `GET /api/public/polls` - public poll feed (optional category filter)
- `GET /api/public/polls/:slug` - public poll details
- `POST /api/public/polls/:slug/submissions` - submit response (optionalAuth)
- `GET /api/public/polls/:slug/results` - public result summary

Submission protections:
- rejects draft/non-live polls
- rejects expired polls
- rejects polls at response cap
- enforces auth on `AUTHENTICATED` polls
- duplicate prevention for authenticated user and fingerprint-based anonymous votes

## Analytics Design

Creator analytics (`getPollAnalytics`):
- total/authenticated/anonymous response counts
- per-question answered/skipped metrics
- per-option counts and percentages
- voter cards and previews
- demographic breakdowns by gender and age group

Privacy threshold:
- demographic slices are returned only when authenticated voter count >= 3

Public results (`getPublicPollResults`):
- final aggregate counts and percentages
- optional voter previews
- demographics shown only when poll is announced and threshold is met

## Realtime (Socket.io)

Socket server setup: `src/server.ts`

Owner room pattern:
- client emits `poll:join-owner` with `pollId`
- server joins `poll:{pollId}:owner`

On every new submission:
- emit `responses:count` with latest total
- emit `analytics:update` with update timestamp

Emit location:
- `src/modules/public/public.routes.ts`

## Environment Variables

Copy `example.env` to `.env`.

Required groups:
- app: `PORT`, `NODE_ENV`
- db: `DATABASE_URL`
- auth: JWT secrets + TTLs
- email: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- oauth: Google client id/secret
- uploads: ImageKit keys
- web integration: `FRONTEND_URL`, `ALLOWED_ORIGINS`

## Local Run

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate:dev
pnpm dev
```

Useful scripts:
- `pnpm dev:fresh` - kill port 4000 then start dev server
- `pnpm build` - compile TypeScript
- `pnpm start` - run compiled output
- `pnpm typecheck` - type checks only

## API Reliability Notes

- Errors are normalized via `HttpError` + middleware in `src/middleware/error-handler.ts`.
- Public endpoints are rate-limited.
- Poll and submission writes use Prisma transactions where consistency matters.
