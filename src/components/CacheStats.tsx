import { useEffect, useState, useCallback } from 'react';
import { Database, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { ProductCacheService } from '../lib/productCacheService';

interface CacheStatsProps {
  shopId: string;
  isCompact?: boolean;
}

/**
 * Display cache statistics and refresh button
 */
export default function CacheStats({ shopId, isCompact = false }: CacheStatsProps) {
  const [stats, setStats] = useState({ cachedCount: 0, cachedAt: null as string | null, isStale: false });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    const stats = await ProductCacheService.getCacheStats(shopId);
    setStats(stats);
  }, [shopId]);

  useEffect(() => {
    void loadStats();
    const interval = setInterval(() => void loadStats(), 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [loadStats]);

  const handleRefreshCache = async () => {
    setIsRefreshing(true);
    try {
      await ProductCacheService.clearCache(shopId);
      await loadStats();
      // Note: User will need to refresh products manually
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isCompact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Database className="w-3 h-3 text-slate-500" />
        {stats.isStale ? (
          <span className="text-amber-600 dark:text-amber-400">Cache stale</span>
        ) : (
          <span className="text-green-600 dark:text-green-400">
            {stats.cachedCount} cached
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-2 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {stats.isStale ? (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Cache stale (refresh to update)
              </span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {stats.cachedCount} products cached
              </span>
            </>
          )}
        </div>
        <button
          onClick={handleRefreshCache}
          disabled={isRefreshing}
          className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-50"
          title="Clear cache and reload products"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {stats.cachedAt && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Last updated: {new Date(stats.cachedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
