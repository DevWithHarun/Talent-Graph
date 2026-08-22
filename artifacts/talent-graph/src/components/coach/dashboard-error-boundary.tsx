'use client';

import { Component, type ReactNode } from 'react';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  isFirestoreError: boolean;
  retryCount: number;
}

const FIRESTORE_PATTERNS = [
  'INTERNAL ASSERTION FAILED',
  'FIRESTORE',
  'ID: ca9',
  'ID: b815',
  'WebChannel',
  'stream',
];

function isFirestoreError(message: string): boolean {
  return FIRESTORE_PATTERNS.some((p) => message.toLowerCase().includes(p.toLowerCase()));
}

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      isFirestoreError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const msg = error?.message ?? String(error);
    return {
      hasError: true,
      errorMessage: msg,
      isFirestoreError: isFirestoreError(msg),
    };
  }

  componentDidCatch(error: Error) {
    // Log to console in dev — suppressed in prod by firebase-suppress.js for Firestore errors
    console.error('[DashboardErrorBoundary] caught:', error?.message);
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      errorMessage: '',
      isFirestoreError: false,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.state.retryCount >= 0 ? this.props.children : this.props.children;
    }

    const { isFirestoreError: isFS } = this.state;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        {/* Icon */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#1C2333] border border-[#1E293B]">
          {isFS ? (
            <WifiOff className="h-9 w-9 text-[#94A3B8]" />
          ) : (
            <AlertTriangle className="h-9 w-9 text-amber-400" />
          )}
        </div>

        {/* Heading */}
        <h2 className="text-xl font-black text-white mb-2">
          {isFS ? 'Connection lost' : 'Something went wrong'}
        </h2>

        {/* Description */}
        <p className="text-sm text-[#94A3B8] max-w-xs leading-relaxed mb-8">
          {isFS
            ? "The live data connection dropped. This usually fixes itself — tap Retry to reconnect."
            : "An unexpected error occurred on this page. Tap Retry to try again."}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full max-w-[240px]">
          <button
            onClick={this.handleRetry}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#00C853] px-6 py-3 text-sm font-black text-black tracking-wide uppercase transition-opacity hover:opacity-90 active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
          <button
            onClick={this.handleReload}
            className="rounded-xl border border-[#1E293B] px-6 py-3 text-sm font-semibold text-[#94A3B8] tracking-wide transition-colors hover:text-white hover:border-[#2D3748]"
          >
            Reload page
          </button>
        </div>

        {/* Retry counter hint */}
        {this.state.retryCount > 1 && (
          <p className="mt-6 text-xs text-[#475569]">
            Still failing after {this.state.retryCount} retries — try reloading the page.
          </p>
        )}
      </div>
    );
  }
}
