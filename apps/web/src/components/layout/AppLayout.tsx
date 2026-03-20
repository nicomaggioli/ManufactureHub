import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from '@/components/ui/toast';

export function AppLayout() {
  return (
    <div className="h-screen p-3 bg-background">
      <div className="flex h-full rounded-2xl overflow-hidden bg-white shadow-elevated">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 bg-background rounded-2xl">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="px-10 py-8 max-w-[1120px] mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
