import { repos as defaultRepos, type Repos } from '../data/repos';
import { extractArticle } from './extract';

// Loaded lazily so the sample HTML never lands in the main bundle.
const samples = import.meta.glob('../../fixtures/*.html', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

const DAY = 86_400_000;

/** Saves the bundled sample articles, skipping any already present. Returns how many were added. */
export async function loadSamples(repos: Repos = defaultRepos, now = Date.now()): Promise<number> {
  const existing = new Set((await repos.articles.list()).map((a) => a.url));
  let added = 0;
  let i = 0;
  for (const [path, load] of Object.entries(samples).sort(([a], [b]) => a.localeCompare(b))) {
    const url = `https://samples.marginalia.test/${path.split('/').pop()}`;
    i++;
    if (existing.has(url)) continue;
    const article = extractArticle(await load(), url, now - i * 2 * DAY);
    await repos.articles.add(article);
    added++;
  }
  return added;
}
