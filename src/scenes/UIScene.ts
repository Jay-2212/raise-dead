/**
 * UIScene — HUD scene that runs on top of GraveyardWorld at zoom 1.
 * Contains: vignette, proximity hint, grave plaque, mute button, credits link.
 */
import Phaser from 'phaser';
import { GraveEntry, extractYear } from '../types/graves';
import { ProximityHint } from '../ui/ProximityHint';

export class UIScene extends Phaser.Scene {
  private hint!: ProximityHint;
  private plaque!: Phaser.GameObjects.Container;
  private plaqueVisible = false;
  private muteBtn!: Phaser.GameObjects.Text;

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

    // Mute button
    this.muteBtn = this.add.text(width - 12, 12, '🔊', {
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
      this.scene.launch('CreditsScene', { from: 'GraveyardWorld' });
    });

    // Listen for events from GraveyardWorld
    this.events.on('proximityChanged', this.onProximityChanged, this);
    this.events.on('plaqueChanged',    this.onPlaqueChanged,    this);
    this.events.on('muteChanged',      (muted: boolean) => this.updateMuteIcon(muted), this);
  }

  private updateMuteIcon(muted: boolean): void {
    this.muteBtn.setText(muted ? '🔇' : '🔊');
  }

  private onProximityChanged(grave: GraveEntry | null): void {
    if (grave && grave.resurrectable) {
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
    const container = this.add.container(640, 120);

    const PANEL_W = 380;
    const PANEL_H = 140;

    // NineSlice panel
    const panel = this.add.nineslice(
      0, 0, 'frame_panel', undefined,
      PANEL_W, PANEL_H,
      64, 64, 60, 60
    );
    panel.setOrigin(0.5, 0);

    // Name text (placeholder — updated in updatePlaque)
    const nameText = this.add.text(0, 18, '', {
      fontFamily: "'Cinzel', serif",
      fontSize: '15px',
      color: '#d9f2ee',
      align: 'center',
      wordWrap: { width: PANEL_W - 80 },
    }).setOrigin(0.5, 0);
    nameText.setName('nameText');

    const yearsText = this.add.text(0, 42, '', {
      fontFamily: "'Pixelify Sans', sans-serif",
      fontSize: '11px',
      color: '#c9b98a',
      align: 'center',
    }).setOrigin(0.5, 0);
    yearsText.setName('yearsText');

    const epitaphText = this.add.text(0, 62, '', {
      fontFamily: "'Cinzel', serif",
      fontSize: '10px',
      fontStyle: 'italic',
      color: '#d9f2ee',
      align: 'center',
      wordWrap: { width: PANEL_W - 80 },
    }).setOrigin(0.5, 0);
    epitaphText.setName('epitaphText');

    const causeText = this.add.text(0, 98, '', {
      fontFamily: "'Pixelify Sans', sans-serif",
      fontSize: '9px',
      color: '#5d6b80',
      align: 'center',
      wordWrap: { width: PANEL_W - 80 },
    }).setOrigin(0.5, 0);
    causeText.setName('causeText');

    container.add([panel, nameText, yearsText, epitaphText, causeText]);
    container.setScrollFactor(0);

    return container;
  }

  private updatePlaque(grave: GraveEntry): void {
    const get = (name: string) =>
      this.plaque.getByName(name) as Phaser.GameObjects.Text;

    const born = extractYear(grave.born);
    const died = extractYear(grave.died);

    get('nameText').setText(grave.name);
    get('yearsText').setText(`${born} – ${died}`);
    get('epitaphText').setText(`"${grave.epitaph}"`);
    get('causeText').setText(`Cause of death: ${grave.cause_of_death}`);
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

  private hidePlaque(): void {
    if (!this.plaqueVisible) return;
    this.plaqueVisible = false;
    this.tweens.add({
      targets: this.plaque,
      alpha: 0,
      duration: 200,
      onComplete: () => this.plaque.setVisible(false),
    });
  }
}
