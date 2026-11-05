import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type Papel = 'admin' | 'vendedor' | 'visualizador';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  papel: Papel | null;
  loading: boolean;
  isVisualizador: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, papel: null, loading: true,
  isVisualizador: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [papel, setPapel] = useState<Papel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Libera o loading assim que tiver a sessão — não espera o papel
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false); // <- libera imediatamente

      // Busca o papel em background, sem bloquear
      if (session?.user) {
        supabase
          .from('perfis_usuario')
          .select('papel')
          .eq('auth_user_id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            setPapel((data?.papel as Papel) ?? 'visualizador');
          });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setPapel(null);
        setLoading(false);
        return;
      }
      supabase
        .from('perfis_usuario')
        .select('papel')
        .eq('auth_user_id', session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          setPapel((data?.papel as Papel) ?? 'visualizador');
        });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      papel,
      loading,
      isVisualizador: papel === 'visualizador',
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}