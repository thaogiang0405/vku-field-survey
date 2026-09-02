# VKU Field Survey - Offline Data Collection PWA

A progressive web application for facility inspection and offline-first data collection at VKU (Vietnamese-Korean University). The app allows facility staff to conduct inspections, capture photos with GPS location, and automatically synchronize data when connectivity is restored.

## 🎯 Project Overview

**VKU Field Survey** is a modern PWA built with:
- **Offline-First Architecture**: Full functionality without internet
- **IndexedDB Storage**: Persistent local data storage
- **Progressive Sync**: Automatic data synchronization when online
- **Capacitor Integration**: Native Android support with camera and GPS
- **Responsive Mobile UI**: Works seamlessly on all devices

### Key Features

1. **Offline Mode**
   - Form submission without internet
   - Local data persistence using IndexedDB
   - Automatic sync queue management

2. **Media Capture**
   - Photo capture using native camera
   - GPS location tracking
   - Fallback support for web browsers

3. **Data Synchronization**
   - Intelligent sync queue with retry logic
   - Automatic sync on network restore
   - Clear sync status indicators

4. **User Interface**
   - Mobile-first responsive design
   - Real-time online/offline indicators
   - Inspection history with filtering
   - Professional styling with VKU branding

5. **Data Model**
   - Building and room identification
   - Multi-category facility assessment
   - 5-point condition rating system
   - Detailed defect notes
   - Timestamp tracking

## 📋 Problem Statement

Facility inspectors at VKU often need to conduct surveys in areas with poor or no internet connectivity. Previous solutions required online connectivity, risking data loss. This application solves that by:

- Storing data locally when offline
- Ensuring no data is lost due to connectivity issues
- Automatically syncing when connectivity returns
- Providing clear visual feedback of sync status
- Supporting native mobile deployment via Capacitor

## ✨ Features

### Form Inspection Fields

- **Building**: Selection from predefined buildings
- **Floor**: Numeric floor number
- **Room #**: Room identifier
- **Category**: Hardware, Projector, AC, Electrical, Furniture
- **Condition Rating**: 1-5 scale (Very Bad to Excellent)
- **Defect Notes**: Detailed description of issues
- **Photo**: Camera capture with preview
- **GPS Location**: Automatic latitude/longitude
- **Timestamp**: Automatic creation time
- **Sync Status**: PENDING_SYNC or SYNCED

### Status Indicators

```
🟢 Online       - Network is connected
🔴 Offline      - No network connection
🔄 Syncing...   - Data synchronization in progress
🟢 Synced       - All data synchronized
⚠️ Sync Error   - Synchronization failed (will retry)
```

## 🛠️ Technologies

### Frontend Stack
- **Vite**: Ultra-fast build tool
- **TypeScript**: Type-safe development
- **Vanilla TypeScript**: No heavy frameworks
- **HTML5 / CSS3**: Modern web standards
- **Service Worker API**: Offline support
- **IndexedDB**: Client-side database

### Mobile Integration
- **Capacitor**: Cross-platform native integration
- **Capacitor Camera**: Photo capture
- **Capacitor Geolocation**: GPS access
- **Capacitor Network**: Network status monitoring
- **Android**: Native app deployment

### Backend (Optional)
- **Node.js / Express**: Demo server (optional)
- **REST API**: Inspection data endpoints
- **.env Configuration**: API URL configuration

## 🏗️ Architecture

### Modular Structure

```
src/
├── main.ts                 # App entry point
├── style.css              # Global styles
├── service-worker.ts      # Offline caching
├── types/
│   └── inspection.ts      # Data models
├── db/
│   └── database.ts        # IndexedDB abstraction
├── services/
│   ├── sync.ts            # Sync engine
│   ├── api.ts             # API communication
│   ├── camera.ts          # Photo capture
│   ├── location.ts        # GPS integration
│   └── network.ts         # Network monitoring
├── ui/
│   ├── form.ts            # Inspection form
│   ├── inspection-list.ts # History display
│   └── status.ts          # Status indicators
└── utils/
    └── helpers.ts         # Utility functions
```

### Data Flow

#### Offline (No Internet)
```
User Input Form
    ↓
Validation
    ↓
Generate UUID
    ↓
IndexedDB: Save Inspection
    ↓
IndexedDB: Add to Sync Queue
    ↓
Status: PENDING_SYNC
    ↓
Show: "Saved locally, will sync when online"
```

#### Online (Network Available)
```
Network Restored
    ↓
Detect Online Event
    ↓
syncPendingInspections()
    ↓
Fetch from IndexedDB (PENDING_SYNC)
    ↓
POST to API (Sequential)
    ↓
Success? Update Status to SYNCED
    ↓
Remove from Sync Queue
    ↓
Retry failed items
```

## 📦 Project Structure

```
.
├── src/                    # Source code
│   ├── main.ts
│   ├── style.css
│   ├── service-worker.ts
│   ├── types/
│   ├── db/
│   ├── services/
│   ├── ui/
│   └── utils/
├── public/                 # Static assets
│   ├── manifest.webmanifest
│   └── icons/
│       ├── icon-192x192.png
│       └── icon-512x512.png
├── android/                # Capacitor Android (generated)
├── index.html             # HTML entry point
├── package.json
├── vite.config.ts
├── tsconfig.json
├── capacitor.config.ts
├── .env.example
├── .gitignore
├── README.md
└── docs/
    └── REPORT.md
```

## 🚀 Installation

### Prerequisites
- Node.js 16+ and npm/yarn
- (Optional) Android Studio for Android development
- (Optional) Java JDK 11+ for Android builds

### Setup Steps

1. **Clone and Install**
   ```bash
   git clone <repo-url>
   cd vku-field-survey
   npm install
   ```

2. **Configure Environment** (Optional)
   ```bash
   cp .env.example .env
   # Edit .env if you have a backend server
   # VITE_API_BASE_URL=https://api.example.com
   ```

3. **Start Backend Server** (Optional but Recommended)
   ```bash
   npm run server
   ```
   Backend runs at `http://localhost:3000/api`

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Frontend opens at `http://localhost:5173`

**Quick Tip**: Run both servers together:
   ```bash
   npm run dev:all
   ```

## 🔌 Backend API

A simple Express.js backend server is included for local development:

- **Endpoint**: `http://localhost:3000/api`
- **Features**:
  - ✅ Inspection CRUD operations
  - ✅ In-memory data storage (persists while server runs)
  - ✅ CORS enabled for localhost development
  - ✅ Complete REST API

**Start Server**:
```bash
npm run server
```

**API Endpoints**:
- `POST /api/inspections` - Create inspection
- `GET /api/inspections` - Get all inspections
- `GET /api/inspections/:id` - Get single inspection
- `PUT /api/inspections/:id` - Update inspection
- `DELETE /api/inspections/:id` - Delete inspection
- `GET /api/health` - Health check

For detailed backend documentation, see [BACKEND_SETUP.md](BACKEND_SETUP.md)

**Production Note**: The included backend uses in-memory storage. For production, replace with a real database (MongoDB, PostgreSQL, Firebase, etc.)

## 💻 Development

### Running Locally

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# TypeScript type checking
npm run lint
```

### Testing Offline Mode

#### Browser DevTools
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Refresh page
5. App continues to work
6. Create an inspection
7. Uncheck "Offline"
8. Observe automatic sync

#### Service Worker Testing
1. Open DevTools → Application tab
2. Check Service Worker is registered
3. Toggle offline in Network tab
4. Page remains functional

### Building for Production

```bash
npm run build
# Output: dist/ folder
```

Deploy `dist/` folder to any static hosting (Vercel, Netlify, Cloudflare Pages, etc.)

## 📱 PWA Installation

### Desktop Browser
1. Open app in Chrome/Edge/Firefox
2. Click install icon in address bar (or menu → Install)
3. App installs as standalone window

### Android
1. Open app in Chrome
2. Tap menu (⋮) → "Install app"
3. App installs to home screen

### iOS (Limited Support)
1. Open app in Safari
2. Tap Share → "Add to Home Screen"
3. App opens in fullscreen mode (web clip)

## 🔄 Offline & Synchronization

### How Offline Mode Works

1. **Service Worker Caches**
   - HTML/CSS/JS cached on first visit
   - Images cached on demand
   - IndexedDB persists inspection data

2. **Offline Storage**
   - All form data saved to IndexedDB
   - Data survives page refresh
   - No data lost without sync confirmation

3. **Sync Queue**
   - PENDING_SYNC inspections queued
   - Sync attempts tracked
   - Failed items retained for retry

4. **Auto Sync**
   - Triggers on network restore
   - Sequential processing (no race conditions)
   - Retry logic for failed items

### Sync Status States

```typescript
type SyncStatus = 'PENDING_SYNC' | 'SYNCED';

// Inspection stored locally but not synced
status: 'PENDING_SYNC'

// Successfully synced to server
status: 'SYNCED'
```

## 🗄️ IndexedDB Schema

### Database: `vku-field-survey`

#### Store: `inspections`
```typescript
{
  id: string (keyPath),
  building: string,
  floor: number,
  room: string,
  category: 'Hardware'|'Projector'|'AC'|'Electrical'|'Furniture',
  rating: 1|2|3|4|5,
  defectNotes: string,
  photo?: string,
  latitude?: number,
  longitude?: number,
  timestamp: string,
  status: 'PENDING_SYNC'|'SYNCED',
  createdAt: string,
  updatedAt: string,
  syncAttempts: number,
  lastSyncError?: string
}
```

#### Store: `syncQueue`
```typescript
{
  id: string (keyPath),
  inspectionId: string (index),
  status: 'PENDING_SYNC'|'SYNCED' (index),
  createdAt: string,
  attempts: number,
  lastError?: string
}
```

## 📷 Camera Integration

### Android (Capacitor)
```typescript
import { Camera } from '@capacitor/camera';

const image = await Camera.getPhoto({
  quality: 90,
  allowEditing: false,
  resultType: CameraResultType.Base64,
  source: CameraSource.Camera,
});
```

### Web Browser (Fallback)
```html
<input type="file" accept="image/*" capture="environment" />
```

## 📍 GPS Integration

### Capacitor Geolocation
```typescript
import { Geolocation } from '@capacitor/geolocation';

const coordinates = await Geolocation.getCurrentPosition({
  enableHighAccuracy: true,
  timeout: 10000,
});
```

### Permissions
- **Android**: CAMERA, ACCESS_FINE_LOCATION required
- **iOS**: NSCameraUsageDescription, NSLocationWhenInUseUsageDescription
- **Web**: User prompt on first use

## 🌐 Network Detection

### Web
```typescript
window.addEventListener('online', () => { /* sync */ });
window.addEventListener('offline', () => { /* buffer */ });
navigator.onLine // current status
```

### Native (Capacitor)
```typescript
import { Network } from '@capacitor/network';
Network.addListener('networkStatusChange', status => { /* ... */ });
```

## 🔧 Capacitor Android Setup

### Prerequisites
- Android Studio installed
- Android SDK configured
- Java JDK 11+

### Initial Setup

```bash
# Add Android platform
npx cap add android

# Sync native code
npx cap sync

# Open Android Studio
npx cap open android
```

### Building Debug APK

1. In Android Studio:
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Or: Shift + F10 to run on connected device

2. Via Command Line:
   ```bash
   cd android
   ./gradlew assembleDebug
   # APK: android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Building Release APK

```bash
cd android
./gradlew assembleRelease
# Requires keystore configuration in build.gradle
```

### Permissions Configuration

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
```

## 🧪 Testing Offline Mode

### Scenario A: Offline First, Then Online

1. Open app in Chrome
2. DevTools → Network → Mark "Offline"
3. Refresh page
4. ✅ App loads with cache
5. Fill inspection form
6. Click "Save Inspection"
7. ✅ Inspection saved with PENDING_SYNC status
8. Uncheck "Offline"
9. App auto-syncs
10. ✅ Status changes to SYNCED

### Scenario B: Multiple Inspections, Batch Sync

1. Go offline
2. Create 3 inspections
3. All show PENDING_SYNC
4. Go online
5. App syncs sequentially
6. Each inspection transitions to SYNCED

### Scenario C: Network Fails During Sync

1. Go online
2. Start sync
3. Simulate network failure (DevTools → Offline)
4. ✅ Sync pauses gracefully
5. No data lost
6. Sync resumes on network restore

### Scenario D: API Error Handling

1. Configure bad API URL in .env
2. Create inspection online
3. Sync attempts fail
4. ✅ Status remains PENDING_SYNC
5. ✅ No data deleted
6. ✅ Can retry sync

## 🔐 Security & Data

### Data Protection
- ✅ No sensitive data stored
- ✅ No passwords saved locally
- ✅ IndexedDB isolated per origin
- ✅ HTTPS required for production PWA

### Environment Security
- ✅ .env excluded from git
- ✅ No API keys hardcoded
- ✅ Use .env.example template
- ✅ Backend validates all data

### Content Security
- ✅ HTML escaped to prevent XSS
- ✅ Input validation on form
- ✅ No eval() or dangerous APIs
- ✅ CSP headers recommended

## 📊 API Endpoints

### Required Backend Endpoints

```
POST /api/inspections
  Request: { Inspection object }
  Response: { success: boolean, data?: Inspection, error?: string }

GET /api/inspections
  Response: { success: boolean, data: Inspection[], error?: string }

GET /api/health
  Response: { status: "ok" } or 503
```

### Example Backend (Express.js)

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// In-memory storage (replace with database)
let inspections = [];

app.post('/api/inspections', (req, res) => {
  const inspection = req.body;
  inspections.push(inspection);
  res.json({ success: true, data: inspection });
});

app.get('/api/inspections', (req, res) => {
  res.json({ success: true, data: inspections });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(3000, () => console.log('Server running on :3000'));
```

## 🚢 Deployment

### Static Hosting (No Backend)

**Vercel** (Recommended)
```bash
npm install -g vercel
npm run build
vercel deploy
```

**Netlify**
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

**Cloudflare Pages**
```bash
# Connect GitHub repo, set build command:
npm run build
# Deploy directory: dist
```

### With Backend Server

1. Deploy backend to your server
2. Set `VITE_API_BASE_URL` in production .env
3. Deploy frontend to CDN
4. Update CORS headers on backend if needed

### Production Checklist

- [ ] `npm run build` succeeds without errors
- [ ] No TypeScript compilation errors
- [ ] Service Worker registered
- [ ] manifest.webmanifest valid
- [ ] Icons exist (192x192, 512x512)
- [ ] HTTPS enabled
- [ ] PWA installable
- [ ] Offline mode tested
- [ ] API endpoints configured
- [ ] No console errors
- [ ] Mobile responsive tested
- [ ] Performance optimized (Lighthouse)

## 🐛 Troubleshooting

### App Won't Start
**Error**: "App container not found"
- **Fix**: Ensure `<div id="app"></div>` in index.html

### Service Worker Not Registering
**Error**: "Service Worker registration failed"
- **Cause**: Not on HTTPS in production (http://localhost OK)
- **Fix**: Deploy with HTTPS or test locally

### IndexedDB Errors
**Error**: "Failed to open database"
- **Cause**: Private browsing mode or storage disabled
- **Fix**: Use normal browsing mode, check storage settings

### Camera Permission Denied
**Error**: "Camera error"
- **Cause**: Permission not granted or not on HTTPS
- **Fix**: Grant permission or use fallback file input

### Sync Not Working
**Error**: "Sync failed"
- **Cause**: Backend not reachable or API mismatch
- **Fix**: Check API URL in .env, verify backend running

### Icons Not Showing
**Error**: 404 on icon files
- **Cause**: Files not in public/icons/
- **Fix**: Generate or create icon PNG files (192x192, 512x512)

## 📄 Environment Variables

### `.env` Configuration

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# Optional
DEBUG=false
CACHE_VERSION=v1
```

### For Production

```env
VITE_API_BASE_URL=https://api.example.com
```

## 📚 Additional Resources

- [MDN: Service Workers](https://developer.mozilla.org/docs/Web/API/Service_Worker_API)
- [MDN: IndexedDB](https://developer.mozilla.org/docs/Web/API/IndexedDB_API)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Capacitor Docs](https://capacitorjs.com)
- [Vite Guide](https://vitejs.dev)

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push branch: `git push origin feature/your-feature`
4. Create Pull Request

## 📝 License

This project is for educational purposes at VKU.

## 👥 Author

Created as Mini-Project #1 for "Phát triển đa nền tảng" (Cross-Platform Development) course.

---

## 🎓 For Instructors

### Project Evaluation Points

1. **Offline-First Architecture** - Full local storage and sync
2. **IndexedDB Implementation** - Proper database schema
3. **Service Worker** - Cache strategy and offline support
4. **PWA Manifest** - Valid, installable PWA
5. **Capacitor Integration** - Camera, GPS, Android ready
6. **Code Quality** - Modular, typed, well-documented
7. **UI/UX** - Mobile-responsive, professional
8. **Error Handling** - Graceful failures, user feedback
9. **Testing** - Offline scenarios covered
10. **Documentation** - Complete README and code comments

### Demo Scenarios

1. **Offline Mode**: Show saving inspections without internet
2. **Auto Sync**: Restore internet, observe automatic sync
3. **Photo Capture**: Demonstrate camera functionality
4. **Location**: Show GPS coordinates being captured
5. **Status Tracking**: Explain PENDING_SYNC → SYNCED flow
6. **Responsive Design**: Show on different screen sizes
7. **PWA Install**: Demonstrate installable app experience

---

**Last Updated**: 2026-09-01  
**Version**: 1.0.0
