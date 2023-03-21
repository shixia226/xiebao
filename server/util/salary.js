const fs = require('fs');
const Config = require('./config');
let salary;

module.exports = {
  getGxPrice (xh, gx) {
    initSalary();
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
  listXhPrice () {
    initSalary();
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
  refresh (xh, gxs) {
    if (salary) {
      salary[xh] = gxs;
    }
  },
  list (xhs) {
    initSalary();
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

function initSalary () {
  if (!salary) {
    salary = {};
    var files = fs.readdirSync(Config.DIR_XH);
    for (var i = 0, len = files.length; i < len; i++) {
      var data = fs.readFileSync(Config.DIR_XH + files[i]);
      var xh = JSON.parse(data);
      salary[files[i]] = xh.gxs ? xh : { yf: 0, gxs: xh }
    }
  }
}

function toNumber (num) {
  return Math.round(num * 1000) / 1000
}