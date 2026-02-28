/**
 * @fileoverview app.js — Application Initialisation
 *
 * Entry point for the UI layer. Binds sliders, wires buttons, loads the
 * DataStore, and performs the initial auto-generation. Also manages the
 * loading/error status overlay.
 *
 * Depends on:
 *   DataStore  (js/data-store.js)
 *   Handlers   (js/ui/handlers.js)
 */

'use strict';

/**
 * @namespace App
 */
const App = (() => {

  // ── DOM refs ─────────────────────────────────────────────

  const appStatus        = document.getElementById('app-status');
  const statusMessage    = document.getElementById('status-message');
  const generatorGrid    = document.getElementById('generator-grid');
  const generateAllStrip = document.getElementById('generate-all-strip');

  const nameCountSlider      = document.getElementById('name-count');
  const nameCountDisplay     = document.getElementById('name-count-display');
  const usernameCountSlider  = document.getElementById('username-count');
  const usernameCountDisplay = document.getElementById('username-count-display');
  const dobCountSlider       = document.getElementById('dob-count');
  const dobCountDisplay      = document.getElementById('dob-count-display');

  const btnNames    = document.getElementById('btn-names');
  const btnUsername = document.getElementById('btn-username');
  const btnDob      = document.getElementById('btn-dob');
  const btnAll      = document.getElementById('btn-all');

  const minAgeInput = document.getElementById('min-age');
  const maxAgeInput = document.getElementById('max-age');

  // ── Private helpers ──────────────────────────────────────

  /**
   * Binds a range slider to a display element, keeping the label in sync
   * as the user drags. Also sets the initial value on page load.
   *
   * @param {HTMLInputElement} slider
   * @param {HTMLElement}      display
   */
  function bindSlider(slider, display) {
    const sync = () => {
      display.textContent = slider.value;
      slider.setAttribute('aria-valuenow', slider.value);
    };
    slider.addEventListener('input', sync);
    sync();
  }

  /**
   * Updates the loading status overlay message.
   *
   * @param {string}  msg
   * @param {boolean} [isError=false]
   */
  function setStatus(msg, isError = false) {
    statusMessage.textContent = msg;
    appStatus.classList.toggle('is-error', isError);
  }

  /** Hides the status overlay and reveals the generator grid. */
  function showApp() {
    appStatus.classList.add('is-hidden');
    generatorGrid.removeAttribute('aria-hidden');
    generateAllStrip.style.display = '';
  }

  // ── Public API ───────────────────────────────────────────

  /**
   * Initialises the application:
   *  1. Binds all sliders immediately (controls feel responsive while data loads).
   *  2. Wires all generator and keyboard event listeners.
   *  3. Loads name datasets; shows status updates during loading.
   *  4. Auto-generates an initial set of results on first load.
   *
   * @returns {Promise<void>}
   */
  async function init() {
    bindSlider(nameCountSlider,     nameCountDisplay);
    bindSlider(usernameCountSlider, usernameCountDisplay);
    bindSlider(dobCountSlider,      dobCountDisplay);

    btnNames.addEventListener('click',    Handlers.generateNames);
    btnUsername.addEventListener('click', Handlers.generateUsernames);
    btnDob.addEventListener('click',      Handlers.generateDOB);
    btnAll.addEventListener('click',      Handlers.generateAll);

    [minAgeInput, maxAgeInput].forEach(input => {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') Handlers.generateDOB();
      });
    });

    try {
      setStatus('Loading name datasets\u2026');
      await DataStore.init();

      const { firstNames, lastNames } = DataStore.stats();
      setStatus(`Loaded ${firstNames.toLocaleString()} first names · ${lastNames.toLocaleString()} last names`);
      showApp();

      Handlers.generateAll();
    } catch (err) {
      console.error('[AliasForge] DataStore.init failed:', err);
      setStatus(
        `Failed to load datasets: ${err.message}. ` +
        'Ensure ./data/first-names.txt and ./data/last-names.txt are present.',
        true
      );
    }
  }

  return { init };
})();
