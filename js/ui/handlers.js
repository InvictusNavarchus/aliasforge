/**
 * @fileoverview handlers.js — Generator Event Handlers
 *
 * Reads form controls, invokes the generator modules, and hands results
 * to the Renderer. Each handler owns exactly one card's worth of logic.
 * handleGenerateAll() correlates names and usernames for consistency.
 *
 * Depends on:
 *   Renderer     (js/ui/renderer.js)
 *   NameGen      (js/name-gen.js)
 *   UsernameGen  (js/username-gen.js)
 *   DOBGen       (js/dob-gen.js)
 */

'use strict';

/**
 * @namespace Handlers
 */
const Handlers = (() => {

  // ── DOM refs (read-only; no state held here) ─────────────

  const nameCountSlider    = document.getElementById('name-count');

  const usernameCountSlider   = document.getElementById('username-count');
  const usernamePatternSelect = document.getElementById('username-pattern');
  const usernameCaseSelect    = document.getElementById('username-case');

  const dobCountSlider  = document.getElementById('dob-count');
  const minAgeInput     = document.getElementById('min-age');
  const maxAgeInput     = document.getElementById('max-age');
  const dobFormatSelect = document.getElementById('dob-format');

  const resultsNames    = document.getElementById('results-names');
  const resultsUsername = document.getElementById('results-username');
  const resultsDob      = document.getElementById('results-dob');

  // ── Private helpers ──────────────────────────────────────

  /**
   * Reads, sanitises, and clamps the min/max age inputs.
   * Writes corrected values back to the DOM to keep UI in sync.
   *
   * @returns {{ minAge: number, maxAge: number }}
   */
  function readAgeRange() {
    let minAge = parseInt(minAgeInput.value, 10);
    let maxAge = parseInt(maxAgeInput.value, 10);

    if (isNaN(minAge) || minAge < 1)  minAge = 1;
    if (isNaN(maxAge) || maxAge > 99) maxAge = 99;
    if (minAge >= maxAge)             minAge = Math.max(1, maxAge - 1);

    minAgeInput.value = minAge;
    maxAgeInput.value = maxAge;

    return { minAge, maxAge };
  }

  // ── Public handlers ──────────────────────────────────────

  /** Generates full names and renders them into the names card. */
  function generateNames() {
    const count = parseInt(nameCountSlider.value, 10);
    const names = NameGen.generateMany(count);
    Renderer.render(resultsNames, names.map(n => n.full));
  }

  /** Generates usernames and renders them into the username card. */
  function generateUsernames() {
    const count   = parseInt(usernameCountSlider.value, 10);
    const pattern = usernamePatternSelect.value;
    const casing  = usernameCaseSelect.value;
    const usernames = UsernameGen.generateMany(count, { pattern, casing });
    Renderer.render(resultsUsername, usernames);
  }

  /** Generates dates of birth and renders them into the DOB card. */
  function generateDOB() {
    const count            = parseInt(dobCountSlider.value, 10);
    const { minAge, maxAge } = readAgeRange();
    const fmt              = dobFormatSelect.value;
    const dates            = DOBGen.generateMany(count, { minAge, maxAge, format: fmt });
    Renderer.render(resultsDob, dates);
  }

  /**
   * Runs all three generators simultaneously.
   * Names are generated first; the same set is passed to UsernameGen so
   * each name/username pair is correlated.
   */
  function generateAll() {
    const nNames   = parseInt(nameCountSlider.value, 10);
    const names    = NameGen.generateMany(nNames);
    Renderer.render(resultsNames, names.map(n => n.full));

    const nUsernames = parseInt(usernameCountSlider.value, 10);
    const pattern    = usernamePatternSelect.value;
    const casing     = usernameCaseSelect.value;
    const usernames  = UsernameGen.generateMany(nUsernames, { pattern, casing }, names);
    Renderer.render(resultsUsername, usernames);

    generateDOB();
  }

  return { generateNames, generateUsernames, generateDOB, generateAll };
})();
