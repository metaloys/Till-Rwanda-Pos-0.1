# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

# Till Rwanda POS - Point of Sale System

A complete, offline-capable Point of Sale system designed specifically for retail shops in Rwanda. Built with React, TypeScript, Vite, and Supabase.

## 🚀 Features

### Core POS Functionality
- **Point of Sale Terminal** - Fast, intuitive checkout interface
- **Product Management** - Organize inventory with variants and categories
- **Sales History** - Comprehensive transaction tracking and audit logs
- **Inventory Management** - Real-time stock tracking with alerts
- **Customer Management** - Store customer info, track purchase history
- **Receipt Printing** - Thermal printer integration for receipts

### Financial Features
- **Credit Management** - Issue and track customer credit with aging reports
- **Expense Tracking** - Record and categorize business expenses
- **Advanced Reporting** - Daily/weekly/monthly sales reports, staff performance, profit/loss analysis
- **Multi-Payment Methods** - Cash, mobile money (Twilio integration), card support

### Security & Multi-Tenancy
- **Row Level Security (RLS)** - Database-enforced multi-tenant data isolation
- **Role-Based Access** - Super admin, shop owner, and staff roles
- **Subscription Management** - Trial and paid plans with automatic enforcement
- **Staff Management** - Create staff accounts with role-specific permissions

### Offline & Resilience
- **Complete Offline Support** - Full POS operation without internet connection
- **Automatic Sync** - Background synchronization when connection restored
- **Product Caching** - 24-hour automatic product cache with smart fallback
- **Persistent Storage** - IndexedDB-based offline sales capture (Dexie.js)

### Analytics & Insights
- **Interactive Dashboards** - Real-time sales trends and performance metrics
- **Top Products Chart** - Best-selling items analysis
- **Payment Method Breakdown** - Revenue by payment type visualization
- **Profit Margin Analysis** - Net profit, expenses, and margin calculations
- **Staff Performance Metrics** - Individual staff member sales tracking

### Mobile & PWA
- **Responsive Design** - Optimized for mobile, tablet, and desktop screens
- **Progressive Web App (PWA)** - Install as native app on mobile devices
- **Service Worker** - Offline asset caching and background sync
- **App Shortcuts** - Quick access to POS, inventory, and reports

### User Experience
- **Dark Mode** - Complete dark theme support across the app
- **Real-Time Notifications** - Toast notifications for all major actions
- **Keyboard Shortcuts** - Power user shortcuts for common POS actions
- **Responsive Layout** - Mobile-first design with tab-based switcher

## 🛠️ Tech Stack

- **Frontend**: React 19.1.1, TypeScript 5.9.3, Vite 7.1.7
- **Styling**: Tailwind CSS 4.1.15
- **Backend**: Supabase (PostgreSQL + Auth)
- **Offline Storage**: Dexie.js (IndexedDB wrapper)
- **Analytics**: Recharts
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 16+ (tested with 18.x)
- npm 9+ or yarn
- Supabase account (free tier available)
- Modern web browser with service worker support

## ⚙️ Installation

### 1. Clone Repository
```bash
git clone https://github.com/metaloys/Till-Rwanda-Pos-0.1.git
cd Till-Rwanda-Pos-0.1
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Supabase
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from:
- Dashboard: https://app.supabase.com
- Project Settings > API > Project URL and anon key

### 4. Set Up Database Schema
1. Go to Supabase Dashboard > SQL Editor
2. Run the migration scripts in `supabase/migrations/`
3. Deploy RLS policies: Copy content of `supabase/rls_policies.sql` and execute in SQL Editor

### 5. Configure Edge Functions
Till Rwanda uses Supabase Edge Functions for stock decrement on sale completion:
- Deploy: `npx supabase functions deploy complete-sale`
- Deploy: `npx supabase functions deploy invite-staff`
- Deploy: `npx supabase functions deploy send-reminder`

### 6. Run Development Server
```bash
npm run dev
```

Visit: `http://localhost:5173`

## 📱 PWA Installation

### Web Browser (Desktop)
1. Open the app in Chrome/Edge
2. Click "Install" in the browser menu
3. Choose "Install Till Rwanda"
4. App installs to your applications

### Mobile (iOS/Android)
1. Open app in mobile browser
2. iOS: Tap Share > Add to Home Screen
3. Android: Tap Menu > Install app (Chrome will prompt)
4. App appears on home screen as native app

## 🔌 Offline Features

### How It Works
- **Offline Mode**: Sales saved locally to IndexedDB (Dexie database)
- **Sync Trigger**: Automatic sync when internet restored
- **Queue Management**: Failed transactions retry with exponential backoff
- **Product Cache**: Products cached for 24 hours; auto-refreshes when online

### Using Offline
1. Create sales normally - app works without internet
2. Receipt generates and saves locally
3. Go online - auto-sync begins
4. Monitor sync status in OfflineIndicator (bottom-right banner)
5. See completed sales in Sales History

### Cache Management
- **View Cache Status**: Go to Products page > Cache Stats (top-right)
- **Manual Refresh**: Click refresh icon to update products from server
- **Cache Limits**: 30-item limit automatically enforced

## 🔐 Security

### Row Level Security (RLS)
All database tables enforce RLS policies:
- Users can only access their shop's data
- Super admins can access all data
- Policies prevent cross-tenant data leaks
- Database-enforced (not code-level)

### Auth Flow
1. User signs up / logs in
2. Profile created with shop assignment
3. RLS policies automatically restrict access
4. All queries filtered by shop_id or is_super_admin

### Best Practices
- Change password on first login
- Don't share login credentials
- Use unique passwords per account
- Super admin accounts should be protected

## 📊 Analytics Dashboard

### Available Reports
- **Daily Sales Trend**: Line chart showing revenue and transaction count
- **Top Products**: Bar chart of best-selling items by quantity
- **Payment Methods**: Pie chart showing revenue breakdown
- **Profit Metrics**: Summary cards for revenue, expenses, profit, margin
- **Staff Performance**: Detailed sales by staff member
- **Slow-Moving Inventory**: Products with no sales in 90 days

### Data Refresh
- Reports update based on selected date
- Use "Refresh" button to force data reload
- Analytics charts update automatically on data change

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys on push
# View at: https://till-rwanda-pos-0-1.vercel.app
```

### Manual Build
```bash
npm run build
```

Output in `dist/` folder - deploy any static host (Netlify, Firebase, etc.)

## 🐛 Troubleshooting

### Service Worker Issues
- **"Service Worker failing to register"**: Check browser console > Application > Service Workers
- **"Offline mode not working"**: Ensure Service Worker is active and IndexedDB enabled
- **"Cache not clearing"**: Open DevTools > Application > Storage > IndexedDB > Delete database

### Sync Problems
- **"Offline sales not syncing"**: Check network connection, view OfflineIndicator status
- **"Sync keeps failing"**: Check Supabase connection, verify RLS policies deployed
- **"Memory full on old phone"**: Clear app cache in Settings > Apps > Till Rwanda > Clear Cache

### Build Errors
- **"Module not found"**: Run `npm install` again
- **"TypeScript errors"**: Run `npm run lint` to see issues
- **"Dark mode not working"**: Check localStorage, refresh browser

### Performance
- **"App loading slowly"**: First load caches assets; subsequent loads instant
- **"Charts not rendering"**: Check data in Reports page; may need to select different date
- **"Mobile screen glitchy"**: Try landscape mode, clear browser cache

## 📚 Documentation

- [Offline Guide](./OFFLINE_GUIDE.md) - Complete offline workflow documentation
- [App Documentation](./APP_DOCUMENTATION.md) - Feature details and user guide
- [Developer Handover](./DEVELOPER_HANDOVER.md) - Technical setup for developers
- [Installation Guide](./INSTALLATION_GUIDE.md) - Step-by-step setup instructions
- [Release Notes](./RELEASE_NOTES.md) - Version history and changes

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

Private project for Till Rwanda POS system. All rights reserved.

## 👥 Support

For issues or questions:
- GitHub Issues: [Till-Rwanda-Pos-0.1/issues](https://github.com/metaloys/Till-Rwanda-Pos-0.1/issues)
- Email: support@tillrwanda.com

## 🎯 Roadmap

**v0.3.1 (Next)**
- Multi-currency support
- Barcode scanning
- Customer SMS notifications

**v0.4.0**
- API for third-party integrations
- Inventory forecasting
- Advanced tax reporting

**v1.0.0**
- Public app store availability
- Multi-language support
- Advanced loyalty programs

---

**Version**: 0.3.0  
**Status**: Production Ready  
**Last Updated**: December 2024  
**Offline Support**: ✅ Active  
**Analytics**: ✅ Implemented  
**PWA**: ✅ Ready

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
