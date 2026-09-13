'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { useRouter } from '@/lib/navigation';
import { MessagesHub } from '@/components/messaging/messages-hub';

/** Single app-wide direct and group messaging surface. Club broadcasts stay outside this component. */
export function UnifiedChatPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) router.replace('/login');
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-white"><Loader2 className="h-7 w-7 animate-spin text-[#00C853]" /></div>;
  }

  return (
    <main className="min-h-screen bg-white px-0 py-0 text-slate-900 md:px-6 md:py-6">
      <div className="mx-auto h-[100dvh] max-w-6xl md:h-[calc(100dvh-3rem)]">
        <MessagesHub />
      </div>
    </main>
  );
}
