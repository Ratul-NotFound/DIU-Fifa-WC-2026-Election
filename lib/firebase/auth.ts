import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './config';
import { createUserProfile, getUserProfile, setUserRole } from './firestore';

const DIU_DOMAIN = '@diu.edu.bd';

// ── Validators ─────────────────────────────────────────────
export function isDIUEmail(email: string): boolean {
  return email.toLowerCase().endsWith(DIU_DOMAIN);
}

/** Returns true if Firebase Auth is configured and ready */
function authReady(): boolean {
  return Boolean(auth);
}

// ── Google Sign-In (DIU Workspace) ─────────────────────────
export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  if (!authReady()) {
    // ── DEMO MODE FALLBACK ──
    if (typeof window !== 'undefined') {
      const mockUser = {
        uid: 'demo_student_55',
        displayName: 'Demo DIU Student',
        email: 'student.cse@diu.edu.bd',
        emailVerified: true,
      } as unknown as User;
      localStorage.setItem('diu_mock_user', JSON.stringify(mockUser));
      await ensureUserProfile(mockUser);
      window.location.reload();
      return { success: true };
    }
    return { success: false, error: 'Firebase is not configured.' };
  }
  try {
    const provider = new GoogleAuthProvider();
    // Hint the Google account picker to DIU workspace
    provider.setCustomParameters({ hd: 'diu.edu.bd' });

    await signInWithRedirect(auth, provider);
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
    // ── DEMO MODE FALLBACK ──
    if (typeof window !== 'undefined') {
      if (!isDIUEmail(email)) {
        return { success: false, error: 'Only @diu.edu.bd email addresses are allowed.' };
      }
      const mockUser = {
        uid: 'demo_user_' + Math.random().toString(36).slice(2, 8),
        displayName,
        email,
        emailVerified: true,
      } as unknown as User;
      localStorage.setItem('diu_mock_user', JSON.stringify(mockUser));
      await ensureUserProfile(mockUser, displayName);
      window.location.reload();
      return { success: true };
    }
    return { success: false, error: 'Firebase is not configured.' };
  }
  if (!isDIUEmail(email)) {
    return { success: false, error: 'Only @diu.edu.bd email addresses are allowed.' };
  }
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(credential.user);
    await ensureUserProfile(credential.user, displayName);
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
    // ── DEMO MODE FALLBACK ──
    if (typeof window !== 'undefined') {
      if (!isDIUEmail(email)) {
        return { success: false, error: 'Only @diu.edu.bd email addresses are allowed.' };
      }
      // Check if it's admin login for seed ease
      const role = email.startsWith('admin') ? 'superAdmin' : 'student';
      const mockUser = {
        uid: 'demo_user_' + Math.random().toString(36).slice(2, 8),
        displayName: email.split('@')[0].replace('.', ' ').toUpperCase(),
        email,
        emailVerified: true,
      } as unknown as User;
      localStorage.setItem('diu_mock_user', JSON.stringify(mockUser));
      
      // Ensure user profile in database
      const existing = await getUserProfile(mockUser.uid);
      if (!existing) {
        await createUserProfile({
          uid: mockUser.uid,
          name: mockUser.displayName || 'Demo User',
          email: mockUser.email || '',
          studentId: '201-15-' + Math.floor(1000 + Math.random() * 9000),
          department: 'CSE',
          batch: '55th',
          role: role as any,
          favoriteTeam: '',
          emailVerified: true,
          votedPositions: [],
          createdAt: Date.now(),
        });
      }
      
      window.location.reload();
      return { success: true };
    }
    return { success: false, error: 'Firebase is not configured.' };
  }
  if (!isDIUEmail(email)) {
    return { success: false, error: 'Only @diu.edu.bd email addresses are allowed.' };
  }
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    if (!credential.user.emailVerified) {
      return { success: false, error: 'Please verify your email first. Check your inbox.' };
    }
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
  if (!authReady()) return { success: true };
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
  if (!authReady()) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('diu_mock_user');
      window.location.reload();
    }
    return;
  }
  await signOut(auth);
}

// ── Auth State Observer ────────────────────────────────────
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (!authReady()) {
    if (typeof window !== 'undefined') {
      const mock = localStorage.getItem('diu_mock_user');
      if (mock) {
        try {
          callback(JSON.parse(mock) as User);
          return () => {};
        } catch {
          // ignore
        }
      }
    }
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      if (firebaseUser.email && isDIUEmail(firebaseUser.email)) {
        try {
          await ensureUserProfile(firebaseUser);
        } catch (err) {
          console.error("Error ensuring user profile:", err);
        }
      } else {
        // Not a DIU email — sign them out
        await signOut(auth);
        callback(null);
        return;
      }
    }
    callback(firebaseUser);
  });
}

// ── Internal: ensure Firestore user doc ───────────────────
async function ensureUserProfile(user: User, displayName?: string): Promise<void> {
  const existing = await getUserProfile(user.uid);
  const isSuperAdminEmail = user.email === 'ratul23105101298@diu.edu.bd';
  if (!existing) {
    const emailPrefix = user.email ? user.email.split('@')[0] : '';
    // DIU Student ID format: 201-15-5678 or similar digits-digits-digits
    const isStudentId = /^\d{2,3}-\d{2,3}-\d{4,6}$/.test(emailPrefix);
    await createUserProfile({
      uid: user.uid,
      name: displayName || user.displayName || 'Demo Student',
      email: user.email || '',
      studentId: isStudentId ? emailPrefix : '201-15-5678',
      department: 'CSE',
      batch: '55th',
      role: isSuperAdminEmail ? 'superAdmin' : 'student',
      favoriteTeam: '',
      emailVerified: user.emailVerified,
      votedPositions: [],
      createdAt: Date.now(),
    });
  } else if (isSuperAdminEmail && existing.role !== 'superAdmin') {
    await setUserRole(user.uid, 'superAdmin');
  }
}
