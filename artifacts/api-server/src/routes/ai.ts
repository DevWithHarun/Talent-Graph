/**
 * AI routes — Gemini API via direct REST (no Genkit library needed).
 * Requires: VITE_FIREBASE_API_KEY (or FIREBASE_API_KEY) for token verification,
 *           GOOGLE_GENAI_API_KEY (or AI_INTEGRATIONS_GEMINI_API_KEY) for Gemini.
 */
import { Router } from 'express';
import { verifyBearerToken } from '../lib/server-auth';

const router = Router();

const GEMINI_API_KEY =
  process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
const GEMINI_BASE_URL =
  process.env.AI_INTEGRATIONS_GEMINI_BASE_URL ||
  'https://generativelanguage.googleapis.com';
const GEMINI_MODEL = 'gemini-2.5-flash';

async function geminiGenerate(prompt: string): Promise<string> {
  const url = `${GEMINI_BASE_URL}/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini error: ${JSON.stringify((err as any)?.error?.message ?? res.status)}`);
  }
  const data = await res.json() as any;
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// POST /api/ai/scouting-report
router.post('/ai/scouting-report', async (req, res) => {
  const uid = await verifyBearerToken(req.headers.authorization);
  if (!uid) { res.status(401).json({ error: 'Unauthorized' }); return; }
  if (!GEMINI_API_KEY) { res.status(503).json({ error: 'AI not configured. Set GOOGLE_GENAI_API_KEY.' }); return; }

  try {
    const { athlete } = req.body;
    if (!athlete?.firstName || !athlete?.lastName) {
      res.status(400).json({ error: 'athlete.firstName and athlete.lastName are required' });
      return;
    }

    const name = `${athlete.firstName} ${athlete.lastName}`;
    const prompt = `
You are an expert football scout. Write a detailed scouting report for the following athlete.
Return ONLY valid JSON with this exact structure:
{
  "summary": "2-3 sentence professional summary",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areasForImprovement": ["area 1", "area 2"],
  "recommendation": "one of: 'sign', 'trial', 'monitor', 'pass'",
  "compositeScore": <number 0-100>,
  "detailedAnalysis": "2-3 paragraphs"
}

Athlete: ${name}
Position: ${athlete.position ?? 'Unknown'}
Age: ${athlete.age ?? 'Unknown'}
Nationality: ${athlete.nationality ?? 'Unknown'}
Stats: ${JSON.stringify(athlete.stats ?? {})}
    `.trim();

    const text = await geminiGenerate(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse AI response');
    const report = JSON.parse(jsonMatch[0]);
    res.json({ report });
  } catch (err: any) {
    console.error('[AI scouting-report]', err.message);
    res.status(500).json({ error: `Failed to generate report: ${err.message}` });
  }
});

// POST /api/ai/shortlist
router.post('/ai/shortlist', async (req, res) => {
  const uid = await verifyBearerToken(req.headers.authorization);
  if (!uid) { res.status(401).json({ error: 'Unauthorized' }); return; }
  if (!GEMINI_API_KEY) { res.status(503).json({ error: 'AI not configured. Set GOOGLE_GENAI_API_KEY.' }); return; }

  try {
    const { criteria, athletes } = req.body;
    if (!criteria || !athletes?.length) {
      res.status(400).json({ error: 'criteria and athletes are required' });
      return;
    }

    const prompt = `
You are an expert football scout. Rank the following athletes based on the given criteria.
Return ONLY valid JSON: an array of objects with "athleteId", "rank", "score" (0-100), and "reasoning".

Criteria: ${JSON.stringify(criteria)}
Athletes: ${JSON.stringify(athletes)}
    `.trim();

    const text = await geminiGenerate(prompt);
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Could not parse AI response');
    const ranked = JSON.parse(jsonMatch[0]);
    res.json({ ranked });
  } catch (err: any) {
    console.error('[AI shortlist]', err.message);
    res.status(500).json({ error: `Failed to shortlist: ${err.message}` });
  }
});

export default router;
