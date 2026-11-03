import { GraveApp } from '../../ui/GraveOverlay';
import { UnmarkedGrave } from './UnmarkedGrave';

let ui: UnmarkedGrave | null = null;

const unmarked: GraveApp = {
  compactHeader: true,
  async mount(container: HTMLElement): Promise<void> {
    ui = new UnmarkedGrave(container);
    ui.mount();
  },
  dispose(): void {
    ui?.dispose();
    ui = null;
  },
};

export default unmarked;
