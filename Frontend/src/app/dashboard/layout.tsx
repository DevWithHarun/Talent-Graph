'use client';

import React from 'react';
import { DashboardErrorBoundary } from '@/components/coach/dashboard-error-boundary';

export default function AthleteDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <DashboardErrorBoundary>
        {children}
      </DashboardErrorBoundary>
    </div>
  );
}
