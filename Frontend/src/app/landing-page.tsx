'use client';

import React, { useState } from 'react';
import { LandingHeader } from '@/components/landing/header';
import { AuthModal } from '@/components/landing/auth-modal';
import { LandingHero } from '@/components/landing/hero';
import { LandingProblemAndHow } from '@/components/landing/problem-and-how';
import { LandingAthletesVerificationMatch } from '@/components/landing/athletes-verification-match';
import { LandingScoutsClubsOpps } from '@/components/landing/scouts-clubs-opps';
import { LandingNetworkingFeedAiTimeline } from '@/components/landing/networking-feed-ai-timeline';
import { LandingPositioningPrivacySafeguarding } from '@/components/landing/positioning-privacy-safeguarding';
import { LandingAboutTrustFaqContactFooter } from '@/components/landing/about-trust-faq-contact-footer';
import { LandingSupportBot } from '@/components/landing/support-bot';

export function LandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-[var(--background-color)] text-[var(--text-color)] selection:bg-[var(--secondary-color)] selection:text-white"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* ── HEADER ── */}
      <LandingHeader onOpenAuth={() => setAuthModalOpen(true)} />

      {/* ── AUTH MODAL ── */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      <main id="top">
        {/* ── 1. HERO & TRACTION ── */}
        <LandingHero onOpenAuth={() => setAuthModalOpen(true)} />

        {/* ── 2. THE PROBLEM & HOW IT WORKS ── */}
        <LandingProblemAndHow />

        {/* ── 3. FOR ATHLETES, VERIFICATION & MATCH DATA ── */}
        <LandingAthletesVerificationMatch onOpenAuth={() => setAuthModalOpen(true)} />

        {/* ── 4. FOR SCOUTS, CLUBS & OPPORTUNITIES ── */}
        <LandingScoutsClubsOpps onOpenAuth={() => setAuthModalOpen(true)} />

        {/* ── 5. NETWORKING, SPORTS FEED, AI & TIMELINE ── */}
        <LandingNetworkingFeedAiTimeline />

        {/* ── 6. POSITIONING, PRIVACY, SAFEGUARDING & PARTNERS ── */}
        <LandingPositioningPrivacySafeguarding />

        {/* ── 7. ABOUT, TRUST, FAQ, FINAL CTA, CONTACT & FOOTER ── */}
        <LandingAboutTrustFaqContactFooter onOpenAuth={() => setAuthModalOpen(true)} />
      </main>

      {/* ── TALENT GRAPH AI SUPPORT BOT ── */}
      <LandingSupportBot />
    </div>
  );
}
