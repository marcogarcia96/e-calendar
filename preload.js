const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  fetchICS: (url) => ipcRenderer.invoke("fetch-ics", url),
});

contextBridge.exposeInMainWorld("notesAPI", {
  list: () => ipcRenderer.invoke("notes:list"),
  get: (id) => ipcRenderer.invoke("notes:get", id),
  save: (note) => ipcRenderer.invoke("notes:save", note),
  delete: (id) => ipcRenderer.invoke("notes:delete", id),
});
