/**
 * Mixer — two volume buses (Music, Effects) on top of Phaser's WebAudio sound manager.
 *
 *  - Every sound created through game.sound.add / play is routed to the music bus when its key is
 *    a music track, otherwise to the effects bus (SFX + ambience + voices).
 *  - Levels are 0..1, default 0.7, saved in localStorage (rd_vol_music / rd_vol_fx).
 *  - Gain follows an audio taper (level²) under a lowered master, so 70% sits around -8 dB:
 *    the game used to be too loud at its old fixed volumes.
 *  - A sound whose key is not in the cache yet (deferred assets still loading) plays silence
 *    instead of throwing.
 *  - unlock() resumes the AudioContext inside a user gesture; it never throws and never blocks.
 */
import Phaser from 'phaser';

export type Bus = 'music' | 'fx';

const MASTER = 0.85;
const DEFAULT_LEVEL = 0.7;
const STORE: Record<Bus, string> = { music: 'rd_vol_music', fx: 'rd_vol_fx' };
const MUSIC_KEYS = new Set(['title_waltz', 'moonlit_lullaby', 'chant_drone_loop']);
export const SILENCE_KEY = '__rd_silence';

type AnyManager = Phaser.Sound.BaseSoundManager & {
  context?: AudioContext;
  destination?: AudioNode;
  add: (key: string, config?: Phaser.Types.Sound.SoundConfig) => Phaser.Sound.BaseSound;
};
type NodeSound = { pannerNode?: AudioNode | null; spatialNode?: AudioNode | null; volumeNode?: AudioNode | null };

const levels: Record<Bus, number> = { music: DEFAULT_LEVEL, fx: DEFAULT_LEVEL };
const buses: Partial<Record<Bus, GainNode>> = {};
let manager: AnyManager | null = null;
const listeners = new Set<(bus: Bus, level: number) => void>();

function readLevel(bus: Bus): number {
  try {
    const raw = localStorage.getItem(STORE[bus]);
    if (raw === null) return DEFAULT_LEVEL;
    const v = Number(raw);
    return Number.isFinite(v) ? Phaser.Math.Clamp(v, 0, 1) : DEFAULT_LEVEL;
  } catch {
    return DEFAULT_LEVEL;
  }
}

const gainFor = (level: number): number => level * level;

function apply(bus: Bus): void {
  const node = buses[bus];
  if (node && manager?.context) {
    node.gain.setTargetAtTime(gainFor(levels[bus]), manager.context.currentTime, 0.03);
  } else if (manager && !manager.context) {
    // HTML5 Audio fallback: no buses, so one master volume follows the effects level
    manager.volume = MASTER * gainFor(Math.max(levels.fx, levels.music));
  }
}

/** Install once, right after the Phaser.Game exists (BootScene). Safe to call again. */
export function installMixer(game: Phaser.Game): void {
  const mgr = game.sound as AnyManager;
  if (manager === mgr) return;
  manager = mgr;
  levels.music = readLevel('music');
  levels.fx = readLevel('fx');

  const ctx = mgr.context;
  if (!ctx || !mgr.destination) {
    apply('fx');
    return;
  }
  mgr.volume = MASTER;
  for (const bus of ['music', 'fx'] as Bus[]) {
    const g = ctx.createGain();
    g.gain.value = gainFor(levels[bus]);
    g.connect(mgr.destination);
    buses[bus] = g;
  }
  if (!game.cache.audio.exists(SILENCE_KEY)) {
    game.cache.audio.add(SILENCE_KEY, ctx.createBuffer(1, 1, 22050));
  }

  const origAdd = mgr.add.bind(mgr);
  mgr.add = (key: string, config?: Phaser.Types.Sound.SoundConfig) => {
    const known = game.cache.audio.exists(key);
    const sound = origAdd(known ? key : SILENCE_KEY, config);
    const s = sound as unknown as NodeSound;
    const out = s.pannerNode ?? s.spatialNode ?? s.volumeNode;
    const bus = buses[MUSIC_KEYS.has(key) ? 'music' : 'fx'];
    if (out && bus) {
      try {
        out.disconnect();
        out.connect(bus);
      } catch { /* leave Phaser's default routing */ }
    }
    return sound;
  };
}

export function getLevel(bus: Bus): number {
  return levels[bus];
}

export function setLevel(bus: Bus, level: number): void {
  levels[bus] = Phaser.Math.Clamp(level, 0, 1);
  try { localStorage.setItem(STORE[bus], levels[bus].toFixed(2)); } catch { /* private mode */ }
  apply(bus);
  listeners.forEach((fn) => fn(bus, levels[bus]));
}

export function onLevelChange(fn: (bus: Bus, level: number) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Resume audio inside a user gesture. Fire-and-forget: entry never waits on it. */
export function unlockAudio(): void {
  const ctx = manager?.context;
  if (!ctx || ctx.state === 'running') return;
  try {
    const p = ctx.resume();
    if (p && typeof p.catch === 'function') p.catch(() => { /* stays silent, game still runs */ });
  } catch { /* ignore */ }
}
