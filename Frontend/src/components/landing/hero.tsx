'use client';

import React from 'react';
import { Link } from 'wouter';

interface LandingHeroProps {
  onOpenAuth?: () => void;
}

export function LandingHero({ onOpenAuth = () => {} }: LandingHeroProps) {
  return (
    <>
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-[var(--surface-dark)] text-white">
        <img
          alt="Athlete competing under stadium floodlights"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          src="https://files.cdn-files-a.com/uploads/12387247/800_gi-6ac2e12eef8c4.jpg?format=avif"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--surface-dark)]/78 via-[var(--surface-dark)]/90 to-[var(--surface-dark)]" aria-hidden="true"></div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-40 -top-48 h-[36rem] w-[36rem] rounded-full bg-[var(--glow-color)]/20 blur-[130px]"></div>
          <div className="absolute -bottom-48 -left-40 h-[36rem] w-[36rem] rounded-full bg-[var(--accent-color)]/20 blur-[130px]"></div>
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-12 lg:gap-16 lg:px-8 lg:py-32">
          <div className="lg:col-span-6">
            <span className="badge-pill">
              <i className="fa-solid fa-shield-halved"></i>
              Verified sporting identity
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-5xl lg:text-[4.25rem]" style={{ fontFamily: 'var(--font-heading)' }}>
              Where Athletic Talent Becomes <span className="text-[var(--glow-color)]">Visible.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--text-light-muted)]">
              Build a professional athletic identity, verify your journey, showcase your performance, and connect with the people and opportunities that can move your career forward.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/signup"
                className="btn h-14 rounded-full border-none bg-[var(--secondary-color)] px-8 text-base text-white shadow-[var(--shadow-glow)] transition-transform duration-300 hover:-translate-y-0.5 hover:bg-[var(--secondary-hover)] cursor-pointer no-underline inline-flex items-center justify-center font-bold"
              >
                Build Your Athlete Profile
              </Link>
              <a
                href="#scouts"
                className="btn h-14 rounded-full border border-white/15 bg-white/5 px-8 text-base text-white backdrop-blur transition-colors hover:border-white/30 hover:bg-white/10 no-underline inline-flex items-center justify-center"
              >
                For Coaches, Scouts &amp; Clubs
              </a>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-white/10 pt-6 text-[13px] font-semibold text-[var(--text-light-muted)]">
              <span className="inline-flex items-center gap-2">
                <i className="fa-solid fa-lock text-[var(--glow-color)]"></i>
                Privacy-first
              </span>
              <span className="inline-flex items-center gap-2">
                <i className="fa-solid fa-fingerprint text-[var(--glow-color)]"></i>
                6 verification layers
              </span>
              <span className="inline-flex items-center gap-2">
                <i className="fa-solid fa-earth-africa text-[var(--glow-color)]"></i>
                Built for Africa
              </span>
            </div>
          </div>

          <div className="relative lg:col-span-6">
            <div className="rounded-[var(--radius-xl)] border border-white/10 bg-white/[0.05] p-4 shadow-[var(--shadow-lg)] backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--glow-color)]/15 text-sm font-bold text-[var(--glow-color)]">
                    MJ
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">Marcus Johnson</p>
                    <p className="truncate text-[11px] text-[var(--glow-color)]">Central Midfielder · U18 · Nairobi</p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--glow-color)]/30 bg-[var(--glow-color)]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--glow-color)]">
                  <i className="fa-solid fa-circle-check"></i>
                  Verified
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-center">
                  <p className="text-lg font-extrabold leading-none text-white">34</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-light-muted)]">Matches</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-center">
                  <p className="text-lg font-extrabold leading-none text-white">2,860</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-light-muted)]">Minutes</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-center">
                  <p className="text-lg font-extrabold leading-none text-white">7.8</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-light-muted)]">Avg rating</p>
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 transition-colors hover:border-white/20 hover:bg-white/[0.06]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--glow-color)]/10 text-[var(--glow-color)]">
                    <i className="fa-solid fa-id-badge text-sm"></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--glow-color)]">Identity</p>
                    <p className="truncate text-[13px] text-[var(--text-light-muted)]">Sport, position, club, availability</p>
                  </div>
                  <i className="fa-solid fa-arrow-right ml-auto text-xs text-white/20"></i>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 transition-colors hover:border-white/20 hover:bg-white/[0.06]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--glow-color)]/10 text-[var(--glow-color)]">
                    <i className="fa-solid fa-shield-halved text-sm"></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--glow-color)]">Verification</p>
                    <p className="truncate text-[13px] text-[var(--text-light-muted)]">Persona · Coach · Club · Match</p>
                  </div>
                  <i className="fa-solid fa-arrow-right ml-auto text-xs text-white/20"></i>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 transition-colors hover:border-white/20 hover:bg-white/[0.06]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--glow-color)]/10 text-[var(--glow-color)]">
                    <i className="fa-solid fa-chart-line text-sm"></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--glow-color)]">Performance</p>
                    <p className="truncate text-[13px] text-[var(--text-light-muted)]">Metrics, training and match record</p>
                  </div>
                  <i className="fa-solid fa-arrow-right ml-auto text-xs text-white/20"></i>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 transition-colors hover:border-white/20 hover:bg-white/[0.06]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--glow-color)]/10 text-[var(--glow-color)]">
                    <i className="fa-solid fa-magnifying-glass text-sm"></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--glow-color)]">Discovery</p>
                    <p className="truncate text-[13px] text-[var(--text-light-muted)]">U18 midfielders in Nairobi</p>
                  </div>
                  <i className="fa-solid fa-arrow-right ml-auto text-xs text-white/20"></i>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 transition-colors hover:border-white/20 hover:bg-white/[0.06]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--glow-color)]/10 text-[var(--glow-color)]">
                    <i className="fa-solid fa-comments text-sm"></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--glow-color)]">Connection</p>
                    <p className="truncate text-[13px] text-[var(--text-light-muted)]">Coaches, scouts and clubs</p>
                  </div>
                  <i className="fa-solid fa-arrow-right ml-auto text-xs text-white/20"></i>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 transition-colors hover:border-white/20 hover:bg-white/[0.06]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--glow-color)]/10 text-[var(--glow-color)]">
                    <i className="fa-solid fa-briefcase text-sm"></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--glow-color)]">Opportunity</p>
                    <p className="truncate text-[13px] text-[var(--text-light-muted)]">Trials, scholarships, intake</p>
                  </div>
                  <i className="fa-solid fa-arrow-right ml-auto text-xs text-white/20"></i>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-light-muted)]">Scout search</p>
                <p className="mt-1.5 text-sm font-semibold text-white">Verified match evidence</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-light-muted)]">Club hub</p>
                <p className="mt-1.5 text-sm font-semibold text-white">Recruitment pipeline</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRACTION STATS BAR ── */}
      <section className="relative border-b border-[var(--border-color)] bg-[var(--surface-color)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 divide-x divide-[var(--border-color)]">
            <div className="flex flex-col items-center px-2 py-8 text-center sm:py-11">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--background-color)] text-[var(--secondary-color)] shadow-[var(--shadow-xs)]">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
                30+
              </div>
              <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] sm:text-xs">
                Clubs
              </div>
            </div>

            <div className="flex flex-col items-center px-2 py-8 text-center sm:py-11">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--background-color)] text-[var(--secondary-color)] shadow-[var(--shadow-xs)]">
                <i className="fa-solid fa-magnifying-glass"></i>
              </div>
              <div className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
                14
              </div>
              <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] sm:text-xs">
                Scouts
              </div>
            </div>

            <div className="flex flex-col items-center px-2 py-8 text-center sm:py-11">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--background-color)] text-[var(--secondary-color)] shadow-[var(--shadow-xs)]">
                <i className="fa-solid fa-person-running"></i>
              </div>
              <div className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
                170+
              </div>
              <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] sm:text-xs">
                Athletes
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
