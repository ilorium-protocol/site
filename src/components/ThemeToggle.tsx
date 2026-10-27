import { useEffect, useState } from 'react';

type Mode = 'light' | 'dark';

function current(): Mode {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode | null>(null);
  useEffect(() => setMode(current()), []);
  const next: Mode = mode === 'light' ? 'dark' : 'light';
  return (
    <button
      type="button"
      className="themeb lab"
      aria-label={mode ? `Switch to ${next} mode` : 'Switch color mode'}
      onClick={() => {
        document.documentElement.setAttribute('data-theme', next);
        try {
          localStorage.setItem('ilorium-theme', next);
        } catch {}
        setMode(next);
      }}
    >
      {mode ? (next === 'light' ? 'Light mode' : 'Dark mode') : 'Theme'}
    </button>
  );
}
