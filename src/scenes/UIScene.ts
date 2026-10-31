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

    const PANEL_W = 440;
    const PANEL_H = 210;
    const PADDING = 34;

    // NineSlice panel
    const panel = this.add.nineslice(
      0, 0, 'frame_panel', undefined,
      PANEL_W, PANEL_H,
      60, 64, 60, 60
    );
    panel.setOrigin(0.5, 0);

    // Inner content area
    const contentX = -PANEL_W / 2 + PADDING;
    const contentY = PADDING;
    const contentW = PANEL_W - 2 * PADDING;
    const contentH = PANEL_H - 2 * PADDING;

    // Medallion (for resurrectable graves)
    const medallion = this.add.image(contentX, contentY + 28, 'medal_generic');
    medallion.setOrigin(0, 0);
    medallion.setDisplaySize(56, 56);
    medallion.setName('medallion');

    // Name text (positioned to the right of medallion)
    const nameText = this.add.text(contentX + 70, contentY, '', {
      fontFamily: "'Pixelify Sans', sans-serif",
      fontSize: '20px',
      color: '#d9f2ee',
      align: 'left',
    }).setOrigin(0, 0);
    nameText.setName('nameText');

    // Years text
    const yearsText = this.add.text(contentX + 70, contentY + 28, '', {
      fontFamily: "'Pixelify Sans', sans-serif",
      fontSize: '15px',
      color: '#c9b98a',
      align: 'left',
    }).setOrigin(0, 0);
    yearsText.setName('yearsText');

    // Epitaph text
    const epitaphText = this.add.text(contentX, contentY + 60, '', {
      fontFamily: "'Cinzel', serif",
      fontSize: '15px',
      fontStyle: 'italic',
      color: '#d9f2ee',
      align: 'left',
      wordWrap: { width: contentW },
    }).setOrigin(0, 0);
    epitaphText.setName('epitaphText');

    // Cause of death text
    const causeText = this.add.text(contentX, contentY + 120, '', {
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

    (get('nameText') as Phaser.GameObjects.Text).setText(grave.name);
    (get('yearsText') as Phaser.GameObjects.Text).setText(`${born} – ${died}`);
    (get('epitaphText') as Phaser.GameObjects.Text).setText(`"${grave.epitaph}"`);
    (get('causeText') as Phaser.GameObjects.Text).setText(`Cause of death: ${grave.cause_of_death}`);

    // Update medallion visibility for resurrectable graves
    const medallion = get('medallion') as Phaser.GameObjects.Image;
    if (grave.resurrectable) {
      medallion.setVisible(true);
    } else {
      medallion.setVisible(false);
    }
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
    this.tweens.add({
      targets: this.plaque,
      alpha: 0,
      duration: 200,
      onComplete: () => this.plaque.setVisible(false),
    });
  }
}
