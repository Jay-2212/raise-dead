# Credits

Every third-party asset or code used in Raise Dead, with source, author and license.

## Fonts

| Font | Author | License | Source |
|---|---|---|---|
| Cinzel Variable (400–900) | Natanael Gama / The Cinzel Project Authors | SIL OFL 1.1 | https://github.com/NDISCOVER/Cinzel (self-hosted WOFF2 subset in `public/assets/fonts/Cinzel-VariableFont_wght.woff2`; `OFL-Cinzel.txt` included) |
| Pixelify Sans Variable (400–700) | Stefie Justprince / The Pixelify Sans Project Authors | SIL OFL 1.1 | https://github.com/eifetx/Pixelify-Sans (self-hosted WOFF2 subset in `public/assets/fonts/PixelifySans-VariableFont_wght.woff2`; `OFL-PixelifySans.txt` included) |

## Code & Libraries

| Library | Version | Author | License | Purpose |
|---|---|---|---|---|
| Phaser | 3.90.0 | Phaser Studio | MIT | Game engine (main) |
| phaser3-rex-plugins | 1.80.20 | Rex Rainbow | MIT | Virtual joystick plugin |
| Vite | ^6.3.1 | Vite contributors | MIT | Build tool (dev only) |
| TypeScript | ~5.7 | Microsoft | Apache-2.0 | Language (dev only) |
| Clicky preset dialogue | — | Raise Dead team (Meta Muse Spark) | CC0 1.0 (project original) | 33-node conversation tree written with Meta Muse Spark (muse-spark-1.3-contributor) from a hand-authored outline, edited and stored in `public/data/clicky-presets.json` |

## Images (assets/images/vendor/)

| Folder | Asset | Author | License | Source | Shipped as |
|---|---|---|---|---|---|
| vendor/movicx-wizard/ | "Wizard sprite sheet" (walk/attack 4 directions, idle) | Movicx (modified) | CC-BY 3.0, modified | https://opengameart.org/content/wizard-sprite-sheet (file: https://opengameart.org/sites/default/files/mage_zip.zip) | `public/assets/images/wizard/*.png` — red glow removed, trim recoloured to teal by `scripts/strip-wizard-glow.py` |
| vendor/sollision-mage/ | "Mage Sprites (Idle and Walking)" | Sollision | CC0 | https://opengameart.org/content/mage-sprites-idle-and-walking (file: https://opengameart.org/sites/default/files/player_mage_sheet.png) | not shipped (Movicx wizard preferred) |
| vendor/kenney-particle-pack/ | Particle Pack 1.1 (80 transparent PNGs) | Kenney (kenney.nl) | CC0 | https://kenney.nl/assets/particle-pack | `public/assets/images/kenney/` (selected particles) |
| vendor/kenney-light-masks/ | Light Masks (17 selected transparent PNGs) | Kenney (kenney.nl) | CC0 | https://kenney.nl/assets/light-masks | `public/assets/images/kenney/` (selected masks) |
| vendor/kenney-smoke-particles/ | Smoke Particles, "White puff" set (25 PNGs) | Kenney (kenney.nl) | CC0 | https://kenney.nl/assets/smoke-particles | `public/assets/images/kenney/` (selected particles) |

**Required attribution (CC-BY 3.0):** "Wizard sprite by Movicx (opengameart.org/users/movicx), CC-BY 3.0, modified (red glow removed, trim recoloured to teal) — https://creativecommons.org/licenses/by/3.0/". 

All other images in `assets/images/` (world/, ui/, fx/, particles/, portraits/, backgrounds/) are original to this project: generated with an AI image model (TODO: confirm exact model name before submission) from our own prompts or drawn procedurally by script. They contain no third-party logos or screenshots; portrait medallions are generic tributes (motorbike racer, RSS newspaper, paperclip helper, retro media player, unmarked stone) and use no trademarks.

| Original (AI-generated or procedural) | Asset | Tool / Method | License |
|---|---|---|---|
| assets/images/clicky/ | clicky_sheet.png (188×92 spritesheet, 4 frames, mint ghost paperclip) | AI image generation from project prompt, downscaled and tiled by script | CC0 1.0 (project original) |
| assets/images/portraits/ | medal_clicky.png (256×256 medallion with Clicky) | AI image generation from project prompt | CC0 1.0 (project original) |

vendor/sollision-mage/player_mage_32x64_grid.png is our re-packed copy of the CC0 sheet onto a uniform grid.


## Audio (assets/audio/, assets/voice/)

Full per-file list (purpose, duration, loop, loudness, source, license, author) is in `assets/audio/MANIFEST.json`. Every file ships as `.ogg` + `.mp3`; all were trimmed, filtered, looped and/or loudness-normalized by us with ffmpeg/numpy.

| Files | Author | License | Source |
|---|---|---|---|
| audio/exorcism/wind_swell | Joseph Sardin / BigSoundBank + Raise Dead team | CC0 1.0 + CC0 1.0 (project original) | https://bigsoundbank.com/wind-s0595.html + Original synthesis for Raise Dead (numpy/scipy script) |
| audio/exorcism/ground_rumble | Raise Dead team + mieki256 + cinameng | CC0 1.0 (project original) + CC0 1.0 | Original synthesis for Raise Dead (numpy/scipy script) + https://opengameart.org/content/earthquake-and-open-sesame + https://opengameart.org/content/rumble-fx |
| audio/exorcism/chant_drone_loop | Raise Dead team + OwlishMedia | CC0 1.0 (project original) + CC0 1.0 | Original synthesis for Raise Dead (numpy/scipy script) + https://opengameart.org/content/creepy-incoherent-chanting |
| audio/exorcism/stone_crack_crumble | rubberduck + Raise Dead team | CC0 1.0 + CC0 1.0 (project original) | https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx + Original synthesis for Raise Dead (numpy/scipy script) |
| audio/exorcism/holy_light_burst | pyranostudios + Raise Dead team | CC0 1.0 + CC0 1.0 (project original) | https://opengameart.org/content/air-whoosh + Original synthesis for Raise Dead (numpy/scipy script) |
| audio/exorcism/app_sink | Raise Dead team + rubberduck | CC0 1.0 (project original) + CC0 1.0 | Original synthesis for Raise Dead (numpy/scipy script) + https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx |
| audio/ambient/wind_howl_loop | Joseph Sardin / BigSoundBank | CC0 1.0 | https://bigsoundbank.com/wind-s0595.html |
| audio/ambient/wind_whistle_loop | Joseph Sardin / BigSoundBank | CC0 1.0 | https://bigsoundbank.com/whistling-of-the-wind-1-s0147.html |
| audio/ambient/night_crickets_loop | Wolfgang_ | CC0 1.0 | https://opengameart.org/content/crickets-ambient-noise-loopable |
| audio/ambient/ghost_whispers_loop | qubodup (sounds from Independent.nu ljudbank) | CC0 1.0 | https://opengameart.org/content/4-atmospheric-ghostly-loops |
| audio/ambient/ghost_moans_drone_loop | Paul Wortmann | CC0 1.0 | https://opengameart.org/content/dark-cavern-ambient |
| audio/ambient/owl_hoot_01 | Joseph Sardin / BigSoundBank | CC0 1.0 | https://bigsoundbank.com/tawny-owl-1-s1763.html |
| audio/ambient/owl_hoot_02 | Joseph Sardin / BigSoundBank | CC0 1.0 | https://bigsoundbank.com/owls-s0429.html |
| audio/ambient/crows_distant_01 | IgnasD (crystalgames.space) | CC0 1.0 | https://opengameart.org/content/crows-singing |
| audio/ambient/crow_caw_02 | zeroisnotnull | CC0 1.0 | https://opengameart.org/content/crow-caw |
| audio/ambient/ (ghost_moan_01, ghost_moan_02, ghost_moan_03, ghost_moan_04, ghost_moan_05) | qubodup | CC0 1.0 | https://opengameart.org/content/ghost-monster-voice-moaning-growling |
| audio/ambient/ghost_breath | qubodup | CC0 1.0 | https://opengameart.org/content/ghost-breath |
| audio/ambient/tree_creak_01 | AntumDeluge (from Department64) | CC0 1.0 | https://opengameart.org/content/tree-creaking |
| audio/ambient/gate_creak_01 | DenisChardonnet / BigSoundBank | CC0 1.0 | https://bigsoundbank.com/grinding-metal-gate-1-s0303.html |
| audio/ambient/gate_creak_02 | DenisChardonnet / BigSoundBank | CC0 1.0 | https://bigsoundbank.com/grinding-metal-gate-2-s0304.html |
| audio/ambient/gate_creak_long | Joseph Sardin / BigSoundBank | CC0 1.0 | https://bigsoundbank.com/grinding-metal-gate-s0683.html |
| audio/music/moonlit_lullaby_loop | Tsorthan Grove | CC0 1.0 | https://opengameart.org/content/moonlit-lullaby-for-the-lost |
| audio/music/title_musicbox_spooky_waltz, audio/music/musicbox_sad_tune | Aureolus_Omicron | CC0 1.0 | https://opengameart.org/content/4-music-box-tracks |
| audio/footsteps/ (dirt_01, dirt_02, dirt_03, dirt_04, dirt_05, dirt_06, dirt_07, dirt_08) | congusbongus (from 'footstep-grass.wav' by swuing), modified | CC-BY 3.0, modified | https://opengameart.org/content/footsteps-on-different-surfaces (grass set, derived from https://freesound.org/people/swuing/sounds/38874/), trimmed and normalised — https://creativecommons.org/licenses/by/3.0/ |
| audio/footsteps/ (gravel_01, gravel_02, gravel_03, gravel_04, gravel_05, gravel_06, gravel_07, gravel_08) | congusbongus (from Ali_6868) | CC0 1.0 | https://opengameart.org/content/footsteps-on-different-surfaces (gravel set, derived from https://freesound.org/people/Ali_6868/packs/21608/) |
| audio/footsteps/ (soil_soft_01, soil_soft_02, soil_soft_03, soil_soft_04, soil_soft_05, soil_soft_06) | Kenney (kenney.nl) | CC0 1.0 | https://opengameart.org/content/50-rpg-sound-effects (Kenney RPG Audio) |
| audio/footsteps/mud_01 | TinyWorlds | CC0 1.0 | https://opengameart.org/content/different-steps-on-wood-stone-leaves-gravel-and-mud |
| audio/leaves/ (leaves_rustle_01, leaves_rustle_02, leaves_rustle_03, leaves_rustle_04, leaves_rustle_05, leaves_rustle_06) | qubodup | CC0 1.0 | https://opengameart.org/content/20-rustles-dry-leaves |
| audio/leaves/wind_through_leaves_loop | Joseph Sardin / BigSoundBank | CC0 1.0 | https://bigsoundbank.com/strong-wind-4-s0154.html |
| audio/ui/ (hover, hover_alt, select, confirm, back, error, open_panel, close_panel) | Kenney (kenney.nl) | CC0 1.0 | https://opengameart.org/content/interface-sounds (Kenney Interface Sounds) |
| voice/ (incant_roadrash, incant_googlereader, incant_clippy, incant_winamp, incant_unmarked, incant_generic, farewell_requiescat) | Raise Dead team | CC0 1.0 (project original; TTS output, original script) | Synthesized with Piper TTS (https://github.com/OHF-Voice/piper1-gpl) using voice en_US-norman-medium (https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/norman/medium; TODO: re-check en_US-norman-medium licence on Hugging Face before submission; trained on public-domain LibriVox recordings, dataset license: public domain per MODEL_CARD); pitch-down, sub-octave double and hall reverb via ffmpeg rubberband + numpy convolution |
| exorcism/ (wind_swell, ground_rumble, chant_drone_loop, rune_sparkles, rune_sparkle_short, stone_crack_crumble, holy_light_burst, choir_aah, app_open_shimmer, app_sink, rip_bell_toll), ui/prompt_press_f, ui/ritual_confirm | Raise Dead team (original synthesis; some layered with the CC0 recordings listed above: BigSoundBank wind, mieki256 earthquake, cinameng rumble, rubberduck rocks, pyranostudios whoosh, OwlishMedia chants) | CC0 1.0 (our synthesis) + CC0 sources | original synthesis script (not in repo) |

**Required attribution (CC-BY 3.0):** "Footstep sounds (dirt) by congusbongus, from 'footstep-grass.wav' by swuing (freesound.org), CC-BY 3.0, modified (trimmed, normalised) — https://creativecommons.org/licenses/by/3.0/". Put this line in the in-game credits/README. Everything else in audio is CC0 (credit given as courtesy: Kenney, BigSoundBank/Joseph Sardin, qubodup, Tsorthan Grove, Aureolus_Omicron, IgnasD, Wolfgang_, and the others above).

**Voice lines (assets/voice/):** our own original incantation scripts, synthesized with Piper TTS (https://github.com/OHF-Voice/piper1-gpl, GPL-3.0 — used only as an offline tool; no Piper code is in the repo) using the voice model `en_US-norman-medium` (https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/norman/medium), whose model card lists its training data as public-domain LibriVox recordings. Processed with ffmpeg (rubberband pitch-down, sub-octave double) and numpy convolution reverb. Subtitles/scripts: `assets/voice/voice_lines.json`. We release the voice files as CC0.


## Trademark Disclaimer

Road Rash, Google Reader, Clippy, Winamp and other product names referenced in Raise Dead are trademarks of their respective owners. Raise Dead is an unofficial fan tribute, not affiliated with or endorsed by them. No original logos, art or code from the trademarked products are used in this project. All tribute implementations are built from permissively-licensed open-source code and original/generated art.


## Night 3 additions

| Asset | Author | License | Source |
|---|---|---|---|
| Star Cadet (3D Pinball Space Cadet remake) | Rich Dubbs | MIT | https://github.com/richdubbs/star-cadet — vendored in `public/games/space-cadet` (includes three.js 0.160.0, MIT) |
| Pipes (3D Pipes screensaver remake) | 1j01 | MIT | https://github.com/1j01/pipes — vendored in `public/games/pipes` |
| medal_spacecadet.png, medal_pipes.png | Hark (Raise Dead team) | CC0 1.0 (project original) | AI-generated medallion images for Raise Dead graveyard |
| public/games/muse/ (Road Rash and Winamp tributes) | Meta Muse Spark (muse-spark-1.3-contributor) | CC0 1.0 (project original) | AI-generated playable tributes written for Raise Dead; original shapes-only art |
| Unmarked Grave games (public/games/unmarked/) | Meta Muse Spark (muse-spark-1.3-contributor) | CC0 1.0 (project original) | AI-generated on-demand playable tributes for any dead app; original shapes-only art; cached in D1; served sandboxed |
