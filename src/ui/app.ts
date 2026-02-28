import { DataStore } from '../data-store.ts';
import { Handlers } from './handlers.ts';

const appStatus        = document.getElementById('app-status') as HTMLElement;
const statusMessage    = document.getElementById('status-message') as HTMLElement;
const generatorGrid    = document.getElementById('generator-grid') as HTMLElement;
const generateAllStrip = document.getElementById('generate-all-strip') as HTMLElement;

const nameCountSlider      = document.getElementById('name-count') as HTMLInputElement;
const nameCountDisplay     = document.getElementById('name-count-display') as HTMLElement;
const usernameCountSlider  = document.getElementById('username-count') as HTMLInputElement;
const usernameCountDisplay = document.getElementById('username-count-display') as HTMLElement;
const dobCountSlider       = document.getElementById('dob-count') as HTMLInputElement;
const dobCountDisplay      = document.getElementById('dob-count-display') as HTMLElement;

const btnNames    = document.getElementById('btn-names') as HTMLButtonElement;
const btnUsername = document.getElementById('btn-username') as HTMLButtonElement;
const btnDob      = document.getElementById('btn-dob') as HTMLButtonElement;
const btnAll      = document.getElementById('btn-all') as HTMLButtonElement;

const minAgeInput = document.getElementById('min-age') as HTMLInputElement;
const maxAgeInput = document.getElementById('max-age') as HTMLInputElement;

function bindSlider(slider: HTMLInputElement, display: HTMLElement): void {
  const sync = (): void => {
    display.textContent = slider.value;
    slider.setAttribute('aria-valuenow', slider.value);
  };
  slider.addEventListener('input', sync);
  sync();
}

function setStatus(msg: string, isError = false): void {
  statusMessage.textContent = msg;
  appStatus.classList.toggle('is-error', isError);
}

function showApp(): void {
  appStatus.classList.add('is-hidden');
  generatorGrid.removeAttribute('aria-hidden');
  generateAllStrip.style.display = '';
}

async function init(): Promise<void> {
  bindSlider(nameCountSlider,     nameCountDisplay);
  bindSlider(usernameCountSlider, usernameCountDisplay);
  bindSlider(dobCountSlider,      dobCountDisplay);

  btnNames.addEventListener('click',    Handlers.generateNames);
  btnUsername.addEventListener('click', Handlers.generateUsernames);
  btnDob.addEventListener('click',      Handlers.generateDOB);
  btnAll.addEventListener('click',      Handlers.generateAll);

  [minAgeInput, maxAgeInput].forEach(input => {
    input.addEventListener('keydown', (e: KeyboardEvent) => {
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
    const message = err instanceof Error ? err.message : String(err);
    console.error('[AliasForge] DataStore.init failed:', err);
    setStatus(
      `Failed to load datasets: ${message}. ` +
      'Ensure ./data/first-names.txt and ./data/last-names.txt are present.',
      true
    );
  }
}

export const App = { init } as const;
