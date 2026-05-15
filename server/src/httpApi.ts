import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { Category, Player, Question } from './types.js';
import {
  defaultJeopardyQuestions,
  editCategories,
  readCategoriesRoot,
  readPlayers,
  writePlayers,
  withPlayersLock,
} from './store.js';

const JSON_TYPE = 'application/json; charset=utf-8';

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', JSON_TYPE);
  res.end(JSON.stringify(body));
}

function setCors(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export async function parseJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8').trim();
  if (!text) return undefined;
  return JSON.parse(text) as unknown;
}

function notFound(res: ServerResponse, message = 'Not found'): void {
  sendJson(res, 404, { error: message });
}

function badRequest(res: ServerResponse, message: string): void {
  sendJson(res, 400, { error: message });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function coercePlayerPatch(body: unknown): Partial<Player> {
  if (!isRecord(body)) return {};
  const next: Partial<Player> = {};
  if (typeof body.name === 'string') next.name = body.name;
  if (typeof body.score === 'number' && Number.isFinite(body.score)) next.score = body.score;
  if (typeof body.isSelected === 'boolean') next.isSelected = body.isSelected;
  return next;
}

function coercePlayerCreate(body: unknown): Omit<Player, 'id'> & { id?: string } {
  if (!isRecord(body) || typeof body.name !== 'string' || !body.name.trim()) {
    throw new Error('name is required');
  }
  const score = typeof body.score === 'number' && Number.isFinite(body.score) ? body.score : 0;
  const isSelected =
    typeof body.isSelected === 'boolean' ? body.isSelected : false;
  const id = typeof body.id === 'string' && body.id.trim() ? body.id : undefined;
  return { id, name: body.name.trim(), score, isSelected };
}

function isQuestion(value: unknown): value is Question {
  if (!isRecord(value)) return false;
  if (typeof value.price !== 'number' || !Number.isFinite(value.price)) return false;
  if (typeof value.question !== 'string' || typeof value.answer !== 'string') return false;
  if (value.image !== undefined && typeof value.image !== 'string') return false;
  if (value.isAnswered !== undefined && typeof value.isAnswered !== 'boolean') return false;
  return true;
}

function isCategory(value: unknown): value is Category {
  if (!isRecord(value) || typeof value.title !== 'string') return false;
  if (!Array.isArray(value.questions)) return false;
  return value.questions.every(isQuestion);
}

type RouteMatch = {
  name: string;
  params: Record<string, string>;
};

function matchRoute(
  method: string,
  pathname: string,
  pattern: string,
): RouteMatch | null {
  const [pMethod, path] = pattern.split(' ', 2);
  if (pMethod !== method) return null;
  const pSegs = path.split('/').filter(Boolean);
  const sSegs = pathname.split('/').filter(Boolean);
  if (pSegs.length !== sSegs.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pSegs.length; i++) {
    const p = pSegs[i];
    const s = sSegs[i];
    if (p && p.startsWith(':') && s !== undefined) {
      params[p.slice(1)] = s;
    } else if (p !== s) {
      return null;
    }
  }
  return { name: pattern, params };
}

export async function handleHttpApi(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  if (!req.url || !req.method) return false;
  const host = `http://${req.headers.host ?? 'localhost'}`;
  let pathname: string;
  try {
    pathname = new URL(req.url, host).pathname;
  } catch {
    return false;
  }

  if (!pathname.startsWith('/api')) return false;

  setCors(res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }

  try {
    // --- Players ---
    let m = matchRoute(req.method, pathname, 'GET /api/players');
    if (m) {
      const players = await readPlayers();
      sendJson(res, 200, players);
      return true;
    }

    m = matchRoute(req.method, pathname, 'GET /api/players/:id');
    if (m) {
      const id = m.params.id;
      const players = await readPlayers();
      const player = players.find((p) => p.id === id);
      if (!player) {
        notFound(res, 'Player not found');
        return true;
      }
      sendJson(res, 200, player);
      return true;
    }

    m = matchRoute(req.method, pathname, 'POST /api/players');
    if (m) {
      const body = await parseJsonBody(req);
      let data: ReturnType<typeof coercePlayerCreate>;
      try {
        data = coercePlayerCreate(body);
      } catch (e) {
        badRequest(res, e instanceof Error ? e.message : 'Invalid body');
        return true;
      }
      const player: Player = {
        id: data.id ?? randomUUID(),
        name: data.name,
        score: data.score,
        isSelected: data.isSelected,
      };
      try {
        await withPlayersLock(async (list) => {
          if (list.some((p) => p.id === player.id)) throw new Error('__DUP_ID__');
          await writePlayers([...list, player]);
        });
      } catch (e) {
        if (e instanceof Error && e.message === '__DUP_ID__') {
          badRequest(res, 'Player id already exists');
          return true;
        }
        throw e;
      }
      sendJson(res, 201, player);
      return true;
    }

    m = matchRoute(req.method, pathname, 'PUT /api/players/:id');
    if (m) {
      const id = m.params.id;
      const body = await parseJsonBody(req);
      if (!isRecord(body)) {
        badRequest(res, 'Expected JSON object');
        return true;
      }
      const incoming = { ...body, id } as unknown;
      if (!isRecord(incoming) || typeof incoming.name !== 'string') {
        badRequest(res, 'Invalid player');
        return true;
      }
      const score =
        typeof incoming.score === 'number' && Number.isFinite(incoming.score)
          ? incoming.score
          : 0;
      const isSelected =
        typeof incoming.isSelected === 'boolean' ? incoming.isSelected : false;
      const updated: Player = {
        id,
        name: incoming.name,
        score,
        isSelected,
      };
      const result = await withPlayersLock(async (list) => {
        const idx = list.findIndex((p) => p.id === id);
        if (idx === -1) return null;
        const next = [...list];
        next[idx] = updated;
        await writePlayers(next);
        return updated;
      });
      if (result === null) {
        notFound(res, 'Player not found');
        return true;
      }
      sendJson(res, 200, result);
      return true;
    }

    m = matchRoute(req.method, pathname, 'PATCH /api/players/:id');
    if (m) {
      const id = m.params.id;
      const body = await parseJsonBody(req);
      let updated: Player | null = null;
      await withPlayersLock(async (list) => {
        const idx = list.findIndex((p) => p.id === id);
        if (idx === -1) return;
        const existing = list[idx];
        const patch = coercePlayerPatch(body);
        updated = { ...existing, ...patch };
        const next = [...list];
        next[idx] = updated;
        await writePlayers(next);
      });
      if (!updated) {
        notFound(res, 'Player not found');
        return true;
      }
      sendJson(res, 200, updated);
      return true;
    }

    m = matchRoute(req.method, pathname, 'DELETE /api/players/:id');
    if (m) {
      const id = m.params.id;
      let removed = false;
      await withPlayersLock(async (list) => {
        const next = list.filter((p) => p.id !== id);
        removed = next.length !== list.length;
        if (removed) await writePlayers(next);
      });
      if (!removed) {
        notFound(res, 'Player not found');
        return true;
      }
      res.statusCode = 204;
      res.end();
      return true;
    }

    // --- Categories ---
    m = matchRoute(req.method, pathname, 'GET /api/categories');
    if (m) {
      const root = await readCategoriesRoot();
      sendJson(res, 200, root.categories);
      return true;
    }

    m = matchRoute(req.method, pathname, 'GET /api/categories/:index');
    if (m) {
      const index = Number(m.params.index);
      if (!Number.isInteger(index) || index < 0) {
        badRequest(res, 'Invalid category index');
        return true;
      }
      const root = await readCategoriesRoot();
      const cat = root.categories[index];
      if (!cat) {
        notFound(res, 'Category not found');
        return true;
      }
      sendJson(res, 200, cat);
      return true;
    }

    m = matchRoute(req.method, pathname, 'POST /api/categories');
    if (m) {
      const body = await parseJsonBody(req);
      const partial = isRecord(body) ? body : {};
      const title =
        typeof partial.title === 'string' && partial.title.trim()
          ? partial.title.trim()
          : null;
      const questions =
        Array.isArray(partial.questions) && partial.questions.every(isQuestion)
          ? (partial.questions as Question[])
          : null;

      const newCategory = await editCategories(async (root) => {
        const cat: Category = {
          title: title ?? `Category ${root.categories.length + 1}`,
          questions: questions ?? defaultJeopardyQuestions(),
        };
        root.categories.push(cat);
        return cat;
      });
      sendJson(res, 201, newCategory);
      return true;
    }

    m = matchRoute(req.method, pathname, 'PUT /api/categories/:index');
    if (m) {
      const index = Number(m.params.index);
      if (!Number.isInteger(index) || index < 0) {
        badRequest(res, 'Invalid category index');
        return true;
      }
      const body = await parseJsonBody(req);
      if (!isCategory(body)) {
        badRequest(res, 'Body must be a full Category { title, questions[] }');
        return true;
      }
      try {
        await editCategories(async (root) => {
          if (!root.categories[index]) throw new Error('__NOT_FOUND__');
          root.categories[index] = body;
        });
      } catch (e) {
        if (e instanceof Error && e.message === '__NOT_FOUND__') {
          notFound(res, 'Category not found');
          return true;
        }
        throw e;
      }
      sendJson(res, 200, body);
      return true;
    }

    m = matchRoute(req.method, pathname, 'PATCH /api/categories/:index');
    if (m) {
      const index = Number(m.params.index);
      if (!Number.isInteger(index) || index < 0) {
        badRequest(res, 'Invalid category index');
        return true;
      }
      const body = await parseJsonBody(req);
      if (!isRecord(body)) {
        badRequest(res, 'Expected JSON object');
        return true;
      }
      let merged: Category | null = null;
      try {
        merged = await editCategories(async (root) => {
          const existing = root.categories[index];
          if (!existing) throw new Error('__NOT_FOUND__');
          let title = existing.title;
          if (typeof body.title === 'string') title = body.title;
          let questions = existing.questions;
          if (Array.isArray(body.questions) && body.questions.every(isQuestion)) {
            questions = body.questions as Question[];
          }
          const out: Category = { title, questions };
          root.categories[index] = out;
          return out;
        });
      } catch (e) {
        if (e instanceof Error && e.message === '__NOT_FOUND__') {
          notFound(res, 'Category not found');
          return true;
        }
        throw e;
      }
      sendJson(res, 200, merged);
      return true;
    }

    m = matchRoute(req.method, pathname, 'DELETE /api/categories/:index');
    if (m) {
      const index = Number(m.params.index);
      if (!Number.isInteger(index) || index < 0) {
        badRequest(res, 'Invalid category index');
        return true;
      }
      let removed: Category | null = null;
      try {
        removed = await editCategories(async (root) => {
          if (!root.categories[index]) throw new Error('__NOT_FOUND__');
          const [r] = root.categories.splice(index, 1);
          return r ?? null;
        });
      } catch (e) {
        if (e instanceof Error && e.message === '__NOT_FOUND__') {
          notFound(res, 'Category not found');
          return true;
        }
        throw e;
      }
      if (!removed) {
        notFound(res, 'Category not found');
        return true;
      }
      sendJson(res, 200, removed);
      return true;
    }

    m = matchRoute(req.method, pathname, 'PATCH /api/categories/:index/questions/:price');
    if (m) {
      const index = Number(m.params.index);
      const price = Number(m.params.price);
      if (!Number.isInteger(index) || index < 0 || !Number.isFinite(price)) {
        badRequest(res, 'Invalid category index or price');
        return true;
      }
      const body = await parseJsonBody(req);
      if (!isRecord(body)) {
        badRequest(res, 'Expected JSON object');
        return true;
      }
      let base: Question | null = null;
      try {
        base = await editCategories(async (root) => {
          const cat = root.categories[index];
          if (!cat) throw new Error('__NOT_FOUND__');
          const qIdx = cat.questions.findIndex((q) => q.price === price);
          const q: Question =
            qIdx === -1
              ? { price, question: '', answer: '', isAnswered: false }
              : { ...cat.questions[qIdx] };
          if (typeof body.question === 'string') q.question = body.question;
          if (typeof body.answer === 'string') q.answer = body.answer;
          if (typeof body.image === 'string') q.image = body.image;
          if (body.image === null) delete q.image;
          if (typeof body.isAnswered === 'boolean') q.isAnswered = body.isAnswered;
          const questions = [...cat.questions];
          if (qIdx === -1) questions.push(q);
          else questions[qIdx] = q;
          root.categories[index] = { ...cat, questions };
          return q;
        });
      } catch (e) {
        if (e instanceof Error && e.message === '__NOT_FOUND__') {
          notFound(res, 'Category not found');
          return true;
        }
        throw e;
      }
      sendJson(res, 200, base);
      return true;
    }

    m = matchRoute(req.method, pathname, 'GET /api/health');
    if (m) {
      sendJson(res, 200, { ok: true });
      return true;
    }

    notFound(res, 'Unknown API route');
    return true;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal error';
    sendJson(res, 500, { error: message });
    return true;
  }
}
