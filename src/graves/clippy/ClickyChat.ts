import { PresetFile, loadPresets, pickVariant, Mood } from './presets';
import { Typewriter } from './typewriter';
import { getSession, sendChat, ChatMessage } from './api';

interface ClickyChatState {
  currentNodeId: string;
  history: ChatMessage[];
  busy: boolean;
  remaining: number;
  dailyClosed: boolean;
  lastVariant: Record<string, string>;
}

export class ClickyChat {
  private container: HTMLElement;
  private presets: PresetFile | null = null;
  private typewriter: Typewriter;
  private state: ClickyChatState = {
    currentNodeId: '',
    history: [],
    busy: false,
    remaining: 5,
    dailyClosed: false,
    lastVariant: {},
  };
  private spriteEl: HTMLElement | null = null;
  private bubbleEl: HTMLElement | null = null;
  private optionsEl: HTMLElement | null = null;
  private inputEl: HTMLInputElement | null = null;
  private counterEl: HTMLElement | null = null;
  private echoEl: HTMLElement | null = null;
  private questionsLeftEl: HTMLElement | null = null;
  private askBtnEl: HTMLButtonElement | null = null;
  private abortController: AbortController | null = null;
  private typeOutTimer: number | null = null;

  constructor(container: HTMLElement, msPerWord: number = 55) {
    this.container = container;
    this.typewriter = new Typewriter(msPerWord);
  }

  async mount(): Promise<void> {
    this.presets = await loadPresets();

    const session = await getSession();
    // null = session lookup failed (network/5xx): keep the default counter, don't treat it as spent
    const sessionFailed = session.remaining === null;
    if (session.remaining !== null) this.state.remaining = session.remaining;
    this.state.dailyClosed = session.daily === 'closed';

    this.buildDOM();
    if (sessionFailed && this.questionsLeftEl) {
      this.questionsLeftEl.textContent = "Clicky can't be reached right now. Tap a question above, or try typing again in a moment.";
    }

    this.state.currentNodeId = this.presets.start;
    await this.showNode(this.state.currentNodeId, true);
  }

  private buildDOM(): void {
    // Item 4 fix: do NOT set height:100% on the root — let content grow and scroll inside the container
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      gap: 12px;
      width: 100%;
      font-family: 'Pixelify Sans', sans-serif;
      color: #d9f2ee;
    `;

    const isMobile = window.innerWidth < 640;

    if (isMobile) {
      wrapper.style.flexDirection = 'column';

      this.spriteEl = this.createSprite(1.5);
      wrapper.appendChild(this.spriteEl);

      const chatCol = document.createElement('div');
      chatCol.style.cssText = `display: flex; flex-direction: column; gap: 8px;`;

      this.echoEl = this.createEcho();
      chatCol.appendChild(this.echoEl);

      this.bubbleEl = this.createBubble();
      chatCol.appendChild(this.bubbleEl);

      this.optionsEl = this.createOptions();
      chatCol.appendChild(this.optionsEl);

      const inputRow = this.createInputRow();
      chatCol.appendChild(inputRow);

      wrapper.appendChild(chatCol);
    } else {
      wrapper.style.flexDirection = 'row';

      const leftCol = document.createElement('div');
      leftCol.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 150px;
        flex-shrink: 0;
      `;

      this.spriteEl = this.createSprite(2);
      leftCol.appendChild(this.spriteEl);

      wrapper.appendChild(leftCol);

      const rightCol = document.createElement('div');
      rightCol.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
        min-width: 0;
      `;

      this.echoEl = this.createEcho();
      rightCol.appendChild(this.echoEl);

      this.bubbleEl = this.createBubble();
      rightCol.appendChild(this.bubbleEl);

      this.optionsEl = this.createOptions();
      rightCol.appendChild(this.optionsEl);

      const inputRow = this.createInputRow();
      rightCol.appendChild(inputRow);

      wrapper.appendChild(rightCol);
    }

    this.container.appendChild(wrapper);
  }

  private createSprite(scale: number): HTMLElement {
    const baseW = 47;
    const baseH = 92;
    const w = Math.round(baseW * scale);
    const h = Math.round(baseH * scale);
    const totalW = baseW * 4 * scale;

    const el = document.createElement('div');
    el.style.cssText = `
      width: ${w}px;
      height: ${h}px;
      background-image: url('${import.meta.env.BASE_URL}assets/images/clicky/clicky_sheet.png');
      background-repeat: no-repeat;
      background-position: 0 0;
      background-size: ${totalW}px ${h}px;
      image-rendering: pixelated;
      filter: drop-shadow(0 0 8px #7fd1d8aa);
      animation: clicky-float 2.4s ease-in-out infinite;
      align-self: center;
      flex-shrink: 0;
    `;

    if (!document.querySelector('style[data-clicky]')) {
      const style = document.createElement('style');
      style.setAttribute('data-clicky', '');
      style.textContent = `
        @keyframes clicky-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes clicky-float {
            0%, 100% { transform: translateY(0); }
          }
        }
      `;
      document.head.appendChild(style);
    }

    this.spriteEl = el;
    return el;
  }

  private createBubble(): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `
      background: #16213a;
      border: 2px solid #c9b98a;
      border-radius: 6px;
      padding: 12px 16px;
      min-height: 3.8em;
      line-height: 1.45;
      font-size: 1.05rem;
      color: #d9f2ee;
      position: relative;
      flex-shrink: 0;
      word-wrap: break-word;
      white-space: pre-wrap;
      cursor: pointer;
    `;
    // Item 10 fix: make bubble focusable so keydown works
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Clicky says (click or press Enter to skip)');

    el.addEventListener('click', () => {
      this.skipTypeOut();
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.skipTypeOut();
      }
    });
    return el;
  }

  private createEcho(): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `
      font-size: 0.85rem;
      color: #5d6b80;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
      min-height: 1.2em;
    `;
    return el;
  }

  private createOptions(): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 6px;
    `;
    return el;
  }

  private createInputRow(): HTMLElement {
    const containerEl = document.createElement('div');
    containerEl.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex-shrink: 0;
    `;

    const hint = document.createElement('p');
    hint.style.cssText = `font-size: 0.75rem; color: #5d6b80; margin: 0 0 0 0; line-height: 1;`;
    hint.textContent = this.presets?.system_lines.greeting_typed_hint || 'Or ask a question...';
    containerEl.appendChild(hint);

    const row = document.createElement('div');
    row.style.cssText = `display: flex; gap: 6px;`;

    this.inputEl = document.createElement('input');
    this.inputEl.setAttribute('type', 'text');
    this.inputEl.setAttribute('maxlength', '200');
    this.inputEl.setAttribute('placeholder', 'Ask Clicky anything...');
    this.inputEl.style.cssText = `
      flex: 1;
      background: #0b1120;
      border: 2px solid #3a4a66;
      padding: 8px 12px;
      font-family: 'Pixelify Sans', sans-serif;
      color: #d9f2ee;
      font-size: 0.95rem;
      outline: none;
      touch-action: manipulation;
      min-width: 0;
    `;
    this.inputEl.addEventListener('focus', () => {
      this.inputEl!.style.borderColor = '#7fd1d8';
      this.inputEl!.scrollIntoView({ block: 'nearest' });
    });
    this.inputEl.addEventListener('blur', () => {
      this.inputEl!.style.borderColor = '#3a4a66';
    });
    this.inputEl.addEventListener('keydown', (e) => {
      // keep Phaser from seeing typed keys; Escape still bubbles to GraveOverlay's document handler
      if (e.key !== 'Escape') e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleTypedSubmit();
      }
    });
    this.inputEl.addEventListener('keyup', (e) => {
      if (e.key !== 'Escape') e.stopPropagation();
    });
    this.inputEl.addEventListener('input', () => {
      const len = this.inputEl!.value.length;
      if (this.counterEl) this.counterEl.textContent = `${len}/200`;
    });

    this.counterEl = document.createElement('div');
    this.counterEl.style.cssText = `
      align-self: center;
      font-size: 0.8rem;
      color: #5d6b80;
      white-space: nowrap;
      min-width: 40px;
      text-align: right;
    `;
    this.counterEl.textContent = '0/200';

    this.askBtnEl = document.createElement('button');
    this.askBtnEl.textContent = 'Ask';
    this.askBtnEl.style.cssText = `
      background: transparent;
      border: 2px solid #c9b98a;
      color: #c9b98a;
      padding: 6px 12px;
      font-family: 'Pixelify Sans', sans-serif;
      font-size: 0.95rem;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.2s;
      touch-action: manipulation;
      min-height: 36px;
    `;
    this.askBtnEl.addEventListener('mouseenter', () => {
      this.askBtnEl!.style.color = '#d9f2ee';
      this.askBtnEl!.style.borderColor = '#d9f2ee';
      this.askBtnEl!.style.boxShadow = '0 0 8px #7fd1d8';
    });
    this.askBtnEl.addEventListener('mouseleave', () => {
      this.askBtnEl!.style.color = '#c9b98a';
      this.askBtnEl!.style.borderColor = '#c9b98a';
      this.askBtnEl!.style.boxShadow = 'none';
    });
    this.askBtnEl.addEventListener('click', () => this.handleTypedSubmit());

    row.appendChild(this.inputEl);
    row.appendChild(this.counterEl);
    row.appendChild(this.askBtnEl);
    containerEl.appendChild(row);

    this.questionsLeftEl = document.createElement('p');
    this.questionsLeftEl.style.cssText = `font-size: 0.75rem; color: #5d6b80; margin: 2px 0 0 0; line-height: 1;`;
    this.questionsLeftEl.textContent = `Questions left: ${this.state.remaining}`;
    containerEl.appendChild(this.questionsLeftEl);

    return containerEl;
  }

  private async showNode(nodeId: string, isOpening = false): Promise<void> {
    if (this.state.busy) return;
    this.state.busy = true;

    if (!this.presets) { this.state.busy = false; return; }

    const node = this.presets.nodes[nodeId];
    if (!node) { this.state.busy = false; return; }

    const reply = pickVariant(nodeId, this.presets, this.state.lastVariant[nodeId]);
    this.state.lastVariant[nodeId] = reply;

    this.updateSpriteMood(node.mood, isOpening);

    if (this.bubbleEl) this.bubbleEl.textContent = '';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      if (this.bubbleEl) this.bubbleEl.textContent = reply;
      this.typewriter.setAriaLive(reply);
    } else {
      await this.typeOutReply(reply);
    }

    // Item 8 fix: after the preset reply finishes, fill the last assistant slot (if any) with the chosen reply
    if (this.state.history.length > 0) {
      const last = this.state.history[this.state.history.length - 1];
      if (last.role === 'assistant' && last.content === '') {
        last.content = reply;
      }
    }

    this.showOptions(node.options, node.end);
    this.state.busy = false;
  }

  private skipTypeOut(): void {
    this.typewriter.skip();
    if (this.typeOutTimer !== null) {
      clearTimeout(this.typeOutTimer);
      this.typeOutTimer = null;
    }
  }

  private async typeOutReply(reply: string): Promise<void> {
    // Item 10 fix: reset skip flag at the start of each line
    this.typewriter.resetSkip();

    return new Promise((resolve) => {
      const words = reply.split(/\s+/);
      let displayed = '';
      let idx = 0;

      const displayNext = () => {
        // Item 10 fix: if skipped (via bubble click/Enter), show full text immediately
        if (this.typewriter.isSkipped || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          if (this.bubbleEl) this.bubbleEl.textContent = reply;
          this.typewriter.setAriaLive(reply);
          resolve();
          return;
        }

        if (idx >= words.length) {
          this.typewriter.setAriaLive(reply);
          resolve();
          return;
        }

        if (displayed) displayed += ' ';
        displayed += words[idx];
        if (this.bubbleEl) this.bubbleEl.textContent = displayed;
        idx++;
        this.typeOutTimer = window.setTimeout(displayNext, this.presets!.ui.typewriter_ms_per_word);
      };

      displayNext();
    });
  }

  private updateSpriteMood(mood: Mood, isOpening = false): void {
    if (!this.spriteEl) return;

    const scale = window.innerWidth < 640 ? 1.5 : 2;
    const frameW = Math.round(47 * scale);

    const moodToFrame: Record<Mood, number> = {
      surprised: 1,
      happy: 2,
      thinking: 0,
      sad: 3,
      wink: 2,
    };

    if (isOpening) {
      this.spriteEl.style.backgroundPosition = `-${frameW}px 0`;
      let shakeCount = 0;
      const shakeInterval = window.setInterval(() => {
        const offset = shakeCount % 2 === 0 ? 3 : -3;
        this.spriteEl!.style.transform = `translateX(${offset}px)`;
        shakeCount++;
        if (shakeCount >= 8) {
          clearInterval(shakeInterval);
          this.spriteEl!.style.transform = 'translateX(0)';
        }
      }, 50);
    } else {
      const frameIdx = moodToFrame[mood];
      this.spriteEl.style.backgroundPosition = `-${frameIdx * frameW}px 0`;
    }
  }

  private showOptions(options: Array<{ label: string; next: string }>, isEnd: boolean): void {
    if (!this.optionsEl) return;
    this.optionsEl.innerHTML = '';

    for (const opt of options) {
      const btn = document.createElement('button');
      btn.textContent = opt.label;
      btn.style.cssText = `
        background: transparent;
        border: 2px solid #c9b98a;
        color: #c9b98a;
        padding: 6px 12px;
        font-family: 'Pixelify Sans', sans-serif;
        font-size: 0.95rem;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s, color 0.2s, border-color 0.2s;
        touch-action: manipulation;
        min-height: 36px;
        width: 100%;
        text-align: left;
      `;

      btn.addEventListener('mouseenter', () => {
        btn.style.color = '#d9f2ee';
        btn.style.borderColor = '#d9f2ee';
        btn.style.boxShadow = '0 0 8px #7fd1d8';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.color = '#c9b98a';
        btn.style.borderColor = '#c9b98a';
        btn.style.boxShadow = 'none';
      });
      btn.addEventListener('click', () => this.handleOptionSelect(opt.label, opt.next));
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.handleOptionSelect(opt.label, opt.next);
      });

      this.optionsEl.appendChild(btn);
    }

    // Fade in after typewriter finishes
    requestAnimationFrame(() => {
      for (const btn of this.optionsEl!.querySelectorAll('button')) {
        (btn as HTMLButtonElement).style.opacity = '1';
      }
    });
  }

  private async handleOptionSelect(label: string, nextNodeId: string): Promise<void> {
    if (this.state.busy) return;

    if (this.echoEl) this.echoEl.textContent = `You: ${label}`;

    // Item 8 fix: push user turn; the assistant turn is pushed with empty content
    // and filled in showNode once the reply is picked.
    this.state.history.push({ role: 'user', content: label });
    this.state.history.push({ role: 'assistant', content: '' });
    // Keep last 4
    if (this.state.history.length > 4) {
      this.state.history.splice(0, this.state.history.length - 4);
    }

    this.state.currentNodeId = nextNodeId;
    await this.showNode(nextNodeId);
  }

  private setInputsEnabled(enabled: boolean): void {
    if (this.inputEl) this.inputEl.disabled = !enabled;
    if (this.askBtnEl) this.askBtnEl.disabled = !enabled;
    if (this.optionsEl) {
      for (const btn of this.optionsEl.querySelectorAll('button')) {
        (btn as HTMLButtonElement).disabled = !enabled;
      }
    }
  }

  private setTextInputEnabled(enabled: boolean): void {
    if (this.inputEl) this.inputEl.disabled = !enabled;
    if (this.askBtnEl) this.askBtnEl.disabled = !enabled;
  }

  private async handleTypedSubmit(): Promise<void> {
    if (!this.inputEl || this.state.busy || this.state.dailyClosed) return;

    const text = this.inputEl.value.trim();
    if (!text) return;

    if (text.length > 200) {
      const msg = this.presets?.system_lines.too_long[0] || 'Too long!';
      if (this.bubbleEl) this.bubbleEl.textContent = msg;
      return;
    }

    if (this.state.remaining === 0) {
      const msg = this.presets?.system_lines.limit_reached[0] || 'No more words.';
      if (this.bubbleEl) this.bubbleEl.textContent = msg;
      if (this.inputEl) {
        this.inputEl.disabled = true;
        this.inputEl.placeholder = 'Clicky is out of words for you. Tap a question above!';
      }
      return;
    }

    this.state.busy = true;
    this.setTextInputEnabled(false);

    if (this.echoEl) this.echoEl.textContent = `You: ${text}`;

    // Item 8 fix: push user turn ONCE here; do NOT push an empty assistant stub
    this.state.history.push({ role: 'user', content: text });
    if (this.state.history.length > 4) {
      this.state.history.splice(0, this.state.history.length - 4);
    }

    this.inputEl.value = '';
    if (this.counterEl) this.counterEl.textContent = '0/200';

    // Show thinking line
    const thinking = this.presets?.system_lines.thinking[
      Math.floor(Math.random() * (this.presets.system_lines.thinking.length || 1))
    ] || 'Thinking...';
    if (this.bubbleEl) this.bubbleEl.textContent = thinking;

    this.abortController = new AbortController();
    let response = '';

    // Item 3 fix: onDone receives remaining as number | undefined
    sendChat(
      text,
      this.state.history,
      this.abortController.signal,
      (chunk) => {
        // For streamed replies, show incrementally in the bubble
        response += chunk;
        if (this.bubbleEl) this.bubbleEl.textContent = response;
      },
      (remaining, error) => {
        // Item 3 fix: only update remaining when the server provided it
        if (remaining !== undefined) {
          this.state.remaining = remaining;
          if (this.questionsLeftEl) {
            this.questionsLeftEl.textContent = `Questions left: ${this.state.remaining}`;
          }
        }

        this.setTextInputEnabled(true);

        if (error) {
          let errorKey = 'error';
          let disableTextInputOnly = false;
          
          if (error === 'off_topic' || error === 'blocked') errorKey = 'off_topic';
          else if (error === 'empty') errorKey = 'empty';
          else if (error === 'limit') {
            errorKey = 'limit_reached';
            disableTextInputOnly = true;
            if (this.inputEl) {
              this.inputEl.placeholder = 'Clicky is out of words for you. Tap a question above!';
            }
            if (this.state.remaining !== undefined) {
              this.state.remaining = 0;
            }
          }
          else if (error === 'daily') {
            errorKey = 'daily_tired';
            disableTextInputOnly = true;
            this.state.dailyClosed = true;
            if (this.inputEl) {
              this.inputEl.placeholder = 'Clicky is resting today...';
            }
          }

          if (disableTextInputOnly) {
            this.setTextInputEnabled(false);
          }

          if (this.presets && this.bubbleEl) {
            const lines = (this.presets.system_lines as unknown as Record<string, string[]>)[errorKey];
            const msg = (lines && lines[Math.floor(Math.random() * lines.length)]) || 'Something went wrong.';
            this.bubbleEl.textContent = msg;
          }

          // Re-show current node's preset options in all error branches (so they're always tappable)
          const node = this.presets?.nodes[this.state.currentNodeId];
          if (node) {
            this.showOptions(node.options, node.end);
          }

          // Remove the user turn we pushed if the server refunded / never charged
          // (off_topic, empty, error, timeout — anything without a decremented remaining)
          if (remaining === undefined) {
            // Server didn't charge: remove the user turn we added
            const lastIdx = this.state.history.length - 1;
            if (lastIdx >= 0 && this.state.history[lastIdx].role === 'user') {
              this.state.history.pop();
            }
          }
        } else {
          // Item 8 fix: push assistant reply AFTER it arrives (not a stub before)
          this.state.history.push({ role: 'assistant', content: response });
          if (this.state.history.length > 4) {
            this.state.history.splice(0, this.state.history.length - 4);
          }
          this.typewriter.setAriaLive(response);

          const node = this.presets?.nodes[this.state.currentNodeId];
          const showNodeOpts = node?.end ? this.presets?.nodes[this.presets.start] : node;
          this.showOptions(showNodeOpts?.options || [], showNodeOpts?.end || false);
        }

        this.state.busy = false;
      }
    );
  }

  dispose(): void {
    if (this.typeOutTimer !== null) {
      clearTimeout(this.typeOutTimer);
      this.typeOutTimer = null;
    }
    this.skipTypeOut();
    this.typewriter.dispose();
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
