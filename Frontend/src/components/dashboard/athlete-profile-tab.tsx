'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'wouter';
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { AthleteProfile, UserAccount } from '@/lib/types';

interface AthleteProfileTabProps {
  athleteProfile?: AthleteProfile;
  userAccount?: UserAccount;
  onRefresh?: () => void;
  theme?: 'dark' | 'light';
}

export function AthleteProfileTab({
  athleteProfile,
  userAccount,
  onRefresh,
  theme = 'dark',
}: AthleteProfileTabProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const isDark = theme === 'dark';

  // ── Core Modes: View vs Edit Mode ──
  const [isEditing, setIsEditing] = useState(false);
  const [isPublished, setIsPublished] = useState<boolean>(() => {
    return (athleteProfile as any)?.isPublished ?? true;
  });
  const [publishedAt, setPublishedAt] = useState<string | null>(() => {
    return (athleteProfile as any)?.publishedAt || null;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // ── Modals State ──
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [attributeAssessmentOpen, setAttributeAssessmentOpen] = useState(false);
  const [selectedAttributeForHistory, setSelectedAttributeForHistory] = useState<string | null>(null);

  // ── Active Navigation Section ──
  const [activeSection, setActiveSection] = useState<string>('all');

  // ── 1. Personal Identity Fields ──
  const [firstName, setFirstName] = useState(athleteProfile?.firstName || userAccount?.firstName || 'Harun');
  const [middleName, setMiddleName] = useState((athleteProfile as any)?.middleName || '');
  const [lastName, setLastName] = useState(athleteProfile?.lastName || userAccount?.lastName || 'Nzai');
  const [preferredName, setPreferredName] = useState((athleteProfile as any)?.preferredName || athleteProfile?.firstName || 'Harun');
  const [dob, setDob] = useState((athleteProfile as any)?.dob || '2003-04-12');
  const [gender, setGender] = useState(athleteProfile?.gender || 'male');
  const [nationality, setNationality] = useState(athleteProfile?.nationality || 'Kenya');
  const [residenceCountry, setResidenceCountry] = useState((athleteProfile as any)?.residenceCountry || 'Kenya');
  const [city, setCity] = useState(
    (athleteProfile as any)?.location?.split(',')[0]?.trim() || (athleteProfile as any)?.city || 'Nairobi'
  );
  const [phone, setPhone] = useState((athleteProfile as any)?.phone || '+254 712 345 678');
  const [email, setEmail] = useState(userAccount?.email || user?.email || 'harun.nzai@example.com');
  const [bio, setBio] = useState(
    athleteProfile?.bio ||
      'Explosive, high-work-rate winger with high tactical discipline and proven 1v1 match-winning conversion in senior competitive divisions.'
  );
  const [languages, setLanguages] = useState((athleteProfile as any)?.languages || 'English, Swahili');

  // ── 2. Sporting Identity Fields ──
  const [sport, setSport] = useState(athleteProfile?.sport || 'Football');
  const [primaryPosition, setPrimaryPosition] = useState(athleteProfile?.position || 'Right Winger');
  const [secondaryPosition, setSecondaryPosition] = useState(
    Array.isArray(athleteProfile?.altPositions)
      ? athleteProfile.altPositions.join(', ')
      : (athleteProfile as any)?.secondaryPositions || 'Left Winger, Attacking Midfielder'
  );
  const [preferredFoot, setPreferredFoot] = useState(athleteProfile?.dominantFoot || 'Right');
  const [playingStyle, setPlayingStyle] = useState((athleteProfile as any)?.playingStyle || 'Inverted Winger / Direct Runner');
  const [currentLevel, setCurrentLevel] = useState((athleteProfile as any)?.currentLevel || 'Senior 1st XI');
  const [currentClub, setCurrentClub] = useState(athleteProfile?.clubName || 'Example FC');
  const [currentTeam, setCurrentTeam] = useState(athleteProfile?.team || 'First Team');
  const [jerseyNumber, setJerseyNumber] = useState(athleteProfile?.jerseyNumber || '#7');
  const [sportingStatus, setSportingStatus] = useState((athleteProfile as any)?.sportingStatus || 'Active Professional');

  // Full Name safe computed value
  const fullName = useMemo(() => {
    const f = firstName || athleteProfile?.firstName || userAccount?.firstName || 'Harun';
    const l = lastName || athleteProfile?.lastName || userAccount?.lastName || 'Nzai';
    return `${f} ${l}`.trim() || 'Athlete';
  }, [firstName, lastName, athleteProfile, userAccount]);

  // Dynamic UID & Athlete ID
  const uid = athleteProfile?.uid || user?.uid || userAccount?.id || 'ath_001';
  const athleteCode = typeof uid === 'string' && uid ? `TG-${uid.slice(0, 6).toUpperCase()}` : 'TG-000001';

  // Sync state if athleteProfile or userAccount loads asynchronously
  useEffect(() => {
    if (athleteProfile) {
      if (athleteProfile.firstName) setFirstName(athleteProfile.firstName);
      if (athleteProfile.lastName) setLastName(athleteProfile.lastName);
      if (athleteProfile.sport) setSport(athleteProfile.sport);
      if (athleteProfile.position) setPrimaryPosition(athleteProfile.position);
      if (athleteProfile.dominantFoot) setPreferredFoot(athleteProfile.dominantFoot);
      if (athleteProfile.clubName) setCurrentClub(athleteProfile.clubName);
      if (athleteProfile.team) setCurrentTeam(athleteProfile.team);
      if (athleteProfile.jerseyNumber) setJerseyNumber(athleteProfile.jerseyNumber);
      if (athleteProfile.nationality) setNationality(athleteProfile.nationality);
      if ((athleteProfile as any).bio) setBio((athleteProfile as any).bio);
      if ((athleteProfile as any).isPublished !== undefined) {
        setIsPublished((athleteProfile as any).isPublished);
      }
      if ((athleteProfile as any).publishedAt) {
        setPublishedAt((athleteProfile as any).publishedAt);
      }
      const loc = (athleteProfile as any).location;
      if (typeof loc === 'string' && loc.includes(',')) {
        setCity(loc.split(',')[0].trim());
      }
    } else if (userAccount) {
      if (userAccount.firstName) setFirstName(userAccount.firstName);
      if (userAccount.lastName) setLastName(userAccount.lastName);
      if (userAccount.email) setEmail(userAccount.email);
    }
  }, [athleteProfile, userAccount]);

  // ── Attributes State ──
  const [attributes, setAttributes] = useState({
    technical: [
      { name: 'Ball Control', score: 8, source: 'Coach Marcus', history: [6, 7, 8] },
      { name: 'Dribbling', score: 8, source: 'Coach Marcus', history: [7, 7, 8] },
      { name: 'Passing', score: 7, source: 'Analyst Assessment', history: [6, 7, 7] },
      { name: 'Shooting', score: 8, source: 'Coach Marcus', history: [7, 8, 8] },
      { name: 'Finishing', score: 8, source: 'Coach Assessment', history: [6, 7, 8] },
    ],
    physical: [
      { name: 'Pace', score: 9, source: 'GPS Tracking (32.4 km/h)', history: [8, 9, 9] },
      { name: 'Acceleration', score: 9, source: 'Coach Assessment', history: [8, 8, 9] },
      { name: 'Strength', score: 7, source: 'Physical Screening', history: [6, 6, 7] },
      { name: 'Stamina', score: 8, source: 'Beep Test (L2)', history: [7, 7, 8] },
    ],
    mental: [
      { name: 'Decision Making', score: 8, source: 'Technical Commission', history: [7, 7, 8] },
      { name: 'Concentration', score: 7, source: 'Coach Assessment', history: [6, 6, 7] },
      { name: 'Leadership', score: 6, source: 'Squad Evaluation', history: [5, 6, 6] },
    ],
    tactical: [
      { name: 'Positioning', score: 8, source: 'Tactical Commission', history: [7, 7, 8] },
      { name: 'Spatial Awareness', score: 8, source: 'Scout Evaluation', history: [6, 7, 8] },
      { name: 'Work Rate', score: 9, source: 'Coach Assessment', history: [8, 8, 9] },
    ],
  });

  // ── Career records ──
  const [careerRecords] = useState([
    { year: '2026', club: currentClub, team: currentTeam, tier: 'Premier League', status: 'Current' },
    { year: '2025', club: 'Academy Elite FC', team: 'U20 Squad', tier: 'Youth Division', status: 'Completed' },
    { year: '2024', club: 'Community Stars FC', team: 'Senior XI', tier: 'Regional League', status: 'Completed' },
  ]);

  // ── Evidence records ──
  const [evidenceList, setEvidenceList] = useState([
    { id: 'ev-1', claim: 'Current Club Registration', docType: 'Federation Passport', status: 'Verified', level: 'L3', date: '04 Oct 2026' },
    { id: 'ev-2', claim: 'Primary Position (Right Winger)', docType: 'Match Sheets (14 apps)', status: 'Verified', level: 'L2', date: '28 Sep 2026' },
    { id: 'ev-3', claim: '2025 Youth Championship Top Scorer', docType: 'Tournament Certificate', status: 'Verified', level: 'L3', date: '15 Jan 2026' },
    { id: 'ev-4', claim: 'Sprint Velocity 32.4 km/h', docType: 'GPS Sensor Session Export', status: 'Pending Review', level: 'L1', date: '01 Oct 2026' },
  ]);

  // ── Authorized Connections ──
  const [connections, setConnections] = useState([
    { id: 'c-1', name: 'Coach Marcus', role: 'Head Coach', org: currentClub, status: 'Active', category: 'Coach' },
    { id: 'c-2', name: 'Scout David N.', role: 'Senior Talent Scout', org: 'Premier League Scouts', status: 'Approved', category: 'Scout' },
    { id: 'c-3', name: 'Kevin Omondi', role: 'Video Analyst', org: currentClub, status: 'Active', category: 'Analyst' },
    { id: 'c-4', name: 'Scout Miller', role: 'Regional Scout', org: 'Coastal Talent ID', status: 'Pending', category: 'Scout' },
  ]);

  // ── Activity Trail ──
  const [activityTrail, setActivityTrail] = useState([
    { id: 'a-1', date: '05 Oct 2026', time: '14:20', text: 'Coach Marcus updated Finishing assessment (8/10)' },
    { id: 'a-2', date: '04 Oct 2026', time: '09:15', text: 'Club verified current membership and squad allocation' },
    { id: 'a-3', date: '03 Oct 2026', time: '18:40', text: 'Scout David N. requested connection & radar telemetry access' },
    { id: 'a-4', date: '01 Oct 2026', time: '11:05', text: 'You uploaded matchday evidence document' },
    { id: 'a-5', date: '28 Sep 2026', time: '16:30', text: 'You updated athlete biography and playing style' },
  ]);

  // ── Sub-forms State ──
  const [assessAttrCategory, setAssessAttrCategory] = useState<'Technical' | 'Physical' | 'Mental' | 'Tactical'>('Technical');
  const [assessAttrName, setAssessAttrName] = useState('Finishing');
  const [assessScore, setAssessScore] = useState(8);
  const [assessType, setAssessType] = useState('Coach Assessment');
  const [assessorName, setAssessorName] = useState('Coach Marcus');
  const [assessNotes, setAssessNotes] = useState('Improved inside-box conversion and low near-post drive.');

  const [evidenceClaim, setEvidenceClaim] = useState('Current Club First Team Registration');
  const [evidenceType, setEvidenceType] = useState('Federation Registration Document');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('Official league player passport stamp.');

  const [verifyTarget, setVerifyTarget] = useState('Sporting Identity & Club Registration');
  const [verifyLevel, setVerifyLevel] = useState('L3 - Official Source Confirmed');
  const [verifyNotes, setVerifyNotes] = useState('');

  const [visibilitySettings, setVisibilitySettings] = useState({
    scoutBasicProfile: true,
    scoutPerformance: true,
    scoutStatistics: true,
    scoutVideos: true,
    scoutPrivateDocuments: false,
    scoutSensitiveInfo: false,
    publicAchievements: true,
    publicStats: true,
  });

  // Profile Completeness Calculation
  const profileCompleteness = useMemo(() => {
    let score = 0;
    if (firstName && lastName) score += 15;
    if (athleteProfile?.photoUrl || user?.photoURL) score += 15;
    if (primaryPosition) score += 15;
    if (currentClub) score += 15;
    if (bio && bio.length > 20) score += 15;
    if (evidenceList.length > 0) score += 15;
    if (attributes.technical.length > 0) score += 10;
    return Math.min(100, score);
  }, [firstName, lastName, athleteProfile?.photoUrl, user?.photoURL, primaryPosition, currentClub, bio, evidenceList, attributes]);

  // Safe Share URL
  const profileShareUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const uname = athleteProfile?.username || user?.email?.split('@')[0] || uid || 'athlete';
    return `${origin}/${uname}`;
  }, [athleteProfile?.username, user?.email, uid]);

  const copyPublicLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(profileShareUrl);
    }
    toast({ title: 'Profile Link Copied', description: profileShareUrl });
  };

  // ── SAVE & PUBLISH BACKEND PIPELINE ──
  const handleSaveIdentity = async (publishLive = false) => {
    if (publishLive) {
      setIsPublishing(true);
    } else {
      setIsSaving(true);
    }

    const now = new Date().toISOString();
    const newPublishState = publishLive ? true : isPublished;

    try {
      // 1. Save to Firebase Firestore
      if (firestore && user?.uid) {
        await updateDoc(doc(firestore, 'athletes', user.uid), {
          firstName,
          middleName,
          lastName,
          preferredName,
          dob,
          gender,
          nationality,
          location: `${city}, ${residenceCountry}`,
          phone,
          bio,
          languages,
          sport,
          position: primaryPosition,
          secondaryPositions: secondaryPosition.split(',').map((s) => s.trim()).filter(Boolean),
          dominantFoot: preferredFoot as any,
          playingStyle,
          currentLevel,
          clubName: currentClub,
          team: currentTeam,
          jerseyNumber,
          sportingStatus,
          isPublished: newPublishState,
          publishedAt: publishLive ? now : publishedAt,
          updatedAt: now,
          profileCompleted: true,
        });
      }

      // 2. Sync to Backend REST API endpoint (with graceful fallback)
      try {
        await fetch(`/api/athletes/${uid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName,
            middleName,
            lastName,
            preferredName,
            dob,
            gender,
            nationality,
            residenceCountry,
            city,
            phone,
            email,
            languages,
            bio,
            sport,
            primaryPosition,
            secondaryPosition,
            preferredFoot,
            playingStyle,
            currentLevel,
            currentClub,
            currentTeam,
            jerseyNumber,
            sportingStatus,
            isPublished: newPublishState,
          }),
        });

        if (publishLive) {
          await fetch(`/api/athletes/${uid}/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isPublished: true }),
          });
        }
      } catch (backendErr) {
        console.warn('Backend API sync fallback:', backendErr);
      }

      // 3. Update local state
      if (publishLive) {
        setIsPublished(true);
        setPublishedAt(now);
        setActivityTrail((prev) => [
          {
            id: `act-${Date.now()}`,
            date: 'Today',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `You published your athlete identity to Talent Graph & Scout Discovery`,
          },
          ...prev,
        ]);
        toast({
          title: '🚀 Profile Published!',
          description: 'Your sporting identity is now live across Talent Graph & Scout Discovery.',
        });
      } else {
        setActivityTrail((prev) => [
          {
            id: `act-${Date.now()}`,
            date: 'Today',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `You updated and saved your personal & sporting identity`,
          },
          ...prev,
        ]);
        toast({
          title: '💾 Profile Saved as Draft',
          description: 'Your changes have been saved to your athlete record.',
        });
      }

      setIsEditing(false);
      onRefresh?.();
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not record profile updates. Please try again.',
      });
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  const handleAddAttributeAssessment = () => {
    const targetKey = assessAttrCategory.toLowerCase() as keyof typeof attributes;
    setAttributes((prev) => {
      const list = prev[targetKey];
      const existing = list.find((a) => a.name.toLowerCase() === assessAttrName.toLowerCase());
      if (existing) {
        return {
          ...prev,
          [targetKey]: list.map((a) =>
            a.name.toLowerCase() === assessAttrName.toLowerCase()
              ? {
                  ...a,
                  score: assessScore,
                  source: assessorName ? `${assessType} (${assessorName})` : assessType,
                  history: [...a.history, assessScore],
                }
              : a
          ),
        };
      }
      return {
        ...prev,
        [targetKey]: [
          ...list,
          {
            name: assessAttrName,
            score: assessScore,
            source: assessorName ? `${assessType} (${assessorName})` : assessType,
            history: [assessScore],
          },
        ],
      };
    });

    setActivityTrail((prev) => [
      {
        id: `act-${Date.now()}`,
        date: 'Today',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `${assessorName || 'Coach'} added new ${assessAttrName} assessment (${assessScore}/10)`,
      },
      ...prev,
    ]);

    toast({ title: 'Assessment Saved', description: `${assessAttrName} score logged with history progression.` });
    setAttributeAssessmentOpen(false);
  };

  const handleAddEvidence = () => {
    if (!evidenceClaim.trim()) return;
    const newEntry = {
      id: `ev-${Date.now()}`,
      claim: evidenceClaim,
      docType: evidenceType,
      status: 'Submitted for Review',
      level: 'L1',
      date: new Date().toLocaleDateString(),
    };
    setEvidenceList((prev) => [newEntry, ...prev]);
    setActivityTrail((prev) => [
      {
        id: `act-${Date.now()}`,
        date: 'Today',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `You submitted new evidence: "${evidenceClaim}"`,
      },
      ...prev,
    ]);
    toast({ title: 'Evidence Uploaded', description: 'Queued for organization/federation verification.' });
    setEvidenceModalOpen(false);
  };

  const handleRequestVerification = () => {
    setActivityTrail((prev) => [
      {
        id: `act-${Date.now()}`,
        date: 'Today',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Verification request submitted for ${verifyTarget} (${verifyLevel})`,
      },
      ...prev,
    ]);
    toast({ title: 'Verification Request Submitted', description: 'Official reviewer notified in queue.' });
    setVerificationModalOpen(false);
  };

  // Section card wrapper styling
  const cardBg = isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-white border-[#E5E7EB]';
  const innerBg = isDark ? 'bg-[#020617] border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]';
  const inputBg = isDark ? 'bg-[#020617] border-[#334155] text-white focus:border-amber-400' : 'bg-white border-[#CBD5E1] text-[#0F172A] focus:border-amber-500';
  const textTitle = isDark ? 'text-white' : 'text-[#0F172A]';
  const textSub = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto pb-16 px-1 sm:px-2">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & PROFILE OVERVIEW HERO */}
      {/* ========================================================================= */}
      <div className={`rounded-3xl border ${cardBg} p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6`}>
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-400" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 pt-2">
          {/* Athlete Avatar with Verification Level */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden border-3 border-amber-400 p-1 bg-[#020617] shadow-2xl flex items-center justify-center">
              {athleteProfile?.photoUrl || user?.photoURL ? (
                <img
                  src={athleteProfile?.photoUrl || user?.photoURL || ''}
                  alt={fullName}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <span className="text-3xl sm:text-4xl font-black text-amber-400">
                  {fullName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <span
              className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg ring-2 ring-[#0F172A]"
              title="Identity & Sporting Level Verified"
            >
              <i className="fa-solid fa-check text-xs"></i>
              <span>L3 Verified</span>
            </span>
          </div>

          {/* Core Identity Info */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight ${textTitle}`}>
                {fullName}
              </h1>
              <span className="px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-400 text-xs font-bold font-mono">
                {athleteCode}
              </span>
              {/* Publication Status Badge */}
              {isPublished ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Published on Talent Graph</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-400 text-xs font-bold flex items-center gap-1.5">
                  <i className="fa-solid fa-file-pen text-xs"></i>
                  <span>Draft Profile (Unpublished)</span>
                </span>
              )}
            </div>

            <p className="text-sm sm:text-base font-bold text-amber-400 flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span>{sport}</span>
              <span className="text-slate-500">•</span>
              <span>{primaryPosition}</span>
              <span className="text-slate-500">•</span>
              <span>{nationality} 🇰🇪</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-normal text-xs">{preferredFoot} Foot</span>
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-[#94A3B8] pt-1">
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-shield-halved text-emerald-400 text-sm"></i>
                <strong className={textTitle}>{currentClub}</strong> ({currentTeam})
              </span>
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-shirt text-amber-400 text-sm"></i>
                <span>{jerseyNumber}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
                <span className="text-emerald-400 font-bold">{sportingStatus}</span>
              </span>
            </div>

            {/* ACTION BUTTONS: EDIT, SAVE, PUBLISH */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-3">
              {!isEditing ? (
                <>
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl h-9 px-4 cursor-pointer shadow-md shadow-amber-500/15"
                  >
                    <i className="fa-solid fa-user-pen mr-2"></i>
                    Edit Identity
                  </Button>
                  <Button
                    onClick={() => handleSaveIdentity(true)}
                    disabled={isPublishing}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl h-9 px-4 cursor-pointer shadow-md shadow-emerald-500/15"
                  >
                    <i className="fa-solid fa-rocket mr-2"></i>
                    {isPublishing ? 'Publishing...' : 'Publish Profile'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => handleSaveIdentity(false)}
                    disabled={isSaving}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl h-9 px-4 cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <i className="fa-solid fa-floppy-disk mr-2"></i>
                    {isSaving ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button
                    onClick={() => handleSaveIdentity(true)}
                    disabled={isPublishing}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl h-9 px-4 cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    <i className="fa-solid fa-rocket mr-2"></i>
                    {isPublishing ? 'Publishing...' : 'Publish Live'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="border-[#334155] text-slate-300 hover:text-white hover:bg-slate-800 text-xs rounded-xl h-9 px-4 cursor-pointer"
                  >
                    Cancel
                  </Button>
                </>
              )}

              <Button
                onClick={() => setShareModalOpen(true)}
                variant="outline"
                className="border-[#334155] text-slate-200 hover:text-white hover:bg-slate-800 text-xs rounded-xl h-9 px-3.5 cursor-pointer"
              >
                <i className="fa-solid fa-share-nodes mr-1.5 text-sky-400"></i>
                Share
              </Button>

              <Button
                onClick={() => setVerificationModalOpen(true)}
                variant="outline"
                className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs rounded-xl h-9 px-3.5 cursor-pointer"
              >
                <i className="fa-solid fa-badge-check mr-1.5"></i>
                Request Verification
              </Button>

              <Link
                href={`/${athleteProfile?.username || user?.email?.split('@')[0] || uid}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white px-2 py-1 transition ml-1"
              >
                <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                Public Preview
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Completeness Bar */}
        <div className="pt-5 border-t border-[#334155]/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className={textTitle}>Profile Completeness</span>
            <span className="text-amber-400 font-mono font-black">{profileCompleteness}%</span>
          </div>
          <div className="w-full bg-[#020617] h-3 rounded-full overflow-hidden border border-[#334155]/60 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-400 rounded-full transition-all duration-700"
              style={{ width: `${profileCompleteness}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-[#94A3B8]">
            <span>Complete personal info, sporting position, and assessments to reach 100% Verified Radar index.</span>
            {publishedAt && (
              <span className="text-slate-500 hidden sm:inline">
                Published {new Date(publishedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-MODULES HORIZONTAL SELECTOR */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
        {[
          { id: 'all', label: 'All Modules' },
          { id: 'personal', label: 'Personal Info' },
          { id: 'sporting', label: 'Sporting Identity' },
          { id: 'attributes', label: 'Attributes & Radar' },
          { id: 'career', label: 'Career History' },
          { id: 'verification', label: 'Verification (L0-L4)' },
          { id: 'evidence', label: 'Evidence & Documents' },
          { id: 'visibility', label: 'Visibility & Sharing' },
          { id: 'connections', label: 'Connections' },
          { id: 'activity', label: 'Activity Log' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSection === tab.id
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                : `${cardBg} text-slate-400 hover:text-white`
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 3. PERSONAL INFORMATION SECTION (USER EDITABLE IN PROFILE TAB) */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'personal') && (
        <section className={`rounded-3xl border ${cardBg} p-6 sm:p-8 shadow-xl space-y-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#334155]/60 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/15 flex items-center justify-center text-amber-400 text-base shrink-0">
                <i className="fa-solid fa-id-card"></i>
              </div>
              <div>
                <h3 className={`font-black text-lg ${textTitle}`}>Personal Information</h3>
                <p className="text-xs text-[#94A3B8]">Authoritative legal identity & athlete biographical background</p>
              </div>
            </div>

            {/* Edit / Save / Publish Actions */}
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl h-8 px-3.5 cursor-pointer"
                >
                  <i className="fa-solid fa-pen-to-square mr-1.5"></i> Edit Personal Info
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => handleSaveIdentity(false)}
                    disabled={isSaving}
                    size="sm"
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl h-8 px-3.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-floppy-disk mr-1.5"></i> Save
                  </Button>
                  <Button
                    onClick={() => handleSaveIdentity(true)}
                    disabled={isPublishing}
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl h-8 px-3.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-rocket mr-1.5"></i> Publish
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Form or Read-only Display depending on isEditing */}
          {isEditing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">First Name *</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                    placeholder="First name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Middle Name</label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                    placeholder="Middle name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Last Name *</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                    placeholder="Last name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Preferred Display Name</label>
                  <input
                    type="text"
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                    placeholder="eg Harun"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Nationality</label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                    placeholder="eg Kenya"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Country of Residence</label>
                  <input
                    type="text"
                    value={residenceCountry}
                    onChange={(e) => setResidenceCountry(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                    placeholder="eg Kenya"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">City / Location</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                    placeholder="eg Nairobi"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Contact Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                    placeholder="+254 700 000000"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Languages</label>
                  <input
                    type="text"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                    placeholder="English, Swahili"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Athlete Biography & Athletic Ambition</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={`w-full rounded-2xl p-4 text-xs font-medium border outline-none resize-none leading-relaxed ${inputBg}`}
                  placeholder="Describe your athletic background, milestones, tactical strengths, and ambitions..."
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="border-[#334155] text-slate-300 text-xs px-4"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSaveIdentity(false)}
                  disabled={isSaving}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-5"
                >
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  onClick={() => handleSaveIdentity(true)}
                  disabled={isPublishing}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5"
                >
                  {isPublishing ? 'Publishing...' : 'Publish Profile'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-2xl border ${innerBg}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Full Legal Name</span>
                  <p className={`font-bold text-sm ${textTitle}`}>{fullName}</p>
                </div>
                <div className={`p-4 rounded-2xl border ${innerBg}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Preferred Name</span>
                  <p className={`font-bold text-sm ${textTitle}`}>{preferredName || firstName}</p>
                </div>
                <div className={`p-4 rounded-2xl border ${innerBg}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Date of Birth & Age</span>
                  <p className={`font-bold text-sm ${textTitle}`}>{dob} (23 yrs)</p>
                </div>
                <div className={`p-4 rounded-2xl border ${innerBg}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nationality</span>
                  <p className={`font-bold text-sm ${textTitle}`}>{nationality} 🇰🇪</p>
                </div>
                <div className={`p-4 rounded-2xl border ${innerBg}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Residence & City</span>
                  <p className={`font-bold text-sm ${textTitle}`}>{city}, {residenceCountry}</p>
                </div>
                <div className={`p-4 rounded-2xl border ${innerBg}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Languages</span>
                  <p className={`font-bold text-sm ${textTitle}`}>{languages}</p>
                </div>
              </div>

              {/* Biography Block */}
              <div className={`p-5 rounded-2xl border ${innerBg} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Athlete Biography</span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-[11px] font-bold text-amber-400 hover:underline"
                  >
                    Edit Bio
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{bio}</p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. SPORTING IDENTITY SECTION (USER EDITABLE IN PROFILE TAB) */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'sporting') && (
        <section className={`rounded-3xl border ${cardBg} p-6 sm:p-8 shadow-xl space-y-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#334155]/60 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-400/15 flex items-center justify-center text-emerald-400 text-base shrink-0">
                <i className="fa-solid fa-futbol"></i>
              </div>
              <div>
                <h3 className={`font-black text-lg ${textTitle}`}>Sporting Identity</h3>
                <p className="text-xs text-[#94A3B8]">
                  Feeds Scout Discovery, Position Analysis, and Tactical Lineups without altering historical records
                </p>
              </div>
            </div>

            {/* Edit / Save / Publish Actions */}
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl h-8 px-3.5 cursor-pointer"
                >
                  <i className="fa-solid fa-pen-to-square mr-1.5"></i> Edit Sporting Identity
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => handleSaveIdentity(false)}
                    disabled={isSaving}
                    size="sm"
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl h-8 px-3.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-floppy-disk mr-1.5"></i> Save
                  </Button>
                  <Button
                    onClick={() => handleSaveIdentity(true)}
                    disabled={isPublishing}
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl h-8 px-3.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-rocket mr-1.5"></i> Publish
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Form or Read-only Display depending on isEditing */}
          {isEditing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Sport *</label>
                  <input
                    type="text"
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                    placeholder="eg Football"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Primary Position *</label>
                  <input
                    type="text"
                    value={primaryPosition}
                    onChange={(e) => setPrimaryPosition(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                    placeholder="eg Right Winger"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Secondary Positions</label>
                  <input
                    type="text"
                    value={secondaryPosition}
                    onChange={(e) => setSecondaryPosition(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                    placeholder="eg Left Winger, Attacking Midfielder"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Preferred Foot</label>
                  <select
                    value={preferredFoot}
                    onChange={(e) => setPreferredFoot(e.target.value as any)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                  >
                    <option value="Right">Right</option>
                    <option value="Left">Left</option>
                    <option value="Both">Both (Ambidextrous)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Tactical Playing Style</label>
                  <input
                    type="text"
                    value={playingStyle}
                    onChange={(e) => setPlayingStyle(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                    placeholder="eg Inverted Winger / Direct Runner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Current Level</label>
                  <input
                    type="text"
                    value={currentLevel}
                    onChange={(e) => setCurrentLevel(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                    placeholder="eg Senior 1st XI"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Current Club</label>
                  <input
                    type="text"
                    value={currentClub}
                    onChange={(e) => setCurrentClub(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                    placeholder="eg Example FC"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Current Team</label>
                  <input
                    type="text"
                    value={currentTeam}
                    onChange={(e) => setCurrentTeam(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                    placeholder="eg First Team"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Jersey Number</label>
                  <input
                    type="text"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                    placeholder="eg #7"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Sporting Status</label>
                  <select
                    value={sportingStatus}
                    onChange={(e) => setSportingStatus(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium border outline-none ${inputBg}`}
                  >
                    <option value="Active Professional">Active Professional</option>
                    <option value="Available for Scouting">Available for Scouting</option>
                    <option value="On Loan">On Loan</option>
                    <option value="Contract Expiring">Contract Expiring</option>
                    <option value="Youth Academy">Youth Academy</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="border-[#334155] text-slate-300 text-xs px-4"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSaveIdentity(false)}
                  disabled={isSaving}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-5"
                >
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  onClick={() => handleSaveIdentity(true)}
                  disabled={isPublishing}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5"
                >
                  {isPublishing ? 'Publishing...' : 'Publish Profile'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-2xl border ${innerBg}`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Primary Position</span>
                <p className="font-black text-amber-400 text-base">{primaryPosition}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${innerBg}`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Secondary Positions</span>
                <p className={`font-bold text-sm ${textTitle}`}>{secondaryPosition}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${innerBg}`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Preferred Foot</span>
                <p className={`font-bold text-sm ${textTitle}`}>{preferredFoot}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${innerBg}`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Tactical Playing Style</span>
                <p className={`font-bold text-sm ${textTitle}`}>{playingStyle}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${innerBg}`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Current Level</span>
                <p className={`font-bold text-sm ${textTitle}`}>{currentLevel}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${innerBg}`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Current Club & Team</span>
                <p className={`font-bold text-sm ${textTitle}`}>
                  {currentClub} • {currentTeam} ({jerseyNumber})
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. ATTRIBUTES (RADAR METRICS & DEVELOPMENT HISTORY) */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'attributes') && (
        <section className={`rounded-3xl border ${cardBg} p-6 sm:p-8 shadow-xl space-y-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#334155]/60 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-400/15 flex items-center justify-center text-sky-400 text-base shrink-0">
                <i className="fa-solid fa-chart-pie"></i>
              </div>
              <div>
                <h3 className={`font-black text-lg ${textTitle}`}>Attributes & Radar Assessments</h3>
                <p className="text-xs text-[#94A3B8]">Technical, Physical, Mental & Tactical development progressions</p>
              </div>
            </div>
            <Button
              onClick={() => setAttributeAssessmentOpen(true)}
              size="sm"
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl h-8 px-3.5 cursor-pointer"
            >
              + Add Assessment
            </Button>
          </div>

          {/* Interactive Radar Visual Card */}
          <div className={`p-6 rounded-2xl border ${innerBg} flex flex-col md:flex-row items-center justify-between gap-6`}>
            {/* SVG Polygon Radar Diagram */}
            <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-45">
                <polygon points="50,10 90,50 50,90 10,50" fill="none" stroke="#334155" strokeWidth="1" />
                <polygon points="50,25 75,50 50,75 25,50" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
                <polygon points="50,40 60,50 50,60 40,50" fill="none" stroke="#334155" strokeWidth="1" />
                <line x1="50" y1="10" x2="50" y2="90" stroke="#334155" strokeWidth="1" />
                <line x1="10" y1="50" x2="90" y2="50" stroke="#334155" strokeWidth="1" />
                <polygon
                  points="50,18 86,50 50,80 20,50"
                  fill="rgba(251, 191, 36, 0.25)"
                  stroke="#FBBF24"
                  strokeWidth="2"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col justify-between p-1 text-[9px] font-black uppercase text-slate-400 pointer-events-none">
                <span className="self-center text-amber-400">Technical (8.0)</span>
                <div className="flex justify-between w-full px-1">
                  <span className="text-emerald-400">Tactical (8.3)</span>
                  <span className="text-sky-400">Physical (8.8)</span>
                </div>
                <span className="self-center text-rose-400">Mental (7.2)</span>
              </div>
            </div>

            <div className="flex-1 space-y-3 text-xs">
              <h4 className={`font-bold text-sm ${textTitle}`}>Multi-Dimensional Profile Assessment</h4>
              <p className="text-slate-400 leading-relaxed text-xs">
                Scores reflect verified coach evaluations and sensor telemetry. Click any attribute row below to view the growth trajectory and historical assessments.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                <span className="px-2.5 py-1 rounded-md bg-amber-400/10 text-amber-400 font-bold border border-amber-400/30">Technical: 8.0</span>
                <span className="px-2.5 py-1 rounded-md bg-sky-400/10 text-sky-400 font-bold border border-sky-400/30">Physical: 8.8</span>
                <span className="px-2.5 py-1 rounded-md bg-rose-400/10 text-rose-400 font-bold border border-rose-400/30">Mental: 7.2</span>
                <span className="px-2.5 py-1 rounded-md bg-emerald-400/10 text-emerald-400 font-bold border border-emerald-400/30">Tactical: 8.3</span>
              </div>
            </div>
          </div>

          {/* Attributes Tables Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Technical */}
            <div className={`p-5 rounded-2xl border ${innerBg} space-y-3`}>
              <h5 className="font-extrabold text-xs text-amber-400 flex items-center justify-between">
                <span>Technical</span>
                <span className="text-[10px] text-slate-400">Score / 10</span>
              </h5>
              <div className="divide-y divide-[#334155]/60 text-xs">
                {attributes.technical.map((attr) => (
                  <div
                    key={attr.name}
                    onClick={() => setSelectedAttributeForHistory(attr.name)}
                    className="py-2.5 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition cursor-pointer"
                  >
                    <div>
                      <span className={`font-bold ${textTitle}`}>{attr.name}</span>
                      <p className="text-[10px] text-slate-400">{attr.source}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {attr.history.join(' → ')}
                      </span>
                      <span className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                        {attr.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Physical */}
            <div className={`p-5 rounded-2xl border ${innerBg} space-y-3`}>
              <h5 className="font-extrabold text-xs text-sky-400 flex items-center justify-between">
                <span>Physical</span>
                <span className="text-[10px] text-slate-400">Score / 10</span>
              </h5>
              <div className="divide-y divide-[#334155]/60 text-xs">
                {attributes.physical.map((attr) => (
                  <div
                    key={attr.name}
                    onClick={() => setSelectedAttributeForHistory(attr.name)}
                    className="py-2.5 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition cursor-pointer"
                  >
                    <div>
                      <span className={`font-bold ${textTitle}`}>{attr.name}</span>
                      <p className="text-[10px] text-slate-400">{attr.source}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {attr.history.join(' → ')}
                      </span>
                      <span className="w-7 h-7 rounded-lg bg-sky-400 text-slate-950 font-black text-xs flex items-center justify-center">
                        {attr.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. CAREER INFORMATION SECTION */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'career') && (
        <section className={`rounded-3xl border ${cardBg} p-6 sm:p-8 shadow-xl space-y-6`}>
          <div className="flex items-center justify-between pb-4 border-b border-[#334155]/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-400/15 flex items-center justify-center text-purple-400 text-base shrink-0">
                <i className="fa-solid fa-timeline"></i>
              </div>
              <div>
                <h3 className={`font-black text-lg ${textTitle}`}>Career Information</h3>
                <p className="text-xs text-[#94A3B8]">Authoritative club affiliations & competitive history</p>
              </div>
            </div>
            <Link
              href="/dashboard/career"
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1.5"
            >
              <span>View Full Career Hub</span>
              <i className="fa-solid fa-arrow-right text-[10px]"></i>
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            {careerRecords.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border ${innerBg} flex items-center justify-between`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono font-black text-amber-400 text-sm">{item.year}</span>
                  <div>
                    <h5 className={`font-bold text-sm ${textTitle}`}>{item.club}</h5>
                    <p className="text-xs text-slate-400">{item.team} • {item.tier}</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    item.status === 'Current'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 7. VERIFICATION (L0 TO L4 FRAMEWORK) */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'verification') && (
        <section className={`rounded-3xl border ${cardBg} p-6 sm:p-8 shadow-xl space-y-6`}>
          <div className="flex items-center justify-between pb-4 border-b border-[#334155]/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-400/15 flex items-center justify-center text-emerald-400 text-base shrink-0">
                <i className="fa-solid fa-shield-check"></i>
              </div>
              <div>
                <h3 className={`font-black text-lg ${textTitle}`}>Profile Verification</h3>
                <p className="text-xs text-[#94A3B8]">Multi-tier verification framework (L0 Self-Reported to L4 Multi-Source)</p>
              </div>
            </div>
            <Button
              onClick={() => setVerificationModalOpen(true)}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl h-8 px-3.5 cursor-pointer"
            >
              Request Upgrade
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className={`p-4 rounded-2xl border ${innerBg} space-y-1.5`}>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Identity Verification</span>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Legal Identification</span>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  ✓ L3 Official
                </span>
              </div>
            </div>
            <div className={`p-4 rounded-2xl border ${innerBg} space-y-1.5`}>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Sporting Identity</span>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Position & Dominant Foot</span>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  ✓ L2 Confirmed
                </span>
              </div>
            </div>
            <div className={`p-4 rounded-2xl border ${innerBg} space-y-1.5`}>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Club Affiliation</span>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{currentClub} First Team</span>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  ✓ L3 Federation
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 8. EVIDENCE & DOCUMENTS SECTION */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'evidence') && (
        <section className={`rounded-3xl border ${cardBg} p-6 sm:p-8 shadow-xl space-y-6`}>
          <div className="flex items-center justify-between pb-4 border-b border-[#334155]/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/15 flex items-center justify-center text-amber-400 text-base shrink-0">
                <i className="fa-solid fa-file-shield"></i>
              </div>
              <div>
                <h3 className={`font-black text-lg ${textTitle}`}>Evidence & Documentation</h3>
                <p className="text-xs text-[#94A3B8]">Audit-grade artifacts supporting every sporting claim</p>
              </div>
            </div>
            <Button
              onClick={() => setEvidenceModalOpen(true)}
              size="sm"
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl h-8 px-3.5 cursor-pointer"
            >
              + Add Evidence
            </Button>
          </div>

          <div className="divide-y divide-[#334155]/60 text-xs">
            {evidenceList.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className={`font-bold truncate ${textTitle}`}>{item.claim}</h5>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#020617] text-amber-400 border border-[#334155]">
                      {item.level}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {item.docType} • Submitted on {item.date}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      item.status === 'Verified'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-400/20 text-amber-400'
                    }`}
                  >
                    {item.status}
                  </span>
                  <button
                    onClick={() => toast({ title: 'Viewing Evidence Document', description: item.docType })}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    title="View Document"
                  >
                    <i className="fa-solid fa-eye text-xs"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 9. VISIBILITY & SHARING (ROLE-BASED ACCESS CONTROL) */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'visibility') && (
        <section className={`rounded-3xl border ${cardBg} p-6 sm:p-8 shadow-xl space-y-6`}>
          <div className="flex items-center justify-between pb-4 border-b border-[#334155]/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-400/15 flex items-center justify-center text-rose-400 text-base shrink-0">
                <i className="fa-solid fa-lock"></i>
              </div>
              <div>
                <h3 className={`font-black text-lg ${textTitle}`}>Visibility & Sharing Permissions</h3>
                <p className="text-xs text-[#94A3B8]">Control exactly what scouts, clubs, and the public can view</p>
              </div>
            </div>
            <Button
              onClick={() => toast({ title: 'Permissions Synchronized', description: 'Access control updated.' })}
              size="sm"
              variant="outline"
              className="border-[#334155] text-white hover:bg-slate-800 text-xs rounded-xl h-8 px-3.5 cursor-pointer"
            >
              Save Access Rules
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Scout Scope */}
            <div className={`p-5 rounded-2xl border ${innerBg} space-y-3.5`}>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white flex items-center gap-2">
                  <i className="fa-solid fa-binoculars text-sky-400"></i>
                  <span>Scout Access Permissions</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">Authorized Only</span>
              </div>
              <div className="space-y-2.5 text-slate-300">
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Basic Profile & Position</span>
                  <input
                    type="checkbox"
                    checked={visibilitySettings.scoutBasicProfile}
                    onChange={(e) => setVisibilitySettings({ ...visibilitySettings, scoutBasicProfile: e.target.checked })}
                    className="checkbox checkbox-xs checkbox-warning"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Performance Match Logs</span>
                  <input
                    type="checkbox"
                    checked={visibilitySettings.scoutPerformance}
                    onChange={(e) => setVisibilitySettings({ ...visibilitySettings, scoutPerformance: e.target.checked })}
                    className="checkbox checkbox-xs checkbox-warning"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Highlight Videos & Clips</span>
                  <input
                    type="checkbox"
                    checked={visibilitySettings.scoutVideos}
                    onChange={(e) => setVisibilitySettings({ ...visibilitySettings, scoutVideos: e.target.checked })}
                    className="checkbox checkbox-xs checkbox-warning"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Private Documents & Contracts</span>
                  <input
                    type="checkbox"
                    checked={visibilitySettings.scoutPrivateDocuments}
                    onChange={(e) => setVisibilitySettings({ ...visibilitySettings, scoutPrivateDocuments: e.target.checked })}
                    className="checkbox checkbox-xs checkbox-warning"
                  />
                </label>
              </div>
            </div>

            {/* Public Scope */}
            <div className={`p-5 rounded-2xl border ${innerBg} space-y-3.5`}>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white flex items-center gap-2">
                  <i className="fa-solid fa-globe text-emerald-400"></i>
                  <span>Public Web Profile</span>
                </span>
                <span className="text-[10px] text-amber-400 font-bold">Unauthenticated</span>
              </div>
              <div className="space-y-2.5 text-slate-300">
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Public Achievements & Trophies</span>
                  <input
                    type="checkbox"
                    checked={visibilitySettings.publicAchievements}
                    onChange={(e) => setVisibilitySettings({ ...visibilitySettings, publicAchievements: e.target.checked })}
                    className="checkbox checkbox-xs checkbox-warning"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Aggregated Public Stats</span>
                  <input
                    type="checkbox"
                    checked={visibilitySettings.publicStats}
                    onChange={(e) => setVisibilitySettings({ ...visibilitySettings, publicStats: e.target.checked })}
                    className="checkbox checkbox-xs checkbox-warning"
                  />
                </label>
                <div className="pt-1 text-[11px] text-slate-400 leading-normal">
                  Personal phone numbers, direct home addresses, and private medical screenings remain restricted to athlete-consent scopes.
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 10. CONNECTIONS SECTION */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'connections') && (
        <section className={`rounded-3xl border ${cardBg} p-6 sm:p-8 shadow-xl space-y-6`}>
          <div className="flex items-center justify-between pb-4 border-b border-[#334155]/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-400/15 flex items-center justify-center text-teal-400 text-base shrink-0">
                <i className="fa-solid fa-user-group"></i>
              </div>
              <div>
                <h3 className={`font-black text-lg ${textTitle}`}>Authorized Connections</h3>
                <p className="text-xs text-[#94A3B8]">Coaches, Scouts, and Analysts connected to your athlete passport</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">{connections.length} Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {connections.map((conn) => (
              <div key={conn.id} className={`p-4 rounded-2xl border ${innerBg} flex items-center justify-between gap-3`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className={`font-bold truncate ${textTitle}`}>{conn.name}</h5>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                      {conn.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{conn.role} • {conn.org}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {conn.status === 'Pending' ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setConnections(connections.map((c) => (c.id === conn.id ? { ...c, status: 'Active' } : c)));
                        toast({ title: 'Connection Accepted', description: `${conn.name} has been approved.` });
                      }}
                      className="bg-amber-400 text-slate-950 font-bold text-[11px] h-7 px-3 rounded-lg"
                    >
                      Accept
                    </Button>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-md">
                      Active
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 11. PROFILE ACTIVITY (AUDIT TRAIL) */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'activity') && (
        <section className={`rounded-3xl border ${cardBg} p-6 sm:p-8 shadow-xl space-y-6`}>
          <div className="flex items-center justify-between pb-4 border-b border-[#334155]/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/15 flex items-center justify-center text-amber-400 text-base shrink-0">
                <i className="fa-solid fa-clock-rotate-left"></i>
              </div>
              <div>
                <h3 className={`font-black text-lg ${textTitle}`}>Profile Activity Audit Trail</h3>
                <p className="text-xs text-[#94A3B8]">Immutable history of profile updates, assessments, and verifications</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {activityTrail.map((act) => (
              <div key={act.id} className="flex items-start gap-3 py-1">
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0 ring-4 ring-amber-400/20"></div>
                <div className="flex-1">
                  <p className="text-slate-200 font-medium text-xs sm:text-sm">{act.text}</p>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {act.date} at {act.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SHARE PROFILE */}
      {/* ========================================================================= */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#334155] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
              <h3 className="font-extrabold text-base text-white">Share Athlete Profile</h3>
              <button onClick={() => setShareModalOpen(false)} className="text-slate-400 hover:text-white">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#020617] border border-[#334155] flex items-center justify-between gap-2">
                <span className="truncate text-slate-300 font-mono text-[11px]">
                  {profileShareUrl}
                </span>
                <Button size="sm" onClick={copyPublicLink} className="bg-amber-400 text-slate-950 font-bold h-7 px-3 text-xs">
                  Copy
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => toast({ title: 'QR Code Generated', description: 'Displaying scan code for scouts.' })}
                  className="p-3.5 rounded-2xl bg-[#020617] border border-[#334155] hover:border-amber-400 text-slate-200 font-bold flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-qrcode text-amber-400"></i>
                  <span>Show QR Code</span>
                </button>
                <button
                  onClick={() => toast({ title: 'Shared with Scouts', description: 'Invitation sent to registered scout network.' })}
                  className="p-3.5 rounded-2xl bg-[#020617] border border-[#334155] hover:border-sky-400 text-slate-200 font-bold flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-paper-plane text-sky-400"></i>
                  <span>Share with Scout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD ATTRIBUTE ASSESSMENT */}
      {/* ========================================================================= */}
      {attributeAssessmentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#334155] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
              <h3 className="font-extrabold text-base text-white">Add Attribute Assessment</h3>
              <button onClick={() => setAttributeAssessmentOpen(false)} className="text-slate-400 hover:text-white">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Category</label>
                  <select
                    value={assessAttrCategory}
                    onChange={(e) => setAssessAttrCategory(e.target.value as any)}
                    className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Physical">Physical</option>
                    <option value="Mental">Mental</option>
                    <option value="Tactical">Tactical</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Attribute</label>
                  <input
                    type="text"
                    value={assessAttrName}
                    onChange={(e) => setAssessAttrName(e.target.value)}
                    className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white"
                    placeholder="eg Finishing"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>Score: {assessScore} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={assessScore}
                  onChange={(e) => setAssessScore(Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Assessment Type</label>
                  <select
                    value={assessType}
                    onChange={(e) => setAssessType(e.target.value)}
                    className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Coach Assessment">Coach Assessment</option>
                    <option value="Physical Screening">Physical Screening</option>
                    <option value="Scout Evaluation">Scout Evaluation</option>
                    <option value="Match Log Assessment">Match Log Assessment</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Assessor Name</label>
                  <input
                    type="text"
                    value={assessorName}
                    onChange={(e) => setAssessorName(e.target.value)}
                    className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white"
                    placeholder="eg Coach Marcus"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Assessment Notes</label>
                <textarea
                  rows={2}
                  value={assessNotes}
                  onChange={(e) => setAssessNotes(e.target.value)}
                  className="w-full bg-[#020617] border border-[#334155] rounded-xl p-3 text-white text-xs resize-none"
                  placeholder="Specific observations, drill context..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-[#334155]">
              <Button
                variant="outline"
                onClick={() => setAttributeAssessmentOpen(false)}
                className="flex-1 border-[#334155] text-slate-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddAttributeAssessment}
                className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs"
              >
                Save Assessment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REQUEST VERIFICATION */}
      {/* ========================================================================= */}
      {verificationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#334155] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
              <h3 className="font-extrabold text-base text-white">Request Verification Upgrade</h3>
              <button onClick={() => setVerificationModalOpen(false)} className="text-slate-400 hover:text-white">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Claim to Verify</label>
                <select
                  value={verifyTarget}
                  onChange={(e) => setVerifyTarget(e.target.value)}
                  className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white"
                >
                  <option value="Club Membership & Squad">Current Club Membership & Squad Status</option>
                  <option value="Sporting Position & Level">Primary Position & Sporting Level</option>
                  <option value="Physical Sensor Metrics">GPS Sensor Velocity & Distance Metrics</option>
                  <option value="Past Academy History">Historical Academy Career Records</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Target Verification Tier</label>
                <select
                  value={verifyLevel}
                  onChange={(e) => setVerifyLevel(e.target.value)}
                  className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white"
                >
                  <option value="L2 - Organization Confirmed">L2 Organization Confirmed (Club/Academy)</option>
                  <option value="L3 - Official Source Confirmed">L3 Official Source Confirmed (Federation/League)</option>
                  <option value="L4 - Multi-Source Confirmed">L4 Multi-Source Confirmed (Consensus Verification)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Supporting Notes / Reference Contacts</label>
                <textarea
                  rows={3}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="w-full bg-[#020617] border border-[#334155] rounded-xl p-3 text-white text-xs resize-none"
                  placeholder="Add details, federation registration ID, or reference contact..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-[#334155]">
              <Button
                variant="outline"
                onClick={() => setVerificationModalOpen(false)}
                className="flex-1 border-[#334155] text-slate-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestVerification}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs"
              >
                Submit to Review Queue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD EVIDENCE */}
      {/* ========================================================================= */}
      {evidenceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#334155] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
              <h3 className="font-extrabold text-base text-white">+ Add Supporting Evidence</h3>
              <button onClick={() => setEvidenceModalOpen(false)} className="text-slate-400 hover:text-white">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Claim to Back Up</label>
                <input
                  type="text"
                  value={evidenceClaim}
                  onChange={(e) => setEvidenceClaim(e.target.value)}
                  className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white"
                  placeholder="eg Played for Academy FC in 2025"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Document Type</label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white"
                >
                  <option value="Federation Registration Document">Federation Registration Document</option>
                  <option value="Official Match Sheet">Official Match Sheet</option>
                  <option value="Club Confirmation Letter">Club Confirmation Letter</option>
                  <option value="Tournament Certificate">Tournament Certificate</option>
                  <option value="GPS Session Telemetry Export">GPS Session Telemetry Export</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Document URL / Reference</label>
                <input
                  type="text"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="w-full bg-[#020617] border border-[#334155] rounded-xl px-3 py-2 text-white"
                  placeholder="https://... or attachment code"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Notes / Comments</label>
                <textarea
                  rows={2}
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  className="w-full bg-[#020617] border border-[#334155] rounded-xl p-3 text-white text-xs resize-none"
                  placeholder="Document serial number, verification authority..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-[#334155]">
              <Button
                variant="outline"
                onClick={() => setEvidenceModalOpen(false)}
                className="flex-1 border-[#334155] text-slate-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddEvidence}
                className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs"
              >
                Save Evidence
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ATTRIBUTE GROWTH HISTORY */}
      {/* ========================================================================= */}
      {selectedAttributeForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#334155] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#334155]">
              <h3 className="font-extrabold text-base text-white">
                {selectedAttributeForHistory} Growth History
              </h3>
              <button onClick={() => setSelectedAttributeForHistory(null)} className="text-slate-400 hover:text-white">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#020617] border border-[#334155] flex items-center justify-between">
                <span className="text-slate-400">Current Valid Rating</span>
                <span className="text-lg font-black text-amber-400">8 / 10</span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Assessment Progression</span>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between p-2 rounded-xl bg-slate-800/40">
                    <span className="text-slate-400">Jan 2026</span>
                    <span className="font-bold text-white">6 / 10 (Baseline)</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-slate-800/40">
                    <span className="text-slate-400">Apr 2026</span>
                    <span className="font-bold text-white">7 / 10 (+1.0)</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-amber-400/10 border border-amber-400/30">
                    <span className="text-amber-400 font-bold">Aug 2026 (Latest)</span>
                    <span className="font-black text-amber-400">8 / 10 (+1.0)</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 pt-1">
                Progressions feed the Talent Graph Growth engine to calculate development velocity without overwriting historical match positions.
              </p>
            </div>

            <Button
              onClick={() => setSelectedAttributeForHistory(null)}
              className="w-full bg-[#020617] border border-[#334155] text-white hover:bg-slate-800 text-xs font-bold"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
