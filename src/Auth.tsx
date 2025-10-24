import { useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from './supabaseClient';
import { Store, Building, Eye, EyeOff } from 'lucide-react'; // 1. Import Eye icons
import ThemeToggle from './components/ThemeToggle'; 

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // --- 2. Add state for password visibility ---
  const [showPassword, setShowPassword] = useState(false); 
  
  const [isNewUser, setIsNewUser] = useState(false);
  const [shopName, setShopName] = useState('');

  const handleOwnerSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError || !authData.user) throw new Error(authError?.message || 'Signup failed.');
        const { error: onboardError } = await supabase.functions.invoke('onboard-new-shop', { body: JSON.stringify({ userId: authData.user.id, shopName: shopName }), headers: { 'Content-Type': 'application/json' }});
        if (onboardError) {
             console.error("Onboarding failed:", onboardError.message);
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
    const email = prompt("Please enter your email:");
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) { alert(`Error: ${error.message}`); } 
    else { alert('Password reset instructions sent.'); }
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
        {/* --- 3. Add toggle button to password input --- */}
        <div className="relative">
          <input 
            id="password" 
            type={showPassword ? "text" : "password"} 
            required 
            className="input-field pr-10" // Add padding for icon
            placeholder="Your password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            autoComplete="new-password" 
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {/* --- END 3 --- */}
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-xl dark:bg-slate-800">
          <div className="flex justify-center items-center mb-6 space-x-2">
              <Building className="h-8 w-8 text-indigo-600" />
              <h1 className="text-center text-3xl font-bold text-slate-900 dark:text-white">
                TillRwanda PoS
              </h1>
          </div>
          
          {!isNewUser ? (
            <form className="space-y-6" onSubmit={handleLogin}>
              {commonForm}
              <div className="text-right text-sm">
                  {/* --- 4. FIX THE TYPO: type.="button" -> type="button" --- */}
                  <button type="button" onClick={handlePasswordReset} className="font-medium text-indigo-600 hover:text-indigo-500">
                      Forgot your password?
                  </button>
                  {/* --- END 4 --- */}
              </div>
              <div className="flex items-center space-x-4">
                <button type="submit" disabled={loading} className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">
                  {loading ? 'Logging In...' : 'Log In'}
                </button>
              </div>
              <p className="text-center text-sm text-slate-600 dark:text-slate-400">
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
              <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                  <button type="button" onClick={() => setIsNewUser(false)} className="font-medium text-indigo-600 hover:text-indigo-500">
                      Back to Log In
                  </button>
              </p>
            </form>
          )}
        </div>
        <div className="mt-4 w-full max-w-md mx-auto">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}