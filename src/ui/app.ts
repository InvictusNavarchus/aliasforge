import { DataStore } from '../data-store.ts';
import { Handlers } from './handlers.ts';

const appStatus        = document.getElementById('app-status') as HTMLElement;
const statusMessage    = document.getElementById('status-message') as HTMLElement;
const generatorGrid    = document.getElementById('generator-grid') as HTMLElement;
const generateAllStrip = document.getElementById('generate-all-strip') as HTMLElement;

const globalCountSlider  = document.getElementById('global-count') as HTMLInputElement;
const globalCountDisplay = document.getElementById('global-count-display') as HTMLElement;

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

function bindSettingsToggle(toggleId: string, panelId: string): void {
  const toggle = document.getElementById(toggleId) as HTMLButtonElement | null;
  const panel  = document.getElementById(panelId) as HTMLElement | null;
  if (!toggle || !panel) return;

  toggle.addEventListener('click', () => {
    const isOpen = !panel.hidden;
    panel.hidden = isOpen;
    toggle.setAttribute('aria-expanded', String(!isOpen));
    toggle.classList.toggle('is-active', !isOpen);
  });
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
  try {
    bindSlider(globalCountSlider, globalCountDisplay);

    btnNames.addEventListener('click',    Handlers.generateNames);
    btnUsername.addEventListener('click', Handlers.generateUsernames);
    btnDob.addEventListener('click',      Handlers.generateDOB);
    btnAll.addEventListener('click',      Handlers.generateAll);

    bindSettingsToggle('toggle-username-settings', 'username-settings');
    bindSettingsToggle('toggle-dob-settings',      'dob-settings');

    [minAgeInput, maxAgeInput].forEach(input => {
      input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') Handlers.generateDOB();
      });
    });

    setStatus('Loading name datasets\u2026');
    await DataStore.init();

    const { firstNames, lastNames } = DataStore.stats();
    setStatus(`Loaded ${firstNames.toLocaleString()} first names · ${lastNames.toLocaleString()} last names`);
    showApp();

    Handlers.generateAll();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[AliasForge] init failed:', err);
    setStatus(
      `Initialisation failed: ${message}. ` +
      'Ensure ./data/first-names.txt and ./data/last-names.txt are present.',
      true
    );
  }
}

export const App = { init } as const;
