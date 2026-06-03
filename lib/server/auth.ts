import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase/admin';

export const SESSION_COOKIE_NAME = '__session';

export interface SessionUser {
  uid: string;
  email?: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}
