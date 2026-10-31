/**
 * ResurrectionRitual — additive scene launched over GraveyardWorld.
 * Plays the full ritual timeline (cast → voice → shake → crack → light burst → overlay).
 */
import Phaser from 'phaser';
import { RitualData } from '../types/ritual';
import { GraveEntry } from '../types/graves';
import { GraveOverlay } from '../ui/GraveOverlay';

interface VoiceLine {
  id: string;
  grave: string;
  subtitle: string;
  duration: number;
}

/** Map grave IDs to voice line / incantation keys */
const VOICE_KEY_MAP: Record<string, string> = {
  'road-rash':      'incant_roadrash',
  'google-reader':  'incant_googlereader',
  'clippy':         'incant_clippy',
  'winamp':         'incant_winamp',
  'unmarked-grave': 'incant_unmarked',
};

type RitualPhase = 'ritual' | 'overlay' | 'exiting';

export class ResurrectionRitual extends Phaser.Scene {
  private ritualData!: RitualData;
  private grave!: GraveEntry;
  private voiceLines!: VoiceLine[];

  private runeCircle!: Phaser.GameObjects.Image;
  private holyBurst!: Phaser.GameObjects.Image;
  private whiteFill!: Phaser.GameObjects.Rectangle;
  private subtitleBg!: Phaser.GameObjects.Rectangle;
  private subtitleText!: Phaser.GameObjects.Text;

  private chantLoop: Phaser.Sound.BaseSound | null = null;
  private voiceSound: Phaser.Sound.BaseSound | null = null;
  private incantationKey = '';

  // P1-2: Track emitters for cleanup
  private sparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private dustEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  private cancelled = false;
  private phase: RitualPhase = 'ritual';
  private overlay: GraveOverlay | null = null;
  private ritualDelays: Phaser.Time.TimerEvent[] = [];
  private ritualTweens: Phaser.Tweens.Tween[] = [];

  private escKey!: Phaser.Input.Keyboard.Key;
  private domEscHandler: ((e: KeyboardEvent) => void) | null = null;

  // Screen-space position of the grave (calculated from world position + camera)
  private graveScreenX = 0;
  private graveScreenY = 0;

  constructor() {
    super({ key: 'ResurrectionRitual' });
  }

  init(initData: RitualData): void {
    this.ritualData = initData;
    // P0-1: Reset all instance fields for re-entrancy safety
    this.cancelled = false;
    this.phase = 'ritual';
    this.ritualDelays = [];
    this.ritualTweens = [];
    this.overlay = null;
    this.chantLoop = null;
    this.voiceSound = null;
    // P1-2: Reset emitters
    this.sparkEmitter = null;
    this.dustEmitter = null;
  }

  create(): void {
    const { width, height } = this.scale;

    // Retrieve grave data
    const graves = this.cache.json.get('graves') as GraveEntry[];
    this.grave = graves.find((g) => g.id === this.ritualData.graveId) ?? graves[0];
    this.voiceLines = this.cache.json.get('voice_lines') as VoiceLine[];

    // Calculate screen position of grave from GraveyardWorld camera
    const worldScene = this.scene.get('GraveyardWorld') as Phaser.Scene & {
      cameras: Phaser.Cameras.Scene2D.CameraManager;
    };
    const cam = worldScene.cameras.main;
    this.graveScreenX = (this.ritualData.tombstoneWorldX - cam.worldView.x) * cam.zoom;
    this.graveScreenY = (this.ritualData.tombstoneWorldY - cam.worldView.y) * cam.zoom;

    // ── Rune circle - centered between wizard and grave at ground ──────────
    // Wizard is 40 art px below grave, so rune center is 20 px below grave
    // Screen positioning: grave is at graveScreenY, wizard is at graveScreenY + (40 * cam.zoom)
    const runeCircleScreenY = this.graveScreenY + (20 * cam.zoom);
    this.runeCircle = this.add.image(this.graveScreenX, runeCircleScreenY, 'rune_circle_add');
    this.runeCircle.setBlendMode(Phaser.BlendModes.ADD);
    this.runeCircle.setTint(0x7fd1d8);
    this.runeCircle.setAlpha(0);
    this.runeCircle.setScale(0);
    this.runeCircle.setDepth(20);

    // ── Holy light burst (hidden until later) ──────────────────────────────
    this.holyBurst = this.add.image(this.graveScreenX, this.graveScreenY, 'holy_light_burst');
    this.holyBurst.setBlendMode(Phaser.BlendModes.ADD);
    this.holyBurst.setAlpha(0);
    this.holyBurst.setScale(0.2);
    this.holyBurst.setDepth(25);

    // ── White full-screen flash ────────────────────────────────────────────
    this.whiteFill = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0);
    this.whiteFill.setDepth(30);

    // ── Subtitle letterbox ─────────────────────────────────────────────────
    this.subtitleBg = this.add.rectangle(width / 2, height - 60, width, 80, 0x000000, 0.75);
    this.subtitleBg.setDepth(35);
    this.subtitleBg.setAlpha(0);

    this.subtitleText = this.add.text(width / 2, height - 60, '', {
      fontFamily: "'Cinzel', serif",
      fontSize: '15px',
      color: '#d9f2ee',
      align: 'center',
      wordWrap: { width: width - 80 },
    }).setOrigin(0.5, 0.5).setDepth(36).setAlpha(0);

    // ── Incantation voice key ──────────────────────────────────────────────
    this.incantationKey = VOICE_KEY_MAP[this.ritualData.graveId] ?? 'incant_generic';

    // ── Single Esc handler (phase-aware) ──────────────────────────────────
    this.domEscHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (this.phase === 'ritual') {
          this.cancel();
        } else if (this.phase === 'overlay') {
          this.startExitRitual();
        }
        // During 'exiting', ignore Esc
      }
    };
    window.addEventListener('keydown', this.domEscHandler);
    this.events.once('shutdown', () => {
      if (this.domEscHandler) {
        window.removeEventListener('keydown', this.domEscHandler);
      }
    });

    // ── Pause GraveyardWorld input ─────────────────────────────────────────
    const gwScene = this.scene.get('GraveyardWorld');
    gwScene?.input.keyboard?.disableGlobalCapture();

    // ── Emit ritual started event to UIScene ──────────────────────────────
    const uiScene = this.scene.get('UIScene');
    if (uiScene) {
      uiScene.events.emit('ritualStarted');
    }

    // ── Start ritual timeline ──────────────────────────────────────────────
    this.startRitual();
  }

  // ─── Ritual timeline ─────────────────────────────────────────────────────

  private startRitual(): void {
    this.phase = 'ritual';
    const voiceLine = this.voiceLines.find(
      (v) => v.id === this.incantationKey
    );
    const voiceDuration = (voiceLine?.duration ?? 10) * 1000;
    const subtitle = voiceLine?.subtitle ?? '';

    // Hide plaque during ritual
    const uiScene = this.scene.get('UIScene') as { hidePlaque?: () => void };
    uiScene?.hidePlaque?.();

    // Dim GraveyardWorld ambient
    const worldScene = this.scene.get('GraveyardWorld') as { audio?: { duckMusic(v: number, d: number): void; duckAmbient(v: number, d: number): void } };
    worldScene?.audio?.duckMusic(0.08, 800);
    worldScene?.audio?.duckAmbient(0.06, 800);

    // t=0: rune circle scales in, ritual confirm SFX, wizard plays cast anim
    this.sound.play('ritual_confirm', { volume: 0.7 });
    this.sound.play('rune_sparkles',  { volume: 0.6 });

    const runeTween = this.tweens.add({
      targets: this.runeCircle,
      alpha: 0.7,
      scale: 0.225,
      duration: 800,
      ease: 'Back.easeOut',
    });
    this.ritualTweens.push(runeTween);

    // Continuous rune rotation
    const rotTween = this.tweens.add({
      targets: this.runeCircle,
      angle: 360,
      duration: 36000,
      repeat: -1,
      ease: 'Linear',
    });
    this.ritualTweens.push(rotTween);

    // Wizard cast animation
    this.playWizardCast();

    // t=400: voice incantation + chant drone
    const t1 = this.time.delayedCall(400, () => {
      if (this.cancelled) return;
      this.chantLoop = this.sound.add('chant_drone_loop', { loop: true, volume: 0 });
      this.chantLoop.play();
      const chantTween = this.tweens.add({
        targets: this.chantLoop,
        volume: 0.5,
        duration: 1200,
      });
      this.ritualTweens.push(chantTween);

      this.voiceSound = this.sound.add(this.incantationKey, { volume: 0.85 });
      this.voiceSound.play();
      this.showSubtitles(subtitle, voiceDuration);
    });
    this.ritualDelays.push(t1);

    // t=voice_end - 2000: wind swell + rumble + camera shake building
    const shakeStart = 400 + voiceDuration - 2000;
    const t2 = this.time.delayedCall(Math.max(shakeStart, 1200), () => {
      if (this.cancelled) return;
      this.sound.play('wind_swell', { volume: 0.7 });
      this.sound.play('ground_rumble', { volume: 0.6 });

      // P1-2: Kenney sparks from the grave (store reference)
      this.sparkEmitter = this.add.particles(
        this.graveScreenX,
        this.graveScreenY - 20,
        'kenney_spark_01',
        {
          speed: { min: 40, max: 120 },
          angle: 270,
          scale: { start: 0.12, end: 0 }, // P1-3: Scaled down from 0.6
          alpha: { start: 0.7, end: 0 }, // P1-3: Reduced from 1
          lifespan: 1200,
          quantity: 2, // P1-3: Limited from 3
          frequency: 120, // P1-3: Reduced from 80 (longer between emissions)
          duration: 2000,
          tint: [0x7fd1d8, 0x9effc8, 0xffe9a8],
          blendMode: Phaser.BlendModes.ADD, // P1-3: Use ADD blend mode
        }
      ) as unknown as Phaser.GameObjects.Particles.ParticleEmitter;
      this.sparkEmitter.setDepth(22);

      // Camera shake build-up
      const gwScene = this.scene.get('GraveyardWorld') as Phaser.Scene;
      const counterTween = this.tweens.addCounter({
        from: 0.004,
        to: 0.012,
        duration: 1800,
        onUpdate: (tween) => {
          if (this.cancelled) return;
          const value = tween.getValue() as number;
          // P1-16: Shake both GraveyardWorld camera and this scene's camera
          (gwScene?.cameras?.main as Phaser.Cameras.Scene2D.Camera).shake(80, value);
          (this.cameras?.main as Phaser.Cameras.Scene2D.Camera).shake(80, value);
        },
      });
      this.ritualTweens.push(counterTween);
    });
    this.ritualDelays.push(t2);

    // t=voice_end: stone swap + crack SFX
    const stoneSwapAt = 400 + voiceDuration;
    const t3 = this.time.delayedCall(stoneSwapAt, () => {
      if (this.cancelled) return;
      this.sound.play('stone_crack_crumble', { volume: 0.8 });
      this.swapStone('cracked');
    });
    this.ritualDelays.push(t3);

    // +600ms: rubble + dust
    const t4 = this.time.delayedCall(stoneSwapAt + 600, () => {
      if (this.cancelled) return;
      this.swapStone('rubble');
      // P1-7: Make dust cloud less opaque and use gentler scale/angle to avoid hiding wizard
      this.dustEmitter = this.add.particles(this.graveScreenX, this.graveScreenY - 24, 'kenney_smoke_04', {
        speed: { min: 20, max: 60 },
        angle: { min: 200, max: 340 }, // P1-7: Upward fan instead of all directions
        scale: { start: 0.18, end: 0.05 }, // P1-7: Much smaller (from 0.5 to 0.18-0.05)
        alpha: { start: 0.45, end: 0 }, // P1-7: More transparent (from 0.6 to 0.45)
        lifespan: 1000,
        quantity: 6,
        tint: 0x9aa8b8,
        speedY: -30, // P1-7: Upward drift
      }) as unknown as Phaser.GameObjects.Particles.ParticleEmitter;
      this.dustEmitter.setDepth(22); // P1-7: Lower depth than current (23 to 22) to stay behind wizard
    });
    this.ritualDelays.push(t4);

    // Holy light burst
    const burstAt = stoneSwapAt + 600;
    const t5 = this.time.delayedCall(burstAt, () => {
      if (this.cancelled) return;
      this.sound.play('holy_light_burst_sfx', { volume: 0.9 });
      this.sound.play('choir_aah', { volume: 0.7 });

      const burstTween = this.tweens.add({
        targets: this.holyBurst,
        alpha: { from: 0, to: 1 },
        scale: { from: 0.2, to: 4 },
        duration: 1200,
        ease: 'Quad.easeIn',
      });
      this.ritualTweens.push(burstTween);

      // White fill fades in
      const flashTween = this.tweens.add({
        targets: this.whiteFill,
        alpha: 1,
        duration: 1000,
        delay: 200,
        ease: 'Quad.easeIn',
        onComplete: () => {
          if (!this.cancelled) {
            this.time.delayedCall(300, () => this.openOverlay());
          }
        },
      });
      this.ritualTweens.push(flashTween);
    });
    this.ritualDelays.push(t5);
  }

  private playWizardCast(): void {
    // Wizard should face up (toward the grave) during ritual
    const gwPhaser = this.scene.get('GraveyardWorld') as unknown as Phaser.Scene & { wizard?: Phaser.GameObjects.Sprite };
    const wizard = gwPhaser?.wizard;
    if (wizard) {
      wizard.play('atk_behind');
      wizard.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (!this.cancelled) wizard.play('idle');
      });
    }
  }

  // ─── Subtitles ───────────────────────────────────────────────────────────

  private showSubtitles(subtitle: string, duration: number): void {
    const words = subtitle.split(' ');
    const chunkSize = Math.ceil(words.length / 3);

    // P1-2: Track the show tween
    const showTween = this.tweens.add({
      targets: [this.subtitleBg, this.subtitleText],
      alpha: 1,
      duration: 300,
    });
    this.ritualTweens.push(showTween);

    let elapsed = 0;
    for (let i = 0; i < 3; i++) {
      const chunk = words.slice(i * chunkSize, (i + 1) * chunkSize).join(' ');
      const delay = (duration / 3) * i;
      const t = this.time.delayedCall(delay + 400, () => {
        if (this.cancelled) return;
        this.subtitleText.setText(chunk);
      });
      this.ritualDelays.push(t);
      elapsed = delay + duration / 3;
    }

    // P1-2: Track the fade-out tween
    const tFade = this.time.delayedCall(elapsed + 200, () => {
      if (this.cancelled) return;
      const fadeTween = this.tweens.add({
        targets: [this.subtitleBg, this.subtitleText],
        alpha: 0,
        duration: 400,
      });
      this.ritualTweens.push(fadeTween);
    });
    this.ritualDelays.push(tFade);
  }

  // ─── Stone state ─────────────────────────────────────────────────────────

  private swapStone(state: 'plain' | 'cracked' | 'rubble'): void {
    const gwScene = this.scene.get('GraveyardWorld') as {
      tombstones?: Array<{ grave: { id: string }; setTombstoneState(s: string): void }>;
    };
    const ts = gwScene?.tombstones?.find((t) => t.grave.id === this.ritualData.graveId);
    ts?.setTombstoneState(state);
  }

  // ─── Open overlay ────────────────────────────────────────────────────────

  private openOverlay(): void {
    if (this.cancelled) return;

    this.phase = 'overlay';
    this.sound.play('app_open_shimmer', { volume: 0.6 });

    // Pause GraveyardWorld
    this.scene.pause('GraveyardWorld');

    // P1-2: Use onExit callback, drop the rip-exit window listener
    this.overlay = new GraveOverlay();
    this.overlay.mount(this.grave, () => this.startExitRitual());

    // P1-17: Fade out chant drone to silence
    if (this.chantLoop && 'setVolume' in this.chantLoop) {
      const droneTween = this.tweens.add({
        targets: this.chantLoop,
        volume: 0,
        duration: 800,
        onComplete: () => {
          if (this.chantLoop) {
            this.chantLoop.stop();
          }
        },
      });
      this.ritualTweens.push(droneTween);
    }

    // White fill fades out
    this.tweens.add({
      targets: this.whiteFill,
      alpha: 0,
      duration: 600,
      delay: 200,
    });
  }

  // ─── Exit ritual ─────────────────────────────────────────────────────────

  startExitRitual(): void {
    // Idempotent: only proceed if in overlay phase
    if (this.phase !== 'overlay') return;

    this.phase = 'exiting';

    this.sound.play('app_sink',      { volume: 0.6 });
    this.sound.play('rip_bell_toll', { volume: 0.7 });

    // Play farewell voice (optional)
    // P1-1: Check if audio exists in cache before playing
    if (this.cache.audio.exists('farewell_requiescat')) {
      this.sound.play('farewell_requiescat', { volume: 0.6 });
    }

    // White flash back
    this.tweens.add({
      targets: this.whiteFill,
      alpha: 0.8,
      duration: 300,
      onComplete: () => {
        this.overlay?.unmount();
        this.overlay = null;

        // Return stone to plain (visited state stays as rubble in current design)
        this.swapStone('rubble');

        // Resume graveyard
        this.scene.resume('GraveyardWorld');

        // Fade white back out
        this.tweens.add({
          targets: this.whiteFill,
          alpha: 0,
          duration: 600,
          onComplete: () => this.exitCleanup(),
        });
      },
    });
  }

  private exitCleanup(): void {
    // P1-2: Destroy all sounds and emitters
    this.voiceSound?.stop();
    this.voiceSound?.destroy();
    this.voiceSound = null;
    
    this.chantLoop?.stop();
    this.chantLoop?.destroy();
    this.chantLoop = null;

    this.sparkEmitter?.destroy();
    this.sparkEmitter = null;
    
    this.dustEmitter?.destroy();
    this.dustEmitter = null;

    // Return stone to plain state
    this.swapStone('plain');

    // Restore music/ambient via GraveyardWorld
    const worldScene = this.scene.get('GraveyardWorld') as {
      audio?: { restoreMusic(): void; restoreAmbient(): void };
    };
    worldScene?.audio?.restoreMusic();
    worldScene?.audio?.restoreAmbient();

    // Re-enable GraveyardWorld input
    const gwScene = this.scene.get('GraveyardWorld') as Phaser.Scene;
    gwScene?.input.keyboard?.enableGlobalCapture();

    // Emit ritual ended event to UIScene (to hide the proximity prompt)
    const uiScene = this.scene.get('UIScene');
    if (uiScene) {
      uiScene.events.emit('ritualEnded');
    }

    // Notify GraveyardWorld that ritual has fully completed
    if (gwScene) {
      gwScene.events.emit('ritualFullyEnded');
    }

    this.scene.stop('ResurrectionRitual');
  }

  // ─── Cancel (Esc) ────────────────────────────────────────────────────────

  private cancel(): void {
    if (this.cancelled) return;
    this.cancelled = true;

    // Kill all scheduled events
    for (const t of this.ritualDelays) t.remove(false);
    for (const tw of this.ritualTweens) tw.stop();
    this.ritualDelays = [];
    this.ritualTweens = [];

    // P1-2: Stop and destroy all sounds
    this.voiceSound?.stop();
    this.voiceSound?.destroy();
    this.voiceSound = null;
    
    this.chantLoop?.stop();
    this.chantLoop?.destroy();
    this.chantLoop = null;
    
    this.sound.stopByKey('wind_swell');
    this.sound.stopByKey('ground_rumble');

    // P1-2: Destroy emitters
    this.sparkEmitter?.destroy();
    this.sparkEmitter = null;
    
    this.dustEmitter?.destroy();
    this.dustEmitter = null;

    // P1-2: Hide UI elements immediately
    this.subtitleBg.setVisible(false);
    this.subtitleText.setVisible(false);
    this.runeCircle.setVisible(false);
    this.holyBurst.setVisible(false);
    this.whiteFill.setAlpha(0);

    // Restore stone
    this.swapStone('plain');

    // Restore world scene
    const worldScene = this.scene.get('GraveyardWorld') as {
      audio?: { restoreMusic(): void; restoreAmbient(): void };
    };
    worldScene?.audio?.restoreMusic();
    worldScene?.audio?.restoreAmbient();
    (this.scene.get('GraveyardWorld') as Phaser.Scene)?.cameras.main.resetFX();

    // P1-2: Use shorter fade (250ms instead of 400ms)
    this.cameras.main.fadeIn(250);
    this.cameras.main.once('camerafadeincomplete', () => {
      const gwScene = this.scene.get('GraveyardWorld') as Phaser.Scene;
      gwScene?.input.keyboard?.enableGlobalCapture();
      
      // Resume UIScene
      this.scene.resume('UIScene');
      
      // Notify GraveyardWorld that ritual has been cancelled
      gwScene?.events.emit('ritualFullyEnded');
      
      this.scene.stop('ResurrectionRitual');
    });
  }
}
