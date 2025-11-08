// electron.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

// ✅ Node-fetch for ICS (Node doesn't have fetch by default)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    title: "E-Calendar",
    width: 1200,
    height: 800,
    fullscreen: true,         // can change to true later if you want fullscreen
    autoHideMenuBar: true,
    webPreferences: {
       contextIsolation: true,
  sandbox: false,                // ✅ REQUIRED IN NEW ELECTRON VERSIONS
  nodeIntegration: false,
  enableRemoteModule: true,
  preload: path.join(__dirname, "preload.js"),  // ✅ makes window.electronAPI available
    },
  });

  // ✅ load React dev server
  mainWindow.loadURL("http://localhost:3000");

  // Uncomment if you want to see DevTools automatically:
  // mainWindow.webContents.openDevTools();
}

// ✅ CORS-free ICS fetch via main process (Electron bypasses CORS)
ipcMain.handle("fetch-ics", async (_event, url) => {
  try {
    if (!url || typeof url !== "string") {
      throw new Error("Invalid ICS URL");
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    return text;
  } catch (err) {
    console.error("❌ Error fetching ICS:", err);
    throw err;
  }
});

app.whenReady().then(createWindow);

// ✅ re-create window if clicked on dock icon (Mac behavior)
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ✅ fully quit app on close (except on Mac)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
