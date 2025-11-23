// electron.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const Database = require("better-sqlite3");   // ✅ SQLite

// ✅ Node-fetch for ICS (Node doesn't have fetch by default in some environments)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

let mainWindow;
let db;  // ✅ will hold our SQLite connection

/**
 * Initialize local SQLite database in app's userData folder.
 * This file (notes.db) persists across restarts and power loss.
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
 * Create main fullscreen window.
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    title: "E-Calendar",
    width: 1200,
    height: 800,
    fullscreen: true, // you already had this
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: false,            // ✅ as you had
      nodeIntegration: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, "preload.js"), // ✅ window.electronAPI / window.notesAPI, etc.
    },
  });

  // ✅ load React dev server
  mainWindow.loadURL("http://localhost:3000");

  // mainWindow.webContents.openDevTools(); // optional
}

/**
 * ✅ CORS-free ICS fetch via main process (unchanged)
 */
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

/**
 * ✅ NOTES IPC HANDLERS (backed by SQLite)
 */

// list titles for dashboard
ipcMain.handle("notes:list", () => {
  const stmt = db.prepare(
    "SELECT id, title, updated_at FROM notes ORDER BY updated_at DESC"
  );
  return stmt.all();
});

// get full note (title + body)
ipcMain.handle("notes:get", (_event, id) => {
  const stmt = db.prepare("SELECT * FROM notes WHERE id = ?");
  return stmt.get(id);
});

// create or update note
ipcMain.handle("notes:save", (_event, note) => {
  const safeTitle = note.title && note.title.trim() ? note.title.trim() : "Untitled note";
  const safeBody = note.body || "";

  if (note.id) {
    // update existing
    const stmt = db.prepare(`
      UPDATE notes
      SET title = ?, body = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(safeTitle, safeBody, note.id);
    return note.id;
  } else {
    // insert new
    const stmt = db.prepare(`
      INSERT INTO notes (title, body)
      VALUES (?, ?)
    `);
    const info = stmt.run(safeTitle, safeBody);
    return info.lastInsertRowid;
  }
});

// delete note
ipcMain.handle("notes:delete", (_event, id) => {
  const stmt = db.prepare("DELETE FROM notes WHERE id = ?");
  stmt.run(id);
  return true;
});

/**
 * App lifecycle
 */
app.whenReady().then(() => {
  initDatabase();   // ✅ make sure DB exists
  createWindow();   // ✅ then open window
});

// ✅ re-create window if clicked on dock icon (Mac behavior)
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ✅ fully quit app on close (except on Mac)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
