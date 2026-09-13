'use client';

import type { AthleteProfile } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, ShieldAlert, Building2, Activity, Heart, MapPin, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VerifiedPassportCardProps {
  profile: AthleteProfile;
}

export function VerifiedPassportCard({ profile }: VerifiedPassportCardProps) {
  const verifiedMinutes = profile.matchHistory?.filter(m => m.isVerified).reduce((s, m) => s + (m.minutes || 0), 0) ?? profile.verifiedMinutes ?? 0;
  const hasId = !!profile.isVerified;
  const hasClub = profile.clubStatus === 'active' && !!profile.clubName;
  const hasMinutes = verifiedMinutes >= 90;
  const hasHealth = !!(profile.medicalScreenings?.some(s => s.verifiedBy) || profile.injuryHistory?.length === 0 || profile.injuryHistory?.some(i => i.verifiedBy));
  const hasGps = !!profile.gpsDeviceId || !!(profile.trainingLoads?.some(t => t.source === 'gps' && t.verifiedBy));

  const items = [
    { key: 'id', label: 'ID', done: hasId, detail: hasId ? 'Verified' : 'Pending', icon: ShieldCheck, href: '/dashboard/verify' },
    { key: 'club', label: 'Club', done: hasClub, detail: profile.clubName || 'No club', icon: Building2, href: '/dashboard/verify' },
    { key: 'minutes', label: 'Minutes', done: hasMinutes, detail: `${verifiedMinutes}′ verified`, icon: Clock, href: '/dashboard/add-match' },
    { key: 'health', label: 'Health', done: hasHealth, detail: profile.medicalScreenings?.length ? `${profile.medicalScreenings.length} screenings` : 'No flags', icon: Heart, href: '/dashboard/injury-tracker' },
    { key: 'gps', label: 'GPS', done: hasGps, detail: profile.gpsDeviceId ? 'Linked' : 'Not linked', icon: MapPin, href: '/dashboard/settings' },
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
          {items.map(item => (
            <Link key={item.key} href={item.href} className={cn('rounded-xl border p-2.5 text-center transition hover:bg-card', item.done ? 'bg-green-500/10 border-green-400/30' : 'bg-card border-border hover:border-primary/30')}>
              <item.icon className={cn('h-5 w-5 mx-auto', item.done ? 'text-green-600' : 'text-muted-foreground')} />
              <p className="text-[10px] font-black uppercase tracking-widest mt-1 truncate">{item.label}</p>
              <p className={cn('text-[10px] font-bold truncate', item.done ? 'text-green-700' : 'text-amber-700')}>{item.detail}</p>
              {item.done ? <CheckCircle2 className="h-3 w-3 mx-auto mt-1 text-green-600" /> : <AlertCircle className="h-3 w-3 mx-auto mt-1 text-amber-500" />}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
          <Activity className="h-3 w-3" />
          <span>Showcase video is <strong>not verified</strong> — for scouts only. Insurer uses verified minutes + health + GPS.</span>
        </div>
      </CardContent>
    </Card>
  );
}
