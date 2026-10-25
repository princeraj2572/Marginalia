export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

interface Soft {
  id: string;
  /** Soft-delete marker; null while the record is live. */
  deletedAt: number | null;
}

export interface ChangeEntry {
  at: number;
  summary: string;
  /** Previous values of the fields this change touched, used to undo it. */
  before: Partial<Article>;
}

export interface Article extends Soft {
  title: string;
  url: string;
  byline: string;
  siteName: string;
  savedAt: number;
  readAt: number | null;
  estimatedMinutes: number;
  wordCount: number;
  excerpt: string;
  /** Sanitised HTML only. */
  contentHtml: string;
  heroImage: string | null;
  /** Tag ids. */
  tags: string[];
  archived: boolean;
  favorite: boolean;
  history: ChangeEntry[];
}

export interface HighlightAnchor {
  /** Character offsets into the article's text content. */
  start: number;
  end: number;
  /** Text immediately around the range, to re-find it if the offsets drift. */
  prefix: string;
  suffix: string;
}

export interface Highlight extends Soft {
  articleId: string;
  text: string;
  color: HighlightColor;
  note: string;
  createdAt: number;
  position: HighlightAnchor;
}

export interface Tag extends Soft {
  name: string;
  color: string;
}

export interface ReadingSession extends Soft {
  articleId: string;
  startedAt: number;
  endedAt: number;
  /** 0..1 */
  scrollDepth: number;
}

export type NewArticle = Omit<Article, 'id' | 'deletedAt' | 'history'> &
  Partial<Pick<Article, 'id'>>;
