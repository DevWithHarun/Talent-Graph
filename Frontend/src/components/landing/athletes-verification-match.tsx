'use client';

import React from 'react';
import { Link } from 'wouter';

interface LandingAthletesVerificationMatchProps {
  onOpenAuth: () => void;
}

export function LandingAthletesVerificationMatch({ onOpenAuth }: LandingAthletesVerificationMatchProps) {
  return (
    <>
      {/* ── FOR ATHLETES ── */}
      <section id="athletes" className="bg-[var(--background-color)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="eyebrow">For Athletes</span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
                Build a Sporting Career, Not Just a Social Profile.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[var(--text-muted)]">
                Your profile becomes a professional record — identity, evidence, performance and availability in one place, under your control.
              </p>
              <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <li className="flex items-start gap-3 text-[15px] text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check mt-1 text-[var(--secondary-color)]"></i>
                  <span>Professional athletic profile with sport, position and age category</span>
                </li>
                <li className="flex items-start gap-3 text-[15px] text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check mt-1 text-[var(--secondary-color)]"></i>
                  <span>Verified identity and evidence</span>
                </li>
                <li className="flex items-start gap-3 text-[15px] text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check mt-1 text-[var(--secondary-color)]"></i>
                  <span>Performance record and match history</span>
                </li>
                <li className="flex items-start gap-3 text-[15px] text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check mt-1 text-[var(--secondary-color)]"></i>
                  <span>Video and match evidence</span>
                </li>
                <li className="flex items-start gap-3 text-[15px] text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check mt-1 text-[var(--secondary-color)]"></i>
                  <span>Achievements and development milestones</span>
                </li>
                <li className="flex items-start gap-3 text-[15px] text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check mt-1 text-[var(--secondary-color)]"></i>
                  <span>Opportunities and trial invites</span>
                </li>
                <li className="flex items-start gap-3 text-[15px] text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check mt-1 text-[var(--secondary-color)]"></i>
                  <span>Networking and direct messaging</span>
                </li>
                <li className="flex items-start gap-3 text-[15px] text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check mt-1 text-[var(--secondary-color)]"></i>
                  <span>Privacy and visibility controls</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="btn mt-9 h-12 rounded-full border-none bg-[var(--primary-color)] px-7 text-white hover:bg-[var(--primary-hover)] cursor-pointer no-underline inline-flex items-center justify-center font-bold"
              >
                Build Your Athlete Profile
              </Link>
            </div>

            <div className="ui-card overflow-hidden">
              <div className="relative h-32 sm:h-40">
                <img
                  alt="Football midfielder competing in a match"
                  className="h-full w-full object-cover"
                  src="https://files.cdn-files-a.com/uploads/12387247/800_gi-6ac2e12eef84d.jpg?format=avif"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-dark)]/80 via-[var(--surface-dark)]/20 to-transparent"></div>
              </div>
              <div className="px-5 pb-6">
                <div className="-mt-10 flex items-end justify-between">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-[var(--surface-2)] text-xl font-extrabold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>
                    MJ
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-bold text-[var(--secondary-color)]">
                    <i className="fa-solid fa-circle-check"></i>
                    Verified
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Marcus Johnson
                </h3>
                <p className="text-sm text-[var(--text-muted)]">Central Midfielder · U18 · Nairobi</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-lg border border-[var(--border-color)] bg-[var(--surface-color)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)]">Football</span>
                  <span className="rounded-lg border border-[var(--border-color)] bg-[var(--surface-color)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)]">Right foot</span>
                  <span className="rounded-lg border border-[var(--border-color)] bg-[var(--surface-color)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)]">175 cm</span>
                  <span className="rounded-lg border border-[var(--border-color)] bg-[var(--surface-color)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)]">Available</span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-3 text-center">
                    <p className="text-xl font-extrabold leading-none text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>88</p>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Performance</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-3 text-center">
                    <p className="text-xl font-extrabold leading-none text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>84</p>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Efficiency</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-3 text-center">
                    <p className="text-xl font-extrabold leading-none text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>91</p>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Consistency</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VERIFICATION ── */}
      <section id="verification" className="bg-[var(--surface-color)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">Verification</span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
              Proof Changes Everything.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[var(--text-muted)]">
              Verification moves discovery beyond claims, popularity and social visibility — toward evidence that stands up.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="feature-card p-6">
              <div className="flex items-start justify-between">
                <div className="icon-tile h-12 w-12 text-lg">
                  <i className="fa-solid fa-fingerprint"></i>
                </div>
                <span className="text-2xl font-extrabold text-[var(--border-color)]" style={{ fontFamily: 'var(--font-heading)' }}>01</span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>Persona verification</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">Identity confirmation that anchors a profile to a real person.</p>
              <div className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--secondary-color)]">
                <i className="fa-solid fa-circle-check"></i>
                Verified layer
              </div>
            </div>

            <div className="feature-card p-6">
              <div className="flex items-start justify-between">
                <div className="icon-tile h-12 w-12 text-lg">
                  <i className="fa-solid fa-clipboard-check"></i>
                </div>
                <span className="text-2xl font-extrabold text-[var(--border-color)]" style={{ fontFamily: 'var(--font-heading)' }}>02</span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>Coach verification</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">Assessment and confirmation from a registered coach.</p>
              <div className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--secondary-color)]">
                <i className="fa-solid fa-circle-check"></i>
                Verified layer
              </div>
            </div>

            <div className="feature-card p-6">
              <div className="flex items-start justify-between">
                <div className="icon-tile h-12 w-12 text-lg">
                  <i className="fa-solid fa-building-shield"></i>
                </div>
                <span className="text-2xl font-extrabold text-[var(--border-color)]" style={{ fontFamily: 'var(--font-heading)' }}>03</span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>Club verification</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">Club or academy confirmation of membership and history.</p>
              <div className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--secondary-color)]">
                <i className="fa-solid fa-circle-check"></i>
                Verified layer
              </div>
            </div>

            <div className="feature-card p-6">
              <div className="flex items-start justify-between">
                <div className="icon-tile h-12 w-12 text-lg">
                  <i className="fa-solid fa-futbol"></i>
                </div>
                <span className="text-2xl font-extrabold text-[var(--border-color)]" style={{ fontFamily: 'var(--font-heading)' }}>04</span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>Match verification</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">Match participation and performance confirmed by evidence.</p>
              <div className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--secondary-color)]">
                <i className="fa-solid fa-circle-check"></i>
                Verified layer
              </div>
            </div>

            <div className="feature-card p-6">
              <div className="flex items-start justify-between">
                <div className="icon-tile h-12 w-12 text-lg">
                  <i className="fa-solid fa-dumbbell"></i>
                </div>
                <span className="text-2xl font-extrabold text-[var(--border-color)]" style={{ fontFamily: 'var(--font-heading)' }}>05</span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>Training verification</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">Logged training and development activity.</p>
              <div className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--secondary-color)]">
                <i className="fa-solid fa-circle-check"></i>
                Verified layer
              </div>
            </div>

            <div className="feature-card p-6">
              <div className="flex items-start justify-between">
                <div className="icon-tile h-12 w-12 text-lg">
                  <i className="fa-solid fa-video"></i>
                </div>
                <span className="text-2xl font-extrabold text-[var(--border-color)]" style={{ fontFamily: 'var(--font-heading)' }}>06</span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>Video verification</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">Video evidence attached directly to the athlete record.</p>
              <div className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--secondary-color)]">
                <i className="fa-solid fa-circle-check"></i>
                Verified layer
              </div>
            </div>
          </div>
          <p className="mt-12 text-center text-lg font-semibold italic text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>
            Don’t just tell the world you’re talented. Give them evidence.
          </p>
        </div>
      </section>

      {/* ── MATCH DATA ── */}
      <section id="match-data" className="relative overflow-hidden bg-[var(--surface-dark)] py-20 text-white sm:py-28">
        <div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-[var(--accent-color)]/20 blur-3xl"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="eyebrow eyebrow-light">Performance</span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
                Performance Doesn't Stop at the Profile.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[var(--text-light-muted)]">
                Where connected match-data sources support it, performance flows straight into the athlete record — match by match.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-light-muted)]">Minutes</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-light-muted)]">Goals</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-light-muted)]">Assists</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-light-muted)]">Shots</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-light-muted)]">Tackles</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-light-muted)]">Passes</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-light-muted)]">Distance</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-light-muted)]">Speed</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-light-muted)]">Events</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-light-muted)]">Rating</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-light-muted)]">Timeline</span>
              </div>
              <p className="mt-6 text-sm text-[var(--text-light-muted)]/80 flex items-center">
                <i className="fa-solid fa-circle-info mr-1.5 text-teal-300"></i>
                Available metrics depend on the match-data providers connected to each competition.
              </p>
              <Link href="/feed" className="btn mt-9 h-12 rounded-full border-none bg-white/10 px-7 text-white backdrop-blur hover:bg-white/20 no-underline inline-flex items-center">
                Explore Match Data
              </Link>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur">
              <div className="relative h-32 sm:h-36">
                <img
                  alt="Football match in play under floodlights"
                  className="h-full w-full object-cover"
                  src="https://files.cdn-files-a.com/uploads/12387247/800_gi-6ac2e12eef877.jpg?format=avif"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-dark)] via-[var(--surface-dark)]/40 to-transparent"></div>
                <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-light-muted)]">Full time</p>
                    <p className="mt-0.5 text-base font-bold text-white">Coastal United 2 – 1 Kilifi Stars</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-teal-400/30 bg-teal-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-300 backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400"></span>
                    Match data
                  </span>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/15 text-sm font-bold text-teal-300">
                      MJ
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Marcus Johnson</p>
                      <p className="text-[11px] text-[var(--text-light-muted)]">Central Midfielder · 90 min</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold leading-none text-teal-400" style={{ fontFamily: 'var(--font-heading)' }}>
                      8.4
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-light-muted)]">Rating</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                    <p className="text-lg font-extrabold leading-none text-white">2</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-light-muted)]">Goals</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                    <p className="text-lg font-extrabold leading-none text-white">1</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-light-muted)]">Assist</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                    <p className="text-lg font-extrabold leading-none text-white">87%</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-light-muted)]">Passes</p>
                  </div>
                </div>
                <div className="mt-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-light-muted)]">Timeline</p>
                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <span className="w-10 shrink-0 text-[11px] font-bold text-teal-300">12 '</span>
                      <span className="h-px flex-1 bg-white/10"></span>
                      <span className="text-[13px] text-[var(--text-light-muted)]">Goal — Marcus Johnson</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-10 shrink-0 text-[11px] font-bold text-teal-300">38 '</span>
                      <span className="h-px flex-1 bg-white/10"></span>
                      <span className="text-[13px] text-[var(--text-light-muted)]">Assist — Marcus Johnson</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-10 shrink-0 text-[11px] font-bold text-teal-300">67 '</span>
                      <span className="h-px flex-1 bg-white/10"></span>
                      <span className="text-[13px] text-[var(--text-light-muted)]">Shot on target</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
