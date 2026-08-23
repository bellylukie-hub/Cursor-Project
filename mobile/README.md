# TruckControl Mobile (Capacitor)

Wraps the TruckControl web app for **iOS**, **Android**, and mobile browsers.

## Quick install (PWA)

1. Open the app URL in Chrome (Android) or Safari (iOS).
2. Use **Add to Home Screen** / **Install app**.
3. The `manifest.webmanifest` and offline cache keep core UI available on poor networks.

## Native builds (Capacitor)

Requirements: Node 20+, Android Studio and/or Xcode.

```bash
cd mobile
npm install
npx cap add android
npx cap add ios
npm run sync
npx cap open android   # or ios
```

Build release APK/AAB or IPA from Android Studio / Xcode.

## Offline

- Local data is stored in the device browser/Capacitor WebView storage.
- `offline-sync.js` replays email/chat when connectivity returns.
