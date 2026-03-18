import { createBrowserRouter, Navigate, type RouterProviderProps } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { Projects } from '@/pages/Projects';
import { ProjectDetail } from '@/pages/ProjectDetail';
import { Manufacturers } from '@/pages/Manufacturers';
import { ManufacturerDetail } from '@/pages/ManufacturerDetail';
import { Communications } from '@/pages/Communications';
import { DesignHub } from '@/pages/DesignHub';
import { Quotes } from '@/pages/Quotes';
import { Samples } from '@/pages/Samples';
import { Settings } from '@/pages/Settings';
import { Login } from '@/pages/Login';
import { ClientPortal } from '@/pages/ClientPortal';
import { Approvals } from '@/pages/Approvals';
import { Shipping } from '@/pages/Shipping';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isSignedIn = localStorage.getItem('sical-signed-in') === 'true';
  if (!isSignedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoginGuard({ children }: { children: React.ReactNode }) {
  const isSignedIn = localStorage.getItem('sical-signed-in') === 'true';
  if (isSignedIn) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    path: '/login',
    element: <LoginGuard><Login /></LoginGuard>,
  },
  {
    path: '/',
    element: <AuthGuard><AppLayout /></AuthGuard>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'projects', element: <Projects /> },
      { path: 'projects/:id', element: <ProjectDetail /> },
      { path: 'manufacturers', element: <Manufacturers /> },
      { path: 'manufacturers/:id', element: <ManufacturerDetail /> },
      { path: 'communications', element: <Communications /> },
      { path: 'communications/:id', element: <Communications /> },
      { path: 'design', element: <DesignHub /> },
      { path: 'quotes', element: <Quotes /> },
      { path: 'samples', element: <Samples /> },
      { path: 'approvals', element: <Approvals /> },
      { path: 'shipping', element: <Shipping /> },
      { path: 'client', element: <ClientPortal /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
], { basename });
