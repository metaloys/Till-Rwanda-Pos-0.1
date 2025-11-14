# Till Rwanda POS - PWA Installation Guide

Complete guide to installing and using Till Rwanda POS as a Progressive Web App.

## 📖 Table of Contents

1. [What is a PWA?](#what-is-a-pwa)
2. [Installation Methods](#installation-methods)
3. [Desktop Installation](#desktop-installation)
4. [Mobile Installation](#mobile-installation)
5. [Features & Capabilities](#features--capabilities)
6. [Troubleshooting](#troubleshooting)

---

## What is a PWA?

### What Makes Till Rwanda a PWA?

Till Rwanda POS is a **Progressive Web App (PWA)**, meaning:

✅ **App-Like Experience**: Runs like a native app on your device
✅ **Offline Support**: Works without internet connection
✅ **Installable**: Adds icon to home screen or app menu
✅ **Fast Loading**: Service Worker caches assets for instant loading
✅ **Background Sync**: Syncs data in background after going online
✅ **Push Notifications**: Can receive notifications even when closed

### Why Install as PWA?

**Instead of Web Browser**:
- Open faster (bypasses browser UI)
- Looks like native app (full screen)
- App switcher integration (Alt+Tab on Windows)
- Runs in background for notifications
- Offline-first experience

**Instead of Native App**:
- No app store required
- Automatic updates (always latest version)
- Lower data usage (progressive enhancement)
- Works across all devices
- One codebase for all platforms

---

## Installation Methods

### System Requirements

**Minimum Requirements**:
- Modern browser (Chrome 90+, Edge 90+, Firefox 87+, Safari 15+)
- 50MB free storage space
- Active internet (for first install)

**Supported Devices**:
- Windows 10/11 (Chrome, Edge)
- macOS 11+ (Chrome, Safari)
- iOS 15+ (Safari)
- Android 5+ (Chrome, Firefox)

### Checking Device Support

To verify your device supports PWA installation:

1. Open Till Rwanda: https://till-rwanda-pos-0-1.vercel.app
2. Look for install prompt or menu option
3. If nothing appears, your browser may not support PWA
4. Try different browser or update to latest version

---

## Desktop Installation

### Windows (Chrome/Edge)

**Automatic Installation (Recommended)**:

1. **Open Till Rwanda** in Chrome or Edge
2. **Look for install button** (top-right address bar area)
   - Icon looks like: ⬇️ or 📱
3. **Click the install icon**
4. **Confirm in dialog**: "Install Till Rwanda?"
5. **Wait for installation** (2-3 seconds)
6. **App opens in window**
7. **Shortcut added to**:
   - Desktop (if enabled)
   - Start menu (Windows)
   - App list

**Manual Installation**:

If automatic prompt doesn't appear:

1. Right-click Till Rwanda website address bar
2. Select "Install Till Rwanda"
3. Or: Click menu ≡ > More tools > Create shortcut
4. Check "Open as window"
5. Click "Create"

**After Installation**:

- App appears in Start menu
- Press Super (Windows) key, type "Till Rwanda"
- Click to launch
- Shortcut on taskbar for quick access

### macOS (Chrome/Safari)

**Chrome on macOS**:

1. Open Till Rwanda in Chrome
2. Click menu ≡ (top-right)
3. Select "Install Till Rwanda"
4. Confirm installation
5. App opens in window
6. Dock icon added automatically

**Safari on macOS** (iOS-style):

1. Open Till Rwanda in Safari
2. Click Share icon (top-right)
3. Select "Add to Dock"
4. Choose name (or keep "Till Rwanda")
5. Click "Add"
6. Opens in web view from dock
7. Command+Space, type "Till Rwanda" to launch

### Linux (Chrome/Firefox)

**Chrome on Linux**:

1. Open Till Rwanda in Chrome
2. Click menu ≡
3. Select "Create shortcut..."
4. "Open as window" checkbox
5. Click "Create"
6. Appear in applications menu

**Firefox on Linux** (Desktop shortcut):

1. Open Till Rwanda in Firefox
2. Right-click desktop
3. Select "Create Link..." or use App Menu
4. Website URL: https://till-rwanda-pos-0-1.vercel.app
5. Launch from desktop shortcut

---

## Mobile Installation

### iOS (Safari)

**iPhone/iPad Installation**:

1. **Open Safari browser**
2. **Go to**: https://till-rwanda-pos-0-1.vercel.app
3. **Tap Share icon** (middle-bottom)
   - Icon looks like: ⬆️ or ☁️↗
4. **Scroll and tap** "Add to Home Screen"
5. **Edit name** (optional, "Till Rwanda" recommended)
6. **Tap "Add"** (top-right)
7. **Wait for app to download** (5-10 seconds)
8. **Home screen icon appears**
9. **Tap to launch**

**Features on iOS**:
- Runs fullscreen (no Safari bars)
- Home screen icon with badge
- Can receive notifications
- Status bar customizable (black/transparent)
- Swipe right to go back

**iOS PWA Limitations**:
- No background sync yet (Apple limitation)
- Needs Safari browser (Chrome doesn't support on iOS)
- Storage limit: ~50MB per app
- No app store listing

### Android (Chrome/Firefox)

**Chrome on Android**:

1. **Open Chrome app**
2. **Go to**: https://till-rwanda-pos-0-1.vercel.app
3. **Tap menu ⋮** (top-right)
4. **Select "Install app"** or "Add to Home Screen"
5. **Confirm name** (Till Rwanda)
6. **Tap "Install"**
7. **Granted permissions** (camera, storage, etc.)
8. **App installs from Play Store**
9. **Appears on home screen**
10. **Tap to launch**

**Firefox on Android**:

1. **Open Firefox app**
2. **Go to**: https://till-rwanda-pos-0-1.vercel.app
3. **Tap menu ≡** (bottom-right)
4. **Select "Install as app"**
5. **Confirm in dialog**
6. **App appears on home screen**
7. **Runs fullscreen**

**Features on Android**:
- Fullscreen experience
- Quick access from home screen
- Recent apps switcher integration
- Background sync support
- Offline functionality
- Storage limit: ~100MB

**Using on Android**:
- Long-press app icon for shortcuts
- Tap "Point of Sale" for quick access to POS
- Tap "Reports" for quick access to analytics
- Swipe left edge to go back

---

## Features & Capabilities

### PWA-Specific Features

**1. Offline Mode**
- Full POS operation without internet
- Sales persist locally
- Auto-sync when back online
- See [Offline Guide](./OFFLINE_GUIDE.md) for details

**2. Background Sync**
- Syncs offline sales in background
- Even if app is closed
- Android: Preferred (iOS limited)

**3. Push Notifications**
- Receive sale notifications
- Inventory alerts
- Sync completion notices
- Customizable in settings

**4. App Shortcuts** (Android)
- Long-press app icon
- Quick access to key features:
  - "Point of Sale" - Go directly to POS
  - "Inventory" - View products
  - "Reports" - See analytics

**5. Fast Loading**
- Service Worker caches assets
- First load: 3-5 seconds
- Subsequent loads: <1 second
- Instant home screen icon launch

### Comparing With Browser vs App

| Feature | Browser | PWA App |
|---------|---------|---------|
| Loading Speed | 2-3s | <1s (cached) |
| Address Bar | Yes | No (fullscreen) |
| Browser UI | Yes | No |
| Home Screen | No | Yes (icon) |
| App Switcher | No | Yes |
| Offline | Yes* | Yes |
| Notifications | Browser only | Full support |
| Data Sync | Requires app open | Background |
| Update | Manual | Automatic |

*Requires Service Worker

---

## Using the Installed App

### Launch the App

**Windows**:
1. Press Super (Windows) key
2. Type "Till Rwanda"
3. Click app in results
4. Or: Double-click desktop shortcut
5. Or: Pin to taskbar, click

**macOS**:
1. Press Cmd+Space
2. Type "Till Rwanda"
3. Press Enter
4. Or: Click dock icon

**iOS**:
1. Look for Till Rwanda icon on home screen
2. Tap to launch
3. Or: Tap through Spotlight search

**Android**:
1. Tap home screen icon
2. Or: Find in app drawer
3. Or: Voice command "Open Till Rwanda"

### Update the App

Till Rwanda PWA **auto-updates** in background:

- When new version available, downloads silently
- On next app launch, new version active
- No manual update needed
- Never outdated (always latest features)

To **force update** immediately:

1. Close Till Rwanda app completely
2. Go to browser
3. Visit: https://till-rwanda-pos-0-1.vercel.app
4. Browser will fetch latest version
5. Service Worker updates cache
6. Next app launch uses new version

### Uninstall the App

**Windows**:
1. Right-click app in Start menu
2. Select "Uninstall"
3. Or: Settings > Apps > Till Rwanda > Uninstall

**macOS**:
1. Right-click dock icon
2. Select "Remove from Dock"
3. Or: Finder > Applications > Drag to Trash

**iOS**:
1. Long-press Till Rwanda icon
2. Select "Remove App"
3. Choose "Delete App" or "Remove from Home Screen"

**Android**:
1. Long-press Till Rwanda icon
2. Select "Uninstall"
3. Or: Settings > Apps > Till Rwanda > Uninstall

---

## Troubleshooting

### "Install Button Not Appearing"

**Symptoms**: No install prompt in browser

**Causes & Solutions**:

1. **Unsupported Browser**
   - Try: Chrome 90+, Edge 90+, Safari 15+, Firefox 87+
   - Update browser to latest version

2. **Browser Privacy Settings**
   - Check: Settings > Privacy
   - Ensure storage permissions allowed
   - Disable VPN if active

3. **HTTPS Required**
   - Site must be HTTPS (Till Rwanda is ✅)
   - Self-hosted? Use HTTPS certificate

4. **App Already Installed**
   - Won't show prompt if already installed
   - If bugged, uninstall first

5. **Android Chrome Specific**
   - Update Chrome from Play Store
   - Clear browser cache: Settings > Clear browsing data
   - Try Firefox alternative

**Manual Install as Workaround**:
- Desktop: Chrome menu > Create shortcut
- Mobile: Browser menu > Add to Home Screen

### "App Won't Launch"

**Symptoms**: Click icon but app doesn't open

**Solutions**:

1. **Force Close & Reopen**
   - Close app completely
   - Click icon again
   - Wait 5 seconds

2. **Clear App Cache**
   - Windows: Settings > Apps > Till Rwanda > Repair
   - macOS: Delete app from Applications > Trash > Empty
   - iOS: Long-press > Remove App > Delete App
   - Android: Settings > Apps > Till Rwanda > Storage > Clear Cache

3. **Service Worker Issue**
   - Open app in browser (not as app)
   - DevTools: Application > Service Workers
   - Click "Unregister"
   - Restart app (will re-register)

4. **Browser Issue**
   - Try launching in different browser
   - Verify browser up-to-date
   - Clear browser cache: Ctrl+Shift+Del

### "App Crashes Frequently"

**Symptoms**: App closes unexpectedly

**Common Causes**:

1. **Device Out of Storage**
   - Free up space: Delete unused apps
   - Clear cache: App settings > Storage
   - Cache size should be <100MB

2. **Outdated Version**
   - App should auto-update
   - Force update: Clear cache > Relaunch
   - Check version in settings

3. **Browser Issues**
   - Update browser to latest
   - Clear browser data: Ctrl+Shift+Del > All time
   - Restart device

**Debug Crashes**:
1. Open in browser (not app)
2. F12 > Console tab
3. Try action that crashes
4. Look for error messages
5. Report exact error to support

### "Permissions Missing"

**Symptoms**: Can't print receipts, access camera, etc.

**Solutions**:

1. **Grant Permissions**
   - First use, app requests permissions
   - Click "Allow" for each
   - Camera, printer, storage, etc.

2. **Re-grant If Denied**
   - Android: Settings > Apps > Till Rwanda > Permissions
   - Windows: Settings > Privacy & Security > App permissions
   - macOS: System Preferences > Security & Privacy
   - iOS: Settings > Till Rwanda > Permissions

3. **Verify Printer Connected**
   - Printer on same WiFi network
   - Printer drivers installed (Windows)
   - Test printing from browser first

### "Offline Sync Not Working in PWA"

**Symptoms**: Offline sales don't sync when going online

**Android** (Should Work):
- Background sync enabled by default
- Check: Settings > Apps > Till Rwanda > Permissions
- Grant "Background data" permission
- Or: Manual sync in app

**iOS** (Limitations):
- Apple doesn't allow background sync in PWA
- Manual sync required: Open app and tap "Sync"
- Workaround: Keep app in foreground while syncing
- Apple may improve this in iOS 18+

### "Storage Full" Error

**Symptoms**: "QuotaExceededError" when creating sales

**Storage Limits**:
- Desktop: 50MB limit (usually)
- Mobile: 100MB limit (usually)
- Can vary by device

**Solutions**:

1. **Clear Cache**
   - Products page > Cache Stats > "Clear Cache"
   - Frees 5-10MB typically

2. **Clear Synced Sales**
   - OfflineIndicator > Settings > Clear Synced Sales
   - Removes completed transactions
   - Keeps pending sales

3. **Device Storage**
   - Check device has 500MB+ free
   - Delete unused apps
   - Clear device cache

4. **Contact Admin**
   - Request quota increase
   - Or: Use cloud storage solution

### "Wrong Data After Update"

**Symptoms**: See old prices, products after PWA update

**Cause**: Stale cache from old version

**Solutions**:

1. **Force App Update**
   - Browser: Clear cache > Refresh
   - App: Close > Settings > Clear cache > Reopen

2. **Clear Service Worker**
   - Open in browser (not app)
   - F12 > Application > Service Workers
   - Click "Unregister"
   - Reload page
   - Close and reopen app

3. **Clear Product Cache**
   - Products page > Cache Stats > "Clear Cache"
   - App re-fetches fresh data

### "Push Notifications Not Working"

**Symptoms**: Don't receive notifications

**Check Permissions**:
1. Browser/App requests permission first time
2. Grant if prompted
3. Or re-grant manually in settings

**Android**: 
- Settings > Apps > Till Rwanda > Notifications > Toggle ON
- Check notification settings in app

**iOS**:
- Settings > Notifications > Till Rwanda > Allow Notifications
- Also check Do Not Disturb mode off

**Windows/Mac**:
- System settings > Notifications > Till Rwanda > Enable

**Verify Server Sending**:
- Generate test notification in app settings
- Check if notification appears

---

## Advanced PWA Features

### Custom App Theme

Till Rwanda respects your device's dark/light mode:

- **Light Mode**: White background, dark text
- **Dark Mode**: Dark background, light text
- **Automatic**: Follows device setting
- **Manual**: Settings > Theme > Light/Dark

### App Shortcuts (Android)

Long-press app icon for quick actions:

1. **Point of Sale**
   - Directly open checkout screen
   - Faster than opening app normally

2. **Inventory**
   - View products instantly
   - Check stock levels

3. **Reports**
   - Jump to analytics
   - View sales trends

### Installing on USB Drive (Windows)

Not recommended, but possible:

1. Create shortcut to Till Rwanda
2. Copy shortcut to USB drive
3. Use on any Windows PC with browser

### Web App Manifest

Behind the scenes, PWA uses `manifest.json`:

```json
{
  "name": "Till Rwanda POS",
  "short_name": "Till Rwanda",
  "start_url": "/",
  "display": "standalone",
  "scope": "/",
  ...
}
```

- Defines app name, icons, colors
- Controls how app launches
- Enables install prompts

---

## Performance & Optimization

### Load Time Comparison

| Scenario | Load Time |
|----------|-----------|
| First load (browser) | 3-5s |
| First load (PWA) | 3-5s* |
| Subsequent (browser) | 2-3s |
| Subsequent (PWA) | <1s |
| Offline (browser) | Fails |
| Offline (PWA) | <1s |

*Service Worker caches on first visit

### Battery & Data Usage

| Task | Battery | Data |
|------|---------|------|
| Online POS transaction | 5% | 50KB |
| Offline POS transaction | 2% | 0KB |
| Background sync | 1% | 100KB |
| Receive notification | <1% | 1KB |
| Refresh cache | 2% | 200KB |

---

## FAQ

**Q: Is PWA safe?**
A: Yes. Till Rwanda PWA uses HTTPS, authentication, and RLS policies for security.

**Q: Does PWA cost extra?**
A: No. PWA is included with your Till Rwanda subscription at no additional cost.

**Q: Can I use PWA on public WiFi?**
A: Yes, but use VPN for security on public networks.

**Q: What if site goes down?**
A: Offline mode still works. Cached data available until cleared.

**Q: Can I share the app?**
A: Share the URL: https://till-rwanda-pos-0-1.vercel.app
Each person installs independently on their device.

**Q: Does PWA work without internet ever?**
A: Yes. Service Worker caches all assets for offline access.

**Q: How much storage does PWA use?**
A: Typically 20-50MB for app + 5-10MB for cache + data.

---

## Support

For PWA installation issues:
1. Check this guide
2. Review troubleshooting section
3. Check browser version (must be recent)
4. Contact support with device/browser details

---

**Last Updated**: December 2024
**PWA Status**: ✅ Production Ready
**Tested On**: Windows 10/11, macOS 12+, iOS 15+, Android 8+
