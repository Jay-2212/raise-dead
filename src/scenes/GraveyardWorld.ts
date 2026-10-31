/**
 * GraveyardWorld — the main top-down graveyard scene.
 * World size: 2400×1800 art px (4800×3600 at zoom 2).
 */
import Phaser from 'phaser';
import { GraveEntry } from '../types/graves';
import { RitualData } from '../types/ritual';
import { Tombstone } from '../ui/Tombstone';
import { AudioManager } from '../audio/AudioManager';
import { Joystick } from '../ui/Joystick';
import { MAP_LAYOUT, PATH_RECTS, PathRect, WIZARD_SPAWN } from './mapLayout';

const WORLD_W = 2400;
const WORLD_H = 1800;
const WALK_SPEED = 90; // art px/s
const PROX_DIST = 40;  // art px proximity threshold

export class GraveyardWorld extends Phaser.Scene {
  // Wizard
  private wizard!: Phaser.Physics.Arcade.Sprite;
  private wizardLight!: Phaser.GameObjects.Light;
  private facing: 'down' | 'up' | 'left' | 'right' = 'down';
  private shadow!: Phaser.GameObjects.Ellipse;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private mKey!: Phaser.Input.Keyboard.Key;
  private joystick!: Joystick;

  // World objects
  public tombstones: Tombstone[] = [];
  private tombstoneGroup!: Phaser.Physics.Arcade.StaticGroup;
  private graves: GraveEntry[] = [];

  // Atmosphere
  private fogLayers: Phaser.GameObjects.TileSprite[] = [];
  private pumpkinLights: Phaser.GameObjects.Light[] = [];

  // HUD (proximate hint lives in UIScene)
  private activeGrave: GraveEntry | null = null;
  private lastProxGraveId: string | null = null;
  private promptPlayedFor: string | null = null;
  private ritualActive = false;

  // Audio
  private audio!: AudioManager;
  private pathRects: PathRect[] = PATH_RECTS;

  // Crow fly-by
  private crowTimer = 0;
  private crowInterval = 0;
  private crow: Phaser.GameObjects.Image | null = null;
  private crowTween: Phaser.Tweens.Tween | null = null;

  constructor() {
    super({ key: 'GraveyardWorld' });
  }

  create(): void {
    this.buildGround();
    this.loadGraves();
    this.spawnDecoratives();
    this.buildTombstones();
    this.spawnWizard();
    this.setupCamera();
    this.setupLights();
    this.setupFog();
    this.setupParticles();
    this.setupAudio();
    this.setupInput();
    this.setupHUD();

    this.crowInterval = Phaser.Math.Between(20000, 45000);

    // Launch UIScene on top
    this.scene.launch('UIScene');

    // Listen for ritual outcome
    this.events.on('resume', this.onResume, this);
  }

  // ─── Ground ──────────────────────────────────────────────────────────────

  private buildGround(): void {
    // Grass base (world-size TileSprite)
    const grass = this.add.tileSprite(
      WORLD_W / 2, WORLD_H / 2,
      WORLD_W, WORLD_H,
      'ground_grass'
    );
    grass.setDepth(-10);

    // Path TileSprites for each path rect
    for (const rect of this.pathRects) {
      const path = this.add.tileSprite(
        rect.x + rect.width / 2,
        rect.y + rect.height / 2,
        rect.width, rect.height,
        'ground_path'
      );
      path.setDepth(-9);
    }
  }

  // ─── Graves data ─────────────────────────────────────────────────────────

  private loadGraves(): void {
    const raw = this.cache.json.get('graves') as GraveEntry[];
    this.graves = [...raw].sort((a, b) => a.sort_priority - b.sort_priority);
  }

  // ─── Tombstones ──────────────────────────────────────────────────────────

  private buildTombstones(): void {
    this.tombstoneGroup = this.physics.add.staticGroup();

    for (const layout of MAP_LAYOUT) {
      const grave = this.graves.find((g) => g.id === layout.id);
      if (!grave) continue;

      const ts = new Tombstone(this, layout.x, layout.y, grave);
      this.tombstones.push(ts);

      // Static physics body (small base rectangle)
      const body = this.tombstoneGroup.create(
        layout.x, layout.y - 8, undefined
      ) as Phaser.Physics.Arcade.Image;
      body.setVisible(false);
      body.setAlpha(0);
      const bw = grave.resurrectable ? 50 : 28;
      const bh = 16;
      (body.body as Phaser.Physics.Arcade.StaticBody).setSize(bw, bh);
      (body.body as Phaser.Physics.Arcade.StaticBody).reset(layout.x, layout.y - 4);
      (body as unknown as { _tombstone: Tombstone })._tombstone = ts;
    }
  }

  // ─── Trees & decoratives ─────────────────────────────────────────────────

  private spawnDecoratives(): void {
    const treeKeys = ['tree_1', 'tree_2', 'tree_3', 'tree_4'];
    
    // Central plaza area around spawn (~1200, 900)
    // Add 6-8 trees at edges, 40+ px away from graves and paths
    const centralPazaTrees = [
      { x: 1040, y: 650 },  // upper-left edge
      { x: 1230, y: 620 },  // upper-center
      { x: 1420, y: 650 },  // upper-right edge
      { x: 1530, y: 800 },  // right edge
      { x: 1420, y: 970 },  // lower-right edge
      { x: 1230, y: 1000 }, // lower-center
      { x: 1040, y: 970 },  // lower-left edge
      { x: 900, y: 800 },   // left edge
    ];
    
    for (let i = 0; i < centralPazaTrees.length; i++) {
      const pos = centralPazaTrees[i];
      const key = treeKeys[i % treeKeys.length];
      const tree = this.add.image(pos.x, pos.y, key);
      tree.setOrigin(0.5, 1);
      tree.setDepth(pos.y);

      // Shadow
      const sh = this.add.ellipse(pos.x, pos.y, 60, 18, 0x0b1020, 0.35);
      sh.setDepth(pos.y - 1);
    }
    
    // Original decorative trees
    const treePositions = [
      { x: 280, y: 300 }, { x: 2150, y: 280 }, { x: 350, y: 1400 },
      { x: 2100, y: 1380 }, { x: 600, y: 1250 }, { x: 1800, y: 1350 },
      { x: 900, y: 250 }, { x: 1500, y: 270 }, { x: 250, y: 860 },
      { x: 2200, y: 900 }, { x: 1200, y: 1600 }, { x: 700, y: 1560 },
      { x: 1700, y: 1580 }, { x: 400, y: 550 }, { x: 2050, y: 550 },
      { x: 1100, y: 1420 }, { x: 1350, y: 1430 }, { x: 480, y: 1150 },
      { x: 1970, y: 1200 }, { x: 820, y: 1500 }, { x: 1620, y: 1480 },
      { x: 300, y: 1200 }, { x: 2200, y: 1200 }, { x: 750, y: 320 },
      { x: 1700, y: 310 },
    ];

    for (let i = 0; i < treePositions.length; i++) {
      const pos = treePositions[i];
      const key = treeKeys[i % treeKeys.length];
      const tree = this.add.image(pos.x, pos.y, key);
      tree.setOrigin(0.5, 1);
      tree.setDepth(pos.y);

      // Shadow
      const sh = this.add.ellipse(pos.x, pos.y, 60, 18, 0x0b1020, 0.35);
      sh.setDepth(pos.y - 1);
    }

    // Jack-o'-lanterns
    const pumpkinPositions = [
      { x: 1100, y: 820 }, { x: 1280, y: 800 }, { x: 1460, y: 820 },
      { x: 900, y: 870 }, { x: 1600, y: 870 }, { x: 1200, y: 980 },
      { x: 1050, y: 960 }, { x: 1370, y: 960 }, { x: 750, y: 840 },
      { x: 1700, y: 840 },
    ];

    for (const pos of pumpkinPositions) {
      const pumpkin = this.add.image(pos.x, pos.y, 'jackolantern_lit');
      pumpkin.setOrigin(0.5, 1);
      pumpkin.setDepth(pos.y);

      // Warm glow pool
      const glow = this.add.image(pos.x, pos.y, 'glow_warm');
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.setTint(0xf08a24);
      glow.setAlpha(0.45);
      glow.setScale(0.8);
      glow.setDepth(pos.y - 1);

      // Flicker tween
      this.tweens.add({
        targets: [glow],
        alpha: { from: 0.4, to: 0.6 },
        scale: { from: 0.78, to: 0.85 },
        duration: 300 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  // ─── Wizard ──────────────────────────────────────────────────────────────

  private spawnWizard(): void {
    this.wizard = this.physics.add.sprite(
      WIZARD_SPAWN.x, WIZARD_SPAWN.y,
      'wizard_walk_down', 0
    );
    this.wizard.setOrigin(0.5, 1);
    this.wizard.setDepth(WIZARD_SPAWN.y);

    // Small physics body at the feet
    if (this.wizard.body) {
      this.wizard.body.setSize(24, 16);
      this.wizard.body.setOffset(20, 48);
    }

    this.wizard.setCollideWorldBounds(true);
    this.wizard.play('idle');

    // Collision with tombstones
    this.physics.add.collider(this.wizard, this.tombstoneGroup);

    // Shadow under wizard
    this.shadow = this.add.ellipse(
      WIZARD_SPAWN.x, WIZARD_SPAWN.y + 2,
      32, 10, 0x0b1020, 0.35
    );
    this.shadow.setDepth(WIZARD_SPAWN.y - 1);
  }

  // ─── Camera ──────────────────────────────────────────────────────────────

  private setupCamera(): void {
    this.cameras.main.setZoom(2);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.wizard, true, 0.1, 0.1);
  }

  // ─── Lights ──────────────────────────────────────────────────────────────

  private setupLights(): void {
    this.lights.enable().setAmbientColor(0x5a6a96);

    // Wizard light
    this.wizardLight = this.lights.addLight(
      WIZARD_SPAWN.x, WIZARD_SPAWN.y, 240, 0x9fc8ff, 0.6
    ) as Phaser.GameObjects.Light;

    // Jack-o'-lantern lights
    const pumpkinPositions = [
      { x: 1100, y: 820 }, { x: 1280, y: 800 }, { x: 1460, y: 820 },
      { x: 900, y: 870 }, { x: 1600, y: 870 }, { x: 1200, y: 980 },
      { x: 1050, y: 960 }, { x: 1370, y: 960 }, { x: 750, y: 840 },
      { x: 1700, y: 840 },
    ];
    for (const pos of pumpkinPositions) {
      const light = this.lights.addLight(pos.x, pos.y, 180, 0xf08a24, 1.0);
      this.pumpkinLights.push(light);
    }
  }

  // ─── Fog ─────────────────────────────────────────────────────────────────

  private setupFog(): void {
    // 3 fog layers at different speeds
    const fogConfigs = [
      { alpha: 0.18, depth: 5,  speedX: 0.08, speedY: 0.02 },
      { alpha: 0.22, depth: 6,  speedX: -0.05, speedY: 0.03 },
      { alpha: 0.12, depth: 7,  speedX: 0.12, speedY: -0.01 },
    ];

    for (const cfg of fogConfigs) {
      const fog = this.add.tileSprite(
        WORLD_W / 2, WORLD_H / 2,
        WORLD_W, WORLD_H,
        'fog_tile'
      );
      fog.setAlpha(cfg.alpha);
      fog.setDepth(cfg.depth);
      // Store fog speed as non-enumerable properties
      Object.defineProperty(fog, '_speedX', { value: cfg.speedX, writable: true });
      Object.defineProperty(fog, '_speedY', { value: cfg.speedY, writable: true });
      this.fogLayers.push(fog);
    }
  }

  // ─── Particles ───────────────────────────────────────────────────────────

  private setupParticles(): void {
    // Falling leaves — individual images emitted
    const leafKeys = ['leaf_1','leaf_2','leaf_3','leaf_4','leaf_5','leaf_6','leaf_7','leaf_8'];

    const leafEmitter = this.add.particles(0, -20, leafKeys[0], {
      x: { min: 0, max: WORLD_W },
      y: { min: -20, max: -20 },
      speedX: { min: 10, max: 30 },
      speedY: { min: 30, max: 80 },
      rotate: { min: 0, max: 360 },
      lifespan: { min: 6000, max: 10000 },
      quantity: 1,
      frequency: 500,
      gravityY: 8,
    }) as Phaser.GameObjects.Particles.ParticleEmitter;
    leafEmitter.setDepth(8);

    // Wisps — ADD-blend sprites wandering slowly
    for (let i = 0; i < 12; i++) {
      const wx = Phaser.Math.Between(600, 1800);
      const wy = Phaser.Math.Between(500, 1400);
      const wisp = this.add.image(wx, wy, 'wisp') as Phaser.GameObjects.Image;
      wisp.setBlendMode(Phaser.BlendModes.ADD);
      wisp.setTint(0x9effc8);
      wisp.setScale(Phaser.Math.FloatBetween(0.3, 0.7));
      wisp.setAlpha(Phaser.Math.FloatBetween(0.4, 0.8));
      wisp.setDepth(9);

      // Sine wander
      const baseX = wx;
      const baseY = wy;
      const radius = Phaser.Math.Between(20, 60);
      const speed = Phaser.Math.FloatBetween(0.0008, 0.002);
      const phaseOff = Math.random() * Math.PI * 2;

      this.tweens.addCounter({
        from: 0,
        to: Math.PI * 2,
        duration: (Math.PI * 2 / speed),
        repeat: -1,
        onUpdate: (tween) => {
          const t = (tween.getValue() as number) + phaseOff;
          wisp.x = baseX + Math.sin(t) * radius;
          wisp.y = baseY + Math.cos(t * 0.7) * (radius * 0.6);
        },
      });

      // Alpha pulse
      this.tweens.add({
        targets: wisp,
        alpha: { from: 0.4, to: 1.0 },
        duration: 1500 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Firefly dot at wisp centre
      const dot = this.add.image(wx, wy, 'firefly_dot');
      dot.setBlendMode(Phaser.BlendModes.ADD);
      dot.setTint(0x9effc8);
      dot.setScale(0.5);
      dot.setDepth(10);
    }
  }

  // ─── Audio ───────────────────────────────────────────────────────────────

  private setupAudio(): void {
    this.audio = new AudioManager(this);
    this.audio.applyMuteState();

    this.audio.playMusic('moonlit_lullaby', 0.35);
    this.audio.startAmbientLoop('wind_howl_loop', 0.3);
    this.audio.startAmbientLoop('night_crickets_loop', 0.25);
    this.audio.startAmbientLoop('ghost_whispers_loop', 0.12);
  }

  // ─── Input ───────────────────────────────────────────────────────────────

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.mKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M);

    this.joystick = new Joystick(this);
    this.joystick.onFPress(() => this.tryRaiseGrave());

    // F key event listener
    this.input.keyboard!.on('keydown-F', () => this.tryRaiseGrave());

    // M key mute toggle
    this.mKey.on('down', () => {
      this.audio.toggleMute();
      // Notify UIScene of mute change
      const uiScene = this.scene.get('UIScene');
      if (uiScene) {
        uiScene.events.emit('muteChanged', this.audio.isMuted);
      }
    });
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────

  private setupHUD(): void {
    // Vignette — fullscreen, HUD layer (handled by UIScene)
  }

  // ─── Raise grave ─────────────────────────────────────────────────────────

  private tryRaiseGrave(): void {
    if (!this.activeGrave) return;
    if (!this.activeGrave.resurrectable) return;

    const ts = this.tombstones.find((t) => t.grave.id === this.activeGrave!.id);
    const ritualData: RitualData = {
      graveId: this.activeGrave.id,
      graveName: this.activeGrave.name,
      tombstoneWorldX: ts?.x ?? WIZARD_SPAWN.x,
      tombstoneWorldY: ts?.y ?? WIZARD_SPAWN.y,
    };

    // Freeze wizard input
    this.input.keyboard!.disableGlobalCapture();
    this.ritualActive = true;

    this.scene.launch('ResurrectionRitual', ritualData);
    this.scene.pause('UIScene');
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    this.moveWizard(delta);
    this.checkProximity();
    this.updateFog();
    this.updateCrow(delta);
    this.audio.updateRandomShots(delta);

    // Update wizard light position
    this.wizardLight.x = this.wizard.x;
    this.wizardLight.y = this.wizard.y;

    // Update shadow
    this.shadow.x = this.wizard.x;
    this.shadow.y = this.wizard.y + 2;
    this.shadow.setDepth(this.wizard.y - 1);

    // Pumpkin light flicker
    for (const light of this.pumpkinLights) {
      light.intensity = 0.9 + Math.sin(Date.now() * 0.003 + light.x) * 0.15;
    }
  }

  private moveWizard(delta: number): void {
    if (this.ritualActive) return;

    const speed = WALK_SPEED;
    let dx = 0;
    let dy = 0;

    // Keyboard
    if (this.cursors.left.isDown  || this.wasd.left.isDown)  dx -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) dx += 1;
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    dy -= 1;
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  dy += 1;

    // Joystick
    if (this.joystick.active) {
      const force = this.joystick.getForce();
      if (Math.abs(force.forceX) > 0.1) dx = force.forceX;
      if (Math.abs(force.forceY) > 0.1) dy = force.forceY;
    }

    // Normalise diagonal
    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    this.wizard.setVelocity(dx * speed, dy * speed);

    const moving = dx !== 0 || dy !== 0;

    // Animation & facing
    if (moving) {
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) { this.facing = 'left';  this.wizard.play('walk_left',  true); }
        else        { this.facing = 'right'; this.wizard.play('walk_right', true); }
      } else {
        if (dy < 0) { this.facing = 'up';   this.wizard.play('walk_up',   true); }
        else        { this.facing = 'down'; this.wizard.play('walk_down', true); }
      }
    } else {
      this.wizard.play('idle', true);
    }

    // Y-sort depth
    this.wizard.setDepth(this.wizard.y);

    // Footsteps
    const surface = this.isOnPath(this.wizard.x, this.wizard.y) ? 'gravel' : 'grass';
    this.audio.updateFootsteps(delta, moving, surface);
  }

  private isOnPath(x: number, y: number): boolean {
    for (const rect of this.pathRects) {
      if (
        x >= rect.x && x <= rect.x + rect.width &&
        y >= rect.y && y <= rect.y + rect.height
      ) {
        return true;
      }
    }
    return false;
  }

  private checkProximity(): void {
    if (this.ritualActive) return;

    let closest: GraveEntry | null = null;
    let closestDist = Infinity;

    for (const ts of this.tombstones) {
      if (!ts.grave.resurrectable) continue;
      const dx = this.wizard.x - ts.x;
      const dy = this.wizard.y - ts.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < PROX_DIST && dist < closestDist) {
        closestDist = dist;
        closest = ts.grave;
      }
    }

    const newId = closest?.id ?? null;
    if (newId !== this.lastProxGraveId) {
      this.lastProxGraveId = newId;
      this.activeGrave = closest;

      // Notify UIScene
      const uiScene = this.scene.get('UIScene');
      if (uiScene) {
        uiScene.events.emit('proximityChanged', closest);
      }

      // Play prompt sound once per new grave
      if (closest && this.promptPlayedFor !== closest.id) {
        this.promptPlayedFor = closest.id;
        this.sound.play('prompt_press_f', { volume: 0.6 });
      }

      // Show plaque info
      if (uiScene) {
        uiScene.events.emit('plaqueChanged', closest);
      }
    }
  }

  private updateFog(): void {
    for (const fog of this.fogLayers) {
      const speedX = Object.getOwnPropertyDescriptor(fog, '_speedX')?.value ?? 0.08;
      const speedY = Object.getOwnPropertyDescriptor(fog, '_speedY')?.value ?? 0.02;
      fog.tilePositionX += speedX;
      fog.tilePositionY += speedY;
    }
  }

  private updateCrow(delta: number): void {
    this.crowTimer += delta;
    if (this.crowTimer >= this.crowInterval && !this.crow) {
      this.crowTimer = 0;
      this.crowInterval = Phaser.Math.Between(20000, 45000);
      this.spawnCrow();
    }
  }

  private spawnCrow(): void {
    const cam = this.cameras.main;
    const startX = cam.worldView.left - 50;
    const startY = Phaser.Math.Between(
      cam.worldView.top + 50,
      cam.worldView.top + 200
    );
    this.crow = this.add.image(startX, startY, 'crow_flying');
    this.crow.setDepth(50);
    this.crow.setScale(0.8);

    // Fake flapping via scaleY tween
    this.tweens.add({
      targets: this.crow,
      scaleY: { from: 0.8, to: 0.4 },
      duration: 200,
      yoyo: true,
      repeat: -1,
    });

    this.sound.play('crow_caw_02', { volume: 0.35 });

    this.crowTween = this.tweens.add({
      targets: this.crow,
      x: cam.worldView.right + 100,
      y: startY - Phaser.Math.Between(10, 40),
      duration: 3500,
      ease: 'Linear',
      onComplete: () => {
        this.crow?.destroy();
        this.crow = null;
        this.crowTween = null;
      },
    });
  }

  // ─── Called when ResurrectionRitual stops and scene resumes ──────────────

  private onResume(): void {
    this.ritualActive = false;
    this.input.keyboard!.enableGlobalCapture();
    this.audio.restoreMusic();
    this.audio.restoreAmbient();
    this.scene.resume('UIScene');
  }

  // ─── Public API (for window.__RD debug hooks) ─────────────────────────────

  teleportToGrave(id: string): void {
    const layout = MAP_LAYOUT.find((l) => l.id === id);
    if (!layout) return;
    // Position wizard 44 art px below the stone's base (stone origin at 0.5, 1)
    this.wizard.setPosition(layout.x, layout.y + 44);
    this.cameras.main.centerOn(layout.x, layout.y);
  }

  raiseGrave(id: string): void {
    const grave = this.graves.find((g) => g.id === id);
    if (!grave || !grave.resurrectable) return;
    this.activeGrave = grave;
    this.tryRaiseGrave();
  }
}
