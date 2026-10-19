// Minimal hash-based router (D-012).
// Routes live after "#" (e.g. "#/sales/cockpit"), so the app works on IIS without
// URL Rewrite and when opened directly from a network drive (file://).
import { useEffect, useState } from 'react';

/** Current route path without the leading "#", e.g. "/sales/cockpit". Defaults to "/". */
export function currentPath(): string {
  return window.location.hash.replace(/^#/, '') || '/';
}

/** React hook that re-renders when the hash changes. */
export function useHashPath(): string {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const onChange = () => setPath(currentPath());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}

/** Builds an href for a route, e.g. href('/sales/cockpit') → '#/sales/cockpit'. */
export const href = (path: string) => `#${path}`;
