import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from '@/components/ui/toast';

export function AppLayout() {
  const location = useLocation();
  const isDesignStudio = location.pathname === '/design';

  return (
    <div className="flex h-screen overflow-hidden bg-background bg-parchment">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        {!isDesignStudio && <Header />}
        <main className={isDesignStudio ? 'flex-1 overflow-hidden' : 'flex-1 overflow-y-auto'}>
          {isDesignStudio ? (
            <Outlet />
          ) : (
            <div className="px-6 py-5 max-w-[1400px] mx-auto">
              <Outlet />
            </div>
          )}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
