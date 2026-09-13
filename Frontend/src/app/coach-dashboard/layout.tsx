'use client';

import { Link } from 'wouter';
import {
  Home, Users, Trophy, Dumbbell, MoreHorizontal, Bell,
  Menu, X, Zap, ChevronRight, Radio, Search, Link2,
  MessageSquare, MessagesSquare, Inbox, Headphones, TrendingUp, ShieldCheck,
  Calendar, Building2, Settings, LogOut, BarChart3,
} from 'lucide-react';
import { usePathname, useRouter } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import type { ClubMember, UserAccount } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/coach/notification-bell';
import { useCoachNotifications } from '@/hooks/useCoachNotifications';
import { SupportDialog } from '@/components/support/support-dialog';
import { CoachClubContext } from './coach-context';
import { DashboardErrorBoundary } from '@/components/coach/dashboard-error-boundary';
import { useIsMobile } from '@/hooks/use-mobile';

const bottomNavItems = [
  { href: '/coach-dashboard', label: 'Home', icon: Home },
  { href: '/coach-dashboard/squad', label: 'Squad', icon: Users },
  { href: '/coach-dashboard/training', label: 'Training', icon: Dumbbell },
  { href: '/coach-dashboard/match-entry', label: 'Match', icon: Trophy },
  { href: '#', label: 'More', icon: MoreHorizontal, isMore: true },
];

const moreNavItems: { href: string; label: string; icon: typeof Search; noClubOnly?: boolean }[] = [
  { href: '/coach-dashboard/connect', label: 'Connect', icon: Link2 },
  { href: '/coach-dashboard/verify', label: 'Verify Athletes', icon: ShieldCheck },
  { href: '/coach-dashboard/stats', label: 'Stats', icon: TrendingUp },
  { href: '/coach-dashboard/live-match', label: 'Live Match', icon: Radio },
  { href: '/coach-dashboard/schedule', label: 'Schedule', icon: Calendar },
  { href: '/coach-dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/coach-dashboard/alerts', label: 'Alerts', icon: Bell },
  { href: '/coach-dashboard/messages', label: 'Messages', icon: MessagesSquare },
  { href: '/coach-dashboard/communications', label: 'Communications', icon: MessageSquare },
  { href: '/coach-dashboard/notifications', label: 'Notifications', icon: Inbox },
  { href: '/coach-dashboard/club', label: 'Club Dashboard', icon: Building2 },
  { href: '/coach-dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/coach-dashboard/find-club', label: 'Find Club', icon: Search, noClubOnly: true },
];

export default function CoachDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const isMobile = useIsMobile();
  const [moreOpen, setMoreOpen] = useState(false);

  const memberQuery = useMemoFirebase(() => (
    firestore && user?.uid ? query(collection(firestore, 'club_members'), where('userId', '==', user.uid), where('status', '==', 'active')) : null
  ), [firestore, user?.uid]);
  const { data: memberships, isLoading: membershipLoading } = useCollection<ClubMember>(memberQuery);
  const membership = memberships?.[0];
  const clubId = membership?.clubId ?? null;
  const membershipsLoaded = !membershipLoading;

  const pendingInviteQuery = useMemoFirebase(() => (
    firestore && user?.uid ? query(collection(firestore, 'club_members'), where('userId', '==', user.uid), where('status', '==', 'club_invited')) : null
  ), [firestore, user?.uid]);
  const { data: pendingInvites } = useCollection<ClubMember>(pendingInviteQuery);
  const pendingInviteCount = pendingInvites?.length ?? 0;

  const { isUserLoading } = useUser();

  const userDocRef = useMemoFirebase(() => (firestore && user?.uid ? doc(firestore, 'users', user.uid) : null), [firestore, user?.uid]);
  const { data: userAccount, isLoading: isAccountLoading } = useDoc<UserAccount>(userDocRef);

  const { notifications, unreadCount, markRead, markAllRead } = useCoachNotifications(
    clubId,
    user?.uid ?? null
  );

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
      return;
    }
    if (userAccount && !isAccountLoading) {
      if (userAccount.role === 'scout') {
        router.push('/scout-dashboard');
      } else if (userAccount.role === 'athlete') {
        router.push('/');
      } else if (userAccount.role === 'club') {
        router.push('/club-dashboard/athletes');
      }
    }
  }, [user, isUserLoading, userAccount, router]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0A0E1A]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00C853]" />
      </div>
    );
  }

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'C';

  const currentLabel = bottomNavItems.find(item => !item.isMore && isActive(item.href, item.href === '/coach-dashboard'))?.label
    ?? moreNavItems.find(item => isActive(item.href))?.label
    ?? 'Talent Graph';

  const visibleMoreItems = moreNavItems.filter(item => !item.noClubOnly || !clubId);

  const handleMoreClick = useCallback(() => {
    setMoreOpen(false);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('bottom-sheet-open', moreOpen);
    return () => document.body.classList.remove('bottom-sheet-open');
  }, [moreOpen]);

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center gap-3 border-b px-4 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00C853] shrink-0">
          <Zap className="h-4 w-4 text-black" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black tracking-tight truncate text-white">Talent Graph</p>
          <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">Coach Pro</p>
        </div>
      </div>

      {membership && (
        <div className="px-4 py-3 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 rounded-xl">
              <AvatarImage src={(userAccount as any)?.photoUrl} className="object-cover rounded-xl" />
              <AvatarFallback className="rounded-xl bg-[#1C2333] text-[#94A3B8] text-xs font-black">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black text-white truncate">{user?.displayName || user?.email}</p>
              <p className="text-[9px] font-bold text-[#94A3B8] truncate uppercase tracking-wide">{membership.clubName || 'Coach'}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-auto py-3 px-2 space-y-0.5">
        {visibleMoreItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all',
                active ? 'bg-[#00C853]/15 text-[#00C853]' : 'text-[#94A3B8] hover:text-white hover:bg-[#1C2333]'
              )}
            >
              <item.icon className={cn('h-4 w-4 shrink-0', active && 'text-[#00C853]')} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.href === '/coach-dashboard/connect' && pendingInviteCount > 0 && !active && (
                <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#00C853] px-1 text-[9px] font-black text-black">
                  {pendingInviteCount}
                </span>
              )}
              {active && <ChevronRight className="h-3 w-3 shrink-0 text-[#00C853]" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#1E293B] p-3 space-y-1 shrink-0">
        <SupportDialog trigger={
          <Button size="sm" variant="ghost" className="w-full justify-start text-[#94A3B8] hover:text-white hover:bg-[#1C2333] gap-2 h-9 font-semibold">
            <Headphones className="h-4 w-4" />
            Support
          </Button>
        } />
        <Button
          size="sm" variant="ghost"
          className="w-full justify-start text-[#94A3B8] hover:text-red-400 hover:bg-red-400/10 gap-2 h-9 font-semibold"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-[#0A0E1A] text-white">

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-[260px] border-r border-[#1E293B] bg-[#111827] shrink-0 fixed top-0 left-0 h-screen z-40 flex flex-col">
          {sidebarContent}
        </aside>
      )}

      {/* Main area */}
      <div className={cn(
        'flex flex-col min-h-screen flex-1 w-full min-w-0',
        !isMobile && 'md:ml-[260px]'
      )}>

        {/* Top App Bar */}
        <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-[#1E293B] bg-[#111827]/95 backdrop-blur px-4 shrink-0">
          <Zap className="h-4 w-4 text-[#00C853] shrink-0" />
          <h1 className="text-sm font-black uppercase tracking-tight text-white flex-1">{currentLabel}</h1>
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
          />
          {isMobile && (
            <Button variant="ghost" size="icon" className="h-9 w-9 text-[#94A3B8]" onClick={() => setMoreOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </header>

        {/* Content */}
        <main className={cn('flex-1 px-4 pt-4 w-full min-w-0', isMobile ? 'content-with-bottom-nav' : 'pb-8')}>
          <CoachClubContext.Provider value={{ clubId, clubName: membership?.clubName ?? '', membershipsLoaded, userAccount: userAccount ?? null }}>
            <DashboardErrorBoundary>
              {children}
            </DashboardErrorBoundary>
          </CoachClubContext.Provider>
        </main>

        {/* Bottom Tab Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t border-[#1E293B] bg-[#111827]/95 backdrop-blur bottom-nav-safe md:hidden tab-bar">
          <div className="flex w-full">
            {bottomNavItems.map((item) => {
              const active = item.isMore ? false : isActive(item.href, item.href === '/coach-dashboard');
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(e) => { if (item.isMore) { e.preventDefault(); setMoreOpen(true); } }}
                  className={cn(
                    'flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors relative',
                    active ? 'text-[#00C853]' : 'text-[#94A3B8]'
                  )}
                >
                  {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#00C853] rounded-full active-indicator" />}
                  <item.icon className={cn('h-[22px] w-[22px]', active && 'scale-110 transition-transform')} />
                  <span className={cn('text-[9px] font-black uppercase tracking-wide leading-tight', active && 'font-black')}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* More Sheet Overlay (mobile only) */}
        {moreOpen && (
          <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMoreOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-[#111827] border-t border-[#1E293B] rounded-t-2xl overflow-auto">
              <div className="flex items-center justify-between p-4 border-b border-[#1E293B]">
                <h2 className="text-base font-black uppercase tracking-tight text-white">All Features</h2>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#94A3B8]" onClick={() => setMoreOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="p-2 space-y-1">
                {visibleMoreItems.map(item => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleMoreClick}
                      className={cn(
                        'flex items-center gap-3 py-3 px-4 rounded-xl text-[14px] font-semibold transition-all',
                        active ? 'bg-[#00C853]/15 text-[#00C853]' : 'text-[#94A3B8] hover:text-white hover:bg-[#1C2333]'
                      )}
                    >
                      <item.icon className={cn('h-4 w-4 shrink-0', active && 'text-[#00C853]')} />
                      <span className="flex-1">{item.label}</span>
                      {active && <ChevronRight className="h-4 w-4 shrink-0 text-[#00C853]" />}
                      {item.href === '/coach-dashboard/connect' && pendingInviteCount > 0 && !active && (
                        <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#00C853] px-1 text-[9px] font-black text-black">
                          {pendingInviteCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-[#1E293B] p-3 space-y-1">
                <SupportDialog trigger={
                  <Button size="sm" variant="ghost" className="w-full justify-start text-[#94A3B8] hover:text-white hover:bg-[#1C2333] gap-2 h-9 font-semibold">
                    <Headphones className="h-4 w-4" />
                    Support
                  </Button>
                } />
                <Button
                  size="sm" variant="ghost"
                  className="w-full justify-start text-[#94A3B8] hover:text-red-400 hover:bg-red-400/10 gap-2 h-9 font-semibold"
                  onClick={() => { handleSignOut(); setMoreOpen(false); }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}