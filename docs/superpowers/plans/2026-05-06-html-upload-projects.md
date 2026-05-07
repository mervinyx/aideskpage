# HTML Upload Projects Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert Pharaohfolio into a simple internal multi-user HTML upload and publishing tool.

**Architecture:** Keep the Django REST + React/Vite stack. Replace the one-portfolio-per-user flow with user-owned projects, HTML file upload, draft/published states, and public rendering by unique slug.

**Tech Stack:** Django REST Framework, PostgreSQL, JWT auth, React, Vite, Tailwind CSS.

---

## Chunk 1: Backend

- [x] Add failing tests for per-user project ownership, HTML upload validation, publishing, and public access.
- [x] Replace `Portfolio` with `Project` fields needed for stage one.
- [x] Add upload, list, detail, publish, delete, draft preview, and public API endpoints.
- [x] Simplify registration/login so accounts can be used immediately without email verification.
- [x] Create migrations and run backend tests.

## Chunk 2: Frontend

- [x] Replace portfolio dashboard with a project library.
- [x] Add project editor page with HTML file upload, draft preview, publish/update, and copy link.
- [x] Update public page to read `/api/portfolio/p/:slug/`.
- [x] Simplify routes and navigation to `/projects`, `/projects/new`, `/projects/:id`, and `/p/:slug`.
- [x] Build frontend and run smoke checks.
