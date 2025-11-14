import { useEffect, useState } from 'react';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { ConnectivityService } from '../lib/connectivityService';
import { OfflineSalesService } from '../lib/offlineSalesService';

interface OfflineIndicatorProps {
  shopId: string;
}

/**
 * Component to display offline status and sync information
 */
export default function OfflineIndicator({ shopId }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ pending: 0, failed: 0, synced: 0 });
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Initialize connectivity detection
    ConnectivityService.initialize();

    // Subscribe to connectivity changes
    const unsubscribe = ConnectivityService.subscribe(async (online) => {
      setIsOnline(online);
      setShowBanner(!online);

      // Auto-sync when coming back online
      if (online && syncStatus.pending > 0) {
        await syncOfflineSales();
      }
    });

    // Get initial sync status
    refreshSyncStatus();

    // Refresh sync status periodically
    const interval = setInterval(refreshSyncStatus, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [shopId]);

  const refreshSyncStatus = async () => {
    const status = await OfflineSalesService.getSyncStatus(shopId);
    setSyncStatus(status);
  };

  const syncOfflineSales = async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    try {
      const result = await OfflineSalesService.syncOfflineSales(shopId);
      console.log(`Sync complete: ${result.synced} synced, ${result.failed} failed`);
      await refreshSyncStatus();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't show banner when online and no pending sales
  if (isOnline && syncStatus.pending === 0 && syncStatus.failed === 0) {
    return null;
  }

  return (
    <>
      {/* Offline Banner */}
      {showBanner && (
        <div className="fixed top-0 left-0 right-0 bg-red-50 border-b-2 border-red-500 p-4 flex items-center justify-between z-50 shadow-lg">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-semibold">
              You are offline. Changes will sync when you're back online.
            </span>
          </div>
        </div>
      )}

      {/* Pending Sync Indicator */}
      {(syncStatus.pending > 0 || syncStatus.failed > 0) && (
        <div className="fixed bottom-4 right-4 bg-white border-2 border-slate-200 rounded-lg p-4 shadow-lg z-50 max-w-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {syncStatus.failed > 0 ? (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Wifi className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-pulse" />
              )}
              <div>
                {syncStatus.pending > 0 && (
                  <p className="text-sm font-semibold text-slate-800">
                    {syncStatus.pending} sale{syncStatus.pending !== 1 ? 's' : ''} waiting to sync
                  </p>
                )}
                {syncStatus.failed > 0 && (
                  <p className="text-sm font-semibold text-red-600">
                    {syncStatus.failed} sale{syncStatus.failed !== 1 ? 's' : ''} failed to sync
                  </p>
                )}
                {syncStatus.synced > 0 && (
                  <p className="text-xs text-slate-600 mt-1">
                    {syncStatus.synced} successfully synced
                  </p>
                )}
              </div>
            </div>
            {isOnline && syncStatus.pending > 0 && (
              <button
                onClick={syncOfflineSales}
                disabled={isSyncing}
                className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-slate-400 flex-shrink-0"
              >
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
