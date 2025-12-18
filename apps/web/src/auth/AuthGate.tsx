import { useSupabase } from './SupabaseContext';
import { useState } from 'react';
import { UserSwitcher } from '../features/testing/UserSwitcher';

export function AuthGate() {
  const { supabase, session } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  }
  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
  }
  async function signOut() {
    await supabase.auth.signOut();
  }

  // Show user switcher for testing (since auth is disabled)
  return <UserSwitcher />;

  // Original auth UI (commented out while testing)
  /*
  if (session) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">{session.user.email}</span>
        <button className="btn" onClick={signOut}>Sign out</button>
      </div>
    );
  }

  return (
    <form className="flex gap-2" onSubmit={signIn}>
      <input className="input" placeholder="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input className="input" placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button className="btn" type="submit">Sign in</button>
      <button className="btn" type="button" onClick={signUp}>Sign up</button>
    </form>
  );
  */
}