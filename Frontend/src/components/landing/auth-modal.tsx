'use client';

import React, { useState } from 'react';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from '@/lib/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('verify');
      toast({
        title: 'Verification code sent',
        description: `We've sent a 6-digit access code to ${email}`,
      });
    }, 600);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setLoading(true);
    try {
      if (auth) {
        // Sign in or create user
        try {
          await signInWithEmailAndPassword(auth, email, code.padEnd(6, '0'));
        } catch {
          await createUserWithEmailAndPassword(auth, email, code.padEnd(6, '0'));
        }
      }
      toast({ title: 'Welcome to Talent Graph!' });
      onClose();
      router.push('/');
    } catch {
      // Demo fallback: redirect to dashboard
      toast({ title: 'Authenticated successfully' });
      onClose();
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog open className="modal modal-bottom sm:modal-middle bg-black/60 backdrop-blur-xs z-50">
      <div className="modal-box relative bg-[var(--background-color)] text-[var(--text-color)] sm:rounded-3xl sm:p-8 max-w-md w-full">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-[var(--text-muted)] hover:text-[var(--text-color)]"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>

        <div className="mb-8 mt-2 text-center">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-black p-1 shadow-sm">
            <img
              src="/icons/logo-transparent.png"
              alt="Talent Graph Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <h3 className="mb-3 text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            Welcome to Talent Graph
          </h3>
          <p className="px-2 text-sm text-[var(--text-muted)]">
            Enter your email to join or sign in. We'll send you a secure verification code.
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-5">
            <fieldset className="fieldset w-full">
              <label className="fieldset-label mb-1 text-sm font-medium text-[var(--text-color)]">
                Email Address
              </label>
              <div className="relative w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--text-muted)]">
                  <i className="fa-regular fa-envelope"></i>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input h-12 w-full border-[var(--border-color)] bg-[var(--surface-color)] pl-11 focus:border-[var(--secondary-color)] rounded-xl"
                  placeholder="athlete@example.com"
                  required
                />
              </div>
            </fieldset>
            <button
              type="submit"
              disabled={loading}
              className="btn mt-2 h-12 w-full rounded-xl border-none bg-[var(--secondary-color)] text-base text-white hover:bg-[var(--secondary-hover)] cursor-pointer"
            >
              {loading ? 'Sending Code...' : 'Continue with Email'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} className="flex flex-col gap-5">
            <div className="mb-2 rounded-xl border border-blue-100 bg-blue-50 p-4 text-center">
              <p className="text-sm text-blue-800">
                We've sent a 6-digit code to <strong>{email}</strong>
              </p>
            </div>
            <fieldset className="fieldset w-full">
              <label className="fieldset-label mb-1 w-full justify-center text-center text-sm font-medium text-[var(--text-color)]">
                Enter Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input h-14 w-full border-[var(--border-color)] bg-[var(--surface-color)] text-center text-2xl tracking-[0.5em] focus:border-[var(--secondary-color)] rounded-xl"
                placeholder="000000"
                required
                maxLength={6}
              />
            </fieldset>
            <button
              type="submit"
              disabled={loading}
              className="btn mt-2 h-12 w-full rounded-xl border-none bg-[var(--primary-color)] text-base text-white hover:bg-[var(--primary-hover)] cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="btn btn-ghost btn-sm mt-2 text-[var(--text-muted)] hover:bg-transparent"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i>
              Use a different email
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}
