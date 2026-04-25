# SaaS Subscription Management Platform — Full Build

## Overview
Build a production-quality SaaS subscription management platform with a **Next.js 14 frontend** and a **FastAPI (Python) backend**. Uses Supabase for the database (PostgreSQL), Stripe test mode for payments, and the Anthropic Claude API for an AI support chatbot. Deploy-ready (Vercel for frontend, backend structured for any Python host).

This is an interview take-home task — the code quality, UI polish, and architecture need to be **exceptional**. Take your time on each step. Don't rush.

---

## Tech Stack (strict)

### Frontend
- **Framework:** Next.js 14 with App Router (TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Charts:** Recharts
- **HTTP Client:** Axios or fetch to call FastAPI backend
- **Auth state:** Supabase client-side auth via @supabase/supabase-js + @supabase/ssr
- **Stripe frontend:** @stripe/stripe-js (for redirecting to Checkout)

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Database ORM:** Supabase Python client (`supabase-py`) or raw `asyncpg` / `sqlalchemy`
- **Payments:** stripe (Python SDK)
- **AI:** anthropic API via `httpx` (direct HTTP call, no SDK needed)
- **Auth verification:** Verify Supabase JWTs on every protected endpoint
- **CORS:** Allow frontend origin

### Infrastructure
- **Database & Auth:** Supabase (hosted PostgreSQL + auth)
- **Payments:** Stripe test mode
- **AI:** Anthropic Claude API

---

## Design Philosophy — CRITICAL

This app must NOT look like generic AI-generated UI. Follow these design principles strictly:

### Aesthetic Direction: "Premium SaaS — Editorial Fintech"
Think Linear meets Stripe Dashboard. Dark sidebar, light content area, sharp typography, generous whitespace.

### Typography:
- **Display/Headings:** Use "Plus Jakarta Sans" (import from Google Fonts) — geometric, modern, confident
- **Body text:** Use "DM Sans" — clean, highly readable
- Do NOT use Inter, Roboto, Arial, or system fonts
- Import both via `next/font/google`

### Color System (CSS variables in globals.css):
```
Primary:        #2563EB (vibrant blue)
Primary Hover:  #1D4ED8
Primary Light:  #EFF6FF
Accent:         #0EA5E9 (sky blue for highlights)
Success:        #10B981
Warning:        #F59E0B
Danger:         #EF4444
Background:     #FAFBFC (main content)
Sidebar BG:     #0F172A (dark navy)
Sidebar Text:   #94A3B8
Card BG:        #FFFFFF
Border:         #E2E8F0
Text Primary:   #0F172A
Text Secondary: #64748B
```

### Visual Polish Requirements:
- Cards: `rounded-2xl shadow-sm border border-slate-200/60` with `hover:shadow-md transition-all duration-200`
- Buttons: `rounded-xl` (not rounded-md), smooth hover transitions
- Sidebar: dark navy (`#0F172A`), with active item highlighted using a subtle blue-tinted background + left border accent
- Stats cards on admin dashboard: subtle gradient backgrounds (e.g., blue-50 to blue-100), with an icon in a colored circle
- Charts: use the primary/accent color palette, rounded bars, smooth area curves, no grid clutter
- Skeleton loaders: animated pulse placeholders while data loads — NOT blank screens
- Page transitions: subtle fade-in on mount using CSS `@keyframes` or Tailwind `animate-` classes
- Spacing: generous padding (p-6, p-8 on pages), gap-6 between cards. Never feel cramped
- Badges for status: pill-shaped (`rounded-full px-3 py-1`), colored backgrounds: green for active, amber for pending, red for failed/canceled
- Empty states: centered icon + message + CTA button, not just "No data"
- Mobile: sidebar collapses to slide-over drawer with hamburger menu

### Anti-patterns to AVOID:
- No purple gradients on white backgrounds
- No centered-everything layouts
- No cookie-cutter card grids with no visual hierarchy
- No tiny text or cramped spacing
- No flat gray-on-gray buttons

---

## Project Structure

```
project-root/
├── frontend/                    # Next.js 14 app
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── auth/callback/route.ts
│   │   ├── (marketing)/
│   │   │   ├── page.tsx          # Landing page
│   │   │   └── pricing/page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx          # Overview
│   │   │   ├── subscription/page.tsx
│   │   │   ├── plans/page.tsx
│   │   │   ├── invoices/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── checkout/success/page.tsx
│   │   │   └── admin/
│   │   │       ├── page.tsx      # Admin dashboard
│   │   │       ├── users/page.tsx
│   │   │       └── subscriptions/page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                   # shadcn components
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── pricing/
│   │   ├── admin/
│   │   └── chat/
│   │       └── chat-widget.tsx   # AI chatbot
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   ├── api.ts               # Axios instance pointing to FastAPI
│   │   └── utils.ts
│   ├── middleware.ts
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── package.json
│   └── .env.local
│
├── backend/                     # FastAPI app
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, routers
│   │   ├── config.py            # Settings/env vars via pydantic-settings
│   │   ├── dependencies.py      # Auth dependency (verify Supabase JWT)
│   │   ├── routers/
│   │   │   ├── auth.py          # Profile creation, user info
│   │   │   ├── plans.py         # List plans, plan details
│   │   │   ├── subscriptions.py # User subscription CRUD
│   │   │   ├── invoices.py      # Invoice listing
│   │   │   ├── stripe_routes.py # Checkout, portal, webhook
│   │   │   ├── chat.py          # AI chatbot endpoint
│   │   │   └── admin.py         # Admin stats, user management
│   │   ├── models/
│   │   │   └── schemas.py       # Pydantic models
│   │   └── services/
│   │       ├── supabase_service.py
│   │       ├── stripe_service.py
│   │       └── chat_service.py
│   ├── requirements.txt
│   └── .env
│
└── supabase/
    └── schema.sql               # Full DB schema + seed data
```

---

## Step 1: Backend Setup (FastAPI)

### 1.1 Initialize the FastAPI project
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn[standard] supabase httpx stripe pydantic-settings python-jose[cryptography] python-dotenv
pip freeze > requirements.txt
```

### 1.2 Environment variables (`backend/.env`):
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
FRONTEND_URL=http://localhost:3000
```

### 1.3 `app/config.py`:
- Use `pydantic_settings.BaseSettings` to load all env vars
- Single `settings` instance exported

### 1.4 `app/main.py`:
- Create FastAPI app with title, description, version
- Add CORS middleware allowing frontend origin (http://localhost:3000 + production URL)
- Include all routers with prefixes:
  - `/api/plans`
  - `/api/subscriptions`
  - `/api/invoices`
  - `/api/stripe`
  - `/api/chat`
  - `/api/admin`
  - `/api/auth`

### 1.5 `app/dependencies.py`:
- Create a `get_current_user` dependency that:
  - Extracts Bearer token from Authorization header
  - Decodes and verifies the Supabase JWT using `python-jose`
  - Returns user_id (sub claim)
  - Raises 401 if invalid
- Create `get_admin_user` dependency that additionally checks `is_admin` in profiles table

---

## Step 2: Database Schema (Supabase)

Create `supabase/schema.sql`:

### Tables:

1. **profiles** (extends Supabase auth.users):
   - id (uuid, PK, FK to auth.users ON DELETE CASCADE)
   - full_name (text NOT NULL)
   - email (text NOT NULL)
   - avatar_url (text, nullable)
   - is_admin (boolean, DEFAULT false)
   - created_at (timestamptz, DEFAULT now())
   - updated_at (timestamptz, DEFAULT now())

2. **plans**:
   - id (uuid, PK, DEFAULT gen_random_uuid())
   - name (text NOT NULL) — "Starter", "Professional", "Enterprise"
   - description (text)
   - features (jsonb) — array of feature strings
   - monthly_price (integer NOT NULL) — in cents
   - quarterly_price (integer NOT NULL) — in cents
   - stripe_monthly_price_id (text, nullable)
   - stripe_quarterly_price_id (text, nullable)
   - is_active (boolean, DEFAULT true)
   - sort_order (integer, DEFAULT 0)
   - created_at (timestamptz, DEFAULT now())

3. **subscriptions**:
   - id (uuid, PK, DEFAULT gen_random_uuid())
   - user_id (uuid, FK to profiles ON DELETE CASCADE)
   - plan_id (uuid, FK to plans)
   - stripe_subscription_id (text, nullable)
   - stripe_customer_id (text, nullable)
   - status (text NOT NULL) — CHECK IN ('active', 'canceled', 'past_due', 'trialing', 'expired')
   - billing_interval (text NOT NULL) — CHECK IN ('monthly', 'quarterly')
   - current_period_start (timestamptz)
   - current_period_end (timestamptz)
   - cancel_at_period_end (boolean, DEFAULT false)
   - created_at (timestamptz, DEFAULT now())
   - updated_at (timestamptz, DEFAULT now())

4. **invoices**:
   - id (uuid, PK, DEFAULT gen_random_uuid())
   - subscription_id (uuid, FK to subscriptions)
   - user_id (uuid, FK to profiles)
   - stripe_invoice_id (text, nullable)
   - amount (integer NOT NULL) — in cents
   - currency (text, DEFAULT 'usd')
   - status (text NOT NULL) — CHECK IN ('paid', 'pending', 'failed')
   - invoice_date (timestamptz NOT NULL)
   - paid_at (timestamptz, nullable)

### Seed Data — Plans:
Insert 3 plans:
- **Starter**: monthly_price=900, quarterly_price=2400 (save 11%). sort_order=1. Features: ["Up to 5 projects", "Basic analytics", "Email support", "1 team member"]
- **Professional**: monthly_price=2900, quarterly_price=7800 (save 10%). sort_order=2. Features: ["Unlimited projects", "Advanced analytics", "Priority support", "Up to 10 team members", "API access", "Custom integrations"]
- **Enterprise**: monthly_price=9900, quarterly_price=26700 (save 10%). sort_order=3. Features: ["Everything in Professional", "Unlimited team members", "Dedicated account manager", "SSO & SAML", "99.9% SLA", "Custom contracts"]

### Seed Data — Demo Users & Subscriptions:
Create a seed script that inserts into profiles, subscriptions, and invoices:
- 50+ fake users with realistic names and emails
- Distribution: 40% Starter, 35% Professional, 25% Enterprise
- 70% monthly, 30% quarterly billing
- Status mix: 80% active, 10% canceled, 5% past_due, 5% expired
- Invoice records spanning the last 6 months (3-6 invoices per active user)
- Varying created_at dates across the last 8 months for realistic growth charts
- Make ONE user an admin (is_admin=true) for demo purposes

### RLS Policies:
- profiles: users can SELECT/UPDATE their own row (WHERE id = auth.uid())
- subscriptions: users can SELECT their own (WHERE user_id = auth.uid())
- invoices: users can SELECT their own (WHERE user_id = auth.uid())
- plans: anyone can SELECT active plans (WHERE is_active = true)
- Service role bypasses RLS (used by FastAPI backend)

### Trigger:
Create a trigger function that auto-creates a profile row when a new user signs up in auth.users.

---

## Step 3: Backend API Endpoints

### `routers/plans.py`:
- `GET /api/plans` — List all active plans (public, no auth needed), ordered by sort_order
- `GET /api/plans/{plan_id}` — Get single plan details

### `routers/auth.py`:
- `GET /api/auth/me` — Get current user profile + active subscription info (protected)
- `PUT /api/auth/profile` — Update full_name, avatar_url (protected)

### `routers/subscriptions.py`:
- `GET /api/subscriptions/current` — Get user's active subscription with plan details (protected)
- `GET /api/subscriptions/history` — Get all user's subscriptions (protected)

### `routers/invoices.py`:
- `GET /api/invoices` — List user's invoices, sorted by date desc, with pagination (protected)

### `routers/stripe_routes.py`:
- `POST /api/stripe/create-checkout` — (protected)
  - Body: { plan_id: string, billing_interval: "monthly" | "quarterly" }
  - Gets or creates Stripe customer for the user
  - Creates Stripe Checkout Session in test mode
  - If plan doesn't have stripe price IDs, dynamically create them via `stripe.Price.create()`
  - Returns { url: checkout_session.url }

- `POST /api/stripe/create-portal` — (protected)
  - Creates Stripe Customer Portal session
  - Returns { url: portal_session.url }

- `POST /api/stripe/webhook` — (NO auth — uses Stripe signature verification)
  - Verify webhook signature with `stripe.Webhook.construct_event()`
  - Handle events:
    - `checkout.session.completed`: Create/update subscription in Supabase
    - `customer.subscription.updated`: Update subscription status
    - `customer.subscription.deleted`: Mark subscription as canceled
    - `invoice.payment_succeeded`: Create invoice record in Supabase
    - `invoice.payment_failed`: Create failed invoice record

### `routers/chat.py`:
- `POST /api/chat` — (protected)
  - Body: { message: string, conversation_history: [{role, content}] }
  - Fetches user's current plan, subscription status, billing info from Supabase
  - Calls Anthropic API via httpx:
    ```python
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "Content-Type": "application/json",
                "x-api-key": settings.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01"
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 500,
                "system": f"""You are a friendly, professional support assistant for SubFlow, a SaaS subscription platform.

You help users with:
- Understanding plan features and pricing (Starter $9/mo, Professional $29/mo, Enterprise $99/mo)
- Billing questions (monthly vs quarterly billing, quarterly saves ~10%)
- Subscription management (upgrading, downgrading, canceling)
- Account and general platform questions

Current user context:
- Name: {user_data['full_name']}
- Current Plan: {user_data.get('plan_name', 'No active plan')}
- Subscription Status: {user_data.get('status', 'None')}
- Billing Interval: {user_data.get('billing_interval', 'N/A')}
- Next Billing Date: {user_data.get('current_period_end', 'N/A')}

Rules:
- Be concise and helpful (2-3 sentences max per response)
- If asked about things outside your scope, politely redirect
- For complex issues like refunds, suggest contacting human support
- Never make up features that don't exist
- Use the user's name naturally but don't overdo it""",
                "messages": conversation_history
            },
            timeout=30.0
        )
    ```
  - Extract and return the text content from the response
  - Handle errors gracefully — return a friendly fallback message

### `routers/admin.py` (all endpoints require admin auth):
- `GET /api/admin/stats` — Returns:
  - total_users (count of profiles)
  - active_subscriptions (count where status='active')
  - mrr (sum of monthly equivalent revenue from active subs)
  - churn_rate (canceled last 30 days / total active)

- `GET /api/admin/charts/subscriber-growth` — Monthly new subscription counts over last 8 months
- `GET /api/admin/charts/revenue` — Monthly revenue over last 8 months
- `GET /api/admin/charts/plan-distribution` — Count of active subs per plan
- `GET /api/admin/charts/billing-split` — Monthly vs quarterly active subs count

- `GET /api/admin/users` — Paginated user list with their subscription info
  - Query params: page, per_page, search (name/email), plan_filter, status_filter
  - Returns: users array + total count

- `GET /api/admin/subscriptions` — Paginated subscription list
  - Query params: page, per_page, plan_filter, status_filter, interval_filter

- `GET /api/admin/recent-activity` — Last 20 signups and subscription changes

---

## Step 4: Frontend Setup

### 4.1 Initialize Next.js:
```bash
cd frontend
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

### 4.2 Install dependencies:
```bash
npm install @supabase/supabase-js @supabase/ssr @stripe/stripe-js axios recharts lucide-react
npx shadcn-ui@latest init
# Add components:
npx shadcn-ui@latest add button card input label badge table tabs dialog dropdown-menu avatar separator toast sheet skeleton
```

### 4.3 Environment variables (`frontend/.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4.4 `lib/api.ts`:
Create an Axios instance:
```typescript
import axios from 'axios';
import { createClient } from '@/lib/supabase/client';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Request interceptor to attach Supabase auth token
api.interceptors.request.use(async (config) => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export default api;
```

### 4.5 Fonts (`app/layout.tsx`):
```typescript
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
});
```
Apply both as CSS variables and configure in `tailwind.config.ts` under `fontFamily`.

### 4.6 Supabase clients:
- `lib/supabase/client.ts` — browser client using `createBrowserClient`
- `lib/supabase/server.ts` — server client using `createServerClient` with cookies

### 4.7 Middleware (`middleware.ts`):
- Refresh Supabase session on every request
- Protect `/dashboard/*` routes → redirect to `/login` if no session
- Redirect `/login`, `/register` → `/dashboard` if already authenticated

---

## Step 5: Auth Pages

### `/login` page:
- **Split layout**: left panel (60% width) with dark navy gradient background, app logo "SubFlow", tagline "Manage your subscriptions intelligently", decorative geometric shapes or subtle grid pattern. Right panel (40%) with the login form.
- Email + password fields (shadcn Input + Label)
- "Sign In" button (full width, primary blue, rounded-xl)
- "Don't have an account? Sign up" link below
- Error handling with toast notifications
- Loading state on button while submitting
- On success: redirect to `/dashboard`

### `/register` page:
- Same split layout as login
- Fields: Full Name, Email, Password, Confirm Password
- Password validation (min 8 chars)
- On success: redirect to `/dashboard/plans` to pick a plan
- Auto-create profile via Supabase trigger (or call FastAPI)

### `/auth/callback/route.ts`:
- Handle Supabase auth code exchange
- Redirect to `/dashboard`

---

## Step 6: Marketing Pages

### Landing page `/`:
- Hero section: bold headline "Subscription Management, Simplified", subtitle, CTA buttons "Get Started" and "View Pricing"
- Features section: 3-column grid with icons, titles, descriptions
- Pricing preview: link to /pricing
- Footer with links
- Navigation bar: Logo, Pricing link, Login, "Get Started" button

### Pricing page `/pricing`:
- Monthly/Quarterly toggle switch at top
- 3 plan cards in a row
- Professional plan highlighted as "Most Popular" (slightly larger, blue border, badge)
- Each card shows: plan name, price (animated number change on toggle), feature list with checkmark icons, CTA button
- Quarterly prices show a "Save X%" badge
- If user is logged in and subscribed, show "Current Plan" badge on their active plan
- CTA: "Get Started" → register if not logged in, checkout if logged in

---

## Step 7: Dashboard Layout & Overview

### Dashboard Layout (`/dashboard/layout.tsx`):
**Sidebar** (fixed left, 260px wide, dark navy #0F172A):
- Top: "SubFlow" logo/text in white
- Nav items with icons (from lucide-react):
  - Dashboard (LayoutDashboard icon)
  - Subscription (CreditCard icon)
  - Plans (Layers icon)
  - Invoices (FileText icon)
  - Settings (Settings icon)
  - Separator line
  - Admin section (only visible if user.is_admin):
    - Admin Dashboard (BarChart3 icon)
    - Users (Users icon)
    - Subscriptions (List icon)
- Active item: blue-tinted background (bg-blue-500/10), left blue border (border-l-2 border-blue-400), white text
- Inactive items: slate-400 text, hover bg-white/5
- Bottom: user avatar + name + dropdown (Profile, Logout)

**Top bar** (sticky, white bg, bottom border):
- Page title (dynamic based on route)
- Right side: notification bell icon (decorative), user avatar

**Mobile**: sidebar hidden, hamburger menu in top bar opens a Sheet (slide-over) with the same nav

### Dashboard Overview (`/dashboard/page.tsx`):
- "Welcome back, {name}" heading
- If no subscription: prominent CTA card "Choose a plan to get started" with button → /dashboard/plans
- If subscribed, show:
  - **Current Plan card**: plan name, status badge (green "Active"), billing interval, price, next billing date, "Manage Subscription" button
  - **Quick Stats row**: 3 small cards — "Current Plan" (plan name), "Next Payment" (date), "Amount" (price)
  - **Quick Actions**: "View Invoices", "Change Plan", "Get Support" (opens chat widget)

---

## Step 8: Subscription, Plans, Invoices, Settings Pages

### `/dashboard/subscription`:
- Full subscription details card:
  - Plan name + tier badge
  - Status badge (colored: active=green, canceled=amber, past_due=red)
  - Billing interval + amount
  - Current period: start date → end date with a progress bar showing how far through the period
  - Created date
- Action buttons:
  - "Manage Billing" → opens Stripe Customer Portal (calls POST /api/stripe/create-portal)
  - "Cancel Subscription" → confirmation dialog → sets cancel_at_period_end
  - "Change Plan" → navigates to /dashboard/plans
- If canceled: show "Your plan will remain active until {end_date}" message

### `/dashboard/plans`:
- Same pricing UI as the public /pricing page but inside dashboard layout
- Current plan shows "Current Plan" badge instead of CTA
- Other plans show "Upgrade" or "Downgrade" button
- Clicking subscribe/upgrade → POST /api/stripe/create-checkout → redirect to Stripe Checkout

### `/dashboard/invoices`:
- shadcn Table with columns: Date, Invoice #, Plan, Amount, Status (badge), Actions
- Status badges: paid=green, pending=amber, failed=red
- Amount formatted as "$X.XX"
- Dates formatted nicely (e.g., "Mar 15, 2025")
- Pagination controls at bottom
- Empty state if no invoices: receipt icon + "No invoices yet" + "Subscribe to a plan" button

### `/dashboard/settings`:
- Card sections:
  1. **Profile**: Edit full name, email (readonly or with re-auth), avatar URL input. Save button.
  2. **Password**: Current password, new password, confirm password. Update button.
  3. **Danger Zone**: Delete account button (red, with confirmation dialog)
- Toast notification on successful save

### `/dashboard/checkout/success`:
- Centered content: checkmark animation (CSS animated circle + checkmark SVG), "Payment Successful!" heading, "Your subscription is now active" subtitle
- "Go to Dashboard" button
- Auto-redirect to dashboard after 5 seconds

---

## Step 9: Admin Dashboard

### `/dashboard/admin` — Overview:
**Stats Cards Row** (4 cards):
- Total Users: count + user icon, subtle blue gradient bg
- Active Subscriptions: count + chart icon, subtle green gradient bg
- MRR: dollar amount + dollar icon, subtle purple gradient bg
- Churn Rate: percentage + trending-down icon, subtle amber gradient bg
- Each card has a small "vs last month" comparison text

**Charts Section** (2x2 grid on desktop):
1. **Subscriber Growth** (Recharts AreaChart):
   - Monthly new subscriptions over last 8 months
   - Gradient fill under the line (blue)
   - X-axis: month names, Y-axis: count
   
2. **Revenue Trend** (Recharts BarChart):
   - Monthly revenue over last 8 months
   - Bars colored with primary blue
   - Y-axis formatted as "$X.XK"

3. **Plan Distribution** (Recharts PieChart):
   - Donut chart showing % of users per plan
   - Custom colors per plan: Starter=sky, Professional=blue, Enterprise=indigo
   - Center label showing total
   - Legend below

4. **Billing Interval Split** (Recharts PieChart):
   - Monthly vs Quarterly donut
   - Two colors only

**Recent Activity Feed** (below charts):
- Card with a scrollable list of recent events
- Each item: avatar/icon, "John Doe subscribed to Professional (monthly)", timestamp
- Last 10-15 activities

### `/dashboard/admin/users`:
- Search bar (filter by name or email)
- Filters: plan dropdown, status dropdown
- shadcn Table: Name (with avatar), Email, Plan (badge), Status (badge), Billing, Joined Date
- Pagination
- Clicking a row could show a detail dialog (stretch goal)

### `/dashboard/admin/subscriptions`:
- Similar table layout
- Filters: plan, status, billing interval
- Columns: User, Plan, Status, Interval, Amount, Started, Expires
- Summary stats bar at top: X active, Y canceled, Z past_due

---

## Step 10: AI Support Chat Widget

### `components/chat/chat-widget.tsx`:

**Chat Bubble Button** (fixed, bottom-right corner: `right-6 bottom-6`):
- 56px circle, primary blue, `shadow-lg`
- MessageCircle icon (lucide-react) in white
- Subtle pulse animation (`animate-pulse` ring) when chat hasn't been opened yet
- Small "AI" badge on top-right of bubble
- On click: toggle chat panel open/closed

**Chat Panel** (anchored above the bubble button):
- Dimensions: 380px wide, 520px tall (on mobile: full-width, 90vh tall)
- `rounded-2xl shadow-2xl border` with smooth slide-up + fade-in animation on open
- **Header**: "AI Support" title, green status dot + "Online", close (X) button. Subtle gradient or solid dark background.
- **Messages area** (flex-1, overflow-y-auto, padding):
  - Bot messages: left-aligned, bg-slate-100, rounded-2xl rounded-bl-md, dark text
  - User messages: right-aligned, bg-blue-600, rounded-2xl rounded-br-md, white text
  - Typing indicator: 3 animated bouncing dots in a bot message bubble while loading
  - Initial message on first open: "Hi {name}! 👋 I'm your AI assistant. I can help with plan details, billing questions, or subscription management. What can I help with?"
- **Input area**: text input (rounded-xl) + send button (blue, arrow icon), flex row. Submit on Enter. Disabled while loading.
- z-index: 50 to float above everything

**State**:
- messages array: [{role: 'assistant' | 'user', content: string}]
- isOpen, isLoading, inputValue
- Auto-scroll to bottom on new message
- Send via POST /api/chat with message + conversation_history
- On error: show "Sorry, I'm having trouble connecting. Please try again." as bot message

**Integration**:
- Add to dashboard layout — visible on ALL dashboard pages
- Only render for authenticated users
- Do NOT show on marketing/auth pages

---

## Step 11: Polish & Final Touches

1. **Loading states**: shadcn Skeleton components on every page that fetches data
2. **Error handling**: try/catch on all API calls, toast notifications for errors
3. **Empty states**: Custom empty state component with icon + message + CTA for every list/table
4. **Responsive**: Test every page at 375px, 768px, 1024px, 1440px
5. **Hover/focus states**: Every interactive element must have visible hover and focus states
6. **Favicon**: Create a simple SVG favicon with the app's primary blue
7. **Meta tags**: title, description on every page via Next.js metadata
8. **README.md**: Professional readme with:
   - Project title + one-line description
   - Screenshots section (placeholder for now)
   - Tech stack list
   - Setup instructions (frontend + backend + Supabase + Stripe)
   - Environment variables reference
   - API endpoints reference
   - Folder structure

---

## Running the Project

### Backend:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Frontend:
```bash
cd frontend
npm run dev
```

### Stripe webhook (local testing):
```bash
stripe listen --forward-to localhost:8000/api/stripe/webhook
```

---

## IMPORTANT REMINDERS
- Use Supabase SERVICE ROLE KEY in the backend (bypasses RLS for admin queries)
- Use Supabase ANON KEY in the frontend (respects RLS)
- All prices are in CENTS (e.g., $9.00 = 900)
- Stripe is in TEST MODE — use test card 4242424242424242
- The Anthropic API call in the chat endpoint uses direct HTTP, NOT the Python SDK
- Make every single page visually polished. This is an interview — aesthetics matter as much as functionality
- Work through steps sequentially. After each step, verify it compiles and runs before moving on.
