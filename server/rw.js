const fs = require('fs');
const path = require('path');
const url = require('url');
const excel = require('excel-export');
const Count = require('./util/count');
const Msg = require('./util/msg');
const Config = require('./util/config');
const Salary = require('./util/salary');

module.exports = function (app) {
  app.on('/rw', function (evt, param) {
    switch (param.match(/cmd=([^&]+)/)[1]) {
      case 'list-rwzl': //罗列该月任务总量
        fs.readFile(getParamDate(param), function (err, data) {
          Msg(evt, data || '{}', param);
        })
        break;
      case 'update-rwzl': //更新型号
        var out = fs.createWriteStream(getParamDate(param), { encoding: "utf8" });
        out.write(param.match(/rwzls=([^&]+)/)[1]);
        out.end();
        Msg(evt, 'OK', param);
        break;
      case 'check-rw': //核验任务
        var date = param.match(regDate)[1];
        fs.readFile(Config.DIR_RWZL + date, function (err, data) {
          if (err) {
            Msg(evt, '无法确定任务总量，请确认先保存.', param);
            return;
          }
          var dir = Config.DIR_RWXQ + date + '/';
          fs.readdir(dir, function (err, files) {
            var rwxq = {};
            if (!err) {
              for (var i = 0, len = files.length; i < len; i++) {
                var datas = JSON.parse(fs.readFileSync(dir + files[i]));
                for (var k = 0, klen = datas.length; k < klen; k++) {
                  var xq = datas[k];
                  var rwxh = rwxq[xq.xh] = rwxq[xq.xh] || {};
                  rwxh[xq.gx] = (rwxh[xq.gx] || 0) + (parseInt(xq.count, 10) || 0);
                }
              }
            }
            var arr = [],
              rwzl = {};
            data = JSON.parse(data);
            for (var i = 0, len = data.length; i < len; i++) {
              var xq = data[i];
              rwzl[xq.xh] = (rwzl[xq.xh] || 0) + (parseInt(xq.count, 10) || 0);
            }
            for (var xh in rwzl) {
              var ocount = rwzl[xh],
                rwxh = rwxq[xh] || {};
              if (!fs.existsSync(Config.DIR_XH + xh)) {
                arr.push({ xh, gx: '-', count: -1, ocount })
                continue
              }
              var gxs = JSON.parse(fs.readFileSync(Config.DIR_XH + xh));
              for (var k = 0, klen = gxs.length; k < klen; k++) {
                var gx = gxs[k].gx,
                  count = rwxh[gx] || 0;
                if (count !== ocount) {
                  arr.push({
                    xh,
                    gx,
                    count,
                    ocount
                  })
                }
              }
            }
            Msg(evt, JSON.stringify(arr), param);
          });
        })
        break;
      case 'list-rw': //罗列指定月份、型号、工序的详情
        var dir = Config.DIR_RWXQ + param.match(regDate)[1] + '/';
        fs.readdir(dir, function (err, files) {
          var arr = [];
          if (!err) {
            var xh = param.match(/xh=([^&]+)/)[1],
              gx = param.match(/gx=([^&]+)/)[1];
            for (var i = 0, len = files.length; i < len; i++) {
              var datas = JSON.parse(fs.readFileSync(dir + files[i]));
              for (var k = 0, klen = datas.length; k < klen; k++) {
                var xq = datas[k];
                if (xq.xh === xh && xq.gx === gx) {
                  arr.push({
                    name: files[i].split('-')[1],
                    staff: files[i],
                    count: xq.count
                  })
                }
              }
            }
          }
          Msg(evt, JSON.stringify(arr), param);
        })
        break;
      case 'list-rwxq': //罗列任务详情
        fs.readFile(getParamXq(param), function (err, data) {
          Msg(evt, data || '{}', param);
        })
        break;
      case 'update-rwxq': //更新任务详情
        var out = fs.createWriteStream(getParamXq(param), { encoding: "utf8" });
        out.write(decodeURIComponent(param.match(/rwxqs=([^&]+)/)[1]));
        out.end();
        Msg(evt, 'OK', param);
        break;
      case 'export-rwxq':
        var date = param.match(regDate)[1],
          buffer = export2excel(date, param.match(regStaff)[1].split(',')),
          fileName = Config.PATH + '员工收益详情(' + date + ').xlsx';
        fs.writeFileSync(fileName, buffer, { encoding: 'binary' });
        evt.sender.webContents.downloadURL(url.format({
          pathname: path.resolve(fileName),
          protocol: 'file:',
          slashes: true
        }));
        evt.sender.webContents.session.once('will-download', (event, item) => {
          item.once('done', (event, state) => {
            fs.unlinkSync(fileName);
            if (state === 'completed') {
              Msg(evt, 'OK', param);
            } else {
              Msg(evt, 'Error', param);
            }
          });
        });
        break;
      case 'remove-rw':
        var date = param.match(regDate)[1],
          rwzl = Config.DIR_RWZL + date;
        if (fs.existsSync(rwzl)) {
          fs.unlinkSync(rwzl);
        }
        deleteFolder(Config.DIR_RWXQ + date);
        Msg(evt, 'OK', param);
        break;
    }
  })

  app.on('/salary', function (evt, param) {
    switch (param.match(/cmd=([^&]+)/)[1]) {
      case 'query-salary': //查询工资
        fs.readFile(getParamDate(param), function (err, datas) {
          var xhgxs = {};
          if (!err) {
            var xhs = [];
            datas = JSON.parse(datas);
            for (var i = 0, len = datas.length; i < len; i++) {
              var xh = datas[i].xh;
              if (xhs.indexOf(xh) === -1) xhs.push(xh);
            }
            xhgxs = Salary.list(xhs)
          }
          Msg(evt, JSON.stringify({
            salary: getSalary(getParamXq(param)),
            xhgxs: xhgxs
          }), param);
        })
        break;
      case 'list-salary': //罗列工资
        fs.readFile(Config.FILE_STAFF, function (err, datas) {
          var salary = [];
          if (!err) {
            var dir = Config.DIR_RWXQ + param.match(regDate)[1] + '/';
            datas = JSON.parse(datas);
            for (var i = 0, len = datas.length; i < len; i++) {
              var data = datas[i],
                staff = data.id + '-' + data.name;
              salary.push({
                name: data.name,
                staff: staff,
                salary: getSalary(dir + staff)
              })
            }
            salary.sort(function (sa, sb) { return sb.salary - sa.salary; });
          }
          Msg(evt, JSON.stringify(salary), param);
        })
        break;
      case 'list-salaries':
        var dir = Config.DIR_RWXQ + param.match(regDate)[1] + '/';
        var staff = param.match(regStaff)[1].split(',')
        var data = []
        for (let i = 0, len = staff.length; i < len; i++) {
          var name = staff[i]
          if (!fs.existsSync(dir + name)) {
            data.push({ name: name.split('-')[1], salary: 0, details: [] })
            continue
          }
          var rwxq = JSON.parse(fs.readFileSync(dir + name))
          let salary = 0
          const details = rwxq.map(function (rwxq) {
            const { xh, gx, count } = rwxq
            const price = Salary.getGxPrice(xh, gx)
            const profit = toNumber(price * count)
            salary += profit
            return { xh, gx, count, price, profit }
          })
          data.push({ name: name.split('-')[1], salary: toNumber(salary), details })
        }
        Msg(evt, JSON.stringify(data), param);
        break
      case 'query-shouzhi':
        var date = param.match(regDate)[1]
        var file = Config.DIR_SHOUZHI + date
        if (fs.existsSync(file)) {
          Msg(evt, fs.readFileSync(file), param)
        } else {
          Msg(evt, '{}', param)
        }
        break
      case 'save-shouzhi':
        var date = param.match(regDate)[1]
        var file = Config.DIR_SHOUZHI + date
        var out = fs.createWriteStream(file, { encoding: "utf8" });
        out.write(decodeURIComponent(param.match(/shouzhi=([^&]+)/)[1]));
        out.end();
        Msg(evt, 'OK', param);
        break;
    }
  })

  app.on('history', (evt) => {
    require('fs').readdir(Config.DIR_RWZL, (err, files) => {
      var datas = [];
      if (!err) {
        datas = files;
        datas.sort((a, b) => { return b - a; })
      }
      evt.sender.send('history', datas.join(','));
    })
  })
}

const regDate = /date=([^&]+)/,
  regStaff = /staff=([^&]+)/;

function getParamDate (param) {
  return Config.DIR_RWZL + param.match(regDate)[1];
}

function getParamXq (param) {
  var dir = Config.DIR_RWXQ + param.match(regDate)[1] + '/';
  if (!fs.existsSync(dir, fs.F_OK)) {
    fs.mkdirSync(dir);
  }
  return dir + param.match(regStaff)[1];
}

function getSalary (file) {
  var salary = 0;
  if (fs.existsSync(file, fs.F_OK)) {
    var datas = JSON.parse(fs.readFileSync(file));
    for (var i = 0, len = datas.length; i < len; i++) {
      var data = datas[i];
      salary += (data.count * Salary.getGxPrice(data.xh, data.gx));
    }
  }
  return salary;
}

function export2excel (date, staffs) {
  var dir = Config.DIR_RWXQ + date + '/',
    datas = [];
  for (var i = 0, len = staffs.length; i < len; i++) {
    var staff = staffs[i];
    if (fs.existsSync(dir + staff)) {
      var idnames = staff.split('-'),
        rwxq = JSON.parse(fs.readFileSync(dir + staff)),
        sum = 0,
        rows = [],
        klen = rwxq.length;
      for (var k = 0; k < klen; k++) {
        var ridx = parseInt(k / 2),
          rw = rwxq[k],
          price = Salary.getGxPrice(rw.xh, rw.gx),
          salary = price * rw.count;
        sum += salary;
        (rows[ridx] = rows[ridx] || []).push(k + 1 + '', rw.xh, rw.gx, rw.count, price, '￥' + salary.toFixed(2), '');
      }
      if (klen % 2 === 1) {
        rows[parseInt(klen / 2)].push(...(new Array(7)).join(',').split(','));
      }
      rows.push((new Array(14)).join(',').split(','));
      rows.push((new Array(5)).join(',').split(',').concat(["日期：", date, '', "员工：", idnames[1], '', '总收益：', '￥' + sum.toFixed(2), '']));
      datas.push({
        name: idnames[0] + '(' + sum.toFixed(2) + ')',
        cols: [
          { caption: '序号', type: 'string' },
          { caption: '型号', type: 'string' },
          { caption: '工序', type: 'string' },
          { caption: '数量', type: 'string' },
          { caption: '单价', type: 'string' },
          { caption: '收益', type: 'string' },
          { caption: '', type: 'string' },
          { caption: '序号', type: 'string' },
          { caption: '型号', type: 'string' },
          { caption: '工序', type: 'string' },
          { caption: '数量', type: 'string' },
          { caption: '单价', type: 'string' },
          { caption: '收益', type: 'string' },
          { caption: '', type: 'string' }
        ],
        rows: rows
      });
    }
  }
  if (datas.length === 0) {
    datas.push({
      name: "--",
      cols: [{ caption: '', type: 'string' }],
      rows: []
    });
  }
  return excel.execute(datas);
}

var deleteFolder = function (path) {
  if (fs.existsSync(path)) {
    var files = fs.readdirSync(path);
    for (var i = 0, len = files.length; i < len; i++) {
      var cpath = path + '/' + files[i];
      if (fs.statSync(cpath).isFile()) {
        fs.unlinkSync(cpath);
      } else {
        deleteFolder(cpath);
      }
    }
    fs.rmdirSync(path);
  }
};
function toNumber (num) {
  return Math.round(num * 1000) / 1000
}