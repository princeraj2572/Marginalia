import Dexie, { type EntityTable } from 'dexie';
import type { Article, Highlight, ReadingSession, Tag } from './types';

export class MarginaliaDB extends Dexie {
  articles!: EntityTable<Article, 'id'>;
  highlights!: EntityTable<Highlight, 'id'>;
  tags!: EntityTable<Tag, 'id'>;
  sessions!: EntityTable<ReadingSession, 'id'>;

  constructor(name = 'marginalia') {
    super(name);
    this.version(1).stores({
      articles: 'id, savedAt, readAt, archived, favorite, siteName, deletedAt, *tags',
      highlights: 'id, articleId, color, createdAt, deletedAt',
      tags: 'id, &name, deletedAt',
      sessions: 'id, articleId, startedAt, deletedAt',
    });
  }
}

export const db = new MarginaliaDB();
