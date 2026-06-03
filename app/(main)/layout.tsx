import { redirect } from 'next/navigation';
import NavbarServer from '@/components/layout/NavbarServer';
import { getSessionUser } from '@/lib/server/auth';
import { fetchUserProfile } from '@/lib/server/firestore';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect('/login');

  const profile = await fetchUserProfile(sessionUser.uid);
  if (!profile) redirect('/login');

  return (
    <div className="page-wrapper">
      <NavbarServer profile={profile} />
      <main>{children}</main>
    </div>
  );
}
