import { beforeEach, describe, expect, it } from 'vitest';
import { MarginaliaDB } from './db';
import { createRepos, type Repos } from './repos';
import type { NewArticle } from './types';

const base = (over: Partial<NewArticle> = {}): NewArticle => ({
  title: 'A title',
  url: 'https://example.test/a',
  byline: 'Ada',
  siteName: 'example.test',
  savedAt: 1000,
  readAt: null,
  estimatedMinutes: 4,
  wordCount: 900,
  excerpt: 'x',
  contentHtml: '<p>x</p>',
  heroImage: null,
  tags: [],
  archived: false,
  favorite: false,
  ...over,
});

let repos: Repos;
let clock = 5000;
beforeEach(() => {
  clock = 5000;
  repos = createRepos(new MarginaliaDB(`t-${crypto.randomUUID()}`), () => clock++);
});

describe('articles', () => {
  it('adds, gets and lists live articles', async () => {
    const a = await repos.articles.add(base());
    expect(await repos.articles.get(a.id)).toMatchObject({ title: 'A title', deletedAt: null });
    expect(await repos.articles.list()).toHaveLength(1);
  });

  it('soft-deletes and restores without losing data', async () => {
    const a = await repos.articles.add(base());
    await repos.articles.remove(a.id);
    expect(await repos.articles.get(a.id)).toBeUndefined();
    expect(await repos.articles.list()).toHaveLength(0);
    await repos.articles.restore(a.id);
    expect((await repos.articles.get(a.id))?.title).toBe('A title');
  });

  it('records history and undoes the last change', async () => {
    const a = await repos.articles.add(base());
    await repos.articles.update(a.id, { favorite: true }, 'starred');
    await repos.articles.update(a.id, { archived: true }, 'archived');
    expect((await repos.articles.get(a.id))?.history.map((h) => h.summary)).toEqual([
      'starred',
      'archived',
    ]);
    expect(await repos.articles.undo(a.id)).toBe(true);
    const after = await repos.articles.get(a.id);
    expect(after).toMatchObject({ favorite: true, archived: false });
    expect(after?.history).toHaveLength(1);
  });

  it('undoes a soft delete', async () => {
    const a = await repos.articles.add(base());
    await repos.articles.remove(a.id);
    expect(await repos.articles.undo(a.id)).toBe(true);
    expect(await repos.articles.get(a.id)).toBeDefined();
  });

  it('returns false when there is nothing to undo', async () => {
    const a = await repos.articles.add(base());
    expect(await repos.articles.undo(a.id)).toBe(false);
  });

  it('keeps only the most recent 20 history entries', async () => {
    const a = await repos.articles.add(base());
    for (let i = 0; i < 25; i++) await repos.articles.update(a.id, { wordCount: i }, `e${i}`);
    const h = (await repos.articles.get(a.id))?.history ?? [];
    expect(h).toHaveLength(20);
    expect(h.at(-1)?.summary).toBe('e24');
  });
});

describe('highlights', () => {
  it('stores highlights ordered by position and soft-deletes them', async () => {
    const a = await repos.articles.add(base());
    const pos = (start: number) => ({ start, end: start + 3, prefix: '', suffix: '' });
    const late = await repos.highlights.add({
      articleId: a.id,
      text: 'bbb',
      color: 'blue',
      position: pos(40),
    });
    await repos.highlights.add({
      articleId: a.id,
      text: 'aaa',
      color: 'yellow',
      position: pos(5),
    });
    expect((await repos.highlights.listForArticle(a.id)).map((h) => h.text)).toEqual([
      'aaa',
      'bbb',
    ]);
    await repos.highlights.remove(late.id);
    expect(await repos.highlights.listForArticle(a.id)).toHaveLength(1);
    await repos.highlights.restore(late.id);
    expect(await repos.highlights.listForArticle(a.id)).toHaveLength(2);
  });
});

describe('tags', () => {
  it('creates case-insensitively unique tags and revives deleted ones', async () => {
    const t = await repos.tags.create('Design', '#aa3300');
    const again = await repos.tags.create(' design ', '#000000');
    expect(again.id).toBe(t.id);
    await repos.tags.remove(t.id);
    expect(await repos.tags.list()).toHaveLength(0);
    await repos.tags.create('design', '#aa3300');
    expect(await repos.tags.list()).toHaveLength(1);
  });

  it('toggles a tag on an article and logs it', async () => {
    const t = await repos.tags.create('Essays', '#336699');
    const a = await repos.articles.add(base());
    await repos.tags.toggleOn(a.id, t.id);
    expect((await repos.articles.get(a.id))?.tags).toEqual([t.id]);
    await repos.tags.toggleOn(a.id, t.id);
    const after = await repos.articles.get(a.id);
    expect(after?.tags).toEqual([]);
    expect(after?.history.map((h) => h.summary)).toEqual(['tagged', 'untagged']);
  });
});

describe('sessions and clearAll', () => {
  it('stores sessions and wipes everything on clearAll', async () => {
    const a = await repos.articles.add(base());
    await repos.sessions.add({ articleId: a.id, startedAt: 1, endedAt: 61_001, scrollDepth: 0.5 });
    expect(await repos.sessions.listForArticle(a.id)).toHaveLength(1);
    await repos.clearAll();
    expect(await repos.articles.list()).toHaveLength(0);
    expect(await repos.sessions.list()).toHaveLength(0);
  });
});
