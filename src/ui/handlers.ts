import { NameGen, type FullName } from '../name-gen.ts';
import { UsernameGen, type UsernamePattern, type UsernameCasing } from '../username-gen.ts';
import { DOBGen, type DOBFormat } from '../dob-gen.ts';
import { Renderer } from './renderer.ts';

const globalCountSlider = document.getElementById('global-count') as HTMLInputElement;

const usernamePatternSelect = document.getElementById('username-pattern') as HTMLSelectElement;
const usernameCaseSelect    = document.getElementById('username-case') as HTMLSelectElement;
const usernameMatchSelect   = document.getElementById('username-match') as HTMLSelectElement;

const minAgeInput     = document.getElementById('min-age') as HTMLInputElement;
const maxAgeInput     = document.getElementById('max-age') as HTMLInputElement;
const dobFormatSelect = document.getElementById('dob-format') as HTMLSelectElement;

const resultsNames    = document.getElementById('results-names') as HTMLElement;
const resultsUsername = document.getElementById('results-username') as HTMLElement;
const resultsDob      = document.getElementById('results-dob') as HTMLElement;

function getCount(): number {
  return parseInt(globalCountSlider.value, 10);
}

function readAgeRange(): { minAge: number; maxAge: number } {
  let minAge = parseInt(minAgeInput.value, 10);
  let maxAge = parseInt(maxAgeInput.value, 10);

  if (isNaN(minAge) || minAge < 1)  minAge = 1;
  if (isNaN(maxAge) || maxAge < 1)  maxAge = 1;
  if (maxAge > 99)                  maxAge = 99;
  if (minAge >= maxAge)             minAge = Math.max(1, maxAge - 1);

  minAgeInput.value = String(minAge);
  maxAgeInput.value = String(maxAge);

  return { minAge, maxAge };
}

function generateNames(): void {
  const count = getCount();
  const names = NameGen.generateMany(count);
  Renderer.render(resultsNames, names.map(n => n.full));
}

function generateUsernames(): void {
  const count   = getCount();
  const pattern = usernamePatternSelect.value as UsernamePattern;
  const casing  = usernameCaseSelect.value as UsernameCasing;
  const match   = usernameMatchSelect?.value === 'yes';

  let names: FullName[] = [];
  if (match) {
    const renderedNames = Array.from(resultsNames.querySelectorAll('.result-value'));
    names = renderedNames.map(el => {
      const parts = (el.textContent || '').trim().split(' ');
      const first = parts[0] || '';
      const last = parts.slice(1).join(' ') || '';
      return { first, last, full: `${first} ${last}` };
    });
  }

  const usernames = UsernameGen.generateMany(count, { pattern, casing }, names);
  Renderer.render(resultsUsername, usernames);
}

function generateDOB(): void {
  const count              = getCount();
  const { minAge, maxAge } = readAgeRange();
  const format             = dobFormatSelect.value as DOBFormat;
  const dates              = DOBGen.generateMany(count, { minAge, maxAge, format });
  Renderer.render(resultsDob, dates);
}

function generateAll(): void {
  const count = getCount();
  const names = NameGen.generateMany(count);
  Renderer.render(resultsNames, names.map(n => n.full));

  const pattern   = usernamePatternSelect.value as UsernamePattern;
  const casing    = usernameCaseSelect.value as UsernameCasing;
  const usernames = UsernameGen.generateMany(count, { pattern, casing }, names);
  Renderer.render(resultsUsername, usernames);

  generateDOB();
}

export const Handlers = { generateNames, generateUsernames, generateDOB, generateAll } as const;
