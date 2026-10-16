'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  limit,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import type { AthleteProfile, UserAccount } from '@/lib/types';
import { AthleteProfileTab } from '@/components/dashboard/athlete-profile-tab';

interface StoryItem {
  id: string;
  name: string;
  avatar: string;
  image: string;
  caption: string;
}

export interface FirestorePost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  authorAvatar?: string;
  authorEmail?: string;
  verified?: boolean;
  category?: 'football' | 'scouting' | 'training' | 'basketball' | string;
  styleType?: 'gold' | 'neon' | 'fire' | 'scout';
  badgeText?: string;
  platform?: string;
  content: string;
  videoUrl?: string;
  videoThumb?: string;
  videoTitle?: string;
  imageUrl?: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video' | 'image';
  effect?: 'spotlight' | 'warm' | 'bw' | 'none';
  likes?: string[];
  likesCount?: number;
  commentsCount?: number;
  createdAt: string;
  recentComments?: Array<{
    id: string;
    author: string;
    authorColor?: string;
    time: string;
    text: string;
  }>;
}

interface FirestoreNotification {
  id: string;
  title?: string;
  message?: string;
  text?: string;
  body?: string;
  actorName?: string;
  isRead?: boolean;
  createdAt?: string;
}

export default function FeedPage() {
  const [, setLocation] = useLocation();
  const firestore = useFirestore();
  const { user } = useUser();

  // Active Tab: 'feed' | 'profile' | 'analytics' | 'alerts'
  const [activeTab, setActiveTab] = useState<'feed' | 'profile' | 'analytics' | 'alerts'>('feed');

  // Search & Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'football' | 'scouting' | 'training' | 'basketball'>('all');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoData, setVideoData] = useState<{ title: string; src?: string; thumb?: string }>({ title: '' });
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [storyData, setStoryData] = useState<{ name: string; image: string; caption: string }>({ name: '', image: '', caption: '' });
  const [messagesModalOpen, setMessagesModalOpen] = useState(false);

  // Create Post Form State
  const [postContent, setPostContent] = useState('');
  const [currentPlatform, setCurrentPlatform] = useState<'TalentGraph' | 'Twitter/X' | 'Instagram'>('TalentGraph');
  const [currentStyle, setCurrentStyle] = useState<'gold' | 'neon' | 'fire' | 'scout'>('gold');
  const [currentEffect, setCurrentEffect] = useState<'none' | 'spotlight' | 'warm' | 'bw'>('none');
  const [attachedMediaType, setAttachedMediaType] = useState<'photo' | 'video' | null>(null);
  const [attachedMediaUrl, setAttachedMediaUrl] = useState<string>('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Expanded comments accordion state: Record<postId, boolean>
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // ── Firebase Real-Time Posts Query ──
  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'feed_posts'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore]);

  const { data: realPosts, isLoading: isPostsLoading } = useCollection<FirestorePost>(postsQuery);

  // ── Real Notifications Query ──
  const notifsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'notifications', user.uid, 'items'), orderBy('createdAt', 'desc'), limit(30));
  }, [firestore, user?.uid]);

  const { data: realNotifications, isLoading: isNotifsLoading } = useCollection<FirestoreNotification>(notifsQuery);
  const unreadAlertsCount = realNotifications?.filter((n) => !n.isRead).length || 0;

  // ── Stories query from Firebase ──
  const storiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'feed_stories'), orderBy('createdAt', 'desc'), limit(15));
  }, [firestore]);

  const { data: realStories } = useCollection<StoryItem>(storiesQuery);

  // ── Real Athletes Query from Firestore ──
  const athletesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'athletes'), limit(25));
  }, [firestore]);

  const { data: dbAthletes, isLoading: isAthletesLoading } = useCollection<AthleteProfile>(athletesQuery);

  // ── Current Authenticated Athlete Profile ──
  const currentAthleteDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'athletes', user.uid);
  }, [firestore, user?.uid]);
  const { data: currentAthleteProfile } = useDoc<AthleteProfile>(currentAthleteDocRef);

  // ── User Account Query for Role-Based Navigation ──
  const userAccountDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: userAccount } = useDoc<UserAccount>(userAccountDocRef);

  const handleProfileClick = () => {
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    const role = userAccount?.role || (currentAthleteProfile ? 'athlete' : 'athlete');
    if (role === 'coach') {
      window.location.href = '/coach-dashboard';
    } else if (role === 'scout') {
      window.location.href = '/scout-dashboard';
    } else if (role === 'analyst') {
      window.location.href = '/analyst-dashboard';
    } else {
      window.location.href = '/?tab=profile';
    }
  };

  // ── Most Active Trending Athletes Computation ──
  const trendingAthletes = useMemo(() => {
    const postCountByAuthor: Record<string, number> = {};
    const likesByAuthor: Record<string, number> = {};

    realPosts?.forEach((post) => {
      if (post.authorId) {
        postCountByAuthor[post.authorId] = (postCountByAuthor[post.authorId] || 0) + 1;
        likesByAuthor[post.authorId] = (likesByAuthor[post.authorId] || 0) + (post.likesCount || post.likes?.length || 0);
      }
    });

    const map = new Map<string, {
      uid: string;
      name: string;
      username: string;
      photoUrl?: string;
      sport: string;
      position?: string;
      devScore: number;
      activityCount: number;
    }>();

    // 1. Registered athletes from Firestore
    if (dbAthletes && dbAthletes.length > 0) {
      dbAthletes.forEach((ath) => {
        const postsCount = postCountByAuthor[ath.uid] || 0;
        const totalLikes = likesByAuthor[ath.uid] || 0;
        const baseScore = ath.isVerified ? 85 : 72;
        const activityBonus = Math.min(14, postsCount * 3 + Math.floor(totalLikes / 2));
        const devScore = Math.min(99, baseScore + activityBonus);

        map.set(ath.uid, {
          uid: ath.uid,
          name: `${ath.firstName || ''} ${ath.lastName || ''}`.trim() || ath.username || 'Athlete',
          username: ath.username || ath.uid,
          photoUrl: ath.photoUrl,
          sport: ath.sport || 'Athlete',
          position: ath.position,
          devScore,
          activityCount: postsCount,
        });
      });
    }

    // 2. Active authors in realPosts
    realPosts?.forEach((post) => {
      if (post.authorId && !map.has(post.authorId)) {
        const postsCount = postCountByAuthor[post.authorId] || 1;
        const totalLikes = likesByAuthor[post.authorId] || 0;
        const baseScore = post.verified ? 88 : 78;
        const devScore = Math.min(98, baseScore + postsCount * 2 + Math.min(8, totalLikes));

        map.set(post.authorId, {
          uid: post.authorId,
          name: post.authorName || 'Athlete',
          username: post.authorName ? post.authorName.toLowerCase().replace(/\s+/g, '') : post.authorId,
          photoUrl: post.authorAvatar,
          sport: post.category || 'Football',
          devScore,
          activityCount: postsCount,
        });
      }
    });

    // 3. Sort strictly by most active (highest activity count, then devScore)
    return Array.from(map.values())
      .sort((a, b) => b.activityCount - a.activityCount || b.devScore - a.devScore)
      .slice(0, 5);
  }, [dbAthletes, realPosts]);

  const displayStories: StoryItem[] = useMemo(() => {
    if (realStories && realStories.length > 0) return realStories;
    return [
      {
        id: 's1',
        name: 'James',
        avatar: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800',
        caption: 'Matchday Preparations',
      },
      {
        id: 's2',
        name: 'Sarah',
        avatar: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800',
        image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800',
        caption: 'Agility & Ladder Drill Session',
      },
      {
        id: 's3',
        name: 'Marcus',
        avatar: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800',
        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800',
        caption: 'Tactical Board Breakdown',
      },
      {
        id: 's4',
        name: 'Trials',
        avatar: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
        caption: 'Regional Trials Final',
      },
    ];
  }, [realStories]);

  // Filtered Real Posts
  const filteredPosts = useMemo(() => {
    if (!realPosts) return [];
    return realPosts.filter((post) => {
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      const term = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !term ||
        post.content?.toLowerCase().includes(term) ||
        post.authorName?.toLowerCase().includes(term) ||
        post.category?.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [realPosts, selectedCategory, searchQuery]);

  // Real Analytics calculations
  const myPosts = useMemo(() => {
    if (!user || !realPosts) return [];
    return realPosts.filter((p) => p.authorId === user.uid);
  }, [user, realPosts]);

  const totalNetworkLikes = useMemo(() => {
    if (!realPosts) return 0;
    return realPosts.reduce((acc, p) => acc + (p.likesCount || p.likes?.length || 0), 0);
  }, [realPosts]);

  const totalNetworkComments = useMemo(() => {
    if (!realPosts) return 0;
    return realPosts.reduce((acc, p) => acc + (p.commentsCount || p.recentComments?.length || 0), 0);
  }, [realPosts]);

  const uniqueCreatorsCount = useMemo(() => {
    if (!realPosts) return 0;
    return new Set(realPosts.map((p) => p.authorId).filter(Boolean)).size;
  }, [realPosts]);

  const myTotalLikes = useMemo(() => {
    return myPosts.reduce((acc, p) => acc + (p.likesCount || p.likes?.length || 0), 0);
  }, [myPosts]);

  const myTotalComments = useMemo(() => {
    return myPosts.reduce((acc, p) => acc + (p.commentsCount || p.recentComments?.length || 0), 0);
  }, [myPosts]);

  // ── Handlers ──
  const requireAuth = (callback: () => void) => {
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    callback();
  };

  const handleOpenCreateModal = (type?: 'photo' | 'video' | 'effects') => {
    requireAuth(() => {
      if (type === 'effects') {
        setCurrentEffect('spotlight');
      } else if (type === 'photo' || type === 'video') {
        triggerFileInput(type);
      }
      setCreateModalOpen(true);
    });
  };

  const triggerFileInput = (type?: 'photo' | 'video') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'video' ? 'video/*' : type === 'photo' ? 'image/*' : 'image/*,video/*';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (isVideo) {
      setAttachedMediaType('video');
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setAttachedMediaUrl(url);
        setMediaPreview(url);
        showToast('Video attached!');
      };
      reader.readAsDataURL(file);
    } else if (isImage) {
      setAttachedMediaType('photo');
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setAttachedMediaUrl(url);
        setMediaPreview(url);
        showToast('Photo attached!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLikeToggle = async (postId: string) => {
    if (!firestore) return;
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }

    const targetPost = realPosts?.find((p) => p.id === postId);
    if (!targetPost) return;

    const currentLikes = targetPost.likes || [];
    const hasLiked = currentLikes.includes(user.uid);
    const newCount = hasLiked
      ? Math.max(0, (targetPost.likesCount || 1) - 1)
      : (targetPost.likesCount || 0) + 1;

    try {
      const postRef = doc(firestore, 'feed_posts', postId);
      await updateDoc(postRef, {
        likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
        likesCount: newCount,
      });
      if (!hasLiked) {
        showToast('Liked post!');
      }
    } catch (err) {
      console.error('Error updating like:', err);
      showToast('Could not update like.');
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    if (!firestore) return;
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }

    const authorName = user.displayName || user.email?.split('@')[0] || 'Athlete';
    const newComment = {
      id: `comment-${Date.now()}`,
      author: authorName,
      authorColor: 'text-amber-400',
      time: 'Just now',
      text,
    };

    try {
      const postRef = doc(firestore, 'feed_posts', postId);
      const targetPost = realPosts?.find((p) => p.id === postId);
      const existingComments = targetPost?.recentComments || [];

      await updateDoc(postRef, {
        commentsCount: (targetPost?.commentsCount || 0) + 1,
        recentComments: [newComment, ...existingComments.slice(0, 8)],
      });

      // Also persist to subcollection
      await addDoc(collection(firestore, 'feed_posts', postId, 'comments'), {
        authorId: user.uid,
        authorName,
        authorAvatar: user.photoURL || '',
        text,
        createdAt: new Date().toISOString(),
      });

      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      showToast('Comment posted!');
    } catch (err) {
      console.error('Error posting comment:', err);
      showToast('Could not post comment.');
    }
  };

  const handleShare = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    showToast('Post link copied to clipboard!');
  };

  const handlePublishPost = async () => {
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    if (!postContent.trim() && !attachedMediaUrl) {
      showToast('Please enter post text or attach photo/video.');
      return;
    }
    if (!firestore) {
      showToast('Database not connected.');
      return;
    }

    setIsPublishing(true);
    try {
      const authorName = user.displayName || user.email?.split('@')[0] || 'Verified Athlete';
      const authorAvatar = user.photoURL || '';

      const isVideo = attachedMediaType === 'video';
      const isPhoto = attachedMediaType === 'photo';

      const newPostData = {
        authorId: user.uid,
        authorName,
        authorAvatar,
        authorEmail: user.email || '',
        authorRole: 'Senior 1st XI',
        verified: true,
        category: selectedCategory === 'all' ? 'football' : selectedCategory,
        styleType: currentStyle,
        badgeText:
          currentStyle === 'gold'
            ? '🏆 CHAMPION REEL'
            : currentStyle === 'neon'
            ? '⚡ PRO ATHLETE'
            : currentStyle === 'fire'
            ? '🔥 MATCHDAY HIGHLIGHT'
            : '⭐ FKF VERIFIED',
        platform: currentPlatform,
        content: postContent.trim(),
        imageUrl: isPhoto ? attachedMediaUrl : null,
        videoUrl: isVideo ? attachedMediaUrl : null,
        videoThumb: isVideo ? attachedMediaUrl : null,
        mediaUrl: attachedMediaUrl || null,
        mediaType: attachedMediaType || null,
        videoTitle: isVideo ? 'Verified Match & Drill Reel' : null,
        effect: currentEffect,
        likes: [user.uid],
        likesCount: 1,
        commentsCount: 0,
        recentComments: [],
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(firestore, 'feed_posts'), newPostData);
      setPostContent('');
      setAttachedMediaType(null);
      setAttachedMediaUrl('');
      setMediaPreview(null);
      setCreateModalOpen(false);
      showToast('Post published to verified feed stream!');
    } catch (err) {
      console.error('Error publishing post:', err);
      showToast('Failed to publish post. Please check permissions.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="bg-[#020617] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-amber-400 selection:text-slate-950 pb-20 font-sans">
      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        .vignette-spotlight {
          background: radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.85) 100%);
        }
        .filter-warm { filter: sepia(0.3) saturate(1.4) hue-rotate(-10deg); }
        .filter-bw { filter: grayscale(1) contrast(1.25); }
        .filter-cyber { filter: contrast(1.3) saturate(1.8) hue-rotate(180deg); }
        .filter-vintage { filter: sepia(0.5) contrast(1.1) brightness(0.9); }
      `}</style>

      {/* Hidden File Picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*"
      />

      {/* ========================================================================= */}
      {/* 1. TOP APP BAR (EXACT AS Jetpack Compose TopAppBar) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#020617]/95 backdrop-blur-md border-b border-[#334155]">
        <div className="max-w-2xl mx-auto px-3.5 h-16 flex items-center justify-between gap-2.5">
          {/* 1. Home Icon */}
          <button
            onClick={() => setLocation('/')}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-300 transition shrink-0 cursor-pointer"
            title="Home"
          >
            <i className="fa-solid fa-house text-lg"></i>
          </button>

          {/* 2. Talent Graph Logo */}
          <Link href="/" className="w-9 h-9 rounded-xl bg-black p-0.5 border border-[#38BDF8]/50 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/10 cursor-pointer">
            <img
              src="/icons/logo-transparent.png"
              alt="Talent Graph"
              className="w-full h-full object-contain"
            />
          </Link>

          {/* 3. Search Bar */}
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-2.5 text-slate-400 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feed, athletes, drills..."
              className="w-full bg-[#0F172A] border border-[#334155] rounded-full pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            )}
          </div>

          {/* 4. Messaging Icon */}
          <button
            onClick={() => setMessagesModalOpen(true)}
            className="relative p-2 rounded-full hover:bg-slate-800 text-slate-300 transition shrink-0 cursor-pointer"
            title="Messages"
          >
            <i className="fa-regular fa-comment-dots text-lg"></i>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#020617]"></span>
          </button>

          {/* 5. User Profile Icon - Reflects Real User Online Status or Log In Button */}
          {user ? (
            <button
              onClick={handleProfileClick}
              className="relative shrink-0 group cursor-pointer"
              title={user.displayName || user.email || 'My Profile'}
            >
              <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-emerald-500 overflow-hidden flex items-center justify-center p-0.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-xs font-black text-amber-400">
                    {(user.displayName || user.email || 'TG').slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              {/* Real Online Status Indicator */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#22C55E] ring-2 ring-[#020617]"></span>
            </button>
          ) : (
            <Button
              onClick={() => setLocation('/login')}
              size="sm"
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3.5 h-8 rounded-full cursor-pointer shrink-0"
            >
              Log In
            </Button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT CONTAINER */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-3.5 py-4 space-y-4">
        {/* ===================================================================== */}
        {/* TAB 1: FEED STREAM */}
        {/* ===================================================================== */}
        {activeTab === 'feed' && (
          <section id="tab-feed" className="space-y-4">
            {/* STORIES REEL */}
            <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-3 shadow-lg">
              <div className="flex items-center space-x-3 overflow-x-auto scrollbar-none py-1">
                {/* Add Story Item */}
                <div
                  onClick={() => handleOpenCreateModal('photo')}
                  className="flex flex-col items-center space-y-1.5 cursor-pointer shrink-0"
                >
                  <div className="w-[60px] h-[60px] rounded-full bg-[#020617] border-2 border-[#334155] border-dashed hover:border-amber-400 flex items-center justify-center transition">
                    <i className="fa-solid fa-plus text-amber-400 text-lg"></i>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">Add Story</span>
                </div>

                {/* Stories from list */}
                {displayStories.map((story, idx) => (
                  <div
                    key={story.id || `story-${idx}`}
                    onClick={() => {
                      setStoryData({ name: story.name, image: story.image, caption: story.caption });
                      setStoryModalOpen(true);
                    }}
                    className="flex flex-col items-center space-y-1.5 cursor-pointer shrink-0 group"
                  >
                    <div className="w-[64px] h-[64px] rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-rose-500 to-sky-400 group-hover:scale-105 transition shadow-md">
                      <img
                        src={story.avatar}
                        alt={story.name}
                        className="w-full h-full object-cover rounded-full border-2 border-[#020617]"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-white truncate w-16 text-center">{story.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CREATE POST BOX (With Real Auth Gate & Real User Avatar) */}
            {user ? (
              <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-4 shadow-lg space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-amber-400 overflow-hidden bg-slate-800 flex items-center justify-center shrink-0">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-black text-amber-400">
                        {(user.displayName || user.email || 'TG').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenCreateModal()}
                    className="flex-1 bg-[#020617] border border-[#334155] rounded-xl px-4 py-2.5 text-left text-xs text-slate-400 hover:border-slate-400 transition cursor-pointer"
                  >
                    Share training highlight or match update...
                  </button>
                </div>

                {/* Quick Action Buttons Row */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    {/* Photo Button */}
                    <button
                      onClick={() => handleOpenCreateModal('photo')}
                      className="flex items-center space-x-1.5 bg-[#020617] border border-[#334155] hover:border-amber-400 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition cursor-pointer"
                    >
                      <i className="fa-solid fa-camera text-amber-400 text-xs"></i>
                      <span>Photo</span>
                    </button>
                    {/* Video Reel Button */}
                    <button
                      onClick={() => handleOpenCreateModal('video')}
                      className="flex items-center space-x-1.5 bg-[#020617] border border-[#334155] hover:border-purple-400 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition cursor-pointer"
                    >
                      <i className="fa-solid fa-video text-purple-400 text-xs"></i>
                      <span>Video</span>
                    </button>
                    {/* Effects Button */}
                    <button
                      onClick={() => handleOpenCreateModal('effects')}
                      className="flex items-center space-x-1.5 bg-[#020617] border border-[#334155] hover:border-sky-400 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition cursor-pointer"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles text-sky-400 text-xs"></i>
                      <span>Effects</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenCreateModal()}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-1.5 rounded-full text-xs transition shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    + Create
                  </button>
                </div>
              </div>
            ) : (
              /* Gated State for Non-logged in users */
              <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#020617] border border-[#334155] flex items-center justify-center text-slate-400 shrink-0">
                    <i className="fa-solid fa-user text-sm"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Join the Verified Network</h4>
                    <p className="text-[11px] text-slate-400">Log in to publish match updates, training reels, and get scouted.</p>
                  </div>
                </div>
                <Button
                  onClick={() => setLocation('/login')}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 h-8 rounded-full cursor-pointer shrink-0"
                >
                  Log In to Post
                </Button>
              </div>
            )}

            {/* CATEGORY FILTER CHIPS */}
            <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-0.5">
              {(['all', 'football', 'scouting', 'training', 'basketball'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition capitalize cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-[#0F172A] border border-[#334155] text-slate-400 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>

            {/* REAL POSTS STREAM FROM FIREBASE */}
            <div id="postsStream" className="space-y-4">
              {isPostsLoading && (
                <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-8 text-center text-xs text-slate-400 animate-pulse">
                  <i className="fa-solid fa-circle-notch fa-spin text-amber-400 text-lg mb-2"></i>
                  <p>Fetching real-time verified posts from Firebase...</p>
                </div>
              )}

              {!isPostsLoading && (!realPosts || realPosts.length === 0) && (
                <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto text-xl">
                    <i className="fa-solid fa-newspaper"></i>
                  </div>
                  <h4 className="text-sm font-bold text-white">No Posts in Firebase Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {user
                      ? 'Be the first athlete to publish a training highlight or matchday performance to the network.'
                      : 'Log in to publish the first verified training drill or match highlight.'}
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => handleOpenCreateModal()}
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2 rounded-full text-xs transition cursor-pointer"
                    >
                      {user ? '+ Create Post' : 'Log In to Create Post'}
                    </button>
                  </div>
                </div>
              )}

              {!isPostsLoading && filteredPosts.length === 0 && realPosts && realPosts.length > 0 && (
                <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-8 text-center text-xs text-slate-400">
                  No posts found matching the filter "{selectedCategory !== 'all' ? selectedCategory : searchQuery}".
                </div>
              )}

              {filteredPosts.map((post) => {
                const isGold = post.styleType === 'gold';
                const isNeon = post.styleType === 'neon';
                const isPostLiked = user ? post.likes?.includes(user.uid) : false;
                const isCommentsOpen = !!openComments[post.id];
                const commentsList = post.recentComments || [];

                const hasVideo = !!(post.videoUrl || post.videoThumb || (post.mediaType === 'video' && post.mediaUrl));
                const videoSource = post.videoUrl || post.mediaUrl || '';
                const videoPoster = post.videoThumb || post.mediaUrl || '';

                const hasPhoto = !!(post.imageUrl || (post.mediaType !== 'video' && post.mediaUrl)) && !hasVideo;
                const photoSource = post.imageUrl || post.mediaUrl || '';

                return (
                  <article
                    key={post.id}
                    className={`post-card bg-[#0F172A] rounded-2xl p-4 shadow-xl space-y-3 border-2 ${
                      isGold
                        ? 'border-[#F59E0B]'
                        : isNeon
                        ? 'border-[#38BDF8]'
                        : post.styleType === 'fire'
                        ? 'border-orange-500'
                        : 'border-emerald-500'
                    }`}
                  >
                    {/* Style Badge */}
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${
                        isGold
                          ? 'bg-amber-400/15 border-amber-400/40 text-amber-400'
                          : isNeon
                          ? 'bg-sky-400/15 border-sky-400/40 text-sky-400'
                          : 'bg-emerald-400/15 border-emerald-400/40 text-emerald-400'
                      }`}
                    >
                      {post.badgeText || (isGold ? '🏆 CHAMPION REEL' : '⚡ PRO ATHLETE')}
                    </span>

                    {/* Author Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full border border-amber-400/60 overflow-hidden bg-slate-800 flex items-center justify-center shrink-0">
                          {post.authorAvatar ? (
                            <img
                              src={post.authorAvatar}
                              alt={post.authorName || 'Athlete'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-black text-amber-400">
                              {(post.authorName || 'TG').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h4 className="font-bold text-sm text-white">{post.authorName || 'Verified Athlete'}</h4>
                            {post.verified !== false && <i className="fa-solid fa-circle-check text-amber-400 text-xs"></i>}
                          </div>
                          <span className="text-[11px] text-slate-400">{post.authorRole || 'Senior 1st XI'}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#020617] border border-[#334155] text-[10px] font-bold text-amber-400 uppercase">
                        {post.platform || 'TalentGraph'}
                      </span>
                    </div>

                    {/* Post Text */}
                    {post.content && (
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    )}

                    {/* Rich Video Media Rendering */}
                    {hasVideo && (
                      <div
                        onClick={() => {
                          setVideoData({
                            title: post.videoTitle || 'Matchday Video Reel',
                            src: videoSource,
                            thumb: videoPoster,
                          });
                          setVideoModalOpen(true);
                        }}
                        className="relative h-60 rounded-xl overflow-hidden border border-[#334155] cursor-pointer group bg-black"
                      >
                        {videoSource.startsWith('data:video') ? (
                          <video
                            src={videoSource}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={videoPoster || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1000'}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition duration-500"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent flex flex-col justify-between p-3.5">
                          <span className="self-start text-[10px] font-bold text-white bg-black/80 px-2.5 py-1 rounded-md border border-white/10 flex items-center space-x-1">
                            <i className="fa-solid fa-video text-amber-400 text-xs"></i>
                            <span>VIDEO REEL</span>
                          </span>
                          <div className="self-center flex flex-col items-center space-y-2">
                            <div className="w-14 h-14 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 text-xl shadow-lg shadow-amber-500/40 group-hover:scale-110 transition">
                              <i className="fa-solid fa-play ml-1"></i>
                            </div>
                            <span className="bg-black/75 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white border border-amber-400/40">
                              Tap to Play Video Reel
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-300 font-medium truncate">
                            {post.videoTitle || 'Verified Athlete Clip'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Rich Photo Media Rendering */}
                    {hasPhoto && (
                      <div className="relative max-h-96 rounded-xl overflow-hidden border border-[#334155] group bg-black">
                        <img
                          src={photoSource}
                          alt="Post media"
                          className={`w-full max-h-96 object-cover ${
                            post.effect === 'warm'
                              ? 'filter-warm'
                              : post.effect === 'bw'
                              ? 'filter-bw'
                              : ''
                          }`}
                        />
                        {post.effect === 'spotlight' && <div className="absolute inset-0 vignette-spotlight"></div>}
                        {post.effect === 'spotlight' && (
                          <span className="absolute top-2.5 left-2.5 bg-black/75 border border-amber-400/50 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                            🔦 Spotlight Effect
                          </span>
                        )}
                      </div>
                    )}

                    {/* Real Actions Row (Likes, Comments, Share) */}
                    <div className="border-t border-[#334155]/60 pt-2 flex items-center justify-between text-xs text-slate-400">
                      {/* Like Button */}
                      <button
                        onClick={() => handleLikeToggle(post.id)}
                        className={`flex items-center space-x-1.5 transition font-medium cursor-pointer ${
                          isPostLiked ? 'text-amber-400' : 'hover:text-amber-400'
                        }`}
                      >
                        <i className={`${isPostLiked ? 'fa-solid' : 'fa-regular'} fa-thumbs-up text-sm`}></i>
                        <span>{post.likesCount || 0} Likes</span>
                      </button>
                      {/* Comments Toggle */}
                      <button
                        onClick={() =>
                          setOpenComments((prev) => ({
                            ...prev,
                            [post.id]: !prev[post.id],
                          }))
                        }
                        className="flex items-center space-x-1.5 hover:text-sky-400 transition font-medium cursor-pointer"
                      >
                        <i className="fa-regular fa-comment text-sm"></i>
                        <span>{post.commentsCount || commentsList.length} Comments</span>
                      </button>
                      {/* Share */}
                      <button
                        onClick={handleShare}
                        className="flex items-center space-x-1.5 hover:text-white transition font-medium cursor-pointer"
                      >
                        <i className="fa-solid fa-share-nodes text-sm"></i>
                        <span>Share</span>
                      </button>
                    </div>

                    {/* Comments Accordion */}
                    {isCommentsOpen && (
                      <div className="pt-3 border-t border-[#334155]/40 space-y-2.5">
                        {commentsList.map((comment, idx) => (
                          <div key={comment.id || `comment-${idx}`} className="bg-[#020617] p-2.5 rounded-xl space-y-0.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className={`font-bold ${comment.authorColor || 'text-white'}`}>{comment.author}</span>
                              <span className="text-[10px] text-slate-500">{comment.time}</span>
                            </div>
                            <p className="text-slate-300">{comment.text}</p>
                          </div>
                        ))}

                        <div className="flex items-center space-x-2 pt-1">
                          <input
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCommentSubmit(post.id);
                            }}
                            placeholder={user ? 'Write a comment...' : 'Log in to write a comment'}
                            disabled={!user}
                            className="flex-1 bg-[#020617] border border-[#334155] rounded-full px-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                          />
                          <button
                            onClick={() => handleCommentSubmit(post.id)}
                            className="bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-full text-xs hover:bg-amber-300 transition cursor-pointer"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}

              {/* TRENDING ATHLETES CARD (Real Database Fetch) */}
              <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-4 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <i className="fa-solid fa-fire text-amber-400 text-base"></i>
                    <h4 className="font-extrabold text-sm text-white">Trending Athletes</h4>
                  </div>
                  <Link href="/athletes" className="text-[11px] font-bold text-amber-400 hover:underline no-underline">
                    View All
                  </Link>
                </div>

                {isAthletesLoading && (!realPosts || realPosts.length === 0) ? (
                  <div className="py-4 text-center text-xs text-slate-400 animate-pulse flex items-center justify-center gap-2">
                    <i className="fa-solid fa-circle-notch fa-spin text-amber-400 text-xs"></i>
                    <span>Loading active athletes...</span>
                  </div>
                ) : trendingAthletes.length === 0 ? (
                  <div className="py-5 text-center space-y-2">
                    <p className="text-xs text-slate-400">No active athletes found in database.</p>
                    <Link
                      href="/onboarding"
                      className="inline-block text-[11px] font-bold text-amber-400 hover:underline no-underline"
                    >
                      + Create Athlete Profile
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-[#334155]/60">
                    {trendingAthletes.map((athlete, idx) => (
                      <Link
                        key={athlete.uid || `athlete-${idx}`}
                        href={`/${athlete.username}`}
                        className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-800/40 px-2 rounded-xl transition no-underline group"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-amber-400/50 overflow-hidden flex items-center justify-center shrink-0">
                            {athlete.photoUrl ? (
                              <img
                                src={athlete.photoUrl}
                                alt={athlete.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] font-black text-amber-400">
                                {athlete.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white group-hover:text-amber-400 transition truncate max-w-[150px] sm:max-w-[200px]">
                              {athlete.name}
                            </p>
                            <p className="text-[10px] text-slate-400 capitalize truncate">
                              {athlete.position ? `${athlete.position} • ` : ''}{athlete.sport}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="font-bold text-amber-400 block">{athlete.devScore}% Dev</span>
                          {athlete.activityCount > 0 ? (
                            <span className="text-[9px] text-emerald-400 font-medium">
                              {athlete.activityCount} post{athlete.activityCount > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-500 font-medium">Active</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: REAL-TIME PLATFORM ANALYTICS GRID */}
        {/* ===================================================================== */}
        {activeTab === 'analytics' && (
          <section id="tab-analytics" className="space-y-4">
            <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-5 shadow-lg space-y-1.5">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-chart-simple text-amber-400 text-base"></i>
                <h3 className="font-black text-base text-white">Live Platform Analytics</h3>
              </div>
              <p className="text-xs text-slate-400">
                Real-time telemetry aggregated directly from live database activity.
              </p>
            </div>

            {/* Row 1: Total Posts & Active Athletes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-4 shadow-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Feed Posts</span>
                <h2 className="text-2xl font-black text-white mt-1 mb-1">{realPosts?.length || 0}</h2>
                <span className="text-[10px] font-bold text-[#10B981] flex items-center space-x-1">
                  <i className="fa-solid fa-circle text-[6px]"></i>
                  <span>Live Firestore</span>
                </span>
              </div>
              <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-4 shadow-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Active Creators</span>
                <h2 className="text-2xl font-black text-amber-400 mt-1 mb-1">{uniqueCreatorsCount}</h2>
                <span className="text-[10px] font-bold text-[#10B981] flex items-center space-x-1">
                  <i className="fa-solid fa-users text-xs"></i>
                  <span>Verified Network</span>
                </span>
              </div>
            </div>

            {/* Row 2: Total Likes & Total Comments */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-4 shadow-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Likes Recorded</span>
                <h2 className="text-2xl font-black text-sky-400 mt-1 mb-1">{totalNetworkLikes}</h2>
                <span className="text-[10px] font-bold text-[#10B981]">Community reactions</span>
              </div>
              <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-4 shadow-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Comments</span>
                <h2 className="text-2xl font-black text-emerald-400 mt-1 mb-1">{totalNetworkComments}</h2>
                <span className="text-[10px] font-bold text-[#10B981]">Real discussions</span>
              </div>
            </div>

            {/* Row 3: User Personal Stats */}
            <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-4 shadow-lg space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Your Personal Stats</span>
              {user ? (
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="bg-[#020617] p-2.5 rounded-xl border border-[#334155]/60">
                    <span className="text-xl font-black text-white">{myPosts.length}</span>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Posts</p>
                  </div>
                  <div className="bg-[#020617] p-2.5 rounded-xl border border-[#334155]/60">
                    <span className="text-xl font-black text-amber-400">{myTotalLikes}</span>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Likes</p>
                  </div>
                  <div className="bg-[#020617] p-2.5 rounded-xl border border-[#334155]/60">
                    <span className="text-xl font-black text-emerald-400">{myTotalComments}</span>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Comments</p>
                  </div>
                </div>
              ) : (
                <div className="pt-1 text-xs text-slate-400 flex items-center justify-between">
                  <span>Log in to track your individual performance telemetry.</span>
                  <Button size="sm" onClick={() => setLocation('/login')} className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs h-7">Log In</Button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: REAL ALERTS & NOTIFICATIONS */}
        {/* ===================================================================== */}
        {activeTab === 'alerts' && (
          <section id="tab-alerts" className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-extrabold text-base text-white">Alerts & Notifications</h3>
            </div>

            {!user ? (
              <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-8 text-center space-y-3">
                <i className="fa-solid fa-bell-slash text-slate-400 text-2xl"></i>
                <h4 className="text-sm font-bold text-white">Sign In to View Alerts</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Scout radar pings, trial invites, and direct feedback from clubs are tied to your verified account.
                </p>
                <Button onClick={() => setLocation('/login')} className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 rounded-full">
                  Log In Now
                </Button>
              </div>
            ) : isNotifsLoading ? (
              <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-8 text-center text-xs text-slate-400 animate-pulse">
                <i className="fa-solid fa-circle-notch fa-spin text-amber-400 text-lg mb-2"></i>
                <p>Loading your notifications...</p>
              </div>
            ) : !realNotifications || realNotifications.length === 0 ? (
              <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-8 text-center text-xs text-slate-400 space-y-2">
                <i className="fa-regular fa-bell text-2xl text-slate-500"></i>
                <p className="text-white font-bold text-sm">No notifications right now</p>
                <p className="text-slate-400 max-w-xs mx-auto">
                  When scouts view your profile, or when peers like and comment on your drills, alerts will show here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {realNotifications.map((notif, idx) => (
                  <div key={notif.id || `notif-${idx}`} className="bg-[#0F172A] border border-[#334155] rounded-2xl p-4 shadow-lg flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-full bg-amber-400/15 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-bell text-amber-400"></i>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-xs text-white">{notif.title || notif.actorName || 'Notification'}</h5>
                        <span className="text-[10px] text-slate-400">{notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Recent'}</span>
                      </div>
                      <p className="text-xs text-slate-300">{notif.message || notif.text || notif.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ===================================================================== */}
        {/* TAB 4: AUTHORITATIVE ATHLETE PROFILE HUB */}
        {/* ===================================================================== */}
        {activeTab === 'profile' && (
          <section id="tab-profile" className="space-y-4">
            {user ? (
              <AthleteProfileTab
                athleteProfile={currentAthleteProfile || undefined}
                userAccount={{
                  id: user.uid,
                  email: user.email,
                  firstName: user.displayName?.split(' ')[0] || 'Athlete',
                  lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                  creationTimestamp: '',
                  isEmailVerified: !!user.emailVerified,
                }}
                theme="dark"
              />
            ) : (
              <div className="bg-[#0F172A] border border-[#334155] rounded-3xl p-8 text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center mx-auto text-2xl">
                  <i className="fa-solid fa-id-card"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">Sign In to Access Athlete Profile Hub</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Manage your authoritative sporting identity, physical screening evidence, attribute radars, and scout visibility permissions.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <Button
                    onClick={() => setLocation('/login')}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-5 py-2 rounded-full cursor-pointer"
                  >
                    Log In
                  </Button>
                  <Button
                    onClick={() => setLocation('/signup')}
                    variant="outline"
                    className="border-[#334155] text-white hover:bg-slate-800 text-xs px-5 py-2 rounded-full cursor-pointer"
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 3. EXACT 5-TAB BOTTOM NAVIGATION BAR */}
      {/* Feed | Profile | + | Analytics | Alerts */}
      {/* ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#020617] border-t border-[#334155] shadow-2xl">
        <div className="max-w-2xl mx-auto h-16 flex items-center justify-around px-2">
          {/* Tab 1: Feed */}
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 flex flex-col items-center justify-center transition cursor-pointer ${
              activeTab === 'feed' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-stream text-lg"></i>
            <span className="text-[10px] font-bold mt-1">Feed</span>
          </button>

          {/* Tab 2: Profile */}
          <button
            onClick={handleProfileClick}
            className={`flex-1 flex flex-col items-center justify-center transition cursor-pointer ${
              activeTab === 'profile' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-user text-lg"></i>
            <span className="text-[10px] font-medium mt-1">Profile</span>
          </button>

          {/* Tab 3: Plus Tab (Center Elevated) - Auth Protected */}
          <button
            onClick={() => handleOpenCreateModal()}
            className="flex-1 flex flex-col items-center justify-center group cursor-pointer"
            title="Create Post"
          >
            <div className="w-11 h-11 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center text-xl font-black shadow-lg shadow-amber-500/30 group-hover:scale-105 transition -mt-2">
              <i className="fa-solid fa-plus"></i>
            </div>
          </button>

          {/* Tab 4: Analytics */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 flex flex-col items-center justify-center transition cursor-pointer ${
              activeTab === 'analytics' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-chart-simple text-lg"></i>
            <span className="text-[10px] font-medium mt-1">Analytics</span>
          </button>

          {/* Tab 5: Alerts (Real unread count) */}
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 flex flex-col items-center justify-center transition cursor-pointer relative ${
              activeTab === 'alerts' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="relative">
              <i className="fa-solid fa-bell text-lg"></i>
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[9px]">
                  {unreadAlertsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium mt-1">Alerts</span>
          </button>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 4. MODALS & OVERLAYS */}
      {/* ========================================================================= */}

      {/* AUTH REQUIRED DIALOG */}
      {authPromptOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#334155] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center mx-auto text-xl">
              <i className="fa-solid fa-lock"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Authentication Required</h3>
              <p className="text-xs text-slate-400 mt-1">
                You must be logged in to create posts, share highlights, or interact with athletes.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setAuthPromptOpen(false)}
                variant="outline"
                className="flex-1 border-[#334155] text-slate-300 hover:text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setAuthPromptOpen(false);
                  setLocation('/login');
                }}
                className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs"
              >
                Log In
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE POST MODAL (With Real File Upload & Media Preview) */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#334155] rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#334155]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400">
                  <i className="fa-solid fa-feather-pointed"></i>
                </div>
                <h3 className="font-extrabold text-sm text-white">Create Verified Post</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-base cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Content Input */}
            <textarea
              rows={3}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Share your match update, training drill highlight, or scouting milestone..."
              className="w-full bg-[#020617] border border-[#334155] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
            ></textarea>

            {/* Media Attachment Preview */}
            {mediaPreview && (
              <div className="relative rounded-xl overflow-hidden border border-[#334155] bg-black max-h-56">
                {attachedMediaType === 'video' ? (
                  <video src={mediaPreview} controls className="w-full max-h-56 object-contain" />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Media preview"
                    className={`w-full max-h-56 object-cover ${
                      currentEffect === 'warm'
                        ? 'filter-warm'
                        : currentEffect === 'bw'
                        ? 'filter-bw'
                        : ''
                    }`}
                  />
                )}
                {currentEffect === 'spotlight' && attachedMediaType === 'photo' && (
                  <div className="absolute inset-0 vignette-spotlight pointer-events-none"></div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMediaPreview(null);
                    setAttachedMediaUrl('');
                    setAttachedMediaType(null);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-rose-600 transition"
                  title="Remove media"
                >
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              </div>
            )}

            {/* Platform Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Publish Channel</label>
              <div className="flex space-x-2">
                {(['TalentGraph', 'Twitter/X', 'Instagram'] as const).map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => setCurrentPlatform(plat)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                      currentPlatform === plat
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-[#020617] border border-[#334155] text-slate-400'
                    }`}
                  >
                    {plat}
                  </button>
                ))}
              </div>
            </div>

            {/* Post Style Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Post Styling Frame</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setCurrentStyle('gold')}
                  className={`p-2 rounded-xl border text-left font-bold transition cursor-pointer ${
                    currentStyle === 'gold'
                      ? 'border-amber-400 bg-amber-400/10 text-amber-400'
                      : 'border-[#334155] bg-[#020617] text-slate-300'
                  }`}
                >
                  🏆 Champion Reel
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStyle('neon')}
                  className={`p-2 rounded-xl border text-left font-bold transition cursor-pointer ${
                    currentStyle === 'neon'
                      ? 'border-sky-400 bg-sky-400/10 text-sky-400'
                      : 'border-[#334155] bg-[#020617] text-slate-300'
                  }`}
                >
                  ⚡ Pro Athlete
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStyle('fire')}
                  className={`p-2 rounded-xl border text-left font-bold transition cursor-pointer ${
                    currentStyle === 'fire'
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                      : 'border-[#334155] bg-[#020617] text-slate-300'
                  }`}
                >
                  🔥 Matchday Highlight
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStyle('scout')}
                  className={`p-2 rounded-xl border text-left font-bold transition cursor-pointer ${
                    currentStyle === 'scout'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-[#334155] bg-[#020617] text-slate-300'
                  }`}
                >
                  ⭐ FKF Verified
                </button>
              </div>
            </div>

            {/* Photo Effects Studio */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Photo Effects Filter</label>
              <div className="flex space-x-2 overflow-x-auto scrollbar-none py-1 text-[11px]">
                {[
                  { key: 'none', label: 'None' },
                  { key: 'spotlight', label: '🔦 Spotlight' },
                  { key: 'warm', label: '🌅 Warm Sunset' },
                  { key: 'bw', label: '🎬 B&W Pro' },
                ].map((eff) => (
                  <button
                    key={eff.key}
                    type="button"
                    onClick={() => setCurrentEffect(eff.key as any)}
                    className={`px-3 py-1 rounded-lg border font-bold shrink-0 transition cursor-pointer ${
                      currentEffect === eff.key
                        ? 'border-amber-400 bg-amber-400 text-slate-950'
                        : 'border-[#334155] bg-[#020617] text-slate-300'
                    }`}
                  >
                    {eff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Real File Upload & Attachment Triggers */}
            <div className="pt-2 border-t border-[#334155] flex items-center justify-between">
              <div className="flex items-center space-x-3 text-slate-400 text-base">
                <button
                  type="button"
                  onClick={() => triggerFileInput('photo')}
                  className="hover:text-amber-400 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  title="Upload Photo"
                >
                  <i className="fa-solid fa-image text-sm text-amber-400"></i>
                  <span>Add Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerFileInput('video')}
                  className="hover:text-purple-400 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  title="Upload Video Reel"
                >
                  <i className="fa-solid fa-film text-sm text-purple-400"></i>
                  <span>Add Video</span>
                </button>
              </div>
              <button
                type="button"
                disabled={isPublishing}
                onClick={handlePublishPost}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-2 rounded-full text-xs transition shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                {isPublishing ? 'Publishing...' : 'Publish Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO REEL PLAYER MODAL (Actual HTML5 Playback) */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-[#0F172A] border border-[#334155] rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="flex items-center justify-between p-4 border-b border-[#334155]">
              <h4 className="font-bold text-xs text-white truncate">{videoData.title}</h4>
              <button
                onClick={() => setVideoModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <div className="relative min-h-72 bg-black flex items-center justify-center">
              {videoData.src ? (
                <video
                  src={videoData.src}
                  controls
                  autoPlay
                  className="w-full max-h-[70vh] object-contain"
                />
              ) : videoData.thumb ? (
                <img
                  src={videoData.thumb}
                  alt={videoData.title}
                  className="w-full max-h-[70vh] object-contain"
                />
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">Video source unavailable</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STORY FULLSCREEN MODAL */}
      {storyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="max-w-md w-full relative">
            <button
              onClick={() => setStoryModalOpen(false)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="rounded-3xl overflow-hidden border border-[#334155] relative h-[480px]">
              <img src={storyData.image} alt={storyData.name} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full">
                <span className="font-bold text-xs text-white">{storyData.name}</span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-black/75 backdrop-blur p-3 rounded-2xl border border-white/10">
                <p className="text-xs text-white font-medium">{storyData.caption}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT MESSAGES DIALOG */}
      {messagesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#334155] rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#334155]">
              <div className="flex items-center space-x-2">
                <i className="fa-regular fa-comment-dots text-amber-400"></i>
                <h3 className="font-extrabold text-sm text-white">Direct Messages</h3>
              </div>
              <button onClick={() => setMessagesModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-2">
              {user ? (
                <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                  <i className="fa-regular fa-comments text-2xl text-slate-500"></i>
                  <p className="text-white font-bold">No active conversations</p>
                  <p className="text-slate-400">Connect with scouts and clubs to start direct messaging.</p>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 space-y-3">
                  <i className="fa-solid fa-lock text-2xl text-amber-400"></i>
                  <p className="text-white font-bold">Log in to view messages</p>
                  <Button
                    onClick={() => {
                      setMessagesModalOpen(false);
                      setLocation('/login');
                    }}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs"
                  >
                    Log In
                  </Button>
                </div>
              )}
            </div>

            <button
              onClick={() => setMessagesModalOpen(false)}
              className="w-full bg-[#020617] border border-[#334155] text-white py-2 rounded-full text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-full text-xs shadow-2xl z-50 animate-bounce">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
