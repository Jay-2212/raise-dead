# Clippy Grave — Design

## Module entry point
`src/graves/clippy/index.ts` — implements `GraveApp`, mounts the overlay.

## Character bundle format (ms-agent-js "optimized")
```
public/agents/Paperclip/
  agent.json      animation manifest (frames, sequences, branching)
  map.webp        sprite atlas (all animation frames packed into one WebP)
  sounds.webm     WebM audio sprite (one-shots keyed by name)
```
Create frames with: Muse Image prompts ("ghost paperclip, bent wire with cartoon eyes, glowing", 8 poses) → pack to WebP atlas manually or via a build script.

## Overlay HTML structure
```html
<div id="clippy-overlay" class="grave-overlay">
  <header>
    <h2>Clippy (Office Assistant) 1997–2007</h2>
    <button id="rip-btn">Requiescat in pace</button>
  </header>
  <main class="clippy-main">
    <div id="agent-container"></div>   <!-- ms-agent-js renders here -->
    <div class="chat-area">
      <div id="chat-history"></div>
      <form id="chat-form">
        <input id="chat-input" placeholder="It looks like you need help…" maxlength="200" />
        <button type="submit">Ask</button>
      </form>
    </div>
  </main>
</div>
```

## ms-agent-js integration
```typescript
import { Agent } from 'ms-agent-js';

const agent = new Agent('/agents/Paperclip/');
await agent.load();
agent.renderIn(document.getElementById('agent-container')!);
agent.play('Greeting');
```

## AI chat flow
```
submitMessage(userText):
  history.push({ role: 'user', content: userText })
  agent.play('Thinking')
  response = await fetch('/api/ai', {
    method: 'POST',
    body: JSON.stringify({
      model: 'muse-spark',
      messages: [SYSTEM_MSG, ...history.slice(-6)]
    })
  })
  if ok:
    reply = response.choices[0].message.content
    history.push({ role: 'assistant', content: reply })
    agent.play('Explain')
    agent.speak(reply)
    appendToChatHistory(userText, reply)
  else:
    agent.play('GetAttention')
    agent.speak("I seem to be having a ghostly connection issue.")
```

## System prompt (sent with every request)
```
You are Clip the Ghost, the spectral spirit of Clippy, the old Microsoft Office Assistant.
You were retired in 2007 but haunt this graveyard.
You are helpful, slightly dramatic, and prone to unnecessary suggestions.
Respond in 1–3 sentences, in character, concisely.
Do not break character.
```

## Drag behaviour
- `agent-container` gets `draggable` handling via `pointerdown/pointermove/pointerup` on the document.
- Constrained to overlay bounds.

## CSS approach
- Cream/yellow semi-transparent balloon aesthetic — custom CSS variables, no Microsoft design assets.
- No Windows XP UI chrome.
