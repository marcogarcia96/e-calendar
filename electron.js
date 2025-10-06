// electron.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

// keep only ONE import of { app, BrowserWindow, ipcMain } above

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // DEV: React dev server
  mainWindow.loadURL("http://localhost:3000");
  // mainWindow.webContents.openDevTools(); // optional for debugging
}

// CORS-free ICS fetch handled in main process
ipcMain.handle("fetch-ics", async (_event, url) => {
  if (!/^https:\/\/.+\.ics(\?.*)?$/i.test(url || "")) {
    throw new Error("Invalid ICS URL");
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
});

app.whenReady().then(createWindow);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
