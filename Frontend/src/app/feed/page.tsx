'use client';

import { useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import {
  Bell, Check, ChevronLeft, ChevronRight, Compass, Flame, Globe2, House, Image as ImageIcon,
  Inbox, LayoutDashboard, MessageCircle, Search, Send, Share2, ThumbsUp, UserRound, Users, X,
} from 'lucide-react';
import { addDoc, arrayRemove, arrayUnion, collection, doc, limit, orderBy, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { useDoc, useFirebaseApp, useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { uploadFileWithProgress } from '@/firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { AthleteProfile, UserAccount } from '@/lib/types';

type FeedTab = 'all' | 'trending' | 'scouts' | 'basketball' | 'football' | 'athletics';

interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  authorRole?: string;
  authorPhotoUrl?: string;
  sport?: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likes?: string[];
  commentCount?: number;
  createdAt: string;
}

interface FeedComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  parentId?: string;
}

interface Story {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: string;
}

interface MediaSelection {
  url: string;
  type: 'image' | 'video';
  file?: File;
}

interface FeedNotification {
  id: string;
  actorName?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const tabs: { id: FeedTab; label: string; icon?: typeof Flame }[] = [
  { id: 'all', label: 'All Posts' },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'scouts', label: 'Scouts', icon: Users },
  { id: 'basketball', label: 'Basketball' },
  { id: 'football', label: 'Football' },
  { id: 'athletics', label: 'Athletics' },
];

function initials(name: string) {
  return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function timeAgo(value: string) {
  try { return formatDistanceToNow(new Date(value), { addSuffix: true }); } catch { return 'Just now'; }
}

function contentWithHashtags(content: string) {
  return content.split(/(#[a-z0-9_]+)/gi).map((part, index) =>
    /^#[a-z0-9_]+$/i.test(part)
      ? <span key={`${part}-${index}`} className="text-[#00C853]">{part}</span>
      : <span key={`${part}-${index}`}>{part}</span>
  );
}

function AuthPrompt({ action }: { action: string }) {
  return (
    <div className="rounded-xl border border-[#00C853]/20 bg-[#00C853]/5 p-4 text-center">
      <p className="text-sm text-white/70">Log in to {action}.</p>
      <Button asChild size="sm" className="mt-3 bg-[#00C853] font-black text-black hover:bg-[#00C853]/90">
        <Link href="/login">Log In</Link>
      </Button>
    </div>
  );
}

function Avatar({ name, photoUrl, className }: { name: string; photoUrl?: string | null; className?: string }) {
  return <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#00C853]/15 font-black text-[#00C853]', className)}>{photoUrl ? <img src={photoUrl} alt={`${name} profile`} className="h-full w-full object-cover" /> : initials(name)}</div>;
}

export default function FeedPage() {
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState<MediaSelection | null>(null);
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [storyFile, setStoryFile] = useState<MediaSelection | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const storyRef = useRef<HTMLInputElement>(null);

  const postsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'feed_posts'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const storiesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'feed_stories'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const athleteProfileQuery = useMemoFirebase(() => firestore && user ? query(collection(firestore, 'athletes'), where('uid', '==', user.uid)) : null, [firestore, user]);
  const allAthleteProfilesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'athletes') : null, [firestore]);
  const userAccountRef = useMemoFirebase(() => firestore && user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const notificationsQuery = useMemoFirebase(() => firestore && user ? query(collection(firestore, 'notifications', user.uid, 'items'), orderBy('createdAt', 'desc'), limit(20)) : null, [firestore, user]);
  const { data: posts, isLoading: postsLoading } = useCollection<FeedPost>(postsQuery);
  const { data: stories } = useCollection<Story>(storiesQuery);
  const { data: athleteProfiles } = useCollection<AthleteProfile>(athleteProfileQuery);
  const { data: allAthleteProfiles } = useCollection<AthleteProfile>(allAthleteProfilesQuery);
  const { data: userAccount } = useDoc<UserAccount>(userAccountRef);
  const { data: notifications } = useCollection<FeedNotification>(notificationsQuery);
  const unreadNotifications = notifications?.filter(item => !item.isRead).length ?? 0;
  const profileHref = athleteProfiles?.[0]?.username ? `/${athleteProfiles[0].username}` : '/dashboard';
  const photoByUserId = useMemo(() => new Map((allAthleteProfiles ?? []).map(profile => [profile.uid, profile.photoUrl])), [allAthleteProfiles]);

  const roleDashboardHref = userAccount?.role === 'coach'
    ? '/coach-dashboard'
    : userAccount?.role === 'scout'
      ? '/scout-dashboard'
      : userAccount?.role === 'club'
        ? '/club-dashboard/athletes'
        : userAccount?.role === 'analyst'
          ? '/analyst-dashboard'
          : '/';
  const protectedHref = (href: string) => user ? href : '/login';

  const markNotificationsRead = async () => {
    if (!firestore || !user || !notifications?.some(item => !item.isRead)) return;
    const batch = writeBatch(firestore);
    notifications.filter(item => !item.isRead).forEach(item => batch.update(doc(firestore, 'notifications', user.uid, 'items', item.id), { isRead: true }));
    await batch.commit().catch(() => {});
  };

  const visiblePosts = useMemo(() => {
    const list = [...(posts ?? [])];
    if (activeTab === 'trending') return list.sort((a, b) => (b.likes?.length ?? 0) - (a.likes?.length ?? 0));
    if (activeTab === 'scouts') return list.filter(post => post.authorRole === 'scout');
    if (['basketball', 'football', 'athletics'].includes(activeTab)) return list.filter(post => post.sport?.toLowerCase() === activeTab);
    return list;
  }, [activeTab, posts]);

  const groupedStories = useMemo(() => {
    const groups = new Map<string, Story[]>();
    (stories ?? []).forEach(story => {
      if (Date.now() - new Date(story.createdAt).getTime() > 24 * 60 * 60 * 1000) return;
      groups.set(story.authorId, [...(groups.get(story.authorId) ?? []), story]);
    });
    return [...groups.values()];
  }, [stories]);

  const requireUser = (action: string) => {
    if (!user) { toast({ title: 'Log in required', description: `Please log in to ${action}.` }); return false; }
    return true;
  };

  const selectFile = (file: File | undefined, setter: (value: MediaSelection) => void) => {
    if (!file || !file.type.startsWith('image/') && !file.type.startsWith('video/')) return;
    setter({ file, url: URL.createObjectURL(file), type: file.type.startsWith('video/') ? 'video' : 'image' });
  };

  const createPost = async () => {
    if (!firestore || !requireUser('post')) return;
    if (!user) return;
    if (!caption.trim() && !media) return;
    setPosting(true);
    try {
      const mediaUrl = media?.file
        ? await uploadFileWithProgress(firebaseApp, `feed/${user.uid}/${crypto.randomUUID()}-${media.file.name}`, media.file, () => {})
        : media?.url;
      await addDoc(collection(firestore, 'feed_posts'), {
        authorId: user.uid, authorName: user.displayName || user.email?.split('@')[0] || 'Athlete', authorEmail: user.email, authorPhotoUrl: user.photoURL || null,
        content: caption.trim(), mediaUrl: mediaUrl || null, mediaType: media?.type || null, likes: [], commentCount: 0,
        createdAt: new Date().toISOString(),
      });
      setCaption(''); setMedia(null); toast({ title: 'Post published' });
    } catch { toast({ variant: 'destructive', title: 'Could not publish post', description: 'Please try again.' }); }
    finally { setPosting(false); }
  };

  const toggleLike = async (post: FeedPost) => {
    if (!firestore || !requireUser('like posts')) return;
    if (!user) return;
    await updateDoc(doc(firestore, 'feed_posts', post.id), { likes: post.likes?.includes(user.uid) ? arrayRemove(user.uid) : arrayUnion(user.uid) }).catch(() => toast({ variant: 'destructive', title: 'Could not update like' }));
    if (post.authorId !== user.uid && !post.likes?.includes(user.uid)) await addDoc(collection(firestore, 'notifications', post.authorId, 'items'), { type: 'like', actorId: user.uid, actorName: user.displayName || user.email, message: 'liked your post', isRead: false, createdAt: new Date().toISOString() }).catch(() => {});
  };

  const submitComment = async (post: FeedPost) => {
    if (!firestore || !requireUser('comment')) return;
    if (!user) return;
    if (!commentText.trim()) return;
    const content = commentText.trim();
    await addDoc(collection(firestore, 'feed_posts', post.id, 'comments'), { authorId: user.uid, authorName: user.displayName || user.email?.split('@')[0] || 'Member', content, parentId: replyTo || null, createdAt: new Date().toISOString() });
    await updateDoc(doc(firestore, 'feed_posts', post.id), { commentCount: (post.commentCount || 0) + 1 }).catch(() => {});
    if (post.authorId !== user.uid) await addDoc(collection(firestore, 'notifications', post.authorId, 'items'), { type: 'comment', actorId: user.uid, actorName: user.displayName || user.email, message: 'commented on your post', isRead: false, createdAt: new Date().toISOString() }).catch(() => {});
    setCommentText(''); setReplyTo(null);
  };

  const sharePost = async (post: FeedPost) => {
    const url = `${window.location.origin}/feed?post=${post.id}`;
    try { if (navigator.share) await navigator.share({ title: 'Talent Graph post', text: post.content, url }); else { await navigator.clipboard.writeText(url); toast({ title: 'Post link copied' }); } } catch { /* cancelled */ }
  };

  const publishStory = async () => {
    if (!firestore || !storyFile || !requireUser('post a story')) return;
    if (!user) return;
    const mediaUrl = storyFile.file
      ? await uploadFileWithProgress(firebaseApp, `stories/${user.uid}/${crypto.randomUUID()}-${storyFile.file.name}`, storyFile.file, () => {})
      : storyFile.url;
    await addDoc(collection(firestore, 'feed_stories'), { authorId: user.uid, authorName: user.displayName || user.email?.split('@')[0] || 'Athlete', authorPhotoUrl: user.photoURL || null, mediaUrl, mediaType: storyFile.type, createdAt: new Date().toISOString() });
    setStoryFile(null); toast({ title: 'Story added for 24 hours' });
  };

  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-lg font-black uppercase tracking-wide"><span className="mr-2 text-[#00C853]">⚡</span>Talent Graph</Link>
          <nav className="hidden items-center gap-7 text-sm font-bold text-[#94A3B8] md:flex"><Link href="/" className="hover:text-white">Home</Link><Link href="/feed" className="text-[#00C853]">Feeds</Link><Link href="/athletes" className="hover:text-white">Athletes</Link><Link href="/scout-dashboard" className="hover:text-white">Discovery</Link></nav>
          <div className="relative flex items-center gap-3">{user ? <Link href="/dashboard" className="text-sm font-bold text-[#94A3B8] hover:text-white">My Dashboard</Link> : <Button asChild size="sm" className="bg-[#00C853] font-black text-black"><Link href="/login">Log In</Link></Button>}<button onClick={() => { setNotificationsOpen(value => !value); if (!notificationsOpen) markNotificationsRead(); }} className="relative text-[#94A3B8] hover:text-white" aria-label="Notifications"><Bell className="h-5 w-5" />{user && unreadNotifications > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00C853] px-1 text-[9px] font-black text-black">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>}</button>{notificationsOpen && user && <div className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-2xl border border-[#334155] bg-[#1E293B] shadow-2xl"><div className="flex items-center justify-between border-b border-[#334155] px-4 py-3"><span className="text-xs font-black uppercase tracking-widest">Notifications</span><button onClick={() => setNotificationsOpen(false)}><X className="h-4 w-4 text-[#94A3B8]" /></button></div><div className="max-h-72 overflow-y-auto">{notifications?.length ? notifications.map(item => <div key={item.id} className="border-b border-[#334155] px-4 py-3 text-xs"><span className="font-black">{item.actorName || 'Someone'}</span> {item.message}<p className="mt-1 text-[10px] text-[#94A3B8]">{timeAgo(item.createdAt)}</p></div>) : <p className="p-5 text-center text-sm text-[#94A3B8]">No notifications yet.</p>}</div></div>}</div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 pb-24 pt-8 sm:px-6 md:pb-8 lg:grid-cols-4">
        <aside className="hidden space-y-6 lg:col-span-1 lg:block">
          <div className="overflow-hidden rounded-2xl border border-[#334155] bg-[#1E293B]"><div className="h-16 bg-gradient-to-r from-[#334155] to-[#1E293B]" /><div className="relative p-5 pt-10"><Avatar name={user?.displayName || user?.email || 'Guest'} photoUrl={user?.photoURL} className="absolute -top-8 h-16 w-16 border-4 border-[#1E293B] text-2xl" /><h2 className="truncate text-lg font-black">{user ? user.displayName || user.email?.split('@')[0] : 'Join the Network'}</h2><p className="truncate text-sm text-[#94A3B8]">{user?.email || 'Connect with athletes and scouts globally.'}</p></div></div>
          <nav className="rounded-2xl border border-[#334155] bg-[#1E293B] p-3"><Link href="/feed" className="flex items-center gap-3 rounded-xl bg-[#00C853]/10 px-4 py-3 font-bold text-[#00C853]"><Search className="h-5 w-5" /> Home Feed</Link><Link href="/athletes" className="flex items-center gap-3 px-4 py-3 text-[#94A3B8] hover:text-white"><Search className="h-5 w-5" /> Discover Talent</Link>{user && <Link href={profileHref} className="flex items-center gap-3 px-4 py-3 text-[#94A3B8] hover:text-white"><UserRound className="h-5 w-5" /> My Profile</Link>}{user && <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#94A3B8] hover:text-white"><Users className="h-5 w-5" /> My Dashboard</Link>}</nav>
        </aside>

        <section className="space-y-6 lg:col-span-2">
          <h1 className="text-center text-3xl font-black uppercase tracking-tight lg:hidden">Community Feed</h1>
          <div className="rounded-2xl border border-[#334155] bg-[#1E293B] p-4"><div className="flex gap-4 overflow-x-auto">{user && <label className="flex shrink-0 cursor-pointer flex-col items-center gap-1 text-xs font-bold text-[#94A3B8]"><div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#64748B] text-2xl hover:border-[#00C853]"><input ref={storyRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => selectFile(e.target.files?.[0], setStoryFile)} />+</div>Add Story</label>}{groupedStories.map((group, index) => <button key={group[0].authorId} onClick={() => setStoryIndex(index)} className="flex shrink-0 flex-col items-center gap-1 text-xs font-bold"><Avatar name={group[0].authorName} photoUrl={group[0].authorPhotoUrl || photoByUserId.get(group[0].authorId)} className="h-14 w-14 border-2 border-[#00C853]" /><span className="max-w-16 truncate">{group[0].authorName.split(' ')[0]}</span></button>)}</div>{storyFile && <div className="mt-3 flex items-center justify-between rounded-xl bg-[#0A1224] p-3"><span className="text-sm">Story ready to publish</span><Button size="sm" onClick={publishStory} className="bg-[#00C853] font-black text-black">Publish</Button></div>}</div>
          {!user && !isUserLoading ? <div className="rounded-2xl border border-[#334155] bg-[#1E293B] p-5"><AuthPrompt action="share an update" /></div> : <div className="rounded-2xl border border-[#334155] bg-[#1E293B] p-5"><div className="flex gap-3"><Avatar name={user?.displayName || user?.email || 'You'} photoUrl={user?.photoURL} /><Textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="What's happening in your sports journey?" className="min-h-20 resize-none border-0 bg-transparent text-white placeholder:text-[#94A3B8] focus-visible:ring-0" /></div>{media && <div className="relative ml-13 mt-3 overflow-hidden rounded-xl"><button onClick={() => setMedia(null)} className="absolute right-2 top-2 z-10 rounded-full bg-black/70 p-1"><X className="h-4 w-4" /></button>{media.type === 'image' ? <img src={media.url} alt="Selected highlight" className="max-h-64 w-full object-cover" /> : <video src={media.url} controls className="max-h-64 w-full" />}</div>}<div className="mt-3 flex items-center justify-between border-t border-[#334155] pt-3"><button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 text-sm font-bold text-[#94A3B8] hover:text-[#00C853]"><ImageIcon className="h-5 w-5" /> Photo / Video</button><input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => selectFile(e.target.files?.[0], setMedia)} /><Button onClick={createPost} disabled={posting || (!caption.trim() && !media)} className="rounded-full bg-[#00C853] font-black text-black">{posting ? 'Posting...' : 'Post'}</Button></div></div>}
          <div className="flex gap-2 overflow-x-auto border-b border-[#334155] pb-2">{tabs.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition-colors', activeTab === tab.id ? 'border-[#00C853] bg-[#1E293B] text-white' : 'border-transparent text-[#94A3B8] hover:bg-[#1E293B] hover:text-white')}>{tab.icon && <tab.icon className="h-4 w-4" />}{tab.label}</button>)}</div>
          {postsLoading ? <div className="py-20 text-center text-[#94A3B8]">Loading the community feed...</div> : visiblePosts.map(post => <FeedPostCard key={post.id} post={{ ...post, authorPhotoUrl: post.authorPhotoUrl || photoByUserId.get(post.authorId) }} user={user} firestore={firestore} openComments={openComments === post.id} onToggleComments={() => setOpenComments(openComments === post.id ? null : post.id)} onLike={() => toggleLike(post)} onShare={() => sharePost(post)} commentText={commentText} setCommentText={setCommentText} replyTo={replyTo} setReplyTo={setReplyTo} onComment={() => submitComment(post)} />)}
          {!postsLoading && visiblePosts.length === 0 && <div className="rounded-2xl border border-[#334155] bg-[#1E293B] py-20 text-center text-[#94A3B8]">No posts match this filter yet.</div>}
        </section>

        <aside className="hidden lg:col-span-1 lg:block"><div className="rounded-2xl border border-[#334155] bg-[#1E293B] p-4"><h2 className="flex items-center gap-2 font-black uppercase"><Flame className="h-4 w-4 text-[#00C853]" /> Trending Athletes</h2><div className="mt-4 space-y-4"><div className="flex items-center gap-3"><Avatar name="James Njoroge" className="h-10 w-10 bg-[#0A1224] text-white" /><div><p className="text-sm font-black">James Njoroge</p><p className="text-xs text-[#94A3B8]">Point Guard · 85% Dev</p></div></div><div className="flex items-center gap-3"><Avatar name="Sarah Mutuku" className="h-10 w-10 bg-[#0A1224] text-white" /><div><p className="text-sm font-black">Sarah Mutuku</p><p className="text-xs text-[#94A3B8]">100m Sprint · Elite</p></div></div></div></div><p className="mt-6 text-xs leading-relaxed text-[#94A3B8]">Privacy · Terms · Contact<br />Talent Graph © 2026</p></aside>
      </main>

      {storyIndex !== null && groupedStories[storyIndex] && <StoryViewer stories={groupedStories[storyIndex]} onClose={() => setStoryIndex(null)} />}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E2E8F0] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur-md md:hidden" aria-label="Feed navigation">
        <div className="mx-auto flex h-16 max-w-lg items-stretch">
          {[
            { label: 'Home', href: '/feed', icon: House },
            { label: 'Discover Talent', href: '/athletes', icon: Compass },
            { label: 'Profile', href: protectedHref(roleDashboardHref), icon: UserRound },
            { label: 'Inbox', href: protectedHref('/chat'), icon: Inbox },
            { label: 'Dashboard', href: protectedHref(roleDashboardHref), icon: LayoutDashboard },
          ].map(item => {
            const active = item.label === 'Home';
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-center transition-colors',
                  active ? 'text-[#00C853]' : 'text-[#94A3B8] hover:text-white'
                )}
              >
                <item.icon className={cn('h-5 w-5', active && 'scale-110')} />
                <span className="w-full truncate text-[9px] font-black uppercase tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function FeedPostCard({ post, user, firestore, openComments, onToggleComments, onLike, onShare, commentText, setCommentText, replyTo, setReplyTo, onComment }: any) {
  const commentsQuery = useMemoFirebase(() => firestore && openComments ? query(collection(firestore, 'feed_posts', post.id, 'comments'), orderBy('createdAt', 'asc')) : null, [firestore, openComments, post.id]);
  const { data: comments } = useCollection<FeedComment>(commentsQuery);
  const liked = !!user && post.likes?.includes(user.uid);
  const topComments = (comments ?? []).filter((comment: FeedComment) => !comment.parentId);
  return <article className="overflow-hidden rounded-2xl border border-[#334155] bg-[#1E293B] shadow-sm"><div className="flex items-start justify-between p-5"><div className="flex items-center gap-3"><Avatar name={post.authorName} photoUrl={post.authorPhotoUrl} /><div><p className="font-black">{post.authorName}</p><p className="flex items-center gap-2 text-xs text-[#94A3B8]">{timeAgo(post.createdAt)} <Globe2 className="h-3 w-3" /></p></div></div>{post.authorRole === 'scout' && <span className="rounded-full bg-blue-400/10 px-2 py-1 text-[10px] font-black uppercase text-blue-300">Verified Scout</span>}</div><div className="px-5 pb-4"><p className="whitespace-pre-wrap text-[15px] leading-relaxed">{contentWithHashtags(post.content)}</p></div>{post.mediaUrl && <div className="border-y border-[#334155] bg-black">{post.mediaType === 'video' ? <video src={post.mediaUrl} controls className="max-h-[600px] w-full object-contain" /> : <img src={post.mediaUrl} alt="Post highlight" className="max-h-[600px] w-full object-contain" />}</div>}<div className="flex items-center gap-2 border-t border-[#334155] px-3 py-2"><button onClick={onLike} className={cn('flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-transform hover:bg-[#00C853]/10 active:scale-95', liked ? 'text-[#00C853]' : 'text-[#94A3B8')}><ThumbsUp className="h-4 w-4" />{post.likes?.length ? post.likes.length : 'Like'}</button><button onClick={onToggleComments} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-[#94A3B8] hover:bg-white/5 hover:text-white"><MessageCircle className="h-4 w-4" />{post.commentCount || 'Comment'}</button><button onClick={onShare} className="ml-auto flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-[#94A3B8] hover:bg-white/5 hover:text-white"><Share2 className="h-4 w-4" />Share</button></div>{openComments && <div className="border-t border-[#334155] p-4">{user ? <div className="mb-4 flex gap-2"><Textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder={replyTo ? 'Write a reply with @mentions...' : 'Write a comment with @mentions...'} className="min-h-10 resize-none border-[#334155] bg-[#0A1224] text-sm" /><Button onClick={onComment} size="icon" className="shrink-0 bg-[#00C853] text-black"><Send className="h-4 w-4" /></Button></div> : <AuthPrompt action="comment" />}<div className="space-y-3">{topComments.map((comment: FeedComment) => <div key={comment.id} className="rounded-xl bg-[#0A1224]/60 p-3"><div className="flex items-center gap-2"><Avatar name={comment.authorName} className="h-7 w-7 text-[10px]" /><span className="text-sm font-black">{comment.authorName}</span><span className="text-[10px] text-[#94A3B8]">{timeAgo(comment.createdAt)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm">{contentWithHashtags(comment.content)}</p>{user && <button onClick={() => setReplyTo(comment.id)} className="mt-2 text-xs font-bold text-[#00C853]">Reply</button>}{(comments ?? []).filter((reply: FeedComment) => reply.parentId === comment.id).map((reply: FeedComment) => <div key={reply.id} className="ml-8 mt-3 border-l-2 border-[#334155] pl-3"><span className="text-xs font-black">{reply.authorName}</span><span className="ml-2 text-[10px] text-[#94A3B8]">{timeAgo(reply.createdAt)}</span><p className="mt-1 text-sm">{contentWithHashtags(reply.content)}</p></div>)}</div>)}</div></div>}</article>;
}

function StoryViewer({ stories, onClose }: { stories: Story[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const story = stories[index];
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"><div className="relative flex h-[85vh] w-full max-w-md items-center justify-center overflow-hidden rounded-3xl bg-black"><div className="absolute left-0 right-0 top-0 z-10 flex gap-1 p-3">{stories.map((item, i) => <div key={item.id} className={cn('h-1 flex-1 rounded-full', i <= index ? 'bg-white' : 'bg-white/30')} />)}</div><div className="absolute left-4 right-4 top-7 z-10 flex items-center justify-between"><span className="font-black">{story.authorName}</span><button onClick={onClose} className="rounded-full bg-black/50 p-2"><X className="h-5 w-5" /></button></div>{story.mediaType === 'video' ? <video src={story.mediaUrl} autoPlay controls className="h-full w-full object-contain" /> : <img src={story.mediaUrl} alt="Story" className="h-full w-full object-contain" />}<button className="absolute inset-y-0 left-0 w-1/3" onClick={() => setIndex(Math.max(0, index - 1))}><ChevronLeft className="h-6 w-6" /></button><button className="absolute inset-y-0 right-0 w-1/3" onClick={() => index + 1 >= stories.length ? onClose() : setIndex(index + 1)}><ChevronRight className="ml-auto h-6 w-6" /></button></div></div>;
}