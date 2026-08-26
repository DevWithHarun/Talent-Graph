'use client';

import type { UserAccount, AthleteProfile, ShowcaseVideo } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import {
  LogOut, Loader2, Target, TrendingUp, ShieldAlert, BarChart3,
  Eye, Award, Layers, GitGraph, PlusCircle, Play, Zap, ArrowRight,
  CheckCircle2, Home, Pencil, Headphones, User, MoreHorizontal, Trash2,
  Plus, Flame, Clock, ShieldCheck, ShieldX, Building2, Bell, CheckCheck,
  Trophy, Settings2, Shield, Activity, Sparkles, Search, MessageSquare, Ruler, Scale, ChevronRight,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
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

type DashboardTab = 'overview' | 'recruitment' | 'progress' | 'settings';
type ActiveDialog = 'home' | 'edit' | 'support' | 'notifications';

export function AthleteDashboard({ userAccount, athleteProfile }: AthleteDashboardProps) {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // ── State ──
  const [currentTab, setCurrentTab] = useState<DashboardTab>('overview');
  const [activeTab, setActiveTab] = useState<ActiveDialog>('home'); // for dialogs (edit, support, notifications)
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [confirmDeleteVideo, setConfirmDeleteVideo] = useState<ShowcaseVideo | null>(null);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);
  const [confirmDeleteMatch, setConfirmDeleteMatch] = useState<string | null>(null);
  const [isDeletingMatch, setIsDeletingMatch] = useState(false);

  // ── Firebase Queries (unchanged) ──
  const notifsQuery = useMemoFirebase(() => (
    firestore && athleteProfile ? query(
      collection(firestore, 'notifications', athleteProfile.uid, 'items'),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50)
    ) : null
  ), [firestore, athleteProfile?.uid]);
  const { data: unreadNotifs } = useCollection<{ id: string; isRead: boolean }>(notifsQuery);

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

  const pendingConfirmQuery = useMemoFirebase(() => (
    firestore && athleteProfile ? query(
      collection(firestore, 'match_confirmations'),
      where('athleteId', '==', athleteProfile.uid),
      where('status', '==', 'pending')
    ) : null
  ), [firestore, athleteProfile?.uid]);
  const { data: pendingConfirmations } = useCollection<{ id: string }>(pendingConfirmQuery);

  const unreadCount = (unreadNotifs?.length ?? 0) + (pendingConfirmations?.length ?? 0);

  // ── Handlers (unchanged) ──
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
      // silent
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

  // ── Computed values (unchanged) ──
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
      ? 'bg-green-500/10 border-green-400/30 text-green-700'
      : availabilityLabel === 'Doubtful'
      ? 'bg-amber-500/10 border-amber-400/30 text-amber-700'
      : availabilityLabel === 'Injured'
      ? 'bg-orange-500/10 border-orange-400/30 text-orange-700'
      : 'bg-red-500/10 border-red-400/30 text-red-700';

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

  const bannerBg = isComplete
    ? 'bg-green-500/10 border-green-500/20'
    : profileScore >= 50
    ? 'bg-primary/5 border-primary/20'
    : 'bg-yellow-500/10 border-yellow-500/20';
  const BannerIcon = isComplete ? CheckCircle2 : Zap;
  const bannerIconColor = isComplete ? 'text-green-500' : profileScore >= 50 ? 'text-primary' : 'text-yellow-500';
  const bannerTopAction = !athleteProfile.photoUrl
    ? null
    : attributeCount < 30
    ? { label: 'Rate Attributes', href: '/dashboard/update-attributes' }
    : verifiedApps === 0
    ? { label: 'Log a Match', href: '/dashboard/add-match' }
    : null;

  // ── Tab definitions ──
  const tabs: { id: DashboardTab; label: string; icon: LucideIcon }[] = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'recruitment', label: 'Recruitment', icon: Target },
    { id: 'progress', label: 'Progress', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings2 },
  ];

  // ── Render functions for each tab (unchanged from previous version) ──
  const renderOverview = () => ( /* ... same as before ... */ );
  const renderRecruitment = () => ( /* ... same as before ... */ );
  const renderProgress = () => ( /* ... same as before ... */ );
  const renderSettings = () => ( /* ... same as before ... */ );

  // ── Main Render ──
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 text-foreground">

      {/* ── User Info Modal ── (unchanged) */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-primary/40">
                {athleteProfile.photoUrl ? (
                  <img src={athleteProfile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-xl font-black text-primary">
                    {athleteProfile.firstName?.[0]}{athleteProfile.lastName?.[0]}
                  </div>
                )}
              </div>
              <div>
                <span className="text-xl font-black">{athleteProfile.firstName} {athleteProfile.lastName}</span>
                {athleteProfile.isVerified && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-1">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Age</span><br /><span className="font-semibold">{athleteProfile.age || '—'} yrs</span></div>
                <div><span className="text-muted-foreground">Club</span><br /><span className="font-semibold">{athleteProfile.clubName || '—'}</span></div>
                <div><span className="text-muted-foreground">Position</span><br /><span className="font-semibold">{athleteProfile.position || '—'}</span></div>
                <div><span className="text-muted-foreground">Height</span><br /><span className="font-semibold">{athleteProfile.heightCm ? `${athleteProfile.heightCm} cm` : '—'}</span></div>
                <div><span className="text-muted-foreground">Weight</span><br /><span className="font-semibold">{athleteProfile.weightKg ? `${athleteProfile.weightKg} kg` : '—'}</span></div>
                <div><span className="text-muted-foreground">Dominant Foot</span><br /><span className="font-semibold">Right</span></div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* ── Top Header ── */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-[72px] items-center gap-3 md:hidden">
            {/* Avatar with photo – clickable */}
            <button
              onClick={() => setUserModalOpen(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full overflow-hidden border border-primary/30 hover:ring-2 hover:ring-primary/50 transition-all"
            >
              {athleteProfile.photoUrl ? (
                <img src={athleteProfile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-sm font-black text-primary">
                  {athleteProfile.firstName?.[0]}{athleteProfile.lastName?.[0]}
                </div>
              )}
            </button>
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                aria-label="Search"
                placeholder="Search…"
                className="h-11 w-full rounded-full border bg-background pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <button className="relative shrink-0 text-foreground" aria-label="Messages">
              <MessageSquare className="h-6 w-6" />
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary" />
            </button>
            <button
              className="relative shrink-0 text-foreground"
              aria-label="Notifications"
              onClick={() => setActiveTab('notifications')}
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-primary-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
          <div className="hidden h-14 items-center justify-between md:flex md:h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary shrink-0" />
              <h1 className="text-base md:text-xl font-black tracking-tight uppercase">Talent Graph</h1>
              <Badge variant="outline" className="hidden md:block text-[9px] font-black uppercase tracking-widest">
                Athlete Console
              </Badge>
            </div>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-muted/40 mr-2">
                <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-green-500' : profileScore >= 50 ? 'bg-primary' : 'bg-yellow-500'}`} />
                <span className="text-xs font-black">{profileScore}%</span>
                <span className="text-[10px] text-muted-foreground font-medium">profile strength</span>
              </div>
              {matchStreak > 0 && (
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-orange-400/40 bg-orange-500/10 mr-2">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-xs font-black text-orange-600">{matchStreak}w</span>
                  <span className="text-[10px] text-orange-500/70 font-medium">streak</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
                onClick={() => setActiveTab('notifications')}
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
              <SupportDialog />
              <EditProfileMediaDialog profile={athleteProfile} />
              <Button variant="outline" size="sm" asChild>
                <Link href={`/${athleteProfile.username}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Public View
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/injury-tracker">
                  <Shield className="mr-2 h-4 w-4" />
                  Injuries
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/achievements">
                  <Trophy className="mr-2 h-4 w-4" />
                  Badges
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/settings">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
              <DeleteAccountDialog />
              <Button onClick={handleSignOut} variant="ghost" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>

            {/* Mobile right: completion % + more sheet */}
            <div className="flex md:hidden items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-muted/40">
                <div className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-green-500' : profileScore >= 50 ? 'bg-primary' : 'bg-yellow-500'}`} />
                <span className="text-[11px] font-black tabular-nums">{profileScore}%</span>
              </div>
              {matchStreak > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-orange-400/40 bg-orange-500/10">
                  <Flame className="h-3 w-3 text-orange-500" />
                  <span className="text-[11px] font-black text-orange-600 tabular-nums">{matchStreak}w</span>
                </div>
              )}

              <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 p-0 flex flex-col">
                  <SheetHeader className="p-5 border-b text-left">
                    <SheetTitle className="flex items-center gap-2 font-black uppercase tracking-widest text-sm">
                      <Zap className="h-4 w-4 text-primary" />
                      {athleteProfile.firstName} {athleteProfile.lastName}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 p-4 space-y-1">
                    <Button variant="ghost" className="w-full justify-start gap-3 h-12 font-bold text-sm" asChild>
                      <Link href={`/${athleteProfile.username}`} onClick={() => setMoreOpen(false)}>
                        <Eye className="h-4 w-4 text-primary" />
                        Public View
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-12 font-bold text-sm"
                      asChild
                    >
                      <Link href="/onboarding/metrics" onClick={() => setMoreOpen(false)}>
                        <Layers className="h-4 w-4 text-primary" />
                        Update Master Index
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-12 font-bold text-sm"
                      asChild
                    >
                      <Link href="/dashboard/update-attributes" onClick={() => setMoreOpen(false)}>
                        <GitGraph className="h-4 w-4 text-primary" />
                        Refine Attributes
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-12 font-bold text-sm"
                      asChild
                    >
                      <Link href="/dashboard/add-match" onClick={() => setMoreOpen(false)}>
                        <PlusCircle className="h-4 w-4 text-primary" />
                        Log a Match
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-12 font-bold text-sm"
                      asChild
                    >
                      <Link href="/dashboard/injury-tracker" onClick={() => setMoreOpen(false)}>
                        <Shield className="h-4 w-4 text-primary" />
                        Injury Tracker
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-12 font-bold text-sm"
                      asChild
                    >
                      <Link href="/dashboard/achievements" onClick={() => setMoreOpen(false)}>
                        <Trophy className="h-4 w-4 text-primary" />
                        Achievements
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-12 font-bold text-sm"
                      asChild
                    >
                      <Link href="/dashboard/settings" onClick={() => setMoreOpen(false)}>
                        <Settings2 className="h-4 w-4 text-primary" />
                        Settings
                      </Link>
                    </Button>
                  </div>
                  <div className="p-4 border-t space-y-1">
                    <DeleteAccountDialog
                      trigger={
                        <button className="w-full flex items-center gap-3 h-12 px-3 rounded-xl font-bold text-sm text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="h-4 w-4" />
                          Delete Account
                        </button>
                      }
                    />
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-12 font-bold text-sm text-muted-foreground hover:text-destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* ── Desktop Tab Navigation ── */}
      <div className="hidden md:block border-b bg-card/50 sticky top-[65px] z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap px-5 py-3 text-sm font-semibold border-b-2 transition-colors shrink-0',
                  currentTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="container mx-auto space-y-5 p-4 sm:p-6 lg:space-y-8 lg:p-8">
        {currentTab === 'overview' && renderOverview()}
        {currentTab === 'recruitment' && renderRecruitment()}
        {currentTab === 'progress' && renderProgress()}
        {currentTab === 'settings' && renderSettings()}
      </main>

      {/* ── Notifications Sheet ── */}
      <Sheet open={activeTab === 'notifications'} onOpenChange={(open) => { if (!open) setActiveTab('home'); }}>
        <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col overflow-hidden">
          <SheetHeader className="p-5 border-b shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 font-black uppercase tracking-widest text-sm">
                <Bell className="h-4 w-4 text-primary" />
                Notifications
                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground px-1.5">
                    {unreadCount}
                  </span>
                )}
              </SheetTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold shrink-0" onClick={handleMarkAllRead}>
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto divide-y">
            {(unreadNotifs && unreadNotifs.length > 0) ? (
              (unreadNotifs as any[]).map((n: any) => {
                const isMsg = n.type === 'new_message';
                const isClubInvite = n.type === 'club_invite';
                const isScoutReport = n.type === 'scout_report_saved';
                return (
                  <div key={n.id} className={`flex items-start gap-3 p-4 transition-colors ${isClubInvite ? 'bg-primary/5 hover:bg-primary/8' : isScoutReport ? 'bg-blue-500/5 hover:bg-blue-500/8' : 'hover:bg-muted/30'}`}>
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${isMsg ? 'bg-primary/10' : isClubInvite ? 'bg-primary/15' : isScoutReport ? 'bg-blue-500/15' : 'bg-muted'}`}>
                      {isMsg
                        ? <Bell className="h-4 w-4 text-primary" />
                        : isClubInvite
                        ? <Building2 className="h-4 w-4 text-primary" />
                        : isScoutReport
                        ? <Sparkles className="h-4 w-4 text-blue-500" />
                        : <Bell className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      {n.actorName && <p className="text-xs font-black uppercase tracking-wide truncate">{n.actorName}</p>}
                      {isScoutReport && n.title && <p className="text-xs font-bold text-blue-600 dark:text-blue-400 leading-tight">{n.title}</p>}
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
                          onClick={() => setActiveTab('home')}
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

      {/* ── Controlled dialogs ── */}
      <EditProfileMediaDialog
        profile={athleteProfile}
        externalOpen={activeTab === 'edit'}
        onExternalOpenChange={(open) => { if (!open) setActiveTab('home'); }}
      />
      <SupportDialog
        open={activeTab === 'support'}
        onOpenChange={(open) => { if (!open) setActiveTab('home'); }}
      />

      {/* ── Quick-Action FAB ── */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2 md:bottom-6">
        <div
          className={cn(
            'flex flex-col items-end gap-2 transition-all duration-200 origin-bottom',
            fabOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
          )}
        >
          <button
            onClick={() => { setFabOpen(false); router.push('/dashboard/add-match'); }}
            className="flex items-center gap-2 rounded-full bg-background border shadow-md px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Award className="h-4 w-4 text-amber-500" />
            Log a Match
          </button>
          <button
            onClick={() => { setFabOpen(false); router.push('/dashboard/update-attributes'); }}
            className="flex items-center gap-2 rounded-full bg-background border shadow-md px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <BarChart3 className="h-4 w-4 text-blue-500" />
            Rate Attributes
          </button>
          <button
            onClick={() => { setFabOpen(false); router.push('/onboarding/metrics'); }}
            className="flex items-center gap-2 rounded-full bg-background border shadow-md px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Zap className="h-4 w-4 text-green-500" />
            Update Index
          </button>
          <button
            onClick={() => { setFabOpen(false); router.push('/dashboard/injury-tracker'); }}
            className="flex items-center gap-2 rounded-full bg-background border shadow-md px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Shield className="h-4 w-4 text-red-500" />
            Injury Tracker
          </button>
        </div>
        <button
          onClick={() => setFabOpen(v => !v)}
          className={cn(
            'h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200',
            fabOpen
              ? 'bg-foreground text-background rotate-45'
              : 'bg-primary text-primary-foreground hover:scale-105 active:scale-95'
          )}
          aria-label={fabOpen ? 'Close quick actions' : 'Quick actions'}
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
      {fabOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setFabOpen(false)} />
      )}

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden h-16 items-stretch border-t bg-background/95 backdrop-blur shadow-[0_-1px_12px_rgba(0,0,0,0.08)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 transition-colors relative',
              currentTab === tab.id ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {currentTab === tab.id && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
            )}
            <tab.icon className={cn('h-5 w-5 transition-transform', currentTab === tab.id && 'scale-110')} />
            <span className={cn('text-[10px] font-bold uppercase tracking-wide', currentTab === tab.id && 'font-black')}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

      {/* ── Delete Dialogs (unchanged) ── */}
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
    </div>
  );
}
