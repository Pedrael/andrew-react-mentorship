import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CategoriesFile, Category, Player } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = process.env.DATA_DIR ?? join(__dirname, '..', 'data');
const PLAYERS_PATH = join(DATA_DIR, 'players.json');
const CATEGORIES_PATH = join(DATA_DIR, 'categories.json');

function createFileLock() {
  let tail: Promise<void> = Promise.resolve();
  return function runLocked<T>(fn: () => Promise<T>): Promise<T> {
    const result = tail.then(fn);
    tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
}

const lockPlayers = createFileLock();
const lockCategories = createFileLock();

async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

async function initFile(path: string, initialContent: string): Promise<void> {
  try {
    await readFile(path, 'utf8');
  } catch (err: unknown) {
    const code = err && typeof err === 'object' && 'code' in err ? (err as NodeJS.ErrnoException).code : undefined;
    if (code !== 'ENOENT') throw err;
    await ensureDataDir();
    await writeFile(path, initialContent, 'utf8');
  }
}

export async function ensureStoreInitialized(): Promise<void> {
  await ensureDataDir();
  await initFile(PLAYERS_PATH, '[]\n');
  await initFile(CATEGORIES_PATH, JSON.stringify({ categories: [] }, null, 2) + '\n');
}

export async function readPlayers(): Promise<Player[]> {
  await ensureStoreInitialized();
  const raw = await readFile(PLAYERS_PATH, 'utf8');
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('players.json must contain a JSON array');
  return parsed as Player[];
}

export async function writePlayers(players: Player[]): Promise<void> {
  await ensureStoreInitialized();
  await writeFile(PLAYERS_PATH, JSON.stringify(players, null, 2) + '\n', 'utf8');
}

export async function withPlayersLock<T>(fn: (players: Player[]) => Promise<T>): Promise<T> {
  return lockPlayers(async () => fn(await readPlayers()));
}

export async function readCategoriesRoot(): Promise<CategoriesFile> {
  await ensureStoreInitialized();
  const raw = await readFile(CATEGORIES_PATH, 'utf8');
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as CategoriesFile).categories)) {
    throw new Error('categories.json must be an object with a "categories" array');
  }
  return parsed as CategoriesFile;
}

export async function writeCategoriesRoot(root: CategoriesFile): Promise<void> {
  await ensureStoreInitialized();
  await writeFile(CATEGORIES_PATH, JSON.stringify(root, null, 2) + '\n', 'utf8');
}

/** Read-modify-write `categories.json` under a single lock. */
export async function editCategories<T>(editor: (root: CategoriesFile) => Promise<T>): Promise<T> {
  return lockCategories(async () => {
    const root = await readCategoriesRoot();
    const result = await editor(root);
    await writeCategoriesRoot(root);
    return result;
  });
}

export function defaultJeopardyQuestions(): Category['questions'] {
  return [100, 200, 300, 400, 500].map((price) => ({
    price,
    question: '',
    answer: '',
    isAnswered: false,
  }));
}
