import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from '@/components/ui/toast';

export function AppLayout() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Scroll to top on route change
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto transition-[padding] duration-200"
        >
          <div className="px-6 py-5 max-w-[1200px] mx-auto sm:px-7 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
