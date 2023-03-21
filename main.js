const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const url = require('url')
const ready = require('./server/util/ready')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ transparent: true, resizable: false, width: 1000, height: 720 })
  win.setMenu(null);

  ready.init((available, permission) => {
    // and load the index.html of the app.
    win.loadURL(url.format({
      pathname: path.join(__dirname, permission ? (available ? 'pages/index.html' : 'pages/regist.html') : 'pages/blank.html'),
      protocol: 'file:',
      slashes: true
    }))
  })

  // Open the DevTools.
  // win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('close', () => {
    require('./server/util/count').serialize();
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

require('./server/user')(ipcMain, app);
require('./server/logout')(ipcMain, app);
require('./server/staff')(ipcMain, app);
require('./server/gongxu')(ipcMain, app);
require('./server/rw')(ipcMain, app);
require('./server/download')(ipcMain, app);