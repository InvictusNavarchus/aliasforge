function randomInt(max: number): number {
	if (!Number.isInteger(max) || max <= 0) {
		throw new RangeError(
			`randomInt: max must be a positive integer, got ${max}`,
		);
	}
	if (max > 2 ** 32) {
		throw new RangeError(`randomInt: max must be <= 2^32, got ${max}`);
	}
	if (max === 1) return 0;

	const buf = new Uint32Array(1);
	const threshold = 2 ** 32 - (2 ** 32 % max);

	let val: number;
	do {
		crypto.getRandomValues(buf);
		val = buf[0]!;
	} while (val >= threshold);

	return val % max;
}

function randomRange(min: number, max: number): number {
	if (!Number.isInteger(min) || !Number.isInteger(max)) {
		throw new RangeError(
			`randomRange: min and max must be integers, got ${min} and ${max}`,
		);
	}
	if (min > max) {
		throw new RangeError(
			`randomRange: min must be <= max, got ${min} > ${max}`,
		);
	}
	if (min === max) return min;

	const range = max - min + 1;
	if (range > 2 ** 32) {
		throw new RangeError(
			`randomRange: range (max - min + 1) must be <= 2^32, got ${range}`,
		);
	}
	return min + randomInt(range);
}

function pick<T>(arr: readonly T[]): T {
	if (arr.length === 0)
		throw new RangeError('RNG.pick: array must not be empty');
	return arr[randomInt(arr.length)]!;
}

export const RNG = { randomInt, randomRange, pick } as const;
