# Google Reader Grave — Requirements

## Overview
A working RSS reader tribute with the classic Google Reader three-pane layout (2005–2013 era). Feeds are fetched server-side via the Cloudflare Worker to avoid CORS. Subscriptions and read state are persisted in localStorage.

## Source restrictions
- No Google logos or Reader screenshots.
- Original UI inspired by (but not copying) the 2010 blue/white/grey palette.
- feedsmith (MIT) used in the Worker for parsing; DOMPurify (Apache-2.0) used client-side for sanitising item HTML.

## User stories (EARS format)

### Feed fetching
- **REQ-GR-01** When the overlay opens, the system shall display a pre-loaded list of curated feeds (HN, BBC, NASA, xkcd, Killed by Google) and any user-added feeds from localStorage.
- **REQ-GR-02** When the player clicks a subscription, the system shall call `GET /api/feed?url=<encoded>` and display the normalised JSON response as a list of article headlines with date and source.
- **REQ-GR-03** The Worker shall validate the URL (http/https only, no private IPs), fetch the feed (timeout 8 s, max 2 MB), parse with feedsmith, and return JSON with `Cache-Control: max-age=600`.
- **REQ-GR-04** When the fetch fails or the URL is blocked, the system shall display a friendly error message ("The signal is lost in the ether…") and not crash.

### Subscription management
- **REQ-GR-05** The player shall be able to type any RSS/Atom URL into an "Add subscription" input and press Enter to add it.
- **REQ-GR-06** The system shall persist subscriptions in `localStorage` under key `rd-subscriptions`.
- **REQ-GR-07** The player shall be able to remove a subscription; removal shall be reflected immediately in the sidebar.

### Reading
- **REQ-GR-08** Clicking an article headline shall expand the item body (sanitised HTML via DOMPurify) in the right pane.
- **REQ-GR-09** The system shall mark an article as read when it is opened; read items shall visually differ from unread (font weight).
- **REQ-GR-10** A "Mark all read" button shall mark all articles in the current feed as read.
- **REQ-GR-11** A star icon shall allow the player to save/unsave an article; starred articles shall be accessible from a "Starred items" virtual feed.

### Layout & style
- **REQ-GR-12** The layout shall be a three-pane design: left sidebar (subscriptions), centre (article list), right (article body).
- **REQ-GR-13** The UI shall be styled to evoke the Google Reader 2010 aesthetic (clean, blue header, white content area, grey sidebar) without using any Google logos or trademarked assets.

## Acceptance criteria
- AC1: Loading the overlay shows at least 3 curated feeds in the sidebar.
- AC2: Clicking a feed retrieves and displays articles within 3 s on a fast connection.
- AC3: An invalid or private-IP URL returns an error message without crashing.
- AC4: Adding and removing a subscription updates localStorage and the sidebar immediately.
- AC5: Article HTML is rendered safely (script tags stripped, verified with a test item containing `<script>alert(1)</script>`).
- AC6: Read/starred state survives a page reload (persisted in localStorage).
- AC7: CREDITS.md includes feedsmith and DOMPurify attribution lines.
