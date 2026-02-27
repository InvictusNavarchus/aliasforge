/**
 * @fileoverview clipboard.js — Clipboard & Toast Feedback
 *
 * Self-contained module for copying text to the clipboard and showing
 * a brief toast notification. No dependency on generator modules.
 */

'use strict';

/**
 * @namespace Clipboard
 */
const Clipboard = (() => {
  const copyToast = document.getElementById('copy-toast');

  /** @type {ReturnType<typeof setTimeout> | null} */
  let toastTimer = null;

  // ── Toast ────────────────────────────────────────────────

  /**
   * Shows a brief auto-dismissing toast notification.
   *
   * @param {string} msg
   */
  function showToast(msg) {
    copyToast.textContent = msg;
    copyToast.classList.add('visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => copyToast.classList.remove('visible'), 1800);
  }

  // ── Copy ─────────────────────────────────────────────────

  /**
   * Copies text to the clipboard using the modern async API,
   * with an execCommand fallback for legacy environments.
   * Updates the triggering button's label to confirm the action.
   *
   * @param {string}      text
   * @param {HTMLElement} btn - The copy button (receives visual feedback).
   * @returns {Promise<void>}
   */
  async function copy(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    btn.textContent = 'Copied';
    btn.classList.add('copied');
    showToast(`Copied: ${text}`);

    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 1500);
  }

  return { copy, showToast };
})();
