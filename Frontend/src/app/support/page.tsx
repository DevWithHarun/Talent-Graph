'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'wouter';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, where, addDoc, doc, getDoc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useRouter } from '@/lib/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Headphones, Send, Loader2, ArrowLeft, ChevronRight, Search, Filter, Plus,
  Bug, UserRound, Lightbulb, MessageSquare, AlertTriangle, Clock, CheckCircle2,
  Timer, Tag, Paperclip, Mail, ShieldCheck, Activity, FileText, X, Copy,
  Phone, Sparkles, ArrowUpRight, Inbox, User, Shield,
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import type { UserAccount } from '@/lib/types';

// ── supporting.tsx spec mapping ──
const CATEGORIES = [
  { value: 'bug', label: 'Bug Report', icon: Bug, desc: 'App crashes, broken feature, wrong data' },
  { value: 'account', label: 'Account / Profile Issue', icon: UserRound, desc: 'Login failure, data loss, profile or security concern' },
  { value: 'feature_request', label: 'Feature Request', icon: Lightbulb, desc: 'Ideas to improve Talent Graph' },
  { value: 'general', label: 'General Feedback', icon: MessageSquare, desc: 'Suggestions and usability notes' },
  { value: 'urgent_support', label: 'Urgent Support', icon: AlertTriangle, desc: 'Login, payment, data loss, security — escalated immediately' },
] as const;

const PRIORITIES = [
  { value: 'low', label: 'Low', hint: 'Suggestions, minor usability', dot: 'bg-slate-400', badge: 'border-slate-300 text-slate-600' },
  { value: 'medium', label: 'Medium', hint: 'Individual feature or account problem', dot: 'bg-amber-500', badge: 'border-amber-300 text-amber-700 bg-amber-50' },
  { value: 'high', label: 'High', hint: 'Core feature unavailable for many users', dot: 'bg-orange-500', badge: 'border-orange-300 text-orange-700 bg-orange-50' },
  { value: 'urgent', label: 'Urgent', hint: 'Login failure, payment, data loss, security', dot: 'bg-red-500', badge: 'border-red-300 text-red-700 bg-red-50' },
] as const;

// 7-step spec: New → Triaged → Assigned → In Progress → Waiting for User → Resolved → Closed
// Keep compatibility with existing superadmin statuses: open≈new, pending_internal≈in_progress, pending_user≈waiting_for_user
const STATUS_FLOW: { id: string; label: string; color: string }[] = [
  { id: 'new', label: 'New', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  { id: 'triaged', label: 'Triaged', color: 'bg-sky-500/10 text-sky-600 border-sky-200' },
  { id: 'assigned', label: 'Assigned', color: 'bg-violet-500/10 text-violet-600 border-violet-200' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  { id: 'waiting_for_user', label: 'Waiting for User', color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
  { id: 'resolved', label: 'Resolved', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
  { id: 'closed', label: 'Closed', color: 'bg-muted text-muted-foreground border-border' },
];

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  // legacy aliases so existing tickets render correctly and communicate with ClientSupportDashboard
  open: { label: 'New', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  pending_internal: { label: 'In Progress', color: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  pending_user: { label: 'Waiting for User', color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
  new: { label: 'New', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  triaged: { label: 'Triaged', color: 'bg-sky-500/10 text-sky-600 border-sky-200' },
  assigned: { label: 'Assigned', color: 'bg-violet-500/10 text-violet-600 border-violet-200' },
  in_progress: { label: 'In Progress', color: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  waiting_for_user: { label: 'Waiting for User', color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
  resolved: { label: 'Resolved', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
  closed: { label: 'Closed', color: 'bg-muted text-muted-foreground border-border' },
};

function SlaBadge({ deadline }: { deadline?: string }) {
  if (!deadline) return null;
  const breached = isPast(new Date(deadline));
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold', breached ? 'text-red-500' : 'text-muted-foreground')}>
      <Timer className="h-3 w-3" />{breached ? 'SLA breached' : `SLA ${formatDistanceToNow(new Date(deadline), { addSuffix: true })}`}
    </span>
  );
}

function StatusStepper({ currentStatus }: { currentStatus: string }) {
  // normalize legacy
  const normalized = currentStatus === 'open' ? 'new' : currentStatus === 'pending_internal' ? 'in_progress' : currentStatus === 'pending_user' ? 'waiting_for_user' : currentStatus;
  const idx = STATUS_FLOW.findIndex(s => s.id === normalized);
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-1">
      {STATUS_FLOW.map((st, i) => {
        const done = idx >= i;
        const isCurrent = idx === i;
        return (
          <div key={st.id} className="flex items-center gap-1 shrink-0">
            <div className={cn('h-6 w-6 rounded-full border flex items-center justify-center text-[9px] font-black', done ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border', isCurrent && 'ring-2 ring-primary/30')}>
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={cn('text-[9px] font-black uppercase tracking-widest hidden sm:inline', done ? 'text-foreground' : 'text-muted-foreground')}>{st.label}</span>
            {i < STATUS_FLOW.length - 1 && <div className={cn('h-px w-4 sm:w-6', done ? 'bg-primary' : 'bg-border')} />}
          </div>
        );
      })}
    </div>
  );
}

export default function MySupportPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'tickets' | 'new'>('tickets');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // form state — required per supporting.tsx (guest-capable)
  const [form, setForm] = useState({
    category: 'bug' as string,
    subject: '',
    description: '',
    priority: 'medium' as string,
    userRole: '' as string,
    contactEmail: '',
    guestName: '',
    contactPhone: '',
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const userAccountRef = useMemoFirebase(() => firestore && user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: account } = useDoc<UserAccount>(userAccountRef);

  // hydrate contact email + role from account
  useEffect(() => {
    if (account) {
      setForm(f => ({
        ...f,
        contactEmail: f.contactEmail || account.email || user?.email || '',
        userRole: f.userRole || account.role || '',
      }));
    } else if (user?.email) {
      setForm(f => ({ ...f, contactEmail: f.contactEmail || user.email || '' }));
    }
  }, [account, user]);

  // tickets for this user — ordered by newest (superadmin sees same via support_tickets)
  const ticketsQuery = useMemoFirebase(() => firestore && user ? query(collection(firestore, 'support_tickets'), where('senderUserId', '==', user.uid), orderBy('updatedAt', 'desc')) : null, [firestore, user]);
  const { data: myTickets, isLoading: ticketsLoading } = useCollection<any>(ticketsQuery);

  const messagesQuery = useMemoFirebase(() => firestore && selectedId ? query(collection(firestore, 'support_tickets', selectedId, 'messages'), orderBy('sentAt', 'asc')) : null, [firestore, selectedId]);
  const { data: messages, isLoading: msgsLoading } = useCollection<any>(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const selectedTicket = myTickets?.find((t: any) => t.id === selectedId);

  const filtered = useMemo(() => {
    const list: any[] = myTickets ?? [];
    return list.filter(t => {
      if (statusFilter !== 'all' && (t.status ?? 'open') !== statusFilter && !(statusFilter === 'new' && t.status === 'open')) return false;
      if (categoryFilter !== 'all' && !(t.tags || []).includes(categoryFilter)) return false;
      if (search && !`${t.subject ?? ''} ${t.senderName ?? ''} ${t.senderEmail ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [myTickets, statusFilter, categoryFilter, search]);

  const stats = useMemo(() => {
    const all = (myTickets ?? []) as any[];
    return {
      total: all.length,
      open: all.filter(t => ['open', 'new', 'triaged', 'assigned', 'in_progress', 'pending_internal'].includes(t.status)).length,
      waiting: all.filter(t => ['waiting_for_user', 'pending_user'].includes(t.status)).length,
      resolved: all.filter(t => t.status === 'resolved').length,
    };
  }, [myTickets]);

  if (isUserLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  const isGuest = !user;

  // Guest lands directly on New Ticket form — no history to show
  useEffect(() => {
    if (!isUserLoading && isGuest && activeTab === 'tickets') setActiveTab('new');
  }, [isUserLoading, isGuest, activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim() || !form.category || !form.contactEmail.trim()) {
      toast({ variant: 'destructive', title: 'Missing required fields', description: 'Category, subject, description and contact email are required.' });
      return;
    }
    if (isGuest && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
      toast({ variant: 'destructive', title: 'Invalid email', description: 'Please enter a valid email so we can reply.' });
      return;
    }
    setSubmitting(true);
    try {
      const idToken = user ? await user.getIdToken() : null;
      // map supporting.tsx priority rules → existing priority values (urgent→high for superadmin high-priority queue)
      const apiPriority = form.priority === 'urgent' ? 'high' : (form.priority as 'low' | 'medium' | 'high');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers.Authorization = `Bearer ${idToken}`;
      const senderName = user
        ? (user.displayName || (account ? `${account?.firstName ?? ''} ${account?.lastName ?? ''}`.trim() || user.email || 'User' : user.email || 'User'))
        : (form.guestName.trim() || form.contactEmail.trim().split('@')[0] || 'Guest');

      let ticketId: string | null = null;

      // Try API first (will work on Vercel / Functions). Hosting static returns HTML -> fallback to direct Firestore.
      try {
        const res = await fetch('/api/support/tickets', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            senderEmail: form.contactEmail.trim(),
            senderName,
            subject: form.subject.trim(),
            message: form.description.trim(),
            priority: apiPriority,
            tag: form.category,
            source: isGuest ? 'public_guest' : 'in_app',
            userRole: form.userRole || account?.role || (isGuest ? 'guest' : 'athlete'),
            senderPhone: form.contactPhone.trim() || null,
            attachmentName: attachmentName || null,
          }),
        });
        const text = await res.text();
        const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
        if (isHtml) throw new Error('API_HTML_FALLBACK');
        let j: any = {};
        try { j = text ? JSON.parse(text) : {}; } catch { throw new Error(text.slice(0, 200) || `HTTP ${res.status}`); }
        if (!res.ok) throw new Error(j?.error || j?.details || `Failed to create ticket (${res.status})`);
        ticketId = j?.ticketId || null;
      } catch (apiErr: any) {
        const msg = apiErr?.message || '';
        const isHtmlFallback = msg === 'API_HTML_FALLBACK' || msg.includes('<!DOCTYPE') || msg.includes('Unexpected token');
        if (isHtmlFallback || msg.includes('Failed to fetch')) {
          // Fallback: direct Firestore (static hosting has no /api). Rules allow create: if true
          if (!firestore) throw apiErr;
          console.warn('[support] API unavailable, falling back to direct Firestore', msg);
          const now = new Date().toISOString();
          const slaHours = apiPriority === 'high' ? 1 : apiPriority === 'medium' ? 4 : 24;
          const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();
          const directData: any = {
            senderUserId: user?.uid || 'anonymous',
            senderEmail: form.contactEmail.trim(),
            senderName,
            senderPhone: form.contactPhone.trim() || null,
            source: isGuest ? 'public_guest' : 'in_app',
            subject: form.subject.trim(),
            status: 'open',
            priority: apiPriority,
            tags: [form.category],
            assignedAgentId: null,
            slaDeadline,
            csatRating: null,
            accountProvisioned: false,
            provisionedUserId: null,
            lastMessage: form.description.trim().slice(0, 100),
            createdAt: now,
            updatedAt: now,
            isAnonymous: isGuest,
            userRole: form.userRole || account?.role || (isGuest ? 'guest' : 'athlete'),
            attachmentName: attachmentName || null,
          };
          // Remove nulls where Firestore expects nullValue vs omit
          const ticketRef = await addDoc(collection(firestore, 'support_tickets'), directData);
          await addDoc(collection(firestore, 'support_tickets', ticketRef.id, 'messages'), {
            senderType: 'user',
            senderName,
            body: form.description.trim(),
            sentVia: isGuest ? 'public_guest' : 'in_app',
            sentAt: now,
          });
          ticketId = ticketRef.id;
        } else {
          throw apiErr;
        }
      }

      const ref = ticketId ? `#${String(ticketId).slice(0, 8).toUpperCase()}` : 'ticket';
      if (isGuest) {
        toast({ title: `Ticket ${ref} created`, description: `Thanks — we’ll reply to ${form.contactEmail.trim()} soon. Save your reference ${ref} for follow-up.${form.contactPhone.trim() ? ' SMS sent if phone valid.' : ''}` });
      } else {
        toast({ title: `Ticket ${ref} created`, description: 'You’ll get a reply from the Client Support workspace (superadmin). Check My Tickets for status updates.' });
      }
      setForm(f => ({ ...f, subject: '', description: '', attachmentName: null } as any));
      setAttachmentName(null);
      if (fileRef.current) fileRef.current.value = '';
      if (!isGuest && ticketId) {
        setActiveTab('tickets');
        setSelectedId(ticketId);
      } else if (isGuest) {
        // stay on form, clear phone/name for privacy? keep email for follow-up
        setForm(f => ({ ...f, contactPhone: f.contactPhone } as any));
      }
    } catch (err: any) {
      const raw = err?.message || 'Please try again.';
      const friendly = raw.includes('<!DOCTYPE') || raw.includes('Unexpected token') ? 'Server temporarily unavailable — please try again or email billionaireomenda@gmail.com' : raw;
      toast({ variant: 'destructive', title: 'Could not create ticket', description: friendly });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !selectedId || !replyText.trim()) return;
    setSending(true);
    const now = new Date().toISOString();
    try {
      await addDoc(collection(firestore, 'support_tickets', selectedId, 'messages'), {
        senderType: 'user',
        senderName: user.displayName || user.email || 'User',
        body: replyText.trim(),
        sentVia: 'in_app',
        sentAt: now,
      });
      setDocumentNonBlocking(doc(firestore, 'support_tickets', selectedId), { status: 'pending_internal', updatedAt: now, lastMessage: replyText.trim().slice(0, 100) } as any, { merge: true });
      setReplyText('');
      toast({ title: 'Reply sent', description: 'The superadmin support team will be notified.' });
    } catch {
      toast({ variant: 'destructive', title: 'Could not send reply' });
    } finally {
      setSending(false);
    }
  };

  const copyRef = async (id: string) => {
    const ref = `#${id.slice(0, 8).toUpperCase()}`;
    await navigator.clipboard.writeText(ref);
    toast({ title: 'Reference copied', description: ref });
  };

  const selectedStatus = selectedTicket ? (STATUS_LABEL[selectedTicket.status] ?? STATUS_LABEL.new) : null;

  return (
    <div className="min-h-dvh bg-muted/20">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Headphones className="h-4 w-4" /></span>
            My Support
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-black uppercase tracking-widest"><ShieldCheck className="mr-1 h-3 w-3" /> Connected to superadmin</Badge>
            <Button variant="ghost" size="sm" asChild><Link href="/help"><FileText className="mr-1.5 h-3.5 w-3.5" />Help</Link></Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}><ArrowLeft className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Hero */}
        <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary"><Headphones className="h-4 w-4" /> Help & Feedback — Stacy’s queue</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">We’re here to help.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Submit bug reports, account/profile issues, feature requests, general feedback or urgent requests. Every report gets a unique reference, an owner and a status — and you’ll see every update here, synced with the superadmin Client Support dashboard.</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 font-bold"><Clock className="h-3.5 w-3.5 text-primary" /> Acknowledged in 1 business day</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 font-bold"><AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Urgent escalated immediately</span>
              </div>
            </div>
            <Card className="hidden sm:block w-64 shrink-0">
              <CardContent className="p-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Direct Contact</p>
                <a href="mailto:billionaireomenda@gmail.com" className="flex items-center gap-2 text-sm font-bold hover:text-primary"><Mail className="h-4 w-4 text-primary" /> billionaireomenda@gmail.com</a>
                <a href="tel:+254727946012" className="flex items-center gap-2 text-sm font-bold hover:text-primary"><Phone className="h-4 w-4 text-primary" /> +254 727 946 012</a>
                <Separator />
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-lg font-black leading-none">{stats.total}</p><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total</p></div>
                  <div><p className="text-lg font-black leading-none text-blue-600">{stats.open}</p><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Open</p></div>
                  <div><p className="text-lg font-black leading-none text-emerald-600">{stats.resolved}</p><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Resolved</p></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {isGuest && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0"><User className="h-4 w-4" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-amber-900">Browsing as guest — no login needed</p>
              <p className="text-xs text-amber-800/80 mt-0.5">You can submit a support ticket right now. We’ll reply to your email. <Link href="/login" className="font-bold underline">Sign in</Link> to track your ticket history and chat live.</p>
            </div>
            <Button size="sm" variant="outline" asChild className="shrink-0 bg-white"><Link href="/login">Sign In</Link></Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="mt-6">
          <TabsList className="inline-flex h-auto flex-wrap gap-1 bg-muted/50 p-1">
            <TabsTrigger value="tickets" className="gap-2 data-[state=active]:bg-background"><Inbox className="h-4 w-4" /> {isGuest ? 'My Tickets (sign in)' : `My Tickets (${stats.total})`}</TabsTrigger>
            <TabsTrigger value="new" className="gap-2 data-[state=active]:bg-background"><Plus className="h-4 w-4" /> New Ticket {isGuest && <span className="ml-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-white">GUEST</span>}</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="mt-4">
            {isGuest ? (
              <Card className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted"><Inbox className="h-6 w-6 text-muted-foreground" /></div>
                <h3 className="mt-4 font-black">Sign in to track your tickets</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">Guests can submit tickets via <strong>New Ticket</strong> — we’ll reply by email with your reference number. Create an account or sign in to see history, live replies, and status updates here.</p>
                <div className="mt-6 flex justify-center gap-2">
                  <Button onClick={() => setActiveTab('new')}><Plus className="mr-1.5 h-4 w-4" />Submit as guest</Button>
                  <Button variant="outline" asChild><Link href="/login">Sign In</Link></Button>
                </div>
              </Card>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[520px]">
              {/* List */}
              <Card className="lg:col-span-1 flex flex-col overflow-hidden">
                <CardHeader className="border-b bg-muted/30 p-3 space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by subject or ref…" className="h-8 pl-8 text-xs bg-background" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-7 flex-1 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        {STATUS_FLOW.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                        <SelectItem value="open">New (legacy)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="h-7 flex-1 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {ticketsLoading ? (
                      <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
                    ) : filtered.length === 0 ? (
                      <div className="py-10 text-center">
                        <Inbox className="mx-auto h-8 w-8 text-muted-foreground/30" />
                        <p className="mt-2 text-sm font-bold">No tickets</p>
                        <p className="text-xs text-muted-foreground">{search || statusFilter !== 'all' ? 'No match — try different filters.' : 'Create your first support request.'}</p>
                        <Button size="sm" className="mt-3" onClick={() => setActiveTab('new')}><Plus className="mr-1.5 h-3.5 w-3.5" />New ticket</Button>
                      </div>
                    ) : filtered.map((t: any) => {
                      const ref = `#${t.id.slice(0, 8).toUpperCase()}`;
                      const st = STATUS_LABEL[t.status] ?? STATUS_LABEL.new;
                      const pri = PRIORITIES.find(p => p.value === t.priority) ?? PRIORITIES[1];
                      const isSelected = selectedId === t.id;
                      const age = t.createdAt ? formatDistanceToNow(new Date(t.createdAt), { addSuffix: true }) : '';
                      return (
                        <button key={t.id} onClick={() => setSelectedId(t.id)} className={cn('w-full rounded-xl border p-3 text-left transition-colors', isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-transparent bg-background hover:bg-muted hover:border-border')}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-black leading-tight truncate">{t.subject}</p>
                            <Badge variant="outline" className={cn('shrink-0 text-[9px] font-black uppercase tracking-widest', isSelected ? 'bg-white/15 border-white/20 text-white' : pri.badge)}>{pri.label}</Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className={cn('inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest', isSelected ? 'bg-white/15 border-white/20 text-white' : st.color)}>{st.label}</span>
                            <span className={cn('text-[10px]', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{ref} · {age}</span>
                          </div>
                          <p className={cn('mt-1 truncate text-[11px]', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{t.lastMessage || 'No messages yet'}</p>
                          {t.senderPhone && <span className={cn('mt-1 inline-flex items-center gap-1 text-[10px]', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground')}><Phone className="h-3 w-3" />{t.senderPhone}</span>}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </Card>

              {/* Detail */}
              <Card className="lg:col-span-2 flex flex-col overflow-hidden min-h-[520px]">
                {!selectedTicket ? (
                  <CardContent className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MessageSquare className="h-7 w-7" /></div>
                    <p className="mt-3 font-black">Select a ticket</p>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">Every report has a unique reference, owner and status. Replies from the superadmin Client Support dashboard appear here instantly. Stacy’s queue is checked twice daily; weekly summaries keep recurring issues visible.</p>
                    <Button size="sm" variant="outline" className="mt-4" onClick={() => setActiveTab('new')}><Plus className="mr-1.5 h-3.5 w-3.5" />Open a ticket</Button>
                  </CardContent>
                ) : (
                  <>
                    <CardHeader className="border-b py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-sm font-black leading-tight truncate">{selectedTicket.subject}</CardTitle>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyRef(selectedTicket.id)}><Copy className="h-3.5 w-3.5" /></Button>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline" className={cn('text-[10px] font-black uppercase tracking-widest', selectedStatus?.color)}>{selectedStatus?.label}</Badge>
                            <Badge variant="outline" className="font-mono text-[10px] font-bold">Ref {`#${selectedTicket.id.slice(0, 8).toUpperCase()}`}</Badge>
                            {(selectedTicket.tags ?? []).map((tag: string) => <Badge key={tag} variant="secondary" className="text-[10px] capitalize">{tag.replace('_', ' ')}</Badge>)}
                            <SlaBadge deadline={selectedTicket.slaDeadline} />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{selectedTicket.senderName} · {selectedTicket.senderEmail} · {selectedTicket.senderPhone || 'no phone'} · {PRIORITIES.find(p => p.value === selectedTicket.priority)?.label ?? selectedTicket.priority} priority</p>
                        </div>
                        <div className="hidden sm:block shrink-0 text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Age</p>
                          <p className="text-xs font-bold">{selectedTicket.createdAt ? formatDistanceToNow(new Date(selectedTicket.createdAt), { addSuffix: true }) : '—'}</p>
                          {selectedTicket.assignedAgentId && <p className="mt-1 text-[10px] text-muted-foreground">Owner: <span className="font-bold text-foreground">{selectedTicket.assignedAgentId.slice(0, 8)}…</span></p>}
                        </div>
                      </div>
                      <div className="mt-3">
                        <StatusStepper currentStatus={selectedTicket.status} />
                      </div>
                    </CardHeader>

                    <ScrollArea className="flex-1" ref={scrollRef as any}>
                      <div className="p-4 space-y-3">
                        {/* Original description as first bubble */}
                        <div className="rounded-xl border bg-muted/30 p-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><FileText className="h-3 w-3" /> Original report</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{selectedTicket.lastMessage ?? '—'}</p>
                          <p className="mt-2 text-[10px] text-muted-foreground">Created {selectedTicket.createdAt ? format(new Date(selectedTicket.createdAt), 'PPp') : '—'}</p>
                        </div>
                        {msgsLoading ? (
                          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
                        ) : (messages ?? []).map((m: any) => {
                          const isAgent = m.senderType === 'agent';
                          return (
                            <div key={m.id} className={cn('flex flex-col', isAgent ? 'items-start' : 'items-end')}>
                              <span className="mb-1 px-1 text-[10px] font-bold text-muted-foreground">{isAgent ? (m.senderName || 'Support') : 'You'} · {m.sentAt ? format(new Date(m.sentAt), 'p') : ''}</span>
                              <div className={cn('max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed', isAgent ? 'bg-primary text-primary-foreground' : 'bg-muted')}>{m.body}</div>
                            </div>
                          );
                        })}
                        {(messages?.length ?? 0) === 0 && !msgsLoading && <p className="py-4 text-center text-xs text-muted-foreground">No replies yet. The support team will respond within 1 business day (urgent escalated immediately).</p>}
                      </div>
                    </ScrollArea>

                    {['resolved', 'closed'].includes(selectedTicket.status) ? (
                      <div className="border-t bg-emerald-50 p-4 text-center">
                        <p className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> This ticket is {selectedTicket.status}. Open a new ticket if you need further help.</p>
                        <div className="mt-3 flex justify-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => setActiveTab('new')}>New ticket</Button>
                          {selectedTicket.status === 'resolved' && <span className="text-xs text-muted-foreground self-center">Rate your experience — superadmin sent a CSAT email.</span>}
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleReply} className="flex gap-2 border-t bg-background p-3">
                        <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Add a reply — the superadmin inbox will see it instantly…" className="min-h-[44px] max-h-[120px] resize-none flex-1 text-sm" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(e as any); } }} />
                        <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={!replyText.trim() || sending}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
                      </form>
                    )}
                  </>
                )}
              </Card>
            </div>
            )}
          </TabsContent>

          <TabsContent value="new" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4 text-primary" /> Help & Feedback form {isGuest && <Badge variant="secondary" className="ml-2 text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white">No login required</Badge>}</CardTitle>
                  <CardDescription className="text-xs">{isGuest ? 'No account needed — fill in your email and we’ll reply directly. You’ll get a reference number instantly.' : 'Required per supporting.tsx: category, subject, description, priority, user role, optional screenshot/attachment, contact email. You’ll receive a reference number and confirmation.'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category *</Label>
                        <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">{CATEGORIES.find(c => c.value === form.category)?.desc}</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Priority *</Label>
                        <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}><span className="inline-flex items-center gap-2"><span className={cn('h-2 w-2 rounded-full', p.dot)} />{p.label}</span></SelectItem>)}
                          </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">{PRIORITIES.find(p => p.value === form.priority)?.hint}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subject *</Label>
                      <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Brief summary — e.g. Cannot log match on mobile" required className="h-9 font-medium" />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description *</Label>
                      <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What happened, what you expected, steps to reproduce, error messages… The more detail, the faster we resolve." rows={5} required className="font-medium" />
                    </div>

                    {isGuest && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your name (optional)</Label>
                        <Input value={form.guestName} onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))} placeholder="Jane Doe" className="h-9" />
                        <p className="text-[11px] text-muted-foreground">How we’ll address you in the reply.</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">User role {isGuest ? '(optional)' : '*'}</Label>
                        <Select value={form.userRole} onValueChange={v => setForm(f => ({ ...f, userRole: v }))}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={isGuest ? "Select role (optional)" : "Select role"} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="athlete">Athlete</SelectItem>
                            <SelectItem value="club">Club</SelectItem>
                            <SelectItem value="scout">Scout</SelectItem>
                            <SelectItem value="coach">Coach</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            {isGuest && <SelectItem value="guest">Guest / Visitor</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact email *</Label>
                        <Input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="you@email.com" required className="h-9" />
                        {isGuest && <p className="text-[11px] text-muted-foreground">We’ll reply here — check spam folder too.</p>}
                      </div>
                    </div>

                    {isGuest && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone (optional — for SMS follow-up)</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="0712 345 678 or +254712345678" className="h-9 pl-8" />
                        </div>
                        <p className="text-[11px] text-muted-foreground">We’ll SMS your reference <span className="font-mono">#{'{id}'}</span> and reply alerts via BulkSMS.</p>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Screenshot / attachment (optional)</Label>
                      <div className="flex items-center gap-2">
                        <Input ref={fileRef} type="file" accept="image/*,.pdf" className="h-9 flex-1" onChange={e => setAttachmentName(e.target.files?.[0]?.name ?? null)} />
                        {attachmentName && <Badge variant="secondary" className="gap-1 shrink-0"><Paperclip className="h-3 w-3" />{attachmentName}</Badge>}
                        {attachmentName && <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setAttachmentName(null); if (fileRef.current) fileRef.current.value = ''; }}><X className="h-4 w-4" /></Button>}
                      </div>
                      <p className="text-[11px] text-muted-foreground">Attachment is stored as reference; include screenshots of errors for fastest triage.</p>
                    </div>

                    <Button type="submit" className="w-full h-10 font-black" disabled={submitting}>
                      {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</> : <><Send className="mr-2 h-4 w-4" />Submit & get reference number</>}
                    </Button>
                    <p className="text-center text-[11px] text-muted-foreground">Urgent priority escalated immediately · High = many users affected · Medium = individual feature · Low = suggestions.</p>
                  </form>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-4">
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Sparkles className="h-4 w-4 text-primary" /> How it works</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-xs leading-relaxed">
                    <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
                      <li><span className="font-bold text-foreground">New</span> → your report lands in the superadmin Client Support inbox (newest first).</li>
                      <li><span className="font-bold text-foreground">Triaged & Assigned</span> — Stacy checks twice daily; urgent issues escalated immediately.</li>
                      <li><span className="font-bold text-foreground">In Progress / Waiting for User</span> — you’ll see status, owner and age; reply here.</li>
                      <li><span className="font-bold text-foreground">Resolved → Closed</span> — you get confirmation; CSAT email follows.</li>
                    </ol>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border bg-background p-2.5"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Success checklist</p><ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground"><li>• Every report has ID + owner + status</li><li>• No report is lost</li><li>• Confirmation + resolution updates</li></ul></div>
                      <div className="rounded-xl border bg-background p-2.5"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fallback (if offline)</p><p className="mt-1 text-[11px] text-muted-foreground">Spreadsheet queue columns: <span className="font-mono">ID, Date, User, Category, Priority, Description, Owner, Status, Response, Resolution Date</span></p></div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full gap-2" asChild><Link href="/jobs/admin/dashboard"><Shield className="h-3.5 w-3.5" />Superadmin Client Support <ArrowUpRight className="h-3.5 w-3.5" /></Link></Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /> Categories</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {CATEGORIES.map(c => (
                      <div key={c.value} className={cn('flex gap-3 rounded-xl border p-3', form.category === c.value ? 'border-primary/40 bg-primary/5' : 'bg-muted/20')}>
                        <c.icon className={cn('h-5 w-5 shrink-0', form.category === c.value ? 'text-primary' : 'text-muted-foreground')} />
                        <div><p className="text-xs font-black">{c.label}</p><p className="text-[11px] text-muted-foreground">{c.desc}</p></div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
