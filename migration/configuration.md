# Migration — Phase 2 & 3 (Configuration + Content)

Status: **complete**. `cloudcannon.config.yml` and `.cloudcannon/initial-site-settings.json` both validate against the published schema (`npx @cloudcannon/cli validate` ✓). `npm run build` succeeds — **36 pages**.

## What was built

### Page-builder architecture (the core change)

All 15 widget-composed `.astro` pages were converted to a **content-driven page builder**:

- **Content files** under `src/content/pages/` — `index.md`, `about.md`, `contact.md`, `pricing.md`, `services.md`, `homes/*.md` (4), `landing/*.md` (6). Each page is a frontmatter `content_blocks` array; every widget became a block keyed by `_type`.
- **One Astro `pages` collection** (`src/content.config.ts`, `glob('**/*.{md,mdx}')`). `content_blocks` uses a permissive `z.object({ _type }).passthrough()` array — the authoritative per-field editor schema lives in CloudCannon structures, which avoids the YAML-empty-field (`null`) rejection class of build failures.
- **CloudCannon splits** the single Astro collection into three sidebar collections — `pages` (root), `homes` (`src/content/pages/homes`), `landing` (`src/content/pages/landing`) — via `path` + glob negation, each with its own `url`.
- **Catch-all route** `src/pages/[...slug].astro` renders both `pages` and `legal`, switching `PageLayout`/`LandingLayout` (landing/* → LandingLayout) and branching content_blocks vs. markdown body.
- **`BlockRenderer.astro`** + **`src/cloudcannon/componentMap.ts`** map `_type` → widget. The old hardcoded `.astro` pages were deleted (the catch-all + content replaces them).

The AstroWind widgets already render from props (with `Astro.slots.render` only as a fallback), so **no widget rewrite was needed** for rendering — the inline props moved straight into frontmatter. Title/subtitle/tagline/content carry HTML, so they are `type: html` inputs.

### Structures (17 blocks + 8 shared sub-structures)

Defined inline in `cloudcannon.config.yml` `_structures` (kept in one file rather than co-located, for single-pass reviewability):

- **Blocks** (`_structures.content_blocks`, `style: select`): hero, hero2, hero_text, note, features, features2, features3, content, steps, steps2, stats, call_to_action, faqs, pricing, testimonials, brands, contact, blog_latest_posts.
- **Shared sub-structures**: `actions`, `items`, `stats`, `price_items`, `prices`, `testimonials`, `brand_images`, `contact_inputs`. Each array field in a block links to its sub-structure via `options.structures: _structures.<name>`.
- Every value has `picker_preview` + `preview` (title-key lookup with literal fallback) and a per-value `_inputs` block. Enum fields (`variant`, `target`, form input `type`) are `type: select` backed by `_select_data`. Nested objects (`image`, `callToAction`, `textarea`, `disclaimer`) have `type: object` + `preview.icon`. Optimized image inputs use `paths: { uploads: src/assets/images, static: "" }`.

### Collections

| Collection | Path | URL | Editors | Icon |
| --- | --- | --- | --- | --- |
| `pages` | `src/content/pages` (root only) | `/[slug]/` | visual, data | wysiwyg |
| `homes` | `src/content/pages/homes` | `/homes/[slug]/` | visual, data | home |
| `landing` | `src/content/pages/landing` | `/landing/[slug]/` | visual, data | dashboard |
| `legal` | `src/content/legal` | `/[slug]/` | content, data | gavel |
| `post` | `src/data/post` | `/[slug]/` | content, data | post_add |
| `data` | `src/data` (`**/*.json`) | `disable_url` | data | settings |

Grouped under **Pages / Blog / Settings** via `collection_groups`. `add_options` + `new_preview_url` set for each page-builder collection. Blog uses `editor: content` on add (and `_enabled_editors: [content, data]` — **visual editing for blog/pages is Phase 4**).

### Data

- **`src/navigation.ts` → `src/data/navigation.json`** (the chosen extraction). `navigation.ts` now imports the JSON and re-exports `headerData`/`footerData`, so `PageLayout`/`Header`/`Footer` are unchanged. Computed permalinks were resolved to static paths (base `/`, `trailingSlash: false`). Editable via the `data` collection + `file_config` (header/footer object previews, `footNote` as html). `data_config.navigation` also exposes it for future select inputs.
- `src/config.yaml` left as-is (consumed by the `astrowind` vendor integration). It can be surfaced as an editable data file in a later pass if desired.

### MDX snippets

Full 4-step pipeline complete:
1. `astro-auto-import` installed.
2. Registered in `astro.config.ts` **before** `mdx()` — injects `Logo` + `astro-embed`'s `YouTube`/`Tweet`/`Vimeo`.
3. Real `import` lines removed from `markdown-elements-demo-post.mdx`.
4. `_snippets` entries (`mdx_component` template) for all four, with `_inputs`.

`markdown.options.gfm: true` covers the markdown table in that post (the schema has no separate `table` key). The two `^import` hits remaining in that file (lines ~134, ~176) are **inside ` ``` ` code fences** — demo content showing import syntax, not real imports.

### Build settings, schemas, README

- `.cloudcannon/initial-site-settings.json`: `ssg: astro`, `npm i` / `npm run build` / `dist` / node `22`.
- `.cloudcannon/schemas/page-builder.md` + `legal.md` (new-file templates).
- `.cloudcannon/README.md` editor guide.
- `src/icons/` created (empty) as an astro-icon build-safety precaution.

## Fidelity simplifications (review these)

These are intentional, documented trade-offs where a faithful page-builder mapping wasn't clean. All render correctly; the notes flag editor-modeling gaps to revisit in Phase 4.

1. **Custom per-page headers dropped.** `homes/saas`, `homes/mobile-app`, `homes/personal` overrode `PageLayout`'s header with bespoke `Header` props via `<Fragment slot="header">`. The converted pages use the **standard site header** (from `navigation.json`). More consistent for editors; visually the nav differs slightly from the originals.
2. **`homes/startup` hero YouTube embed → static image.** The original hero placed a `<YouTube>` embed in the image slot. Embeds can't live in page-builder frontmatter, so a representative Unsplash image is used. (Embeds remain available in **blog** bodies via snippets.)
3. **`homes/mobile-app` app-store badge buttons → text actions.** The Hero/CTA used `<Image>` store-badge buttons in an `actions` slot; converted to standard text buttons ("App Store" / "Google Play") with brand icons.
4. **Item-level `callToAction` not modeled in the shared `items` structure.** A few feature/content items carry a per-item CTA (personal "About" social links; startup contact `features3`). The data renders correctly, but the shared `items` structure exposes only `title/description/icon` in the editor (adding CTA to the shared structure would seed empty CTA objects on every item and risk empty-button renders). Personal's social-link CTAs are preserved in data. **Phase 4:** decide whether a dedicated `link_items` structure is warranted.
5. **`features3` `defaultIcon` not exposed.** On personal "Skills", `defaultIcon` was baked into each item as `icon: tabler:point-filled` instead of a block-level default (per the structures exclude rule).

## Known follow-ups for Phase 4 (Visual editing)

- Wire `data-editable` / `editable-regions` + `registerComponents.ts` for every widget used in blocks (componentMap is already the single source of truth).
- Patch the AstroWind **"intersect" scroll-reveal** animations (`WidgetWrapper.astro`, `Hero*.astro`, `Features2.astro`, blog list/grid items) — `opacity:0` until scroll breaks the Visual Editor.
- Add visual editing to **blog posts** (`@content`) and switch `post`/`pages` `_enabled_editors` to lead with `visual` where appropriate.
- Revisit fidelity simplifications #1–#4 above.

## Handoff readiness (Phase 2)
✅ `cloudcannon.config.yml` validates. Every audit collection has a `collections_config` entry; the referenced data file has a `data_config` entry. `npm run build` succeeds. `migration/configuration.md` written. Content restructuring (Phase 3) is reflected in files and builds.
