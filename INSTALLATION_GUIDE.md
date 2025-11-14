# Installation & Setup Guide

**Version:** 0.2.0  
**Last Updated:** November 14, 2025

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Database Setup](#database-setup)
5. [Environment Variables](#environment-variables)
6. [Running the Application](#running-the-application)
7. [Building for Production](#building-for-production)
8. [Troubleshooting Setup Issues](#troubleshooting-setup-issues)

---

## Prerequisites

### Required Software

```bash
# Node.js and npm (or yarn)
node --version  # Should be 16.0.0 or higher
npm --version   # Should be 8.0.0 or higher

# Git for version control
git --version   # Should be 2.30.0 or higher

# Optional: For local Supabase development
docker --version  # For running Supabase locally
```

### System Requirements

- **OS**: Windows, macOS, or Linux
- **RAM**: 2GB minimum (4GB recommended)
- **Disk**: 500MB free space
- **Internet**: Required for Supabase connection

### Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 13+, Chrome Android 90+)

---

## Local Development Setup

### 1. Clone the Repository

```bash
# Using HTTPS
git clone https://github.com/metaloys/Till-Rwanda-Pos-0.1.git
cd till_rwanda_app

# Or using SSH
git clone git@github.com:metaloys/Till-Rwanda-Pos-0.1.git
cd till_rwanda_app
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install

# Or using pnpm
pnpm install
```

### 3. Verify Installation

```bash
# Check that node_modules is created
ls node_modules/

# Verify key packages
npm list react vite typescript

# Should show:
# react@19.1.1
# vite@7.1.7
# typescript@5.5.3
```

---

## Supabase Configuration

### Option A: Cloud Supabase (Recommended for Testing)

#### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with email or GitHub
4. Create a new organization
5. Create a new project:
   - **Project Name**: `till-rwanda-dev`
   - **Database Password**: Generate strong password
   - **Region**: Choose region closest to you
   - Click "Create new project"

#### 2. Get Your API Keys

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: Under "API URL"
   - **Anon Public Key**: Under "Project API Keys"

3. Save these for the environment file

#### 3. Enable Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Settings → Email Auth:
   - **Confirm Email**: Enabled (for production)

---

### Option B: Local Supabase (Advanced)

#### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (using Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux/WSL
curl -fsSL https://cli.supabase.io/install.sh | sh
```

#### 2. Initialize Local Supabase

```bash
# Navigate to project root
cd till_rwanda_app

# Initialize Supabase
supabase init

# Start Supabase containers
supabase start

# This will:
# - Start PostgreSQL database on port 54322
# - Start Supabase API on port 54321
# - Create local .env.local with credentials
```

#### 3. Verify Local Setup

```bash
# Check running services
supabase status

# Should show:
# API URL: http://localhost:54321
# DB URL: postgresql://...
```

---

## Database Setup

### 1. Create Database Tables

**Using Supabase Dashboard:**

1. Go to **SQL Editor**
2. Create new query
3. Copy SQL from `supabase/migrations/` (if available)
4. Execute query

**Or use Supabase CLI:**

```bash
# Apply migrations
supabase db push

# Verify tables created
supabase db remote pull
```

### 2. Required Tables

The following tables must exist:

```sql
-- Shops (Tenants)
CREATE TABLE shops (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users,
  is_active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  shop_id UUID REFERENCES shops(id),
  name TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Product Variants
CREATE TABLE product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  name TEXT,
  price DECIMAL(10, 2),
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  shop_id UUID REFERENCES shops(id),
  name TEXT NOT NULL,
  phone TEXT,
  credit_balance DECIMAL(10, 2) DEFAULT 0,
  credit_limit DECIMAL(10, 2) DEFAULT 50000,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sales
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  shop_id UUID REFERENCES shops(id),
  total_amount DECIMAL(10, 2),
  payment_method TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Profiles (Users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  shop_id UUID REFERENCES shops(id),
  full_name TEXT,
  role TEXT DEFAULT 'cashier',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Set Up Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (shop isolation)
CREATE POLICY "Users can see their shop data"
  ON products FOR SELECT
  USING (shop_id = (
    SELECT shop_id FROM profiles 
    WHERE id = auth.uid()
  ));
```

---

## Environment Variables

### 1. Create .env.local File

```bash
# In project root
cp .env.example .env.local
```

### 2. Configure Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc... (your anon key)

# Optional: Development settings
VITE_DEBUG=false
VITE_API_TIMEOUT=30000

# Optional: Feature flags
VITE_ENABLE_EBM=false
VITE_ENABLE_SMS=false
```

### 3. Verify Variables

```bash
# Check .env.local is created
cat .env.local

# Should show your VITE_ variables
# NEVER commit .env.local to Git!
```

---

## Running the Application

### 1. Development Server

```bash
# Start Vite dev server
npm run dev

# You should see:
# VITE v7.1.7 ready in 234 ms
# ➜ Local: http://localhost:5173

# Open in browser
# http://localhost:5173
```

### 2. Hot Module Replacement (HMR)

- Edit any `.tsx` file and save
- Changes appear instantly in browser
- State is preserved during HMR

### 3. Check Errors

```bash
# Terminal shows TypeScript and ESLint errors
# Check browser console for runtime errors
# DevTools: F12 or Right-click → Inspect
```

### 4. Test Authentication

1. Go to `http://localhost:5173`
2. Sign up with test email
3. Verify email confirmation (if enabled)
4. Login and navigate dashboard

---

## Building for Production

### 1. Prepare Build

```bash
# Type check
npm run type-check

# Lint code
npm run lint

# Fix linting issues
npm run lint -- --fix
```

### 2. Build Application

```bash
# Create optimized build
npm run build

# Output goes to `dist/` folder
# Check build output:
ls -la dist/

# Should see:
# index.html (~10KB)
# assets/ folder with .js and .css files
```

### 3. Preview Production Build

```bash
# Start local preview server
npm run preview

# Open browser to http://localhost:4173
# This simulates production environment
```

### 4. Build Statistics

```bash
# Analyze bundle size (optional)
npm run build -- --analyze

# Shows which dependencies take up space
# Helps identify optimization opportunities
```

---

## Deployment

### Option A: Vercel (Recommended)

```bash
# 1. Push code to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. Go to vercel.com
# 3. Import GitHub repository
# 4. Add environment variables
# 5. Deploy automatically

# Vercel will:
# - Run npm install
# - Run npm run build
# - Deploy to CDN
# - Provide production URL
```

### Option B: Netlify

```bash
# 1. Push to GitHub (as above)
# 2. Go to netlify.com
# 3. Connect GitHub repository
# 4. Set build command: npm run build
# 5. Set publish directory: dist
# 6. Add environment variables in UI
# 7. Deploy
```

### Option C: Traditional Server

```bash
# 1. Build application
npm run build

# 2. Upload `dist/` folder to server
scp -r dist/ user@server.com:/var/www/till-rwanda/

# 3. Configure web server (Nginx/Apache)
# 4. Point domain to dist/index.html
# 5. Set up SSL certificate (Let's Encrypt)
```

---

## Troubleshooting Setup Issues

### Issue: Port 5173 already in use

```bash
# Find and kill process
lsof -i :5173  # On macOS/Linux
netstat -ano | findstr :5173  # On Windows

# Or use different port
npm run dev -- --port 3000
```

### Issue: "Cannot find module" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or clear npm cache
npm cache clean --force
npm install
```

### Issue: Supabase connection fails

```bash
# Verify environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Check Supabase status
curl https://your-project.supabase.co/rest/v1/

# Should return valid JSON response
```

### Issue: TypeScript errors in development

```bash
# Restart dev server
npm run dev

# Full TypeScript check
npm run type-check

# Clear TypeScript cache
rm -rf node_modules/.vite
```

### Issue: Build fails

```bash
# Check for errors
npm run build

# Run full check
npm run lint
npm run type-check
npm run build

# Check disk space
df -h  # macOS/Linux
dir C:\  # Windows
```

---

## Verification Checklist

After setup, verify:

- [ ] `npm run dev` starts without errors
- [ ] Application loads at http://localhost:5173
- [ ] Can sign up with test email
- [ ] Can login successfully
- [ ] Dashboard displays correctly
- [ ] Dark mode toggle works
- [ ] Can create a test product
- [ ] Can process a test sale
- [ ] All pages load without 404 errors
- [ ] Browser console has no errors

---

## Git Workflow

### First Commit

```bash
# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Create initial commit
git add .
git commit -m "feat: Initial Till Rwanda POS setup"

# Push to repository
git push origin main
```

### Creating Features

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: Add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request on GitHub
```

---

## Next Steps

1. **Familiarize with codebase**: Review `src/` structure
2. **Understand data model**: Read `PROJECT_DOCUMENTATION.md`
3. **Check out features**: Test Point of Sale, Products, etc.
4. **Read contributor guide**: See `DEVELOPER_HANDOVER.md`
5. **Submit feedback**: Create issues on GitHub

---

## Getting Help

- **Documentation**: Check `.md` files in project root
- **GitHub Issues**: [View existing issues](https://github.com/metaloys/Till-Rwanda-Pos-0.1/issues)
- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com/docs

---

**Need Help?** Email: support@till-rwanda.com
