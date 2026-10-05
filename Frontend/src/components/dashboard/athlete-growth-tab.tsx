'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { AthleteProfile, UserAccount } from '@/lib/types';

interface AthleteGrowthTabProps {
  athleteProfile?: AthleteProfile;
  userAccount?: UserAccount;
  onRefresh?: () => void;
  theme?: 'dark' | 'light';
}

export function AthleteGrowthTab({
  athleteProfile,
  userAccount,
  onRefresh,
  theme = 'dark',
}: AthleteGrowthTabProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const isDark = theme === 'dark';

  // Sub-tabs for Growth
  const [growthSubTab, setGrowthSubTab] = useState<'overview' | 'development' | 'goals' | 'assessments' | 'performance' | 'milestones' | 'insights'>('overview');
  const [selectedHistoryCategory, setSelectedHistoryCategory] = useState<'overall' | 'technical' | 'physical' | 'tactical' | 'mental'>('overall');

  // Publishing State
  const [isPublished, setIsPublished] = useState<boolean>(() => {
    return !!(athleteProfile as any)?.isGrowthPublished;
  });

  // Goals State
  const [goals, setGoals] = useState<any[]>(() => {
    return (athleteProfile as any)?.growthGoals || [];
  });

  // Assessments State
  const [assessments, setAssessments] = useState<any[]>(() => {
    return (athleteProfile as any)?.growthAssessments || [];
  });

  // Strengths & Gaps State
  const [strengths, setStrengths] = useState<any[]>(() => {
    return (athleteProfile as any)?.growthStrengths || [];
  });

  const [gaps, setGaps] = useState<any[]>(() => {
    return (athleteProfile as any)?.growthGaps || [];
  });

  // Milestones State
  const [milestones, setMilestones] = useState<any[]>(() => {
    return (athleteProfile as any)?.growthMilestones || [];
  });

  // Modals state
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Technical');
  const [newGoalTarget, setNewGoalTarget] = useState(85);
  const [newGoalCurrent, setNewGoalCurrent] = useState(70);

  const [addAssessmentOpen, setAddAssessmentOpen] = useState(false);
  const [newAsmTech, setNewAsmTech] = useState(80);
  const [newAsmTac, setNewAsmTac] = useState(78);
  const [newAsmPhy, setNewAsmPhy] = useState(77);
  const [newAsmMen, setNewAsmMen] = useState(75);
  const [newAsmComment, setNewAsmComment] = useState('');

  const [addStrengthOpen, setAddStrengthOpen] = useState(false);
  const [strTitle, setStrTitle] = useState('');
  const [strScore, setStrScore] = useState(85);
  const [strNote, setStrNote] = useState('');

  const [addGapOpen, setAddGapOpen] = useState(false);
  const [gapTitle, setGapTitle] = useState('');
  const [gapScore, setGapScore] = useState(65);
  const [gapTarget, setGapTarget] = useState(80);
  const [gapFocus, setGapFocus] = useState('');

  const fullName = `${athleteProfile?.firstName || userAccount?.firstName || 'Harun'} ${
    athleteProfile?.lastName || userAccount?.lastName || 'Nzai'
  }`.trim();
  const currentTeam = athleteProfile?.team || 'First Team';
  const primaryPosition = athleteProfile?.position || 'Forward';

  // Sync state if profile changes
  useEffect(() => {
    if (athleteProfile) {
      if ((athleteProfile as any).growthGoals) setGoals((athleteProfile as any).growthGoals);
      if ((athleteProfile as any).growthAssessments) setAssessments((athleteProfile as any).growthAssessments);
      if ((athleteProfile as any).growthStrengths) setStrengths((athleteProfile as any).growthStrengths);
      if ((athleteProfile as any).growthGaps) setGaps((athleteProfile as any).growthGaps);
      if ((athleteProfile as any).growthMilestones) setMilestones((athleteProfile as any).growthMilestones);
      if (typeof (athleteProfile as any).isGrowthPublished === 'boolean') {
        setIsPublished((athleteProfile as any).isGrowthPublished);
      }
    }
  }, [athleteProfile]);

  // ── DYNAMIC OVERVIEW RADAR COMPUTATION FROM USER DATA ──
  const radarScores = useMemo(() => {
    if (assessments.length === 0) {
      // If no assessments, compute baseline from strengths or default
      return {
        technical: strengths.length > 0 ? Math.round(strengths.reduce((acc, s) => acc + Number(s.score), 0) / strengths.length) : 75,
        tactical: 75,
        performance: 75,
        physical: 75,
        mental: 75,
        discipline: 80,
      };
    }
    const latest = assessments[0];
    return {
      technical: latest.technical || 75,
      tactical: latest.tactical || 75,
      performance: Math.round(((latest.technical || 75) + (latest.tactical || 75)) / 2),
      physical: latest.physical || 75,
      mental: latest.mental || 75,
      discipline: 85,
    };
  }, [assessments, strengths]);

  const overallScore = useMemo(() => {
    if (assessments.length === 0) {
      return Math.round((radarScores.technical + radarScores.tactical + radarScores.physical + radarScores.mental) / 4);
    }
    return Math.round(assessments.reduce((acc, a) => acc + (Number(a.overall) || 75), 0) / assessments.length);
  }, [assessments, radarScores]);

  // Handlers for adding and persisting
  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) return;
    const item = {
      id: `g_${Date.now()}`,
      title: newGoalTitle,
      category: newGoalCategory,
      baseline: newGoalCurrent,
      target: Number(newGoalTarget),
      current: Number(newGoalCurrent),
      status: 'Active',
      progress: Math.min(Math.round((newGoalCurrent / newGoalTarget) * 100), 100),
    };
    const next = [item, ...goals];
    setGoals(next);
    if (firestore && user?.uid) {
      await updateDoc(doc(firestore, 'athletes', user.uid), {
        growthGoals: next,
        updatedAt: new Date().toISOString(),
      });
    }
    toast({ title: 'Development Goal Added', description: newGoalTitle });
    setNewGoalTitle('');
    setAddGoalOpen(false);
  };

  const handleDeleteGoal = async (id: string) => {
    const next = goals.filter((g) => g.id !== id);
    setGoals(next);
    if (firestore && user?.uid) {
      await updateDoc(doc(firestore, 'athletes', user.uid), {
        growthGoals: next,
        updatedAt: new Date().toISOString(),
      });
    }
    toast({ title: 'Goal removed' });
  };

  const handleAddAssessment = async () => {
    const tech = Number(newAsmTech);
    const tac = Number(newAsmTac);
    const phy = Number(newAsmPhy);
    const men = Number(newAsmMen);
    const overall = Math.round((tech + tac + phy + men) / 4);

    const item = {
      id: `asm_${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      coach: user?.displayName || 'Coach / Self Reviewer',
      technical: tech,
      tactical: tac,
      physical: phy,
      mental: men,
      overall,
      comment: newAsmComment || 'Periodic technical evaluation and telemetry review.',
    };

    const next = [item, ...assessments];
    setAssessments(next);
    if (firestore && user?.uid) {
      await updateDoc(doc(firestore, 'athletes', user.uid), {
        growthAssessments: next,
        updatedAt: new Date().toISOString(),
      });
    }
    toast({ title: 'Coach Assessment Recorded', description: `Overall Index: ${overall}/100` });
    setNewAsmComment('');
    setAddAssessmentOpen(false);
  };

  const handleDeleteAssessment = async (id: string) => {
    const next = assessments.filter((a) => a.id !== id);
    setAssessments(next);
    if (firestore && user?.uid) {
      await updateDoc(doc(firestore, 'athletes', user.uid), {
        growthAssessments: next,
        updatedAt: new Date().toISOString(),
      });
    }
    toast({ title: 'Assessment removed' });
  };

  const handleAddStrength = async () => {
    if (!strTitle.trim()) return;
    const item = { id: `str_${Date.now()}`, title: strTitle, score: Number(strScore), note: strNote };
    const next = [item, ...strengths];
    setStrengths(next);
    if (firestore && user?.uid) {
      await updateDoc(doc(firestore, 'athletes', user.uid), {
        growthStrengths: next,
        updatedAt: new Date().toISOString(),
      });
    }
    toast({ title: 'Strength added' });
    setStrTitle('');
    setStrNote('');
    setAddStrengthOpen(false);
  };

  const handleDeleteStrength = async (id: string) => {
    const next = strengths.filter((s) => s.id !== id);
    setStrengths(next);
    if (firestore && user?.uid) {
      await updateDoc(doc(firestore, 'athletes', user.uid), {
        growthStrengths: next,
        updatedAt: new Date().toISOString(),
      });
    }
    toast({ title: 'Strength removed' });
  };

  const handleAddGap = async () => {
    if (!gapTitle.trim()) return;
    const item = { id: `gap_${Date.now()}`, title: gapTitle, score: Number(gapScore), target: Number(gapTarget), focus: gapFocus };
    const next = [item, ...gaps];
    setGaps(next);
    if (firestore && user?.uid) {
      await updateDoc(doc(firestore, 'athletes', user.uid), {
        growthGaps: next,
        updatedAt: new Date().toISOString(),
      });
    }
    toast({ title: 'Development gap recorded' });
    setGapTitle('');
    setGapFocus('');
    setAddGapOpen(false);
  };

  const handleDeleteGap = async (id: string) => {
    const next = gaps.filter((g) => g.id !== id);
    setGaps(next);
    if (firestore && user?.uid) {
      await updateDoc(doc(firestore, 'athletes', user.uid), {
        growthGaps: next,
        updatedAt: new Date().toISOString(),
      });
    }
    toast({ title: 'Development gap removed' });
  };

  const handleTogglePublish = async () => {
    const next = !isPublished;
    setIsPublished(next);
    if (firestore && user?.uid) {
      await updateDoc(doc(firestore, 'athletes', user.uid), {
        isGrowthPublished: next,
        growthPublishedAt: next ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      });
    }
    toast({ title: next ? 'Growth profile published!' : 'Growth profile set to private' });
  };

  // Theming classes
  const cardBg = isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-white border-[#E5E7EB]';
  const innerBg = isDark ? 'bg-[#020617] border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]';
  const textTitle = isDark ? 'text-white' : 'text-[#0F172A]';

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-4xl mx-auto pb-16 px-2 sm:px-4">
      {/* ========================================================================= */}
      {/* 1. GROWTH OVERVIEW HEADER */}
      {/* ========================================================================= */}
      <div className={`rounded-3xl border ${cardBg} p-4 sm:p-8 shadow-xl relative overflow-hidden space-y-6`}>
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-emerald-400 to-amber-400" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-2">
          <div className="space-y-2 text-left">
            <span className="text-[11px] font-black uppercase tracking-widest text-purple-400">
              Development Engine &amp; Trajectory
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className={`text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight ${textTitle}`}>
                {fullName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-400 text-xs font-bold">
                {primaryPosition} • {currentTeam}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#94A3B8]">
              "Is this athlete getting better, in what areas, at what rate, and what is driving development?"
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
            <Button
              onClick={() => setAddGoalOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl h-9 px-3 cursor-pointer flex-1 sm:flex-none"
            >
              <i className="fa-solid fa-plus mr-1"></i> Add Goal
            </Button>
            <Button
              onClick={() => setAddAssessmentOpen(true)}
              variant="outline"
              className="border-[#334155] text-slate-200 hover:text-white hover:bg-slate-800 text-xs rounded-xl h-9 px-3 cursor-pointer flex-1 sm:flex-none"
            >
              <i className="fa-solid fa-clipboard-user mr-1 text-emerald-400"></i> Assessment
            </Button>
            <Button
              onClick={handleTogglePublish}
              className={`text-xs rounded-xl h-9 px-3 font-bold cursor-pointer flex-1 sm:flex-none ${
                isPublished ? 'bg-emerald-600 text-white' : 'bg-slate-800 border border-[#334155] text-slate-300'
              }`}
            >
              <i className={`fa-solid ${isPublished ? 'fa-globe' : 'fa-lock'} mr-1`}></i>
              {isPublished ? 'Published' : 'Publish'}
            </Button>
          </div>
        </div>

        {/* High-level Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className={`p-3.5 rounded-2xl border ${innerBg} text-center space-y-1`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Score</span>
            <p className="font-mono font-black text-xl sm:text-2xl text-purple-400">
              {overallScore} <span className="text-xs text-slate-400">/100</span>
            </p>
            <span className="text-[10px] text-emerald-400 font-bold block">✓ User Data</span>
          </div>
          <div className={`p-3.5 rounded-2xl border ${innerBg} text-center space-y-1`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Trajectory</span>
            <p className="font-bold text-sm sm:text-base text-emerald-400 mt-1">● Improving</p>
            <span className="text-[10px] text-slate-500 block">Active slope</span>
          </div>
          <div className={`p-3.5 rounded-2xl border ${innerBg} text-center space-y-1`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Assessments</span>
            <p className="font-mono font-bold text-xs sm:text-sm text-white mt-1">{assessments.length} Logged</p>
            <span className="text-[10px] text-slate-500 block">Staff &amp; Self</span>
          </div>
          <div className={`p-3.5 rounded-2xl border ${innerBg} text-center space-y-1`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Goals</span>
            <p className="font-mono font-bold text-xs sm:text-sm text-amber-400 mt-1">{goals.length} Goals</p>
            <span className="text-[10px] text-slate-500 block">In progress</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-TAB NAVIGATOR (Mobile Responsive Scroll) */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 px-1 -mx-2 sm:mx-0">
        {[
          { id: 'overview', label: 'Overview Radar' },
          { id: 'development', label: 'Strengths & Gaps' },
          { id: 'goals', label: 'Goals & Plans' },
          { id: 'assessments', label: 'Coach Assessments' },
          { id: 'performance', label: 'Match & Training' },
          { id: 'milestones', label: 'Milestones' },
          { id: 'insights', label: 'Growth Insights' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setGrowthSubTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
              growthSubTab === tab.id
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : `${cardBg} text-slate-400 hover:text-white`
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB CONTENT 1: OVERVIEW & RADAR (FETCHES USER DATA) */}
      {/* ========================================================================= */}
      {growthSubTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`rounded-3xl border ${cardBg} p-5 sm:p-8 shadow-xl space-y-5`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-black text-base sm:text-lg ${textTitle}`}>Dynamic Radar &amp; Breakdown</h3>
              {assessments.length === 0 && (
                <span className="text-[10px] text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-md font-bold">
                  Baseline (Add Assessment)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Computed dynamically from your latest coach assessments and strength entries.
            </p>

            <div className="space-y-3.5 pt-2">
              {[
                { name: 'Technical', val: radarScores.technical, color: 'bg-emerald-400' },
                { name: 'Tactical', val: radarScores.tactical, color: 'bg-sky-400' },
                { name: 'Performance', val: radarScores.performance, color: 'bg-amber-400' },
                { name: 'Physical', val: radarScores.physical, color: 'bg-purple-400' },
                { name: 'Mental', val: radarScores.mental, color: 'bg-rose-400' },
                { name: 'Discipline', val: radarScores.discipline, color: 'bg-teal-400' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{item.name}</span>
                    <strong className="font-mono text-white">{item.val} / 100</strong>
                  </div>
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-[#334155]/60">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {assessments.length === 0 && (
              <div className="pt-2">
                <Button
                  onClick={() => setAddAssessmentOpen(true)}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-9"
                >
                  + Record First Assessment to Calibrate Radar
                </Button>
              </div>
            )}
          </div>

          <div className={`rounded-3xl border ${cardBg} p-5 sm:p-8 shadow-xl space-y-5`}>
            <h3 className={`font-black text-base sm:text-lg ${textTitle}`}>Growth Over Time</h3>
            <p className="text-xs text-slate-400">
              Historical category trajectory across your logged assessments.
            </p>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              {(['overall', 'technical', 'physical', 'tactical', 'mental'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedHistoryCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer transition shrink-0 ${
                    selectedHistoryCategory === cat
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-[#334155]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              {assessments.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <p className="text-xs text-slate-400">No historical assessments logged yet.</p>
                  <Button
                    onClick={() => setAddAssessmentOpen(true)}
                    size="sm"
                    className="bg-purple-600 text-white text-xs"
                  >
                    Add Assessment
                  </Button>
                </div>
              ) : (
                assessments.map((asm: any) => (
                  <div key={asm.id} className={`p-4 rounded-2xl border ${innerBg} flex items-center justify-between`}>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">{asm.date} • Coach {asm.coach}</span>
                      <strong className="text-white text-sm">{asm.comment.slice(0, 45)}...</strong>
                    </div>
                    <span className="font-mono font-black text-purple-400 text-base">{asm.overall} / 100</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 2: STRENGTHS & GAPS */}
      {/* ========================================================================= */}
      {growthSubTab === 'development' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`rounded-3xl border ${cardBg} p-5 sm:p-8 shadow-xl space-y-5`}>
            <div className="flex items-center justify-between pb-3 border-b border-[#334155]/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h3 className={`font-black text-base ${textTitle}`}>Proven Strengths</h3>
                  <p className="text-xs text-slate-400">High proficiency pillars</p>
                </div>
              </div>
              <Button
                onClick={() => setAddStrengthOpen(true)}
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs h-8 px-3"
              >
                + Add
              </Button>
            </div>

            {strengths.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No strengths logged yet.</p>
            ) : (
              <div className="space-y-3">
                {strengths.map((s) => (
                  <div key={s.id} className={`p-4 rounded-2xl border ${innerBg} flex items-center justify-between`}>
                    <div>
                      <h4 className="font-bold text-white text-sm">{s.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{s.note}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-emerald-400 text-lg">{s.score}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteStrength(s.id)}
                        className="h-7 w-7 text-slate-400 hover:text-red-400"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`rounded-3xl border ${cardBg} p-5 sm:p-8 shadow-xl space-y-5`}>
            <div className="flex items-center justify-between pb-3 border-b border-[#334155]/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  ⚠
                </div>
                <div>
                  <h3 className={`font-black text-base ${textTitle}`}>Development Gaps</h3>
                  <p className="text-xs text-slate-400">Targeted focus areas</p>
                </div>
              </div>
              <Button
                onClick={() => setAddGapOpen(true)}
                size="sm"
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs h-8 px-3"
              >
                + Add
              </Button>
            </div>

            {gaps.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No gaps logged yet.</p>
            ) : (
              <div className="space-y-3">
                {gaps.map((g) => (
                  <div key={g.id} className={`p-4 rounded-2xl border ${innerBg} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">{g.title}</h4>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-amber-400 text-sm font-bold">{g.score} → {g.target}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteGap(g.id)}
                          className="h-7 w-7 text-slate-400 hover:text-red-400"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">Focus: {g.focus}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 3: GOALS */}
      {/* ========================================================================= */}
      {growthSubTab === 'goals' && (
        <div className={`rounded-3xl border ${cardBg} p-5 sm:p-8 shadow-xl space-y-6`}>
          <div className="flex items-center justify-between pb-4 border-b border-[#334155]/60">
            <div>
              <h3 className={`font-black text-base sm:text-lg ${textTitle}`}>Active Development Goals</h3>
              <p className="text-xs text-[#94A3B8]">Connected to training and reviews</p>
            </div>
            <Button
              onClick={() => setAddGoalOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl h-9 px-4"
            >
              + Add Goal
            </Button>
          </div>

          {goals.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-xs text-slate-400">No active goals recorded yet. Add your first goal to begin tracking.</p>
              <Button
                onClick={() => setAddGoalOpen(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs h-9 px-4"
              >
                Add Goal
              </Button>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {goals.map((g: any) => (
                <div key={g.id} className={`p-5 rounded-2xl border ${innerBg} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                      <h4 className="font-extrabold text-white text-sm">{g.title}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">{g.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400">
                        {g.status} ({g.progress}%)
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteGoal(g.id)}
                        className="h-7 w-7 text-slate-400 hover:text-red-400"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-slate-400 pt-1">
                    <span>Baseline: <strong className="text-white">{g.baseline}</strong></span>
                    <span>Target: <strong className="text-emerald-400">{g.target}</strong></span>
                    <span>Current: <strong className="text-purple-400">{g.current}</strong></span>
                  </div>

                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-[#334155]/50">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full" style={{ width: `${g.progress}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 4: ASSESSMENTS */}
      {/* ========================================================================= */}
      {growthSubTab === 'assessments' && (
        <div className={`rounded-3xl border ${cardBg} p-5 sm:p-8 shadow-xl space-y-6`}>
          <div className="flex items-center justify-between pb-4 border-b border-[#334155]/60">
            <div>
              <h3 className={`font-black text-base sm:text-lg ${textTitle}`}>Coach Assessments</h3>
              <p className="text-xs text-[#94A3B8]">Preserved technical evaluations</p>
            </div>
            <Button
              onClick={() => setAddAssessmentOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl h-9 px-4"
            >
              + Assessment
            </Button>
          </div>

          {assessments.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-xs text-slate-400">No assessments recorded yet. Add your first assessment above.</p>
              <Button
                onClick={() => setAddAssessmentOpen(true)}
                className="bg-purple-600 text-white font-black text-xs h-9 px-4"
              >
                Record Assessment
              </Button>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {assessments.map((asm: any) => (
                <div key={asm.id} className={`p-5 rounded-2xl border ${innerBg} space-y-4`}>
                  <div className="flex items-center justify-between border-b border-[#334155]/40 pb-3">
                    <div>
                      <h4 className="font-black text-white text-sm">{asm.date} • Coach {asm.coach}</h4>
                      <span className="text-[10px] text-emerald-400 font-bold">✓ Verified Review</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-400 font-mono font-black text-base">
                        {asm.overall} / 100
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAssessment(asm.id)}
                        className="h-7 w-7 text-slate-400 hover:text-red-400"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-900 border border-[#334155]/50">
                      <span className="text-[10px] text-slate-400 block">Technical</span>
                      <strong className="font-mono text-white text-sm">{asm.technical}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-[#334155]/50">
                      <span className="text-[10px] text-slate-400 block">Tactical</span>
                      <strong className="font-mono text-white text-sm">{asm.tactical}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-[#334155]/50">
                      <span className="text-[10px] text-slate-400 block">Physical</span>
                      <strong className="font-mono text-white text-sm">{asm.physical}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-[#334155]/50">
                      <span className="text-[10px] text-slate-400 block">Mental</span>
                      <strong className="font-mono text-white text-sm">{asm.mental}</strong>
                    </div>
                  </div>

                  <blockquote className="p-3 rounded-xl bg-slate-900/60 border border-[#334155]/50 italic text-slate-300">
                    "{asm.comment}"
                  </blockquote>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 5: PERFORMANCE */}
      {/* ========================================================================= */}
      {growthSubTab === 'performance' && (
        <div className={`rounded-3xl border ${cardBg} p-5 sm:p-8 shadow-xl space-y-6`}>
          <div className="pb-4 border-b border-[#334155]/60">
            <h3 className={`font-black text-base sm:text-lg ${textTitle}`}>Training Impact &amp; Match Performance</h3>
            <p className="text-xs text-[#94A3B8]">How training drills translate into match output</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className={`p-5 rounded-2xl border ${innerBg} space-y-4`}>
              <h4 className="font-bold text-white text-sm flex items-center justify-between">
                <span>Training Exposure</span>
                <i className="fa-solid fa-dumbbell text-purple-400"></i>
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Finishing Drills</span>
                  <strong className="text-white">Active</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Passing &amp; Vision</span>
                  <strong className="text-white">Active</strong>
                </div>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${innerBg} space-y-4`}>
              <h4 className="font-bold text-white text-sm flex items-center justify-between">
                <span>Performance Trend</span>
                <i className="fa-solid fa-chart-line text-emerald-400"></i>
              </h4>
              <p className="text-slate-300 text-xs">
                Consistent assessment logging correlates with improved competitive output and higher match ratings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 6: MILESTONES */}
      {/* ========================================================================= */}
      {growthSubTab === 'milestones' && (
        <div className={`rounded-3xl border ${cardBg} p-5 sm:p-8 shadow-xl space-y-6`}>
          <div className="pb-4 border-b border-[#334155]/60">
            <h3 className={`font-black text-base sm:text-lg ${textTitle}`}>Development Milestones</h3>
            <p className="text-xs text-[#94A3B8]">Key developmental achievements</p>
          </div>

          {milestones.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No milestones logged yet.</p>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-[#334155]/60 pl-2">
              {milestones.map((m, i) => (
                <div key={i} className="relative flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 z-10 shadow-md">
                    {m.year}
                  </div>
                  <div className={`p-4 rounded-2xl border ${innerBg} flex-1`}>
                    <h4 className="font-bold text-white text-sm">{m.title}</h4>
                    <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">{m.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 7: INSIGHTS */}
      {/* ========================================================================= */}
      {growthSubTab === 'insights' && (
        <div className={`rounded-3xl border ${cardBg} p-5 sm:p-8 shadow-xl space-y-6`}>
          <div className="pb-4 border-b border-[#334155]/60">
            <h3 className={`font-black text-base sm:text-lg ${textTitle}`}>AI Growth Insights</h3>
            <p className="text-xs text-[#94A3B8]">Automated intelligence derived from your data</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className={`p-5 rounded-2xl border ${innerBg} space-y-2 border-emerald-500/30`}>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">↑ Active Ledger</span>
              <h4 className="font-bold text-white text-sm">User-driven progression</h4>
              <p className="text-slate-300">Your logged assessments and goals provide reliable inputs for growth telemetry.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      {addGoalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#334155] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
              <h3 className="font-extrabold text-base text-white">Add Development Goal</h3>
              <button onClick={() => setAddGoalOpen(false)} className="text-slate-400 hover:text-white">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Goal Title</label>
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white"
                  placeholder="e.g. Improve weak-foot passing"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Category</label>
                  <select
                    value={newGoalCategory}
                    onChange={(e) => setNewGoalCategory(e.target.value)}
                    className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Tactical">Tactical</option>
                    <option value="Physical">Physical</option>
                    <option value="Mental">Mental</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Target (1-100)</label>
                  <input
                    type="number"
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(Number(e.target.value))}
                    className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-[#334155]">
              <Button
                variant="outline"
                onClick={() => setAddGoalOpen(false)}
                className="flex-1 border-[#334155] text-slate-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddGoal}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs"
              >
                Save Goal
              </Button>
            </div>
          </div>
        </div>
      )}

      {addAssessmentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#334155] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
              <h3 className="font-extrabold text-base text-white">Record Coach Assessment</h3>
              <button onClick={() => setAddAssessmentOpen(false)} className="text-slate-400 hover:text-white">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Technical (1-100)</label>
                  <input
                    type="number"
                    value={newAsmTech}
                    onChange={(e) => setNewAsmTech(Number(e.target.value))}
                    className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Tactical (1-100)</label>
                  <input
                    type="number"
                    value={newAsmTac}
                    onChange={(e) => setNewAsmTac(Number(e.target.value))}
                    className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Physical (1-100)</label>
                  <input
                    type="number"
                    value={newAsmPhy}
                    onChange={(e) => setNewAsmPhy(Number(e.target.value))}
                    className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Mental (1-100)</label>
                  <input
                    type="number"
                    value={newAsmMen}
                    onChange={(e) => setNewAsmMen(Number(e.target.value))}
                    className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Qualitative Comments</label>
                <textarea
                  value={newAsmComment}
                  onChange={(e) => setNewAsmComment(e.target.value)}
                  className="w-full bg-[#020617] border border-[#334155] rounded-xl p-3 text-white h-20 resize-none"
                  placeholder="Improved decision-making..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-[#334155]">
              <Button
                variant="outline"
                onClick={() => setAddAssessmentOpen(false)}
                className="flex-1 border-[#334155] text-slate-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddAssessment}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs"
              >
                Save Assessment
              </Button>
            </div>
          </div>
        </div>
      )}

      {addStrengthOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#334155] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
              <h3 className="font-extrabold text-base text-white">Add Strength</h3>
              <button onClick={() => setAddStrengthOpen(false)} className="text-slate-400 hover:text-white">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Strength Title</label>
                <input
                  type="text"
                  value={strTitle}
                  onChange={(e) => setStrTitle(e.target.value)}
                  className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white"
                  placeholder="e.g. Finishing"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Score (1-100)</label>
                <input
                  type="number"
                  value={strScore}
                  onChange={(e) => setStrScore(Number(e.target.value))}
                  className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Note</label>
                <input
                  type="text"
                  value={strNote}
                  onChange={(e) => setStrNote(e.target.value)}
                  className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white"
                  placeholder="Exceptional conversion"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-[#334155]">
              <Button
                variant="outline"
                onClick={() => setAddStrengthOpen(false)}
                className="flex-1 border-[#334155] text-slate-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddStrength}
                className="flex-1 bg-emerald-500 text-slate-950 font-black text-xs"
              >
                Save Strength
              </Button>
            </div>
          </div>
        </div>
      )}

      {addGapOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#334155] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
              <h3 className="font-extrabold text-base text-white">Add Development Gap</h3>
              <button onClick={() => setAddGapOpen(false)} className="text-slate-400 hover:text-white">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Gap Title</label>
                <input
                  type="text"
                  value={gapTitle}
                  onChange={(e) => setGapTitle(e.target.value)}
                  className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white"
                  placeholder="e.g. Weak-foot passing"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Current Score</label>
                  <input
                    type="number"
                    value={gapScore}
                    onChange={(e) => setGapScore(Number(e.target.value))}
                    className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Target Score</label>
                  <input
                    type="number"
                    value={gapTarget}
                    onChange={(e) => setGapTarget(Number(e.target.value))}
                    className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Training Focus</label>
                <input
                  type="text"
                  value={gapFocus}
                  onChange={(e) => setGapFocus(e.target.value)}
                  className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white"
                  placeholder="Short passing under pressure"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-[#334155]">
              <Button
                variant="outline"
                onClick={() => setAddGapOpen(false)}
                className="flex-1 border-[#334155] text-slate-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddGap}
                className="flex-1 bg-amber-400 text-slate-950 font-black text-xs"
              >
                Save Gap
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
