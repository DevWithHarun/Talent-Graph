'use client';
import { Link } from 'wouter';
import {
  Users,
  Home,
  LogOut,
  BarChart,
  Zap,
  Trophy,
  Calendar,
  Settings,
  ClipboardCheck,
  Activity,
  UserPlus,
  Radio,
  Grid3X3,
  X,
  Bell,
  UserCheck,
  Building2,
  Unlock,
  CreditCard,
  GraduationCap,
  MessageSquare,
  MessagesSquare,
  MoreHorizontal,
} from 'lucide-react';
import { usePathname, useRouter } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { SupportDialog } from '@/components/support/support-dialog';
import { PushNotificationToggle, PushNotificationPrompt } from '@/components/club/push-notification-prompt';
import { DashboardErrorBoundary } from '@/components/coach/dashboard-error-boundary';
import { ChatNavButton } from '@/components/messaging/chat-nav-button';
import type { ClubMember } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  badge?: string;
  pendingBadge?: boolean;
}

const bottomNavItems: (NavItem & { exact?: boolean; isMore?: boolean })[] = [
  { href: '/club-dashboard', label: 'Overview', icon: Home, exact: true },
  { href: '/club-dashboard/athletes', label: 'Squad', icon: Users },
  { href: '/club-dashboard/matches', label: 'Matches', icon: Trophy },
  { href: '/club-dashboard/requests', label: 'Requests', icon: UserCheck, pendingBadge: true },
  { href: '#', label: 'More', icon: MoreHorizontal, isMore: true },
];

const moreNavItems: NavItem[] = [
  { href: '/club-dashboard/club-profile', label: 'Club Profile', icon: Building2 },
  { href: '/club-dashboard/coaching-staff', label: 'Coaching Staff', icon: GraduationCap },
  { href: '/club-dashboard/scouts', label: 'Scouts', icon: UserPlus },
  { href: '/club-dashboard/live-match', label: 'Live', icon: Radio, badge: 'LIVE' },
  { href: '/club-dashboard/practices', label: 'Training', icon: Activity },
  { href: '/club-dashboard/schedule', label: 'Schedule', icon: Calendar },
  { href: '/club-dashboard/stats', label: 'Stats', icon: BarChart },
  { href: '/club-dashboard/verification', label: 'Verify', icon: ClipboardCheck },
  { href: '/club-dashboard/messages', label: 'Messages', icon: MessageSquare },
  { href: '/club-dashboard/squad-chat', label: 'Squad Chat', icon: MessagesSquare },
  { href: '/club-dashboard/notifications', label: 'Alerts', icon: Bell },
  { href: '/club-dashboard/trial-unlocks', label: 'Trial Unlocks', icon: Unlock },
  { href: '/club-dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/club-dashboard/settings', label: 'Settings', icon: Settings },
];

const allNavItems = [...bottomNavItems.filter(i => !i.isMore), ...moreNavItems];

export default function ClubDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const [pendingCount, setPendingCount] = useState(0);

  const clubMemberQuery = useMemoFirebase(() => (
    firestore && user ? query(collection(firestore, 'club_members'), where('userId', '==', user.uid), where('status', '==', 'active')) : null
  ), [firestore, user]);
  const { data: userMemberships } = useCollection<ClubMember>(clubMemberQuery);
  const clubId = userMemberships?.[0]?.clubId;

  useEffect(() => {
    if (!firestore || !clubId) return;

    let athleteCount = 0;
    let staffCount = 0;

    const unsubAthletes = onSnapshot(
      collection(firestore, 'clubs', clubId, 'pendingMembers'),
      (snap) => { athleteCount = snap.size; setPendingCount(athleteCount + staffCount); },
      () => setPendingCount(staffCount)
    );

    const unsubStaff = onSnapshot(
      query(collection(firestore, 'club_members'), where('clubId', '==', clubId), where('status', '==', 'pending')),
      (snap) => { staffCount = snap.size; setPendingCount(athleteCount + staffCount); },
      () => setPendingCount(athleteCount)
    );

    return () => { unsubAthletes(); unsubStaff(); };
  }, [firestore, clubId]);

  useEffect(() => {
    document.body.classList.toggle('bottom-sheet-open', isMoreOpen);
    return () => document.body.classList.remove('bottom-sheet-open');
  }, [isMoreOpen]);

  const handleSignOut = async () => {
    await signOut(auth);
    setIsMoreOpen(false);
    router.push('/login');
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const currentLabel = allNavItems.find(item => isActive(item.href, (item as { exact?: boolean }).exact))?.label || 'Dashboard';

  const renderBadges = (item: NavItem, active: boolean) => (
    <>
      {item.badge && (
        <Badge className="bg-red-600 text-white font-black text-[8px] px-1.5 py-0 h-4 tracking-wider shrink-0">
          {item.badge}
        </Badge>
      )}
      {item.pendingBadge && pendingCount > 0 && !active && (
        <Badge className="bg-primary text-primary-foreground font-black text-[8px] px-1.5 py-0 h-4 min-w-4 tracking-wider shrink-0">
          {pendingCount}
        </Badge>
      )}
    </>
  );

  const SidebarNavLinks = () => (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-3 space-y-0.5">
      {[...bottomNavItems.filter(i => !i.isMore), ...moreNavItems].map((item) => {
        const active = isActive(item.href, (item as { exact?: boolean }).exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted/60',
              active && 'bg-primary/10 text-primary font-semibold'
            )}
          >
            <item.icon className={cn('h-4 w-4 shrink-0', active && 'text-primary')} />
            <span className="flex-1 truncate">{item.label}</span>
            {renderBadges(item, active)}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="grid min-h-screen w-full overflow-x-hidden bg-white md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr]">

      {/* ── Desktop Sidebar ── */}
      <div className="hidden border-r bg-background md:flex md:flex-col">
        {/* Sidebar header */}
        <div className="flex h-14 items-center gap-2.5 border-b px-5 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shrink-0">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black tracking-tight truncate">Talent Graph</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">Club Admin</p>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-auto py-3">
          <SidebarNavLinks />
        </div>

        {/* Sidebar footer */}
        <div className="border-t p-3 space-y-1 shrink-0">
          <PushNotificationToggle clubId={clubId} userId={user?.uid} />
          <SupportDialog />
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive gap-2 h-9"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>

      {/* ── Main Content Column ── */}
      <div className="flex flex-col min-h-screen overflow-x-hidden min-w-0">

        {/* ── Mobile Top Header ── */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur px-4 md:hidden">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Zap className="h-5 w-5 text-primary shrink-0" />
            <h1 className="text-base font-black uppercase tracking-tight truncate">{currentLabel}</h1>
          </div>

          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => setIsMoreOpen(true)}>
            <Grid3X3 className="h-5 w-5" />
            <span className="sr-only">More menu</span>
          </Button>
        </header>

        {/* ── Desktop Content Topbar ── */}
        <header className="hidden md:flex sticky top-0 z-20 h-13 min-h-[52px] items-center justify-between border-b bg-background/95 backdrop-blur-sm px-6 shrink-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-black uppercase tracking-wider text-foreground">{currentLabel}</h1>
            {pendingCount > 0 && pathname !== '/club-dashboard/requests' && (
              <Link href="/club-dashboard/requests">
                <Badge className="bg-primary/15 text-primary border border-primary/30 font-black text-[9px] px-2 h-5 hover:bg-primary/25 transition-colors cursor-pointer">
                  {pendingCount} pending
                </Badge>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <ChatNavButton />
            <Link href="/club-dashboard/notifications">
              <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                <Bell className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/club-dashboard/settings">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex flex-1 flex-col gap-4 overflow-x-hidden bg-white p-4 pb-24 md:p-6 md:pb-6 lg:gap-6 lg:p-8">
          <div className="w-full max-w-7xl mx-auto">
            <PushNotificationPrompt clubId={clubId} userId={user?.uid} />
            <DashboardErrorBoundary>
              {children}
            </DashboardErrorBoundary>
          </div>
        </main>

        {/* ── Mobile Bottom Navigation ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden h-16 items-stretch border-t bg-background/95 backdrop-blur shadow-[0_-1px_12px_rgba(0,0,0,0.08)] bottom-nav-safe tab-bar">
          {bottomNavItems.map((item) => {
            if (item.isMore) {
              return (
                <button
                  key="more"
                  onClick={() => setIsMoreOpen(true)}
                  className={cn(
                    'flex flex-1 flex-col items-center justify-center gap-1 text-muted-foreground transition-colors py-2',
                    isMoreOpen && 'text-primary'
                  )}
                >
                  <Grid3X3 className="h-[22px] w-[22px]" />
                  <span className="text-[10px] font-bold uppercase tracking-wide leading-tight">More</span>
                </button>
              );
            }
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors relative',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full active-indicator" />
                )}
                <span className="relative">
                  <item.icon className={cn('h-[22px] w-[22px] transition-transform', active && 'scale-110')} />
                  {item.pendingBadge && pendingCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-primary-foreground leading-none">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </span>
                <span className={cn('text-[10px] font-bold uppercase tracking-wide leading-tight', active && 'font-black')}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* ── More Bottom Sheet (mobile) ── */}
        {isMoreOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setIsMoreOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-background border-t rounded-t-2xl overflow-auto safe-bottom">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Club Admin
                </h2>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsMoreOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="p-2 space-y-1">
                {moreNavItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMoreOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-colors',
                        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-primary active:scale-[0.98]'
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {renderBadges(item, active)}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t space-y-2">
                <PushNotificationToggle clubId={clubId} userId={user?.uid} />
                <SupportDialog />
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
