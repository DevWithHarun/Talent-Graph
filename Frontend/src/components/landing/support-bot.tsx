'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  RotateCcw, 
  ShieldCheck, 
  Ticket, 
  CheckCircle2, 
  Compass, 
  ArrowRight,
  AlertCircle,
  Mail,
  Minimize2,
  Phone,
  Search,
  MessageSquare,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { queueTicketConfirmationEmailFirebase } from '@/lib/firebase-mail';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

const ONBOARDING_PROMPTS = [
  { label: '🏃 Athlete Setup', query: 'Give me a step-by-step guide to onboarding as an Athlete' },
  { label: '🏟️ Club Setup', query: 'How do I onboard my club, squad, and track live matches?' },
  { label: '🛡️ 6 Verifications', query: 'How do the 6 verification layers work for stats and trials?' },
  { label: '📊 Metrics & Radar', query: 'How do I submit baseline metrics and rate tactical attributes?' },
  { label: '✉️ Email Issues', query: 'I have not received my email verification link, what should I do?' },
];

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text: `👋 **Welcome to Talent Graph! I'm ScoutAI**, your 24/7 onboarding guide and support assistant.

I can help you with:
- 🚀 **Step-by-step onboarding** for Athletes, Clubs, Coaches & Scouts
- 🛡️ **6-Layer Verification** and getting verified badges
- 📊 **Baseline metrics, tactical ratings & radar charts**
- 🏟️ **Club squad management & real-time match tracking**
- 🎫 **Creating an official support ticket** sent straight to our team!

Tap a suggestion or ask any question below!`,
  timestamp: 'Just now',
};

export function LandingSupportBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'ticket' | 'track' | 'onboarding'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPromptBadge, setShowPromptBadge] = useState(true);

  // Support ticket form state
  const [ticketName, setTicketName] = useState('');
  const [ticketEmail, setTicketEmail] = useState('');
  const [ticketPhone, setTicketPhone] = useState('');
  const [ticketRole, setTicketRole] = useState('Athlete');
  const [ticketCategory, setTicketCategory] = useState('Onboarding Help');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSubmittedId, setTicketSubmittedId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Track Ticket state
  const [trackSearch, setTrackSearch] = useState('');
  const [trackedTicket, setTrackedTicket] = useState<any>(null);
  const [trackedMessages, setTrackedMessages] = useState<any[]>([]);
  const [isSearchingTicket, setIsSearchingTicket] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackReplyText, setTrackReplyText] = useState('');
  const [isSendingTrackReply, setIsSendingTrackReply] = useState(false);

  const firestore = useFirestore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lock background scroll on mobile when bot is open
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isOpen && window.innerWidth < 640) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      // Only auto-focus on desktop to prevent unwanted mobile keyboard popups
      if (window.innerWidth >= 640) {
        inputRef.current?.focus();
      }
      setShowPromptBadge(false);
    }
  }, [isOpen, activeTab, messages, isLoading]);

  // Auto-open live tracking if user visited with ?trackTicket=... or ?ticket=... (e.g. from confirmation email)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('trackTicket') || params.get('ticket');
      if (code && firestore) {
        setIsOpen(true);
        setActiveTab('track');
        setTrackSearch(code);
        handleSearchTicket(undefined, code);
      }
    } catch {}
  }, [firestore]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    if (activeTab !== 'chat') {
      setActiveTab('chat');
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const history = newMessages
        .filter(m => m.id !== 'welcome')
        .slice(-6)
        .map(m => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const botReply = data.reply || "I'm here to help! Please check our suggestions or create a support ticket above.";

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'model',
          text: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'model',
          text: `Talent Graph makes African athletic talent visible to scouts and clubs worldwide. 

If you are experiencing an issue with your account, email verification, or matches, switch to the **"🎫 Create Ticket"** tab at the top to have our team assist you directly!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketName.trim()) {
      setFormError('Please enter your full name');
      return;
    }
    if (!ticketEmail.trim() || !ticketEmail.includes('@')) {
      setFormError('Please enter a valid email address');
      return;
    }
    if (!ticketMessage.trim()) {
      setFormError('Please describe the issue or question you have');
      return;
    }

    setFormError(null);
    setIsSubmittingTicket(true);
    const ticketId = `TG-${Math.floor(10000 + Math.random() * 90000)}`;

    const ticketData = {
      name: ticketName.trim(),
      senderName: ticketName.trim(),
      email: ticketEmail.trim(),
      senderEmail: ticketEmail.trim(),
      phone: ticketPhone.trim() || null,
      senderPhone: ticketPhone.trim() || null,
      role: ticketRole,
      category: ticketCategory,
      message: ticketMessage.trim(),
      subject: `[${ticketCategory}] Support Request from ${ticketName.trim()} (${ticketRole})`,
      ticketCode: ticketId,
      status: 'open',
      priority: 'medium',
      source: 'landing_bot',
      adminNotifyEmail: 'nzaiharun28@gmail.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Immediate optimistic confirmation
    setTicketSubmittedId(ticketId);
    setIsSubmittingTicket(false);

    // Append confirmation in chat
    setMessages(prev => [
      ...prev,
      {
        id: `bot-ticket-${Date.now()}`,
        role: 'model',
        text: `✅ **Support Ticket Created: #${ticketId}**
- **Name:** ${ticketName.trim()}
- **Category:** ${ticketCategory}
- **Status:** Open & Assigned to Superadmin
- **Tracking Reference:** \`${ticketId}\`

📧 **Confirmation & Tracking Email:**
We have queued a confirmation email with your **Live Tracking Link** to \`${ticketEmail.trim()}\`. You can use it to track real-time progress and see Superadmin responses before they reply.

You can also track it right now in the **"🔍 Track Case"** tab above using your reference code or email!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    // Persist to Firestore and dispatch email notification in background
    try {
      if (firestore) {
        addDoc(collection(firestore, 'support_tickets'), ticketData).then(docRef => {
          // Also persist the first message in the ticket's message subcollection
          addDoc(collection(firestore, 'support_tickets', docRef.id, 'messages'), {
            senderType: 'user',
            senderName: ticketName.trim(),
            body: ticketMessage.trim(),
            sentVia: 'landing_bot',
            sentAt: new Date().toISOString(),
          }).catch(() => {});

          // Queue confirmation email directly into Firebase Firestore `mail` collection
          queueTicketConfirmationEmailFirebase(firestore, {
            ticketId: docRef.id,
            ticketCode: ticketId,
            senderName: ticketName.trim(),
            senderEmail: ticketEmail.trim(),
            subject: ticketData.subject,
            message: ticketMessage.trim(),
            category: ticketCategory,
          }).catch(err => console.warn('[support-bot] Firebase mail queue error:', err));
        }).catch(() => {});
      }
      fetch('/api/support/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      }).catch(() => {});
    } catch {
      // Handled silently
    }
  };

  const handleSearchTicket = async (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const queryTerm = (customCode || trackSearch).trim().replace(/^#/, '');
    if (!queryTerm || !firestore) return;
    setIsSearchingTicket(true);
    setTrackError(null);
    try {
      let snap = await getDocs(query(collection(firestore, 'support_tickets'), where('ticketCode', '==', queryTerm)));
      if (snap.empty && !queryTerm.startsWith('TG-')) {
        snap = await getDocs(query(collection(firestore, 'support_tickets'), where('ticketCode', '==', `TG-${queryTerm}`)));
      }
      if (snap.empty && queryTerm.includes('@')) {
        snap = await getDocs(query(collection(firestore, 'support_tickets'), where('senderEmail', '==', queryTerm), orderBy('updatedAt', 'desc')));
        if (snap.empty) {
          snap = await getDocs(query(collection(firestore, 'support_tickets'), where('email', '==', queryTerm), orderBy('updatedAt', 'desc')));
        }
      }

      if (snap.empty) {
        // Try direct document ID lookup
        try {
          const directDoc = await getDoc(doc(firestore, 'support_tickets', queryTerm));
          if (directDoc.exists()) {
            const ticketObj = { id: directDoc.id, ...directDoc.data() };
            setTrackedTicket(ticketObj);
            const msgsSnap = await getDocs(query(collection(firestore, 'support_tickets', directDoc.id, 'messages'), orderBy('sentAt', 'asc')));
            setTrackedMessages(msgsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setIsSearchingTicket(false);
            return;
          }
        } catch {}

        setTrackError('No ticket found with that code or email. Please check your reference code.');
        setTrackedTicket(null);
        setTrackedMessages([]);
      } else {
        const docSnap = snap.docs[0];
        const ticketObj = { id: docSnap.id, ...docSnap.data() };
        setTrackedTicket(ticketObj);

        // Fetch subcollection messages
        const msgsSnap = await getDocs(query(collection(firestore, 'support_tickets', docSnap.id, 'messages'), orderBy('sentAt', 'asc')));
        setTrackedMessages(msgsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (err: any) {
      setTrackError('Error loading ticket: ' + (err?.message || 'Please try again'));
    } finally {
      setIsSearchingTicket(false);
    }
  };

  const handleSendTrackReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackReplyText.trim() || !trackedTicket || !firestore || isSendingTrackReply) return;
    setIsSendingTrackReply(true);
    try {
      const now = new Date().toISOString();
      const newMsg = {
        senderType: 'user',
        senderName: trackedTicket.name || trackedTicket.senderName || 'User',
        body: trackReplyText.trim(),
        sentVia: 'landing_bot',
        sentAt: now,
      };

      await addDoc(collection(firestore, 'support_tickets', trackedTicket.id, 'messages'), newMsg);
      await updateDoc(doc(firestore, 'support_tickets', trackedTicket.id), {
        status: 'open',
        updatedAt: now,
        lastMessage: trackReplyText.trim().slice(0, 100),
      });

      setTrackedMessages(prev => [...prev, { id: `local-${Date.now()}`, ...newMsg }]);
      setTrackReplyText('');
    } catch {
      // Handled silently
    } finally {
      setIsSendingTrackReply(false);
    }
  };

  return (
    <>
      {/* Floating Prompt Pill when closed */}
      {!isOpen && showPromptBadge && (
        <div 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 sm:bottom-22 sm:right-5 z-50 flex items-center gap-2 rounded-full border border-white/20 bg-[var(--surface-dark)]/95 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:scale-105 active:scale-95"
        >
          <span className="flex h-2 w-2 rounded-full bg-[var(--glow-color)] animate-ping" />
          <span className="text-[var(--glow-color)]">Need help?</span>
          <span>Ask ScoutAI</span>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowPromptBadge(false); }}
            className="ml-1 text-white/50 hover:text-white p-0.5"
            aria-label="Dismiss prompt"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Floating Trigger Button when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Support & Onboarding Bot"
          className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 group flex h-14 w-14 items-center justify-center rounded-full bg-[var(--secondary-color)] text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-[var(--secondary-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--glow-color)]/30 touch-manipulation"
        >
          <Bot className="h-6 w-6 transition-transform group-hover:rotate-12" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--glow-color)] text-[9px] font-black text-black">
            AI
          </span>
        </button>
      )}

      {/* Main Bot Window (Full-screen overlay on mobile, modal drawer on desktop) */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-50 flex flex-col w-full h-[100dvh] sm:w-[420px] sm:h-[600px] sm:max-h-[85vh] sm:rounded-3xl rounded-none border-0 sm:border sm:border-white/15 bg-[var(--surface-dark)] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          
          {/* Mobile Sheet Pull Bar */}
          <div className="sm:hidden w-12 h-1 bg-white/25 rounded-full mx-auto mt-2 shrink-0" />

          {/* Top Header */}
          <div className="relative flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-white/[0.08] to-transparent px-4 py-3 pt-2 sm:pt-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--secondary-color)] text-white shadow-md">
                <Bot className="h-4.5 w-4.5" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface-dark)] bg-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white truncate">ScoutAI Support</h3>
                  <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-[var(--glow-color)]/15 px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wide text-[var(--glow-color)]">
                    <Sparkles className="h-2.5 w-2.5" /> 24/7
                  </span>
                </div>
                <p className="text-[10.5px] text-[var(--text-light-muted)] truncate">Onboarding & Help Center</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setMessages([INITIAL_MESSAGE])}
                title="Reset Chat"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/10 active:bg-white/20 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 active:bg-white/20 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs (Touch-friendly 44px min height on mobile) */}
          <div className="flex border-b border-white/10 bg-black/30 px-2 py-1.5 gap-1 text-xs sm:text-[11px] font-semibold shrink-0">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 min-h-[38px] sm:min-h-[34px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 touch-manipulation ${
                activeTab === 'chat'
                  ? 'bg-white/15 text-white font-bold shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10'
              }`}
            >
              <Bot className="h-3.5 w-3.5 text-[var(--glow-color)]" />
              <span>Ask AI</span>
            </button>
            <button
              onClick={() => setActiveTab('ticket')}
              className={`flex-1 min-h-[38px] sm:min-h-[34px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 touch-manipulation ${
                activeTab === 'ticket'
                  ? 'bg-white/15 text-white font-bold shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10'
              }`}
            >
              <Ticket className="h-3.5 w-3.5 text-amber-400" />
              <span>New Ticket</span>
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`flex-1 min-h-[38px] sm:min-h-[34px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 touch-manipulation ${
                activeTab === 'track'
                  ? 'bg-white/15 text-white font-bold shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10'
              }`}
            >
              <Search className="h-3.5 w-3.5 text-emerald-400" />
              <span>Track Case</span>
            </button>
            <button
              onClick={() => setActiveTab('onboarding')}
              className={`flex-1 min-h-[38px] sm:min-h-[34px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 touch-manipulation ${
                activeTab === 'onboarding'
                  ? 'bg-white/15 text-white font-bold shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10'
              }`}
            >
              <Compass className="h-3.5 w-3.5 text-blue-400" />
              <span>Guides</span>
            </button>
          </div>

          {/* TAB 1: CHAT & GUIDE */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5 text-xs overscroll-contain">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'model' && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--secondary-color)]/80 text-white mt-0.5">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[86%] sm:max-w-[82%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-[var(--secondary-color)] text-white rounded-br-xs'
                          : 'border border-white/10 bg-white/[0.06] text-[var(--text-light)] rounded-bl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-normal text-[12.5px] sm:text-[12px] leading-relaxed">
                        {msg.text}
                      </div>
                      <span className="mt-1 block text-[9px] opacity-40 text-right">
                        {msg.timestamp}
                      </span>
                    </div>

                    {msg.role === 'user' && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-white mt-0.5">
                        <User className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--secondary-color)]/80 text-white">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-2">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--glow-color)] [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--glow-color)] [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--glow-color)]" />
                      <span className="ml-1 text-[11px] text-white/50">Analyzing platform knowledge...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Onboarding Quick Shortcuts bar */}
              <div className="border-t border-white/10 bg-black/25 p-2 sm:p-2.5 shrink-0">
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--glow-color)]">
                    Quick Guides:
                  </span>
                  <button
                    onClick={() => setActiveTab('ticket')}
                    className="text-[10.5px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Ticket className="h-3 w-3" /> Lodge Ticket
                  </button>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {ONBOARDING_PROMPTS.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(item.query)}
                      className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10.5px] text-white/90 hover:border-[var(--glow-color)]/40 hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer text-left touch-manipulation"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Box with mobile safe-area padding */}
              <div className="border-t border-white/10 bg-black/35 p-2.5 sm:p-3 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask about onboarding, verification, matches..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isLoading}
                    className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-base sm:text-xs text-white placeholder:text-white/40 focus:border-[var(--glow-color)] focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className="flex h-10 w-10 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary-color)] text-white transition-all hover:bg-[var(--secondary-hover)] active:scale-95 disabled:opacity-40 disabled:hover:bg-[var(--secondary-color)] cursor-pointer touch-manipulation"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: CREATE SUPPORT TICKET */}
          {activeTab === 'ticket' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
              {ticketSubmittedId ? (
                <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center px-4 space-y-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h4 className="text-base font-bold text-white">Ticket Submitted Successfully!</h4>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 w-full space-y-1">
                    <p className="text-[11px] text-white/50">Ticket Reference Number</p>
                    <p className="text-xl font-black text-[var(--glow-color)] tracking-wider">#{ticketSubmittedId}</p>
                    <div className="pt-2 text-[11px] text-white/70 border-t border-white/10 mt-2 flex flex-col gap-1 text-left">
                      <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-[var(--glow-color)]" /> <strong>Dispatched to:</strong> {ticketEmail}</span>
                      <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-amber-400" /> <strong>Admin notification:</strong> nzaiharun28@gmail.com</span>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-light-muted)]">
                    Our human support team will investigate your request and reach out directly to your email.
                  </p>
                  <div className="flex flex-col gap-2 pt-2 w-full">
                    <button
                      onClick={() => {
                        const code = ticketSubmittedId;
                        setActiveTab('track');
                        setTrackSearch(code);
                        handleSearchTicket(undefined, code);
                      }}
                      className="w-full min-h-[44px] sm:min-h-[40px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-xs text-white font-bold hover:from-indigo-500 hover:to-blue-500 active:scale-95 cursor-pointer touch-manipulation shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Search className="h-4 w-4" /> Track This Ticket Live Now
                    </button>
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <button
                        onClick={() => {
                          setTicketSubmittedId(null);
                          setTicketMessage('');
                        }}
                        className="w-full sm:w-auto flex-1 min-h-[44px] sm:min-h-[38px] px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-xs text-white hover:bg-white/10 active:bg-white/15 cursor-pointer touch-manipulation font-semibold"
                      >
                        Submit Another Ticket
                      </button>
                      <button
                        onClick={() => setActiveTab('chat')}
                        className="w-full sm:w-auto flex-1 min-h-[44px] sm:min-h-[38px] px-3 py-2 rounded-xl bg-white/10 text-xs text-white font-semibold hover:bg-white/15 active:scale-95 cursor-pointer touch-manipulation"
                      >
                        Return to Chat
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateTicketSubmit} className="space-y-3.5">
                  <div className="border-b border-white/10 pb-2.5">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Ticket className="h-4 w-4 text-amber-400" />
                      Create a Support Ticket
                    </h4>
                    <p className="text-[11.5px] text-[var(--text-light-muted)] mt-0.5">
                      Need account help, verification review, or bug fixes? We send copies to your email and the admin team.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-white/80 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Joseph Ngaara"
                      value={ticketName}
                      onChange={e => setTicketName(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-base sm:text-xs text-white placeholder:text-white/30 focus:border-[var(--glow-color)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-white/80 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. athlete@gmail.com"
                      value={ticketEmail}
                      onChange={e => setTicketEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-base sm:text-xs text-white placeholder:text-white/30 focus:border-[var(--glow-color)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-white/80 mb-1">
                      Phone Number (Optional — for instant SMS replies)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +254 712 345 678"
                      value={ticketPhone}
                      onChange={e => setTicketPhone(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-base sm:text-xs text-white placeholder:text-white/30 focus:border-[var(--glow-color)] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-white/80 mb-1">Your Role</label>
                      <select
                        value={ticketRole}
                        onChange={e => setTicketRole(e.target.value)}
                        className="w-full rounded-xl border border-white/15 bg-[var(--surface-dark)] px-3 py-2.5 text-base sm:text-xs text-white focus:border-[var(--glow-color)] focus:outline-none cursor-pointer"
                      >
                        <option value="Athlete">Athlete</option>
                        <option value="Club / Academy">Club / Academy</option>
                        <option value="Coach">Coach</option>
                        <option value="Scout">Scout</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-white/80 mb-1">Issue Category</label>
                      <select
                        value={ticketCategory}
                        onChange={e => setTicketCategory(e.target.value)}
                        className="w-full rounded-xl border border-white/15 bg-[var(--surface-dark)] px-3 py-2.5 text-base sm:text-xs text-white focus:border-[var(--glow-color)] focus:outline-none cursor-pointer"
                      >
                        <option value="Onboarding Help">Onboarding Help</option>
                        <option value="Email Verification">Email Verification</option>
                        <option value="Metrics & Radar Charts">Metrics & Radar Charts</option>
                        <option value="Match Logging">Match Logging</option>
                        <option value="Club Command Center">Club Command Center</option>
                        <option value="Bug / Error">Bug / Error</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-white/80 mb-1">Explain the Issue *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Describe what you were trying to do and what happened..."
                      value={ticketMessage}
                      onChange={e => setTicketMessage(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-base sm:text-xs text-white placeholder:text-white/30 focus:border-[var(--glow-color)] focus:outline-none resize-none"
                    />
                  </div>

                  {formError && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] animate-in fade-in">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingTicket}
                    className="w-full min-h-[44px] py-2.5 rounded-xl bg-[var(--secondary-color)] text-white text-xs font-bold shadow-md hover:bg-[var(--secondary-hover)] active:scale-98 disabled:opacity-50 cursor-pointer transition-colors flex items-center justify-center gap-1.5 touch-manipulation"
                  >
                    {isSubmittingTicket ? 'Submitting Ticket...' : 'Submit Support Ticket'}
                  </button>

                  <p className="text-[10px] text-center text-white/40">
                    A copy will be sent to your email and the administrative desk at nzaiharun28@gmail.com.
                  </p>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: TRACK SUPPORT CASE & COMMUNICATE */}
          {activeTab === 'track' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="border-b border-white/10 pb-2.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Search className="h-4 w-4 text-emerald-400" />
                  Track Your Support Case
                </h4>
                <p className="text-[11px] text-[var(--text-light-muted)] mt-0.5">
                  Check live case status, read replies from the superadmin, or send a follow-up message.
                </p>
              </div>

              {/* Search Form */}
              <form onSubmit={e => handleSearchTicket(e)} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Ticket Code (e.g. TG-12345) or Email..."
                  value={trackSearch}
                  onChange={e => setTrackSearch(e.target.value)}
                  className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-base sm:text-xs text-white placeholder:text-white/30 focus:border-[var(--glow-color)] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!trackSearch.trim() || isSearchingTicket}
                  className="px-3.5 py-2 rounded-xl bg-[var(--secondary-color)] text-white font-bold hover:bg-[var(--secondary-hover)] active:scale-95 disabled:opacity-40 cursor-pointer flex items-center gap-1.5 text-xs touch-manipulation shadow-md"
                >
                  {isSearchingTicket ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  <span>Find</span>
                </button>
              </form>

              {/* Quick chip if ticket just created */}
              {ticketSubmittedId && !trackedTicket && (
                <button
                  onClick={() => {
                    setTrackSearch(ticketSubmittedId);
                    handleSearchTicket(undefined, ticketSubmittedId);
                  }}
                  className="w-full text-left p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs flex items-center justify-between hover:bg-emerald-500/20 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Load your recent ticket: <strong>#{ticketSubmittedId}</strong>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}

              {trackError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{trackError}</span>
                </div>
              )}

              {/* Tracked Ticket Details */}
              {trackedTicket && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-sm text-[var(--glow-color)]">
                            #{trackedTicket.ticketCode || trackedTicket.id?.slice(0, 8).toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            trackedTicket.status === 'resolved' 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : trackedTicket.status === 'pending_user'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {trackedTicket.status === 'resolved' ? '✅ Resolved' : trackedTicket.status === 'pending_user' ? '📩 Admin Replied' : '⏳ Open & Assigned'}
                          </span>
                        </div>
                        <h5 className="font-bold text-white text-xs mt-1">{trackedTicket.subject || trackedTicket.category}</h5>
                        <p className="text-[10.5px] text-white/50 mt-0.5">
                          Submitted by {trackedTicket.name} · {trackedTicket.createdAt ? new Date(trackedTicket.createdAt).toLocaleDateString() : 'Recent'}
                        </p>
                      </div>
                    </div>

                    {/* Original inquiry */}
                    {trackedTicket.message && (
                      <div className="rounded-xl bg-black/40 border border-white/10 p-2.5 text-[11px] text-white/80">
                        <strong className="text-white/50 block text-[10px] uppercase font-bold">Your Initial Request:</strong>
                        <p className="mt-0.5 leading-relaxed whitespace-pre-wrap">{trackedTicket.message}</p>
                      </div>
                    )}
                  </div>

                  {/* Messages Thread */}
                  <div className="space-y-2.5">
                    <h5 className="text-[11px] font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Conversation with Support Desk
                    </h5>

                    {trackedMessages.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center text-white/50 text-xs">
                        Our administrative team is reviewing your case. Any replies sent to your email will also appear right here.
                      </div>
                    ) : (
                      trackedMessages.map((m, idx) => (
                        <div
                          key={m.id || idx}
                          className={`rounded-2xl p-3 text-xs space-y-1 ${
                            m.senderType === 'agent'
                              ? 'bg-gradient-to-br from-indigo-950/80 to-purple-950/60 border border-indigo-500/30 text-white ml-2 shadow-sm'
                              : 'bg-white/5 border border-white/10 text-white/90 mr-2'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10.5px]">
                            <span className={`font-bold flex items-center gap-1 ${m.senderType === 'agent' ? 'text-[var(--glow-color)]' : 'text-white/70'}`}>
                              {m.senderType === 'agent' ? '🛡️ Superadmin Reply' : `👤 ${m.senderName || 'You'}`}
                            </span>
                            <span className="text-white/40 text-[9.5px]">
                              {m.sentAt ? new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed text-[11.5px]">{m.body}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Reply back to support */}
                  <form onSubmit={handleSendTrackReply} className="pt-2 border-t border-white/10 space-y-2">
                    <label className="block text-[11px] font-semibold text-white/80">
                      Send a response to the Support Desk:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Type your reply here..."
                      value={trackReplyText}
                      onChange={e => setTrackReplyText(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-[var(--glow-color)] focus:outline-none resize-none"
                    />
                    <button
                      type="submit"
                      disabled={!trackReplyText.trim() || isSendingTrackReply}
                      className="w-full py-2 rounded-xl bg-[var(--secondary-color)] text-white font-bold hover:bg-[var(--secondary-hover)] active:scale-95 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5 text-xs touch-manipulation shadow-md"
                    >
                      {isSendingTrackReply ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      <span>Send Follow-Up to Superadmin</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INTERACTIVE ONBOARDING HUB */}
          {activeTab === 'onboarding' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="border-b border-white/10 pb-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Compass className="h-4 w-4 text-blue-400" />
                  Onboarding Guides by Role
                </h4>
                <p className="text-[11px] text-[var(--text-light-muted)]">
                  Select your role for full step-by-step instructions:
                </p>
              </div>

              {/* Role 1: Athlete */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                    🏃 For Athletes
                  </span>
                  <a
                    href="/signup"
                    className="text-[10.5px] text-[var(--glow-color)] font-bold hover:underline flex items-center gap-0.5"
                  >
                    Start <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
                <ul className="space-y-1.5 text-[11px] text-[var(--text-light-muted)]">
                  <li><strong>1. Sign Up & Verify Email:</strong> Check your inbox or spam folder.</li>
                  <li><strong>2. Set Vitals:</strong> Height, weight, dominant foot, primary & secondary positions.</li>
                  <li><strong>3. Connect Club:</strong> Search your team (e.g. Verve FC).</li>
                  <li><strong>4. Baseline Testing:</strong> Enter 30m sprint, vertical jump, agility, and pass completion.</li>
                  <li><strong>5. Radar Charts:</strong> Rate attributes across tactical, technical & mental criteria.</li>
                  <li><strong>6. Log Matches:</strong> Record match minutes, goals, and ratings.</li>
                </ul>
                <button
                  onClick={() => handleSendMessage('Give me a detailed guide for setting up my Athlete profile')}
                  className="w-full min-h-[38px] mt-1 py-1.5 rounded-xl border border-white/10 bg-white/5 text-[11px] text-white hover:bg-white/10 active:bg-white/15 cursor-pointer touch-manipulation"
                >
                  Ask AI About Athlete Setup
                </button>
              </div>

              {/* Role 2: Club / Organization */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                    🏟️ For Clubs & Academies
                  </span>
                  <a
                    href="/signup"
                    className="text-[10.5px] text-[var(--glow-color)] font-bold hover:underline flex items-center gap-0.5"
                  >
                    Register Club <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
                <ul className="space-y-1.5 text-[11px] text-[var(--text-light-muted)]">
                  <li><strong>1. Register:</strong> Official club name, city, and sports focus.</li>
                  <li><strong>2. Squad Roster:</strong> Add athletes and monitor squad readiness.</li>
                  <li><strong>3. Live Match Tracker:</strong> Setup fixtures and log pitch events in real-time.</li>
                  <li><strong>4. Training Drills:</strong> Schedule sessions and notify squad members.</li>
                </ul>
                <button
                  onClick={() => handleSendMessage('How do clubs track live matches and squad readiness?')}
                  className="w-full min-h-[38px] mt-1 py-1.5 rounded-xl border border-white/10 bg-white/5 text-[11px] text-white hover:bg-white/10 active:bg-white/15 cursor-pointer touch-manipulation"
                >
                  Ask AI About Club Features
                </button>
              </div>

              {/* Role 3: Scouts & Coaches */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 space-y-2">
                <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                  🔍 For Scouts & Coaches
                </span>
                <p className="text-[11px] text-[var(--text-light-muted)]">
                  Filter talent by position and CSI index, compile AI scouting reports, verify player stats, and message players directly.
                </p>
                <button
                  onClick={() => handleSendMessage('How can scouts discover and shortlist athletes?')}
                  className="w-full min-h-[38px] py-1.5 rounded-xl border border-white/10 bg-white/5 text-[11px] text-white hover:bg-white/10 active:bg-white/15 cursor-pointer touch-manipulation"
                >
                  Ask AI About Scouting Tools
                </button>
              </div>
            </div>
          )}

          {/* Footer note with mobile safe-area padding */}
          <div className="border-t border-white/10 bg-black/40 py-2 px-3 text-[10px] text-white/40 flex items-center justify-between shrink-0">
            <span>Trained on Talent Graph docs</span>
            <span className="flex items-center gap-1 text-[var(--glow-color)] font-semibold">
              <ShieldCheck className="h-3 w-3" /> Verified Support
            </span>
          </div>

        </div>
      )}
    </>
  );
}
