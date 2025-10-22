import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from './appTypes.ts'; // Adding the .ts extension back to the import path here
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
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } else if (data) {
      setProfile(data as Profile);
      // Log added for diagnostic check
      // console.log("PROFILE LOADED: Role is", data.role); 
    }
    setIsLoadingProfile(false);
  };

  useEffect(() => {
    // 1. Handle session change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoadingProfile(false);
      }
    });

    // 2. Initial session check
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

  // --- Render logic ---
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
  
  if (!profile) {
      return (
          <div className="flex min-h-screen items-center justify-center bg-gray-100">
              <p className="text-xl text-red-700">Error: Profile not found. Please ensure your profile exists in the Supabase 'profiles' table.</p>
          </div>
      );
  }

  return (
    <Dashboard profile={profile} />
  );
}

export default App;