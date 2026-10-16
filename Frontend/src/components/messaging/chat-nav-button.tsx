'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Link } from 'wouter';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

export function ChatNavButton() {
  const { user } = useUser();
  const firestore = useFirestore();

  const convQuery = useMemoFirebase(() => (
    firestore && user?.uid
      ? query(collection(firestore, 'conversations'), where('participants', 'array-contains', user.uid))
      : null
  ), [firestore, user?.uid]);

  const { data: convs } = useCollection<any>(convQuery);

  const unreadCount = convs?.reduce((acc, c) => {
    const isUnread = c.lastSenderId && c.lastSenderId !== user?.uid;
    return acc + (isUnread ? 1 : (c.unreadCount || 0));
  }, 0) ?? 0;

  return (
    <Link
      href="/chat"
      aria-label="Messages"
      className="relative flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl bg-[#1C2333]/40 border border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-[#00C853]/30 transition-colors"
    >
      <MessageSquare className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
