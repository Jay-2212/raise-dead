export type Mood = 'surprised' | 'happy' | 'thinking' | 'sad' | 'wink';

export interface PresetNode {
  mood: Mood;
  replies: string[];
  options: Array<{ label: string; next: string }>;
  end: boolean;
}

export interface PresetFile {
  version: number;
  character: string;
  start: string;
  ui: { pick_variant: string; typewriter_ms_per_word: number };
  nodes: Record<string, PresetNode>;
  system_lines: {
    greeting_typed_hint: string;
    thinking: string[];
    limit_reached: string[];
    daily_tired: string[];
    rate_burst: string[];
    too_long: string[];
    off_topic: string[];
    error: string[];
    empty: string[];
  };
}

let cachedPresets: PresetFile | null = null;

export async function loadPresets(): Promise<PresetFile> {
  if (cachedPresets) return cachedPresets;
  try {
    const response = await fetch(import.meta.env.BASE_URL + 'data/clicky-presets.json');
    if (!response.ok) throw new Error('Failed to fetch presets');
    const data: PresetFile = await response.json();
    cachedPresets = data;
    return data;
  } catch (e) {
    // Fallback: return minimal presets
    const minimal = getMinimalPresets();
    cachedPresets = minimal;
    return minimal;
  }
}

export function pickVariant(nodeId: string, presets: PresetFile, lastVariant: string | undefined): string {
  const node = presets.nodes[nodeId];
  if (!node || node.replies.length === 0) return '';

  const pickStrategy = presets.ui.pick_variant || 'random';
  
  // If pick_variant starts with 'random', randomize
  if (pickStrategy.startsWith('random') || pickStrategy === 'random') {
    let idx: number;
    const doPickRandom = () => Math.floor(Math.random() * node.replies.length);
    
    // Pick random but not same as last time
    if (node.replies.length > 1) {
      do {
        idx = doPickRandom();
      } while (node.replies[idx] === lastVariant);
    } else {
      idx = 0;
    }
    
    return node.replies[idx];
  }

  // Default to first reply
  return node.replies[0];
}

function getMinimalPresets(): PresetFile {
  return {
    version: 1,
    character: 'Clicky',
    start: 'wake',
    ui: { pick_variant: 'random', typewriter_ms_per_word: 55 },
    nodes: {
      wake: {
        mood: 'surprised',
        replies: ["It looks like you're trying to resurrect a paperclip. Would you like help?"],
        options: [{ label: 'Yes', next: 'wake' }],
        end: false,
      },
    },
    system_lines: {
      greeting_typed_hint: 'Or type a question...',
      thinking: ['Thinking...'],
      limit_reached: ['I am out of words for now.'],
      daily_tired: ['I am tired. Come back tomorrow.'],
      rate_burst: ['Too fast!'],
      too_long: ['That is too long.'],
      off_topic: ["Let's keep talking about the graveyard."],
      error: ['Something went wrong. Try again.'],
      empty: ['I got tongue-tied. Ask again?'],
    },
  };
}
