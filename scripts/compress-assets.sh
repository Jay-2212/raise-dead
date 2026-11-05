#!/usr/bin/env bash
# One-off asset compression used in the Night 5 polish pass (already applied to public/).
# Re-running re-encodes lossy audio again, so only run it on fresh source files.
set -euo pipefail
cd "$(dirname "$0")/../public"
enc() { # file-without-ext sample-rate vorbis-q mp3-bitrate
  ffmpeg -v error -y -i "$1.ogg" -ac 1 -ar "$2" -c:a libvorbis -q:a "$3" /tmp/rd_o.ogg
  ffmpeg -v error -y -i "$1.ogg" -ac 1 -ar "$2" -c:a libmp3lame -b:a "$4" /tmp/rd_o.mp3
  mv /tmp/rd_o.ogg "$1.ogg"; mv /tmp/rd_o.mp3 "$1.mp3"
}
enc assets/audio/music/moonlit_lullaby_loop          32000  0 40k
enc assets/audio/music/title_musicbox_spooky_waltz   32000  0 40k
enc assets/audio/ambient/wind_howl_loop              24000 -1 32k
enc assets/audio/ambient/ghost_whispers_loop         24000 -1 32k
enc assets/audio/ambient/night_crickets_loop         32000  0 40k
# Rhythm grave track (stereo, beat chart unaffected: same duration)
ffmpeg -v error -y -i games/rhythm/danse_macabre.ogg -ac 2 -c:a libvorbis -q:a 1 /tmp/rd_dm.ogg
ffmpeg -v error -y -i games/rhythm/danse_macabre.mp3 -c:a libmp3lame -b:a 96k /tmp/rd_dm.mp3
mv /tmp/rd_dm.ogg games/rhythm/danse_macabre.ogg; mv /tmp/rd_dm.mp3 games/rhythm/danse_macabre.mp3
# PNG: palette quantisation (visually identical at game scale)
pngquant --quality=70-95 --speed 1 --strip --skip-if-larger --force --ext .png \
  assets/images/portraits/*.png assets/images/ui/frame_panel.png assets/images/ui/vignette_moonlit.png \
  assets/images/fx/holy_light_burst.png assets/images/fx/rune_circle.png assets/images/fx/rune_circle_add.png \
  assets/images/world/ground_grass.png games/pipes/images/textures/rusty.png || true
# Title key art: progressive JPEG q80
python3 -c "from PIL import Image; Image.open('assets/images/backgrounds/title_keyart.jpg').save('assets/images/backgrounds/title_keyart.jpg', quality=80, optimize=True, progressive=True)"
# README screencap for 3D Pipes (never loaded by the game)
gifsicle -O3 --resize-width 480 --colors 96 games/pipes/images/meta/screencap.gif -o /tmp/rd_sc.gif && mv /tmp/rd_sc.gif games/pipes/images/meta/screencap.gif
