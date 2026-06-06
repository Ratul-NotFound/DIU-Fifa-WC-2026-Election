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
  runTransaction,
  writeBatch,
  limit,
} from 'firebase/firestore';
import { db } from './config';
import type {
  UserProfile,
  UserRole,
  Team,
  Position,
  Candidate,
  ElectionSettings,
  ResultsDoc,
  AuditLog,
  Vote,
} from '@/lib/types';

let testMode = false;

export function setTestMode(val: boolean) {
  testMode = val;
}

// Guard: return early when Firebase is not configured (build time / missing .env)
function dbReady(): boolean {
  if (testMode) return false;
  return Boolean(db);
}

// ══════════════════════════════════════════════════════════
// LOCAL STORAGE MOCK DATABASE FALLBACK (For connectionless Demo mode)
// ══════════════════════════════════════════════════════════

const MOCK_STORAGE_KEY = 'diu_fifa_mock_db_v3';

interface MockDB {
  users: Record<string, UserProfile>;
  teams: Record<string, Team>;
  positions: Record<string, Position>;
  candidates: Record<string, Candidate>;
  votes: Record<string, Vote>;
  results: Record<string, ResultsDoc>;
  settings: ElectionSettings;
  logs: AuditLog[];
}

function getMockDB(): MockDB {
  if (typeof window === 'undefined') {
    const g = global as any;
    if (!g._diuFifaMockDb) {
      g._diuFifaMockDb = {
        users: {},
        teams: {},
        positions: {},
        candidates: {},
        votes: {},
        results: {},
        settings: { status: 'draft', votingStart: null, votingEnd: null, applicationsOpen: true, showStatusBanner: true, customBannerMessage: '', updatedAt: Date.now(), updatedBy: 'system' },
        logs: []
      };
    }
    return g._diuFifaMockDb;
  }
  const data = localStorage.getItem(MOCK_STORAGE_KEY);
  if (data) {
    try {
      const db = JSON.parse(data);
      let changed = false;
      if (db.positions) {
        if (!db.positions['joint_secretary']) {
          db.positions['joint_secretary'] = { id: 'joint_secretary', title: 'Joint Secretary', description: 'Assists General Secretary and handles records.', maxWinners: 2, order: 5 };
          changed = true;
        }
        if (!db.positions['press_secretary']) {
          db.positions['press_secretary'] = { id: 'press_secretary', title: 'Press Secretary', description: 'Manages media communications and press releases.', maxWinners: 1, order: 6 };
          changed = true;
        }
        if (!db.positions['publicity_secretary']) {
          db.positions['publicity_secretary'] = { id: 'publicity_secretary', title: 'Publicity Secretary', description: 'Handles promotion and public relations.', maxWinners: 1, order: 7 };
          changed = true;
        }
        if (!db.positions['executive_member']) {
          db.positions['executive_member'] = { id: 'executive_member', title: 'Executive Member', description: 'Participates in committee decisions and tasks.', maxWinners: 3, order: 8 };
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(db));
      }
      return db;
    } catch {
      // ignore
    }
  }
  // Default seeding for visual testing immediately
  const initial: MockDB = {
    users: {},
    teams: {
      'mx': { id: 'mx', name: 'Mexico (Co-host)', flag: '🇲🇽', description: 'Co-host of the FIFA World Cup 2026.', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80', banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
      'ca': { id: 'ca', name: 'Canada (Co-host)', flag: '🇨🇦', description: 'Co-host of the FIFA World Cup 2026.', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80', banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
      'za': { id: 'za', name: 'South Africa', flag: '🇿🇦', description: '2010 FIFA World Cup hosts.', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80', banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
      'kr': { id: 'kr', name: 'South Korea', flag: '🇰🇷', description: 'Tigers of Asia.', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80', banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
      'py': { id: 'py', name: 'Paraguay', flag: '🇵🇾', description: 'La Albirroja.', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80', banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
      'de': { id: 'de', name: 'Germany', flag: '🇩🇪', description: '4-time World Cup winners.', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80', banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
      'nl': { id: 'nl', name: 'Netherlands', flag: '🇳🇱', description: 'Oranje, 3-time runners up.', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80', banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
      'be': { id: 'be', name: 'Belgium', flag: '🇧🇪', description: 'The Red Devils.', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80', banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
      'es': { id: 'es', name: 'Spain', flag: '🇪🇸', description: '2010 World Cup champions.', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80', banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
      'pt': { id: 'pt', name: 'Portugal', flag: '🇵🇹', description: 'A Seleção.', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80', banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
      'br': { id: 'br', name: 'Brazil', flag: '🇧🇷', description: '5-time World Cup champions.', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80', banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
      'ar': { id: 'ar', name: 'Argentina', flag: '🇦🇷', description: 'Defending World Cup champions.', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80', banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
      'fr': { id: 'fr', name: 'France', flag: '🇫🇷', description: '2-time World Cup champions.', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80', banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
      'eng': { id: 'eng', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', description: '1966 World Cup champions.', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80', banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
      'ma': { id: 'ma', name: 'Morocco', flag: '🇲🇦', description: 'Atlas Lions, 2022 semi-finalists.', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80', banner: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80', createdAt: Date.now() },
    },
    positions: {
      'president': { id: 'president', title: 'President', description: 'Leads the team committee.', maxWinners: 1, order: 1 },
      'vp': { id: 'vp', title: 'Vice President', description: 'Supports the President and manages operations.', maxWinners: 1, order: 2 },
      'secretary': { id: 'secretary', title: 'General Secretary', description: 'Manages correspondence and documentation.', maxWinners: 1, order: 3 },
      'organizing': { id: 'organizing', title: 'Organizing Secretary', description: 'Coordinates events and logistics.', maxWinners: 1, order: 4 },
      'joint_secretary': { id: 'joint_secretary', title: 'Joint Secretary', description: 'Assists General Secretary and handles records.', maxWinners: 2, order: 5 },
      'press_secretary': { id: 'press_secretary', title: 'Press Secretary', description: 'Manages media communications and press releases.', maxWinners: 1, order: 6 },
      'publicity_secretary': { id: 'publicity_secretary', title: 'Publicity Secretary', description: 'Handles promotion and public relations.', maxWinners: 1, order: 7 },
      'executive_member': { id: 'executive_member', title: 'Executive Member', description: 'Participates in committee decisions and tasks.', maxWinners: 3, order: 8 },
    },
    candidates: {
      'cand1': { id: 'cand1', uid: 'u1', name: 'Al-Amin Rahman', studentId: '201-15-1234', department: 'CSE', batch: '55th', team: 'br', position: 'president', manifesto: 'Committed to organizing regular schedules and student team-building sessions.', photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80', approved: true, votesReceived: 12, createdAt: Date.now() },
      'cand2': { id: 'cand2', uid: 'u2', name: 'Sajid Islam', studentId: '202-16-5678', department: 'SWE', batch: '56th', team: 'br', position: 'president', manifesto: 'Active student leader ready to represent SWE team interests at the university level.', photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80', approved: true, votesReceived: 8, createdAt: Date.now() },
      'cand3': { id: 'cand3', uid: 'u3', name: 'Tasnim Ahmed', studentId: '211-15-9999', department: 'CSE', batch: '57th', team: 'ar', position: 'president', manifesto: 'Organized student dedicated to team success and student sport integration.', photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80', approved: true, votesReceived: 15, createdAt: Date.now() },
      'cand4': { id: 'cand4', uid: 'u4', name: 'Mahim Chowdhury', studentId: '212-15-4444', department: 'EEE', batch: '54th', team: 'ar', position: 'president', manifesto: 'Experienced student leader looking to transition committee into winning ways.', photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80', approved: true, votesReceived: 14, createdAt: Date.now() }
    },
    votes: {},
    results: {
      'br_president': { teamId: 'br', positionId: 'president', candidateScores: { 'cand1': 12, 'cand2': 8 }, totalVotes: 20, updatedAt: Date.now() },
      'ar_president': { teamId: 'ar', positionId: 'president', candidateScores: { 'cand3': 15, 'cand4': 14 }, totalVotes: 29, updatedAt: Date.now() }
    },
    settings: { status: 'live', votingStart: Date.now() - 3600000, votingEnd: Date.now() + 86400000, applicationsOpen: true, showStatusBanner: true, customBannerMessage: '', updatedAt: Date.now(), updatedBy: 'system' },
    logs: [
      { id: 'log1', adminUid: 'system', adminName: 'System', action: 'Auto-seeded demo database with 15 FIFA teams.', target: 'system', details: '', timestamp: Date.now() }
    ]
  };
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveMockDB(dbData: MockDB) {
  if (typeof window === 'undefined') {
    const g = global as any;
    g._diuFifaMockDb = dbData;
    return;
  }
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(dbData));
}

// ══════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!dbReady()) {
    return getMockDB().users[uid] ?? null;
  }
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  if (!dbReady()) {
    const mock = getMockDB();
    mock.users[profile.uid] = profile;
    saveMockDB(mock);
    return;
  }
  let finalRole = profile.role;
  if (profile.email) {
    try {
      const roleDoc = await getDoc(doc(db, 'preassignedRoles', profile.email.toLowerCase()));
      if (roleDoc.exists()) {
        finalRole = roleDoc.data().role;
      }
    } catch (err) {
      console.error("Error reading preassigned roles:", err);
    }
  }
  await setDoc(doc(db, 'users', profile.uid), { ...profile, role: finalRole });
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  if (!dbReady()) {
    const mock = getMockDB();
    if (mock.users[uid]) {
      mock.users[uid] = { ...mock.users[uid], ...data };
      saveMockDB(mock);
    }
    return;
  }
  await updateDoc(doc(db, 'users', uid), data);
}

export async function getAllUsers(): Promise<UserProfile[]> {
  if (!dbReady()) {
    return Object.values(getMockDB().users);
  }
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => d.data() as UserProfile);
}

// ══════════════════════════════════════════════════════════
// TEAMS
// ══════════════════════════════════════════════════════════

export async function getTeams(): Promise<Team[]> {
  if (!dbReady()) {
    return Object.values(getMockDB().teams).sort((a, b) => a.name.localeCompare(b.name));
  }
  const snap = await getDocs(query(collection(db, 'teams'), orderBy('name')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Team));
}

export async function getTeam(id: string): Promise<Team | null> {
  if (!dbReady()) {
    return getMockDB().teams[id] ?? null;
  }
  const snap = await getDoc(doc(db, 'teams', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Team) : null;
}

export async function createTeam(team: Omit<Team, 'id'>): Promise<string> {
  const id = team.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).slice(2, 6);
  if (!dbReady()) {
    const mock = getMockDB();
    const newTeam: Team = { id, ...team };
    mock.teams[id] = newTeam;
    saveMockDB(mock);
    return id;
  }
  const ref = await addDoc(collection(db, 'teams'), { ...team, createdAt: Date.now() });
  return ref.id;
}

export async function updateTeam(id: string, data: Partial<Team>): Promise<void> {
  if (!dbReady()) {
    const mock = getMockDB();
    if (mock.teams[id]) {
      mock.teams[id] = { ...mock.teams[id], ...data };
      saveMockDB(mock);
    }
    return;
  }
  await updateDoc(doc(db, 'teams', id), data);
}

export async function deleteTeam(id: string): Promise<void> {
  if (!dbReady()) {
    const mock = getMockDB();
    delete mock.teams[id];
    saveMockDB(mock);
    return;
  }
  await deleteDoc(doc(db, 'teams', id));
}

// ══════════════════════════════════════════════════════════
// POSITIONS
// ══════════════════════════════════════════════════════════

let positionsSeedingPromise: Promise<Position[]> | null = null;

export async function getPositions(): Promise<Position[]> {
  if (!dbReady()) {
    return Object.values(getMockDB().positions).sort((a, b) => a.order - b.order);
  }

  if (positionsSeedingPromise) {
    return positionsSeedingPromise;
  }

  positionsSeedingPromise = (async () => {
    const snap = await getDocs(query(collection(db, 'positions'), orderBy('order')));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Position));

    const defaultPositions = [
      { title: 'President', description: 'Leads the team committee.', maxWinners: 1, order: 1 },
      { title: 'Vice President', description: 'Supports the President and manages operations.', maxWinners: 1, order: 2 },
      { title: 'General Secretary', description: 'Manages correspondence and documentation.', maxWinners: 1, order: 3 },
      { title: 'Organizing Secretary', description: 'Coordinates events and logistics.', maxWinners: 1, order: 4 },
      { title: 'Joint Secretary', description: 'Assists General Secretary and handles records.', maxWinners: 2, order: 5 },
      { title: 'Press Secretary', description: 'Manages media communications and press releases.', maxWinners: 1, order: 6 },
      { title: 'Publicity Secretary', description: 'Handles promotion and public relations.', maxWinners: 1, order: 7 },
      { title: 'Executive Member', description: 'Participates in committee decisions and tasks.', maxWinners: 3, order: 8 },
    ];

    let newlyAdded = false;
    for (const pos of defaultPositions) {
      const exists = list.some(p => p.title.toLowerCase() === pos.title.toLowerCase());
      if (!exists) {
        const id = await createPosition(pos);
        list.push({ id, ...pos });
        newlyAdded = true;
      }
    }

    if (newlyAdded) {
      list.sort((a, b) => a.order - b.order);
    }
    return list;
  })();

  try {
    return await positionsSeedingPromise;
  } finally {
    positionsSeedingPromise = null;
  }
}

export async function createPosition(pos: Omit<Position, 'id'>): Promise<string> {
  const id = pos.title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).slice(2, 6);
  if (!dbReady()) {
    const mock = getMockDB();
    const newPos = { id, ...pos };
    mock.positions[id] = newPos;
    saveMockDB(mock);
    return id;
  }
  const ref = await addDoc(collection(db, 'positions'), pos);
  return ref.id;
}

export async function updatePosition(id: string, data: Partial<Position>): Promise<void> {
  if (!dbReady()) {
    const mock = getMockDB();
    if (mock.positions[id]) {
      mock.positions[id] = { ...mock.positions[id], ...data };
      saveMockDB(mock);
    }
    return;
  }
  await updateDoc(doc(db, 'positions', id), data);
}

export async function deletePosition(id: string): Promise<void> {
  if (!dbReady()) {
    const mock = getMockDB();
    delete mock.positions[id];
    saveMockDB(mock);
    return;
  }
  await deleteDoc(doc(db, 'positions', id));
}

// ══════════════════════════════════════════════════════════
// CANDIDATES
// ══════════════════════════════════════════════════════════

export async function getCandidatesByTeam(teamId: string): Promise<Candidate[]> {
  if (!dbReady()) {
    return Object.values(getMockDB().candidates).filter(c => c.team === teamId && c.approved);
  }
  const q = query(
    collection(db, 'candidates'),
    where('team', '==', teamId),
    where('approved', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Candidate));
}

export async function getAllCandidates(): Promise<Candidate[]> {
  if (!dbReady()) {
    return Object.values(getMockDB().candidates);
  }
  const snap = await getDocs(collection(db, 'candidates'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Candidate));
}

export async function getCandidateByUid(uid: string): Promise<Candidate | null> {
  if (!dbReady()) {
    const list = Object.values(getMockDB().candidates);
    return list.find(c => c.uid === uid) ?? null;
  }
  const q = query(collection(db, 'candidates'), where('uid', '==', uid));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Candidate;
}

export async function getApprovedCandidates(): Promise<Candidate[]> {
  if (!dbReady()) {
    return Object.values(getMockDB().candidates).filter(c => c.approved);
  }
  const q = query(collection(db, 'candidates'), where('approved', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Candidate));
}

export async function getPendingCandidates(): Promise<Candidate[]> {
  if (!dbReady()) {
    return Object.values(getMockDB().candidates).filter(c => !c.approved);
  }
  const q = query(collection(db, 'candidates'), where('approved', '==', false));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Candidate));
}

export async function createCandidate(candidate: Omit<Candidate, 'id'>): Promise<string> {
  const id = 'cand_' + Math.random().toString(36).slice(2, 8);
  if (!dbReady()) {
    const mock = getMockDB();
    const newCand: Candidate = { id, ...candidate };
    mock.candidates[id] = newCand;
    saveMockDB(mock);
    return id;
  }
  const ref = await addDoc(collection(db, 'candidates'), {
    ...candidate,
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function approveCandidate(id: string): Promise<void> {
  if (!dbReady()) {
    const mock = getMockDB();
    if (mock.candidates[id]) {
      mock.candidates[id].approved = true;
      saveMockDB(mock);
    }
    return;
  }
  await updateDoc(doc(db, 'candidates', id), { approved: true });
}

export async function rejectCandidate(id: string): Promise<void> {
  if (!dbReady()) {
    const mock = getMockDB();
    delete mock.candidates[id];
    saveMockDB(mock);
    return;
  }
  await deleteDoc(doc(db, 'candidates', id));
}

export async function updateCandidate(id: string, data: Partial<Candidate>): Promise<void> {
  if (!dbReady()) {
    const mock = getMockDB();
    if (mock.candidates[id]) {
      mock.candidates[id] = { ...mock.candidates[id], ...data };
      saveMockDB(mock);
    }
    return;
  }
  await updateDoc(doc(db, 'candidates', id), data);
}

export async function deleteCandidate(id: string): Promise<void> {
  if (!dbReady()) {
    const mock = getMockDB();
    delete mock.candidates[id];
    saveMockDB(mock);
    return;
  }
  await deleteDoc(doc(db, 'candidates', id));
}

// ══════════════════════════════════════════════════════════
// ELECTION SETTINGS
// ══════════════════════════════════════════════════════════

export async function getElectionSettings(): Promise<ElectionSettings | null> {
  if (!dbReady()) {
    return getMockDB().settings;
  }
  const snap = await getDoc(doc(db, 'electionSettings', 'main'));
  return snap.exists() ? (snap.data() as ElectionSettings) : null;
}

export async function updateElectionSettings(
  data: Partial<ElectionSettings>,
  adminUid: string
): Promise<void> {
  if (!dbReady()) {
    const mock = getMockDB();
    mock.settings = { ...mock.settings, ...data, updatedAt: Date.now(), updatedBy: adminUid };
    saveMockDB(mock);
    return;
  }
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
  if (!dbReady()) {
    const key = `${teamId}_${positionId}`;
    return getMockDB().results[key] ?? null;
  }
  const id = `${teamId}_${positionId}`;
  const snap = await getDoc(doc(db, 'results', id));
  return snap.exists() ? (snap.data() as ResultsDoc) : null;
}

export async function getAllResultsForTeam(teamId: string): Promise<ResultsDoc[]> {
  if (!dbReady()) {
    return Object.values(getMockDB().results).filter(r => r.teamId === teamId);
  }
  const q = query(collection(db, 'results'), where('teamId', '==', teamId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ResultsDoc);
}

export async function getLiveTeamStandings(): Promise<{ teamId: string; teamName: string; flag: string; votes: number }[]> {
  const teams = await getTeams();
  
  if (!dbReady()) {
    const mock = getMockDB();
    const teamVotes: Record<string, number> = {};
    Object.values(mock.results).forEach(r => {
      teamVotes[r.teamId] = (teamVotes[r.teamId] ?? 0) + r.totalVotes;
    });
    return teams
      .map(t => ({
        teamId: t.id,
        teamName: t.name,
        flag: t.flag,
        votes: teamVotes[t.id] ?? 0,
      }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 4);
  }

  try {
    const snap = await getDocs(collection(db, 'results'));
    const teamVotes: Record<string, number> = {};
    snap.docs.forEach(d => {
      const data = d.data() as ResultsDoc;
      const teamId = data.teamId;
      const totalVotes = data.totalVotes ?? 0;
      if (teamId) {
        teamVotes[teamId] = (teamVotes[teamId] ?? 0) + totalVotes;
      }
    });

    return teams
      .map(t => ({
        teamId: t.id,
        teamName: t.name,
        flag: t.flag,
        votes: teamVotes[t.id] ?? 0,
      }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 4);
  } catch (err) {
    console.error("Error fetching live standings:", err);
    return [];
  }
}

export async function getUserVoteForPosition(
  voterUid: string,
  teamId: string,
  positionId: string
): Promise<string | null> {
  if (!dbReady()) {
    const mock = getMockDB();
    const vote = Object.values(mock.votes).find(
      (v) => v.voterUid === voterUid && v.team === teamId && v.position === positionId
    );
    return vote ? vote.candidateId : null;
  }
  const voteDocId = `${voterUid}_${teamId}_${positionId}`;
  const snap = await getDoc(doc(db, 'votes', voteDocId));
  if (!snap.exists()) return null;
  return snap.data().candidateId;
}

// ══════════════════════════════════════════════════════════
// VOTING — Transaction-safe
// ══════════════════════════════════════════════════════════

export async function castVote(
  voterUid: string,
  teamId: string,
  positionId: string,
  candidateId: string
): Promise<{ success: boolean; error?: string }> {
  const voteKeyVal = `${teamId}_${positionId}`;

  if (!dbReady()) {
    const mock = getMockDB();
    const user = mock.users[voterUid];
    if (user && user.votedPositions?.includes(voteKeyVal)) {
      return { success: false, error: 'You have already voted for this position.' };
    }

    // Record vote
    const voteId = `${voterUid}_${teamId}_${positionId}`;
    const newVote: Vote = { id: voteId, voterUid, team: teamId, position: positionId, candidateId, timestamp: Date.now() };
    mock.votes[voteId] = newVote;

    // Update candidate
    if (mock.candidates[candidateId]) {
      mock.candidates[candidateId].votesReceived = (mock.candidates[candidateId].votesReceived ?? 0) + 1;
    }

    // Update aggregated scores
    if (!mock.results[voteKeyVal]) {
      mock.results[voteKeyVal] = { teamId, positionId, candidateScores: {}, totalVotes: 0, updatedAt: Date.now() };
    }
    const currentScores = mock.results[voteKeyVal].candidateScores;
    mock.results[voteKeyVal].candidateScores = {
      ...currentScores,
      [candidateId]: (currentScores[candidateId] ?? 0) + 1
    };
    mock.results[voteKeyVal].totalVotes = (mock.results[voteKeyVal].totalVotes ?? 0) + 1;
    mock.results[voteKeyVal].updatedAt = Date.now();

    // Mark user
    if (mock.users[voterUid]) {
      mock.users[voterUid].votedPositions = [...(mock.users[voterUid].votedPositions ?? []), voteKeyVal];
    }

    saveMockDB(mock);
    return { success: true };
  }

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Read voter's current state
      const userRef = doc(db, 'users', voterUid);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error('User not found.');

      const userData = userSnap.data() as UserProfile;
      if (userData.votedPositions?.includes(voteKeyVal)) {
        throw new Error('ALREADY_VOTED');
      }

      // 2. Read results doc (or init if missing)
      const resultsRef = doc(db, 'results', voteKeyVal);
      const resultsSnap = await transaction.get(resultsRef);

      const currentScores: Record<string, number> = resultsSnap.exists()
        ? (resultsSnap.data()?.candidateScores ?? {})
        : {};
      const currentTotal: number = resultsSnap.exists()
        ? (resultsSnap.data()?.totalVotes ?? 0)
        : 0;

      // 3. Read candidate state
      const candidateRef = doc(db, 'candidates', candidateId);
      const candidateSnap = await transaction.get(candidateRef);

      // ──── ALL READS COMPLETED. BEGIN WRITES ────

      // 4. Write vote record (deterministic ID)
      const voteDocId = `${voterUid}_${teamId}_${positionId}`;
      const voteRef = doc(db, 'votes', voteDocId);
      transaction.set(voteRef, {
        voterUid,
        team: teamId,
        position: positionId,
        candidateId,
        timestamp: Date.now(),
      });

      // 5. Update aggregated results (1 write)
      transaction.set(resultsRef, {
        teamId,
        positionId,
        candidateScores: {
          ...currentScores,
          [candidateId]: (currentScores[candidateId] ?? 0) + 1,
        },
        totalVotes: currentTotal + 1,
        updatedAt: Date.now(),
      });

      // 6. Mark user as voted for this position
      transaction.update(userRef, {
        votedPositions: [...(userData.votedPositions ?? []), voteKeyVal],
      });

      // 7. Increment candidate vote counter
      if (candidateSnap.exists()) {
        transaction.update(candidateRef, {
          votesReceived: (candidateSnap.data()?.votesReceived ?? 0) + 1,
        });
      }
    });

    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === 'ALREADY_VOTED') {
      return { success: false, error: 'You have already voted for this position.' };
    }
    return { success: false, error: error.message || 'Vote failed. Please try again.' };
  }
}

// ══════════════════════════════════════════════════════════
// AUDIT LOGS
// ══════════════════════════════════════════════════════════

export async function addAuditLog(log: Omit<AuditLog, 'id'>): Promise<void> {
  if (!dbReady()) {
    const mock = getMockDB();
    const id = 'log_' + Math.random().toString(36).slice(2, 8);
    mock.logs.unshift({ id, ...log });
    saveMockDB(mock);
    return;
  }
  await addDoc(collection(db, 'auditLogs'), log);
}

export async function getRecentAuditLogs(count = 50): Promise<AuditLog[]> {
  if (!dbReady()) {
    return getMockDB().logs.slice(0, count);
  }
  const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
}

// ══════════════════════════════════════════════════════════
// ADMIN
// ══════════════════════════════════════════════════════════

export async function batchApproveCandidates(ids: string[]): Promise<void> {
  if (!dbReady()) {
    const mock = getMockDB();
    ids.forEach((id) => {
      if (mock.candidates[id]) mock.candidates[id].approved = true;
    });
    saveMockDB(mock);
    return;
  }
  const batch = writeBatch(db);
  ids.forEach((id) => {
    batch.update(doc(db, 'candidates', id), { approved: true });
  });
  await batch.commit();
}

export async function setUserRole(uid: string, role: UserProfile['role']): Promise<void> {
  if (!dbReady()) {
    const mock = getMockDB();
    if (mock.users[uid]) {
      mock.users[uid].role = role;
      saveMockDB(mock);
    }
    return;
  }
  await updateDoc(doc(db, 'users', uid), { role });
}

export async function seedDefaultElectionData(): Promise<{ teamsSeeded: number; positionsSeeded: number }> {
  if (!dbReady()) {
    const mock = getMockDB();
    let teamsSeeded = 0;
    if (Object.keys(mock.teams).length === 0) {
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
        { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', description: '1966 World Cup champions.' },
        { name: 'Morocco', flag: '🇲🇦', description: 'Atlas Lions, 2022 semi-finalists.' },
      ];
      for (const team of defaultTeams) {
        const id = team.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).slice(2, 6);
        mock.teams[id] = { id, ...team, logo: '', banner: '', createdAt: Date.now() };
        teamsSeeded++;
      }
    }

    let positionsSeeded = 0;
    const defaultPositions = [
      { id: 'president', title: 'President', description: 'Leads the team committee.', maxWinners: 1, order: 1 },
      { id: 'vp', title: 'Vice President', description: 'Supports the President and manages operations.', maxWinners: 1, order: 2 },
      { id: 'secretary', title: 'General Secretary', description: 'Manages correspondence and documentation.', maxWinners: 1, order: 3 },
      { id: 'organizing', title: 'Organizing Secretary', description: 'Coordinates events and logistics.', maxWinners: 1, order: 4 },
      { id: 'joint_secretary', title: 'Joint Secretary', description: 'Assists General Secretary and handles records.', maxWinners: 2, order: 5 },
      { id: 'press_secretary', title: 'Press Secretary', description: 'Manages media communications and press releases.', maxWinners: 1, order: 6 },
      { id: 'publicity_secretary', title: 'Publicity Secretary', description: 'Handles promotion and public relations.', maxWinners: 1, order: 7 },
      { id: 'executive_member', title: 'Executive Member', description: 'Participates in committee decisions and tasks.', maxWinners: 3, order: 8 },
    ];
    for (const pos of defaultPositions) {
      const exists = Object.values(mock.positions).some(p => p.title.toLowerCase() === pos.title.toLowerCase());
      if (!exists) {
        mock.positions[pos.id] = pos;
        positionsSeeded++;
      }
    }
    saveMockDB(mock);
    return { teamsSeeded, positionsSeeded };
  }
  
  // 1. Seed Teams if they do not exist
  const currentTeams = await getTeams();
  let teamsSeeded = 0;
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
    { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', description: '1966 World Cup champions.' },
    { name: 'Morocco', flag: '🇲🇦', description: 'Atlas Lions, 2022 semi-finalists.' },
  ];
  for (const team of defaultTeams) {
    const exists = currentTeams.some(t => t.name.toLowerCase() === team.name.toLowerCase());
    if (!exists) {
      await createTeam({ ...team, logo: '', banner: '', createdAt: Date.now() });
      teamsSeeded++;
    }
  }

  // 2. Seed Positions if they do not exist
  const currentPositions = await getPositions();
  let positionsSeeded = 0;
  const defaultPositions = [
    { title: 'President', description: 'Leads the team committee.', maxWinners: 1, order: 1 },
    { title: 'Vice President', description: 'Supports the President and manages operations.', maxWinners: 1, order: 2 },
    { title: 'General Secretary', description: 'Manages correspondence and documentation.', maxWinners: 1, order: 3 },
    { title: 'Organizing Secretary', description: 'Coordinates events and logistics.', maxWinners: 1, order: 4 },
    { title: 'Joint Secretary', description: 'Assists General Secretary and handles records.', maxWinners: 2, order: 5 },
    { title: 'Press Secretary', description: 'Manages media communications and press releases.', maxWinners: 1, order: 6 },
    { title: 'Publicity Secretary', description: 'Handles promotion and public relations.', maxWinners: 1, order: 7 },
    { title: 'Executive Member', description: 'Participates in committee decisions and tasks.', maxWinners: 3, order: 8 },
  ];
  for (const pos of defaultPositions) {
    const exists = currentPositions.some(p => p.title.toLowerCase() === pos.title.toLowerCase());
    if (!exists) {
      await createPosition(pos);
      positionsSeeded++;
    }
  }

  return { teamsSeeded, positionsSeeded };
}

export async function promoteUserByEmail(email: string, role: UserRole): Promise<{ success: boolean; message: string }> {
  if (!dbReady()) {
    const mock = getMockDB();
    const existing = Object.values(mock.users).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      existing.role = role;
      saveMockDB(mock);
      return { success: true, message: `✓ ${existing.name} has been promoted to ${role}.` };
    }
    // Preassign mock (dummy user)
    const mockUid = 'mock_' + Math.random().toString(36).slice(2, 8);
    mock.users[mockUid] = {
      uid: mockUid,
      name: 'Preassigned Admin',
      email: email.toLowerCase(),
      studentId: '',
      department: '',
      batch: '',
      role,
      favoriteTeam: '',
      emailVerified: true,
      votedPositions: [],
      createdAt: Date.now(),
    };
    saveMockDB(mock);
    return { success: true, message: `✓ Email ${email} has been pre-assigned as ${role}.` };
  }

  // 1. Check if user already exists
  const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const userDoc = snap.docs[0];
    await updateDoc(doc(db, 'users', userDoc.id), { role });
    return { success: true, message: `✓ ${userDoc.data().name || email} has been promoted to ${role}.` };
  }

  // 2. Pre-assign role for future login
  await setDoc(doc(db, 'preassignedRoles', email.toLowerCase()), {
    email: email.toLowerCase(),
    role,
    createdAt: Date.now(),
  });
  return { success: true, message: `✓ Email ${email} has been pre-assigned as ${role}.` };
}
