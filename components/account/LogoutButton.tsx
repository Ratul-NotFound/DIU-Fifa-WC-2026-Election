'use client';

import { logout } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
  className?: string;
  id?: string;
}

export default function LogoutButton({ className, id }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <button type="button" className={className} onClick={handleLogout} id={id}>
      Sign Out
    </button>
  );
}
