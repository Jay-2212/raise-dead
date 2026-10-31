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
  private creditsLines: Array<{ text: string; isHeading: boolean }> = [];
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
      this.creditsLines = [{ text: '(Could not load CREDITS.md)', isHeading: false }];
    }

    const allLines = [
      ...REQUIRED.map((text) => ({ text, isHeading: false })),
      { text: '', isHeading: false },
      ...this.creditsLines,
    ];

    const startX = 32;
    let y = 68;

    for (const line of allLines) {
      if (line.text.trim() === '') {
        y += 12; // spacing between sections
        continue;
      }

      const isHeading = line.isHeading;
      const text = this.add.text(startX, y, line.text, {
        fontFamily: isHeading ? "'Cinzel', serif" : "'Pixelify Sans', sans-serif",
        fontSize: isHeading ? '20px' : '12px',
        color: isHeading ? '#c9b98a' : '#9aa8b8',
        wordWrap: { width: width - 64, useAdvancedWrap: true },
      });
      text.setDepth(4);
      this.textContainer.add(text);
      
      // Add extra margin above headings
      if (isHeading && y > 68) {
        y += 8;
      }
      
      y += text.displayHeight + 8;
    }

    this.contentHeight = y + 40;
  }

  private parseMarkdown(md: string): Array<{ text: string; isHeading: boolean }> {
    const lines: Array<{ text: string; isHeading: boolean }> = [];
    const rawLines = md.split('\n');

    for (const line of rawLines) {
      let processed = line;
      let isHeading = false;

      // Check if this line is a heading (starts with #)
      if (processed.trim().startsWith('#')) {
        isHeading = true;
      }

      // Skip table header and separator rows
      if (processed.includes('|---') || (processed.startsWith('|') && rawLines.indexOf(line) === 1)) {
        continue;
      }

      // Strip markdown link syntax: [text](url) → text — url
      processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 — $2');

      // Strip markdown formatting
      processed = processed.replace(/\*\*([^\*]+)\*\*/g, '$1'); // bold
      processed = processed.replace(/`([^`]+)`/g, '$1'); // code
      processed = processed.replace(/^#+\s/g, ''); // strip leading # characters (headings)
      processed = processed.replace(/\| /g, ''); // table delimiters
      processed = processed.trim();

      if (processed.length > 0) {
        lines.push({ text: processed, isHeading });
      }
    }

    return lines;
  }

  update(): void {
    this.textContainer.y = 68 - this.scrollY;
  }

  private goBack(): void {
    // P1-3: Guard against fetching if scene stopped
    // (no additional guards needed now, but structure ready)
    
    this.scene.stop('CreditsScene');
    // If GraveyardWorld is running, resume both UIScene and GraveyardWorld
    if (this.fromScene === 'GraveyardWorld') {
      // P1-3: Reset keyboard to avoid stuck keys
      this.input.keyboard?.resetKeys();
      
      // P1-3: Reset proximity detection so plaque/hint re-emit on resume
      const gwScene = this.scene.get('GraveyardWorld') as unknown as { lastProxGraveId: string | null };
      if (gwScene) {
        gwScene.lastProxGraveId = null;
      }
      
      this.scene.resume('GraveyardWorld');
      this.scene.resume('UIScene');
    }
  }
}
