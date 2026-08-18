import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user's organization & membership info
  const fetchUserOrg = async (userId) => {
    try {
      if (!userId) {
        setOrganization(null);
        setMember(null);
        return;
      }

      // Query members table joined with organizations
      const { data: memberData, error: memberErr } = await supabase
        .from('members')
        .select('*, organizations(*)')
        .eq('user_id', userId)
        .maybeSingle();

      if (memberErr) {
        console.error('[AuthContext] Error fetching membership:', memberErr.message);
        return;
      }

      if (memberData) {
        setMember({ id: memberData.id, role: memberData.role, org_id: memberData.org_id });
        setOrganization(memberData.organizations);
      } else {
        // Fallback: If trigger didn't finish or user has no org yet, create one
        console.log('[AuthContext] No org found for user, creating default organization...');
        const userEmail = (user?.email || 'User');
        const defaultName = `${userEmail.split('@')[0]}'s Organization`;
        const defaultSlug = `org-${Date.now()}`;

        const { data: newOrg, error: orgErr } = await supabase
          .from('organizations')
          .insert([{ name: defaultName, slug: defaultSlug, plan: 'free' }])
          .select()
          .single();

        if (!orgErr && newOrg) {
          const { data: newMem } = await supabase
            .from('members')
            .insert([{ user_id: userId, org_id: newOrg.id, role: 'owner' }])
            .select()
            .single();

          setOrganization(newOrg);
          if (newMem) setMember({ id: newMem.id, role: newMem.role, org_id: newOrg.id });
        }
      }
    } catch (e) {
      console.error('[AuthContext] Exception in fetchUserOrg:', e);
    }
  };

  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserOrg(session.user.id);
      }
      setLoading(false);
    });

    // 2. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserOrg(session.user.id);
      } else {
        setOrganization(null);
        setMember(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUpWithEmail = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('[AuthContext] SignOut error:', error);
    setUser(null);
    setSession(null);
    setOrganization(null);
    setMember(null);
  };

  const refreshOrganization = async () => {
    if (user?.id) {
      await fetchUserOrg(user.id);
    }
  };

  const value = {
    user,
    session,
    organization,
    member,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    refreshOrganization,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
