import { createBrowserRouter } from 'react-router-dom';
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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'projects', element: <Projects /> },
      { path: 'projects/:id', element: <ProjectDetail /> },
      { path: 'manufacturers', element: <Manufacturers /> },
      { path: 'manufacturers/:id', element: <ManufacturerDetail /> },
      { path: 'communications', element: <Communications /> },
      { path: 'design', element: <DesignHub /> },
      { path: 'quotes', element: <Quotes /> },
      { path: 'samples', element: <Samples /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
]);
