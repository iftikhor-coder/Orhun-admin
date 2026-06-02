import { app, BrowserWindow, shell, ipcMain, net } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { secureStorage } from './secure-storage';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(__dirname, '../public')
  : path.join(__dirname, '../dist');

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'Orhun AI Admin',
    backgroundColor: '#060b1a',
    icon: path.join(VITE_PUBLIC, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(VITE_PUBLIC, 'index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

// === Umumiy IPC ===
ipcMain.handle('app:get-version', () => app.getVersion());
ipcMain.handle('app:open-external', (_e, url: string) => {
  if (url.startsWith('http')) shell.openExternal(url);
});

// === Secure Storage IPC (DPAPI) ===
ipcMain.handle('secure:isSetupCompleted', () => secureStorage.isSetupCompleted());
ipcMain.handle('secure:getLastEmail',     () => secureStorage.getLastEmail());
ipcMain.handle('secure:setupPin',  (_e, pin: string, email: string) => secureStorage.setupPin(pin, email));
ipcMain.handle('secure:verifyPin', (_e, pin: string) => secureStorage.verifyPin(pin));
ipcMain.handle('secure:getLockStatus', () => secureStorage.getLockStatus());
ipcMain.handle('secure:saveSession',   (_e, sessionJson: string) => secureStorage.saveSession(sessionJson));
ipcMain.handle('secure:loadSession',   () => secureStorage.loadSession());
ipcMain.handle('secure:clearSession',  () => secureStorage.clearSession());
ipcMain.handle('secure:resetAll',      () => secureStorage.resetAll());



// === IP Geolocation (main process — CSP yo'q, https module) ===
ipcMain.handle('app:get-geo', (_e, ip: string) => {
  return new Promise((resolve) => {
    console.log('[geo] IP:', ip);
    // Electron net module — CSP yoq, https/http ishlaydi
    const url = 'http://ip-api.com/json/' + ip +
      '?fields=status,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org';
    const req = net.request(url);
    let raw = '';
    req.on('response', (res) => {
      res.on('data', (chunk) => { raw += chunk.toString(); });
      res.on('end', () => {
        try {
          const d = JSON.parse(raw);
          console.log('[geo] Natija:', d.status, d.city, d.country);
          if (d.status !== 'success') { resolve(null); return; }
          resolve({
            latitude:     d.lat,
            longitude:    d.lon,
            city:         d.city         || '',
            region:       d.regionName   || '',
            country_name: d.country      || '',
            country_code: d.countryCode  || '',
            timezone:     d.timezone     || '',
            org:          d.org || d.isp || '',
            postal:       d.zip          || '',
          });
        } catch { resolve(null); }
      });
    });
    req.on('error', (e: any) => {
      console.log('[geo] Xato:', e.message);
      resolve(null);
    });
    setTimeout(() => { try { req.abort(); } catch {} resolve(null); }, 8000);
    req.end();
  });
});

// === Map oynasi ===
ipcMain.handle('app:open-map', (
  _e, lat: number, lng: number, label: string,
  ip = '', city = '', country = '', org = '', tz = ''
) => {
  const q = new URLSearchParams({
    lat: String(lat), lng: String(lng), label,
    ip, city, country, org, tz, zoom: '13',
  }).toString();

  const mapWin = new BrowserWindow({
    width: 1280, height: 820,
    title: 'Orhun AI — ' + label,
    autoHideMenuBar: true,
    backgroundColor: '#060b1a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    mapWin.loadURL(VITE_DEV_SERVER_URL.replace(/\/$/, '') + '/map.html?' + q);
  } else {
    mapWin.loadFile(path.join(VITE_PUBLIC, 'map.html'), { query: { lat: String(lat), lng: String(lng), label, ip, city, country, org, tz, zoom: '13' } });
  }
});

// === App lifecycle ===
app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
