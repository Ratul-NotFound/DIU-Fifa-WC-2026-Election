import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  deleteDoc,
  writeBatch,
  limit,
} from 'firebase/firestore';
import { db } from './config';
import type {
  UserProfile,
  Team,
  Position,
  Candidate,
  ElectionSettings,
  ResultsDoc,
  AuditLog,
} from '@/lib/types';

function assertDb() {
  if (!db) {
    throw new Error('Firebase is not configured. Check your .env settings.');
  }
}

// ══════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  assertDb();
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  assertDb();
  await setDoc(doc(db, 'users', profile.uid), profile);
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  assertDb();
  await updateDoc(doc(db, 'users', uid), data);
}

export async function getAllUsers(): Promise<UserProfile[]> {
  assertDb();
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => d.data() as UserProfile);
}

// ══════════════════════════════════════════════════════════
// TEAMS
// ══════════════════════════════════════════════════════════

export async function getTeams(): Promise<Team[]> {
  assertDb();
  const snap = await getDocs(query(collection(db, 'teams'), orderBy('name')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Team));
}

export async function getTeam(id: string): Promise<Team | null> {
  assertDb();
  const snap = await getDoc(doc(db, 'teams', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Team) : null;
}

export async function createTeam(team: Omit<Team, 'id'>): Promise<string> {
  assertDb();
  const ref = await addDoc(collection(db, 'teams'), { ...team, createdAt: Date.now() });
  return ref.id;
}

export async function updateTeam(id: string, data: Partial<Team>): Promise<void> {
  assertDb();
  await updateDoc(doc(db, 'teams', id), data);
}

export async function deleteTeam(id: string): Promise<void> {
  assertDb();
  await deleteDoc(doc(db, 'teams', id));
}

// ══════════════════════════════════════════════════════════
// POSITIONS
// ══════════════════════════════════════════════════════════

export async function getPositions(): Promise<Position[]> {
  assertDb();
  const snap = await getDocs(query(collection(db, 'positions'), orderBy('order')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Position));
}

export async function createPosition(pos: Omit<Position, 'id'>): Promise<string> {
  assertDb();
  const ref = await addDoc(collection(db, 'positions'), pos);
  return ref.id;
}

export async function updatePosition(id: string, data: Partial<Position>): Promise<void> {
  assertDb();
  await updateDoc(doc(db, 'positions', id), data);
}

export async function deletePosition(id: string): Promise<void> {
  assertDb();
  await deleteDoc(doc(db, 'positions', id));
}

// ══════════════════════════════════════════════════════════
// CANDIDATES
// ══════════════════════════════════════════════════════════

export async function getCandidatesByTeam(teamId: string): Promise<Candidate[]> {
  assertDb();
  const q = query(
    collection(db, 'candidates'),
    where('team', '==', teamId),
    where('approved', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Candidate));
}

export async function getAllCandidates(): Promise<Candidate[]> {
  assertDb();
  const snap = await getDocs(collection(db, 'candidates'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Candidate));
}

export async function getPendingCandidates(): Promise<Candidate[]> {
  assertDb();
  const q = query(collection(db, 'candidates'), where('approved', '==', false));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Candidate));
}

export async function createCandidate(candidate: Omit<Candidate, 'id'>): Promise<string> {
  assertDb();
  const ref = await addDoc(collection(db, 'candidates'), {
    ...candidate,
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function approveCandidate(id: string): Promise<void> {
  assertDb();
  await updateDoc(doc(db, 'candidates', id), { approved: true });
}

export async function rejectCandidate(id: string): Promise<void> {
  assertDb();
  await deleteDoc(doc(db, 'candidates', id));
}

export async function updateCandidate(id: string, data: Partial<Candidate>): Promise<void> {
  assertDb();
  await updateDoc(doc(db, 'candidates', id), data);
}

export async function deleteCandidate(id: string): Promise<void> {
  assertDb();
  await deleteDoc(doc(db, 'candidates', id));
}

// ══════════════════════════════════════════════════════════
// ELECTION SETTINGS
// ══════════════════════════════════════════════════════════

export async function getElectionSettings(): Promise<ElectionSettings | null> {
  assertDb();
  const snap = await getDoc(doc(db, 'electionSettings', 'main'));
  return snap.exists() ? (snap.data() as ElectionSettings) : null;
}

export async function updateElectionSettings(
  data: Partial<ElectionSettings>,
  adminUid: string
): Promise<void> {
  assertDb();
  await setDoc(
    doc(db, 'electionSettings', 'main'),
    { ...data, updatedAt: Date.now(), updatedBy: adminUid },
    { merge: true }
  );
}

// ══════════════════════════════════════════════════════════
// RESULTS
// ══════════════════════════════════════════════════════════

export async function getResults(teamId: string, positionId: string): Promise<ResultsDoc | null> {
  assertDb();
  const id = `${teamId}_${positionId}`;
  const snap = await getDoc(doc(db, 'results', id));
  return snap.exists() ? (snap.data() as ResultsDoc) : null;
}

export async function getAllResultsForTeam(teamId: string): Promise<ResultsDoc[]> {
  assertDb();
  const q = query(collection(db, 'results'), where('teamId', '==', teamId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ResultsDoc);
}

// ══════════════════════════════════════════════════════════
// VOTING — server-only transaction
// ══════════════════════════════════════════════════════════

export async function castVote(
  teamId: string,
  positionId: string,
  candidateId: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch('/api/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId, positionId, candidateId }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return { success: false, error: data.error || 'Vote failed. Please try again.' };
  }

  return { success: true };
}

// ══════════════════════════════════════════════════════════
// AUDIT LOGS
// ══════════════════════════════════════════════════════════

export async function addAuditLog(log: Omit<AuditLog, 'id'>): Promise<void> {
  assertDb();
  await addDoc(collection(db, 'auditLogs'), log);
}

export async function getRecentAuditLogs(count = 50): Promise<AuditLog[]> {
  assertDb();
  const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
}

// ══════════════════════════════════════════════════════════
// ADMIN
// ══════════════════════════════════════════════════════════

export async function batchApproveCandidates(ids: string[]): Promise<void> {
  assertDb();
  const batch = writeBatch(db);
  ids.forEach((id) => {
    batch.update(doc(db, 'candidates', id), { approved: true });
  });
  await batch.commit();
}

export async function setUserRole(uid: string, role: UserProfile['role']): Promise<void> {
  assertDb();
  await updateDoc(doc(db, 'users', uid), { role });
}

export async function seedDefaultElectionData(): Promise<{ teamsSeeded: number; positionsSeeded: number }> {
  assertDb();

  // 1. Seed Teams if empty
  const currentTeams = await getTeams();
  let teamsSeeded = 0;
  if (currentTeams.length === 0) {
    const defaultTeams = [
      { name: 'Mexico (Co-host)', flag: '🇲🇽', description: 'Co-host of the FIFA World Cup 2026.' },
      { name: 'Canada (Co-host)', flag: '🇨🇦', description: 'Co-host of the FIFA World Cup 2026.' },
      { name: 'South Africa', flag: '🇿🇦', description: '2010 FIFA World Cup hosts.' },
      { name: 'South Korea', flag: '🇰🇷', description: 'Tigers of Asia.' },
      { name: 'Paraguay', flag: '🇵🇾', description: 'La Albirroja.' },
      { name: 'Germany', flag: '🇩🇪', description: '4-time World Cup winners.' },
      { name: 'Netherlands', flag: '🇳🇱', description: 'Oranje, 3-time runners up.' },
      { name: 'Belgium', flag: '🇧🇪', description: 'The Red Devils.' },
      { name: 'Spain', flag: '🇪🇸', description: '2010 World Cup champions.' },
      { name: 'Portugal', flag: '🇵🇹', description: 'A Seleção.' },
      { name: 'Brazil', flag: '🇧🇷', description: '5-time World Cup champions.' },
      { name: 'Argentina', flag: '🇦🇷', description: 'Defending World Cup champions.' },
      { name: 'France', flag: '🇫🇷', description: '2-time World Cup champions.' },
      { name: 'England', flag: '🏴', description: '1966 World Cup champions.' },
      { name: 'Morocco', flag: '🇲🇦', description: 'Atlas Lions, 2022 semi-finalists.' },
    ];
    for (const team of defaultTeams) {
      await createTeam({ ...team, logo: '', banner: '', createdAt: Date.now() });
      teamsSeeded++;
    }
  }

  // 2. Seed Positions if empty
  const currentPositions = await getPositions();
  let positionsSeeded = 0;
  if (currentPositions.length === 0) {
    const defaultPositions = [
      { title: 'Team Leader', description: 'Leads the team committee.', maxWinners: 1, order: 1 },
      { title: 'Technical Director', description: 'Manages tactics and strategy.', maxWinners: 1, order: 2 },
      { title: 'Lead Striker', description: 'Represents the forward line.', maxWinners: 1, order: 3 },
      { title: 'Main Goalkeeper', description: 'Represents the defensive unit.', maxWinners: 1, order: 4 },
    ];
    for (const pos of defaultPositions) {
      await createPosition(pos);
      positionsSeeded++;
    }
  }

  return { teamsSeeded, positionsSeeded };
}
