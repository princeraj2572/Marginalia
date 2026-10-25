import { db as defaultDb, type MarginaliaDB } from './db';
import type {
  Article,
  ChangeEntry,
  Highlight,
  HighlightAnchor,
  HighlightColor,
  NewArticle,
  ReadingSession,
  Tag,
} from './types';

const HISTORY_LIMIT = 20;
const uid = () => crypto.randomUUID();
const live = <T extends { deletedAt: number | null }>(r: T | undefined): r is T =>
  !!r && r.deletedAt === null;

export function createRepos(db: MarginaliaDB = defaultDb, now: () => number = Date.now) {
  const articles = {
    async add(input: NewArticle): Promise<Article> {
      const article: Article = { ...input, id: input.id ?? uid(), deletedAt: null, history: [] };
      await db.articles.add(article);
      return article;
    },
    async get(id: string) {
      const a = await db.articles.get(id);
      return live(a) ? a : undefined;
    },
    async list(): Promise<Article[]> {
      return (await db.articles.toArray()).filter(live);
    },
    /** Applies a patch and records the previous values so `undo` can revert it. */
    async update(id: string, patch: Partial<Omit<Article, 'id' | 'history'>>, summary = 'edited') {
      await db.transaction('rw', db.articles, async () => {
        const cur = await db.articles.get(id);
        if (!cur) return;
        const before: Partial<Article> = {};
        for (const k of Object.keys(patch) as (keyof Article)[]) {
          (before as Record<string, unknown>)[k] = cur[k];
        }
        const entry: ChangeEntry = { at: now(), summary, before };
        const history = [...cur.history, entry].slice(-HISTORY_LIMIT);
        await db.articles.put({ ...cur, ...patch, history });
      });
    },
    /** Reverts the most recent history entry. Returns false when there is nothing to undo. */
    async undo(id: string): Promise<boolean> {
      return db.transaction('rw', db.articles, async () => {
        const cur = await db.articles.get(id);
        const last = cur?.history.at(-1);
        if (!cur || !last) return false;
        await db.articles.put({ ...cur, ...last.before, history: cur.history.slice(0, -1) });
        return true;
      });
    },
    remove: (id: string) => articles.update(id, { deletedAt: now() }, 'deleted'),
    restore: (id: string) => articles.update(id, { deletedAt: null }, 'restored'),
    /** Permanent removal, only for "clear all data". */
    purge: (id: string) => db.articles.delete(id),
  };

  const highlights = {
    async add(input: {
      articleId: string;
      text: string;
      color: HighlightColor;
      note?: string;
      position: HighlightAnchor;
    }): Promise<Highlight> {
      const h: Highlight = {
        id: uid(),
        note: '',
        ...input,
        createdAt: now(),
        deletedAt: null,
      };
      await db.highlights.add(h);
      return h;
    },
    async listForArticle(articleId: string) {
      return (await db.highlights.where('articleId').equals(articleId).toArray())
        .filter(live)
        .sort((a, b) => a.position.start - b.position.start);
    },
    async list() {
      return (await db.highlights.toArray()).filter(live);
    },
    update: (id: string, patch: Partial<Pick<Highlight, 'color' | 'note'>>) =>
      db.highlights.update(id, patch),
    remove: (id: string) => db.highlights.update(id, { deletedAt: now() }),
    restore: (id: string) => db.highlights.update(id, { deletedAt: null }),
  };

  const tags = {
    async create(name: string, color: string): Promise<Tag> {
      const trimmed = name.trim();
      const existing = (await db.tags.toArray()).find(
        (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
      );
      if (existing) {
        if (existing.deletedAt !== null) await db.tags.update(existing.id, { deletedAt: null });
        return { ...existing, deletedAt: null };
      }
      const tag: Tag = { id: uid(), name: trimmed, color, deletedAt: null };
      await db.tags.add(tag);
      return tag;
    },
    async list() {
      return (await db.tags.toArray()).filter(live).sort((a, b) => a.name.localeCompare(b.name));
    },
    remove: (id: string) => db.tags.update(id, { deletedAt: now() }),
    restore: (id: string) => db.tags.update(id, { deletedAt: null }),
    /** Adds or removes a tag on an article, recorded in its history. */
    async toggleOn(articleId: string, tagId: string) {
      const a = await articles.get(articleId);
      if (!a) return;
      const has = a.tags.includes(tagId);
      await articles.update(
        articleId,
        { tags: has ? a.tags.filter((t) => t !== tagId) : [...a.tags, tagId] },
        has ? 'untagged' : 'tagged',
      );
    },
  };

  const sessions = {
    async add(input: Omit<ReadingSession, 'id' | 'deletedAt'>): Promise<ReadingSession> {
      const s: ReadingSession = { ...input, id: uid(), deletedAt: null };
      await db.sessions.add(s);
      return s;
    },
    async list() {
      return (await db.sessions.toArray()).filter(live);
    },
    async listForArticle(articleId: string) {
      return (await db.sessions.where('articleId').equals(articleId).toArray()).filter(live);
    },
  };

  async function clearAll() {
    await db.transaction('rw', [db.articles, db.highlights, db.tags, db.sessions], async () => {
      await Promise.all([
        db.articles.clear(),
        db.highlights.clear(),
        db.tags.clear(),
        db.sessions.clear(),
      ]);
    });
  }

  return { articles, highlights, tags, sessions, clearAll };
}

export type Repos = ReturnType<typeof createRepos>;
export const repos = createRepos();
