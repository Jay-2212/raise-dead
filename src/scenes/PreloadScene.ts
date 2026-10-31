/**
 * PreloadScene — loads all game assets with a progress bar, then starts TitleScene.
 */
import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.createProgressBar();
    this.loadImages();
    this.loadAudio();
    this.loadData();
  }

  private createProgressBar(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add.rectangle(cx, cy, 400, 4, 0x1c2a4a);
    const bar = this.add.rectangle(cx - 200, cy, 0, 4, 0x7fd1d8).setOrigin(0, 0.5);

    const pct = this.add.text(cx, cy + 20, '0%', {
      fontFamily: "'Pixelify Sans', sans-serif",
      fontSize: '14px',
      color: '#5d6b80',
    }).setOrigin(0.5, 0);

    const label = this.add.text(cx, cy - 24, 'RAISE DEAD', {
      fontFamily: "'Cinzel', serif",
      fontSize: '22px',
      color: '#d9f2ee',
    }).setOrigin(0.5, 0.5);
    label.setAlpha(0.7);

    this.load.on('progress', (v: number) => {
      bar.width = 400 * v;
      pct.setText(Math.round(v * 100) + '%');
    });
  }

  private loadImages(): void {
    // Backgrounds
    this.load.image('title_keyart',  '/assets/images/backgrounds/title_keyart.jpg');
    this.load.image('sky_moon',      '/assets/images/backgrounds/sky_moon.jpg');

    // World tiles
    this.load.image('ground_grass',  '/assets/images/world/ground_grass.png');
    this.load.image('ground_path',   '/assets/images/world/ground_path.png');

    // Tombstones
    this.load.image('tomb_plain',       '/assets/images/world/tomb_plain.png');
    this.load.image('tomb_cracked',     '/assets/images/world/tomb_cracked.png');
    this.load.image('tomb_rubble',      '/assets/images/world/tomb_rubble.png');
    this.load.image('tomb_deco_cross',  '/assets/images/world/tomb_deco_cross.png');
    this.load.image('tomb_deco_square', '/assets/images/world/tomb_deco_square.png');
    this.load.image('tomb_deco_obelisk','/assets/images/world/tomb_deco_obelisk.png');

    // Trees
    this.load.image('tree_1', '/assets/images/world/tree_1.png');
    this.load.image('tree_2', '/assets/images/world/tree_2.png');
    this.load.image('tree_3', '/assets/images/world/tree_3.png');
    this.load.image('tree_4', '/assets/images/world/tree_4.png');

    // Jack-o'-lantern & crow
    this.load.image('jackolantern_lit', '/assets/images/world/jackolantern_lit.png');
    this.load.image('crow_flying',      '/assets/images/world/crow_flying.png');
    this.load.image('crow_perched',     '/assets/images/world/crow_perched.png');

    // FX
    this.load.image('fog_tile',         '/assets/images/fx/fog_tile.png');
    this.load.image('fog_puff',         '/assets/images/fx/fog_puff.png');
    this.load.image('glow_moon',        '/assets/images/fx/glow_moon.png');
    this.load.image('glow_warm',        '/assets/images/fx/glow_warm.png');
    this.load.image('holy_light_burst', '/assets/images/fx/holy_light_burst.png');
    this.load.image('rune_circle',      '/assets/images/fx/rune_circle.png');
    this.load.image('rune_circle_add',  '/assets/images/fx/rune_circle_add.png');

    // Kenney particles
    this.load.image('kenney_spark_01',  '/assets/images/kenney/spark_01.png');
    this.load.image('kenney_spark_04',  '/assets/images/kenney/spark_04.png');
    this.load.image('kenney_magic_01',  '/assets/images/kenney/magic_01.png');
    this.load.image('kenney_magic_03',  '/assets/images/kenney/magic_03.png');
    this.load.image('kenney_smoke_04',  '/assets/images/kenney/smoke_04.png');
    this.load.image('kenney_star_01',   '/assets/images/kenney/star_01.png');
    this.load.image('kenney_light_01',  '/assets/images/kenney/light_01.png');
    this.load.image('kenney_twirl_01',  '/assets/images/kenney/twirl_01.png');

    // Particles
    this.load.image('wisp',             '/assets/images/particles/wisp.png');
    this.load.image('firefly_dot',      '/assets/images/particles/firefly_dot.png');
    this.load.image('leaf_1',           '/assets/images/particles/leaf_1.png');
    this.load.image('leaf_2',           '/assets/images/particles/leaf_2.png');
    this.load.image('leaf_3',           '/assets/images/particles/leaf_3.png');
    this.load.image('leaf_4',           '/assets/images/particles/leaf_4.png');
    this.load.image('leaf_5',           '/assets/images/particles/leaf_5.png');
    this.load.image('leaf_6',           '/assets/images/particles/leaf_6.png');
    this.load.image('leaf_7',           '/assets/images/particles/leaf_7.png');
    this.load.image('leaf_8',           '/assets/images/particles/leaf_8.png');

    // Spritesheets — leaves strip (96×12, 8 frames of 12×12)
    this.load.spritesheet('leaves_strip', '/assets/images/particles/leaves_strip.png', {
      frameWidth: 12, frameHeight: 12,
    });

    // UI
    this.load.image('frame_panel',       '/assets/images/ui/frame_panel.png');
    this.load.image('vignette_moonlit',  '/assets/images/ui/vignette_moonlit.png');

    // Portraits / medals
    this.load.image('medal_roadrash',  '/assets/images/portraits/medal_roadrash.png');
    this.load.image('medal_reader',    '/assets/images/portraits/medal_reader.png');
    this.load.image('medal_clippy',    '/assets/images/portraits/medal_clippy.png');
    this.load.image('medal_winamp',    '/assets/images/portraits/medal_winamp.png');
    this.load.image('medal_unmarked',  '/assets/images/portraits/medal_unmarked.png');

    // Wizard spritesheets (64×64 frames)
    this.load.spritesheet('wizard_walk_down',  '/assets/images/wizard/walk_down.png',  { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('wizard_walk_up',    '/assets/images/wizard/walk_up.png',    { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('wizard_walk_left',  '/assets/images/wizard/walk_left.png',  { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('wizard_walk_right', '/assets/images/wizard/walk_right.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('wizard_idle',       '/assets/images/wizard/mage_idle.png',  { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('wizard_atk_front',  '/assets/images/wizard/attack_front.png',  { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('wizard_atk_left',   '/assets/images/wizard/attack_left.png',   { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('wizard_atk_right',  '/assets/images/wizard/attack_right.png',  { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('wizard_atk_behind', '/assets/images/wizard/attack_behind.png', { frameWidth: 64, frameHeight: 64 });
  }

  private loadAudio(): void {
    // Music
    this.load.audio('title_waltz',       ['/assets/audio/music/title_musicbox_spooky_waltz.ogg', '/assets/audio/music/title_musicbox_spooky_waltz.mp3']);
    this.load.audio('moonlit_lullaby',   ['/assets/audio/music/moonlit_lullaby_loop.ogg', '/assets/audio/music/moonlit_lullaby_loop.mp3']);

    // Ambient
    this.load.audio('wind_howl_loop',        ['/assets/audio/ambient/wind_howl_loop.ogg', '/assets/audio/ambient/wind_howl_loop.mp3']);
    this.load.audio('night_crickets_loop',   ['/assets/audio/ambient/night_crickets_loop.ogg', '/assets/audio/ambient/night_crickets_loop.mp3']);
    this.load.audio('ghost_whispers_loop',   ['/assets/audio/ambient/ghost_whispers_loop.ogg', '/assets/audio/ambient/ghost_whispers_loop.mp3']);
    this.load.audio('owl_hoot_01',           ['/assets/audio/ambient/owl_hoot_01.ogg', '/assets/audio/ambient/owl_hoot_01.mp3']);
    this.load.audio('owl_hoot_02',           ['/assets/audio/ambient/owl_hoot_02.ogg', '/assets/audio/ambient/owl_hoot_02.mp3']);
    this.load.audio('crows_distant_01',      ['/assets/audio/ambient/crows_distant_01.ogg', '/assets/audio/ambient/crows_distant_01.mp3']);
    this.load.audio('crow_caw_02',           ['/assets/audio/ambient/crow_caw_02.ogg', '/assets/audio/ambient/crow_caw_02.mp3']);
    this.load.audio('tree_creak_01',         ['/assets/audio/ambient/tree_creak_01.ogg', '/assets/audio/ambient/tree_creak_01.mp3']);
    this.load.audio('gate_creak_01',         ['/assets/audio/ambient/gate_creak_01.ogg', '/assets/audio/ambient/gate_creak_01.mp3']);

    // Footsteps — dirt_01..08
    for (let i = 1; i <= 8; i++) {
      const n = String(i).padStart(2, '0');
      this.load.audio(`dirt_0${i}`, [`/assets/audio/footsteps/dirt_${n}.ogg`, `/assets/audio/footsteps/dirt_${n}.mp3`]);
    }
    // Footsteps — gravel_01..08
    for (let i = 1; i <= 8; i++) {
      const n = String(i).padStart(2, '0');
      this.load.audio(`gravel_0${i}`, [`/assets/audio/footsteps/gravel_${n}.ogg`, `/assets/audio/footsteps/gravel_${n}.mp3`]);
    }

    // UI
    this.load.audio('prompt_press_f',  ['/assets/audio/ui/prompt_press_f.ogg', '/assets/audio/ui/prompt_press_f.mp3']);
    this.load.audio('ritual_confirm',  ['/assets/audio/ui/ritual_confirm.ogg', '/assets/audio/ui/ritual_confirm.mp3']);
    this.load.audio('ui_hover',        ['/assets/audio/ui/hover.ogg', '/assets/audio/ui/hover.mp3']);
    this.load.audio('ui_select',       ['/assets/audio/ui/select.ogg', '/assets/audio/ui/select.mp3']);
    this.load.audio('ui_back',         ['/assets/audio/ui/back.ogg', '/assets/audio/ui/back.mp3']);
    this.load.audio('open_panel',      ['/assets/audio/ui/open_panel.ogg', '/assets/audio/ui/open_panel.mp3']);
    this.load.audio('close_panel',     ['/assets/audio/ui/close_panel.ogg', '/assets/audio/ui/close_panel.mp3']);

    // Exorcism / ritual
    this.load.audio('rune_sparkles',        ['/assets/audio/exorcism/rune_sparkles.ogg', '/assets/audio/exorcism/rune_sparkles.mp3']);
    this.load.audio('rune_sparkle_short',   ['/assets/audio/exorcism/rune_sparkle_short.ogg', '/assets/audio/exorcism/rune_sparkle_short.mp3']);
    this.load.audio('chant_drone_loop',     ['/assets/audio/exorcism/chant_drone_loop.ogg', '/assets/audio/exorcism/chant_drone_loop.mp3']);
    this.load.audio('wind_swell',           ['/assets/audio/exorcism/wind_swell.ogg', '/assets/audio/exorcism/wind_swell.mp3']);
    this.load.audio('ground_rumble',        ['/assets/audio/exorcism/ground_rumble.ogg', '/assets/audio/exorcism/ground_rumble.mp3']);
    this.load.audio('stone_crack_crumble',  ['/assets/audio/exorcism/stone_crack_crumble.ogg', '/assets/audio/exorcism/stone_crack_crumble.mp3']);
    this.load.audio('holy_light_burst_sfx', ['/assets/audio/exorcism/holy_light_burst.ogg', '/assets/audio/exorcism/holy_light_burst.mp3']);
    this.load.audio('choir_aah',            ['/assets/audio/exorcism/choir_aah.ogg', '/assets/audio/exorcism/choir_aah.mp3']);
    this.load.audio('app_open_shimmer',     ['/assets/audio/exorcism/app_open_shimmer.ogg', '/assets/audio/exorcism/app_open_shimmer.mp3']);
    this.load.audio('app_sink',             ['/assets/audio/exorcism/app_sink.ogg', '/assets/audio/exorcism/app_sink.mp3']);
    this.load.audio('rip_bell_toll',        ['/assets/audio/exorcism/rip_bell_toll.ogg', '/assets/audio/exorcism/rip_bell_toll.mp3']);

    // Voice incantations
    this.load.audio('incant_roadrash',      ['/assets/voice/incant_roadrash.ogg', '/assets/voice/incant_roadrash.mp3']);
    this.load.audio('incant_googlereader',  ['/assets/voice/incant_googlereader.ogg', '/assets/voice/incant_googlereader.mp3']);
    this.load.audio('incant_clippy',        ['/assets/voice/incant_clippy.ogg', '/assets/voice/incant_clippy.mp3']);
    this.load.audio('incant_winamp',        ['/assets/voice/incant_winamp.ogg', '/assets/voice/incant_winamp.mp3']);
    this.load.audio('incant_unmarked',      ['/assets/voice/incant_unmarked.ogg', '/assets/voice/incant_unmarked.mp3']);
    this.load.audio('incant_generic',       ['/assets/voice/incant_generic.ogg', '/assets/voice/incant_generic.mp3']);
    this.load.audio('farewell_requiescat',  ['/assets/voice/farewell_requiescat.ogg', '/assets/voice/farewell_requiescat.mp3']);
  }

  private loadData(): void {
    this.load.json('graves',      '/data/graves.json');
    this.load.json('voice_lines', '/data/voice_lines.json');
  }

  create(): void {
    this.createAnimations();
    this.scene.start('TitleScene');
  }

  private createAnimations(): void {
    // Wizard walk
    this.anims.create({ key: 'walk_down',  frames: this.anims.generateFrameNumbers('wizard_walk_down',  { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'walk_up',    frames: this.anims.generateFrameNumbers('wizard_walk_up',    { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'walk_left',  frames: this.anims.generateFrameNumbers('wizard_walk_left',  { start: 0, end: 4 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'walk_right', frames: this.anims.generateFrameNumbers('wizard_walk_right', { start: 0, end: 4 }), frameRate: 8, repeat: -1 });
    // Wizard idle
    this.anims.create({ key: 'idle',       frames: this.anims.generateFrameNumbers('wizard_idle',       { start: 0, end: 6 }), frameRate: 6, repeat: -1 });
    // Wizard attack
    this.anims.create({ key: 'atk_front',  frames: this.anims.generateFrameNumbers('wizard_atk_front',  { start: 0, end: 6 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'atk_left',   frames: this.anims.generateFrameNumbers('wizard_atk_left',   { start: 0, end: 6 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'atk_right',  frames: this.anims.generateFrameNumbers('wizard_atk_right',  { start: 0, end: 6 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'atk_behind', frames: this.anims.generateFrameNumbers('wizard_atk_behind', { start: 0, end: 5 }), frameRate: 10, repeat: 0 });
  }
}
