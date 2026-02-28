import { Clipboard } from './clipboard.ts';

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
  container.innerHTML = '';
  requestAnimationFrame(() => {
    const fragment = document.createDocumentFragment();
    values.forEach(v => fragment.appendChild(createResultItem(v)));
    container.appendChild(fragment);
  });
}

export const Renderer = { render } as const;
