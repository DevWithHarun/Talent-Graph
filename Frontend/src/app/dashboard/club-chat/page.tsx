'use client';

import { useEffect } from 'react';
import { useRouter } from '@/lib/navigation';

/**
 * Legacy route — Club Chat has been removed from the athlete dashboard
 * and replaced by the Career workspace. Keep this file as a redirect
 * so old deep-links/bookmarks don't 404.
 */
export default function AthleteClubChatPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/career');
  }, [router]);
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8 text-center">
      <div>
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Redirecting…</p>
        <p className="mt-2 text-sm text-muted-foreground">Club Chat has moved to <span className="font-bold text-foreground">Career</span>.</p>
      </div>
    </div>
  );
}
