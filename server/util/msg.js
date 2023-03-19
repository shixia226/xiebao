const regMsg = /electron-msg-id=([^&]+)/

module.exports = (evt, msg, param) => {
  evt.sender.send(param.match(regMsg)[1], msg);
}