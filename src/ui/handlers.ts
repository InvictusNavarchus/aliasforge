import { NameGen } from '../name-gen.ts';
import { UsernameGen, type UsernamePattern, type UsernameCasing } from '../username-gen.ts';
import { DOBGen, type DOBFormat } from '../dob-gen.ts';
import { Renderer } from './renderer.ts';

const nameCountSlider = document.getElementById('name-count') as HTMLInputElement;

const usernameCountSlider   = document.getElementById('username-count') as HTMLInputElement;
const usernamePatternSelect = document.getElementById('username-pattern') as HTMLSelectElement;
const usernameCaseSelect    = document.getElementById('username-case') as HTMLSelectElement;

const dobCountSlider  = document.getElementById('dob-count') as HTMLInputElement;
const minAgeInput     = document.getElementById('min-age') as HTMLInputElement;
const maxAgeInput     = document.getElementById('max-age') as HTMLInputElement;
const dobFormatSelect = document.getElementById('dob-format') as HTMLSelectElement;

const resultsNames    = document.getElementById('results-names') as HTMLElement;
const resultsUsername = document.getElementById('results-username') as HTMLElement;
const resultsDob      = document.getElementById('results-dob') as HTMLElement;

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
  const count = parseInt(nameCountSlider.value, 10);
  const names = NameGen.generateMany(count);
  Renderer.render(resultsNames, names.map(n => n.full));
}

function generateUsernames(): void {
  const count   = parseInt(usernameCountSlider.value, 10);
  const pattern = usernamePatternSelect.value as UsernamePattern;
  const casing  = usernameCaseSelect.value as UsernameCasing;
  const usernames = UsernameGen.generateMany(count, { pattern, casing });
  Renderer.render(resultsUsername, usernames);
}

function generateDOB(): void {
  const count              = parseInt(dobCountSlider.value, 10);
  const { minAge, maxAge } = readAgeRange();
  const format             = dobFormatSelect.value as DOBFormat;
  const dates              = DOBGen.generateMany(count, { minAge, maxAge, format });
  Renderer.render(resultsDob, dates);
}

function generateAll(): void {
  const nNames = parseInt(nameCountSlider.value, 10);
  const names  = NameGen.generateMany(nNames);
  Renderer.render(resultsNames, names.map(n => n.full));

  const nUsernames = parseInt(usernameCountSlider.value, 10);
  const pattern    = usernamePatternSelect.value as UsernamePattern;
  const casing     = usernameCaseSelect.value as UsernameCasing;
  const usernames  = UsernameGen.generateMany(nUsernames, { pattern, casing }, names);
  Renderer.render(resultsUsername, usernames);

  generateDOB();
}

export const Handlers = { generateNames, generateUsernames, generateDOB, generateAll } as const;
