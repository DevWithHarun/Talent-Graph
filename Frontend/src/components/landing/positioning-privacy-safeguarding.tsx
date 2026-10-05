'use client';

import React from 'react';

export function LandingPositioningPrivacySafeguarding() {
  return (
    <>
      {/* ── NOT SOCIAL MEDIA (POSITIONING) ── */}
      <section id="not-social" className="bg-[var(--background-color)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">Positioning</span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
              More Than a Social Profile.
            </h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--surface-color)] p-6">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Social media</h3>
              <ul className="mt-5 space-y-3">
                <li className="flex items-center gap-3 text-[15px] text-[var(--text-muted)]">
                  <i className="fa-solid fa-minus text-xs text-[var(--text-muted)]/50"></i>
                  Followers
                </li>
                <li className="flex items-center gap-3 text-[15px] text-[var(--text-muted)]">
                  <i className="fa-solid fa-minus text-xs text-[var(--text-muted)]/50"></i>
                  Likes
                </li>
                <li className="flex items-center gap-3 text-[15px] text-[var(--text-muted)]">
                  <i className="fa-solid fa-minus text-xs text-[var(--text-muted)]/50"></i>
                  Views
                </li>
                <li className="flex items-center gap-3 text-[15px] text-[var(--text-muted)]">
                  <i className="fa-solid fa-minus text-xs text-[var(--text-muted)]/50"></i>
                  Virality
                </li>
                <li className="flex items-center gap-3 text-[15px] text-[var(--text-muted)]">
                  <i className="fa-solid fa-minus text-xs text-[var(--text-muted)]/50"></i>
                  Popularity
                </li>
              </ul>
            </div>
            <div className="rounded-3xl border border-[var(--secondary-color)]/30 bg-white p-6 shadow-md">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--secondary-color)]">Talent Graph</h3>
              <ul className="mt-5 space-y-3">
                <li className="flex items-center gap-3 text-[15px] font-semibold text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check text-[var(--secondary-color)]"></i>
                  Identity
                </li>
                <li className="flex items-center gap-3 text-[15px] font-semibold text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check text-[var(--secondary-color)]"></i>
                  Verification
                </li>
                <li className="flex items-center gap-3 text-[15px] font-semibold text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check text-[var(--secondary-color)]"></i>
                  Evidence
                </li>
                <li className="flex items-center gap-3 text-[15px] font-semibold text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check text-[var(--secondary-color)]"></i>
                  Performance
                </li>
                <li className="flex items-center gap-3 text-[15px] font-semibold text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check text-[var(--secondary-color)]"></i>
                  Development
                </li>
                <li className="flex items-center gap-3 text-[15px] font-semibold text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check text-[var(--secondary-color)]"></i>
                  Match history
                </li>
                <li className="flex items-center gap-3 text-[15px] font-semibold text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check text-[var(--secondary-color)]"></i>
                  Discovery
                </li>
                <li className="flex items-center gap-3 text-[15px] font-semibold text-[var(--text-color)]">
                  <i className="fa-solid fa-circle-check text-[var(--secondary-color)]"></i>
                  Opportunities
                </li>
              </ul>
            </div>
          </div>
          <p className="mx-auto mt-12 max-w-3xl text-center text-lg font-semibold leading-relaxed text-[var(--text-color)] sm:text-xl" style={{ fontFamily: 'var(--font-heading)' }}>
            Social media shows attention. Talent Graph builds professional sporting evidence.
          </p>
        </div>
      </section>

      {/* ── PRIVACY & CONSENT ── */}
      <section id="privacy" className="bg-[var(--surface-color)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="eyebrow">Privacy &amp; Consent</span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
                Your Data. Your Permission. Your Career.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[var(--text-muted)]">
                Athletes control who sees what — from profile and performance visibility to contact permissions and recruiter access.
              </p>
              <a href="#privacy" className="btn mt-8 h-12 rounded-full border border-[var(--border-color)] bg-transparent px-7 text-[var(--text-color)] hover:bg-white no-underline inline-flex items-center font-bold">
                Read the Privacy Policy
              </a>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border-color)] bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--secondary-color)]/10 text-[var(--secondary-color)]">
                  <i className="fa-solid fa-eye"></i>
                </div>
                <h3 className="mt-4 text-base font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Profile visibility
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">Choose what is public and what stays private.</p>
              </div>
              <div className="rounded-2xl border border-[var(--border-color)] bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--secondary-color)]/10 text-[var(--secondary-color)]">
                  <i className="fa-solid fa-chart-line"></i>
                </div>
                <h3 className="mt-4 text-base font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Performance visibility
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">Decide who can see your performance record.</p>
              </div>
              <div className="rounded-2xl border border-[var(--border-color)] bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--secondary-color)]/10 text-[var(--secondary-color)]">
                  <i className="fa-solid fa-user-lock"></i>
                </div>
                <h3 className="mt-4 text-base font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Contact permissions
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">Set who is allowed to contact you.</p>
              </div>
              <div className="rounded-2xl border border-[var(--border-color)] bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--secondary-color)]/10 text-[var(--secondary-color)]">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <h3 className="mt-4 text-base font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Recruiter access
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">Organizations get role-based and org-level controls.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SAFEGUARDING ── */}
      <section id="safeguarding" className="bg-[var(--background-color)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">Safeguarding</span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
              Protecting Every Athlete.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[var(--text-muted)]">
              Talent Graph is built for athletes of all ages, with safeguards that scale from grassroots to professional environments.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-color)] bg-white p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary-color)]/10 text-[var(--secondary-color)]">
                <i className="fa-solid fa-child-reaching"></i>
              </div>
              <span className="text-sm font-semibold text-[var(--text-color)]">Age-appropriate experiences</span>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-color)] bg-white p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary-color)]/10 text-[var(--secondary-color)]">
                <i className="fa-solid fa-people-roof"></i>
              </div>
              <span className="text-sm font-semibold text-[var(--text-color)]">Guardian consent</span>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-color)] bg-white p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary-color)]/10 text-[var(--secondary-color)]">
                <i className="fa-solid fa-comment-slash"></i>
              </div>
              <span className="text-sm font-semibold text-[var(--text-color)]">Communication controls</span>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-color)] bg-white p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary-color)]/10 text-[var(--secondary-color)]">
                <i className="fa-solid fa-flag"></i>
              </div>
              <span className="text-sm font-semibold text-[var(--text-color)]">Reporting and escalation</span>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-color)] bg-white p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary-color)]/10 text-[var(--secondary-color)]">
                <i className="fa-solid fa-hand"></i>
              </div>
              <span className="text-sm font-semibold text-[var(--text-color)]">Anti-harassment rules</span>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-color)] bg-white p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary-color)]/10 text-[var(--secondary-color)]">
                <i className="fa-solid fa-lock"></i>
              </div>
              <span className="text-sm font-semibold text-[var(--text-color)]">Anti-exploitation rules</span>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href="#safeguarding" className="chip hover:border-[var(--secondary-color)] hover:text-[var(--secondary-color)]">
              <i className="fa-solid fa-shield-halved"></i>
              Safeguarding Policy
            </a>
            <a href="#contact" className="chip hover:border-[var(--secondary-color)] hover:text-[var(--secondary-color)]">
              <i className="fa-solid fa-flag"></i>
              Report a Concern
            </a>
            <a href="#safeguarding" className="chip hover:border-[var(--secondary-color)] hover:text-[var(--secondary-color)]">
              <i className="fa-solid fa-users"></i>
              Community Guidelines
            </a>
            <a href="#privacy" className="chip hover:border-[var(--secondary-color)] hover:text-[var(--secondary-color)]">
              <i className="fa-solid fa-user-shield"></i>
              Privacy Policy
            </a>
          </div>
        </div>
      </section>

      {/* ── PARTNERS ── */}
      <section id="partners" className="bg-[var(--surface-color)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">Partners</span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
              Built With the Ecosystem.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[var(--text-muted)]">
              Talent Graph is developed alongside organizations across the Verve &amp; Vigor ecosystem.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex h-full flex-col rounded-2xl border border-[var(--border-color)] bg-white p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-dark)] text-lg font-extrabold text-teal-400" style={{ fontFamily: 'var(--font-heading)' }}>
                C
              </div>
              <h3 className="mt-5 text-base font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>Course</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">Partner in the Talent Graph ecosystem.</p>
              <p className="mt-auto pt-4 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]/70">Official website coming soon</p>
            </div>
            <div className="flex h-full flex-col rounded-2xl border border-[var(--border-color)] bg-white p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-dark)] text-lg font-extrabold text-teal-400" style={{ fontFamily: 'var(--font-heading)' }}>
                O
              </div>
              <h3 className="mt-5 text-base font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>Outlier</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">Partner in the Talent Graph ecosystem.</p>
              <p className="mt-auto pt-4 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]/70">Official website coming soon</p>
            </div>
            <div className="flex h-full flex-col rounded-2xl border border-[var(--border-color)] bg-white p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-dark)] text-lg font-extrabold text-teal-400" style={{ fontFamily: 'var(--font-heading)' }}>
                W
              </div>
              <h3 className="mt-5 text-base font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>WeAreArchangel</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">Partner in the Talent Graph ecosystem.</p>
              <p className="mt-auto pt-4 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]/70">Official website coming soon</p>
            </div>
            <div className="flex h-full flex-col rounded-2xl border border-[var(--border-color)] bg-white p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-dark)] text-lg font-extrabold text-teal-400" style={{ fontFamily: 'var(--font-heading)' }}>
                H
              </div>
              <h3 className="mt-5 text-base font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>Handcrafted Technologies</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">Partner in the Talent Graph ecosystem.</p>
              <p className="mt-auto pt-4 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]/70">Official website coming soon</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
