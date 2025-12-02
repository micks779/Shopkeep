# Security Documentation

## Overview

This document outlines the security measures implemented in ShopKeep Expiry Manager.

## ✅ Security Features Implemented

### 1. **API Key Protection**
- **Gemini API Key**: Protected via Vercel serverless functions
  - API key is stored server-side only (not in frontend code)
  - All Gemini API calls go through secure API routes (`/api/gemini-*`)
  - Prevents API key theft from browser DevTools
  - Environment variable: `GEMINI_API_KEY` (no `VITE_` prefix)

### 2. **User Authentication**
- Email/password authentication via Supabase Auth
- Session management handled securely
- Users must authenticate before accessing the app

### 3. **Data Isolation (Row Level Security)**
- Each user can only access their own data
- `user_id` column added to all tables (`products`, `batches`, `store_profile`)
- RLS (Row Level Security) policies enforce data isolation at database level
- Policies prevent users from:
  - Viewing other users' data
  - Modifying other users' data
  - Deleting other users' data

### 4. **Database Security**
- Supabase anon key is safe to expose (designed for frontend)
- RLS policies protect data even if anon key is exposed
- All database queries filter by `user_id`
- Foreign key constraints ensure data integrity

### 5. **Environment Variables**
- `.env` file is in `.gitignore` (never committed)
- Server-side keys use `process.env` (not exposed)
- Frontend keys use `import.meta.env.VITE_*` (only safe keys)

## 🔒 Security Architecture

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │
       │ HTTPS
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│  Vercel API     │─────▶│  Gemini API  │
│  Routes         │      │  (Secure)    │
│  (Server-side)  │      └──────────────┘
└─────────────────┘
       │
       │
       ▼
┌─────────────────┐
│   Supabase      │
│   (Database)    │
│   + RLS         │
└─────────────────┘
```

## 🚨 Important Security Notes

### For Deployment (Vercel)

1. **Set Environment Variables in Vercel Dashboard:**
   - Go to Project Settings → Environment Variables
   - Add `GEMINI_API_KEY` (server-side, not `VITE_` prefixed)
   - Add `VITE_SUPABASE_URL` (frontend)
   - Add `VITE_SUPABASE_KEY` (frontend - anon key only!)

2. **Never Use Service Role Key in Frontend:**
   - Service role key bypasses RLS - only use server-side
   - Anon key is safe for frontend (protected by RLS)

3. **Verify RLS Policies:**
   - All tables should have RLS enabled
   - Policies should filter by `auth.uid() = user_id`

## 📋 Security Checklist

Before deploying to production:

- [x] Gemini API key moved to server-side API routes
- [x] User authentication implemented
- [x] Data isolation via RLS policies
- [x] `user_id` columns added to all tables
- [x] Environment variables properly configured
- [x] `.env` file in `.gitignore`
- [x] HTTPS enabled (automatic on Vercel)
- [ ] Rate limiting (consider adding for API routes)
- [ ] Input validation (basic validation in place)
- [ ] Error messages don't leak sensitive info

## 🔍 Testing Security

1. **Test Data Isolation:**
   - Create two test accounts
   - Verify each account only sees their own data
   - Try accessing data from different account (should fail)

2. **Test API Key Protection:**
   - Open browser DevTools → Sources
   - Search for "GEMINI_API_KEY" or "apiKey"
   - Should NOT find the API key in frontend code

3. **Test Authentication:**
   - Try accessing app without login (should redirect)
   - Verify logout clears session

## 🛡️ Additional Security Recommendations

1. **Rate Limiting**: Consider adding rate limiting to API routes to prevent abuse
2. **Input Sanitization**: Validate and sanitize all user inputs
3. **CORS**: Configure CORS properly for production
4. **Monitoring**: Set up error tracking (e.g., Sentry) to monitor security issues
5. **Regular Updates**: Keep dependencies updated for security patches

## 📚 Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/database/secure-data)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

