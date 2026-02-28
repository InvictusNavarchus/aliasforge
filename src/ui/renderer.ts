import { Clipboard } from './clipboard.ts';

// Track pending rAF handles per container to cancel stale renders
const pendingFrames = new WeakMap<HTMLElement, number>();

function createResultItem(value: string): HTMLElement {
  const item = document.createElement('div');
  item.className = 'result-item';
  item.setAttribute('role', 'listitem');

  const span = document.createElement('span');
  span.className   = 'result-value';
  span.textContent = value;

  const btn = document.createElement('button');
  btn.className   = 'copy-btn';
  btn.type        = 'button';
  btn.textContent = 'Copy';
  btn.setAttribute('aria-label', `Copy ${value}`);
  btn.addEventListener('click', () => Clipboard.copy(value, btn));

  item.appendChild(span);
  item.appendChild(btn);
  return item;
}

function render(container: HTMLElement, values: string[]): void {
  // Cancel any previously scheduled frame for this container
  const existing = pendingFrames.get(container);
  if (existing !== undefined) {
    cancelAnimationFrame(existing);
  }

  container.innerHTML = '';

  const handle = requestAnimationFrame(() => {
    pendingFrames.delete(container);
    const fragment = document.createDocumentFragment();
    values.forEach(v => fragment.appendChild(createResultItem(v)));
    container.appendChild(fragment);
  });

  pendingFrames.set(container, handle);
}

export const Renderer = { render } as const;
