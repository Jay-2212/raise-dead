# Raise Dead — 3-minute demo video: script + shot list (for Jay)

Rules (Meta, Cerebral Valley details page): one "three minute demo video highlighting the specific features, code, and functionality you built during the Hackathon"; YouTube-style URL; judges score Demo 25% ("Is the demo video genuinely cool to watch?"), Meta tooling 25%, Impact 30%, Tech 20%.
Target: 2:50 final. Record more; Hark cuts it down.

## How to record (makes the edit seamless)
1. **Pass A — gameplay only, game sound ON, no talking.** 1080p (or your screen size), full-screen browser, OBS or Windows Game Bar (Win+Alt+R). Move smoothly; pause 2 s at the start and end of every beat. Do each beat 2–3 times; mistakes are fine.
2. **Pass B — your voice only** (phone voice memo is fine, quiet room, phone 20 cm away). Read the lines below, each line 2 times, with a short pause between takes. Fillers and restarts are fine; I cut them.
3. Upload both files to Drive and send the link.

## Beats (Pass A shots) and lines (Pass B)
| # | Time | Shot (Pass A) | Line (Pass B) |
|---|---|---|---|
| 1 | 0:00–0:12 | Title screen → click Play → wizard appears in the moonlit graveyard, walk a few steps. | "The internet kills software every year. Apps, games, whole worlds, gone. So I built a graveyard for them... and a way to raise them." |
| 2 | 0:12–0:35 | Walk to Clicky's grave, plaque shows, press F: full ritual (runes, wind, light burst). | "This is Raise Dead. Walk up to a tombstone, press F, and the ritual brings it back to life, right in your browser." |
| 3 | 0:35–1:00 | Clicky opens: tap one preset, then type "What was being dead like?" and let it stream. | "Clicky, a retired 1997 paperclip, is startled to be alive. He talks live through Meta's Muse Spark, with quotas and a daily cap so a public demo stays safe and cheap." |
| 4 | 1:00–1:40 | Unmarked Grave: type a NEW name (e.g. "Neopets" or "Windows Messenger"), wait (keep the "grave stirs" text in shot), game appears, play 10 s. Then tap "Contra" chip, play 5 s. | "The Unmarked Grave is the wild one. Name any dead app and Muse Spark writes a playable tribute on the spot. Every game is generated, sandboxed, and cached, so the next visitor gets it instantly." |
| 5 | 1:40–2:05 | Quick montage: Space Cadet pinball (launch a ball), 3D Pipes, Bouncing Logo hitting a corner (press C), Road Rash tribute. | "Some graves open open-source remakes, like Space Cadet pinball and 3D Pipes. Muse wrote Road Rash and Winamp." |
| 6 | 2:05–2:30 | Easter eggs: black cat crosses → lightning + witch; touch the zombie hand → zombie wave, cast spells, "The graveyard rests", lore card. | "And it's Halloween, so the graveyard is alive. Every secret teaches a bit of lore, from the black cat to where zombies come from." |
| 7 | 2:30–2:50 | (Hark makes this) architecture card + quick scroll of code and the .kiro folder on GitHub. | "Built in five days with Kiro as the coding agent, Grok and Gemini reviewing every change, and Muse Spark powering the dead. Raise Dead. Bring something back." |
| 8 | 2:50–3:00 | (Hark) end card: raise-dead.pages.dev + GitHub URL. | — |

## Edit plan (Hark)
- Whisper word-level transcript of Pass B → keep the best take of each line, cut fillers and pauses.
- Lay voice over Pass A beats; cut picture on low-motion frames (ffmpeg scene/motion scores, Gemini frame review around each cut), 6–10 frame crossfades only where a jump would show, 20–40 ms audio crossfades, game sound ducked under the voice.
- Burned-in captions (clean, bottom-centre), title card, architecture card, end card; gentle music bed (CC0) only where the game is quiet.
- Final pass: Gemini reviews frame strips around every cut for visible seams; export 1080p H.264, ≤ 3:00, upload unlisted to YouTube.
