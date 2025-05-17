import { User, Session, AuthError, AuthResponse } from '@supabase/supabase-js';
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../src/supabase';
import Loading from '../../src/contexts/Loading';
import { set } from 'date-fns';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  loading: boolean;
  setAuth: (authUser: User | null) => void;
  userData: any;
  setUserData: (userData: any) => void;
  isAdmin: boolean;
  loginAdmin: (email: string, password: string) => Promise<boolean>;
}

const emailAdmin = "admin@barberapp.com";
const senhaAdmin = "adminpassword";

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const buscarSessao = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Erro ao obter sessão:', error.message);
      } else {
        const sessaoData = data?.session;
        if (sessaoData) {
          setSession(sessaoData);
          setUser(sessaoData.user);
          await buscarDadosUsuario(sessaoData.user?.id);
          setIsAdmin(sessaoData.user?.email === emailAdmin);
        }
      }
      setLoading(false);
    };

    const buscarDadosUsuario = async (userId: string | undefined) => {
      if (!userId) return;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar dados do usuário:', error);
      } else {
        setUserData(data);
      }
    };

    const { data: listenerAuth } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setSession(session);
        setUser(session?.user || null);
        await buscarDadosUsuario(session?.user?.id);
        setIsAdmin(session?.user?.email === emailAdmin);
      }
    );

    buscarSessao();

    return () => {
      listenerAuth?.subscription?.unsubscribe();
    };
  }, []);

  function setAuth(authUser: User | null) {
    setUser(authUser);
  }

  async function loginAdmin(email: string, password: string): Promise<boolean> {
    console.log("loginAdmin chamado com:", { email, password });
    if (email === emailAdmin && password === senhaAdmin) {
      setLoading(true);
      console.log("Credenciais de admin correspondem. Tentando login no supabase...");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      setLoading(false);

      if (error) {
        console.error('Erro ao fazer login como administrador:', error);
        setIsAdmin(false);
        console.log("loginAdmin retornando false devido a erro supabase.", error);
        return false;
      }

      console.log("Login de administrador no supabase bem-sucedido.");
      return true;
    } else {
      setIsAdmin(false);
      console.log("Credenciais de adminsitrador não correspondem. loginAdmin retornando false.");
      return false;
    }
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, setAuth, userData, setUserData, isAdmin, loginAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};