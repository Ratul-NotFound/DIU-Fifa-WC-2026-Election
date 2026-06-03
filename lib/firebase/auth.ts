import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './config';
import { createUserProfile, getUserProfile, updateUserProfile } from './firestore';

const DIU_DOMAIN = '@diu.edu.bd';

// ── Validators ─────────────────────────────────────────────
export function isDIUEmail(email: string): boolean {
  return email.toLowerCase().endsWith(DIU_DOMAIN);
}

/** Returns true if Firebase Auth is configured and ready */
function authReady(): boolean {
  return Boolean(auth);
}

async function createSessionCookie(): Promise<void> {
  if (!authReady()) return;
  const user = auth.currentUser;
  if (!user) return;
  const idToken = await user.getIdToken(true);
  await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
}

// ── Google Sign-In (DIU Workspace) ─────────────────────────
export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  if (!authReady()) {
    return { success: false, error: 'Firebase is not configured.' };
  }
  try {
    const provider = new GoogleAuthProvider();
    // Hint the Google account picker to DIU workspace
    provider.setCustomParameters({ hd: 'diu.edu.bd' });

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (!user.email || !isDIUEmail(user.email)) {
      await signOut(auth);
      return { success: false, error: 'Only @diu.edu.bd Google accounts are allowed.' };
    }

    // Create or ensure user profile exists in Firestore
    await ensureUserProfile(user);
    await createSessionCookie();
    return { success: true };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Sign-in cancelled.' };
    }
    return { success: false, error: error.message || 'Sign-in failed.' };
  }
}

// ── Email/Password Registration ────────────────────────────
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<{ success: boolean; error?: string }> {
  if (!authReady()) {
    return { success: false, error: 'Firebase is not configured.' };
  }
  if (!isDIUEmail(email)) {
    return { success: false, error: 'Only @diu.edu.bd email addresses are allowed.' };
  }
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(credential.user);
    await ensureUserProfile(credential.user, displayName);
    await signOut(auth);
    return { success: true };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === 'auth/email-already-in-use') {
      return { success: false, error: 'This email is already registered.' };
    }
    if (error.code === 'auth/weak-password') {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    return { success: false, error: error.message || 'Registration failed.' };
  }
}

// ── Email/Password Login ───────────────────────────────────
export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  if (!authReady()) {
    return { success: false, error: 'Firebase is not configured.' };
  }
  if (!isDIUEmail(email)) {
    return { success: false, error: 'Only @diu.edu.bd email addresses are allowed.' };
  }
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    if (!credential.user.emailVerified) {
      await signOut(auth);
      return { success: false, error: 'Please verify your email first. Check your inbox.' };
    }
    await ensureUserProfile(credential.user);
    await updateUserProfile(credential.user.uid, { emailVerified: true });
    await createSessionCookie();
    return { success: true };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
      return { success: false, error: 'Invalid email or password.' };
    }
    return { success: false, error: error.message || 'Login failed.' };
  }
}

// ── Resend Verification ────────────────────────────────────
export async function resendVerification(): Promise<{ success: boolean; error?: string }> {
  if (!authReady()) return { success: false, error: 'Firebase is not configured.' };
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'Not logged in.' };
  try {
    await sendEmailVerification(user);
    return { success: true };
  } catch {
    return { success: false, error: 'Could not send verification email.' };
  }
}

// ── Sign Out ───────────────────────────────────────────────
export async function logout(): Promise<void> {
  if (!authReady()) return;
  await fetch('/api/session', { method: 'DELETE' });
  await signOut(auth);
}

// ── Auth State Observer ────────────────────────────────────
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (!authReady()) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// ── Internal: ensure Firestore user doc ───────────────────
async function ensureUserProfile(user: User, displayName?: string): Promise<void> {
  const existing = await getUserProfile(user.uid);
  if (!existing) {
    await createUserProfile({
      uid: user.uid,
      name: displayName || user.displayName || 'Demo Student',
      email: user.email || '',
      studentId: '201-15-5678',
      department: 'CSE',
      batch: '55th',
      role: 'student',
      favoriteTeam: '',
      emailVerified: user.emailVerified,
      votedPositions: [],
      createdAt: Date.now(),
    });
  }
}
