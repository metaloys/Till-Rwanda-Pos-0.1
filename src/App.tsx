import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from './appTypes.ts';
import Auth from './Auth';
import Dashboard from './Dashboard';
import ResetPassword from './pages/ResetPassword';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  // --- FIX: Check for reset hash on initial render ---
  const [isPasswordReset, setIsPasswordReset] = useState(
    window.location.hash.includes('type=recovery')
  );
  // --- END FIX ---

  const fetchProfile = async (userId: string) => {
    setIsLoadingProfile(true);
    const { data, error } = await supabase.from('profiles').select('id, full_name, shop_name, role, is_super_admin, shop_id').eq('id', userId).single();
    if (error) { console.error('Error fetching profile:', error); setProfile(null); }
    else if (data) { setProfile(data as Profile); }
    setIsLoadingProfile(false);
  };

  useEffect(() => {
    // 1. Set up the main auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      
      if (_event === 'PASSWORD_RECOVERY') {
        // User successfully reset password. Show login page.
        setIsPasswordReset(false);
        setSession(null);
        setProfile(null);
      } else if (_event === 'SIGNED_IN') {
        setSession(session);
        if (session && !isPasswordReset) { // Only fetch profile if NOT in reset mode
          fetchProfile(session.user.id);
        }
      } else if (_event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setIsPasswordReset(false);
      }
    });

    // 2. Get initial session, *unless* we are in password reset mode
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
        setIsLoadingProfile(false); // We are not loading a profile
    }

    return () => subscription.unsubscribe();
  }, []); // Run only once

  // --- RENDER LOGIC (NOW IN CORRECT ORDER) ---
  
  // 1. If we are in password reset mode, show that page first.
  if (isPasswordReset) {
    return <ResetPassword />;
  }
  
  // 2. If no session, show login
  if (!session) {
    return <Auth />;
  }

  // 3. If loading profile...
  if (isLoadingProfile) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-100"><p>Loading...</p></div>;
  }
  
  // 4. If profile is bad...
  if (!profile || (!profile.shop_id && !profile.is_super_admin)) { 
      return <div className="flex min-h-screen items-center justify-center bg-gray-100"><p className="text-xl text-red-700">Access Error: Profile not linked to a business.</p></div>;
  }

  // 5. Show dashboard
  return (
    <Dashboard profile={profile} />
  );
}

export default App;