/**
 * worldAssets.ts — Shared module for queuing world/ritual assets and creating animations.
 * Used by both TitleScene and GraveyardWorld to ensure assets are loaded before animations are created.
 */
import Phaser from 'phaser';

/**
 * Queue all world and ritual assets into the loader.
 * Phaser automatically skips keys already in cache, making this safe to call multiple times.
 */
export function queueWorldAssets(load: Phaser.Loader.LoaderPlugin): void {
  load.setPath(import.meta.env.BASE_URL);
  queueWorldImages(load);
  queueWorldAudio(load);
}

/**
 * Create wizard animations. Safe to call multiple times — only creates if not already exists.
 */
export function createWizardAnimations(scene: Phaser.Scene): void {
  const anims = scene.anims;

  // Wizard walk
  if (!anims.exists('walk_down')) {
    anims.create({
      key: 'walk_down',
      frames: anims.generateFrameNumbers('wizard_walk_down', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
  }
  if (!anims.exists('walk_up')) {
    anims.create({
      key: 'walk_up',
      frames: anims.generateFrameNumbers('wizard_walk_up', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
  }
  if (!anims.exists('walk_left')) {
    anims.create({
      key: 'walk_left',
      frames: anims.generateFrameNumbers('wizard_walk_left', { start: 0, end: 4 }),
      frameRate: 8,
      repeat: -1,
    });
  }
  if (!anims.exists('walk_right')) {
    anims.create({
      key: 'walk_right',
      frames: anims.generateFrameNumbers('wizard_walk_right', { start: 0, end: 4 }),
      frameRate: 8,
      repeat: -1,
    });
  }

  // Wizard idle
  if (!anims.exists('idle')) {
    anims.create({
      key: 'idle',
      frames: anims.generateFrameNumbers('wizard_idle', { start: 0, end: 6 }),
      frameRate: 6,
      repeat: -1,
    });
  }

  // Wizard attack
  if (!anims.exists('atk_front')) {
    anims.create({
      key: 'atk_front',
      frames: anims.generateFrameNumbers('wizard_atk_front', { start: 0, end: 6 }),
      frameRate: 10,
      repeat: 0,
    });
  }
  if (!anims.exists('atk_left')) {
    anims.create({
      key: 'atk_left',
      frames: anims.generateFrameNumbers('wizard_atk_left', { start: 0, end: 6 }),
      frameRate: 10,
      repeat: 0,
    });
  }
  if (!anims.exists('atk_right')) {
    anims.create({
      key: 'atk_right',
      frames: anims.generateFrameNumbers('wizard_atk_right', { start: 0, end: 6 }),
      frameRate: 10,
      repeat: 0,
    });
  }
  if (!anims.exists('atk_behind')) {
    anims.create({
      key: 'atk_behind',
      frames: anims.generateFrameNumbers('wizard_atk_behind', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: 0,
    });
  }
}

function queueWorldImages(load: Phaser.Loader.LoaderPlugin): void {
  // World tiles
  load.image('ground_grass', 'assets/images/world/ground_grass.png');
  load.image('ground_path', 'assets/images/world/ground_path.png');

  // Tombstones
  load.image('tomb_plain', 'assets/images/world/tomb_plain.png');
  load.image('tomb_cracked', 'assets/images/world/tomb_cracked.png');
  load.image('tomb_rubble', 'assets/images/world/tomb_rubble.png');
  load.image('tomb_deco_cross', 'assets/images/world/tomb_deco_cross.png');
  load.image('tomb_deco_square', 'assets/images/world/tomb_deco_square.png');
  load.image('tomb_deco_obelisk', 'assets/images/world/tomb_deco_obelisk.png');

  // Trees
  load.image('tree_1', 'assets/images/world/tree_1.png');
  load.image('tree_2', 'assets/images/world/tree_2.png');
  load.image('tree_3', 'assets/images/world/tree_3.png');
  load.image('tree_4', 'assets/images/world/tree_4.png');

  // Jack-o'-lantern & crow
  load.image('jackolantern_lit', 'assets/images/world/jackolantern_lit.png');
  load.image('crow_flying', 'assets/images/world/crow_flying.png');

  // FX
  load.image('fog_tile', 'assets/images/fx/fog_tile.png');
  load.image('glow_moon', 'assets/images/fx/glow_moon.png');
  load.image('glow_warm', 'assets/images/fx/glow_warm.png');
  load.image('holy_light_burst', 'assets/images/fx/holy_light_burst.png');
  load.image('rune_circle_add', 'assets/images/fx/rune_circle_add.png');
  
  // A3: Shadows
  load.image('shadow_contact', 'assets/images/fx/shadow_contact.png');
  load.image('shadow_cast', 'assets/images/fx/shadow_cast.png');

  // A3: Ground decals
  load.image('decal_dirt_patch', 'assets/images/decals/decal_dirt_patch.png');
  load.image('decal_grass_tuft', 'assets/images/decals/decal_grass_tuft.png');
  load.image('decal_grass_tuft_flowers', 'assets/images/decals/decal_grass_tuft_flowers.png');
  load.image('decal_grave_mound', 'assets/images/decals/decal_grave_mound.png');
  load.image('decal_leaf_litter', 'assets/images/decals/decal_leaf_litter.png');
  load.image('decal_mushrooms', 'assets/images/decals/decal_mushrooms.png');
  load.image('decal_pebbles', 'assets/images/decals/decal_pebbles.png');
  load.image('decal_roots', 'assets/images/decals/decal_roots.png');
  load.image('decal_sunken_soil', 'assets/images/decals/decal_sunken_soil.png');

  // Kenney particles
  load.image('kenney_spark_01', 'assets/images/kenney/spark_01.png');
  load.image('kenney_smoke_04', 'assets/images/kenney/smoke_04.png');

  // Particles
  load.image('wisp', 'assets/images/particles/wisp.png');
  load.image('firefly_dot', 'assets/images/particles/firefly_dot.png');
  load.image('leaf_1', 'assets/images/particles/leaf_1.png');
  load.image('leaf_2', 'assets/images/particles/leaf_2.png');
  load.image('leaf_3', 'assets/images/particles/leaf_3.png');
  load.image('leaf_4', 'assets/images/particles/leaf_4.png');
  load.image('leaf_5', 'assets/images/particles/leaf_5.png');
  load.image('leaf_6', 'assets/images/particles/leaf_6.png');
  load.image('leaf_7', 'assets/images/particles/leaf_7.png');
  load.image('leaf_8', 'assets/images/particles/leaf_8.png');

  // Portraits / medals
  load.image('medal_roadrash', 'assets/images/portraits/medal_roadrash.png');
  load.image('medal_reader', 'assets/images/portraits/medal_reader.png');
  load.image('medal_clippy', 'assets/images/portraits/medal_clippy.png');
  load.image('medal_winamp', 'assets/images/portraits/medal_winamp.png');
  load.image('medal_unmarked', 'assets/images/portraits/medal_unmarked.png');

  // A7: Witch fly-by
  load.image('witch_broom', 'assets/images/eggs/witch_broom.png');

  // Wizard spritesheets (64×64 frames)
  load.spritesheet('wizard_walk_down', 'assets/images/wizard/walk_down.png', {
    frameWidth: 64,
    frameHeight: 64,
  });
  load.spritesheet('wizard_walk_up', 'assets/images/wizard/walk_up.png', {
    frameWidth: 64,
    frameHeight: 64,
  });
  load.spritesheet('wizard_walk_left', 'assets/images/wizard/walk_left.png', {
    frameWidth: 64,
    frameHeight: 64,
  });
  load.spritesheet('wizard_walk_right', 'assets/images/wizard/walk_right.png', {
    frameWidth: 64,
    frameHeight: 64,
  });
  load.spritesheet('wizard_idle', 'assets/images/wizard/mage_idle.png', {
    frameWidth: 64,
    frameHeight: 64,
  });
  load.spritesheet('wizard_atk_front', 'assets/images/wizard/attack_front.png', {
    frameWidth: 64,
    frameHeight: 64,
  });
  load.spritesheet('wizard_atk_left', 'assets/images/wizard/attack_left.png', {
    frameWidth: 64,
    frameHeight: 64,
  });
  load.spritesheet('wizard_atk_right', 'assets/images/wizard/attack_right.png', {
    frameWidth: 64,
    frameHeight: 64,
  });
  load.spritesheet('wizard_atk_behind', 'assets/images/wizard/attack_behind.png', {
    frameWidth: 64,
    frameHeight: 64,
  });
}

function queueWorldAudio(load: Phaser.Loader.LoaderPlugin): void {
  // Music
  load.audio('moonlit_lullaby', [
    'assets/audio/music/moonlit_lullaby_loop.ogg',
    'assets/audio/music/moonlit_lullaby_loop.mp3',
  ]);

  // Ambient
  load.audio('wind_howl_loop', ['assets/audio/ambient/wind_howl_loop.ogg', 'assets/audio/ambient/wind_howl_loop.mp3']);
  load.audio('night_crickets_loop', [
    'assets/audio/ambient/night_crickets_loop.ogg',
    'assets/audio/ambient/night_crickets_loop.mp3',
  ]);
  load.audio('ghost_whispers_loop', [
    'assets/audio/ambient/ghost_whispers_loop.ogg',
    'assets/audio/ambient/ghost_whispers_loop.mp3',
  ]);
  load.audio('owl_hoot_01', ['assets/audio/ambient/owl_hoot_01.ogg', 'assets/audio/ambient/owl_hoot_01.mp3']);
  load.audio('owl_hoot_02', ['assets/audio/ambient/owl_hoot_02.ogg', 'assets/audio/ambient/owl_hoot_02.mp3']);
  load.audio('crows_distant_01', [
    'assets/audio/ambient/crows_distant_01.ogg',
    'assets/audio/ambient/crows_distant_01.mp3',
  ]);
  load.audio('crow_caw_02', ['assets/audio/ambient/crow_caw_02.ogg', 'assets/audio/ambient/crow_caw_02.mp3']);
  load.audio('tree_creak_01', ['assets/audio/ambient/tree_creak_01.ogg', 'assets/audio/ambient/tree_creak_01.mp3']);
  load.audio('gate_creak_01', ['assets/audio/ambient/gate_creak_01.ogg', 'assets/audio/ambient/gate_creak_01.mp3']);

  // Footsteps — dirt_01..08
  for (let i = 1; i <= 8; i++) {
    const n = String(i).padStart(2, '0');
    load.audio(`dirt_0${i}`, [
      `assets/audio/footsteps/dirt_${n}.ogg`,
      `assets/audio/footsteps/dirt_${n}.mp3`,
    ]);
  }
  // Footsteps — gravel_01..08
  for (let i = 1; i <= 8; i++) {
    const n = String(i).padStart(2, '0');
    load.audio(`gravel_0${i}`, [
      `assets/audio/footsteps/gravel_${n}.ogg`,
      `assets/audio/footsteps/gravel_${n}.mp3`,
    ]);
  }

  // UI
  load.audio('prompt_press_f', ['assets/audio/ui/prompt_press_f.ogg', 'assets/audio/ui/prompt_press_f.mp3']);
  load.audio('ritual_confirm', ['assets/audio/ui/ritual_confirm.ogg', 'assets/audio/ui/ritual_confirm.mp3']);

  // Exorcism / ritual
  load.audio('rune_sparkles', ['assets/audio/exorcism/rune_sparkles.ogg', 'assets/audio/exorcism/rune_sparkles.mp3']);
  load.audio('chant_drone_loop', ['assets/audio/exorcism/chant_drone_loop.ogg', 'assets/audio/exorcism/chant_drone_loop.mp3']);
  load.audio('wind_swell', ['assets/audio/exorcism/wind_swell.ogg', 'assets/audio/exorcism/wind_swell.mp3']);
  load.audio('ground_rumble', ['assets/audio/exorcism/ground_rumble.ogg', 'assets/audio/exorcism/ground_rumble.mp3']);
  load.audio('stone_crack_crumble', [
    'assets/audio/exorcism/stone_crack_crumble.ogg',
    'assets/audio/exorcism/stone_crack_crumble.mp3',
  ]);
  load.audio('holy_light_burst_sfx', [
    'assets/audio/exorcism/holy_light_burst.ogg',
    'assets/audio/exorcism/holy_light_burst.mp3',
  ]);
  load.audio('choir_aah', ['assets/audio/exorcism/choir_aah.ogg', 'assets/audio/exorcism/choir_aah.mp3']);
  load.audio('app_open_shimmer', [
    'assets/audio/exorcism/app_open_shimmer.ogg',
    'assets/audio/exorcism/app_open_shimmer.mp3',
  ]);
  load.audio('app_sink', ['assets/audio/exorcism/app_sink.ogg', 'assets/audio/exorcism/app_sink.mp3']);
  load.audio('rip_bell_toll', ['assets/audio/exorcism/rip_bell_toll.ogg', 'assets/audio/exorcism/rip_bell_toll.mp3']);

  // Voice incantations
  load.audio('incant_roadrash', ['assets/voice/incant_roadrash.ogg', 'assets/voice/incant_roadrash.mp3']);
  load.audio('incant_googlereader', ['assets/voice/incant_googlereader.ogg', 'assets/voice/incant_googlereader.mp3']);
  load.audio('incant_clippy', ['assets/voice/incant_clippy.ogg', 'assets/voice/incant_clippy.mp3']);
  load.audio('incant_winamp', ['assets/voice/incant_winamp.ogg', 'assets/voice/incant_winamp.mp3']);
  load.audio('incant_unmarked', ['assets/voice/incant_unmarked.ogg', 'assets/voice/incant_unmarked.mp3']);
  load.audio('incant_generic', ['assets/voice/incant_generic.ogg', 'assets/voice/incant_generic.mp3']);
  load.audio('farewell_requiescat', ['assets/voice/farewell_requiescat.ogg', 'assets/voice/farewell_requiescat.mp3']);

  // A7: Witch fly-by audio
  load.audio('witch_cackle', ['assets/audio/sfx/witch_cackle.ogg', 'assets/audio/sfx/witch_cackle.mp3']);
  load.audio('witch_cackle_2', ['assets/audio/sfx/witch_cackle_2.ogg', 'assets/audio/sfx/witch_cackle_2.mp3']);
}
