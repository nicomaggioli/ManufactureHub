// Mock auth hook for development without Clerk
// Replace with Clerk integration when keys are configured

const STORAGE_KEY_SIGNED_IN = 'sical-signed-in';
const STORAGE_KEY_SETTINGS = 'sical-user-settings';
const STORAGE_KEY_NOTIFICATIONS = 'sical-notifications-read-at';

function getSavedSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAuth(): {
  user: { id: string; email: string; firstName: string; lastName: string; fullName: string; imageUrl: string } | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  getToken: (options?: any) => Promise<string | null>;
  signIn: () => void;
  signOut: () => void;
  openProfile: () => void;
} {
  const isSignedIn = localStorage.getItem(STORAGE_KEY_SIGNED_IN) === 'true';
  const saved = getSavedSettings();

  const firstName = saved?.firstName || 'Dev';
  const lastName = saved?.lastName || 'User';

  return {
    user: isSignedIn ? {
      id: 'dev-user-1',
      email: saved?.email || 'dev@sical.app',
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      imageUrl: '',
    } : null,
    isLoaded: true,
    isSignedIn,
    getToken: async () => isSignedIn ? 'dev-token' : null,
    signIn: () => {
      localStorage.setItem(STORAGE_KEY_SIGNED_IN, 'true');
    },
    signOut: () => {
      localStorage.removeItem(STORAGE_KEY_SIGNED_IN);
      localStorage.removeItem(STORAGE_KEY_SETTINGS);
      localStorage.removeItem(STORAGE_KEY_NOTIFICATIONS);
      window.location.href = window.location.pathname.includes('/ManufactureHub')
        ? '/ManufactureHub/login'
        : '/login';
    },
    openProfile: () => {},
  };
}
