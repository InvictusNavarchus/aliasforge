import { RNG } from './rng.ts';

export interface DataStoreStats {
	firstNames: number;
	lastNames: number;
}

let firstNames: string[] | null = null;
let lastNames: string[] | null = null;

function isValidName(name: string): boolean {
	return (
		name.length >= 2 && name.length <= 40 && /^[\p{L}\s'\-.]+$/u.test(name)
	);
}

function toTitleCase(str: string): string {
	return str
		.split(/(?<=[-\s])/)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join('');
}

async function loadFile(path: string): Promise<string[]> {
	const response = await fetch(path);
	if (!response.ok) {
		throw new Error(
			`Failed to load ${path}: ${response.status} ${response.statusText}`,
		);
	}

	const raw = await response.text();
	const seen = new Set<string>();

	const names = raw
		.replace(/^\uFEFF/, '')
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => isValidName(line))
		.filter((line) => {
			const key = line.toLowerCase();
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		})
		.map(toTitleCase);

	if (names.length === 0) {
		throw new Error(
			`Name file ${path} produced zero valid entries after cleaning.`,
		);
	}

	return names;
}

async function init(): Promise<void> {
	[firstNames, lastNames] = await Promise.all([
		loadFile('./data/first-names.txt'),
		loadFile('./data/last-names.txt'),
	]);
}

function getFirstName(): string {
	if (!firstNames)
		throw new Error('DataStore not initialised. Call DataStore.init() first.');
	return RNG.pick(firstNames);
}

function getLastName(): string {
	if (!lastNames)
		throw new Error('DataStore not initialised. Call DataStore.init() first.');
	return RNG.pick(lastNames);
}

function isReady(): boolean {
	return firstNames !== null && lastNames !== null;
}

function stats(): DataStoreStats {
	return {
		firstNames: firstNames?.length ?? 0,
		lastNames: lastNames?.length ?? 0,
	};
}

export const DataStore = {
	init,
	getFirstName,
	getLastName,
	isReady,
	stats,
} as const;
