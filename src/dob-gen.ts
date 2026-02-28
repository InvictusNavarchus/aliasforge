import { RNG } from './rng.ts';

export type DOBFormat = 'iso' | 'us' | 'eu' | 'long';

export interface DOBOptions {
  minAge: number;
  maxAge: number;
  format: DOBFormat;
}

const MONTH_NAMES: readonly string[] = [
  'January', 'February', 'March',     'April',   'May',      'June',
  'July',    'August',   'September', 'October', 'November', 'December',
];

function generateDate(opts: Pick<DOBOptions, 'minAge' | 'maxAge'>): Date {
  if (opts.minAge < 1 || opts.maxAge < 1) {
    throw new RangeError('DOBGen: age values must be positive.');
  }
  if (opts.minAge > opts.maxAge) {
    throw new RangeError('DOBGen: minAge must be less than maxAge.');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ageYears   = RNG.randomRange(opts.minAge, opts.maxAge);
  const birthYear  = today.getFullYear() - ageYears;
  const birthMonth = RNG.randomInt(12);

  const daysInMonth = new Date(birthYear, birthMonth + 1, 0).getDate();
  const birthDay    = 1 + RNG.randomInt(daysInMonth);

  const dob = new Date(birthYear, birthMonth, birthDay);
  dob.setHours(0, 0, 0, 0);
  return dob;
}

function formatDate(date: Date, fmt: DOBFormat): string {
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
  }
}

function generateMany(count: number, opts: DOBOptions): string[] {
  return Array.from({ length: count }, () =>
    formatDate(generateDate(opts), opts.format)
  );
}

export const DOBGen = { generateMany } as const;
