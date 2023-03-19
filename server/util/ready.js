const fs = require('fs');
const path = require('path');
const Config = require('./config');
let settings;

module.exports = {
  init (callback) {
    var permission = true;
    try {
      if (!fs.existsSync(Config.PATH)) {
        for (var name in Config) {
          var cpath = Config[name];
          if (/\/$/.test(cpath)) {
            mkdirs(cpath);
          }
        }
      } else {
        let file = Config.PATH + '__test__';
        fs.writeFileSync(file, '');
        fs.unlinkSync(file);

        if (fs.existsSync(Config.FILE_CONFIG)) {
          var match = fs.readFileSync(Config.FILE_CONFIG).toString().match(/^([^:]+):(.+)$/),
            identity = match[2],
            code = decode(identity);
          if (code) {
            this.getDiskSerial((serial) => {
              if (code.serial === serial) {
                settings = {
                  user: decodeURI(match[1]),
                  serial,
                  identity,
                  date: code.date
                };
                callback(settings.date > (new Date()).getTime(), permission);
              } else {
                callback(false, permission);
              }
            });
            return;
          }
        }
      }
    } catch (e) {
      console.log(e)
      permission = false;
    }
    callback(false, permission);
  },
  regist (user, identity, callback) {
    var code = decode(identity);
    if (code) {
      this.getDiskSerial((serial) => {
        if (code.serial === serial) {
          settings = {
            user,
            serial,
            date: code.date
          };
          fs.writeFileSync(Config.FILE_CONFIG, encodeURI(user) + ':' + identity);
          callback(settings.date > (new Date()).getTime());
        } else {
          callback(false);
        }
      });
    } else {
      callback(false);
    }
  },
  generate (serial, date) {
    return encode(serial, (new Date(date)).getTime() + '');
  },
  getDiskSerial (callback) {
    require('systeminformation').diskLayout(function (disk) {
      callback(disk[0].serialNum);
    });
  },
  getUser () {
    return settings && settings.user;
  },
  getIdentity () {
    return settings && settings.identity;
  }
}

// 创建所有目录
const mkdirs = function (dirpath) {
  if (!fs.existsSync(dirpath)) {
    mkdirs(path.dirname(dirpath));
    fs.mkdirSync(dirpath);
  }
};

function encode (serial, date) {
  var slen = serial.length,
    dlen = date.length,
    i = 0,
    len,
    firstStr,
    str = [slen, '-', dlen, '-']
  if (slen > dlen) {
    len = slen;
    i = dlen;
    firstStr = serial;
  } else {
    len = dlen;
    i = slen;
    firstStr = date;
  }
  for (; i < len; i++) {
    str.push(encodeChar(firstStr.charCodeAt(i)));
  }
  for (i = 0, len = slen + dlen - len; i < len; i++) {
    str.push(encodeChar(date.charCodeAt(i)), encodeChar(serial.charCodeAt(i)));
  }
  return str.join('');
}

function decode (identity) {
  var match = identity.match(/^(\d+)-(\d+)-(.+)$/);
  if (!match) return null;
  var slen = +match[1],
    dlen = +match[2],
    str = match[3],
    serial = [],
    date = [],
    from, i, len;
  if (slen > dlen) {
    arr = serial;
    from = slen - dlen;
    len = dlen;
  } else {
    arr = date;
    from = dlen - slen;
    len = slen;
  }
  for (i = 0; i < len; i++) {
    date.push(decodeChar(str.charCodeAt(from + i * 2)));
    serial.push(decodeChar(str.charCodeAt(from + i * 2 + 1)));
  }
  for (i = 0; i < from; i++) {
    arr.push(decodeChar(str.charCodeAt(i)));
  }
  return {
    serial: serial.join(''),
    date: +date.join('')
  };
}

var codeA = 'A'.charCodeAt(0),
  codeZ = 'Z'.charCodeAt(0),
  code0 = '0'.charCodeAt(0),
  code9 = '9'.charCodeAt(0);

function encodeChar (code) {
  if (code >= codeA && code < codeZ || code >= code0 && code < code9) {
    code = code + 1;
  } else if (code === codeZ) {
    code = codeA;
  } else if (code === code9) {
    code = code0;
  }
  return String.fromCharCode(code);
}

function decodeChar (code) {
  if (code > codeA && code <= codeZ || code > code0 && code <= code9) {
    code = code - 1;
  } else if (code === codeA) {
    code = codeZ;
  } else if (code === code0) {
    code = code9;
  }
  return String.fromCharCode(code);
}