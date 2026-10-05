'use client';

import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface LandingHeaderProps {
  onOpenAuth?: () => void;
}

export function Header(props: any) {
  return <LandingHeader onOpenAuth={() => {}} {...props} />;
}

export function LandingHeader({ onOpenAuth = () => {} }: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="site-header sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--background-color)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-20 lg:px-8">
          {/* Logo */}
          <Link href="#top" className="flex items-center gap-2.5 no-underline">
            <img
              src="/icons/logo-transparent.png"
              alt="Talent Graph Logo"
              className="h-9 w-9 object-contain rounded-xl bg-black p-0.5 shadow-sm shrink-0"
            />
            <span className="flex flex-col leading-none">
              <span className="text-base font-extrabold tracking-tight text-[var(--text-color)] sm:text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
                Talent Graph
              </span>
              <span className="mt-0.5 hidden text-[10px] font-medium text-[var(--text-muted)] sm:block">
                A Verve &amp; Vigor company
              </span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <a href="#athletes" className="nav-link">For Athletes</a>
            <a href="#scouts" className="nav-link">For Coaches &amp; Scouts</a>
            <a href="#clubs" className="nav-link">For Clubs &amp; Academies</a>
            <details className="dropdown">
              <summary className="nav-link cursor-pointer list-none">
                More <i className="fa-solid fa-chevron-down text-[10px] ml-1"></i>
              </summary>
              <ul className="menu dropdown-content z-[60] mt-2 w-56 rounded-2xl border border-[var(--border-color)] bg-[var(--background-color)] p-2 shadow-xl">
                <li>
                  <a href="#verification" className="rounded-xl font-semibold text-[var(--text-muted)]">Verification</a>
                </li>
                <li>
                  <Link href="/opportunities" className="rounded-xl font-semibold text-[var(--text-muted)]">Opportunities</Link>
                </li>
                <li>
                  <Link href="/feed" className="rounded-xl font-semibold text-[var(--text-muted)]">Sports Feed</Link>
                </li>
                <li>
                  <a href="#about" className="rounded-xl font-semibold text-[var(--text-muted)]">About</a>
                </li>
              </ul>
            </details>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden h-10 items-center rounded-full px-4 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-color)] hover:text-[var(--text-color)] sm:inline-flex cursor-pointer border-none bg-transparent no-underline"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="btn hidden h-10 rounded-full border-none bg-[var(--primary-color)] px-5 text-sm text-white hover:bg-[var(--primary-hover)] sm:inline-flex cursor-pointer no-underline items-center justify-center font-bold"
            >
              Join Talent Graph
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] text-[var(--text-color)] lg:hidden cursor-pointer bg-transparent"
              aria-label="Open menu"
            >
              <i className="fa-solid fa-bars text-lg"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu modal */}
      {mobileMenuOpen && (
        <dialog id="main_menu_modal" open className="modal modal-bottom sm:modal-middle bg-black/50 z-50">
          <div className="modal-box rounded-t-3xl bg-[var(--background-color)] p-0 sm:rounded-3xl max-w-lg">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-5">
              <div className="flex items-center gap-2.5">
                <img
                  src="/icons/logo-transparent.png"
                  alt="Talent Graph Logo"
                  className="h-9 w-9 object-contain rounded-xl bg-black p-0.5 shadow-sm shrink-0"
                />
                <span className="text-base font-extrabold tracking-tight text-[var(--text-color)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Talent Graph
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-sm btn-circle btn-ghost text-[var(--text-muted)]"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 font-semibold text-[var(--text-color)] hover:bg-[var(--surface-color)] no-underline"
              >
                How It Works <i className="fa-solid fa-chevron-right text-xs text-[var(--text-muted)]"></i>
              </a>
              <a
                href="#athletes"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 font-semibold text-[var(--text-color)] hover:bg-[var(--surface-color)] no-underline"
              >
                For Athletes <i className="fa-solid fa-chevron-right text-xs text-[var(--text-muted)]"></i>
              </a>
              <a
                href="#scouts"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 font-semibold text-[var(--text-color)] hover:bg-[var(--surface-color)] no-underline"
              >
                For Coaches &amp; Scouts <i className="fa-solid fa-chevron-right text-xs text-[var(--text-muted)]"></i>
              </a>
              <a
                href="#clubs"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 font-semibold text-[var(--text-color)] hover:bg-[var(--surface-color)] no-underline"
              >
                For Clubs &amp; Academies <i className="fa-solid fa-chevron-right text-xs text-[var(--text-muted)]"></i>
              </a>
              <a
                href="#verification"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 font-semibold text-[var(--text-color)] hover:bg-[var(--surface-color)] no-underline"
              >
                Verification <i className="fa-solid fa-chevron-right text-xs text-[var(--text-muted)]"></i>
              </a>
              <Link
                href="/opportunities"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 font-semibold text-[var(--text-color)] hover:bg-[var(--surface-color)] no-underline"
              >
                Opportunities <i className="fa-solid fa-chevron-right text-xs text-[var(--text-muted)]"></i>
              </Link>
              <Link
                href="/feed"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 font-semibold text-[var(--text-color)] hover:bg-[var(--surface-color)] no-underline"
              >
                Sports Feed <i className="fa-solid fa-chevron-right text-xs text-[var(--text-muted)]"></i>
              </Link>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 font-semibold text-[var(--text-color)] hover:bg-[var(--surface-color)] no-underline"
              >
                About <i className="fa-solid fa-chevron-right text-xs text-[var(--text-muted)]"></i>
              </a>
              <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border-color)] pt-4">
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn h-12 rounded-full border-none bg-[var(--primary-color)] text-white hover:bg-[var(--primary-hover)] cursor-pointer no-underline flex items-center justify-center font-bold"
                >
                  Join Talent Graph
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn h-12 rounded-full border border-[var(--border-color)] bg-transparent text-[var(--text-color)] hover:bg-[var(--surface-color)] cursor-pointer no-underline flex items-center justify-center font-bold"
                >
                  Log In
                </Link>
              </div>
            </nav>
          </div>
        </dialog>
      )}
    </>
  );
}
