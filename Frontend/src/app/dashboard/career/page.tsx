'use client';

import { useMemo, useState } from 'react';
import { collection, doc, query, where } from 'firebase/firestore';
import {
  BriefcaseBusiness,
  CalendarDays,
  Loader2,
  Trophy,
  TrendingUp,
  ShieldCheck,
  Target,
  Activity,
  Calendar,
  MapPin,
  Building2,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  FileText,
  Download,
  Share2,
  Link2,
  Search,
  Award,
  BarChart3,
  Timer,
  ExternalLink,
  Sparkles,
  Flag,
  History,
  GraduationCap,
  Link as LinkIcon,
} from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from '@/firebase';
import type { AthleteProfile, UserAccount, InjuryRecord, PreviousTeam, MatchEntry } from '@/lib/types';
import { CareerHistoryCard } from '@/components/dashboard/career-history-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, differenceInMonths, differenceInDays } from 'date-fns';
import { Link } from 'wouter';

// ── Extended types stored on athletes/{uid} ──
type CareerGoalStatus = 'planned' | 'active' | 'achieved' | 'archived';
type CareerGoalPriority = 'low' | 'medium' | 'high';

interface CareerGoal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  status: CareerGoalStatus;
  priority: CareerGoalPriority;
  createdAt: string;
  achievedAt?: string;
}

type TimelineKind = 'club' | 'injury' | 'match' | 'milestone' | 'verification';
interface TimelineItem {
  id: string;
  date: string;
  kind: TimelineKind;
  title: string;
  subtitle?: string;
  meta?: string;
  tone: string;
  icon: React.ComponentType<{ className?: string }>;
}

const GOAL_STATUS: Record<CareerGoalStatus, { label: string; dot: string; badge: string }> = {
  planned: { label: 'Planned', dot: 'bg-slate-400', badge: 'border-slate-300 text-slate-600' },
  active: { label: 'Active', dot: 'bg-primary', badge: 'border-primary/40 text-primary bg-primary/5' },
  achieved: { label: 'Achieved', dot: 'bg-emerald-500', badge: 'border-emerald-300 text-emerald-700 bg-emerald-50' },
  archived: { label: 'Archived', dot: 'bg-muted-foreground/40', badge: 'border-muted text-muted-foreground' },
};

const PRIORITY_BADGE: Record<CareerGoalPriority, string> = {
  low: 'border-muted text-muted-foreground',
  medium: 'border-amber-300 text-amber-700 bg-amber-50',
  high: 'border-red-300 text-red-700 bg-red-50',
};

function safeDate(s?: string): Date | null {
  if (!s) return null;
  try {
    const d = s.includes('T') ? parseISO(s) : new Date(s);
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
}

export default function AthleteCareerPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const accountRef = useMemoFirebase(() => firestore && user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const athleteRef = useMemoFirebase(() => firestore && user ? doc(firestore, 'athletes', user.uid) : null, [firestore, user]);
  const { data: account } = useDoc<UserAccount>(accountRef);
  const { data: profile, isLoading } = useDoc<AthleteProfile>(athleteRef);

  // lightweight verifications feed for insights
  const verifQuery = useMemoFirebase(() => firestore && user ? query(collection(firestore, 'verification_requests'), where('targetUid', '==', user.uid)) : null, [firestore, user]);
  const { data: verifs } = useCollection<{ status: string }>(verifQuery);

  const [activeTab, setActiveTab] = useState<'timeline' | 'clubs' | 'goals' | 'insights' | 'media'>('timeline');
  const [timelineQ, setTimelineQ] = useState('');
  const [goalDialog, setGoalDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<CareerGoal | null>(null);
  const [goalForm, setGoalForm] = useState<Omit<CareerGoal, 'id' | 'createdAt' | 'achievedAt'>>({
    title: '', description: '', targetDate: '', status: 'planned', priority: 'medium',
  });
  const [savingGoal, setSavingGoal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const goals: CareerGoal[] = useMemo(() => (profile as any)?.careerGoals ?? [], [profile]);
  const injuries: InjuryRecord[] = profile?.injuryHistory ?? [];
  const teams: PreviousTeam[] = profile?.previousTeams ?? [];
  const matches: MatchEntry[] = profile?.matchHistory ?? [];

  // ── KPIs ──
  const kpis = useMemo(() => {
    const totalMatches = matches.length;
    const totalGoals = matches.reduce((s, m) => s + (m.goals ?? 0), 0);
    const totalAssists = matches.reduce((s, m) => s + (m.assists ?? 0), 0);
    const totalMins = matches.reduce((s, m) => s + (m.minutes ?? 0), 0);
    const avgRating = totalMatches ? (matches.reduce((s, m) => s + (m.rating ?? 0), 0) / totalMatches) : 0;
    const verified = matches.filter(m => m.isVerified).length;
    const verifiedRate = totalMatches ? Math.round((verified / totalMatches) * 100) : 0;
    const earliestTeam = teams.length ? teams.map(t => t.from).sort()[0] : null;
    const careerMonths = earliestTeam ? (() => { const d = safeDate(earliestTeam + '-01'); return d ? differenceInMonths(new Date(), d) : 0; })() : 0;
    const injuryCount = injuries.length;
    const lastInjury = injuries.length ? injuries.sort((a, b) => b.dateOccurred.localeCompare(a.dateOccurred))[0] : null;
    const daysSinceLastInjury = lastInjury ? (() => { const d = safeDate(lastInjury.dateOccurred); return d ? differenceInDays(new Date(), d) : null; })() : null;
    return { totalMatches, totalGoals, totalAssists, totalMins, avgRating, verified, verifiedRate, careerMonths, injuryCount, daysSinceLastInjury };
  }, [matches, teams, injuries]);

  // ── Unified timeline ──
  const timeline: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [];

    for (const t of teams) {
      const d = t.from ? t.from + '-01' : '';
      items.push({
        id: `team-${t.id}`, date: d || t.from || '—', kind: 'club',
        title: t.teamName, subtitle: `${t.role || 'Squad member'} • ${t.country}${t.league ? ` • ${t.league}` : ''}`,
        meta: `${t.from} → ${t.to || 'Present'} • ${t.appearances ?? 0} apps • ${t.goals ?? 0}G ${t.assists ?? 0}A`,
        tone: 'border-primary/20 bg-primary/5', icon: Building2,
      });
    }
    for (const inj of injuries) {
      items.push({
        id: `inj-${inj.id}`, date: inj.dateOccurred, kind: 'injury',
        title: inj.type, subtitle: `${inj.bodyPart} • ${inj.severity}`,
        meta: inj.recoveryDate ? `Recovery: ${inj.recoveryDate}` : 'Ongoing',
        tone: inj.severity === 'major' ? 'border-red-200 bg-red-50' : inj.severity === 'moderate' ? 'border-amber-200 bg-amber-50' : 'border-yellow-200 bg-yellow-50',
        icon: AlertTriangle,
      });
    }
    // milestone: first match, 10th, 50th
    const sortedMatches = [...matches].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    if (sortedMatches.length >= 1) {
      const first = sortedMatches[0];
      items.push({ id: 'ms-first', date: first.updatedAt, kind: 'milestone', title: 'First logged match', subtitle: `${first.competition}${first.opponent ? ` vs ${first.opponent}` : ''}`, meta: `${first.goals}G • ${first.assists}A • ${first.rating.toFixed(1)} rating`, tone: 'border-emerald-200 bg-emerald-50', icon: Flag });
    }
    if (sortedMatches.length >= 10) {
      const tenth = sortedMatches[9];
      items.push({ id: 'ms-10', date: tenth.updatedAt, kind: 'milestone', title: '10 matches logged', subtitle: 'Consistency milestone', meta: tenth.competition, tone: 'border-sky-200 bg-sky-50', icon: Award });
    }
    // verification milestones
    if (profile?.isVerified) {
      items.push({ id: 'verif', date: profile.updatedAt || profile.createdAt, kind: 'verification', title: 'Profile verified', subtitle: 'Scouts see verified data first', meta: 'Verified by platform', tone: 'border-emerald-200 bg-emerald-50', icon: ShieldCheck });
    }
    // career goals achieved
    for (const g of goals.filter(x => x.status === 'achieved' && x.achievedAt)) {
      items.push({ id: `goal-${g.id}`, date: g.achievedAt!, kind: 'milestone', title: `Goal achieved: ${g.title}`, subtitle: g.description, meta: g.targetDate ? `Target was ${g.targetDate}` : undefined, tone: 'border-violet-200 bg-violet-50', icon: Target });
    }
    // sort desc
    return items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [teams, injuries, matches, profile, goals]);

  const filteredTimeline = useMemo(() => {
    if (!timelineQ.trim()) return timeline;
    const q = timelineQ.toLowerCase();
    return timeline.filter(t => `${t.title} ${t.subtitle ?? ''} ${t.meta ?? ''}`.toLowerCase().includes(q));
  }, [timeline, timelineQ]);

  // ── Goal handlers ──
  const openAddGoal = () => {
    setEditingGoal(null);
    setGoalForm({ title: '', description: '', targetDate: '', status: 'planned', priority: 'medium' });
    setGoalDialog(true);
  };
  const openEditGoal = (g: CareerGoal) => {
    setEditingGoal(g);
    setGoalForm({ title: g.title, description: g.description ?? '', targetDate: g.targetDate ?? '', status: g.status, priority: g.priority });
    setGoalDialog(true);
  };
  const saveGoal = async () => {
    if (!athleteRef || !goalForm.title.trim()) return;
    setSavingGoal(true);
    try {
      const list: CareerGoal[] = [...goals];
      if (editingGoal) {
        const idx = list.findIndex(x => x.id === editingGoal.id);
        const achievedAt = goalForm.status === 'achieved' ? new Date().toISOString() : editingGoal.achievedAt;
        list[idx] = { ...editingGoal, ...goalForm, achievedAt: goalForm.status === 'achieved' ? achievedAt : undefined };
      } else {
        list.push({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...goalForm, achievedAt: goalForm.status === 'achieved' ? new Date().toISOString() : undefined });
      }
      await updateDoc(athleteRef, { careerGoals: list, updatedAt: new Date().toISOString() } as any);
      toast({ title: editingGoal ? 'Goal updated' : 'Goal created', description: goalForm.title });
      setGoalDialog(false);
    } catch {
      toast({ variant: 'destructive', title: 'Could not save goal' });
    } finally { setSavingGoal(false); }
  };
  const deleteGoal = async (id: string) => {
    if (!athleteRef) return;
    const list = goals.filter(g => g.id !== id);
    await updateDoc(athleteRef, { careerGoals: list, updatedAt: new Date().toISOString() } as any);
    toast({ title: 'Goal removed' });
  };

  const toggleGoalStatus = async (g: CareerGoal) => {
    if (!athleteRef) return;
    const next: CareerGoalStatus = g.status === 'active' ? 'achieved' : g.status === 'planned' ? 'active' : g.status === 'achieved' ? 'archived' : 'planned';
    const list = goals.map(x => x.id === g.id ? { ...x, status: next, achievedAt: next === 'achieved' ? new Date().toISOString() : x.achievedAt } : x);
    await updateDoc(athleteRef, { careerGoals: list, updatedAt: new Date().toISOString() } as any);
  };

  const handleExport = async (mode: 'print' | 'json') => {
    if (!profile) return;
    if (mode === 'json') {
      const blob = new Blob([JSON.stringify({ profile: { ...profile, careerGoals: goals }, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `career-${profile.username || profile.uid}.json`; a.click(); URL.revokeObjectURL(url);
      toast({ title: 'Career exported', description: 'JSON downloaded.' }); return;
    }
    setExporting(true);
    try {
      const win = window.open('', '_blank');
      if (!win) return;
      const rows = timeline.slice(0, 20).map(t => `<tr><td style="padding:6px 8px;border:1px solid #e5e7eb">${t.date || ''}</td><td style="padding:6px 8px;border:1px solid #e5e7eb">${t.title}</td><td style="padding:6px 8px;border:1px solid #e5e7eb">${t.subtitle || ''}</td><td style="padding:6px 8px;border:1px solid #e5e7eb">${t.meta || ''}</td></tr>`).join('');
      win.document.write(`<html><head><title>Career — ${profile.firstName} ${profile.lastName}</title><style>body{font-family:ui-sans-serif,system-ui;padding:24px;color:#0f172a}h1{font-size:22px;margin:0} table{border-collapse:collapse;width:100%;margin-top:16px;font-size:12px}</style></head><body><h1>${profile.firstName} ${profile.lastName} — Career CV</h1><p style="color:#64748b">${profile.position || ''} • ${profile.sport || ''} • ${profile.country || ''}</p><p>Matches ${kpis.totalMatches} • Goals ${kpis.totalGoals} • Assists ${kpis.totalAssists} • Verified ${kpis.verifiedRate}%</p><table><thead><tr><th style="text-align:left;padding:6px 8px;border:1px solid #e5e7eb">Date</th><th style="text-align:left;padding:6px 8px;border:1px solid #e5e7eb">Event</th><th style="text-align:left;padding:6px 8px;border:1px solid #e5e7eb">Detail</th><th style="text-align:left;padding:6px 8px;border:1px solid #e5e7eb">Meta</th></tr></thead><tbody>${rows}</tbody></table><script>window.print()</script></body></html>`);
      win.document.close();
    } finally { setExporting(false); }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/${profile?.username ?? ''}`;
    await navigator.clipboard.writeText(url);
    toast({ title: 'Link copied', description: url });
  };

  if (isUserLoading || isLoading || !user || !account || !profile) {
    return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  const verificationState = profile.isVerified ? 'Verified' : verifs?.some(v => v.status === 'pending') ? 'Pending review' : 'Not verified';

  return (
    <div className="space-y-6">
      {/* ── Hero ── */}
      <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
        <div className="p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary"><BriefcaseBusiness className="h-4 w-4" /> Career Workspace</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Your journey, documented.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">One verified record for clubs, scouts and your future self — matches, health, movement history, goals and media. Built for the long game.</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline" className={`font-black uppercase tracking-widest ${profile.isVerified ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-amber-300 text-amber-700 bg-amber-50'}`}>
                  <ShieldCheck className="mr-1 h-3 w-3" /> {verificationState}
                </Badge>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Building2 className="h-3.5 w-3.5" />{profile.clubName || 'No current club'}</span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{profile.sport || 'Athlete'} • {profile.position || '—'}</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button size="sm" variant="outline" className="h-9 gap-2 font-bold" onClick={copyLink}><Link2 className="h-4 w-4" /> Copy link</Button>
              <Button size="sm" variant="outline" className="h-9 gap-2 font-bold" onClick={() => handleExport('json')}><Download className="h-4 w-4" /> Export JSON</Button>
              <Button size="sm" className="h-9 gap-2 font-black" onClick={() => handleExport('print')} disabled={exporting}><FileText className="h-4 w-4" /> {exporting ? 'Preparing…' : 'Export CV'}</Button>
            </div>
          </div>

          {/* KPI strip */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border bg-card/60"><CardContent className="flex items-center gap-3 p-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Trophy className="h-5 w-5" /></div><div><p className="text-xl font-black leading-none">{kpis.totalMatches}</p><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Matches logged</p><p className="text-[11px] text-muted-foreground">{kpis.verified} verified • {kpis.verifiedRate}%</p></div></CardContent></Card>
            <Card className="border bg-card/60"><CardContent className="flex items-center gap-3 p-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><TrendingUp className="h-5 w-5" /></div><div><p className="text-xl font-black leading-none">{kpis.totalGoals}<span className="text-sm font-bold text-muted-foreground"> G</span> • {kpis.totalAssists}<span className="text-sm font-bold text-muted-foreground"> A</span></p><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Goals & assists</p><p className="text-[11px] text-muted-foreground">{kpis.totalMins} mins • {kpis.avgRating.toFixed(1)} avg rating</p></div></CardContent></Card>
            <Card className="border bg-card/60"><CardContent className="flex items-center gap-3 p-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600"><History className="h-5 w-5" /></div><div><p className="text-xl font-black leading-none">{teams.length}</p><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clubs in history</p><p className="text-[11px] text-muted-foreground">{kpis.careerMonths ? `${Math.floor(kpis.careerMonths / 12)}y ${kpis.careerMonths % 12}m career` : 'Add your first club'}</p></div></CardContent></Card>
            <Card className="border bg-card/60"><CardContent className="flex items-center gap-3 p-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><Activity className="h-5 w-5" /></div><div><p className="text-xl font-black leading-none">{kpis.injuryCount}</p><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Injury records</p><p className="text-[11px] text-muted-foreground">{kpis.daysSinceLastInjury != null ? `${kpis.daysSinceLastInjury} days since last` : 'No recent injuries'}</p></div></CardContent></Card>
          </div>
        </div>
      </section>

      {/* ── Quick actions ── */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="gap-2 font-bold" onClick={openAddGoal}><Target className="h-4 w-4" /> New goal</Button>
        <Button size="sm" variant="outline" className="gap-2 font-bold" asChild><Link href="/dashboard/add-match"><Plus className="h-4 w-4" /> Log match</Link></Button>
        <Button size="sm" variant="outline" className="gap-2 font-bold" onClick={() => setActiveTab('clubs')}><Building2 className="h-4 w-4" /> Manage clubs</Button>
        <Button size="sm" variant="ghost" className="gap-2 font-bold text-muted-foreground" asChild><Link href={`/${profile.username}`}><ExternalLink className="h-4 w-4" /> Public profile</Link></Button>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex h-auto flex-nowrap gap-1 bg-muted/50 p-1">
            <TabsTrigger value="timeline" className="gap-2 whitespace-nowrap data-[state=active]:bg-background"><Clock3 className="h-3.5 w-3.5" /> Timeline</TabsTrigger>
            <TabsTrigger value="clubs" className="gap-2 whitespace-nowrap data-[state=active]:bg-background"><Building2 className="h-3.5 w-3.5" /> Clubs & Health</TabsTrigger>
            <TabsTrigger value="goals" className="gap-2 whitespace-nowrap data-[state=active]:bg-background"><Target className="h-3.5 w-3.5" /> Goals</TabsTrigger>
            <TabsTrigger value="insights" className="gap-2 whitespace-nowrap data-[state=active]:bg-background"><BarChart3 className="h-3.5 w-3.5" /> Insights</TabsTrigger>
            <TabsTrigger value="media" className="gap-2 whitespace-nowrap data-[state=active]:bg-background"><FileText className="h-3.5 w-3.5" /> Media</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest"><History className="h-4 w-4 text-primary" /> Career Timeline</CardTitle>
                  <CardDescription className="text-xs">Clubs, injuries, verified milestones and goals — newest first.</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Filter timeline…" value={timelineQ} onChange={e => setTimelineQ(e.target.value)} className="h-9 pl-8" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTimeline.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/20 p-10 text-center">
                  <Clock3 className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">No events yet</p>
                  <p className="max-w-sm text-xs text-muted-foreground">Log a match, add a previous club, or create a career goal to start building your timeline. Verified events are highlighted for scouts.</p>
                  <Button size="sm" className="mt-2 gap-2 font-bold" onClick={openAddGoal}><Plus className="h-4 w-4" /> Create first goal</Button>
                </div>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute bottom-0 left-[11px] top-2 w-px bg-border" />
                  <div className="space-y-4">
                    {filteredTimeline.map(item => (
                      <div key={item.id} className="relative flex gap-3">
                        <span className={`relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background ${item.tone}`}>
                          <item.icon className="h-3.5 w-3.5" />
                        </span>
                        <div className={`flex-1 rounded-xl border p-3 sm:p-4 ${item.tone}`}>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-black leading-tight">{item.title}</p>
                              {item.subtitle && <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{item.subtitle}</p>}
                              {item.meta && <p className="mt-1 text-[11px] font-medium text-muted-foreground">{item.meta}</p>}
                            </div>
                            <Badge variant="outline" className="shrink-0 bg-background font-mono text-[10px] font-bold uppercase tracking-widest">
                              <Calendar className="mr-1 h-3 w-3" />{item.date ? (() => { const d = safeDate(item.date); return d ? format(d, 'MMM yyyy') : item.date; })() : '—'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clubs" className="space-y-4">
          <CareerHistoryCard profile={profile} />
          <Card className="border-dashed">
            <CardContent className="flex flex-col gap-2 p-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Tip: keep team tenures accurate — scouts filter by longevity and verified appearances.</span>
              <Link href="/dashboard/verify" className="inline-flex items-center gap-1 font-bold text-primary hover:underline"><ShieldCheck className="h-3.5 w-3.5" /> Get verified</Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest"><Target className="h-4 w-4 text-primary" /> Career Goals</CardTitle>
                  <CardDescription className="text-xs">Set, track and archive objectives. Scouts see completed goals on your public profile timeline.</CardDescription>
                </div>
                <Button size="sm" className="h-8 gap-2 font-black" onClick={openAddGoal}><Plus className="h-3.5 w-3.5" /> New goal</Button>
              </div>
            </CardHeader>
            <CardContent>
              {goals.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/20 p-10 text-center">
                  <Target className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">No goals yet</p>
                  <p className="max-w-sm text-xs text-muted-foreground">Example: “Earn starting XI by March”, “5 clean sheets this season”, “Recover to full training”. Keep them measurable.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {goals
                    .slice()
                    .sort((a, b) => (a.status === 'achieved' ? 1 : -1) || a.createdAt.localeCompare(b.createdAt))
                    .map(g => (
                      <div key={g.id} className="group relative flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${GOAL_STATUS[g.status].dot}`} />
                            <h3 className="text-sm font-black leading-tight">{g.title}</h3>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditGoal(g)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteGoal(g.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                        {g.description && <p className="text-xs leading-relaxed text-muted-foreground">{g.description}</p>}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest ${GOAL_STATUS[g.status].badge}`}>{GOAL_STATUS[g.status].label}</Badge>
                          <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest ${PRIORITY_BADGE[g.priority]}`}>{g.priority}</Badge>
                          {g.targetDate && <Badge variant="outline" className="gap-1 text-[10px] font-bold"><Calendar className="h-3 w-3" />{g.targetDate}</Badge>}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Button size="sm" variant={g.status === 'achieved' ? 'secondary' : 'outline'} className="h-7 flex-1 gap-1.5 text-xs font-bold" onClick={() => toggleGoalStatus(g)}>
                            {g.status === 'achieved' ? <><CheckCircle2 className="h-3.5 w-3.5" /> Achieved</> : g.status === 'active' ? 'Mark done' : 'Start goal'}
                          </Button>
                          <span className="text-[10px] font-medium text-muted-foreground">{g.achievedAt ? `Done ${format(safeDate(g.achievedAt)!, 'MMM d')}` : `Created ${format(safeDate(g.createdAt)!, 'MMM d, yyyy')}`}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest"><Timer className="h-4 w-4 text-primary" /> Availability</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline justify-between"><span className="text-2xl font-black">{kpis.verifiedRate}%</span><Badge variant="outline" className="text-[10px] font-black uppercase">Verified rate</Badge></div>
                <Progress value={kpis.verifiedRate} className="h-2" />
                <p className="text-xs text-muted-foreground">{kpis.verified} of {kpis.totalMatches} matches verified by coaches/scouts.</p>
              </CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest"><BarChart3 className="h-4 w-4 text-emerald-500" /> Output</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <p className="text-sm"><span className="font-black">{kpis.totalGoals}</span> <span className="text-muted-foreground">goals</span> • <span className="font-black">{kpis.totalAssists}</span> <span className="text-muted-foreground">assists</span> in <span className="font-black">{kpis.totalMatches}</span> apps</p>
                <p className="text-xs text-muted-foreground">{kpis.totalMatches ? (kpis.totalGoals / kpis.totalMatches).toFixed(2) : '0.00'} goals/match • {kpis.avgRating.toFixed(1)} avg rating • {kpis.totalMins} mins</p>
                <Separator className="my-2" />
                <p className="flex items-center gap-1.5 text-xs font-bold"><Sparkles className="h-3.5 w-3.5 text-amber-500" /> {kpis.totalGoals + kpis.totalAssists} goal contributions</p>
              </CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest"><ShieldCheck className="h-4 w-4 text-sky-500" /> Trust</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">Club status: <span className="font-black text-foreground">{profile.clubName ? `${profile.clubName} (${profile.clubStatus})` : 'No current club'}</span></p>
                <p className="text-xs text-muted-foreground">Verification: <span className="font-black text-foreground">{verificationState}</span></p>
                <Button size="sm" variant="outline" className="mt-1 h-7 w-full gap-1.5 text-xs font-bold" asChild><Link href="/dashboard/verify"><ShieldCheck className="h-3.5 w-3.5" /> Verify profile</Link></Button>
              </CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">Competitions breakdown</CardTitle><CardDescription className="text-xs">Where your minutes come from — helps scouts evaluate context.</CardDescription></CardHeader>
            <CardContent>
              {(() => {
                const byComp = matches.reduce<Record<string, number>>((acc, m) => { acc[m.competition] = (acc[m.competition] || 0) + 1; return acc; }, {});
                const entries = Object.entries(byComp).sort((a, b) => b[1] - a[1]);
                if (!entries.length) return <p className="py-6 text-center text-sm text-muted-foreground">No matches yet.</p>;
                const max = entries[0][1];
                return (
                  <div className="space-y-2">
                    {entries.map(([comp, count]) => (
                      <div key={comp} className="flex items-center gap-3">
                        <span className="w-36 shrink-0 truncate text-xs font-bold">{comp}</span>
                        <div className="flex-1"><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${(count / max) * 100}%` }} /></div></div>
                        <span className="w-10 shrink-0 text-right text-xs font-black tabular-nums">{count}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest"><Award className="h-4 w-4 text-amber-500" /> Highlights</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-xs sm:grid-cols-2">
              <div className="rounded-xl border bg-muted/20 p-3"><p className="font-black uppercase tracking-widest text-muted-foreground">Best rated match</p>
                {(() => { const best = [...matches].sort((a, b) => b.rating - a.rating)[0]; return best ? <p className="mt-1 font-bold">{best.competition} vs {best.opponent || '—'} — {best.rating.toFixed(1)} • {best.goals}G {best.assists}A</p> : <p className="mt-1 text-muted-foreground">—</p>; })()}</div>
              <div className="rounded-xl border bg-muted/20 p-3"><p className="font-black uppercase tracking-widest text-muted-foreground">Longest club tenure</p>
                {(() => { const longest = [...teams].sort((a, b) => (b.appearances ?? 0) - (a.appearances ?? 0))[0]; return longest ? <p className="mt-1 font-bold">{longest.teamName} — {longest.appearances ?? 0} apps, {longest.goals ?? 0} goals</p> : <p className="mt-1 text-muted-foreground">—</p>; })()}</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest"><LinkIcon className="h-4 w-4 text-primary" /> Share & Discoverability</CardTitle><CardDescription className="text-xs">How scouts find you — keep your public page in sync with Career.</CardDescription></CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 overflow-hidden rounded-xl border bg-muted/30 px-3 py-2 text-sm">
                <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate font-mono text-xs">{typeof window !== 'undefined' ? `${window.location.origin}/${profile.username}` : `/${profile.username}`}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-2 font-bold" onClick={copyLink}><Share2 className="h-4 w-4" /> Copy</Button>
                <Button size="sm" className="gap-2 font-black" asChild><Link href={`/${profile.username}`}><ExternalLink className="h-4 w-4" /> View public</Link></Button>
              </div>
            </CardContent>
          </Card>

          {(profile.highlightVideoUrl || (profile.showcaseVideos?.length ?? 0) > 0) ? (
            <Card>
              <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">Video showcase</CardTitle><CardDescription className="text-xs">Linked from Career — manage full library on the overview page.</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                {profile.highlightVideoUrl && (
                  <div className="overflow-hidden rounded-xl border">
                    <div className="flex items-center justify-between bg-muted/50 px-3 py-2"><span className="text-xs font-black uppercase tracking-widest">{profile.highlightVideoTitle || 'Highlight reel'}</span><Badge variant="outline" className="text-[10px] font-black">Highlight</Badge></div>
                    <video src={profile.highlightVideoUrl} controls className="aspect-video w-full bg-black object-contain" preload="metadata" />
                  </div>
                )}
                {(profile.showcaseVideos ?? []).slice(0, 2).map(v => (
                  <div key={v.id} className="overflow-hidden rounded-xl border">
                    <div className="flex items-center justify-between bg-muted/50 px-3 py-2"><span className="text-xs font-bold">{v.title || 'Showcase clip'}</span><span className="text-[10px] text-muted-foreground">{v.uploadedAt ? format(safeDate(v.uploadedAt)!, 'MMM yyyy') : ''}</span></div>
                    <video src={v.url} controls className="aspect-video w-full bg-black object-contain" preload="metadata" />
                  </div>
                ))}
                {(profile.showcaseVideos?.length ?? 0) > 2 && <p className="text-center text-xs text-muted-foreground">+ {profile.showcaseVideos!.length - 2} more on Overview</p>}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-2 p-8 text-center"><FileText className="h-8 w-8 text-muted-foreground/30" /><p className="text-sm font-bold text-muted-foreground">No media yet</p><p className="max-w-sm text-xs text-muted-foreground">Add a highlight reel or showcase clips from Overview — they’ll surface here and on your public profile.</p></CardContent></Card>
          )}

          <Card className="border-dashed">
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest"><FileText className="h-4 w-4" /> Documents</CardTitle><CardDescription className="text-xs">Certificates, contracts, medical clears — stored on your profile (coming: direct upload).</CardDescription></CardHeader>
            <CardContent className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed bg-muted/10 p-8 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm font-bold text-muted-foreground">Documents workspace</p>
              <p className="max-w-md text-xs text-muted-foreground">Attach PDFs via your club admin or support. Scouts see “Verified documents” as a trust signal. Need help? Open Support from the bottom bar.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Goal dialog ── */}
      <Dialog open={goalDialog} onOpenChange={setGoalDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-black uppercase tracking-widest">{editingGoal ? 'Edit goal' : 'New career goal'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title *</Label>
              <Input value={goalForm.title} onChange={e => setGoalForm({ ...goalForm, title: e.target.value })} placeholder="e.g. Break into first team" className="h-9 font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
              <Textarea value={goalForm.description ?? ''} onChange={e => setGoalForm({ ...goalForm, description: e.target.value })} placeholder="What does success look like? Measurable if possible." rows={3} className="font-medium" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</Label>
                <Select value={goalForm.status} onValueChange={(v: any) => setGoalForm({ ...goalForm, status: v })}>
                  <SelectTrigger className="h-9 font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="achieved">Achieved</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Priority</Label>
                <Select value={goalForm.priority} onValueChange={(v: any) => setGoalForm({ ...goalForm, priority: v })}>
                  <SelectTrigger className="h-9 font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target date</Label>
                <Input type="date" value={goalForm.targetDate ?? ''} onChange={e => setGoalForm({ ...goalForm, targetDate: e.target.value })} className="h-9 font-bold" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalDialog(false)}>Cancel</Button>
            <Button onClick={saveGoal} disabled={savingGoal || !goalForm.title.trim()} className="font-black uppercase tracking-widest">
              {savingGoal ? <Loader2 className="h-4 w-4 animate-spin" /> : editingGoal ? 'Save goal' : 'Create goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
