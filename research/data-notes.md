# Graveyard data notes (graves.json)

Built 2026-10-31. 40 graves in `data/graves.json`: the 5 resurrectable launch graves first (sort_priority 1–5), then 35 decorative graves ordered roughly by global fame and nostalgia. Orkut and Hike are included for India and Brazil audiences.

## Schema
`id, name, maker, born, died, category (app|game|service|hardware), epitaph (<=60 chars, original), cause_of_death (original), resurrectable, source_url, sort_priority (1 = most prominent)`, plus two extra fields: `verified` (bool) and `note` (caveat or definition used). `born`/`died` hold a year (int) or an ISO date string ("YYYY", "YYYY-MM" or "YYYY-MM-DD"), depending on how precise the source is. The game should read both forms; years alone are fine for the tombstones.

## Sources and licences
| Source | Licence | Use |
|---|---|---|
| Killed by Google, github.com/codyogden/killedbygoogle (graveyard.json, 308 entries) | MIT (LICENSE file, © 2026 Cody Ogden) | Open/close dates for the Google entries (Reader, Orkut, Google+, Stadia, Picasa, Wave, Glass Explorer, Hangouts, iGoogle). No description text copied. MIT means a credit line goes in CREDITS.md. |
| killed-by-microsoft (fabianoriccardi/killed-by-microsoft), microsoftgraveyard (victorfrye) | MIT | Found but not used. Microsoft dates were checked on Wikipedia instead. Fine to reuse later with credit. |
| KilledByApple repos (wbreiler, TheDen) | No licence | Not used. |
| Wikipedia (en) articles, linked in each `source_url` | CC BY-SA (text) | Facts only (dates). Epitaphs and causes are our own words, with no prose copied. |

Suggested CREDITS.md line: "Google product dates partly from Killed by Google (codyogden/killedbygoogle), MIT License. Other dates checked on Wikipedia. All epitaphs and descriptions are original."

## Verification
Every entry's dates were checked against the Wikipedia article text (MediaWiki API) or the KBG dataset on 2026-10-31.
Judgment calls (also recorded in each entry's `note`):
- Road Rash died 2000 = last new game (Jailbreak). A GBA port came out in 2003.
- Clippy 1997–2007 = Office 97 debut to full removal in Office 2007 (off by default from 2001).
- Winamp 2013 = AOL's shutdown announcement. The brand was later sold and revived.
- iPod classic born 2001 = original iPod. The "classic" name dates from 2007.
- Myspace (classic) died 2013 = the June 2013 redesign. Myspace itself still exists.
- Friendster: services suspended in 2015. Wikipedia reports a relaunch in April 2026.
- Napster (original) 1999–2001, before the brand's later relaunches.
- Windows Phone died 2020 = Windows 10 Mobile end of life. Kinect died 2017 = end of Xbox One Kinect production.
- Picasa died 2015-10-09 per KBG. The desktop app was discontinued in 2016.
- **Uncertain:** BBM born 2005 (the intro text did not confirm it; `verified:false`). Hike launch is given as Dec 11 or Dec 12, 2012.
- `unmarked-grave` has null born/died/source (a placeholder).
