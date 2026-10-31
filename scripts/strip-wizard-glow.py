#!/usr/bin/env python3
"""
strip-wizard-glow.py — removes red glow from wizard sprites and recolors red trim to teal.

Process:
1. Load original wizard sheets from assets/images/vendor/movicx-wizard/
2. For each file:
   - Clear pixels where alpha < 255 and r > 150 and g < 110 and b < 110 (the semi-transparent red glow)
   - Hue-shift remaining opaque red trim (r > 150, g < 110, b < 110) to the teal palette #7fd1d8
3. Write cleaned copies to public/assets/images/wizard/
4. Report stats (pixels changed per file)
"""

import os
from pathlib import Path
from PIL import Image
import colorsys

def rgb_to_hsv(r, g, b):
    """Convert RGB to HSV (0-1 range)."""
    return colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)

def hsv_to_rgb(h, s, v):
    """Convert HSV (0-1 range) to RGB."""
    r, g, b = colorsys.hsv_to_rgb(h, s, v)
    return int(r * 255), int(g * 255), int(b * 255)

def get_brightness(r, g, b):
    """Get brightness (V in HSV)."""
    return max(r, g, b) / 255.0

def is_red_hue(r, g, b):
    """Check if pixel is red-ish (r > 150, g < 110, b < 110)."""
    return r > 150 and g < 110 and b < 110

def process_wizard_sheet(input_path, output_path):
    """
    Process a wizard sheet:
    1. Clear semi-transparent red glow
    2. Hue-shift opaque red trim to teal (#7fd1d8)
    """
    img = Image.open(input_path).convert('RGBA')
    pixels = img.load()
    width, height = img.size
    
    glow_cleared = 0
    trim_recolored = 0
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Skip fully transparent pixels
            if a == 0:
                continue
            
            # Step 1: Clear semi-transparent red glow (alpha < 255 and red-ish)
            if a < 255 and is_red_hue(r, g, b):
                pixels[x, y] = (0, 0, 0, 0)
                glow_cleared += 1
                continue
            
            # Step 2: Hue-shift opaque red trim (alpha >= 255 and red-ish)
            if a >= 255 and is_red_hue(r, g, b):
                # Get brightness of the original red
                brightness = get_brightness(r, g, b)
                
                # Target teal color: #7fd1d8
                target_r, target_g, target_b = 0x7f, 0xd1, 0xd8
                target_h, target_s, target_v = rgb_to_hsv(target_r, target_g, target_b)
                
                # Apply original brightness to target hue/saturation
                new_r, new_g, new_b = hsv_to_rgb(target_h, target_s, brightness)
                pixels[x, y] = (new_r, new_g, new_b, a)
                trim_recolored += 1
    
    # Save the processed image
    img.save(output_path, 'PNG')
    return glow_cleared, trim_recolored

def main():
    # Paths
    vendor_dir = Path('/workspace/raise-dead/assets/images/vendor/movicx-wizard')
    output_dir = Path('/workspace/raise-dead/public/assets/images/wizard')
    
    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Files to process
    wizard_files = [
        'mage_idle.png',
        'attack_front.png',
        'attack_left.png',
        'attack_right.png',
        'attack_behind.png',
        'walk_down.png',
        'walk_left.png',
        'walk_up.png',
        'walk_right.png',
    ]
    
    print('Processing wizard sprites...')
    print('=' * 60)
    
    total_glow_cleared = 0
    total_trim_recolored = 0
    
    for filename in wizard_files:
        input_path = vendor_dir / filename
        output_path = output_dir / filename
        
        if not input_path.exists():
            print(f'[SKIP] {filename} — not found in {vendor_dir}')
            continue
        
        glow_cleared, trim_recolored = process_wizard_sheet(input_path, output_path)
        total_glow_cleared += glow_cleared
        total_trim_recolored += trim_recolored
        
        print(f'{filename:25} | glow cleared: {glow_cleared:5d} px | trim recolored: {trim_recolored:5d} px')
    
    print('=' * 60)
    print(f'Total glow pixels cleared: {total_glow_cleared}')
    print(f'Total trim pixels recolored: {total_trim_recolored}')
    print(f'\nWizard sprites processed to: {output_dir}')
    print('✓ Red glow removed, trim recolored to teal #7fd1d8')

if __name__ == '__main__':
    main()
