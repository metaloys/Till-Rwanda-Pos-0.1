import { useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from './supabaseClient';
import { Store, Building } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isNewUser, setIsNewUser] = useState(false);
  const [shopName, setShopName] = useState('');

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
             console.error("Onboarding failed, user was created but not provisioned:", onboardError.message);
             throw new Error(`Account created, but shop setup failed. Error: ${onboardError.message}`);
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

  const handlePasswordReset = async () => {
    const email = prompt("Please enter your email to reset your password:");
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) { alert(`Error: ${error.message}`); } 
    else { alert('Password reset instructions sent to your email.'); }
    setLoading(false);
  };

  const commonForm = (
    <>
      <div>
        <label htmlFor="email" className="label-style">Email address</label>
        <input id="email" type="email" required className="input-field" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
      </div>
      <div>
        <label htmlFor="password" className="label-style">Password</label>
        <input id="password" type="password" required className="input-field" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="flex justify-center items-center mb-6 space-x-2">
            {/* --- Use default indigo color --- */}
            <Building className="h-8 w-8 text-indigo-600" />
            <h1 className="text-center text-3xl font-bold text-slate-900">
              TillRwanda PoS
            </h1>
        </div>
        
        {!isNewUser ? (
          <form className="space-y-6" onSubmit={handleLogin}>
            {commonForm}
            <div className="text-right text-sm">
                <button type="button" onClick={handlePasswordReset} className="font-medium text-indigo-600 hover:text-indigo-500">
                    Forgot your password?
                </button>
            </div>
            <div className="flex items-center space-x-4">
              {/* --- Use default indigo color --- */}
              <button type="submit" disabled={loading} className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">
                {loading ? 'Logging In...' : 'Log In'}
              </button>
            </div>
            <p className="text-center text-sm text-slate-600">
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
            <div><label htmlFor="shop-name" className="label-style">Business Name</label><input id="shop-name" type="text" required className="input-field" placeholder="e.g., Judith's Grocery Store" value={shopName} onChange={(e) => setShopName(e.target.value)} /></div>
            {commonForm}
            <div className="flex items-center space-x-4">
              <button type="submit" disabled={loading || !shopName} className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50">
                {loading ? 'Provisioning Shop...' : 'Create Owner Account'}
              </button>
            </div>
            <p className="text-center text-sm text-slate-600">
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