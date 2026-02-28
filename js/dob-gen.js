/**
 * @fileoverview DOBGen — Date of Birth Generator
 *
 * Generates plausible birthdates within a configurable age range.
 * Handles leap years and variable month lengths correctly.
 *
 * Depends on: RNG (js/rng.js)
 */

'use strict';

/**
 * @namespace DOBGen
 */
const DOBGen = (() => {
  /** @type {string[]} Full month names for the "long" format. */
  const MONTH_NAMES = [
    'January', 'February', 'March',     'April',   'May',      'June',
    'July',    'August',   'September', 'October', 'November', 'December',
  ];

  // ── Private helpers ──────────────────────────────────────

  /**
   * Generates a single birthdate as a Date object.
   * Age is computed against today's date at midnight local time.
   *
   * @param {Object} opts
   * @param {number} opts.minAge - Minimum age in full years (inclusive).
   * @param {number} opts.maxAge - Maximum age in full years (inclusive).
   * @returns {Date}
   * @throws {RangeError}
   */
  function generateDate({ minAge, maxAge }) {
    if (minAge < 1 || maxAge < 1) {
      throw new RangeError('DOBGen: age values must be positive.');
    }
    if (minAge > maxAge) {
      throw new RangeError('DOBGen: minAge must be less than maxAge.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ageYears   = RNG.randomRange(minAge, maxAge);
    const birthYear  = today.getFullYear() - ageYears;
    const birthMonth = RNG.randomInt(12);

    // new Date(y, m+1, 0).getDate() correctly handles Feb 29 and all month lengths
    const daysInMonth = new Date(birthYear, birthMonth + 1, 0).getDate();
    const birthDay    = 1 + RNG.randomInt(daysInMonth);

    const dob = new Date(birthYear, birthMonth, birthDay);
    dob.setHours(0, 0, 0, 0);
    return dob;
  }

  /**
   * Formats a Date per the selected display format.
   *
   * @param {Date}   date
   * @param {string} fmt - One of: 'iso' | 'us' | 'eu' | 'long'
   * @returns {string}
   */
  function format(date, fmt) {
    const y  = date.getFullYear();
    const m  = date.getMonth();
    const d  = date.getDate();
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');

    switch (fmt) {
      case 'iso':  return `${y}-${mm}-${dd}`;
      case 'us':   return `${mm}/${dd}/${y}`;
      case 'eu':   return `${dd}/${mm}/${y}`;
      case 'long': return `${MONTH_NAMES[m]} ${d}, ${y}`;
      default:     return `${y}-${mm}-${dd}`;
    }
  }

  // ── Public API ───────────────────────────────────────────

  /**
   * Generates multiple formatted birthdate strings.
   *
   * @param {number} count
   * @param {Object} opts
   * @param {number} opts.minAge
   * @param {number} opts.maxAge
   * @param {string} opts.format - Format ID passed to format().
   * @returns {string[]}
   */
  function generateMany(count, opts) {
    return Array.from({ length: count }, () =>
      format(generateDate(opts), opts.format)
    );
  }

  return { generateMany };
})();
