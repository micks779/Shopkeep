# Deployment Guide - ShopKeep Expiry Manager

Deploy your app to production with HTTPS (camera will work!) 🚀

## Option 1: Vercel (Recommended - Easiest) ⭐

### Steps:

1. **Install Vercel CLI (optional but helpful):**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   Follow the prompts. It will auto-detect Vite settings.

4. **Add Environment Variables:**
   - Go to your project on [vercel.com](https://vercel.com)
   - Settings → Environment Variables
   - Add these:
     - `VITE_GEMINI_API_KEY` = your Gemini API key
     - `VITE_SUPABASE_URL` = your Supabase URL
     - `VITE_SUPABASE_KEY` = your Supabase key

5. **Redeploy:**
   - After adding env vars, go to Deployments → Redeploy

### Or Deploy via GitHub:

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/shopkeep.git
   git push -u origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Add environment variables
   - Deploy!

---

## Option 2: Render

### Steps:

1. **Create account:** [render.com](https://render.com)

2. **Create New Static Site:**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository (or upload manually)

3. **Configure:**
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **Environment:** `Node`

4. **Add Environment Variables:**
   - In the dashboard, go to Environment
   - Add:
     - `VITE_GEMINI_API_KEY`
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_KEY`

5. **Deploy!**

---

## Option 3: Netlify

### Steps:

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   npm run build
   netlify deploy --prod
   ```

4. **Add Environment Variables:**
   - Netlify Dashboard → Site Settings → Environment Variables
   - Add all `VITE_*` variables

---

## Environment Variables Needed

Make sure to add these in your hosting platform:

```
VITE_GEMINI_API_KEY=your_key_here
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_KEY=your_key_here
```

**Important:** All variables must start with `VITE_` for Vite to expose them!

---

## After Deployment

1. ✅ Your app will have HTTPS automatically
2. ✅ Camera will work on mobile devices
3. ✅ PWA features will work
4. ✅ Can be installed on phones

---

## Quick Deploy (Vercel - Fastest)

```bash
# One command deploy
npx vercel --prod
```

Then add environment variables in the Vercel dashboard!

