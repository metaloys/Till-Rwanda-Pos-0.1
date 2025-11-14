import { useState } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, Pause, Play, Calendar, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface ShopActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: {
    id: string;
    name: string;
    is_active: boolean;
    trial_ends_at: string;
    days_left: number;
  } | null;
  onSuccess: () => void;
}

export default function ShopActionsModal({ isOpen, onClose, shop, onSuccess }: ShopActionsModalProps) {
  const [action, setAction] = useState<'pause' | 'resume' | 'extend' | 'delete' | null>(null);
  const [extendDays, setExtendDays] = useState('30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !shop) return null;

  const handleAction = async () => {
    if (!action) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (action === 'pause') {
        const { error: err } = await supabase
          .from('shops')
          .update({ is_active: false })
          .eq('id', shop.id);

        if (err) throw err;
        setSuccess(`✅ Shop "${shop.name}" paused. Customers cannot access it.`);
      } else if (action === 'resume') {
        const { error: err } = await supabase
          .from('shops')
          .update({ is_active: true })
          .eq('id', shop.id);

        if (err) throw err;
        setSuccess(`✅ Shop "${shop.name}" resumed. Customers can now access it.`);
      } else if (action === 'extend') {
        const days = parseInt(extendDays);
        if (isNaN(days) || days < 1) {
          throw new Error('Invalid number of days');
        }

        const newTrialEnd = new Date(shop.trial_ends_at);
        newTrialEnd.setDate(newTrialEnd.getDate() + days);

        const { error: err } = await supabase
          .from('shops')
          .update({ trial_ends_at: newTrialEnd.toISOString() })
          .eq('id', shop.id);

        if (err) throw err;
        setSuccess(`✅ Trial extended by ${days} days. New end date: ${newTrialEnd.toLocaleDateString()}`);
      } else if (action === 'delete') {
        // Note: This would need cascade deletes or proper cleanup
        const { error: err } = await supabase
          .from('shops')
          .delete()
          .eq('id', shop.id);

        if (err) throw err;
        setSuccess(`✅ Shop "${shop.name}" deleted.`);
      }

      setTimeout(() => {
        setAction(null);
        setConfirmDelete(false);
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Action error:', err);
    } finally {
      setLoading(false);
    }
  };

  // If we're in the middle of an action, show confirmation
  if (action === 'delete' && !confirmDelete) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <h2 className="text-lg font-bold text-gray-900">Delete Shop?</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Are you sure you want to delete <strong>"{shop.name}"</strong>? This action cannot be undone.
            All associated data will be permanently removed.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setAction(null)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete Shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Manage Shop</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <p className="font-semibold text-gray-900">{shop.name}</p>
          <p className="text-sm text-gray-600 mt-1">
            Status: <span className={shop.is_active ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
              {shop.is_active ? '🟢 Active' : '🔴 Paused'}
            </span>
          </p>
          <p className="text-sm text-gray-600">
            Trial: {new Date(shop.trial_ends_at).toLocaleDateString()} ({shop.days_left > 0 ? `${shop.days_left} days left` : 'EXPIRED'})
          </p>
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

        {!action && (
          <div className="space-y-3">
            {/* Pause/Resume Button */}
            {shop.is_active ? (
              <button
                onClick={() => setAction('pause')}
                disabled={loading}
                className="w-full flex items-center gap-3 rounded-lg border-2 border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
              >
                <Pause className="h-5 w-5" />
                Pause Shop Access
              </button>
            ) : (
              <button
                onClick={() => setAction('resume')}
                disabled={loading}
                className="w-full flex items-center gap-3 rounded-lg border-2 border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
              >
                <Play className="h-5 w-5" />
                Resume Shop Access
              </button>
            )}

            {/* Extend Trial Button */}
            <button
              onClick={() => setAction('extend')}
              disabled={loading}
              className="w-full flex items-center gap-3 rounded-lg border-2 border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              <Calendar className="h-5 w-5" />
              Extend Trial Period
            </button>

            {/* Delete Button */}
            <button
              onClick={() => setAction('delete')}
              disabled={loading}
              className="w-full flex items-center gap-3 rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="h-5 w-5" />
              Delete Shop
            </button>
          </div>
        )}

        {action === 'extend' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extend by (days):
              </label>
              <select
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">
                New trial end: {new Date(new Date(shop.trial_ends_at).getTime() + parseInt(extendDays) * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setAction(null)}
                disabled={loading}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Extending...' : 'Extend Trial'}
              </button>
            </div>
          </div>
        )}

        {(action === 'pause' || action === 'resume') && (
          <div className="flex gap-3">
            <button
              onClick={() => setAction(null)}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAction}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        )}

        {action === 'delete' && confirmDelete && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setAction(null);
                setConfirmDelete(false);
              }}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAction}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
