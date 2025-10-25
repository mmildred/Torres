// Lee el tema guardado o usa "auto"
export function getSavedTheme() {
  return localStorage.getItem('theme') || 'auto'; // 'light' | 'dark' | 'auto'
}

// Aplica el tema al <html data-theme="...">
export function applyTheme(mode) {
  const root = document.documentElement;
  let finalMode = mode;

  if (mode === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    finalMode = prefersDark ? 'dark' : 'light';
  }

  root.setAttribute('data-theme', finalMode);
  // guarda la elección del usuario
  localStorage.setItem('theme', mode);
}

// Observa cambios del sistema cuando estás en "auto"
export function watchSystemTheme(onChange) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => onChange();
  mq.addEventListener?.('change', handler);
  return () => mq.removeEventListener?.('change', handler);
}
