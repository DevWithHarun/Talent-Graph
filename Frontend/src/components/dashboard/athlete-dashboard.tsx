'use client';

import type { UserAccount, AthleteProfile, ShowcaseVideo } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import {
  LogOut, Loader2, Target, TrendingUp, ShieldAlert, BarChart3,
  Eye, Layers, GitGraph, PlusCircle, Play, Zap, ArrowRight,
  CheckCircle2, Home, Pencil, Headphones, User, Trash2,
  Flame, Clock, ShieldCheck, ShieldX, Building2, Bell, CheckCheck,
  Trophy, Settings2, Shield, Sparkles, Gauge, Users, MessageSquare,
  Search, Plus, ChevronRight, Video, Activity, BadgeCheck, X,
  type LucideIcon
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { signOut } from 'firebase/auth';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, arrayRemove, collection, query, orderBy, limit, where, writeBatch } from 'firebase/firestore';
import { useRouter } from '@/lib/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ActivitySummary } from './activity-summary';
import { ScoutRequests } from './scout-requests';
import { Badge } from '@/components/ui/badge';
import { SupportDialog } from '@/components/support/support-dialog';
import { ProfileHeader } from './profile-header';
import { MatchStatisticsTable } from './match-statistics-table';
import { MatchActionCenter } from './match-action-center';
import { ProfileViewsCard } from './profile-views-card';
import { RecruitmentPipelineTracker } from './recruitment-pipeline-tracker';
import { EditProfileMediaDialog } from './edit-profile-media-dialog';
import { CareerHistoryCard } from './career-history-card';
import { DeleteAccountDialog } from '@/components/account/delete-account-dialog';
import { ProfileStrengthCard, countAttributes, countVerifiedAppearances } from './profile-strength-card';
import { TierProgressionCard } from './tier-progression-card';
import { EngagementLoop } from './engagement-loop';
import { Skeleton } from '@/components/ui/skeleton';
import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { calculateTalentGraphScore } from '@/lib/scoring-calculator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VideoEngagement } from './video-engagement';
import { ReapplyClubDialog } from './reapply-club-dialog';
import { AthleteClubInvitations } from '@/components/club/athlete-club-invitations';
import { AthleteTrainingSessions } from './athlete-training-sessions';
import { Progress } from '@/components/ui/progress';
import { ShareProfileCard } from './share-profile-card';

const PerformanceRadarChart = lazy(
  () => import('./performance-radar-chart').then((mod) => ({ default: mod.PerformanceRadarChart }))
);

const AttributeRadarCharts = lazy(
  () => import('./attribute-radar-charts').then((mod) => ({ default: mod.AttributeRadarCharts }))
);

const MatchPerformanceChart = lazy(
  () => import('./match-performance-chart').then((mod) => ({ default: mod.MatchPerformanceChart }))
);

interface AthleteDashboardProps {
  userAccount: UserAccount;
  athleteProfile?: AthleteProfile;
}

type ActiveTab = 'home' | 'profile' | 'performance' | 'network' | 'messages';

const parseTabFromSearch = (searchStr: string): ActiveTab => {
  const t = new URLSearchParams(searchStr).get('tab');
  if (t === 'profile' || t === 'performance' || t === 'network' || t === 'messages') return t;
  // Legacy tabs from the previous dashboard
  if (t === 'career') return 'profile';
  if (t === 'growth') return 'performance';
  return 'home';
};

// Primary destinations — shown in the sidebar (desktop) and bottom bar (mobile).
// Messages lives in the top bar, so it isn't part of the tab set.
const TABS: { id: Exclude<ActiveTab, 'messages'>; label: string; short: string; icon: LucideIcon; description: string }[] = [
  { id: 'home', label: 'Home', short: 'Home', icon: Home, description: 'Your daily overview' },
  { id: 'performance', label: 'Performance', short: 'Stats', icon: Gauge, description: 'Indices, charts & match data' },
  { id: 'network', label: 'Network', short: 'Network', icon: Users, description: 'Scouts, clubs & recruitment' },
  { id: 'profile', label: 'My Profile', short: 'Profile', icon: User, description: 'Career, media & sharing' },
];

const TAB_TITLES: Record<ActiveTab, { title: string; subtitle: string }> = {
  home: { title: 'Home', subtitle: 'Your daily overview' },
  performance: { title: 'Performance', subtitle: 'Indices, attribute radars and match statistics' },
  network: { title: 'Network', subtitle: 'Scout interest, recruitment pipeline and club news' },
  profile: { title: 'My Profile', subtitle: 'How scouts and clubs see you' },
  messages: { title: 'Messages', subtitle: 'Coaches, clubs and verified scouts' },
};

export function AthleteDashboard({ userAccount, athleteProfile }: AthleteDashboardProps) {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => parseTabFromSearch(window.location.search));
  const [accountOpen, setAccountOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteVideo, setConfirmDeleteVideo] = useState<ShowcaseVideo | null>(null);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);
  const [confirmDeleteMatch, setConfirmDeleteMatch] = useState<string | null>(null);
  const [isDeletingMatch, setIsDeletingMatch] = useState(false);
  const { toast } = useToast();

  const selectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.history.pushState(null, '', tab === 'home' ? '/' : `/?tab=${tab}`);
    window.scrollTo({ top: 0 });
  };

  // Keep the active tab in sync with browser back/forward
  useEffect(() => {
    const onPop = () => setActiveTab(parseTabFromSearch(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    router.push(term ? `/athletes?q=${encodeURIComponent(term)}` : '/athletes');
  };

  // Live unread notification count
  const notifsQuery = useMemoFirebase(() => (
    firestore && athleteProfile ? query(
      collection(firestore, 'notifications', athleteProfile.uid, 'items'),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50)
    ) : null
  ), [firestore, athleteProfile?.uid]);
  const { data: unreadNotifs } = useCollection<{ id: string; isRead: boolean; type?: string }>(notifsQuery);

  // Club announcements
  const announcementsQuery = useMemoFirebase(() => (
    firestore && athleteProfile?.affiliatedClubId && athleteProfile.clubStatus === 'active'
      ? query(
          collection(firestore, 'announcements'),
          where('clubId', '==', athleteProfile.affiliatedClubId),
          orderBy('createdAt', 'desc'),
          limit(5)
        )
      : null
  ), [firestore, athleteProfile?.affiliatedClubId, athleteProfile?.clubStatus]);
  const { data: clubAnnouncements } = useCollection<{
    id: string; title: string; content: string; authorName: string; audience: string; createdAt: string;
  }>(announcementsQuery);

  // Pending match stat confirmations (coach/analyst logged — athlete hasn't confirmed yet)
  const pendingConfirmQuery = useMemoFirebase(() => (
    firestore && athleteProfile ? query(
      collection(firestore, 'match_confirmations'),
      where('athleteId', '==', athleteProfile.uid),
      where('status', '==', 'pending')
    ) : null
  ), [firestore, athleteProfile?.uid]);
  const { data: pendingConfirmations } = useCollection<{ id: string }>(pendingConfirmQuery);

  // Total badge = unread notifications + pending match confirmations awaiting athlete sign-off
  const unreadCount = (unreadNotifs?.length ?? 0) + (pendingConfirmations?.length ?? 0);
  const unreadMessages = unreadNotifs?.filter(n => n.type === 'new_message').length ?? 0;

  const handleMarkAllRead = async () => {
    if (!firestore || !athleteProfile || !unreadNotifs?.length) return;
    const batch = writeBatch(firestore);
    unreadNotifs.forEach(n => {
      batch.update(doc(firestore, 'notifications', athleteProfile.uid, 'items', n.id), { isRead: true });
    });
    await batch.commit();
  };

  const handleDeleteMatch = async () => {
    if (!confirmDeleteMatch || !athleteProfile || !firestore) return;
    setIsDeletingMatch(true);
    try {
      const updatedHistory = (athleteProfile.matchHistory || []).filter(m => m.id !== confirmDeleteMatch);
      const newScores = calculateTalentGraphScore({ ...athleteProfile, matchHistory: updatedHistory }, userAccount);
      await updateDoc(doc(firestore, 'athletes', athleteProfile.uid), {
        matchHistory: updatedHistory,
        ...newScores,
        updatedAt: new Date().toISOString(),
      });
      toast({ title: 'Match removed', description: 'Your performance indices have been recalculated.' });
      setConfirmDeleteMatch(null);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete match. Please try again.' });
    } finally {
      setIsDeletingMatch(false);
    }
  };

  const handleDeleteShowcaseVideo = async () => {
    if (!confirmDeleteVideo || !athleteProfile || !firestore) return;
    setIsDeletingVideo(true);
    try {
      await updateDoc(doc(firestore, 'athletes', athleteProfile.uid), {
        showcaseVideos: arrayRemove(confirmDeleteVideo),
      });
      setConfirmDeleteVideo(null);
    } catch {
      // silent - toast not available here without hook; failure is non-critical
    } finally {
      setIsDeletingVideo(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (!athleteProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-background" suppressHydrationWarning>
        <div className="text-center">
          <p className="text-lg mb-4">Finalizing your profile setup...</p>
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
      </div>
    );
  }

  const fullName = `${athleteProfile.firstName} ${athleteProfile.lastName}`;
  const initials = `${athleteProfile.firstName?.[0] ?? ''}${athleteProfile.lastName?.[0] ?? ''}`.toUpperCase() || 'TG';
  const subtitleLine = [athleteProfile.position, athleteProfile.sport, athleteProfile.clubName].filter(Boolean).join(' · ');

  const indices = [
    { label: 'Performance', value: athleteProfile.performanceIndex, icon: BarChart3, tone: 'text-teal-600 bg-teal-500/10' },
    { label: 'Efficiency', value: athleteProfile.efficiencyIndex, icon: Target, tone: 'text-sky-600 bg-sky-500/10' },
    { label: 'Consistency', value: athleteProfile.consistencyIndex, icon: TrendingUp, tone: 'text-violet-600 bg-violet-500/10' },
    { label: 'Risk', value: athleteProfile.riskIndex, icon: ShieldAlert, tone: 'text-rose-600 bg-rose-500/10' },
  ];

  const safeRenderValue = (val: any) => {
    if (val === null || val === undefined || isNaN(val)) return '--';
    return val;
  };

  const verifiedApps = countVerifiedAppearances(athleteProfile);
  const attributeCount = countAttributes(athleteProfile);
  const completionItems = [
    { weight: 25, achieved: verifiedApps >= 1 },
    { weight: 25, achieved: attributeCount >= 30 },
    { weight: 15, achieved: !!athleteProfile.photoUrl },
    { weight: 15, achieved: !!(athleteProfile.position && athleteProfile.altPositions?.length) },
    { weight: 10, achieved: !!(athleteProfile.previousTeams?.length) },
    { weight: 10, achieved: !!athleteProfile.affiliatedClubId },
  ];
  const profileScore = completionItems.reduce((s, i) => s + (i.achieved ? i.weight : 0), 0);
  const isComplete = profileScore === 100;
  const readiness = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        ((athleteProfile.readinessTier === 'Elite' || athleteProfile.readinessTier === 'Pro') ? 90 : athleteProfile.readinessTier === 'Advanced' ? 80 : athleteProfile.readinessTier === 'Semi-Pro' ? 70 : athleteProfile.readinessTier === 'Developing' ? 55 : 45) -
          Math.min(athleteProfile.riskIndex || 0, 40) +
          (athleteProfile.isVerified ? 10 : 0)
      )
    )
  );
  const availabilityLabel = readiness >= 80 ? 'Available' : readiness >= 65 ? 'Doubtful' : readiness >= 45 ? 'Injured' : 'Suspended';
  const availabilityDot =
    availabilityLabel === 'Available' ? 'bg-emerald-400'
    : availabilityLabel === 'Doubtful' ? 'bg-amber-400'
    : availabilityLabel === 'Injured' ? 'bg-orange-400'
    : 'bg-red-400';

  // ── Streak: consecutive weeks (Mon–Sun) with ≥1 match logged ──
  const matchStreak = (() => {
    const history = athleteProfile.matchHistory ?? [];
    if (!history.length) return 0;
    const getMonday = (d: Date) => {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const m = new Date(d);
      m.setDate(diff);
      m.setHours(0, 0, 0, 0);
      return m.getTime();
    };
    const weeksWithMatches = new Set(
      history
        .map(m => { const d = new Date(m.updatedAt); return isNaN(d.getTime()) ? null : getMonday(d); })
        .filter((v): v is number => v !== null)
    );
    let streak = 0;
    const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
    let week = getMonday(new Date());
    if (!weeksWithMatches.has(week)) week -= MS_WEEK;
    while (weeksWithMatches.has(week)) { streak++; week -= MS_WEEK; }
    return streak;
  })();

  const nextAction = !athleteProfile.photoUrl
    ? { label: 'Add a profile photo', onClick: () => setEditOpen(true) }
    : attributeCount < 30
    ? { label: 'Rate your attributes', href: '/dashboard/update-attributes' }
    : verifiedApps === 0
    ? { label: 'Log your first match', href: '/dashboard/add-match' }
    : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const QUICK_ACTIONS: { label: string; hint: string; icon: LucideIcon; tone: string; href?: string; onClick?: () => void }[] = [
    { label: 'Log a Match', hint: 'Add stats & minutes', icon: PlusCircle, tone: 'from-teal-500 to-emerald-500', href: '/dashboard/add-match' },
    { label: 'Rate Attributes', hint: 'Refine your radar', icon: GitGraph, tone: 'from-sky-500 to-indigo-500', href: '/dashboard/update-attributes' },
    { label: 'Master Index', hint: 'Update core metrics', icon: Layers, tone: 'from-violet-500 to-fuchsia-500', href: '/onboarding/metrics' },
    { label: 'Upload Media', hint: 'Photo & highlights', icon: Video, tone: 'from-amber-500 to-orange-500', onClick: () => setEditOpen(true) },
  ];

  const TOOLS: { label: string; icon: LucideIcon; href?: string; onClick?: () => void; badge?: number }[] = [
    { label: 'Notifications', icon: Bell, onClick: () => setNotificationsOpen(true), badge: unreadCount },
    { label: 'Achievements', icon: Trophy, href: '/dashboard/achievements' },
    { label: 'Injury Tracker', icon: Shield, href: '/dashboard/injury-tracker' },
    { label: 'Public Profile', icon: Eye, href: `/${athleteProfile.username}` },
    { label: 'Settings', icon: Settings2, href: '/dashboard/settings' },
    { label: 'Support', icon: Headphones, onClick: () => setSupportOpen(true) },
  ];

  const countBadge = (n: number, className?: string) =>
    n > 0 ? (
      <span className={cn(
        'flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white',
        className
      )}>
        {n > 9 ? '9+' : n}
      </span>
    ) : null;

  const indicesGrid = (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {indices.map((idx) => (
        <div key={idx.label} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{idx.label}</span>
            <span className={cn('flex h-8 w-8 items-center justify-center rounded-xl', idx.tone)}>
              <idx.icon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-black tabular-nums text-slate-900">{safeRenderValue(idx.value)}</span>
            <span className="text-[10px] font-bold text-slate-400">/ 100</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
              style={{ width: `${Math.max(0, Math.min(100, Number(idx.value) || 0))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const sectionTitle = (label: string, icon?: LucideIcon) => {
    const Icon = icon;
    return (
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="h-4 w-4 text-teal-600" />}
        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</h3>
      </div>
    );
  };

  const runAction = (a: { href?: string; onClick?: () => void }) => {
    if (a.onClick) a.onClick();
    else if (a.href) router.push(a.href);
  };

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">

      {/* ── Top Bar: logo · search · messages · profile ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
        <div className="flex h-14 md:h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6">

          {/* Logo */}
          <button
            onClick={() => selectTab('home')}
            className="flex items-center gap-2.5 shrink-0 lg:w-[232px]"
            aria-label="Talent Graph home"
          >
            <img
              src="/icons/logo-transparent.png"
              alt="Talent Graph"
              className="h-9 w-9 rounded-xl bg-black object-contain p-0.5 shadow-sm"
            />
            <span className="hidden sm:flex flex-col items-start leading-none">
              <span className="text-[15px] font-black tracking-tight">Talent Graph</span>
              <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-teal-600">Athlete</span>
            </span>
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 min-w-0 md:max-w-xl" role="search">
            <label className="relative block">
              <span className="sr-only">Search</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search athletes, positions…"
                className="h-10 w-full rounded-full border border-transparent bg-slate-100 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-500/40 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
              />
            </label>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Messages */}
            <Link
              href="/chat"
              aria-label="Messages"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <MessageSquare className="h-[21px] w-[21px]" />
              {countBadge(unreadMessages, 'absolute -top-0.5 -right-0.5')}
            </Link>

            {/* Profile (always top-right) */}
            <button
              onClick={() => setAccountOpen(true)}
              aria-label="Account menu"
              className="relative rounded-full p-0.5 ring-2 ring-teal-500/70 ring-offset-2 ring-offset-white transition hover:ring-teal-500"
            >
              <Avatar className="h-8 w-8 md:h-9 md:w-9">
                {athleteProfile.photoUrl && <AvatarImage src={athleteProfile.photoUrl} alt={fullName} className="object-cover" />}
                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-xs font-black text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ── Sidebar (tablet: icons · desktop: full) ── */}
        <aside className="hidden md:flex sticky top-16 h-[calc(100dvh-4rem)] w-[76px] lg:w-[256px] shrink-0 flex-col border-r border-slate-200/70 bg-white">
          <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
            <div className="space-y-1">
              <p className="hidden lg:block px-3 pb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Menu</p>
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => selectTab(tab.id)}
                    title={tab.label}
                    className={cn(
                      'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                      'justify-center lg:justify-start',
                      active
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    {active && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-teal-600" />}
                    <tab.icon className={cn('h-5 w-5 shrink-0', active ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600')} />
                    <span className="hidden lg:block">{tab.label}</span>
                  </button>
                );
              })}
              <Link
                href="/chat"
                title="Messages"
                className="group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 justify-center lg:justify-start"
              >
                <MessageSquare className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-600" />
                <span className="hidden lg:block flex-1">Messages</span>
                {countBadge(unreadMessages, 'absolute right-2 top-1.5 lg:static')}
              </Link>
            </div>

            <div className="space-y-1">
              <p className="hidden lg:block px-3 pb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Quick actions</p>
              <div className="lg:hidden mx-auto h-px w-8 bg-slate-200 mb-2" />
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => runAction(a)}
                  title={a.label}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 justify-center lg:justify-start"
                >
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm', a.tone)}>
                    <a.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="hidden lg:block">{a.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <p className="hidden lg:block px-3 pb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tools</p>
              <div className="lg:hidden mx-auto h-px w-8 bg-slate-200 mb-2" />
              {TOOLS.map((t) => {
                const inner = (
                  <>
                    <t.icon className="h-[18px] w-[18px] shrink-0 text-slate-400 group-hover:text-slate-600" />
                    <span className="hidden lg:block flex-1 text-left">{t.label}</span>
                    {countBadge(t.badge ?? 0, 'absolute right-2 top-1 lg:static')}
                  </>
                );
                const cls = 'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 justify-center lg:justify-start';
                return t.href ? (
                  <Link key={t.label} href={t.href} title={t.label} className={cls}>{inner}</Link>
                ) : (
                  <button key={t.label} onClick={t.onClick} title={t.label} className={cls}>{inner}</button>
                );
              })}
            </div>
          </nav>

          {/* Profile strength mini-card */}
          <div className="hidden lg:block border-t border-slate-200/70 p-4">
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-teal-900 p-4 text-white">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-teal-200">
                <span>Profile strength</span>
                <span className="tabular-nums text-white">{profileScore}%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/15 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-300" style={{ width: `${profileScore}%` }} />
              </div>
              <p className="mt-2 text-[11px] text-slate-300 leading-snug">
                {isComplete ? 'Fully indexed — visible in every scout search.' : 'Complete your profile to rank higher in Talent Calls.'}
              </p>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 px-4 pt-5 pb-28 sm:px-6 md:pb-10 lg:px-8 lg:pt-7">
          <div className="mx-auto max-w-6xl space-y-6">

            {/* Page title (hidden on Home where the hero greets the user) */}
            {activeTab !== 'home' && (
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight">{TAB_TITLES[activeTab].title}</h1>
                  <p className="mt-0.5 text-sm text-slate-500">{TAB_TITLES[activeTab].subtitle}</p>
                </div>
                {activeTab === 'profile' && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-full" asChild>
                      <Link href={`/${athleteProfile.username}`}>
                        <Eye className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Public View</span>
                      </Link>
                    </Button>
                    <Button size="sm" className="rounded-full bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setEditOpen(true)}>
                      <Pencil className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Edit Profile</span>
                    </Button>
                  </div>
                )}
                {activeTab === 'performance' && (
                  <Button size="sm" className="shrink-0 rounded-full bg-teal-600 hover:bg-teal-700 text-white" asChild>
                    <Link href="/dashboard/add-match">
                      <Plus className="h-4 w-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Log Match</span>
                    </Link>
                  </Button>
                )}
              </div>
            )}

            {/* ── TAB: HOME ── */}
            {activeTab === 'home' && (
              <>
                {/* Hero */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-900 p-5 sm:p-7 text-white shadow-xl shadow-teal-900/10">
                  <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-teal-500/20 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                      <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-teal-400/60 ring-offset-2 ring-offset-slate-900">
                        {athleteProfile.photoUrl && <AvatarImage src={athleteProfile.photoUrl} alt={fullName} className="object-cover" />}
                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-lg font-black text-white">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-teal-200/90">{greeting},</p>
                        <h1 className="flex items-center gap-1.5 truncate text-xl sm:text-2xl font-black tracking-tight">
                          <span className="truncate">{athleteProfile.firstName}</span>
                          {athleteProfile.isVerified && <BadgeCheck className="h-5 w-5 shrink-0 text-teal-300" />}
                        </h1>
                        {subtitleLine && <p className="mt-0.5 truncate text-xs sm:text-sm text-slate-300">{subtitleLine}</p>}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-4xl sm:text-5xl font-black leading-none tracking-tighter tabular-nums">
                        {safeRenderValue(athleteProfile.compositeScoutingIndex)}
                      </div>
                      <div className="mt-1 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-teal-300">CSI Rating</div>
                    </div>
                  </div>

                  {/* Stat chips */}
                  <div className="relative mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10 backdrop-blur">
                      <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] text-slate-300">
                        <CheckCircle2 className="h-3 w-3 text-teal-300" /> Profile
                      </div>
                      <div className="mt-1 text-lg sm:text-xl font-black tabular-nums">{profileScore}%</div>
                      <div className="mt-1.5 h-1 rounded-full bg-white/15 overflow-hidden">
                        <div className="h-full rounded-full bg-teal-400" style={{ width: `${profileScore}%` }} />
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10 backdrop-blur">
                      <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] text-slate-300">
                        <Flame className={cn('h-3 w-3', matchStreak > 0 ? 'text-orange-400' : 'text-slate-500')} /> Streak
                      </div>
                      <div className="mt-1 text-lg sm:text-xl font-black tabular-nums">
                        {matchStreak}<span className="ml-0.5 text-xs font-bold text-slate-400">wk{matchStreak === 1 ? '' : 's'}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">{matchStreak > 0 ? 'Keep it going' : 'Log a match to start'}</p>
                    </div>
                    <div className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10 backdrop-blur">
                      <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] text-slate-300">
                        <Activity className="h-3 w-3 text-teal-300" /> Ready
                      </div>
                      <div className="mt-1 text-lg sm:text-xl font-black tabular-nums">{readiness}%</div>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-slate-400">
                        <span className={cn('h-1.5 w-1.5 rounded-full', availabilityDot)} /> {availabilityLabel}
                      </p>
                    </div>
                  </div>

                  {nextAction && !isComplete && (
                    <button
                      onClick={() => runAction(nextAction)}
                      className="relative mt-4 flex w-full items-center justify-between gap-3 rounded-2xl bg-teal-500 px-4 py-3 text-left text-sm font-black text-slate-950 shadow-lg shadow-teal-500/20 transition hover:bg-teal-400"
                    >
                      <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Next step: {nextAction.label}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </section>

                {/* ── Club Invitations (club-initiated invites awaiting athlete response) ── */}
                <AthleteClubInvitations athleteUid={athleteProfile.uid} athleteName={fullName} />

                {/* ── Club Affiliation Status ── */}
                {athleteProfile?.clubStatus && athleteProfile.clubName && (
                  <div className={cn(
                    'rounded-2xl border bg-white p-4 flex items-center justify-between gap-4 shadow-sm',
                    athleteProfile.clubStatus === 'active'
                      ? 'border-emerald-300/50'
                      : athleteProfile.clubStatus === 'rejected'
                      ? 'border-destructive/30'
                      : 'border-teal-300/50'
                  )}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={cn(
                        'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                        athleteProfile.clubStatus === 'active'
                          ? 'bg-emerald-500/10'
                          : athleteProfile.clubStatus === 'rejected'
                          ? 'bg-destructive/10'
                          : 'bg-teal-500/10'
                      )}>
                        {athleteProfile.clubStatus === 'active' && <ShieldCheck className="h-5 w-5 text-emerald-600" />}
                        {athleteProfile.clubStatus === 'rejected' && <ShieldX className="h-5 w-5 text-destructive" />}
                        {athleteProfile.clubStatus === 'pending' && <Clock className="h-5 w-5 text-teal-600" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="text-sm font-black truncate">{athleteProfile.clubName}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[9px] font-black uppercase tracking-widest px-1.5 shrink-0',
                              athleteProfile.clubStatus === 'active'
                                ? 'border-emerald-400 text-emerald-600'
                                : athleteProfile.clubStatus === 'rejected'
                                ? 'border-destructive/50 text-destructive'
                                : 'border-teal-400 text-teal-600'
                            )}
                          >
                            {athleteProfile.clubStatus}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {athleteProfile.clubStatus === 'active' && `You are an active squad member.`}
                          {athleteProfile.clubStatus === 'pending' && `Awaiting approval from the club admin.`}
                          {athleteProfile.clubStatus === 'rejected' && `Your request was not approved. You can apply to another club.`}
                        </p>
                      </div>
                    </div>
                    {athleteProfile.clubStatus === 'rejected' && (
                      <ReapplyClubDialog
                        athleteProfile={athleteProfile}
                        userAccount={userAccount}
                        onSuccess={() => {}}
                      />
                    )}
                  </div>
                )}

                {/* Quick actions */}
                <section>
                  {sectionTitle('Quick actions', Zap)}
                  <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {QUICK_ACTIONS.map((a) => (
                      <button
                        key={a.label}
                        onClick={() => runAction(a)}
                        className="group snap-start shrink-0 w-[140px] sm:w-auto rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm', a.tone)}>
                          <a.icon className="h-5 w-5" />
                        </span>
                        <p className="mt-3 text-sm font-black text-slate-900">{a.label}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{a.hint}</p>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Indices */}
                <section>
                  <div className="flex items-center justify-between">
                    {sectionTitle('Your indices', BarChart3)}
                    <button
                      onClick={() => selectTab('performance')}
                      className="mb-3 flex items-center gap-0.5 text-xs font-bold text-teal-700 hover:text-teal-800"
                    >
                      Full stats <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {indicesGrid}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <MatchActionCenter athleteProfile={athleteProfile} />
                    <ActivitySummary userAccount={userAccount} athleteProfile={athleteProfile} />
                  </div>
                  <div className="space-y-6">
                    <EngagementLoop profile={athleteProfile} />
                    <ProfileStrengthCard profile={athleteProfile} />
                    <TierProgressionCard profile={athleteProfile} />
                  </div>
                </div>
              </>
            )}

            {/* ── TAB: PROFILE ── */}
            {activeTab === 'profile' && (
              <>
                <ProfileHeader profile={athleteProfile} />

                {athleteProfile.username && (
                  <ShareProfileCard username={athleteProfile.username} firstName={athleteProfile.firstName} />
                )}

                <CareerHistoryCard profile={athleteProfile} />

                {athleteProfile.highlightVideoUrl && (
                  <Card className="shadow-lg border-none overflow-hidden rounded-2xl">
                    <CardHeader className="bg-neutral-950 text-white flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-2">
                          <Play className="w-4 h-4 text-teal-400 fill-teal-400" /> Highlight Reel
                        </CardTitle>
                        {athleteProfile.highlightVideoTitle && (
                          <p className="text-xs font-bold text-neutral-400 mt-0.5">{athleteProfile.highlightVideoTitle}</p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 bg-black">
                      <div className="aspect-video w-full">
                        <video
                          src={athleteProfile.highlightVideoUrl}
                          controls
                          className="w-full h-full object-contain"
                          preload="metadata"
                        />
                      </div>
                    </CardContent>
                    <VideoEngagement
                      videoId={`${athleteProfile.uid}_highlight`}
                      athleteId={athleteProfile.uid}
                      athleteName={fullName}
                      viewerName={fullName}
                      viewerRole="athlete"
                    />
                  </Card>
                )}

                {athleteProfile.showcaseVideos && athleteProfile.showcaseVideos.length > 0 && (
                  <section className="space-y-4">
                    {sectionTitle('Showcase videos', Play)}
                    {athleteProfile.showcaseVideos.map((vid) => (
                      <Card key={vid.id} className="shadow-lg border-none overflow-hidden rounded-2xl">
                        <CardHeader className="bg-neutral-950 text-white py-3 px-4 flex flex-row items-center justify-between">
                          <CardTitle className="text-sm font-black uppercase tracking-widest flex-1">
                            {vid.title || 'Showcase Clip'}
                          </CardTitle>
                          <button
                            onClick={() => setConfirmDeleteVideo(vid)}
                            className="ml-3 p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-white/10 transition-colors shrink-0"
                            title="Delete this video"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </CardHeader>
                        <CardContent className="p-0 bg-black">
                          <div className="aspect-video w-full">
                            <video
                              src={vid.url}
                              controls
                              className="w-full h-full object-contain"
                              preload="metadata"
                            />
                          </div>
                        </CardContent>
                        <VideoEngagement
                          videoId={`${athleteProfile.uid}_showcase_${vid.id}`}
                          athleteId={athleteProfile.uid}
                          athleteName={fullName}
                          viewerName={fullName}
                          viewerRole="athlete"
                        />
                      </Card>
                    ))}
                  </section>
                )}
              </>
            )}

            {/* ── TAB: PERFORMANCE ── */}
            {activeTab === 'performance' && (
              <>
                {indicesGrid}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-xl bg-white border-none overflow-hidden rounded-2xl">
                      <div className="bg-gradient-to-br from-slate-900 to-teal-900 p-5 sm:p-6 text-white flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-[0.3em] text-teal-200/80">Master Index</h3>
                          <p className="text-xs font-bold text-slate-400">Institutional Performance Projection</p>
                        </div>
                        <div className="text-right">
                          <div className="text-5xl font-black tracking-tighter leading-none">{safeRenderValue(athleteProfile.compositeScoutingIndex)}</div>
                          <div className="text-[10px] font-black uppercase text-teal-300 mt-1">CSI RATING</div>
                        </div>
                      </div>
                      <CardContent className="p-4 sm:p-8">
                        <div className="h-[340px] sm:h-[450px]">
                          <Suspense fallback={<div className="flex h-full items-center justify-center"><Skeleton className="h-64 w-64 rounded-full" /></div>}>
                            <PerformanceRadarChart profile={athleteProfile} />
                          </Suspense>
                        </div>
                      </CardContent>
                    </Card>

                    <Suspense fallback={<div className="h-[400px] w-full bg-muted/20 animate-pulse rounded-xl" />}>
                      <AttributeRadarCharts profile={athleteProfile} />
                    </Suspense>

                    {(athleteProfile.matchHistory?.length ?? 0) > 0 && (
                      <Suspense fallback={<div className="h-[320px] w-full bg-muted/20 animate-pulse rounded-xl" />}>
                        <MatchPerformanceChart matchHistory={athleteProfile.matchHistory || []} />
                      </Suspense>
                    )}

                    <Card className="shadow-sm border-slate-200/70 rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-lg font-black uppercase tracking-widest">Match Statistics</CardTitle>
                        <CardDescription>Performance breakdown by official competition.</CardDescription>
                      </CardHeader>
                      <CardContent className="overflow-x-auto">
                        <MatchStatisticsTable
                          matchHistory={athleteProfile.matchHistory || []}
                          onEdit={(id) => router.push(`/dashboard/add-match?id=${id}`)}
                          onDelete={(id) => setConfirmDeleteMatch(id)}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <AthleteTrainingSessions
                      athleteId={athleteProfile.uid}
                      affiliatedClubId={athleteProfile.affiliatedClubId}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── TAB: NETWORK ── */}
            {activeTab === 'network' && (
              <>
                {/* ── Club Announcements ── */}
                {clubAnnouncements && clubAnnouncements.length > 0 && (
                  <section>
                    {sectionTitle('Club announcements', Bell)}
                    <div className="space-y-2">
                      {clubAnnouncements.map(ann => (
                        <div key={ann.id} className="rounded-2xl border border-teal-200/60 bg-white p-4 space-y-1.5 shadow-sm">
                          <p className="font-black text-sm">{ann.title}</p>
                          <p className="text-sm text-slate-600 leading-relaxed">{ann.content}</p>
                          <div className="flex items-center justify-between pt-1">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{ann.authorName}</p>
                            <p className="text-[9px] font-bold text-slate-500">
                              {formatDistanceToNow(parseISO(ann.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <RecruitmentPipelineTracker athleteId={athleteProfile.uid} />
                    <ScoutRequests athleteId={athleteProfile.uid} />
                  </div>
                  <div className="space-y-6">
                    <ProfileViewsCard athleteId={athleteProfile.uid} />
                    <Link
                      href="/feed"
                      className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-teal-300 no-underline group"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                        <Search className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">Sports Feed</p>
                        <p className="text-sm text-slate-500">News, match updates & athlete stories</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-teal-600 transition-colors" />
                    </Link>
                  </div>
                </div>
              </>
            )}

            {/* ── TAB: MESSAGES (legacy ?tab=messages links) ── */}
            {activeTab === 'messages' && (
              <div className="rounded-3xl border border-slate-200/70 bg-white p-8 text-center shadow-sm space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black">Unified Messaging Hub</h3>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                    Connect with coaches, respond to trial invites, and discuss opportunities in real time.
                  </p>
                </div>
                <Button className="rounded-full bg-teal-600 hover:bg-teal-700 text-white" asChild>
                  <Link href="/chat">Open Chat <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            )}
          </div>

          <AlertDialog open={!!confirmDeleteVideo} onOpenChange={(o) => { if (!o) setConfirmDeleteVideo(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this showcase video?</AlertDialogTitle>
                <AlertDialogDescription>
                  <strong>{confirmDeleteVideo?.title || 'This clip'}</strong> will be permanently removed from your profile. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingVideo}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteShowcaseVideo}
                  disabled={isDeletingVideo}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeletingVideo ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Delete Video
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={!!confirmDeleteMatch} onOpenChange={(o) => { if (!o) setConfirmDeleteMatch(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this match?</AlertDialogTitle>
                <AlertDialogDescription>
                  This match entry will be permanently deleted and your performance indices will be recalculated. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingMatch}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteMatch}
                  disabled={isDeletingMatch}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeletingMatch ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Remove Match
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>

      {/* ── Controlled dialogs ── */}
      <EditProfileMediaDialog
        profile={athleteProfile}
        externalOpen={editOpen}
        onExternalOpenChange={setEditOpen}
      />
      <SupportDialog
        open={supportOpen}
        onOpenChange={setSupportOpen}
      />

      {/* ── Account Sheet (opened from the top-right avatar) ── */}
      <Sheet open={accountOpen} onOpenChange={setAccountOpen}>
        <SheetContent side="right" className="w-[88vw] max-w-sm p-0 flex flex-col gap-0 overflow-hidden">
          <SheetHeader className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-teal-900 p-6 text-left text-white">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-500/25 blur-3xl" />
            <div className="relative flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-teal-400/60 ring-offset-2 ring-offset-slate-900">
                {athleteProfile.photoUrl && <AvatarImage src={athleteProfile.photoUrl} alt={fullName} className="object-cover" />}
                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-lg font-black text-white">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <SheetTitle className="flex items-center gap-1.5 text-lg font-black text-white">
                  <span className="truncate">{fullName}</span>
                  {athleteProfile.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-teal-300" />}
                </SheetTitle>
                {athleteProfile.username && <p className="truncate text-xs text-teal-200">@{athleteProfile.username}</p>}
                {subtitleLine && <p className="mt-0.5 truncate text-[11px] text-slate-300">{subtitleLine}</p>}
              </div>
            </div>
            <div className="relative mt-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-teal-200">
                <span>Profile strength</span>
                <span className="tabular-nums text-white">{profileScore}%</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-white/15 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-300" style={{ width: `${profileScore}%` }} />
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-3">
            {[
              {
                heading: 'Profile',
                items: [
                  { label: 'View my profile', icon: User, onClick: () => selectTab('profile') },
                  { label: 'Edit profile & media', icon: Pencil, onClick: () => setEditOpen(true) },
                  { label: 'Public view', icon: Eye, href: `/${athleteProfile.username}` },
                ],
              },
              {
                heading: 'Activity',
                items: [
                  { label: 'Notifications', icon: Bell, onClick: () => setNotificationsOpen(true), badge: unreadCount },
                  { label: 'Messages', icon: MessageSquare, href: '/chat', badge: unreadMessages },
                  { label: 'Achievements', icon: Trophy, href: '/dashboard/achievements' },
                  { label: 'Injury tracker', icon: Shield, href: '/dashboard/injury-tracker' },
                ],
              },
              {
                heading: 'Account',
                items: [
                  { label: 'Settings', icon: Settings2, href: '/dashboard/settings' },
                  { label: 'Help & support', icon: Headphones, onClick: () => setSupportOpen(true) },
                ],
              },
            ].map((group) => (
              <div key={group.heading} className="mb-3">
                <p className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{group.heading}</p>
                {group.items.map((item) => {
                  const inner = (
                    <>
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-700">
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-left">{item.label}</span>
                      {countBadge((item as { badge?: number }).badge ?? 0)}
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </>
                  );
                  const cls = 'group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50';
                  return 'href' in item && item.href ? (
                    <Link key={item.label} href={item.href} onClick={() => setAccountOpen(false)} className={cls}>{inner}</Link>
                  ) : (
                    <button
                      key={item.label}
                      onClick={() => { setAccountOpen(false); (item as { onClick?: () => void }).onClick?.(); }}
                      className={cls}
                    >
                      {inner}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="border-t p-3 space-y-1" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11 rounded-xl font-bold text-sm text-slate-600 hover:text-slate-900"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
            <DeleteAccountDialog
              trigger={
                <button className="w-full flex items-center gap-3 h-11 px-4 rounded-xl font-bold text-sm text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-4 w-4" />
                  Delete account
                </button>
              }
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Quick Action Sheet (mobile + button) ── */}
      <Sheet open={quickOpen} onOpenChange={setQuickOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-none p-5"
          style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200" />
          <SheetHeader className="text-left mb-4">
            <SheetTitle className="text-lg font-black">Quick actions</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => { setQuickOpen(false); runAction(a); }}
                className="rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm active:scale-[0.98] transition"
              >
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white', a.tone)}>
                  <a.icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-black">{a.label}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{a.hint}</p>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Notifications Sheet ── */}
      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col overflow-hidden">
          <SheetHeader className="p-5 border-b shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 font-black uppercase tracking-widest text-sm">
                <Bell className="h-4 w-4 text-teal-600" />
                Notifications
                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-600 text-[10px] font-black text-white px-1.5">
                    {unreadCount}
                  </span>
                )}
              </SheetTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold shrink-0 mr-6" onClick={handleMarkAllRead}>
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto divide-y">
            {/* Notification items */}
            {(unreadNotifs && unreadNotifs.length > 0) ? (
              (unreadNotifs as any[]).map((n: any) => {
                const isMsg = n.type === 'new_message';
                const isClubInvite = n.type === 'club_invite';
                const isScoutReport = n.type === 'scout_report_saved';
                return (
                  <div key={n.id} className={`flex items-start gap-3 p-4 transition-colors ${isClubInvite ? 'bg-primary/5 hover:bg-primary/8' : isScoutReport ? 'bg-blue-500/5 hover:bg-blue-500/8' : 'hover:bg-muted/30'}`}>
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${isMsg ? 'bg-primary/10' : isClubInvite ? 'bg-primary/15' : isScoutReport ? 'bg-blue-500/15' : 'bg-muted'}`}>
                      {isMsg
                        ? <MessageSquare className="h-4 w-4 text-primary" />
                        : isClubInvite
                        ? <Building2 className="h-4 w-4 text-primary" />
                        : isScoutReport
                        ? <Sparkles className="h-4 w-4 text-blue-500" />
                        : <Bell className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      {n.actorName && (
                        <p className="text-xs font-black uppercase tracking-wide truncate">{n.actorName}</p>
                      )}
                      {isScoutReport && n.title && (
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 leading-tight">{n.title}</p>
                      )}
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">{n.message}</p>
                      {isScoutReport && n.recommendation && (
                        <span className="inline-block mt-1 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest border border-blue-200 dark:border-blue-800 rounded px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20">
                          {n.recommendation}
                        </span>
                      )}
                      {n.createdAt && (
                        <p className="text-[10px] text-muted-foreground mt-1 font-bold">
                          {formatDistanceToNow(parseISO(n.createdAt), { addSuffix: true })}
                        </p>
                      )}
                      {isClubInvite && n.clubMemberId && (
                        <p className="mt-2 text-[10px] text-primary font-black uppercase tracking-widest">
                          Check your home screen to Accept or Decline
                        </p>
                      )}
                      {!isClubInvite && n.url && (
                        <Link
                          href={n.url}
                          onClick={() => setNotificationsOpen(false)}
                          className="inline-block mt-1.5 text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                        >
                          {isMsg ? 'Reply →' : isScoutReport ? 'View profile →' : 'View →'}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="font-bold text-sm text-muted-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground">No unread notifications.</p>
              </div>
            )}
            <div className="p-4">
              <ProfileViewsCard athleteId={athleteProfile.uid} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Mobile Bottom Nav: Home · Stats · [+] · Network · Profile ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 md:hidden border-t border-slate-200/70 bg-white/90 backdrop-blur-xl shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.18)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid h-16 grid-cols-5 items-stretch">
          {[TABS[0], TABS[1], null, TABS[2], TABS[3]].map((tab, i) => {
            if (!tab) {
              return (
                <div key="fab" className="flex items-start justify-center">
                  <button
                    onClick={() => setQuickOpen(true)}
                    aria-label="Quick actions"
                    className="-mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-600/30 ring-4 ring-white transition active:scale-95"
                  >
                    {quickOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" strokeWidth={2.5} />}
                  </button>
                </div>
              );
            }
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id ?? i}
                onClick={() => selectTab(tab.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 transition-colors',
                  active ? 'text-teal-600' : 'text-slate-400 active:text-slate-600'
                )}
              >
                <span className={cn(
                  'flex h-8 w-12 items-center justify-center rounded-full transition-all',
                  active && 'bg-teal-50'
                )}>
                  <tab.icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.4 : 2} />
                </span>
                <span className={cn('text-[10px] leading-none', active ? 'font-black' : 'font-semibold')}>
                  {tab.short}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
