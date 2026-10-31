#!/bin/bash
# Re-encode audio to lower bitrates for performance
# Music/ambient: mono Ogg -q:a 1 (~64 kbps), MP3 -b:a 64k
# SFX/voice: mono Ogg -q:a 0 (~48 kbps), MP3 -b:a 48k
# Encodes from masters in assets/ if present, otherwise from current public/ file

set -e

FFMPEG="/usr/bin/ffmpeg"
if [ ! -x "$FFMPEG" ]; then
    echo "ffmpeg not found at $FFMPEG"
    exit 1
fi

TOTAL_BEFORE=0
TOTAL_AFTER=0

# Function to get file size in bytes
get_size() {
    stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null || du -b "$1" | awk '{print $1}'
}

# Function to re-encode a single file
reencode_file() {
    local source_file="$1"
    local dest_file="$2"
    local bitrate_ogg="$3"
    local bitrate_mp3="$4"
    
    if [ ! -f "$source_file" ]; then
        return
    fi
    
    local source_size=$(get_size "$source_file")
    
    # OGG Vorbis
    if [[ "$dest_file" == *.ogg ]]; then
        echo "Re-encoding: $dest_file (Ogg -q:a $bitrate_ogg)"
        "$FFMPEG" -i "$source_file" -acodec libvorbis -q:a "$bitrate_ogg" -ac 1 -y "$dest_file" 2>/dev/null
    fi
    
    # MP3
    if [[ "$dest_file" == *.mp3 ]]; then
        echo "Re-encoding: $dest_file (MP3 -b:a $bitrate_mp3)"
        "$FFMPEG" -i "$source_file" -acodec libmp3lame -b:a "$bitrate_mp3" -ac 1 -y "$dest_file" 2>/dev/null
    fi
    
    local dest_size=$(get_size "$dest_file")
    echo "  Before: $(numfmt --to=iec-i --suffix=B $source_size 2>/dev/null || echo ${source_size} bytes), After: $(numfmt --to=iec-i --suffix=B $dest_size 2>/dev/null || echo ${dest_size} bytes)"
    
    TOTAL_BEFORE=$((TOTAL_BEFORE + source_size))
    TOTAL_AFTER=$((TOTAL_AFTER + dest_size))
}

echo "=== Audio Re-encoding ==="
echo ""
echo "Re-encoding music and ambient loops (Ogg -q:a 1, MP3 -b:a 64k)"

# Music: try masters first, fall back to current file
for dest_file in /workspace/raise-dead/public/assets/audio/music/*.ogg; do
    [ -f "$dest_file" ] || continue
    basename=$(basename "$dest_file" .ogg)
    source_file="/workspace/raise-dead/assets/audio/music/$basename.ogg"
    [ ! -f "$source_file" ] && source_file="$dest_file"
    reencode_file "$source_file" "$dest_file" 1 64
done

for dest_file in /workspace/raise-dead/public/assets/audio/music/*.mp3; do
    [ -f "$dest_file" ] || continue
    basename=$(basename "$dest_file" .mp3)
    source_file="/workspace/raise-dead/assets/audio/music/$basename.mp3"
    [ ! -f "$source_file" ] && source_file="/workspace/raise-dead/assets/audio/music/$basename.ogg"
    [ ! -f "$source_file" ] && source_file="$dest_file"
    reencode_file "$source_file" "$dest_file" 1 64
done

# Ambient: try masters first, fall back to current file
for dest_file in /workspace/raise-dead/public/assets/audio/ambient/*.ogg; do
    [ -f "$dest_file" ] || continue
    basename=$(basename "$dest_file" .ogg)
    source_file="/workspace/raise-dead/assets/audio/ambient/$basename.ogg"
    [ ! -f "$source_file" ] && source_file="$dest_file"
    reencode_file "$source_file" "$dest_file" 1 64
done

for dest_file in /workspace/raise-dead/public/assets/audio/ambient/*.mp3; do
    [ -f "$dest_file" ] || continue
    basename=$(basename "$dest_file" .mp3)
    source_file="/workspace/raise-dead/assets/audio/ambient/$basename.mp3"
    [ ! -f "$source_file" ] && source_file="/workspace/raise-dead/assets/audio/ambient/$basename.ogg"
    [ ! -f "$source_file" ] && source_file="$dest_file"
    reencode_file "$source_file" "$dest_file" 1 64
done

echo ""
echo "Re-encoding SFX (Ogg -q:a 0, MP3 -b:a 48k)"

# Footsteps
for dest_file in /workspace/raise-dead/public/assets/audio/footsteps/*.ogg; do
    [ -f "$dest_file" ] || continue
    basename=$(basename "$dest_file" .ogg)
    source_file="/workspace/raise-dead/assets/audio/footsteps/$basename.ogg"
    [ ! -f "$source_file" ] && source_file="$dest_file"
    reencode_file "$source_file" "$dest_file" 0 48
done

for dest_file in /workspace/raise-dead/public/assets/audio/footsteps/*.mp3; do
    [ -f "$dest_file" ] || continue
    basename=$(basename "$dest_file" .mp3)
    source_file="/workspace/raise-dead/assets/audio/footsteps/$basename.mp3"
    [ ! -f "$source_file" ] && source_file="/workspace/raise-dead/assets/audio/footsteps/$basename.ogg"
    [ ! -f "$source_file" ] && source_file="$dest_file"
    reencode_file "$source_file" "$dest_file" 0 48
done

# Exorcism/ritual SFX
for dest_file in /workspace/raise-dead/public/assets/audio/exorcism/*.ogg; do
    [ -f "$dest_file" ] || continue
    basename=$(basename "$dest_file" .ogg)
    source_file="/workspace/raise-dead/assets/audio/exorcism/$basename.ogg"
    [ ! -f "$source_file" ] && source_file="$dest_file"
    reencode_file "$source_file" "$dest_file" 0 48
done

for dest_file in /workspace/raise-dead/public/assets/audio/exorcism/*.mp3; do
    [ -f "$dest_file" ] || continue
    basename=$(basename "$dest_file" .mp3)
    source_file="/workspace/raise-dead/assets/audio/exorcism/$basename.mp3"
    [ ! -f "$source_file" ] && source_file="/workspace/raise-dead/assets/audio/exorcism/$basename.ogg"
    [ ! -f "$source_file" ] && source_file="$dest_file"
    reencode_file "$source_file" "$dest_file" 0 48
done

# UI SFX
for dest_file in /workspace/raise-dead/public/assets/audio/ui/*.ogg; do
    [ -f "$dest_file" ] || continue
    basename=$(basename "$dest_file" .ogg)
    source_file="/workspace/raise-dead/assets/audio/ui/$basename.ogg"
    [ ! -f "$source_file" ] && source_file="$dest_file"
    reencode_file "$source_file" "$dest_file" 0 48
done

for dest_file in /workspace/raise-dead/public/assets/audio/ui/*.mp3; do
    [ -f "$dest_file" ] || continue
    basename=$(basename "$dest_file" .mp3)
    source_file="/workspace/raise-dead/assets/audio/ui/$basename.mp3"
    [ ! -f "$source_file" ] && source_file="/workspace/raise-dead/assets/audio/ui/$basename.ogg"
    [ ! -f "$source_file" ] && source_file="$dest_file"
    reencode_file "$source_file" "$dest_file" 0 48
done

echo ""
echo "Re-encoding voice (Ogg -q:a 0, MP3 -b:a 48k)"

# Voice
for dest_file in /workspace/raise-dead/public/assets/voice/*.ogg; do
    [ -f "$dest_file" ] || continue
    basename=$(basename "$dest_file" .ogg)
    source_file="/workspace/raise-dead/assets/voice/$basename.ogg"
    [ ! -f "$source_file" ] && source_file="$dest_file"
    reencode_file "$source_file" "$dest_file" 0 48
done

for dest_file in /workspace/raise-dead/public/assets/voice/*.mp3; do
    [ -f "$dest_file" ] || continue
    basename=$(basename "$dest_file" .mp3)
    source_file="/workspace/raise-dead/assets/voice/$basename.mp3"
    [ ! -f "$source_file" ] && source_file="/workspace/raise-dead/assets/voice/$basename.ogg"
    [ ! -f "$source_file" ] && source_file="$dest_file"
    reencode_file "$source_file" "$dest_file" 0 48
done

echo ""
echo "=== Summary ==="
echo "Total size before: $(numfmt --to=iec-i --suffix=B $TOTAL_BEFORE 2>/dev/null || echo ${TOTAL_BEFORE} bytes)"
echo "Total size after:  $(numfmt --to=iec-i --suffix=B $TOTAL_AFTER 2>/dev/null || echo ${TOTAL_AFTER} bytes)"
if [ $TOTAL_BEFORE -gt 0 ]; then
    PERCENT=$((100 * TOTAL_AFTER / TOTAL_BEFORE))
    echo "Reduction: $((100 - PERCENT))% ($TOTAL_BEFORE -> $TOTAL_AFTER bytes)"
fi
