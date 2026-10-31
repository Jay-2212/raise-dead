# Meta Global AI Developer Hackathon: submission checklist (Raise Dead)

**Deadline: Wed Nov 4 2026, 9:00 PM ET = Thu Nov 5 2026, 07:30 IST.** Late entries are not accepted. Aim to submit by **Nov 4, 22:00 IST** to leave a buffer.
Portal: https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit (sign in as jaybharti3000@gmail.com with Continue with Google; the Hark browser session `cerebralvalley` is already signed in).
Sources, read 2026-10-31 while signed in: event details https://cerebralvalley.ai/e/meta-ai-developer-hackathon/details, submission form (above), Official Rules/waiver https://cerebralvalley.ai/e/meta-ai-developer-hackathon/waiver. Verbatim notes are in `/workspace/web/notes/749dc0c4-0539-436e-b422-9a58558a0a6d/cerebralvalley-tu_bjqeg3t7ty5cbnchefgqzeocbf/`.

## What the rules require
| rule | what it means for us | status |
|---|---|---|
| "Your project must incorporate Meta's models" (Muse Spark series, Muse Wonder, Muse Image, Muse Voice Transcribe, SAM 3.1 via Meta Model API; open weights Muse Glimmer / Muse Spark Open; Muse Code). Stage One pass/fail: "reasonably used Meta Model API and/or Meta's open-weight models". No single model is required. | At least one live Muse feature in the demo. Clicky (Muse Spark, streamed) is the minimum. More is better, because **Use of Meta AI Tooling is 25%** of the score. | Clicky planned for Nov 1 |
| **New work only:** "What you present ... must have been built during the event" (Oct 26 to Nov 4). Only startups may build on existing code. | Raise Dead started Oct 31 2026, inside the window. The public git history proves it. The demo must "only highlight the specific features ... you built during the Hackathon" and make clear what we built. | OK. Say "built Oct 31 – Nov 4" in the description and the video. |
| **Repositories must be public.** Form field "Public GitHub Repository*". | https://github.com/Jay-2212/raise-dead must be public. **No secrets in history** (see the secret scan under Deliverables). | Check before submitting |
| **3-minute demo video** (URL; the placeholder is YouTube). It is "one of the primary artifacts Judges use ... along with your code and live product". | Unlisted or public YouTube, ≤ 3:00. Must show what we built, live. | To do (Nov 3–4) |
| Open source is allowed if licences are followed and the submission builds on it. | CREDITS.md already lists every third-party asset and library. Keep it current. | OK |
| Banned: "use code, data, or assets you do not have the rights to". The submission must not violate "copyright, trademark ..." | Only original or permissive assets. No Microsoft, EA or Nullsoft art or logos. Use the name "Clicky", never "Clippy", in the UI. Product names on tombstones are factual references only, with the trademark disclaimer in README and credits. | Keep the disclaimer. Swap the medal (Clicky brief §2). |
| Eligibility: 18+, India OK. Indie track = individuals and students, teams ≤ 4. | Jay (born 2002), solo, **Indie Developer Track**. | OK |
| Submitting the same project to another hackathon (Kiroween) | **Not mentioned** in the Meta details or Official Rules. Nothing prohibits it. Kiro as the coding harness is allowed (Muse Code is optional). | OK. Be open about Kiro in the description. |
| Credits: "$150 in Meta Model API credits, valid for a 10-day development window". | Credits may expire around the deadline. Use Muse for anything we need **before Nov 5**, and keep production usage capped (DAILY_CAP) so nothing bills after the credits run out. The billing page showed $150 free credits and no card on file (Oct 31). With no card, spend can't go past the credits, but the feature would stop working: fallback lines cover that. | Watch usage |

**Judging (0–10 each):** Impact 30%, Use of Meta AI Tooling 25%, Technical Depth & Execution 20%, Demo 25%. The top 5 per track go to a live final round where judges watch the videos (results Nov 9).

## Form fields (every one; no character limits shown)
1. **Team Name*** → `Raise Dead` (or "Jay Bharti").
2. Team Members → Jay Prakash Bharti (already added).
3. **Track*** → Indie Developer Track.
4. **Problem statement*** → **Build for Your World** (bringing the internet's lost software back as a playable memorial). "Push the Frontier" is about physical and scientific systems, so it fits worse.
5. Most Viral Track X post link (optional) → an X post of the 30 s trailer, if Jay is willing to post one.
6. **Project Description*** (draft below).
7. **Public GitHub Repository*** → https://github.com/Jay-2212/raise-dead
8. **3-Minute Demo Video*** → YouTube URL.
9. **Describe your use of Meta products to build the submitted project*** (draft below).
10. **Why are Meta's models important to your solution?*** (draft below).
11. **How likely are you to build with Meta Model API?*** (5-point) → Jay's choice.
12. **Overall opinion of Meta Model API?*** (5-point) → Jay's choice.
13. Permission checkbox (Meta and CV may promote the submission): required.
Optional feedback/NPS section: fill it honestly. Real obstacle: "reasoning tokens count against max_tokens, so small budgets return empty content".

## Draft texts (update once the final features are known)
**Project Description:**
> Raise Dead is a moonlit, walkable graveyard of software the internet lost: apps, games and services that were shut down or discontinued. Walk your wizard up to a tombstone, press F, and an exorcism ritual (spoken incantation, runes, wind, a burst of holy light) brings the app back to life as a small, original, playable tribute in your browser. The first to rise is Clicky, a retired 1990s paperclip helper powered by Meta Muse Spark, who is startled to be back from the dead and chats with you about the afterlife of software. Everything (code, art direction, the dialogue tree and the AI features) was built during the hackathon, Oct 31 – Nov 4 2026. Built with Phaser 3 + TypeScript, Cloudflare Pages Functions + D1, and the Meta Model API.

**Use of Meta products:**
> - Muse Spark (muse-spark-1.3-contributor) via the Meta Model API powers Clicky's free-text conversation, streamed token by token through a Cloudflare Pages Function. It uses a hardened in-character system prompt, hashed-IP and signed-token lifetime quotas, a global daily cap and per-day token accounting in D1, so a public demo stays cheap and abuse-safe.
> - Muse Spark wrote Clicky's 33-node branching dialogue tree (3 voice variants per node) offline, so tap-to-talk players cost zero API calls.
> - Muse Spark reviewed our build plans and specs during development (a cheap contributor-tier reviewer alongside our main coding agent).
> - [add if shipped: Muse Spark generates a playable mini-app for any dead app you type at the Unmarked Grave; Muse Image carves its tombstone portrait.]

**Why Meta's models matter:**
> A character who has "come back from the dead" has to answer anything a visitor throws at him, in voice, instantly and cheaply, for thousands of strangers. Muse Spark's contributor tier makes a public, open-to-anyone AI character affordable (fractions of a cent per message). Its quality let us pre-write a whole branching tree in one pass, and it held character under prompt-injection tests. [add the Unmarked Grave sentence if shipped.]

## Raising the Meta-tooling score (25%): ranked by value per hour
1. **Clicky** (planned, brief ready): streaming, a pre-generated tree, a well-built safety layer. Show the safety layer briefly in the video and the README, since it is "technical depth".
2. **Unmarked Grave** (in PLAN): the player types any dead app, Muse Spark generates a small playable HTML mini-version in a sandboxed iframe (`sandbox="allow-scripts"`, no same-origin), and Muse Image ($0.01 per image) makes its tombstone portrait. This is the most "surprising capability" moment for judges. It needs its own brief and the same quota layer (separate counters).
3. A Muse Voice Transcribe "speak the incantation" mic option. Nice to have, lowest priority.

## Deliverables before submitting
- [ ] Live site works on desktop and mobile: https://raise-dead.pages.dev (Clicky typed path tested on production, quotas verified).
- [ ] Repo public, README updated: features, which Meta models are used and where (file paths), "built during Oct 31 – Nov 4 2026", Kiro as the coding harness, how quotas work, setup (`.dev.vars` example with no secrets), credits and the trademark disclaimer.
- [ ] Secret scan of the full git history: `git log -p --all | grep -n -E 'LLM[|][0-9]+[|]|MODEL_API_KEY=|TOKEN_SECRET='` must print nothing. Rotate any key that ever appears.
- [ ] **3-min video** (≤ 3:00, 1080p, captions). Suggested beats:
  - 0:00–0:15 hook: the graveyard at night, sound on.
  - 0:15–0:45 walk, plaque, F, ritual, light burst.
  - 0:45–1:45 Clicky: surprised wake, two tap options, then typed "what was being dead like?" streaming live, and the quota counter.
  - 1:45–2:20 other graves and Easter eggs (and the Unmarked Grave if it's built).
  - 2:20–2:50 how it's built: Muse Spark streaming through a Pages Function, the D1 quotas, the pre-generated tree (one architecture slide).
  - 2:50–3:00 credits and URL.
  Record with the headless capture or screen recording. The Hark voice-over can be TTS (credit it). Upload unlisted to YouTube (Jay's account; needs Jay or a browser session).
- [ ] Screenshots or GIF for the README.
- [ ] Form texts finalised (above). Submit by Nov 4, 22:00 IST. Screenshot the confirmation.
- [ ] Keep a buffer on `DAILY_CAP` during judging (Nov 5–8). Consider raising it to 1000 then (at most about $0.08 a day).
- [ ] Optional: X post for the Most Viral Track (Jay decides).

## Open questions for Jay
- OK to post an X trailer for the Most Viral Track?
- Should Hark upload the demo video to YouTube from his Google account (browser), or will he?
