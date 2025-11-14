import { useState } from 'react';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface OnboardShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OnboardShopModal({ isOpen, onClose, onSuccess }: OnboardShopModalProps) {
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [trialDays, setTrialDays] = useState('30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate inputs
      if (!shopName.trim() || !ownerName.trim() || !ownerEmail.trim()) {
        throw new Error('All fields are required');
      }

      if (!ownerEmail.includes('@')) {
        throw new Error('Invalid email address');
      }

      const days = parseInt(trialDays);
      if (isNaN(days) || days < 1 || days > 365) {
        throw new Error('Trial duration must be between 1 and 365 days');
      }

      // Step 1: Create auth user via Supabase Admin API
      // Using Supabase CLI/dashboard - this should be done separately
      // For now, we'll call the edge function which expects the user to exist
      
      setSuccess('Creating owner account and shop...');

      // Step 2: Call the onboard-new-shop edge function
      // Note: In production, you'd create the auth user first, then call this
      const functionUrl = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/onboard-new-shop';
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
        },
        body: JSON.stringify({
          shopName: shopName.trim(),
          ownerName: ownerName.trim(),
          ownerEmail: ownerEmail.trim(),
          trialDays: days,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to onboard shop');
      }

      const data = await response.json();

      setSuccess(`✅ Shop "${shopName}" created successfully! Shop ID: ${data.shopId}`);
      
      // Reset form
      setTimeout(() => {
        setShopName('');
        setOwnerName('');
        setOwnerEmail('');
        setTrialDays('30');
        onSuccess();
        onClose();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Onboarding error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Onboard New Shop</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-lg bg-red-50 p-4 border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start gap-3 rounded-lg bg-green-50 p-4 border border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shop Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop Name *
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g., Kigali Main Store"
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              required
            />
          </div>

          {/* Owner Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner Name *
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g., John Doe"
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              required
            />
          </div>

          {/* Owner Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner Email *
            </label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="owner@example.com"
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Account credentials will be sent to this email
            </p>
          </div>

          {/* Trial Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trial Duration (Days) *
            </label>
            <select
              value={trialDays}
              onChange={(e) => setTrialDays(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days (default)</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Trial ends: {new Date(Date.now() + parseInt(trialDays) * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Creating...' : 'Create Shop'}
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs text-gray-500 text-center">
          💡 Tip: After onboarding, you'll need to manually create the owner's auth account in Supabase.
        </p>
      </div>
    </div>
  );
}
