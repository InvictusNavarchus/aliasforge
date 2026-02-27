/**
 * @fileoverview DataStore — Name Dataset Loader & Index Builder
 *
 * Loads, cleans, and indexes flat name datasets from plain-text files.
 * All heavy work happens once at startup via init().
 *
 * Depends on: RNG (js/rng.js)
 */

'use strict';

/**
 * @namespace DataStore
 */
const DataStore = (() => {
  /** @type {string[] | null} */
  let firstNames = null;
  /** @type {string[] | null} */
  let lastNames  = null;

  // ── Private helpers ──────────────────────────────────────

  /**
   * Validates that a raw line looks like a plausible human name.
   * Accepts Unicode letters, spaces, apostrophes, hyphens, and dots.
   *
   * @param {string} name - Raw trimmed line from dataset.
   * @returns {boolean}
   */
  function isValidName(name) {
    return (
      name.length >= 2 &&
      name.length <= 40 &&
      /^[\p{L}\s'\-\.]+$/u.test(name)
    );
  }

  /**
   * Converts a string to Title Case, correctly handling hyphenated names
   * such as "anne-marie" → "Anne-Marie".
   *
   * @param {string} str
   * @returns {string}
   */
  function toTitleCase(str) {
    return str
      .split(/(?<=[-\s])/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Fetches a plain-text name file and returns a deduplicated, cleaned array.
   * Handles trailing newlines, BOM, and empty lines.
   *
   * @param {string} path - Relative URL to the .txt file.
   * @returns {Promise<string[]>}
   * @throws {Error} If the fetch fails or the file yields zero valid entries.
   */
  async function loadFile(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
    }

    const raw  = await response.text();
    const seen = new Set();

    const names = raw
      .replace(/^\uFEFF/, '')
      .split('\n')
      .map(line => line.trim())
      .filter(line => isValidName(line))
      .filter(line => {
        const key = line.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(toTitleCase);

    if (names.length === 0) {
      throw new Error(`Name file ${path} produced zero valid entries after cleaning.`);
    }

    return names;
  }

  // ── Public API ───────────────────────────────────────────

  /**
   * Loads both name datasets concurrently.
   * Must be called (and awaited) before any getFirstName/getLastName calls.
   *
   * @returns {Promise<void>}
   */
  async function init() {
    [firstNames, lastNames] = await Promise.all([
      loadFile('./data/first-names.txt'),
      loadFile('./data/last-names.txt'),
    ]);
  }

  /**
   * Returns a random first name from the loaded dataset.
   *
   * @returns {string}
   * @throws {Error} If DataStore has not been initialised.
   */
  function getFirstName() {
    if (!firstNames) throw new Error('DataStore not initialised. Call DataStore.init() first.');
    return RNG.pick(firstNames);
  }

  /**
   * Returns a random last name from the loaded dataset.
   *
   * @returns {string}
   * @throws {Error} If DataStore has not been initialised.
   */
  function getLastName() {
    if (!lastNames) throw new Error('DataStore not initialised. Call DataStore.init() first.');
    return RNG.pick(lastNames);
  }

  /** @returns {boolean} Whether both datasets are loaded and ready. */
  function isReady() {
    return firstNames !== null && lastNames !== null;
  }

  /** @returns {{ firstNames: number, lastNames: number }} Dataset sizes. */
  function stats() {
    return {
      firstNames: firstNames?.length ?? 0,
      lastNames:  lastNames?.length  ?? 0,
    };
  }

  return { init, getFirstName, getLastName, isReady, stats };
})();
