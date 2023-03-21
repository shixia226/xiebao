const Count = require('./util/count');
const Msg = require('./util/msg');
const Staff = require('./util/staff')

module.exports = function (app) {
  app.on('/staff', function (evt, param) {
    switch (param.match(/cmd=([^&]+)/)[1]) {
      case 'list-staff': //罗列
        Msg(evt, JSON.stringify(Staff.listStaff()), param);
        break;
      case 'update-staff': //更新
        var staff = JSON.parse(param.match(/staffs=([^&]+)/)[1]);
        for (var i = 0, len = staff.length; i < len; i++) {
          if (!staff[i].id) {
            staff[i].id = ('000000' + Count.next('staff')).substr(-6);
          }
        }
        Staff.saveStaff(staff)
        Msg(evt, JSON.stringify(staff), param);
        break;
      case 'remove-staff': //删除
        if (Staff.removeStaff(param.match(/staff=([^&]+)/)[1])) {
          Msg(evt, 'OK', param);
        }
        break;
    }
  })
}
