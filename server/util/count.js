const fs = require('fs');
const Config = require('./config');
let counts = {};

try {
  if (fs.existsSync(Config.FILE_COUNTS, fs.F_OK)) {
    counts = JSON.parse(fs.readFileSync(Config.FILE_COUNTS));
  }
} catch (e) { }

module.exports = {
  serialize: () => {
    var out = fs.createWriteStream(Config.FILE_COUNTS, { encoding: "utf8" });
    out.write(JSON.stringify(counts));
    out.end();
  },
  next: (key) => {
    return counts[key] = (counts[key] || 0) + 1;
  }
}