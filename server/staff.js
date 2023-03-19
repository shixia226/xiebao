const fs = require('fs');
const Count = require('./util/count');
const Msg = require('./util/msg');
const Config = require('./util/config');

module.exports = function (app) {
  app.on('/staff', function (evt, param) {
    switch (param.match(/cmd=([^&]+)/)[1]) {
      case 'list-staff': //罗列
        fs.readFile(Config.FILE_STAFF, function (err, data) {
          Msg(evt, data, param);
        })
        break;
      case 'update-staff': //更新
        var staff = JSON.parse(param.match(/staffs=([^&]+)/)[1]);
        for (var i = 0, len = staff.length; i < len; i++) {
          if (!staff[i].id) {
            staff[i].id = ('000000' + Count.next('staff')).substr(-6);
          }
        }
        saveStaff(staff);
        Msg(evt, JSON.stringify(staff), param);
        break;
      case 'remove-staff': //删除
        fs.readFile(Config.FILE_STAFF, function (err, data) {
          var datas = JSON.parse(data);
          var idx = indexOf(datas, param.match(/(?:^|&)id=([^&]+)/)[1]);
          if (idx !== -1) {
            datas.splice(idx, 1);
            saveStaff(datas);
            Msg(evt, 'OK', param);
          }
        })
        break;
    }
  })
}

function indexOf (users, id) {
  for (var i = 0, len = users.length; i < len; i++) {
    if (users[i].id === id) return i;
  }
  return -1;
}

function saveStaff (datas) {
  var out = fs.createWriteStream(Config.FILE_STAFF, { encoding: "utf8" });
  out.write(JSON.stringify(datas));
  out.end();
}