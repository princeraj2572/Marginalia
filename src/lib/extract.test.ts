import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ExtractionError, extractArticle } from './extract';
import { sanitizeHtml } from './sanitize';

const dir = join(process.cwd(), 'fixtures');
const files = readdirSync(dir).filter((f) => f.endsWith('.html'));
const load = (f: string) => readFileSync(join(dir, f), 'utf8');

describe('extractArticle on bundled fixtures', () => {
  it('ships five fixtures', () => expect(files).toHaveLength(5));

  it.each(files)('%s yields a clean, readable article', (f) => {
    const a = extractArticle(load(f), `https://example.test/${f}`, 1);
    expect(a.title.length).toBeGreaterThan(5);
    expect(a.wordCount).toBeGreaterThan(120);
    expect(a.estimatedMinutes).toBeGreaterThanOrEqual(1);
    expect(a.siteName).not.toBe('');
    expect(a.contentHtml).not.toMatch(/<script|onerror=|javascript:/i);
    expect(a.contentHtml).not.toContain('evil.example');
  });

  it('pulls byline and site name from metadata', () => {
    const a = extractArticle(load('slow-reading.html'), 'https://lantern.test/x', 1);
    expect(a.title).toBe('In Praise of Slow Reading');
    expect(a.byline).toContain('Mira Okafor');
    expect(a.siteName).toBe('The Lantern Review');
  });

  it('keeps code blocks, figures and captions', () => {
    const a = extractArticle(load('typeset-the-web.html'), 'https://folio.test/x', 1);
    expect(a.contentHtml).toContain('<pre');
    expect(a.contentHtml).toContain('<figcaption');
    expect(a.heroImage).toMatch(/^data:image\/svg/);
  });

  it('rejects pages with no article', () => {
    expect(() => extractArticle('<html><body></body></html>', 'https://x.test')).toThrow(
      ExtractionError,
    );
  });
});

describe('sanitizeHtml', () => {
  it('strips scripts, handlers and non-allowlisted iframes; keeps youtube', () => {
    const out = sanitizeHtml(
      '<p onclick="x()">a</p><script>1</script>' +
        '<iframe src="https://evil.example/"></iframe>' +
        '<iframe src="https://www.youtube.com/embed/abc"></iframe>' +
        '<img src="https://img.test/a.png" onerror="x()">',
    );
    expect(out).not.toMatch(/script|onclick|onerror|evil\.example/);
    expect(out).toContain('youtube.com/embed/abc');
    expect(out).toContain('loading="lazy"');
    expect(out).toContain('referrerpolicy="no-referrer"');
  });
});
