const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("calendar", {
  fetchICS: (url) => ipcRenderer.invoke("fetch-ics", url),
});
