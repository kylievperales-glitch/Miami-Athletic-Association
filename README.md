# Miami Athletic Association website

Six-page marketing site with a moderated events calendar. Next.js 16 (App Router), TypeScript, Tailwind CSS 4. The calendar,
public event submissions and the private admin dashboard (`/admin`) use Supabase. Setup steps: `SETUP-CALENDAR.md`.

| Page | Route |
| --- | --- |
| Home | `/` |
| About | `/about` |
| Events & Initiatives | `/events` |
| Calendar | `/calendar` |
| Partners | `/partners` |
| Get Involved | `/get-involved` |

## Run

```bash
npm install
npm run dev     # http://localhost:3600
npm run build   # production build
npm run start   # serve the production build
npm run lint
```

## Deploy

Import the project into Vercel with the default Next.js settings. The marketing pages need no environment variables. The
calendar and dashboard need the Supabase variables in `.env.example`; see `SETUP-CALENDAR.md`.

## Where to edit

- `src/content/site.ts`: organization details, navigation, social links, leadership
- `src/content/initiatives.ts`: initiative copy, dates, statuses, external links
- `src/content/partners.ts`: partnership copy and verified collaborators
- `src/content/forms.ts`: form fields and dropdown options
- `src/content/calendar.ts`: calendar copy, categories and colors
- Calendar events: managed in the dashboard at `/admin`, not in code
- `src/content/images.ts`: every photograph, with alt text and source
- `src/app/globals.css`: design tokens
- `src/lib/forms.ts`: form delivery

Open items that need MAA's input are in `CONTENT_TODO.md`.

## Content rule

Do not publish unconfirmed events, dates, venues, partners, statistics or memberships. Stock photos must never be
captioned or implied to show an MAA event, a planned venue or a partner.
