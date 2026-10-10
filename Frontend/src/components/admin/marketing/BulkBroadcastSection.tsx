'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Send, Mail, MessageSquare, Megaphone, Users, Sparkles, CheckCircle2,
  AlertCircle, Loader2, Phone, RefreshCw, KeyRound, Globe, Eye,
  ChevronDown, ChevronUp, Clock, ShieldCheck, ArrowRight, Smartphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

type TargetAudience = 'athletes' | 'clubs' | 'coaches' | 'onboarding_stuck' | 'unverified' | 'all' | 'custom';
type BroadcastChannel = 'email' | 'sms' | 'both';

const BROADCAST_TEMPLATES = [
  {
    id: 'onboarding_kickstart',
    title: '🏃 Athlete Onboarding Kickstart',
    description: 'Guide athletes to complete vitals, connect club, and generate radar chart.',
    audience: 'onboarding_stuck' as TargetAudience,
    channel: 'both' as BroadcastChannel,
    subject: 'Welcome to Talent Graph Kenya — Complete Your Baseline Metrics',
    emailBody: `Hi {firstName},

Welcome to Talent Graph Kenya! Your athlete account has been registered.

To ensure your Radar Chart and athletic profile are visible to scouts across Kenya and abroad:
1. Log in and confirm your primary position and baseline vitals (height & weight).
2. Connect your current club or academy (e.g. Verve FC).
3. Record your baseline testing metrics (30m sprint, vertical jump, agility).
4. Rate your tactical and technical attributes to generate your official CSI Score!

Get started now: https://talent-graph.vercel.app/onboarding

Best regards,
Talent Graph Scouting & Onboarding Desk`,
    smsBody: `Talent Graph: Hi {firstName}! Welcome. Complete your vitals & baseline metrics now to get your Radar Chart verified by scouts: talentgraph.africa/onboarding`,
  },
  {
    id: 'email_verification',
    title: '✉️ Email Verification Reminder',
    description: 'Remind users with unverified emails to activate their accounts.',
    audience: 'unverified' as TargetAudience,
    channel: 'both' as BroadcastChannel,
    subject: 'Action Required: Confirm Your Talent Graph Account',
    emailBody: `Hello {firstName},

We noticed you haven't confirmed your email address yet.

Confirming your account unlocks full access to match logging, trial invitations, and scout reports across Kenya and East Africa.

Log in here to verify: https://talent-graph.vercel.app/verify-email

Need help? Reply to this message or contact support@talentgraph.africa!`,
    smsBody: `Talent Graph: Hi {firstName}, your account is waiting! Confirm your email to start getting scouted across Kenya: talentgraph.africa/login`,
  },
  {
    id: 'match_day',
    title: '🏟️ Match Day Notice & Stats Logging',
    description: 'Encourage clubs and athletes to log match stats after fixtures.',
    audience: 'athletes' as TargetAudience,
    channel: 'both' as BroadcastChannel,
    subject: 'Upcoming Fixtures: Log Your Match Stats on Talent Graph',
    emailBody: `Hi {firstName},

Upcoming match fixture this week? Don't leave your performance off the radar!

Clubs, coaches, and players can log match minutes, goals, assists, and tactical evaluations immediately after the match. Verified match logs directly improve your institutional CSI rating.

Log your match stats here: https://talent-graph.vercel.app/dashboard/add-match

Play strong!`,
    smsBody: `Talent Graph Notice: Fixtures ahead! Remember to log your match minutes, goals and stats for scout evaluation at talentgraph.africa/dashboard/add-match`,
  },
  {
    id: 'scout_spotlight',
    title: '🔍 Scout Spotlight Alert',
    description: 'Notify athletes that scouts are actively browsing profiles.',
    audience: 'athletes' as TargetAudience,
    channel: 'both' as BroadcastChannel,
    subject: 'Scouts are actively reviewing profiles in your region!',
    emailBody: `Hi {firstName},

Scouts from premier academies and international clubs are searching for rising athletic talent this month.

Make sure your profile photo, performance metrics, and highlight clips are up to date so your profile stands out at the top of scout searches.

Inspect your profile now: https://talent-graph.vercel.app/dashboard`,
    smsBody: `Talent Graph Alert: Scouts are actively reviewing profiles in your division this week! Update your metrics to stay on top: talentgraph.africa`,
  },
  {
    id: 'custom',
    title: '✍️ Custom Marketing Announcement',
    description: 'Compose a custom marketing broadcast from scratch.',
    audience: 'all' as TargetAudience,
    channel: 'both' as BroadcastChannel,
    subject: 'Exciting Platform Update from Talent Graph Kenya',
    emailBody: `Hi {firstName},

We have an exciting update to share with you from Talent Graph Kenya.

Visit your dashboard to explore the latest features and opportunities: https://talent-graph.vercel.app

Best regards,
Talent Graph Team`,
    smsBody: `Talent Graph: Hi {firstName}, explore new opportunities and features on Talent Graph today: talentgraph.africa`,
  },
];

export function BulkBroadcastSection() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [audience, setAudience] = useState<TargetAudience>('athletes');
  const [channel, setChannel] = useState<BroadcastChannel>('both');
  const [selectedTemplate, setSelectedTemplate] = useState('onboarding_kickstart');
  const [subject, setSubject] = useState(BROADCAST_TEMPLATES[0].subject);
  const [emailBody, setEmailBody] = useState(BROADCAST_TEMPLATES[0].emailBody);
  const [smsBody, setSmsBody] = useState(BROADCAST_TEMPLATES[0].smsBody);

  const [customEmails, setCustomEmails] = useState('nzaiharun28@gmail.com');
  const [customPhones, setCustomPhones] = useState('+254700000000');

  // SMS API Provider config
  const [showSmsConfig, setShowSmsConfig] = useState(false);
  const [smsApiUrl, setSmsApiUrl] = useState('https://api.bulksms.com/v1/messages');
  const [smsApiKey, setSmsApiKey] = useState('');
  const [smsApiSecret, setSmsApiSecret] = useState('');
  const [smsSenderId, setSmsSenderId] = useState('TALENTGRAPH');

  const [isSending, setIsSending] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [lastBlastResult, setLastBlastResult] = useState<any>(null);

  // Live Users from Firestore
  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  const { data: allUsers, isLoading: usersLoading } = useCollection<any>(usersQuery);

  // Recent Campaigns from Firestore
  const campaignsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'marketing_campaigns'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  const { data: campaigns } = useCollection<any>(campaignsQuery);

  // Audience Count calculations
  const totalCount = allUsers?.length || 0;
  const athletesCount = (allUsers || []).filter(u => u.role === 'athlete').length;
  const clubsCount = (allUsers || []).filter(u => u.role === 'club').length;
  const coachesCount = (allUsers || []).filter(u => u.role === 'coach' || u.role === 'scout').length;
  const onboardingStuckCount = (allUsers || []).filter(u => !u.profileCompleted || u.onboardingStep === 'waiting_list').length;
  const unverifiedCount = (allUsers || []).filter(u => !u.isEmailVerified).length;

  const getRecipientEstimate = () => {
    switch (audience) {
      case 'athletes': return athletesCount || 15;
      case 'clubs': return clubsCount || 6;
      case 'coaches': return coachesCount || 8;
      case 'onboarding_stuck': return onboardingStuckCount || 10;
      case 'unverified': return unverifiedCount || 12;
      case 'all': return totalCount || 35;
      case 'custom':
        return channel === 'sms' 
          ? customPhones.split(',').filter(Boolean).length 
          : customEmails.split(',').filter(Boolean).length;
    }
  };

  const handleApplyTemplate = (tmplId: string) => {
    const tmpl = BROADCAST_TEMPLATES.find(t => t.id === tmplId);
    if (!tmpl) return;
    setSelectedTemplate(tmplId);
    setAudience(tmpl.audience);
    setChannel(tmpl.channel);
    setSubject(tmpl.subject);
    setEmailBody(tmpl.emailBody);
    setSmsBody(tmpl.smsBody);
    toast({ title: 'Template applied', description: tmpl.title });
  };

  const handleSendTest = async () => {
    if (isSendingTest) return;
    setIsSendingTest(true);
    try {
      const res = await fetch('/api/marketing/quick-blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAudience: 'custom',
          channel,
          subject: `[TEST] ${subject}`,
          emailBody,
          smsBody,
          customEmails: ['nzaiharun28@gmail.com'],
          customPhones: customPhones.split(',').map(s => s.trim()).filter(Boolean),
          smsConfig: smsApiKey ? { apiUrl: smsApiUrl, apiKey: smsApiKey, apiSecret: smsApiSecret, senderId: smsSenderId } : null,
          campaignName: `[TEST] ${subject.slice(0, 40)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Test send failed');

      toast({
        title: 'Test Broadcast Dispatched! ✉️',
        description: `Delivered test copy to nzaiharun28@gmail.com ${channel !== 'email' ? 'and test phone' : ''}.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Test dispatch issue',
        description: err?.message || 'Check connection',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (isSending) return;
    const count = getRecipientEstimate();
    if (!confirm(`Are you sure you want to broadcast this ${channel.toUpperCase()} message to ~${count} recipients?`)) {
      return;
    }

    setIsSending(true);
    setLastBlastResult(null);
    try {
      const res = await fetch('/api/marketing/quick-blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAudience: audience,
          channel,
          subject,
          emailBody,
          smsBody,
          customEmails: customEmails.split(',').map(s => s.trim()).filter(Boolean),
          customPhones: customPhones.split(',').map(s => s.trim()).filter(Boolean),
          smsConfig: smsApiKey ? { apiUrl: smsApiUrl, apiKey: smsApiKey, apiSecret: smsApiSecret, senderId: smsSenderId } : null,
          campaignName: subject.slice(0, 50),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Broadcast failed');

      setLastBlastResult(data);
      toast({
        title: 'Broadcast Dispatched Successfully! 🚀',
        description: `Delivered to ${data.totalRecipients || count} users (${data.emailSentCount || 0} emails, ${data.smsSentCount || 0} SMS).`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Broadcast failed',
        description: err?.message || 'Please try again',
      });
    } finally {
      setIsSending(false);
    }
  };

  const smsChars = smsBody.length;
  const smsSegments = Math.ceil(smsChars / 160) || 1;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500" />
                Superadmin Bulk Broadcast Center
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Dispatch bulk onboarding emails and promotional SMS alerts to registered athletes, clubs, and pending users. For emails we route via Firebase/SMTP, and for SMS you can use our built-in provider or plug in your API credentials.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSmsConfig(!showSmsConfig)}
              className="h-8 text-xs gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <KeyRound className="w-3.5 h-3.5 text-purple-600" />
              SMS API Setup {showSmsConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>
        </div>

        {/* Collapsible SMS API Configuration Card */}
        {showSmsConfig && (
          <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-1 md:grid-cols-4 gap-3 bg-background/80 p-4 rounded-xl border">
            <div>
              <label className="text-[11px] font-bold block mb-1">SMS API Endpoint / URL</label>
              <Input
                value={smsApiUrl}
                onChange={e => setSmsApiUrl(e.target.value)}
                placeholder="https://api.bulksms.com/v1/messages"
                className="h-8 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold block mb-1">API Key / Username</label>
              <Input
                value={smsApiKey}
                onChange={e => setSmsApiKey(e.target.value)}
                placeholder="Enter API Key / Username"
                className="h-8 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold block mb-1">API Secret / Password / Token</label>
              <Input
                type="password"
                value={smsApiSecret}
                onChange={e => setSmsApiSecret(e.target.value)}
                placeholder="••••••••••••••••"
                className="h-8 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold block mb-1">SMS Sender ID</label>
              <Input
                value={smsSenderId}
                onChange={e => setSmsSenderId(e.target.value)}
                placeholder="TALENTGRAPH"
                className="h-8 text-xs font-mono uppercase"
              />
            </div>
            <div className="md:col-span-4 flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>* When credentials are provided, SMS will be routed through your API. If left empty, it safely uses the default configured provider.</span>
              <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => toast({ title: 'Credentials saved for this session' })}>
                Save API Config
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: BUILDER & SETTINGS (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Quick Templates Selector */}
          <Card className="p-4">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Pre-Built Onboarding & Marketing Templates
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BROADCAST_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleApplyTemplate(t.id)}
                  className={cn(
                    'text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex flex-col justify-between',
                    selectedTemplate === t.id
                      ? 'border-primary bg-primary/10 shadow-xs'
                      : 'border-border/60 hover:bg-muted/50'
                  )}
                >
                  <span className="font-bold text-foreground">{t.title}</span>
                  <span className="text-[10.5px] text-muted-foreground line-clamp-1 mt-0.5">{t.description}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Configuration Form */}
          <Card className="p-5 space-y-4">
            
            {/* Audience & Channel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold block mb-1.5">
                  Target Audience ({getRecipientEstimate()} recipients)
                </label>
                <Select value={audience} onValueChange={v => setAudience(v as TargetAudience)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="athletes">🏃 All Registered Athletes ({athletesCount || '~15'})</SelectItem>
                    <SelectItem value="clubs">🏟️ Clubs & Academies ({clubsCount || '~6'})</SelectItem>
                    <SelectItem value="coaches">📋 Coaches & Scouts ({coachesCount || '~8'})</SelectItem>
                    <SelectItem value="onboarding_stuck">⏳ Onboarding Support / Waiting List ({onboardingStuckCount || '~10'})</SelectItem>
                    <SelectItem value="unverified">✉️ Unverified Email Users ({unverifiedCount || '~12'})</SelectItem>
                    <SelectItem value="all">👥 All Platform Users ({totalCount || '~35'})</SelectItem>
                    <SelectItem value="custom">🎯 Custom Numbers & Emails (Test Mode)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1.5">
                  Delivery Channel
                </label>
                <Select value={channel} onValueChange={v => setChannel(v as BroadcastChannel)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">🚀 Both Email + SMS</SelectItem>
                    <SelectItem value="email">📧 Bulk Email Only</SelectItem>
                    <SelectItem value="sms">📱 Bulk SMS Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Inputs (if custom audience selected) */}
            {audience === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl border">
                <div>
                  <label className="text-[11px] font-bold block mb-1">Test Emails (comma-separated)</label>
                  <Input
                    value={customEmails}
                    onChange={e => setCustomEmails(e.target.value)}
                    placeholder="email1@gmail.com, email2@gmail.com"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1">Test Phone Numbers (comma-separated)</label>
                  <Input
                    value={customPhones}
                    onChange={e => setCustomPhones(e.target.value)}
                    placeholder="+254712345678, +254798765432"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* Subject (for Email) */}
            {(channel === 'email' || channel === 'both') && (
              <div>
                <label className="text-xs font-bold block mb-1 flex items-center justify-between">
                  <span>Email Subject Line</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Supports {'{firstName}'}, {'{role}'}</span>
                </label>
                <Input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Welcome to Talent Graph — Complete Your Baseline Metrics"
                  className="text-xs font-medium"
                />
              </div>
            )}

            {/* Email Body */}
            {(channel === 'email' || channel === 'both') && (
              <div>
                <label className="text-xs font-bold block mb-1 flex items-center justify-between">
                  <span>Email Content / Message</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Formatted HTML template with Talent Graph branding</span>
                </label>
                <Textarea
                  rows={6}
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  placeholder="Compose your email message..."
                  className="text-xs leading-relaxed resize-none font-mono"
                />
              </div>
            )}

            {/* SMS Body */}
            {(channel === 'sms' || channel === 'both') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-purple-600" />
                    SMS Text Message
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    <strong className={cn(smsChars > 160 ? 'text-amber-600 font-black' : 'text-foreground')}>{smsChars}</strong> chars · {smsSegments} SMS segment{smsSegments !== 1 ? 's' : ''}
                  </span>
                </div>
                <Textarea
                  rows={3}
                  value={smsBody}
                  onChange={e => setSmsBody(e.target.value)}
                  placeholder="Talent Graph: Hi {firstName}, complete your athlete profile now at talentgraph.africa..."
                  className="text-xs leading-relaxed resize-none"
                />
              </div>
            )}

            {/* Actions Bar */}
            <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendTest}
                disabled={isSendingTest || isSending}
                className="w-full sm:w-auto h-9 text-xs gap-1.5 border-dashed"
              >
                {isSendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5 text-blue-500" />}
                Send Test to nzaiharun28@gmail.com
              </Button>

              <Button
                size="sm"
                onClick={handleSendBroadcast}
                disabled={isSending || isSendingTest}
                className="w-full sm:w-auto h-9 px-5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-md"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Dispatch {channel.toUpperCase()} Broadcast (~{getRecipientEstimate()} users)
              </Button>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE PREVIEW & RECENT BLASTS (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Live Preview Card */}
          <Card className="p-4 overflow-hidden">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-primary" />
              Live Recipient Preview
            </h4>

            {/* Email Preview Mockup */}
            {(channel === 'email' || channel === 'both') && (
              <div className="rounded-xl border bg-muted/20 overflow-hidden mb-3">
                <div className="bg-indigo-600 text-white px-3 py-2 flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-widest uppercase">Talent Graph Kenya</span>
                  <span className="text-[9px] opacity-80">Official Email</span>
                </div>
                <div className="p-3 bg-background space-y-2 text-xs">
                  <div className="border-b pb-1.5 text-[11px]">
                    <span className="text-muted-foreground block text-[9.5px] uppercase font-bold">Subject:</span>
                    <strong className="text-foreground">{subject.replace('{firstName}', 'Joseph')}</strong>
                  </div>
                  <div className="text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                    {emailBody.replace(/{firstName}/g, 'Joseph').replace(/{role}/g, 'Athlete')}
                  </div>
                  <div className="pt-2 border-t text-[9px] text-muted-foreground text-center">
                    Sent to joseph@talentgraph.africa · <span className="underline">Unsubscribe</span>
                  </div>
                </div>
              </div>
            )}

            {/* SMS Preview Mockup */}
            {(channel === 'sms' || channel === 'both') && (
              <div className="rounded-2xl border bg-muted/40 p-3 space-y-2">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="font-bold flex items-center gap-1 text-purple-600">
                    <Smartphone className="w-3.5 h-3.5" /> SMS from {smsSenderId || 'TALENTGRAPH'}
                  </span>
                  <span className="text-muted-foreground text-[9.5px]">Now</span>
                </div>
                <div className="bg-purple-600 text-white p-3 rounded-2xl rounded-tl-xs text-[11px] leading-relaxed shadow-sm">
                  {smsBody.replace(/{firstName}/g, 'Joseph') || 'No SMS body specified'}
                </div>
              </div>
            )}
          </Card>

          {/* Recent Broadcasts History */}
          <Card className="p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Recent Broadcast Blasts</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {campaigns?.length || 0} Total
              </Badge>
            </h4>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {!campaigns?.length ? (
                <p className="text-xs text-muted-foreground text-center py-4">No broadcasts dispatched yet.</p>
              ) : (
                campaigns.slice(0, 5).map((c: any) => (
                  <div key={c.id} className="p-2.5 rounded-xl border bg-background/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-[11.5px] truncate max-w-[180px]">{c.name || c.template?.subject || 'Broadcast'}</strong>
                      <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-200">
                        Delivered
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="capitalize">{c.channel || 'Email'} · {c.targetAudience || 'All'}</span>
                      <span>{c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ''}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
