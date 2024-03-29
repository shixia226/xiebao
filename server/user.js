const ready = require('./util/ready');
const Msg = require('./util/msg');

module.exports = (app) => {
  app.on('get-user', (evt) => {
    evt.sender.send('get-user', ready.getUser());
  });
  app.on('regist', (evt, param) => {
    ready.regist(param.match(/company=([^&]+)/)[1], param.match(/user=([^&]+)/)[1], param.match(/identity=([^&]+)/)[1], (available) => {
      evt.sender.send('regist', available ? 'OK' : '');
    });
  });
  app.on('information', (evt) => {
    ready.getDiskSerial((serial) => {
      evt.sender.send('information', serial + ':' + (ready.getUser() || '') + ':' + (ready.getIdentity() || ''));
    });
  });
  app.on('trial', (evt, param) => {
    var date = new Date();
    date.setMonth(date.getMonth() + 3);
    var identity = ready.generate(param.match(/serial=([^&]+)/)[1], formatDate(date));
    ready.regist(param.match(/company=([^&]+)/)[1], param.match(/user=([^&]+)/)[1], identity, (available) => {
      evt.sender.send('trial', available ? identity : '');
    });
  });
  app.on('/config', (evt, param) => {
    switch (param.match(/cmd=([^&]+)/)[1]) {
      case 'fetch':
        Msg(evt, JSON.stringify({ user: ready.getUser(), company: ready.getCompany() }), param)
        break
      case 'update':
        ready.update(param.match(/user=([^&]+)/)[1], param.match(/company=([^&]+)/)[1])
        Msg(evt, 'OK', param)
        break
    }
  })
}

function formatDate (date) {
  var month = date.getMonth() + 1,
    day = date.getDate();
  return date.getFullYear() + '/' + (month < 10 ? '0' : '') + month + '/' + (day < 10 ? '0' : '') + day;
}