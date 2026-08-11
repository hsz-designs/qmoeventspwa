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
3. Copy `.env.example` to `.env.local` and add the project URL and publishable key from the Supabase **Connect** dialog (or **Settings → API Keys**):

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
   ```

   A legacy `anon` key is also supported as `VITE_SUPABASE_ANON_KEY`. Never use a secret or `service_role` key in a `VITE_` variable because Vite embeds these values in the browser bundle.

4. Create users through Supabase Authentication. The database trigger automatically creates each user's `profiles` row. Optional signup metadata keys are `full_name`, `student_number`, and `program`. To load an NU role and detailed profile, add or update the matching `nu_users` row so its `userID` is the Authentication user's UUID.
5. Add event data to `nu_events` and its related `nu_event_sessions`, venue, and attendee tables. The authenticated UI loads the repository's `nu_*` schema for events, registrations, attendance history, and certificates.

The attendance audit screen first reads `nu_attendees_log`, then falls back to the repository's existing `nu_event_attendees_log` table name when the shorter table is not present. In both cases, each user sees only their own log rows while role `2` is authorized by Row Level Security to read all rows.

The publishable/anon key is designed for public clients when Row Level Security remains enabled. Never put a Supabase secret or service-role key in a Vite environment variable.

### Connect the Vercel deployment

1. In the Vercel project, open **Settings → Environment Variables**.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for **Production** (and Preview if you use preview deployments).
3. Redeploy the project. Vite reads these variables at build time, so adding them does not change an already-built deployment.
4. In Supabase **Authentication → URL Configuration**, set the Site URL to the production Vercel URL and add the production login URL to Redirect URLs, for example `https://your-app.vercel.app/login`.
5. Visit the redeployed app. The yellow Preview notice should be gone; sign in with a user created in Supabase Authentication.

## PWA and deployment

The production build generates one web manifest and one Workbox service worker through `vite-plugin-pwa`. It includes 192×192, 512×512, maskable 512×512, and Apple touch 180×180 PNG icons. When a supported Chromium browser reports that the app is installable, QMO Events automatically displays an in-app installation banner; the user must still tap **Install** and approve the browser confirmation. On iPhone and iPad, the banner provides Safari's manual **Share → Add to Home Screen** steps because iOS does not expose the Chromium install prompt to websites. The login and Settings screens retain their install actions as a fallback.

```bash
npm run build
npm run preview
```

`vercel.json` includes the SPA rewrite needed for direct page visits on Vercel. On other hosts, rewrite unknown routes to `index.html` and serve the site over HTTPS so installation and offline caching work.
