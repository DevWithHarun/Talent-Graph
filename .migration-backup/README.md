# Talent Graph Kenya

A sports intelligence and recruitment platform connecting athletes, coaches, scouts, and clubs across Kenya and East Africa.

## What It Does

**For athletes** — Build a verified, data-driven profile. Log match performance, track physical metrics, receive squad invitations, and get discovered by scouts and clubs.

**For coaches & clubs** — Manage your squad, log and verify athlete statistics, run training sessions, send squad invitations, and communicate with players in-app.

**For scouts** — Search and filter athletes by position, age, CSI score, and risk profile. Generate AI-powered scouting reports. Track recruitment pipeline from first contact to sign.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Cloud Firestore |
| Auth | Firebase Authentication |
| Storage | Firebase Storage |
| AI | Google Gemini via Genkit |
| Styling | Tailwind CSS + Shadcn/UI |
| SMS | BulkSMS (Kenya carriers) |
| Deployment | Firebase App Hosting |

## Key Features

- **Composite Scouting Index (CSI)** — A weighted 0–100 score computed from performance, efficiency, consistency, context, development trajectory, and risk
- **Verified statistics** — Coaches log and verify match stats; athletes confirm entries creating a dual-signed record
- **Ghost player claims** — Coaches can log stats for unregistered players; athletes claim their history when they sign up
- **Real-time squad management** — Live squad invites, notifications, and acceptance flow
- **AI scouting reports** — Gemini-powered executive summaries with recruitment verdicts
- **Multi-role dashboards** — Separate, purpose-built dashboards for athletes, coaches, club admins, scouts, and analysts
- **PWA** — Installable on Android; works on low-bandwidth mobile connections

## Project Structure

```
src/
├── app/                  # Next.js App Router (pages + API routes)
│   ├── dashboard/        # Athlete dashboard
│   ├── coach-dashboard/  # Coach views
│   ├── club-dashboard/   # Club admin views
│   ├── scout-dashboard/  # Scout views
│   ├── analyst-dashboard/# Analyst views
│   └── api/              # Server-side route handlers
├── components/           # Feature-scoped UI components
├── firebase/             # Firebase config + custom React hooks
├── lib/                  # Business logic (scoring, SMS, types)
└── ai/                   # Genkit AI flows
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full system design, data model, and engineering decisions.

## Local Development

```bash
npm install
npm run dev
```

Requires a Firebase project. Copy `.env.example` to `.env.local` and fill in your Firebase config values.

## Security

Firestore Security Rules enforce role-based access at the database layer — not the application layer. Every read and write is validated server-side regardless of client code. See `firestore.rules` for the full rule set.

## License

Private — All rights reserved.
