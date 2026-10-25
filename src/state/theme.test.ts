import { beforeEach, describe, expect, it } from 'vitest';
import { usePrefs } from './theme';

beforeEach(() => localStorage.clear());

describe('prefs store', () => {
  it('applies theme, size and face to the document and persists them', () => {
    usePrefs.getState().set({ theme: 'sepia', size: 'lg', face: 'sans' });
    const root = document.documentElement;
    expect(root.dataset.theme).toBe('sepia');
    expect(root.dataset.face).toBe('sans');
    expect(root.style.getPropertyValue('--reader-size')).toBe('1.375rem');
    expect(JSON.parse(localStorage.getItem('marginalia:prefs') ?? '{}')).toMatchObject({
      theme: 'sepia',
      size: 'lg',
    });
  });
});
