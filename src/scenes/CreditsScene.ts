/**
 * CreditsScene — fetches /CREDITS.md, renders it in a scrollable panel,
 * with required attributions pinned at the top. Esc/Back returns to caller.
 */
import Phaser from 'phaser';

const REQUIRED = [
  'Wizard sprite by Movicx (opengameart.org/users/movicx), CC-BY 3.0 — https://opengameart.org/content/wizard-sprite-sheet',
  'Footstep sounds (dirt) by congusbongus, from "footstep-grass.wav" by swuing (freesound.org), CC-BY 3.0 — https://opengameart.org/content/footsteps-on-different-surfaces',
];

interface CreditsInitData {
  from: string;
}

export class CreditsScene extends Phaser.Scene {
  private fromScene = 'TitleScene';
  private creditsLines: string[] = [];
  private scrollY = 0;
  private lineHeight = 18;
  private contentHeight = 0;
  private textContainer!: Phaser.GameObjects.Container;
  private mask!: Phaser.Display.Masks.GeometryMask;

  constructor() {
    super({ key: 'CreditsScene' });
  }

  init(data: CreditsInitData): void {
    this.fromScene = data?.from ?? 'TitleScene';
  }

  create(): void {
    const { width, height } = this.scale;

    // Dark overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x0b1020, 0.96).setDepth(0);

    // Title
    this.add.text(width / 2, 32, 'CREDITS', {
      fontFamily: "'Cinzel', serif",
      fontSize: '28px',
      color: '#d9f2ee',
    }).setOrigin(0.5, 0.5).setDepth(5);

    // Back button
    const backBtn = this.add.text(32, height - 36, '← Back', {
      fontFamily: "'Pixelify Sans', sans-serif",
      fontSize: '16px',
      color: '#5d6b80',
    }).setOrigin(0, 0.5).setDepth(5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setColor('#c9b98a'));
    backBtn.on('pointerout',  () => backBtn.setColor('#5d6b80'));
    backBtn.on('pointerdown', () => this.goBack());

    // Esc
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => this.goBack());

    // Scroll container (will be populated after fetch)
    this.textContainer = this.add.container(0, 0).setDepth(3);

    // Mask for scroll area
    const maskRect = this.add.rectangle(width / 2, 340, width - 40, height - 140, 0xffffff)
      .setVisible(false)
      .setDepth(3);
    this.mask = new Phaser.Display.Masks.GeometryMask(this, maskRect as unknown as Phaser.GameObjects.Graphics);
    this.textContainer.setMask(this.mask);

    // Scroll input
    this.input.on('wheel', (_p: unknown, _go: unknown, _dx: unknown, dy: number) => {
      this.scrollY = Phaser.Math.Clamp(
        this.scrollY + dy * 1.5,
        0,
        Math.max(0, this.contentHeight - (height - 140))
      );
    });

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP).on('down', () => {
      this.scrollY = Math.max(0, this.scrollY - 40);
    });
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN).on('down', () => {
      this.scrollY = Math.min(
        Math.max(0, this.contentHeight - (height - 140)),
        this.scrollY + 40
      );
    });

    // Fetch and render credits
    this.fetchCredits();
  }

  private async fetchCredits(): Promise<void> {
    const { width, height } = this.scale;
    try {
      const res = await fetch('/CREDITS.md');
      const md = await res.text();
      this.creditsLines = this.parseMarkdown(md);
    } catch {
      this.creditsLines = ['(Could not load CREDITS.md)'];
    }

    const allLines = [
      '— Required Attributions —',
      ...REQUIRED,
      '',
      '— Full Credits —',
      ...this.creditsLines,
    ];

    const startX = 32;
    let y = 68;

    for (const line of allLines) {
      const isRequired = REQUIRED.includes(line);
      const isHeader = line.startsWith('—') || line.startsWith('#');

      const text = this.add.text(startX, y, line, {
        fontFamily: isHeader ? "'Cinzel', serif" : "'Pixelify Sans', sans-serif",
        fontSize: isHeader ? '14px' : '12px',
        color: isRequired ? '#c9b98a' : (isHeader ? '#d9f2ee' : '#9aa8b8'),
        wordWrap: { width: width - 64 },
      });
      text.setDepth(4);
      this.textContainer.add(text);
      y += this.lineHeight + (isHeader ? 6 : 0);
    }

    this.contentHeight = y + 40;
    height; // suppress unused
  }

  private parseMarkdown(md: string): string[] {
    return md
      .split('\n')
      .map((line) => {
        // Strip markdown link syntax: [text](url) → text (url)
        return line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
      })
      .filter((line) => line.trim() !== '' || true); // keep blanks for spacing
  }

  update(): void {
    this.textContainer.y = 68 - this.scrollY;
  }

  private goBack(): void {
    this.scene.stop('CreditsScene');
    // If GraveyardWorld is running, make sure UIScene is up
    if (this.fromScene === 'GraveyardWorld') {
      const gw = this.scene.get('GraveyardWorld');
      if (gw) this.scene.resume('GraveyardWorld');
    }
  }
}
