# SitePrompt Repository Analysis

**Repository inspected:** `D:\gitrepos\siteprompt`  
**Snapshot:** local `origin` is `https://github.com/im-286/siteprompt.git`; inspected `HEAD` was `f532072` (`perf: add .nojekyll to skip Jekyll build for static site`).  
**Review date:** 2026-10-26  
**Scope:** read-only inspection of the checked-out files. No dependencies were installed, no app was run, no remote media was downloaded, and no Supabase or other backend was contacted.

## Evidence labels

- **Verified** means observed in local source files or computed by read-only inspection of them.
- **Recommendation** is advice for a later PROMPT/DEPT implementation.
- **Unverified** means the checkout does not establish the claim; it should not be assumed.

## 1. Executive summary

SitePrompt is a **static prompt catalogue plus a collection of static HTML website demos**, not a Next.js application or a data-only prompt repository. Its homepage is one HTML file with inline CSS and JavaScript. Prompt text is stored as Markdown. The individual demos are stored as prebuilt HTML and, for a few larger entries, bundled assets and source-like files.

| Finding | Verified result |
|---|---|
| Root prompt files | 66 Markdown files in `prompts/`, plus 67 in `Pro-prompts/` (133 total) |
| Homepage catalogue | 68 entries in the `index.html` JavaScript array |
| Prompt/catalogue alignment | 66 catalogue entries have same-stem free-prompt files; `Big_Bang_Origin` and `Iron_Man_Stark` do not |
| Demo directories | 73 top-level folders under `demos/`, each with an `index.html`; five are not listed on the homepage |
| Media stored locally | 593 media files by extension inventory: 556 JPG, 4 GIF, 7 PNG, 12 WebP, 6 ICO, 7 SVG, and 1 MP3 |
| Local video files | No MP4, WebM, or M3U8 files were found |
| Broken prompt preview references | 89 relative Markdown media references (85 distinct paths), all pointing to files that are absent |
| Runtime/backend | The root site reads local files and uses browser APIs; no Supabase, authentication, or environment-based configuration was found |
| Licensing | Root LICENSE is MIT, but that does **not** establish that the prompt text, media, or externally hosted assets are cleared for redistribution |

**Recommendation:** Do not bulk-import the repository or its media. First obtain written content/media permissions and manually validate a small pilot. Treat a source manifest and idempotent importer as the durable process; import only approved prompt text/metadata, and use approved small static preview assets initially. Do not import the broken MP4 references or mirror remote/HLS media without permission and an explicit technical need.

## 2. Repository architecture

### 2.1 What it is

The root site is a static, client-rendered catalogue. The homepage’s array of objects is its catalogue data; the browser builds cards and filters from that array. It fetches prompt Markdown from the same static site. Demo pages live under `demos/` and are opened or embedded by file path.

It is therefore a **combination of**:

1. A static front-end website (`index.html`).
2. A Markdown prompt library (`prompts/` and `Pro-prompts/`).
3. A static demo gallery containing rendered pages and some demo-specific assets/source files (`demos/`).
4. A small set of separately stored image/GIF previews (`assets/images/`).

It is **not** a Next.js/Supabase app, and there is no shared project build pipeline for the homepage and all demo folders.

### 2.2 Relevant directory tree

```text
siteprompt/
├── .git/                         Git metadata (not an application directory)
├── .gitignore                    Ignores dependencies, build output, local env files, etc.
├── .nojekyll                     Empty marker to disable Jekyll processing on Pages
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE                       MIT text
├── README.md                     Human-maintained catalogue and project description
├── SECURITY.md
├── index.html                    Homepage, inline CSS and JavaScript
├── package.json                  Small manifest; no app dependencies/build script
├── package-lock.json             Minimal lockfile
├── assets/
│   └── images/                   8 files: 4 GIFs and 4 files named .png
├── prompts/                      66 free-catalogue Markdown files
├── Pro-prompts/                  67 separate Markdown prompt files
└── demos/                        73 top-level demo folders; 759 files total
    ├── <68 homepage-listed demos>/index.html
    ├── E_commerce_Website/       Extra, not listed (alongside E-commerce_Website)
    ├── GTA_VI_Cinematic/         Extra, not listed
    ├── GTA_VI_Landing/           Extra, not listed
    ├── League_of_Legends_Hero/   Extra, not listed
    ├── Valorant_Gaming_Landing/  Extra, not listed
    ├── Big_Bang_Origin/          HTML, source-like TSX/JS, Next chunks, frame JPGs
    ├── Iron_Man_Stark/           HTML, source-like TSX/JS, Next chunks, frame JPGs
    └── Zentry_Premium/           Vite-style config/build assets, images, fonts, audio
```

The 68 homepage-listed directories and five unlisted folders account for the 73 top-level demo folders. The three Markdown files under `demos/` are README files for gaming demos, not additional prompt-library records. `.git/` is repository metadata; its object database is not an application asset inventory. No `.github/` workflow, root `src/`, root Next.js configuration, Supabase configuration, or `.env` file was found in the root listing.

### 2.3 Technology, dependencies, scripts, and build

| Area | Findings |
|---|---|
| Homepage | Plain HTML, CSS, and browser JavaScript in `index.html`; no framework dependency at the root |
| Prompt content | Markdown files with a repeated header/metadata/prompt-text pattern in most of `prompts/` |
| Demo implementation | Heterogeneous. Many demo pages are standalone HTML that load React/Tailwind or other libraries from CDNs; two larger demos include Next-like static output and source-like TSX; Zentry has a Vite-style package/config and static assets |
| Root package manifest | `package.json` names the package `templateprompts`, declares MIT, and points `main` to `index.js` and `bin` to `bin/index.js`; neither root entrypoint is part of the observed root tree |
| Root scripts | Only `test`, which prints “Error: no test specified” and exits unsuccessfully; no build, dev, lint, or import script |
| Root dependencies | No runtime or development dependencies declared |
| Build/deployment | The `.nojekyll` marker indicates a static GitHub Pages-oriented deployment. No repository-wide build process was found or run |
| Environment/backend | The root site has no environment variables, authentication, database, server, or Supabase integration. Three Pro prompt specifications mention a Supabase-related package for the generated site; these are prompt text, not a SitePrompt backend |
| External dependencies | Homepage fonts use Google Fonts. Demo pages reference external fonts/CDNs, media hosts, and in some cases HLS streams. Those pages may lose features if third-party URLs change or become unavailable |

The demo pages are not uniformly production-ready: for example, `demos/Zentry_Premium/index.html` references `/src/main.jsx`, but that file is absent; compiled-looking assets do exist under `demos/Zentry_Premium/assets/`. This path mismatch makes the checked-in entry HTML suspect as a directly runnable preview without further verification.

### 2.4 Root files and their purpose

- `index.html`: homepage layout, card data, filters, search, iframe previews, and prompt modal.
- `README.md`: descriptive overview, manually maintained prompt listings, usage notes, and author/social links. Its stated 65 prompt count does not match the 66 files in `prompts/`; some Pro links use `Pro%20prompts` while the directory is `Pro-prompts`.
- `package.json` / `package-lock.json`: package metadata rather than the homepage’s actual build system. The declared CLI entrypoints do not match observed root files.
- `.gitignore`: excludes common dependency/build folders and local `.env*` files. No `.env*` file was found in the checkout.
- `.nojekyll`: empty static-hosting marker.
- `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`: project-level policy/notice documents; only `LICENSE` contains a copyright/license grant.

## 3. Prompt inventory and statistics

### 3.1 Counts and formats

| Directory | Files | Format and conventions | Explicit license label |
|---|---:|---|---|
| `prompts/` | 66 | Markdown; all 66 have an H1 title. 65 have category, type, `License`, and a prompt section. 64 use one fenced block, one has three fenced blocks, and `Zentry_Premium.md` has no fenced block and no standard metadata. | 65 say `free` or `Free`; one has no label |
| `Pro-prompts/` | 67 | Markdown; all have H1 title, ID, category, and type. The body is usually free-form text rather than the free directory’s standard fenced prompt block. | None found |
| **Total** | **133** | All files use `.md`; there are no prompt JSON/YAML records or frontmatter blocks. | Not a reliable permission indicator |

Free-folder categories as written in the files:

| Category | Count |
|---|---:|
| SaaS | 19 |
| Hero Section | 14 |
| Landing Page | 14 |
| Agency | 7 |
| Portfolio | 4 |
| Web3 | 2 |
| AI / SaaS, Investor Presentations, Component, Automotive, Fintech | 1 each |
| Missing category | 1 (`Zentry_Premium.md`) |

Pro-folder categories as written in the files:

| Category | Count |
|---|---:|
| Landing Page | 19 |
| SaaS | 16 |
| Hero Section | 14 |
| Agency | 6 |
| Portfolio | 4 |
| Web3 | 2 |
| AI / SaaS, Investor Presentations, Component, Automotive, Presentation, Fintech | 1 each |

### 3.2 Representation and reusability

- Most files in `prompts/` use an H1 title, quoted `Category`, `Type`, and `License` lines, a “Video Preview” section, a “Prompt” section, and a fenced text block. The prompt itself is plain Markdown text/code, not structured fields.
- Some prompts contain implementation instructions, library names, font recommendations, external media URLs, and links. These are design briefs; they may need adaptation to PROMPT/DEPT’s framework, routing, image policy, and product context.
- The free prompt files contain prompt text, not a machine-readable `description` field or consistent tags. A title, category, and type can be parsed for many files, but any import should normalize and validate rather than blindly parse.
- `Pro-prompts/` is not loaded by the homepage. Its entries have IDs and category/type labels, but no explicit license. A folder name is not a legal access or reuse term.
- No separate version field is present. There are **21 same-stem pairs** across `prompts/` and `Pro-prompts/`; they are not byte-identical, but no version lineage or “supersedes” metadata explains their relationship. Do not silently merge these pairs.
- A SHA-256 comparison found no byte-identical Markdown prompt files. Near-duplicate/semantic equivalence has not been established for every pair.
- `prompts/Zentry_Premium.md` has a full prose design brief, but lacks the normal metadata and preview heading. Its “Premium” name is not a licensing grant.

### 3.3 Representative examples

| Example | Verified contents | Exact path |
|---|---|---|
| AI Automation Hero | Detailed hero layout and motion requirements; explicitly names a Mux HLS `.m3u8` background URL and React/Tailwind/Framer Motion concepts | `prompts/AI_Automation_Hero.md` |
| AKOR Security | Long landing-page specification, with navigation, hero, services, and about sections; includes remote CloudFront and image-host URLs | `prompts/AKOR_Security.md` |
| Loader Animation | Component prompt specifying rotating “Design → Create → Inspire” words, counter, and progress animation; explicitly says no preview is available | `prompts/Loader_Animation.md` |
| Acreage Farming (Pro) | ID/category/type header and a detailed full-page agricultural-site prompt with a Pixabay MP4 URL | `Pro-prompts/acreage-farming-hero.md` |
| MotionZ Premium | Unstructured prose brief with gaming-inspired sections; it does not use the usual metadata or fenced prompt format | `prompts/Zentry_Premium.md` |

Short excerpts only: “Unlock the Power of AI for Your Business” (`prompts/AI_Automation_Hero.md`); “Intelligent Security Systems” (`prompts/AKOR_Security.md`); and the loader’s three-word sequence (“Design”, “Create”, “Inspire”) (`prompts/Loader_Animation.md`). These are examples, not a claim that the preview media was generated by the prompts.

## 4. Media inventory and statistics

### 4.1 Local media

The counts below include files under both `assets/` and `demos/`; dependency/build folders are not present. Sizes are approximate MiB based on file bytes.

| Extension / type | Count | Approx. size | Notes |
|---|---:|---:|---|
| `.jpg` | 556 | 47.43 MiB | All are under `Big_Bang_Origin` and `Iron_Man_Stark` `frames` / `frames-2` directories; 218 and 338 respectively |
| `.gif` | 4 | 21.29 MiB | All in `assets/images/`; 800px-wide animated images, 23–146 frames |
| `.png` | 7 | 2.10 MiB | Four filenames under `assets/images/`, three under Zentry. Three of the four `assets/images/*.png` files have WebP file signatures despite the `.png` suffix |
| `.webp` | 12 | 2.00 MiB | Zentry demo images |
| `.ico` | 6 | 0.15 MiB | Favicons/icons in the bundled demos |
| `.svg` | 7 | 0.01 MiB | Vector assets in bundled demos |
| `.mp3` | 1 | 0.37 MiB | `demos/Zentry_Premium/audio/loop.mp3`; ffprobe reports 24 seconds |
| `.mp4`, `.webm`, `.m3u8` | **0** | **0** | No local video file or HLS manifest/segment was found |

There are 585 raster/icon files (including ICO), with 568 landscape, 14 near-square, and 3 portrait. The 556 JPGs are exactly 1920×1080 (387 files) or 1916×1080 (169 files). Their `frames` / `frames-2` paths are evidence of frame-sequence assets, but the checkout has no manifest establishing how or when they were captured.

The four GIF details:

| Path | Dimensions | Frames | Size |
|---|---:|---:|---:|
| `assets/images/AI_Designer_Agency_1.gif` | 800×573 | 133 | 5,130,025 bytes |
| `assets/images/AI_Designer_Agency_2.gif` | 800×624 | 131 | 8,714,367 bytes |
| `assets/images/AI_Designer_Agency_3.gif` | 800×570 | 146 | 7,379,671 bytes |
| `assets/images/AI_Designer_Agency_4.gif` | 800×590 | 23 | 1,100,896 bytes |

The other four `assets/images/` files are `AKOR_Security_1.png` through `_4.png`, each 1024×1024. `_1.png` is PNG; `_2.png`, `_3.png`, and `_4.png` decode as WebP. This mismatch matters when setting MIME types or serving through a CDN.

### 4.2 External media references and preview reality

- The prompt Markdown contains **89 relative media references**, targeting **85 distinct paths** under `../assets/videos/`. Every one resolves to a missing local file; the repository has no `assets/videos/` directory.
- The Markdown uses image syntax such as `![Video Preview](../assets/videos/name.mp4)`. These are not local playable video files. The homepage’s lightweight Markdown renderer converts this syntax to an `<img>` tag, not a video player.
- Prompt text references at least 91 distinct MP4 URLs and 24 distinct M3U8 URLs (counted as literal URLs in the prompt files). The files contain links to hosts such as CloudFront, Mux, Cloudflare Stream, Pixabay, Unsplash, and MotionSites. URL existence, ownership, permissions, and availability were not tested.
- Across all 73 demo `index.html` files, static inspection found 75 `<video>` tags and 22 literal M3U8 URL references. These are remote references in HTML, not bundled video files. Do not label them local MP4 or claim a local HLS package exists.
- The homepage card preview is an iframe of the corresponding local `demos/<name>/index.html`, not a thumbnail image or a video recording. Many demo pages then load remote video/media/CDN resources at runtime.
- The website’s bundled demo pages are static webpage implementations, not screen recordings. Some pages have an embedded video background; that video is a dependency of the demo, not evidence of the prompt’s output provenance.

## 5. Prompt-to-preview mapping

### 5.1 How mapping is established

The homepage object’s `name` is used to construct both `/demos/${name}/index.html` and `/prompts/${name}.md` (`index.html:182-252, 274-288, 378-389`). This gives a **high-confidence structural mapping** between a catalogue name and a same-named folder/file where present. It does **not** prove the displayed page was generated from that prompt; no run record, generator output manifest, or per-demo provenance file was found.

Media inside `assets/images/` is associated only by filename similarity for the two matching stems below. The prompt Markdown does not link to those GIF/PNG files, and the files are not referenced by a gallery media manifest. That is a **low-to-medium confidence filename association**, not a verified prompt-to-output relationship.

### 5.2 Representative mapping table

“High” below refers to the catalogue/name/path relationship. **Preview origin confidence remains low** unless a source manifest or author confirms that the page was generated from the prompt.

| Prompt title / identifier | Prompt source path | Image / thumbnail path | Video / demo path | Preview type | Mapping confidence | Missing assets / issues |
|---|---|---|---|---|---|---|
| AI Designer Agency | `prompts/AI_Designer_Agency.md` | `assets/images/AI_Designer_Agency_1.gif` … `_4.gif` (filename match only; not linked by prompt) | Missing `assets/videos/AI_Designer_Agency_0.mp4` and `_6.mp4`; local page `demos/AI_Designer_Agency/index.html` | Animated GIF files plus static webpage demo | High for name-to-demo; low for output provenance; medium-low for GIF relation | Prompt preview MP4 links are missing; GIFs are not explicitly mapped to the prompt |
| AI Automation Hero | `prompts/AI_Automation_Hero.md` | None | Missing `assets/videos/AI_Automation_Hero_0.mp4`; `demos/AI_Automation_Hero/index.html`; prompt text names a remote Mux HLS stream | Static webpage demo with remote media references | High for name-to-demo; low for output provenance | No local video/thumbnail; remote HLS URL is not a bundled stream |
| AKOR Security | `prompts/AKOR_Security.md` | `assets/images/AKOR_Security_1.png` … `_4.png` (three files are WebP content with `.png` extensions) | Missing `_0.mp4` and `_5.mp4` under `assets/videos/`; `demos/AKOR_Security/index.html` | Static webpage demo and square image files | High for name-to-demo; low for output provenance; medium-low for image relation | Prompt links to missing videos; image-to-prompt relation is inferred from naming only |
| Mindloop Landing | `prompts/Mindloop_Landing.md` | None | Missing `assets/videos/Mindloop_Landing_0.mp4` … `_3.mp4`; `demos/Mindloop_Landing/index.html` | Static webpage demo with prompt video references | High for name-to-demo; low for output provenance | Four missing preview references; remote media use was not tested |
| Space Voyage | `prompts/Space_Voyage.md` | None | Missing `_0.mp4` and `_1.mp4`; `demos/Space_Voyage/index.html` | Static webpage demo | High for name-to-demo; low for output provenance | Prompt preview files are absent |
| MotionZ Premium | `prompts/Zentry_Premium.md` | `demos/Zentry_Premium/img/` includes WebP/PNG assets | `demos/Zentry_Premium/index.html` | Bundled static assets and a Vite-style page | High for name-to-demo; low for prompt-output provenance | Entry HTML points to absent `/src/main.jsx`; prompt has no standard metadata/license or explicit preview |
| Big Bang Origin | **No same-named file in `prompts/`** | `demos/Big_Bang_Origin/frames/` and `frames-2/` (218 JPG files combined) | `demos/Big_Bang_Origin/index.html` | Local webpage with frame-sequence and source-like files | High for directory/page relationship; no prompt mapping | Homepage offers “View Prompt” but `/prompts/Big_Bang_Origin.md` is missing |
| Iron Man Stark Industries | **No same-named file in `prompts/`** | `demos/Iron_Man_Stark/frames/` and `frames2/` (338 JPG files combined) | `demos/Iron_Man_Stark/index.html` | Local webpage with frame-sequence and source-like files | High for directory/page relationship; no prompt mapping | Homepage offers “View Prompt” but `/prompts/Iron_Man_Stark.md` is missing; recognizable franchise IP raises rights concerns |

**Aggregate:** all 68 homepage entries have a same-named demo directory and `index.html`; 66 have a same-stem file in `prompts/`; none has a separate local MP4/WebM/HLS file. Five other top-level demo directories are not listed on the homepage: `E_commerce_Website`, `GTA_VI_Cinematic`, `GTA_VI_Landing`, `League_of_Legends_Hero`, and `Valorant_Gaming_Landing`. `E_commerce_Website` sits alongside the listed `E-commerce_Website`, so it may be an alternate copy, but no version metadata confirms that.

## 6. Original website implementation walkthrough

The main references below are line numbers in the checked-out `index.html`.

1. **Static layout and styling:** The document head and inline CSS establish a dark, responsive card grid and modal (`index.html:1-139`). Google Fonts are loaded from `fonts.googleapis.com` (`index.html:8-9`).
2. **Homepage catalogue:** `const demos` is a hard-coded array with name, display title, category, and type; one entry (`Zentry_Premium`) has `premium: true` (`index.html:182-252`). It is not loaded from Markdown, JSON, or an API.
3. **Category and search controls:** Categories are derived from the array’s `cat` field (`index.html:253`). `render()` filters by title, category, and type; it does not search prompt bodies or tags (`index.html:256-269`). Filter buttons update `activeFilter`; the search input rerenders on input (`index.html:318-329`).
4. **Cards and live previews:** Each card links to `/demos/<name>/index.html`, displays category/title/type, and has “View Demo” and “View Prompt” controls (`index.html:274-288`). The preview is a scaled iframe, loaded when the card approaches the viewport by `IntersectionObserver`; it uses `loading="lazy"` and a sandbox allowing scripts and same-origin access (`index.html:293-313`). A letter placeholder remains until iframe load.
5. **Prompt detail:** The delegated click handler passes the selected `name` to `openPrompt()` (`index.html:400-405`). That function fetches `/prompts/<name>.md`, renders the returned text inside a modal, and shows an error message when fetch fails (`index.html:378-391`). This means the two missing free prompt files produce a missing prompt result.
6. **Markdown rendering:** `renderMarkdown()` is a small hand-written substitution pipeline for headings, fences, links, lists, inline code, images, and basic formatting (`index.html:339-376`). It is not a full Markdown implementation. The “video preview” Markdown syntax is emitted as an image element, and the corresponding files are missing. There is no “copy prompt” button or clipboard API use in the homepage code; a user can only select/copy displayed text manually.
7. **Premium handling:** The premium flag adds a visual class and gold demo-button styling (`index.html:274` and the premium CSS around `index.html:96`). It does not enforce a paywall or authentication. The homepage still renders “MotionZ Premium” as an item, while its header badge claims “68 Free Prompts” (`index.html:143, 250`); `Pro-prompts/` is not loaded by the homepage.
8. **External dependencies:** The homepage itself depends on static same-origin files plus Google Fonts and browser APIs. Individual demo pages may request React/Tailwind/CDN scripts and remote video/image/font resources. For example, `demos/Aethera_Studio/index.html` loads React and Tailwind from CDNs and references a CloudFront MP4. These are third-party runtime dependencies, not a backend/API integration contract.

No authentication, user account, persistent likes/saves, analytics pipeline, admin interface, or server endpoint is present in the inspected root site. No external API was found as a catalogue data source. Three Pro prompt files mention a Supabase-related package as a dependency in the app they describe, but those mentions are not evidence that SitePrompt itself connects to Supabase. A static deployment host is required to serve the pages and Markdown; a development server may be convenient, but no root server is specified. Root-relative URL paths (`/prompts/...`, `/demos/...`) assume deployment at a domain root or equivalent rewrite/base-path setup.

### What to learn from, and what not to copy

**Useful patterns:** compact catalogue records, category filters, simple search, responsive cards, lazy preview loading, and static Markdown fetching.

**Do not copy wholesale:** the hard-coded array as an ongoing content store; the incomplete Pro integration; root-relative paths without checking PROMPT/DEPT base paths; the ad hoc Markdown renderer; missing video preview links; CDN-dependent demo runtime; or the assumption that a named demo is verified output from the associated prompt. Adapt the interaction patterns to the existing Next.js routes, server/client boundaries, authorization, accessible dialog behavior, and established content renderer.

## 7. Licensing and attribution findings

This is a preliminary technical review, not legal advice.

| Material | What the checkout establishes | Reuse conclusion |
|---|---|---|
| Repository source code | Root `LICENSE` is MIT and names Nomaan Khan with a 2026 copyright; `package.json` also declares MIT. MIT requires retaining the copyright and permission notice when distributing covered copies/substantial portions | The licence grants broad reuse of the covered “Software,” subject to its terms. Confirm which non-code content is included before applying it to prompts/media |
| Free prompt text | 65 of 66 free-folder files have a `License: free` label (case varies); no definition or terms for “free” are supplied | **Unclear.** “Free” may describe access/price and is not a specific redistribution/commercial-use licence |
| Pro prompt text | 67 Markdown files with IDs/categories/types; no per-file license found | **Unclear / do not redistribute** until author confirms permission and terms |
| Images, GIFs, frame JPGs, SVGs, icons, audio | No per-file license, attribution manifest, creator/source metadata, or separate asset notice found | **Unclear.** Do not assume the root MIT notice clears them |
| Remote media/URLs | Prompts and demos refer to CloudFront, Mux, Cloudflare Stream, Pixabay, Unsplash, MotionSites and other domains; these hosts/URLs do not establish the underlying asset owner or licence | **Unclear.** A source URL is not proof of permission to copy, rehost, or redistribute |
| Fonts and third-party libraries | Some demos load Google Fonts and CDN libraries; bundled demo fonts/assets have no repository-specific notices located in the inspected root | Check each font/library/asset’s own licence and attribution obligations before reuse |
| Branded/third-party subject matter | The demo set includes names such as Iron Man, GTA, League of Legends, Valorant, and Nike; some associated pages may depict protected brands/characters | Exclude related prompts, media, and demo assets pending rights/permission review; do not infer commercial-use rights from inclusion in this repository |

The README credits Nomaan Khan and links to a GitHub account, while the local repository origin is `im-286/siteprompt` and the homepage GitHub button points to a different repository URL (`nomaan5541/motionsites.ai-prompt-library`). This provenance inconsistency is not proof of ownership or permission. The README also calls the collection “free,” but that wording is not a content licence.

**Conservative disposition:** root application code may be reusable under MIT after preserving the notice. Do not import prompt text, Pro prompts, images, demo projects, videos, fonts, or externally hosted media into a public/commercial PROMPT/DEPT catalogue until permissions and attribution are confirmed for each relevant content class.

## 8. Import options and recommended architecture

### 8.1 Option comparison

| Option | Cost / complexity | Performance | Maintainability | Limitations |
|---|---|---|---|---|
| **A. Prompt text and metadata in Supabase; approved media in Supabase Storage** | Medium. Requires approved content, storage policy, upload pipeline, and alignment with existing schema/RLS | Good if media is appropriately optimized and served via CDN; large video storage/egress can cost more | Centralized records and media references; convenient admin workflow | Rights must be cleared first; storage/egress grows; copying HLS segments is not equivalent to hosting one MP4; do not upload to database rows |
| **B. Approved media in static assets; prompt metadata in Supabase** | Lowest initial operational complexity for a small static pilot | Very good for small immutable images with caching; large media can bloat deploys and slow releases | Simple versioned assets; easy to roll back with a deployment | Asset changes require deploys; poor fit for large videos; metadata and file deployment can drift |
| **C. Source manifest plus idempotent import script** | Moderate up-front effort; requires source normalization, checksums, import logs, and review states | Neutral at runtime; it is an ingestion/control-plane choice | Best for repeatability, auditing, changed-source detection, and safe future re-runs | C is complementary to A/B, not a media-hosting alternative. Requires implementation and testing against the existing schema |

### 8.2 Recommendation

Use **C as the source-of-truth import process**, combined initially with **B for approved, small preview assets** and the existing PROMPT/DEPT storage/content architecture for prompt text and metadata. If the existing app already uses Supabase Storage for gallery media, approved assets can instead use A’s storage mechanism. Do not choose a storage design until the current app’s tables, RLS, buckets, and upload conventions have been inspected.

Start with a reviewable manifest outside the user-facing database containing, at minimum:

- Canonical source repository URL, source commit, source path, source file checksum, original title, original category/type, and whether it came from `prompts/` or `Pro-prompts/`.
- Normalized display title/description/category/tags, source tier label, slug, and import status.
- Prompt text only after permission approval; preserve the original Markdown or an auditable source copy where appropriate.
- Per-asset records: source prompt path, local path or original URL, media type, MIME type verified from bytes, dimensions/duration/size, attribution, licence/permission status, and preview role (`actual_output`, `illustrative`, `unknown`).
- Human-reviewed provenance state; do not equate a same-name demo folder with an actual generated output.

### 8.3 Normalization and update safeguards

1. **Titles and descriptions:** take the H1 as a title candidate, not an unquestioned canonical title. Many files lack a description field; create a short editorial summary only after reviewing the prompt. Preserve original title/category/tier values for traceability.
2. **Categories and tags:** map source category values to PROMPT/DEPT’s existing taxonomy only after inspecting its taxonomy. Keep the original category in source metadata. Add controlled tags from reviewed prompt content; do not treat free-form headings as tags automatically.
3. **Stable identity/slugs:** use source repository + normalized source path (for example, `prompts/AI_Automation_Hero.md`) as the source identity. Generate a lowercase slug from the title, resolve collisions deterministically, and do not use slug alone as the upsert key. Same-stem free/Pro records must remain distinct unless reviewed.
4. **Duplicates/versioning:** store the source path and checksum. Compare hashes on re-import; detect changed content, then stage a diff for review instead of silently overwriting. Preserve older revisions or existing version history if PROMPT/DEPT already has it.
5. **Media association:** attach a media record only when an explicit reference or human-reviewed manifest connects it to a prompt. Filename matches can be candidate evidence, not a final mapping. Preserve original external URLs and attribution details even when hosting an approved local copy.
6. **Broken/missing previews:** represent missing preview state explicitly and use the existing app’s neutral placeholder. Do not leave dead links or relabel a prompt URL as a local video.
7. **Videos and HLS:** keep a `.m3u8` URL typed as HLS and separate from MP4. Large videos should remain external or move to an approved video/CDN workflow only if rights, playback, and cost justify it. Do not copy stream segments or scrape third-party content. Store or generate a poster only with permission.
8. **Actual versus illustrative:** make preview provenance explicit. Use `unknown` unless an author/source record confirms it is output from the prompt. A demo page is a webpage preview, not an output screenshot or video recording.
9. **Existing product behavior:** import as additive catalogue records. Never overwrite or recreate user likes, saves, analytics events, creator IDs, moderation state, or admin fields during an upsert. Prefer deactivation/review when a source item disappears, not deleting referenced rows.
10. **Repeat updates:** pin the source commit and record each import run. On source changes, emit a reviewable diff for metadata, prompt text, media references, and licence status. Make reruns idempotent and avoid re-uploading unchanged files by checksum.

### 8.4 PROMPT/DEPT code and data that must be inspected first

The PROMPT/DEPT application was not part of this local checkout, so its schema and UI behavior cannot be verified here. Before any design or migration, inspect:

- Existing prompt/gallery types, Supabase migrations/schema, generated TypeScript types, indexes, and uniqueness rules.
- RLS policies, server/client Supabase usage, roles, admin moderation flow, and any existing content import mechanism.
- Storage buckets, access policies, upload/resize/CDN conventions, signed/public URL handling, and media limits.
- Gallery card/detail routes and fields expected for thumbnail, preview, category, tags, authorship, and access tier.
- “Build a Prompt” flow and how a prompt is prefilled, edited, copied, saved, or submitted.
- Existing likes, saves, analytics, and admin relationships, including the identifiers they reference.
- Existing taxonomy, slug generation, search indexing, localization, and content moderation conventions.
- Current catalog import/export process and whether content changes should be audited or versioned.

Do not create a new database schema or run a migration based only on SitePrompt’s files.

## 9. Initial pilot recommendations

These 12 are **candidates for manual review**, not approved imports. They have matching files in `prompts/`, a structured prompt in most cases, and a same-named local demo page. Source prompt labels say `free`/`Free`; that is **not** a redistribution licence. Every prompt-preview MP4 reference is missing locally. The local demo exists as HTML but was not run and may depend on external CDNs/media. “Why candidate” reflects structure/category variety, not a claim of output quality.

| Title | Category in prompt (homepage category where different) | Exact prompt source | Available preview assets | Reuse / attribution status | Why it is a candidate |
|---|---|---|---|---|---|
| AI Automation Hero | AI / SaaS (homepage: SaaS) | `prompts/AI_Automation_Hero.md` | Demo `demos/AI_Automation_Hero/index.html`; missing `_0.mp4`; prompt includes remote Mux HLS URL | Prompt says `free`; no specific reuse licence; external video rights unverified | Complete structured hero brief, clear technical requirements, useful SaaS pilot |
| AI Designer Agency | Landing Page (homepage: Agency) | `prompts/AI_Designer_Agency.md` | Demo `demos/AI_Designer_Agency/index.html`; four same-stem GIFs in `assets/images/`; two missing MP4 links | Prompt says `free`; GIF relation only inferred by filename; rights not cleared | Detailed multi-section prompt and the strongest local illustration candidates |
| AKOR Security | Landing Page (homepage: SaaS) | `prompts/AKOR_Security.md` | Demo `demos/AKOR_Security/index.html`; four same-stem square files in `assets/images/`; two missing MP4 links | Prompt says `free`; three image suffixes do not match actual WebP content; rights not cleared | Complete multi-section specification and a distinct security/enterprise use case |
| Bold Portfolio Hero | Portfolio | `prompts/Bold_Portfolio_Hero.md` | Demo `demos/Bold_Portfolio_Hero/index.html`; referenced video missing; no separate image | Prompt says `free`; no explicit content licence or attribution record | Adds portfolio design coverage and is structured as a reusable hero prompt |
| ClearInvoice SaaS Hero | SaaS | `prompts/ClearInvoice_SaaS_Hero.md` | Demo `demos/ClearInvoice_SaaS_Hero/index.html`; referenced video missing; no separate image | Prompt says `free`; rights and third-party media status unverified | Clear SaaS/fintech-style subject and concise prompt suitable for normalization review |
| E-commerce Website | Landing Page (homepage: E-commerce) | `prompts/E-commerce_Website.md` | Demo `demos/E-commerce_Website/index.html`; referenced video missing; no separate image | Prompt says `free`; no explicit content licence | Broad commerce use case; source and homepage taxonomy mismatch can test mapping |
| Liquid Glass Agency | Landing Page (homepage: Agency) | `prompts/Liquid_Glass_Agency.md` | Demo `demos/Liquid_Glass_Agency/index.html`; referenced videos missing; no separate image | Prompt says `free`; external media and content rights unverified | Distinct visual-design category and detailed prompt for testing tags/style metadata |
| Mindloop Landing | Landing Page (homepage: SaaS) | `prompts/Mindloop_Landing.md` | Demo `demos/Mindloop_Landing/index.html`; four referenced videos missing; no separate image | Prompt says `Free`; no specific reuse licence | Multi-section landing-page content; useful for validating longer prompts and broken-preview fallback |
| Orbit Web3 | Web3 | `prompts/Orbit_Web3.md` | Demo `demos/Orbit_Web3/index.html`; referenced video missing; no separate image | Prompt says `free`; no explicit content licence | Represents Web3 category without selecting a known franchise demo |
| Space Voyage | Landing Page (homepage: SaaS) | `prompts/Space_Voyage.md` | Demo `demos/Space_Voyage/index.html`; two referenced videos missing; no separate image | Prompt says `free`; content/media rights unverified | Space-themed visual brief and a useful test of source/category taxonomy mismatch |
| Taskora SaaS Hero | SaaS | `prompts/Taskora_SaaS_Hero.md` | Demo `demos/Taskora_SaaS_Hero/index.html`; referenced video missing; no separate image | Prompt says `free`; no explicit content licence | Focused SaaS prompt with a clear catalogue category |
| Wealth Video Hero | Fintech | `prompts/Wealth_Video_Hero.md` | Demo `demos/Wealth_Video_Hero/index.html`; referenced video missing; no separate image | Prompt says `free`; remote video rights unverified | Fintech category coverage and a useful case for distinguishing video-led prompt intent from an actual local preview |

**Pilot gate:** before importing even one candidate, obtain permission for prompt redistribution and each desired preview asset; verify the demo and media in a controlled environment; record attribution and provenance; and confirm that the existing product schema/UI can represent a missing or external preview.

## 10. Risks, limitations, and unresolved questions

1. **Content rights are unresolved.** The MIT root notice and per-prompt `free` labels do not clearly answer whether prompt text, imagery, demos, or remote media may be copied and redistributed.
2. **Preview files are missing.** The free prompt files reference absent MP4/WebM paths; homepage Markdown rendering would not play MP4 even if those files existed.
3. **Output provenance is missing.** The repository does not provide a manifest or run record establishing that any demo page or image is the actual output of its same-named prompt.
4. **Catalogue is inconsistent.** README says 65 prompts, local `prompts/` contains 66, homepage lists 68, and two listed prompts are absent. Homepage badge labels all 68 as free although one item is marked premium.
5. **Pro content is not integrated.** 67 Pro files are not rendered by the homepage and have no specific per-file license.
6. **Media hosting is external.** Remote CDN, font, image, MP4, and HLS URLs may be unavailable, restricted, changed, or subject to different terms. They were counted from source text but not fetched or tested.
7. **A few packaged pages may be incomplete.** Zentry’s `index.html` points to a missing `src/main.jsx` despite compiled-looking assets being present.
8. **Possible third-party IP.** Several demo titles reference protected entertainment/fashion brands. Do not use them in a commercial catalog without rights review.
9. **Root package metadata is misleading for the website.** It describes a CLI with absent entrypoints and has no real build/test suite. Do not rely on `npm test` as validation.
10. **PROMPT/DEPT compatibility is unknown.** This checkout contains no PROMPT/DEPT app, Supabase schema, RLS, or bucket configuration; integration must wait for inspection of that separate codebase.
11. **Inspection boundaries:** no runtime browser test, network availability check, media download, dependency installation, legal opinion, or production-quality review was performed.

## 11. Phased implementation plan

1. **Rights and provenance gate:** contact the repository maintainer; clarify prompt, Pro, demo-code, local-media, and remote-media permissions separately; collect required attribution and any commercial-use limits. Exclude unresolved or branded items.
2. **Inspect PROMPT/DEPT:** review the existing schema, RLS, storage, gallery/detail components, Build a Prompt flow, taxonomy, and likes/saves/analytics/admin behavior. Document compatibility before schema changes.
3. **Create a reviewed source manifest:** capture source path, pinned commit, checksum, title/category/tier, prompt text, media references, rights evidence, attribution, and preview provenance. Mark missing previews explicitly.
4. **Run a non-production pilot:** start with 10–12 cleared prompts; validate normalized metadata, stable IDs/slugs, duplicate handling, accessibility, rendering, search/category behavior, and existing user features.
5. **Ingest approved content idempotently:** import prompt data through the app’s established server-side method, preserving existing row IDs and user-owned relations. Stage diffs and never treat source removals as automatic deletes.
6. **Add approved media selectively:** initially use small approved static assets or the existing Storage convention. Optimize images and set correct MIME types. Defer large video/HLS until a specific authorized playback need exists.
7. **Integrate the UI:** adapt existing gallery and detail components; add a reviewed preview-type/provenance label and graceful placeholder. Connect the existing Build a Prompt action without changing likes/saves/analytics semantics.
8. **Maintain updates:** pin the upstream commit per run, compare checksums, review changes in content/media/licence status, and rerun the importer in staging before production.

No phase above has been executed; this is a recommendation only.

## 12. Exact references and concise next steps

Key source references:

- Homepage data and UI: `index.html:182-329`
- Prompt modal and renderer: `index.html:339-405`
- Root package metadata: `package.json:1-21`
- README summary and catalogue links: `README.md:1-20`, `README.md:105-176`, `README.md:178-185`
- Root code license: `LICENSE:1-21`
- Example structured prompts: `prompts/AI_Designer_Agency.md`, `prompts/AKOR_Security.md`, `prompts/AI_Automation_Hero.md`
- Example Pro prompt: `Pro-prompts/acreage-farming-hero.md`
- Non-standard premium prompt: `prompts/Zentry_Premium.md`
- Example external-CDN demo: `demos/Aethera_Studio/index.html`
- Zentry entrypoint/config/assets: `demos/Zentry_Premium/index.html`, `demos/Zentry_Premium/package.json`, `demos/Zentry_Premium/assets/`

### Bottom line

The repository contains useful, mostly detailed prompt briefs and local demo webpages, but its apparent video-preview system is incomplete: no local video files exist, all 89 Markdown media references are broken, and external stream URLs are not licensed copies. The demo-to-prompt relationship is based on naming/code, not verified generation evidence. Root MIT licensing is insufficient evidence to redistribute the prompts or media.

**What to do next:** inspect the separate PROMPT/DEPT codebase and obtain explicit rights/attribution confirmation; then test a small, manifest-driven pilot of approved text and any specifically approved small preview assets. Keep unresolved Pro prompts, branded demos, and remote/HLS media out of the public catalogue until cleared.