import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server/auth';
import { fetchUserProfile } from '@/lib/server/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import LogoutButton from '@/components/account/LogoutButton';

async function updateProfileAction(formData: FormData) {
  'use server';

  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect('/login');

  const name = String(formData.get('name') || '').trim();
  const studentId = String(formData.get('studentId') || '').trim();
  const department = String(formData.get('department') || '').trim();
  const batch = String(formData.get('batch') || '').trim();

  if (!name) {
    redirect('/profile?error=1');
  }

  await getAdminDb().collection('users').doc(sessionUser.uid).update({
    name,
    studentId,
    department,
    batch,
  });

  redirect('/profile?updated=1');
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { updated?: string; error?: string };
}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect('/login');

  const profile = await fetchUserProfile(sessionUser.uid);
  if (!profile) redirect('/login');

  const updated = searchParams.updated === '1';
  const error = searchParams.error === '1';

  return (
    <div className="page-content" style={{ maxWidth: 560 }}>
      <div className="section-header">
        <div>
          <h1>My Profile</h1>
          <p className="section-sub">Update your student information</p>
        </div>
      </div>

      {updated && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>Profile updated successfully!</div>}
      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>Please enter your full name.</div>}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
          <div className="avatar" style={{ width: 56, height: 56, fontSize: 'var(--text-xl)' }}>
            {profile.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{profile.name || 'Student'}</p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{profile.email}</p>
            <span className="badge badge-blue" style={{ marginTop: 'var(--space-1)', textTransform: 'capitalize' }}>
              {profile.role}
            </span>
          </div>
        </div>

        <form action={updateProfileAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="pf-name">Full Name</label>
            <input id="pf-name" name="name" type="text" className="form-input" defaultValue={profile.name} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="pf-sid">Student ID</label>
            <input id="pf-sid" name="studentId" type="text" className="form-input" placeholder="e.g. 221-15-0000" defaultValue={profile.studentId} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="pf-dept">Department</label>
            <input id="pf-dept" name="department" type="text" className="form-input" placeholder="e.g. CSE" defaultValue={profile.department} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="pf-batch">Batch</label>
            <input id="pf-batch" name="batch" type="text" className="form-input" placeholder="e.g. 58th" defaultValue={profile.batch} />
          </div>
          <button type="submit" className="btn btn-primary" id="btn-save-profile">
            Save Changes
          </button>
          <LogoutButton className="btn btn-danger" id="btn-profile-logout" />
        </form>
      </div>

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Voting Summary</h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          You have voted for <strong style={{ color: 'var(--text-primary)' }}>{profile.votedPositions?.length ?? 0}</strong> position(s).
        </p>
      </div>
    </div>
  );
}
