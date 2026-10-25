import { Readability } from '@mozilla/readability';
import type { NewArticle } from '../data/types';
import { sanitizeHtml } from './sanitize';

const WORDS_PER_MINUTE = 230;

export class ExtractionError extends Error {}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Turns a full HTML page into a storable article. Throws ExtractionError if no content is found. */
export function extractArticle(html: string, url: string, savedAt = Date.now()): NewArticle {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Give Readability a base so relative links and images resolve against the source page.
  if (url && !doc.querySelector('base')) {
    const base = doc.createElement('base');
    base.href = url;
    doc.head.prepend(base);
  }
  const parsed = new Readability(doc, { keepClasses: false }).parse();
  if (!parsed?.content) throw new ExtractionError('No readable article found in this HTML.');

  const contentHtml = sanitizeHtml(parsed.content);
  const text = (parsed.textContent ?? '').replace(/\s+/g, ' ').trim();
  const wordCount = text ? text.split(' ').length : 0;
  const hero = new DOMParser().parseFromString(contentHtml, 'text/html').querySelector('img');

  return {
    title: (parsed.title || doc.title || 'Untitled').trim(),
    url,
    byline: (parsed.byline ?? '').trim(),
    siteName: (parsed.siteName ?? '').trim() || hostOf(url),
    savedAt,
    readAt: null,
    estimatedMinutes: Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE)),
    wordCount,
    excerpt: (parsed.excerpt ?? text.slice(0, 200)).trim(),
    contentHtml,
    heroImage: hero?.getAttribute('src') ?? null,
    tags: [],
    archived: false,
    favorite: false,
  };
}
