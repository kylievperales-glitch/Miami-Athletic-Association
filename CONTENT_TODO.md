# MAA website: open items before publishing

Nothing here is visible on the site. Each item needs a decision or an asset from MAA.

## Confirm before going public

| Item | Where it lives | Current state |
| --- | --- | --- |
| Kevin's portrait | `public/images/people/kevin-krueger.jpg` | Taken from the supplied photo folder (same file as the Tour site). Confirm approved for this site |
| American X date | `src/content/initiatives.ts` | February 28, 2027, shown as "Planned" and "subject to final confirmation" |
| Permission to show event participants | `public/images/events/` | Identifiable people appear in past-event photos, including on the Get Involved hero |
| Hampton House visible in photos | `group-sidewalk.jpg` (About), `group-overhead.jpg` (Events, Get Involved) | Its sign and floor logo are visible. The site makes no partnership claim, but the relationship is unconfirmed |
| Mission and vision wording | `src/app/about/page.tsx` | Website positioning language, not a formally adopted charter |

## Verified collaborators (RunAdic, Hampton House)

Neither organization is named on this site. Their relationship with MAA and permission to use their logos need
confirming first. Once confirmed, add an entry to `verifiedCollaborators` in `src/content/partners.ts` and put the
logo in `public/images/partners/`. The "Organizations We've Connected With" section on `/partners` then switches
from its holding message to a logo row by itself.

Logos on file: `~/Desktop/Pics American X History Tour/` ("Run Adic Logo.png", "Historic Hampton House Logo.png").

## Inconsistencies with the initiative sites

- The American X site shows a "Register with RunAdic" link and describes RunAdic as an event partner. The MAA site
  follows the brief: no registration call to action and no RunAdic mention. Reconcile if registration is in fact open.
- The American X site says "Six Years of American X History" and calls Kevin the founder of MAA. Neither claim is
  used here, because neither is in the brief.

## Photography

- Genuine MAA photos used: American X History Tour (`public/images/events/`).
- Not used on purpose: most 2024 event photos have baked-in logos (Miami Beach Convention Center, South Beach Boxing,
  RunAdic, Hampton House), which could read as partnership claims. Clean originals would be very welcome.
- Not used on purpose: Muhammad Ali archival images. Rights and likeness permissions are not confirmed.
- Still needed: genuine #NetWorkingOut photos, to replace the illustrative image on `/events` and the home page.
- Everything in `public/images/photos/` is illustrative Unsplash stock, logged in `src/content/images.ts`.

## Integrations not connected

| Form | Environment variable | Behavior until connected |
| --- | --- | --- |
| Newsletter | `NEXT_PUBLIC_NEWSLETTER_ENDPOINT` | Opens an email draft requesting updates |
| Partnership inquiry | `NEXT_PUBLIC_PARTNERSHIP_ENDPOINT` | Opens a pre-filled email draft |
| General inquiry | `NEXT_PUBLIC_INQUIRY_ENDPOINT` | Opens a pre-filled email draft |

When an endpoint is set, that form POSTs JSON to it and shows real success or failure messages, and its buttons and
helper text change automatically. Logic: `src/lib/forms.ts`. Providers that accept a browser POST with CORS (Formspree
or similar) work as they are. Others, including most newsletter platforms, need a small server route that keeps the API
key private, plus spam protection.

## Domain

No production domain is set. Set `NEXT_PUBLIC_SITE_URL` once one exists, so canonical URLs, Open Graph URLs, the sitemap
and robots use it. On Vercel the project URL is used until then.

## Calendar and dashboard

Setup steps are in `SETUP-CALENDAR.md`. Still open:

- Supabase project, and the two admin accounts (yours and Kevin's)
- A domain for sending email, verified in Resend. Until then no notification emails are sent
- Kevin's address for new-submission alerts (`ADMIN_NOTIFICATION_EMAILS`)
- Newsletter consent from event submitters is stored with a timestamp in `event_private`, but is not yet passed to any
  mailing list
