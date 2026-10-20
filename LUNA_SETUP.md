# Cloudflare Pages and Supabase setup

HerCycle uses Supabase Auth and RLS-protected tables directly from the browser. Cloudflare Pages Functions provide runtime Supabase configuration and the consent-gated Luna AI endpoint:

- `GET /api/config` returns the Supabase project URL and **public** publishable/anon key to the same-origin app.
- `POST /api/luna-chat` verifies the signed-in Supabase access token, then calls Workers AI only after explicit AI consent.

## Cloudflare Pages variables and bindings

Set these **Pages Function runtime variables** for both Production and Preview environments:

- `SUPABASE_URL` — the Supabase project URL.
- `SUPABASE_ANON_KEY` **or** `SUPABASE_PUBLISHABLE_KEY` — the Supabase publishable/anon key. This key is public by design and is subject to Supabase RLS.

Never use a Supabase service-role key in HerCycle, in a `REACT_APP_*` variable, or in either public-key variable. `/api/config` returns only a recognized publishable/anon key; it rejects `sb_secret_*` values and service-role JWTs and does not return other variables.

For Luna AI, also enable the Workers AI binding named exactly `AI`. `wrangler.toml` declares this binding for Wrangler deployments. Dashboard deployments must add the same binding in the Pages project's Functions settings. Optionally set `LUNA_MODEL` to a Workers AI model enabled for the account; otherwise Luna uses its fast default model.

`/api/config` should return HTTP 200 with `configured: true` once the variables are set. `/api/luna-chat` requires a signed-in session, explicit AI consent, valid Supabase variables, and the `AI` binding; local Luna replies continue to work if AI is unavailable.

## Build and Supabase Auth

- Build command: `npm run build`
- Output directory: `build`
- Use Node.js 24 (`.nvmrc`; set `NODE_VERSION=24` if needed).
- Keep the repository-root `functions/` directory in the Pages project so both `/api/*` Functions are deployed. `public/_routes.json` scopes Function execution to `/api/*`; `public/_redirects` deliberately avoids a catch-all rewrite so it cannot shadow the Function endpoints. Because this app has no `404.html`, Pages supplies the SPA fallback for client routes.
- In Supabase Auth settings, enable Email auth and add your deployed Pages domain and any custom domain to the Site URL / allowed redirect URLs. HerCycle redirects email confirmation back to the current app origin.
- For a new Supabase project, run `supabase/schema.sql` in the SQL Editor. For an existing project created from the earlier HerCycle schema, run `supabase/migrations/20261015000000_period_intimacy_metadata.sql`. It aligns the missing profile, energy, and period fields, adds the intimacy vibe, refreshes owner-only RLS/permissions, and updates the cycle RPC signature. It is safe to apply more than once; it has not been applied to a live project as part of this change.

## Local development

`npm start` runs Create React App, not Cloudflare Pages Functions. For a plain local preview, optional `.env.local` build variables can be used:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_KEY` (publishable/anon key only)

Without those local build variables, HerCycle remains usable in guest mode; account sync is enabled in the deployed Pages build through `/api/config`. To exercise Cloudflare Functions locally, use Wrangler Pages dev with the runtime variables and Workers AI binding configured.

The intimacy share composer uses the device's share sheet, SMS composer, or clipboard after the user chooses to share. HerCycle does not send a partner message automatically or store the partner's contact/message; automated SMS/email delivery would require a separate messaging provider and its credentials.
