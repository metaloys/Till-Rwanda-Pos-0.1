import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from './appTypes.ts';
import Auth from './Auth';
import Dashboard from './Dashboard';
import ResetPassword from './pages/ResetPassword'; // 1. IMPORT THE NEW PAGE

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  // --- NEW: State to track if we are in password reset mode ---
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  // --- END NEW ---

  const fetchProfile = async (userId: string) => {
    setIsLoadingProfile(true);
    const { data, error } = await supabase.from('profiles').select('id, full_name, shop_name, role, is_super_admin, shop_id').eq('id', userId).single();
    if (error) { console.error('Error fetching profile:', error); setProfile(null); }
    else if (data) { setProfile(data as Profile); }
    setIsLoadingProfile(false);
  };

  useEffect(() => {
    // Check for password reset token in URL on initial load
    if (window.location.hash.includes('access_token')) {
      setIsPasswordReset(true);
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // If the event is PASSWORD_RECOVERY, it means the user just set a new password
      if (_event === 'PASSWORD_RECOVERY') {
        setIsPasswordReset(false); // Switch back to the login screen
      }
      
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoadingProfile(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setIsLoadingProfile(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- NEW: Logic to show the Reset Password page ---
  if (isPasswordReset) {
    return <ResetPassword />;
  }
  // --- END NEW ---

  if (!session) {
    return <Auth />;
  }

  if (isLoadingProfile) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-100"><p>Loading...</p></div>;
  }
  
  if (!profile || (!profile.shop_id && !profile.is_super_admin)) { 
      return <div className="flex min-h-screen items-center justify-center bg-gray-100"><p className="text-xl text-red-700">Access Error: Profile not linked to a business.</p></div>;
  }

  return (
    <Dashboard profile={profile} />
  );
}

export default App;