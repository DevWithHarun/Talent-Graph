import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { PWARegister } from '@/components/pwa-register';
import { DashboardErrorBoundary } from '@/components/coach/dashboard-error-boundary';
import { Loader2 } from 'lucide-react';

// Static layout imports (synchronous — they're route wrappers)
import CoachDashboardLayout from '@/app/coach-dashboard/layout';
import ClubDashboardLayout from '@/app/club-dashboard/layout';
import AnalystDashboardLayout from '@/app/analyst-dashboard/layout';
import AthleteDashboardLayout from '@/app/dashboard/layout';

// ─── Lazy page imports ───────────────────────────────────────────────────────

// Root
const HomePage = lazy(() => import('@/components/app-router').then(m => ({ default: m.AppRouter })));

// Auth
const LoginPage = lazy(() => import('@/app/(auth)/login/page'));
const SignupPage = lazy(() => import('@/app/(auth)/signup/page'));
const ForgotPasswordPage = lazy(() => import('@/app/(auth)/forgot-password/page'));
const ResetPasswordPage = lazy(() => import('@/app/(auth)/reset-password/page'));
const VerifyEmailPage = lazy(() => import('@/app/verify-email/page'));
const WaitingListPage = lazy(() => import('@/app/waiting-list/page'));
const GoogleCompletePage = lazy(() => import('@/app/auth/google-complete/page'));

// Onboarding
const OnboardingPage = lazy(() => import('@/app/onboarding/page'));

// Athlete dashboard sub-pages
const AchievementsPage = lazy(() => import('@/app/dashboard/achievements/page'));
const AddMatchPage = lazy(() => import('@/app/dashboard/add-match/page'));
const InjuryTrackerPage = lazy(() => import('@/app/dashboard/injury-tracker/page'));
const InvitesPage = lazy(() => import('@/app/dashboard/invites/page'));
const DashboardSettingsPage = lazy(() => import('@/app/dashboard/settings/page'));
const DashboardVerifyPage = lazy(() => import('@/app/dashboard/verify/page'));
const UpdateAttributesPage = lazy(() => import('@/app/dashboard/update-attributes/page'));
const AthleteCareerPage = lazy(() => import('@/app/dashboard/career/page'));

// Coach dashboard
const CoachDashboardPage = lazy(() => import('@/app/coach-dashboard/page'));
const CoachAlertsPage = lazy(() => import('@/app/coach-dashboard/alerts/page'));
const CoachAnalyticsPage = lazy(() => import('@/app/coach-dashboard/analytics/page'));
const CoachClubPage = lazy(() => import('@/app/coach-dashboard/club/page'));
const CoachCommunicationsPage = lazy(() => import('@/app/coach-dashboard/communications/page'));
const CoachConnectPage = lazy(() => import('@/app/coach-dashboard/connect/page'));
const CoachFindClubPage = lazy(() => import('@/app/coach-dashboard/find-club/page'));
const CoachLiveMatchPage = lazy(() => import('@/app/coach-dashboard/live-match/page'));
const CoachMatchEntryPage = lazy(() => import('@/app/coach-dashboard/match-entry/page'));
const CoachMessagesPage = lazy(() => import('@/app/coach-dashboard/messages/page'));
const CoachNotificationsPage = lazy(() => import('@/app/coach-dashboard/notifications/page'));
const CoachSchedulePage = lazy(() => import('@/app/coach-dashboard/schedule/page'));
const CoachSettingsPage = lazy(() => import('@/app/coach-dashboard/settings/page'));
const CoachSquadPage = lazy(() => import('@/app/coach-dashboard/squad/page'));
const CoachStatsPage = lazy(() => import('@/app/coach-dashboard/stats/page'));
const CoachTrainingPage = lazy(() => import('@/app/coach-dashboard/training/page'));
const CoachVerifyPage = lazy(() => import('@/app/coach-dashboard/verify/page'));

// Scout dashboard
const ScoutDashboardPage = lazy(() => import('@/app/scout-dashboard/page'));
const ScoutProfilePage = lazy(() => import('@/app/scout-dashboard/profile/page'));
const ScoutReportPage = lazy(() => import('@/app/scout-dashboard/report/[athleteId]/page'));

// Analyst dashboard
const AnalystDashboardPage = lazy(() => import('@/app/analyst-dashboard/page'));
const AnalystAnalyticsPage = lazy(() => import('@/app/analyst-dashboard/analytics/page'));
const AnalystMatchesPage = lazy(() => import('@/app/analyst-dashboard/matches/page'));
const AnalystMessagesPage = lazy(() => import('@/app/analyst-dashboard/messages/page'));
const AnalystSquadPage = lazy(() => import('@/app/analyst-dashboard/squad/page'));

// Club dashboard
const ClubDashboardPage = lazy(() => import('@/app/club-dashboard/page'));
const ClubAthletesPage = lazy(() => import('@/app/club-dashboard/athletes/page'));
const ClubAthleteReportsPage = lazy(() => import('@/app/club-dashboard/athletes/[athleteId]/reports/page'));
const ClubBillingPage = lazy(() => import('@/app/club-dashboard/billing/page'));
const ClubProfilePage = lazy(() => import('@/app/club-dashboard/club-profile/page'));
const ClubCoachingStaffPage = lazy(() => import('@/app/club-dashboard/coaching-staff/page'));
const ClubLiveMatchPage = lazy(() => import('@/app/club-dashboard/live-match/page'));
const ClubMatchesPage = lazy(() => import('@/app/club-dashboard/matches/page'));
const ClubMessagesPage = lazy(() => import('@/app/club-dashboard/messages/page'));
const ClubMessageConversationPage = lazy(() => import('@/app/club-dashboard/messages/[conversationId]/page'));
const ClubNotificationsPage = lazy(() => import('@/app/club-dashboard/notifications/page'));
const ClubPracticesPage = lazy(() => import('@/app/club-dashboard/practices/page'));
const ClubRequestsPage = lazy(() => import('@/app/club-dashboard/requests/page'));
const ClubSchedulePage = lazy(() => import('@/app/club-dashboard/schedule/page'));
const ClubScoutsPage = lazy(() => import('@/app/club-dashboard/scouts/page'));
const ClubSettingsPage = lazy(() => import('@/app/club-dashboard/settings/page'));
const ClubSquadChatPage = lazy(() => import('@/app/club-dashboard/squad-chat/page'));
const ClubStatsPage = lazy(() => import('@/app/club-dashboard/stats/page'));
const ClubTrialUnlocksPage = lazy(() => import('@/app/club-dashboard/trial-unlocks/page'));
const ClubVerificationPage = lazy(() => import('@/app/club-dashboard/verification/page'));

// Chat
const ChatPage = lazy(() => import('@/app/chat/page'));
const ChatConversationPage = lazy(() => import('@/app/chat/[conversationId]/page'));

// Messages
const MessageConversationPage = lazy(() => import('@/app/messages/[connectionId]/page'));
const UnifiedChatPage = lazy(() => import('@/components/messaging/unified-chat-page').then(m => ({ default: m.UnifiedChatPage })));

// Public pages
const HelpPage = lazy(() => import('@/app/help/page'));
const SupportPage = lazy(() => import('@/app/support/page'));
const JobsPage = lazy(() => import('@/app/jobs/page'));
const JobsAdminDashboardPage = lazy(() => import('@/app/jobs/admin/dashboard/page'));
const JobsAdminLoginPage = lazy(() => import('@/app/jobs/admin/login/page'));
const JobsAdminSignupPage = lazy(() => import('@/app/jobs/admin/signup/page'));
const JobsAdminVerifyEmailPage = lazy(() => import('@/app/jobs/admin/verify-email/page'));
const InvitePage = lazy(() => import('@/app/invite/[id]/page'));
const JoinClubPage = lazy(() => import('@/app/join/club/[clubId]/page'));
const TeamDashboardPage = lazy(() => import('@/app/team-dashboard/page'));
const PrivacyPolicyPage = lazy(() => import('@/app/privacy-policy/page'));
const TermsOfUsePage = lazy(() => import('@/app/terms-of-use/page'));
const FeedPage = lazy(() => import('@/app/feed/page'));
const AthletesPage = lazy(() => import('@/app/athletes/page'));

// Public profile
const ScoutPublicPage = lazy(() => import('@/app/scout/[username]/page'));
const UserProfilePage = lazy(() => import('@/app/[username]/page'));

// 404
const NotFoundPage = lazy(() => import('@/pages/not-found'));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const queryClient = new QueryClient();

const Loading = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

const S = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Loading />}>{children}</Suspense>
);

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseClientProvider>
        <TooltipProvider>
          <PWARegister />
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <DashboardErrorBoundary>
            <Suspense fallback={<Loading />}>
              <Switch>
                {/* ── Auth ── */}
                <Route path="/login">{() => <S><LoginPage /></S>}</Route>
                <Route path="/signup">{() => <S><SignupPage /></S>}</Route>
                <Route path="/forgot-password">{() => <S><ForgotPasswordPage /></S>}</Route>
                <Route path="/reset-password">{() => <S><ResetPasswordPage /></S>}</Route>
                <Route path="/verify-email">{() => <S><VerifyEmailPage /></S>}</Route>
                <Route path="/waiting-list">{() => <S><WaitingListPage /></S>}</Route>
                <Route path="/auth/google-complete">{() => <S><GoogleCompletePage /></S>}</Route>

                {/* ── Onboarding ── */}
                <Route path="/onboarding/:step?">{() => <S><OnboardingPage /></S>}</Route>

                {/* ── Athlete dashboard sub-pages (layout-wrapped) ── */}
                <Route path="/dashboard/add-match">{() => <AthleteDashboardLayout><S><AddMatchPage /></S></AthleteDashboardLayout>}</Route>
                <Route path="/dashboard/achievements">{() => <AthleteDashboardLayout><S><AchievementsPage /></S></AthleteDashboardLayout>}</Route>
                {/* legacy club-chat → career (kept for deep-links) */}
                <Route path="/dashboard/club-chat">{() => { window.location.replace('/dashboard/career'); return null; }}</Route>
                <Route path="/dashboard/injury-tracker">{() => <AthleteDashboardLayout><S><InjuryTrackerPage /></S></AthleteDashboardLayout>}</Route>
                <Route path="/dashboard/invites">{() => <AthleteDashboardLayout><S><InvitesPage /></S></AthleteDashboardLayout>}</Route>
                <Route path="/dashboard/settings">{() => <AthleteDashboardLayout><S><DashboardSettingsPage /></S></AthleteDashboardLayout>}</Route>
                <Route path="/dashboard/verify">{() => <AthleteDashboardLayout><S><DashboardVerifyPage /></S></AthleteDashboardLayout>}</Route>
                <Route path="/dashboard/update-attributes">{() => <AthleteDashboardLayout><S><UpdateAttributesPage /></S></AthleteDashboardLayout>}</Route>
                <Route path="/dashboard/career">{() => <AthleteDashboardLayout><S><AthleteCareerPage /></S></AthleteDashboardLayout>}</Route>

                {/* ── Coach dashboard (layout-wrapped) ── */}
                <Route path="/coach-dashboard">
                  {() => <CoachDashboardLayout><S><CoachDashboardPage /></S></CoachDashboardLayout>}
                </Route>
                <Route path="/coach-dashboard/alerts">
                  {() => <CoachDashboardLayout><S><CoachAlertsPage /></S></CoachDashboardLayout>}
                </Route>
                <Route path="/coach-dashboard/analytics">
                  {() => <CoachDashboardLayout><S><CoachAnalyticsPage /></S></CoachDashboardLayout>}
                </Route>
                <Route path="/coach-dashboard/club">
                  {() => <CoachDashboardLayout><S><CoachClubPage /></S></CoachDashboardLayout>}
                </Route>
                <Route path="/coach-dashboard/communications">
                  {() => <CoachDashboardLayout><S><CoachCommunicationsPage /></S></CoachDashboardLayout>}
                </Route>
                <Route path="/coach-dashboard/connect">
                  {() => <CoachDashboardLayout><S><CoachConnectPage /></S></CoachDashboardLayout>}
                </Route>
                <Route path="/coach-dashboard/find-club">
                  {() => <CoachDashboardLayout><S><CoachFindClubPage /></S></CoachDashboardLayout>}
                </Route>
                <Route path="/coach-dashboard/live-match">
                  {() => <CoachDashboardLayout><S><CoachLiveMatchPage /></S></CoachDashboardLayout>}
                </Route>
                <Route path="/coach-dashboard/match-entry">
                  {() => <CoachDashboardLayout><S><CoachMatchEntryPage /></S></CoachDashboardLayout>}
                </Route>
                <Route path="/coach-dashboard/messages">
                  {() => <CoachDashboardLayout><S><CoachMessagesPage /></S></CoachDashboardLayout>}
                </Route>
                <Route path="/coach-dashboard/notifications">
                  {() => <CoachDashboardLayout><S><CoachNotificationsPage /></S></CoachDashboardLayout>}
                </Route>
                <Route path="/coach-dashboard/schedule">
                  {() => <CoachDashboardLayout><S><CoachSchedulePage /></S></CoachDashboardLayout>}
                </Route>
                <Route path="/coach-dashboard/settings">
                  {() => <CoachDashboardLayout><S><CoachSettingsPage /></S></CoachDashboardLayout>}
                </Route>
                <Route path="/coach-dashboard/squad">
                  {() => <CoachDashboardLayout><S><CoachSquadPage /></S></CoachDashboardLayout>}
                </Route>
                <Route path="/coach-dashboard/stats">
                  {() => <CoachDashboardLayout><S><CoachStatsPage /></S></CoachDashboardLayout>}
                </Route>
                <Route path="/coach-dashboard/training">
                  {() => <CoachDashboardLayout><S><CoachTrainingPage /></S></CoachDashboardLayout>}
                </Route>
                <Route path="/coach-dashboard/verify">
                  {() => <CoachDashboardLayout><S><CoachVerifyPage /></S></CoachDashboardLayout>}
                </Route>

                {/* ── Scout dashboard ── */}
                <Route path="/scout-dashboard">{() => <S><ScoutDashboardPage /></S>}</Route>
                <Route path="/scout-dashboard/profile">{() => <S><ScoutProfilePage /></S>}</Route>
                <Route path="/scout-dashboard/report/:athleteId">{() => <S><ScoutReportPage /></S>}</Route>

                {/* ── Analyst dashboard (layout-wrapped) ── */}
                <Route path="/analyst-dashboard">
                  {() => <AnalystDashboardLayout><S><AnalystDashboardPage /></S></AnalystDashboardLayout>}
                </Route>
                <Route path="/analyst-dashboard/analytics">
                  {() => <AnalystDashboardLayout><S><AnalystAnalyticsPage /></S></AnalystDashboardLayout>}
                </Route>
                <Route path="/analyst-dashboard/matches">
                  {() => <AnalystDashboardLayout><S><AnalystMatchesPage /></S></AnalystDashboardLayout>}
                </Route>
                <Route path="/analyst-dashboard/messages">
                  {() => <AnalystDashboardLayout><S><AnalystMessagesPage /></S></AnalystDashboardLayout>}
                </Route>
                <Route path="/analyst-dashboard/squad">
                  {() => <AnalystDashboardLayout><S><AnalystSquadPage /></S></AnalystDashboardLayout>}
                </Route>

                {/* ── Club dashboard (layout-wrapped) ── */}
                <Route path="/club-dashboard">
                  {() => <ClubDashboardLayout><S><ClubDashboardPage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/club-dashboard/athletes">
                  {() => <ClubDashboardLayout><S><ClubAthletesPage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/club-dashboard/athletes/:athleteId/reports">
                  {() => <ClubDashboardLayout><S><ClubAthleteReportsPage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/club-dashboard/billing">
                  {() => <ClubDashboardLayout><S><ClubBillingPage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/club-dashboard/club-profile">
                  {() => <ClubDashboardLayout><S><ClubProfilePage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/club-dashboard/coaching-staff">
                  {() => <ClubDashboardLayout><S><ClubCoachingStaffPage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/club-dashboard/live-match">
                  {() => <ClubDashboardLayout><S><ClubLiveMatchPage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/club-dashboard/matches">
                  {() => <ClubDashboardLayout><S><ClubMatchesPage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/club-dashboard/messages">
                  {() => <ClubDashboardLayout><S><ClubMessagesPage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/club-dashboard/messages/:conversationId">
                  {() => <ClubDashboardLayout><S><ClubMessageConversationPage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/club-dashboard/notifications">
                  {() => <ClubDashboardLayout><S><ClubNotificationsPage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/club-dashboard/practices">
                  {() => <ClubDashboardLayout><S><ClubPracticesPage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/club-dashboard/requests">
                  {() => <ClubDashboardLayout><S><ClubRequestsPage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/club-dashboard/schedule">
                  {() => <ClubDashboardLayout><S><ClubSchedulePage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/club-dashboard/scouts">
                  {() => <ClubDashboardLayout><S><ClubScoutsPage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/club-dashboard/settings">
                  {() => <ClubDashboardLayout><S><ClubSettingsPage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/club-dashboard/squad-chat">
                  {() => <ClubDashboardLayout><S><ClubSquadChatPage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/club-dashboard/stats">
                  {() => <ClubDashboardLayout><S><ClubStatsPage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/club-dashboard/trial-unlocks">
                  {() => <ClubDashboardLayout><S><ClubTrialUnlocksPage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/club-dashboard/verification">
                  {() => <ClubDashboardLayout><S><ClubVerificationPage /></S></ClubDashboardLayout>}
                </Route>
                <Route path="/team-dashboard">{() => <S><TeamDashboardPage /></S>}</Route>

                {/* ── Chat ── */}
                <Route path="/chat">{() => <S><UnifiedChatPage /></S>}</Route>
                <Route path="/chat/:conversationId">{() => <S><UnifiedChatPage /></S>}</Route>

                {/* ── Messages ── */}
                <Route path="/messages/:connectionId">{() => <S><UnifiedChatPage /></S>}</Route>

                {/* ── Admin & Jobs portal ── */}
                <Route path="/admin">{() => <S><JobsAdminDashboardPage /></S>}</Route>
                <Route path="/admin/dashboard">{() => <S><JobsAdminDashboardPage /></S>}</Route>
                <Route path="/superadmin">{() => <S><JobsAdminDashboardPage /></S>}</Route>
                <Route path="/admin/login">{() => <S><JobsAdminLoginPage /></S>}</Route>
                <Route path="/jobs/admin/dashboard">{() => <S><JobsAdminDashboardPage /></S>}</Route>
                <Route path="/jobs/admin/login">{() => <S><JobsAdminLoginPage /></S>}</Route>
                <Route path="/jobs/admin/signup">{() => <S><JobsAdminSignupPage /></S>}</Route>
                <Route path="/jobs/admin/verify-email">{() => <S><JobsAdminVerifyEmailPage /></S>}</Route>
                <Route path="/jobs">{() => <S><JobsPage /></S>}</Route>

                {/* ── Misc public pages ── */}
                <Route path="/support">{() => <S><SupportPage /></S>}</Route>
                <Route path="/help">{() => <S><HelpPage /></S>}</Route>
                <Route path="/invite/:id">{() => <S><InvitePage /></S>}</Route>
                <Route path="/join/club/:clubId">{() => <S><JoinClubPage /></S>}</Route>
                <Route path="/privacy-policy">{() => <S><PrivacyPolicyPage /></S>}</Route>
                <Route path="/terms-of-use">{() => <S><TermsOfUsePage /></S>}</Route>
                <Route path="/feed">{() => <S><FeedPage /></S>}</Route>
                <Route path="/athletes">{() => <S><AthletesPage /></S>}</Route>

                {/* ── Dynamic public routes (must come last) ── */}
                <Route path="/scout/:username">{() => <S><ScoutPublicPage /></S>}</Route>
                <Route path="/:username">{() => <S><UserProfilePage /></S>}</Route>

                {/* ── Home (root — contains AppRouter with auth-based redirect) ── */}
                <Route path="/">{() => <S><HomePage /></S>}</Route>

                {/* ── 404 ── */}
                <Route>{() => <S><NotFoundPage /></S>}</Route>
              </Switch>
            </Suspense>
            </DashboardErrorBoundary>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </FirebaseClientProvider>
    </QueryClientProvider>
  );
}
