'use client';

import { Link } from 'wouter';
import {
  Home, PlusCircle, Activity, Mail, MoreHorizontal, X,
  Trophy, Shield, ShieldCheck, GitGraph, Settings2,
  Layers, Headphones, LogOut, ChevronRight,
} from 'lucide-react';
import { usePathname, useRouter } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { SupportDialog } from '@/components/support/support-dialog';
import { DashboardErrorBoundary } from '@/components/coach/dashboard-error-boundary';

const bottomNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/dashboard/add-match', label: 'Log Match', icon: PlusCircle },
  { href: '/dashboard/career', label: 'Career', icon: Activity },
  { href: '/dashboard/invites', label: 'Invites', icon: Mail, inviteBadge: true },
  { href: '#', label: 'More', icon: MoreHorizontal, isMore: true },
];

const moreNavItems = [
  { href: '/dashboard/achievements', label: 'Achievements', icon: Trophy },
  { href: '/dashboard/injury-tracker', label: 'Injury Tracker', icon: Shield },
  { href: '/dashboard/verify', label: 'Verify Profile', icon: ShieldCheck },
  { href: '/dashboard/update-attributes', label: 'Refine Attributes', icon: GitGraph },
  { href: '/onboarding/metrics', label: 'Update Master Index', icon: Layers },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings2 },
];

export default function AthleteDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const [moreOpen, setMoreOpen] = useState(false);

  const invitesQuery = useMemoFirebase(() => (
    firestore && user?.uid
      ? query(
          collection(firestore, 'squad_invites'),
          where('athleteId', '==', user.uid),
          where('status', '==', 'pending')
        )
      : null
  ), [firestore, user?.uid]);
  const { data: pendingInvites } = useCollection<{ id: string }>(invitesQuery);
  const inviteCount = pendingInvites?.length ?? 0;

  useEffect(() => {
    document.body.classList.toggle('bottom-sheet-open', moreOpen);
    return () => document.body.classList.remove('bottom-sheet-open');
  }, [moreOpen]);

  const handleSignOut = async () => {
    await signOut(auth);
    setMoreOpen(false);
    router.push('/login');
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <DashboardErrorBoundary>
        {children}
      </DashboardErrorBoundary>

      {/* Spacer so page bottoms clear the fixed tab bar on mobile */}
      <div aria-hidden className="h-16 safe-bottom md:hidden" />

      {/* Bottom Tab Bar (mobile only — desktop keeps each page's own layout) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-stretch border-t bg-background/95 backdrop-blur shadow-[0_-1px_12px_rgba(0,0,0,0.08)] bottom-nav-safe tab-bar">
        <div className="flex w-full">
          {bottomNavItems.map((item) => {
            const active = item.isMore ? false : isActive(item.href, item.href === '/');
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={(e) => { if (item.isMore) { e.preventDefault(); setMoreOpen(true); } }}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors relative',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full active-indicator" />}
                <span className="relative">
                  <item.icon className={cn('h-[22px] w-[22px]', active && 'scale-110 transition-transform')} />
                  {'inviteBadge' in item && inviteCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-primary-foreground leading-none">
                      {inviteCount > 9 ? '9+' : inviteCount}
                    </span>
                  )}
                </span>
                <span className={cn('text-[10px] font-bold uppercase tracking-wide leading-tight', active && 'font-black')}>
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
                const active = isActive(item.href);
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
