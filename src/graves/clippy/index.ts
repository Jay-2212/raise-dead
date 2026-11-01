import { GraveApp } from '../../ui/GraveOverlay';
import { ClickyChat } from './ClickyChat';

let chat: ClickyChat | null = null;

const clicky: GraveApp = {
  compactHeader: true,

  async mount(container: HTMLElement): Promise<void> {
    chat = new ClickyChat(container);
    await chat.mount();
  },

  dispose(): void {
    if (chat) {
      chat.dispose();
      chat = null;
    }
  },
};

export default clicky;
