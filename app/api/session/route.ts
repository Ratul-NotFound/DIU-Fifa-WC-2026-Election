import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase/admin';
import { SESSION_COOKIE_NAME } from '@/lib/server/auth';

const SESSION_EXPIRES_MS = 5 * 24 * 60 * 60 * 1000;
const DIU_EMAIL_REGEX = /@diu\.edu\.bd$/i;

export async function POST(request: Request) {
  try {
    const { idToken } = (await request.json()) as { idToken?: string };
    if (!idToken) {
      return Response.json({ success: false, error: 'Missing ID token.' }, { status: 400 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    if (!decoded.email || !DIU_EMAIL_REGEX.test(decoded.email)) {
      return Response.json({ success: false, error: 'Only @diu.edu.bd accounts are allowed.' }, { status: 403 });
    }

    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: Math.floor(SESSION_EXPIRES_MS / 1000),
      path: '/',
    });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ success: false, error: (err as Error).message }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return Response.json({ success: true });
}
