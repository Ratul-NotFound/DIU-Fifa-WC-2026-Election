import { getAdminDb } from '@/lib/firebase/admin';
import type {
  UserProfile,
  Team,
  Position,
  Candidate,
  ElectionSettings,
  ResultsDoc,
  AuditLog,
} from '@/lib/types';

const db = () => getAdminDb();

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await db().collection('users').doc(uid).get();
  return snap.exists ? (snap.data() as UserProfile) : null;
}

export async function fetchTeams(): Promise<Team[]> {
  const snap = await db().collection('teams').orderBy('name').get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Team) }));
}

export async function fetchTeam(id: string): Promise<Team | null> {
  const snap = await db().collection('teams').doc(id).get();
  return snap.exists ? ({ id: snap.id, ...(snap.data() as Team) }) : null;
}

export async function fetchPositions(): Promise<Position[]> {
  const snap = await db().collection('positions').orderBy('order').get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Position) }));
}

export async function fetchCandidates(): Promise<Candidate[]> {
  const snap = await db().collection('candidates').get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Candidate) }));
}

export async function fetchApprovedCandidates(): Promise<Candidate[]> {
  const snap = await db().collection('candidates').where('approved', '==', true).get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Candidate) }));
}

export async function fetchUsers(): Promise<UserProfile[]> {
  const snap = await db().collection('users').get();
  return snap.docs.map((d) => d.data() as UserProfile);
}

export async function fetchElectionSettings(): Promise<ElectionSettings | null> {
  const snap = await db().collection('electionSettings').doc('main').get();
  return snap.exists ? (snap.data() as ElectionSettings) : null;
}

export async function fetchResultsForTeam(teamId: string): Promise<ResultsDoc[]> {
  const snap = await db().collection('results').where('teamId', '==', teamId).get();
  return snap.docs.map((d) => d.data() as ResultsDoc);
}

export async function fetchAuditLogs(limitCount = 50): Promise<AuditLog[]> {
  const snap = await db().collection('auditLogs').orderBy('timestamp', 'desc').limit(limitCount).get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as AuditLog) }));
}
