// Mock auth hook for development without Clerk
// Replace with Clerk integration when keys are configured

export function useAuth(): {
  user: { id: string; email: string; firstName: string; lastName: string; fullName: string; imageUrl: string } | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  getToken: (options?: any) => Promise<string | null>;
  signOut: () => Promise<void>;
  openProfile: () => void;
} {
  return {
    user: {
      id: 'dev-user-1',
      email: 'dev@ravi.sys',
      firstName: 'Dev',
      lastName: 'User',
      fullName: 'Dev User',
      imageUrl: '',
    },
    isLoaded: true,
    isSignedIn: true,
    getToken: async () => 'dev-token',
    signOut: async () => {},
    openProfile: () => {},
  };
}
