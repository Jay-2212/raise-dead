# Paint Grave — Requirements

## Overview
MS Paint (deprecated 2017) tribute using jspaint — the MIT-licensed recreation by Isaiah Odhner — vendored as a static build into `public/apps/jspaint/` and loaded in a sandboxed iframe.

## Source restrictions
- Use only the vendored jspaint static build (MIT). No Microsoft-owned bitmaps from the repo's `images/` if any exist.
- Tombstone: "MS Paint, 1985–2017" (nominative reference; no Microsoft logo).
- If vendoring the full build, audit `lib/` for any non-MIT transitive licences and add all to CREDITS.md.

## User stories (EARS format)

### Display
- **REQ-PT-01** When the Paint overlay opens, the system shall render `<iframe src="/apps/jspaint/" sandbox="allow-scripts allow-same-origin allow-downloads">` filling the overlay content area.
- **REQ-PT-02** The iframe shall have `title="JS Paint — MS Paint tribute"` for accessibility.
- **REQ-PT-03** The overlay shall maintain its standard header (app name, epitaph, "Requiescat in pace" button) above the iframe.

### Functionality
- **REQ-PT-04** The player shall be able to draw, fill, erase, select, and use the text tool within jspaint without restriction.
- **REQ-PT-05** jspaint's built-in File menu (Save, New, etc.) shall function normally within the iframe sandbox.

### Sizing
- **REQ-PT-06** The iframe shall fill at least 90% of the overlay height minus the header bar, on both desktop and mobile.
- **REQ-PT-07** On mobile, a note "Use two fingers to scroll the canvas" shall appear below the iframe.

### Vendoring
- **REQ-PT-08** The vendored build shall be a static snapshot (no CDN calls at runtime); any CDN dependencies in the original source shall be vendored alongside it.

## Acceptance criteria
- AC1: jspaint loads and renders within 3 s on a fast connection.
- AC2: Drawing a line with the pencil tool works.
- AC3: No network requests are made to external domains from within the iframe (verified in DevTools Network tab).
- AC4: Closing the overlay via "Requiescat in pace" removes the iframe from the DOM cleanly.
- AC5: CREDITS.md includes "JS Paint — Isaiah Odhner — MIT — https://github.com/1j01/jspaint".
- AC6: `public/apps/jspaint/` directory is present and contains `index.html`.
