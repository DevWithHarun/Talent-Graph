'use client';

import React, { useState, useMemo } from 'react';
import type { AthleteProfile, UserAccount } from '@/lib/types';
import {
  TrendingUp, TrendingDown, ArrowUpRight, BarChart3, Calendar,
  Trophy, Activity, Target, Shield, Clock, Award, Filter,
  ChevronRight, ExternalLink, SlidersHorizontal, CheckCircle2,
  Sparkles, Layers, ArrowRight, X, Plus, AlertCircle, Trash2
} from 'lucide-react';
import { Link } from 'wouter';
import { useFirestore } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { clearSeededPerformanceData } from '@/firebase/athlete-performance';
import { useToast } from '@/hooks/use-toast';

interface PerformanceViewProps {
  athleteProfile?: AthleteProfile;
  userAccount: UserAccount;
  matches?: any[];
  trainingSessions?: any[];
  assessments?: any[];
  onOpenLogMatch: () => void;
}

export function PerformanceView({
  athleteProfile,
  userAccount,
  matches = [],
  trainingSessions = [],
  assessments = [],
  onOpenLogMatch,
}: PerformanceViewProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const uid = athleteProfile?.uid || userAccount.id;

  const [selectedSeason, setSelectedSeason] = useState('all');
  const [selectedCompetition, setSelectedCompetition] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [activeSection, setActiveSection] = useState<'all' | 'overview' | 'matches' | 'training' | 'stats' | 'trends' | 'assessments' | 'history'>('all');
  const [selectedMatchDetail, setSelectedMatchDetail] = useState<any | null>(null);
  const [trendPeriod, setTrendPeriod] = useState<'last5' | 'last10' | 'current_season' | 'previous_season' | 'career'>('current_season');
  const [isClearing, setIsClearing] = useState(false);

  // Training modal state
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingTitle, setTrainingTitle] = useState('Tactical Preparation');
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().slice(0, 10));
  const [trainingType, setTrainingType] = useState<'Tactical' | 'Fitness' | 'Technical' | 'Recovery'>('Tactical');
  const [trainingAttendance, setTrainingAttendance] = useState<'Present' | 'Late' | 'Absent'>('Present');
  const [trainingMins, setTrainingMins] = useState(90);
  const [trainingLoad, setTrainingLoad] = useState(650);
  const [isSavingTraining, setIsSavingTraining] = useState(false);

  // Assessment modal state
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentAttr, setAssessmentAttr] = useState('Finishing');
  const [assessmentScore, setAssessmentScore] = useState(8);
  const [assessmentSource, setAssessmentSource] = useState('Coach Assessment');
  const [isSavingAssessment, setIsSavingAssessment] = useState(false);

  // Handler to log Training Session directly to Firebase
  const handleSaveTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !uid || !trainingTitle) return;
    setIsSavingTraining(true);
    try {
      await addDoc(collection(firestore, 'training_sessions'), {
        athleteId: uid,
        session: trainingTitle,
        title: trainingTitle,
        date: trainingDate,
        type: trainingType,
        attendance: trainingAttendance,
        minutes: Number(trainingMins),
        load: Number(trainingLoad),
        createdAt: new Date().toISOString(),
      });
      toast({ title: 'Training session recorded in Firebase!' });
      setShowTrainingModal(false);
    } catch {
      toast({ variant: 'destructive', title: 'Could not save training session' });
    } finally {
      setIsSavingTraining(false);
    }
  };

  // Handler to log Assessment directly to Firebase
  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !uid || !assessmentAttr) return;
    setIsSavingAssessment(true);
    try {
      await addDoc(collection(firestore, 'assessments'), {
        athleteId: uid,
        attribute: assessmentAttr,
        score: Number(assessmentScore),
        source: assessmentSource,
        updated: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        createdAt: new Date().toISOString(),
      });
      toast({ title: 'Assessment evaluation saved in Firebase!' });
      setShowAssessmentModal(false);
    } catch {
      toast({ variant: 'destructive', title: 'Could not save assessment' });
    } finally {
      setIsSavingAssessment(false);
    }
  };

  // Clear any seeded/sample records from Firebase
  const handleClearSampleData = async () => {
    if (!firestore || !uid) return;
    setIsClearing(true);
    try {
      await clearSeededPerformanceData(firestore, uid);
      toast({ title: 'Sample records removed from Firestore database' });
    } catch {
      toast({ variant: 'destructive', title: 'Could not clear sample data' });
    } finally {
      setIsClearing(false);
    }
  };

  // Available seasons dynamically extracted from actual Firestore matches
  const availableSeasons = useMemo(() => {
    const seasons = new Set<string>();
    matches.forEach(m => {
      if (m.season) seasons.add(String(m.season));
      else if (m.date) {
        const year = m.date.slice(0, 4);
        if (year && !isNaN(Number(year))) seasons.add(year);
      }
    });
    return Array.from(seasons).sort().reverse();
  }, [matches]);

  // Filter matches dynamically
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      if (selectedSeason !== 'all') {
        const mYear = m.season ? String(m.season) : m.date?.slice(0, 4);
        if (mYear !== selectedSeason) return false;
      }
      if (selectedCompetition !== 'all' && m.competition !== selectedCompetition) {
        return false;
      }
      return true;
    });
  }, [matches, selectedSeason, selectedCompetition]);

  // Overview KPIs calculated strictly from real matches
  const totalMatches = filteredMatches.length;
  const totalMinutes = filteredMatches.reduce((acc, m) => acc + (Number(m.minutesPlayed) || Number(m.minutes) || 0), 0);
  const totalGoals = filteredMatches.reduce((acc, m) => acc + (Number(m.goals) || 0), 0);
  const totalAssists = filteredMatches.reduce((acc, m) => acc + (Number(m.assists) || 0), 0);
  const avgRating = totalMatches > 0
    ? (filteredMatches.reduce((acc, m) => acc + (Number(m.rating) || 0), 0) / totalMatches).toFixed(1)
    : '--';

  // Performance Trend Line points (recent matches sorted chronologically)
  const trendRatings = useMemo(() => {
    if (filteredMatches.length === 0) return [];
    const sorted = [...filteredMatches].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const slice = sorted.slice(-8);
    return slice.map((m, idx) => ({
      label: `M${idx + 1}`,
      rating: Number(m.rating) || 7.0,
      opponent: m.opponent || 'Match',
      date: m.date || '',
    }));
  }, [filteredMatches]);

  // Player Statistics strictly summed from real matches (zero formulas or synthetic guesses)
  const stats = useMemo(() => {
    const goals = matches.reduce((acc, m) => acc + (Number(m.goals) || 0), 0);
    const assists = matches.reduce((acc, m) => acc + (Number(m.assists) || 0), 0);
    const shots = matches.reduce((acc, m) => acc + (Number(m.shots) || 0), 0);
    const shotsOnTarget = matches.reduce((acc, m) => acc + (Number(m.shotsOnTarget) || 0), 0);
    const keyPasses = matches.reduce((acc, m) => acc + (Number(m.keyPasses) || 0), 0);
    const chancesCreated = matches.reduce((acc, m) => acc + (Number(m.chancesCreated) || 0), 0);

    const passes = matches.reduce((acc, m) => acc + (Number(m.passes) || 0), 0);
    const completed = matches.reduce((acc, m) => {
      if (m.passesCompleted !== undefined && m.passesCompleted !== null) {
        return acc + Number(m.passesCompleted);
      }
      if (m.passAccuracy && m.passes) {
        return acc + Math.round((Number(m.passes) * Number(m.passAccuracy)) / 100);
      }
      return acc;
    }, 0);
    const passAccuracy = passes > 0 ? ((completed / passes) * 100).toFixed(1) : '0.0';
    const progressivePasses = matches.reduce((acc, m) => acc + (Number(m.progressivePasses) || 0), 0);
    const throughBalls = matches.reduce((acc, m) => acc + (Number(m.throughBalls) || 0), 0);
    const crossesCompleted = matches.reduce((acc, m) => acc + (Number(m.crossesCompleted) || 0), 0);

    const tackles = matches.reduce((acc, m) => acc + (Number(m.tackles) || 0), 0);
    const tacklesWon = matches.reduce((acc, m) => acc + (Number(m.tacklesWon) || 0), 0);
    const interceptions = matches.reduce((acc, m) => acc + (Number(m.interceptions) || 0), 0);
    const clearances = matches.reduce((acc, m) => acc + (Number(m.clearances) || 0), 0);
    const recoveries = matches.reduce((acc, m) => acc + (Number(m.recoveries) || 0), 0);
    const groundDuelsWonPct = tackles > 0 ? Math.min(100, Math.round((tacklesWon / tackles) * 100)) : 0;

    return {
      goals, assists, shots, shotsOnTarget, keyPasses, chancesCreated,
      passes, completed, passAccuracy, progressivePasses, throughBalls, crossesCompleted,
      tackles, tacklesWon, interceptions, clearances, recoveries, groundDuelsWonPct,
    };
  }, [matches]);

  // Training summary strictly calculated from Firestore training_sessions
  const trainingSummary = useMemo(() => {
    const scheduled = trainingSessions.length;
    const attended = trainingSessions.filter(s => s.attendance === 'Present').length;
    const rate = scheduled > 0 ? Math.round((attended / scheduled) * 100) : 0;
    const minutes = trainingSessions.reduce((acc, s) => acc + (Number(s.minutes) || 0), 0);
    const avgLoad = scheduled > 0
      ? Math.round(trainingSessions.reduce((acc, s) => acc + (Number(s.load) || 0), 0) / scheduled)
      : 0;

    return { scheduled, attended, rate, minutes, avgLoad };
  }, [trainingSessions]);

  // Performance Trends strictly computed from periods of real matches
  const trends = useMemo(() => {
    if (matches.length < 2) {
      return null;
    }

    const mid = Math.floor(matches.length / 2);
    const prevMatches = matches.slice(0, mid);
    const currMatches = matches.slice(mid);

    const prevGoals = prevMatches.reduce((acc, m) => acc + (Number(m.goals) || 0), 0);
    const currGoals = currMatches.reduce((acc, m) => acc + (Number(m.goals) || 0), 0);
    const goalsDiff = prevGoals > 0 ? Math.round(((currGoals - prevGoals) / prevGoals) * 100) : 0;

    const prevAssists = prevMatches.reduce((acc, m) => acc + (Number(m.assists) || 0), 0);
    const currAssists = currMatches.reduce((acc, m) => acc + (Number(m.assists) || 0), 0);
    const assistsDiff = prevAssists > 0 ? Math.round(((currAssists - prevAssists) / prevAssists) * 100) : 0;

    const prevMins = prevMatches.reduce((acc, m) => acc + (Number(m.minutesPlayed) || Number(m.minutes) || 0), 0);
    const currMins = currMatches.reduce((acc, m) => acc + (Number(m.minutesPlayed) || Number(m.minutes) || 0), 0);
    const minsDiff = prevMins > 0 ? Math.round(((currMins - prevMins) / prevMins) * 100) : 0;

    const prevPasses = prevMatches.reduce((acc, m) => acc + (Number(m.passes) || 0), 0);
    const prevComp = prevMatches.reduce((acc, m) => acc + (Number(m.passesCompleted) || 0), 0);
    const prevAcc = prevPasses > 0 ? (prevComp / prevPasses) * 100 : 0;

    const currPasses = currMatches.reduce((acc, m) => acc + (Number(m.passes) || 0), 0);
    const currComp = currMatches.reduce((acc, m) => acc + (Number(m.passesCompleted) || 0), 0);
    const currAcc = currPasses > 0 ? (currComp / currPasses) * 100 : 0;
    const accDiff = Number((currAcc - prevAcc).toFixed(1));

    return {
      goals: { prev: prevGoals, curr: currGoals, diffPct: goalsDiff, trend: currGoals >= prevGoals ? 'up' : 'down' },
      assists: { prev: prevAssists, curr: currAssists, diffPct: assistsDiff, trend: currAssists >= prevAssists ? 'up' : 'down' },
      accuracy: { prev: prevAcc.toFixed(1), curr: currAcc.toFixed(1), diffPct: accDiff, trend: currAcc >= prevAcc ? 'up' : 'down' },
      minutes: { prev: prevMins, curr: currMins, diffPct: minsDiff, trend: currMins >= prevMins ? 'up' : 'down' },
    };
  }, [matches]);

  // Assessments list strictly from real Firestore assessments docs
  const assessmentList = useMemo(() => {
    if (assessments && assessments.length > 0) {
      return assessments.map(a => ({
        attribute: a.attribute,
        score: Number(a.score) || 0,
        source: a.source || 'Coach',
        updated: a.updated || 'Recent',
      }));
    }
    return [];
  }, [assessments]);

  // Pentagon radar points computed strictly from real assessmentList
  const radarPoints = useMemo(() => {
    if (assessmentList.length === 0) return [];
    const list = assessmentList.slice(0, 5);
    const angles = [-90, -18, 54, 126, 198];
    return list.map((item, idx) => {
      const angleRad = (angles[idx] * Math.PI) / 180;
      const ratio = Math.max(0.1, Math.min(1.0, item.score / 10));
      const radius = 80 * ratio;
      const x = 100 + radius * Math.cos(angleRad);
      const y = 100 + radius * Math.sin(angleRad);
      return { x, y, label: `${item.attribute} (${item.score})` };
    });
  }, [assessmentList]);

  // Career History grouped strictly by year from actual matches in Firestore
  const historyBySeason = useMemo(() => {
    const map: Record<string, { matches: number; goals: number; assists: number; totalRating: number }> = {};
    matches.forEach(m => {
      const year = m.season ? String(m.season) : (m.date ? m.date.slice(0, 4) : '2026');
      if (!map[year]) {
        map[year] = { matches: 0, goals: 0, assists: 0, totalRating: 0 };
      }
      map[year].matches += 1;
      map[year].goals += Number(m.goals) || 0;
      map[year].assists += Number(m.assists) || 0;
      map[year].totalRating += Number(m.rating) || 0;
    });

    const years = Object.keys(map).sort().reverse();
    return years.map(year => ({
      year,
      matches: map[year].matches,
      goals: map[year].goals,
      assists: map[year].assists,
      avgRating: (map[year].totalRating / map[year].matches).toFixed(1),
    }));
  }, [matches]);

  return (
    <div className="space-y-8">
      {/* ── SECTION NAV PILLS ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold flex-1">
          {[
            { id: 'all', label: 'All Sections' },
            { id: 'overview', label: '1. Overview' },
            { id: 'matches', label: '2. Matches' },
            { id: 'training', label: '3. Training' },
            { id: 'stats', label: '4. Statistics' },
            { id: 'trends', label: '5. Trends' },
            { id: 'assessments', label: '6. Assessments' },
            { id: 'history', label: '7. History' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors cursor-pointer border ${
                activeSection === tab.id
                  ? 'bg-[#111827] text-white border-transparent shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Clear Sample Data button to remove any past seeded records */}
        <button
          onClick={handleClearSampleData}
          disabled={isClearing}
          className="btn btn-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg cursor-pointer shrink-0 font-bold"
          title="Remove any sample records from your Firestore database"
        >
          <Trash2 className="w-3 h-3" />
          {isClearing ? 'Clearing...' : 'Clear Sample Data'}
        </button>
      </div>

      {/* ── 1. PERFORMANCE OVERVIEW ── */}
      {(activeSection === 'all' || activeSection === 'overview') && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0D9488]">Section 1</span>
              <h2 className="text-2xl font-black text-gray-900 font-serif">Performance Overview</h2>
            </div>

            {/* Dynamic Filters from Live Data */}
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedSeason}
                onChange={e => setSelectedSeason(e.target.value)}
                className="select select-sm bg-gray-50 border-gray-200 rounded-xl font-bold text-xs"
              >
                <option value="all">All Seasons</option>
                {availableSeasons.map(s => (
                  <option key={s} value={s}>{s} Season</option>
                ))}
              </select>

              <select
                value={selectedCompetition}
                onChange={e => setSelectedCompetition(e.target.value)}
                className="select select-sm bg-gray-50 border-gray-200 rounded-xl font-bold text-xs"
              >
                <option value="all">All Competitions ▼</option>
                <option value="League">League</option>
                <option value="Cup">Cup</option>
                <option value="Friendly">Friendly</option>
              </select>

              <select
                value={selectedTeam}
                onChange={e => setSelectedTeam(e.target.value)}
                className="select select-sm bg-gray-50 border-gray-200 rounded-xl font-bold text-xs"
              >
                <option value="all">All Teams ▼</option>
                <option value="First Team">First Team</option>
                <option value="Academy">Academy U19</option>
              </select>

              <button
                onClick={onOpenLogMatch}
                className="btn btn-sm bg-[#0D9488] hover:bg-teal-700 text-white font-bold rounded-xl border-none cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Log Match
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-gray-200 text-center">
              <span className="text-3xl font-black text-gray-900">{totalMatches}</span>
              <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider mt-1">Matches</span>
            </div>
            <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-gray-200 text-center">
              <span className="text-3xl font-black text-gray-900">{totalMinutes.toLocaleString()}</span>
              <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider mt-1">Minutes</span>
            </div>
            <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-gray-200 text-center">
              <span className="text-3xl font-black text-[#0D9488]">{totalGoals}</span>
              <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider mt-1">Goals</span>
            </div>
            <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-gray-200 text-center">
              <span className="text-3xl font-black text-blue-600">{totalAssists}</span>
              <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider mt-1">Assists</span>
            </div>
            <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-gray-200 text-center col-span-2 sm:col-span-1">
              <span className="text-3xl font-black text-purple-600">{avgRating}</span>
              <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider mt-1">Avg. Rating</span>
            </div>
          </div>

          {/* Performance Trend Chart */}
          <div className="bg-[#F9FAFB] rounded-2xl p-5 border border-gray-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#0D9488]" /> Performance Trend (Match Ratings from Firebase)
                </h3>
                <p className="text-xs text-gray-500">“Am I improving or declining?” — Visualized rating trajectory over your logged appearances.</p>
              </div>
            </div>

            {/* Visual SVG Trend Graph */}
            {trendRatings.length > 0 ? (
              <div className="relative pt-4 pb-2">
                <div className="h-44 w-full flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 700 160">
                    <line x1="0" y1="20" x2="700" y2="20" stroke="#E5E7EB" strokeDasharray="4 4" />
                    <line x1="0" y1="60" x2="700" y2="60" stroke="#E5E7EB" strokeDasharray="4 4" />
                    <line x1="0" y1="100" x2="700" y2="100" stroke="#E5E7EB" strokeDasharray="4 4" />
                    <line x1="0" y1="140" x2="700" y2="140" stroke="#E5E7EB" strokeDasharray="4 4" />

                    <text x="5" y="24" fill="#9CA3AF" fontSize="10" fontWeight="bold">10.0</text>
                    <text x="5" y="64" fill="#9CA3AF" fontSize="10" fontWeight="bold">8.5</text>
                    <text x="5" y="104" fill="#9CA3AF" fontSize="10" fontWeight="bold">7.5</text>
                    <text x="5" y="144" fill="#9CA3AF" fontSize="10" fontWeight="bold">6.0</text>

                    <polyline
                      fill="none"
                      stroke="#0D9488"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={trendRatings.map((pt, i) => {
                        const step = 600 / Math.max(1, trendRatings.length - 1);
                        const x = 50 + i * step;
                        const y = 160 - ((pt.rating - 6.0) / 4.0) * 130;
                        return `${x},${Math.max(20, Math.min(145, y))}`;
                      }).join(' ')}
                    />

                    {trendRatings.map((pt, i) => {
                      const step = 600 / Math.max(1, trendRatings.length - 1);
                      const x = 50 + i * step;
                      const y = 160 - ((pt.rating - 6.0) / 4.0) * 130;
                      const clampedY = Math.max(20, Math.min(145, y));
                      return (
                        <g key={i} className="cursor-pointer group">
                          <circle cx={x} cy={clampedY} r="5.5" fill="#FFFFFF" stroke="#0D9488" strokeWidth="3" />
                          <text x={x} y={clampedY - 10} textAnchor="middle" fill="#111827" fontSize="11" fontWeight="bold">
                            {pt.rating}
                          </text>
                          <text x={x} y="156" textAnchor="middle" fill="#6B7280" fontSize="10" fontWeight="bold">
                            {pt.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-xs">
                No match rating records in Firebase yet. Click "Log Match" to add your first appearance.
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── 2. MATCH PERFORMANCE ── */}
      {(activeSection === 'all' || activeSection === 'matches') && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0D9488]">Section 2</span>
              <h2 className="text-2xl font-black text-gray-900 font-serif">Match Performance</h2>
              <p className="text-xs text-gray-500 mt-1">Every fixture recorded directly in Firebase Firestore. Click any match for granular stats.</p>
            </div>
            <button
              onClick={onOpenLogMatch}
              className="btn btn-sm bg-gray-900 hover:bg-black text-white font-bold rounded-xl border-none self-start sm:self-auto cursor-pointer"
            >
              + Log New Match
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="table w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Opponent</th>
                  <th className="py-3.5 px-4">Competition</th>
                  <th className="py-3.5 px-4 text-center">Pos</th>
                  <th className="py-3.5 px-4 text-right">Minutes</th>
                  <th className="py-3.5 px-4 text-right">Goals</th>
                  <th className="py-3.5 px-4 text-right">Assists</th>
                  <th className="py-3.5 px-4 text-right text-[#0D9488]">Rating</th>
                  <th className="py-3.5 px-4 text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {filteredMatches.length > 0 ? (
                  filteredMatches.map((m, idx) => (
                    <tr
                      key={m.id || idx}
                      onClick={() => setSelectedMatchDetail(m)}
                      className="hover:bg-teal-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-bold text-gray-900">{m.date || 'Recent'}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-900">{m.opponent}</span>
                        {m.result && <span className="text-[10px] text-gray-400 block font-normal">{m.result}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.competition === 'Cup' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {m.competition || 'League'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-600">{m.position || athleteProfile?.position || 'FW'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">{m.minutesPlayed || m.minutes || 0}'</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#0D9488]">{m.goals || 0}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-blue-600">{m.assists || 0}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {m.rating || '--'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-bold text-[#0D9488] group-hover:underline">View →</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-400 text-xs">
                      No matches logged yet. Use "+ Log New Match" above to add your first fixture.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── 3. STATISTICS (STRICTLY SUMMED FROM FIRESTORE MATCHES) ── */}
      {(activeSection === 'all' || activeSection === 'stats') && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0D9488]">Section 3</span>
            <h2 className="text-2xl font-black text-gray-900 font-serif">Comprehensive Player Statistics</h2>
            <p className="text-xs text-gray-500 mt-1">Aggregated competitive metrics calculated strictly from your logged matches in Firebase.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Attacking */}
            <div className="bg-[#F9FAFB] rounded-2xl p-5 border border-gray-200 space-y-4">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <Target className="w-4 h-4" />
                <span>Attacking</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-medium">Goals</span>
                  <span className="font-bold text-gray-900">{stats.goals}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-medium">Assists</span>
                  <span className="font-bold text-gray-900">{stats.assists}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-medium">Shots</span>
                  <span className="font-bold text-gray-900">{stats.shots}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-medium">Shots on Target</span>
                  <span className="font-bold text-gray-900">{stats.shotsOnTarget}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-medium">Key Passes</span>
                  <span className="font-bold text-gray-900">{stats.keyPasses}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500 font-medium">Chances Created</span>
                  <span className="font-bold text-gray-900">{stats.chancesCreated}</span>
                </div>
              </div>
            </div>

            {/* Passing */}
            <div className="bg-[#F9FAFB] rounded-2xl p-5 border border-gray-200 space-y-4">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                <Activity className="w-4 h-4" />
                <span>Passing & Distribution</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-medium">Passes</span>
                  <span className="font-bold text-gray-900">{stats.passes}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-medium">Completed</span>
                  <span className="font-bold text-gray-900">{stats.completed}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-medium">Pass Accuracy</span>
                  <span className="font-bold text-emerald-600">{stats.passAccuracy}%</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-medium">Progressive Passes</span>
                  <span className="font-bold text-gray-900">{stats.progressivePasses}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-medium">Through Balls</span>
                  <span className="font-bold text-gray-900">{stats.throughBalls}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500 font-medium">Crosses Completed</span>
                  <span className="font-bold text-gray-900">{stats.crossesCompleted}</span>
                </div>
              </div>
            </div>

            {/* Defensive */}
            <div className="bg-[#F9FAFB] rounded-2xl p-5 border border-gray-200 space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <Shield className="w-4 h-4" />
                <span>Defensive Work</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-medium">Tackles</span>
                  <span className="font-bold text-gray-900">{stats.tackles}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-medium">Tackles Won</span>
                  <span className="font-bold text-gray-900">{stats.tacklesWon}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-medium">Interceptions</span>
                  <span className="font-bold text-gray-900">{stats.interceptions}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-medium">Clearances</span>
                  <span className="font-bold text-gray-900">{stats.clearances}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-medium">Recoveries</span>
                  <span className="font-bold text-gray-900">{stats.recoveries}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500 font-medium">Ground Duels Won</span>
                  <span className="font-bold text-gray-900">{stats.groundDuelsWonPct}%</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. TRAINING PERFORMANCE (FROM FIRESTORE TRAINING_SESSIONS) ── */}
      {(activeSection === 'all' || activeSection === 'training') && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0D9488]">Section 4</span>
              <h2 className="text-2xl font-black text-gray-900 font-serif">Training Performance</h2>
              <p className="text-xs text-gray-500 mt-1">Connects preparation with match day readiness, workload intensity, and attendance consistency fetched from Firebase.</p>
            </div>
            <button
              onClick={() => setShowTrainingModal(true)}
              className="btn btn-sm bg-[#0D9488] hover:bg-teal-700 text-white font-bold rounded-xl border-none cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Log Training
            </button>
          </div>

          {/* Training Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-gray-200 text-center">
              <span className="text-2xl sm:text-3xl font-black text-gray-900">{trainingSummary.scheduled}</span>
              <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider mt-1">Sessions Sched</span>
            </div>
            <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-gray-200 text-center">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">{trainingSummary.attended}</span>
              <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider mt-1">Attended</span>
            </div>
            <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-gray-200 text-center">
              <span className="text-2xl sm:text-3xl font-black text-[#0D9488]">{trainingSummary.rate}%</span>
              <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider mt-1">Attendance Rate</span>
            </div>
            <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-gray-200 text-center">
              <span className="text-2xl sm:text-3xl font-black text-gray-900">{trainingSummary.minutes.toLocaleString()}</span>
              <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider mt-1">Training Mins</span>
            </div>
            <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-gray-200 text-center col-span-2 sm:col-span-1">
              <span className="text-2xl sm:text-3xl font-black text-purple-600">{trainingSummary.avgLoad}</span>
              <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider mt-1">Avg Session Load</span>
            </div>
          </div>

          {/* Training Log Table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="table w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4 text-right">Minutes</th>
                  <th className="py-3 px-4 text-right">Load</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {trainingSessions.length > 0 ? (
                  trainingSessions.map((s, idx) => (
                    <tr key={s.id || idx} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-bold text-gray-900">{s.date || 'Recent'}</td>
                      <td className="py-3 px-4 font-medium">{s.session || s.title || 'Training Session'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.attendance === 'Present' ? 'bg-emerald-50 text-emerald-700' : 'bg-yellow-50 text-yellow-700'
                        }`}>
                          {s.attendance === 'Present' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {s.attendance || 'Present'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">{s.minutes || 0}'</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-purple-700">{s.load || 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400 text-xs">
                      No training sessions logged in Firebase yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── 5. PERFORMANCE TRENDS ── */}
      {(activeSection === 'all' || activeSection === 'trends') && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0D9488]">Section 5</span>
              <h2 className="text-2xl font-black text-gray-900 font-serif">Performance Trends</h2>
              <p className="text-xs text-gray-500 mt-1">Period-over-period delta analysis comparing output velocity computed from Firestore.</p>
            </div>

            {/* Period Switcher */}
            <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1.5 rounded-2xl text-[11px] font-bold">
              {[
                { id: 'last5', label: 'Last 5 matches' },
                { id: 'last10', label: 'Last 10 matches' },
                { id: 'current_season', label: 'Current season' },
                { id: 'previous_season', label: 'Previous season' },
                { id: 'career', label: 'Career' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setTrendPeriod(p.id as any)}
                  className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                    trendPeriod === p.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {trends ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-extrabold uppercase text-emerald-800 tracking-wider">Goals</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md shadow-2xs ${
                    trends.goals.trend === 'up' ? 'text-emerald-700 bg-white' : 'text-rose-700 bg-white'
                  }`}>
                    {trends.goals.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {trends.goals.diffPct >= 0 ? `+${trends.goals.diffPct}%` : `${trends.goals.diffPct}%`}
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-gray-900">{trends.goals.curr}</span>
                  <span className="text-xs text-gray-500">vs {trends.goals.prev} prev</span>
                </div>
                <p className="text-[11px] text-gray-600">Calculated box conversion over the evaluated sequence.</p>
              </div>

              <div className="p-5 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-extrabold uppercase text-blue-800 tracking-wider">Assists</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md shadow-2xs ${
                    trends.assists.trend === 'up' ? 'text-blue-700 bg-white' : 'text-rose-700 bg-white'
                  }`}>
                    {trends.assists.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {trends.assists.diffPct >= 0 ? `+${trends.assists.diffPct}%` : `${trends.assists.diffPct}%`}
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-gray-900">{trends.assists.curr}</span>
                  <span className="text-xs text-gray-500">vs {trends.assists.prev} prev</span>
                </div>
                <p className="text-[11px] text-gray-600">Playmaking and key pass volume in attacking third.</p>
              </div>

              <div className="p-5 rounded-2xl bg-teal-50/40 border border-teal-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-extrabold uppercase text-teal-800 tracking-wider">Pass Accuracy</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md shadow-2xs ${
                    trends.accuracy.trend === 'up' ? 'text-teal-700 bg-white' : 'text-rose-700 bg-white'
                  }`}>
                    {trends.accuracy.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {trends.accuracy.diffPct >= 0 ? `+${trends.accuracy.diffPct}%` : `${trends.accuracy.diffPct}%`}
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-gray-900">{trends.accuracy.curr}%</span>
                  <span className="text-xs text-gray-500">vs {trends.accuracy.prev}% prev</span>
                </div>
                <p className="text-[11px] text-gray-600">Distribution security under opponent press.</p>
              </div>

              <div className="p-5 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-extrabold uppercase text-purple-800 tracking-wider">Minutes</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md shadow-2xs ${
                    trends.minutes.trend === 'up' ? 'text-purple-700 bg-white' : 'text-rose-700 bg-white'
                  }`}>
                    {trends.minutes.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {trends.minutes.diffPct >= 0 ? `+${trends.minutes.diffPct}%` : `${trends.minutes.diffPct}%`}
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-gray-900">{trends.minutes.curr}'</span>
                  <span className="text-xs text-gray-500">vs {trends.minutes.prev}' prev</span>
                </div>
                <p className="text-[11px] text-gray-600">Starting squad consistency and playing duration.</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-xs">
              At least 2 logged matches are required to compute comparative delta trends.
            </div>
          )}
        </section>
      )}

      {/* ── 6. ASSESSMENTS & RADAR ── */}
      {(activeSection === 'all' || activeSection === 'assessments') && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0D9488]">Section 6</span>
              <h2 className="text-2xl font-black text-gray-900 font-serif">Assessments & Attribute Radar</h2>
              <p className="text-xs text-gray-500 mt-1">Verified coach evaluations and physical testing milestones fetched from Firebase.</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setShowAssessmentModal(true)}
                className="btn btn-sm bg-gray-900 hover:bg-black text-white font-bold rounded-xl border-none cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Assessment
              </button>
              <Link
                href="/dashboard/update-attributes"
                className="btn btn-sm bg-[#0D9488] hover:bg-teal-700 text-white font-bold rounded-xl border-none no-underline"
              >
                Refine Attributes →
              </Link>
            </div>
          </div>

          {assessmentList.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="table w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Attribute</th>
                      <th className="py-3 px-4 text-center">Score</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4 text-right">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    {assessmentList.map((a, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-bold text-gray-900">{a.attribute}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-[#0D9488] border border-teal-100">
                            {a.score}/10
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">{a.source}</td>
                        <td className="py-3 px-4 text-right text-gray-400">{a.updated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-[#F9FAFB] rounded-2xl p-6 border border-gray-200 flex flex-col items-center justify-center text-center">
                <h4 className="font-bold text-sm text-gray-900 mb-2">Attribute Polygon Balance</h4>
                <div className="relative w-64 h-64 flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 200 200">
                    {[0.3, 0.6, 0.85, 1.0].map((scale, i) => (
                      <polygon
                        key={i}
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="1"
                        points={[
                          [100, 100 - 80 * scale],
                          [100 + 76 * scale, 100 - 25 * scale],
                          [100 + 47 * scale, 100 + 65 * scale],
                          [100 - 47 * scale, 100 + 65 * scale],
                          [100 - 76 * scale, 100 - 25 * scale],
                        ].map(p => p.join(',')).join(' ')}
                      />
                    ))}

                    {radarPoints.length >= 3 && (
                      <polygon
                        fill="#0D9488"
                        fillOpacity="0.25"
                        stroke="#0D9488"
                        strokeWidth="2.5"
                        points={radarPoints.map(p => `${p.x},${p.y}`).join(' ')}
                      />
                    )}

                    {radarPoints.map((p, idx) => (
                      <text
                        key={idx}
                        x={p.x > 110 ? p.x + 8 : (p.x < 90 ? p.x - 8 : p.x)}
                        y={p.y > 110 ? p.y + 12 : (p.y < 90 ? p.y - 8 : p.y)}
                        textAnchor={p.x > 110 ? 'start' : (p.x < 90 ? 'end' : 'middle')}
                        fill="#111827"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {p.label}
                      </text>
                    ))}
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-xs">
              No assessments recorded yet in Firebase. Click "Refine Attributes" to rate your attributes across tactical criteria.
            </div>
          )}
        </section>
      )}

      {/* ── 7. PERFORMANCE HISTORY ── */}
      {(activeSection === 'all' || activeSection === 'history') && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0D9488]">Section 7</span>
            <h2 className="text-2xl font-black text-gray-900 font-serif">Performance History (Career Trajectory)</h2>
            <p className="text-xs text-gray-500 mt-1">Multi-season competitive timeline grouped dynamically from your historical matches in Firebase.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {historyBySeason.length > 0 ? (
              historyBySeason.map(h => (
                <div
                  key={h.year}
                  className="p-6 rounded-2xl border space-y-3 bg-teal-50/50 border-teal-200"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-base font-black text-gray-900 font-serif">{h.year} Season</span>
                    <span className="text-xs font-bold text-teal-800 bg-white px-2 py-0.5 rounded-full border border-teal-100">
                      Logged
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-700">
                    <div className="flex justify-between"><span>Matches:</span> <strong className="font-mono">{h.matches}</strong></div>
                    <div className="flex justify-between"><span>Goals:</span> <strong className="font-mono">{h.goals}</strong></div>
                    <div className="flex justify-between"><span>Assists:</span> <strong className="font-mono">{h.assists}</strong></div>
                    <div className="flex justify-between"><span>Avg Rating:</span> <strong className="font-mono text-[#0D9488]">{h.avgRating}</strong></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-gray-400 text-xs">
                No season match history recorded yet in Firebase.
              </div>
            )}
          </div>
        </section>
      )}


      {/* ── MODAL: DETAILED MATCH PERFORMANCE POPUP (FROM LIVE FIRESTORE DOC) ── */}
      {selectedMatchDetail && (
        <dialog id="match_detail_modal" open className="modal modal-bottom sm:modal-middle bg-black/60 backdrop-blur-xs z-50">
          <div className="modal-box bg-white text-gray-900 rounded-t-3xl sm:rounded-3xl p-6 max-w-lg">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#0D9488] tracking-widest">Match Performance Breakdown</span>
                <h3 className="font-black text-xl text-gray-900 font-serif">
                  {selectedMatchDetail.opponent} vs First Team
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedMatchDetail.date} • {selectedMatchDetail.competition || 'League'} • {selectedMatchDetail.result || 'Finished'}
                </p>
              </div>
              <button
                onClick={() => setSelectedMatchDetail(null)}
                className="btn btn-sm btn-circle btn-ghost text-gray-400 hover:text-gray-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl flex justify-between">
                <span className="text-gray-500">Minutes</span>
                <strong className="font-bold text-gray-900">{selectedMatchDetail.minutesPlayed || selectedMatchDetail.minutes || 0}'</strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl flex justify-between">
                <span className="text-gray-500">Match Rating</span>
                <strong className="font-bold text-[#0D9488]">{selectedMatchDetail.rating || '--'} / 10</strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl flex justify-between">
                <span className="text-gray-500">Goals</span>
                <strong className="font-bold text-gray-900">{selectedMatchDetail.goals || 0}</strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl flex justify-between">
                <span className="text-gray-500">Assists</span>
                <strong className="font-bold text-gray-900">{selectedMatchDetail.assists || 0}</strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl flex justify-between">
                <span className="text-gray-500">Shots</span>
                <strong className="font-bold text-gray-900">{selectedMatchDetail.shots || 0}</strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl flex justify-between">
                <span className="text-gray-500">Shots on Target</span>
                <strong className="font-bold text-gray-900">{selectedMatchDetail.shotsOnTarget || 0}</strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl flex justify-between">
                <span className="text-gray-500">Key Passes</span>
                <strong className="font-bold text-gray-900">{selectedMatchDetail.keyPasses || 0}</strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl flex justify-between">
                <span className="text-gray-500">Passes</span>
                <strong className="font-bold text-gray-900">{selectedMatchDetail.passes || 0}</strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl flex justify-between">
                <span className="text-gray-500">Pass Accuracy</span>
                <strong className="font-bold text-emerald-600">{selectedMatchDetail.passAccuracy || 0}%</strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl flex justify-between">
                <span className="text-gray-500">Dribbles</span>
                <strong className="font-bold text-gray-900">{selectedMatchDetail.dribbles || 0}</strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl flex justify-between">
                <span className="text-gray-500">Successful Dribbles</span>
                <strong className="font-bold text-gray-900">{selectedMatchDetail.successfulDribbles || 0}</strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl flex justify-between">
                <span className="text-gray-500">Tackles</span>
                <strong className="font-bold text-gray-900">{selectedMatchDetail.tackles || 0}</strong>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedMatchDetail(null)}
                className="btn w-full bg-gray-900 hover:bg-black text-white rounded-xl border-none cursor-pointer font-bold"
              >
                Close Match View
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* ── MODAL: LOG TRAINING SESSION DIRECTLY TO FIRESTORE ── */}
      {showTrainingModal && (
        <dialog id="log_training_modal" open className="modal modal-bottom sm:modal-middle bg-black/60 backdrop-blur-xs z-50">
          <div className="modal-box bg-white text-gray-900 rounded-t-3xl sm:rounded-3xl p-6 max-w-md">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#0D9488] tracking-widest">Training Telemetry</span>
                <h3 className="font-black text-xl text-gray-900 font-serif">Log Training Session</h3>
              </div>
              <button
                onClick={() => setShowTrainingModal(false)}
                className="btn btn-sm btn-circle btn-ghost text-gray-400 hover:text-gray-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTraining} className="space-y-4">
              <fieldset className="fieldset w-full">
                <label className="fieldset-label font-bold text-gray-800 text-xs mb-1">Session Name / Drill</label>
                <input
                  type="text"
                  value={trainingTitle}
                  onChange={e => setTrainingTitle(e.target.value)}
                  className="input w-full bg-gray-50 border-gray-200 text-xs h-10"
                  placeholder="e.g. Tactical Preparation"
                  required
                />
              </fieldset>

              <div className="grid grid-cols-2 gap-3">
                <fieldset className="fieldset w-full">
                  <label className="fieldset-label font-bold text-gray-800 text-xs mb-1">Date</label>
                  <input
                    type="date"
                    value={trainingDate}
                    onChange={e => setTrainingDate(e.target.value)}
                    className="input w-full bg-gray-50 border-gray-200 text-xs h-10"
                    required
                  />
                </fieldset>

                <fieldset className="fieldset w-full">
                  <label className="fieldset-label font-bold text-gray-800 text-xs mb-1">Type</label>
                  <select
                    value={trainingType}
                    onChange={e => setTrainingType(e.target.value as any)}
                    className="select w-full bg-gray-50 border-gray-200 text-xs h-10"
                  >
                    <option value="Tactical">Tactical</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Technical">Technical</option>
                    <option value="Recovery">Recovery</option>
                  </select>
                </fieldset>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <fieldset className="fieldset w-full">
                  <label className="fieldset-label font-bold text-gray-800 text-xs mb-1">Attendance</label>
                  <select
                    value={trainingAttendance}
                    onChange={e => setTrainingAttendance(e.target.value as any)}
                    className="select w-full bg-gray-50 border-gray-200 text-xs h-10"
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                  </select>
                </fieldset>

                <fieldset className="fieldset w-full">
                  <label className="fieldset-label font-bold text-gray-800 text-xs mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={trainingMins}
                    onChange={e => setTrainingMins(Number(e.target.value))}
                    min="0"
                    className="input w-full bg-gray-50 border-gray-200 text-xs h-10"
                    required
                  />
                </fieldset>

                <fieldset className="fieldset w-full">
                  <label className="fieldset-label font-bold text-gray-800 text-xs mb-1">Load Index</label>
                  <input
                    type="number"
                    value={trainingLoad}
                    onChange={e => setTrainingLoad(Number(e.target.value))}
                    min="0"
                    className="input w-full bg-gray-50 border-gray-200 text-xs h-10"
                    placeholder="e.g. 650"
                  />
                </fieldset>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowTrainingModal(false)}
                  className="btn w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTraining}
                  className="btn w-2/3 bg-[#0D9488] hover:bg-teal-700 text-white rounded-xl border-none cursor-pointer font-bold"
                >
                  {isSavingTraining ? 'Saving...' : 'Save to Firebase'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}

      {/* ── MODAL: ADD ASSESSMENT DIRECTLY TO FIRESTORE ── */}
      {showAssessmentModal && (
        <dialog id="log_assessment_modal" open className="modal modal-bottom sm:modal-middle bg-black/60 backdrop-blur-xs z-50">
          <div className="modal-box bg-white text-gray-900 rounded-t-3xl sm:rounded-3xl p-6 max-w-md">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#0D9488] tracking-widest">Attribute Evaluation</span>
                <h3 className="font-black text-xl text-gray-900 font-serif">Record Assessment</h3>
              </div>
              <button
                onClick={() => setShowAssessmentModal(false)}
                className="btn btn-sm btn-circle btn-ghost text-gray-400 hover:text-gray-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssessment} className="space-y-4">
              <fieldset className="fieldset w-full">
                <label className="fieldset-label font-bold text-gray-800 text-xs mb-1">Attribute Name</label>
                <input
                  type="text"
                  value={assessmentAttr}
                  onChange={e => setAssessmentAttr(e.target.value)}
                  className="input w-full bg-gray-50 border-gray-200 text-xs h-10"
                  placeholder="e.g. Finishing, Passing, Pace, Dribbling, Decision Making"
                  required
                />
              </fieldset>

              <div className="grid grid-cols-2 gap-3">
                <fieldset className="fieldset w-full">
                  <label className="fieldset-label font-bold text-gray-800 text-xs mb-1">Score (1 - 10)</label>
                  <input
                    type="number"
                    value={assessmentScore}
                    onChange={e => setAssessmentScore(Number(e.target.value))}
                    min="1"
                    max="10"
                    step="0.5"
                    className="input w-full bg-gray-50 border-gray-200 text-xs h-10 font-bold text-[#0D9488]"
                    required
                  />
                </fieldset>

                <fieldset className="fieldset w-full">
                  <label className="fieldset-label font-bold text-gray-800 text-xs mb-1">Evaluation Source</label>
                  <select
                    value={assessmentSource}
                    onChange={e => setAssessmentSource(e.target.value)}
                    className="select w-full bg-gray-50 border-gray-200 text-xs h-10"
                  >
                    <option value="Coach Assessment">Coach Assessment</option>
                    <option value="Physical Assessment">Physical Assessment</option>
                    <option value="Verified Scout">Verified Scout</option>
                    <option value="Self Evaluation">Self Evaluation</option>
                  </select>
                </fieldset>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssessmentModal(false)}
                  className="btn w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAssessment}
                  className="btn w-2/3 bg-gray-900 hover:bg-black text-white rounded-xl border-none cursor-pointer font-bold"
                >
                  {isSavingAssessment ? 'Saving...' : 'Save Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}
