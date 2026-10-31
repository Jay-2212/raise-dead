/**
 * AudioManager — thin wrapper around Phaser's SoundManager.
 * Handles mute toggle (M key, persisted to localStorage), ambient loops,
 * music tracks, footstep scheduling, and one-shot randoms.
 */
import Phaser from 'phaser';

const MUTE_KEY = 'rd_muted';

export type SurfaceType = 'grass' | 'gravel';

export class AudioManager {
  private scene: Phaser.Scene;
  private muted: boolean;

  private musicTrack: Phaser.Sound.BaseSound | null = null;
  private ambientLoops: Map<string, Phaser.Sound.BaseSound> = new Map();
  private footstepTimer = 0;
  private readonly FOOTSTEP_INTERVAL = 0.33; // seconds

  private randomShotTimer = 0;
  private randomShotInterval: number;
  private readonly randomOneShots = [
    'owl_hoot_01',
    'owl_hoot_02',
    'crows_distant_01',
    'tree_creak_01',
    'gate_creak_01',
  ];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.muted = localStorage.getItem(MUTE_KEY) === '1';
    this.randomShotInterval = Phaser.Math.Between(12000, 35000);
  }

  // ─── Mute ─────────────────────────────────────────────────────────────────

  get isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): void {
    this.muted = !this.muted;
    localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
    this.scene.sound.mute = this.muted;
  }

  applyMuteState(): void {
    this.scene.sound.mute = this.muted;
  }

  // ─── Music ────────────────────────────────────────────────────────────────

  playMusic(key: string, volume = 0.35): void {
    if (this.musicTrack) {
      this.musicTrack.destroy();
    }
    this.musicTrack = this.scene.sound.add(key, { loop: true, volume });
    this.musicTrack.play();
  }

  stopMusic(fadeDuration = 800): void {
    if (!this.musicTrack) return;
    const track = this.musicTrack;
    if (fadeDuration > 0 && 'setVolume' in track) {
      this.scene.tweens.add({
        targets: track,
        volume: 0,
        duration: fadeDuration,
        onComplete: () => track.destroy(),
      });
    } else {
      track.destroy();
    }
    this.musicTrack = null;
  }

  duckMusic(targetVol: number, duration = 800): void {
    if (!this.musicTrack || !('setVolume' in this.musicTrack)) return;
    this.scene.tweens.add({
      targets: this.musicTrack,
      volume: targetVol,
      duration,
    });
  }

  restoreMusic(targetVol = 0.35, duration = 800): void {
    this.duckMusic(targetVol, duration);
  }

  // ─── Ambient loops ────────────────────────────────────────────────────────

  startAmbientLoop(key: string, volume: number): void {
    if (this.ambientLoops.has(key)) return;
    const sound = this.scene.sound.add(key, { loop: true, volume });
    sound.play();
    this.ambientLoops.set(key, sound);
  }

  stopAmbientLoop(key: string, fadeDuration = 400): void {
    const sound = this.ambientLoops.get(key);
    if (!sound) return;
    if (fadeDuration > 0 && 'setVolume' in sound) {
      this.scene.tweens.add({
        targets: sound,
        volume: 0,
        duration: fadeDuration,
        onComplete: () => {
          sound.destroy();
          this.ambientLoops.delete(key);
        },
      });
    } else {
      sound.destroy();
      this.ambientLoops.delete(key);
    }
  }

  duckAmbient(targetVol: number, duration = 800): void {
    this.ambientLoops.forEach((sound) => {
      if ('setVolume' in sound) {
        this.scene.tweens.add({
          targets: sound,
          volume: targetVol,
          duration,
        });
      }
    });
  }

  restoreAmbient(duration = 800): void {
    const defaults: Record<string, number> = {
      wind_howl_loop: 0.3,
      night_crickets_loop: 0.25,
      ghost_whispers_loop: 0.12,
    };
    this.ambientLoops.forEach((sound, key) => {
      const vol = defaults[key] ?? 0.25;
      if ('setVolume' in sound) {
        this.scene.tweens.add({
          targets: sound,
          volume: vol,
          duration,
        });
      }
    });
  }

  // ─── One-shots ────────────────────────────────────────────────────────────

  playOneShot(key: string, volume = 0.5, detune = 0): void {
    this.scene.sound.play(key, { volume, detune });
  }

  // ─── Footsteps ────────────────────────────────────────────────────────────

  /** Call from update() with delta in ms and whether the wizard is moving */
  updateFootsteps(delta: number, moving: boolean, surface: SurfaceType): void {
    if (!moving) {
      this.footstepTimer = 0;
      return;
    }
    this.footstepTimer += delta / 1000;
    if (this.footstepTimer >= this.FOOTSTEP_INTERVAL) {
      this.footstepTimer = 0;
      const n = Phaser.Math.Between(1, 8);
      const key = surface === 'gravel' ? `gravel_0${n}` : `dirt_0${n}`;
      this.scene.sound.play(key, { volume: 0.35 });
    }
  }

  // ─── Random one-shot scheduler ───────────────────────────────────────────

  /** Call from update() with delta in ms */
  updateRandomShots(delta: number): void {
    this.randomShotTimer += delta;
    if (this.randomShotTimer >= this.randomShotInterval) {
      this.randomShotTimer = 0;
      this.randomShotInterval = Phaser.Math.Between(12000, 35000);
      const key = Phaser.Utils.Array.GetRandom(this.randomOneShots) as string;
      const vol = Phaser.Math.FloatBetween(0.3, 0.5);
      const detune = Phaser.Math.Between(-100, 100);
      this.scene.sound.play(key, { volume: vol, detune });
    }
  }
}
