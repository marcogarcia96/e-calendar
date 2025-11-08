const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  fetchICS: (url) => ipcRenderer.invoke("fetch-ics", url),
});
