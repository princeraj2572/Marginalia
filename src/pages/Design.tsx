import { useState } from 'react';
import { BarPair, Heatmap, Sparkline } from '../charts/primitives';
import { Badge, Button, Card, EmptyState, Input, Skeleton } from '../components/ui';
import { usePrefs, type Theme, type TypeSize, type Typeface } from '../state/theme';

const swatches = [
  ['bg', 'Page'],
  ['surface', 'Surface'],
  ['surface-2', 'Surface 2'],
  ['border', 'Border'],
  ['text', 'Text'],
  ['text-muted', 'Muted'],
  ['accent', 'Accent'],
] as const;

const scale = [
  ['text-xs', 'Caption'],
  ['text-sm', 'Metadata'],
  ['text-base', 'Interface'],
  ['text-lg', 'Lead'],
  ['text-xl', 'Heading 3'],
  ['text-2xl', 'Heading 2'],
  ['text-3xl', 'Heading 1'],
] as const;

const heat = Array.from({ length: 7 }, (_, w) =>
  Array.from({ length: 7 }, (_, d) => ((w * 3 + d * 5) % 11) * (w > 1 ? 3 : 0)),
);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border py-8">
      <h2 className="font-serif text-2xl">{title}</h2>
      {children}
    </section>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {options.map((o) => (
        <Button
          key={o}
          role="radio"
          aria-checked={value === o}
          variant={value === o ? 'primary' : 'secondary'}
          onClick={() => onChange(o)}
        >
          {o}
        </Button>
      ))}
    </div>
  );
}

export default function Design() {
  const { theme, size, face, set } = usePrefs();
  const [name, setName] = useState('');
  return (
    <main className="mx-auto max-w-4xl px-4 pb-24 pt-8">
      <header className="mb-6 flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">Design system</p>
        <h1 className="font-serif text-4xl leading-tight">Marginalia</h1>
        <p className="max-w-prose text-lg text-muted">
          Calm, bookish and confident: warm paper, deep charcoal, one restrained accent.
        </p>
        <div className="flex flex-wrap gap-4">
          <Segmented<Theme>
            label="Theme"
            value={theme}
            options={['light', 'sepia', 'dark']}
            onChange={(v) => set({ theme: v })}
          />
          <Segmented<TypeSize>
            label="Type size"
            value={size}
            options={['sm', 'md', 'lg']}
            onChange={(v) => set({ size: v })}
          />
          <Segmented<Typeface>
            label="Typeface"
            value={face}
            options={['serif', 'sans']}
            onChange={(v) => set({ face: v })}
          />
        </div>
      </header>

      <Section title="Colour tokens">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {swatches.map(([v, label]) => (
            <li key={v} className="flex flex-col gap-1.5 text-sm">
              <span
                className="h-14 rounded-md border border-border"
                style={{ background: `var(--${v})` }}
              />
              <span>{label}</span>
              <code className="text-xs text-muted">--{v}</code>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2" aria-label="Highlight colours" role="group">
          {(['yellow', 'green', 'blue', 'pink'] as const).map((c) => (
            <span
              key={c}
              className="rounded px-3 py-1 text-sm text-ink"
              style={{ background: `var(--hl-${c})` }}
            >
              {c}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Type scale">
        <p className="text-sm text-muted">Serif for reading, sans for interface and metadata.</p>
        {scale.map(([v, label]) => (
          <p key={v} className="font-serif" style={{ fontSize: `var(--${v})` }}>
            {label} <span className="font-sans text-xs text-muted">{v}</span>
          </p>
        ))}
        <p className="num text-sm text-muted">
          Tabular numerals: 1,111 · 2,222 · 0:42 · 12 Oct 2026
        </p>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Save article</Button>
          <Button>Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Clear all data</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Inputs">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="d-name"
            label="Tag name"
            placeholder="e.g. essays"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input id="d-url" label="Article URL" placeholder="https://" />
        </div>
      </Section>

      <Section title="Cards and states">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <div className="flex flex-col gap-2">
              <h3 className="font-serif text-xl leading-snug">In Praise of Slow Reading</h3>
              <p className="text-sm text-muted">The Lantern Review · Mira Okafor</p>
              <p className="num text-sm text-muted">6 min · saved 3 Oct</p>
              <div className="flex gap-2">
                <Badge color="var(--accent)">essays</Badge>
                <Badge>unread</Badge>
              </div>
            </div>
          </Card>
          <Card aria-busy="true" aria-label="Loading article">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </Card>
        </div>
        <EmptyState
          title="Nothing saved yet"
          body="Save your first article with the bookmarklet, or paste some HTML to get going."
          action={<Button variant="primary">Add an article</Button>}
        />
        <p role="alert" className="rounded-md border border-accent p-3 text-sm">
          Couldn't read that page. <button className="underline">Retry</button>
        </p>
      </Section>

      <Section title="Reader sample">
        <article
          className="rounded-lg bg-surface p-6"
          style={{
            fontFamily: face === 'serif' ? 'var(--font-serif)' : 'var(--font-sans)',
            fontSize: 'var(--reader-size)',
            lineHeight: 'var(--leading-body)',
          }}
        >
          <h3 className="mb-2 text-3xl leading-tight">A quiet sentence, well set</h3>
          <p className="mb-4 text-sm text-muted" style={{ fontFamily: 'var(--font-sans)' }}>
            By Mira Okafor · 6 min read
          </p>
          <p style={{ maxWidth: 'var(--measure)' }}>
            There is a particular kind of attention that only arrives after the first ten minutes
            with a book. The restlessness fades, the sentences begin to carry weight, and the room
            around you recedes.
          </p>
          <blockquote className="my-4 border-l-4 border-accent pl-4 italic">
            A book is a slow machine for changing a mind.
          </blockquote>
          <p>
            Highlighted passages look{' '}
            <mark style={{ background: 'var(--hl-yellow)', color: 'var(--text)' }}>like this</mark>.
          </p>
        </article>
      </Section>

      <Section title="Chart primitives">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-muted">Sparkline</p>
            <Sparkline label="Reading minutes per day" values={[4, 12, 0, 22, 18, 30, 25]} />
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">Heatmap</p>
            <Heatmap label="Reading minutes, last seven weeks" grid={heat} />
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">Saved vs read</p>
            <BarPair a={9} b={5} labelA="Saved" labelB="Read" />
          </div>
        </div>
      </Section>
    </main>
  );
}
