'use client';

import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

export interface PerformanceMatchData {
  athleteId: string;
  date: string;
  opponent: string;
  competition: string;
  position: string;
  result: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  rating: number;
  shots: number;
  shotsOnTarget: number;
  keyPasses: number;
  passes: number;
  passAccuracy: number;
  dribbles: number;
  successfulDribbles: number;
  tackles: number;
  tacklesWon: number;
  interceptions: number;
  clearances: number;
  recoveries: number;
  season?: string;
  createdAt?: string;
}

export interface TrainingSessionData {
  athleteId: string;
  date: string;
  session: string;
  type: string;
  attendance: 'Present' | 'Late' | 'Absent';
  minutes: number;
  load: number;
  createdAt?: string;
}

export interface AssessmentData {
  athleteId: string;
  attribute: string;
  score: number;
  source: string;
  updated: string;
  createdAt?: string;
}

const SAMPLE_OPPONENTS = [
  'Bandari FC', 'Tusker FC', 'Gor Mahia', 'AFC Leopards',
  'Kariobangi Sharks', 'Posta Rangers', 'Ulinzi Stars',
  'Sofapaka FC', 'Mathare United', 'Coast Stima'
];

const SAMPLE_SESSIONS = [
  'Tactical Preparation', 'High-Intensity Aerobic', 'Positioning & Set Pieces',
  'Finishing & Crossing Drills', 'Active Recovery & Mobility'
];

/**
 * Removes any previously seeded sample data from Firestore so the athlete's
 * dashboard is 100% authentic and reflects only what the user has logged.
 */
export async function clearSeededPerformanceData(firestore: Firestore, uid: string) {
  if (!firestore || !uid) return;

  try {
    // 1. Delete sample matches
    const matchesRef = collection(firestore, 'matches');
    const mSnap = await getDocs(query(matchesRef, where('athleteId', '==', uid)));
    for (const docSnap of mSnap.docs) {
      const data = docSnap.data();
      if (SAMPLE_OPPONENTS.includes(data.opponent) || data.isSample) {
        await deleteDoc(docSnap.ref);
      }
    }

    // 2. Delete sample training sessions
    const trainingRef = collection(firestore, 'training_sessions');
    const tSnap = await getDocs(query(trainingRef, where('athleteId', '==', uid)));
    for (const docSnap of tSnap.docs) {
      const data = docSnap.data();
      if (SAMPLE_SESSIONS.includes(data.session) || data.isSample) {
        await deleteDoc(docSnap.ref);
      }
    }

    // 3. Delete sample assessments
    const assessmentsRef = collection(firestore, 'assessments');
    const aSnap = await getDocs(query(assessmentsRef, where('athleteId', '==', uid)));
    for (const docSnap of aSnap.docs) {
      const data = docSnap.data();
      if (data.source === 'Coach' && data.updated === 'Sep 2026') {
        await deleteDoc(docSnap.ref);
      }
    }
  } catch (err) {
    console.error('Error clearing sample data:', err);
  }
}
