import { db, type CachedProduct } from './db';
import { supabase } from '../supabaseClient';
import type { ProductVariant } from '../appTypes';

/**
 * Service for caching products locally for offline access
 */
export class ProductCacheService {
  private static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms
  private static isSyncing = false;

  /**
   * Cache products for offline access
   */
  static async cacheProducts(
    shopId: string,
    variants: ProductVariant[],
  ): Promise<void> {
    try {
      const now = new Date().toISOString();

      // Get product info for each variant
      const productsMap = new Map<
        number,
        {
          id: string;
          name: string;
          category: string;
          description?: string;
        }
      >();

      // Fetch distinct products if needed
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, category')
        .eq('shop_id', shopId);

      if (error) {
        console.warn('Could not cache products:', error.message);
        return;
      }

      if (products) {
        products.forEach((p: any) => {
          productsMap.set(p.id, {
            id: p.id.toString(),
            name: p.name,
            category: p.category || 'Uncategorized',
          });
        });
      }

      // Cache each variant
      const cachedProducts: CachedProduct[] = variants.map((v) => {
        const product = productsMap.get(v.product_id);
        return {
          id: v.id.toString(),
          shopId,
          name: product?.name || 'Unknown Product',
          category: product?.category || 'Uncategorized',
          price: v.price,
          stock_quantity: v.stock_quantity,
          variants: [
            {
              id: v.id.toString(),
              name: v.name || 'Standard',
              price: v.price,
              stock_quantity: v.stock_quantity,
            },
          ],
          cachedAt: now,
        };
      });

      // Clear old cache for this shop and add new
      await db.cachedProducts.where('shopId').equals(shopId).delete();
      await db.cachedProducts.bulkAdd(cachedProducts);

      console.log(`Cached ${cachedProducts.length} products for offline access`);
    } catch (error) {
      console.error('Error caching products:', error);
    }
  }

  /**
   * Get cached products (for offline fallback)
   */
  static async getCachedProducts(shopId: string): Promise<CachedProduct[]> {
    try {
      const cached = await db.cachedProducts
        .where('shopId')
        .equals(shopId)
        .toArray();

      // Check cache age (24 hours)
      const now = new Date().getTime();
      return cached.filter((p) => {
        const age = now - new Date(p.cachedAt).getTime();
        return age < this.CACHE_DURATION;
      });
    } catch (error) {
      console.error('Error retrieving cached products:', error);
      return [];
    }
  }

  /**
   * Check if cache is stale (older than 24 hours)
   */
  static async isCacheStale(shopId: string): Promise<boolean> {
    try {
      const cached = await db.cachedProducts.where('shopId').equals(shopId).first();
      if (!cached) return true;

      const age = new Date().getTime() - new Date(cached.cachedAt).getTime();
      return age > this.CACHE_DURATION;
    } catch {
      return true;
    }
  }

  /**
   * Get cache stats
   */
  static async getCacheStats(shopId: string) {
    try {
      const count = await db.cachedProducts.where('shopId').equals(shopId).count();
      const oldest = await db.cachedProducts
        .where('shopId')
        .equals(shopId)
        .first();

      return {
        cachedCount: count,
        cachedAt: oldest?.cachedAt || null,
        isStale: count === 0 || (await this.isCacheStale(shopId)),
      };
    } catch (error) {
      return { cachedCount: 0, cachedAt: null, isStale: true };
    }
  }

  /**
   * Clear cache for a shop (manual refresh)
   */
  static async clearCache(shopId: string): Promise<void> {
    try {
      await db.cachedProducts.where('shopId').equals(shopId).delete();
      console.log('Cache cleared for shop:', shopId);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Clear all cache
   */
  static async clearAllCache(): Promise<void> {
    try {
      await db.cachedProducts.clear();
      console.log('All product cache cleared');
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }
}
