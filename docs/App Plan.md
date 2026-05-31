# Tamroi — Mobile App Transition Plan
> Phase 2: "The Immersive Leap" · NSC 2026 · ทีม ปลามึกยักษ์

---

## What We're Building

Converting the Tamroi web MVP into a **native cross-platform iOS + Android app** with:
- Augmented Reality figure captures (device camera)
- Background GPS for lore proximity alerts (even when app is closed)
- QR code scanning at OTOP / café outposts
- Offline map caching for rural areas
- Native push notifications

The Supabase backend (PostgreSQL schema, Auth, RLS, Realtime) carries forward **unchanged**. Only the frontend is rebuilt.

---

## Tech Stack Decision

### Why React Native + Expo?

| Option | Pros | Cons | Decision |
|---|---|---|---|
| **React Native + Expo** | JS/TS carries over from web, large ecosystem, Expo EAS handles builds + store submissions, Supabase RN SDK exists | AR support requires bare workflow | **✅ Chosen** |
| Flutter | Fast, native-feel UI | Dart is a new language; team knows JS | ❌ Extra learning cost |
| Swift / Kotlin native | Maximum performance | Two separate codebases | ❌ Too expensive for a team of 3 |
| Capacitor (web-wrapped) | Reuse existing HTML/JS directly | AR/background GPS are weak in webview | ❌ Not immersive enough for Phase 2 |

**React Native with Expo** is the right call because:
1. The team already knows JavaScript — TypeScript is a natural upgrade
2. Supabase has a first-party `@supabase/supabase-js` SDK that works identically in React Native
3. Expo EAS Build + EAS Submit handles the entire build pipeline and store submission without needing a Mac for Android
4. The existing DB schema, RLS policies, and Realtime subscriptions require zero changes

---

## Language

**TypeScript** (strict mode) — not plain JavaScript.

Reasons:
- Catches type errors at compile time (Supabase query results, GPS coordinates, figure class enums)
- Expo and React Native templates default to TypeScript
- Easier to maintain when the codebase grows across Phase 3 and 4

**Where Thai appears:** UI label strings only (`strings/th.ts`). All code, types, and file names stay in English.

---

## Core Dependencies

```
Framework:        React Native 0.74+     via Expo SDK 51
Language:         TypeScript 5.x
Navigation:       React Navigation 6     (@react-navigation/native, @react-navigation/bottom-tabs)
Map:              react-native-maps      (replaces Leaflet.js — uses Google Maps / Apple Maps)
AR:               ViroReact             (@viro-community/react-viro — ARKit/ARCore wrapper)
Camera / QR:      react-native-vision-camera  (QR scanning + AR feed)
GPS (background): expo-location          (foreground) + expo-task-manager (background)
Push Notifs:      expo-notifications     (handles FCM + APNs in one API)
Supabase:         @supabase/supabase-js  (same package as web, same config)
State:            Zustand                (lightweight, replaces IIFE module pattern)
Async Storage:    @react-native-async-storage/async-storage  (session persistence)
Build / Deploy:   Expo EAS Build + EAS Submit
```

---

## Architecture Overview

```
tamroi-app/
│
├── app/                      Expo Router file-based navigation
│   ├── (auth)/
│   │   ├── index.tsx         Splash screen
│   │   ├── login.tsx         Login + Register (email + Google)
│   │   └── onboarding.tsx    Location permission + home district picker
│   └── (tabs)/
│       ├── map.tsx           Map tab — react-native-maps + Fog of War
│       ├── collection.tsx    Collection grid + Lore Journal
│       ├── missions.tsx      Quest list + daily challenges
│       └── leaderboard.tsx   Podium + ranked list
│
├── components/               Shared UI components
│   ├── FogLayer.tsx          Custom map overlay polygon
│   ├── WatchtowerMarker.tsx  Map marker (checked/unchecked state)
│   ├── NodeInfoSheet.tsx     Bottom sheet for café/OTOP/landmark
│   ├── LoreSheet.tsx         Lore unlock bottom sheet
│   ├── QuizModal.tsx         C-Class quiz + Master Quiz
│   ├── ARCaptureScene.tsx    ViroReact AR figure encounter
│   ├── FigureCard.tsx        Collection grid card
│   └── Toast.tsx             Non-blocking toast notification
│
├── store/                    Zustand state stores
│   ├── authStore.ts          User session + profile
│   ├── mapStore.ts           Fog state, cleared districts, GPS position
│   ├── collectionStore.ts    Captured figures, artifacts, lore journal
│   └── notifStore.ts         Notification list + badge count
│
├── lib/
│   ├── supabase.ts           Supabase client singleton (same DB.* API as web)
│   ├── haversine.ts          haversineDistance() helper (copy from web)
│   └── loreProximity.ts      Background lore check task definition
│
├── strings/
│   └── th.ts                 All Thai-language UI labels
│
├── assets/                   Icons, splash, fonts (Inter + Kanit)
│
├── app.json                  Expo config (bundle ID, permissions, plugins)
├── eas.json                  EAS Build profiles (development / preview / production)
└── tsconfig.json
```

---

## Migrating Each Feature from Web to App

### 1. Authentication

**Web:** Supabase JS SDK in `supabase-client.js`
**App:** Same SDK, same calls — just swap `window.DB.Auth` for the Zustand `authStore`

```ts
// lib/supabase.ts — identical config to web env.js
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,       // persists session in device storage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,   // no browser URL in RN
  },
})
```

Google OAuth in React Native requires `expo-auth-session` + `expo-web-browser` instead of the redirect flow.

---

### 2. Map + Fog of War

**Web:** Leaflet.js with inverted polygon
**App:** `react-native-maps` with custom `Polygon` overlay

```tsx
// components/FogLayer.tsx
import { Polygon } from 'react-native-maps'

// Same logic: full-world bounding box with district-shaped holes cut out
// Cleared districts are passed as holes[] in the Polygon component
<Polygon
  coordinates={WORLD_BOUNDS}
  holes={clearedDistrictPolygons}
  fillColor="rgba(20,20,25,0.75)"
  strokeWidth={0}
/>
```

The `DB.Districts.getUserState()` and `DB.Districts.checkIn()` calls are identical — same Supabase tables, same RLS.

---

### 3. GPS (Foreground + Background)

**Foreground (map dot):**
```ts
import * as Location from 'expo-location'

await Location.requestForegroundPermissionsAsync()
Location.watchPositionAsync({ accuracy: Location.Accuracy.High }, (pos) => {
  mapStore.setUserPosition(pos.coords)
  checkLoreProximity(pos.coords)   // same haversine logic as web
})
```

**Background (lore proximity alerts while app is closed):**
```ts
// lib/loreProximity.ts
import * as TaskManager from 'expo-task-manager'
import * as Location from 'expo-location'

const BACKGROUND_LORE_TASK = 'background-lore-check'

TaskManager.defineTask(BACKGROUND_LORE_TASK, async ({ data }) => {
  const { locations } = data
  const pos = locations[0].coords
  const nearby = LORE_NODES.filter(n => haversineDistance(pos, n) <= n.radius_m)
  for (const node of nearby) {
    await sendPushNotification(`ใกล้ ${node.title} แล้ว! เปิดแอปเพื่อปลดล็อค Lore`)
  }
})

// Register on app start:
await Location.requestBackgroundPermissionsAsync()
await Location.startLocationUpdatesAsync(BACKGROUND_LORE_TASK, {
  accuracy: Location.Accuracy.Balanced,
  distanceInterval: 50,          // fire every 50m movement
  showsBackgroundLocationIndicator: true,
})
```

---

### 4. AR Figure Capture (New in Phase 2)

Replaces the simple quiz modal with an immersive AR encounter.

```tsx
// components/ARCaptureScene.tsx
import Viro from '@viro-community/react-viro'

// Workflow:
// 1. Open AR camera when user enters figure encounter
// 2. Render 3D historical figure model floating in real world
// 3. Player taps the figure to "capture" → triggers quiz overlay on top of AR view
// 4. Correct answer → capture animation → figure absorbed into collection

export function ARCaptureScene({ figure, onCapture }) {
  return (
    <Viro.ViroARScene>
      <Viro.ViroAmbientLight color="#ffffff" />
      <Viro.Viro3DObject
        source={{ uri: figure.model3dUrl }}
        position={[0, 0, -2]}
        animation={{ name: 'idle', run: true, loop: true }}
        onClick={() => setShowQuiz(true)}
      />
      {showQuiz && <QuizOverlay figure={figure} onSuccess={onCapture} />}
    </Viro.ViroARScene>
  )
}
```

> **3D Assets:** Start with free CC0 Thai historical figure models from Sketchfab, or commission low-poly models. Store in Supabase Storage and reference via `figures.model3d_url` column (add in Phase 2 DB migration).

---

### 5. QR Code Scanning at Outposts

**Purpose:** Replace the "Visit" button tap with a physical QR scan at the real-world café/OTOP location — proves the player was actually there.

```tsx
import { useCameraPermission, useCodeScanner, Camera } from 'react-native-vision-camera'

function QRScannerScreen({ onScan }) {
  const { hasPermission, requestPermission } = useCameraPermission()
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      // QR payload: { nodeId: "silom-cafe-01", districtId: "silom", nodeType: "cafe" }
      const payload = JSON.parse(codes[0].value)
      DB.Districts.updateNodeVisit(userId, payload.districtId, payload.nodeType, payload.nodeId)
      onScan(payload)
    }
  })

  return <Camera device={device} isActive codeScanner={codeScanner} style={StyleSheet.absoluteFill} />
}
```

Each physical outpost gets a printed QR code generated from a simple admin script that encodes `{ nodeId, districtId, nodeType }`.

---

### 6. Push Notifications

**Web:** In-app only (Supabase Realtime badge)
**App:** Native push via Expo + FCM (Android) + APNs (iOS)

```ts
// Setup (run once on app start):
import * as Notifications from 'expo-notifications'

async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== 'granted') return

  const token = (await Notifications.getExpoPushTokenAsync()).data
  // Save token to profiles.push_token in Supabase
  await DB.Profiles.update(userId, { push_token: token })
}
```

**Trigger push from Supabase Edge Function** (server-side, not client):
```ts
// supabase/functions/send-push/index.ts
const message = {
  to: profile.push_token,
  title: 'ตัวละครใหม่ใกล้คุณแล้ว!',
  body: `${figure.name_th} อยู่ห่างจากคุณเพียง 200 เมตร`,
  data: { figureId: figure.id, screen: 'map' },
}
await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(message),
})
```

---

## Environment Setup

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20 LTS | [nodejs.org](https://nodejs.org) |
| npm | 10+ | Comes with Node |
| Expo CLI | Latest | `npm install -g expo-cli` |
| EAS CLI | Latest | `npm install -g eas-cli` |
| Android Studio | Latest | For Android emulator + SDK |
| Xcode | 15+ | Mac only — for iOS simulator |
| Java JDK | 17 | Required by Android SDK |

### Initial Project Setup

```bash
# 1. Create new Expo project with TypeScript template
npx create-expo-app tamroi-app --template expo-template-blank-typescript
cd tamroi-app

# 2. Install core navigation
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context

# 3. Install map
npm install react-native-maps

# 4. Install Supabase
npm install @supabase/supabase-js @react-native-async-storage/async-storage

# 5. Install camera + QR
npm install react-native-vision-camera

# 6. Install location + background tasks
npx expo install expo-location expo-task-manager

# 7. Install push notifications
npx expo install expo-notifications

# 8. Install AR (requires bare workflow — eject from Expo Go)
npm install @viro-community/react-viro

# 9. Install state management
npm install zustand

# 10. Install bottom sheet
npm install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler

# 11. Eject to bare workflow (needed for AR + background GPS native modules)
npx expo prebuild
```

### Android Studio Setup

1. Download Android Studio from [developer.android.com/studio](https://developer.android.com/studio)
2. SDK Manager → install **Android 14 (API 34)** SDK
3. AVD Manager → create a **Pixel 8** emulator with API 34
4. Add to system PATH:
   ```bash
   # Windows (PowerShell profile)
   $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
   $env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator"
   ```

### Environment Variables

Create `.env.local` at project root (never commit this):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...   (for react-native-maps on Android)
```

Access in code:
```ts
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
)
```

### app.json — Required Permissions

```json
{
  "expo": {
    "name": "ตามรอย",
    "slug": "tamroi",
    "version": "1.0.0",
    "android": {
      "package": "com.plamukyang.tamroi",
      "versionCode": 1,
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "CAMERA",
        "VIBRATE",
        "RECEIVE_BOOT_COMPLETED"
      ],
      "config": {
        "googleMaps": { "apiKey": "$(EXPO_PUBLIC_GOOGLE_MAPS_API_KEY)" }
      }
    },
    "ios": {
      "bundleIdentifier": "com.plamukyang.tamroi",
      "infoPlist": {
        "NSLocationAlwaysAndWhenInUseUsageDescription": "ใช้ตำแหน่งเพื่อปลดล็อค Fog of War และแจ้งเตือน Lore ใกล้คุณ",
        "NSLocationWhenInUseUsageDescription": "ใช้ตำแหน่งเพื่อแสดงจุดของคุณบนแผนที่",
        "NSCameraUsageDescription": "ใช้กล้องเพื่อสแกน QR Code และจับตัวละครผ่าน AR"
      }
    },
    "plugins": [
      ["expo-location", { "locationAlwaysAndWhenInUsePermission": "..." }],
      ["expo-notifications", { "sounds": ["assets/sounds/capture.wav"] }],
      "react-native-vision-camera"
    ]
  }
}
```

---

## Running Locally

```bash
# Start dev server
npx expo start

# Run on Android emulator (must be running in Android Studio)
npx expo run:android

# Run on iOS simulator (Mac only)
npx expo run:ios

# Run on physical device — scan QR with Expo Go app
# Note: AR + background GPS require a real device, not Expo Go
# Use development build instead:
eas build --profile development --platform android
# Install the .apk on your Android device, then:
npx expo start --dev-client
```

---

## Build for Production

### 1. Set Up EAS

```bash
# Login to your Expo account
eas login

# Configure EAS for this project (run once)
eas build:configure
```

This creates `eas.json`:
```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" },
      "ios": { "credentialsSource": "remote" }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### 2. Build Android APK (for testing / internal)

```bash
# Build .apk for internal testing (no Play Store needed)
eas build --profile preview --platform android

# EAS builds in the cloud — no local Android Studio needed
# Download link appears when done (~10–20 min)
# Install .apk directly on Android device
```

### 3. Build Android App Bundle (for Play Store)

```bash
# Build .aab (required by Play Store)
eas build --profile production --platform android
```

### 4. Build iOS (Mac or EAS cloud)

```bash
# iOS needs Apple Developer account ($99/year)
eas build --profile production --platform ios
```

---

## Publishing to Google Play Store

### Step-by-Step

**Step 1 — Create a Google Play Developer Account**
1. Go to [play.google.com/console](https://play.google.com/console)
2. Pay the one-time $25 registration fee (Google account required)
3. Complete identity verification (1–3 days)

**Step 2 — Create a New App**
1. Play Console → "Create app"
2. App name: `ตามรอย (Tamroi)`
3. Default language: `Thai (th)`
4. App type: `App` (not game, for Play Store categorization)
5. Free or paid: `Free`

**Step 3 — Set Up Internal Testing Track**
1. Release → Testing → Internal testing → Create new release
2. Upload the `.aab` file from EAS Build
3. Add testers (team members' Gmail accounts)
4. Publish to internal track — no review needed, available in minutes

**Step 4 — Complete Store Listing**
Required before moving to production:

| Section | What to fill |
|---|---|
| App details | Short description (80 chars), full description |
| Graphics | App icon 512×512 px · Feature graphic 1024×500 px · At least 2 phone screenshots |
| Categorization | Category: `Education` or `Travel & Local` |
| Contact details | Email address for users |
| Privacy policy | Required — host a simple page on GitHub Pages or Vercel |

**Step 5 — Content Rating**
1. Policy → App content → Content rating
2. Fill out the IARC questionnaire (~5 min)
3. Rating will be `Everyone` or `Everyone 10+`

**Step 6 — Data Safety**
1. Policy → App content → Data safety
2. Declare what data you collect:
   - Location (precise, in background) — required for fog/lore
   - Personal info (name/email for account) — optional, users can delete
3. Confirm you use Supabase RLS (data is encrypted in transit)

**Step 7 — Closed Testing → Open Testing → Production**
```
Internal track (team only, minutes)
  → Closed testing (select testers, 1 day review)
    → Open testing (public opt-in, 1 day review)
      → Production (full rollout, 3–7 day review)
```

**Step 8 — Submit via EAS (automated)**
```bash
# After production build completes:
eas submit --platform android --latest

# EAS reads google-play-service-account.json and uploads to Play Console automatically
```

**Getting the Service Account Key:**
1. Play Console → Setup → API access → Link to Google Cloud project
2. Google Cloud Console → IAM → Create service account
3. Grant role: `Release Manager`
4. Create JSON key → download as `google-play-service-account.json`
5. Add to project root (add to `.gitignore` — never commit)

---

## Publishing to Apple App Store

### Requirements
- Apple Developer Program membership: **$99/year** at [developer.apple.com](https://developer.apple.com)
- Mac computer (or use EAS cloud build — no Mac needed for build, but App Store Connect still requires Apple ID)

### Step-by-Step

**Step 1 — Enroll in Apple Developer Program**
1. Go to [developer.apple.com/programs](https://developer.apple.com/programs)
2. Sign in with Apple ID → Enroll → pay $99
3. Verification takes 24–48 hours

**Step 2 — Create App ID**
1. Certificates, Identifiers & Profiles → Identifiers → (+)
2. Bundle ID: `com.plamukyang.tamroi`
3. Enable capabilities: Push Notifications, Background Modes (Location updates)

**Step 3 — Create App in App Store Connect**
1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → My Apps → (+)
2. Platform: iOS
3. Bundle ID: select `com.plamukyang.tamroi`
4. SKU: `tamroi-2026` (internal, not shown publicly)

**Step 4 — Build + Submit via EAS**
```bash
# EAS handles provisioning profiles and signing automatically
eas build --profile production --platform ios

# Submit to App Store Connect:
eas submit --platform ios --latest
```

**Step 5 — App Store Listing**
| Section | Requirement |
|---|---|
| App name | `ตามรอย - Tamroi` (max 30 chars) |
| Subtitle | `สำรวจประวัติศาสตร์ไทย` (max 30 chars) |
| Description | Full gameplay description in Thai + English |
| Keywords | `thailand,history,travel,map,game` (max 100 chars) |
| Screenshots | iPhone 6.7" (required) + iPhone 5.5" + iPad 12.9" (if supporting iPad) |
| App icon | 1024×1024 px, no alpha channel |
| Privacy policy URL | Required — same page used for Play Store |
| Age rating | Complete questionnaire → `4+` or `9+` |

**Step 6 — Submit for Review**
1. App Store Connect → App → Pricing and Availability → set Free
2. App Review → Submit for Review
3. Apple review takes **1–3 business days** (first submission), faster after

---

## Privacy Policy (Required for Both Stores)

Create a simple page at `https://ray0737.github.io/NSC_2026/privacy` or a Vercel route.

Minimum content required:
```
- What data we collect: email, username, GPS location
- Why: authentication, fog-of-war gameplay, lore proximity
- Where it's stored: Supabase (AWS ap-southeast-1)
- How to delete: email us at [team email] to delete your account and all data
- Third parties: Google OAuth (Google Privacy Policy)
- Contact: [team email]
```

---

## Database Changes for Phase 2

Run these SQL patches in Supabase before Phase 2 launch:

```sql
-- Add push token to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add 3D model URL to figures (for AR capture)
ALTER TABLE figures ADD COLUMN IF NOT EXISTS model3d_url TEXT;

-- Add QR code ID to support nodes (optional: verify physical visit)
ALTER TABLE districts ADD COLUMN IF NOT EXISTS qr_nodes JSONB;
-- Format: [{ "nodeId": "silom-cafe-01", "nodeType": "cafe", "name_th": "คาเฟ่ริมน้ำ" }]

-- Supabase Edge Function for server-side push notification delivery
-- (create in Supabase Dashboard → Edge Functions → New Function → "send-push")
```

---

## Testing Strategy

| Type | Tool | What to Test |
|---|---|---|
| Unit tests | Jest + `@testing-library/react-native` | Store logic, haversine, quiz scoring |
| Component tests | `@testing-library/react-native` | QuizModal, FigureCard, LoreSheet |
| E2E tests | Detox | Full login → check-in → capture flow on emulator |
| GPS mock | `expo-location` mock in Jest | Proximity trigger without moving physically |
| Supabase mock | `jest.mock('../lib/supabase')` | DB calls without hitting production |

```bash
# Run unit tests
npm test

# Run E2E (requires Android emulator running)
npx detox test --configuration android.emu.debug
```

---

## Development Roadmap (Phase 2 Sprint Plan)

### Sprint 1 — Foundation (Weeks 1–2)
- [ ] Expo bare project setup with TypeScript
- [ ] Supabase auth (email + Google OAuth via expo-auth-session)
- [ ] Bottom tab navigation (Map / Collection / Missions / Leaderboard)
- [ ] React-native-maps with CartoDB dark tiles
- [ ] Port Fog of War polygon logic from Leaflet to react-native-maps Polygon
- [ ] Foreground GPS dot on map
- [ ] Design system — port CSS variables to StyleSheet constants + React Native Paper theme

### Sprint 2 — Core Loop (Weeks 3–4)
- [ ] Watchtower check-in (500m GPS gate, same DB calls)
- [ ] Support Node visit flow (node info bottom sheet + Visit button → DB)
- [ ] Support Node completion gate
- [ ] C-Class quiz modal
- [ ] Figure capture write + legacy score trigger
- [ ] Collection grid + filter pills

### Sprint 3 — New Phase 2 Features (Weeks 5–7)
- [ ] AR capture scene (ViroReact + 3D figure models)
- [ ] QR code scanning at outposts (replace Visit button)
- [ ] Background GPS lore proximity task
- [ ] Push notification registration + Supabase Edge Function
- [ ] Lore unlock bottom sheet with image + audio

### Sprint 4 — Polish + Deploy (Week 8)
- [ ] Offline map tile caching (react-native-maps offline layer)
- [ ] App icon (1024×1024) + splash screen
- [ ] EAS production build (Android .aab + iOS .ipa)
- [ ] Internal testing track on Play Console
- [ ] TestFlight on App Store Connect
- [ ] Privacy policy page live
- [ ] Play Store listing complete → submit for review
- [ ] App Store listing complete → submit for review

---

## Cost Summary

| Item | Cost | When |
|---|---|---|
| Google Play Developer Account | $25 one-time | Before first Android submission |
| Apple Developer Program | $99/year | Before first iOS submission |
| Expo EAS Build (free tier) | Free — 30 builds/month | During development |
| Supabase (free tier) | Free — 500MB DB, 2GB bandwidth | Phase 2 MVP |
| Supabase Pro (if needed) | $25/month | When exceeding free tier |
| Google Maps API | Free up to 28,000 map loads/month | Phase 2 (react-native-maps Android) |
| 3D Figure Models | $0 (CC0) – $50–200 per model | Sourced from Sketchfab or commissioned |

**Minimum to ship on Android: $25**
**Minimum to ship on both stores: $124 ($25 + $99)**

---

## Quick Reference — Key Commands

```bash
# Local dev
npx expo start --dev-client     # start dev server (with native modules)
npx expo run:android             # build + launch on Android emulator
npx expo run:ios                 # build + launch on iOS simulator (Mac only)

# EAS cloud builds
eas build -p android --profile preview      # .apk for internal testing
eas build -p android --profile production   # .aab for Play Store
eas build -p ios    --profile production    # .ipa for App Store

# Store submission
eas submit -p android --latest   # upload .aab to Play Console
eas submit -p ios     --latest   # upload .ipa to App Store Connect

# Tests
npm test                          # Jest unit + component tests
npx detox test                   # E2E on emulator
```
