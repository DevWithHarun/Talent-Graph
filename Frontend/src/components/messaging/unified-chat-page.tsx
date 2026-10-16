'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { useRouter, useParams } from '@/lib/navigation';
import { MessagesHub } from '@/components/messaging/messages-hub';

/** Single app-wide direct and group messaging surface. */
export function UnifiedChatPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const params = useParams<{ conversationId?: string }>();
  const activeConversationId = params?.conversationId;

  useEffect(() => {
    if (!isUserLoading && !user) router.replace('/login');
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F17]">
        <Loader2 className="h-7 w-7 animate-spin text-[#00C853]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#080C14] px-0 py-0 text-slate-100 md:p-4 lg:p-6">
      <div className="mx-auto h-[100dvh] max-w-7xl md:h-[calc(100dvh-2rem)] lg:h-[calc(100dvh-3rem)]">
        <MessagesHub defaultConversationId={activeConversationId} />
      </div>
    </main>
  );
}

