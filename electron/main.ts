import { app, BrowserWindow, shell, ipcMain } from 'electron';
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
      preload: path.join(__dirname, 'preload.js'),
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
