import { RNG } from './rng.ts';
import { NameGen, type FullName } from './name-gen.ts';

export type UsernamePattern =
  | 'first.last'
  | 'first_digits'
  | 'initial_last'
  | 'initial_last_digits'
  | 'firstlast_digits'
  | 'last_digits';

export type UsernameCasing = 'lower' | 'upper' | 'camel' | 'pascal';

export interface UsernameOptions {
  pattern: UsernamePattern;
  casing: UsernameCasing;
  name?: FullName | null;
}

type PatternBuilder = (first: string, last: string) => string;
type CaseTransform = (str: string) => string;

const PATTERNS: Record<UsernamePattern, PatternBuilder> = {
  'first.last':          (first, last) => `${first}.${last}`,
  'first_digits':        (first)       => `${first}${randomDigits(4)}`,
  'initial_last':        (first, last) => `${first[0]}.${last}`,
  'initial_last_digits': (first, last) => `${first[0]}.${last}${randomDigits(3)}`,
  'firstlast_digits':    (first, last) => `${first}${last}${randomDigits(2)}`,
  'last_digits':         (_first, last) => `${last}${randomDigits(3)}`,
};

const CASE_TRANSFORMS: Record<UsernameCasing, CaseTransform> = {
  lower:  str => str.toLowerCase(),
  upper:  str => str.toUpperCase(),
  camel:  str => {
    const parts = str.toLowerCase().split(/[._]/);
    return parts[0]! + parts.slice(1).map(capitalise).join('');
  },
  pascal: str => str.toLowerCase().split(/[._]/).map(capitalise).join(''),
};

function randomDigits(n: number): string {
  return String(RNG.randomInt(10 ** n)).padStart(n, '0');
}

function capitalise(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generate(opts: UsernameOptions): string {
  const patternFn = PATTERNS[opts.pattern] ?? PATTERNS['first_digits'];
  const caseFn    = CASE_TRANSFORMS[opts.casing] ?? CASE_TRANSFORMS['lower'];
  const resolved  = opts.name ?? NameGen.generate();
  const raw       = patternFn(resolved.first.toLowerCase(), resolved.last.toLowerCase());
  return caseFn(raw);
}

function generateMany(count: number, opts: UsernameOptions, names: FullName[] = []): string[] {
  const results: string[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  let namesIndex = 0;
  const maxAttempts = count * 100;

  while (results.length < count && attempts < maxAttempts) {
    const name = namesIndex < names.length ? names[namesIndex] : null;
    const username = generate({ ...opts, name });
    namesIndex++;

    if (!seen.has(username)) {
      seen.add(username);
      results.push(username);
    }
    attempts++;
  }

  return results;
}

export const UsernameGen = { generate, generateMany } as const;
