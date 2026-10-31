#!/usr/bin/env python3
"""
Downscale particle PNG images to reduce load size.
- Kenney 512px particles → 128px (spark, smoke, etc.)
- rune_circle_add 512px → 256px
- holy_light_burst 1024px → 512px

Resizing is done with high-quality downsampling (LANCZOS).
"""

from PIL import Image
import os

# Define downscale operations: (source_path, new_size)
downscales = [
    ('/workspace/raise-dead/public/assets/images/kenney/spark_01.png', 128),
    ('/workspace/raise-dead/public/assets/images/kenney/smoke_04.png', 128),
    ('/workspace/raise-dead/public/assets/images/fx/rune_circle_add.png', 256),
    ('/workspace/raise-dead/public/assets/images/fx/holy_light_burst.png', 512),
]

print("=== Downscaling Particle Images ===\n")

total_before = 0
total_after = 0

for path, new_size in downscales:
    if not os.path.exists(path):
        print(f"SKIP: {path} (not found)")
        continue
    
    # Get original size
    before_size = os.path.getsize(path)
    img = Image.open(path)
    orig_size = img.size
    
    print(f"Downscaling {os.path.basename(path)}: {orig_size[0]}×{orig_size[1]} → {new_size}×{new_size}")
    print(f"  Before: {before_size / 1024:.1f} KiB")
    
    # Downscale with high-quality filtering
    img_scaled = img.resize((new_size, new_size), Image.Resampling.LANCZOS)
    
    # Save back with optimization
    img_scaled.save(path, optimize=True, compress_level=9)
    
    after_size = os.path.getsize(path)
    reduction = 100 * (1 - after_size / before_size)
    print(f"  After:  {after_size / 1024:.1f} KiB (reduction: {reduction:.1f}%)\n")
    
    total_before += before_size
    total_after += after_size

print("=== Summary ===")
print(f"Total before: {total_before / 1024:.1f} KiB")
print(f"Total after:  {total_after / 1024:.1f} KiB")
if total_before > 0:
    reduction = 100 * (1 - total_after / total_before)
    print(f"Reduction:   {reduction:.1f}% ({total_before} -> {total_after} bytes)")
