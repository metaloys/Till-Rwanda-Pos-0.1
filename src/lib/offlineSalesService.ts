import { db, type OfflineSale, type SyncQueue } from './db';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabaseClient';

/**
 * Service for handling offline sales and sync queue
 */
export class OfflineSalesService {
  /**
   * Save a sale to offline storage when network is unavailable
   */
  static async saveOfflineSale(
    shopId: string,
    saleData: Omit<OfflineSale, 'id' | 'saleId' | 'shopId' | 'status' | 'syncAttempts' | 'createdAt'>,
  ): Promise<OfflineSale> {
    const offlineSale: OfflineSale = {
      saleId: uuidv4(),
      shopId,
      ...saleData,
      status: 'pending',
      syncAttempts: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      const id = await db.offlineSales.add(offlineSale);
      console.log('Offline sale saved:', { id, saleId: offlineSale.saleId });
      
      // Also add to sync queue
      await this.addToSyncQueue(offlineSale.saleId, shopId, 'create_sale', offlineSale as unknown as Record<string, unknown>);
      
      return { ...offlineSale, id };
    } catch (error) {
      console.error('Failed to save offline sale:', error);
      throw error;
    }
  }

  /**
   * Add item to sync queue for later processing
   */
  static async addToSyncQueue(
    saleId: string,
    shopId: string,
    action: 'create_sale' | 'update_sale' | 'delete_sale',
    payload: Record<string, unknown>,
  ): Promise<void> {
    const queueItem: SyncQueue = {
      saleId,
      shopId,
      action,
      payload,
      status: 'pending',
      createdAt: new Date().toISOString(),
      attemptCount: 0,
    };

    try {
      await db.syncQueue.add(queueItem);
      console.log('Added to sync queue:', queueItem);
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
    }
  }

  /**
   * Get all pending offline sales
   */
  static async getPendingSales(shopId: string): Promise<OfflineSale[]> {
    try {
      return await db.offlineSales
        .where('shopId')
        .equals(shopId)
        .filter(sale => sale.status === 'pending' || sale.status === 'failed')
        .toArray();
    } catch (error) {
      console.error('Failed to get pending sales:', error);
      return [];
    }
  }

  /**
   * Sync offline sales with Supabase when network is available
   */
  static async syncOfflineSales(shopId: string): Promise<{ synced: number; failed: number }> {
    const pendingSales = await this.getPendingSales(shopId);
    let synced = 0;
    let failed = 0;

    for (const sale of pendingSales) {
      try {
        // Prepare sale data for Supabase
        const { id, saleId, ...salePayload } = sale;

        // Insert main sale record
        const { error: saleError } = await supabase
          .from('sales')
          .insert([
            {
              id: saleId,
              shop_id: shopId,
              customer_id: (salePayload.customerId as string | undefined) ? parseInt(salePayload.customerId as string) : null,
              payment_method: salePayload.paymentMethod,
              transaction_ref: salePayload.paymentReference || null,
              total_amount: salePayload.totalAmount,
              discount_percent: (salePayload.discountAmount / salePayload.totalAmount) * 100,
              final_amount: salePayload.finalAmount,
              notes: salePayload.notes || null,
              created_at: salePayload.createdAt,
            },
          ])
          .select();

        if (saleError) {
          throw new Error(`Failed to create sale: ${saleError.message}`);
        }

        // Insert sale items
        interface SaleItem {
          productId: string;
          variantId?: string;
          quantity: number;
          price: number;
          discount?: number;
        }
        const saleItems = (salePayload.items as SaleItem[]).map((item) => ({
          sale_id: saleId,
          product_id: item.productId,
          variant_id: item.variantId || null,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
        }));

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItems);

        if (itemsError) {
          throw new Error(`Failed to create sale items: ${itemsError.message}`);
        }

        // Update stock via Edge Function
        await supabase.functions.invoke('complete-sale', {
          body: {
            saleId,
            items: salePayload.items,
          },
        });

        // Mark as synced
        await db.offlineSales.update(id!, { status: 'synced' });
        await db.syncQueue.where('saleId').equals(saleId).modify({ status: 'synced' });

        synced++;
        console.log(`Synced sale: ${saleId}`);
      } catch (error) {
        failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        
        // Update sale with error info and increment attempts
        await db.offlineSales.update(sale.id!, {
          status: 'failed',
          syncAttempts: (sale.syncAttempts || 0) + 1,
          lastSyncError: errorMsg,
        });

        console.error(`Failed to sync sale ${sale.saleId}:`, error);
      }
    }

    return { synced, failed };
  }

  /**
   * Get sync status
   */
  static async getSyncStatus(shopId: string) {
    try {
      const pending = await db.offlineSales.where('shopId').equals(shopId).filter(s => s.status === 'pending').count();
      const failed = await db.offlineSales.where('shopId').equals(shopId).filter(s => s.status === 'failed').count();
      const synced = await db.offlineSales.where('shopId').equals(shopId).filter(s => s.status === 'synced').count();

      return { pending, failed, synced };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return { pending: 0, failed: 0, synced: 0 };
    }
  }

  /**
   * Clear failed sales after manual review
   */
  static async clearFailedSales(shopId: string): Promise<void> {
    try {
      await db.offlineSales.where('shopId').equals(shopId).filter(s => s.status === 'failed').delete();
      console.log('Cleared failed sales');
    } catch (error) {
      console.error('Failed to clear failed sales:', error);
    }
  }
}
