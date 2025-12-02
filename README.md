# ShopKeep Expiry Manager

A React + TypeScript app for managing product expiry dates and inventory with AI-powered features.

## Features

- 📸 AI Camera scanning for barcode and expiry date detection
- 📊 Dashboard with expiry tracking and alerts
- 💰 AI-powered price reduction suggestions
- 📱 PWA support - installable on mobile devices
- 🗄️ Supabase database integration

## Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   # Server-side only (for API routes) - NOT exposed to frontend
   GEMINI_API_KEY=your_gemini_api_key
   
   # Frontend variables (safe to expose - protected by RLS)
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_KEY=your_supabase_anon_key
   ```

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Deployment

### Deploy to Vercel (Recommended)

**Fastest way:**
```bash
npx vercel --prod
```

Then add environment variables in Vercel dashboard.

**Or via GitHub:**
1. Push to GitHub
2. Import to [Vercel](https://vercel.com/new)
3. Add environment variables
4. Deploy!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions for Vercel, Render, and Netlify.

## Environment Variables

**Required environment variables:**

**Server-side (API routes) - NOT exposed to frontend:**
- `GEMINI_API_KEY` - Google Gemini API key for AI features (kept secure on server)

**Frontend (safe to expose - protected by RLS):**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_KEY` - Your Supabase anon key (designed for frontend use)

> **Security Note:** The Gemini API key is now protected via serverless API routes. It never reaches the frontend code, preventing API key theft.

## Database Setup

See `supabase_schema_update.sql` for database schema setup instructions.

## Mobile Testing

The app works as a PWA and can be installed on mobile devices. For camera functionality, HTTPS is required (automatically provided when deployed).

See [CAMERA_SETUP.md](./CAMERA_SETUP.md) for local testing with camera.
