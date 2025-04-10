import React, { useEffect, useState, createContext, useContext } from 'react';
import { SupabaseClient, Session, User } from '@supabase/supabase-js';

export interface AuthSession {
  user: User | null;
  session: Session | null;
}

const UserContext = createContext<AuthSession>({ session: null, user: null });

export interface Props {
  supabaseClient: SupabaseClient;
  [propName: string]: unknown;
}

export const UserContextProvider = (props: Props) => {
  const { supabaseClient } = props;
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(session?.user ?? null);

  useEffect(() => {
    (async () => {
      const { data } = await supabaseClient.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
    })();

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = React.useMemo(
    () => ({
      session,
      user,
    }),
    [session, user],
  );
  return <UserContext.Provider value={value} {...props} />;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error(`useUser must be used within a UserContextProvider.`);
  }
  return context;
};
