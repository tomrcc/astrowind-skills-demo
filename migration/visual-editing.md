# Migration — Phase 4 (Visual Editing)

Adding CloudCannon Visual Editor support (`@cloudcannon/editable-regions`) to the
page-builder pages built in Phases 2–3.

**Scope (this session):** the 15 widget-composed page-builder pages (the `pages`,
`homes`, `landing` CloudCannon collections, all rendered through the single Astro
`pages` collection + catch-all `src/pages/[...slug].astro`) plus the shared
Header/Footer partials. **Out of scope (deferred):** blog post visual editing, and
the five Phase 2/3 fidelity simplifications (noted below, wired as-is).

## Architecture (how editing is layered)

Every page-builder page is `frontmatter.content_blocks[]`, each block keyed by
`_type`, rendered by the catch-all route → `BlockRenderer` → widget (via
`componentMap`). Three layers make this editable:

1. **Page-builder array** — the catch-all route wraps the `content_blocks.map()`
   in `data-editable="array" data-prop="content_blocks" data-component-key="_type"`,
   and each block in `<div data-editable="array-item" data-component={_type}>`.
   (Array-item wrapper lives in the page template, **not** in `BlockRenderer` — avoids
   double-nesting.)
2. **Component re-render** — every `_type` registered in
   `src/cloudcannon/registerComponents.ts` (from the existing `componentMap.ts`,
   the single source of truth) so sidebar edits re-render the block live.
3. **Nested editables** — `data-editable="text"/"image"/"array"` on the fields each
   widget renders, with `data-prop` **relative** to the block scope
   (`data-prop="title"` → `content_blocks[n].title`).

**High-leverage shared host:** `Headline.astro` renders `tagline`/`title`/`subtitle`
for ~13 widgets. Adding the three editables there once covers all of them, because
inside a page-builder block the editables are scoped to the parent registered
component. **Prop-alignment caveat:** this only works where the widget passes the
field through un-renamed (`<Headline subtitle={subtitle} />`). Any widget that maps a
different field into a Headline slot (e.g. `subtitle={description}`) would bind the
editable to a missing key — each widget's Headline call is verified at implementation
(see per-widget notes).

## Page → block coverage map

Proves every section of every in-scope page has a treatment (each block type's
binding plan is in the next table). Counts of repeated types in parentheses.

| Page (collection) | Blocks present |
| --- | --- |
| `index` (pages) | hero, note, features, content ×3, steps, features2, blog_latest_posts, faqs, stats, call_to_action |
| `about` (pages) | hero, stats, features3 ×2, steps2 ×2, features2 ×2 |
| `contact` (pages) | hero_text, contact, features2 |
| `pricing` (pages) | hero_text, pricing, features3, steps, faqs, call_to_action |
| `services` (pages) | hero, features2, content ×2, testimonials, call_to_action |
| `homes/mobile-app` | hero2, features3, content ×2, stats, testimonials, faqs, call_to_action |
| `homes/personal` | hero, content, steps ×2, features3, content ×3, testimonials, call_to_action, blog_latest_posts |
| `homes/saas` | hero2, features, content ×4, pricing, faqs, steps2, blog_latest_posts |
| `homes/startup` | hero, features2 ×2, stats, brands, features, faqs, features3, call_to_action |
| `landing/click-through` | hero2, call_to_action |
| `landing/lead-generation` | hero, call_to_action |
| `landing/pre-launch` | hero2, call_to_action |
| `landing/product` | hero, call_to_action |
| `landing/sales` | hero2, call_to_action |
| `landing/subscription` | hero2, call_to_action |
| **all pages** (shared) | Header, Footer (+ Announcement — see note) |

All 18 `_type` values map to a `componentMap` entry. No page contains a section that
is not one of these blocks (verified by grep of `_type:` across `src/content/pages`).

## Per-block-type binding plan

Treatment legend: `text` = inline rich/plain text editable · `image` = image picker ·
`array` = CRUD + nested item editables · all blocks are also `component` (registered,
re-renders). `data-prop` paths are **relative to the block**.

| Block (`_type`) | Treatment | Binding plan (relative `data-prop`) | Data completeness / notes |
| --- | --- | --- | --- |
| **hero** | text + image + array | `tagline`,`title`,`subtitle`,`content` (text, set:html); `image` (image, object → `data-prop` on `<editable-image>`); `actions` (array → per-item `text` on label). Renders fields directly (not via Headline). | All in frontmatter. `actions` item = `{text,href,variant,target,icon}`; only `text` is inline-text, rest sidebar. |
| **hero2** | text + image + array | Same as hero (separate template, same fields). | Same as hero. |
| **hero_text** | text + array | `tagline`,`title`,`subtitle`,`content` (text); `actions`/`callToAction` (array/object → `text`). No image. | All in frontmatter. |
| **note** | text | `title`,`description` (text, set:html). `icon` sidebar-only. | `icon` is a presentation field → sidebar. |
| **features** | text + array | Via Headline: `tagline`/`title`/`subtitle`. `items` (array) → per-item `title` (plain text), `description` (set:html). `icon`, per-item `callToAction` sidebar. | Item `title` is plain text (not set:html). Per-item `callToAction` exists in data but not modeled inline (fidelity gap #4). |
| **features2** | text + array | Headline + `items` array (same item shape as features). | Same as features. |
| **features3** | text + image + array | Headline + `image` (image) + `items` array (same shape). | `image` object field. |
| **content** | text + image + array | Headline `title`/`subtitle`; `tagline` (prop), `content` (text, set:html, block-level); `image` (image); `items` array → `title`/`description`. Plus block-level `callToAction` (sidebar). | `content` may hold block HTML → `data-type="block"` on a `<div>` host. Verify Headline subtitle alignment. |
| **steps** | text + image + array | Headline; `image` (image); `items` rendered via **Timeline.astro** → per-item `title`/`description` (set:html). Editables go in Timeline. | Timeline is shared (Steps only). Item icons sidebar. |
| **steps2** | text + array | Headline (`tagline` prop); `items` (array, inline `<li>`) → `title`,`description` (set:html); `callToAction` sidebar. | Numeric step counter is presentational (index) → not editable. |
| **stats** | text + array | Headline; `stats` (array) → per-item `amount`,`title` (plain text). `icon` sidebar. | Both stat fields plain text. |
| **call_to_action** | text + array | Headline (`tagline`/`title`/`subtitle`); `actions` (array → `text`). | All in frontmatter. |
| **faqs** | text + array | Headline; `items` (array) → `title` (plain), `description` (set:html). | Item `icon` (chevron) sidebar. |
| **pricing** | text + array | Headline; `prices` (array) → `title`,`subtitle`,`price`,`period`,`ribbonTitle` (plain text), nested `items` sub-array → `description` (plain). `callToAction`, `hasRibbon` sidebar. | Nested array-in-array; inner `items` gets its own `array`/`array-item`. |
| **testimonials** | text + image + array | Headline; `testimonials` (array) → `title`,`testimonial`,`name`,`job` (plain text), `image` (image, object). `callToAction` sidebar. | All visible fields inline. |
| **brands** | text + image-array | Headline; `images` (array) → per-item `src`/`alt` (image). `icons` array sidebar (icon names). | `icons[]` are icon-name strings → sidebar. |
| **contact** | text + sidebar | Headline (`title`/`subtitle`/`tagline` via slots); form `inputs`,`textarea`,`disclaimer`,`button`,`description`. | **Form structure → sidebar-only** (see justification). `description` gets inline text. |
| **blog_latest_posts** | text + sidebar | `title` (text, set:html), `information` (text, set:html). Post list fetched via `findLatestPosts()`. | **Post cards are programmatic (cross-collection) → not frontmatter-editable here.** `linkText`,`count`,`linkUrl` sidebar. Justification below. |

### Shared partials

| Partial | Treatment | Binding plan | Notes |
| --- | --- | --- | --- |
| **Footer** | data-file + component + array | Wrap call site in `<editable-component data-component="footer" data-prop="@data[navigation].footer">` (in `PageLayout`); register `footer`. Inside Footer: link columns `array data-prop="links"` → `array-item` → `title` (text) + inner `array data-prop="links"` → `text`; `secondaryLinks` array → `text`; `socialLinks` array → sidebar (icon+aria); `footNote` (text, set:html, block). | Canonical shared-UI target. `socialLinks` icons sidebar (icon-name + ariaLabel are not inline text). |
| **Header** | data-file + component + array | Wrap call site in `<editable-component data-component="header" data-prop="@data[navigation].header">`; register `header`. Inside: top-level `links` array → `text`; nested dropdown `links` array → `text`; `actions` array → `text`. Mobile menu re-renders via the component. | Deep nested dropdown structure is also editable via the existing **`data` collection** (navigation.json) for structural changes (add/remove menus). Inline covers text edits. |
| **Announcement** | sidebar-only | — | Hardcoded promo bar (`Announcement.astro`), not backed by content/data; low editor value, consistent with audit treatment of system chrome. If editors need it, extract to data file in a later pass. |

### `sidebar-only` justifications (technical reasons)

- **contact — form fields (`inputs`/`textarea`/`disclaimer`/`button`):** form input
  definitions are structural config (field `name`, `type`, `autocomplete`,
  `placeholder`), not visible prose. They render through the shared `Form` component as
  `<input>`/`<textarea>` elements that have no editable text node to bind a rich-text
  region to. Editable via the block's `_inputs` in the sidebar; the block still
  re-renders (registered component). Visible `description` and Headline copy ARE inline.
- **blog_latest_posts — post cards:** the rendered post list comes from
  `findLatestPosts()` (a `getCollection('post')` query), not from this block's
  frontmatter. There is no frontmatter scope to bind the cards to (would need `@file`
  per post, which belongs to blog visual editing — out of scope this session). The
  block's own copy (`title`, `information`) IS inline-editable; the cards re-render via
  the component. Individual posts are edited in the `post` collection.
- **icon / variant / target fields (across blocks):** icon names (`tabler:*`), button
  `variant` enums, link `target`, and `columns` counts are presentation/config, not
  visible prose — edited via sidebar `_select_data`/`_inputs`. Blocks re-render so
  changes preview live.
- **socialLinks (footer):** each item is `{ariaLabel, icon, href}` — no visible text
  node (renders as an icon). Sidebar-managed; CRUD via array editable still applies.

## Deferred fidelity gaps (from Phase 2/3 — noted, wired as-is)

Per the session scope decision ("wire what exists"), these are not changed now:

1. Custom per-page headers (saas/mobile-app/personal) already collapsed to the standard
   site header — Header editables cover the single shared header.
2. `homes/startup` hero YouTube embed → static image; the image is wired as a normal
   `hero` image editable.
3. `homes/mobile-app` app-store badges → text actions; wired as normal `actions`.
4. Per-item `callToAction` on some feature/content items is **not** exposed inline (the
   shared `items` structure only models `title`/`description`/`icon`). Data renders;
   inline editing of those CTAs is a future `link_items` structure decision.
5. `features3` `defaultIcon` baked per-item; no block-level default editable.

## Risks / verification focus

- **Headline prop-alignment** — verify each widget's `<Headline … />` call passes
  `title`/`subtitle`/`tagline` un-renamed before relying on the shared editables;
  where a widget renames (e.g. content's `subtitle`), confirm the content files
  populate the targeted key.
- **`_inputs` ↔ `data-prop` parity** — every new `data-prop` needs a matching `_inputs`
  entry (already defined in `_structures` from Phase 2); grep-diff at verification.
- **Schema-file seeds** — `.cloudcannon/schemas/page-builder.md` default frontmatter
  must include every wired field so "Add new" pages aren't missing editable regions.
- **Scroll-reveal** — `WidgetWrapper.astro` + Hero*/Features2/Timeline apply
  `motion-safe:md:opacity-0` (hidden until scroll) → breaks the editor; patched to
  disable under `window.inEditorMode`.

## Implementation notes (decisions made while wiring)

- **Page-builder array** wired in `src/pages/[...slug].astro` (not `BlockRenderer`):
  `data-editable="array" data-prop="content_blocks" data-component-key="_type"`, each
  block in `<div data-editable="array-item" data-component={_type}>`. `registerComponents.ts`
  registers all 18 types from `componentMap` + `header`/`footer`.
- **Headline.astro** carries `data-editable="text"` for `title`/`subtitle`/`tagline`
  (covers 13 widgets; all verified to pass the fields un-renamed). Heroes/Note render
  those fields directly and got their own editables.
- **Button labels (actions/CTAs):** the shared `Button` renders its `text` via
  `set:html` internally and is used in programmatic contexts, so action arrays get
  `array` + `array-item` (inline CRUD) while the label/href/variant/icon are edited in
  the sidebar item form (block re-renders live). Not injecting editable hosts into
  `Button`. Documented as the chosen treatment for every `actions`/`callToAction` array.
- **Brands** images wrapped in a `display:contents` array container so the image array
  splits cleanly from the sidebar-only `icons` array without changing the flex layout.
- **Testimonial** value wrapped in `<editable-text>` inside the literal-quoted
  blockquote so only the value (not the `"`…`"`) binds to the field.
- **Header `editable` prop:** `LandingLayout` renders a *derived* single-item nav subset,
  so it passes `editable={false}` to strip the data-editable attributes there (they'd
  have no valid data scope). The full nav is editable on PageLayout pages via
  `<editable-component data-prop="@data[navigation].header">`. Footer is identical on all
  pages, so it's always wrapped (no flag needed).
- **`display:contents`** global rule on `editable-component/-image/-text` so the wrapper
  elements never affect production layout (the package only styles them in-editor).
- **Navigation inline inputs:** `file_config` types `header`/`footer` as objects
  (CloudCannon auto-generates string inputs for nested `text`/`title` link fields);
  `footNote` is `type: html`. Full structural nav editing remains available in the `data`
  collection.

## Verification performed

- `npm run build` ✓ — 36 pages, clean (run after setup, after all widget/layout edits,
  and after the final CSS addition).
- `_enabled_editors` includes `visual` for `pages`/`homes`/`landing` (set in Phase 2).
- Build-output grep (`grep -oE` counts on compressed `dist/`):
  - 15 `data-component-key="_type"` array wrappers (one per page-builder page).
  - 2408 `data-editable="array-item"` (blocks + sub-arrays).
  - All 18 block `_type`s present as `data-component=` (incl. hero2/features2/features3/steps2).
  - `editable-image` ×59, `editable-text` ×128, `editable-component` ×64.
  - Shared sections: `@data[navigation]` ×64 (header 29 + footer 35), `footNote`,
    `socialLinks`, header/footer `links` all present.
- `_inputs` parity: every wired block field resolves to a structure `_inputs` entry.

## Not verified locally (needs the CloudCannon editor)

The interactive checks (click a row → outlines the row; click a field → outlines the
field; sidebar edit re-renders the block; data-file nav edits re-render Header/Footer)
require loading the site in CloudCannon's Visual Editor. Recommend a smoke pass there.

## Editor smoke-test fixes (found loading the homepage in the Visual Editor)

- **Empty buttons on re-render** — `Button.astro` used `text = Astro.slots.render('default')`
  **without `await`**. SSR auto-awaits the promise so the build was fine, but the
  client re-render shim rendered the unresolved promise as empty (affected slot-based
  buttons like BlogLatestPosts' "View all posts", the contact form submit, blog
  pagination). Fixed by awaiting the slot render.
- **`Failed to render component: header — Invalid URL`** — `Header.astro` computed
  `new URL(Astro.url)` for the active-link class; `Astro.url` isn't a valid absolute URL
  during client-side re-render, so it threw. Wrapped in try/catch with a `''` fallback
  (the active-link highlight is non-essential in the editor).
- **Icon inputs → selects** — every `icon` input across the block structures
  (`actions`, `items`, `stats`, `price_items`) changed from `type: text` to
  `type: select` backed by a new `_select_data.icons` list (the curated set of
  tabler/flat-color icons used on the site). Style fields with a fixed value set belong
  in selects. (Navigation `socialLinks` icons live in the data file and could get the
  same treatment via `file_config` if desired.)

## Out of scope / follow-ups

- **Blog visual editing** (post bodies + list/detail) — deferred by scope decision.
- Fidelity gaps #1–#5 (per-item CTAs as a `link_items` structure, etc.) — deferred.
- `src/config.yaml` not yet surfaced as an editable data file (optional).

## Status

✅ Phase 4 complete (page-builder scope). Census hard-gate satisfied; all 18 widgets +
shared Header/Footer wired; scroll-reveal patched; build green. Tasks #1–#7 done.
