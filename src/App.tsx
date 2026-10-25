import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

const Design = lazy(() => import('./pages/Design'));

function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-serif text-4xl">Marginalia</h1>
      <p className="mt-3 text-muted">
        Library arrives in the next stage. See the{' '}
        <Link className="text-accent underline" to="/design">
          design system
        </Link>
        .
      </p>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<p className="p-8 text-muted">Loading…</p>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/design" element={<Design />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
