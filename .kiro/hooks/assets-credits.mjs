#!/usr/bin/env node
/**
 * assets-credits.mjs
 *
 * Scans public/assets/** for every file and checks that CREDITS.md contains
 * at least one line mentioning that file's basename (or a glob pattern that
 * covers it).  Exits 1 with a list of uncredited files if any are found.
 *
 * Triggered automatically by the assets-credits Kiro hook on file changes
 * under public/assets/.  Can also be run manually:
 *   node .kiro/hooks/assets-credits.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const ASSETS_DIR = join(REPO_ROOT, 'public', 'assets');
const CREDITS_FILE = join(REPO_ROOT, 'CREDITS.md');

// File extensions we care about (skip .DS_Store, .gitkeep, etc.)
const TRACKED_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif',
  '.mp3', '.ogg', '.wav', '.webm', '.flac',
  '.woff', '.woff2', '.ttf', '.otf',
  '.json', '.wsz',
]);

/** Recursively collect all tracked files under a directory. */
function collectFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectFiles(full));
    } else {
      const ext = entry.slice(entry.lastIndexOf('.')).toLowerCase();
      if (TRACKED_EXTS.has(ext)) results.push(full);
    }
  }
  return results;
}

/** Return true if CREDITS.md contains a line mentioning the filename or its stem. */
function isCredited(filePath, creditsContent) {
  const name = basename(filePath);
  const stem = name.slice(0, name.lastIndexOf('.')) || name;
  // Check for the filename or its stem
  return creditsContent.includes(name) || creditsContent.includes(stem);
}

// ── Main ────────────────────────────────────────────────────────────────────

if (!existsSync(CREDITS_FILE)) {
  console.error('❌  CREDITS.md not found at repo root. Create it before adding assets.');
  process.exit(1);
}

const creditsContent = readFileSync(CREDITS_FILE, 'utf8');
const assetFiles = collectFiles(ASSETS_DIR);

if (assetFiles.length === 0) {
  console.log('✅  No tracked asset files found under public/assets/ — nothing to check.');
  process.exit(0);
}

const uncredited = assetFiles.filter((f) => !isCredited(f, creditsContent));

if (uncredited.length === 0) {
  console.log(`✅  All ${assetFiles.length} asset file(s) have a matching entry in CREDITS.md.`);
  process.exit(0);
} else {
  console.error(`\n❌  ${uncredited.length} asset file(s) are missing from CREDITS.md:\n`);
  for (const f of uncredited) {
    console.error(`   • ${relative(REPO_ROOT, f)}`);
  }
  console.error(`\nAdd an entry to CREDITS.md for each file listed above.`);
  console.error(`Format: <filename> | <author> | <licence> | <source URL>\n`);
  process.exit(1);
}
