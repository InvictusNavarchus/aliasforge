/**
 * @fileoverview renderer.js — DOM Result Rendering
 *
 * Builds and injects result-item elements into the generator result
 * containers. Clears existing content before each render to re-trigger
 * CSS stagger animations via requestAnimationFrame.
 *
 * Depends on: Clipboard (js/ui/clipboard.js)
 */

'use strict';

/**
 * @namespace Renderer
 */
const Renderer = (() => {

  /**
   * Creates a single result row element containing the value and a copy button.
   *
   * @param {string} value - The generated value to display.
   * @returns {HTMLElement}
   */
  function createResultItem(value) {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.setAttribute('role', 'listitem');

    const span = document.createElement('span');
    span.className   = 'result-value';
    span.textContent = value;

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type      = 'button';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', `Copy ${value}`);
    btn.addEventListener('click', () => Clipboard.copy(value, btn));

    item.appendChild(span);
    item.appendChild(btn);
    return item;
  }

  /**
   * Replaces a result container's contents with freshly built items.
   * Clearing first allows CSS stagger animations to re-trigger.
   *
   * @param {HTMLElement} container
   * @param {string[]}    values
   */
  function render(container, values) {
    container.innerHTML = '';
    requestAnimationFrame(() => {
      const fragment = document.createDocumentFragment();
      values.forEach(v => fragment.appendChild(createResultItem(v)));
      container.appendChild(fragment);
    });
  }

  return { render };
})();
