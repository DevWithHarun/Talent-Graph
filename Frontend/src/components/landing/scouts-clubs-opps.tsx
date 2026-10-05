'use client';

import React from 'react';
import { Link } from 'wouter';

interface LandingScoutsClubsOppsProps {
  onOpenAuth: () => void;
}

export function LandingScoutsClubsOpps({ onOpenAuth }: LandingScoutsClubsOppsProps) {
  return (
    <>
      {/* ── FOR COACHES & SCOUTS ── */}
      <section id="scouts" className="bg-[var(--background-color)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">For Coaches &amp; Scouts</span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
              Discover Talent Beyond Popularity.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[var(--text-muted)]">
              Search verified athletes by what matters — then shortlist, compare, contact and move them through your recruitment workflow.
            </p>
          </div>

          <div className="ui-card mt-12 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-3.5 py-2 text-[13px] font-semibold text-[var(--text-color)]">
                Sport: Football
              </span>
              <span className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-3.5 py-2 text-[13px] font-semibold text-[var(--text-color)]">
                Position: Midfielder
              </span>
              <span className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-3.5 py-2 text-[13px] font-semibold text-[var(--text-color)]">
                Age: U18
              </span>
              <span className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-3.5 py-2 text-[13px] font-semibold text-[var(--text-color)]">
                Location: Kenya
              </span>
              <span className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-3.5 py-2 text-[13px] font-semibold text-[var(--text-color)]">
                Verified: Yes
              </span>
              <Link
                href="/athletes"
                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[var(--secondary-color)] px-5 py-2 text-[13px] font-bold uppercase tracking-wider text-white no-underline hover:bg-[var(--secondary-hover)]"
              >
                <i className="fa-solid fa-magnifying-glass"></i>
                Search Talent
              </Link>
            </div>

            <div className="mt-5 space-y-3 border-t border-[var(--border-color)] pt-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-sm font-bold text-[var(--text-color)]">
                  TG
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--text-color)]">
                    Marcus Johnson <i className="fa-solid fa-circle-check ml-1 text-[11px] text-[var(--secondary-color)]"></i>
                  </p>
                  <p className="truncate text-[12px] text-[var(--text-muted)]">Central Midfielder · U18 · Nairobi</p>
                </div>
                <span className="hidden shrink-0 rounded-lg bg-[var(--surface-color)] px-3 py-1.5 text-sm font-extrabold text-[var(--text-color)] sm:block" style={{ fontFamily: 'var(--font-heading)' }}>
                  88
                </span>
                <span className="hidden shrink-0 rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-muted)] md:block">
                  Shortlist
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-sm font-bold text-[var(--text-color)]">
                  TG
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--text-color)]">
                    David Ali <i className="fa-solid fa-circle-check ml-1 text-[11px] text-[var(--secondary-color)]"></i>
                  </p>
                  <p className="truncate text-[12px] text-[var(--text-muted)]">Central Midfielder · U17 · Mombasa</p>
                </div>
                <span className="hidden shrink-0 rounded-lg bg-[var(--surface-color)] px-3 py-1.5 text-sm font-extrabold text-[var(--text-color)] sm:block" style={{ fontFamily: 'var(--font-heading)' }}>
                  84
                </span>
                <span className="hidden shrink-0 rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-muted)] md:block">
                  Shortlist
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-sm font-bold text-[var(--text-color)]">
                  TG
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--text-color)]">
                    Brian Otieno <i className="fa-solid fa-circle-check ml-1 text-[11px] text-[var(--secondary-color)]"></i>
                  </p>
                  <p className="truncate text-[12px] text-[var(--text-muted)]">Central Midfielder · U18 · Kisumu</p>
                </div>
                <span className="hidden shrink-0 rounded-lg bg-[var(--surface-color)] px-3 py-1.5 text-sm font-extrabold text-[var(--text-color)] sm:block" style={{ fontFamily: 'var(--font-heading)' }}>
                  81
                </span>
                <span className="hidden shrink-0 rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-muted)] md:block">
                  Shortlist
                </span>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-4 py-3">
              <i className="fa-solid fa-circle-check text-[var(--secondary-color)]"></i>
              <span className="text-sm font-semibold text-[var(--text-color)]">Search and filters</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-4 py-3">
              <i className="fa-solid fa-circle-check text-[var(--secondary-color)]"></i>
              <span className="text-sm font-semibold text-[var(--text-color)]">Verified profiles</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-4 py-3">
              <i className="fa-solid fa-circle-check text-[var(--secondary-color)]"></i>
              <span className="text-sm font-semibold text-[var(--text-color)]">Performance, match and video evidence</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-4 py-3">
              <i className="fa-solid fa-circle-check text-[var(--secondary-color)]"></i>
              <span className="text-sm font-semibold text-[var(--text-color)]">Shortlisting</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-4 py-3">
              <i className="fa-solid fa-circle-check text-[var(--secondary-color)]"></i>
              <span className="text-sm font-semibold text-[var(--text-color)]">Comparison</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-4 py-3">
              <i className="fa-solid fa-circle-check text-[var(--secondary-color)]"></i>
              <span className="text-sm font-semibold text-[var(--text-color)]">Direct messaging</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-4 py-3">
              <i className="fa-solid fa-circle-check text-[var(--secondary-color)]"></i>
              <span className="text-sm font-semibold text-[var(--text-color)]">Opportunity creation</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] px-4 py-3">
              <i className="fa-solid fa-circle-check text-[var(--secondary-color)]"></i>
              <span className="text-sm font-semibold text-[var(--text-color)]">Recruitment workflows</span>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/athletes"
              className="btn h-12 rounded-full border-none bg-[var(--primary-color)] px-7 text-white hover:bg-[var(--primary-hover)] no-underline inline-flex items-center justify-center font-bold"
            >
              Discover Talent
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOR CLUBS & ACADEMIES ── */}
      <section id="clubs" className="bg-[var(--surface-color)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="eyebrow">For Clubs &amp; Academies</span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
                One Platform for Your Club or Academy.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[var(--text-muted)]">
                Run your organization from a single command center — people, permissions, recruitment, competitions and announcements.
              </p>
              <ul className="mt-8 space-y-3.5">
                <li className="flex items-start gap-3 text-[15px] text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check mt-1 text-[var(--secondary-color)]"></i>
                  <span>Organization profile</span>
                </li>
                <li className="flex items-start gap-3 text-[15px] text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check mt-1 text-[var(--secondary-color)]"></i>
                  <span>Athlete and coach management with permissions</span>
                </li>
                <li className="flex items-start gap-3 text-[15px] text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check mt-1 text-[var(--secondary-color)]"></i>
                  <span>Recruitment — shortlists, published opportunities and trial invites</span>
                </li>
                <li className="flex items-start gap-3 text-[15px] text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check mt-1 text-[var(--secondary-color)]"></i>
                  <span>Competition and match tracking</span>
                </li>
                <li className="flex items-start gap-3 text-[15px] text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check mt-1 text-[var(--secondary-color)]"></i>
                  <span>Announcements to your squads</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="btn mt-9 h-12 rounded-full border-none bg-[var(--primary-color)] px-7 text-white hover:bg-[var(--primary-hover)] cursor-pointer font-bold no-underline inline-flex items-center justify-center"
              >
                Register Your Club / Academy
              </Link>
            </div>

            <div className="ui-card overflow-hidden">
              <div className="relative h-32 sm:h-40">
                <img
                  alt="Football stadium and pitch"
                  className="h-full w-full object-cover"
                  src="https://files.cdn-files-a.com/uploads/12387247/800_gi-6ac2e12eef85c.jpg?format=avif"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-dark)]/85 via-[var(--surface-dark)]/25 to-transparent"></div>
                <span className="absolute bottom-3 left-4 inline-flex items-center gap-1.5 rounded-lg bg-teal-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
                  <i className="fa-solid fa-check-double"></i>
                  Verified organization
                </span>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-color)] text-white">
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>
                      Mombasa United
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">Command Center</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-3.5">
                    <p className="text-2xl font-extrabold leading-none text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>186</p>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Athletes</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-3.5">
                    <p className="text-2xl font-extrabold leading-none text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>12</p>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Teams</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-3.5">
                    <p className="text-2xl font-extrabold leading-none text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>24</p>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Coaches</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-3.5">
                    <p className="text-2xl font-extrabold leading-none text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>9</p>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Pending</p>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl border border-[var(--border-color)] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Recruitment pipeline</p>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-lg font-extrabold leading-none text-[var(--text-color)]">42</p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Found</p>
                    </div>
                    <div>
                      <p className="text-lg font-extrabold leading-none text-[var(--text-color)]">18</p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Shortlist</p>
                    </div>
                    <div>
                      <p className="text-lg font-extrabold leading-none text-[var(--text-color)]">5</p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Trial</p>
                    </div>
                    <div>
                      <p className="text-lg font-extrabold leading-none text-[var(--text-color)]">2</p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Offers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OPPORTUNITIES ── */}
      <section id="opportunities" className="bg-[var(--background-color)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">Opportunities</span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
              Turn Discovery Into Opportunity.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[var(--text-muted)]">
              Trials, academy intake, scholarships, competitions, recruitment, training, coaching and sponsorship — all in one place.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="relative aspect-video">
                <img
                  alt="U18 Football Trial"
                  className="h-full w-full object-cover"
                  src="https://files.cdn-files-a.com/uploads/12387247/800_gi-6ac2e12eef880.jpg?format=avif"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                <span className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--secondary-color)]">
                  Club Trial
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--secondary-color)]"></span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Open</span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  U18 Football Trial
                </h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">Nairobi · U18 · Football</p>
                <Link href="/opportunities" className="mt-auto pt-6 text-left text-sm font-bold text-[var(--secondary-color)] underline-offset-4 hover:underline no-underline">
                  View Opportunity <i className="fa-solid fa-arrow-right ml-1 text-xs"></i>
                </Link>
              </div>
            </div>

            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="relative aspect-video">
                <img
                  alt="2027 Academy Intake"
                  className="h-full w-full object-cover"
                  src="https://files.cdn-files-a.com/uploads/12387247/800_gi-6ac2e12eef889.jpg?format=avif"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                <span className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--secondary-color)]">
                  Academy Scholarship
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--secondary-color)]"></span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Open</span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  2027 Academy Intake
                </h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">Kenya · 2027 Intake</p>
                <Link href="/opportunities" className="mt-auto pt-6 text-left text-sm font-bold text-[var(--secondary-color)] underline-offset-4 hover:underline no-underline">
                  View Opportunity <i className="fa-solid fa-arrow-right ml-1 text-xs"></i>
                </Link>
              </div>
            </div>

            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="relative aspect-video">
                <img
                  alt="East Africa U20 Cup"
                  className="h-full w-full object-cover"
                  src="https://files.cdn-files-a.com/uploads/12387247/800_gi-6ac2e12eef893.jpg?format=avif"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                <span className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--secondary-color)]">
                  Competition
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--secondary-color)]"></span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Registration Open</span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  East Africa U20 Cup
                </h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">East Africa · U20</p>
                <Link href="/opportunities" className="mt-auto pt-6 text-left text-sm font-bold text-[var(--secondary-color)] underline-offset-4 hover:underline no-underline">
                  View Opportunity <i className="fa-solid fa-arrow-right ml-1 text-xs"></i>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/opportunities"
              className="btn h-12 rounded-full border border-[var(--border-color)] bg-transparent px-7 text-[var(--text-color)] hover:bg-[var(--surface-color)] no-underline inline-flex items-center justify-center font-bold"
            >
              View all opportunities
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
