import { useState, FormEvent } from 'react';
import { supabase } from '../supabaseClient';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // The access_token is in the URL hash after the user clicks the email link
    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Your password has been updated successfully! You can now log in.');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
          Set a New Password
        </h1>
        {message ? (
          <p className="text-center text-green-600">{message}</p>
        ) : (
          <form className="space-y-6" onSubmit={handlePasswordReset}>
            <div>
              <label htmlFor="password">New Password</label>
              <input
                id="password"
                type="password"
                required
                className="input-field"
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}