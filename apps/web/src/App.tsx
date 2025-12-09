import { useEffect, useState } from 'react';
import { SupabaseProvider, useSupabase } from './auth/SupabaseContext';
import { AuthGate } from './auth/AuthGate';
import { Chores } from './features/chores/Chores';
import { Goals } from './features/goals/Goals';

function Root() {
  const { session } = useSupabase();
  const [tab, setTab] = useState<'chores' | 'goals'>('chores');

  useEffect(() => {
    // you can load initial data or socket connection here
  }, [session]);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mestring</h1>
        <AuthGate />
      </header>

      <nav className="mb-4 flex gap-2">
        <button className="btn" onClick={() => setTab('chores')}>Chores</button>
        <button className="btn" onClick={() => setTab('goals')}>Goals</button>
      </nav>

      <main>
        {tab === 'chores' ? <Chores /> : <Goals />}
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