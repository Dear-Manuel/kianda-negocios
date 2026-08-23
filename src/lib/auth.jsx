import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSyncEnabled } from './supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSyncEnabled()) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signUp(email, password) {
    if (!isSyncEnabled()) throw new Error('Sincronização não configurada');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  async function signIn(email, password) {
    if (!isSyncEnabled()) throw new Error('Sincronização não configurada');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    if (!isSyncEnabled()) return;
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, loading, signUp, signIn, signOut, syncEnabled: isSyncEnabled() }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
