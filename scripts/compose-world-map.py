#!/usr/bin/env python3
# K12: compose the baked passes from scripts/bake-world-map.mjs into the map image.
# Softens the repeating grass tile into a meadow (blur + keep part of the detail), adds a soft drop
# shadow of every object onto the grass, a light contrast/colour lift. Needs numpy + Pillow.
# Usage: python3 scripts/compose-world-map.py <prefix> [blur=3.5] [keep=0.30] [noise=0]
import json, sys, numpy as np
from PIL import Image, ImageFilter, ImageEnhance
B = sys.argv[1] if len(sys.argv) > 1 else 'w'
BLUR = float(sys.argv[2]) if len(sys.argv) > 2 else 1.4
mean = np.array(json.load(open(f'{B}_mean.json')), dtype=np.float32)
grass = Image.open(f'{B}_grass.png').convert('RGB')
nog = np.asarray(Image.open(f'{B}_nograss.png').convert('RGB')).astype(np.float32)
# soften the repeating grass tile so it reads as a meadow instead of a lattice
g0 = np.asarray(grass).astype(np.float32)
gb = np.asarray(grass.filter(ImageFilter.GaussianBlur(BLUR))).astype(np.float32)
KEEP = float(sys.argv[3]) if len(sys.argv) > 3 else 0.45
gs = KEEP * g0 + (1 - KEEP) * gb
rng = np.random.default_rng(7)
noise = Image.fromarray((rng.random((90, 120)) * 255).astype(np.uint8)).resize((1200, 900), Image.BICUBIC).filter(ImageFilter.GaussianBlur(18))
n = np.asarray(noise).astype(np.float32) / 255.0
n = (n - n.mean()) / (n.std() + 1e-6)
NAMP = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0
gs = gs * (1.0 + NAMP * n[..., None])
# a touch greener/brighter grass so it is clearly grass at minimap size
gs = gs * np.array([0.96, 1.07, 1.0], dtype=np.float32) * 1.0
# mask: where the no-grass pass shows the key colour
d = np.abs(nog - mean).max(axis=2)
m = (d <= 4).astype(np.float32)
m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32)[..., None] / 255.0
# fringe pixels: remove the key colour contribution approximately and add smoothed grass back
fg = nog * 1.06
# K12: soft drop shadow of every object (trees, stones, paths, pumpkins) onto the grass so the
# art separates from the meadow at map scale
obj = Image.fromarray(((1 - m[..., 0]) * 255).astype(np.uint8))
sh = Image.new('L', obj.size, 0); sh.paste(obj, (2, 3))
sh = np.asarray(sh.filter(ImageFilter.GaussianBlur(2.2))).astype(np.float32)[..., None] / 255.0
gs = gs * (1 - 0.5 * sh)
out = m * gs + (1 - m) * fg
out = np.clip(out, 0, 255).astype(np.uint8)
im = Image.fromarray(out)
im = ImageEnhance.Contrast(im).enhance(1.10)
im = ImageEnhance.Color(im).enhance(1.12)
im.save(f'{B}_composed.png')
print('ok')
