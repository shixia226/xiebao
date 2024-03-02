const fs = require('fs');
const Config = require('./config');

module.exports = {
  getXinghaoDir(date) {
    const files = fs.readdirSync(Config.DIR_BACKUP).sort()
    for(let i = 0; i < files.length; i++) {
      if (parseInt(files[i]) >= date) {
        return Config.DIR_BACKUP + files[i] + '/'
      }
    }
    return Config.DIR_XH
  }
} 