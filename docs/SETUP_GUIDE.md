# VKU Field Survey - Setup & Deployment Guide

## Quick Start

### 1. Installation

```bash
# Install dependencies
npm install

# Generate placeholder icons (optional, use real icons for production)
node scripts/generate-icons.js
```

### 2. Development

```bash
# Start development server
npm run dev

# The app opens at http://localhost:5173
```

### 3. Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### 4. Deploy to Static Host

#### Deploy to Vercel
```bash
npm install -g vercel
npm run build
vercel deploy --prod
```

#### Deploy to Netlify
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

#### Deploy to Cloudflare Pages
```bash
# Push to GitHub, connect repo to Cloudflare Pages
# Set build command: npm run build
# Set build directory: dist
```

---

## Android Deployment (Capacitor)

### Prerequisites

- Node.js 16+
- Java JDK 11+ (set JAVA_HOME)
- Android Studio & Android SDK
- Gradle (usually included with Android Studio)

### Setup Steps

```bash
# 1. Initialize Capacitor (if not already done)
npx cap init

# 2. Add Android platform
npx cap add android

# 3. Build for production
npm run build

# 4. Sync web code to Android
npx cap sync

# 5. Open in Android Studio
npx cap open android

# 6. In Android Studio:
#    - Click Build → Build APK
#    - Or connect device and press Shift+F10
```

### Release Build

```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Android Permissions

Configured in `android/app/src/main/AndroidManifest.xml`:
- CAMERA - for photo capture
- ACCESS_FINE_LOCATION - for GPS
- INTERNET - for API calls

---

## Testing Offline Mode

### Test 1: Create Inspection While Offline

1. Open DevTools (F12)
2. Network tab → Check "Offline"
3. Refresh page
4. Fill inspection form
5. Click "Save Inspection"
6. ✅ Data saved to IndexedDB
7. ✅ Status shows PENDING_SYNC

### Test 2: Auto-Sync on Network Restore

1. Create inspection while offline (see Test 1)
2. Uncheck "Offline" in DevTools
3. ✅ App detects online
4. ✅ Auto-sync starts
5. ✅ Status changes to SYNCED

### Test 3: Multiple Inspections

1. Go offline
2. Create 3 inspections
3. All show PENDING_SYNC
4. Go online
5. ✅ All sync sequentially
6. ✅ Status updates individually

### Test 4: Service Worker Caching

1. Open DevTools → Application tab
2. ✅ Service Worker registered under "/"
3. ✅ Cache contains app shell files
4. Go offline
5. ✅ App shell loads from cache
6. ✅ Form works without network

### Test 5: PWA Installation

#### On Desktop
1. Open app in Chrome
2. Click install icon (or use menu)
3. ✅ App installs to system
4. ✅ Appears in taskbar/applications
5. Launch from desktop
6. ✅ Runs as standalone window

#### On Android
1. Open app in Chrome
2. Tap menu (⋮) → "Install app"
3. ✅ App appears on home screen
4. Launch from home screen
5. ✅ Runs as standalone app

---

## Environment Configuration

### Development (.env)

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Production (.env)

```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Backend API Requirements

The app expects these endpoints:

```
POST /api/inspections
  Body: { Inspection object }
  Response: { success: true, data: Inspection }

GET /api/inspections
  Response: { success: true, data: [Inspections] }

GET /api/health
  Response: { status: "ok" }
```

---

## Troubleshooting

### Service Worker Won't Register
- **Problem**: "Service Worker registration failed"
- **Solution**: HTTPS required (except localhost). Deploy with HTTPS.

### App Crashes on Startup
- **Problem**: "App container not found"
- **Solution**: Verify `<div id="app"></div>` in index.html

### IndexedDB Errors
- **Problem**: "Failed to open database"
- **Solution**: 
  - Disable private browsing
  - Check storage is enabled
  - Clear browser cache

### Camera Not Working
- **Problem**: "Camera error" on mobile
- **Solution**:
  - Grant camera permission when prompted
  - HTTPS required for production
  - Check camera is available

### GPS Not Capturing
- **Problem**: "Failed to get location"
- **Solution**:
  - Grant location permission
  - Check device GPS is enabled
  - May need HTTPS for production

### Sync Not Working
- **Problem**: "Sync failed"
- **Solution**:
  - Verify API URL in .env
  - Check backend is running
  - Inspect network tab for errors
  - Check API endpoint is correct

### Icons Not Showing
- **Problem**: 404 errors for icons
- **Solution**: Run icon generator or add real PNG files

---

## File Structure

```
vku-field-survey/
├── src/                          # Source code
│   ├── main.ts                   # Entry point
│   ├── style.css                 # Styles
│   ├── service-worker.ts         # (TypeScript version)
│   ├── vite-env.d.ts
│   ├── types/inspection.ts
│   ├── db/database.ts
│   ├── services/
│   │   ├── sync.ts
│   │   ├── api.ts
│   │   ├── camera.ts
│   │   ├── location.ts
│   │   └── network.ts
│   ├── ui/
│   │   ├── form.ts
│   │   ├── inspection-list.ts
│   │   └── status.ts
│   └── utils/helpers.ts
├── public/                       # Static assets
│   ├── service-worker.js         # (JavaScript version)
│   ├── manifest.webmanifest
│   └── icons/
│       ├── icon-192x192.png
│       └── icon-512x512.png
├── dist/                         # Production build output
├── android/                      # Capacitor Android project
├── scripts/
│   └── generate-icons.js
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── capacitor.config.ts
├── .env.example
├── .gitignore
├── README.md
└── docs/
    └── REPORT.md
```

---

## Key Commands

```bash
# Development
npm run dev                # Start dev server
npm run lint              # TypeScript check
npm run build             # Production build
npm run preview           # Preview build

# Icons
node scripts/generate-icons.js

# Capacitor Android
npx cap init              # Initialize
npx cap add android       # Add Android platform
npx cap sync              # Sync web code
npx cap open android      # Open in Android Studio

# Git
git add .
git commit -m "message"
git push origin main
```

---

## Performance Tips

1. **Image Optimization**: Compress photos before upload
2. **Cache Management**: Service Worker caches assets automatically
3. **IndexedDB**: Data persisted locally, no redundant requests
4. **Lazy Loading**: Components load on demand
5. **Minification**: Automatically applied in production build

---

## Security Considerations

- ✅ No sensitive data stored locally
- ✅ HTTPS required for production PWA
- ✅ No API secrets in frontend code
- ✅ Input validation on all forms
- ✅ Environment variables for API URLs

---

## Support & Resources

- **MDN Service Workers**: https://developer.mozilla.org/docs/Web/API/Service_Worker_API
- **PWA Documentation**: https://web.dev/progressive-web-apps/
- **IndexedDB Guide**: https://developer.mozilla.org/docs/Web/API/IndexedDB_API
- **Capacitor Docs**: https://capacitorjs.com
- **Vite Guide**: https://vitejs.dev

---

## Next Steps

1. Replace placeholder icons with real assets
2. Implement backend API (if needed)
3. Configure VITE_API_BASE_URL for production
4. Deploy to HTTPS hosting
5. Test on real Android device
6. Gather feedback and iterate

---

**Last Updated**: 2026-09-01  
**Version**: 1.0.0
