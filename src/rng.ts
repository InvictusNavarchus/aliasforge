function randomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0) {
    throw new RangeError(`randomInt: max must be a positive integer, got ${max}`);
  }
  if (max === 1) return 0;

  const buf = new Uint32Array(1);
  const threshold = 2 ** 32 - ((2 ** 32) % max);

  let val: number;
  do {
    crypto.getRandomValues(buf);
    val = buf[0]!;
  } while (val >= threshold);

  return val % max;
}

function randomRange(min: number, max: number): number {
  return min + randomInt(max - min + 1);
}

function pick<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new RangeError('RNG.pick: array must not be empty');
  return arr[randomInt(arr.length)]!;
}

export const RNG = { randomInt, randomRange, pick } as const;
