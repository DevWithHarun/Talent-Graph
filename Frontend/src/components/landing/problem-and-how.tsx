'use client';

import React from 'react';

export function LandingProblemAndHow() {
  return (
    <>
      {/* ── THE PROBLEM ── */}
      <section id="problem" className="bg-[var(--background-color)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">The Problem</span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
              Talent Is Everywhere. Opportunity Isn't.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[var(--text-muted)]">
              Athletes prove themselves through scattered channels. Coaches and scouts search across fragmented, unverified information. Clubs run recruitment through disconnected systems.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <span className="chip">
              <i className="fa-solid fa-circle-dot text-[10px] text-[var(--text-muted)]/60"></i>
              Social media
            </span>
            <span className="chip">
              <i className="fa-solid fa-circle-dot text-[10px] text-[var(--text-muted)]/60"></i>
              Video clips
            </span>
            <span className="chip">
              <i className="fa-solid fa-circle-dot text-[10px] text-[var(--text-muted)]/60"></i>
              WhatsApp
            </span>
            <span className="chip">
              <i className="fa-solid fa-circle-dot text-[10px] text-[var(--text-muted)]/60"></i>
              Spreadsheets
            </span>
            <span className="chip">
              <i className="fa-solid fa-circle-dot text-[10px] text-[var(--text-muted)]/60"></i>
              Paper records
            </span>
            <span className="chip">
              <i className="fa-solid fa-circle-dot text-[10px] text-[var(--text-muted)]/60"></i>
              Referrals
            </span>
          </div>
          <div className="mt-12 rounded-3xl border border-[var(--border-color)] bg-[var(--surface-color)] p-8 text-center sm:p-10">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black p-1 shadow-sm">
                <img
                  src="/icons/logo-transparent.png"
                  alt="Talent Graph Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <p className="text-lg font-semibold leading-relaxed text-[var(--text-color)] sm:text-xl" style={{ fontFamily: 'var(--font-heading)' }}>
                Talent Graph brings identity, evidence, performance, people and opportunity into one connected sporting ecosystem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="relative overflow-hidden bg-[var(--surface-dark)] py-20 text-white sm:py-28">
        <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-[var(--secondary-color)]/20 blur-3xl"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow eyebrow-light">How It Works</span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
              From Identity to Opportunity
            </h2>
            <p className="mt-5 text-lg text-[var(--text-light-muted)]">
              A connected loop that turns a profile into verifiable evidence — and evidence into opportunity.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--secondary-color)]/15 text-teal-300">
                  <i className="fa-solid fa-id-badge"></i>
                </div>
                <span className="text-2xl font-extrabold text-white/15" style={{ fontFamily: 'var(--font-heading)' }}>01</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Build your professional profile
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-light-muted)]">
                Sport, position, age category, location, club, achievements, competition history, videos, availability and goals.
              </p>
            </div>

            <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--secondary-color)]/15 text-teal-300">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <span className="text-2xl font-extrabold text-white/15" style={{ fontFamily: 'var(--font-heading)' }}>02</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Verify identity and evidence
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-light-muted)]">
                Persona identity check, coach verification, club or academy verification, plus performance, match and video evidence.
              </p>
            </div>

            <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--secondary-color)]/15 text-teal-300">
                  <i className="fa-solid fa-chart-line"></i>
                </div>
                <span className="text-2xl font-extrabold text-white/15" style={{ fontFamily: 'var(--font-heading)' }}>03</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Build your performance record
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-light-muted)]">
                Metrics, training, match stats, milestones and coach assessments.
              </p>
              <p className="mt-4 border-t border-white/10 pt-3 text-[13px] font-semibold italic text-teal-300">
                Don’t just tell the world you’re good. Build the evidence.
              </p>
            </div>

            <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--secondary-color)]/15 text-teal-300">
                  <i className="fa-solid fa-magnifying-glass"></i>
                </div>
                <span className="text-2xl font-extrabold text-white/15" style={{ fontFamily: 'var(--font-heading)' }}>04</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Get discovered
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-light-muted)]">
                Coaches and scouts filter by sport, position, age, location, verification and availability.
              </p>
              <p className="mt-4 border-t border-white/10 pt-3 text-[13px] font-semibold italic text-teal-300">
                “U18 midfielders in Nairobi with verified match experience.”
              </p>
            </div>

            <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--secondary-color)]/15 text-teal-300">
                  <i className="fa-solid fa-briefcase"></i>
                </div>
                <span className="text-2xl font-extrabold text-white/15" style={{ fontFamily: 'var(--font-heading)' }}>05</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Connect with opportunities
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-light-muted)]">
                Trials, academy places, scholarships, competitions, training and sponsorships — discover, save, contact, invite and shortlist.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
