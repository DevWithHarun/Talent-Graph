'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection, query, where, orderBy, doc, getDoc, getDocs,
  setDoc, updateDoc, writeBatch, addDoc, limit,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserSearchDialog } from '@/components/messaging/user-search-dialog';
import {
  ArrowLeft, Search, Send, Plus, Users, Loader2, MessageSquare, Hash,
  Pencil, Trash2, MoreHorizontal, Copy, Check, CheckCheck, X, ShieldCheck,
  Smile, Sparkles, UserCheck, MessageCircle, ExternalLink,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Conversation {
  id: string;
  type?: 'group' | 'direct';
  name?: string;
  clubId?: string;
  participants: string[];
  participantInfo?: Record<string, {
    name: string;
    role?: string;
    photoUrl?: string;
    organization?: string;
    isVerified?: boolean;
    username?: string;
  }>;
  participantRoles?: Record<string, string>;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  lastSenderId?: string | null;
  lastSenderName?: string | null;
  lastReadAt?: Record<string, string>;
  updatedAt?: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  content: string;
  timestamp: string;
  isDeleted?: boolean;
  editedAt?: string;
  reactions?: Record<string, string[]>; // emoji -> [userIds]
}

interface ConnectionEntry {
  uid: string;
  name: string;
  role: string;
  photoUrl?: string;
  organization?: string;
  isVerified?: boolean;
  username?: string;
  convId: string;
}

interface ResolvedProfile {
  name: string;
  role: string;
  photoUrl?: string;
  organization?: string;
  isVerified?: boolean;
  username?: string;
}

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  scout:           { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  coach:           { bg: 'bg-blue-500/10',  text: 'text-blue-400',  border: 'border-blue-500/30' },
  assistant_coach: { bg: 'bg-blue-500/10',  text: 'text-blue-300',  border: 'border-blue-500/30' },
  analyst:         { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  club:            { bg: 'bg-[#00C853]/10', text: 'text-[#00C853]', border: 'border-[#00C853]/30' },
  club_admin:      { bg: 'bg-[#00C853]/10', text: 'text-[#00C853]', border: 'border-[#00C853]/30' },
  athlete:         { bg: 'bg-sky-500/10',   text: 'text-sky-400',   border: 'border-sky-500/30' },
  default:         { bg: 'bg-slate-500/10', text: 'text-slate-300', border: 'border-slate-500/30' },
};

const POPULAR_EMOJIS = ['⚽', '🔥', '👍', '❤️', '🎯', '👏', '🏆', '💪', '🤝', '🙌'];

const QUICK_STARTERS = [
  '👋 Hi! Excited to connect with you.',
  '⚽ Would you like to review my latest match highlights?',
  '📅 What are the upcoming trial or scouting dates?',
  '📋 I would love to share my updated performance metrics.',
];

// Profile resolution cache
const profileCache = new Map<string, ResolvedProfile>();

async function resolveUserProfile(firestore: Firestore, uid: string, fallbackRole = 'user'): Promise<ResolvedProfile> {
  if (profileCache.has(uid)) return profileCache.get(uid)!;

  try {
    // 1. Check user doc
    const userDoc = await getDoc(doc(firestore, 'users', uid));
    const userData = userDoc.data() as any;
    const role = userData?.role || fallbackRole;

    if (role === 'scout' || fallbackRole === 'scout') {
      const scoutDoc = await getDoc(doc(firestore, 'scouts', uid));
      if (scoutDoc.exists()) {
        const s = scoutDoc.data() as any;
        const profile: ResolvedProfile = {
          name: s.name || userData?.displayName || [userData?.firstName, userData?.lastName].filter(Boolean).join(' ') || 'Verified Scout',
          role: 'scout',
          photoUrl: s.photoUrl || userData?.photoUrl || '',
          organization: s.organization || s.agency || s.club || 'Talent Scout',
          isVerified: s.isVerified ?? true,
          username: s.username || userData?.username,
        };
        profileCache.set(uid, profile);
        return profile;
      }
    }

    if (['coach', 'assistant_coach', 'analyst', 'gk_coach'].includes(role) || ['coach', 'assistant_coach', 'analyst', 'gk_coach'].includes(fallbackRole)) {
      const scoutDoc = await getDoc(doc(firestore, 'scouts', uid));
      if (scoutDoc.exists()) {
        const s = scoutDoc.data() as any;
        const profile: ResolvedProfile = {
          name: s.name || userData?.displayName || [userData?.firstName, userData?.lastName].filter(Boolean).join(' ') || 'Coach',
          role,
          photoUrl: s.photoUrl || userData?.photoUrl || '',
          organization: s.organization || s.club || 'Coaching Staff',
          isVerified: s.isVerified ?? true,
          username: s.username || userData?.username,
        };
        profileCache.set(uid, profile);
        return profile;
      }
    }

    if (role === 'athlete' || fallbackRole === 'athlete') {
      const athDoc = await getDoc(doc(firestore, 'athletes', uid));
      if (athDoc.exists()) {
        const a = athDoc.data() as any;
        const fullName = `${a.firstName || ''} ${a.lastName || ''}`.trim();
        const profile: ResolvedProfile = {
          name: fullName || userData?.displayName || 'Athlete',
          role: 'athlete',
          photoUrl: a.photoUrl || userData?.photoUrl || '',
          organization: a.clubName || a.currentClub || a.position || 'Athlete',
          isVerified: a.isVerified ?? false,
          username: a.username || userData?.username,
        };
        profileCache.set(uid, profile);
        return profile;
      }
    }

    if (role === 'club' || fallbackRole === 'club') {
      const clubDoc = await getDoc(doc(firestore, 'clubs', uid.startsWith('club_') ? uid : `club_${uid}`));
      if (clubDoc.exists()) {
        const c = clubDoc.data() as any;
        const profile: ResolvedProfile = {
          name: c.clubName || c.name || userData?.displayName || 'Club Leadership',
          role: 'club',
          photoUrl: c.logoUrl || userData?.photoUrl || '',
          organization: c.league || 'Football Club',
          isVerified: true,
          username: c.username || userData?.username,
        };
        profileCache.set(uid, profile);
        return profile;
      }
    }

    const fallbackName = [userData?.firstName, userData?.lastName].filter(Boolean).join(' ') || userData?.displayName || (role === 'scout' ? 'Scout' : 'Member');
    const profile: ResolvedProfile = {
      name: fallbackName,
      role,
      photoUrl: userData?.photoUrl || '',
      organization: userData?.organization || '',
      isVerified: userData?.isVerified ?? false,
      username: userData?.username,
    };
    profileCache.set(uid, profile);
    return profile;
  } catch {
    const defaultProfile: ResolvedProfile = {
      name: fallbackRole === 'scout' ? 'Talent Scout' : fallbackRole === 'coach' ? 'Coach' : 'Team Member',
      role: fallbackRole,
    };
    return defaultProfile;
  }
}

function getInitials(name: string) {
  const parts = (name || '').trim().split(' ');
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (name || '?').substring(0, 2).toUpperCase();
}

function formatConvTime(ts?: string | null) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    if (isToday(d)) return format(d, 'p');
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d');
  } catch { return ''; }
}

function formatMsgTime(ts: string) {
  try { return format(new Date(ts), 'p'); } catch { return ''; }
}

function groupByDate(messages: Message[]) {
  const groups: { label: string; messages: Message[] }[] = [];
  for (const msg of messages) {
    let label = 'Today';
    try {
      const d = new Date(msg.timestamp);
      if (isToday(d)) label = 'Today';
      else if (isYesterday(d)) label = 'Yesterday';
      else label = format(d, 'MMMM d, yyyy');
    } catch {}
    const last = groups[groups.length - 1];
    if (last && last.label === label) { last.messages.push(msg); }
    else { groups.push({ label, messages: [msg] }); }
  }
  return groups;
}

// ─────────────────────────────────────────────────────────────────────────────
// Message Item in Thread
// ─────────────────────────────────────────────────────────────────────────────
interface OptimisticMsg extends Message {
  _optimistic?: boolean;
  _sending?: boolean;
}

function ThreadMessageItem({
  msg,
  userId,
  isGroup,
  otherId,
  conv,
  onCopy,
  onEdit,
  onDelete,
  onReact,
}: {
  msg: Message;
  userId: string;
  isGroup: boolean;
  otherId?: string;
  conv: Conversation;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
}) {
  const isOwn = msg.senderId === userId;
  const isOptimistic = !!(msg as OptimisticMsg)._optimistic;
  const isSendingNow = isOptimistic && (msg as OptimisticMsg)._sending;
  const otherLastRead = !isGroup && otherId ? conv.lastReadAt?.[otherId] : undefined;
  const isReadByOther = !isGroup && !isOptimistic && !!otherLastRead && otherLastRead >= msg.timestamp;
  const roleStyle = ROLE_COLORS[msg.senderRole || ''] || ROLE_COLORS.default;

  if (msg.isDeleted) {
    return (
      <div className={cn('flex py-1', isOwn ? 'justify-end' : 'justify-start')}>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-slate-800 text-slate-500 text-xs italic bg-slate-900/40">
          <Trash2 className="h-3 w-3" /> Message removed
        </div>
      </div>
    );
  }

  const reactions = msg.reactions || {};
  const reactionKeys = Object.keys(reactions).filter(emoji => reactions[emoji]?.length > 0);

  return (
    <div className={cn('group flex items-end gap-2.5 py-1', isOwn ? 'justify-end' : 'justify-start')}>
      {!isOwn && (
        <Avatar className="h-7 w-7 shrink-0 mb-1 ring-1 ring-slate-800">
          <AvatarFallback className="text-[10px] font-bold bg-slate-800 text-slate-300">
            {getInitials(msg.senderName)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn('flex flex-col max-w-[78%] sm:max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
        {isGroup && !isOwn && (
          <span className="text-[11px] font-bold mb-1 px-1 flex items-center gap-1.5">
            <span className={roleStyle.text}>{msg.senderName}</span>
            {msg.senderRole && (
              <span className="text-[10px] text-slate-400 uppercase font-medium">· {msg.senderRole}</span>
            )}
          </span>
        )}

        <div className="relative flex items-center gap-1">
          {/* Action Toolbar on Hover */}
          <div className={cn(
            'opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-1',
            isOwn ? 'order-first' : 'order-last'
          )}>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="h-7 w-7 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-xs"
                  title="React"
                >
                  <Smile className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="center" className="w-auto p-1.5 bg-slate-900 border-slate-800 flex gap-1 shadow-xl">
                {POPULAR_EMOJIS.slice(0, 6).map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => onReact(emoji)}
                    className="h-8 w-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-sm transition-transform hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="h-7 w-7 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                  title="Options"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? 'end' : 'start'} className="w-36 bg-slate-900 border-slate-800 text-slate-200">
                <DropdownMenuItem onClick={onCopy} className="gap-2 text-xs hover:bg-slate-800 cursor-pointer">
                  <Copy className="h-3.5 w-3.5" /> Copy Text
                </DropdownMenuItem>
                {isOwn && (
                  <>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    <DropdownMenuItem onClick={onEdit} className="gap-2 text-xs hover:bg-slate-800 cursor-pointer">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="gap-2 text-xs text-red-400 hover:bg-slate-800 cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Bubble */}
          <div
            className={cn(
              'px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm transition-all',
              isOwn
                ? 'bg-[#00C853] text-[#0A0E1A] font-medium rounded-br-xs'
                : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-xs'
            )}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>

            <div className={cn(
              'flex items-center gap-1.5 mt-1 text-[10px] font-mono tabular-nums',
              isOwn ? 'justify-end text-black/60' : 'justify-start text-slate-400'
            )}>
              <span>{formatMsgTime(msg.timestamp)}</span>
              {msg.editedAt && <span className="italic">· edited</span>}
              {isOwn && !isGroup && (
                isSendingNow ? (
                  <Loader2 className="h-3 w-3 animate-spin text-black/40" />
                ) : (
                  <CheckCheck
                    className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      isReadByOther ? 'text-black font-bold' : 'text-black/40'
                    )}
                  />
                )
              )}
            </div>
          </div>
        </div>

        {/* Reaction Badges */}
        {reactionKeys.length > 0 && (
          <div className={cn('flex flex-wrap gap-1 mt-1 px-1', isOwn ? 'justify-end' : 'justify-start')}>
            {reactionKeys.map(emoji => {
              const uids = reactions[emoji] || [];
              const hasReacted = uids.includes(userId);
              return (
                <button
                  key={emoji}
                  onClick={() => onReact(emoji)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors border',
                    hasReacted
                      ? 'bg-[#00C853]/20 border-[#00C853]/40 text-[#00C853]'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  )}
                >
                  <span>{emoji}</span>
                  <span className="font-mono text-[10px] tabular-nums">{uids.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Thread View (Active Chat)
// ─────────────────────────────────────────────────────────────────────────────
function ChatThread({
  conv,
  userId,
  userProfile,
  onBack,
  onOpenDirectory,
}: {
  conv: Conversation;
  userId: string;
  userProfile: ResolvedProfile;
  onBack: () => void;
  onOpenDirectory: () => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [optimisticMsgs, setOptimisticMsgs] = useState<OptimisticMsg[]>([]);
  const [partnerProfile, setPartnerProfile] = useState<ResolvedProfile | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isGroup = conv.type === 'group';
  const otherId = !isGroup ? conv.participants.find(p => p !== userId) : undefined;
  const initialInfo = otherId ? conv.participantInfo?.[otherId] : undefined;

  // Resolve partner's real details asynchronously
  useEffect(() => {
    if (isGroup || !firestore || !otherId) return;
    let isCancelled = false;
    (async () => {
      const resolved = await resolveUserProfile(firestore, otherId, initialInfo?.role || 'user');
      if (!isCancelled) {
        setPartnerProfile(resolved);
      }
    })();
    return () => { isCancelled = true; };
  }, [firestore, otherId, isGroup, initialInfo]);

  const displayName = isGroup
    ? (conv.name || 'Squad Tactical Room')
    : (partnerProfile?.name || initialInfo?.name || 'Partner');
  const displayRole = isGroup ? 'Squad' : (partnerProfile?.role || initialInfo?.role || 'Member');
  const displayPhoto = isGroup ? undefined : (partnerProfile?.photoUrl || initialInfo?.photoUrl);
  const displayOrg = partnerProfile?.organization || initialInfo?.organization || '';
  const isVerified = !isGroup && (partnerProfile?.isVerified ?? initialInfo?.isVerified);
  const username = partnerProfile?.username || initialInfo?.username;

  const roleStyle = ROLE_COLORS[displayRole.toLowerCase()] || ROLE_COLORS.default;

  // Live messages query from Firestore
  const msgsQuery = useMemoFirebase(() => (
    firestore && conv.id
      ? query(collection(firestore, 'conversations', conv.id, 'messages'), orderBy('timestamp', 'asc'))
      : null
  ), [firestore, conv.id]);

  const { data: firestoreMessages, isLoading } = useCollection<Message>(msgsQuery);

  // Sync and clear optimistic messages
  useEffect(() => {
    if (!firestoreMessages || optimisticMsgs.length === 0) return;
    setOptimisticMsgs(prev =>
      prev.filter(opt =>
        !firestoreMessages.some(
          m => m.senderId === userId && Math.abs(new Date(m.timestamp).getTime() - new Date(opt.timestamp).getTime()) < 3000
        )
      )
    );
  }, [firestoreMessages, userId, optimisticMsgs.length]);

  const displayMessages = useMemo(() => {
    const realTs = new Set((firestoreMessages ?? []).map(m => m.timestamp));
    const pending = optimisticMsgs.filter(o => !realTs.has(o.timestamp));
    return [...(firestoreMessages ?? []), ...pending].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, [firestoreMessages, optimisticMsgs]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [displayMessages.length]);

  // Mark conversation read
  useEffect(() => {
    if (!firestore || !userId || !conv.id) return;
    updateDoc(doc(firestore, 'conversations', conv.id), {
      [`lastReadAt.${userId}`]: new Date().toISOString(),
    }).catch(() => {});
  }, [firestore, userId, conv.id]);

  const handleSend = useCallback(async (customText?: string) => {
    const textToSend = (customText ?? input).trim();
    if (!textToSend || sending || !firestore) return;
    const now = new Date().toISOString();
    setInput('');

    const tempId = `opt_${Date.now()}`;
    const optimistic: OptimisticMsg = {
      id: tempId,
      senderId: userId,
      senderName: userProfile.name,
      senderRole: userProfile.role,
      content: textToSend,
      timestamp: now,
      isDeleted: false,
      _optimistic: true,
      _sending: true,
    };
    setOptimisticMsgs(prev => [...prev, optimistic]);
    setSending(true);

    try {
      const batch = writeBatch(firestore);
      const msgRef = doc(collection(firestore, 'conversations', conv.id, 'messages'));
      batch.set(msgRef, {
        senderId: userId,
        senderName: userProfile.name,
        senderRole: userProfile.role,
        content: textToSend,
        timestamp: now,
        isDeleted: false,
      });

      const participantInfoPayload: Record<string, any> = {
        [userId]: {
          name: userProfile.name,
          role: userProfile.role,
          photoUrl: userProfile.photoUrl || null,
          organization: userProfile.organization || null,
        },
      };

      if (!isGroup && otherId) {
        participantInfoPayload[otherId] = {
          name: displayName,
          role: displayRole,
          photoUrl: displayPhoto || null,
          organization: displayOrg || null,
        };
      }

      batch.set(doc(firestore, 'conversations', conv.id), {
        participants: conv.participants,
        participantInfo: {
          ...(conv.participantInfo || {}),
          ...participantInfoPayload,
        },
        type: conv.type || 'direct',
        ...(conv.clubId ? { clubId: conv.clubId } : {}),
        ...(conv.name ? { name: conv.name } : {}),
        lastMessage: textToSend,
        lastMessageAt: now,
        lastSenderId: userId,
        lastSenderName: userProfile.name,
        updatedAt: now,
        [`lastReadAt.${userId}`]: now,
      }, { merge: true });

      await batch.commit();

      setOptimisticMsgs(prev => prev.map(m => m.id === tempId ? { ...m, _sending: false } : m));

      // Notifications
      if (!isGroup && otherId) {
        addDoc(collection(firestore, 'notifications', otherId, 'items'), {
          type: 'new_message',
          actorName: userProfile.name,
          actorRole: userProfile.role,
          message: textToSend.length > 80 ? textToSend.slice(0, 80) + '…' : textToSend,
          conversationId: conv.id,
          url: `/chat/${conv.id}`,
          isRead: false,
          createdAt: now,
        }).catch(() => {});
      }
    } catch (e) {
      setOptimisticMsgs(prev => prev.filter(m => m.id !== tempId));
      setInput(textToSend);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send message. Please retry.' });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [firestore, input, sending, userId, userProfile, conv, isGroup, otherId, displayName, displayRole, displayPhoto, displayOrg, toast]);

  const handleDeleteMessage = async (msgId: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, 'conversations', conv.id, 'messages', msgId), {
      isDeleted: true,
      content: '',
    }).catch(() => {});
  };

  const handleEditSave = async (msgId: string) => {
    if (!editText.trim() || !firestore) return;
    await updateDoc(doc(firestore, 'conversations', conv.id, 'messages', msgId), {
      content: editText.trim(),
      editedAt: new Date().toISOString(),
    }).catch(() => {});
    setEditingId(null);
  };

  const handleReact = async (msgId: string, emoji: string) => {
    if (!firestore) return;
    const targetMsg = displayMessages.find(m => m.id === msgId);
    if (!targetMsg) return;

    const currentReactions = targetMsg.reactions || {};
    const existingList = currentReactions[emoji] || [];
    const hasReacted = existingList.includes(userId);

    const updatedList = hasReacted
      ? existingList.filter(id => id !== userId)
      : [...existingList, userId];

    const newReactions = { ...currentReactions, [emoji]: updatedList };

    await updateDoc(doc(firestore, 'conversations', conv.id, 'messages', msgId), {
      reactions: newReactions,
    }).catch(() => {});
  };

  const groups = groupByDate(displayMessages);

  return (
    <div className="flex flex-col h-full bg-[#0B0F17]">
      {/* ── Thread Header ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden h-8 w-8 text-slate-400 hover:text-white shrink-0 -ml-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="relative shrink-0">
            <Avatar className="h-10 w-10 ring-2 ring-slate-800">
              {displayPhoto && <AvatarImage src={displayPhoto} className="object-cover" />}
              <AvatarFallback className={cn('font-bold text-xs', isGroup ? 'bg-[#00C853]/20 text-[#00C853]' : 'bg-slate-800 text-slate-200')}>
                {isGroup ? <Hash className="h-4 w-4" /> : getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#00C853] ring-2 ring-[#0B0F17]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base text-white truncate">{displayName}</h2>
              {isVerified && (
                <span title="Verified Talent Graph Profile">
                  <ShieldCheck className="h-4 w-4 text-[#00C853] shrink-0" />
                </span>
              )}
              <span className={cn('text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border', roleStyle.bg, roleStyle.text, roleStyle.border)}>
                {displayRole}
              </span>
            </div>

            <p className="text-xs text-slate-400 truncate">
              {isGroup
                ? `${conv.participants.length} Squad Members · Official Channel`
                : (displayOrg ? `${displayOrg}` : 'Active on Talent Graph')}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isGroup && username && (
            <Link href={`/${username}`} target="_blank" className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400 hover:text-[#00C853] px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Profile</span>
            </Link>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800 text-slate-200">
              <DropdownMenuItem onClick={onOpenDirectory} className="gap-2 text-xs hover:bg-slate-800 cursor-pointer">
                <Users className="h-3.5 w-3.5" /> Browse Directory
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem onClick={onBack} className="gap-2 text-xs text-slate-400 hover:bg-slate-800 cursor-pointer">
                Close Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Message Feed ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#00C853]" />
          </div>
        )}

        {/* Empty Thread Hero: Conversation Starters */}
        {!isLoading && displayMessages.length === 0 && (
          <div className="max-w-md mx-auto my-8 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center shadow-lg">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 ring-4 ring-[#00C853]/10">
              <Avatar className="h-12 w-12">
                {displayPhoto && <AvatarImage src={displayPhoto} />}
                <AvatarFallback className="font-bold text-sm bg-slate-800 text-[#00C853]">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </div>

            <h3 className="font-bold text-base text-white">
              Connect with {displayName}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {isGroup
                ? 'Welcome to your squad tactical room. Share updates, schedules, and game film.'
                : `Verified ${displayRole} on Talent Graph. Start the conversation with a quick intro:`}
            </p>

            {/* Quick Starters */}
            <div className="mt-4 grid grid-cols-1 gap-2 text-left">
              {QUICK_STARTERS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-[#00C853]/10 border border-slate-700/60 hover:border-[#00C853]/40 text-xs text-slate-300 hover:text-[#00C853] transition-all flex items-center gap-2 group"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#00C853] shrink-0 opacity-70 group-hover:opacity-100" />
                  <span className="truncate">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages Grouped by Date */}
        {groups.map(group => (
          <div key={group.label} className="space-y-3">
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-slate-800/80" />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-800">
                {group.label}
              </span>
              <div className="flex-1 h-px bg-slate-800/80" />
            </div>

            <div className="space-y-1">
              {group.messages.map(msg => (
                <ThreadMessageItem
                  key={msg.id}
                  msg={msg}
                  userId={userId}
                  isGroup={isGroup}
                  otherId={otherId}
                  conv={conv}
                  onCopy={() => navigator.clipboard.writeText(msg.content).then(() => toast({ title: 'Copied to clipboard' }))}
                  onEdit={() => { setEditingId(msg.id); setEditText(msg.content); }}
                  onDelete={() => handleDeleteMessage(msg.id)}
                  onReact={emoji => handleReact(msg.id, emoji)}
                />
              ))}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* ── Edit Message Overlay ── */}
      {editingId && (
        <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Pencil className="h-3.5 w-3.5 text-[#00C853]" />
            <span>Editing message</span>
          </div>
          <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Message Composer ── */}
      <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md shrink-0">
        <div className="flex items-end gap-2 max-w-5xl mx-auto">
          {/* Popular Emoji Quick Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="h-10 w-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0 mb-0.5"
                title="Add Emoji"
              >
                <Smile className="h-5 w-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-64 p-2 bg-slate-900 border-slate-800 shadow-xl">
              <p className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Sports & Reactions</p>
              <div className="grid grid-cols-5 gap-1 pt-1">
                {POPULAR_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setInput(prev => prev + emoji)}
                    className="h-9 w-9 rounded-lg hover:bg-slate-800 flex items-center justify-center text-lg transition-transform hover:scale-110"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={editingId ? editText : input}
              onChange={e => (editingId ? setEditText(e.target.value) : setInput(e.target.value))}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (editingId) {
                    handleEditSave(editingId);
                  } else {
                    handleSend();
                  }
                }
              }}
              placeholder={`Message ${displayName}... (Press Enter to send)`}
              rows={1}
              className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-slate-400 resize-none focus:outline-none focus:ring-1 focus:ring-[#00C853] focus:border-[#00C853] max-h-32 overflow-y-auto transition-all"
              style={{ minHeight: '44px' }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = 'auto';
                t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
              }}
            />
          </div>

          <Button
            onClick={() => (editingId ? handleEditSave(editingId) : handleSend())}
            disabled={editingId ? !editText.trim() : !input.trim() || sending}
            className="h-11 px-5 rounded-xl bg-[#00C853] hover:bg-[#00C853]/90 text-black font-bold text-sm shrink-0 transition-transform active:scale-95 disabled:opacity-40"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editingId ? (
              <Check className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Welcome Screen (Right panel when no chat is active)
// ─────────────────────────────────────────────────────────────────────────────
function MessagesWelcomeView({
  connections,
  onStartChatWith,
  onOpenNewChat,
}: {
  connections: ConnectionEntry[];
  onStartChatWith: (entry: ConnectionEntry) => void;
  onOpenNewChat: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-[#0B0F17] text-center overflow-y-auto">
      <div className="max-w-xl w-full flex flex-col items-center">
        {/* Crest */}
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00C853]/20 via-slate-800 to-slate-800 border border-[#00C853]/30 flex items-center justify-center shadow-xl">
            <MessageSquare className="h-8 w-8 text-[#00C853]" />
          </div>
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#00C853] ring-4 ring-[#0B0F17]" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-widest text-[#00C853] px-3 py-1 rounded-full bg-[#00C853]/10 border border-[#00C853]/20 mb-3">
          Talent Graph Secure Communications
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Professional Messaging Hub
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-md">
          Direct, encrypted channels between verified athletes, scouting directors, coaches, and club administration.
        </p>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-8 text-left">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 font-bold text-xs">
              🎯
            </div>
            <h4 className="text-xs font-bold text-white">Scout Inquiries</h4>
            <p className="text-[11px] text-slate-400 mt-1">Direct trial invites, contract notes, and talent assessments.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
            <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 font-bold text-xs">
              ⚽
            </div>
            <h4 className="text-xs font-bold text-white">Squad Rooms</h4>
            <p className="text-[11px] text-slate-400 mt-1">Official tactical broadcasts and squad training alerts.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
            <div className="h-7 w-7 rounded-lg bg-[#00C853]/10 text-[#00C853] flex items-center justify-center mb-2 font-bold text-xs">
              📄
            </div>
            <h4 className="text-xs font-bold text-white">Reels & Stats</h4>
            <p className="text-[11px] text-slate-400 mt-1">Share match video reels and certified performance stats.</p>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={onOpenNewChat}
            className="h-10 px-6 rounded-xl bg-[#00C853] hover:bg-[#00C853]/90 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#00C853]/10"
          >
            <Plus className="h-4 w-4" /> Start New Conversation
          </Button>
        </div>

        {/* Quick Connect Strip */}
        {connections.length > 0 && (
          <div className="w-full mt-10 pt-6 border-t border-slate-800/60">
            <div className="flex items-center justify-between mb-3 text-left">
              <span className="text-xs font-bold text-slate-300">Quick Connect · Your Verified Network</span>
              <span className="text-[10px] text-slate-400 font-mono tabular-nums">{connections.length} contacts</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {connections.slice(0, 4).map(conn => {
                const roleStyle = ROLE_COLORS[conn.role.toLowerCase()] || ROLE_COLORS.default;
                return (
                  <button
                    key={conn.uid}
                    onClick={() => onStartChatWith(conn)}
                    className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8 ring-1 ring-slate-800 shrink-0">
                        {conn.photoUrl && <AvatarImage src={conn.photoUrl} />}
                        <AvatarFallback className="text-[10px] font-bold bg-slate-800 text-slate-300">
                          {getInitials(conn.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white truncate">{conn.name}</p>
                          {conn.isVerified && <ShieldCheck className="h-3 w-3 text-[#00C853] shrink-0" />}
                        </div>
                        <span className={cn('text-[9px] uppercase font-bold', roleStyle.text)}>
                          {conn.role}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-[#00C853] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      Chat →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main MessagesHub Component
// ─────────────────────────────────────────────────────────────────────────────
interface MessagesHubProps {
  defaultConversationId?: string;
}

export function MessagesHub({ defaultConversationId }: MessagesHubProps = {}) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeConvId, setActiveConvId] = useState<string | null>(defaultConversationId || null);
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'directory'>('chats');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewDM, setShowNewDM] = useState(false);

  const [userProfile, setUserProfile] = useState<ResolvedProfile>({
    name: 'You',
    role: 'athlete',
  });
  const [clubId, setClubId] = useState<string | null>(null);
  const [connections, setConnections] = useState<ConnectionEntry[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);

  // Sync defaultConversationId if changed
  useEffect(() => {
    if (defaultConversationId) {
      setActiveConvId(defaultConversationId);
    }
  }, [defaultConversationId]);

  // Load Current User Profile
  useEffect(() => {
    if (!firestore || !user?.uid) return;
    (async () => {
      const resolved = await resolveUserProfile(firestore, user.uid);
      setUserProfile(resolved);
    })();
  }, [firestore, user]);

  // Load Verified Network & Club Connections
  useEffect(() => {
    if (!firestore || !user?.uid) return;
    setConnectionsLoading(true);

    (async () => {
      try {
        const entries: ConnectionEntry[] = [];
        const seenUids = new Set<string>();
        let foundClubId: string | null = null;

        // 1. Check club members
        const myClubMemberSnap = await getDocs(query(
          collection(firestore, 'club_members'),
          where('userId', '==', user.uid),
          where('status', '==', 'active')
        ));

        if (!myClubMemberSnap.empty) {
          foundClubId = myClubMemberSnap.docs[0].data().clubId as string;
          setClubId(foundClubId);

          const squadSnap = await getDocs(query(
            collection(firestore, 'club_members'),
            where('clubId', '==', foundClubId),
            where('status', '==', 'active')
          ));

          for (const d of squadSnap.docs) {
            const data = d.data() as any;
            if (!data.userId || data.userId === user.uid || seenUids.has(data.userId)) continue;
            seenUids.add(data.userId);

            const resolved = await resolveUserProfile(firestore, data.userId, data.role || 'athlete');
            entries.push({
              uid: data.userId,
              name: resolved.name,
              role: resolved.role,
              photoUrl: resolved.photoUrl,
              organization: resolved.organization || 'Club Squad',
              isVerified: resolved.isVerified,
              username: resolved.username,
              convId: [user.uid, data.userId].sort().join('_dm_'),
            });
          }
        }

        // 2. Check scout connections (as scout or athlete)
        const [scoutAsScoutSnap, scoutAsAthleteSnap] = await Promise.all([
          getDocs(query(collection(firestore, 'scout_connections'), where('scoutId', '==', user.uid), where('status', '==', 'accepted'))),
          getDocs(query(collection(firestore, 'scout_connections'), where('athleteId', '==', user.uid), where('status', '==', 'accepted'))),
        ]);

        for (const d of scoutAsScoutSnap.docs) {
          const data = d.data() as any;
          if (!data.athleteId || seenUids.has(data.athleteId)) continue;
          seenUids.add(data.athleteId);

          const resolved = await resolveUserProfile(firestore, data.athleteId, 'athlete');
          entries.push({
            uid: data.athleteId,
            name: resolved.name,
            role: 'athlete',
            photoUrl: resolved.photoUrl,
            organization: resolved.organization || 'Athlete',
            isVerified: resolved.isVerified,
            username: resolved.username,
            convId: [user.uid, data.athleteId].sort().join('_dm_'),
          });
        }

        for (const d of scoutAsAthleteSnap.docs) {
          const data = d.data() as any;
          if (!data.scoutId || seenUids.has(data.scoutId)) continue;
          seenUids.add(data.scoutId);

          const resolved = await resolveUserProfile(firestore, data.scoutId, 'scout');
          entries.push({
            uid: data.scoutId,
            name: resolved.name,
            role: 'scout',
            photoUrl: resolved.photoUrl,
            organization: resolved.organization || 'Talent Scout',
            isVerified: resolved.isVerified,
            username: resolved.username,
            convId: [user.uid, data.scoutId].sort().join('_dm_'),
          });
        }

        setConnections(entries);
      } catch (err) {
        console.error('[MessagesHub] Error loading connections:', err);
      } finally {
        setConnectionsLoading(false);
      }
    })();
  }, [firestore, user?.uid]);

  // Live Conversations Query from Firestore
  const convQuery = useMemoFirebase(() => (
    firestore && user?.uid
      ? query(
          collection(firestore, 'conversations'),
          where('participants', 'array-contains', user.uid),
          orderBy('updatedAt', 'desc')
        )
      : null
  ), [firestore, user?.uid]);

  const { data: rawConversations, isLoading: convsLoading } = useCollection<Conversation>(convQuery);

  // Filter Active Conversations:
  // ONLY show conversations that have actual messages OR is the currently open conversation!
  // NO GHOST/EMPTY STUBS POLLUTING THE INBOX!
  const activeConversations = useMemo(() => {
    if (!rawConversations) return [];
    return rawConversations.filter(c => {
      // If it's the actively opened chat, keep it visible
      if (c.id === activeConvId) return true;
      // Only keep conversations where a message has actually been sent
      return !!c.lastMessage;
    });
  }, [rawConversations, activeConvId]);

  // Total unread count
  const unreadTotal = useMemo(() => {
    if (!user?.uid || !activeConversations) return 0;
    return activeConversations.reduce((acc, c) => {
      if (!c.lastMessageAt || !c.lastSenderId || c.lastSenderId === user.uid) return acc;
      const lastRead = c.lastReadAt?.[user.uid];
      if (!lastRead || c.lastMessageAt > lastRead) return acc + 1;
      return acc;
    }, 0);
  }, [user?.uid, activeConversations]);

  // Filtered lists based on search term
  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return activeConversations;
    const q = searchTerm.toLowerCase();
    return activeConversations.filter(c => {
      const isGroup = c.type === 'group';
      if (isGroup) {
        return (c.name || '').toLowerCase().includes(q) || (c.lastMessage || '').toLowerCase().includes(q);
      }
      const otherId = c.participants.find(p => p !== user?.uid);
      const otherName = otherId ? c.participantInfo?.[otherId]?.name || '' : '';
      return otherName.toLowerCase().includes(q) || (c.lastMessage || '').toLowerCase().includes(q);
    });
  }, [activeConversations, searchTerm, user?.uid]);

  const filteredDirectory = useMemo(() => {
    if (!searchTerm.trim()) return connections;
    const q = searchTerm.toLowerCase();
    return connections.filter(conn =>
      conn.name.toLowerCase().includes(q) ||
      conn.role.toLowerCase().includes(q) ||
      (conn.organization || '').toLowerCase().includes(q)
    );
  }, [connections, searchTerm]);

  // Active Selected Conversation Object
  const activeConv = useMemo(() => {
    if (!activeConvId) return null;
    // 1. Look in rawConversations
    const found = rawConversations?.find(c => c.id === activeConvId);
    if (found) return found;

    // 2. If it's a newly created direct connection that doesn't have a doc yet
    const targetConn = connections.find(c => c.convId === activeConvId);
    if (targetConn && user?.uid) {
      return {
        id: targetConn.convId,
        type: 'direct' as const,
        participants: [user.uid, targetConn.uid],
        participantInfo: {
          [user.uid]: { name: userProfile.name, role: userProfile.role },
          [targetConn.uid]: {
            name: targetConn.name,
            role: targetConn.role,
            photoUrl: targetConn.photoUrl,
            organization: targetConn.organization,
            isVerified: targetConn.isVerified,
            username: targetConn.username,
          },
        },
      };
    }
    return null;
  }, [activeConvId, rawConversations, connections, user?.uid, userProfile]);

  const handleStartChatWithContact = (entry: ConnectionEntry) => {
    setActiveConvId(entry.convId);
    setSidebarTab('chats');
  };

  const handleDeleteConv = async (convId: string) => {
    if (!firestore || !user?.uid) return;
    try {
      // Remove self from participants or delete if last member
      const convRef = doc(firestore, 'conversations', convId);
      const snap = await getDoc(convRef);
      if (snap.exists()) {
        const data = snap.data() as Conversation;
        const remaining = data.participants.filter(p => p !== user.uid);
        if (remaining.length === 0) {
          await updateDoc(convRef, { isDeleted: true, lastMessage: null });
        } else {
          await updateDoc(convRef, { participants: remaining });
        }
      }
      if (activeConvId === convId) {
        setActiveConvId(null);
      }
      toast({ title: 'Conversation removed' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not remove conversation.' });
    }
  };

  return (
    <div className="flex h-full w-full rounded-2xl overflow-hidden bg-[#0B0F17] border border-slate-800 shadow-2xl">
      {/* ── Left Sidebar (Inbox & Directory) ── */}
      <div
        className={cn(
          'w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-800 bg-slate-900/90 shrink-0 transition-all',
          activeConvId ? 'hidden md:flex' : 'flex'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#00C853]/15 text-[#00C853] flex items-center justify-center font-black">
                <MessageSquare className="h-4 w-4" />
              </div>
              <h1 className="font-extrabold text-base text-white tracking-tight">Messages</h1>
            </div>

            <Button
              size="sm"
              onClick={() => setShowNewDM(true)}
              className="h-8 px-3 rounded-lg bg-[#00C853] hover:bg-[#00C853]/90 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New</span>
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search conversations & people..."
              className="h-9 pl-9 pr-8 bg-slate-800/80 border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#00C853]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Segmented Filter Control */}
          <div className="grid grid-cols-2 gap-1 p-1 mt-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setSidebarTab('chats')}
              className={cn(
                'py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5',
                sidebarTab === 'chats'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <span>Chats</span>
              {unreadTotal > 0 && (
                <span className="h-4 min-w-4 px-1 rounded-full bg-[#00C853] text-black text-[10px] font-black flex items-center justify-center font-mono">
                  {unreadTotal}
                </span>
              )}
            </button>

            <button
              onClick={() => setSidebarTab('directory')}
              className={cn(
                'py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5',
                sidebarTab === 'directory'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <span>Directory</span>
              <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                ({connections.length})
              </span>
            </button>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto">
          {sidebarTab === 'chats' ? (
            /* ── CHATS TAB: Active Real Conversations ── */
            convsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#00C853]" />
              </div>
            ) : filteredConversations.length === 0 ? (
              /* Beautiful Empty Inbox State */
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-3 text-slate-400">
                  <MessageCircle className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="font-bold text-white text-sm">
                  {searchTerm ? 'No matching conversations' : 'No active chats yet'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                  {searchTerm
                    ? 'Try searching by a different name or message.'
                    : 'Your active chats will appear here once you send or receive messages.'}
                </p>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSidebarTab('directory')}
                  className="mt-4 h-8 px-4 text-xs font-bold border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                  <Users className="h-3.5 w-3.5 mr-1.5 text-[#00C853]" /> Browse Contacts
                </Button>

                {/* Quick contact shortcuts */}
                {connections.length > 0 && !searchTerm && (
                  <div className="mt-6 w-full pt-4 border-t border-slate-800/80 text-left">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Start with your network
                    </p>
                    <div className="space-y-1.5">
                      {connections.slice(0, 3).map(c => (
                        <button
                          key={c.uid}
                          onClick={() => handleStartChatWithContact(c)}
                          className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800/60 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-7 w-7 shrink-0">
                              {c.photoUrl && <AvatarImage src={c.photoUrl} />}
                              <AvatarFallback className="text-[10px] font-bold bg-slate-700 text-slate-200">
                                {getInitials(c.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-semibold text-slate-200 truncate">{c.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-[#00C853] shrink-0">Message</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Active Conversation List */
              <div className="divide-y divide-slate-800/60">
                {filteredConversations.map(convItem => {
                  const isGroup = convItem.type === 'group';
                  const otherId = !isGroup ? convItem.participants.find(p => p !== user?.uid) : undefined;
                  const otherInfo = otherId ? convItem.participantInfo?.[otherId] : undefined;
                  const itemTitle = isGroup ? (convItem.name || 'Squad Room') : (otherInfo?.name || 'Chat');
                  const itemPhoto = isGroup ? undefined : otherInfo?.photoUrl;
                  const itemRole = isGroup ? 'Squad' : (otherInfo?.role || 'Member');
                  const isActive = activeConvId === convItem.id;
                  const roleStyle = ROLE_COLORS[itemRole.toLowerCase()] || ROLE_COLORS.default;

                  // Unread indicator
                  const isUnread = !!(
                    convItem.lastMessageAt &&
                    convItem.lastSenderId &&
                    convItem.lastSenderId !== user?.uid &&
                    (!convItem.lastReadAt?.[user?.uid || ''] || convItem.lastMessageAt > convItem.lastReadAt[user?.uid || ''])
                  );

                  return (
                    <div
                      key={convItem.id}
                      className={cn(
                        'group relative flex items-center justify-between p-3 sm:px-4 cursor-pointer transition-colors',
                        isActive
                          ? 'bg-slate-800 border-l-2 border-l-[#00C853]'
                          : 'hover:bg-slate-800/50'
                      )}
                      onClick={() => setActiveConvId(convItem.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          <Avatar className="h-10 w-10 ring-1 ring-slate-800">
                            {itemPhoto && <AvatarImage src={itemPhoto} className="object-cover" />}
                            <AvatarFallback className={cn('text-xs font-bold', isGroup ? 'bg-[#00C853]/20 text-[#00C853]' : 'bg-slate-800 text-slate-200')}>
                              {isGroup ? <Hash className="h-4 w-4" /> : getInitials(itemTitle)}
                            </AvatarFallback>
                          </Avatar>
                          {isUnread && (
                            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#00C853] ring-2 ring-slate-900" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className={cn('text-xs font-bold truncate', isUnread ? 'text-white' : 'text-slate-200')}>
                              {itemTitle}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono tabular-nums shrink-0">
                              {formatConvTime(convItem.lastMessageAt)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-1">
                            <p className={cn('text-xs truncate max-w-[190px]', isUnread ? 'text-[#00C853] font-semibold' : 'text-slate-400')}>
                              {convItem.lastSenderId === user?.uid && <span className="text-slate-400">You: </span>}
                              {convItem.lastMessage || 'Say hi...'}
                            </p>
                            <span className={cn('text-[9px] uppercase font-bold px-1.5 py-0.2 rounded shrink-0', roleStyle.text)}>
                              {itemRole}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown Menu on Hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <button className="h-7 w-7 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 bg-slate-900 border-slate-800 text-slate-200">
                            <DropdownMenuItem
                              onClick={e => { e.stopPropagation(); handleDeleteConv(convItem.id); }}
                              className="gap-2 text-xs text-red-400 hover:bg-slate-800 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* ── DIRECTORY TAB: Verified Scouts, Coaches & Club Contacts ── */
            connectionsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#00C853]" />
              </div>
            ) : filteredDirectory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center text-slate-400">
                <UserCheck className="h-8 w-8 mb-2 opacity-60" />
                <p className="text-xs font-bold text-white">No contacts in directory</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                  Use the New button above to search and connect with verified scouts and athletes.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 p-2 space-y-1">
                {filteredDirectory.map(conn => {
                  const roleStyle = ROLE_COLORS[conn.role.toLowerCase()] || ROLE_COLORS.default;
                  return (
                    <div
                      key={conn.uid}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/60 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0 ring-1 ring-slate-800">
                          {conn.photoUrl && <AvatarImage src={conn.photoUrl} />}
                          <AvatarFallback className="text-xs font-bold bg-slate-800 text-slate-200">
                            {getInitials(conn.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-white truncate">{conn.name}</p>
                            {conn.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-[#00C853] shrink-0" />}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={cn('text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border', roleStyle.bg, roleStyle.text, roleStyle.border)}>
                              {conn.role}
                            </span>
                            {conn.organization && (
                              <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                · {conn.organization}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleStartChatWithContact(conn)}
                        className="h-7 px-3 rounded-lg bg-[#00C853] hover:bg-[#00C853]/90 text-black font-bold text-[11px] shrink-0"
                      >
                        Message
                      </Button>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* ── Right Panel: Chat Thread or Executive Welcome ── */}
      <div className={cn('flex-1 flex flex-col', activeConvId ? 'flex' : 'hidden md:flex')}>
        {activeConv && user?.uid ? (
          <ChatThread
            conv={activeConv}
            userId={user.uid}
            userProfile={userProfile}
            onBack={() => setActiveConvId(null)}
            onOpenDirectory={() => setSidebarTab('directory')}
          />
        ) : (
          <MessagesWelcomeView
            connections={connections}
            onStartChatWith={handleStartChatWithContact}
            onOpenNewChat={() => setShowNewDM(true)}
          />
        )}
      </div>

      {/* ── User Search & New Chat Dialog ── */}
      {user && (
        <UserSearchDialog
          open={showNewDM}
          onClose={() => setShowNewDM(false)}
          currentUserId={user.uid}
          currentUserName={userProfile.name}
          currentUserRole={userProfile.role}
          currentUserPhoto={userProfile.photoUrl}
          onConversationCreated={convId => {
            setShowNewDM(false);
            setActiveConvId(convId);
            setSidebarTab('chats');
          }}
        />
      )}
    </div>
  );
}
