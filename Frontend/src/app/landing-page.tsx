'use client';

import { useState } from 'react';
import { Link } from 'wouter';
import Image from '@/components/ui/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Zap,
  ShieldCheck,
  Search,
  TrendingUp,
  Target,
  Home,
  Users,
  Dumbbell,
  Trophy,
  Radar,
  ChevronRight,
  Star,
  MessageSquare,
  Building2,
  GitGraph,
  LayoutGrid,
  Headphones,
  Database,
  CalendarClock,
  LineChart,
  ShieldOff,
  FileText,
  User,
  Medal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PWAInstallButton, IOSInstallBanner } from '@/components/pwa-install-button';

// ── Role tabs data (preserved from existing landing-page.tsx) ──
const ROLE_FEATURES = [
  {
    id: 'athletes',
    label: 'Players',
    icon: Target,
    headline: 'Own your profile. Own your future.',
    description:
      'Build a verified, structured identity — no more highlight-reel hype. Track every season, milestone and attribute on one graph.',
    points: [
      { icon: ShieldCheck, text: 'Verified performance data, not selfies' },
      { icon: TrendingUp, text: 'Long-term tracking across seasons' },
      { icon: GitGraph, text: 'Your Talent Graph master index' },
      { icon: Users, text: 'Get discovered by clubs and scouts' },
    ],
  },
  {
    id: 'coaches',
    label: 'Coaches',
    icon: Dumbbell,
    headline: 'Coach the data, not the noise.',
    description:
      'Scope every athlete in your squad from one command center — match entry, training, analytics and messages in one place.',
    points: [
      { icon: Trophy, text: 'Live match entry & stats capture' },
      { icon: Dumbbell, text: 'Training & drill management' },
      { icon: TrendingUp, text: 'Performance analytics dashboards' },
      { icon: Users, text: 'Squad management & notifications' },
    ],
  },
  {
    id: 'scouts',
    label: 'Scouts & Clubs',
    icon: Search,
    headline: 'Find real talent, faster.',
    description:
      'Cut through the noise. Search verified athletes, compare with radar charts and track recruits through a full pipeline.',
    points: [
      { icon: Search, text: 'Powerful verified search & filters' },
      { icon: Radar, text: 'Compare athletes side-by-side' },
      { icon: Building2, text: 'Club & academy team tools' },
      { icon: MessageSquare, text: 'Direct messaging & invites' },
    ],
  },
];

// ── Platform pillars (6 cards) from existing landing-page.tsx ──
const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Verified Data',
    text: 'Every stat keeper and coach can vouch for the numbers. Trust is built into the graph.',
  },
  {
    icon: Radar,
    title: 'Attribute Radar',
    text: 'See technical, physical and mental attributes at a glance — one radar, ten dimensions.',
  },
  {
    icon: TrendingUp,
    title: 'Long-Term Tracking',
    text: 'One profile that grows with the athlete across every season and club.',
  },
  {
    icon: Trophy,
    title: 'Match Entry',
    text: 'Capture full match statistics in minutes with a guided, pro-grade wizard.',
  },
  {
    icon: Building2,
    title: 'Club Ecosystem',
    text: 'Coaches, squads, training and recruitment — the whole club on one graph.',
  },
  {
    icon: MessageSquare,
    title: 'Recruitment Pipeline',
    text: 'Invites, requests and messages that turn profiles into opportunities.',
  },
];

// ── How-it-works steps (existing STEPS) rendered with timeline visual from landingpages.tsx ──
const STEPS = [
  { step: '01', icon: Database, title: 'Create Account', text: 'Choose your role and secure your identity on the graph.' },
  { step: '02', icon: GitGraph, title: 'Build Profile', text: 'Add verified data sources and set your baseline attributes.' },
  { step: '03', icon: CalendarClock, title: 'Track & Improve', text: 'Log matches and training; watch your graph grow over time.' },
  { step: '04', icon: LineChart, title: 'Get Discovered', text: 'Scouts and clubs find talent they can genuinely trust.' },
];

// ── Challenge + Solution content from landingpages.tsx (visual design source) ──
const CHALLENGES = [
  {
    icon: ShieldOff,
    title: 'Unverifiable Data',
    text: 'Self-reported stats and highlight reels without context make it difficult to trust the data you see.',
  },
  {
    icon: Search,
    title: 'Signal vs. Noise',
    text: 'Social media hype and a flood of information bury the athletes who consistently put in the work.',
  },
  {
    icon: Zap,
    title: 'Short-Term Focus',
    text: 'The system rewards flashes of brilliance over long-term consistency, missing out on late bloomers and disciplined grinders.',
  },
];

const SOLUTIONS = [
  {
    icon: ShieldCheck,
    title: 'Verified Metrics',
    text: 'Integrate with trusted sources to provide verified performance data, creating a single source of truth.',
  },
  {
    icon: FileText,
    title: 'Structured Profiles',
    text: "Move beyond the highlight reel with comprehensive profiles that showcase an athlete's full journey.",
  },
  {
    icon: TrendingUp,
    title: 'Long-Term Tracking',
    text: 'Track progress over years, not just seasons, to identify trends and reward consistent improvement.',
  },
];

export function LandingPage() {
  const [activeRole, setActiveRole] = useState(ROLE_FEATURES[0].id);
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-image');
  const athleteImage = PlaceHolderImages.find((img) => img.id === 'athlete-persona');
  const scoutImage = PlaceHolderImages.find((img) => img.id === 'scout-persona');

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0E1A] text-white">
      <IOSInstallBanner />

      {/* ── Header preserved from existing landing-page.tsx (mobile-responsive, sticky, routing intact) ── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0E1A]/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00C853]">
              <Zap className="h-4 w-4 text-black" />
            </span>
            <span className="text-sm font-black uppercase tracking-widest">Talent Graph</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="text-white/70 hover:text-white">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild className="bg-[#00C853] font-black text-black hover:bg-[#00C853]/90">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-16 md:pb-0">
        {/* ── HERO — visual design from landingpages.tsx (hero image + overlay + colors) merged with existing headline/copy ── */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            {heroImage ? (
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                priority
                data-ai-hint={heroImage.imageHint}
                className="h-full w-full object-cover opacity-20"
              />
            ) : (
              <img
                src="https://files.cdn-files-a.com/uploads/12379368/1600_gi-6aa41e01ea1ee.jpg?format=avif"
                alt=""
                className="h-full w-full object-cover opacity-20"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A] via-[#0A0E1A]/80 to-transparent" />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-[#00C853]/20 blur-[120px]" />
            <div
              className="absolute inset-0 opacity-[0.15]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)',
                backgroundSize: '28px 28px',
              }}
            />
          </div>

          <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-16 text-center md:pb-24 md:pt-24">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00C853]/30 bg-[#00C853]/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#00C853]">
                The Talent Graph
              </span>
              <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Bridging the Gap Between <span className="text-[#00C853]">Raw Talent</span> &amp; Professional Sports
              </h1>
              {/* Content merged: landingpages tagline + existing longer description */}
              <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold uppercase tracking-widest text-white/50">
                Your Professional Identity in Sports
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
                The Talent Graph for athletes and scouts. Verified data, structured profiles, and long-term performance tracking — the digital infrastructure connecting emerging talent across East Africa and beyond with global scouts, clubs, and agencies.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button size="lg" asChild className="h-12 bg-[#00C853] px-6 font-black text-black hover:bg-[#00C853]/90">
                  <Link href="/signup">
                    Explore the Platform <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <PWAInstallButton
                  size="lg"
                  label="Get the App"
                  className="h-12 border border-[#00C853]/40 bg-white/5 px-6 text-white hover:bg-white/10"
                />
              </div>

              <div className="mx-auto mt-10 grid max-w-md grid-cols-3 gap-3 text-left">
                {[
                  { value: 'Verified', label: 'Data you can trust' },
                  { value: '1 Profile', label: 'Whole career graph' },
                  { value: '4 Roles', label: 'Athletes to clubs' },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                    <p className="text-sm font-black text-[#00C853]">{s.value}</p>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Challenge section — from landingpages.tsx (colors adapted to dark theme #0A0E1A / #00C853) ── */}
        <section className="border-t border-white/5 bg-white/[0.02] py-14 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00C853]">The problem</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">The Challenge in Talent Discovery</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/60 md:text-base">
                The current landscape is noisy, unverifiable, and focused on short-term wins. This makes true talent hard to find and harder to develop.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
              {CHALLENGES.map((c) => (
                <div
                  key={c.title}
                  className="rounded-2xl border border-white/5 bg-[#111827]/60 p-5 transition-colors hover:border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/80">
                      <c.icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-sm font-black uppercase tracking-wide">{c.title}</h3>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-white/55">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Solution section — from landingpages.tsx ── */}
        <section className="border-t border-white/5 py-14 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00C853]">The solution</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">The Solution: The Talent Graph</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/60 md:text-base">
                We&apos;re building a professional identity layer for sports, based on truth, structure, and a long-term perspective.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
              {SOLUTIONS.map((s) => (
                <div
                  key={s.title}
                  className="group rounded-2xl border border-white/5 bg-[#111827]/60 p-5 transition-colors hover:border-[#00C853]/30 hover:bg-[#111827]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00C853]/10 text-[#00C853]">
                      <s.icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-sm font-black uppercase tracking-wide">{s.title}</h3>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-white/55">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Platform Pillars — preserved from existing landing-page.tsx ── */}
        <section className="scroll-mt-16 border-t border-white/5 bg-white/[0.02] py-14 md:py-20" id="features">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-xl text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00C853]">
                Standardized tracking and verified data
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-tight">Platform Pillars</h2>
              <p className="mt-3 text-sm text-white/60">Standardized tracking, verified data, and equitable compensation models.</p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-white/5 bg-[#111827]/60 p-5 transition-colors hover:border-[#00C853]/30 hover:bg-[#111827]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00C853]/10 text-[#00C853]">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-black uppercase tracking-wide">{f.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/55">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works — timeline visual from landingpages.tsx + STEPS content from existing ── */}
        <section className="border-t border-white/5 py-14 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00C853]">How it works</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">How It Works</h2>
              <p className="mt-3 text-sm text-white/60">A clear path from creation to discovery.</p>
            </div>

            {/* Timeline (desktop) + stacked cards (mobile) — landingpages visual */}
            <div className="relative mx-auto mt-12 max-w-4xl">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10 md:left-1/2 md:-translate-x-1/2" />
              <div className="space-y-8 md:space-y-0">
                {STEPS.map((s, index) => (
                  <div key={s.step} className="relative flex items-start gap-6 md:items-center md:gap-0">
                    {/* Left / Right content alternating on md */}
                    <div
                      className={[
                        'flex flex-1 items-start gap-4 md:items-center md:gap-12',
                        index % 2 === 0 ? 'md:flex-row-reverse md:text-right' : '',
                      ].join(' ')}
                    >
                      <div className="hidden md:block md:w-1/2" />
                      <div className="flex flex-1 gap-4 md:contents">
                        <div className="hidden md:block">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00C853]/10 text-[#00C853]">
                            <s.icon className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="flex-1 md:w-1/2">
                          <div className="flex items-center gap-3 md:hidden">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00C853]/10 text-[#00C853]">
                              <s.icon className="h-4 w-4" />
                            </span>
                            <span className="text-[10px] font-black tracking-widest text-[#00C853]/70">{s.step}</span>
                          </div>
                          <span className="hidden text-[10px] font-black tracking-widest text-[#00C853]/70 md:inline">{s.step}</span>
                          <h3 className="mt-2 text-base font-black tracking-tight md:text-lg">{s.title}</h3>
                          <p className="mt-1 text-xs leading-relaxed text-white/55 md:text-sm">{s.text}</p>
                        </div>
                      </div>
                    </div>

                    {/* Center dot */}
                    <div className="absolute left-4 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-[#00C853] ring-8 ring-[#0A0E1A] md:static md:translate-x-0 md:mx-6">
                      <span className="h-2 w-2 rounded-full bg-black md:hidden" />
                      <span className="hidden h-2 w-2 rounded-full bg-black md:block" />
                    </div>

                    <div className="hidden md:block md:w-1/2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Fallback grid for visual parity with existing — hidden on md where timeline shown, shown as alternative on small */}
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:hidden">
              {STEPS.map((s) => (
                <div key={`grid-${s.step}`} className="rounded-2xl border border-white/5 bg-[#111827]/60 p-5">
                  <span className="text-[10px] font-black tracking-widest text-[#00C853]/70">{s.step}</span>
                  <s.icon className="mt-3 h-6 w-6 text-[#00C853]" />
                  <h3 className="mt-3 text-sm font-black uppercase tracking-wide">{s.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/55">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Roles tabs — preserved exactly from existing landing-page.tsx (mobile-responsive stateful tabs + RoleCardPreview) ── */}
        <section className="scroll-mt-16 border-t border-white/5 bg-white/[0.02] py-14 md:py-20" id="roles">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-xl text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00C853]">Who it&apos;s for</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">One graph, four roles</h2>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              {ROLE_FEATURES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setActiveRole(r.id)}
                  className={[
                    'flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-black uppercase tracking-wide transition-all',
                    activeRole === r.id
                      ? 'border-[#00C853]/50 bg-[#00C853]/10 text-[#00C853]'
                      : 'border-white/5 bg-white/[0.03] text-white/60 hover:bg-white/[0.06]',
                  ].join(' ')}
                >
                  <r.icon className="h-4 w-4" />
                  {r.label}
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-white/5 bg-gradient-to-br from-[#111827] to-[#0A0E1A] p-6 md:p-10">
              {ROLE_FEATURES.filter((r) => r.id === activeRole).map((r) => (
                <div key={r.id} className="grid gap-8 md:grid-cols-2 md:items-center">
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00C853]/10 text-[#00C853]">
                      <r.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-2xl font-black tracking-tight">{r.headline}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/60">{r.description}</p>
                    <ul className="mt-6 space-y-3">
                      {r.points.map((p) => (
                        <li key={p.text} className="flex items-start gap-3 text-sm">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00C853]/10 text-[#00C853]">
                            <p.icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-white/80">{p.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <RoleCardPreview role={r.id} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Persona sections — visual design + images + content from landingpages.tsx (For Athletes / For Scouts) ── */}
        <section className="border-t border-white/5 py-14 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
              <div className="flex flex-col items-start">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00C853]/10 text-[#00C853]">
                  <Target className="h-6 w-6" />
                </span>
                <h2 className="mt-4 text-3xl font-black tracking-tight">For Athletes</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  Take control of your narrative. Build a professional identity that reflects your hard work and dedication, and connect with opportunities that value consistency.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00C853]/10 text-[#00C853]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-white/80">Build credibility with a verified record of your achievements.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00C853]/10 text-[#00C853]">
                      <TrendingUp className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-white/80">Showcase your long-term growth and commitment.</span>
                  </li>
                </ul>
                <Button asChild className="mt-8 bg-[#00C853] font-black text-black hover:bg-[#00C853]/90">
                  <Link href="/signup">Build Your Profile</Link>
                </Button>
              </div>
              <div>
                {athleteImage ? (
                  <Image
                    src={athleteImage.imageUrl}
                    alt={athleteImage.description}
                    width={600}
                    height={400}
                    className="rounded-2xl border border-white/5 object-cover aspect-[3/2]"
                    data-ai-hint={athleteImage.imageHint}
                  />
                ) : (
                  <div className="aspect-[3/2] rounded-2xl bg-white/5" />
                )}
              </div>
            </div>

            <div className="mt-16 grid items-center gap-10 md:grid-cols-2 md:gap-16 md:mt-24">
              <div className="order-2 md:order-1">
                {scoutImage ? (
                  <Image
                    src={scoutImage.imageUrl}
                    alt={scoutImage.description}
                    width={600}
                    height={400}
                    className="rounded-2xl border border-white/5 object-cover aspect-[3/2]"
                    data-ai-hint={scoutImage.imageHint}
                  />
                ) : (
                  <div className="aspect-[3/2] rounded-2xl bg-white/5" />
                )}
              </div>
              <div className="order-1 flex flex-col items-start md:order-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00C853]/10 text-[#00C853]">
                  <Search className="h-6 w-6" />
                </span>
                <h2 className="mt-4 text-3xl font-black tracking-tight">For Scouts</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  Cut through the noise. Access a trusted network of athletes with structured, verifiable data to make faster, more informed talent decisions.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00C853]/10 text-[#00C853]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-white/80">Reduce risk with data you can trust.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00C853]/10 text-[#00C853]">
                      <Search className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-white/80">Discover overlooked talent with powerful search and filtering.</span>
                  </li>
                </ul>
                <Button asChild className="mt-8 bg-[#00C853] font-black text-black hover:bg-[#00C853]/90">
                  <Link href="/signup">Find Talent</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Philosophy — from landingpages.tsx ── */}
        <section className="border-t border-white/5 bg-white/[0.02] py-14 md:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00C853]">Our philosophy</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Our Philosophy: Long-Term Trust</h2>
            <p className="mt-6 text-sm leading-relaxed text-white/60">
              Talent Graph was born from a simple observation: the world of sports talent is driven by hype, not by data. As former athletes and long-time scouts, we grew frustrated with a system that values flashy highlights over proven consistency. We saw incredible talent get overlooked because they didn&apos;t fit a specific mold or have a viral video.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Our position is clear: we are not another social media platform for athletes. We are a professional identity layer for sports. We&apos;re building a stable, trustworthy ecosystem where discipline and consistency are the most valued assets. This isn&apos;t just a platform; it&apos;s a long-term commitment to the future of sports — one built on verifiable data and a deep respect for the athletic journey.
            </p>
            <Button size="lg" asChild className="mt-8 h-12 bg-[#00C853] px-7 font-black text-black hover:bg-[#00C853]/90">
              <Link href="/signup">Join The Movement</Link>
            </Button>
          </div>
        </section>

        {/* ── CTA — preserved from existing landing-page.tsx ── */}
        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="relative overflow-hidden rounded-3xl border border-[#00C853]/20 bg-gradient-to-br from-[#00C853]/15 via-[#111827] to-[#0A0E1A] p-8 text-center md:p-14">
              <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-[#00C853]/15 blur-[100px]" />
              <div className="relative">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00C853]">
                  <Zap className="h-6 w-6 text-black" />
                </span>
                <h2 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">Your graph is waiting.</h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-white/60">
                  Join the athletes, coaches, scouts and clubs building sport&apos;s professional identity layer.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button size="lg" asChild className="h-12 bg-[#00C853] px-7 font-black text-black hover:bg-[#00C853]/90">
                    <Link href="/signup">
                      <Star className="mr-2 h-4 w-4" />
                      Start Free
                    </Link>
                  </Button>
                  <PWAInstallButton
                    size="lg"
                    label="Install App"
                    className="h-12 border border-white/10 bg-white/5 px-7 text-white hover:bg-white/10"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer preserved from existing landing-page.tsx (dark #070912, routing intact) ── */}
      <footer className="border-t border-white/5 bg-[#070912]">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00C853]">
              <Zap className="h-3.5 w-3.5 text-black" />
            </span>
            <span className="text-sm font-black uppercase tracking-widest">Talent Graph</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/50">
            <Link href="/terms-of-use" className="hover:text-white">
              Terms
            </Link>
            <Link href="/privacy-policy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/help" className="hover:text-white">
              Help
            </Link>
            <Link href="/jobs" className="hover:text-white">
              Jobs
            </Link>
          </nav>
          <p className="text-xs text-white/35">© {new Date().getFullYear()} Talent Graph</p>
        </div>
      </footer>

      {/* ── Mobile bottom tab bar — My Dashboard → My Support (supporting.tsx → superadmin ClientSupportDashboard) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t border-white/10 bg-[#0A0E1A]/90 bottom-nav-safe backdrop-blur-md md:hidden">
        {[
          { label: 'Home', icon: Home, href: '/' },
          { label: 'Feeds', icon: LayoutGrid, href: '/feed' },
          { label: 'Athletes', icon: Users, href: '/athletes' },
          { label: 'Discovery', icon: Zap, href: '/scout-dashboard', highlight: true },
          { label: 'My Support', icon: Headphones, href: '/support' },
        ].map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            className={[
              'flex flex-1 flex-col items-center justify-center gap-1 transition-colors',
              tab.highlight ? 'text-[#00C853]' : 'text-white/60 hover:text-white',
            ].join(' ')}
          >
            <tab.icon className={['h-5 w-5', tab.highlight ? 'h-6 w-6' : ''].join(' ')} />
            <span className="text-[9px] font-black uppercase tracking-wide">{tab.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

/* ─────────────── Role card preview (preserved from existing) ─────────────── */

function RoleCardPreview({ role }: { role: string }) {
  const common =
    'mx-auto w-full max-w-[300px] rounded-3xl border border-white/10 bg-[#0F1524] p-3 shadow-2xl';

  if (role === 'coaches') {
    return (
      <div className={common}>
        <div className="rounded-2xl bg-[#0A0E1A] p-4">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-white/40">Squad Overview</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: 'Players', value: '24' },
              { label: 'Verified', value: '22' },
              { label: 'Avg CSI', value: '74' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5 text-center">
                <p className="text-sm font-black text-[#00C853]">{s.value}</p>
                <p className="text-[7px] font-bold uppercase tracking-widest text-white/40">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {['vs. Coast United — Won 3-1', 'Training: High-intensity drills'].map((row, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                {i === 0 ? <Trophy className="h-4 w-4 text-[#00C853]" /> : <Dumbbell className="h-4 w-4 text-[#00C853]" />}
                <p className="text-[10px] font-semibold text-white/80">{row}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (role === 'scouts') {
    return (
      <div className={common}>
        <div className="rounded-2xl bg-[#0A0E1A] p-4">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-white/40">Scout Search</p>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
            <Search className="h-4 w-4 text-[#00C853]" />
            <p className="text-[10px] font-semibold text-white/50">Search verified talent…</p>
          </div>
          <div className="mt-3 space-y-2">
            {[
              { name: 'Brian O.', pos: 'RW · 8.1', v: 8.1 },
              { name: 'Daniel K.', pos: 'CDM · 7.8', v: 7.8 },
              { name: 'Mark W.', pos: 'ST · 7.4', v: 7.4 },
            ].map((a) => (
              <div key={a.name} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                <div>
                  <p className="text-[10px] font-black text-white">{a.name}</p>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-white/40">{a.pos}</p>
                </div>
                <span className="rounded-lg bg-[#00C853]/10 px-2 py-1 text-[10px] font-black text-[#00C853]">{a.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={common}>
      <div className="rounded-2xl bg-[#0A0E1A] p-4">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-white/40">Profile Stats</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[
            { label: 'Goals', value: '31' },
            { label: 'Asst', value: '14' },
            { label: 'Apps', value: '84' },
            { label: 'Index', value: '8.4' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.03] p-2 text-center">
              <p className="text-sm font-black text-[#00C853]">{s.value}</p>
              <p className="text-[7px] font-bold uppercase tracking-widest text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {['2024/25 Season — Senior Team', 'Top scorer · Verified by Coach M.'].map((row, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
              {i === 0 ? <Trophy className="h-4 w-4 text-[#00C853]" /> : <ShieldCheck className="h-4 w-4 text-[#00C853]" />}
              <p className="text-[10px] font-semibold text-white/80">{row}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
