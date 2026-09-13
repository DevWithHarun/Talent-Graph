'use client';

import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { addDoc, collection, orderBy, query, where } from 'firebase/firestore';
import { BadgeCheck, Check, ChevronRight, Search, Send, Video } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { AthleteProfile, ScoutConnection } from '@/lib/types';

function AthleteCard({ athlete, connected, onConnect, connecting }: {
  athlete: AthleteProfile;
  connected: boolean;
  onConnect: () => void;
  connecting: boolean;
}) {
  const fullName = `${athlete.firstName} ${athlete.lastName}`.trim();
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#334155] bg-[#0A1224] transition-all hover:border-[#00C853]">
      <Link href={`/${athlete.username}`} className="relative aspect-[4/5] overflow-hidden bg-[#1E293B]">
        {athlete.photoUrl ? (
          <img src={athlete.photoUrl} alt={fullName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl font-black text-[#00C853]/50">{fullName.slice(0, 2).toUpperCase()}</div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          <span className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg', connected ? 'bg-[#00C853] text-black' : 'bg-black/65 text-white')}>
            {connected ? <Check className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5 text-[#00C853]" />}
            {connected ? 'Connected' : 'Open'}
          </span>
        </div>
        {athlete.highlightVideoUrl && <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/70 px-2.5 py-1 text-xs font-bold"><Video className="h-3.5 w-3.5 text-[#00C853]" /> Video</span>}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link href={`/${athlete.username}`} className="flex items-center gap-2 text-lg font-black text-white hover:text-[#00C853]">
          {fullName}
          {athlete.isVerified && <BadgeCheck className="h-4 w-4 text-blue-400" />}
        </Link>
        <div className="mt-1 flex items-center gap-2 text-sm text-[#94A3B8]"><span>{athlete.sport || 'Sport'}</span><span className="h-1 w-1 rounded-full bg-[#64748B]" /><span>{athlete.position || 'Athlete'}</span></div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <Link href={`/${athlete.username}`} className="inline-flex items-center text-sm font-bold text-[#00C853]">View Profile <ChevronRight className="ml-1 h-4 w-4" /></Link>
          <Button size="sm" variant="outline" disabled={connected || connecting} onClick={onConnect} className="border-[#00C853]/50 text-[#00C853] hover:bg-[#00C853] hover:text-black">
            {connecting ? 'Sending...' : connected ? 'Connected' : 'Connect'}
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function AthletesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [sport, setSport] = useState('all');
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const athletesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'athletes'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const connectionsQuery = useMemoFirebase(() => firestore && user ? query(collection(firestore, 'scout_connections'), where('scoutId', '==', user.uid)) : null, [firestore, user]);
  const { data: athletes, isLoading } = useCollection<AthleteProfile>(athletesQuery);
  const { data: connections } = useCollection<ScoutConnection>(connectionsQuery);

  const sports = useMemo(() => ['all', ...new Set((athletes ?? []).map(athlete => athlete.sport).filter(Boolean))], [athletes]);
  const filteredAthletes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (athletes ?? []).filter(athlete => {
      const fullName = `${athlete.firstName} ${athlete.lastName}`.toLowerCase();
      const matchesSearch = !term || fullName.includes(term) || athlete.sport?.toLowerCase().includes(term) || athlete.position?.toLowerCase().includes(term);
      return matchesSearch && (sport === 'all' || athlete.sport === sport);
    });
  }, [athletes, search, sport]);

  const connect = async (athlete: AthleteProfile) => {
    if (!user) { toast({ title: 'Log in required', description: 'Log in to connect with athletes.' }); return; }
    if (!firestore || connections?.some(connection => connection.athleteId === athlete.uid)) return;
    setConnectingId(athlete.uid);
    try {
      const now = new Date().toISOString();
      await addDoc(collection(firestore, 'scout_connections'), { scoutId: user.uid, athleteId: athlete.uid, status: 'pending', recruitment_stage: 'connected', createdAt: now, updatedAt: now });
      toast({ title: 'Connection request sent', description: `Your request to ${athlete.firstName} is pending.` });
    } catch { toast({ variant: 'destructive', title: 'Could not connect', description: 'Please try again.' }); }
    finally { setConnectingId(null); }
  };

  return (
    <div className="min-h-screen bg-[#0A1224] text-white">
      <header className="sticky top-0 z-40 border-b border-[#334155] bg-[#0A1224]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"><Link href="/" className="text-lg font-black uppercase tracking-wide"><span className="mr-2 text-[#00C853]">⚡</span>Talent Graph</Link><nav className="hidden items-center gap-7 text-sm font-bold text-[#94A3B8] md:flex"><Link href="/feed" className="hover:text-white">Feeds</Link><Link href="/athletes" className="text-[#00C853]">Discover Talent</Link><Link href="/scout-dashboard" className="hover:text-white">Discovery</Link></nav><Button asChild size="sm" className="bg-[#00C853] font-black text-black"><Link href={user ? '/feed' : '/login'}>{user ? 'Back to Feed' : 'Log In'}</Link></Button></div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-12 pb-24 sm:px-6 sm:py-16">
        <div className="mb-10 flex flex-col gap-6 text-center md:flex-row md:items-end md:justify-between md:text-left"><div><h1 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">Verified Athletes</h1><p className="mt-2 text-[#94A3B8]">Browse top talent and view their highlight reels.</p></div><Button asChild className="bg-[#00C853] font-black text-black hover:bg-[#00C853]/90"><Link href={user ? '/onboarding' : '/signup'}>Submit Your Profile</Link></Button></div>
        <div className="mb-8 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search athletes, sports, or positions..." className="h-11 border-[#334155] bg-[#1E293B] pl-10 text-white placeholder:text-[#94A3B8]" /></div><div className="flex gap-2 overflow-x-auto">{sports.map(item => <button key={item} onClick={() => setSport(item)} className={cn('shrink-0 rounded-full border px-4 py-2 text-sm font-bold capitalize', sport === item ? 'border-[#00C853] bg-[#00C853]/10 text-[#00C853]' : 'border-[#334155] text-[#94A3B8] hover:text-white')}>{item === 'all' ? 'All Sports' : item}</button>)}</div></div>
        {isLoading ? <div className="py-20 text-center text-[#94A3B8]">Loading verified athletes...</div> : filteredAthletes.length ? <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredAthletes.map(athlete => <AthleteCard key={athlete.uid} athlete={athlete} connected={!!connections?.some(connection => connection.athleteId === athlete.uid)} connecting={connectingId === athlete.uid} onConnect={() => connect(athlete)} />)}</div> : <div className="rounded-2xl border border-[#334155] bg-[#1E293B] py-20 text-center text-[#94A3B8]">No athletes match your search.</div>}
      </main>
    </div>
  );
}
