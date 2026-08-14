# Consignment notification setup

## Architecture

Shipments remain the source of truth in Supabase. The migration creates a durable
`notification_events` outbox and a `notification_deliveries` audit log. Database
triggers append events only after a shipment is explicitly published or a
meaningful lifecycle/chat event occurs. A Netlify scheduled function processes a
small batch every five minutes and sends Gmail SMTP email from server-only
environment variables.

This separation is intentional: an SMTP outage records a retryable failure and
does not roll back a consignment update. The function never accepts recipient,
subject, or email body input from a browser, so it cannot be used as an open
email relay.

Netlify is used instead of a Supabase Edge Function because the deployed
Supabase Edge/Deno runtime does not support outbound connections on Gmail's
standard SMTP ports. The app already deploys to Netlify, whose server functions
support Nodemailer's SMTP transport.

## Deploy the database migration

This repository did not contain a Supabase CLI configuration or a configured CLI
binary, so the migration was generated but not applied. From a machine with the
Supabase CLI installed and linked to the intended non-production project, run:

```bash
supabase db push
```

Review the generated migration first:

```text
supabase/migrations/20260813000000_consignment_notifications.sql
supabase/migrations/20260813000001_secure_chat_access.sql
```

It is additive and deliberately leaves existing shipments as drafts
(`is_published = false`), so no historic customer email is generated on deploy.

The second migration removes the previous public chat policies. Customers must
sign in with the email recorded as the shipment sender or receiver before they
can read or write that shipment's conversation. To create an operations admin,
promote the corresponding profile server-side after signup:

```sql
UPDATE public.users SET user_type = 'admin' WHERE email = 'admin@example.com';
```

Use your actual administrator email in the statement and run it only from the
Supabase SQL editor or another trusted server-side session.

## Netlify environment variables

Configure these in **Netlify → Site configuration → Environment variables**.
They are server-only; none may be prefixed with `VITE_`.

| Variable | Set it to |
| --- | --- |
| `SMTP_USER` | The Gmail/Google Workspace address used to send mail. |
| `SMTP_APP_PASSWORD` | A Google App Password generated for that Gmail account. |
| `ADMIN_EMAIL` | The private operations/admin notification inbox. |
| `APP_NAME` | The customer-facing company/app name. |
| `APP_URL` | The production site origin: `https://buskelogistics.netlify.app`. |
| `SUPABASE_URL` | Your Supabase project URL (non-`VITE_` copy for the server). |
| `SUPABASE_SECRET_KEY` | A current Supabase `sb_secret_...` key; Netlify only, never frontend. |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy fallback only. Do not set it when using `SUPABASE_SECRET_KEY`. |
| `SMTP_HOST` | `smtp.gmail.com` (default). |
| `SMTP_PORT` | `465` (default). |
| `SMTP_SECURE` | `true` for port 465. |
| `SUPPORT_URL` | The secure customer support route: `https://buskelogistics.netlify.app/chat`. |
| `LOGO_URL` | `https://buskelogistics.netlify.app/buske-logo.jpeg` (the project logo, verified public). |
| `LOCAL_APP_URL` | `http://localhost:5173`; used only for email tests redirected via `EMAIL_TEST_RECIPIENT`. |
| `EMAIL_LINK_BASE_URL` | Optional staging/test CTA override; leave blank for normal production behaviour. |
| `EMAIL_TEST_MODE` | Set to `true` **only** during a controlled test run. **Both** this variable and `EMAIL_TEST_RECIPIENT` must be present for redirection to activate. |
| `EMAIL_TEST_RECIPIENT` | The safe test inbox. Emails are redirected here only when `EMAIL_TEST_MODE=true`. Harmless if set without `EMAIL_TEST_MODE=true`. |

`TRACKING_URL` is documented in `.env.example` for compatibility, but current
email CTAs use the application's actual route format: `APP_URL/track/:id`.
For redirected test email, `LOCAL_APP_URL` replaces the CTA base only; the logo
always uses its public production URL because email clients cannot load assets
from localhost.

## Notification behavior

- **Publish & notify** changes a draft shipment to published once; sender,
  receiver, and admin events are queued with an idempotency key.
- Hold, release, delivery, termination, payment confirmation, and meaningful
  status changes queue lifecycle notifications after publication.
- New customer chat messages notify the admin. Admin replies notify both
  registered shipment parties, with no chat body in email.
- Every delivery is logged by event and recipient. Failed sends retry up to three
  times with increasing delays; a failed email does not alter shipment state.

The current chat data model has only `user` and `admin` roles, not separate
authenticated sender/receiver identities. Therefore admin chat replies notify
both shipment parties and the email links to `SUPPORT_URL`, not an unprotected
conversation URL. Do not add a tracking ID to a chat email link until the chat
route requires authenticated or token-verified participant access.

## Safe test procedure

1. Set `EMAIL_TEST_MODE=true` **and** `EMAIL_TEST_RECIPIENT` to an inbox you control.
2. Deploy the Netlify function and migration.
3. Create a shipment and press **Create Shipment** (not Save Draft).
   - The INSERT itself sets `is_published=true`; no second action is required.
   - Confirm the `shipment_published` notification event appears in `notification_events`.
4. Confirm emails arrive only at the test inbox (not at real customer addresses).
5. Inspect `notification_events` / `notification_deliveries` for each lifecycle event.
6. To end the test, set `EMAIL_TEST_MODE=false` (or remove it) in Netlify.
   `EMAIL_TEST_RECIPIENT` may remain set; it is inert without `EMAIL_TEST_MODE=true`.
