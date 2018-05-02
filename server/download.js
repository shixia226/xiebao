const fs = require('fs');
const Config = require('./util/config');
const path = require('path');
const url = require('url');
const PATH = Config.PATH + 'export';

module.exports = (app) => {
    app.on('export', (evt, param) => {
        let content = {
            staff: readFileContent(Config.FILE_STAFF),
            rwxq: readDirContent(Config.DIR_RWXQ),
            rwzl: readDirContent(Config.DIR_RWZL),
            xh: readDirContent(Config.DIR_XH),
        };
        fs.writeFileSync(PATH, JSON.stringify(content));
        evt.sender.webContents.downloadURL(url.format({
            pathname: path.resolve(PATH),
            protocol: 'file:',
            slashes: true
        }));
    });
    app.on('import', (evt, param) => {
        let data = JSON.parse(param),
            staff = data.staff;
        if (staff) {
            writeFileContent(Config.FILE_STAFF, staff);
        }
        writeDirContent(Config.DIR_XH, data.xh);
        writeDirContent(Config.DIR_RWZL, data.rwzl);
        writeDirContent(Config.DIR_RWXQ, data.rwxq, true);
        evt.sender.send('import-resolve', 'OK');
    });
};

function writeDirContent(dir, datas, deep) {
    if (!datas) return;
    let func = deep ? writeDirContent : writeFileContent;
    if (deep) {
        for (let file in datas) {
            let ndir = dir + file + '/';
            if (!fs.existsSync(ndir, fs.F_OK)) {
                fs.mkdirSync(ndir);
            }
            writeDirContent(ndir, datas[file]);
        }
    } else {
        for (let file in datas) {
            writeFileContent(dir + file, datas[file]);
        }
    }
}

function writeFileContent(file, datas) {
    var out = fs.createWriteStream(file, { encoding: "utf8" });
    out.write(JSON.stringify(datas));
    out.end();
}

function readDirContent(dir) {
    if (fs.existsSync(dir, fs.F_OK)) {
        let files = fs.readdirSync(dir),
            content = {};
        for (let i = 0, len = files.length; i < len; i++) {
            let file = files[i];
            if (fs.statSync(dir + file).isFile()) {
                content[file] = JSON.parse(fs.readFileSync(dir + file).toString());
            } else {
                content[file] = readDirContent(dir + file + '/');
            }
        }
        return content;
    }
}

function readFileContent(file) {
    if (fs.existsSync(file, fs.F_OK)) {
        return JSON.parse(fs.readFileSync(file).toString());
    }
}