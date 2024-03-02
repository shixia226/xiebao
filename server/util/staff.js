const fs = require('fs')
const Config = require('./config');

let staffList

module.exports = {
  listStaff () {
    if (!staffList) {
      staffList = fs.existsSync(Config.FILE_STAFF) ? JSON.parse(fs.readFileSync(Config.FILE_STAFF)) : []
    }
    return staffList
  },
  getFactory (staff) {
    this.listStaff()
    for (let i = 0, len = staffList.length; i < len; i++) {
      var item = staffList[i]
      if (item.id + '-' + item.name === staff) {
        return item.factory || ''
      }
    }
    return ''
  },
  saveStaff (datas) {
    staffList = datas
    var out = fs.createWriteStream(Config.FILE_STAFF, { encoding: "utf8" });
    out.write(JSON.stringify(datas));
    out.end();
  },
  removeStaff (staff) {
    this.listStaff()
    for (let i = 0, len = staffList.length; i < len; i++) {
      var item = staffList[i]
      if (item.id + '-' + item.name === staff) {
        staffList.splice(i, 1)
        this.saveStaff(staffList)
        return true
      }
    }
  }
}