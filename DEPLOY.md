# Deploying Indie Festivals API to Vercel

This guide walks you through deploying the Indie Festivals API to Vercel.

## Prerequisites

1. **GitHub Account** - Your code needs to be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free tier available)
3. **MongoDB Atlas Database** - Already set up with your connection string

---

## Step 1: Prepare Your Repository

### 1.1 Initialize Git (if not already done)

```bash
cd "c:\Users\airau\Desktop\My Proyects\videogame"
git init
```

### 1.2 Create Initial Commit

```bash
git add .
git commit -m "Initial commit - Indie Festivals API"
```

### 1.3 Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name it `indie-festivals-api` (or any name you prefer)
3. Keep it **Public** or **Private** (both work with Vercel)
4. **Don't** initialize with README (you already have one)
5. Click **Create repository**

### 1.4 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/indie-festivals-api.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Vercel

### 2.1 Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. If not connected, click **"Add GitHub Account"** and authorize Vercel
5. Find and select your `indie-festivals-api` repository

### 2.2 Configure Project Settings

On the configuration page:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Other |
| **Root Directory** | `./` (leave default) |
| **Build Command** | Leave empty (uses vercel.json) |
| **Output Directory** | Leave empty |

### 2.3 Add Environment Variables

⚠️ **IMPORTANT**: Click **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `MONGODB_URI` | `mongodb+srv://test1234:test1234@cluster0.sus7b8h.mongodb.net/?appName=Cluster0` |
| `NODE_ENV` | `production` |

> **Security Note**: Never commit your `.env` file to GitHub. Always add sensitive variables through Vercel's dashboard.

### 2.4 Deploy

Click **"Deploy"** and wait for the build to complete (usually 1-2 minutes).

---

## Step 3: Verify Deployment

Once deployed, Vercel will give you a URL like `https://indie-festivals-api.vercel.app`

### Test the API:

```bash
# Health check
curl https://YOUR-PROJECT.vercel.app/api/health

# Get all festivals
curl https://YOUR-PROJECT.vercel.app/api/festivals

# Get festival stats
curl https://YOUR-PROJECT.vercel.app/api/festivals/stats
```

Or simply visit these URLs in your browser:
- `https://YOUR-PROJECT.vercel.app/` - API info
- `https://YOUR-PROJECT.vercel.app/api/festivals` - List festivals
- `https://YOUR-PROJECT.vercel.app/api/festivals/stats` - Statistics

---

## Step 4: Sync Data to Production Database

Since your production database might be empty, run the sync script locally pointing to your Atlas database:

```bash
# Make sure your .env has the Atlas connection string
npm run sync
```

This populates your MongoDB Atlas database with festival data.

---

## Available API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information |
| `/api/health` | GET | Health check |
| `/api/festivals` | GET | List all festivals |
| `/api/festivals/stats` | GET | Festival statistics |
| `/api/festivals/types` | GET | Festival types |
| `/api/festivals/open` | GET | Currently open festivals |
| `/api/festivals/upcoming` | GET | Upcoming festivals |
| `/api/festivals/:id` | GET | Get festival by ID |
| `/api/steam-features` | GET | List Steam features |
| `/api/steam-features/stats` | GET | Steam feature statistics |
| `/api/sync` | POST | Trigger data sync |
| `/api/enrich` | POST | Enrich festival data |
| `/api/enrich/stats` | GET | Enrichment statistics |

---

## Automatic Deployments

Once connected, Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push
```

Vercel will automatically build and deploy the new version!

---

## Custom Domain (Optional)

1. Go to your project in Vercel Dashboard
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain
4. Follow DNS configuration instructions

---

## Troubleshooting

### "Cannot connect to database"
- Verify `MONGODB_URI` is set correctly in Vercel Environment Variables
- Make sure your MongoDB Atlas cluster allows connections from anywhere:
  - Go to Atlas → Network Access → Add IP Address → "Allow Access from Anywhere" (0.0.0.0/0)

### "Function timeout"
- Vercel free tier has 10-second timeout
- The enrichment endpoint processes in batches to avoid this
- Consider using a background job service for heavy operations

### "Module not found"
- Make sure all dependencies are in `package.json`
- Run `npm install` and push `package-lock.json`

### Viewing Logs
1. Go to Vercel Dashboard → Your Project
2. Click **"Deployments"** → Select a deployment
3. Click **"Functions"** tab to see logs

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ Yes | MongoDB connection string |
| `NODE_ENV` | No | Set to `production` for production |
| `PORT` | No | Not used in Vercel (managed automatically) |

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Verify API is working
3. 🔄 Run `npm run sync` locally to populate database
4. 🔄 Run `npm run enrich -- --limit 50` to enrich festival data
5. 🎉 Share your API with the world!

---

## Quick Commands Reference

```bash
# Local development
npm run dev

# Sync data to database
npm run sync

# Enrich festival data
npm run enrich -- --limit 20

# Build for production
npm run build
```
