'use client';

import type { UserAccount, AthleteProfile, ShowcaseVideo } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import {
  LogOut, Loader2, Target, TrendingUp, ShieldAlert, BarChart3,
  Eye, Award, Layers, GitGraph, PlusCircle, Play, Zap, ArrowRight,
  CheckCircle2, Home, Pencil, Headphones, User, MoreHorizontal, Trash2,
  Plus, Flame, Clock, ShieldCheck, ShieldX, Building2, Bell, CheckCheck,
  Trophy, Settings2, Shield, Activity, Sparkles, Search, MessageSquare, MapPin, Ruler, Scale, ChevronRight,
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
import { lazy, Suspense, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { calculateTalentGraphScore } from '@/lib/scoring-calculator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { VideoEngagement } from './video-engagement';
import { ReapplyClubDialog } from './reapply-club-dialog';
import { AthleteClubInvitations } from '@/components/club/athlete-club-invitations';
import { AthleteTrainingSessions } from './athlete-training-sessions';
import { Progress } from '@/components/ui/progress';
import { MarketplaceSettings } from './marketplace-settings';
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

type GlobalTab = 'home' | 'edit' | 'support' | 'notifications';
type SectionTab = 'overview' | 'recruitment' | 'insights';

export function AthleteDashboard({ userAccount, athleteProfile }: AthleteDashboardProps) {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [activeGlobalTab, setActiveGlobalTab] = useState<GlobalTab>('home');
  const [activeSectionTab, setActiveSectionTab] = useState<SectionTab>('overview');
  
  const [moreOpen, setMoreOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [confirmDeleteVideo, setConfirmDeleteVideo] = useState<ShowcaseVideo | null>(null);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);
  const [confirmDeleteMatch, setConfirmDeleteMatch] = useState<string | null>(null);
  const [isDeletingMatch, setIsDeletingMatch] = useState(false);
  const { toast } = useToast();

  // Live unread notification count
  const notifsQuery = useMemoFirebase(() => (
    firestore && athleteProfile ? query(
      collection(firestore, 'notifications', athleteProfile.uid, 'items'),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50)
    ) : null
  ), [firestore, athleteProfile?.uid]);
  const { data: unreadNotifs } = useCollection<{ id: string; isRead: boolean }>(notifsQuery);

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

  // Pending match stat confirmations
  const pendingConfirmQuery = useMemoFirebase(() => (
    firestore && athleteProfile ? query(
      collection(firestore, 'match_confirmations'),
      where('athleteId', '==', athleteProfile.uid),
      where('status', '==', 'pending')
    ) : null
  ), [firestore, athleteProfile?.uid]);
  const { data: pendingConfirmations } = useCollection<{ id: string }>(pendingConfirmQuery);

  const unreadCount = (unreadNotifs?.length ?? 0) + (pendingConfirmations?.length ?? 0);

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
      // silent failure
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
      <div className="flex h-screen items-center justify-center bg-[#0d0d0d] text-slate-100" suppressHydrationWarning>
        <div className="text-center">
          <p className="text-lg mb-4 font-medium text-slate-300">Finalizing your profile setup...</p>
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-500" />
        </div>
      </div>
    );
  }

  const indices = [
    { label: 'Performance', value: athleteProfile.performanceIndex, icon: BarChart3 },
    { label: 'Efficiency', value: athleteProfile.efficiencyIndex, icon: Target },
    { label: 'Consistency', value: athleteProfile.consistencyIndex, icon: TrendingUp },
    { label: 'Risk', value: athleteProfile.riskIndex, icon: ShieldAlert },
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
  const availabilityTone =
    availabilityLabel === 'Available'
      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
      : availabilityLabel === 'Doubtful'
      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
      : availabilityLabel === 'Injured'
      ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
      : 'bg-rose-500/10 border-rose-500/20 text-rose-400';

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

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-slate-100 pb-20 md:pb-12">

      {/* ── Top App Header ── */}
      <header className="sticky top-0 z-30 border-b border-[#262626] bg-[#121212]/90 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Mobile Bar */}
          <div className="flex h-16 items-center gap-3 md:hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1e1e1e] border border-[#262626] text-sm font-bold text-slate-200">
              {(athleteProfile.firstName?.[0] || 'A')}{(athleteProfile.lastName?.[0] || '')}
            </div>
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input aria-label="Search players, clubs, scouts" placeholder="Search..." className="h-10 w-full rounded-full border border-[#262626] bg-[#1a1a1a] pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-slate-500" />
            </div>
            <button className="relative shrink-0 text-slate-300 p-2" aria-label="Notifications" onClick={() => setActiveGlobalTab('notifications')}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-black text-black">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
          </div>

          {/* Desktop Bar */}
          <div className="hidden h-16 items-center justify-between md:flex">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-emerald-400 shrink-0" />
              <h1 className="text-base md:text-lg font-black tracking-wider uppercase text-slate-100">Talent Graph</h1>
              <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-[#333] text-slate-400">
                Athlete Console
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#262626] bg-[#161616]">
                <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-emerald-400' : profileScore >= 50 ? 'bg-amber-400' : 'bg-slate-500'}`} />
                <span className="text-xs font-bold text-slate-200">{profileScore}%</span>
                <span className="text-[10px] text-slate-400 font-medium">strength</span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 text-slate-300 hover:text-white hover:bg-[#1f1f1f]"
                onClick={() => setActiveGlobalTab('notifications')}
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-black">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
              <SupportDialog />
              <EditProfileMediaDialog profile={athleteProfile} />
              <Button variant="outline" size="sm" className="border-[#333] bg-[#161616] text-slate-300 hover:bg-[#222]" asChild>
                <Link href={`/${athleteProfile.username}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Public View
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-[#1f1f1f]" asChild>
                <Link href="/dashboard/settings">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
              <Button onClick={handleSignOut} variant="ghost" size="sm" className="text-slate-400 hover:text-rose-400 hover:bg-[#1f1f1f]">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Sub-Navigation Tabs (3-Tab Architecture) ── */}
      <div className="border-b border-[#262626] bg-[#121212]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 sm:gap-6 overflow-x-auto">
            {([
              { id: 'overview' as SectionTab, label: 'Overview & Portfolio', icon: User },
              { id: 'recruitment' as SectionTab, label: 'Recruitment & Pipeline', icon: Award },
              { id: 'insights' as SectionTab, label: 'Insights & Growth', icon: Activity },
            ] as { id: SectionTab; label: string; icon: LucideIcon }[]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSectionTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap py-3 px-1 text-xs sm:text-sm font-bold border-b-2 transition-colors shrink-0',
                  activeSectionTab === tab.id
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                )}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ── Compact Top Hero Banner ── */}
        <section className="rounded-xl border border-[#262626] bg-[#161616] p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-[#333] bg-[#222] flex items-center justify-center text-xl font-black text-slate-200 overflow-hidden shrink-0">
                {athleteProfile.photoUrl ? (
                  <img src={athleteProfile.photoUrl} alt="Athlete" className="h-full w-full object-cover" />
                ) : (
                  <span>{(athleteProfile.firstName?.[0] || 'A')}{(athleteProfile.lastName?.[0] || '')}</span>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-100">{athleteProfile.firstName} {athleteProfile.lastName}</h1>
                  <Badge variant="outline" className="border-slate-700 bg-slate-800/50 text-slate-300 text-[10px]">
                    {athleteProfile.readinessTier || 'PRO'}
                  </Badge>
                  {athleteProfile.isVerified && (
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {athleteProfile.clubName || 'Free Agent'} · {athleteProfile.position || 'Player'}
                </p>
                <div className="flex items-center gap-3 pt-1 text-xs text-slate-300">
                  <span><strong>HT:</strong> {athleteProfile.heightCm ? `${athleteProfile.heightCm} cm` : '—'}</span>
                  <span>•</span>
                  <span><strong>WT:</strong> {athleteProfile.weightKg ? `${athleteProfile.weightKg} kg` : '—'}</span>
                </div>
              </div>
            </div>

            {/* Quick Hero Actions & Readiness Pill */}
            <div className="flex flex-wrap items-center gap-3 border-t border-[#262626] pt-3 md:border-t-0 md:pt-0">
              <div className={cn("px-3 py-2 rounded-lg border text-xs flex items-center gap-2", availabilityTone)}>
                <div className="w-2 h-2 rounded-full bg-current" />
                <div>
                  <span className="font-bold block leading-none">{availabilityLabel}</span>
                  <span className="text-[10px] opacity-80">{readiness}% Readiness</span>
                </div>
              </div>
              <Button size="sm" className="bg-emerald-500 text-black hover:bg-emerald-400 font-bold gap-2 text-xs" asChild>
                <Link href="/dashboard/add-match">
                  <PlusCircle className="h-4 w-4" /> Log Match
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── TAB 1: OVERVIEW & PORTFOLIO ── */}
        {activeSectionTab === 'overview' && (
          <div className="space-y-8">
            
            {/* Quick Performance Indices Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {indices.map((idx) => (
                <Card key={idx.label} className="border-[#262626] bg-[#161616] text-slate-100">
                  <CardHeader className="p-3 sm:p-4 pb-1 space-y-0 flex flex-row items-center justify-between">
                    <CardTitle className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{idx.label}</CardTitle>
                    <idx.icon className="h-4 w-4 text-slate-500" />
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-black">{safeRenderValue(idx.value)}</span>
                      <span className="text-[10px] text-slate-500 font-bold">/ 100</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Master Index Chart */}
            <Card className="border-[#262626] bg-[#161616] text-slate-100">
              <div className="border-b border-[#262626] p-4 sm:p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Master Index</h3>
                  <p className="text-sm font-semibold text-slate-200">Institutional Performance Projection</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-emerald-400">{safeRenderValue(athleteProfile.compositeScoutingIndex)}</div>
                  <div className="text-[9px] font-bold uppercase text-slate-400">CSI RATING</div>
                </div>
              </div>
              <CardContent className="p-4 sm:p-6">
                <div className="h-[380px]">
                  <Suspense fallback={<Skeleton className="h-full w-full bg-[#222]" />}>
                    <PerformanceRadarChart profile={athleteProfile} />
                  </Suspense>
                </div>
              </CardContent>
            </Card>

            {/* Attributes Breakdown */}
            <Suspense fallback={<Skeleton className="h-64 w-full bg-[#161616]" />}>
              <AttributeRadarCharts profile={athleteProfile} />
            </Suspense>

            {/* Match Statistics & History */}
            <Card className="border-[#262626] bg-[#161616] text-slate-100">
              <CardHeader>
                <CardTitle className="text-base font-bold uppercase tracking-wider text-slate-200">Match History</CardTitle>
                <CardDescription className="text-slate-400 text-xs">Official competition performances.</CardDescription>
              </CardHeader>
              <CardContent>
                <MatchStatisticsTable
                  matchHistory={athleteProfile.matchHistory || []}
                  onEdit={(id) => router.push(`/dashboard/add-match?id=${id}`)}
                  onDelete={(id) => setConfirmDeleteMatch(id)}
                />
              </CardContent>
            </Card>

            {/* Career History */}
            <CareerHistoryCard profile={athleteProfile} />

            {/* Highlight Reel */}
            {athleteProfile.highlightVideoUrl && (
              <Card className="border-[#262626] bg-[#161616] overflow-hidden text-slate-100">
                <CardHeader className="border-b border-[#262626] py-3 px-4">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-200">
                    <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" /> Highlight Reel
                  </CardTitle>
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
              </Card>
            )}
          </div>
        )}

        {/* ── TAB 2: RECRUITMENT & PIPELINE ── */}
        {activeSectionTab === 'recruitment' && (
          <div className="space-y-8">
            <RecruitmentPipelineTracker athleteId={athleteProfile.uid} />
            <ScoutRequests athleteId={athleteProfile.uid} />
            <MarketplaceSettings profile={athleteProfile} />
            <AthleteTrainingSessions
              athleteId={athleteProfile.uid}
              affiliatedClubId={athleteProfile.affiliatedClubId}
            />
          </div>
        )}

        {/* ── TAB 3: INSIGHTS & GROWTH ── */}
        {activeSectionTab === 'insights' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <EngagementLoop profile={athleteProfile} />
              <ProfileStrengthCard profile={athleteProfile} />
              <TierProgressionCard profile={athleteProfile} />
            </div>
            <div className="space-y-8">
              <ProfileViewsCard athleteId={athleteProfile.uid} />
              <ActivitySummary userAccount={userAccount} athleteProfile={athleteProfile} />
            </div>
          </div>
        )}

      </main>

      {/* ── Deletion Alerts ── */}
      <AlertDialog open={!!confirmDeleteMatch} onOpenChange={(o) => { if (!o) setConfirmDeleteMatch(null); }}>
        <AlertDialogContent className="bg-[#161616] border-[#262626] text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this match?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This match entry will be deleted and your performance indices recalculated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingMatch} className="border-[#333] bg-[#222]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMatch}
              disabled={isDeletingMatch}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {isDeletingMatch ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bottom Mobile Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden h-16 items-stretch border-t border-[#262626] bg-[#121212]/95 backdrop-blur">
        <button
          onClick={() => setActiveGlobalTab('home')}
          className={cn('flex flex-1 flex-col items-center justify-center gap-1', activeGlobalTab === 'home' ? 'text-emerald-400' : 'text-slate-400')}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase">Home</span>
        </button>

        <Link
          href={`/${athleteProfile.username}`}
          className="flex flex-1 flex-col items-center justify-center gap-1 text-slate-400"
        >
          <Eye className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase">Public</span>
        </Link>

        <button
          onClick={() => setActiveGlobalTab('notifications')}
          className={cn('flex flex-1 flex-col items-center justify-center gap-1 relative', activeGlobalTab === 'notifications' ? 'text-emerald-400' : 'text-slate-400')}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-black">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="text-[10px] font-bold uppercase">Alerts</span>
        </button>

        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 text-slate-400"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase">More</span>
        </button>
      </nav>
    </div>
  );
}
