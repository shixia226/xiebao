const fs = require('fs');
const Count = require('./util/count');
const Msg = require('./util/msg');
const Config = require('./util/config');
const Salary = require('./util/salary');

module.exports = function (app) {
  app.on('/xinghao', function (evt, param) {
    switch (param.match(/cmd=([^&]+)/)[1]) {
      case 'list-xh': //罗列型号
        fs.readdir(Config.DIR_XH, function (err, files) {
          var xhs = [];
          if (!err) {
            for (var i = 0, len = files.length; i < len; i++) {
              xhs.push({ xh: files[i] });
            }
          }
          Msg(evt, JSON.stringify(xhs), param);
        })
        break;
      case 'list-xhjg': // 型号价格
        Msg(evt, JSON.stringify(Salary.listXhPrice(param.match(regDate)[1])), param)
        break
      case 'update-xh': //更新型号
        var xh = param.match(regXh)[1];
        var yf = +param.match(/yf=([^&]+)/)[1] || 0
        var income = +param.match(/income=([^&]+)/)[1] || 0
        var gxs = JSON.parse(decodeURIComponent(param.match(/gxs=([^&]+)/)[1]));
        var salary = { yf, income, gxs }
        var out = fs.createWriteStream(Config.DIR_XH + xh, { encoding: "utf8" });
        out.write(JSON.stringify(salary));
        out.end();
        Msg(evt, 'OK', param);
        break;
      case 'remove-xh': //删除型号
        var xh = param.match(regXh)[1];
        fs.unlink(Config.DIR_XH + xh, function () {
          Msg(evt, 'OK', param);
        })
        break;
      case 'list-gx': //罗列工序
        fs.readFile(Config.DIR_XH + param.match(regXh)[1], function (err, data) {
          Msg(evt, data || '{}', param);
        })
        break;
      case 'backup': //备份
        var dir = Config.DIR_BACKUP + param.match(regDate)[1] + '/'
        if (fs.existsSync(dir)) {
          Msg(evt, 'Fail', param)
        } else {
          fs.mkdirSync(dir);
          fs.readdirSync(Config.DIR_XH).forEach(function(file) {
            fs.renameSync(Config.DIR_XH + file, dir+file)
          })
          Msg(evt, 'OK', param)
        }
        break
    }
  })
}

const regDate = /date=([^&]+)/
const regXh = /xh=([^&]+)/;