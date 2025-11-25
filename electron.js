// electron.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const Database = require("better-sqlite3");

// Node-fetch fallback
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

let mainWindow;
let db;

/**
 * Initialize local SQLite database
 */
function initDatabase() {
  const dbPath = path.join(app.getPath("userData"), "notes.db");
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body  TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Create main fullscreen window
 */
function createWindow() {
  const iconPath = path.join(__dirname, "assets", "icons", "pi-calendar.png"); // ✅ ADD THIS

  mainWindow = new BrowserWindow({
    title: "E-Calendar",
    width: 1200,
    height: 800,
    fullscreen: true,
    autoHideMenuBar: true,

    // ✅ Raspberry Pi / Linux / Windows / macOS icon support
    icon: iconPath,

    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, "preload.js"),
    }
  });

  mainWindow.loadURL("http://localhost:3000");
}

/**
 * ICS fetch (CORS-free)
 */
ipcMain.handle("fetch-ics", async (_event, url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    console.error("❌ Error fetching ICS:", err);
    throw err;
  }
});

/**
 * Notes API
 */
ipcMain.handle("notes:list", () => {
  return db.prepare(
    "SELECT id, title, updated_at FROM notes ORDER BY updated_at DESC"
  ).all();
});

ipcMain.handle("notes:get", (_event, id) => {
  return db.prepare("SELECT * FROM notes WHERE id = ?").get(id);
});

ipcMain.handle("notes:save", (_event, note) => {
  const title = note.title?.trim() || "Untitled note";
  const body = note.body || "";

  if (note.id) {
    db.prepare(`
      UPDATE notes SET title=?, body=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
    `).run(title, body, note.id);
    return note.id;
  }

  const info = db.prepare(
    "INSERT INTO notes (title, body) VALUES (?, ?)"
  ).run(title, body);

  return info.lastInsertRowid;
});

ipcMain.handle("notes:delete", (_event, id) => {
  db.prepare("DELETE FROM notes WHERE id=?").run(id);
  return true;
});

/**
 * App lifecycle
 */
app.whenReady().then(() => {
  initDatabase();
  createWindow();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
