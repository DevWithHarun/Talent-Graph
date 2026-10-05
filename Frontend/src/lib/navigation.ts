/**
 * Drop-in replacement for next/navigation hooks.
 * Re-exports wouter equivalents so files importing from next/navigation
 * can be retargeted to this module without per-file changes.
 */
import { useMemo } from 'react';
import { useLocation, useParams as wouterUseParams } from 'wouter';

export function useRouter() {
  const [, navigate] = useLocation();
  return useMemo(() => ({
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    refresh: () => window.location.reload(),
    prefetch: (_href: string) => {},
  }), [navigate]);
}

export function usePathname() {
  const [pathname] = useLocation();
  return pathname;
}

/** Returns a live URLSearchParams object backed by window.location.search */
export function useSearchParams() {
  return new URLSearchParams(window.location.search);
}

export function useParams<T extends Record<string, string>>() {
  return wouterUseParams<T>();
}

/** Navigates imperatively. Use useRouter().replace() inside components. */
export function redirect(href: string) {
  if (typeof window !== 'undefined') {
    window.location.href = href;
  }
}

export function notFound() {
  // no-op in client-side Vite context
}
