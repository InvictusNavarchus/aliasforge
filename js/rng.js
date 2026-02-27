/**
 * @fileoverview RNG — Cryptographic Random Number Generation
 *
 * Thin wrapper around crypto.getRandomValues.
 * Never exposes Math.random. Zero dependencies.
 */

'use strict';

/**
 * @namespace RNG
 */
const RNG = (() => {
  /**
   * Returns a cryptographically secure random integer in [0, max).
   * Uses rejection sampling to eliminate modulo bias.
   *
   * @param {number} max - Exclusive upper bound. Must be a positive integer ≤ 2^32.
   * @returns {number}
   * @throws {RangeError}
   */
  function randomInt(max) {
    if (!Number.isInteger(max) || max <= 0) {
      throw new RangeError(`randomInt: max must be a positive integer, got ${max}`);
    }
    if (max === 1) return 0;

    const buf = new Uint32Array(1);
    const threshold = (2 ** 32) - ((2 ** 32) % max);

    let val;
    do {
      crypto.getRandomValues(buf);
      val = buf[0];
    } while (val >= threshold);

    return val % max;
  }

  /**
   * Returns a random integer in the closed interval [min, max].
   *
   * @param {number} min - Inclusive lower bound.
   * @param {number} max - Inclusive upper bound.
   * @returns {number}
   */
  function randomRange(min, max) {
    return min + randomInt(max - min + 1);
  }

  /**
   * Picks a random element from a non-empty array.
   *
   * @template T
   * @param {T[]} arr
   * @returns {T}
   * @throws {RangeError} If array is empty.
   */
  function pick(arr) {
    if (arr.length === 0) throw new RangeError('RNG.pick: array must not be empty');
    return arr[randomInt(arr.length)];
  }

  return { randomInt, randomRange, pick };
})();
