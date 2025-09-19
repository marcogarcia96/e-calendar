const { app, BrowserWindow } = require('electron');

app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 600, height: 400,fullscreen:true, autoHideMenuBar: true });
  win.setMenu(null);

  win.loadURL("http://localhost:3000");
});