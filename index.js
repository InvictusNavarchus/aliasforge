/**
 * @fileoverview AliasForge — Bootstrap
 *
 * Entry point. All application logic lives in dedicated modules under js/.
 * Load order (declared in index.html):
 *
 *   js/rng.js            — Cryptographic RNG (no deps)
 *   js/data-store.js     — Name dataset loader   (needs: RNG)
 *   js/name-gen.js       — Full name generator   (needs: DataStore)
 *   js/username-gen.js   — Username generator    (needs: RNG, NameGen)
 *   js/dob-gen.js        — DOB generator         (needs: RNG)
 *   js/ui/clipboard.js   — Clipboard & toast     (no generator deps)
 *   js/ui/renderer.js    — DOM result rendering  (needs: Clipboard)
 *   js/ui/handlers.js    — Generator handlers    (needs: Renderer, generators)
 *   js/ui/app.js         — App init & wiring     (needs: DataStore, Handlers)
 *   index.js             — Bootstrap (this file)
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => App.init());
