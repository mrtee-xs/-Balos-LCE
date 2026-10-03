# Balos Dashboard — Client Installation & Deployment Guide

This guide covers the deployment and setup steps to configure a new client agency instance of the Balos Operations Dashboard.

---

## 1. Prerequisites

- **Node.js**: v18.17+ or v20+
- **Supabase**: Active Supabase project with Balos schema, tables, and RLS policies deployed
- **Storage**: Public bucket named `property-media` created in Supabase Storage

---

## 2. Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Populate the four client-specific environment variables:

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API URL | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project public anon key | `eyJhbGciOi...` |
| `NEXT_PUBLIC_BRAND_NAME` | Client agency legal / trading brand name | `Balos Real Estate` |
| `NEXT_PUBLIC_BRAND_LOGO_URL` | *(Optional)* Direct URL to client brand logo image | `https://agency.com/logo.png` |

> **Security Rule**: Use **ONLY** the public anon key. Never configure or reference a privileged service key in this repository.

---

## 3. Database Verification

Ensure the client Supabase PostgreSQL instance has the necessary RPC functions and bucket privileges:

1. **RPC Functions**:
   - `public.is_dashboard_user()`: Returns `boolean` whether `auth.jwt() ->> 'email'` is an active agent in `public.agents`.
   - `public.is_dashboard_admin()`: Returns `boolean` whether the active agent has role `'admin'`.

2. **Storage Bucket**:
   - Bucket name: `property-media`
   - Public access: `true` (read-only for public, write for authenticated admin users)

---

## 4. User Provisioning

Agency staff must be invited or registered via Supabase Auth and assigned to the `agents` table:

1. In Supabase Dashboard -> **Authentication** -> **Users**, create a new user with their email address and initial password.
2. In the SQL Editor or Table Editor, insert a matching record into `public.agents`:
   ```sql
   INSERT INTO public.agents (name, email, phone, role, is_active)
   VALUES ('Agent Name', 'agent@agency.com', '+971 50 123 4567', 'admin', true);
   ```
   *Roles*: `'admin'` (full management) or `'agent'` (inbox, leads, and viewing access).

---

## 5. Build and Run

```bash
# Install dependencies
npm install

# Run locally in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 6. Verification Checklist

- [ ] Unauthenticated requests redirect to `/login`.
- [ ] Users not registered in `agents` receive the setup message: *"Your account isn't set up for this dashboard. Ask your admin."*
- [ ] Admins see property edit controls and team management under `/settings/team`.
- [ ] Agents have read-only access to properties and business info.
- [ ] All dates and times display in Dubai GST (`Asia/Dubai`).
- [ ] Property price changes of AED 2,000,000+ automatically toggle UAE Golden Visa status.
