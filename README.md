# Mestring

A Family goals and chores app.

Stack:
- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + Socket.IO
- Database: Supabase Postgres (via Prisma)
- Auth: Supabase Auth (email/password)
- Realtime: Socket.IO rooms per family

Features:
- Families, users (parent/child)
- Goals with ordered steps (instructions + media)
- Chores (assignments, due dates, points)
- Progress events (start/complete/approve)
- Rewards and redemptions
- Supabase Auth on frontend; backend verifies Supabase JWT

## Local development

1. Create Supabase project and get the keys (see Setup below).
2. Copy `.env.example` to `apps/api/.env` and `apps/web/.env` and fill values.
3. Install dependencies: `npm install`
4. Initialize Prisma: `cd apps/api && npx prisma migrate dev --name init && npx prisma generate`
5. Run dev servers in two terminals or use the root script:
   - API: `npm run dev:api` (http://localhost:3001)
   - Web: `npm run dev:web` (http://localhost:5173)

## Deployment (summary)
- Frontend: Vercel (environment variables under Project Settings)
- Backend: Render (Node service), connect to your repo
- Database/Auth/Storage: Supabase (free tier)

See full step-by-step below after files.
