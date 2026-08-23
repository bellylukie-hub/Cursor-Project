# TruckControl Desktop

Installable desktop app for **Windows**, **Linux**, and **macOS** using Electron.

## Run from source

```bash
cd backend && npm install && cd ..
cd desktop && npm install && npm start
```

The desktop shell starts the local Node API and opens TruckControl in a native window.

## Build installers

```bash
cd desktop
npm run dist:win     # Windows NSIS + zip
npm run dist:linux   # Linux AppImage + zip
npm run dist:mac     # macOS dmg + zip (on macOS)
```

## Offline / local network

- The embedded backend uses SQLite on disk (`backend/data`).
- Works on LAN without internet once installed.
- Email/chat sync via `offline-sync.js` when WAN returns.

## Notes

- macOS builds require a Mac with Xcode tooling.
- Windows builds can be produced on Windows or cross-built with wine for NSIS.
