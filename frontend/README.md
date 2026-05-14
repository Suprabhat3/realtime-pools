# Frontend README - ZenPoll Web App

## Overview

This frontend is a React + TypeScript + Vite application for:
- authentication
- creator dashboard
- poll creation
- public poll discovery and voting
- poll analytics visualization
- profile management

It consumes the backend APIs in `../backend` and is designed for the hackathon evaluation requirements.

## Tech Stack

- React 19
- TypeScript
- React Router
- TailwindCSS v4
- Vite

## Routing Map

Configured in `src/main.tsx`.

Public routes:
- `/` - landing page
- `/signin`, `/signup`, `/forgot-password`, `/reset-password`
- `/auth/success` - OAuth completion
- `/explorer` - public poll feed
- `/p/:slug` - poll details + vote + results
- `/privacy`, `/terms`, `/help`, `/contact`

Protected routes:
- `/dashboard` - creator poll management
- `/create` - creator poll creation form
- `/polls/:pollId/analytics` - creator analytics dashboard

Access control:
- `src/auth/ProtectedRoute.tsx`
- `src/auth/AuthProvider.tsx` (session bootstrap from `/api/auth/session`)

## Feature Breakdown

## 1) Authentication UX

Files:
- `src/auth/SignInPage.tsx`
- `src/auth/SignUpPage.tsx`
- `src/auth/ForgotPasswordPage.tsx`
- `src/auth/ResetPasswordPage.tsx`
- `src/auth/AuthSuccessPage.tsx`

Flow highlights:
- email sign-in/up requests OTP via backend
- OTP verification establishes cookie session
- Google sign-in redirects to backend OAuth route
- session state is globally managed by `AuthProvider`

## 2) Poll Creation UX

File: `src/pages/CreatePollPage.tsx`

Creator can configure:
- poll question and options
- category tagging
- public/private visibility
- anonymous vs authenticated voting mode
- expiration duration (preset/custom)
- optional max vote cap

Validation performed in UI:
- title required
- minimum two non-empty options
- vote cap minimum of 2 when enabled

Payload is sent to:
- `POST /api/polls`

## 3) Public Poll Participation

File: `src/pages/PollDetailsPage.tsx`

What this page handles:
- fetch poll by slug
- display active/closed state
- auth wall when poll requires authenticated voter
- single-option vote selection
- vote submission
- show live-like result state after vote
- show final result cards when voted or poll is closed

Duplicate prevention UX helpers:
- localStorage `vp_voted` marker
- browser fingerprint generation (`vp_fingerprint`) for anonymous votes

API wrapper: `src/lib/polls-api.ts`

## 4) Explorer / Public Feed

File: `src/pages/ExplorerPage.tsx`

Capabilities:
- fetch public polls
- category filtering
- show creator metadata, vote count, and time left
- show announced vs live state

## 5) Creator Dashboard

File: `src/pages/DashboardPage.tsx`

Capabilities:
- list creator polls
- show poll state badges (active/closed/announced/draft)
- quick copy share link
- close active poll early
- announce closed poll results
- navigate to analytics and public view

## 6) Analytics Dashboard

File: `src/pages/PollAnalyticsPage.tsx`

Shows:
- total/authenticated/anonymous responses
- option-wise vote percentages
- voter cards and demographics
- skipped/answered metrics
- demographic threshold warning when authenticated responses < 3
- announce results action (for closed polls)

Demographics displayed:
- gender distribution
- age-group distribution

## 7) Profile Management

File: `src/pages/ProfilePage.tsx`

Includes:
- personal profile editing
- avatar upload and crop flow
- ImageKit signed upload integration
- persisted profile fields: name, gender, bio, location, birthday, phone, timezone, pronouns

## API Integration Layer

Main client modules:
- `src/lib/auth-api.ts`
- `src/lib/polls-api.ts`
- `src/lib/user-api.ts`

Common behavior:
- sends `credentials: "include"` for cookie auth
- normalizes API error messages for UI display

## Realtime Notes

Backend emits Socket.io events for owner analytics updates (`responses:count`, `analytics:update`).
Current frontend focuses on API-driven refresh and does not yet include a dedicated Socket.io client subscription layer.

## Environment Configuration

Copy `example.env` to `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
```

## Local Run

```bash
pnpm install
pnpm dev
```

Default app URL: `http://localhost:5173`

## Build & Quality

Scripts:
- `pnpm dev` - start development server
- `pnpm build` - typecheck and production build
- `pnpm preview` - preview built app
- `pnpm lint` - lint source

## Requirement Mapping Summary

- frontend UI present for both creator and respondent flows
- dynamic poll form with validation
- public form/voting and protected creator areas
- analytics visualization for evaluation criteria
- result announcement flow connected to backend
- architecture kept modular by page/domain and API clients
