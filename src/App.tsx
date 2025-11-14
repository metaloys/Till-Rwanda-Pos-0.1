import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from './appTypes.ts';
import Auth from './Auth';
import Dashboard from './Dashboard';
import ResetPassword from './pages/ResetPassword';
import { Toaster } from 'react-hot-toast';
import { initializeOfflineDB } from './lib/db';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(
    window.location.hash.includes('type=recovery')
  );

  const fetchProfile = async (userId: string) => {
    setIsLoadingProfile(true);
    
    // --- THIS IS THE FIX ---
    // We must do two separate, simple queries.

    // 1. Get the user's profile first
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*') // Select all columns from profiles
      .eq('id', userId)
      .single();

    if (profileError || !profileData) {
      console.error('Error fetching profile:', profileError?.message);
      setProfile(null);
      setIsLoadingProfile(false);
      return;
    }

    // 2. Now, create the full profile object
    const fullProfile: Profile = profileData as Profile;
    
    if (profileData.is_super_admin) {
      // Super admins are always active
      (fullProfile as Partial<Profile>).is_active = true;
    } else if (profileData.shop_id) {
      // This is a regular shop owner, so we MUST check their shop's status
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('is_active, trial_ends_at')
        .eq('id', profileData.shop_id)
        .single();
        
      if (shopError) {
        console.error('Error fetching shop status:', shopError.message);
        (fullProfile as Partial<Profile>).is_active = false; // Default to inactive if shop query fails
      } else if (shopData) {
        (fullProfile as Partial<Profile>).is_active = shopData.is_active;
        (fullProfile as Partial<Profile>).trial_ends_at = shopData.trial_ends_at;
      }
    } else {
      // User has no shop_id and is not admin, they are locked out.
      (fullProfile as Partial<Profile>).is_active = false;
    }

    setProfile(fullProfile);
    setIsLoadingProfile(false);
  };
  // --- END FIX ---

  useEffect(() => {
    // Initialize offline database on app startup
    void initializeOfflineDB();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        setIsPasswordReset(false); setSession(null); setProfile(null);
      } else if (_event === 'SIGNED_IN') {
        setSession(session);
        if (session && !isPasswordReset) { fetchProfile(session.user.id); }
      } else if (_event === 'SIGNED_OUT') {
        setSession(null); setProfile(null); setIsPasswordReset(false);
      }
    });

    if (!isPasswordReset) {
       supabase.auth.getSession().then(({ data: { session } }) => {
         setSession(session);
         if (session) {
           fetchProfile(session.user.id);
         } else {
           setIsLoadingProfile(false);
         }
       });
    } else {
        setIsLoadingProfile(false);
    }

    return () => subscription.unsubscribe();
  }, [isPasswordReset]);

  // --- RENDER LOGIC ---
  
  if (isPasswordReset) {
    return ( <> <Toaster position="top-center" reverseOrder={false} /> <ResetPassword /> </> );
  }
  
  if (!session) {
    return ( <> <Toaster position="top-center" reverseOrder={false} /> <Auth /> </> );
  }

  if (isLoadingProfile) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900"><p className="text-slate-700 dark:text-slate-300">Loading user profile...</p></div>;
  }
  
  // This check now correctly handles super admins
  if (!profile || (!profile.shop_id && !profile.is_super_admin)) { 
      return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900"><p className="text-xl text-red-600 p-4">Access Error: Profile not linked to a business.</p></div>;
  }

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Dashboard profile={profile} />
    </>
  );
}

export default App;