/**
 * @fileoverview NameGen — Full Name Generator
 *
 * Generates full names from DataStore with a collision guard that
 * prevents outputs like "James James".
 *
 * Depends on: DataStore (js/data-store.js)
 */

'use strict';

/**
 * @namespace NameGen
 */
const NameGen = (() => {
  /**
   * @typedef {Object} FullName
   * @property {string} first - First name in Title Case.
   * @property {string} last  - Last name in Title Case.
   * @property {string} full  - Combined "First Last".
   */

  /**
   * Generates a single full name.
   * Re-rolls the last name if it case-insensitively matches the first,
   * preventing "Jordan Jordan" style outputs.
   *
   * @returns {FullName}
   */
  function generate() {
    const first = DataStore.getFirstName();
    let last;
    let attempts = 0;

    do {
      last = DataStore.getLastName();
      attempts++;
    } while (last.toLowerCase() === first.toLowerCase() && attempts < 100);

    return { first, last, full: `${first} ${last}` };
  }

  /**
   * Generates multiple distinct full names (no duplicate .full values).
   *
   * @param {number} count
   * @returns {FullName[]}
   */
  function generateMany(count) {
    const results    = [];
    const seen       = new Set();
    let   attempts   = 0;
    const maxAttempts = count * 50;

    while (results.length < count && attempts < maxAttempts) {
      const name = generate();
      if (!seen.has(name.full.toLowerCase())) {
        seen.add(name.full.toLowerCase());
        results.push(name);
      }
      attempts++;
    }

    return results;
  }

  return { generate, generateMany };
})();
