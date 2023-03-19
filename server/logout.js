module.exports = function (ipcMain, app) {
  ipcMain.on('logout', function (evt) {
    app.quit();
  })
}