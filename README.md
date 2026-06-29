# ScaliSite — Lead Tracker

An internal lead-tracking tool for the ScaliSite web design agency. Built with
Next.js (App Router) + TypeScript, Prisma + PostgreSQL (Neon), NextAuth
(credentials), and Tailwind CSS. Dark, glossy, monochrome UI.

Two roles:

- **Admin** — signs in with a **password only** (set via `ADMIN_PASSWORD`, no
  email). Admin area lives at **`/admin7014`**: full dashboard, manage users,
  reassign leads, per-member performance, activity log, plus everything a member
  can do.
- **Member** — signs in with **email + password**. Can view all leads (or filter
  to ones assigned to them), add/edit leads, change status, and add notes.

---

## Tech

- **Next.js 15** (App Router, Server Components + Server Actions)
- **TypeScript**
- **Prisma ORM** + **PostgreSQL** (Neon, connection pooling)
- **NextAuth** (credentials provider, JWT sessions, role-based access)
- **Tailwind CSS**
- **bcryptjs** for password hashing
- **zod** for input validation

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Set the following in `.env.local`:

| Variable          | Description                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`    | Neon **pooled** connection string (the `-pooler` host).                     |
| `DIRECT_URL`      | _(optional)_ Neon **direct** (non-pooler) string, used for migrations.      |
| `NEXTAUTH_SECRET` | Secret for signing JWTs. Generate with `openssl rand -base64 32`.           |
| `NEXTAUTH_URL`    | App base URL — `http://localhost:3000` in development.                      |
| `ADMIN_PASSWORD`  | The admin password. Admin signs in with this **only** (no email).           |
| `ADMIN_NAME`      | _(optional)_ Display name for the admin (defaults to `Administrator`).      |

**Neon + connection pooling:** use the pooled host and append pooler params, e.g.

```
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=1"
```

If you set `DIRECT_URL` to the non-pooler host, Prisma will use it for
migrations automatically (recommended on Neon). If you omit it, `DATABASE_URL`
is used for everything.

### 3. Run the migration

Creates the tables from the Prisma schema:

```bash
npm run db:migrate        # prisma migrate dev
```

> If migrations time out against the pooler, set `DIRECT_URL` to the non-pooler
> host (see above) and re-run.

### 4. Seed the database

Cleans the database and creates a single admin account from `ADMIN_PASSWORD`
(no sample data). Re-run this any time to wipe all data back to a clean state:

```bash
npm run db:seed           # prisma db seed — wipes data, bootstraps admin
```

### 5. Run the app

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Signing in

After seeding, the only account is the admin:

- **Admin** — leave the email field **blank** and enter the `ADMIN_PASSWORD`
  value. The admin dashboard is at **`/admin7014`**.
- **Members** — created by the admin from **Members & Settings**, then sign in
  with their email + password.

There is no public sign-up.

---

## Scripts

| Script             | Description                            |
| ------------------ | -------------------------------------- |
| `npm run dev`      | Start the dev server                   |
| `npm run build`    | Generate Prisma client + production build |
| `npm run start`    | Start the production server            |
| `npm run db:migrate` | `prisma migrate dev`                 |
| `npm run db:push`  | `prisma db push` (no migration files)  |
| `npm run db:seed`  | Clean all data + bootstrap the admin   |
| `npm run db:studio`| Open Prisma Studio                     |

---

## Data model

- **User** — `id, name, email, hashedPassword, role (ADMIN | MEMBER), createdAt`
- **Lead** — `id, name, email, phone, company?, source, status (NEW | CONTACTED | QUALIFIED | PROPOSAL_SENT | WON | LOST), value?, assignedTo, createdBy, createdAt, updatedAt`
- **Note** — `id, content, lead, author, createdAt`
- **Activity** — `id, action, lead?, user, createdAt` — recorded automatically on
  lead creation, status change, note added, and reassignment.

---

## Security & access control

- All app routes are protected by `src/middleware.ts`; unauthenticated users are
  redirected to `/login`.
- `/admin7014` and `/members` are admin-only — enforced in middleware **and**
  again server-side via `requireAdmin()`.
- The admin password (`ADMIN_PASSWORD`) lives only in the environment and is
  compared server-side in `authorize()`; it is never stored as the source of
  truth in the database.
- Mutations (server actions) re-check the session and role on the server, so
  member restrictions (e.g. only admins can reassign leads or manage users) are
  not just hidden in the UI.
- Passwords are hashed with bcrypt; the plaintext is never stored.

---

## Project structure

```
prisma/
  schema.prisma         # data model
  seed.ts               # sample data
src/
  middleware.ts         # route protection
  app/
    login/              # public login page
    (app)/              # authenticated shell (sidebar + nav)
      admin7014/        # admin dashboard (overview)
      leads/            # list, detail, new
      members/          # admin: users + activity log
    api/auth/[...nextauth]/
  components/           # UI + client forms
  lib/
    auth.ts             # NextAuth config
    prisma.ts           # Prisma singleton
    session.ts          # requireUser / requireAdmin
    actions/            # server actions (leads, users)
    constants.ts, format.ts
```
