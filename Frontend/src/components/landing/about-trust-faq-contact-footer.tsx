'use client';

import React, { useState } from 'react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';

interface LandingAboutTrustFaqContactFooterProps {
  onOpenAuth: () => void;
}

export function LandingAboutTrustFaqContactFooter({ onOpenAuth }: LandingAboutTrustFaqContactFooterProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('General');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setIsSending(true);
    try {
      if (firestore) {
        await addDoc(collection(firestore, 'support_tickets'), {
          name,
          email,
          reason,
          message,
          subject: `Enquiry from ${name} (${reason})`,
          status: 'open',
          createdAt: new Date().toISOString(),
        });
      }
      setStatusMessage({ type: 'success', text: 'Thank you! Your message has been sent successfully.' });
      toast({ title: 'Message Sent', description: 'Our team will get back to you shortly.' });
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setStatusMessage({ type: 'success', text: 'Message received. We will be in touch shortly.' });
      toast({ title: 'Message Sent' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* ── ABOUT ── */}
      <section id="about" className="bg-[var(--background-color)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">About</span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
              Built to Make Athletic Potential More Visible.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-[var(--text-muted)]">
              Talent Graph sits within the Verve &amp; Vigor ecosystem, which builds technology around human performance, development, lifestyle and opportunity — applied here to sport.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-[var(--text-muted)]">
              One-line proposition: Talent Graph is the professional infrastructure for athletic talent — helping athletes build verified sporting identities, coaches and scouts discover credible talent, and clubs and academies manage, develop and connect with athletes.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="overflow-hidden rounded-3xl border border-[var(--border-color)]">
              <img
                alt="Young athletes training together as a team"
                className="h-full w-full object-cover"
                src="https://files.cdn-files-a.com/uploads/12387247/800_gi-6ac2e12eef8bd.jpg?format=avif"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] p-5">
                <p className="text-2xl font-extrabold leading-none text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>6</p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Verification layers</p>
              </div>
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] p-5">
                <p className="text-2xl font-extrabold leading-none text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>8</p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Opportunity types</p>
              </div>
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] p-5">
                <p className="text-2xl font-extrabold leading-none text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>30+</p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Clubs onboard</p>
              </div>
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] p-5">
                <p className="text-2xl font-extrabold leading-none text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>170+</p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Athletes onboard</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST & REGISTRATION ── */}
      <section id="trust" className="bg-[var(--surface-color)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-[var(--border-color)] bg-white p-7 lg:col-span-2">
              <span className="eyebrow">Trust &amp; Registration</span>
              <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-3xl" style={{ fontFamily: 'var(--font-heading)' }}>
                Built with privacy, trust and responsible data practices in mind.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-muted)]">
                Talent Graph is registered for data protection. Registration number and certificate are published once the registering authority name has been verified.
              </p>
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] px-4 py-3.5">
                  <span className="text-sm font-semibold text-[var(--text-color)]">KDP registration</span>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[var(--secondary-color)]">
                    <i className="fa-solid fa-circle-check"></i>
                    Registered
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] px-4 py-3.5">
                  <span className="text-sm font-semibold text-[var(--text-color)]">Registration number</span>
                  <span className="text-[13px] font-medium text-[var(--text-muted)]">To be published</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] px-4 py-3.5">
                  <span className="text-sm font-semibold text-[var(--text-color)]">Certificate</span>
                  <span className="text-[13px] font-medium text-[var(--text-muted)]">To be published</span>
                </div>
              </div>
            </div>

            <div id="insurance" className="rounded-3xl border border-[var(--secondary-color)]/25 bg-white p-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--secondary-color)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--secondary-color)]">
                Coming Soon
              </span>
              <h3 className="mt-5 text-xl font-bold text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>
                More protection for athletes is coming.
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-muted)]">
                We are exploring insurance solutions designed around the needs of athletes and sporting communities.
              </p>
              <a href="#contact" className="btn mt-6 h-12 w-full rounded-full border-none bg-[var(--secondary-color)] text-white hover:bg-[var(--secondary-hover)] no-underline inline-flex items-center justify-center font-bold">
                Stay Updated
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-[var(--background-color)] py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="eyebrow">FAQ</span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
              Questions, Answered.
            </h2>
          </div>
          <div className="mt-12 space-y-3">
            {[
              {
                q: 'What is Talent Graph?',
                a: 'Talent Graph is the professional infrastructure for athletic talent — athletes build verified sporting identities, coaches and scouts discover credible talent, and clubs and academies manage, develop and connect with athletes.',
              },
              {
                q: 'Who is it for?',
                a: 'Athletes, coaches, scouts, clubs, academies and organizations across the sporting ecosystem.',
              },
              {
                q: 'Is it only for professional athletes?',
                a: 'No. Talent Graph supports every development stage, from grassroots and academy players through to professional athletes.',
              },
              {
                q: 'How does verification work?',
                a: 'Verification combines identity checks, coach and club confirmation, and match, training and video evidence, so a profile is backed by evidence rather than claims.',
              },
              {
                q: 'Can clubs create accounts?',
                a: 'Yes. Clubs and academies can register an organization, manage athletes and coaches with permissions, and run recruitment from one place.',
              },
              {
                q: 'Can scouts contact athletes?',
                a: 'Yes — subject to each athlete’s privacy and contact settings.',
              },
              {
                q: 'Can athletes control visibility?',
                a: 'Yes, where supported. Athletes control profile and performance visibility, contact permissions and recruiter access.',
              },
              {
                q: 'What is the sports feed?',
                a: 'The sports feed carries news, match updates, athlete stories, club announcements, highlights, training content and opportunities. It is the engagement layer around the core platform.',
              },
              {
                q: 'How does match tracking work?',
                a: 'Where connected match-data sources support it, match metrics and events flow directly into the athlete record. Available metrics depend on the providers connected to each competition.',
              },
              {
                q: 'Is it free?',
                a: 'Pricing details are being finalised and will be published here once confirmed.',
              },
              {
                q: 'Which sports?',
                a: 'The sports supported on launch are being confirmed and will be published here once finalised.',
              },
            ].map((faq, i) => (
              <details key={i} className="faq-item group rounded-2xl border border-[var(--border-color)] bg-white">
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none">
                  <span className="text-[15px] font-semibold text-[var(--text-color)]">{faq.q}</span>
                  <i className="fa-solid fa-chevron-down faq-chevron text-sm text-[var(--text-muted)]"></i>
                </summary>
                <div className="border-t border-[var(--border-color)] px-5 py-4">
                  <p className="text-[14px] leading-relaxed text-[var(--text-muted)]">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section id="final-cta" className="relative overflow-hidden bg-[var(--surface-dark)] py-20 text-white sm:py-28">
        <img
          alt="Athlete celebrating on the pitch"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          src="https://files.cdn-files-a.com/uploads/12387247/800_gi-6ac2e12eef8cc.jpg?format=avif"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--surface-dark)]/85 via-[var(--surface-dark)]/92 to-[var(--surface-dark)]" aria-hidden="true"></div>
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-[var(--glow-color)]/25 blur-[120px]"></div>
          <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-[var(--accent-color)]/20 blur-[120px]"></div>
        </div>
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <span className="badge-pill">
            <i className="fa-solid fa-bolt"></i>
            Start today
          </span>
          <h2 className="mt-6 text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-heading)' }}>
            Make Your Talent Impossible to Overlook.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[var(--text-light-muted)]">
            Build your professional athletic identity, prove your progress, connect with the right people, and discover your next opportunity.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/signup"
              className="btn h-14 rounded-full border-none bg-[var(--secondary-color)] px-8 text-base text-white shadow-[var(--shadow-glow)] transition-transform duration-300 hover:-translate-y-0.5 hover:bg-[var(--secondary-hover)] cursor-pointer font-bold no-underline inline-flex items-center justify-center"
            >
              Build Your Athlete Profile
            </Link>
            <Link
              href="/athletes"
              className="btn h-14 rounded-full border border-white/15 bg-white/5 px-8 text-base text-white backdrop-blur transition-colors hover:bg-white/10 no-underline inline-flex items-center justify-center font-bold"
            >
              Discover Talent
            </Link>
            <Link
              href="/signup"
              className="btn h-14 rounded-full border border-white/15 bg-white/5 px-8 text-base text-white backdrop-blur transition-colors hover:bg-white/10 cursor-pointer font-bold no-underline inline-flex items-center justify-center"
            >
              Register Your Organization
            </Link>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="bg-[var(--background-color)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-14 lg:flex-row lg:gap-16">
            <div className="w-full lg:w-1/3">
              <span className="eyebrow">Contact</span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--text-color)] sm:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
                Let's Build the Future of Sports Talent.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[var(--text-muted)]">
                Get in touch with the Talent Graph team — whether you're an athlete, a scout, a club, or a partner.
              </p>
              <div className="mt-9 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-color)] text-[var(--secondary-color)]">
                    <i className="fa-solid fa-briefcase"></i>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      General — partnerships, media, business
                    </p>
                    <a href="mailto:info@talentgraph.vervevigor.africa" className="text-[15px] font-semibold text-[var(--text-color)] transition-colors hover:text-[var(--secondary-color)] no-underline">
                      info@talentgraph.vervevigor.africa
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-color)] text-[var(--secondary-color)]">
                    <i className="fa-solid fa-headset"></i>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Support — accounts, verification, privacy, technical
                    </p>
                    <a href="mailto:support@talentgraph.vervevigor.africa" className="text-[15px] font-semibold text-[var(--text-color)] transition-colors hover:text-[var(--secondary-color)] no-underline">
                      support@talentgraph.vervevigor.africa
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-color)] text-[var(--secondary-color)]">
                    <i className="fa-solid fa-phone"></i>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Phone &amp; WhatsApp</p>
                    <a href="tel:+254727946012" className="text-[15px] font-semibold text-[var(--text-color)] transition-colors hover:text-[var(--secondary-color)] no-underline">
                      +254 727 946 012
                    </a>
                  </div>
                </div>
              </div>
              <Link href="/support" className="btn mt-8 h-11 rounded-full border border-[var(--border-color)] bg-transparent px-6 text-sm text-[var(--text-color)] hover:bg-[var(--surface-color)] no-underline inline-flex items-center">
                <i className="fa-solid fa-circle-question mr-2"></i>
                Visit Support Center
              </Link>
            </div>

            <div className="w-full rounded-3xl border border-[var(--border-color)] bg-[var(--surface-color)] p-6 sm:p-10 lg:w-2/3">
              <form onSubmit={handleContactSubmit} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <fieldset className="fieldset w-full">
                    <label className="fieldset-label font-medium text-[var(--text-color)] mb-1">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input w-full border-[var(--border-color)] bg-white focus:border-[var(--secondary-color)] rounded-xl"
                      placeholder="Your name"
                      required
                    />
                  </fieldset>
                  <fieldset className="fieldset w-full">
                    <label className="fieldset-label font-medium text-[var(--text-color)] mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input w-full border-[var(--border-color)] bg-white focus:border-[var(--secondary-color)] rounded-xl"
                      placeholder="your@email.com"
                      required
                    />
                  </fieldset>
                </div>
                <fieldset className="fieldset w-full">
                  <label className="fieldset-label font-medium text-[var(--text-color)] mb-1">I'm reaching out as</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="select w-full border-[var(--border-color)] bg-white focus:border-[var(--secondary-color)] rounded-xl"
                  >
                    <option value="General">General enquiry</option>
                    <option value="Athlete">Athlete</option>
                    <option value="Coach / Scout">Coach / Scout</option>
                    <option value="Club / Academy">Club / Academy</option>
                    <option value="Partnership">Partnership</option>
                  </select>
                </fieldset>
                <fieldset className="fieldset w-full">
                  <label className="fieldset-label font-medium text-[var(--text-color)] mb-1">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="textarea w-full resize-none border-[var(--border-color)] bg-white focus:border-[var(--secondary-color)] rounded-xl"
                    placeholder="How can we help you?"
                    required
                  ></textarea>
                </fieldset>

                {statusMessage && (
                  <div className={`rounded-xl p-4 text-sm font-medium ${
                    statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800'
                  }`}>
                    {statusMessage.text}
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="btn h-12 rounded-full border-none bg-[var(--primary-color)] px-10 text-white hover:bg-[var(--primary-hover)] cursor-pointer font-bold"
                  >
                    {isSending ? 'Sending Message...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[var(--surface-dark)] pb-16 text-[var(--text-light-muted)] md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 border-b border-[var(--border-dark)] pb-10 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-md">
              <div className="flex items-center gap-2.5">
                <img
                  src="/icons/logo-transparent.png"
                  alt="Talent Graph Logo"
                  className="h-9 w-9 object-contain rounded-xl bg-white/10 p-0.5 shrink-0"
                />
                <span className="text-lg font-extrabold tracking-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  TALENT GRAPH
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[var(--text-light-muted)]">
                Where Athletic Talent Becomes Visible. A Verve &amp; Vigor company.
              </p>
              <div className="mt-5 space-y-2 text-sm">
                <a href="mailto:info@talentgraph.vervevigor.africa" className="flex items-center gap-2.5 text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">
                  <i className="fa-regular fa-envelope text-teal-400"></i>
                  info@talentgraph.vervevigor.africa
                </a>
                <a href="mailto:support@talentgraph.vervevigor.africa" className="flex items-center gap-2.5 text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">
                  <i className="fa-solid fa-headset text-teal-400"></i>
                  support@talentgraph.vervevigor.africa
                </a>
                <a href="tel:+254727946012" className="flex items-center gap-2.5 text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">
                  <i className="fa-solid fa-phone text-teal-400"></i>
                  +254 727 946 012
                </a>
              </div>
            </div>
            <Link href="/support" className="inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-full border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10 no-underline">
              <i className="fa-solid fa-circle-question"></i>
              Visit Support Center
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 py-10 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">Product</h3>
              <ul className="mt-4 space-y-2.5 list-none p-0">
                <li><a href="#athletes" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Athlete Profiles</a></li>
                <li><a href="#verification" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Verification</a></li>
                <li><a href="#match-data" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Match Data</a></li>
                <li><Link href="/opportunities" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Opportunities</Link></li>
                <li><a href="#clubs" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Club Management</a></li>
                <li><Link href="/feed" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Sports Feed</Link></li>
                <li><a href="#insurance" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Insurance (Coming Soon)</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">For</h3>
              <ul className="mt-4 space-y-2.5 list-none p-0">
                <li><a href="#athletes" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Athletes</a></li>
                <li><a href="#scouts" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Coaches &amp; Scouts</a></li>
                <li><a href="#clubs" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Clubs &amp; Academies</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">Company</h3>
              <ul className="mt-4 space-y-2.5 list-none p-0">
                <li><a href="#about" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">About</a></li>
                <li><a href="#partners" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Partners</a></li>
                <li><a href="#contact" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Contact</a></li>
                <li><a href="#contact" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">Support</h3>
              <ul className="mt-4 space-y-2.5 list-none p-0">
                <li><Link href="/support" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Help Center</Link></li>
                <li><Link href="/support" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Report a Problem</Link></li>
                <li><a href="#safeguarding" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Safeguarding</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">Legal</h3>
              <ul className="mt-4 space-y-2.5 list-none p-0">
                <li><a href="#trust" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Terms</a></li>
                <li><a href="#privacy" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Privacy</a></li>
                <li><a href="#privacy" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Data Protection</a></li>
                <li><a href="#privacy" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Cookies</a></li>
                <li><a href="#safeguarding" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Community Guidelines</a></li>
                <li><a href="#safeguarding" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Safeguarding Policy</a></li>
                <li><a href="#safeguarding" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Acceptable Use</a></li>
                <li><a href="#contact" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline">Complaints</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">Connect</h3>
              <ul className="mt-4 space-y-2.5 list-none p-0">
                <li>
                  <a href="https://www.instagram.com/_verve_vigor?utm_source=qr&stkn=MXFsbzhhdHQyd3RnZQ==" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline flex items-center gap-2">
                    <i className="fa-brands fa-instagram text-pink-500 w-4 text-center"></i> Instagram — @_verve_vigor
                  </a>
                </li>
                <li>
                  <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline flex items-center gap-2">
                    <i className="fa-brands fa-facebook text-blue-500 w-4 text-center"></i> Facebook — Verve &amp; Vigor
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline flex items-center gap-2">
                    <i className="fa-brands fa-youtube text-red-500 w-4 text-center"></i> YouTube — Talent Graph
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline flex items-center gap-2">
                    <i className="fa-brands fa-linkedin text-sky-500 w-4 text-center"></i> LinkedIn — Verve &amp; Vigor
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-sm text-[var(--text-light-muted)] transition-colors hover:text-white no-underline flex items-center gap-2">
                    <i className="fa-brands fa-tiktok text-white w-4 text-center"></i> TikTok — @talentgraph
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--border-dark)] pt-8 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; 2026 Verve &amp; Vigor. All rights reserved.</p>
            <p className="text-white/50">Where Athletic Talent Becomes Visible.</p>
          </div>
        </div>
      </footer>

      {/* ── MOBILE BOTTOM NAVIGATION ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around border-t border-[var(--border-color)] bg-[var(--background-color)] shadow-[0_-6px_14px_-6px_rgba(11,18,32,0.15)] md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <a href="#top" className="flex min-h-[4.25rem] w-full flex-col items-center justify-center gap-1 text-[var(--secondary-color)] no-underline">
          <i className="fa-solid fa-house text-base"></i>
          <span className="text-[9px] font-bold uppercase tracking-tight">Home</span>
        </a>
        <Link href="/feed" className="flex min-h-[4.25rem] w-full flex-col items-center justify-center gap-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-color)] no-underline">
          <i className="fa-solid fa-newspaper text-base"></i>
          <span className="text-[9px] font-bold uppercase tracking-tight">Feed</span>
        </Link>
        <Link href="/athletes" className="flex min-h-[4.25rem] w-full flex-col items-center justify-center gap-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-color)] no-underline">
          <i className="fa-solid fa-person-running text-base"></i>
          <span className="text-[9px] font-bold uppercase tracking-tight">Athletes</span>
        </Link>
        <a href="#scouts" className="flex min-h-[4.25rem] w-full flex-col items-center justify-center gap-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-color)] no-underline">
          <i className="fa-solid fa-compass text-base"></i>
          <span className="text-[9px] font-bold uppercase tracking-tight">Discovery</span>
        </a>
        <Link href="/support" className="flex min-h-[4.25rem] w-full flex-col items-center justify-center gap-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-color)] no-underline">
          <i className="fa-solid fa-headset text-base"></i>
          <span className="text-[9px] font-bold uppercase tracking-tight">Support</span>
        </Link>
      </nav>
    </>
  );
}
