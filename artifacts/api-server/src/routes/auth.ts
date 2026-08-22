import { Router } from 'express';
import { FIREBASE_API_KEY } from '../lib/server-auth';

const router = Router();

const APP_URL = process.env.APP_URL || 'https://talent-graph.vercel.app';

// GET /api/auth/google/url — returns the Google OAuth consent URL
router.get('/auth/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.status(500).json({ error: 'Google OAuth not configured' });
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${APP_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    access_type: 'offline',
  });

  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
});

// GET /api/auth/google/callback — exchanges code for tokens and redirects to frontend
router.get('/auth/google/callback', async (req, res) => {
  const { code, error } = req.query as Record<string, string>;

  if (error || !code) {
    res.redirect(`${APP_URL}/login?error=google_cancelled`);
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${APP_URL}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.id_token) {
      console.error('[google/callback] token exchange failed:', tokenData);
      res.redirect(`${APP_URL}/login?error=google_failed`);
      return;
    }

    const googleIdToken: string = tokenData.id_token;

    const firebaseRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postBody: `id_token=${googleIdToken}&providerId=google.com`,
          requestUri: redirectUri,
          returnIdpCredential: true,
          returnSecureToken: true,
        }),
      }
    );
    const firebaseData = await firebaseRes.json();
    if (!firebaseRes.ok || !firebaseData.localId) {
      console.error('[google/callback] Firebase signInWithIdp failed:', firebaseData);
      res.redirect(`${APP_URL}/login?error=firebase_failed`);
      return;
    }

    const { localId, email, displayName, photoUrl, isNewUser } = firebaseData;
    const params = new URLSearchParams({
      googleToken: googleIdToken,
      uid: localId,
      email: email ?? '',
      name: displayName ?? '',
      photo: photoUrl ?? '',
      isNew: isNewUser ? '1' : '0',
    });
    res.redirect(`${APP_URL}/auth/google-complete?${params.toString()}`);
  } catch (err: any) {
    console.error('[google/callback] unhandled error:', err);
    res.redirect(`${APP_URL}/login?error=server_error`);
  }
});

export default router;
