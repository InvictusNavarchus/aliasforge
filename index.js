/**
 * @fileoverview SecureIdent — Cryptographically Secure Identity Generator
 *
 * Architecture:
 *   RNG         — Cryptographic random number generation (no Math.random)
 *   DataStore   — Loads and indexes name datasets from plain-text files
 *   NameGen     — Full name generation with same-name collision prevention
 *   UsernameGen — Pattern-based username generation with case transforms
 *   DOBGen      — Statistically plausible date-of-birth generation
 *   UI          — DOM controller, event wiring, copy-to-clipboard
 *
 * Data files expected (one name per line, UTF-8):
 *   ./data/first-names.txt
 *   ./data/last-names.txt
 *
 * @version 1.0.0
 */

'use strict';

/* ============================================================
   § 1. RNG — Cryptographic Random Number Generation
   ============================================================ */

/**
 * @namespace RNG
 * @description Thin wrapper around crypto.getRandomValues.
 * Never exposes Math.random anywhere in the codebase.
 */
const RNG = (() => {
  /**
   * Returns a cryptographically secure random unsigned 32-bit integer
   * in the half-open interval [0, max).
   *
   * Uses rejection sampling to eliminate modulo bias — the most common
   * subtle security bug in naive RNG wrappers.
   *
   * @param {number} max - Exclusive upper bound. Must be > 0 and ≤ 2^32.
   * @returns {number} Random integer in [0, max).
   * @throws {RangeError} If max is not a positive integer.
   */
  function randomInt(max) {
    if (!Number.isInteger(max) || max <= 0) {
      throw new RangeError(`randomInt: max must be a positive integer, got ${max}`);
    }
    if (max === 1) return 0;

    const buf = new Uint32Array(1);
    // Largest multiple of max that fits in Uint32 — rejection threshold
    const threshold = (2 ** 32) - ((2 ** 32) % max);

    let val;
    do {
      crypto.getRandomValues(buf);
      val = buf[0];
    } while (val >= threshold); // Reject values that would cause modulo bias

    return val % max;
  }

  /**
   * Returns a random integer in the closed interval [min, max].
   *
   * @param {number} min - Inclusive lower bound.
   * @param {number} max - Inclusive upper bound.
   * @returns {number} Random integer in [min, max].
   */
  function randomRange(min, max) {
    return min + randomInt(max - min + 1);
  }

  /**
   * Picks a random element from an array.
   *
   * @template T
   * @param {T[]} arr - Non-empty array to pick from.
   * @returns {T} Random element.
   * @throws {RangeError} If array is empty.
   */
  function pick(arr) {
    if (arr.length === 0) throw new RangeError('RNG.pick: array must not be empty');
    return arr[randomInt(arr.length)];
  }

  return { randomInt, randomRange, pick };
})();


/* ============================================================
   § 2. DataStore — Name Dataset Loader & Index Builder
   ============================================================ */

/**
 * @namespace DataStore
 * @description Loads, cleans, and indexes flat name datasets from
 * plain-text files. All heavy work happens once at startup.
 */
const DataStore = (() => {
  /** @type {string[] | null} */
  let firstNames = null;
  /** @type {string[] | null} */
  let lastNames  = null;

  /**
   * Fetches a plain-text name file and returns a deduplicated, cleaned
   * array of name strings. Handles trailing newlines, BOM, and empty lines.
   *
   * @param {string} path - Relative URL to the .txt file.
   * @returns {Promise<string[]>} Resolved array of name strings.
   * @throws {Error} If the fetch fails or the file is empty.
   */
  async function loadFile(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
    }

    const raw = await response.text();

    const seen = new Set();
    const names = raw
      .replace(/^\uFEFF/, '')            // Strip BOM if present
      .split('\n')
      .map(line => line.trim())
      .filter(line => isValidName(line)) // Remove junk entries
      .filter(line => {                  // Deduplicate (case-insensitive)
        const key = line.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(toTitleCase);                 // Normalise casing

    if (names.length === 0) {
      throw new Error(`Name file ${path} produced zero valid entries after cleaning.`);
    }

    return names;
  }

  /**
   * Validates that a raw line looks like a plausible human name.
   * Accepts Unicode letters, spaces, apostrophes, hyphens, and dots.
   * Rejects digits, empty strings, very short/long strings.
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
   * Converts a string to Title Case, handling hyphenated names
   * like "anne-marie" → "Anne-Marie".
   *
   * @param {string} str
   * @returns {string}
   */
  function toTitleCase(str) {
    return str
      .split(/(?<=[-\s])/) // split after hyphens and spaces (keep delimiter)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Loads both name datasets concurrently.
   * Must be called before any generator functions.
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
   * @returns {string}
   * @throws {Error} If DataStore.init() has not been called.
   */
  function getFirstName() {
    if (!firstNames) throw new Error('DataStore not initialised. Call DataStore.init() first.');
    return RNG.pick(firstNames);
  }

  /**
   * Returns a random last name from the loaded dataset.
   * @returns {string}
   * @throws {Error} If DataStore.init() has not been called.
   */
  function getLastName() {
    if (!lastNames) throw new Error('DataStore not initialised. Call DataStore.init() first.');
    return RNG.pick(lastNames);
  }

  /** @returns {boolean} Whether datasets are loaded and ready. */
  function isReady() {
    return firstNames !== null && lastNames !== null;
  }

  /** @returns {{ firstNames: number, lastNames: number }} Dataset sizes. */
  function stats() {
    return {
      firstNames: firstNames?.length ?? 0,
      lastNames:  lastNames?.length ?? 0,
    };
  }

  return { init, getFirstName, getLastName, isReady, stats };
})();


/* ============================================================
   § 3. NameGen — Full Name Generator
   ============================================================ */

/**
 * @namespace NameGen
 * @description Generates full names from DataStore, with a collision
 * guard that prevents outputs like "James James".
 */
const NameGen = (() => {
  /**
   * @typedef {Object} FullName
   * @property {string} first - First name in Title Case.
   * @property {string} last  - Last name in Title Case.
   * @property {string} full  - Combined "First Last".
   */

  /**
   * Generates a single full name. Re-rolls the last name if it
   * case-insensitively matches the first name, preventing "Jordan Jordan".
   * Expected to loop at most once in practice.
   *
   * @returns {FullName}
   */
  function generate() {
    const first = DataStore.getFirstName();
    let last;

    // Rejection loop: avoids same-word first/last pairs
    let attempts = 0;
    do {
      last = DataStore.getLastName();
      attempts++;
    } while (
      last.toLowerCase() === first.toLowerCase() &&
      attempts < 100 // hard safety cap — theoretically ~impossible to reach
    );

    return { first, last, full: `${first} ${last}` };
  }

  /**
   * Generates multiple distinct full names.
   * "Distinct" means no two results share the exact same .full string.
   *
   * @param {number} count - Number of names to generate.
   * @returns {FullName[]}
   */
  function generateMany(count) {
    const results = [];
    const seen = new Set();
    let attempts = 0;
    const maxAttempts = count * 50; // generous cap for large datasets

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


/* ============================================================
   § 4. UsernameGen — Pattern-Based Username Generator
   ============================================================ */

/**
 * @namespace UsernameGen
 * @description Generates natural-looking usernames by combining
 * name fragments with configurable patterns and case transforms.
 * All digit suffixes use CSPRNG.
 */
const UsernameGen = (() => {
  /**
   * Available patterns.
   * Each entry maps a pattern ID (from the <select>) to a builder function.
   *
   * Builder receives (first: string, last: string) and returns a raw
   * lowercase string. Case transforms are applied after.
   *
   * @type {Record<string, (first: string, last: string) => string>}
   */
  const PATTERNS = {
    /** e.g. "james.wilson" */
    'first.last': (first, last) =>
      `${first}.${last}`,

    /** e.g. "james4821" */
    'first_digits': (first) =>
      `${first}${randomDigits(4)}`,

    /** e.g. "j.wilson" */
    'initial_last': (first, last) =>
      `${first[0]}.${last}`,

    /** e.g. "j.wilson847" */
    'initial_last_digits': (first, last) =>
      `${first[0]}.${last}${randomDigits(3)}`,

    /** e.g. "jameswilson92" */
    'firstlast_digits': (first, last) =>
      `${first}${last}${randomDigits(2)}`,

    /** e.g. "wilson391" */
    'last_digits': (_first, last) =>
      `${last}${randomDigits(3)}`,
  };

  /**
   * Case transform functions.
   *
   * @type {Record<string, (str: string) => string>}
   */
  const CASE_TRANSFORMS = {
    /** "jameswilson" */
    lower: str => str.toLowerCase(),

    /** "JAMESWILSON" */
    upper: str => str.toUpperCase(),

    /**
     * camelCase: capitalises every segment after the first.
     * "james.wilson" → "jamesWilson"
     * Segments are split on dots and underscores.
     */
    camel: str => {
      const parts = str.toLowerCase().split(/[._]/);
      return parts[0] + parts.slice(1).map(capitalise).join('');
    },

    /**
     * PascalCase: capitalises every segment.
     * "james.wilson" → "JamesWilson"
     */
    pascal: str => {
      const parts = str.toLowerCase().split(/[._]/);
      return parts.map(capitalise).join('');
    },
  };

  /**
   * Generates a zero-padded string of N cryptographically random digits.
   * e.g. randomDigits(4) might return "0371".
   *
   * @param {number} n - Number of digits.
   * @returns {string}
   */
  function randomDigits(n) {
    const max = 10 ** n;
    const val = RNG.randomInt(max);
    return String(val).padStart(n, '0');
  }

  /**
   * Capitalises the first character of a string.
   * Preserves digits and other non-alpha characters at position 0.
   *
   * @param {string} str
   * @returns {string}
   */
  function capitalise(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Generates a single username.
   *
   * @param {Object}  opts
   * @param {string}  opts.pattern - Pattern ID (key of PATTERNS).
   * @param {string}  opts.casing  - Case transform ID (key of CASE_TRANSFORMS).
   * @returns {string} Generated username.
   */
  function generate({ pattern, casing }) {
    const patternFn = PATTERNS[pattern] ?? PATTERNS['first_digits'];
    const caseFn    = CASE_TRANSFORMS[casing] ?? CASE_TRANSFORMS['lower'];

    const { first, last } = NameGen.generate();
    const raw = patternFn(first.toLowerCase(), last.toLowerCase());
    return caseFn(raw);
  }

  /**
   * Generates multiple distinct usernames.
   *
   * @param {number} count
   * @param {Object} opts - Same options as generate().
   * @returns {string[]}
   */
  function generateMany(count, opts) {
    const results = [];
    const seen = new Set();
    let attempts = 0;
    const maxAttempts = count * 100;

    while (results.length < count && attempts < maxAttempts) {
      const username = generate(opts);
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


/* ============================================================
   § 5. DOBGen — Date of Birth Generator
   ============================================================ */

/**
 * @namespace DOBGen
 * @description Generates plausible birthdates within a configurable
 * age range. Handles leap years and month-length edge cases correctly.
 */
const DOBGen = (() => {
  /**
   * Long month names for the "long" display format.
   * @type {string[]}
   */
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  /**
   * Generates a single birthdate as a Date object.
   * Age is computed against today's date at midnight UTC.
   *
   * @param {Object} opts
   * @param {number} opts.minAge - Minimum age in full years (inclusive).
   * @param {number} opts.maxAge - Maximum age in full years (inclusive).
   * @returns {Date}
   * @throws {RangeError} If minAge >= maxAge or either is non-positive.
   */
  function generateDate({ minAge, maxAge }) {
    if (minAge < 1 || maxAge < 1) {
      throw new RangeError('DOBGen: age values must be positive.');
    }
    if (minAge >= maxAge) {
      throw new RangeError('DOBGen: minAge must be less than maxAge.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Random age offset — bias person to be born uniformly in the full age range
    const ageYears  = RNG.randomRange(minAge, maxAge);
    const birthYear = today.getFullYear() - ageYears;

    // Random month (0-indexed)
    const birthMonth = RNG.randomInt(12);

    // Correct day range for this specific month/year (handles Feb 29, etc.)
    const daysInMonth = new Date(birthYear, birthMonth + 1, 0).getDate();
    const birthDay    = 1 + RNG.randomInt(daysInMonth);

    const dob = new Date(birthYear, birthMonth, birthDay);
    dob.setHours(0, 0, 0, 0);
    return dob;
  }

  /**
   * Formats a Date as a string per the selected format.
   *
   * @param {Date}   date
   * @param {string} format - One of: 'iso' | 'us' | 'eu' | 'long'
   * @returns {string}
   */
  function format(date, fmt) {
    const y  = date.getFullYear();
    const m  = date.getMonth();           // 0-indexed
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

  /**
   * Generates multiple formatted birthdate strings.
   *
   * @param {number} count
   * @param {Object} opts
   * @param {number} opts.minAge
   * @param {number} opts.maxAge
   * @param {string} opts.format - Format ID.
   * @returns {string[]}
   */
  function generateMany(count, opts) {
    return Array.from({ length: count }, () =>
      format(generateDate(opts), opts.format)
    );
  }

  return { generateMany };
})();


/* ============================================================
   § 6. UI — DOM Controller
   ============================================================ */

/**
 * @namespace UI
 * @description Wires all generator modules to the DOM.
 * Handles slider display, form reads, result rendering, and clipboard.
 */
const UI = (() => {

  // ── DOM References ──────────────────────────────────────

  const appStatus      = document.getElementById('app-status');
  const statusMessage  = document.getElementById('status-message');
  const generatorGrid  = document.getElementById('generator-grid');
  const generateAllStrip = document.getElementById('generate-all-strip');
  const copyToast      = document.getElementById('copy-toast');

  // Name card
  const nameCountSlider    = document.getElementById('name-count');
  const nameCountDisplay   = document.getElementById('name-count-display');
  const btnNames           = document.getElementById('btn-names');
  const resultsNames       = document.getElementById('results-names');

  // Username card
  const usernameCountSlider   = document.getElementById('username-count');
  const usernameCountDisplay  = document.getElementById('username-count-display');
  const usernamePatternSelect = document.getElementById('username-pattern');
  const usernameCaseSelect    = document.getElementById('username-case');
  const btnUsername           = document.getElementById('btn-username');
  const resultsUsername       = document.getElementById('results-username');

  // DOB card
  const dobCountSlider   = document.getElementById('dob-count');
  const dobCountDisplay  = document.getElementById('dob-count-display');
  const minAgeInput      = document.getElementById('min-age');
  const maxAgeInput      = document.getElementById('max-age');
  const dobFormatSelect  = document.getElementById('dob-format');
  const btnDob           = document.getElementById('btn-dob');
  const resultsDob       = document.getElementById('results-dob');

  // Generate All
  const btnAll = document.getElementById('btn-all');


  // ── Toast ────────────────────────────────────────────────

  /** @type {ReturnType<setTimeout> | null} */
  let toastTimer = null;

  /**
   * Shows a brief toast notification.
   * @param {string} msg
   */
  function showToast(msg) {
    copyToast.textContent = msg;
    copyToast.classList.add('visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => copyToast.classList.remove('visible'), 1800);
  }


  // ── Clipboard ────────────────────────────────────────────

  /**
   * Copies text to clipboard using the modern async API.
   * Falls back to execCommand for older browsers.
   *
   * @param {string}      text
   * @param {HTMLElement} btn  - The copy button element (for visual feedback).
   */
  async function copyToClipboard(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for environments without clipboard API
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


  // ── Result Rendering ─────────────────────────────────────

  /**
   * Creates a single result row element.
   *
   * @param {string} value - The generated value to display.
   * @returns {HTMLElement}
   */
  function createResultItem(value) {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.setAttribute('role', 'listitem');

    const span = document.createElement('span');
    span.className = 'result-value';
    span.textContent = value;

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', `Copy ${value}`);
    btn.addEventListener('click', () => copyToClipboard(value, btn));

    item.appendChild(span);
    item.appendChild(btn);
    return item;
  }

  /**
   * Replaces the contents of a results container with new items.
   * Clears existing items first to trigger the stagger animation.
   *
   * @param {HTMLElement} container
   * @param {string[]}    values
   */
  function renderResults(container, values) {
    container.innerHTML = '';
    // requestAnimationFrame ensures the DOM is clear before re-populating,
    // allowing CSS animations to re-trigger.
    requestAnimationFrame(() => {
      const fragment = document.createDocumentFragment();
      values.forEach(v => fragment.appendChild(createResultItem(v)));
      container.appendChild(fragment);
    });
  }


  // ── Slider Sync ──────────────────────────────────────────

  /**
   * Binds a range input to a display element so the label
   * stays in sync as the user drags.
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
    sync(); // initialise on page load
  }


  // ── Input Readers ────────────────────────────────────────

  /**
   * Reads and validates the min/max age inputs.
   * Returns sanitised values, clamped to safe ranges.
   *
   * @returns {{ minAge: number, maxAge: number }}
   */
  function readAgeRange() {
    let minAge = parseInt(minAgeInput.value, 10);
    let maxAge = parseInt(maxAgeInput.value, 10);

    if (isNaN(minAge) || minAge < 1)  minAge = 1;
    if (isNaN(maxAge) || maxAge > 99) maxAge = 99;
    if (minAge >= maxAge)             minAge = Math.max(1, maxAge - 1);

    // Write back sanitised values
    minAgeInput.value = minAge;
    maxAgeInput.value = maxAge;

    return { minAge, maxAge };
  }


  // ── Generator Handlers ───────────────────────────────────

  /** Generates full names and renders them. */
  function handleGenerateNames() {
    const count = parseInt(nameCountSlider.value, 10);
    const names = NameGen.generateMany(count);
    renderResults(resultsNames, names.map(n => n.full));
  }

  /** Generates usernames and renders them. */
  function handleGenerateUsernames() {
    const count   = parseInt(usernameCountSlider.value, 10);
    const pattern = usernamePatternSelect.value;
    const casing  = usernameCaseSelect.value;
    const usernames = UsernameGen.generateMany(count, { pattern, casing });
    renderResults(resultsUsername, usernames);
  }

  /** Generates dates of birth and renders them. */
  function handleGenerateDOB() {
    const count  = parseInt(dobCountSlider.value, 10);
    const { minAge, maxAge } = readAgeRange();
    const fmt    = dobFormatSelect.value;
    const dates  = DOBGen.generateMany(count, { minAge, maxAge, format: fmt });
    renderResults(resultsDob, dates);
  }

  /** Runs all three generators simultaneously. */
  function handleGenerateAll() {
    handleGenerateNames();
    handleGenerateUsernames();
    handleGenerateDOB();
  }


  // ── Status Helpers ───────────────────────────────────────

  /**
   * Updates the loading status message.
   * @param {string}  msg
   * @param {boolean} [isError=false]
   */
  function setStatus(msg, isError = false) {
    statusMessage.textContent = msg;
    appStatus.classList.toggle('is-error', isError);
  }

  /** Hides the status overlay and reveals the generator UI. */
  function showApp() {
    appStatus.classList.add('is-hidden');
    generatorGrid.removeAttribute('aria-hidden');
    generateAllStrip.style.display = '';
  }


  // ── Init ─────────────────────────────────────────────────

  /**
   * Initialises the UI: binds sliders, wires buttons, loads data.
   * Entry point — called once on DOMContentLoaded.
   *
   * @returns {Promise<void>}
   */
  async function init() {
    // Bind sliders before data loads so controls are responsive immediately
    bindSlider(nameCountSlider,     nameCountDisplay);
    bindSlider(usernameCountSlider, usernameCountDisplay);
    bindSlider(dobCountSlider,      dobCountDisplay);

    // Wire generator buttons
    btnNames.addEventListener('click', handleGenerateNames);
    btnUsername.addEventListener('click', handleGenerateUsernames);
    btnDob.addEventListener('click', handleGenerateDOB);
    btnAll.addEventListener('click', handleGenerateAll);

    // Keyboard: Enter on age inputs triggers DOB generation
    [minAgeInput, maxAgeInput].forEach(input => {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleGenerateDOB();
      });
    });

    // Load datasets
    try {
      setStatus('Loading name datasets\u2026');
      await DataStore.init();

      const { firstNames, lastNames } = DataStore.stats();
      setStatus(`Loaded ${firstNames.toLocaleString()} first names · ${lastNames.toLocaleString()} last names`);
      showApp();

      // Auto-generate on first load for immediate gratification
      handleGenerateAll();

    } catch (err) {
      console.error('[SecureIdent] DataStore.init failed:', err);
      setStatus(
        `Failed to load datasets: ${err.message}. ` +
        'Ensure ./data/first-names.txt and ./data/last-names.txt are present.',
        true
      );
    }
  }

  return { init };
})();


/* ============================================================
   § 7. Bootstrap
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => UI.init());
