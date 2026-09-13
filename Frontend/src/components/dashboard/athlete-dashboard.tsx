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
  Heart, AlertCircle, MapPin,
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
import { VerifiedPassportCard } from './verified-passport-card';

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

type DashboardTab = 'overview' | 'health' | 'proof' | 'showcase';
type DialogTab = 'home' | 'edit' | 'support' | 'notifications';

export function AthleteDashboard({ userAccount, athleteProfile }: AthleteDashboardProps) {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // ── State ──
  const [currentTab, setCurrentTab] = useState<DashboardTab>('overview');
  const [dialogTab, setDialogTab] = useState<DialogTab>('home');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [confirmDeleteVideo, setConfirmDeleteVideo] = useState<ShowcaseVideo | null>(null);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);
  const [confirmDeleteMatch, setConfirmDeleteMatch] = useState<string | null>(null);
  const [isDeletingMatch, setIsDeletingMatch] = useState(false);

  // ── Firebase Queries ──
  const notifsQuery = useMemoFirebase(() => (
    firestore && athleteProfile ? query(
      collection(firestore, 'notifications', athleteProfile.uid, 'items'),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50)
    ) : null
  ), [firestore, athleteProfile?.uid]);
  const { data: unreadNotifs } = useCollection<{ id: string; isRead: boolean; type?: string }>(notifsQuery);

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
  const showVerificationReminder = !athleteProfile?.isVerified;

  // ── Handlers ──
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

  // ── Computed values ──
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

  // ── Tab definitions — Insurance passport + Showcase split
  const tabs: { id: DashboardTab; label: string; icon: LucideIcon }[] = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'health', label: 'Health', icon: Heart },
    { id: 'proof', label: 'Proof', icon: ShieldCheck },
    { id: 'showcase', label: 'Showcase', icon: Play },
  ];

  // ── Render functions — world-class restyle (re-added removed features)
  const renderOverview = () => (
    <div className="space-y-8">
      {/* Verified Passport — insurer turning point */}
      <VerifiedPassportCard profile={athleteProfile} />

      {/* World-class Profile Completion — re-added with premium styling */}
      <div className={cn('relative overflow-hidden rounded-2xl border p-5 backdrop-blur shadow-sm', isComplete ? 'bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10 border-green-500/20' : profileScore >= 50 ? 'bg-gradient-to-br from-primary/10 via-indigo-500/5 to-violet-500/10 border-primary/20' : 'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-yellow-500/10 border-amber-500/20')}>
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner', isComplete ? 'bg-green-500 text-white' : profileScore >= 50 ? 'bg-primary text-primary-foreground' : 'bg-amber-500 text-white')}>
              <BannerIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black tracking-tight">{isComplete ? 'Profile Complete' : `Profile ${profileScore}% Complete`}</span>
                <Badge variant="outline" className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 backdrop-blur', isComplete ? 'border-green-400 text-green-700 bg-green-500/10' : profileScore >= 50 ? 'border-primary/40 text-primary bg-primary/10' : 'border-amber-400 text-amber-700 bg-amber-500/10')}>
                  {isComplete ? 'Fully Indexed' : profileScore >= 50 ? 'Indexing' : 'Incomplete'}
                </Badge>
                {isComplete && <Sparkles className="h-3.5 w-3.5 text-green-600" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {isComplete ? 'Fully optimised — visible to scouts + insurer-ready.' : profileScore >= 75 ? 'Almost there — finish to maximise discovery + insurance.' : profileScore >= 50 ? 'Good start — complete to boost visibility.' : 'Add data to unlock scouting + insurance.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <div className="w-28 h-2.5 rounded-full bg-background/60 backdrop-blur overflow-hidden border shadow-inner">
                  <div className={cn('h-full rounded-full transition-all duration-1000 ease-out', isComplete ? 'bg-gradient-to-r from-green-500 to-emerald-500' : profileScore >= 50 ? 'bg-gradient-to-r from-primary to-indigo-500' : 'bg-gradient-to-r from-amber-500 to-orange-500')} style={{ width: `${profileScore}%` }} />
                </div>
                <span className="text-xs font-black tabular-nums">{profileScore}/100</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{isComplete ? 'Elite' : profileScore >= 75 ? 'Advanced' : 'Building'}</span>
            </div>
            {bannerTopAction && !isComplete && <Button size="sm" className="rounded-full shadow-md font-black text-xs h-8 px-4" asChild><Link href={bannerTopAction.href}>{bannerTopAction.label} <ArrowRight className="w-3 h-3 ml-1" /></Link></Button>}
          </div>
        </div>
      </div>

      {/* Height/Weight — re-added as world-class compact stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
          <CardContent className="relative p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/60"><Ruler className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-widest">Height</span></div>
              <Badge variant="outline" className="bg-white/10 border-white/20 text-white text-[9px]">Verified</Badge>
            </div>
            <p className="text-2xl font-black tracking-tight mt-2">{athleteProfile.heightCm ? `${athleteProfile.heightCm}` : '--'} <span className="text-sm font-bold text-white/60">cm</span></p>
            <p className="text-[10px] text-white/50 mt-1">Elite avg 178cm</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent" />
          <CardContent className="relative p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/60"><Scale className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-widest">Weight</span></div>
              <Badge variant="outline" className="bg-white/10 border-white/20 text-white text-[9px]">Verified</Badge>
            </div>
            <p className="text-2xl font-black tracking-tight mt-2">{athleteProfile.weightKg ? `${athleteProfile.weightKg}` : '--'} <span className="text-sm font-bold text-white/60">kg</span></p>
            <p className="text-[10px] text-white/50 mt-1">Peak 72–80kg</p>
          </CardContent>
        </Card>
      </div>

      {/* Squad Readiness (desktop) — kept as secondary, insurer uses Health tab */}
      <div className={`hidden rounded-xl border p-4 md:block ${availabilityTone}`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Squad Readiness</p>
            <h2 className="text-sm font-black uppercase tracking-widest">{availabilityLabel}</h2>
            <p className="text-xs mt-1 opacity-80">Match readiness for the next fixture.</p>
          </div>
          <div className="min-w-[180px] w-full max-w-xs">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-1">
              <span>Readiness</span>
              <span>{readiness}%</span>
            </div>
            <Progress value={readiness} className="h-2" />
          </div>
        </div>
      </div>

      {/* Mobile hero */}
      <section className="md:hidden space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              <Ruler className="h-4 w-4" /> Height
            </div>
            <p className="text-lg font-bold">{athleteProfile.heightCm ? `${athleteProfile.heightCm} cm` : '—'}</p>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              <Scale className="h-4 w-4" /> Weight
            </div>
            <p className="text-lg font-bold">{athleteProfile.weightKg ? `${athleteProfile.weightKg} kg` : '—'}</p>
          </div>
        </div>
        <div className={`rounded-2xl border p-5 ${availabilityTone}`}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wide opacity-80">Squad readiness</p>
            <span className="rounded-full bg-background/70 px-2.5 py-1 text-[11px] font-medium">Next fixture</span>
          </div>
          <div className="mt-1 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold leading-tight">{availabilityLabel}</h2>
              <p className="mt-1 text-sm opacity-80">Match readiness for the next fixture.</p>
            </div>
            <strong className="text-lg">{readiness}%</strong>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-background/80">
            <div className="h-full rounded-full bg-primary" style={{ width: `${readiness}%` }} />
          </div>
        </div>
        <Link href="/dashboard/add-match" className="flex h-14 items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition">
          Log match <ChevronRight className="h-5 w-5" />
        </Link>
      </section>

      {/* Club Invitations & Affiliation */}
      <AthleteClubInvitations
        athleteUid={athleteProfile.uid}
        athleteName={`${athleteProfile.firstName} ${athleteProfile.lastName}`}
      />
      {athleteProfile?.clubStatus && athleteProfile.clubName && (
        <div className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${
          athleteProfile.clubStatus === 'active'
            ? 'bg-green-500/5 border-green-400/30'
            : athleteProfile.clubStatus === 'rejected'
            ? 'bg-destructive/5 border-destructive/20'
            : 'bg-primary/5 border-primary/20'
        }`}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
              athleteProfile.clubStatus === 'active'
                ? 'bg-green-500/15'
                : athleteProfile.clubStatus === 'rejected'
                ? 'bg-destructive/10'
                : 'bg-primary/10'
            }`}>
              {athleteProfile.clubStatus === 'active' && <ShieldCheck className="h-5 w-5 text-green-600" />}
              {athleteProfile.clubStatus === 'rejected' && <ShieldX className="h-5 w-5 text-destructive" />}
              {athleteProfile.clubStatus === 'pending' && <Clock className="h-5 w-5 text-primary" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-black truncate">{athleteProfile.clubName}</span>
                <Badge
                  variant="outline"
                  className={`text-[9px] font-black uppercase tracking-widest px-1.5 shrink-0 ${
                    athleteProfile.clubStatus === 'active'
                      ? 'border-green-400 text-green-600'
                      : athleteProfile.clubStatus === 'rejected'
                      ? 'border-destructive/50 text-destructive'
                      : 'border-primary/40 text-primary'
                  }`}
                >
                  {athleteProfile.clubStatus}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
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

      {/* Club Announcements */}
      {clubAnnouncements && clubAnnouncements.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Club Announcements</p>
          </div>
          {clubAnnouncements.map(ann => (
            <div key={ann.id} className="rounded-xl border border-primary/15 bg-primary/5 p-4 space-y-1.5">
              <p className="font-black text-sm">{ann.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{ann.content}</p>
              <div className="flex items-center justify-between pt-1">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{ann.authorName}</p>
                <p className="text-[9px] font-bold text-muted-foreground">{formatDistanceToNow(parseISO(ann.createdAt), { addSuffix: true })}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Header (desktop) */}
      <div className="hidden md:block">
        <ProfileHeader profile={athleteProfile} />
      </div>

      {/* Share Profile */}
      {athleteProfile.username && (
        <ShareProfileCard username={athleteProfile.username} firstName={athleteProfile.firstName} />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {indices.map((idx) => (
          <Card key={idx.label} className="border shadow-sm overflow-hidden group bg-card">
            <CardHeader className="p-4 pb-2 space-y-0 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">{idx.label}</CardTitle>
              <idx.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black">{safeRenderValue(idx.value)}</span>
                <span className="text-[10px] text-muted-foreground font-bold">/ 100</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Master Index & Attributes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-xl bg-card border overflow-hidden">
          <div className="bg-muted/50 p-6 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground">Master Index</h3>
              <p className="text-xs font-bold text-muted-foreground/70">Institutional Performance Projection</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black tracking-tighter leading-none">{safeRenderValue(athleteProfile.compositeScoutingIndex)}</div>
              <div className="text-[10px] font-black uppercase text-primary mt-1">CSI RATING</div>
            </div>
          </div>
          <CardContent className="p-8">
            <div className="h-[450px]">
              <PerformanceRadarChart profile={athleteProfile} />
            </div>
          </CardContent>
        </Card>
        <AttributeRadarCharts profile={athleteProfile} />
      </div>

      {/* Match Performance Chart */}
      {(athleteProfile.matchHistory?.length ?? 0) > 0 && (
        <MatchPerformanceChart matchHistory={athleteProfile.matchHistory || []} />
      )}

      {/* Match Statistics */}
      <Card className="shadow-lg border">
        <CardHeader>
          <CardTitle className="text-lg font-black uppercase tracking-widest">Match Statistics</CardTitle>
          <CardDescription>Performance breakdown by official competition.</CardDescription>
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
        <Card className="shadow-lg border overflow-hidden">
          <CardHeader className="bg-muted/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-2">
                <Play className="w-4 h-4 text-primary fill-primary" /> Highlight Reel
              </CardTitle>
              {athleteProfile.highlightVideoTitle && (
                <p className="text-xs font-bold text-muted-foreground mt-0.5">{athleteProfile.highlightVideoTitle}</p>
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
            athleteName={`${athleteProfile.firstName} ${athleteProfile.lastName}`}
            viewerName={`${athleteProfile.firstName} ${athleteProfile.lastName}`}
            viewerRole="athlete"
          />
        </Card>
      )}

      {/* Showcase Videos */}
      {athleteProfile.showcaseVideos && athleteProfile.showcaseVideos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <Play className="w-4 h-4 text-primary fill-primary" /> Showcase Videos
          </h3>
          {athleteProfile.showcaseVideos.map((vid) => (
            <Card key={vid.id} className="shadow-lg border overflow-hidden">
              <CardHeader className="bg-muted/50 py-3 px-4 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex-1">
                  {vid.title || 'Showcase Clip'}
                </CardTitle>
                <button
                  onClick={() => setConfirmDeleteVideo(vid)}
                  className="ml-3 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
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
                athleteName={`${athleteProfile.firstName} ${athleteProfile.lastName}`}
                viewerName={`${athleteProfile.firstName} ${athleteProfile.lastName}`}
                viewerRole="athlete"
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderHealth = () => (
    <div className="space-y-8">
      {/* Health Passport — insurer core */}
      <div className={cn('rounded-xl border p-4', availabilityTone)}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Squad Readiness</p>
            <h2 className="text-sm font-black uppercase tracking-widest">{availabilityLabel}</h2>
            <p className="text-xs mt-1 opacity-80">Verified health for insurer — injuries + medical + GPS.</p>
          </div>
          <div className="min-w-[180px] w-full max-w-xs">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-1">
              <span>Readiness</span><span>{readiness}%</span>
            </div>
            <Progress value={readiness} className="h-2" />
          </div>
        </div>
      </div>

      {/* Injury History — verified */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Injury History {athleteProfile.injuryHistory?.some(i=>i.verifiedBy) && <Badge className="bg-green-500/10 text-green-700 border-green-400/30 text-[9px]">Verified</Badge>}</CardTitle>
          <CardDescription className="text-xs">Verified entries only count for insurance. Self-reported = 0 weight.</CardDescription>
        </CardHeader>
        <CardContent>
          {!athleteProfile.injuryHistory?.length ? (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <p className="text-sm font-bold">No injuries logged</p>
              <p className="text-xs text-muted-foreground mt-1">Clean sheet — insurer friendly. Log via Injury Tracker.</p>
              <Button size="sm" variant="outline" className="mt-3" asChild><Link href="/dashboard/injury-tracker"><Shield className="mr-2 h-4 w-4" />Open Tracker</Link></Button>
            </div>
          ) : (
            <div className="space-y-2">
              {athleteProfile.injuryHistory.map(rec => (
                <div key={rec.id} className="rounded-xl border p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{rec.type} — {rec.bodyPart} <span className="text-xs font-normal text-muted-foreground">({rec.severity})</span></p>
                    <p className="text-xs text-muted-foreground">{rec.dateOccurred}{rec.recoveryDate ? ` → ${rec.recoveryDate}` : ' → ongoing'} {rec.verifiedBy ? `• Verified by ${rec.verifiedBy.slice(0,8)}` : '• Unverified'}</p>
                  </div>
                  {rec.verifiedBy ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-amber-500" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Screenings — new insurer requirement */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /> Medical Screenings</CardTitle>
          <CardDescription className="text-xs">Cardiac / musculoskeletal / general — clinic + officer signature required.</CardDescription>
        </CardHeader>
        <CardContent>
          {!athleteProfile.medicalScreenings?.length ? (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <p className="text-sm font-bold">No screenings yet</p>
              <p className="text-xs text-muted-foreground mt-1">Book with club medical officer to unlock passport.</p>
              <Button size="sm" variant="outline" className="mt-3" asChild><Link href="/dashboard/verify"><ShieldCheck className="mr-2 h-4 w-4" />Verify Now</Link></Button>
            </div>
          ) : (
            <div className="space-y-2">
              {athleteProfile.medicalScreenings.map(m => (
                <div key={m.id} className="rounded-xl border p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold capitalize">{m.type} — {m.result} <span className="text-xs font-normal capitalize">{m.clinic}</span></p>
                    <p className="text-xs text-muted-foreground">{m.date} • Officer {m.officer} {m.verifiedBy ? `• Verified` : '• Pending'}</p>
                  </div>
                  {m.verifiedBy ? <ShieldCheck className="h-5 w-5 text-green-600" /> : <Clock className="h-5 w-5 text-amber-500" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AthleteTrainingSessions athleteId={athleteProfile.uid} affiliatedClubId={athleteProfile.affiliatedClubId} />
      {athleteProfile.gpsDeviceId && <Badge variant="outline" className="text-[10px]"><MapPin className="h-3 w-3 mr-1" />GPS {athleteProfile.gpsDeviceId.slice(0,8)} linked</Badge>}
    </div>
  );

  const renderShowcase = () => (
    <div className="space-y-8">
      <Card className="border-dashed bg-amber-50/20">
        <CardContent className="p-3 flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          Showcase = skills only — <strong>not verified</strong>, insurer ignores. Verified Proof is in Health + Proof tabs.
        </CardContent>
      </Card>
      {athleteProfile.highlightVideoUrl ? (
        <Card className="shadow-lg border overflow-hidden">
          <CardHeader className="bg-muted/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-2">
                <Play className="w-4 h-4 text-primary fill-primary" /> Highlight Reel — Showcase
              </CardTitle>
              {athleteProfile.highlightVideoTitle && <p className="text-xs font-bold text-muted-foreground mt-0.5">{athleteProfile.highlightVideoTitle}</p>}
            </div>
            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-amber-400 text-amber-700">Unverified • Scout only</Badge>
          </CardHeader>
          <CardContent className="p-0 bg-black">
            <div className="aspect-video w-full"><video src={athleteProfile.highlightVideoUrl} controls className="w-full h-full object-contain" preload="metadata" /></div>
          </CardContent>
          <VideoEngagement videoId={`${athleteProfile.uid}_highlight`} athleteId={athleteProfile.uid} athleteName={`${athleteProfile.firstName} ${athleteProfile.lastName}`} viewerName={`${athleteProfile.firstName} ${athleteProfile.lastName}`} viewerRole="athlete" />
        </Card>
      ) : (
        <Card className="border-dashed p-6 text-center">
          <p className="text-sm font-bold">No highlight yet</p>
          <p className="text-xs text-muted-foreground">Add a 60-90s reel — kept here, never counts for insurance.</p>
        </Card>
      )}
      {athleteProfile.showcaseVideos?.length ? (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-2"><Play className="w-4 h-4 text-primary fill-primary" /> More Clips — Showcase</h3>
          {athleteProfile.showcaseVideos.map(vid => (
            <Card key={vid.id} className="shadow-lg border overflow-hidden">
              <CardHeader className="bg-muted/50 py-3 px-4 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex-1">{vid.title || 'Showcase Clip'}</CardTitle>
                <Badge variant="outline" className="text-[9px]">Unverified</Badge>
                <button onClick={() => setConfirmDeleteVideo(vid)} className="ml-3 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
              </CardHeader>
              <CardContent className="p-0 bg-black"><div className="aspect-video w-full"><video src={vid.url} controls className="w-full h-full object-contain" preload="metadata" /></div></CardContent>
              <VideoEngagement videoId={`${athleteProfile.uid}_showcase_${vid.id}`} athleteId={athleteProfile.uid} athleteName={`${athleteProfile.firstName} ${athleteProfile.lastName}`} viewerName={`${athleteProfile.firstName} ${athleteProfile.lastName}`} viewerRole="athlete" />
            </Card>
          ))}
        </div>
      ) : null}
      {/* Re-added Marketplace — world-class glass */}
      <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-900 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <CardHeader className="relative border-b border-white/10">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white"><Sparkles className="h-4 w-4 text-violet-300" /> Marketplace — Availability & Value</CardTitle>
          <CardDescription className="text-white/60 text-xs">Set availability for scouts — showcased here, not in Health.</CardDescription>
        </CardHeader>
        <CardContent className="relative pt-6 bg-white/[0.02] backdrop-blur">
          <MarketplaceSettings profile={athleteProfile} />
        </CardContent>
      </Card>
    </div>
  );

  const renderProof = () => {
    const verifiedMinutesLocal = athleteProfile.matchHistory?.filter(m=>m.isVerified).reduce((s,m)=>s+(m.minutes||0),0) ?? 0;
    return (
    <div className="space-y-8">
      <Card className="border shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Verified Proof — Insurer Reads Only Verified Rows</CardTitle>
          <CardDescription className="text-xs">Self-logged minutes = 0 weight until coach/club confirms. {verifiedMinutesLocal}′ verified of {athleteProfile.matchHistory?.reduce((s,m)=>s+(m.minutes||0),0) || 0}′ total.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Badge className={verifiedMinutesLocal>=90 ? 'bg-green-500/10 text-green-700 border-green-400/30' : 'bg-amber-500/10 text-amber-700 border-amber-400/30'}>{verifiedMinutesLocal}′ verified</Badge>
          <span className="text-xs text-muted-foreground">Need 90′+ verified for quote</span>
        </CardContent>
      </Card>
      {(athleteProfile.matchHistory?.length ?? 0) > 0 && <MatchPerformanceChart matchHistory={athleteProfile.matchHistory || []} />}
      <Card className="shadow-lg border">
        <CardHeader><CardTitle className="text-lg font-black uppercase tracking-widest">Match Statistics — Verified ✓ on top</CardTitle><CardDescription className="text-xs">Verified rows count for insurance. Unverified greyed.</CardDescription></CardHeader>
        <CardContent><MatchStatisticsTable matchHistory={athleteProfile.matchHistory || []} onEdit={(id)=>router.push(`/dashboard/add-match?id=${id}`)} onDelete={(id)=>setConfirmDeleteMatch(id)} /></CardContent>
      </Card>
      <CareerHistoryCard profile={athleteProfile} />
      {/* Re-added Attribute Radars — world-class glass */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-xl border-0 bg-gradient-to-br from-card via-card to-muted/20 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b"><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><GitGraph className="h-4 w-4 text-primary" /> Attributes — Verified vs Self</CardTitle><CardDescription className="text-xs">Scout-verified attributes weigh 3× for insurance.</CardDescription></CardHeader>
          <CardContent className="p-6">
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <AttributeRadarCharts profile={athleteProfile} />
            </Suspense>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileStrengthCard profile={athleteProfile} />
            <TierProgressionCard profile={athleteProfile} />
          </div>
          <EngagementLoop profile={athleteProfile} />
          <ActivitySummary userAccount={userAccount} athleteProfile={athleteProfile} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecruitmentPipelineTracker athleteId={athleteProfile.uid} />
        <ProfileViewsCard athleteId={athleteProfile.uid} />
      </div>
      <ScoutRequests athleteId={athleteProfile.uid} />
    </div>
  );
  };

  const renderSettings = () => (
    <div className="space-y-8">
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest">Account</CardTitle>
              <CardDescription>Manage your profile and account settings.</CardDescription>
            </div>
            {athleteProfile.isVerified && (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black text-[9px] uppercase tracking-widest">
                Verified
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start gap-3 h-12 font-bold text-sm" onClick={() => router.push('/dashboard/verify')}>
            <ShieldCheck className="h-4 w-4 text-primary" />
            Verify now
          </Button>
          <Button variant="outline" className="w-full justify-start gap-3 h-12 font-bold text-sm" onClick={() => setUserModalOpen(true)}>
            <User className="h-4 w-4 text-primary" />
            View Profile
          </Button>
          <Button variant="outline" className="w-full justify-start gap-3 h-12 font-bold text-sm" onClick={() => setDialogTab('edit')}>
            <Settings2 className="h-4 w-4 text-primary" />
            Edit Profile
          </Button>
          <Button variant="outline" className="w-full justify-start gap-3 h-12 font-bold text-sm" asChild>
            <Link href={`/${athleteProfile.username}`}>
              <Eye className="h-4 w-4 text-primary" />
              Public View
            </Link>
          </Button>
          <DeleteAccountDialog />
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12 font-bold text-sm text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
      <MarketplaceSettings profile={athleteProfile} />
    </div>
  );

  // ── Main Render — world-class polish
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 pb-20 md:pb-0 text-foreground selection:bg-primary/20">
      {showVerificationReminder && (
        <div className="border-b border-amber-500/20 bg-amber-500/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 text-amber-100">
                <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-black text-amber-100">Verify your account</p>
                  <p className="text-xs text-amber-100/80">Complete your identity check to unlock the full Talent Graph experience.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-amber-500 text-amber-950 hover:bg-amber-400 font-black"
                  onClick={() => router.push('/dashboard/verify')}
                >
                  Verify now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── User Info Modal ── */}
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

      {/* ── Top Header — world-class glass */}
      <header className="sticky top-0 z-30 border-b bg-card/70 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60 shadow-sm">
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
            <Link href="/chat" className="relative shrink-0 text-foreground" aria-label="Messages">
              <MessageSquare className="h-6 w-6" />
              {unreadNotifs?.some(notification => notification.type === 'new_message') && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </Link>
            <button
              className="relative shrink-0 text-foreground"
              aria-label="Notifications"
              onClick={() => setDialogTab('notifications')}
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-primary-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
          <div className="hidden h-14 items-center justify-between md:flex md:h-16 gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-md">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-base md:text-xl font-black tracking-tight uppercase">Talent Graph</h1>
              <Badge variant="outline" className="hidden lg:block text-[9px] font-black uppercase tracking-widest border-primary/20 bg-primary/5">
                Athlete Console
              </Badge>
            </div>

            {/* World-class command search — re-added */}
            <div className="hidden lg:flex items-center flex-1 max-w-md">
              <div className="relative w-full group">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input aria-label="Search" placeholder="Search athletes, clubs, matches…" className="h-9 w-full rounded-full border bg-background/60 backdrop-blur pl-10 pr-16 text-sm outline-none placeholder:text-muted-foreground focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" />
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">⌘K</kbd>
              </div>
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
                onClick={() => setDialogTab('notifications')}
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
              {athleteProfile.username ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/${athleteProfile.username}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Public View
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  title="Finish onboarding to get your username and unlock your public profile"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Public View
                </Button>
              )}
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
                      onClick={() => { setMoreOpen(false); setDialogTab('edit'); }}
                    >
                      <Settings2 className="h-4 w-4 text-primary" />
                      Edit Profile
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 h-12 font-bold text-sm" asChild>
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

      {/* ── Desktop Tab Navigation — world-class pill */}
      <div className="hidden md:block border-b bg-card/40 backdrop-blur-xl sticky top-[65px] z-10 shadow-sm">
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
      <main className="container mx-auto space-y-5 p-4 pb-24 sm:p-6 sm:pb-24 lg:space-y-8 lg:p-8">
        {currentTab === 'overview' && renderOverview()}
        {currentTab === 'health' && renderHealth()}
        {currentTab === 'proof' && renderProof()}
        {currentTab === 'showcase' && renderShowcase()}
      </main>

      {/* ── Notifications Sheet ── */}
      <Sheet open={dialogTab === 'notifications'} onOpenChange={(open) => { if (!open) setDialogTab('home'); }}>
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
                          onClick={() => setDialogTab('home')}
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
        externalOpen={dialogTab === 'edit'}
        onExternalOpenChange={(open) => { if (!open) setDialogTab('home'); }}
      />
      <SupportDialog
        open={dialogTab === 'support'}
        onOpenChange={(open) => { if (!open) setDialogTab('home'); }}
      />

      {/* ── Quick-Action FAB ── */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2 md:bottom-6">
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
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden h-16 items-stretch border-t bg-background/95 backdrop-blur shadow-[0_-1px_12px_rgba(0,0,0,0.08)] bottom-nav-safe tab-bar">
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

      {/* ── Delete Dialogs ── */}
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
