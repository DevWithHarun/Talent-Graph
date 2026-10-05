'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

export default function SupportPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: '',
    phone: '',
    subject: '',
    category: 'Onboarding',
    priority: 'Medium',
    message: '',
  });

  // Pre-fill email if user is logged in
  useEffect(() => {
    if (user?.email && !form.email) {
      setForm(f => ({ ...f, email: user.email || '' }));
    }
  }, [user?.email]);

  // Fetch user's existing tickets if logged in
  const ticketsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'support_tickets'), where('senderUserId', '==', user.uid), orderBy('updatedAt', 'desc'));
  }, [firestore, user]);

  const { data: myTickets, isLoading: ticketsLoading } = useCollection<any>(ticketsQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.subject || !form.message) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill in email, subject, and message.' });
      return;
    }
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const ticketData = {
        senderEmail: form.email.trim(),
        senderName: user?.displayName || form.email.split('@')[0],
        senderUserId: user ? user.uid : null,
        subject: form.subject.trim(),
        message: form.message.trim(),
        priority: form.priority.toLowerCase(),
        category: form.category,
        status: 'new',
        createdAt: now,
        updatedAt: now,
        slaDeadline: new Date(Date.now() + (form.priority === 'High' ? 3600000 : 14400000)).toISOString(),
      };

      const docRef = await addDoc(collection(firestore || (window as any).db, 'support_tickets'), ticketData);
      
      // Also add initial message to subcollection
      await addDoc(collection(firestore || (window as any).db, 'support_tickets', docRef.id, 'messages'), {
        senderId: user ? user.uid : 'guest',
        senderName: user?.displayName || form.email.split('@')[0],
        text: form.message.trim(),
        sentAt: now,
      });

      setSuccessTicketId(docRef.id);
      toast({ title: 'Ticket submitted successfully!', description: `Reference ID: ${docRef.id}. Our team will respond shortly.` });
      setForm({
        email: user?.email || '',
        phone: '',
        subject: '',
        category: 'Onboarding',
        priority: 'Medium',
        message: '',
      });
    } catch (err: any) {
      console.error('Support ticket submission error:', err);
      toast({ variant: 'destructive', title: 'Submission failed', description: err?.message || 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-color)] flex flex-col">
      <main className="flex-grow flex flex-col py-12 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-[var(--secondary-color)] mb-6">
              <i className="fa-solid fa-headset text-3xl"></i>
            </div>
            <h1 className="font-bold text-3xl sm:text-4xl mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Support Help-Desk</h1>
            <p className="text-[var(--text-muted)] text-lg">Submit a ticket and our team will get back to you shortly.</p>
          </div>

          {successTicketId && (
            <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900 shadow-sm">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 mb-2" />
              <h3 className="text-lg font-bold">Ticket Submitted Successfully!</h3>
              <p className="text-sm mt-1">Your Reference ID is <code className="font-mono font-bold bg-emerald-100 px-2 py-0.5 rounded">{successTicketId}</code>. We have received your inquiry and will reply to <strong>{form.email}</strong>.</p>
              <button onClick={() => setSuccessTicketId(null)} className="mt-4 btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700 border-none">Submit Another Ticket</button>
            </div>
          )}

          <div className="bg-[var(--surface-color)] p-6 sm:p-10 rounded-3xl border border-[var(--border-color)] shadow-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-color)]">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="input w-full bg-white border-[var(--border-color)] focus:border-[var(--secondary-color)] text-slate-900"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-color)]">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="input w-full bg-white border-[var(--border-color)] focus:border-[var(--secondary-color)] text-slate-900"
                    placeholder="+254..."
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-color)]">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="input w-full bg-white border-[var(--border-color)] focus:border-[var(--secondary-color)] text-slate-900"
                  placeholder="Brief summary of your issue"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-color)]">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="select w-full bg-white border-[var(--border-color)] focus:border-[var(--secondary-color)] text-slate-900"
                  >
                    <option value="Onboarding">Onboarding</option>
                    <option value="Verification">Verification</option>
                    <option value="Billing">Billing</option>
                    <option value="Technical">Technical</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-color)]">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="select w-full bg-white border-[var(--border-color)] focus:border-[var(--secondary-color)] text-slate-900"
                  >
                    <option value="Low">Low (24h SLA)</option>
                    <option value="Medium">Medium (4h SLA)</option>
                    <option value="High">High (1h SLA)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-color)]">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="textarea w-full bg-white border-[var(--border-color)] focus:border-[var(--secondary-color)] h-32 resize-none text-slate-900"
                  placeholder="Provide details about your request..."
                  required
                ></textarea>
              </div>

              <div className="pt-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn w-full sm:w-auto px-10 bg-[var(--secondary-color)] hover:bg-blue-700 text-white border-none rounded-xl h-12 text-base cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Ticket
                </button>
                <p className="text-xs text-[var(--text-muted)] max-w-sm">
                  By submitting, a support agent will be assigned to your case based on your selected priority.
                </p>
              </div>
            </form>
          </div>

          {user && (
            <div className="mt-12">
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Your Support Tickets</h3>
              {ticketsLoading ? (
                <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[var(--secondary-color)]" /></div>
              ) : myTickets && myTickets.length > 0 ? (
                <div className="space-y-4">
                  {myTickets.map((t: any) => (
                    <div key={t.id} className="bg-[var(--surface-color)] p-5 rounded-2xl border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[var(--text-muted)]">#{t.id.slice(0, 8)}</span>
                          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black uppercase', t.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800')}>
                            {t.status || 'new'}
                          </span>
                        </div>
                        <h4 className="font-bold text-base mt-1">{t.subject}</h4>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.message?.slice(0, 100)}...</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-[var(--text-muted)]">{t.createdAt ? formatDistanceToNow(new Date(t.createdAt), { addSuffix: true }) : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)] bg-[var(--surface-color)] p-6 rounded-2xl border border-[var(--border-color)] text-center">You haven't submitted any support tickets yet.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
