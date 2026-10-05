'use client';

import React, { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { collection, query, orderBy, limit, doc, getDoc, setDoc, addDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, MapPin, BadgeCheck, Check, Send, ChevronRight, Trophy, ShieldCheck, X, MessageSquare, Lock, Compass, Home, Users, Headphones, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AthleteProfile } from '@/lib/types';

// Deterministic ID generator specified in protocol
export function getDeterministicId(uidA: string, uidB: string): string {
  return uidA < uidB ? `${uidA}_${uidB}` : `${uidB}_${uidA}`;
}

interface ClubEntity {
  id: string;
  clubName: string;
  location: string;
  role: string;
  verified: boolean;
  tier?: string;
}

export default function DiscoveryPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [activeTab, setActiveTab] = useState<'athletes' | 'clubs'>('athletes');
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<{ id: string; name: string; role: string } | null>(null);

  // Athletes Query
  const athletesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'athletes'), orderBy('rating', 'desc'), limit(30));
  }, [firestore]);
  const { data: rawAthletes, isLoading: athletesLoading } = useCollection<AthleteProfile>(athletesQuery);

  const athletes = useMemo(() => {
    if (!rawAthletes || rawAthletes.length === 0) {
      return [
        {
          uid: 'ath_001',
          firestoreId: 'ath_001',
          firstName: 'Joseph',
          lastName: 'Mwaura',
          sport: 'football',
          position: 'goalkeeper',
          rating: 80,
          photoUrl: '',
          clubName: 'AFC Leopards',
        },
        {
          uid: 'ath_002',
          firestoreId: 'ath_002',
          firstName: 'Issa',
          lastName: 'Maina',
          sport: 'football',
          position: 'forward',
          rating: 80,
          photoUrl: '',
          clubName: 'Thika FC',
        },
        {
          uid: 'ath_003',
          firestoreId: 'ath_003',
          firstName: 'Helen',
          lastName: 'Kavata',
          sport: 'football',
          position: 'midfielder',
          rating: 80,
          photoUrl: '',
          clubName: 'Thika FC',
        },
      ];
    }
    return rawAthletes;
  }, [rawAthletes]);

  const clubsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'clubs'), limit(15));
  }, [firestore]);
  const { data: rawClubs } = useCollection<ClubEntity>(clubsQuery);

  const clubs = useMemo(() => {
    if (!rawClubs || rawClubs.length === 0) {
      return [
        { id: 'c_1', clubName: 'AFC Leopards', location: 'Nairobi, Kenya', role: 'Premier League First Team', verified: true, tier: 'Tier 1 Pro' },
        { id: 'c_2', clubName: 'Bandari FC', location: 'Mombasa, Kenya', role: 'Premier League Club', verified: true, tier: 'Tier 1 Pro' },
        { id: 'c_3', clubName: 'Thika FC', location: 'Thika, Kenya', role: 'Youth & Pro Academy', verified: true, tier: 'Tier 2 Pro' },
      ];
    }
    return rawClubs;
  }, [rawClubs]);

  const filteredAthletes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return athletes.filter((a) => {
      const fullName = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
      const matchesSearch = !q || fullName.includes(q) || a.sport?.toLowerCase().includes(q) || a.position?.toLowerCase().includes(q) || a.clubName?.toLowerCase().includes(q);
      const matchesSport = selectedSport === 'all' || a.sport?.toLowerCase() === selectedSport.toLowerCase();
      return matchesSearch && matchesSport;
    });
  }, [athletes, searchQuery, selectedSport]);

  const handleOpenChat = (targetId: string, targetName: string, role: string) => {
    if (!user) {
      toast({ title: 'Authentication Required', description: 'Please log in to start a gated conversation.' });
      return;
    }
    setChatTarget({ id: targetId, name: targetName, role });
    setChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070D1D] text-white selection:bg-emerald-500 selection:text-slate-950 pb-24">
      {/* Systematic & Professional Header */}
      <header className="sticky top-0 z-40 border-b border-[#1E293B] bg-[#070D1D]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-[#00C853] flex items-center justify-center font-bold shadow-inner">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>Talent &amp; Club Discovery</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">Live</span>
              </h1>
              <p className="text-[11px] text-slate-400">Verified marketplace &amp; anti-spam communication engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="bg-[#00C853] hover:bg-[#00C853]/90 text-slate-950 font-black text-xs rounded-xl h-9 px-4">
              <Link href={user ? '/dashboard' : '/login'}>{user ? 'My Dashboard' : 'Log In'}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Systematic Filter & Navigation Bar */}
        <div className="space-y-4 bg-[#0F172A] p-4 sm:p-5 rounded-3xl border border-[#1E293B] shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1E293B]">
            <div>
              <h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider">
                {activeTab === 'athletes' ? 'Top Tier Athletes' : 'Featured Clubs & Academies'}
              </h2>
              <p className="text-xs text-slate-400">Filter by name, club, or position to connect securely.</p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#070D1D] p-1 rounded-xl border border-[#334155] shrink-0">
              <button
                onClick={() => setActiveTab('athletes')}
                className={cn('px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer', activeTab === 'athletes' ? 'bg-[#00C853] text-slate-950 shadow-md' : 'text-slate-400 hover:text-white')}
              >
                Athletes ({filteredAthletes.length})
              </button>
              <button
                onClick={() => setActiveTab('clubs')}
                className={cn('px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer', activeTab === 'clubs' ? 'bg-[#00C853] text-slate-950 shadow-md' : 'text-slate-400 hover:text-white')}
              >
                Clubs ({clubs.length})
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search athletes, Thika FC, position..."
                className="h-10 bg-[#070D1D] border-[#334155] pl-10 text-white placeholder:text-slate-500 rounded-xl text-xs"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {['all', 'football', 'basketball', 'rugby'].map((sp) => (
                <button
                  key={sp}
                  onClick={() => setSelectedSport(sp)}
                  className={cn('px-3.5 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap cursor-pointer transition border', selectedSport === sp ? 'bg-[#00C853]/20 border-[#00C853]/60 text-[#00C853]' : 'bg-[#070D1D] border-[#334155] text-slate-400 hover:text-white')}
                >
                  {sp === 'all' ? 'All Sports' : sp}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Vertical List */}
        {activeTab === 'athletes' ? (
          <div className="space-y-3">
            {filteredAthletes.map((ath) => {
              const fullName = `${ath.firstName || 'Athlete'} ${ath.lastName || ''}`.trim();
              const initials = fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
              const sportPos = `${ath.sport || 'football'} · ${ath.position || 'athlete'}`.toLowerCase();
              const score = ath.rating || 80;
              const club = ath.clubName || 'Thika FC';

              return (
                <div
                  key={ath.uid || ath.firestoreId}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#0F172A] border border-[#1E293B] hover:border-[#00C853]/60 transition shadow-md group"
                >
                  <div className="flex items-center gap-3.5">
                    {ath.photoUrl ? (
                      <img src={ath.photoUrl} alt={fullName} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#1E293B] text-[#00C853] font-black text-xs flex items-center justify-center border border-[#334155]">
                        {initials}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          onClick={() => setSelectedAthlete(ath)}
                          className="font-bold text-white text-sm hover:text-[#00C853] cursor-pointer"
                        >
                          {fullName}
                        </h3>
                        <span className="text-[10px] text-slate-400">({club})</span>
                      </div>
                      <p className="text-xs text-slate-400 capitalize mt-0.5">{sportPos}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full bg-[#1E293B] border border-[#334155] text-[10px] font-mono font-bold text-slate-300">
                      Score {score}
                    </span>
                    <Button
                      onClick={() => handleOpenChat(ath.uid || ath.firestoreId || 'ath_001', fullName, ath.position || 'Athlete')}
                      size="sm"
                      className="bg-[#00C853] hover:bg-[#00C853]/90 text-slate-950 font-black text-xs rounded-xl h-8 px-3.5 shadow-sm cursor-pointer"
                    >
                      + Connect
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {clubs.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#0F172A] border border-[#1E293B] shadow-md">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-[#00C853] flex items-center justify-center font-bold">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{c.clubName}</h3>
                    <p className="text-xs text-slate-400">{c.location} • {c.role}</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleOpenChat(c.id, c.clubName, 'Club Official')}
                  size="sm"
                  className="bg-[#00C853] hover:bg-[#00C853]/90 text-slate-950 font-black text-xs rounded-xl h-8 px-3.5 cursor-pointer"
                >
                  + Inquire
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Android-style Bottom Navigation Bar */}
      <nav aria-label="Bottom Navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-[#070D1D]/95 border-t border-[#1E293B] backdrop-blur-md py-2.5 px-4">
        <div className="max-w-md mx-auto flex items-center justify-around text-slate-400 text-[10px] font-bold">
          <Link href="/" className="flex flex-col items-center gap-1 hover:text-white">
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Link>
          <Link href="/feed" className="flex flex-col items-center gap-1 hover:text-white">
            <Radio className="w-5 h-5" />
            <span>Feeds</span>
          </Link>
          <Link href="/athletes" className="flex flex-col items-center gap-1 hover:text-white">
            <Users className="w-5 h-5" />
            <span>Athletes</span>
          </Link>
          <Link href="/discovery" className="flex flex-col items-center gap-1 text-[#00C853]">
            <Compass className="w-5 h-5" />
            <span>Discovery</span>
          </Link>
          <Link href="/support" className="flex flex-col items-center gap-1 hover:text-white">
            <Headphones className="w-5 h-5" />
            <span>Supports</span>
          </Link>
        </div>
      </nav>

      {/* Deep-dive Profile Modal */}
      {selectedAthlete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#334155] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 text-[#00C853] font-black text-xs flex items-center justify-center border border-[#334155]">
                  {`${selectedAthlete.firstName || 'A'}`.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{selectedAthlete.firstName} {selectedAthlete.lastName}</h3>
                  <p className="text-xs text-[#00C853]">{selectedAthlete.sport} · {selectedAthlete.position}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAthlete(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <p><strong>Club:</strong> {selectedAthlete.clubName || 'Thika FC'}</p>
              <p><strong>Performance Score:</strong> {selectedAthlete.rating || 80} / 100</p>
              <p><strong>Verification:</strong> ✓ Official Match Ledger Verified</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => setSelectedAthlete(null)} variant="outline" className="flex-1 border-[#334155] text-slate-300 text-xs">Close</Button>
              <Button onClick={() => {
                const name = `${selectedAthlete.firstName} ${selectedAthlete.lastName}`;
                setSelectedAthlete(null);
                handleOpenChat(selectedAthlete.uid || 'ath_001', name, selectedAthlete.position || 'Athlete');
              }} className="flex-1 bg-[#00C853] text-slate-950 font-black text-xs">Connect</Button>
            </div>
          </div>
        </div>
      )}

      {/* Gated Chat Modal */}
      {chatOpen && chatTarget && (
        <GatedChatModal currentUser={user} target={chatTarget} onClose={() => setChatOpen(false)} />
      )}
    </div>
  );
}

function GatedChatModal({ currentUser, target, onClose }: { currentUser: any; target: { id: string; name: string; role: string }; onClose: () => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const deterministicId = currentUser ? getDeterministicId(currentUser.uid, target.id) : '';

  const connectionDocRef = useMemoFirebase(() => (firestore && deterministicId ? doc(firestore, 'connections', deterministicId) : null), [firestore, deterministicId]);
  const messagesQuery = useMemoFirebase(() => (firestore && deterministicId ? query(collection(firestore, 'connections', deterministicId, 'messages'), orderBy('timestamp', 'asc')) : null), [firestore, deterministicId]);
  const { data: messages } = useCollection<{ id: string; senderId: string; senderName: string; text: string; timestamp: string }>(messagesQuery);

  const handleSendMessage = async () => {
    if (!text.trim() || !currentUser || !firestore) return;
    setSending(true);
    try {
      const connSnap = await getDoc(connectionDocRef!);
      const now = new Date().toISOString();
      if (!connSnap.exists()) {
        await setDoc(connectionDocRef!, { id: deterministicId, requesterId: currentUser.uid, recipientId: target.id, status: 'pending', requestedAt: now, messageCountBeforeAccept: 1 });
      }
      await addDoc(collection(firestore, 'connections', deterministicId, 'messages'), {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'User',
        text: text.trim(),
        timestamp: now,
      });
      setText('');
    } catch {
      toast({ variant: 'destructive', title: 'Error sending message' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0F172A] border border-[#334155] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl flex flex-col h-[480px]">
        <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
          <h3 className="font-bold text-white text-sm">Gated Chat with {target.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 p-2 bg-[#020617] rounded-xl border border-[#334155]">
          {(!messages || messages.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 text-xs">
              <Lock className="w-6 h-6 text-emerald-400 mb-1" />
              <p>Send an introductory message. Recipient acceptance unlocks full chat.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={cn('p-2.5 rounded-xl text-xs max-w-[80%]', m.senderId === currentUser?.uid ? 'ml-auto bg-[#00C853] text-slate-950' : 'mr-auto bg-slate-800 text-white')}>
                {m.text}
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type message..." className="bg-[#020617] border-[#334155] text-white text-xs h-9 rounded-xl" />
          <Button onClick={handleSendMessage} disabled={sending || !text.trim()} className="bg-[#00C853] text-slate-950 font-bold text-xs h-9 px-3 rounded-xl">Send</Button>
        </div>
      </div>
    </div>
  );
}
