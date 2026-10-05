'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { UserAccount, AthleteProfile, ClubMatch } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import {
  LogOut, Loader2, Target, TrendingUp, ShieldAlert, BarChart3,
  Eye, Award, Layers, GitGraph, PlusCircle, Play, Zap, ArrowRight,
  CheckCircle2, Home, Pencil, Headphones, User, MoreHorizontal, Trash2,
  Plus, Flame, Clock, ShieldCheck, ShieldX, Building2, Bell, CheckCheck,
  Trophy, Settings2, Shield, Activity, Sparkles, Search, MessageSquare,
  Ruler, Scale, ChevronRight, Heart, AlertCircle, MapPin, Users, Mail,
  Gauge, Seedling, UserCheck, Bolt, BellRing, Briefcase, RefreshCw,
  Sliders, Futbol, ArrowUpDown, X, Camera, Video, FileText, CalendarCheck,
  Share2, ArrowRightFromBracket, FolderOpen, SlidersHorizontal, UploadCloud
} from 'lucide-react';
import { useAuth, useFirestore, useCollection, useMemoFirebase, useFirebaseApp } from '@/firebase';
import { doc, updateDoc, collection, query, where, addDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from '@/lib/navigation';
import { useToast } from '@/hooks/use-toast';
import { uploadFileWithProgress } from '@/firebase/storage';
import { PerformanceView } from '@/components/dashboard/performance-view';
import { clearSeededPerformanceData } from '@/firebase/athlete-performance';
import { AthleteProfileTab } from '@/components/dashboard/athlete-profile-tab';
import { AthleteCareerTab } from '@/components/dashboard/athlete-career-tab';
import { AthleteGrowthTab } from '@/components/dashboard/athlete-growth-tab';

interface AthleteDashboardProps {
  userAccount: UserAccount;
  athleteProfile?: AthleteProfile;
}

type AthleteTab = 'home' | 'profile' | 'performance' | 'growth' | 'network' | 'messages' | 'career';
type EditProfileTab = 'photo' | 'details' | 'video' | 'showcase';

export function AthleteDashboard({ userAccount, athleteProfile }: AthleteDashboardProps) {
  const auth = useAuth();
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const router = useRouter();
  const { toast } = useToast();
  const [location] = useLocation();

  // Active Tab state synced with URL or internal state
  const parseTabFromSearch = (searchStr: string): AthleteTab => {
    const params = new URLSearchParams(searchStr);
    const t = params.get('tab');
    if (t === 'profile' || t === 'performance' || t === 'growth' || t === 'network' || t === 'messages' || t === 'career') {
      return t;
    }
    return 'home';
  };

  const [activeTab, setActiveTab] = useState<AthleteTab>(() => {
    return parseTabFromSearch(window.location.search);
  });

  const selectTab = (tab: AthleteTab) => {
    setActiveTab(tab);
    const newUrl = tab === 'home' ? '/' : `/?tab=${tab}`;
    window.history.pushState(null, '', newUrl);
  };

  const uid = athleteProfile?.uid || userAccount.id;
  const firstName = athleteProfile?.firstName || userAccount.firstName || 'Athlete';
  const fullName = `${firstName} ${athleteProfile?.lastName || userAccount.lastName || ''}`.trim();
  const username = athleteProfile?.username || userAccount.email?.split('@')[0] || 'athlete';
  const tagline = athleteProfile?.sport ? `${athleteProfile.sport} ID: #TG-${uid.slice(0, 4).toUpperCase()}` : `Athlete ID: #TG-${uid.slice(0, 4).toUpperCase()}`;
  const clubName = athleteProfile?.clubName || 'Independent';
  const isClubActive = Boolean(athleteProfile?.affiliatedClubId && athleteProfile?.clubStatus === 'active');
  const availabilityStatus = athleteProfile?.clubStatus === 'active' ? 'Available' : 'Active';

  // Fetch matches logged by this athlete
  const matchesQuery = useMemoFirebase(() => (
    firestore && uid ? query(collection(firestore, 'matches'), where('athleteId', '==', uid)) : null
  ), [firestore, uid]);
  const { data: matches } = useCollection<ClubMatch>(matchesQuery);

  // Fetch conversations / messages
  const conversationsQuery = useMemoFirebase(() => (
    firestore && uid ? query(collection(firestore, 'conversations'), where('participants', 'array-contains', uid)) : null
  ), [firestore, uid]);
  const { data: conversations } = useCollection<any>(conversationsQuery);
  const unreadMessagesCount = conversations?.length ?? 3;

  // Fetch training sessions for this athlete
  const trainingQuery = useMemoFirebase(() => (
    firestore && uid ? query(collection(firestore, 'training_sessions'), where('athleteId', '==', uid)) : null
  ), [firestore, uid]);
  const { data: trainingSessions } = useCollection<any>(trainingQuery);
  const trainingCount = trainingSessions?.length ?? 0;

  // Fetch coach & physical assessments for this athlete
  const assessmentsQuery = useMemoFirebase(() => (
    firestore && uid ? query(collection(firestore, 'assessments'), where('athleteId', '==', uid)) : null
  ), [firestore, uid]);
  const { data: assessments } = useCollection<any>(assessmentsQuery);

  // Purge any previously seeded sample fixtures so only real user records appear
  useEffect(() => {
    if (firestore && uid) {
      clearSeededPerformanceData(firestore, uid);
    }
  }, [firestore, uid]);

  // Fetch injuries
  const injuriesQuery = useMemoFirebase(() => (
    firestore && uid ? query(collection(firestore, 'injuries'), where('athleteId', '==', uid)) : null
  ), [firestore, uid]);
  const { data: injuries } = useCollection<any>(injuriesQuery);
  const injuryCount = injuries?.filter((i: any) => i.status === 'active')?.length ?? 0;

  // Calculate stats strictly from real matches
  const totalMatches = matches?.length ?? 0;
  const totalMinutes = matches?.reduce((acc, m: any) => acc + (Number(m.minutesPlayed) || Number(m.minutes) || 0), 0) ?? 0;
  const totalGoals = matches?.reduce((acc, m: any) => acc + (Number(m.goals) || 0), 0) ?? 0;
  const totalAssists = matches?.reduce((acc, m: any) => acc + (Number(m.assists) || 0), 0) ?? 0;

  // Profile Completeness calculation
  const profileCompleteness = useMemo(() => {
    if (!athleteProfile) return 50;
    let filled = 0;
    let total = 8;
    if (athleteProfile.firstName) filled++;
    if (athleteProfile.lastName) filled++;
    if (athleteProfile.position) filled++;
    if (athleteProfile.sport) filled++;
    if (athleteProfile.photoUrl) filled++;
    if (athleteProfile.heightCm) filled++;
    if (athleteProfile.weightKg) filled++;
    if (athleteProfile.clubName) filled++;
    return Math.round((filled / total) * 100);
  }, [athleteProfile]);

  // Match form
  const [matchOpponent, setMatchOpponent] = useState('');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [matchCompetition, setMatchCompetition] = useState('League');
  const [matchResult, setMatchResult] = useState('W 2-1');
  const [matchMins, setMatchMins] = useState(90);
  const [matchGoals, setMatchGoals] = useState(0);
  const [matchAssists, setMatchAssists] = useState(0);
  const [matchRating, setMatchRating] = useState(7.5);
  const [matchShots, setMatchShots] = useState(4);
  const [matchShotsOnTarget, setMatchShotsOnTarget] = useState(2);
  const [matchKeyPasses, setMatchKeyPasses] = useState(2);
  const [matchPasses, setMatchPasses] = useState(38);
  const [matchPassAccuracy, setMatchPassAccuracy] = useState(82);
  const [matchDribbles, setMatchDribbles] = useState(4);
  const [matchSuccessfulDribbles, setMatchSuccessfulDribbles] = useState(2);
  const [matchTackles, setMatchTackles] = useState(2);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [isSavingMatch, setIsSavingMatch] = useState(false);

  // Edit profile form state
  const [editProfileTab, setEditProfileTab] = useState<EditProfileTab>('details');
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(athleteProfile?.photoUrl || null);
  
  // Specific requested fields: Country, Location/Town, Current Team, Club Name
  const [editCountry, setEditCountry] = useState(athleteProfile?.location?.split(',')[1]?.trim() || 'Kenya');
  const [editTown, setEditTown] = useState(athleteProfile?.location?.split(',')[0]?.trim() || 'Nairobi');
  const [editTeam, setEditTeam] = useState(athleteProfile?.team || 'Gor Mahia FC');
  const [editClubName, setEditClubName] = useState(athleteProfile?.clubName || 'AFC Leopards');

  // Video state (upload from local storage)
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);
  const [editVideoPreview, setEditVideoPreview] = useState<string | null>(athleteProfile?.highlightVideoUrl || null);
  const [editVideoUrl, setEditVideoUrl] = useState(athleteProfile?.highlightVideoUrl || '');
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);

  // Showcase state
  const [editBio, setEditBio] = useState(athleteProfile?.bio || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync photo & video previews when profile changes
  useEffect(() => {
    if (athleteProfile?.photoUrl && !editPhotoFile) {
      setEditPhotoPreview(athleteProfile.photoUrl);
    }
    if (athleteProfile?.highlightVideoUrl && !editVideoFile) {
      setEditVideoPreview(athleteProfile.highlightVideoUrl);
    }
  }, [athleteProfile?.photoUrl, athleteProfile?.highlightVideoUrl, editPhotoFile, editVideoFile]);

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch {
      toast({ variant: 'destructive', title: 'Logout Failed', description: 'Please try again.' });
    }
  };

  // Save Match
  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !uid || !matchOpponent) return;
    setIsSavingMatch(true);
    try {
      await addDoc(collection(firestore, 'matches'), {
        athleteId: uid,
        opponent: matchOpponent,
        date: matchDate,
        competition: matchCompetition,
        result: matchResult,
        minutesPlayed: Number(matchMins),
        goals: Number(matchGoals),
        assists: Number(matchAssists),
        rating: Number(matchRating),
        shots: Number(matchShots),
        shotsOnTarget: Number(matchShotsOnTarget),
        keyPasses: Number(matchKeyPasses),
        passes: Number(matchPasses),
        passAccuracy: Number(matchPassAccuracy),
        dribbles: Number(matchDribbles),
        successfulDribbles: Number(matchSuccessfulDribbles),
        tackles: Number(matchTackles),
        createdAt: new Date().toISOString(),
      });
      toast({ title: 'Match logged successfully!' });
      setMatchOpponent('');
      setMatchGoals(0);
      setMatchAssists(0);
      (document.getElementById('modal_log_match') as any)?.close();
    } catch {
      toast({ variant: 'destructive', title: 'Could not log match' });
    } finally {
      setIsSavingMatch(false);
    }
  };

  // Save Profile Details
  const handleSaveProfile = async () => {
    if (!firestore || !uid) return;
    setIsSavingProfile(true);
    try {
      let downloadPhotoUrl = athleteProfile?.photoUrl || '';
      if (editPhotoFile && firebaseApp) {
        downloadPhotoUrl = await uploadFileWithProgress(
          firebaseApp,
          `athletes/${uid}/profile_${Date.now()}_${editPhotoFile.name}`,
          editPhotoFile,
          () => {}
        );
      }

      let downloadVideoUrl = editVideoUrl || athleteProfile?.highlightVideoUrl || '';
      if (editVideoFile && firebaseApp) {
        downloadVideoUrl = await uploadFileWithProgress(
          firebaseApp,
          `athletes/${uid}/videos/${Date.now()}_${editVideoFile.name}`,
          editVideoFile,
          (p) => setVideoUploadProgress(p.progress)
        );
      }

      const athleteRef = doc(firestore, 'athletes', uid);
      await updateDoc(athleteRef, {
        photoUrl: downloadPhotoUrl || athleteProfile?.photoUrl || '',
        location: `${editTown}, ${editCountry}`,
        team: editTeam,
        clubName: editClubName || editTeam,
        bio: editBio,
        highlightVideoUrl: downloadVideoUrl,
        updatedAt: new Date().toISOString(),
      });

      toast({ title: 'Profile details saved successfully!' });
      (document.getElementById('edit_profile_modal') as any)?.close();
    } catch {
      toast({ variant: 'destructive', title: 'Error saving profile' });
    } finally {
      setIsSavingProfile(false);
      setVideoUploadProgress(0);
    }
  };

  return (
    <div className="bg-[#F9FAFB] text-[#111827] min-h-screen flex flex-col pb-28 font-sans">
      {/* HEADER */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40 shadow-sm">
        <div className="px-4 md:px-6 h-16 flex items-center gap-3 max-w-5xl mx-auto w-full">
          <button
            onClick={() => (document.getElementById('athlete_menu_modal') as any)?.showModal()}
            className="btn btn-ghost btn-circle btn-sm text-[#111827] hover:bg-gray-100 shrink-0 cursor-pointer"
            aria-label="Open menu"
          >
            <i className="fa-solid fa-bars text-xl" />
          </button>

          <h1 className="font-extrabold text-lg tracking-tight flex-1 truncate font-serif">
            {activeTab === 'home' && 'Command Center'}
            {activeTab === 'profile' && 'Athlete Profile Hub'}
            {activeTab === 'performance' && 'Performance & Matches'}
            {activeTab === 'growth' && 'Growth & Development'}
            {activeTab === 'career' && 'Career Timeline & History'}
            {activeTab === 'network' && 'Scout Network'}
            {activeTab === 'messages' && 'Messages'}
          </h1>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => selectTab('messages')}
              className="btn btn-ghost btn-circle btn-sm text-gray-500 hover:text-[#111827] hover:bg-gray-100 cursor-pointer"
              aria-label="Messages"
            >
              <i className="fa-regular fa-comment-dots text-lg" />
            </button>
            <div
              onClick={() => selectTab('profile')}
              className="w-8 h-8 rounded-full bg-blue-50 flex shrink-0 items-center justify-center text-[#0D9488] border border-blue-100 overflow-hidden shadow-sm cursor-pointer ml-1 font-bold text-xs"
              title="Athlete Profile Hub"
            >
              {editPhotoPreview || athleteProfile?.photoUrl ? (
                <img src={editPhotoPreview || athleteProfile?.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{fullName.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow p-4 md:p-6 w-full max-w-5xl mx-auto">
        {/* ── TAB 1: HOME (COMMAND CENTER) ── */}
        {activeTab === 'home' && (
          <div className="space-y-5 sm:space-y-6">
            {/* Welcome & Completeness */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-5 bg-white p-5 sm:p-6 md:p-8 rounded-3xl shadow-sm border border-[#E5E7EB]">
              <div className="min-w-0">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#111827] tracking-tight mb-2 font-serif">
                  Welcome back, {firstName}
                </h2>
                <p className="text-gray-500 font-medium text-sm">
                  Talent Graph ID: <span className="text-[#111827] font-bold tracking-wider">{tagline}</span>
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {isClubActive && (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-emerald-100 uppercase tracking-widest">
                      <i className="fa-solid fa-circle-check" /> Club Active
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-blue-100 uppercase tracking-widest">
                    <i className="fa-solid fa-futbol" /> {availabilityStatus}
                  </span>
                </div>
              </div>
              <div className="w-full md:w-auto md:min-w-[13rem]">
                <div className="flex justify-between items-end mb-3">
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Profile Completeness</p>
                  <div className="text-3xl font-black text-[#0D9488] leading-none">{profileCompleteness}%</div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-[#0D9488] h-2.5 rounded-full transition-all" style={{ width: `${profileCompleteness}%` }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-5 sm:space-y-6">
                {/* Current Status */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#E5E7EB]">
                  <h3 className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-gray-500 mb-5 flex items-center gap-2">
                    <i className="fa-solid fa-user-check text-gray-400" /> Current Status
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Club</p>
                      <p className="font-bold text-[#111827] text-sm">{clubName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Readiness</p>
                      <p className="font-bold text-[#111827] text-sm">{athleteProfile?.readinessScore ?? 92}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Match Status</p>
                      <p className="font-bold text-[#111827] text-sm">{availabilityStatus}</p>
                    </div>
                  </div>
                </div>

                {/* Performance Snapshot */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#E5E7EB]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <h3 className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-gray-500 flex items-center gap-2">
                      <i className="fa-solid fa-bolt text-gray-400" /> Performance Snapshot
                    </h3>
                    <button
                      onClick={() => selectTab('performance')}
                      className="text-[10px] font-bold text-[#0D9488] uppercase tracking-widest hover:underline cursor-pointer"
                    >
                      View Matches
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#F9FAFB] rounded-2xl p-4 border border-[#E5E7EB] text-center">
                      <div className="text-3xl font-black text-[#111827] mb-1">{totalMatches}</div>
                      <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Matches</div>
                    </div>
                    <div className="bg-[#F9FAFB] rounded-2xl p-4 border border-[#E5E7EB] text-center">
                      <div className="text-3xl font-black text-gray-900">{totalMinutes}</div>
                      <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Minutes</div>
                    </div>
                    <div className="bg-[#F9FAFB] rounded-2xl p-4 border border-[#E5E7EB] text-center">
                      <div className="text-3xl font-black text-[#111827] mb-1">{totalGoals}</div>
                      <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Goals</div>
                    </div>
                    <div className="bg-[#F9FAFB] rounded-2xl p-4 border border-[#E5E7EB] text-center">
                      <div className="text-3xl font-black text-[#0D9488] mb-1">{totalAssists}</div>
                      <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Assists</div>
                    </div>
                  </div>
                </div>

                {/* Development */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#E5E7EB]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-gray-500 flex items-center gap-2">
                      <i className="fa-solid fa-arrow-trend-up text-gray-400" /> Development
                    </h3>
                    <Link href="/dashboard/update-attributes" className="text-[10px] font-bold text-[#0D9488] uppercase tracking-widest hover:underline">
                      Open Plan
                    </Link>
                  </div>
                  <Link href="/dashboard/update-attributes" className="flex items-center gap-4 p-4 rounded-2xl bg-[#F9FAFB] hover:bg-gray-100 border border-[#E5E7EB] no-underline transition-colors">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-seedling" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[#111827]">Track your active goals and drills</p>
                      <p className="text-[11px] text-gray-500">Refine your attributes across 35+ professional criteria.</p>
                    </div>
                    <i className="fa-solid fa-chevron-right text-xs text-gray-300 ml-auto" />
                  </Link>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-5 sm:space-y-6">
                {/* Action Alerts */}
                <div className="bg-[#FFFDF0] rounded-3xl p-5 sm:p-6 shadow-sm border border-yellow-200/60">
                  <h3 className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-yellow-800 mb-5 flex items-center gap-2">
                    <i className="fa-solid fa-bell" /> Action Alerts
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => selectTab('messages')}
                      className="w-full flex items-start gap-3 bg-white p-3.5 rounded-xl border border-yellow-100 shadow-sm text-left hover:-translate-y-0.5 transition-transform cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0">
                        <i className="fa-regular fa-envelope text-sm" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#111827] leading-tight mb-1">{unreadMessagesCount} messages</p>
                        <p className="text-[10px] text-gray-500 leading-tight">From scouts, coaches and clubs.</p>
                      </div>
                    </button>
                    <button
                      onClick={() => selectTab('growth')}
                      className="w-full flex items-start gap-3 bg-white p-3.5 rounded-xl border border-blue-100 shadow-sm text-left hover:-translate-y-0.5 transition-transform cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-dumbbell text-sm" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#111827] leading-tight mb-1">{trainingCount} training sessions</p>
                        <p className="text-[10px] text-gray-500 leading-tight">Scheduled on your calendar.</p>
                      </div>
                    </button>
                    <Link href="/dashboard/injury-tracker" className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-rose-100 shadow-sm no-underline hover:-translate-y-0.5 transition-transform">
                      <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-heart-pulse text-sm" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#111827] leading-tight mb-1">{injuryCount} injury log</p>
                        <p className="text-[10px] text-gray-500 leading-tight">Review your squad readiness.</p>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#E5E7EB]">
                  <h3 className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-gray-500 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-location-arrow text-gray-400" /> Quick Links
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => {
                        setEditProfileTab('details');
                        (document.getElementById('edit_profile_modal') as any)?.showModal();
                      }}
                      className="btn btn-sm justify-start bg-[#F9FAFB] hover:bg-gray-100 text-[#111827] border-none font-semibold rounded-lg h-11 flex gap-3 cursor-pointer"
                    >
                      <div className="w-6 text-center text-gray-400"><i className="fa-regular fa-user" /></div> My Profile
                    </button>
                    <button
                      onClick={() => selectTab('network')}
                      className="btn btn-sm justify-start bg-[#F9FAFB] hover:bg-gray-100 text-[#111827] border-none font-semibold rounded-lg h-11 flex gap-3 cursor-pointer"
                    >
                      <div className="w-6 text-center text-gray-400"><i className="fa-solid fa-briefcase" /></div> Opportunities
                    </button>
                    <button
                      onClick={() => (document.getElementById('modal_log_match') as any)?.showModal()}
                      className="btn btn-sm justify-start bg-[#F9FAFB] hover:bg-gray-100 text-[#111827] border-none font-semibold rounded-lg h-11 flex gap-3 cursor-pointer"
                    >
                      <div className="w-6 text-center text-gray-400"><i className="fa-solid fa-futbol" /></div> Log a Match
                    </button>
                    <Link
                      href="/onboarding/metrics"
                      className="btn btn-sm justify-start bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 font-bold rounded-lg h-11 flex gap-3 no-underline cursor-pointer"
                    >
                      <div className="w-6 text-center text-emerald-600"><i className="fa-solid fa-arrows-rotate" /></div> Update Master Index
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: PERFORMANCE (COMPREHENSIVE 8-PART ARCHITECTURE POWERED BY FIREBASE) ── */}
        {activeTab === 'performance' && (
          <PerformanceView
            athleteProfile={athleteProfile}
            userAccount={userAccount}
            matches={matches || []}
            trainingSessions={trainingSessions || []}
            assessments={assessments || []}
            onOpenLogMatch={() => (document.getElementById('modal_log_match') as any)?.showModal()}
          />
        )}

        {/* ── TAB 3: GROWTH & DEVELOPMENT ── */}
        {activeTab === 'growth' && (
          <AthleteGrowthTab athleteProfile={athleteProfile} userAccount={userAccount} />
        )}

        {/* ── TAB 4: NETWORK & OPPORTUNITIES ── */}
        {activeTab === 'network' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm">
              <h2 className="text-2xl font-black text-gray-900 font-serif">Scout Network & Trials</h2>
              <p className="text-sm text-gray-500 mt-1">Discover verified club trials, scout inquiries, and academy openings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3">
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded bg-teal-50 text-[#0D9488] border border-teal-100">
                  Open Trial
                </span>
                <h4 className="font-bold text-gray-900 text-base">U18 Academy Intake 2026</h4>
                <p className="text-xs text-gray-500">Nairobi Elite Academy • Full scholarships available for registered midfield talent.</p>
                <Link href="/athletes" className="btn btn-sm w-full bg-gray-900 text-white font-bold rounded-lg border-none mt-2">
                  View Opportunity
                </Link>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3">
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100">
                  Scout Showcase
                </span>
                <h4 className="font-bold text-gray-900 text-base">Coastal Youth Showcase</h4>
                <p className="text-xs text-gray-500">14 Verified scouts registered in attendance. Open for all position categories.</p>
                <Link href="/athletes" className="btn btn-sm w-full bg-gray-900 text-white font-bold rounded-lg border-none mt-2">
                  View Opportunity
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: MESSAGES ── */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm">
              <h2 className="text-2xl font-black text-gray-900 font-serif">Messages & Scouting Inquiries</h2>
              <p className="text-sm text-gray-500 mt-1">Direct communication with coaches, clubs and verified scouts.</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm text-center py-12 space-y-4">
              <div className="w-14 h-14 rounded-full bg-teal-50 text-[#0D9488] flex items-center justify-center mx-auto text-2xl">
                <i className="fa-regular fa-comment-dots" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Unified Messaging Hub</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                  Connect with coaches, respond to trial invites, and discuss opportunities in real time.
                </p>
              </div>
              <Link href="/chat" className="btn bg-[#0D9488] hover:bg-teal-700 text-white font-bold rounded-xl px-6 border-none cursor-pointer">
                Open Full Chat Hub
              </Link>
            </div>
          </div>
        )}

        {/* ── TAB: PROFILE (AUTHORITATIVE IDENTITY HUB) ── */}
        {activeTab === 'profile' && (
          <AthleteProfileTab
            athleteProfile={athleteProfile}
            userAccount={userAccount}
            theme="light"
          />
        )}

        {/* ── TAB: CAREER (VERIFIED SPORTING HISTORY & RISK INTELLIGENCE) ── */}
        {activeTab === 'career' && (
          <AthleteCareerTab
            athleteProfile={athleteProfile}
            userAccount={userAccount}
            theme="light"
          />
        )}
      </main>

      {/* ── ATHLETESWEB.HTML EXACT BOTTOM NAVIGATION BAR ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E7EB] flex justify-around items-stretch shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <button
          type="button"
          onClick={() => selectTab('home')}
          className={`flex flex-col items-center justify-center gap-1 w-full py-2.5 min-h-[4.25rem] transition-colors cursor-pointer border-none bg-transparent ${
            activeTab === 'home' ? 'text-[#0D9488]' : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          <i className="fa-solid fa-house text-lg" />
          <span className="text-[9px] font-bold tracking-tight">Home</span>
        </button>

        <button
          type="button"
          onClick={() => selectTab('profile')}
          className={`flex flex-col items-center justify-center gap-1 w-full py-2.5 min-h-[4.25rem] transition-colors cursor-pointer border-none bg-transparent ${
            activeTab === 'profile' ? 'text-[#0D9488]' : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          <i className="fa-solid fa-id-card text-lg" />
          <span className="text-[9px] font-bold tracking-tight">Profile</span>
        </button>

        <button
          type="button"
          onClick={() => selectTab('performance')}
          className={`flex flex-col items-center justify-center gap-1 w-full py-2.5 min-h-[4.25rem] transition-colors cursor-pointer border-none bg-transparent ${
            activeTab === 'performance' ? 'text-[#0D9488]' : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          <i className="fa-solid fa-gauge-high text-lg" />
          <span className="text-[9px] font-bold tracking-tight">Performance</span>
        </button>

        <button
          type="button"
          onClick={() => selectTab('network')}
          className={`flex flex-col items-center justify-center gap-1 w-full py-2.5 min-h-[4.25rem] transition-colors cursor-pointer border-none bg-transparent ${
            activeTab === 'network' ? 'text-[#0D9488]' : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          <i className="fa-solid fa-user-group text-lg" />
          <span className="text-[9px] font-bold tracking-tight">Network</span>
        </button>

        <button
          type="button"
          onClick={() => selectTab('messages')}
          className={`flex flex-col items-center justify-center gap-1 w-full py-2.5 min-h-[4.25rem] transition-colors cursor-pointer border-none bg-transparent ${
            activeTab === 'messages' ? 'text-[#0D9488]' : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          <i className="fa-solid fa-comment-dots text-lg" />
          <span className="text-[9px] font-bold tracking-tight">Messages</span>
        </button>
      </nav>

      {/* ── HANGING QUICK-ACTION FAB (ATHLETESWEB.HTML) ── */}
      <button
        id="athlete_fab"
        type="button"
        onClick={() => (document.getElementById('athlete_quick_actions_modal') as any)?.showModal()}
        className="fixed right-4 bottom-24 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0D9488] text-white shadow-xl shadow-teal-900/30 ring-4 ring-white hover:bg-teal-700 active:scale-95 transition-all cursor-pointer border-none no-underline"
        aria-label="Open quick actions"
      >
        <i className="fa-solid fa-plus text-2xl" />
      </button>

      {/* MODALS */}
      {/* Quick Actions Modal */}
      <dialog id="athlete_quick_actions_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white text-[#111827] rounded-t-3xl sm:rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center">
                <i className="fa-solid fa-bolt" />
              </div>
              <h3 className="font-bold text-xl font-serif">Quick Actions</h3>
            </div>
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost text-gray-400 hover:bg-gray-100"><i className="fa-solid fa-xmark text-lg" /></button>
            </form>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Link
              href="/dashboard/update-attributes"
              onClick={() => (document.getElementById('athlete_quick_actions_modal') as any)?.close()}
              className="flex items-center gap-4 w-full text-left p-4 rounded-2xl bg-purple-50 text-purple-800 hover:bg-purple-100 transition-colors border border-purple-100 cursor-pointer no-underline"
            >
              <div className="w-11 h-11 rounded-xl bg-white/70 flex items-center justify-center shrink-0"><i className="fa-solid fa-sliders text-lg" /></div>
              <div>
                <p className="font-bold text-[15px]">Refine Attributes</p>
                <p className="text-[11px] text-purple-700/70">Tune your tactical attributes across 35+ professional criteria.</p>
              </div>
            </Link>

            <Link
              href="/onboarding/metrics"
              onClick={() => (document.getElementById('athlete_quick_actions_modal') as any)?.close()}
              className="flex items-center gap-4 w-full text-left p-4 rounded-2xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-100 cursor-pointer no-underline"
            >
              <div className="w-11 h-11 rounded-xl bg-white/70 flex items-center justify-center shrink-0"><i className="fa-solid fa-arrows-rotate text-lg" /></div>
              <div>
                <p className="font-bold text-[15px]">Update Master Index</p>
                <p className="text-[11px] text-emerald-700/70">Update positional metrics and baseline performance criteria.</p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => {
                (document.getElementById('athlete_quick_actions_modal') as any)?.close();
                (document.getElementById('modal_log_match') as any)?.showModal();
              }}
              className="flex items-center gap-4 w-full text-left p-4 rounded-2xl bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors border border-blue-100 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-white/70 flex items-center justify-center shrink-0"><i className="fa-solid fa-futbol text-lg" /></div>
              <div>
                <p className="font-bold text-[15px]">Log a Match</p>
                <p className="text-[11px] text-blue-700/70">Add minutes, goals, assists and a match rating.</p>
              </div>
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
      </dialog>

      {/* ── EXPANDED LOG A MATCH MODAL (CONNECTED TO FIREBASE) ── */}
      <dialog id="modal_log_match" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#0D9488] tracking-widest">Match Record Entry</span>
              <h3 className="font-bold text-xl font-serif">Log a Match</h3>
            </div>
            <form method="dialog"><button className="btn btn-sm btn-circle btn-ghost text-gray-400"><i className="fa-solid fa-xmark text-lg" /></button></form>
          </div>

          <form onSubmit={handleSaveMatch} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset w-full">
                <label className="fieldset-label font-medium text-gray-700 mb-1">Opponent</label>
                <input type="text" value={matchOpponent} onChange={e => setMatchOpponent(e.target.value)} className="input w-full bg-gray-50 border-[#E5E7EB]" placeholder="e.g. Bandari FC" required />
              </fieldset>
              <fieldset className="fieldset w-full">
                <label className="fieldset-label font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} className="input w-full bg-gray-50 border-[#E5E7EB]" required />
              </fieldset>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset w-full">
                <label className="fieldset-label font-medium text-gray-700 mb-1">Competition</label>
                <input type="text" value={matchCompetition} onChange={e => setMatchCompetition(e.target.value)} className="input w-full bg-gray-50 border-[#E5E7EB]" />
              </fieldset>
              <fieldset className="fieldset w-full">
                <label className="fieldset-label font-medium text-gray-700 mb-1">Result</label>
                <input type="text" value={matchResult} onChange={e => setMatchResult(e.target.value)} className="input w-full bg-gray-50 border-[#E5E7EB]" placeholder="e.g. W 2-1" />
              </fieldset>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <fieldset className="fieldset w-full">
                <label className="fieldset-label font-medium text-gray-700 mb-1">Mins</label>
                <input type="number" value={matchMins} onChange={e => setMatchMins(Number(e.target.value))} min="0" className="input w-full bg-gray-50 border-[#E5E7EB] px-2" />
              </fieldset>
              <fieldset className="fieldset w-full">
                <label className="fieldset-label font-medium text-gray-700 mb-1">Goals</label>
                <input type="number" value={matchGoals} onChange={e => setMatchGoals(Number(e.target.value))} min="0" className="input w-full bg-gray-50 border-[#E5E7EB] px-2" />
              </fieldset>
              <fieldset className="fieldset w-full">
                <label className="fieldset-label font-medium text-gray-700 mb-1">Assists</label>
                <input type="number" value={matchAssists} onChange={e => setMatchAssists(Number(e.target.value))} min="0" className="input w-full bg-gray-50 border-[#E5E7EB] px-2" />
              </fieldset>
              <fieldset className="fieldset w-full">
                <label className="fieldset-label font-medium text-gray-700 mb-1">Rating</label>
                <input type="number" value={matchRating} onChange={e => setMatchRating(Number(e.target.value))} min="0" max="10" step="0.1" className="input w-full bg-gray-50 border-[#E5E7EB] px-2" />
              </fieldset>
            </div>

            {/* Advanced Stats Toggle */}
            <div className="border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => setShowAdvancedStats(!showAdvancedStats)}
                className="text-xs font-bold text-[#0D9488] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {showAdvancedStats ? 'Hide Advanced Metrics' : '+ Add Advanced Metrics (Shots, Passes, Tackles, Dribbles)'}
              </button>
            </div>

            {showAdvancedStats && (
              <div className="space-y-3 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200">
                <div className="grid grid-cols-3 gap-3">
                  <fieldset className="fieldset w-full">
                    <label className="fieldset-label text-[11px] font-bold text-gray-600">Shots</label>
                    <input type="number" value={matchShots} onChange={e => setMatchShots(Number(e.target.value))} min="0" className="input w-full bg-white h-9 text-xs" />
                  </fieldset>
                  <fieldset className="fieldset w-full">
                    <label className="fieldset-label text-[11px] font-bold text-gray-600">On Target</label>
                    <input type="number" value={matchShotsOnTarget} onChange={e => setMatchShotsOnTarget(Number(e.target.value))} min="0" className="input w-full bg-white h-9 text-xs" />
                  </fieldset>
                  <fieldset className="fieldset w-full">
                    <label className="fieldset-label text-[11px] font-bold text-gray-600">Key Passes</label>
                    <input type="number" value={matchKeyPasses} onChange={e => setMatchKeyPasses(Number(e.target.value))} min="0" className="input w-full bg-white h-9 text-xs" />
                  </fieldset>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <fieldset className="fieldset w-full">
                    <label className="fieldset-label text-[11px] font-bold text-gray-600">Passes</label>
                    <input type="number" value={matchPasses} onChange={e => setMatchPasses(Number(e.target.value))} min="0" className="input w-full bg-white h-9 text-xs" />
                  </fieldset>
                  <fieldset className="fieldset w-full">
                    <label className="fieldset-label text-[11px] font-bold text-gray-600">Pass Accuracy %</label>
                    <input type="number" value={matchPassAccuracy} onChange={e => setMatchPassAccuracy(Number(e.target.value))} min="0" max="100" className="input w-full bg-white h-9 text-xs" />
                  </fieldset>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <fieldset className="fieldset w-full">
                    <label className="fieldset-label text-[11px] font-bold text-gray-600">Dribbles</label>
                    <input type="number" value={matchDribbles} onChange={e => setMatchDribbles(Number(e.target.value))} min="0" className="input w-full bg-white h-9 text-xs" />
                  </fieldset>
                  <fieldset className="fieldset w-full">
                    <label className="fieldset-label text-[11px] font-bold text-gray-600">Succ. Dribbles</label>
                    <input type="number" value={matchSuccessfulDribbles} onChange={e => setMatchSuccessfulDribbles(Number(e.target.value))} min="0" className="input w-full bg-white h-9 text-xs" />
                  </fieldset>
                  <fieldset className="fieldset w-full">
                    <label className="fieldset-label text-[11px] font-bold text-gray-600">Tackles</label>
                    <input type="number" value={matchTackles} onChange={e => setMatchTackles(Number(e.target.value))} min="0" className="input w-full bg-white h-9 text-xs" />
                  </fieldset>
                </div>
              </div>
            )}

            <button type="submit" disabled={isSavingMatch} className="btn w-full bg-[#111827] text-white hover:bg-black border-none rounded-xl mt-2 cursor-pointer font-bold">
              {isSavingMatch && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Match Record
            </button>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
      </dialog>

      {/* ── ME DRAWER MODAL (MATCHES IMAGE 1) ── */}
      <dialog id="athlete_menu_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-gray-50 text-[#111827] rounded-t-3xl sm:rounded-3xl p-0 overflow-hidden flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh]">
          <div className="px-6 py-5 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#111827] text-white flex items-center justify-center">
                <i className="fa-solid fa-user" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 font-serif">Me</h3>
            </div>
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost text-gray-400 hover:text-gray-900"><i className="fa-solid fa-xmark text-lg" /></button>
            </form>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto flex-grow space-y-6">
            {/* User Badge */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 overflow-hidden shrink-0">
                {editPhotoPreview || athleteProfile?.photoUrl ? (
                  <img src={editPhotoPreview || athleteProfile?.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-lg text-[#0D9488]">
                    {fullName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-[15px] text-gray-900 truncate">{fullName}</h4>
                <p className="text-[12px] text-gray-400">@{username}</p>
                {athleteProfile?.isVerified && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider mt-1">
                    <i className="fa-solid fa-shield-halved" /> Verified Athlete
                  </span>
                )}
              </div>
            </div>

            {/* SECTION 1: ACCOUNT */}
            <div>
              <h4 className="text-[10px] font-extrabold tracking-widest uppercase text-gray-400 mb-3 px-2">Account</h4>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <button
                  type="button"
                  onClick={() => {
                    (document.getElementById('athlete_menu_modal') as any)?.close();
                    selectTab('profile');
                  }}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 border-b border-gray-50 text-gray-800 font-semibold text-sm text-left cursor-pointer"
                >
                  <i className="fa-regular fa-id-badge text-[#0D9488] w-5 text-center" /> My Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    (document.getElementById('athlete_menu_modal') as any)?.close();
                    selectTab('career');
                  }}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 border-b border-gray-50 text-gray-800 font-semibold text-sm text-left cursor-pointer"
                >
                  <i className="fa-solid fa-timeline text-[#0D9488] w-5 text-center" /> Career Timeline &amp; History
                </button>
                <button
                  type="button"
                  onClick={() => {
                    (document.getElementById('athlete_menu_modal') as any)?.close();
                    selectTab('growth');
                  }}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 border-b border-gray-50 text-gray-800 font-semibold text-sm text-left cursor-pointer"
                >
                  <i className="fa-solid fa-seedling text-[#0D9488] w-5 text-center" /> Growth &amp; Development
                </button>
                <Link href="/dashboard/settings" className="flex items-center gap-3 p-4 hover:bg-gray-50 border-b border-gray-50 text-gray-800 font-semibold text-sm no-underline">
                  <i className="fa-solid fa-gear text-[#0D9488] w-5 text-center" /> Settings
                </Link>
                <Link href="/dashboard/verify" className="flex items-center gap-3 p-4 hover:bg-gray-50 border-b border-gray-50 text-gray-800 font-semibold text-sm no-underline">
                  <i className="fa-regular fa-folder-open text-[#0D9488] w-5 text-center" /> Documents &amp; Vault
                </Link>
                <button
                  onClick={() => {
                    (document.getElementById('athlete_menu_modal') as any)?.close();
                    selectTab('network');
                  }}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 text-gray-800 font-semibold text-sm text-left cursor-pointer"
                >
                  <i className="fa-solid fa-users text-[#0D9488] w-5 text-center" /> Teams &amp; Squads
                </button>
              </div>
            </div>

            {/* SECTION 2: VERIFICATION */}
            <div>
              <h4 className="text-[10px] font-extrabold tracking-widest uppercase text-gray-400 mb-3 px-2">Verification</h4>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Link
                  href="/dashboard/verify"
                  onClick={() => (document.getElementById('athlete_menu_modal') as any)?.close()}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 font-semibold text-sm no-underline"
                >
                  <div className="flex items-center gap-3">
                    <i className="fa-solid fa-shield-halved text-[#00C853] w-5 text-center text-base" />
                    <span>Verify Profile</span>
                  </div>
                  <i className="fa-solid fa-chevron-right text-gray-300 text-xs" />
                </Link>
              </div>
            </div>

            {/* SECTION 3: SIGN OUT */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-2xl py-4 font-bold text-sm transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-arrow-right-from-bracket" /> Sign out
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
      </dialog>

      {/* ── EDIT PROFILE MODAL ── */}
      <dialog id="edit_profile_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white text-[#111827] rounded-t-3xl sm:rounded-3xl p-0 overflow-hidden flex flex-col h-[85vh] sm:h-auto sm:max-h-[85vh]">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 text-center relative shrink-0">
            <h3 className="font-bold text-lg text-gray-900 font-serif">Edit Your Profile</h3>
            <p className="text-sm text-gray-500 mt-1">Upload a profile photo, highlight video, and update your bio.</p>
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-gray-400 hover:text-gray-900 hover:bg-gray-100">
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </form>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 px-6 pt-4 pb-2 border-b border-gray-100 overflow-x-auto bg-gray-50/50">
            <button
              type="button"
              onClick={() => setEditProfileTab('details')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                editProfileTab === 'details'
                  ? 'bg-white text-gray-900 border-gray-200 shadow-sm'
                  : 'bg-transparent text-gray-400 border-transparent hover:text-gray-700'
              }`}
            >
              <i className="fa-solid fa-location-dot text-sm" />
              <span>Details</span>
            </button>
            <button
              type="button"
              onClick={() => setEditProfileTab('photo')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                editProfileTab === 'photo'
                  ? 'bg-white text-gray-900 border-gray-200 shadow-sm'
                  : 'bg-transparent text-gray-400 border-transparent hover:text-gray-700'
              }`}
            >
              <i className="fa-solid fa-camera text-sm" />
              <span>Photo</span>
            </button>
            <button
              type="button"
              onClick={() => setEditProfileTab('video')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                editProfileTab === 'video'
                  ? 'bg-white text-gray-900 border-gray-200 shadow-sm'
                  : 'bg-transparent text-gray-400 border-transparent hover:text-gray-700'
              }`}
            >
              <i className="fa-solid fa-video text-sm" />
              <span>Video</span>
            </button>
            <button
              type="button"
              onClick={() => setEditProfileTab('showcase')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                editProfileTab === 'showcase'
                  ? 'bg-white text-gray-900 border-gray-200 shadow-sm'
                  : 'bg-transparent text-gray-400 border-transparent hover:text-gray-700'
              }`}
            >
              <i className="fa-solid fa-plus text-sm" />
              <span>Showcase</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-grow bg-white">
            {/* 1. DETAILS TAB (EXACTLY AS SPECIFIED) */}
            {editProfileTab === 'details' && (
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-base text-gray-900 font-serif">Profile Details</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Add your country, location, current team and club — these appear on your public profile.
                  </p>
                </div>

                <fieldset className="fieldset w-full">
                  <label className="fieldset-label font-bold text-gray-900 text-xs mb-1.5">Country</label>
                  <input
                    type="text"
                    value={editCountry}
                    onChange={e => setEditCountry(e.target.value)}
                    className="input w-full bg-white border-gray-200 shadow-sm text-sm h-11"
                    placeholder="eg Kenya"
                  />
                </fieldset>

                <fieldset className="fieldset w-full">
                  <label className="fieldset-label font-bold text-gray-900 text-xs mb-1.5">Location / Town</label>
                  <input
                    type="text"
                    value={editTown}
                    onChange={e => setEditTown(e.target.value)}
                    className="input w-full bg-white border-gray-200 shadow-sm text-sm h-11"
                    placeholder="eg Nairobi"
                  />
                </fieldset>

                <fieldset className="fieldset w-full">
                  <label className="fieldset-label font-bold text-gray-900 text-xs mb-1.5">Current Team</label>
                  <input
                    type="text"
                    value={editTeam}
                    onChange={e => setEditTeam(e.target.value)}
                    className="input w-full bg-white border-gray-200 shadow-sm text-sm h-11"
                    placeholder="eg Gor Mahia FC"
                  />
                </fieldset>

                <fieldset className="fieldset w-full">
                  <label className="fieldset-label font-bold text-gray-900 text-xs mb-1.5">Club Name</label>
                  <input
                    type="text"
                    value={editClubName}
                    onChange={e => setEditClubName(e.target.value)}
                    className="input w-full bg-white border-gray-200 shadow-sm text-sm h-11"
                    placeholder="eg AFC Leopards"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5 leading-normal">
                    If you have joined a club through the platform, the club name is managed automatically.
                  </p>
                </fieldset>
              </div>
            )}

            {/* 2. PHOTO TAB */}
            {editProfileTab === 'photo' && (
              <div className="space-y-4">
                <div
                  onClick={() => document.getElementById('photo_file_input')?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-gray-300 transition-colors bg-gray-50/40"
                >
                  <input
                    id="photo_file_input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditPhotoFile(file);
                        setEditPhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                  />

                  <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-800 font-bold text-2xl overflow-hidden shadow-inner border border-gray-200">
                      {editPhotoPreview ? (
                        <img src={editPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span>{fullName.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#111827] text-white flex items-center justify-center text-xs shadow-md">
                      <i className="fa-solid fa-camera" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-gray-800 text-sm flex items-center justify-center gap-2">
                      <i className="fa-solid fa-arrow-up-from-bracket text-gray-500" /> Click or drag to upload a photo
                    </p>
                    <p className="text-xs text-gray-400">JPG, PNG, WebP — max 10 MB. Auto-compressed.</p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. VIDEO TAB (UPLOAD FROM LOCAL STORAGE) */}
            {editProfileTab === 'video' && (
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-base text-gray-900 font-serif">Highlight Video</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Upload a match highlight reel from your device storage so scouts and coaches can watch you play.
                  </p>
                </div>

                {/* Upload box from local storage */}
                <div
                  onClick={() => document.getElementById('video_file_input')?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-gray-300 transition-colors bg-gray-50/40"
                >
                  <input
                    id="video_file_input"
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 150 * 1024 * 1024) {
                          toast({ variant: 'destructive', title: 'File too large', description: 'Please select a video under 150 MB.' });
                          return;
                        }
                        setEditVideoFile(file);
                        setEditVideoPreview(URL.createObjectURL(file));
                      }
                    }}
                  />

                  <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#0D9488] flex items-center justify-center text-2xl mb-4 shadow-sm">
                    <i className="fa-solid fa-cloud-arrow-up" />
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-gray-800 text-sm flex items-center justify-center gap-2">
                      <i className="fa-solid fa-arrow-up-from-bracket text-gray-500" /> Click or drag to upload video from local storage
                    </p>
                    <p className="text-xs text-gray-400">
                      MP4, MOV, WebM — max 150 MB. Saved to your profile.
                    </p>
                  </div>

                  {editVideoFile && (
                    <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 text-[#0D9488] text-xs font-bold border border-teal-100">
                      <i className="fa-solid fa-file-video" />
                      <span>{editVideoFile.name} ({(editVideoFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                    </div>
                  )}
                </div>

                {/* Video Preview Player */}
                {(editVideoPreview || athleteProfile?.highlightVideoUrl) && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-700">Video Preview</span>
                      {editVideoFile && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditVideoFile(null);
                            setEditVideoPreview(athleteProfile?.highlightVideoUrl || null);
                          }}
                          className="text-red-500 hover:underline font-semibold cursor-pointer"
                        >
                          Cancel / Remove
                        </button>
                      )}
                    </div>
                    <div className="rounded-2xl overflow-hidden bg-black border border-gray-200 aspect-video flex items-center justify-center">
                      <video
                        controls
                        playsInline
                        src={editVideoPreview || athleteProfile?.highlightVideoUrl}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Progress bar during active video upload */}
                {videoUploadProgress > 0 && videoUploadProgress < 100 && (
                  <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex justify-between text-xs text-gray-700">
                      <span className="font-semibold">Uploading video to storage...</span>
                      <span className="font-bold text-[#0D9488]">{videoUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#0D9488] h-2 transition-all duration-300" style={{ width: `${videoUploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {/* Optional external link fallback */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="block font-bold text-gray-700 text-xs mb-1">Or paste a video link (YouTube / Vimeo / Cloud)</label>
                  <input
                    type="url"
                    value={editVideoUrl}
                    onChange={e => setEditVideoUrl(e.target.value)}
                    className="input w-full bg-white border-gray-200 shadow-sm text-xs h-10"
                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                  />
                </div>
              </div>
            )}

            {/* 4. SHOWCASE TAB */}
            {editProfileTab === 'showcase' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-base text-gray-900 font-serif">Showcase & Bio</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Describe your playing style, athletic goals, and career highlights.
                  </p>
                </div>
                <fieldset className="fieldset w-full">
                  <label className="fieldset-label font-bold text-gray-900 text-xs mb-1">Bio / Career Summary</label>
                  <textarea
                    rows={5}
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    className="textarea w-full bg-white border-gray-200 shadow-sm text-sm"
                    placeholder="Describe your athletic journey, playing style, milestones, and goals..."
                  />
                </fieldset>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:px-6 sm:py-5 border-t border-gray-100 bg-white flex gap-3 shrink-0">
            <form method="dialog" className="w-1/3">
              <button className="btn w-full bg-white text-gray-700 border-gray-200 hover:bg-gray-50 rounded-xl cursor-pointer shadow-sm">
                Close
              </button>
            </form>
            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="btn w-2/3 bg-gray-900 text-white hover:bg-black border-none rounded-xl cursor-pointer shadow-md font-bold"
            >
              {isSavingProfile ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {videoUploadProgress > 0 ? `Uploading Video (${videoUploadProgress}%)...` : 'Saving Profile...'}
                </span>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
      </dialog>
    </div>
  );
}
