# Calendar & dashboard: setup

The code is complete. These steps connect it to the outside services it needs. Do them in order. Each step says how to
check that it worked.

Until step 3 is done, the calendar shows an empty month, the submission form says submissions aren't open yet, and
`/admin` says the dashboard isn't connected. Nothing breaks.

---

## Step 1: Create a Supabase project

1. Go to <https://supabase.com>, sign in, and click **New project**.
2. Name it `miami-athletic-association`. Pick the **East US** region. Save the database password somewhere safe.
3. Wait for it to finish setting up (about two minutes).

## Step 2: Create the database tables

1. In Supabase, open **SQL Editor** → **New query**.
2. Open `supabase/migrations/20261113000001_calendar.sql` from this project, copy all of it, paste it in, and click **Run**.
3. Open a new query, do the same with `supabase/migrations/20261113000002_event_images.sql`, and click **Run**.

**Check:** **Table Editor** lists `admins`, `events`, `event_private`, `event_audit`, `email_outbox` and
`rate_limit_hits`. **Storage** shows the buckets `event-uploads` (private) and `event-images` (public).

## Step 3: Connect the website to Supabase

1. In Supabase: **Project Settings** → **API Keys**. Copy the **Project URL**, the **publishable** key and the **secret**
   key.
2. Locally: copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`.
3. On Vercel: **Project → Settings → Environment Variables**. Add the same three, plus `NEXT_PUBLIC_SITE_URL` (the
   site's public address, for example `https://miami-athletic-association.vercel.app`). Then redeploy.

The secret key bypasses database security. It belongs only in `.env.local` and Vercel, never in code, chat or email.

**Check:** `/calendar` loads with no warning, and the submission form's button is enabled.

## Step 4: Create the two admin accounts

Do this for you, and then for Kevin A. Krueger.

1. Supabase → **Authentication** → **Sign In / Providers**: turn **off** "Allow new users to sign up". Only accounts you
   create by hand can then exist.
2. **Authentication** → **URL Configuration**:
   - **Site URL**: the site's public address.
   - **Redirect URLs**: add `https://YOUR-SITE/admin/auth/confirm` and `http://localhost:3600/admin/auth/confirm`.
3. **Authentication** → **Users** → **Add user** → **Create new user**. Enter the person's email address and a strong
   password (12+ characters), and tick **Auto Confirm User**. (Or choose **Send invitation** and they set their own
   password.)
4. Grant dashboard access. In **SQL Editor**, run this with the real email address and name:

   ```sql
   insert into public.admins (user_id, display_name)
   select id, 'Kevin A. Krueger' from auth.users where email = 'KEVINS-EMAIL-HERE';
   ```

   It should say "1 row". "0 rows" means the email doesn't match the user created in step 3.

**Check:** go to `/admin`, sign in, and you land on the Overview. An account that isn't in `admins` is refused, even
with the right password.

To remove someone's access later: `delete from public.admins where user_id = (select id from auth.users where email = '...');`

## Step 5: Email notifications (Resend)

**Why a domain is needed.** Email providers only send "from" addresses on a domain you have proven you own. Nobody but
Google can send as `@gmail.com`, so `miamiathleticassociation@gmail.com` can't be the sender. It *can* be the reply-to
address, and it is by default: when someone replies to a notification, the reply lands in the Gmail inbox.

You need a domain MAA controls (for example `miamiathletic.org`). No domain has been chosen for this site yet. Once you
have one:

1. Create an account at <https://resend.com>.
2. **Domains** → **Add Domain**. Enter the domain, or a subdomain such as `mail.yourdomain.com`. Resend shows a few DNS
   records. Add them where the domain is managed (Vercel, GoDaddy, Namecheap…). Wait until Resend shows **Verified**.
3. **API Keys** → **Create API Key** with "Sending access".
4. Add these environment variables (`.env.local` and Vercel), then redeploy:
   - `RESEND_API_KEY`: the key
   - `EMAIL_FROM`: `Miami Athletic Association <calendar@yourdomain.com>` (any name at the verified domain)
   - `EMAIL_REPLY_TO`: `miamiathleticassociation@gmail.com`
   - `ADMIN_NOTIFICATION_EMAILS`: Kevin's address, and any others, comma-separated
   - `CRON_SECRET`: a long random string. Generate one with `openssl rand -hex 32`.

**Check:** submit a test event to your own email address. The success message says a confirmation email will be sent,
the email arrives, and **Dashboard → Email Notifications** shows it as `sent`.

**Recommended:** in Supabase → **Authentication** → **Emails** → **SMTP Settings**, enter Resend's SMTP details. This
sends password-reset emails from your domain too, because Supabase's built-in sender is heavily rate-limited.

## Step 6 (optional): Cloudflare Turnstile spam check

The form already has a hidden bot trap, a minimum fill time, rate limits (5 submissions per hour per connection, 120 per
hour overall) and duplicate detection. If spam still gets through:

1. Cloudflare dashboard → **Turnstile** → **Add widget**. Add the site's domain and `localhost`.
2. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`, then redeploy.

---

## Testing the full workflow

Use your own email address, and remove the test event afterwards.

1. `/calendar` → **Submit an Event** → fill in the form → **Submit Event for Review**.
2. Confirm the event does **not** appear on the calendar.
3. Sign in at `/admin`. The Overview shows 1 pending submission, and Kevin's notification email has arrived.
4. Open it. Click **Edit Details**, change the description, and save. "Changes since submission" lists the change.
5. Click **Approve & Publish**. The event appears on `/calendar` right away, and the approval email arrives with a
   working link.
6. Click **Unpublish**. It disappears from the calendar.
7. Submit a second test event and **Reject** it. It never appears publicly, and the rejection email arrives.
8. **Add Event** → create an MAA event → **Publish Event**. It appears with an "MAA Event" label and no third-party
   disclaimer.
9. Archive, then delete, the test events.

## Previewing the calendar without Supabase

`CALENDAR_DEMO=1 npm run dev` fills the calendar with sample events labeled "[Demo]", under a "Demo data" banner. This
works only in local development. Production builds ignore it.

## Where things live

| What | Where |
| --- | --- |
| Calendar wording, categories, colors | `src/content/calendar.ts` |
| Email wording | `src/lib/email/templates.ts` |
| Database schema and security rules | `supabase/migrations/` |
| Miami time-zone logic | `src/lib/time.ts` |
| Public calendar | `src/app/calendar/` |
| Dashboard | `src/app/admin/` |
