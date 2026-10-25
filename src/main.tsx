import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { applyPrefs, usePrefs } from './state/theme';
import './styles/index.css';

const { theme, size, face } = usePrefs.getState();
applyPrefs({ theme, size, face });

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
