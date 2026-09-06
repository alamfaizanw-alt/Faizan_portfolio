# CONTEXT.md

Working context for this repository. If you are an AI assistant helping with
this site, read this file first — it explains the architecture, the conventions,
and the mistakes that have already been made once.

---

## 1. What this is

A personal engineering portfolio for Faizan Alam (mechatronics engineer,
robotics developer). Static site, no backend, no build step.

| | |
|---|---|
| **Live site** | https://alamfaizanw-alt.github.io/Faizan_portfolio/ |
| **Repo** | `alamfaizanw-alt/Faizan_portfolio`, branch `main` |
| **Raw source** | `https://raw.githubusercontent.com/alamfaizanw-alt/Faizan_portfolio/main/<path>` |
| **Admin panel** | `/forge.html` |
| **Hosting** | GitHub Pages, deploys from `main` at repo root |

Purpose: give recruiters a curated view of selected work, controlling exactly
what they see — as opposed to sending them a raw GitHub profile.

---

## 2. Architecture

Plain HTML + CSS + vanilla JS. No framework, no bundler, no package.json.
Files are served exactly as committed.

**Content lives in `data/content.json`**, not in the HTML. Pages fetch it at
runtime and render client-side. This is what makes the admin panel possible
without a server.

**Persistence uses the GitHub Contents API.** The admin panel writes
`data/content.json` back to the repo using a personal access token that the
user pastes in. The token is held in `sessionStorage` only — never committed,
never written to a file, cleared when the tab closes.

**Auth is a SHA-256 hash** of an access key, stored in `data/config.json`.
Client-side only. This gates casual access to the admin panel; it is not
real security, and it does not need to be — the only thing behind it is a
form that requires a GitHub token to do anything.

### File map

```
index.html          Homepage: hero, marquee, stats, about, timeline, skills,
                    featured projects rail, contact
work.html           All projects (filterable rail)
project.html        Single project detail, loaded via ?id=<slug>
forge.html          Admin panel (noindex)
404.html
css/style.css       Entire stylesheet, single file
js/api.js           Repo config, read/write helpers, SHA-256, renderCard()
js/main.js          Homepage rendering
js/work.js          All-projects page + category filtering
js/project.js       Project detail page + media rail
js/rail.js          Shared horizontal rail controller (arrows, dots, drag)
js/forge.js         Admin panel logic
js/ui.js            Custom cursor, scroll progress, page reveal
data/content.json   ALL SITE CONTENT — never overwrite from a zip
data/config.json    Hashed admin key
assets/img/         Images uploaded through the admin panel
```

`js/api.js` holds the repo config at the top. If the username or repo name is
wrong, the admin panel fails with "Could not verify" — that has happened before
when a zip overwrote the file with placeholders.

---

## 3. Data model — `data/content.json`

```jsonc
{
  "bio": {
    "name", "tagline", "intro", "photo",
    "links": { "linkedin", "github", "email", "resume" }
  },
  "stats":    [ { "value": 10, "suffix": "+", "label": "Years FIRST Robotics" } ],
  "skills":   [ { "category": "Programming", "items": ["Python", "..."] } ],
  "timeline": [ { "id", "title", "company", "date", "type", "bullets": [],
                  "image", "order" } ],
  "projects": [ { "id", "title", "category", "tags": [], "summary",
                  "challenge", "approach", "outcome",
                  "thumbnail", "media": [], "imageUrls": [], "videos": [],
                  "links": { "github", "live" }, "featured", "order" } ]
}
```

Notes:
- `order` sorts ascending; lower appears first.
- `featured: true` puts a project in the homepage rail.
- `media` = images uploaded through the panel. `imageUrls` = externally hosted
  images. Both render; `media` first.
- Project detail pages use a **case-study structure**: Overview → The Challenge →
  My Approach → Outcome.
- Stats, skills, projects, timeline entries, videos, and image URLs are all
  **dynamic in count**. Nothing assumes a fixed number. Do not reintroduce
  hard-coded counts.

---

## 4. Design system

Dark, technical, restrained. The reference points were engineering blueprints
and technical drawings, not typical dev-portfolio gradients.

```
--bg          #090909    page background
--bg-card     #0e0e0e    cards
--gold        #C9A447    single accent — used sparingly
--text        #DDDBD5
--text-muted  #62605A
--border      #1A1A1A
```

Fonts: **Space Grotesk** (headings), **Inter** (body), **JetBrains Mono**
(labels, metadata, technical detail).

**One accent colour only.** Gold marks what matters — active states, outcomes,
key numbers. Adding a second accent would break the language.

### Decorative SVGs

Hand-built line drawings positioned in section margins: a 6-DOF robot arm
(hero), belt-and-pulley drive (stats), autonomous vehicle with LiDAR rays and
two androids (timeline), electronics pile with Raspberry Pi and breadboard
(skills), gear (contact).

They are **geometrically correct** — the belt wraps at true tangent points,
pulley rotation ratios match their diameters. If you modify one, keep it
accurate; that is the whole point of it being an engineering portfolio.

Drawn in warm white `#E0DDD6` at 8–18% opacity. `pointer-events: none`
except the two robots, which react to hover.

**Decorations must never overlap text.** They shrink then hide at breakpoints
1500 / 1320 / 1240 / 1180 / 900 / 480px. This was fixed once already after the
pulley collided with the stats text on a smaller laptop. When adding or moving
a decoration, verify at 1280px, not just full width.

---

## 5. Key components

**Rails** (`js/rail.js`, and a parallel implementation in `js/project.js`)
Horizontal snap-scrolling replaced an earlier grid, which left grey empty cells
when the project count didn't fill the last row. Rails have no such failure mode
and are count-agnostic.

- `scroll-snap-align: start` — **not `center`**. With `center`, the first card
  requires negative scroll to align, so browsers skip to card 2 and it becomes
  unreachable. This bug happened; do not reintroduce it.
- Arrow panels overlay the rail edges, height set in JS to match card height.
- Navigation: arrows, dots, counter, drag-to-scroll, arrow keys, native swipe.
- One card fills the view with the next peeking, signalling more content.

**Media rail** (project pages) uses the same interaction model plus:
- Auto-advance every 4s; pauses on interaction, resumes after 10s
- Video playback pauses when scrolling to another slide (YouTube postMessage
  API, with an iframe `src` reset as a hard fallback)
- Rail controls fade out while a video plays, return on pause
- YouTube URLs are **auto-normalised** — share links, watch links, shorts, and
  malformed URLs are all converted to `/embed/` form. Users should not have to
  think about URL format.

**Timeline** — alternating left/right cards on desktop, single column on mobile.
Both sides are left-aligned. Bullets use a small gold tick, not em-dashes.

**Custom cursor** (`js/ui.js`) — gold dot with a lagging square reticle.
A square, not a circle: precision-instrument language. Desktop only, gated on
`(hover: hover) and (pointer: fine)`.

**No decorative em-dashes anywhere.** They were removed deliberately from
labels, bullets, and section headers. Prose em-dashes in actual sentences are
fine.

---

## 6. Gotchas — each of these has caused a real bug

**Never overwrite `data/` from a package.** It holds all site content. When
delivering updated code, exclude `data/` or tell the user explicitly to skip
it. This is the single most important rule here.

**`js/api.js` carries the repo config.** A zip built from a template can
silently reset it to placeholders and break the admin panel.

**Editing CSS by cutting block ranges is dangerous.** Removing the old carousel
styles once took five unrelated contact-section rules with it, and the contact
layout broke. After any block-level CSS edit, diff the selector list against
the previous version and confirm only the intended rules disappeared.

**Editing JS by line range is equally dangerous.** A block replacement in
`project.js` once deleted a `const links` declaration and broke the whole page.
Prefer anchored string replacement over line offsets, and syntax-check after.

**The AI sandbox resets between sessions.** Do not rebuild from old zips —
they may be several fixes stale and will silently revert work. **Always pull
current files from the raw GitHub URL** at the start of a session. That is the
source of truth.

**GitHub Pages caches.** After pushing, wait ~60s and hard-refresh
(Ctrl+Shift+R) before concluding something didn't work.

**Verify visually before shipping.** Serve the files locally and render with a
headless browser. Bugs that were caught this way and would have shipped
otherwise: grey grid cells, the unreachable first card, a `links` variable
deleted mid-edit, and the missing contact styles. Programmatic checks
(computed styles, element geometry, pixel sampling) catch things screenshots
alone do not.

---

## 7. Admin panel (`/forge.html`)

Five tabs: **Bio** (identity, links, stats) · **Projects** · **Timeline** ·
**Skills** · **Settings** (change access key, clear token).

Flow: access key → GitHub token → edit → save writes `data/content.json` via
the Contents API. Images upload to `assets/img/<project-id>/`.

**Image uploads are sequential, not parallel.** Each Contents API write needs
the file's current SHA; concurrent writes read the same SHA and conflict. They
were parallel once and multi-file uploads failed. Keep them sequential.

There is a separate user-facing guide, `Portfolio_Admin_Guide.txt`, covering
token creation, embedding videos, and troubleshooting.

---

## 8. Working agreements

1. Pull current files from the raw GitHub URL before editing. Never rebuild
   from memory or from an old package.
2. Exclude `data/` from anything delivered.
3. Verify changes by rendering — desktop and mobile — before saying they work.
4. After CSS block edits, diff the selector list. After JS edits, syntax-check.
5. Diagnose the actual cause rather than layering a workaround. The grid, the
   snap alignment, and the upload race were all fixed at the root.
6. Say plainly when a mistake was introduced and what caused it.
7. Push back when a request would hurt the result — horizontal scrolling on
   mobile was proposed and argued against for good reasons. Give the reasoning,
   then follow the user's decision.
