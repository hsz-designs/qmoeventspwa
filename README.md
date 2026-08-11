# QMO NU Manila Events

A mobile-first Progressive Web App for QMO NU Manila. It includes a professional blue-and-gold login experience, event dashboard, registration flows, certificates, upcoming events, and attendance history.

## Run locally

```bash
npm install
npm run dev
```

Without Supabase environment variables, the app runs in preview mode. Use the prefilled login details (or any valid email and password of at least six characters) to explore every screen.

## Connect Supabase

1. Create a Supabase project.
2. Apply every file in [`supabase/migrations`](supabase/migrations) in filename order, or use `supabase db push` from a linked Supabase CLI project. The role migration defines `nu_users.role` as `1` for attendees and `2` for admins; legacy or blank roles are normalized to attendee.
3. Copy `.env.example` to `.env.local` and add the project URL and anon key:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Create users through Supabase Authentication. The database trigger automatically creates each user's `profiles` row. Optional signup metadata keys are `full_name`, `student_number`, and `program`.
5. Add published records to `events`. The authenticated UI automatically loads Supabase events, registrations, attendance history, and certificates.

The attendance audit screen first reads `nu_attendees_log`, then falls back to the repository's existing `nu_event_attendees_log` table name when the shorter table is not present. In both cases, each user sees only their own log rows while role `2` is authorized by Row Level Security to read all rows.

The anon key is safe to expose in the web client when Row Level Security remains enabled. Never put the Supabase service-role key in a Vite environment variable.

## PWA and deployment

The app includes a web manifest, installable app icon, standalone display mode, theme metadata, and an offline service worker. The service worker is registered only in production builds. For broad Android and iOS support, add dedicated 192×192, 512×512, maskable 512×512, and Apple touch 180×180 PNG icons before production launch.

```bash
npm run build
npm run preview
```

`vercel.json` includes the SPA rewrite needed for direct page visits on Vercel. On other hosts, rewrite unknown routes to `index.html` and serve the site over HTTPS so installation and offline caching work.
