Raise Dead — Mouse-only re-test findings (so far)
URL: https://6399a473.raise-dead.pages.dev/

Entry: two clicks at (960,700) progressed from "Click to enter the graveyard · or Press Enter/Space" → "Click again · or press Enter/Space" → in-game. In-game banner at top: "WASD / arrow keys to walk · or click where to go · F at a glowing grave to raise it".

Step 1 (mouse walk on empty path):
- Clicked 4+ empty path spots at various positions (960,300; 960,500; 1100,630; 1200,630; 400,760).
- Wizard position stayed effectively stationary (≈950–980, 630–640). No walk initiated by mouse.
- Also clicked a floating icon bubble above a tombstone (893,878) — no visible result.
- VERDICT: Mouse click-to-walk DOES NOT WORK on empty ground. (Likely a critical issue for a "mouse-only" build.)

Keyboard check:
- ArrowRight: wizard x moved from ≈948→965→975 over several presses. ArrowRight works.
- Lowercase 'd' pressed 10 times rapidly (simulating a hold): wizard x went from baseline ≈955 to ≈980 (~25 px net). D works and moves the wizard right.
- VERDICT: Keyboard WASD/arrows DO move the wizard. D hold moved it (slowly/granularly but it moved).

Step 2 (tombstones), Step 3 (Credits), Step 4 (zombie hand), Step 5 (Unmarked Grave): pending.

Notes on landmarks (approximate screen coords, 1920×1440 letterboxed, game area y≈180–1260):
- Credits text: top-left ≈(57, 208)
- Sound/speaker icon: top-right ≈(1880, 213)
- 3 floating circular icon badges above bottom gravestones — candidates for interactions. Across frames they drifted (icon set at ~(1490,1100), ~(1850,1120), ~(770,1240)) which suggests the camera may scroll or the markers bob.
- Top row of tombstones along y≈220–260 (x≈260, 560, 860, 1810).
- Open dirt grave pits, a Celtic cross.
- The screen contents drift frame-to-frame (landmark coords shift by 10–30 px between screenshots) — may be camera bob/parallax or the wizard auto-wandering.
Step 3 — Credits (top-left):
- Clicked top-left at (57, 208): opened a full-screen CREDITS overlay titled "CREDITS".
- Text IS readable. Small, light-grey pixel font (Pixelify Sans) on dark navy. Low contrast but legible.
- Contents include: wizard sprite (Movicx, CC-BY 3.0, modified), footstep sounds (congusbongus/swuing, CC-BY 3.0), Fonts (Cinzel Variable & Pixelify Sans Variable, SIL OFL 1.1), Code & Libraries (Phaser 3.90.0, phaser3-rex-plugins 1.80.20, Vite, TypeScript, plus "Clicky preset dialogue" — 33-node conversation tree written with Meta Muse Spark, CC0 1.0), and an Images vendor table.
- Close control: a "← Back" button at the bottom-left (~90, 1207). No X button in the upper corner.
- VERDICT: Step 3 PASSED. Credits opens from top-left, text is readable, closes with the Back button.
- Note: "Clicky preset dialogue" is listed in credits — supports that Clicky the paperclip is a tombstone interaction in the game.
Step 2 — Tombstones (Clicky the Paperclip):
- Clicked a tombstone stone face (≈993,880). A ritual began: white light rays radiated from center, a glowing cyan magic circle appeared under the tombstone, and a modal overlay appeared.
- Modal title: "Clicky the Paperclip has risen" with paperclip icon, subtitle "1997 – 2007", a haloed ghost paperclip sprite.
- Opening line: "Oh! Am I bent? Am I straight? I am awake! Who woke me up? Was it you?"
- Three preset reply options shown. I clicked "What was being dead like?"
- Clicky answered: "It was like napping in a drawer nobody opens. Dusty, quiet, and I sorted imaginary papers all day." Follow-up options: "Did you dream?", "Were you lonely?", "Who else is buried here?" plus a free-text "Ask Clicky anything..." input (0/200, Ask button) and "Questions left: 5".
- Close control: "Requiescat in pace" button at the bottom. NO X/close button exists on this modal.
- After the click, the overlay IS exposed as DOM (buttons 57-1 through 57-7), so keyboard Enter also works inside it.
- VERDICT: Clicky tombstone ritual WORKS end-to-end via a single mouse click, including a preset question. One concern: no X/close button — only "Requiescat in pace".
- NOTE: The wizard's prior position was ≈975–980,660 — already right next to the tombstone before the click. It is ambiguous whether the wizard "walked to it" before this first ritual.
Step 2, 2nd tombstone — 3D Pipes:
- Clicked stone-face center (~1335,575) of the middle glowing tombstone (colorful glyph).
- Wizard walked there and started the ritual (cyan 7-pointed summoning circle, staff raised).
- Subtitle bar: "Per lunam et lucem: surge." ("By moon and light: rise.")
- Overlay opened titled "3D Pipes has risen / 1994 – 2006". Body: "Pipes by Isaiah Odhner (MIT). · Esc or the button below to lay it to rest. Requiescat in pace".
- NO X/close button — only "Requiescat in pace" button (and Esc, which we are not using in the mouse-only portion). Pattern consistent with Clicky overlay.Step 2 (3rd glowing tombstone) + Step 5 — Unmarked Grave:
- Third click landed on the glowing gravestone the subtitle called "Nameless one" — ritual started ("Nomen ignotum, surge! / Nameless one, forgotten" → "I SHALL GIVE THEE FORM!").
- Overlay: "Unmarked Grave has risen / ?? – ?? / Name the lost one, and it shall rise." with "Raise it", "Contra", and chips: Flappy Bird, Club Penguin, Google Lively, Snake, Vine. Footer: "Tributes are written live by Meta Muse Spark; names others already raised open instantly. Requiescat in pace."
- NO X/close button (only "Requiescat in pace" button, pattern consistent across all overlays).
- Clicked the Snake chip (~1130,749). An iframe titled "Snake (AI tribute)" loaded: "Snake — risen (tribute) / Eat souls, don't bite bones! 60 sec — arrows/WASD/buttons." First tick was "YOU BIT THE GRAVESTONE / Souls eaten: 0 / Best: 0 / Press R / tap to rise again." On-screen D-pad buttons ▲◀▼▶ present plus a "Raise another" button (1288,869) and "Requiescat in pace" (960,913).
- This third ritual and the Snake chip click both passed; Step 5 passes and the Unmarked Grave counts as the 3rd glowing grave ritual for Step 2.Keyboard D-hold test:
- The press_and_hold tool did NOT send the D character (requires a target and sends mouse hold, not key down). A literal "hold D for 2 s" could not be performed.
- Single d press while canvas had focus (from x≈950): wizard moved to x≈978, a clear ~28 px rightward step. A prior single ArrowRight also shifted the wizard ~+17 px. Keyboard WASD/arrow movement works — single presses move the wizard.
- Caveat: a second d press immediately after re-triggered the Unmarked Grave overlay and landed inside its "Name of a dead app" input, showing a stray "d". In practice a held D could end up typing into a nearby modal input if an overlay opens in the walk's path.
- Conclusion: keyboard WASD/arrow movement works on single presses; a true 2-second D hold was not executed due to tool limitation. The observable behavior (single d = ~28 px walk) is consistent with holding D producing continuous walking when no overlay intercepts.Step 4 — Green-glowing zombie hand (SOUTH): FAILED to complete.
- Searched the south of the map across many frames and multiple screenshots. The visible south contained: jack-o'-lanterns, cobblestone paths, twisted dead trees, grass, a brown dirt patch (~1725,615), firefly/wisp particles (pale cyan-green dots), and several additional south-side glowing graves (including one whose click summoned "WINAMP HAS RISEN 1997–2013", an AI tribute by Meta Muse Spark — no X/close button again).
- No hand-shaped sprite with a green glow was ever observed in the southern view. The only green glows were round firefly wisps and teal grass tufts.
- Advancing the wizard reliably south was difficult: a single `d` press moved the wizard a clear ~28 px, and a small burst of `s` presses produced one measurable south shift (~30 px), but further `s` presses stopped accumulating (wizard's screen y stayed ~665, landmarks stopped rising). The orange-leaf twisted tree's canopy (~x≤950, y 640–1110) sits directly south-west and is the likely collision block; nudging one `d` right helped once but subsequent s'ing stalled again. Single-tap keyboard movement is too slow and intermittent to cover the map area needed.
- A blind click at the lowest visible south badge (~562,1113) did NOT target a hand — it instead triggered a distant resurrection (the light burst centered on a grave at ~220,560 and opened the Winamp tribute). This shows south-side badges are far-range tombstone rituals, not a hand.
- Attempted twice (systematic south survey via keyboard + a direct south click). Per "fail twice, note and move on", Step 4 is recorded as NOT FOUND and the test moved on.