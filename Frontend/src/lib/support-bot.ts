import { GoogleGenAI } from '@google/genai';

export const TALENT_GRAPH_SYSTEM_PROMPT = `You are "ScoutAI", the official AI Support & Onboarding Guide for Talent Graph (https://talent-graph.vercel.app), the verified sports recruitment and intelligence platform connecting athletes, scouts, coaches, and clubs across Africa and worldwide.

Your role:
1. Guide users through onboarding (for Athletes, Scouts, Coaches, Clubs).
2. Help users resolve any issues they face (email verification, login, metrics syncing, match logging, photo/video uploads).
3. If they need to report a bug or talk to human support, instruct them that they can click the "Create Support Ticket" button in this chat to submit a ticket directly!

Platform Knowledge:
- Mission: "Where Athletic Talent Becomes Visible".
- 6 Verification Layers: Identity/Safeguarding, Coach validation, Club affiliation, Match data, Baseline trials, Risk Intelligence.
- Athletes: Register, verify email, choose Athlete role, enter vitals, positions, link club, submit baseline metrics (vertical jump, agility, sprint), rate tactical attributes to generate radar charts, log matches, upload highlight reels, and toggle "Actively Looking".
- Clubs: Register organization, manage squad readiness (Available, Doubtful, Injured, Suspended), organize drill libraries, schedule fixtures, run live pitch match tracking, and network with other clubs.
- Scouts: Filter talent by age, position, rating, CSI; generate AI scouting reports, shortlist candidates, direct message.
- Coaches: Verify player metrics and matches, squad communication via SMS/chat, manage drills and sessions.

Troubleshooting Common Issues:
- Didn't receive verification email? Check Spam/Promotions folder or click "Resend verification email".
- Metric says "Self-Reported ⏳"? It will turn to "Verified ✅" once your coach or club admin reviews and approves it.
- Can't log match? Make sure you have completed at least your baseline athletic profile.
- Need human support or ticket? Click "Create Support Ticket" above or tell me your issue and you can submit a ticket right here.

Keep responses friendly, structured with bullet points, and helpful!`;

export function getKnowledgeFallback(question: string): string {
  const q = question.toLowerCase();

  // Support ticket intent
  if (q.includes('ticket') || q.includes('human') || q.includes('complaint') || q.includes('bug') || q.includes('issue') || q.includes('contact support') || q.includes('help desk')) {
    return `### Need Help or Want to Submit a Support Ticket?
You can open an official support ticket right now!
- Click the **"🎫 Create Ticket"** tab at the top of this window.
- Enter your name, email, issue category, and description.
- Our support team reviews all tickets promptly and replies directly to your email.

You can also ask me about **onboarding**, **email verification**, **metric verification**, or **logging matches** right here!`;
  }

  // Onboarding guidance
  if (q.includes('onboard') || q.includes('get started') || q.includes('how to start') || q.includes('new user') || q.includes('guide')) {
    return `### 🚀 Welcome to Talent Graph! Here's Your Onboarding Guide:

Choose your path to get started:
1. **Athletes:**
   - Sign up at [Create Account](/signup)
   - Verify your email via the link sent to your inbox.
   - Fill in your vitals (height, weight, dominant foot, positions).
   - Link your current club (or enter your school/grassroots team).
   - Enter baseline trials (vertical jump, sprint, agility) & rate your attributes for your **Radar Chart**.
   - Log your first match to start building your verified history!

2. **Clubs & Academies:**
   - Sign up and choose **Club / Organization**.
   - Fill in official club name, city, and primary sports focus.
   - Access the **Club Command Center**: invite staff, add squad members, and set up live match fixtures.

3. **Scouts & Coaches:**
   - Choose **Scout** to access the talent search marketplace and AI evaluations.
   - Choose **Coach** to manage squads and verify player performance metrics.`;
  }

  // Account creation & Registration
  if (q.includes('create') && (q.includes('account') || q.includes('profile') || q.includes('register') || q.includes('sign up'))) {
    return `### How to Create an Account on Talent Graph:
1. Click **"Build Your Athlete Profile"** or **"For Coaches, Scouts & Clubs"** on the landing page.
2. Enter your name, email, and password, then agree to the terms.
3. Check your email inbox (or Spam/Promotions folder) and click the verification link.
4. Select your role (**Athlete**, **Scout**, **Coach**, or **Club/Organization**).
5. Complete your profile details:
   - **Athletes:** Enter vitals, sport, position, club affiliation, and baseline metrics.
   - **Clubs:** Enter official club name, location, sports focus, and admin contact details.`;
  }

  // Email verification issues
  if (q.includes('email') && (q.includes('verif') || q.includes('link') || q.includes('spam') || q.includes('receive'))) {
    return `### ✉️ Troubleshooting Email Verification:
1. **Check Spam & Promotions:** Most verification emails arrive within 10 seconds but may land in your Spam or Promotions tabs.
2. **Resend Link:** On the verification screen, click **"Resend verification email"**.
3. **Gmail / Workspace:** If using Gmail, search for \`from:Talent Graph\` or check the Updates folder.
4. **Already Verified?** Click the **"I've verified my email"** button to proceed straight to role selection!

*Still having trouble? Switch to the "🎫 Create Ticket" tab above to have our team verify your account manually.*`;
  }

  // Verification system
  if (q.includes('verif') || q.includes('badge') || q.includes('layer') || q.includes('approve')) {
    return `### How Verification Works on Talent Graph:
Talent Graph uses **6 verification layers** to guarantee authenticity for scouts and clubs:
1. **Persona / Identity Verification:** Confirming real identity and safeguarding status.
2. **Coach Verification:** Registered coaches review and officially approve self-reported athlete metrics.
3. **Club Affiliation:** Official club roster confirmation so scouts know where you play.
4. **Match Evidence:** Cross-referenced match logs with opponent and referee validation.
5. **Physical Testing / Trials:** Verified Combine / trial metric benchmarks.
6. **Risk Intelligence:** Injury history and availability tracking.

*Note: Self-reported metrics show a "⏳ Self-Reported" badge until your coach or club admin verifies them into a "✅ Verified" badge.*`;
  }

  // Match logging
  if (q.includes('match') || q.includes('log') || q.includes('derby') || q.includes('fixture')) {
    return `### How to Log Matches:
- **Athletes:** Click the **"Log Match"** button on your Athlete Dashboard. Fill in the competition (League, Cup, Friendly), opponent club, minutes played, goals, assists, fouls, cards, and performance rating (1–10).
- **Clubs & Coaches:** Use the **Live Match Tracker** in the Club Admin console to schedule fixtures and log real-time game events (goals, substitutions, bookings) directly on the pitch.`;
  }

  // Metrics, attributes, radar charts
  if (q.includes('metric') || q.includes('radar') || q.includes('attribute') || q.includes('csi') || q.includes('score')) {
    return `### Metrics & Player Attributes:
- **Baseline Metrics:** Track 30m Sprint (sec), Vertical Jump (cm), Illinois Agility (sec), and Pass Completion (%).
- **Tactical, Technical, Mental & Physical Attributes:** Rate yourself across 30+ criteria (1–10 scale) to generate your **Institutional Radar Chart** and **Master Index (CSI Rating)**.
- **Coach Calibration:** Once your coach verifies your performance, your profile completeness rises toward 100%!`;
  }

  // Video highlights
  if (q.includes('video') || q.includes('highlight') || q.includes('clip') || q.includes('upload')) {
    return `### Adding Videos & Highlights:
1. Open your Athlete Dashboard and click **"Edit Profile"**.
2. Switch to the **"Video"** or **"Showcase"** tab.
3. Upload your highlight reel (e.g. Season 2025/26 Highlights) or showcase video (e.g. free kicks, skills).
4. Supported formats: MP4, WebM, and MOV up to 500MB with automatic compression.`;
  }

  // Scouts
  if (q.includes('scout') || q.includes('shortlist') || q.includes('discover')) {
    return `### For Scouts & Talent Evaluators:
- **Search & Filter:** Find athletes filtered by age, position, nationality, CSI rating, and competition level.
- **Scouting Reports:** Build structured scouting evaluations with AI performance summaries and private notes.
- **Pipeline:** Organize prospective signings into stages (Identified, Shortlisted, Trial Invited, Signed).
- **Direct Messaging:** Reach out to athletes and club directors through secure real-time messaging.`;
  }

  // Club squad & training
  if (q.includes('club') || q.includes('squad') || q.includes('training') || q.includes('staff')) {
    return `### For Clubs & Academies:
- **Squad Command:** Manage readiness (Available, Doubtful, Injured, Suspended) and track profile completeness.
- **Training Drills:** Build a drill library and schedule training sessions with automated squad alerts.
- **Club Directory:** Connect with other African and international clubs for friendlies and transfer inquiries.
- **Match Tracker:** Record official team fixtures with lineup sheets and live match logging.`;
  }

  // General fallback
  return `Talent Graph is the verified sports intelligence platform connecting athletes, scouts, and clubs across Africa and worldwide.

Here are key things I can help you with:
- **Onboarding Guides:** Step-by-step guidance for Athletes, Scouts, Coaches, and Clubs.
- **Verification:** How to get your stats, matches, and identity verified.
- **Troubleshooting:** Issues with email verification, logging matches, or profile updates.
- **Support Tickets:** You can click the **"🎫 Create Ticket"** tab above to submit a ticket to our support team anytime!

What would you like assistance with?`;
}

export async function askSupportBot(userMessage: string, history: Array<{ role: 'user' | 'model'; text: string }> = []): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || '';

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const contents = [
        ...history.map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.text }],
        })),
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: TALENT_GRAPH_SYSTEM_PROMPT,
          temperature: 0.6,
        },
      });

      if (response.text) {
        return response.text;
      }
    } catch {
      // Quietly fall back to our comprehensive knowledge engine without logging noisy warnings
    }
  }

  return getKnowledgeFallback(userMessage);
}
