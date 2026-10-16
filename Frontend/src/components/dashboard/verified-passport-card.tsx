'use client';

import type { AthleteProfile } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, ShieldAlert, Building2, Activity, Heart, MapPin, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface VerifiedPassportCardProps {
  profile: AthleteProfile;
}

export function VerifiedPassportCard({ profile }: VerifiedPassportCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [gpsOpen, setGpsOpen] = useState(false);
  const [gpsId, setGpsId] = useState(profile.gpsDeviceId || '');
  const [savingGps, setSavingGps] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);

  const verifiedMinutes = profile.matchHistory?.filter(m => m.isVerified).reduce((s, m) => s + (m.minutes || 0), 0) ?? profile.verifiedMinutes ?? 0;
  const hasId = !!profile.isVerified;
  const hasClub = profile.clubStatus === 'active' && !!profile.clubName;
  const hasMinutes = verifiedMinutes >= 90;
  const hasHealth = !!(profile.medicalScreenings?.some(s => s.verifiedBy) || profile.injuryHistory?.length === 0 || profile.injuryHistory?.some(i => i.verifiedBy));
  const hasGps = !!profile.gpsDeviceId || !!(profile.trainingLoads?.some(t => t.source === 'gps' && t.verifiedBy));

  const handleGpsSave = async () => {
    if (!firestore || !user?.uid) {
      toast({ variant: 'destructive', title: 'Not ready', description: 'Please sign in again.' });
      return;
    }
    if (!gpsId.trim()) {
      toast({ variant: 'destructive', title: 'Device ID required', description: 'Enter your GPS device ID (e.g. GT-1234).' });
      return;
    }
    setSavingGps(true);
    try {
      await updateDoc(doc(firestore, 'athletes', user.uid), {
        gpsDeviceId: gpsId.trim(),
        updatedAt: new Date().toISOString(),
      });
      toast({ title: 'GPS linked', description: `Device ${gpsId.trim()} linked — training loads will be verified.` });
      setGpsOpen(false);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Failed to link GPS', description: 'Please try again.' });
    } finally {
      setSavingGps(false);
    }
  };

  const items = [
    { key: 'id', label: 'ID', done: hasId, detail: hasId ? 'Verified' : 'Pending', icon: ShieldCheck, href: '/dashboard/verify', action: null },
    { key: 'club', label: 'Club', done: hasClub, detail: profile.clubName || 'No club', icon: Building2, href: '/dashboard/verify', action: null },
    { key: 'minutes', label: 'Minutes', done: hasMinutes, detail: `${verifiedMinutes}′ verified`, icon: Clock, href: '/dashboard/add-match', action: null },
    { key: 'health', label: 'Health', done: hasHealth, detail: profile.medicalScreenings?.length ? `${profile.medicalScreenings.length} screenings` : hasHealth ? 'No flags' : 'Action needed', icon: Heart, href: null, action: () => setHealthOpen(true) },
    { key: 'gps', label: 'GPS', done: hasGps, detail: profile.gpsDeviceId ? 'Linked' : 'Not linked', icon: MapPin, href: null, action: () => setGpsOpen(true) },
  ];

  const score = items.filter(i => i.done).length;
  const isComplete = score === 5;
  const tone = isComplete ? 'border-green-400/30 bg-green-500/5' : score >= 3 ? 'border-primary/20 bg-primary/5' : 'border-amber-400/30 bg-amber-500/5';

  return (
    <Card className={cn('border shadow-sm overflow-hidden', tone)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {isComplete ? <ShieldCheck className="h-5 w-5 text-green-600" /> : <ShieldAlert className="h-5 w-5 text-amber-600" />}
              <h3 className="text-sm font-black uppercase tracking-widest">Verified Passport</h3>
              <Badge variant="outline" className={cn('text-[9px] font-black uppercase tracking-widest', isComplete ? 'border-green-400 text-green-700' : 'border-amber-400 text-amber-700')}>
                {score}/5 {isComplete ? 'Verified' : score >=3 ? 'Pending' : 'Incomplete'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isComplete ? 'Insurer-ready — all 5 checks verified. Quote eligible.' : 'Complete 5 checks to unlock insurance quote. Showcase video does not count.'}
            </p>
          </div>
          <div className="hidden sm:block min-w-[160px] w-full max-w-[200px]">
            <Progress value={(score/5)*100} className="h-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{score} of 5 verified</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 mt-4">
          {items.map(item => {
            const content = (
              <>
                <item.icon className={cn('h-5 w-5 mx-auto', item.done ? 'text-green-600' : 'text-muted-foreground')} />
                <p className="text-[10px] font-black uppercase tracking-widest mt-1 truncate">{item.label}</p>
                <p className={cn('text-[10px] font-bold truncate', item.done ? 'text-green-700' : 'text-amber-700')}>{item.detail}</p>
                {item.done ? <CheckCircle2 className="h-3 w-3 mx-auto mt-1 text-green-600" /> : <AlertCircle className="h-3 w-3 mx-auto mt-1 text-amber-500" />}
              </>
            );
            const baseCls = cn('rounded-xl border p-2.5 text-center transition hover:bg-card w-full', item.done ? 'bg-green-500/10 border-green-400/30' : 'bg-card border-border hover:border-primary/30');
            return item.action ? (
              <button key={item.key} onClick={item.action} className={baseCls}>{content}</button>
            ) : (
              <Link key={item.key} href={item.href!} className={baseCls}>{content}</Link>
            );
          })}
        </div>

        <Dialog open={gpsOpen} onOpenChange={setGpsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Link GPS Device</DialogTitle>
              <DialogDescription>Enter your GPS tracker ID to verify training loads for insurance. Ask your coach for device ID.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Device ID</label>
                <Input value={gpsId} onChange={e => setGpsId(e.target.value)} placeholder="e.g. GT-1234 or ST-5678" className="font-mono" />
                <p className="text-[11px] text-muted-foreground">Linked device will auto-verify distance & load. You can change it in Settings.</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setGpsOpen(false)}>Cancel</Button>
                <Button onClick={handleGpsSave} disabled={savingGps || !gpsId.trim()}>{savingGps ? 'Linking…' : hasGps ? 'Update GPS' : 'Link GPS'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={healthOpen} onOpenChange={setHealthOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> Health Verification</DialogTitle>
              <DialogDescription>Manage injuries and medical screenings — all must be verified for insurance.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setHealthOpen(false); setLocation('/dashboard/injury-tracker'); }} className="rounded-xl border p-4 text-left hover:bg-muted/50 transition">
                  <Heart className="h-6 w-6 text-red-500 mb-2" />
                  <p className="text-sm font-black">Injuries</p>
                  <p className="text-xs text-muted-foreground mt-1">{profile.injuryHistory?.length ? `${profile.injuryHistory.length} records` : 'No records'}</p>
                  <p className="text-[11px] font-bold text-primary mt-2">Open Tracker →</p>
                </button>
                <button onClick={() => { setHealthOpen(false); setLocation('/dashboard/injury-tracker'); }} className="rounded-xl border p-4 text-left hover:bg-muted/50 transition">
                  <ShieldCheck className="h-6 w-6 text-emerald-600 mb-2" />
                  <p className="text-sm font-black">Medical</p>
                  <p className="text-xs text-muted-foreground mt-1">{profile.medicalScreenings?.length ? `${profile.medicalScreenings.length} screenings` : 'No screenings'}</p>
                  <p className="text-[11px] font-bold text-primary mt-2">Add Screening →</p>
                </button>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-bold text-amber-800">Insurer tip: Only entries with <span className="font-black">Verified</span> badge count. Ask your physio/coach to verify.</p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setHealthOpen(false)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
          <Activity className="h-3 w-3" />
          <span>Showcase video is <strong>not verified</strong> — for scouts only. Insurer uses verified minutes + health + GPS.</span>
        </div>
      </CardContent>
    </Card>
  );
}
