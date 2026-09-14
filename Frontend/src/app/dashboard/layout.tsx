'use client';

import { Link } from 'wouter';
import {
  Home, PlusCircle, X,
  Trophy, Shield, ShieldCheck, GitGraph, Settings2,
  Layers, Headphones, LogOut, ChevronRight, BarChart3, Heart, Users, Plus,
} from 'lucide-react';
import { usePathname, useRouter } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { SupportDialog } from '@/components/support/support-dialog';
import { DashboardErrorBoundary } from '@/components/coach/dashboard-error-boundary';

const bottomNavItems = [
  { href: '/?tab=home', tab: 'home', label: 'Home', icon: Home },
  { href: '/?tab=matches', tab: 'matches', label: 'Matches', icon: BarChart3 },
  { href: '/?tab=health', tab: 'health', label: 'Health', icon: Heart },
  { href: '/?tab=network', tab: 'network', label: 'Network', icon: Users },
];

const moreNavItems = [
  { href: '/dashboard/add-match', label: 'Log a Match', icon: PlusCircle },
  { href: '/dashboard/achievements', label: 'Achievements', icon: Trophy },
  { href: '/dashboard/injury-tracker', label: 'Injury Tracker', icon: Shield },
  { href: '/dashboard/verify', label: 'Verify Profile', icon: ShieldCheck },
  { href: '/dashboard/update-attributes', label: 'Refine Attributes', icon: GitGraph },
  { href: '/onboarding/metrics', label: 'Update Master Index', icon: Layers },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings2 },
];

export default function AthleteDashboardLayout({ children }: { children: React.ReactNode }) {
  const loc = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('bottom-sheet-open', moreOpen);
    return () => document.body.classList.remove('bottom-sheet-open');
  }, [moreOpen]);

  const path = loc.split('?')[0];
  const activeTab = new URLSearchParams(loc.split('?')[1] || '').get('tab');

  const handleSignOut = async () => {
    await signOut(auth);
    setMoreOpen(false);
    router.push('/login');
  };

  const isTabActive = (tab: string) => {
    if (tab === 'more') return false;
    if (path !== '/') return false;
    if (tab === 'home') return !activeTab || activeTab === 'home';
    return activeTab === tab;
  };

  const isRouteActive = (href: string) => {
    const h = href.split('?')[0];
    return path === h || path.startsWith(`${h}/`);
  };

  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <DashboardErrorBoundary>
        {children}
      </DashboardErrorBoundary>

      {/* Spacer so page bottoms clear the floating tab bar on mobile */}
      <div aria-hidden className="h-24 sm:h-24 safe-bottom md:hidden" />

      {/* Bottom Tab Bar (mobile only — floating pill, center + opens More) */}
      <nav className="fixed bottom-4 left-4 right-4 z-40 flex md:hidden h-[72px] items-stretch rounded-2xl border bg-card/95 backdrop-blur-xl shadow-2xl safe-bottom tab-bar">
        <div className="flex w-full items-stretch">
          {bottomNavItems.slice(0, 2).map((item) => {
            const active = isTabActive(item.tab);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'relative flex flex-1 flex-col items-center justify-center gap-1.5 transition-all duration-200',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <span className="relative">
                  <item.icon className={cn('h-6 w-6 transition-transform duration-200', active && 'scale-110')} />
                </span>
                <span className={cn('text-[10px] font-bold transition-colors', active ? 'font-black text-primary' : 'text-muted-foreground')}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Center + button — raised, opens More sheet */}
          <div className="relative flex flex-1 items-center justify-center">
            <button
              onClick={() => setMoreOpen(true)}
              aria-label="More actions"
              className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-600 text-white shadow-xl ring-4 ring-background transition-transform hover:scale-105 active:scale-95"
            >
              <Plus className="h-7 w-7" />
            </button>
          </div>

          {bottomNavItems.slice(2).map((item) => {
            const active = isTabActive(item.tab);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'relative flex flex-1 flex-col items-center justify-center gap-1.5 transition-all duration-200',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <span className="relative">
                  <item.icon className={cn('h-6 w-6 transition-transform duration-200', active && 'scale-110')} />
                </span>
                <span className={cn('text-[10px] font-bold transition-colors', active ? 'font-black text-primary' : 'text-muted-foreground')}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* More Sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-background border-t rounded-t-2xl overflow-auto safe-bottom">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-base font-black uppercase tracking-tight">All Features</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setMoreOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="p-2 space-y-1">
              {moreNavItems.map(item => {
                const active = isRouteActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-3 py-3 px-4 rounded-xl text-[14px] font-semibold transition-all',
                      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <item.icon className={cn('h-4 w-4 shrink-0', active && 'text-primary')} />
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronRight className="h-4 w-4 shrink-0 text-primary" />}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t p-3 space-y-1">
              <SupportDialog trigger={
                <Button size="sm" variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground gap-2 h-9 font-semibold">
                  <Headphones className="h-4 w-4" />
                  Support
                </Button>
              } />
              <Button
                size="sm" variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-destructive gap-2 h-9 font-semibold"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
