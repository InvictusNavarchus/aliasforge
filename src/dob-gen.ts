import { RNG } from './rng.ts';

export type DOBFormat = 'iso' | 'us' | 'eu' | 'long';

export interface DOBOptions {
	minAge: number;
	maxAge: number;
	format: DOBFormat;
}

const MONTH_NAMES: readonly string[] = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];

const MS_PER_DAY = 86_400_000;

function generateDate(opts: Pick<DOBOptions, 'minAge' | 'maxAge'>): Date {
	if (opts.minAge < 1 || opts.maxAge < 1) {
		throw new RangeError('DOBGen: age values must be positive.');
	}
	if (opts.minAge > opts.maxAge) {
		throw new RangeError('DOBGen: minAge must be less than maxAge.');
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Compute the valid date range:
	//   earliest DOB = today minus maxAge years (oldest person)
	//   latest DOB   = today minus minAge years (youngest person)
	const earliest = new Date(today);
	earliest.setFullYear(earliest.getFullYear() - opts.maxAge);

	const latest = new Date(today);
	latest.setFullYear(latest.getFullYear() - opts.minAge);

	// Work in whole days to stay within 32-bit integer range.
	// Max range is ~100 years = ~36525 days, well within 2^32.
	const earliestDay = Math.floor(earliest.getTime() / MS_PER_DAY);
	const latestDay = Math.floor(latest.getTime() / MS_PER_DAY);
	const rangeDays = latestDay - earliestDay;

	const offsetDays = rangeDays > 0 ? RNG.randomInt(rangeDays + 1) : 0;
	const dob = new Date((earliestDay + offsetDays) * MS_PER_DAY);
	dob.setHours(0, 0, 0, 0);
	return dob;
}

function formatDate(date: Date, fmt: DOBFormat): string {
	const y = date.getFullYear();
	const m = date.getMonth();
	const d = date.getDate();
	const mm = String(m + 1).padStart(2, '0');
	const dd = String(d).padStart(2, '0');

	switch (fmt) {
		case 'iso':
			return `${y}-${mm}-${dd}`;
		case 'us':
			return `${mm}/${dd}/${y}`;
		case 'eu':
			return `${dd}/${mm}/${y}`;
		case 'long':
			return `${MONTH_NAMES[m]} ${d}, ${y}`;
	}
}

function generateMany(count: number, opts: DOBOptions): string[] {
	if (!Number.isInteger(count) || count <= 0) {
		throw new RangeError(
			`DOBGen.generateMany: count must be a positive integer, got ${count}`,
		);
	}
	return Array.from({ length: count }, () =>
		formatDate(generateDate(opts), opts.format),
	);
}

export const DOBGen = { generateMany } as const;
