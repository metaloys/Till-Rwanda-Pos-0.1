# Till Rwanda POS - Offline Guide

Complete guide to using Till Rwanda POS in offline mode and managing offline data.

## 📖 Table of Contents

1. [Understanding Offline Mode](#understanding-offline-mode)
2. [Using Offline Features](#using-offline-features)
3. [Offline Sales Workflow](#offline-sales-workflow)
4. [Sync Management](#sync-management)
5. [Product Caching](#product-caching)
6. [Troubleshooting](#troubleshooting)

---

## Understanding Offline Mode

### How Offline Works

Till Rwanda POS is designed with **complete offline-first architecture**:

- **IndexedDB Storage**: All offline sales saved locally using Dexie.js (IndexedDB wrapper)
- **Service Worker**: Background worker handles offline detection and asset caching
- **Automatic Sync**: When internet returns, app automatically syncs data with server
- **No Data Loss**: Sales created offline persist locally until synced

### What Works Offline

✅ **Fully Functional Offline**:
- Create sales and transactions
- Add/remove products from cart
- Apply discounts
- Record payments (cash, mobile money)
- Print receipts
- View cached products
- View recent transactions (from cache)

⚠️ **Limited Offline**:
- Customer credit lookup (uses cached customer data)
- Staff management (view only, no changes)
- Reports (historical data only)

❌ **Requires Internet**:
- Creating new customers
- Modifying products
- Stock adjustments
- Staff management changes

### Offline Indicators

The app displays offline status in multiple places:

**1. OfflineIndicator Banner** (Bottom-right of screen)
- Shows when you're offline
- Displays pending/failed sales count
- Shows sync progress
- Provides manual sync button

**2. Network Status Badge** (Top of POS screen)
- Green dot: Online
- Red dot: Offline
- Yellow dot: Syncing

**3. Toast Notifications**
- "You are offline - changes saved locally"
- "Syncing offline sales..."
- "Sync complete - X sales uploaded"

---

## Using Offline Features

### Detecting Offline Mode

The app automatically detects network status:

1. **Automatic Detection**: Watches for network connectivity changes
2. **Visual Feedback**: OfflineIndicator shows current status
3. **Real-Time Updates**: Status updates instantly when network changes

### Manual Connectivity Test

To manually test connection:

1. Open DevTools (F12)
2. Go to Network tab
3. Set throttling to "Offline"
4. App will immediately show offline mode
5. Set back to "Online" to simulate reconnection

### Checking Offline Status

To verify offline mode is active:

1. Look for **red offline banner** (bottom-right)
2. Network badge should show **red indicator**
3. OfflineIndicator shows "You are offline"
4. Toast messages confirm offline status

---

## Offline Sales Workflow

### Creating an Offline Sale

**Step 1: Verify You're Offline**
- Check OfflineIndicator shows offline status
- Or intentionally disconnect WiFi/mobile data

**Step 2: Create Sale Normally**
- Scan/add products to cart
- Enter quantities
- Select customer (optional)
- Apply discounts if needed

**Step 3: Process Payment**
- Click "Complete Sale"
- Select payment method
- Enter amount if different from total
- Click "Confirm"

**Step 4: Receipt Generation**
- Receipt generates and displays
- ✅ Toast shows: "Sale saved offline. Will sync when back online."
- Sale is now persisted in IndexedDB

**Step 5: Manual Sync (Optional)**
- When back online, click "Sync Now" button (OfflineIndicator)
- Or wait for automatic sync (happens after 10 seconds online)
- Monitor sync progress in banner

### Receipt During Offline

When offline, receipts include:

```
═══════════════════════════════
    TILL RWANDA POS - OFFLINE
═══════════════════════════════

[Normal receipt details]

⚠️  OFFLINE MODE
This sale will sync when online
Status: Pending (ID: xyz123)

═══════════════════════════════
```

### Viewing Offline Sales

To view sales created offline:

1. Go to **Sales History** page
2. Filter by date (sales created today)
3. Look for **status badge: "Offline"**
4. Once synced, badge changes to **"Completed"**

---

## Sync Management

### How Sync Works

**Automatic Sync Process**:
1. App detects internet connection restored
2. Waits 10 seconds to ensure stable connection
3. Fetches all offline sales from IndexedDB
4. Sends to Supabase `complete-sale` Edge Function
5. Decrements stock in database
6. Marks sales as synced locally
7. Shows sync progress in OfflineIndicator

**Sync Timeline**:
- Offline sale created: 0 seconds
- Connection restored: ~0 seconds (auto-detected)
- Sync begins: ~10 seconds (wait for stable connection)
- Sync completes: 1-30 seconds (depends on data size)

### Manual Sync

To manually trigger sync:

1. Ensure you're back **online**
2. Open OfflineIndicator (bottom-right)
3. Click **"Sync Now"** button
4. Monitor progress:
   - 🔄 "Syncing X pending sales..."
   - ✅ "X sales synced successfully"

### Monitoring Sync Status

OfflineIndicator shows:

```
Pending: 3 sales
Failed: 0 sales
Last sync: 2 minutes ago

[Sync Now Button]
```

- **Pending**: Sales waiting to sync
- **Failed**: Sales that failed to sync
- **Last Sync**: When last successful sync occurred

### Handling Sync Failures

If sales fail to sync:

1. **Automatic Retry**: App retries with exponential backoff
2. **Retry Count**: Shows in OfflineIndicator
3. **Max Retries**: After 5 attempts, marked as failed
4. **Manual Retry**: Click any failed sale > "Retry Sync"

**Why Sync Fails**:
- Network connection dropped mid-sync
- Supabase server temporarily unavailable
- RLS policies rejecting data (permission issue)
- Invalid product stock (product deleted)

**To Fix**:
1. Check network connection
2. Verify Supabase is accessible
3. Check RLS policies are deployed
4. Click "Sync Now" to retry
5. Contact support if still failing

### Clear Offline Sales

To clear successfully synced sales from IndexedDB:

1. Open OfflineIndicator
2. Click "Settings" gear icon
3. Select "Clear Synced Sales"
4. Confirm deletion
5. Only synced sales deleted; pending sales preserved

---

## Product Caching

### How Caching Works

**24-Hour Cache Strategy**:
- Products cached automatically on successful fetch
- Cache expires after 24 hours
- App automatically refreshes cache when online
- If fetch fails, uses cached version instead

### Viewing Cache Status

To check cache status:

1. Go to **Products** page
2. Look for **"Cache Stats"** card (top-right)
3. Shows:
   - Cache contains: X products
   - Last updated: X hours ago
   - Cache status: Fresh / Stale / Warning

### Cache Warning

If cache is stale (>24 hours old):

```
⚠️  SHOWING CACHED PRODUCTS
Last updated 25 hours ago
Click refresh to get latest version
```

### Manual Cache Refresh

To refresh products from server:

1. Products page > Cache Stats card
2. Click **"Refresh Cache"** button
3. Shows loading state (3-5 seconds)
4. ✅ "Products updated successfully"
5. Cache timestamp updated

### Cache Fallback

How cache fallback works:

**Online**: Always fetches fresh data from server
**Error During Fetch**: Falls back to cached products
**Old Data**: Automatically refreshes after 24 hours
**No Cache**: Shows loading spinner, then products

### Cache Storage Details

Cache stored in IndexedDB with:
- Product ID
- Product data (name, price, variants)
- Timestamp (creation time)
- TTL (24 hours)

Max size: ~30 products in cache (auto-pruned if exceeded)

### Clearing Cache

To manually clear cache:

1. Products page > Cache Stats
2. Click **"Clear Cache"** button
3. Confirm in dialog
4. App re-fetches fresh products
5. New cache created

---

## Troubleshooting

### "Sales Not Syncing"

**Symptoms**: Offline sales stay pending after hours online

**Solutions**:
1. Check OfflineIndicator shows online status
2. Try manual sync: Click "Sync Now" button
3. Check browser console for errors (F12 > Console)
4. Verify Supabase connection
5. Check RLS policies deployed (ask admin)

**If Still Failing**:
1. Clear browser cache: Ctrl+Shift+Del > All Time > Clear
2. Reload app: F5
3. Try sync again
4. Check network tab (F12 > Network) for failed requests

### "Offline Mode Not Working"

**Symptoms**: Sales not saved when offline

**Solutions**:
1. Check Service Worker is registered:
   - F12 > Application > Service Workers
   - Should show "Till Rwanda" worker as "Active"
2. Check IndexedDB enabled:
   - F12 > Application > Storage > IndexedDB
   - Should see "till_rwanda" database
3. Check browser privacy settings not blocking storage:
   - Settings > Privacy > Allow storage

**Reset Service Worker**:
1. F12 > Application > Service Workers
2. Click "Unregister" on Till Rwanda worker
3. Reload page (F5)
4. New Service Worker auto-registers

### "Sync Failing Repeatedly"

**Symptoms**: Same sales fail multiple sync attempts

**Solutions**:
1. **Network Issue**: Check internet speed/stability
2. **Supabase Down**: Check Supabase status page
3. **RLS Denied**: Check user has permission for this shop
4. **Stock Issue**: Product may have been deleted/modified

**Check Logs**:
1. F12 > Console tab
2. Look for error messages like:
   - "RLS policy error"
   - "Product not found"
   - "Network timeout"
3. Report exact error to support

### "Cache Not Updating"

**Symptoms**: Products show old prices/info

**Solutions**:
1. Verify you're online (check OfflineIndicator)
2. Wait 30 seconds for auto-refresh
3. Manually refresh: Cache Stats > "Refresh Cache" button
4. Restart browser: Close and reopen Till Rwanda
5. Clear cache: Cache Stats > "Clear Cache" button

### "App Won't Go Offline"

**Symptoms**: Always shows online even without internet

**Solutions**:
1. Check network settings not using VPN
2. Disable browser extensions (may block offline)
3. Try Airplane Mode: Works on mobile + desktop
4. Clear browser cache and restart

### "IndexedDB Quota Exceeded"

**Symptoms**: Error when creating sales: "QuotaExceededError"

**Solutions**:
1. Clear app cache: Cache Stats > "Clear Cache"
2. Clear synced sales: OfflineIndicator > Settings
3. Clear browser data: Ctrl+Shift+Del > Clear
4. Reduce product cache size (admin setting)
5. Contact support for larger quota

### Service Worker Issues

**Service Worker not registering**:
1. Check DevTools: F12 > Application > Service Workers
2. Look for errors in red
3. Common causes:
   - Old cache still active
   - Browser privacy settings
   - Extension blocking

**To Fix**:
1. Unregister existing worker
2. Clear all cache: Ctrl+Shift+Del
3. Restart browser
4. Reload page

---

## Advanced Offline Features

### Retry Logic

Offline sync uses exponential backoff retry:

```
Attempt 1: Immediate
Attempt 2: Wait 2 seconds
Attempt 3: Wait 4 seconds
Attempt 4: Wait 8 seconds
Attempt 5: Wait 16 seconds
Max: 5 attempts, then fails
```

### Queue Management

Offline sales queue managed by:

```
├── In Progress: Currently syncing
├── Pending: Waiting to sync
├── Synced: Successfully uploaded
└── Failed: Exceeded retry limit
```

### Data Validation

Before offline save, app validates:
- ✅ Sale total > 0
- ✅ At least 1 item
- ✅ Payment method selected
- ✅ Valid customer (if selected)
- ✅ Shop ID available

---

## Best Practices

### Regular Syncing
- Check OfflineIndicator after going online
- Click "Sync Now" if sales still pending
- Don't close app until sync completes

### Product Updates
- Refresh cache daily for latest products
- Check Cache Stats for last update time
- Use "Refresh Cache" if prices changed

### Error Handling
- Don't ignore OfflineIndicator errors
- Sync failures need investigation
- Contact admin if persistent failures

### Network Management
- Keep mobile data/WiFi on when possible
- Monitor battery (offline uses less power)
- Restart router if connection unstable

---

## Offline vs Online Performance

### Offline Performance
- **POS Response**: Instant (local storage)
- **Sync Time**: 1-5 seconds per 10 sales
- **Battery Usage**: Lower (no network requests)
- **Data Usage**: Zero during offline

### Online Performance  
- **POS Response**: 0.5-2 seconds (server query)
- **Sync Time**: N/A (real-time sync)
- **Battery Usage**: Higher (continuous network)
- **Data Usage**: ~50KB per sale

---

## FAQ

**Q: Do I need internet to start the app?**
A: No. App works fully offline. Service Worker enables offline access.

**Q: How long do sales stay in local storage?**
A: Until synced (forever if never online). Synced sales auto-clear after 24 hours.

**Q: Can I manually manage offline data?**
A: DevTools > Application > IndexedDB > till_rwanda. (Advanced users only)

**Q: What if phone runs out of storage?**
A: Cache auto-purges oldest products. Clear cache if needed.

**Q: Is offline data encrypted?**
A: IndexedDB encrypted by browser. Additional encryption available (contact admin).

**Q: Can multiple devices sync the same sale?**
A: Each device keeps separate offline queue. Sync independently.

---

## Support

For offline-related issues:
- Check this guide for solutions
- Review troubleshooting section
- Check browser console for errors
- Contact support with error logs

---

**Last Updated**: December 2024
**Offline Status**: ✅ Production Ready
**Tested On**: Chrome, Firefox, Safari, Edge
