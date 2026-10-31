/**
 * UIScene — HUD scene that runs on top of GraveyardWorld at zoom 1.
 * Contains: vignette, proximity hint, grave plaque, mute button, credits link, and mobile joystick.
 */
import Phaser from 'phaser';
import { GraveEntry, extractYear } from '../types/graves';
import { ProximityHint } from '../ui/ProximityHint';
import { Joystick } from '../ui/Joystick';

export class UIScene extends Phaser.Scene {
  private hint!: ProximityHint;
  private plaque!: Phaser.GameObjects.Container;
  private plaqueVisible = false;
  private muteBtn!: Phaser.GameObjects.Text;
  private joystick!: Joystick;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Vignette (fullscreen, non-interactive)
    const vignette = this.add.image(width / 2, height / 2, 'vignette_moonlit');
    vignette.setScrollFactor(0);
    vignette.setAlpha(0.7);
    vignette.setDepth(90);
    vignette.setDisplaySize(width, height);

    // Proximity hint
    this.hint = new ProximityHint(this);
    this.hint.setDepth(100);

    // Plaque container (initially hidden)
    this.plaque = this.createPlaque();
    this.plaque.setVisible(false);
    this.plaque.setDepth(95);

    // P1-18: Read saved mute state and apply to sound manager
    const isMuted = localStorage.getItem('rd_muted') === '1';
    this.sound.mute = isMuted;

    // Mute button
    this.muteBtn = this.add.text(width - 12, 12, isMuted ? '🔇' : '🔊', {
      fontSize: '22px',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
    this.muteBtn.setInteractive({ useHandCursor: true });
    this.muteBtn.on('pointerdown', () => {
      const world = this.scene.get('GraveyardWorld') as { audio?: { toggleMute(): void; isMuted: boolean } };
      if (world?.audio) {
        world.audio.toggleMute();
        this.updateMuteIcon(world.audio.isMuted);
      }
    });

    // Credits button
    const creditsBtn = this.add.text(12, 12, 'Credits', {
      fontFamily: "'Pixelify Sans', sans-serif",
      fontSize: '14px',
      color: '#5d6b80',
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(100);
    creditsBtn.setInteractive({ useHandCursor: true });
    creditsBtn.on('pointerover', () => creditsBtn.setColor('#c9b98a'));
    creditsBtn.on('pointerout',  () => creditsBtn.setColor('#5d6b80'));
    creditsBtn.on('pointerdown', () => {
      // P1-3: Hide plaque, hint, joystick before pausing
      this.hidePlaque();
      this.hint.hide(true);
      this.joystick.hide();
      
      // P1-3: Pause both UIScene and GraveyardWorld when opening Credits
      this.scene.launch('CreditsScene', { from: 'GraveyardWorld' });
      this.scene.pause('UIScene');
      this.scene.pause('GraveyardWorld');
    });

    // P0-5: Create joystick in UIScene (zoom 1, not affected by world camera zoom)
    this.joystick = new Joystick(this);
    this.joystick.onFPress(() => {
      const world = this.scene.get('GraveyardWorld') as { tryRaiseGrave?: () => void };
      world?.tryRaiseGrave?.();
    });

    // Listen for events from GraveyardWorld
    this.events.on('proximityChanged', this.onProximityChanged, this);
    this.events.on('plaqueChanged',    this.onPlaqueChanged,    this);
    this.events.on('muteChanged',      (muted: boolean) => this.updateMuteIcon(muted), this);

    // Listen for ritual and overlay events
    this.events.on('ritualStarted', () => {
      this.hidePlaque();
      // P0-4: Use immediate hide to prevent faint display under subtitles
      this.hint.hide(true);
      // P0-5: Hide joystick during ritual
      this.joystick.hide();
    });
    this.events.on('overlayOpened', () => {
      // P0-4: Use immediate hide during overlay
      this.hint.hide(true);
      // P0-5: Hide joystick during overlay
      this.joystick.hide();
    });
    this.events.on('ritualEnded', () => {
      // Plaque and hint will be restored by proximity check
      // P0-5: Show joystick again after ritual
      this.joystick.show();
    });
  }

  private updateMuteIcon(muted: boolean): void {
    this.muteBtn.setText(muted ? '🔇' : '🔊');
  }

  private onProximityChanged(grave: GraveEntry | null): void {
    if (grave && grave.resurrectable) {
      // P2-17: Update text based on whether joystick is active
      const text = this.joystick.active 
        ? 'Tap  F  to raise the dead'
        : 'Press  F  to raise the dead';
      this.hint.setText(text);
      this.hint.show();
    } else {
      this.hint.hide();
    }
  }

  private onPlaqueChanged(grave: GraveEntry | null): void {
    if (grave) {
      this.updatePlaque(grave);
      this.showPlaque();
    } else {
      this.hidePlaque();
    }
  }

  // ─── Plaque ──────────────────────────────────────────────────────────────

  private createPlaque(): Phaser.GameObjects.Container {
    const container = this.add.container(640, 24);

    const PANEL_W = 500; // P1-6: Widened from 440 to 500
    const PANEL_H = 200; // Will be updated dynamically
    const PADDING = 64;  // Bottom padding/border
    const PADDING_TOP = 60; // Top padding inside frame
    const PADDING_SIDE = 64; // Side padding inside frame

    // NineSlice panel
    const panel = this.add.nineslice(
      0, 0, 'frame_panel', undefined,
      PANEL_W, PANEL_H,
      60, 64, 60, 60
    );
    panel.setOrigin(0.5, 0);
    panel.setName('panel');

    // Inner content area
    const contentX = -PANEL_W / 2 + PADDING_SIDE;
    const contentY = PADDING_TOP;
    const contentW = PANEL_W - 2 * PADDING_SIDE;

    // Medallion (for resurrectable graves)
    const medallion = this.add.image(contentX, contentY, 'medal_generic');
    medallion.setOrigin(0, 0);
    medallion.setDisplaySize(56, 56);
    medallion.setName('medallion');

    // Name text (positioned to the right of medallion, same row)
    const nameText = this.add.text(contentX + 70, contentY, '', {
      fontFamily: "'Pixelify Sans', sans-serif",
      fontSize: '20px',
      color: '#d9f2ee',
      align: 'left',
    }).setOrigin(0, 0);
    nameText.setName('nameText');

    // Years text (same row as name, offset down slightly)
    const yearsText = this.add.text(contentX + 70, contentY + 28, '', {
      fontFamily: "'Pixelify Sans', sans-serif",
      fontSize: '15px',
      color: '#c9b98a',
      align: 'left',
    }).setOrigin(0, 0);
    yearsText.setName('yearsText');

    // Epitaph text (starts below medallion row)
    const epitaphText = this.add.text(contentX, contentY + 66, '', {
      fontFamily: "'Cinzel', serif",
      fontSize: '15px',
      fontStyle: 'italic',
      color: '#d9f2ee',
      align: 'left',
      wordWrap: { width: contentW },
    }).setOrigin(0, 0);
    epitaphText.setName('epitaphText');

    // Cause of death text (positioned after epitaph)
    const causeText = this.add.text(contentX, contentY + 66, '', {
      fontFamily: "'Pixelify Sans', sans-serif",
      fontSize: '13px',
      color: '#9aa8b8',
      align: 'left',
      wordWrap: { width: contentW },
    }).setOrigin(0, 0);
    causeText.setName('causeText');

    container.add([panel, medallion, nameText, yearsText, epitaphText, causeText]);
    container.setScrollFactor(0);

    return container;
  }

  private updatePlaque(grave: GraveEntry): void {
    const get = (name: string) =>
      this.plaque.getByName(name) as Phaser.GameObjects.Text | Phaser.GameObjects.Image;

    const born = extractYear(grave.born);
    const died = extractYear(grave.died);

    const nameText = get('nameText') as Phaser.GameObjects.Text;
    const yearsText = get('yearsText') as Phaser.GameObjects.Text;
    const epitaphText = get('epitaphText') as Phaser.GameObjects.Text;
    const causeText = get('causeText') as Phaser.GameObjects.Text;
    const medallion = get('medallion') as Phaser.GameObjects.Image;
    const panel = this.plaque.getByName('panel') as unknown as Phaser.GameObjects.NineSlice;

    // Set text content
    nameText.setText(grave.name);
    yearsText.setText(`${born} – ${died}`);
    epitaphText.setText(`"${grave.epitaph}"`);
    causeText.setText(`Cause of death: ${grave.cause_of_death}`);

    // Update medallion texture and visibility for resurrectable graves
    const medallionKeyMap: Record<string, string> = {
      'road-rash':      'medal_roadrash',
      'google-reader':  'medal_reader',
      'clippy':         'medal_clippy',
      'winamp':         'medal_winamp',
      'unmarked-grave': 'medal_unmarked',
    };
    
    const PANEL_W = 500;
    const PADDING_TOP = 60;
    const PADDING_SIDE = 64;
    const PADDING_BOTTOM = 64;
    const contentX = -PANEL_W / 2 + PADDING_SIDE;
    const contentY = PADDING_TOP;
    const contentW = PANEL_W - 2 * PADDING_SIDE;

    if (grave.resurrectable) {
      medallion.setVisible(true);
      const medalKey = medallionKeyMap[grave.id];
      if (medalKey) {
        medallion.setTexture(medalKey);
        medallion.setDisplaySize(56, 56);
      }
      
      // Position name/years to the right of medallion
      nameText.setPosition(contentX + 70, contentY);
      yearsText.setPosition(contentX + 70, contentY + 28);
      
      // Epitaph starts below medallion row
      epitaphText.setPosition(contentX, contentY + 66);
    } else {
      medallion.setVisible(false);
      
      // When no medallion, name/years move to contentX
      nameText.setPosition(contentX, contentY);
      yearsText.setPosition(contentX, contentY + 28);
      
      // Epitaph moved up when no medallion
      epitaphText.setPosition(contentX, contentY + 52);
    }

    // Position cause text directly below epitaph with 8px spacing
    causeText.setPosition(contentX, epitaphText.y + epitaphText.displayHeight + 8);

    // Dynamically resize panel to fit content
    const panelHeight = Math.max(
      200,
      causeText.y + causeText.displayHeight + PADDING_BOTTOM
    );
    panel.setSize(PANEL_W, panelHeight);
  }

  private showPlaque(): void {
    if (this.plaqueVisible) return;
    this.plaqueVisible = true;
    this.plaque.setVisible(true);
    this.plaque.setAlpha(0);
    this.tweens.add({
      targets: this.plaque,
      alpha: 1,
      duration: 250,
      ease: 'Sine.easeOut',
    });
  }

  public hidePlaque(): void {
    if (!this.plaqueVisible) return;
    this.plaqueVisible = false;
    this.plaque.setVisible(false);
    this.hint.hide();
  }
}
