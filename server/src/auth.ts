import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { DATA_DIR } from './store.js';

const USERS_PATH = join(DATA_DIR, 'users.json');

const KEY_LEN = 32;
const SALT_LEN = 16;

export type AuthUserRecord = {
  id: string;
  username: string;
  passwordSalt: string;
  passwordHash: string;
};

type UsersFile = {
  users: AuthUserRecord[];
};

function hashPassword(password: string): { passwordSalt: string; passwordHash: string } {
  const salt = randomBytes(SALT_LEN);
  const hash = scryptSync(password, salt, KEY_LEN);
  return { passwordSalt: salt.toString('hex'), passwordHash: hash.toString('hex') };
}

export function verifyPassword(
  password: string,
  passwordSaltHex: string,
  passwordHashHex: string,
): boolean {
  try {
    const salt = Buffer.from(passwordSaltHex, 'hex');
    const expected = Buffer.from(passwordHashHex, 'hex');
    if (salt.length !== SALT_LEN || expected.length !== KEY_LEN) return false;
    const actual = scryptSync(password, salt, KEY_LEN);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

const TOKEN_BYTES = 32;
const DEFAULT_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const tokenTtlMs = Number(process.env.ACCESS_TOKEN_TTL_MS ?? DEFAULT_TOKEN_TTL_MS);

type Session = {
  username: string;
  expiresAt: number;
};

const sessions = new Map<string, Session>();

export function issueAccessToken(username: string): { accessToken: string; expiresIn: number } {
  const accessToken = randomBytes(TOKEN_BYTES).toString('hex');
  const expiresAt = Date.now() + tokenTtlMs;
  sessions.set(accessToken, { username, expiresAt });
  return { accessToken, expiresIn: Math.floor(tokenTtlMs / 1000) };
}

export function validateAccessToken(accessToken: string): boolean {
  const s = sessions.get(accessToken);
  if (!s) return false;
  if (Date.now() > s.expiresAt) {
    sessions.delete(accessToken);
    return false;
  }
  return true;
}

export async function readUsersFile(): Promise<UsersFile> {
  const raw = await readFile(USERS_PATH, 'utf8');
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as UsersFile).users)) {
    throw new Error('users.json must be an object with a "users" array');
  }
  return parsed as UsersFile;
}

export async function ensureAuthUsersFile(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(USERS_PATH, 'utf8');
  } catch (err: unknown) {
    const code =
      err && typeof err === 'object' && 'code' in err ? (err as NodeJS.ErrnoException).code : undefined;
    if (code !== 'ENOENT') throw err;
    const defaultPassword = process.env.DEFAULT_AUTH_PASSWORD ?? 'password';
    const { passwordSalt, passwordHash } = hashPassword(defaultPassword);
    const root: UsersFile = {
      users: [
        {
          id: randomUUID(),
          username: process.env.DEFAULT_AUTH_USERNAME ?? 'admin',
          passwordSalt,
          passwordHash,
        },
      ],
    };
    await writeFile(USERS_PATH, JSON.stringify(root, null, 2) + '\n', 'utf8');
    console.log(
      `[auth] created ${USERS_PATH} with user "${root.users[0].username}" (set DEFAULT_AUTH_USERNAME / DEFAULT_AUTH_PASSWORD to override next time before first boot)`,
    );
  }
}

export async function tryPasswordGrant(
  username: string,
  password: string,
): Promise<{ accessToken: string; expiresIn: number } | null> {
  const { users } = await readUsersFile();
  const user = users.find((u) => u.username === username);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) return null;
  return issueAccessToken(user.username);
}

export function getBearerToken(req: IncomingMessage): string | null {
  const raw = req.headers.authorization;
  if (!raw || typeof raw !== 'string') return null;
  const m = /^Bearer\s+(\S+)$/i.exec(raw.trim());
  return m?.[1] ?? null;
}

export async function readTokenRequestParams(req: IncomingMessage): Promise<Record<string, string>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8').trim();
  if (!text) return {};
  const ct = (req.headers['content-type'] ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
  if (ct === 'application/x-www-form-urlencoded') {
    const params = new URLSearchParams(text);
    const out: Record<string, string> = {};
    params.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  const parsed: unknown = JSON.parse(text) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}
