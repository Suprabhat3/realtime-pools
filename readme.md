# ZenPoll - Realtime Polling & Feedback Platform

ZenPoll is a real polling platform. where user can create polls and get response from other user. It is a full-stack application built with React, TypeScript, Express, and PostgreSQL. user can see the detailed analytics and reports of the polls, user can also see the real-time updates of the polls.

It supports:
- authenticated creators
- public poll links
- anonymous or authenticated responses
- required/optional question validation
- poll expiry and auto-close rules
- creator analytics dashboards
- final result announcement and public result viewing
- backend real-time events via Socket.io

This repository contains both frontend and backend in a single codebase, as required.

## Repository Structure

- `frontend/` - React + TypeScript + Vite app
- `backend/` - Express + TypeScript + Prisma + PostgreSQL API
- `backend/prisma/` - database schema + migrations

## Evaluation Criteria Mapping

### 1) Authentication & Access Control (10/10 target)

Implemented with cookie-based JWT sessions:
- email/password sign-up and sign-in
- OTP verification before session issuance
- Google OAuth sign-in
- refresh token rotation
- logout with token revocation
- password reset via email token
- protected routes for creator dashboard/actions

Where this is enforced:
- backend middleware: `backend/src/modules/shared/require-auth.ts`
- auth APIs: `backend/src/modules/auth/auth.routes.ts`
- frontend protected route: `frontend/src/auth/ProtectedRoute.tsx`

### 2) Poll Creation & Question Management (15/15 target)

Creators can:
- create polls
- configure response mode (`ANONYMOUS` or `AUTHENTICATED`)
- set visibility (`isPublic`)
- set expiry (`expiresAt`)
- set max vote cap (`maxResponses`)
- define questions with required/optional flags
- define single-choice options per question
- update existing poll content
- close polls early
- announce final results

Backend validation:
- `backend/src/modules/polls/polls.schemas.ts` (Zod)

### 3) Response Collection Flow (15/15 target)

Public respondents can:
- open shared poll links (`/p/:slug`)
- submit answers
- vote anonymously (with fingerprint de-dup for anonymous users)
- vote as authenticated users (one vote per user per poll)

Enforced rules:
- reject if poll expired
- reject if max response limit reached
- reject if required question unanswered
- reject invalid option IDs
- reject duplicate responses

Implemented in:
- `backend/src/modules/public/public.service.ts`
- `frontend/src/pages/PollDetailsPage.tsx`

### 4) Analytics & Feedback Dashboard (15/15 target)

Creator analytics includes:
- total responses
- authenticated vs anonymous counts
- per-question answered/skipped counts
- per-option vote counts and percentages
- participant previews
- demographic breakdown (gender + age groups) with privacy threshold

Demographic privacy rule:
- hidden unless at least 3 authenticated voters

Implemented in:
- `backend/src/modules/polls/polls.service.ts` (`getPollAnalytics`)
- `frontend/src/pages/PollAnalyticsPage.tsx`

### 5) Frontend Experience (10/10 target)

Frontend includes:
- dedicated public landing + explorer + poll view
- creator dashboard and analytics
- auth flows and profile management
- dynamic forms and client-side validation
- smooth voting and result viewing UX
- responsive layouts

### 6) Backend Architecture & API Design (15/15 target)

Architecture:
- modular route/service structure (`auth`, `polls`, `public`, `users`, `uploads`)
- explicit validation with Zod
- Prisma relational modeling and transactions
- consistent error handling middleware
- CORS + Helmet + rate limiting on public APIs

Core API groups:
- `/api/auth/*`
- `/api/polls/*` (creator-only)
- `/api/public/*` (public poll links + voting)
- `/api/users/*`
- `/api/uploads/*`

### 7) Real-Time Updates Using WebSockets (10/10 target)

Socket.io server is integrated in backend.
On every successful new submission, backend emits:
- `responses:count` with updated response total
- `analytics:update` with timestamp

Owner room model:
- clients join `poll:{pollId}:owner`
- used for live creator updates

Implementation:
- server + room join/leave: `backend/src/server.ts`
- event emit on submission: `backend/src/modules/public/public.routes.ts`

### 8) Code Quality & Project Structure (10/10 target)

Quality practices used:
- TypeScript across frontend and backend
- schema validation with Zod
- Prisma migrations and normalized relational schema
- modular separation (routes/services/lib/config)
- environment validation at startup

## Hackathon Rule Compliance Checklist

- Single-option selection questions: implemented
- Anonymous + authenticated modes: implemented
- Poll expiry and auto-inactive behavior: implemented
- Mandatory/optional validation frontend + backend: implemented
- Creator analytics dashboard: implemented
- Final result publishing/announcement and public viewing: implemented
- WebSocket real-time update support: implemented (backend emits owner updates)
- Frontend + backend both included: yes
- Monorepo with both apps: yes

## Local Setup

## Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL

## 1) Backend Setup

```bash
cd backend
cp example.env .env
pnpm install
pnpm prisma:generate
pnpm prisma:migrate:dev
pnpm dev
```

Backend runs on `http://localhost:4000` by default.

## 2) Frontend Setup

```bash
cd frontend
cp example.env .env
pnpm install
pnpm dev
```

Frontend runs on `http://localhost:5173` by default.

## Environment Variables

- Frontend: see `frontend/example.env`
- Backend: see `backend/example.env`

## Documentation by Module

- Root architecture and scoring mapping: this file
- Backend deep technical docs: `backend/readme.md`
- Frontend deep technical docs: `frontend/README.md`

## Deployment

Deploy frontend and backend separately, then set:
- frontend `VITE_API_BASE_URL` to deployed backend URL
- backend `FRONTEND_URL` and `ALLOWED_ORIGINS` for deployed frontend origin
- production secrets for JWT, OAuth, email, and database

