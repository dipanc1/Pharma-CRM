import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error loading session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes - only update if the user actually changed.
    // Supabase fires SIGNED_IN / TOKEN_REFRESHED on tab refocus with a new
    // session object; bailing out when the id is unchanged keeps the `user`
    // state reference stable and avoids a profile reload / route unmount.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const nextUser = session?.user ?? null;
        setUser((prev) => (prev?.id === nextUser?.id ? prev : nextUser));
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!user) {
        if (isMounted) {
          setProfile(null);
          setProfileLoading(false);
        }
        return;
      }

      setProfileLoading(true);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, role, display_name')
          .eq('id', user.id)
          .single();

        if (isMounted) {
          setProfile(error ? null : data);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        if (isMounted) {
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  };

  const verifyOtp = async (email, token, type) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    });
    return { data, error };
  };

  const enrollMFA = async (factorType) => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType,
    });
    return { data, error };
  };

  const unenrollMFA = async (factorId) => {
    const { data, error } = await supabase.auth.mfa.unenroll({
      factorId,
    });
    return { data, error };
  };

  const listFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    return { data, error };
  };

  const value = {
    user,
    loading,
    profile,
    role: profile?.role ?? 'rep',
    profileLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    verifyOtp,
    enrollMFA,
    unenrollMFA,
    listFactors,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
