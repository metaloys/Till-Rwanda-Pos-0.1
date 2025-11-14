import Dexie, { type Table } from 'dexie';

// Types for offline storage
export interface OfflineSale {
  id?: number; // Auto-increment for local tracking
  saleId: string; // UUID from frontend
  shopId: string;
  customerId?: string;
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
    discount?: number;
  }[];
  paymentMethod: 'cash' | 'mtn_momo' | 'airtel_money' | 'bank_transfer' | 'credit';
  paymentReference?: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  createdAt: string; // ISO timestamp
  notes?: string;
  status: 'pending' | 'synced' | 'failed';
  syncAttempts: number;
  lastSyncError?: string;
}

export interface OfflineCart {
  id?: number;
  shopId: string;
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
    discount?: number;
  }[];
  customerId?: string;
  notes?: string;
  lastUpdated: string; // ISO timestamp
}

export interface SyncQueue {
  id?: number;
  saleId: string;
  shopId: string;
  action: 'create_sale' | 'update_sale' | 'delete_sale';
  payload: any;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  createdAt: string;
  lastAttempt?: string;
  attemptCount: number;
  error?: string;
}

export interface CachedProduct {
  id: string;
  shopId: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  stock_quantity: number;
  variants: {
    id: string;
    name: string;
    price: number;
    stock_quantity: number;
  }[];
  cachedAt: string;
}

/**
 * Till Rwanda Offline Database
 * Uses Dexie (IndexedDB wrapper) for offline sales storage and sync queue
 */
class TillRwandaDB extends Dexie {
  offlineSales!: Table<OfflineSale>;
  offlineCart!: Table<OfflineCart>;
  syncQueue!: Table<SyncQueue>;
  cachedProducts!: Table<CachedProduct>;

  constructor() {
    super('TillRwandaDB');
    this.version(1).stores({
      offlineSales: '++id, saleId, shopId, status, createdAt',
      offlineCart: '++id, shopId',
      syncQueue: '++id, saleId, shopId, status, createdAt',
      cachedProducts: 'id, shopId, cachedAt',
    });
  }
}

export const db = new TillRwandaDB();

/**
 * Initialize database (creates tables if needed)
 */
export async function initializeOfflineDB(): Promise<void> {
  try {
    await db.open();
    console.log('Offline database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize offline database:', error);
  }
}

/**
 * Check if IndexedDB is available
 */
export function isOfflineDBAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.indexedDB;
  } catch {
    return false;
  }
}

/**
 * Get database stats
 */
export async function getDBStats() {
  const pendingSales = await db.offlineSales.where('status').equals('pending').toArray();
  const failedSales = await db.offlineSales.where('status').equals('failed').toArray();
  const syncQueueCount = await db.syncQueue.where('status').notEqual('synced').count();
  const cartItems = await db.offlineCart.toArray();

  return {
    pendingSales: pendingSales.length,
    failedSales: failedSales.length,
    syncQueueCount,
    cartItems: cartItems.length,
  };
}

/**
 * Clear all offline data (use with caution)
 */
export async function clearOfflineDB(): Promise<void> {
  try {
    await db.offlineSales.clear();
    await db.offlineCart.clear();
    await db.syncQueue.clear();
    await db.cachedProducts.clear();
    console.log('Offline database cleared');
  } catch (error) {
    console.error('Failed to clear offline database:', error);
  }
}
