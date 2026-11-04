/**
 * GraveyardWorld — the main top-down graveyard scene.
 * World size: 2400×1800 art px (4800×3600 at zoom 2).
 */
import Phaser from 'phaser';
import { GraveEntry } from '../types/graves';
import { RitualData } from '../types/ritual';
import { Tombstone } from '../ui/Tombstone';
import { AudioManager } from '../audio/AudioManager';
import { MAP_LAYOUT, PATH_RECTS, PathRect, WIZARD_SPAWN } from './mapLayout';
import { markRaised } from '../ui/WorldMap';
import { queueWorldAssets, createWizardAnimations } from './worldAssets';
import { WitchFlyBy } from './WitchFlyBy'; // A7
import { EasterEggManager } from '../easter/EasterEggManager'; // B
import { ZombieWave } from '../easter/ZombieWave'; // N3

const WORLD_W = 2400;
const WORLD_H = 1800;
const WALK_SPEED = 90; // art px/s
const SPRINT_MULT = 1.65; // N4: Shift sprint
const PROX_DIST = 40;  // art px proximity threshold

// A3: Seeded RNG (mulberry32 for reproducible decal placement)
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class GraveyardWorld extends Phaser.Scene {
  // Wizard
  public wizard!: Phaser.Physics.Arcade.Sprite;
  private wizardLight!: Phaser.GameObjects.Light;
  private facing: 'down' | 'up' | 'left' | 'right' = 'down';
  private shadow!: Phaser.GameObjects.Image;
  private shadowCast!: Phaser.GameObjects.Image;
  
  // A4: Walk bob accumulators
  private bobAccum = 0; // ms for walk bob cycle
  private isMoving = false;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private mKey!: Phaser.Input.Keyboard.Key;

  // World objects
  public tombstones: Tombstone[] = [];
  private tombstoneGroup!: Phaser.Physics.Arcade.StaticGroup;
  private treeColliders!: Phaser.Physics.Arcade.StaticGroup; // A5: Tree trunk collision group
  private graves: GraveEntry[] = [];

  // Atmosphere
  private fogLayers: Array<{ sprite: Phaser.GameObjects.TileSprite; sx: number; sy: number }> = [];
  private pumpkinLights: Phaser.GameObjects.Light[] = [];

  // HUD (proximate hint lives in UIScene)
  private activeGrave: GraveEntry | null = null;
  /** N4: ambient-event spacing + lightning flinch + sprint */
  private lastAmbientEndAt = -100000;
  private flinchUntil = 0;
  /** N4/M2: full map open (set by UIScene) — wizard holds still, F does nothing */
  public mapOpen = false;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private sprinting = false;
  /** N6: click-to-move target (mouse players) and whether to interact on arrival. */
  private moveTarget: { x: number; y: number; interact: boolean } | null = null;
  private tapAt = -1e9;
  private tapLatch = { left: 0, right: 0, up: 0, down: 0, sprint: 0 };
  /** Map fast-travel: the wizard appears in front of the chosen grave (not during a ritual or the horde). */
  public travelTo(x: number, y: number): void {
    if (this.ritualActive || this.zombieWave?.active) return;
    this.moveTarget = null;
    this.wizard.setVelocity(0, 0);
    this.wizard.setPosition(x, y);
    this.cameras.main.flash(250, 120, 255, 230);
    this.checkProximity();
  }
  private installTapLatch(): void {
    const map: Record<string, 'left' | 'right' | 'up' | 'down'> = {
      ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    };
    this.input.keyboard?.on('keydown', (ev: KeyboardEvent) => {
      const dir = map[ev.code];
      if (!dir || this.ritualActive || this.mapOpen || !this.wizard) return;
      if (ev.shiftKey) this.tapLatch.sprint = this.time.now + 400;
      // a tap is also a short walk order, so it takes a step even when the press is shorter than a frame
      const step = ev.shiftKey ? 90 : 56;
      const base = this.moveTarget && !this.moveTarget.interact && this.time.now - this.tapAt < 600 ? this.moveTarget : { x: this.wizard.x, y: this.wizard.y };
      const vx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
      const vy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
      this.moveTarget = { x: base.x + vx * step, y: base.y + vy * step, interact: false };
      this.tapAt = this.time.now;
      this.moveStuckMs = 0; this.moveBestDist = undefined;
    });
  }
  private moveStuckMs = 0;
  private moveBestDist: number | undefined = undefined;
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
  
  // A7: Witch fly-by
  private witch!: WitchFlyBy;

  // B: Easter eggs
  public eggManager!: EasterEggManager;
  public zombieWave!: ZombieWave; // N3

  constructor() {
    super({ key: 'GraveyardWorld' });
  }

  preload(): void {
    // Queue world assets (Phaser skips if already cached from TitleScene)
    queueWorldAssets(this.load);
  }

  create(): void {
    // Create animations if they don't exist
    createWizardAnimations(this);
    
    // A2: Set physics world bounds with 16px inset margin (camera stays full world)
    this.physics.world.setBounds(16, 16, WORLD_W - 32, WORLD_H - 32);
    
    this.buildGround();
    this.loadGraves();
    
    // A5: Create tree collision group
    this.treeColliders = this.physics.add.staticGroup();
    
    this.spawnDecoratives();
    this.buildTombstones();  // Must run BEFORE mounds and decals so tombstones array is populated
    this.spawnGraveMounds();
    this.spawnGroundDecals();
    this.spawnWizard();
    
    // A12: Bake static decals/mounds/roots/shadows into RenderTexture after all are spawned
    this.bakeStaticDecalsToTexture();
    
    this.setupCamera();
    this.setupLights();
    this.setupFog();
    this.setupParticles();
    this.setupAudio();
    this.setupInput();
    this.setupHUD();

    this.crowInterval = Phaser.Math.Between(20000, 45000);

    // A7: Initialize witch fly-by
    this.witch = new WitchFlyBy(this, {
      isSuppressed: () => this.ritualActive || this.scene.isActive('ResurrectionRitual') || this.scene.isActive('CreditsScene')
        || !!this.zombieWave?.active || !!this.eggManager?.isOmenRunning(),
      isCrowActive: () => this.crow !== null,
    });

    // B: Initialize easter egg manager
    this.zombieWave = new ZombieWave(this); // N3
    try { if (localStorage.getItem('rd_slayer')) this.applySlayerGlow(); } catch { /* ignore */ }
    this.eggManager = new EasterEggManager(this, this.treeColliders);

    // Launch UIScene on top
    this.scene.launch('UIScene');

    // Listen for ritual fully ended (when ResurrectionRitual completes the exit sequence)
    this.events.on('ritualFullyEnded', () => {
      this.eggManager?.clearHint(); // N3: re-show egg prompt after a ritual
      this.ritualActive = false;
      // P0-2: Reset stuck keys after exit
      this.input.keyboard?.resetKeys();
      // P0-3: Re-enable proximity checks for plaque/hint by resetting lastProxGraveId
      this.lastProxGraveId = null;
      // N4/B1: forget the grave we just raised, otherwise F elsewhere re-raises it
      this.activeGrave = null;
      this.scene.get('UIScene')?.events.emit('proximityChanged', null);
      this.scene.resume('UIScene');
      this.lastAmbientEndAt = this.time.now;
    });

    // P2-19: On iOS, resume audio loops when app/tab regains focus
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.audio) {
        this.audio.resumeLoopsIfNeeded();
      }
    });
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

  // ─── A3: Grave mounds ────────────────────────────────────────────────────

  private spawnGraveMounds(): void {
    const rng = mulberry32(1031); // seeded RNG for reproducibility
    
    for (const ts of this.tombstones) {
      // Add grave mounds for ~70% of decorative graves and all resurrectable graves
      const shouldAddMound = ts.grave.resurrectable || rng() < 0.7;
      if (!shouldAddMound) continue;

      const mound = this.add.image(ts.x, ts.y + 10, 'decal_grave_mound');
      mound.setScale(rng() * 0.15 + 0.75); // 0.75–0.9 using seeded RNG
      mound.setAlpha(0.9);
      mound.setOrigin(0.5, 0.5);
      mound.setDepth(-8);
      if (rng() < 0.5) mound.setFlipX(true);
    }
  }

  // ─── A3: Ground decals ───────────────────────────────────────────────────

  private spawnGroundDecals(): void {
    const rng = mulberry32(1031); // seeded RNG for reproducibility
    
    // Targets for each decal type (approximate counts from brief)
    const targets = {
      grass_tuft: 150,
      grass_tuft_flowers: 30,
      dirt_patch: 28,
      sunken_soil: 14,
      pebbles: 24,
      leaf_litter: 30,
      // FIX: Remove mushrooms from scatter list; place per-tree instead
    };

    const decals: Array<{ key: string; count: number }> = [
      { key: 'decal_grass_tuft', count: targets.grass_tuft },
      { key: 'decal_grass_tuft_flowers', count: targets.grass_tuft_flowers },
      { key: 'decal_dirt_patch', count: targets.dirt_patch },
      { key: 'decal_sunken_soil', count: targets.sunken_soil },
      { key: 'decal_pebbles', count: targets.pebbles },
      { key: 'decal_leaf_litter', count: targets.leaf_litter },
      // Mushrooms removed
    ];

    for (const { key, count } of decals) {
      for (let i = 0; i < count; i++) {
        let x, y;
        let attempts = 0;
        let valid = false;

        // Try up to 50 attempts to find a valid spot
        while (attempts < 50 && !valid) {
          x = Math.round(rng() * (WORLD_W - 400) + 200);
          y = Math.round(rng() * (WORLD_H - 400) + 200);
          const onPath = this.isOnPath(x, y);
          
          // Valid if:
          // 1. Not too close to plaza centre or any grave
          // 2. If not pebbles/leaf_litter, also not on a path
          const skipOnPath = (key !== 'decal_pebbles' && key !== 'decal_leaf_litter') && onPath;
          const tooClose = this.isTooCloseToCenterOrGrave(x, y);
          
          valid = !skipOnPath && !tooClose;
          attempts++;
        }

        // Only place if we found a valid spot
        if (!valid) continue;

        const decal = this.add.image(x!, y!, key);
        decal.setScale(rng() * 0.35 + 0.8); // 0.8–1.15 using seeded RNG
        decal.setAlpha(rng() * 0.15 + 0.85); // 0.85–1.0 using seeded RNG
        decal.setOrigin(0.5, 0.5);
        decal.setDepth(-8);
        
        // Tint slightly toward navy for moonlit palette
        if (rng() < 0.4) {
          decal.setTint(0xc8d4e8);
        }
        
        if (rng() < 0.5) {
          decal.setFlipX(true);
        }
      }
    }

    // FIX: Place mushrooms 1-2 beside about half the trees using seeded RNG
    this.placeMushroomsPerTree();
  }

  private placeMushroomsPerTree(): void {
    // Use a fresh RNG seeded from 1031 for mushroom placement
    const rng = mulberry32(1031);
    
    // Consume the same random numbers as the ground decals to stay synchronized
    // (We replayed the same decal scatter loop logic)
    const targets = {
      grass_tuft: 150,
      grass_tuft_flowers: 30,
      dirt_patch: 28,
      sunken_soil: 14,
      pebbles: 24,
      leaf_litter: 30,
    };
    
    // Simulate the same random consumption
    for (const count of Object.values(targets)) {
      for (let i = 0; i < count; i++) {
        for (let attempts = 0; attempts < 50; attempts++) {
          rng(); // x
          rng(); // y
          rng(); // onPath check
          rng(); // scale
          rng(); // alpha
          rng(); // tint check
          rng(); // flipX check
        }
      }
    }
    
    // Now place mushrooms: 1-2 beside about half the trees
    for (const ts of this.tombstones) {
      // Skip decorative graves; only place near trees by checking our tree positions
      // For simplicity, we'll use the RNG to decide: about 50% of trees get mushrooms
      const shouldPlaceMushrooms = rng() < 0.5;
      if (!shouldPlaceMushrooms) continue;
      
      // Place 1-2 mushrooms near this tree
      const mushroomCount = rng() < 0.5 ? 1 : 2;
      
      for (let m = 0; m < mushroomCount; m++) {
        // Offset 30-60 px in a semi-random direction
        const angle = rng() * Math.PI * 2;
        const distance = 30 + rng() * 30; // 30–60 px from tree
        const offsetX = Math.cos(angle) * distance;
        const offsetY = Math.sin(angle) * distance;
        
        const mx = ts.x + offsetX;
        const my = ts.y + offsetY;
        
        // Check bounds and proximity
        if (mx < 100 || mx > WORLD_W - 100 || my < 100 || my > WORLD_H - 100) continue;
        if (this.isTooCloseToCenterOrGrave(mx, my)) continue;
        
        const mushroom = this.add.image(mx, my, 'decal_mushrooms');
        mushroom.setScale(rng() * 0.35 + 0.8); // 0.8–1.15 using seeded RNG
        mushroom.setAlpha(rng() * 0.15 + 0.85); // 0.85–1.0 using seeded RNG
        mushroom.setOrigin(0.5, 0.5);
        mushroom.setDepth(-8);
        
        if (rng() < 0.4) {
          mushroom.setTint(0xc8d4e8);
        }
        
        if (rng() < 0.5) {
          mushroom.setFlipX(true);
        }
      }
    }
  }

  private isTooCloseToCenterOrGrave(x: number, y: number): boolean {
    // Skip within 24 px of plaza centre
    const plazaCentre = { x: 1200, y: 900 };
    const plazaDist = Phaser.Math.Distance.Between(x, y, plazaCentre.x, plazaCentre.y);
    if (plazaDist < 24) return true;

    // Skip within 24 px of any grave base
    for (const ts of this.tombstones) {
      const graveDist = Phaser.Math.Distance.Between(x, y, ts.x, ts.y);
      if (graveDist < 24) return true;
    }

    return false;
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

  // ─── Decoratives & Grounding ─────────────────────────────────────────────

  private spawnDecoratives(): void {
    const treeKeys = ['tree_1', 'tree_2', 'tree_3', 'tree_4'];
    
    // Central plaza area around spawn (~1200, 900)
    const centralPlazaTrees = [
      { x: 1040, y: 650 },  // upper-left edge
      { x: 1230, y: 620 },  // upper-center
      { x: 1420, y: 650 },  // upper-right edge
      { x: 1570, y: 800 },  // right edge (nudged east to clear unmarked-grave at 1500,760)
      { x: 1420, y: 970 },  // lower-right edge
      { x: 1280, y: 1060 }, // lower-right, moved to clear spawn (1200, 900)
      { x: 1040, y: 970 },  // lower-left edge
      { x: 900, y: 800 },   // left edge
    ];
    
    for (let i = 0; i < centralPlazaTrees.length; i++) {
      const pos = centralPlazaTrees[i];
      const key = treeKeys[i % treeKeys.length];
      this.spawnTree(pos.x, pos.y, key);
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
      this.spawnTree(pos.x, pos.y, key);
    }

    // Jack-o'-lanterns with shadows
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

      // A3: Contact + cast shadows for pumpkin (28×28 sprite, footprint ~28)
      const contactShadow = this.add.image(pos.x, pos.y - 1, 'shadow_contact');
      // Non-uniform: width 28 px, height ~8 px
      contactShadow.setScale(1.1 * 28 / 64, 8 / 24);
      contactShadow.setAlpha(0.6);
      contactShadow.setOrigin(0.5, 0.5);
      contactShadow.setDepth(pos.y - 1);

      const castShadow = this.add.image(pos.x + 0.25 * 28, pos.y + 3, 'shadow_cast');
      castShadow.setScale(1.3 * 28 / 96, 10 / 40);
      castShadow.setAlpha(0.3);
      castShadow.setOrigin(0.5, 0.5);
      castShadow.setDepth(pos.y - 2);

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

  private spawnTree(x: number, y: number, key: string): void {
    const tree = this.add.image(x, y, key);
    tree.setOrigin(0.5, 1);
    tree.setDepth(y);

    // A3: Tree shadows — contact shadow ~44×10, cast shadow ~130×36 with offset (+30, +6)
    const contactShadow = this.add.image(x, y - 1, 'shadow_contact');
    // Non-uniform: width 44 px, height ~10 px
    contactShadow.setScale(1.1 * 44 / 64, 10 / 24);
    contactShadow.setAlpha(0.6);
    contactShadow.setOrigin(0.5, 0.5);
    contactShadow.setDepth(y - 1);

    const castShadow = this.add.image(x + 30, y + 6, 'shadow_cast');
    // Cast shadow: 130×36 px at 96×40 source
    castShadow.setScale(130 / 96, 36 / 40);
    castShadow.setAlpha(0.25);
    castShadow.setOrigin(0.5, 0.5);
    castShadow.setDepth(y - 2);

    // A3: Decal roots under tree base (scale 0.9–1.2, depth tree.y - 3)
    // FIX: Use seeded RNG instead of Math.random()
    const rng = mulberry32(1031 + x * 1000 + y); // Seed includes tree position for variation
    const roots = this.add.image(x, y + 3, 'decal_roots');
    roots.setScale(rng() * 0.3 + 0.9); // 0.9–1.2
    roots.setAlpha(0.85);
    roots.setOrigin(0.5, 1);
    roots.setDepth(y - 3);
    if (rng() < 0.5) roots.setFlipX(true);
    
    // A10: Tree trunk collision body sizing based on tree type
    // tree_3 and tree_4 have wider trunks; tree_1 and tree_2 are narrower
    let trunkWidth = 18;
    let trunkHeight = 10;
    if (key === 'tree_3' || key === 'tree_4') {
      trunkWidth = 26;  // Wider trunk for tree_3/tree_4
      trunkHeight = 12;
    }
    
    const trunkBody = this.treeColliders.create(x, y - 5, undefined) as Phaser.Physics.Arcade.Image;
    trunkBody.setVisible(false);
    trunkBody.setAlpha(0);
    (trunkBody.body as Phaser.Physics.Arcade.StaticBody).setSize(trunkWidth, trunkHeight);
    (trunkBody.body as Phaser.Physics.Arcade.StaticBody).reset(x, y - 5);
  }

  // ─── A12: Bake static decals to RenderTexture ────────────────────────────

  private bakeStaticDecalsToTexture(): void {
    // Create a RenderTexture to capture all static ground-level decals/mounds/roots
    const rt = this.make.renderTexture({
      x: WORLD_W / 2,
      y: WORLD_H / 2,
      width: WORLD_W,
      height: WORLD_H,
    }, false);
    rt.setOrigin(0.5, 0.5);
    rt.setDepth(-8.5);  // Between paths (-9) and static decals (-8)
    
    // FIX: Add RenderTexture to display list so it actually renders
    this.add.existing(rt);

    // Collect all decals/mounds/roots at depth -8, and roots/shadows to bake
    const staticDecals: Phaser.GameObjects.Image[] = [];
    const rootsAndShadows: Phaser.GameObjects.Image[] = [];
    
    // Walk through display list to find Image objects at depth -8 (decals/mounds)
    // and at other depths for roots/static prop shadows
    for (const obj of this.children.getAll()) {
      if (obj instanceof Phaser.GameObjects.Image) {
        // Static decals/mounds at depth -8
        if ((obj as any).depth === -8) {
          staticDecals.push(obj);
        }
        // Roots at depth y - 3 (from spawnTree)
        // Contact shadows at depth y - 1 (depth above decals, render on top)
        // Cast shadows at depth y - 2 (for trees, pumpkins, stones — NOT wizard which renders live)
        // Identify by texture key: decal_roots, shadow_contact (contact), shadow_cast (from trees/pumpkins/stones)
        else if (obj.texture?.key === 'decal_roots') {
          rootsAndShadows.push(obj);
        }
        else if (obj.texture?.key === 'shadow_cast' && (obj as any).depth < 0) {
          // Only bake non-wizard cast shadows (wizard's shadowCast is a live sprite, depth updates)
          // Cast shadows from trees/pumpkins are at y - 2 where y is their world y
          // We'll bake all shadow_cast objects except the wizard's (which has a reference stored)
          if (obj !== this.shadowCast) {
            rootsAndShadows.push(obj);
          }
        }
      }
    }

    // Draw all static decals to the RenderTexture at their current positions
    for (const decal of staticDecals) {
      rt.draw(decal);
    }
    
    // Draw roots and static prop shadows to bake
    for (const item of rootsAndShadows) {
      rt.draw(item);
    }

    // Destroy the original decal/root/shadow game objects to save memory
    for (const decal of staticDecals) {
      decal.destroy();
    }
    for (const item of rootsAndShadows) {
      item.destroy();
    }
  }

  // ─── Wizard ──────────────────────────────────────────────────────────────

  private spawnWizard(): void {
    this.wizard = this.physics.add.sprite(
      WIZARD_SPAWN.x, WIZARD_SPAWN.y,
      'wizard_walk_down', 0
    );
    // A4: Set origin so boots touch ground (Movicx wizard: bottom 3 rows transparent)
    this.wizard.setOrigin(0.5, 61 / 64);
    this.wizard.setDepth(WIZARD_SPAWN.y);

    // A4: Adjust physics body offset to match new origin
    if (this.wizard.body) {
      this.wizard.body.setSize(24, 16);
      this.wizard.body.setOffset(20, 46); // adjusted for new origin
    }

    this.wizard.setCollideWorldBounds(true);
    this.wizard.play('idle');

    // Collision with tombstones
    this.physics.add.collider(this.wizard, this.tombstoneGroup);
    
    // A5: Collision with tree trunks
    this.physics.add.collider(this.wizard, this.treeColliders);

    // A3: Contact shadow under wizard boots (~28×8)
    const contactShadow = this.add.image(
      WIZARD_SPAWN.x, WIZARD_SPAWN.y - 1,
      'shadow_contact'
    );
    // Non-uniform scale: width 28 px, height ~8 px
    contactShadow.setScale(1.1 * 28 / 64, 8 / 24);
    contactShadow.setAlpha(0.65);
    contactShadow.setOrigin(0.5, 0.5);
    contactShadow.setDepth(WIZARD_SPAWN.y - 1);
    
    const castShadow = this.add.image(
      WIZARD_SPAWN.x + 0.25 * 28, WIZARD_SPAWN.y + 3,
      'shadow_cast'
    );
    castShadow.setScale(1.3 * 28 / 96, 10 / 40);
    castShadow.setAlpha(0.25);
    castShadow.setOrigin(0.5, 0.5);
    castShadow.setDepth(WIZARD_SPAWN.y - 2);

    this.shadow = contactShadow;
    this.shadowCast = castShadow;
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
    const cam = this.cameras.main;
    const viewWidth = cam.width;
    const viewHeight = cam.height;

    // 3 fog layers at different speeds (parallax factors)
    const fogConfigs = [
      { alpha: 0.18, depth: 5,  sx: 0.08, sy: 0.02 },
      { alpha: 0.22, depth: 6,  sx: -0.05, sy: 0.03 },
      { alpha: 0.12, depth: 7,  sx: 0.12, sy: -0.01 },
    ];

    for (const cfg of fogConfigs) {
      const fog = this.add.tileSprite(
        viewWidth / 2, viewHeight / 2,
        viewWidth, viewHeight,
        'fog_tile'
      );
      fog.setAlpha(cfg.alpha);
      fog.setDepth(cfg.depth);
      fog.setScrollFactor(0); // Fixed to screen, not world
      
      this.fogLayers.push({
        sprite: fog,
        sx: cfg.sx,
        sy: cfg.sy,
      });
    }
  }

  // ─── Particles ───────────────────────────────────────────────────────────

  private setupParticles(): void {
    // Falling leaves — individual leaf images
    const leafKeys = ['leaf_1','leaf_2','leaf_3','leaf_4','leaf_5','leaf_6','leaf_7','leaf_8'];

    // P2-4: Use a random leaf as the starting texture
    const startLeaf = Phaser.Utils.Array.GetRandom(leafKeys);

    const leafEmitter = this.add.particles(0, -20, startLeaf, {
      x: { min: 0, max: 2400 }, // P2-4: Camera-view bounds handled in update
      y: { min: -20, max: -20 },
      speedX: { min: 10, max: 30 },
      speedY: { min: 30, max: 80 },
      rotate: { min: 0, max: 360 },
      lifespan: { min: 6000, max: 10000 },
      quantity: 1,
      frequency: 350, // P2-4: Increased for denser effect
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

      // Firefly dot at wisp centre (P2-3: will follow wisp)
      const dot = this.add.image(wx, wy, 'firefly_dot');
      dot.setBlendMode(Phaser.BlendModes.ADD);
      dot.setTint(0x9effc8);
      dot.setScale(0.5);
      dot.setDepth(10);

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
          // P2-3: Follow wisp with dot
          dot.setPosition(wisp.x, wisp.y);
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
    this.installTapLatch();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.mKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT); // N4: sprint

    // P0-5: Joystick now lives in UIScene; F key listener here handles keyboard input
    // B: F key event listener — unified interact handler
    this.input.keyboard!.on('keydown-F', (ev: KeyboardEvent) => {
      if (ev.repeat) return; // held F must not count as three presses
      this.interact();
    });

    // N6: click-to-move for mouse players. Click a tombstone or secret to walk there and use it.
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.ritualActive) return;
      // N4/Z3: during the horde any click / right-click / tap blasts the zombie under the pointer
      if (this.zombieWave?.active && !(over && over.length > 0) && !this.zombieWave.isFailed && this.zombieWave.hasTargetAt(p.worldX, p.worldY)) {
        this.moveTarget = null;
        this.zombieWave.castAt(p.worldX, p.worldY);
        return;
      }
      if (p.rightButtonDown()) return; // right-click only ever shoots
      if (p.wasTouch || (over && over.length > 0)) return;
      const wx = p.worldX;
      const wy = p.worldY;
      let best: { x: number; y: number } | null = null;
      let bestD = 48;
      for (const ts of this.tombstones) {
        if (!ts.grave.resurrectable) continue;
        const d = Phaser.Math.Distance.Between(wx, wy, ts.x, ts.y - 16);
        if (d < bestD) { bestD = d; best = { x: ts.x, y: ts.y + 26 }; }
      }
      for (const egg of this.eggManager?.defs ?? []) {
        const d = Phaser.Math.Distance.Between(wx, wy, egg.x, egg.y);
        if (d < bestD) { bestD = d; best = { x: egg.x, y: egg.y + 18 }; }
      }
      this.moveTarget = best ? { ...best, interact: true } : { x: wx, y: wy, interact: false };
      // N7: show where we're heading
      const ring = this.add.circle(this.moveTarget.x, this.moveTarget.y, 10).setStrokeStyle(2, 0x7fffe0, 0.9).setDepth(this.moveTarget.y - 1);
      this.tweens.add({ targets: ring, scale: 0.3, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
      this.moveStuckMs = 0;
      this.moveBestDist = undefined;
    });

    this.input.mouse?.disableContextMenu(); // N4: right-click casts during the horde

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

  /** B: black-cat omen summons the witch right away. */
  /** N3: zombie hand egg starts a wave; onDone fires when the last zombie falls. */
  public startZombieWave(onDone: () => void, onAbandon?: () => void): void {
    this.moveTarget = null;
    this.witch?.dismiss();
    this.zombieWave.start(onDone, onAbandon);
  }

  public summonWitch(): void {
    this.witch.forceSpawn();
  }

  /** N4/B2: true while any ambient event (witch, omen, zombie wave, ritual) is on screen. */
  public isAmbientBusy(): boolean {
    return this.ritualActive || this.witch?.isActive || !!this.zombieWave?.active
      || this.time.now - this.lastAmbientEndAt < 8000;
  }

  /** N4/Z: helpers the horde uses. */
  public getFacing(): 'down' | 'up' | 'left' | 'right' { return this.facing; }
  public duckWorldMusic(v: number, ms: number): void { this.audio?.duckMusic(v, ms); }
  public restoreWorldMusic(ms: number): void { this.audio?.restoreMusic(0.35, ms); }
  private slayerGlow: Phaser.GameObjects.Image | null = null;
  /** N4/Z5: reward for clearing the horde — a green light follows the wizard for good. */
  public applySlayerGlow(): void {
    if (this.wizardLight) { this.wizardLight.setColor(0x5dff9a); this.wizardLight.intensity = 0.95; }
    if (!this.slayerGlow && this.textures.exists('glow_moon')) {
      this.slayerGlow = this.add.image(this.wizard.x - 6, this.wizard.y - 28, 'glow_moon')
        .setBlendMode(Phaser.BlendModes.ADD).setTint(0x5dff9a).setAlpha(0.45).setScale(0.35);
    }
  }

  /** N4/L1: the wizard jumps when lightning lands next to him. */
  public flinch(): void {
    if (this.ritualActive) return;
    this.flinchUntil = this.time.now + 220;
    this.wizard.setVelocity(0, 0);
    const t = this.add.text(this.wizard.x, this.wizard.y - 78, '!', {
      fontFamily: "'Pixelify Sans', sans-serif", fontSize: '22px', color: '#ffe066', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(99999);
    this.tweens.add({ targets: t, y: t.y - 16, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  // ─── B: Unified interact handler (F key priority: grave > egg) ─────────────

  public interact(): void {
    // Guard against re-entrancy during ritual/overlay
    if (this.ritualActive || this.scene.isActive('ResurrectionRitual') || this.scene.isPaused('ResurrectionRitual')) return;

    // N3: during a zombie wave F casts spells
    if (this.zombieWave?.active) {
      this.zombieWave.castCone();
      return;
    }

    if (this.mapOpen) return;
    // N4/B1: re-check what we're actually standing at; the nearer of grave / secret wins
    this.checkProximity();
    let graveDist = Infinity;
    if (this.activeGrave) {
      const ts = this.tombstones.find((t) => t.grave.id === this.activeGrave!.id);
      graveDist = ts ? Phaser.Math.Distance.Between(this.wizard.x, this.wizard.y, ts.x, ts.y) : Infinity;
      if (graveDist > PROX_DIST + 4) { this.activeGrave = null; graveDist = Infinity; }
    }
    const eggDist = this.eggManager?.nearestEggDistance() ?? Infinity;
    if (eggDist < graveDist && this.eggManager?.tryInteract()) return;

    // Priority 1: Try to raise a resurrectable grave if active
    if (this.activeGrave && this.activeGrave.resurrectable) {
      this.tryRaiseGrave();
      return;
    }

    // Priority 2: Try to trigger an egg
    const eggConsumed = this.eggManager?.tryInteract();
    if (eggConsumed) {
      // Show lore card if this is a new find
      // (EasterEggManager will emit 'eggFound' event to UIScene)
      return;
    }
  }

  private tryRaiseGrave(): void {
    // P0-1: Guard against re-entrancy during ritual/overlay
    if (this.ritualActive || this.scene.isActive('ResurrectionRitual') || this.scene.isPaused('ResurrectionRitual')) return;
    if (!this.activeGrave) return;
    if (!this.activeGrave.resurrectable) return;

    markRaised(this.activeGrave.id); // N4/M3: remember it for the map
    this.witch?.dismiss();
    this.eggManager?.cancelAmbient();
    const ts = this.tombstones.find((t) => t.grave.id === this.activeGrave!.id);
    const ritualData: RitualData = {
      graveId: this.activeGrave.id,
      graveName: this.activeGrave.name,
      tombstoneWorldX: ts?.x ?? WIZARD_SPAWN.x,
      tombstoneWorldY: ts?.y ?? WIZARD_SPAWN.y,
    };

    // P0-2: Stop wizard sliding and play idle animation
    this.wizard.setVelocity(0, 0);
    this.wizard.play('idle', true);

    // P1-4: Move wizard 40 art px below stone before ritual starts
    if (ts) {
      this.wizard.setPosition(ts.x, ts.y + 40);
    }

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
    this.witch.update(delta); // A7
    if (!this.ritualActive) this.eggManager?.update(delta); // B
    this.zombieWave?.update(delta); // N3
    this.audio.updateRandomShots(delta);

    // Update wizard light position
    this.wizardLight.x = this.wizard.x;
    this.wizardLight.y = this.wizard.y;
    if (this.slayerGlow) this.slayerGlow.setPosition(this.wizard.x - 6, this.wizard.y - 28).setDepth(this.wizard.y + 1);

    // Update shadow
    this.shadow.x = this.wizard.x;
    this.shadow.y = this.wizard.y - 1;  // Centered contact shadow
    this.shadow.setDepth(this.wizard.y - 1);
    
    this.shadowCast.x = this.wizard.x + 0.25 * 28;  // Offset for cast shadow
    this.shadowCast.y = this.wizard.y + 3;
    this.shadowCast.setDepth(this.wizard.y - 2);

    // Pumpkin light flicker
    for (const light of this.pumpkinLights) {
      light.intensity = 0.9 + Math.sin(Date.now() * 0.003 + light.x) * 0.15;
    }
  }

  private moveWizard(delta: number): void {
    if (this.ritualActive) return;

    if (this.mapOpen || this.time.now < this.flinchUntil) { this.wizard.setVelocity(0, 0); return; }
    // N4/M4: Shift (or full joystick tilt) = sprint
    let sprint = !!this.shiftKey?.isDown;
    const latchSprint = this.time.now < this.tapLatch.sprint;
    if (latchSprint) sprint = true;
    const joy = (this.scene.get('UIScene') as { joystick?: { active: boolean; getForce(): { forceX: number; forceY: number } } })?.joystick;
    if (joy?.active) { const f = joy.getForce(); if (Math.hypot(f.forceX, f.forceY) > 0.95) sprint = true; }
    this.sprinting = sprint;
    const speed = WALK_SPEED * (sprint ? SPRINT_MULT : 1);
    let dx = 0;
    let dy = 0;

    // Keyboard (a quick tap still takes a step: on slow machines a press can begin and end between two frames)
    if (this.cursors.left.isDown  || this.wasd.left.isDown )  dx -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) dx += 1;
    if (this.cursors.up.isDown    || this.wasd.up.isDown   )    dy -= 1;
    if (this.cursors.down.isDown  || this.wasd.down.isDown )  dy += 1;

    // P0-5: Joystick now lives in UIScene; get normalized force from there
    const uiScene = this.scene.get('UIScene') as { joystick?: { active: boolean; getForce(): { forceX: number; forceY: number } } };
    if (uiScene?.joystick?.active) {
      const force = uiScene.joystick.getForce();
      if (Math.abs(force.forceX) > 0.1) dx = force.forceX;
      if (Math.abs(force.forceY) > 0.1) dy = force.forceY;
    }

    // a fresh tap's step wins over the key's own one-frame isDown; a real hold takes over after 300 ms
    if (this.moveTarget && !this.moveTarget.interact && this.time.now - this.tapAt < 300 && !uiScene?.joystick?.active) { dx = 0; dy = 0; }
    // N6: keyboard/joystick cancels click-to-move; otherwise steer toward the clicked spot
    if (dx !== 0 || dy !== 0) {
      this.moveTarget = null;
    } else if (this.moveTarget) {
      const tx = this.moveTarget.x - this.wizard.x;
      const ty = this.moveTarget.y - this.wizard.y;
      const dist = Math.sqrt(tx * tx + ty * ty);
      const body = this.wizard.body as Phaser.Physics.Arcade.Body;
      // progress check: give up if we haven't closed in for 1.2 s
      if (dist < (this.moveBestDist ?? Infinity) - 2) { this.moveBestDist = dist; this.moveStuckMs = 0; }
      else this.moveStuckMs += delta;
      if (dist < Math.max(6, (WALK_SPEED * delta) / 1000 + 2) || this.moveStuckMs > 1200) {
        const doInteract = this.moveTarget.interact && dist < 40;
        this.moveTarget = null;
        this.moveBestDist = undefined;
        if (doInteract) {
          this.checkProximity();
          this.interact();
        }
      } else {
        dx = tx / dist;
        dy = ty / dist;
        // slide around obstacles: drop the blocked axis and push along the other
        const hx = body && (body.touching.left || body.touching.right || body.blocked.left || body.blocked.right);
        const hy = body && (body.touching.up || body.touching.down || body.blocked.up || body.blocked.down);
        if (hx && !hy) { dx = 0; dy = Math.abs(ty) > 2 ? Math.sign(ty) : 1; }
        else if (hy && !hx) { dy = 0; dx = Math.abs(tx) > 2 ? Math.sign(tx) : 1; }
      }
    }

    // Normalise diagonal
    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    this.wizard.setVelocity(dx * speed, dy * speed);

    const moving = dx !== 0 || dy !== 0;

    // A4: Walk bob — sync 1 px vertical bob to walk cycle
    // Walk animations are 8 fps, cycle ~500ms per frame
    if (moving !== this.isMoving) {
      this.isMoving = moving;
      this.bobAccum = 0;
    }

    if (moving) {
      this.bobAccum += delta;
      // Walk cycle: 8 fps = 125ms per frame; use 4-frame cycle (500ms)
      const bobCycle = this.bobAccum % 500;
      const bobPhase = (bobCycle / 500) * Math.PI * 2;
      const bobOffset = Math.sin(bobPhase) * 1; // 1 px amplitude

      // Apply bob to displayOriginY in pixels (61 - bobOffset keeps feet grounded)
      this.wizard.displayOriginY = 61 - bobOffset;

      // A4: Shadow scales with bob (0.92 ↔ 1.0)
      const shadowScale = 0.92 + (Math.cos(bobPhase) + 1) / 2 * 0.08;
      this.shadow.setScale((28 / 64) * shadowScale);
    } else {
      // Idle: no bob, reset to normal (displayOriginY = 61 px from top of 64px sprite)
      this.bobAccum = 0;
      this.wizard.displayOriginY = 61;
      this.shadow.setScale(28 / 64);
    }

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
    this.audio.updateFootsteps(this.sprinting ? delta * 1.6 : delta, moving, surface);
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
    // N5: no "raise the dead" prompt while fighting a zombie wave (F casts spells then)
    if (this.zombieWave?.active) {
      if (this.lastProxGraveId !== null) {
        this.lastProxGraveId = null;
        this.activeGrave = null;
        this.scene.get('UIScene')?.events.emit('proximityChanged', null);
      }
      return;
    }

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
    const cam = this.cameras.main;
    for (const fogObj of this.fogLayers) {
      // Update tile position based on camera scroll and parallax factor
      fogObj.sprite.tilePositionX += cam.scrollX * fogObj.sx;
      fogObj.sprite.tilePositionY += cam.scrollY * fogObj.sy;
    }
  }

  private updateCrow(delta: number): void {
    this.crowTimer += delta;
    // A9: Don't spawn crow while witch is active
    if (this.crowTimer >= this.crowInterval && !this.crow && !this.witch.isActive) {
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

  // ─── A8: Debug Hooks ─────────────────────────────────────────────────────

  /** A8: Teleport wizard to raw world coordinates and centre camera. */
  teleport(x: number, y: number): void {
    this.wizard.setPosition(x, y);
    this.cameras.main.centerOn(x, y);
  }

  /** A8: Trigger a witch fly-by immediately. */
  spawnWitch(): void {
    // A7: Use WitchFlyBy to spawn the witch
    this.witch.spawnNow();
  }
}
