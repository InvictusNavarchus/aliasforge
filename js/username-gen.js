/**
 * @fileoverview UsernameGen — Pattern-Based Username Generator
 *
 * Generates natural-looking usernames by combining name fragments with
 * configurable patterns and case transforms. All digit suffixes use CSPRNG.
 *
 * Depends on: RNG (js/rng.js), NameGen (js/name-gen.js)
 */

'use strict';

/**
 * @namespace UsernameGen
 */
const UsernameGen = (() => {

  // ── Pattern & transform tables ───────────────────────────

  /**
   * Maps pattern IDs (matching the <select> values in HTML) to builder
   * functions. Each builder receives lowercase first and last name strings
   * and returns a raw (pre-casing) username string.
   *
   * @type {Record<string, (first: string, last: string) => string>}
   */
  const PATTERNS = {
    /** e.g. "james.wilson" */
    'first.last':          (first, last) => `${first}.${last}`,
    /** e.g. "james4821" */
    'first_digits':        (first)       => `${first}${randomDigits(4)}`,
    /** e.g. "j.wilson" */
    'initial_last':        (first, last) => `${first[0]}.${last}`,
    /** e.g. "j.wilson847" */
    'initial_last_digits': (first, last) => `${first[0]}.${last}${randomDigits(3)}`,
    /** e.g. "jameswilson92" */
    'firstlast_digits':    (first, last) => `${first}${last}${randomDigits(2)}`,
    /** e.g. "wilson391" */
    'last_digits':         (_first, last) => `${last}${randomDigits(3)}`,
  };

  /**
   * Maps casing IDs to transform functions applied after pattern building.
   *
   * @type {Record<string, (str: string) => string>}
   */
  const CASE_TRANSFORMS = {
    /** "jameswilson" */
    lower:  str => str.toLowerCase(),
    /** "JAMESWILSON" */
    upper:  str => str.toUpperCase(),
    /** "james.wilson" → "jamesWilson" */
    camel:  str => {
      const parts = str.toLowerCase().split(/[._]/);
      return parts[0] + parts.slice(1).map(capitalise).join('');
    },
    /** "james.wilson" → "JamesWilson" */
    pascal: str => str.toLowerCase().split(/[._]/).map(capitalise).join(''),
  };

  // ── Private helpers ──────────────────────────────────────

  /**
   * Generates a zero-padded string of N cryptographically random decimal digits.
   * e.g. randomDigits(4) → "0371"
   *
   * @param {number} n
   * @returns {string}
   */
  function randomDigits(n) {
    return String(RNG.randomInt(10 ** n)).padStart(n, '0');
  }

  /**
   * Capitalises the first character of a string.
   *
   * @param {string} str
   * @returns {string}
   */
  function capitalise(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ── Public API ───────────────────────────────────────────

  /**
   * Generates a single username.
   *
   * @param {Object}       opts
   * @param {string}       opts.pattern - Pattern ID (key of PATTERNS).
   * @param {string}       opts.casing  - Casing ID (key of CASE_TRANSFORMS).
   * @param {FullName|null} [opts.name] - Pre-generated name to use; generates one if omitted.
   * @returns {string}
   */
  function generate({ pattern, casing, name = null }) {
    const patternFn = PATTERNS[pattern]  ?? PATTERNS['first_digits'];
    const caseFn    = CASE_TRANSFORMS[casing] ?? CASE_TRANSFORMS['lower'];
    const resolved  = name ?? NameGen.generate();
    const raw       = patternFn(resolved.first.toLowerCase(), resolved.last.toLowerCase());
    return caseFn(raw);
  }

  /**
   * Generates multiple distinct usernames (no duplicate values).
   * Optionally accepts a pre-generated names array so that name/username
   * pairs remain correlated (used by "Generate All").
   *
   * @param {number}     count
   * @param {Object}     opts        - Same options as generate().
   * @param {FullName[]} [names=[]]  - Optional correlated names array.
   * @returns {string[]}
   */
  function generateMany(count, opts, names = []) {
    const results     = [];
    const seen        = new Set();
    let   attempts    = 0;
    const maxAttempts = count * 100;

    while (results.length < count && attempts < maxAttempts) {
      const name     = names[results.length] ?? null;
      const username = generate({ ...opts, name });
      if (!seen.has(username)) {
        seen.add(username);
        results.push(username);
      }
      attempts++;
    }

    return results;
  }

  return { generate, generateMany };
})();
