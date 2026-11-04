# Miami Athletic Association website

Five-page marketing site. Next.js 16 (App Router), TypeScript, Tailwind CSS 4. All pages are static. There is no database.

| Page | Route |
| --- | --- |
| Home | `/` |
| About | `/about` |
| Events & Initiatives | `/events` |
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

Import the project into Vercel with the default Next.js settings. No environment variables are required. Optional
ones are listed in `.env.example`.

## Where to edit

- `src/content/site.ts`: organization details, navigation, social links, leadership
- `src/content/initiatives.ts`: initiative copy, dates, statuses, external links
- `src/content/partners.ts`: partnership copy and verified collaborators
- `src/content/forms.ts`: form fields and dropdown options
- `src/content/images.ts`: every photograph, with alt text and source
- `src/app/globals.css`: design tokens
- `src/lib/forms.ts`: form delivery

Open items that need MAA's input are in `CONTENT_TODO.md`.

## Content rule

Do not publish unconfirmed events, dates, venues, partners, statistics or memberships. Stock photos must never be
captioned or implied to show an MAA event, a planned venue or a partner.
