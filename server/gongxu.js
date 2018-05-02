const fs = require('fs');
const Count = require('./util/count');
const Msg = require('./util/msg');
const Config = require('./util/config');
const Salary = require('./util/salary');

module.exports = function(app) {
    app.on('/xinghao', function(evt, param) {
        switch (param.match(/cmd=([^&]+)/)[1]) {
            case 'list-xh': //罗列型号
                fs.readdir(Config.DIR_XH, function(err, files) {
                    var xhs = [];
                    if (!err) {
                        for (var i = 0, len = files.length; i < len; i++) {
                            xhs.push({ xh: files[i] });
                        }
                    }
                    Msg(evt, JSON.stringify(xhs), param);
                })
                break;
            case 'update-xh': //更新型号
                var xh = param.match(regXh)[1];
                var gxs = decodeURIComponent(param.match(/gxs=([^&]+)/)[1]);
                var out = fs.createWriteStream(Config.DIR_XH + xh, { encoding: "utf8" });
                out.write(gxs);
                out.end();
                Salary.refresh(xh, JSON.parse(gxs));
                Msg(evt, 'OK', param);
                break;
            case 'remove-xh': //删除型号
                var xh = param.match(regXh)[1];
                fs.unlink(Config.DIR_XH + xh, function() {
                    Salary.refresh(xh, null);
                    Msg(evt, 'OK', param);
                })
                break;
            case 'list-gx': //罗列工序
                fs.readFile(Config.DIR_XH + param.match(regXh)[1], function(err, data) {
                    Msg(evt, data || '{}', param);
                })
                break;
        }
    })
}

const regXh = /xh=([^&]+)/;