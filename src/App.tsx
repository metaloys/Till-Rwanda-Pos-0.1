import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from './appTypes.ts';
import Auth from './Auth';
import Dashboard from './Dashboard';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Function to fetch the user's profile data
  const fetchProfile = async (userId: string) => {
    setIsLoadingProfile(true);
    const { data, error } = await supabase
      .from('profiles')
      // --- FIX: Select all the fields we need ---
      .select('id, full_name, shop_name, role, is_super_admin, shop_id')
      // --- END FIX ---
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } else if (data) {
      setProfile(data as Profile);
    }
    setIsLoadingProfile(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
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

  if (!session) {
    return <Auth />;
  }

  if (isLoadingProfile) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <p className="text-xl text-gray-700">Loading user profile...</p>
        </div>
    );
  }
  
  // This check prevents access for users whose profile/shop link is broken
  if (!profile || (!profile.shop_id && !profile.is_super_admin)) {
      return (
          <div className="flex min-h-screen items-center justify-center bg-gray-100">
              <p className="text-xl text-red-700">
                  Access Error: Profile not linked to a business. Please contact support.
              </p>
          </div>
      );
  }

  return (
    <Dashboard profile={profile} />
  );
}

export default App;