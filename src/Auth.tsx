import { useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from './supabaseClient';
import { Store } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [shopName, setShopName] = useState('');

  // --- NEW: Handle Forgot Password ---
  const handlePasswordReset = async () => {
    const email = prompt("Please enter your email address to reset your password:");
    if (!email) return; // User cancelled

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin, // Sends them back to your app after clicking the email link
    });

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      alert('Password reset instructions have been sent to your email.');
    }
    setLoading(false);
  };
  // --- END NEW ---

  const handleOwnerSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError || !authData.user) throw new Error(authError?.message || 'Signup failed.');

        const { error: onboardError } = await supabase.functions.invoke('onboard-new-shop', {
            body: JSON.stringify({ userId: authData.user.id, shopName: shopName }),
            headers: { 'Content-Type': 'application/json' },
        });

        if (onboardError) {
             console.error("Onboarding failed:", onboardError.message);
             // We can't delete the user from the client-side, but we can log the issue
             throw new Error(`Account created, but shop setup failed. Please contact support. Error: ${onboardError.message}`);
        }
        alert(`Welcome, Owner of ${shopName}! Please check your email to confirm your account.`);
    } catch (error: any) {
        alert(`Signup failed: ${error.message}`);
    } finally {
        setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { alert(error.message); } 
    setLoading(false);
  };

  const commonForm = (
    <>
      <div><label htmlFor="email">Email address</label><input id="email" type="email" required className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><label htmlFor="password">Password</label><input id="password" type="password" required className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
    </>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">Till Rwanda</h1>
        
        {!isNewUser ? (
          <form className="space-y-6" onSubmit={handleLogin}>
            {commonForm}
            {/* --- ADD FORGOT PASSWORD LINK --- */}
            <div className="text-right text-sm">
                <button type="button" onClick={handlePasswordReset} className="font-medium text-indigo-600 hover:text-indigo-500">
                    Forgot your password?
                </button>
            </div>
            {/* --- END LINK --- */}
            <div className="flex items-center space-x-4">
              <button type="submit" disabled={loading} className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50">
                {loading ? 'Logging In...' : 'Log In'}
              </button>
            </div>
            <p className="text-center text-sm text-gray-600">
                New business owner?{' '}
                <button type="button" onClick={() => setIsNewUser(true)} className="font-medium text-indigo-600 hover:text-indigo-500">
                    Register Your Shop
                </button>
            </p>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleOwnerSignUp}>
            <div className="rounded-md bg-yellow-50 p-3 flex items-center space-x-2 border border-yellow-300">
                <Store className='h-5 w-5 text-yellow-600' />
                <p className='text-sm font-medium text-yellow-800'>Registering a New Business Owner Account.</p>
            </div>
            <div><label htmlFor="shop-name">Business Name</label><input id="shop-name" type="text" required className="input-field" value={shopName} onChange={(e) => setShopName(e.target.value)} /></div>
            {commonForm}
            <div className="flex items-center space-x-4">
              <button type="submit" disabled={loading || !shopName} className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50">
                {loading ? 'Provisioning Shop...' : 'Create Owner Account'}
              </button>
            </div>
            <p className="text-center text-sm text-gray-600">
                <button type="button" onClick={() => setIsNewUser(false)} className="font-medium text-indigo-600 hover:text-indigo-500">
                    Back to Log In
                </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}