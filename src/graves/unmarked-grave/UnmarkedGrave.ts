/**
 * Unmarked Grave (N3): name any dead app and Meta Muse Spark writes a tiny playable tribute.
 * Server: /api/unmarked/raise (quota + cache), page served by /api/unmarked/play/:slug under a
 * no-network CSP and shown in an opaque-origin iframe (sandbox="allow-scripts", no same-origin).
 */
import { getSession } from '../clippy/api';

const SUGGESTIONS = ['Contra', 'Flappy Bird', 'Club Penguin', 'Google Lively', 'Snake', 'Vine'];
const BASE = import.meta.env.BASE_URL;

export class UnmarkedGrave {
  private root: HTMLElement;
  private el: HTMLDivElement | null = null;
  private busy = false;
  private dotsTimer: number | null = null;
  private abort: AbortController | null = null;
  private remaining: number | null = null;
  private msgHandler: ((ev: MessageEvent) => void) | null = null;

  constructor(container: HTMLElement) {
    this.root = container;
  }

  mount(): void {
    this.root.style.height = 'min(68vh, 62vw)';
    this.root.style.minHeight = '300px';
    this.root.style.display = 'flex';
    this.root.style.flexDirection = 'column';
    this.root.style.overflow = 'hidden';
    this.showPicker();
    void getSession(); // make sure a session token exists before the first raise
  }

  dispose(): void {
    this.abort?.abort();
    if (this.dotsTimer !== null) window.clearInterval(this.dotsTimer);
    if (this.msgHandler) { window.removeEventListener('message', this.msgHandler); this.msgHandler = null; }
    this.el?.remove();
    this.el = null;
  }

  private reset(): HTMLDivElement {
    if (this.dotsTimer !== null) { window.clearInterval(this.dotsTimer); this.dotsTimer = null; }
    this.el?.remove();
    const el = document.createElement('div');
    el.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:0;';
    this.root.appendChild(el);
    this.el = el;
    return el;
  }

  private text(tag: string, txt: string, css: string): HTMLElement {
    const n = document.createElement(tag);
    n.textContent = txt;
    n.style.cssText = css;
    return n;
  }

  private showPicker(message?: string): void {
    const el = this.reset();
    el.appendChild(this.text('p', 'Name the lost one, and it shall rise.', "font-family:'Cinzel',serif;font-style:italic;color:#d9f2ee;font-size:1.05rem;margin:0;text-align:center;"));

    const form = document.createElement('form');
    form.style.cssText = 'display:flex;gap:8px;width:min(460px,90%);';
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 40;
    input.placeholder = 'e.g. Contra, Neopets, Windows Messenger';
    input.setAttribute('aria-label', 'Name of a dead app or game');
    input.style.cssText = "flex:1;font-family:'Pixelify Sans',sans-serif;font-size:1rem;padding:8px 10px;background:#0b1424;color:#d9f2ee;border:1px solid #3a5a6e;border-radius:4px;";
    const btn = document.createElement('button');
    btn.type = 'submit';
    btn.textContent = 'Raise it';
    btn.style.cssText = "font-family:'Cinzel',serif;padding:8px 16px;background:transparent;color:#7fe0cf;border:2px solid #7fe0cf;cursor:pointer;";
    form.append(input, btn);
    form.addEventListener('submit', (e) => { e.preventDefault(); void this.raise(input.value); });
    // keep Phaser from seeing typed keys
    input.addEventListener('keydown', (e) => e.stopPropagation());
    el.appendChild(form);

    const chips = document.createElement('div');
    chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:520px;';
    for (const s of SUGGESTIONS) {
      const c = document.createElement('button');
      c.type = 'button';
      c.textContent = s;
      c.style.cssText = "font-family:'Pixelify Sans',sans-serif;font-size:0.85rem;padding:4px 10px;background:#13233a;color:#c9b98a;border:1px solid #3a5a6e;border-radius:12px;cursor:pointer;";
      c.addEventListener('click', () => void this.raise(s));
      chips.appendChild(c);
    }
    el.appendChild(chips);

    const left = this.remaining === null ? '' : ` You have ${this.remaining} new raise${this.remaining === 1 ? '' : 's'} left.`;
    el.appendChild(this.text('p', (message ? message + ' ' : '') + 'Tributes are written live by Meta Muse Spark; names others already raised open instantly.' + left,
      "font-family:'Pixelify Sans',sans-serif;font-size:0.78rem;color:#7d8ba0;margin:0;text-align:center;max-width:520px;"));
    setTimeout(() => input.focus(), 50);
  }

  private async raise(raw: string): Promise<void> {
    const name = raw.trim();
    if (this.busy || name.length < 2) return;
    this.busy = true;
    const el = this.reset();
    const status = this.text('p', 'The grave stirs', "font-family:'Cinzel',serif;color:#d9f2ee;font-size:1.1rem;margin:0;");
    const sub = this.text('p', `Muse Spark is carving "${name}" back to life. New souls take about half a minute.`, "font-family:'Pixelify Sans',sans-serif;font-size:0.8rem;color:#7d8ba0;margin:0;text-align:center;");
    el.append(status, sub);
    let n = 0;
    this.dotsTimer = window.setInterval(() => { n = (n + 1) % 4; status.textContent = 'The grave stirs' + '.'.repeat(n); }, 450);

    this.abort = new AbortController();
    try {
      if (!localStorage.getItem('rd_clicky_token')) await getSession();
      const token = localStorage.getItem('rd_clicky_token');
      const res = await fetch(BASE + 'api/unmarked/raise', {
        method: 'POST',
        signal: this.abort.signal,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Clicky-Token': token } : {}) },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json().catch(() => ({}))) as { slug?: string; name?: string; remaining?: number; error?: string };
      if (typeof data.remaining === 'number') this.remaining = data.remaining;
      if (!res.ok || !data.slug) {
        const why: Record<string, string> = {
          name: 'That name will not take. Use letters and numbers only.',
          limit: 'You have used your new raises; pick a name others already raised.',
          daily: 'The graveyard is exhausted for tonight; pick a name others already raised.',
          session: 'The spirits did not recognise you. Try once more.',
          upstream: 'The ritual faltered. Nothing was spent; try again.',
          moderated: 'The tombstone stays cold. That name is too dark, too living, or not lost software. Nothing was spent.',
        };
        if (data.error === 'session') await getSession();
        this.busy = false;
        this.showPicker(why[data.error || 'upstream'] || why.upstream);
        return;
      }
      this.showGame(data.slug, data.name || name);
    } catch {
      this.busy = false;
      if (this.el) this.showPicker("The ritual faltered. If it didn't finish, try again in a moment.");
      return;
    }
    this.busy = false;
  }

  private showGame(slug: string, name: string): void {
    const el = this.reset();
    el.style.justifyContent = 'stretch';
    el.style.alignItems = 'stretch';
    el.style.gap = '6px';
    const frame = document.createElement('iframe');
    frame.src = `${BASE}api/unmarked/play/${encodeURIComponent(slug)}`;
    frame.title = `${name} (AI tribute)`;
    frame.setAttribute('sandbox', 'allow-scripts'); // opaque origin: no cookies, storage or same-origin access
    frame.referrerPolicy = 'no-referrer';
    frame.style.cssText = 'flex:1;width:100%;border:1px solid #2b3a4f;border-radius:6px;background:#000;';
    frame.addEventListener('load', () => frame.focus());
    el.appendChild(frame);
    // N4/U4: the served page reports a crash in its first seconds; offer another raise instead of a dead screen
    if (this.msgHandler) window.removeEventListener('message', this.msgHandler);
    const onMsg = (ev: MessageEvent) => {
      if (ev.source !== frame.contentWindow || !ev.data || ev.data.type !== 'rd-error') return;
      window.removeEventListener('message', onMsg);
      this.msgHandler = null;
      const warn = this.text('p', 'This soul came back broken. Pick another name, or try again later.', "font-family:'Pixelify Sans',sans-serif;font-size:0.8rem;color:#e8b04a;margin:0;");
      el.insertBefore(warn, frame);
    };
    this.msgHandler = onMsg;
    window.addEventListener('message', onMsg);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:8px;';
    row.appendChild(this.text('span', `${name}: an AI tribute written by Meta Muse Spark. Click the game to play.`, "font-family:'Pixelify Sans',sans-serif;font-size:0.75rem;color:#7d8ba0;"));
    const again = document.createElement('button');
    again.type = 'button';
    again.textContent = 'Raise another';
    again.style.cssText = "font-family:'Pixelify Sans',sans-serif;font-size:0.8rem;padding:4px 10px;background:transparent;color:#c9b98a;border:1px solid #c9b98a;cursor:pointer;";
    again.addEventListener('click', () => this.showPicker());
    row.appendChild(again);
    el.appendChild(row);
  }
}
