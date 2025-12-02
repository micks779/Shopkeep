# Camera API Setup Guide

The camera API requires **HTTPS** (secure connection). Here are solutions to test on your phone:

## Solution 1: Use ngrok (Easiest) ✅

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```
   Or download from: https://ngrok.com/download

2. **Build and start your app:**
   ```bash
   npm run build
   npm run preview
   ```

3. **In a new terminal, start ngrok:**
   ```bash
   ngrok http 4173
   ```

4. **Copy the HTTPS URL** (looks like `https://abc123.ngrok.io`)

5. **Open that URL on your phone** - Camera will work! 📸

---

## Solution 2: Use localhost (If on same network)

1. **Find your computer's IP:**
   - Windows: `ipconfig` → Look for "IPv4 Address"

2. **Edit your phone's hosts file** (Advanced):
   - Not recommended - use ngrok instead

---

## Solution 3: Deploy to Vercel/Netlify (Production)

1. **Deploy your app:**
   ```bash
   npm run build
   # Then deploy dist/ folder to Vercel or Netlify
   ```

2. **Get HTTPS URL** - Camera will work automatically!

---

## Solution 4: Self-Signed Certificate (Advanced)

1. **Generate certificate:**
   ```bash
   # Install mkcert
   # Then create certificate for your IP
   ```

2. **Configure Vite to use HTTPS:**
   - Update `vite.config.ts` with certificate paths

---

## Quick Fix: Use ngrok

**Fastest way to test camera on phone:**

```bash
# Terminal 1
npm run build && npm run preview

# Terminal 2
npx ngrok http 4173
```

Then use the ngrok HTTPS URL on your phone! 🚀

