import { useEffect, useState } from 'react';
import { SupabaseProvider, useSupabase } from './auth/SupabaseContext';
import { AuthGate } from './auth/AuthGate';
import { ChoreTemplates } from './features/chores/ChoreTemplates';
import { ChoreInstances } from './features/chores/ChoreInstances';
import { Goals } from './features/goals/Goals';
import { PointsSummary } from './features/points/PointsSummary';
import { ChoreCalendar } from './features/calendar/ChoreCalendar';
import { ChildDashboard } from './features/dashboard/ChildDashboard';
import { ParentDashboard } from './features/dashboard/ParentDashboard';

function Root() {
  const { session } = useSupabase();
  
  // FOR TESTING: Read from localStorage if auth is disabled
  const storedUserId = localStorage.getItem("demo-user-id");
  const storedRole = localStorage.getItem("demo-user-role");
  
  // Use localStorage values for demo, fallback to session for real auth
  const userId = storedUserId || session?.user.id || 'child-1';
  const userRole = storedRole || session?.user.user_metadata?.role || 'child';
  
  const [tab, setTab] = useState<'dashboard' | 'instances' | 'calendar' | 'points' | 'templates' | 'goals'>('dashboard');

  useEffect(() => {
    // you can load initial data or socket connection here
  }, [session]);

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-indigo-600">Mestring</h1>
          <AuthGate />
        </div>
      </header>

      <nav className="sticky top-[73px] z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
          <button 
            className={`btn ${tab === 'dashboard' ? '' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setTab('dashboard')}
          >
            🏠 Home
          </button>
          <button 
            className={`btn ${tab === 'instances' ? '' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setTab('instances')}
          >
            All Chores
          </button>
          <button 
            className={`btn ${tab === 'calendar' ? '' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setTab('calendar')}
          >
            Calendar
          </button>
          <button 
            className={`btn ${tab === 'points' ? '' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setTab('points')}
          >
            Points
          </button>
          <button 
            className={`btn ${tab === 'templates' ? '' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setTab('templates')}
          >
            Templates
          </button>
          <button 
            className={`btn ${tab === 'goals' ? '' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setTab('goals')}
          >
            Goals
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-4">
        {tab === 'dashboard' && (
          userRole === 'parent' ? <ParentDashboard /> : <ChildDashboard />
        )}
        {tab === 'instances' && <ChoreInstances />}
        {tab === 'calendar' && <ChoreCalendar />}
        {tab === 'points' && <PointsSummary />}
        {tab === 'templates' && <ChoreTemplates />}
        {tab === 'goals' && <Goals />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SupabaseProvider>
      <Root />
    </SupabaseProvider>
  );
}