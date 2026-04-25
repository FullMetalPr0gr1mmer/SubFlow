# SubFlow

A polished SaaS subscription management platform — Next.js 14 frontend, FastAPI backend, Supabase for auth and Postgres, Stripe (test mode) for payments, and an Anthropic Claude–powered support chat.

> Built as an interview take-home. The detailed product spec lives in [`saas-prompt.md`](./saas-prompt.md). Implementation deviations are documented in `~/.claude/plans/do-u-have-any-zany-clover.md`.

## Screenshots

> Add screenshots of the marketing landing, pricing toggle, dashboard overview, admin charts, and chat widget here once you've run the app locally.

## Tech stack

- **Frontend:** Next.js 14 (App Router, TS), Tailwind CSS, Radix UI primitives, Recharts, lucide-react, @supabase/ssr, @stripe/stripe-js, axios.
- **Backend:** FastAPI (Python 3.11+), supabase-py, stripe-python, httpx, python-jose, pydantic-settings.
- **Database & Auth:** Supabase (Postgres + Row Level Security + JWT auth).
- **Payments:** Stripe in test mode (Checkout, Customer Portal, Webhooks).
- **AI:** Anthropic `claude-haiku-4-5-20251001` via direct HTTP, with prompt caching on the system prompt.

## Folder structure

```
.
├── frontend/         Next.js 14 app (App Router)
├── backend/          FastAPI app
├── supabase/
│   └── schema.sql    Tables, RLS policies, trigger, plan seed
└── saas-prompt.md    Original product spec
```

## Setup

### 1. Supabase

1. Create or use an existing Supabase project.
2. Open **SQL Editor** and paste/run the entire contents of [`supabase/schema.sql`](./supabase/schema.sql). Re-running is safe.
3. From **Project Settings → API**:
   - Copy the **Project URL** (e.g., `https://podlpuvxievstmapnlnk.supabase.co`).
   - Copy the **legacy anon key** (long JWT starting with `eyJ…`).
   - Copy the **legacy service_role key** (long JWT starting with `eyJ…`).
   - Open **JWT Settings** and copy the **JWT Secret**.

> The plan uses the legacy JWT keys. The new `sb_publishable_…` / `sb_secret_…` keys are not used by this build.

### 2. Stripe

1. Use a Stripe **test-mode** account.
2. From **Developers → API keys**, copy the **Publishable key** (`pk_test_…`) and the full **Secret key** (`sk_test_…`).
3. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run, in a separate terminal:
   ```bash
   stripe listen --forward-to localhost:8000/api/stripe/webhook
   ```
   Copy the printed `whsec_…` value into `backend/.env` as `STRIPE_WEBHOOK_SECRET`.

### 3. Anthropic

Create an API key at [console.anthropic.com](https://console.anthropic.com) and copy the `sk-ant-…` value.

### 4. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                # then fill in real values
uvicorn app.main:app --reload --port 8000
```

Health check: `curl http://localhost:8000/api/health` → `{"status":"ok"}`.

### 5. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local    # then fill in real values
npm run dev
```

App at <http://localhost:3000>. Sign up at `/register` — your `kareem.hosny2001@gmail.com` account is auto-promoted to admin via the schema's profile-creation trigger.

### 6. (Optional) Seed demo data

For realistic admin charts, run the seed script. It uses the Supabase Admin API to create real auth users (necessary because `profiles.id` is FK to `auth.users.id`):

```bash
cd backend
source venv/bin/activate
python -m scripts.seed
```

Creates 60 fake users with subscriptions and invoices spanning the last 8 months. All seeded accounts share the password `DemoPassword123!` — they exist for chart realism, not for sign-in demos.

## Environment variables

### `backend/.env`

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy service_role JWT (Project Settings → API) |
| `SUPABASE_JWT_SECRET` | JWT secret used to verify Bearer tokens |
| `STRIPE_SECRET_KEY` | Full `sk_test_…` (≈107 chars) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` printed by `stripe listen` |
| `ANTHROPIC_API_KEY` | `sk-ant-…` |
| `ANTHROPIC_MODEL` | Defaults to `claude-haiku-4-5-20251001` |
| `FRONTEND_URL` | `http://localhost:3000` |
| `ADMIN_EMAIL` | Email auto-promoted to admin (matches schema trigger) |

### `frontend/.env.local`

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Same as backend `SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Legacy anon JWT |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |

## API endpoints

All endpoints under `/api/*`. Protected endpoints require `Authorization: Bearer <supabase_jwt>`.

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/health` | — | Liveness probe |
| GET | `/api/plans` | — | List active plans |
| GET | `/api/plans/{id}` | — | Plan detail |
| GET | `/api/auth/me` | user | Profile + active subscription |
| PUT | `/api/auth/profile` | user | Update name / avatar |
| GET | `/api/subscriptions/current` | user | Active subscription |
| GET | `/api/subscriptions/history` | user | All subscriptions |
| GET | `/api/invoices?page&per_page` | user | Paginated invoices |
| POST | `/api/stripe/create-checkout` | user | Returns Stripe Checkout URL |
| POST | `/api/stripe/create-portal` | user | Returns Customer Portal URL |
| POST | `/api/stripe/webhook` | signature | Stripe-signed webhook |
| POST | `/api/chat` | user | Anthropic-powered support reply |
| GET | `/api/admin/stats` | admin | Total users, active subs, MRR, churn |
| GET | `/api/admin/charts/subscriber-growth` | admin | 8-month new subs |
| GET | `/api/admin/charts/revenue` | admin | 8-month paid revenue |
| GET | `/api/admin/charts/plan-distribution` | admin | Active subs per plan |
| GET | `/api/admin/charts/billing-split` | admin | Monthly vs quarterly |
| GET | `/api/admin/users` | admin | Paginated, filterable user list |
| GET | `/api/admin/subscriptions` | admin | Paginated, filterable subscriptions |
| GET | `/api/admin/recent-activity` | admin | Recent signups + subscription changes |

Interactive API docs available at <http://localhost:8000/docs>.

## End-to-end test flow

1. Start backend, frontend, and `stripe listen` (3 terminals).
2. Visit <http://localhost:3000> → click **Get started** → register with `kareem.hosny2001@gmail.com`.
3. Go to **Plans**, choose Professional → Monthly → you'll be redirected to Stripe Checkout.
4. Pay with test card `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.
5. On return you'll land on the success page; the webhook creates the subscription row and an invoice.
6. Visit **Dashboard** to see your active plan, **Invoices** to see the receipt.
7. Open the **AI chat bubble** (bottom-right) and ask "what's my current plan?" — the assistant will reference the seeded user context.
8. Visit **Admin dashboard** for stats and charts (run the seed script first for richer data).

## Known limitations

- `supabase-py` is synchronous; FastAPI handlers call it from async paths. Acceptable for demo, swap to `asyncpg` for high concurrency.
- Account self-deletion isn't implemented — Settings → Danger zone shows a placeholder.
- The "Cancel subscription" CTA opens the Stripe Customer Portal where users complete cancellation, instead of toggling `cancel_at_period_end` directly via the API. Cleaner UX, fewer edge cases.
- The seed script uses the Supabase Admin API to create real auth users; running it multiple times will keep adding subscriptions/invoices to the same users.
