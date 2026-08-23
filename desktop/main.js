const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 3001;
let backendProc = null;

function startBackend() {
  const entry = path.join(ROOT, 'backend', 'src', 'index.js');
  backendProc = spawn('node', [entry], {
    cwd: path.join(ROOT, 'backend'),
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: 'inherit'
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'TruckControl',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadURL(`http://127.0.0.1:${PORT}/`);
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  startBackend();
  setTimeout(createWindow, 2500);
});

app.on('window-all-closed', () => {
  if (backendProc) backendProc.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
