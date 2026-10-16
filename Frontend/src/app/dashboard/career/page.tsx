'use client';

import React from 'react';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { AthleteProfile, UserAccount } from '@/lib/types';
import { AthleteCareerTab } from '@/components/dashboard/athlete-career-tab';
import { Link } from 'wouter';

export default function AthleteCareerPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userAccountRef = useMemoFirebase(
    () => (user?.uid && firestore ? doc(firestore, 'users', user.uid) : null),
    [user?.uid, firestore]
  );
  const { data: userAccount } = useDoc<UserAccount>(userAccountRef);

  const athleteRef = useMemoFirebase(
    () => (user?.uid && firestore ? doc(firestore, 'athletes', user.uid) : null),
    [user?.uid, firestore]
  );
  const { data: athleteProfile } = useDoc<AthleteProfile>(athleteRef);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] pb-24">
      {/* Top Bar with Back Link */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40 shadow-sm">
        <div className="px-4 md:px-6 h-16 flex items-center justify-between max-w-5xl mx-auto w-full">
          <Link
            href="/?tab=career"
            className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-black transition cursor-pointer"
          >
            <i className="fa-solid fa-arrow-left text-sm"></i>
            <span>Back to Dashboard</span>
          </Link>
          <span className="font-extrabold text-sm uppercase tracking-wider text-emerald-600 font-mono">
            Verified Sporting Passport
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        <AthleteCareerTab
          athleteProfile={athleteProfile ?? undefined}
          userAccount={userAccount ?? undefined}
          theme="light"
        />
      </main>
    </div>
  );
}
