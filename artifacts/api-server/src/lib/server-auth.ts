// Firebase Identity Toolkit token verification — no Firebase Admin SDK required.

export const FIREBASE_API_KEY = 'AIzaSyDLmugbxMX_0QGxxKRzuUR-9nqtiFBgDQ0';
export const FIREBASE_PROJECT_ID = 'studio-1186001190-d08bc';

export async function verifyIdToken(idToken: string): Promise<string | null> {
  if (!idToken) return null;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    const data = await res.json() as any;
    if (!res.ok || !data.users?.[0]?.localId) return null;
    return data.users[0].localId as string;
  } catch {
    return null;
  }
}

export async function verifyBearerToken(
  authorization: string | undefined
): Promise<string | null> {
  if (!authorization?.startsWith('Bearer ')) return null;
  return verifyIdToken(authorization.slice(7).trim());
}

export async function verifyBearerOrInternal(
  authorization: string | undefined
): Promise<string | null> {
  if (!authorization) return null;
  if (authorization.startsWith('Internal ')) {
    const provided = authorization.slice(9).trim();
    const secret = process.env.SMS_SECRET;
    if (secret && provided === secret) return 'internal';
    return null;
  }
  if (authorization.startsWith('Bearer ')) {
    return verifyIdToken(authorization.slice(7).trim());
  }
  return null;
}
