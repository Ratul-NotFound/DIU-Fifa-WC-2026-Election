// ============================================================
// TypeScript Types — DIU FIFA Election Platform
// ============================================================

export type UserRole = 'student' | 'candidate' | 'admin' | 'superAdmin';
export type ElectionStatus = 'draft' | 'live' | 'counting' | 'finished';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  batch: string;
  role: UserRole;
  favoriteTeam: string;
  emailVerified: boolean;
  votedPositions: string[]; // format: "teamId_positionId"
  createdAt: number;
}

export interface Team {
  id: string;
  name: string;
  logo: string;   // URL
  banner: string; // URL
  flag: string;   // URL or emoji
  description: string;
  createdAt: number;
}

export interface Position {
  id: string;
  title: string;
  description: string;
  maxWinners: number;
  order: number;
}

export interface Candidate {
  id: string;
  uid: string;
  name: string;
  studentId: string;
  department: string;
  batch: string;
  team: string;          // teamId
  position: string;      // positionId
  manifesto: string;
  photoUrl: string;      // External image URL
  approved: boolean;
  votesReceived: number;
  createdAt: number;
}

export interface Vote {
  id: string;
  voterUid: string;
  team: string;
  position: string;
  candidateId: string;
  timestamp: number;
}

export interface ResultsDoc {
  teamId: string;
  positionId: string;
  candidateScores: Record<string, number>; // candidateId -> voteCount
  totalVotes: number;
  updatedAt: number;
}

export interface ElectionSettings {
  status: ElectionStatus;
  votingStart: number | null;
  votingEnd: number | null;
  applicationsOpen: boolean;
  showStatusBanner: boolean;
  customBannerMessage: string;
  updatedAt: number;
  updatedBy: string;
}

export interface AuditLog {
  id: string;
  adminUid: string;
  adminName: string;
  action: string;
  target: string;
  details: string;
  timestamp: number;
}

// ---- UI Helpers ----
export interface CandidateWithScore extends Candidate {
  score: number;
  percentage: number;
  rank: number;
  isWinner: boolean;
  isCloseRace: boolean;
}
