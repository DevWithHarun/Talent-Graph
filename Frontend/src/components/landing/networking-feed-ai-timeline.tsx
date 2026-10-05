'use client';

import React from 'react';
import { Link } from 'wouter';

export function LandingNetworkingFeedAiTimeline() {
  return (
    <>
      {/* ── NETWORKING & MESSAGING ── */}
      <section id="networking" className="relative overflow-hidden bg-[var(--surface-dark)] py-20 text-white sm:py-28">
        <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-[var(--secondary-color)]/20 blur-3xl"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="eyebrow eyebrow-light">Networking &amp; Messaging</span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
                The Right People Can Reach You.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[var(--text-light-muted)]">
                Athletes receive messages, respond to opportunities and set who can contact them. Coaches and scouts save, follow, contact and invite. Clubs send trial invites and manage recruitment conversations.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <i className="fa-solid fa-comments text-teal-300"></i>
                  <p className="mt-2.5 text-sm font-bold text-white">Direct messaging</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-light-muted)]">Athletes, coaches, scouts and clubs in one thread.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <i className="fa-solid fa-user-shield text-teal-300"></i>
                  <p className="mt-2.5 text-sm font-bold text-white">Contact permissions</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-light-muted)]">Athletes decide who can reach them.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <i className="fa-solid fa-clipboard-list text-teal-300"></i>
                  <p className="mt-2.5 text-sm font-bold text-white">Trial invites</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-light-muted)]">Clubs invite athletes directly.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <i className="fa-solid fa-handshake text-teal-300"></i>
                  <p className="mt-2.5 text-sm font-bold text-white">Recruitment chats</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-light-muted)]">Conversations stay tied to the workflow.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur sm:p-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15 text-sm font-bold text-teal-300">
                  CU
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Coastal United FC</p>
                  <p className="text-[11px] text-teal-300">Club · Verified organization</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.03] p-3.5">
                  <p className="text-[13px] leading-relaxed text-[var(--text-light-muted)]">
                    Your profile has been shortlisted for our U20 open trial. Please confirm your availability.
                  </p>
                  <p className="mt-2 text-[10px] text-white/30">3d ago</p>
                </div>
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-[var(--secondary-color)] p-3.5">
                  <p className="text-[13px] leading-relaxed text-white">
                    Thanks — I’m available from the 20th. Sending my verified match record now.
                  </p>
                  <p className="mt-2 text-[10px] text-white/60">2d ago</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <i className="fa-regular fa-comment-dots text-[var(--text-light-muted)]"></i>
                <span className="text-[13px] text-white/40">Write a reply…</span>
                <i className="fa-solid fa-paper-plane ml-auto text-teal-300"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPORTS FEED ── */}
      <section id="feed" className="bg-[var(--surface-color)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="eyebrow">Sports Feed</span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
                Stay Connected to the Game.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[var(--text-muted)]">
                News, match updates, athlete stories, club announcements, highlights, training content and opportunities. The feed is the engagement layer that keeps the ecosystem active.
              </p>
              <Link href="/feed" className="btn mt-9 h-12 rounded-full border-none bg-[var(--primary-color)] px-7 text-white hover:bg-[var(--primary-hover)] no-underline inline-flex items-center font-bold">
                Explore the Sports Feed
              </Link>
              <p className="mt-4 text-sm text-[var(--text-muted)]">
                The feed supports the ecosystem. It is not the core proposition — identity, evidence and opportunity are.
              </p>
            </div>

            <div className="max-w-md justify-self-center lg:max-w-none">
              <article className="ui-card overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-dark)] text-sm font-bold text-teal-400">
                    CU
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--text-color)]">Coastal United FC</p>
                    <p className="text-[11px] text-[var(--text-muted)]">2h ago · Club</p>
                  </div>
                </div>
                <p className="px-4 pb-4 text-sm leading-relaxed text-[var(--text-muted)]">
                  Squad announcement ahead of this weekend's league fixture. Three academy graduates step up to the senior team.
                </p>
                <div className="aspect-video border-y border-[var(--border-color)]">
                  <img
                    alt="Football squad training on the pitch"
                    className="h-full w-full object-cover"
                    src="https://files.cdn-files-a.com/uploads/12387247/800_gi-6ac2e12eef8b1.jpg?format=avif"
                  />
                </div>
                <div className="border-t border-[var(--border-color)] px-4 py-3">
                  <div className="flex items-center gap-6 text-[13px] font-semibold text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <i className="fa-regular fa-heart"></i>
                      Likes
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <i className="fa-regular fa-comment"></i>
                      Comment
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <i className="fa-solid fa-share-nodes"></i>
                      Share
                    </span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ── TALENT INTELLIGENCE (AI) ── */}
      <section id="ai" className="bg-[var(--background-color)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">Talent Intelligence</span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
              Talent Discovery Gets Smarter.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[var(--text-muted)]">
              Natural-language talent search, profile insights and matching — built on the evidence already in the system.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-3xl">
            <div className="ui-card p-4 sm:p-5">
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] px-4 py-3.5">
                <i className="fa-solid fa-wand-magic-sparkles text-[var(--secondary-color)]"></i>
                <span className="truncate text-sm text-[var(--text-muted)]">
                  Left-footed U18 midfielders with 1,000+ verified minutes
                </span>
                <Link href="/athletes" className="ml-auto shrink-0 rounded-lg bg-[var(--secondary-color)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white no-underline">
                  Search
                </Link>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border-color)] bg-white p-5">
                <i className="fa-solid fa-chart-simple text-lg text-[var(--secondary-color)]"></i>
                <h3 className="mt-3 text-base font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Profile insights
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">Completeness, trends and strengths.</p>
              </div>
              <div className="rounded-2xl border border-[var(--border-color)] bg-white p-5">
                <i className="fa-solid fa-scale-balanced text-lg text-[var(--secondary-color)]"></i>
                <h3 className="mt-3 text-base font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Talent matching
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">Fit against an opportunity or brief.</p>
              </div>
              <div className="rounded-2xl border border-[var(--border-color)] bg-white p-5">
                <i className="fa-solid fa-bullseye text-lg text-[var(--secondary-color)]"></i>
                <h3 className="mt-3 text-base font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Opportunity recommendations
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">Relevant trials, intake and programmes.</p>
              </div>
            </div>
            <p className="mt-6 text-center text-sm text-[var(--text-muted)] flex items-center justify-center">
              <i className="fa-solid fa-circle-info mr-1.5 text-[var(--secondary-color)]"></i>
              Only intelligence features that are operational are surfaced here.
            </p>
          </div>
        </div>
      </section>

      {/* ── DEVELOPMENT TIMELINE ── */}
      <section id="timeline" className="bg-[var(--surface-color)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">Development</span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
              Your Career Has a Story. Build the Record.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[var(--text-muted)]">
              A development timeline shows where an athlete is today — and how they got there.
            </p>
          </div>
          <div className="relative mt-14">
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-[var(--border-color)] lg:block"></div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
              <div className="relative flex items-start gap-4 lg:flex-col lg:items-center lg:text-center">
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-white text-[var(--secondary-color)] shadow-sm">
                  <i className="fa-solid fa-flag-checkered"></i>
                </div>
                <div>
                  <p className="text-sm font-extrabold text-[var(--secondary-color)]" style={{ fontFamily: 'var(--font-heading)' }}>2024</p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--text-color)]">Joined Academy</p>
                </div>
              </div>
              <div className="relative flex items-start gap-4 lg:flex-col lg:items-center lg:text-center">
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-white text-[var(--secondary-color)] shadow-sm">
                  <i className="fa-solid fa-trophy"></i>
                </div>
                <div>
                  <p className="text-sm font-extrabold text-[var(--secondary-color)]" style={{ fontFamily: 'var(--font-heading)' }}>2025</p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--text-color)]">First Competition</p>
                </div>
              </div>
              <div className="relative flex items-start gap-4 lg:flex-col lg:items-center lg:text-center">
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-white text-[var(--secondary-color)] shadow-sm">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <div>
                  <p className="text-sm font-extrabold text-[var(--secondary-color)]" style={{ fontFamily: 'var(--font-heading)' }}>2026</p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--text-color)]">Verified Performance</p>
                </div>
              </div>
              <div className="relative flex items-start gap-4 lg:flex-col lg:items-center lg:text-center">
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-white text-[var(--secondary-color)] shadow-sm">
                  <i className="fa-solid fa-clipboard-check"></i>
                </div>
                <div>
                  <p className="text-sm font-extrabold text-[var(--secondary-color)]" style={{ fontFamily: 'var(--font-heading)' }}>2027</p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--text-color)]">Club Trial</p>
                </div>
              </div>
              <div className="relative flex items-start gap-4 lg:flex-col lg:items-center lg:text-center">
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-white text-[var(--secondary-color)] shadow-sm">
                  <i className="fa-solid fa-briefcase"></i>
                </div>
                <div>
                  <p className="text-sm font-extrabold text-[var(--secondary-color)]" style={{ fontFamily: 'var(--font-heading)' }}>2028</p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--text-color)]">Professional Opportunity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
