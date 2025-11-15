# Super Admin Role Toggle - Quick Test Guide

## ✅ Implementation Complete

The in-app role toggle feature is now live and committed to git.

## How It Works

### Before: Database-dependent toggle
```
Super Admin → Database → Toggle is_super_admin flag → Logout → Login → See different view
```

### Now: Client-side instant toggle
```
Super Admin → App sidebar button → Click toggle → Instant view switch ✨
```

## Testing Checklist

### 1. Login Flow
- [ ] Login as super admin user
- [ ] Verify "PLATFORM ADMIN | [Full Name]" appears below shop name
- [ ] Verify Purple button "👤 Switch to User View" appears in sidebar
- [ ] Verify app loads to Platform Admin Dashboard

### 2. Switch to User View
- [ ] Click Purple button "Switch to User View"
- [ ] Verify button changes to Indigo
- [ ] Verify text changes to "🔐 Switch to Admin View"
- [ ] Verify Platform Dashboard disappears from sidebar menu
- [ ] Verify "Shop Overview" now shows as primary menu item
- [ ] Current page should switch to Overview automatically
- [ ] Sidebar shows only regular user menu items

### 3. User View Functionality
- [ ] Navigate to different pages (Overview, Sales, Reports, etc.)
- [ ] Verify you see only single shop data
- [ ] Verify product and sales data is accessible
- [ ] Verify metrics and reports show correct data
- [ ] Verify no other shops are visible

### 4. Switch Back to Admin View
- [ ] Click Indigo button "Switch to Admin View"
- [ ] Verify button changes back to Purple
- [ ] Verify Platform Dashboard reappears
- [ ] Verify you can navigate to Platform Admin Dashboard
- [ ] Verify all shops are visible again

### 5. Data Integrity
- [ ] Toggle back and forth multiple times
- [ ] Verify data remains consistent
- [ ] Verify no API errors in console
- [ ] Verify notifications still work
- [ ] Verify database not modified (check is_super_admin flag remains true)

### 6. Edge Cases
- [ ] Close and reopen sidebar (mobile) - button should persist state
- [ ] Refresh page - should remember current view
- [ ] Check browser console for errors
- [ ] Verify theme toggle still works with role toggle active

## Expected Behavior

| Action | Before | After |
|--------|--------|-------|
| Page Load | Shows Admin Dashboard | Shows Admin Dashboard |
| Click Toggle → User View | N/A (Requires DB change) | Shows Overview, Platform Dashboard hidden |
| Click Toggle → Admin View | N/A (Requires DB change) | Shows Admin Dashboard, full menu |
| Refresh Page | Would see old toggle state | Preserves current toggle state |
| Multiple Toggles | Each requires logout | Instant switching, no logout |

## Debugging Info

### State Location
- **Component:** `src/App.tsx`
- **Variable:** `viewAs` (useState)
- **Values:** 'admin' | 'user'
- **Initial:** 'admin'

### Effective Profile Creation
```typescript
// src/Dashboard.tsx line 32-36
const effectiveProfile = viewAs === 'user' && profile.is_super_admin
  ? { ...profile, is_super_admin: false }
  : profile;
```

### What Changes
- `isSuperAdmin` variable (derived from effectiveProfile)
- Menu visibility (Platform Dashboard only shows when isSuperAdmin)
- Initial page (admin_dashboard when admin, overview when user)
- Page props passed to child components

### What Doesn't Change
- Database `is_super_admin` flag (still true)
- User authentication state (still logged in)
- Shop data and access (RLS still controls access)
- Session duration

## If Something Goes Wrong

### Button not showing
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check user is_super_admin flag is true in database

### Toggle not working
- Check browser console for errors
- Verify network tab shows no failed requests
- Check if currentPage state is updating (add console log)

### Pages not switching
- Verify effectiveProfile is being used
- Check useEffect dependencies
- Look for stale closures in component render

### Data showing wrong shop
- Check RLS policies are correct
- Verify shop_id in effectiveProfile
- Check pageProps is using effectiveProfile

## Success Indicators

✅ **Feature is working correctly if:**
- Button appears and changes color when clicked
- Menu items appear/disappear based on toggle state
- No console errors
- Page content updates correctly
- Data access is appropriate to current view
- You can toggle multiple times without issues
- Page refresh preserves current toggle state

## Next Steps

Once verified working:
1. Document any issues found
2. Test with multi-store setup (when implemented)
3. Consider storing toggle preference in localStorage
4. Test on mobile responsive view
5. Plan multi-store shop switcher feature
