export interface SessionResponse {
  /** null = session request failed (network/5xx); quota unknown, not spent */
  remaining: number | null;
  daily: 'open' | 'closed';
  turnstile: boolean;
  token?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
  'cf-turnstile-response'?: string;
}

export async function getSession(): Promise<SessionResponse> {
  try {
    const token = localStorage.getItem('rd_clicky_token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
      headers['X-Clicky-Token'] = token;
    }

    const response = await fetch(import.meta.env.BASE_URL + 'api/clicky/session', {
      method: 'GET',
      headers,
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`Session failed: ${response.status}`);
    }

    const data: SessionResponse = await response.json();

    if (data.token) {
      localStorage.setItem('rd_clicky_token', data.token);
    }

    return data;
  } catch (_e) {
    return { remaining: null, daily: 'open', turnstile: false };
  }
}

// Item 3 fix: onDone receives remaining only when the server provided it;
// undefined means "don't update the counter" (e.g. blocked / error with refund).
export async function sendChat(
  message: string,
  history: ChatMessage[],
  signal: AbortSignal,
  onText: (text: string) => void,
  onDone: (remaining: number | undefined, error?: string) => void,
  _retried = false
): Promise<void> {
  try {
    const token = localStorage.getItem('rd_clicky_token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
      headers['X-Clicky-Token'] = token;
    }

    // Sanitize history client-side: max 4 items, roles user|assistant, content cleaned and ≤300 chars
    const sanitizedHistory: ChatMessage[] = (Array.isArray(history) ? history : [])
      .slice(-4)
      .filter(
        (msg): msg is ChatMessage =>
          msg !== null &&
          typeof msg === 'object' &&
          (msg.role === 'user' || msg.role === 'assistant') &&
          typeof msg.content === 'string'
      )
      .map((msg) => ({
        role: msg.role,
        content: (msg.content || '')
          .normalize('NFC')
          .substring(0, 300)
          .replace(/[\u0000-\u001f\u007f]/g, '')
          .trim(),
      }));

    const body: ChatRequest = { message, history: sanitizedHistory };

    const response = await fetch(import.meta.env.BASE_URL + 'api/clicky/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'same-origin',
      signal,
    });

    // Item 3 fix: retry 401 once (not infinitely)
    if (response.status === 401) {
      if (!_retried) {
        await getSession();
        return sendChat(message, history, signal, onText, onDone, true);
      }
      onDone(undefined, 'session');
      return;
    }

    if (response.status === 429) {
      const data = await response.json() as { error: string };
      // 429 errors don't carry remaining (quota already denied, not decremented)
      onDone(undefined, data.error);
      return;
    }

    if (response.status === 413) {
      onDone(undefined, 'too_long');
      return;
    }

    if (!response.ok) {
      onDone(undefined, 'error');
      return;
    }

    // Parse SSE stream
    const reader = response.body?.getReader();
    if (!reader) {
      onDone(undefined, 'error');
      return;
    }

    const decoder = new TextDecoder();
    let remaining: number | undefined;
    let error: string | undefined;
    let buffer = '';
    let gotDone = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines[lines.length - 1]; // keep incomplete line

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          if (line === 'data: [DONE]') continue;

          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            let data: {
              t?: string;
              done?: boolean;
              remaining?: number;
              error?: string;
              blocked?: boolean;
              empty?: boolean;
            };
            try {
              data = JSON.parse(jsonStr);
            } catch {
              continue;
            }

            if (data.t) {
              onText(data.t);
            }

            // Item 3 fix: remaining is only updated when explicitly present
            if (data.remaining !== undefined) {
              remaining = data.remaining;
            }

            if (data.error) {
              error = data.error;
            } else if (data.blocked) {
              // Item 3 fix: blocked → off_topic; no remaining update (server refunded nothing)
              error = 'off_topic';
            } else if (data.empty) {
              error = 'empty';
            }

            if (data.done) {
              gotDone = true;
              // Item 3 fix: pass remaining only if server sent it; pass error if any
              onDone(remaining, error);
              return;
            }
          }
        }
      }

      // Stream ended without explicit done frame (connection cut / server 20 s abort):
      // treat as an error and never pass remaining, so the local counter is not decremented.
      if (!gotDone) {
        onDone(undefined, error ?? 'lost_thread');
      }
    } finally {
      reader.releaseLock();
    }
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') {
      onDone(undefined, 'timeout');
    } else {
      onDone(undefined, 'error');
    }
  }
}
