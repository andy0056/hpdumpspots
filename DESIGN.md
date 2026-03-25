# DumpSpot — Design System

---

## Colour tokens

All colours defined as CSS custom properties in `:root`.

### Base palette

| Token  | Value     | Use                                               |
| ------ | --------- | ------------------------------------------------- |
| `--bg` | `#070c07` | Page background — near-black with a green tint    |
| `--s1` | `#0d140d` | Surface 1 — nav, card backgrounds                 |
| `--s2` | `#111a11` | Surface 2 — inputs, fields, secondary cards       |
| `--s3` | `#162016` | Surface 3 — darker fills, photo placeholders      |
| `--b1` | `#1a2a1a` | Border subtle — dividers, row separators          |
| `--b2` | `#243624` | Border default — input borders, card borders      |
| `--b3` | `#2e452e` | Border emphasis — selected states, strong borders |

### Text

| Token  | Value     | Use                                       |
| ------ | --------- | ----------------------------------------- |
| `--tx` | `#ddeedd` | Text primary — headings, values           |
| `--mu` | `#527052` | Text muted — labels, secondary info       |
| `--fa` | `#2e422e` | Text faint — timestamps, IDs, helper text |

### Accent

| Token    | Value                  | Use                                           |
| -------- | ---------------------- | --------------------------------------------- |
| `--pk`   | `#ff2d78`              | Neon pink — logo, CTAs, active states, pins   |
| `--pk10` | `rgba(255,45,120,.10)` | Pink tint — selected card backgrounds         |
| `--pk15` | `rgba(255,45,120,.15)` | Pink tint — focus rings                       |
| `--pk35` | `rgba(255,45,120,.35)` | Pink border — selected borders, hover borders |

### Section label colours (form + detail page)

| Section          | Value     | Use                                    |
| ---------------- | --------- | -------------------------------------- |
| Location / Notes | `#6a9a8a` | Blue-green — location and notes labels |
| Type of site     | `#8a7a4a` | Amber — site type section              |
| Severity         | `#8a5a6a` | Dusty rose — severity section          |
| Garbage category | `#4a7a8a` | Teal — category section                |

---

## Typography

Three typefaces, each with a distinct role.

### Playfair Display Italic — `--fd`

Used for display text only. Always italic, never upright.

| Element                      | Size     | Notes                 |
| ---------------------------- | -------- | --------------------- |
| Nav logo                     | `1.7rem` | Pink, italic          |
| List headings (Today)        | `6.5rem` | Pink, italic          |
| List headings (Yesterday)    | `5.6rem` | Off-white, italic     |
| List headings (This Week)    | `3.2rem` | Muted, italic         |
| List headings (older months) | `2rem`   | Muted, italic         |
| Submit button                | `1.5rem` | White on pink, italic |
| Success screen heading       | `2.8rem` | Pink, italic          |

### Space Mono — `--fm`

Used for labels, metadata, IDs, timestamps, tags. Always uppercase where used as a label.

| Element                     | Size          | Notes                           |
| --------------------------- | ------------- | ------------------------------- |
| Form labels                 | `0.6rem`      | Uppercase, 1.2px letter-spacing |
| Nav tabs                    | `0.65rem`     | Uppercase, 0.8px letter-spacing |
| Filter dropdowns            | `0.66rem`     | Uppercase                       |
| Category chip labels        | `0.5rem`      | Uppercase                       |
| Timestamps                  | `0.58–0.6rem` |                                 |
| Report ID badge             | `0.54rem`     | Uppercase                       |
| DigiPin / Plus Code display | `0.55rem`     | Uppercase                       |
| Spot count                  | `0.65rem`     |                                 |
| Toast notifications         | `0.7–0.72rem` |                                 |

### DM Sans — `--fb`

Used for body text, inputs, and all user-entered content.

| Element               | Size                         | Weight | Notes                |
| --------------------- | ---------------------------- | ------ | -------------------- |
| Input fields          | `0.9rem`                     | 400    |                      |
| List row title        | `0.95rem`                    | 500    | Off-white `#e8e2da`  |
| Detail location title | `clamp(1.4rem, 4vw, 2.4rem)` | 500    |                      |
| Map popup location    | `1rem`                       | —      | Uses `--fd` actually |
| Notes / descriptions  | `0.86–0.88rem`               | 400    |                      |
| Reporter name (list)  | `0.72rem`                    | —      | Uses `--fb`          |

---

## Global patterns

### Spacing

- Base radius: `--r: 6px` — used on cards, inputs, badges, buttons
- Nav height: `--nav: 70px`
- Page padding (report + detail): `2.5rem` horizontal, `2.5rem` top, `5rem` bottom
- List container: `2rem` horizontal padding, max-width `1200px`, centered
- Form grid gap: `2rem` on desktop, `1.5rem` at 920px, `1rem` at mobile

### Borders

- Default input border: `1px solid var(--b2)`
- Focused input border: `var(--pk)` with `box-shadow: 0 0 0 3px var(--pk15)`
- Selected tag: `background: var(--pk10)`, `border: 1px solid var(--pk35)`, `color: var(--pk)`
- Active nav tab: `border-bottom: 2px solid var(--pk)`, `color: var(--pk)`

### Transitions

- Hover state changes: `0.12–0.18s`
- Focus ring: `box-shadow 0.15s`
- Row slide: `transform 0.22s cubic-bezier(.22,.68,0,1.2)` — slight overshoot spring
- Underline crawl: `width 0.3s ease`
- Button press: `transform: scale(0.98)`

---

## Hover states

### List rows (`.lcard`)

Two simultaneous effects:

1. **Row slide** — `transform: translateX(8px)` with spring easing
2. **Underline crawl** — `::after` pseudo-element on `.lcard-loc-inner`, `width: 0 → 100%` over 300ms

```css
.lcard {
  transition: transform 0.22s cubic-bezier(0.22, 0.68, 0, 1.2);
}
.lcard:hover {
  transform: translateX(8px);
}
.lcard-loc-inner::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -2px;
  height: 1px;
  width: 0;
  background: var(--tx);
  transition: width 0.3s ease;
}
.lcard:hover .lcard-loc-inner::after {
  width: 100%;
}
```

### Map pins (`.dpin`)

- Default: `border: 1.5px solid var(--pk35)`, `box-shadow: 0 0 8px rgba(255,45,120,.2)`
- Hover: `transform: scale(1.18)`, `border-color: var(--pk)`, `box-shadow: 0 0 16px rgba(255,45,120,.45)`

### Nav tabs (`.ntab`)

- Default: `color: var(--mu)`, `border-bottom: 2px solid transparent`
- Hover: `color: var(--tx)`
- Active: `color: var(--pk)`, `border-bottom-color: var(--pk)`

### Tags (`.tag`)

- Default: `background: var(--s2)`, `border: var(--b1)`, `color: var(--mu)`
- Hover: `border-color: var(--b2)`, `color: var(--tx)`
- Selected (`.on`): `background: var(--pk10)`, `border-color: var(--pk35)`, `color: var(--pk)`

### Category cards (`.ccard`)

- Default: `border: 1px solid var(--b1)`, icon stroke `#c8d8c8`
- Hover: `border-color: var(--b2)`
- Selected (`.on`): `background: var(--pk10)`, `border-color: var(--pk35)`, icon stroke `var(--pk)`, label `var(--pk)`

### Buttons

- Submit button hover: `box-shadow: 0 0 28px rgba(255,45,120,.52)`
- Submit button active: `transform: scale(0.98)`
- Back button hover: `color: var(--pk)`
- Maps button hover: `border-color: var(--pk35)`, `color: var(--pk)`

### Inputs

- Focus: `border-color: var(--pk)`, `box-shadow: 0 0 0 3px var(--pk15)`

---

## Selection states

### Tags

Pink background tint + pink border + pink text on `.on` class.

### Category cards

Pink background tint + pink border. Icon and label turn pink.

### Popup close button

`color: var(--mu)`, positioned top-right.

### View toggle (Map / List)

Active button: `background: var(--pk)`, `color: #fff`.
Inactive: `background: var(--s2)`, `color: var(--mu)`.

---

## Component specifics

### Severity indicator on list rows

Left border using `::before` pseudo-element, visible only on hover:

- Severe / Blocking road: `var(--pk)` — pink
- Moderate: `#c88c14` — amber
- Minor: `#2a6e2a` — green

### List group headings

Alternating alignment via `nth-child(even)`:

```css
.clist-group:nth-child(even) .clist-heading {
  flex-direction: row-reverse;
}
```

Today heading has an additional bottom margin and border before the first card.

### Photo preview grid

6 columns on desktop, 3 on mobile (`≤480px`). Each preview is `aspect-ratio: 1`, `object-fit: cover`. Remove button is a small circle positioned `top: 3px, right: 3px`.

### Map popup

Custom styled — dark background `var(--s1)`, pink glow border `box-shadow: 0 0 0 1px var(--pk35)`, no tip arrow, no default Leaflet chrome.

### Toast notifications

Two styles:

- Info (green): `background: #0d140d`, `border: 1px solid #2e452e`, `color: #ddeedd`
- Error (red): `background: #3a0a18`, `border: 1px solid #ff2d78`, `color: #ff6a9a`

### Draggable pin map

- Height: `200px`, `border-radius: 6px`, `border: 1px solid var(--b2)`
- Cursor: `crosshair` on map, `grab` on pin
- DigiPin + Plus Code display: Space Mono, `0.55rem`, muted, uppercase, below map
- Reverse geocode label: Space Mono, `0.6rem`, `#6a9a8a`, below codes

---

## Responsive breakpoints

| Breakpoint | Change                                                                       |
| ---------- | ---------------------------------------------------------------------------- |
| `≤920px`   | Form grid: 3 columns → 2 columns                                             |
| `≤780px`   | Form grid: 2 columns → 1 column. Detail grid collapses.                      |
| `≤480px`   | Submit button full width. Photo grid 6-col → 3-col. State/area fields stack. |
| `≤360px`   | Category cards 3-col → 2-col.                                                |
