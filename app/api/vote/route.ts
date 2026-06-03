import { getAdminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/server/auth';

const DIU_EMAIL_REGEX = /@diu\.edu\.bd$/i;

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return Response.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (sessionUser.email && !DIU_EMAIL_REGEX.test(sessionUser.email)) {
    return Response.json({ success: false, error: 'Only @diu.edu.bd accounts are allowed.' }, { status: 403 });
  }

  const { teamId, positionId, candidateId } = (await request.json()) as {
    teamId?: string;
    positionId?: string;
    candidateId?: string;
  };

  if (!teamId || !positionId || !candidateId) {
    return Response.json({ success: false, error: 'Missing vote parameters.' }, { status: 400 });
  }

  const db = getAdminDb();
  const voteKey = `${teamId}_${positionId}`;

  try {
    await db.runTransaction(async (tx) => {
      const userRef = db.collection('users').doc(sessionUser.uid);
      const settingsRef = db.collection('electionSettings').doc('main');
      const candidateRef = db.collection('candidates').doc(candidateId);
      const resultsRef = db.collection('results').doc(voteKey);
      const voteRef = db.collection('votes').doc();

      const [userSnap, settingsSnap, candidateSnap, resultsSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(settingsRef),
        tx.get(candidateRef),
        tx.get(resultsRef),
      ]);

      if (!userSnap.exists) throw new Error('USER_NOT_FOUND');
      if (!settingsSnap.exists || settingsSnap.data()?.status !== 'live') {
        throw new Error('NOT_LIVE');
      }

      const userData = userSnap.data() as { votedPositions?: string[] };
      if (userData.votedPositions?.includes(voteKey)) {
        throw new Error('ALREADY_VOTED');
      }

      const candidate = candidateSnap.data() as { team?: string; position?: string; approved?: boolean; votesReceived?: number } | undefined;
      if (!candidateSnap.exists || !candidate) throw new Error('CANDIDATE_NOT_FOUND');
      if (candidate.team !== teamId || candidate.position !== positionId || !candidate.approved) {
        throw new Error('INVALID_CANDIDATE');
      }

      const existingResults = resultsSnap.exists ? resultsSnap.data() : undefined;
      const currentScores = (existingResults?.candidateScores as Record<string, number> | undefined) ?? {};
      const currentTotal = (existingResults?.totalVotes as number | undefined) ?? 0;

      tx.set(voteRef, {
        voterUid: sessionUser.uid,
        team: teamId,
        position: positionId,
        candidateId,
        timestamp: Date.now(),
      });

      tx.set(resultsRef, {
        teamId,
        positionId,
        candidateScores: {
          ...currentScores,
          [candidateId]: (currentScores[candidateId] ?? 0) + 1,
        },
        totalVotes: currentTotal + 1,
        updatedAt: Date.now(),
      });

      tx.update(userRef, {
        votedPositions: [...(userData.votedPositions ?? []), voteKey],
      });

      tx.update(candidateRef, {
        votesReceived: (candidate.votesReceived ?? 0) + 1,
      });
    });

    return Response.json({ success: true });
  } catch (err) {
    const message = (err as Error).message;
    const errorMap: Record<string, string> = {
      USER_NOT_FOUND: 'User not found.',
      NOT_LIVE: 'Voting is not open.',
      ALREADY_VOTED: 'You have already voted for this position.',
      CANDIDATE_NOT_FOUND: 'Candidate not found.',
      INVALID_CANDIDATE: 'Invalid candidate selection.',
    };

    return Response.json(
      { success: false, error: errorMap[message] ?? 'Vote failed. Please try again.' },
      { status: 400 }
    );
  }
}
