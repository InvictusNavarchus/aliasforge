import { DataStore } from './data-store.ts';

export interface FullName {
  first: string;
  last: string;
  full: string;
}

function generate(): FullName {
  const first = DataStore.getFirstName();
  let last: string;
  let attempts = 0;

  do {
    last = DataStore.getLastName();
    attempts++;
  } while (last.toLowerCase() === first.toLowerCase() && attempts < 100);

  return { first, last, full: `${first} ${last}` };
}

function generateMany(count: number): FullName[] {
  const results: FullName[] = [];
  const seen = new Set<string>();
  let attempts = 0;
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

export const NameGen = { generate, generateMany } as const;
