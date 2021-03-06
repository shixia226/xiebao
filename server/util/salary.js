const fs = require('fs');
const Config = require('./config');
let salary;

module.exports = {
    getPrice(xh, gx) {
        initSalary();
        var gxs = salary[xh];
        for (var i = 0, len = gxs.length; i < len; i++) {
            if (gxs[i].gx === gx) {
                return gxs[i].price;
            }
        }
        return 0;
    },
    refresh(xh, gxs) {
        if (salary) {
            salary[xh] = gxs;
        }
    },
    list(xhs) {
        initSalary();
        var arr = [];
        for (var xh in salary) {
            if (!xhs || xhs.indexOf(xh) !== -1) {
                var gxs = salary[xh];
                for (var i = 0, len = gxs.length; i < len; i++) {
                    arr.push({ xh: xh, gx: gxs[i].gx, price: gxs[i].price });
                }
            }
        }
        return arr;
    }
}

function initSalary() {
    if (!salary) {
        salary = {};
        var files = fs.readdirSync(Config.DIR_XH);
        for (var i = 0, len = files.length; i < len; i++) {
            var data = fs.readFileSync(Config.DIR_XH + files[i]);
            salary[files[i]] = JSON.parse(data);
        }
    }
}