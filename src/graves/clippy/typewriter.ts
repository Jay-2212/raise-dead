export class Typewriter {
  private msPerWord: number = 55;
  private ariaLiveRegion: HTMLElement | null = null;
  // Item 10 fix: isSkipped is public-readable so callers (ClickyChat.typeOutReply) can check it
  isSkipped = false;

  constructor(msPerWord: number = 55) {
    this.msPerWord = msPerWord;
    this.createAriaLiveRegion();
  }

  private createAriaLiveRegion(): void {
    this.ariaLiveRegion = document.createElement('div');
    this.ariaLiveRegion.setAttribute('aria-live', 'polite');
    this.ariaLiveRegion.setAttribute('aria-atomic', 'true');
    this.ariaLiveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(this.ariaLiveRegion);
  }

  /**
   * Set the full text in the aria-live region.
   * Called once the typewriter finishes or when showing full text immediately.
   */
  setAriaLive(text: string): void {
    if (this.ariaLiveRegion) {
      this.ariaLiveRegion.textContent = text;
    }
  }

  /**
   * Signal to skip the current typewriter animation.
   * The caller (ClickyChat.typeOutReply) polls this via isSkipped.
   */
  skip(): void {
    this.isSkipped = true;
  }

  /**
   * Reset the skip flag at the start of a new line.
   * ClickyChat.typeOutReply calls this before starting each line.
   */
  resetSkip(): void {
    this.isSkipped = false;
  }

  get msPerWordValue(): number {
    return this.msPerWord;
  }

  dispose(): void {
    if (this.ariaLiveRegion) {
      this.ariaLiveRegion.remove();
      this.ariaLiveRegion = null;
    }
  }
}
