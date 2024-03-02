const fs = require('fs');
const Config = require('./config');
const Dir = require('./dir');

module.exports = {
  getGxPrice (xh, gx, date) {
    var salary = initSalary(date);
    var gxs = salary[xh];
    if (!gxs) {
      return 0;
    }
    gxs = gxs.gxs
    for (var i = 0, len = gxs.length; i < len; i++) {
      if (gxs[i].gx === gx) {
        return gxs[i].price;
      }
    }
    return 0;
  },
  listXhPrice (date) {
    var salary = initSalary(date);
    let result = {}
    for (var xh in salary) {
      var xhgx = salary[xh]
      var yf = toNumber(+xhgx.yf)
      var income = toNumber(+xhgx.income)
      var gxs = xhgx.gxs
      let price = 0
      for (var i = 0, len = gxs.length; i < len; i++) {
        price += +gxs[i].price || 0;
      }
      result[xh] = { yf, price: toNumber(price), income };
    }
    return result;
  },
  list (xhs, date) {
    var salary = initSalary(date);
    var arr = [];
    for (var xh in salary) {
      if (!xhs || xhs.indexOf(xh) !== -1) {
        var gxs = salary[xh].gxs;
        for (var i = 0, len = gxs.length; i < len; i++) {
          arr.push({ xh: xh, gx: gxs[i].gx, price: gxs[i].price });
        }
      }
    }
    return arr;
  }
}

function initSalary (date) {
  var salary = {};
  var dir = Dir.getXinghaoDir(date)
  var files = fs.readdirSync(dir);
  for (var i = 0, len = files.length; i < len; i++) {
    var data = fs.readFileSync(dir + files[i]);
    var xh = JSON.parse(data);
    salary[files[i]] = xh.gxs ? xh : { yf: 0, gxs: xh }
  }
  return salary
}

function toNumber (num) {
  return Math.round(num * 1000) / 1000
}