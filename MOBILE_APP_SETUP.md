# Mobile App Setup Guide

Your app can be tested on mobile devices in two ways:

## Option 1: PWA (Progressive Web App) - Easiest ✅

### Steps to Test:

1. **Build the app:**
   ```bash
   npm install
   npm run build
   ```

2. **Start a local server:**
   ```bash
   npm run preview
   ```

3. **Test on your phone:**
   - Make sure your phone and computer are on the same WiFi network
   - Find your computer's IP address:
     - Windows: Run `ipconfig` in terminal, look for "IPv4 Address"
     - Example: `192.168.1.100`
   - On your phone's browser, go to: `http://YOUR_IP_ADDRESS:4173`
   - You should see the app!
   - On mobile browsers, you'll see an "Add to Home Screen" option

4. **Install as PWA:**
   - **Android Chrome:** Menu → "Add to Home screen"
   - **iPhone Safari:** Share button → "Add to Home Screen"

### Replace Placeholder Icons:
- Create 192x192 and 512x512 PNG icons
- Replace `public/icon-192.png` and `public/icon-512.png`
- Or use an online icon generator

---

## Option 2: Native App with Capacitor (For App Stores)

### Installation:

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
npx cap init
```

When prompted:
- **App name:** ShopKeep
- **App ID:** com.shopkeep.expiry
- **Web dir:** dist

### Add Platforms:

```bash
npm run build
npx cap add ios
npx cap add android
```

### Run on Device:

**For Android:**
```bash
npx cap sync
npx cap open android
# Opens Android Studio - then click "Run" button
```

**For iOS (Mac only):**
```bash
npx cap sync
npx cap open ios
# Opens Xcode - then click "Run" button
```

### Build for Production:

**Android APK:**
- In Android Studio: Build → Generate Signed Bundle/APK

**iOS:**
- In Xcode: Product → Archive

---

## Quick Test (PWA - Recommended First)

1. Run: `npm install && npm run build && npm run preview`
2. Note your computer's IP address
3. On phone browser: `http://YOUR_IP:4173`
4. Add to home screen!

