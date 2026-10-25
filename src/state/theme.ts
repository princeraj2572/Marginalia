import { create } from 'zustand';

export type Theme = 'light' | 'sepia' | 'dark';
export type TypeSize = 'sm' | 'md' | 'lg';
export type Typeface = 'serif' | 'sans';

interface Prefs {
  theme: Theme;
  size: TypeSize;
  face: Typeface;
  set: (p: Partial<Omit<Prefs, 'set'>>) => void;
}

const KEY = 'marginalia:prefs';
const SIZES: Record<TypeSize, string> = { sm: '1.0625rem', md: '1.1875rem', lg: '1.375rem' };

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function load(): Pick<Prefs, 'theme' | 'size' | 'face'> {
  const fallback = { theme: systemTheme(), size: 'md' as TypeSize, face: 'serif' as Typeface };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return fallback;
  }
}

export function applyPrefs({ theme, size, face }: Pick<Prefs, 'theme' | 'size' | 'face'>) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.setProperty('--reader-size', SIZES[size]);
  root.dataset.face = face;
}

export const usePrefs = create<Prefs>((set, get) => ({
  ...load(),
  set: (p) => {
    set(p);
    const { theme, size, face } = get();
    applyPrefs({ theme, size, face });
    try {
      localStorage.setItem(KEY, JSON.stringify({ theme, size, face }));
    } catch {
      /* private mode: preferences just won't persist */
    }
  },
}));
