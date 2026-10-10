'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, orderBy, addDoc, doc, updateDoc, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, Send, Search, MessageSquare, AlertCircle, Clock, CheckCircle2,
  Tag, StickyNote, Filter, Plus, ThumbsUp, ThumbsDown, X, ChevronDown,
  TicketCheck, Users, Timer, TrendingUp, Star, Phone, Bot, Mail, ShieldCheck,
  ExternalLink, UserCheck, RefreshCw, Sparkles, HelpCircle, ArrowRight,
  KeyRound, Unlock, Check, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import type { SupportTicket, SupportMessage, InternalNote, TicketStatus, TicketPriority } from '@/lib/types';

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: any }> = {
  open: { label: 'Open', color: 'bg-blue-500/10 text-blue-600 border-blue-200', icon: AlertCircle },
  pending_user: { label: 'Pending User', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200', icon: Clock },
  pending_internal: { label: 'Pending Internal', color: 'bg-orange-500/10 text-orange-600 border-orange-200', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-green-500/10 text-green-600 border-green-200', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-muted text-muted-foreground border-border', icon: X },
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700' },
  high: { label: 'High', color: 'bg-red-100 text-red-700' },
};

const TAGS = ['billing', 'verification', 'technical', 'onboarding', 'other'];
const ALL_STATUSES: TicketStatus[] = ['open', 'pending_user', 'pending_internal', 'resolved', 'closed'];

const RESOLUTION_TEMPLATES = [
  {
    title: '🚀 Onboarding Instructions',
    body: `Hi there! Thank you for contacting Talent Graph Support.

Here are the step-by-step instructions to get your profile ready:
1. Log in and confirm your email verification link.
2. Complete your baseline vitals (height, weight, dominant foot, primary & secondary positions).
3. Connect your current club or school academy.
4. Enter your baseline metrics (30m sprint, vertical jump, agility) and rate your tactical attributes to compute your Radar Chart!

Please let us know if you need any further guidance!`,
  },
  {
    title: '🛡️ Account Verification Approved',
    body: `Great news! Our administrative review team has verified your identity and athletic credentials.

Your profile badge has been upgraded to "✅ Verified". Scouts and coaches across the platform can now see your validated match statistics and institutional CSI score.`,
  },
  {
    title: '✉️ Email Verification Manual Override',
    body: `Hello! We have reviewed your registration and manually verified your account in our database.

You can now log in directly with your email and password without needing to click the email link. Please try logging in and let us know if everything is running smoothly!`,
  },
  {
    title: '📊 Match & Metrics Calibrated',
    body: `Hi! We have reviewed the match statistics and performance baseline metrics you submitted.

Your match log has been synchronized, and your CSI rating and Radar Chart have been updated accordingly. Best of luck in your upcoming fixtures!`,
  },
  {
    title: '✅ Issue Resolved & Closing',
    body: `Thank you for reaching out to Talent Graph.

We have addressed the issue you raised and verified that all systems are operational. We are now marking this ticket as resolved. If you need any further help, feel free to reopen this case or reach out anytime!`,
  },
];

function SlaTimer({ deadline }: { deadline: string }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  if (!deadline) return null;
  const deadlineDate = new Date(deadline);
  const breached = isPast(deadlineDate);
  return (
    <span className={cn('text-[10px] font-bold flex items-center gap-1', breached ? 'text-red-500' : 'text-muted-foreground')}>
      <Timer className="w-3 h-3" />
      {breached ? 'SLA Breached' : `SLA: ${formatDistanceToNow(deadlineDate, { addSuffix: true })}`}
    </span>
  );
}

export function ClientSupportDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [replyText, setReplyText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [sendEmailReply, setSendEmailReply] = useState(true);
  const [sendSmsReply, setSendSmsReply] = useState(false);
  const [activePanel, setActivePanel] = useState<'thread' | 'notes' | 'user_context'>('thread');
  const [sending, setSending] = useState(false);
  const [tagDropdown, setTagDropdown] = useState(false);
  const [isVerifyingUser, setIsVerifyingUser] = useState(false);
  const [isBypassingEmail, setIsBypassingEmail] = useState(false);
  const [isUnlockingOnboarding, setIsUnlockingOnboarding] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [replyStatusChoice, setReplyStatusChoice] = useState<TicketStatus>('pending_user');
  const [matchedUserProfile, setMatchedUserProfile] = useState<any>(null);
  const auth = useAuth();

  // Tickets query
  const ticketsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'support_tickets'), orderBy('updatedAt', 'desc'));
  }, [firestore]);

  const { data: allTickets, isLoading: ticketsLoading } = useCollection<SupportTicket>(ticketsQuery);

  // Messages query
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedId) return null;
    return query(collection(firestore, 'support_tickets', selectedId, 'messages'), orderBy('sentAt', 'asc'));
  }, [firestore, selectedId]);
  const { data: messages, isLoading: msgsLoading } = useCollection<SupportMessage>(messagesQuery);

  // Notes query
  const notesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedId) return null;
    return query(collection(firestore, 'support_tickets', selectedId, 'internalNotes'), orderBy('createdAt', 'asc'));
  }, [firestore, selectedId]);
  const { data: notes } = useCollection<InternalNote>(notesQuery);

  const selectedTicket = allTickets?.find(t => t.id === selectedId);

  // Auto-lookup user profile in Firestore when ticket changes
  useEffect(() => {
    if (!firestore || !selectedTicket) {
      setMatchedUserProfile(null);
      return;
    }

    const email = selectedTicket.senderEmail || (selectedTicket as any).email;
    const uid = selectedTicket.senderUserId;

    const findUser = async () => {
      try {
        if (uid) {
          const userDocSnap = await getDocs(query(collection(firestore, 'users'), where('__name__', '==', uid)));
          if (!userDocSnap.empty) {
            setMatchedUserProfile({ id: userDocSnap.docs[0].id, ...userDocSnap.docs[0].data() });
            return;
          }
        }
        if (email) {
          const emailSnap = await getDocs(query(collection(firestore, 'users'), where('email', '==', email)));
          if (!emailSnap.empty) {
            setMatchedUserProfile({ id: emailSnap.docs[0].id, ...emailSnap.docs[0].data() });
            return;
          }
        }
        setMatchedUserProfile(null);
      } catch {
        setMatchedUserProfile(null);
      }
    };

    findUser();
  }, [firestore, selectedTicket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, notes, activePanel]);

  // Normalized ticket fields
  const getTicketName = (t: any) => t.senderName || t.name || 'User';
  const getTicketEmail = (t: any) => t.senderEmail || t.email || 'No email';
  const getTicketPhone = (t: any) => t.senderPhone || t.phone || null;
  const getTicketSubject = (t: any) => t.subject || t.category || 'Support Ticket';
  const getTicketCode = (t: any) => t.ticketCode || `#${t.id?.slice(0, 8).toUpperCase()}`;
  const getTicketSource = (t: any) => t.source || (t.ticketCode ? 'landing_bot' : 'in_app');
  const getTicketRole = (t: any) => t.role || t.userRole || 'User';

  const filtered = (allTickets || []).filter((t: any) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (sourceFilter !== 'all' && getTicketSource(t) !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const subject = getTicketSubject(t).toLowerCase();
      const name = getTicketName(t).toLowerCase();
      const email = getTicketEmail(t).toLowerCase();
      const code = getTicketCode(t).toLowerCase();
      if (!subject.includes(q) && !name.includes(q) && !email.includes(q) && !code.includes(q)) return false;
    }
    return true;
  });

  const openCount = (allTickets || []).filter(t => t.status === 'open').length;
  const botTicketsCount = (allTickets || []).filter((t: any) => getTicketSource(t) === 'landing_bot').length;
  const highPriorityCount = (allTickets || []).filter(t => t.priority === 'high' && t.status !== 'resolved' && t.status !== 'closed').length;
  const resolvedCount = (allTickets || []).filter(t => t.status === 'resolved').length;

  // Handle Admin Reply with complete two-way communication
  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !selectedId || !replyText.trim() || !selectedTicket) return;
    setSending(true);
    try {
      const now = new Date().toISOString();
      const agentDisplayName = user.displayName || user.email || 'Superadmin';
      const recipientEmail = getTicketEmail(selectedTicket);
      const recipientName = getTicketName(selectedTicket);
      const recipientPhone = getTicketPhone(selectedTicket);

      // 1. Add to Firestore messages subcollection
      await addDoc(collection(firestore, 'support_tickets', selectedId, 'messages'), {
        senderType: 'agent',
        senderName: agentDisplayName,
        body: replyText,
        sentVia: 'app',
        sentAt: now,
      });

      // 2. Update ticket status
      await updateDoc(doc(firestore, 'support_tickets', selectedId), {
        status: replyStatusChoice,
        updatedAt: now,
        lastMessage: replyText.slice(0, 100),
      });

      // 3. Queue reply email directly to Firebase Firestore `mail` collection
      if (sendEmailReply && recipientEmail && recipientEmail.includes('@')) {
        const ticketRefCode = selectedTicket.ticketCode || selectedId;
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const trackingUrl = `${baseUrl}/?trackTicket=${ticketRefCode}`;
        addDoc(collection(firestore, 'mail'), {
          to: [recipientEmail],
          message: {
            subject: `Re: ${getTicketSubject(selectedTicket)}`,
            text: `Hi ${recipientName},\n\nSuperadmin ${agentDisplayName} replied to your support ticket #${ticketRefCode}:\n\n${replyText}\n\nTrack your ticket live and view responses: ${trackingUrl}\n\nTalent Graph Kenya Support`,
            html: `<div style="font-family:-apple-system,sans-serif;padding:24px;background:#0F172A;color:#E2E8F0;border-radius:14px;max-width:580px;border:1px solid #334155;">
              <h2 style="color:#60A5FA;margin-top:0;">Support Update from Superadmin</h2>
              <p>Hi <strong>${recipientName}</strong>,</p>
              <div style="background:#1E293B;padding:16px;border-radius:10px;border-left:4px solid #3B82F6;margin:16px 0;line-height:1.6;color:#F8FAFC;">
                ${replyText.replace(/\n/g, '<br/>')}
              </div>
              <p style="text-align:center;margin:24px 0;">
                <a href="${trackingUrl}" style="background:#2563EB;color:#FFFFFF;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block;">View Live Ticket & Reply &rarr;</a>
              </p>
              <p style="font-size:12px;color:#64748B;margin-top:20px;border-top:1px solid #1E293B;padding-top:12px;">Ticket ID: #${ticketRefCode} · Talent Graph Kenya</p>
            </div>`,
          },
          ticketId: selectedId,
          ticketCode: ticketRefCode,
          type: 'superadmin_reply',
          recipient: recipientEmail,
          createdAt: now,
          status: 'queued',
        }).catch(err => console.warn('[ClientSupportDashboard] Mail queue error:', err));
      }

      // 4. Dispatch Email & SMS notifications via server API
      fetch('/api/support/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedId,
          replyText,
          agentName: agentDisplayName,
          recipientEmail,
          recipientName,
          ticketSubject: getTicketSubject(selectedTicket),
          recipientPhone,
          sendEmail: sendEmailReply,
          sendSms: sendSmsReply,
          newStatus: replyStatusChoice,
        }),
      }).catch(() => {});

      toast({
        title: 'Reply Sent',
        description: sendEmailReply && recipientEmail !== 'No email'
          ? `Dispatched to ${recipientEmail} and recorded in ticket.`
          : 'Reply recorded in ticket thread.',
      });

      setReplyText('');
    } catch {
      toast({ variant: 'destructive', title: 'Failed to send reply', description: 'Please try again.' });
    } finally {
      setSending(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !selectedId || !noteText.trim()) return;
    try {
      await addDoc(collection(firestore, 'support_tickets', selectedId, 'internalNotes'), {
        agentId: user.uid,
        agentName: user.displayName || user.email || 'Superadmin',
        note: noteText,
        createdAt: new Date().toISOString(),
      });
      setNoteText('');
      toast({ title: 'Note Saved' });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to save note' });
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!firestore || !selectedId) return;
    try {
      await updateDoc(doc(firestore, 'support_tickets', selectedId), {
        status,
        updatedAt: new Date().toISOString(),
      });
      toast({ title: 'Status updated', description: `Ticket marked as ${STATUS_CONFIG[status].label}` });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to update status' });
    }
  };

  const handlePriorityChange = async (priority: TicketPriority) => {
    if (!firestore || !selectedId) return;
    try {
      await updateDoc(doc(firestore, 'support_tickets', selectedId), {
        priority,
        updatedAt: new Date().toISOString(),
      });
      toast({ title: 'Priority updated', description: `Priority set to ${PRIORITY_CONFIG[priority].label}` });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to update priority' });
    }
  };

  const handleToggleTag = async (tag: string) => {
    if (!firestore || !selectedId || !selectedTicket) return;
    const current = selectedTicket.tags || [];
    const next = current.includes(tag as any)
      ? current.filter(t => t !== tag)
      : [...current, tag as any];
    try {
      await updateDoc(doc(firestore, 'support_tickets', selectedId), {
        tags: next,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to update tags' });
    }
  };

  // Superadmin 1-Click Action: Manually verify the user/athlete
  const handleVerifyUserAccount = async () => {
    if (!firestore || !matchedUserProfile) return;
    setIsVerifyingUser(true);
    try {
      // Update in users collection
      await updateDoc(doc(firestore, 'users', matchedUserProfile.id), {
        isVerified: true,
        verificationStatus: 'verified',
        updatedAt: new Date().toISOString(),
      });

      // Also update in athletes collection if athlete
      try {
        await updateDoc(doc(firestore, 'athletes', matchedUserProfile.id), {
          isVerified: true,
          verificationStatus: 'verified',
          updatedAt: new Date().toISOString(),
        });
      } catch {
        // Ignored if not an athlete doc
      }

      setMatchedUserProfile((prev: any) => ({ ...prev, isVerified: true, verificationStatus: 'verified' }));

      // Add audit note to ticket
      if (selectedId && user) {
        await addDoc(collection(firestore, 'support_tickets', selectedId, 'internalNotes'), {
          agentId: user.uid,
          agentName: user.displayName || user.email || 'Superadmin',
          note: `[Admin Action] User account verified manually by ${user.displayName || user.email}.`,
          createdAt: new Date().toISOString(),
        });
      }

      toast({
        title: 'Account Verified ✅',
        description: `${matchedUserProfile.firstName || matchedUserProfile.displayName || 'User'} is now officially verified on the platform.`,
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Verification failed', description: err?.message || 'Check permissions' });
    } finally {
      setIsVerifyingUser(false);
    }
  };

  // Superadmin Action: Bypass email verification manually
  const handleBypassEmailVerification = async () => {
    if (!firestore || !matchedUserProfile) return;
    setIsBypassingEmail(true);
    try {
      await updateDoc(doc(firestore, 'users', matchedUserProfile.id), {
        isEmailVerified: true,
        updatedAt: new Date().toISOString(),
      });
      setMatchedUserProfile((prev: any) => ({ ...prev, isEmailVerified: true }));

      if (selectedId && user) {
        await addDoc(collection(firestore, 'support_tickets', selectedId, 'internalNotes'), {
          agentId: user.uid,
          agentName: user.displayName || user.email || 'Superadmin',
          note: `[Admin Action] Email verification manually bypassed by ${user.displayName || user.email}. User can now log in immediately.`,
          createdAt: new Date().toISOString(),
        });
      }

      toast({
        title: 'Email Verification Bypassed ✅',
        description: `${matchedUserProfile.email} is now marked as verified. The user can log in immediately.`,
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to bypass email verification', description: err?.message });
    } finally {
      setIsBypassingEmail(false);
    }
  };

  // Superadmin Action: Complete onboarding and unlock dashboard
  const handleUnlockOnboarding = async () => {
    if (!firestore || !matchedUserProfile) return;
    setIsUnlockingOnboarding(true);
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(firestore, 'users', matchedUserProfile.id), {
        profileCompleted: true,
        isEmailVerified: true,
        onboardingStep: 'completed',
        updatedAt: now,
      });

      try {
        await updateDoc(doc(firestore, 'athletes', matchedUserProfile.id), {
          profileCompleted: true,
          updatedAt: now,
        });
      } catch {
        // Ignored if not athlete
      }

      setMatchedUserProfile((prev: any) => ({
        ...prev,
        profileCompleted: true,
        isEmailVerified: true,
        onboardingStep: 'completed',
      }));

      if (selectedId && user) {
        await addDoc(collection(firestore, 'support_tickets', selectedId, 'internalNotes'), {
          agentId: user.uid,
          agentName: user.displayName || user.email || 'Superadmin',
          note: `[Admin Action] Onboarding unlocked and account activated by ${user.displayName || user.email}.`,
          createdAt: now,
        });
      }

      toast({
        title: 'Onboarding Unlocked 🚀',
        description: 'Account activated! The user can now access their full platform dashboard.',
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to unlock onboarding', description: err?.message });
    } finally {
      setIsUnlockingOnboarding(false);
    }
  };

  // Superadmin Action: Dispatch password reset email
  const handleSendPasswordReset = async () => {
    const targetEmail = matchedUserProfile?.email || getTicketEmail(selectedTicket);
    if (!auth || !targetEmail || !targetEmail.includes('@')) {
      toast({ variant: 'destructive', title: 'Invalid email for password reset' });
      return;
    }
    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      if (selectedId && user) {
        await addDoc(collection(firestore, 'support_tickets', selectedId, 'internalNotes'), {
          agentId: user.uid,
          agentName: user.displayName || user.email || 'Superadmin',
          note: `[Admin Action] Password reset email dispatched to ${targetEmail}.`,
          createdAt: new Date().toISOString(),
        });
      }
      toast({
        title: 'Password Reset Dispatched 🔑',
        description: `Reset link sent to ${targetEmail}.`,
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Could not send reset email', description: err?.message });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Open Tickets', value: openCount, icon: AlertCircle, color: 'text-blue-500' },
          { label: '🤖 ScoutAI Bot Cases', value: botTicketsCount, icon: Bot, color: 'text-purple-500' },
          { label: 'High Priority', value: highPriorityCount, icon: Timer, color: 'text-red-500' },
          { label: 'Resolved Tickets', value: resolvedCount, icon: CheckCircle2, color: 'text-green-500' },
        ].map(stat => (
          <Card key={stat.label} className="p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className={cn('text-3xl font-black mt-1', stat.color)}>{stat.value}</p>
              </div>
              <stat.icon className={cn('w-8 h-8 opacity-20', stat.color)} />
            </div>
          </Card>
        ))}
      </div>

      {/* Main Support Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-280px)] min-h-[550px]">
        
        {/* LEFT COLUMN: TICKET INBOX (4 cols) */}
        <Card className="lg:col-span-4 overflow-hidden flex flex-col shadow-sm">
          <CardHeader className="border-b bg-muted/30 p-3 space-y-2.5 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search ticket code, user, subject…"
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-1.5">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-7 text-[11px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-7 text-[11px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="h-7 text-[11px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="landing_bot">🤖 ScoutAI Bot</SelectItem>
                  <SelectItem value="in_app">📱 In-App</SelectItem>
                  <SelectItem value="contact_form">🌐 Contact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1.5">
              {ticketsLoading ? (
                <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-1">
                  <p className="text-xs font-bold text-muted-foreground">No tickets found</p>
                  <p className="text-[11px] text-muted-foreground/70">Try clearing filters or search terms.</p>
                </div>
              ) : filtered.map((ticket: any) => {
                const sc = STATUS_CONFIG[ticket.status as TicketStatus] || STATUS_CONFIG.open;
                const pc = PRIORITY_CONFIG[ticket.priority as TicketPriority] || PRIORITY_CONFIG.medium;
                const isSelected = selectedId === ticket.id;
                const source = getTicketSource(ticket);
                const code = getTicketCode(ticket);
                const name = getTicketName(ticket);
                const email = getTicketEmail(ticket);
                const subject = getTicketSubject(ticket);

                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedId(ticket.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border transition-all text-xs cursor-pointer',
                      isSelected 
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                        : 'bg-background hover:bg-muted/70 border-border/50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0 flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold opacity-80">{code}</span>
                        {source === 'landing_bot' ? (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 border-purple-300 bg-purple-500/10 text-purple-600">
                            🤖 Bot
                          </Badge>
                        ) : source === 'contact_form' ? (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 border-blue-300 bg-blue-500/10 text-blue-600">
                            🌐 Web
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 border-emerald-300 bg-emerald-500/10 text-emerald-600">
                            📱 App
                          </Badge>
                        )}
                      </div>
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0', pc.color)}>{pc.label}</span>
                    </div>

                    <p className="font-bold truncate text-[12px] leading-tight mb-1">{subject}</p>
                    
                    <p className={cn('text-[11px] truncate mb-2', isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                      {name} · {email}
                    </p>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className={cn('font-bold px-1.5 py-0.5 rounded border text-[9.5px]', sc.color)}>{sc.label}</span>
                      <span className="opacity-70 text-[10px]">
                        {ticket.updatedAt ? formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true }) : ''}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </Card>

        {/* RIGHT COLUMN: ACTIVE TICKET WORKSPACE & ACTIONS (8 cols) */}
        <Card className="lg:col-span-8 overflow-hidden flex flex-col shadow-sm">
          {!selectedTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-3 opacity-15" />
              <p className="font-bold text-foreground text-sm">Select a ticket to begin resolution</p>
              <p className="text-xs max-w-sm mt-1 text-muted-foreground">
                View conversations from the landing page bot, in-app support dialog, reply via email/SMS, and solve user issues with one click.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <CardHeader className="border-b py-3 px-4 shrink-0 bg-muted/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs font-black text-primary">{getTicketCode(selectedTicket)}</span>
                      <h3 className="font-bold text-sm leading-tight truncate">{getTicketSubject(selectedTicket)}</h3>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap text-xs text-muted-foreground">
                      <span>From: <strong className="text-foreground">{getTicketName(selectedTicket)}</strong> ({getTicketEmail(selectedTicket)})</span>
                      {getTicketPhone(selectedTicket) && (
                        <span className="flex items-center gap-1 font-semibold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full text-[11px]">
                          <Phone className="w-3 h-3" /> {getTicketPhone(selectedTicket)}
                        </span>
                      )}
                      <span className="bg-muted px-2 py-0.5 rounded text-[10.5px] uppercase font-bold tracking-wider">
                        Role: {getTicketRole(selectedTicket)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Select value={selectedTicket.priority} onValueChange={v => handlePriorityChange(v as TicketPriority)}>
                      <SelectTrigger className="h-7 w-24 text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedTicket.status} onValueChange={v => handleStatusChange(v as TicketStatus)}>
                      <SelectTrigger className="h-7 w-32 text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] gap-1"
                      onClick={() => handleStatusChange('resolved')}
                    >
                      <CheckCircle2 className="w-3 h-3 text-green-600" /> Resolve
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Action Toolbar & Sub-Tabs */}
              <div className="border-b px-4 py-2 shrink-0 bg-background flex items-center justify-between gap-3 text-xs">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActivePanel('thread')}
                    className={cn('font-bold py-1 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5',
                      activePanel === 'thread' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Conversation Thread
                  </button>
                  <button
                    onClick={() => setActivePanel('user_context')}
                    className={cn('font-bold py-1 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5',
                      activePanel === 'user_context' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <UserCheck className="w-3.5 h-3.5" /> User App Profile & Actions
                  </button>
                  <button
                    onClick={() => setActivePanel('notes')}
                    className={cn('font-bold py-1 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5',
                      activePanel === 'notes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <StickyNote className="w-3.5 h-3.5" /> Internal Notes ({notes?.length || 0})
                  </button>
                </div>

                {/* Canned Response Dropdown */}
                {activePanel === 'thread' && (
                  <Select onValueChange={(val) => setReplyText(val)}>
                    <SelectTrigger className="h-7 w-48 text-[11px] border-dashed">
                      <Sparkles className="w-3 h-3 mr-1 text-[var(--glow-color)]" />
                      <SelectValue placeholder="Resolution Templates" />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOLUTION_TEMPLATES.map((tmpl, idx) => (
                        <SelectItem key={idx} value={tmpl.body} className="text-xs">
                          {tmpl.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* PANEL 1: CONVERSATION THREAD */}
              {activePanel === 'thread' && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5" ref={scrollRef as any}>
                    {/* Initial User Inquiry Box (Crucial for tickets from ScoutAI Bot & Contact forms) */}
                    {(selectedTicket as any).message && (
                      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-blue-600 dark:text-blue-400">
                          <span className="flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5" /> Original Inquiry from {getTicketName(selectedTicket)}:
                          </span>
                          <span className="opacity-70 font-normal">
                            {selectedTicket.createdAt ? format(new Date(selectedTicket.createdAt), 'PPp') : ''}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                          {(selectedTicket as any).message}
                        </p>
                      </div>
                    )}

                    {/* Messages history */}
                    {msgsLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
                    ) : messages?.length === 0 && !(selectedTicket as any).message ? (
                      <p className="text-center text-xs text-muted-foreground py-8">No conversation messages logged yet.</p>
                    ) : messages?.map((msg) => (
                      <div key={msg.id} className={cn('flex flex-col', msg.senderType === 'agent' ? 'items-end' : 'items-start')}>
                        <p className="text-[10px] text-muted-foreground mb-1 px-1">
                          {msg.senderName || (msg.senderType === 'agent' ? 'Superadmin' : getTicketName(selectedTicket))}
                        </p>
                        <div className={cn('max-w-[82%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm',
                          msg.senderType === 'agent' 
                            ? 'bg-primary text-primary-foreground rounded-br-xs' 
                            : 'bg-muted rounded-bl-xs border border-border/50'
                        )}>
                          <p className="whitespace-pre-wrap">{msg.body}</p>
                        </div>
                        <span className="text-[9.5px] text-muted-foreground mt-1 px-1">
                          {msg.sentAt ? format(new Date(msg.sentAt), 'PPp') : ''}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Reply Composer with Email & SMS triggers */}
                  <form onSubmit={handleReply} className="p-3 border-t bg-muted/15 space-y-2 shrink-0">
                    <Textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={`Reply to ${getTicketName(selectedTicket)} (will notify via email)...`}
                      className="bg-background resize-none text-xs min-h-[65px] max-h-[140px]"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sendEmailReply}
                            onChange={e => setSendEmailReply(e.target.checked)}
                            className="rounded"
                          />
                          <Mail className="w-3 h-3 text-blue-500" /> Send Email Reply
                        </label>

                        {getTicketPhone(selectedTicket) && (
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sendSmsReply}
                              onChange={e => setSendSmsReply(e.target.checked)}
                              className="rounded"
                            />
                            <Phone className="w-3 h-3 text-purple-500" /> Send SMS Reply
                          </label>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Select value={replyStatusChoice} onValueChange={v => setReplyStatusChoice(v as TicketStatus)}>
                          <SelectTrigger className="h-8 text-[11px] w-36 bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending_user">Status: Pending User</SelectItem>
                            <SelectItem value="open">Status: Open</SelectItem>
                            <SelectItem value="resolved">Status: Resolved ✅</SelectItem>
                            <SelectItem value="closed">Status: Closed 🔒</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          type="submit"
                          size="sm"
                          disabled={!replyText.trim() || sending}
                          className="h-8 px-4 text-xs font-bold gap-1.5"
                        >
                          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Send Response
                        </Button>
                      </div>
                    </div>
                  </form>
                </>
              )}

              {/* PANEL 2: USER APP CONTEXT & ADMINISTRATIVE ACTIONS */}
              {activePanel === 'user_context' && (
                <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                  <div className="rounded-2xl border p-4 bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-primary" />
                        Platform Account Status
                      </h4>
                      {matchedUserProfile?.isVerified ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-300">
                          ✅ Verified Account
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-400 text-amber-600">
                          ⏳ Pending Verification
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[11.5px]">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">User Name</span>
                        <strong className="text-foreground">{matchedUserProfile?.firstName || matchedUserProfile?.displayName || getTicketName(selectedTicket)}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Account Email</span>
                        <strong className="text-foreground">{matchedUserProfile?.email || getTicketEmail(selectedTicket)}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Platform Role</span>
                        <strong className="text-foreground capitalize">{matchedUserProfile?.role || getTicketRole(selectedTicket)}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Sport / Club</span>
                        <strong className="text-foreground">{matchedUserProfile?.currentClub || matchedUserProfile?.primarySport || 'None specified'}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Phone Number</span>
                        <strong className="text-foreground">{matchedUserProfile?.phone || getTicketPhone(selectedTicket) || 'Not linked'}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">User UID</span>
                        <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{matchedUserProfile?.id || 'Unregistered Guest'}</code>
                      </div>
                    </div>
                  </div>

                  {/* Superadmin Quick Action Controls */}
                  <div className="rounded-2xl border p-4 space-y-3 bg-background">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Superadmin Resolution Tools
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Action 1: Verify Account */}
                      <Button
                        onClick={handleVerifyUserAccount}
                        disabled={isVerifyingUser || matchedUserProfile?.isVerified}
                        variant={matchedUserProfile?.isVerified ? 'outline' : 'default'}
                        className="h-10 text-xs justify-start gap-2"
                      >
                        {isVerifyingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                        {matchedUserProfile?.isVerified ? 'Account Already Verified' : 'Manually Verify Athlete / Club'}
                      </Button>

                      {/* Action 2: Bypass Email Verification */}
                      <Button
                        onClick={handleBypassEmailVerification}
                        disabled={isBypassingEmail || matchedUserProfile?.isEmailVerified}
                        variant="outline"
                        className="h-10 text-xs justify-start gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        {isBypassingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-4 h-4 text-blue-500" />}
                        {matchedUserProfile?.isEmailVerified ? 'Email Already Verified' : 'Bypass Email Verification (Instant)'}
                      </Button>

                      {/* Action 3: Unlock Onboarding */}
                      <Button
                        onClick={handleUnlockOnboarding}
                        disabled={isUnlockingOnboarding || matchedUserProfile?.profileCompleted}
                        variant="outline"
                        className="h-10 text-xs justify-start gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        {isUnlockingOnboarding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-4 h-4 text-purple-500" />}
                        {matchedUserProfile?.profileCompleted ? 'Onboarding Already Complete' : 'Unlock Onboarding & Activate'}
                      </Button>

                      {/* Action 4: Password Reset */}
                      <Button
                        onClick={handleSendPasswordReset}
                        disabled={isResettingPassword}
                        variant="outline"
                        className="h-10 text-xs justify-start gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        {isResettingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-4 h-4 text-amber-500" />}
                        Send Password Reset Email
                      </Button>

                      {/* Action 5: Mark Ticket Resolved */}
                      <Button
                        onClick={() => handleStatusChange('resolved')}
                        variant="outline"
                        className="h-10 text-xs justify-start gap-2 border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Mark Case Resolved & Closed
                      </Button>

                      {/* Action 6: View Public Profile */}
                      {matchedUserProfile?.id && (
                        <a
                          href={`/athletes/${matchedUserProfile.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-start gap-2 h-10 px-4 rounded-md border border-input bg-background hover:bg-accent text-xs font-medium"
                        >
                          <ExternalLink className="w-4 h-4 text-blue-500" />
                          Inspect Athlete Public Profile
                        </a>
                      )}

                      {/* Action 7: Resend Guide */}
                      <Button
                        onClick={() => {
                          setActivePanel('thread');
                          setReplyText(RESOLUTION_TEMPLATES[0].body);
                        }}
                        variant="outline"
                        className="h-10 text-xs justify-start gap-2"
                      >
                        <ArrowRight className="w-4 h-4 text-amber-500" />
                        Insert Onboarding Walkthrough
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* PANEL 3: INTERNAL NOTES */}
              {activePanel === 'notes' && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-amber-50/20" ref={scrollRef as any}>
                    {!notes?.length ? (
                      <p className="text-center text-xs text-muted-foreground py-8">No internal notes yet. Internal notes are only visible to superadmins.</p>
                    ) : notes.map(note => (
                      <div key={note.id} className="bg-amber-100/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-300">{note.agentName || 'Superadmin'}</span>
                          <span className="text-[10px] text-muted-foreground">{note.createdAt ? format(new Date(note.createdAt), 'PPp') : ''}</span>
                        </div>
                        <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">{note.note}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddNote} className="p-3 border-t bg-amber-50/10 flex gap-2 shrink-0">
                    <Textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Add an internal note for admin audit log…"
                      className="bg-background resize-none text-xs min-h-[55px] max-h-[120px]"
                    />
                    <Button type="submit" size="icon" className="self-end h-9 w-9 shrink-0 bg-amber-500 hover:bg-amber-600 text-white" disabled={!noteText.trim()}>
                      <StickyNote className="w-4 h-4" />
                    </Button>
                  </form>
                </>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
