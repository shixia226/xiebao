var logout = document.getElementById('logout');
if (logout) {
    //获取用户信息
    var ipcRenderer = require('electron').ipcRenderer;

    ipcRenderer.once('get-user', (evt, data) => {
        document.getElementById('user').innerHTML = data ? '（' + data + '）' : '';
    });
    ipcRenderer.send('get-user');

    //退出系统
    logout.onclick = () => {
        ipcRenderer.send('logout');
    }
}

var exportBtn = document.getElementById('export');
if (exportBtn) {
    exportBtn.onclick = () => {
        ipcRenderer.send('export');
    }
    var recoverfile = document.getElementById('recoverfile');
    document.getElementById('import').onclick = function() {
        recoverfile.click();
    }
    recoverfile.onchange = function() {
        var file = this.files[0];
        //使用fileReader对文件对象进行操作  
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function() {
            ipcRenderer.send('import', this.result);
            ipcRenderer.once('import-resolve', (evt, data) => {
                alert('修复成功！');
                recoverfile.value = '';
            });
        };
    }
}

if (window.EUI) {
    EUI.config({
        baseUrl: '../eui/cmps/'
    });

    EUI.ajax = (options) => {
        var url = options.url.split('?'),
            id = 'ajax' + (new Date()).getTime();
        ipcRenderer.once(id, (evt, data) => {
            if (options.json) {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    EUI.alert(data);
                    return;
                }
            }
            options.onfinish.apply(options.context, [data].concat(options["args"]));
        });
        ipcRenderer.send(url[0], 'electron-msg-id=' + id + '&' + url[1]);
    }

    function getCaret(inp) {
        if (isNaN(inp.selectionStart)) { // IE Support
            var srng = document.selection.createRange();
            if (inp.tagName.toLocaleLowerCase() === "textarea") {
                var rng = srng.duplicate();
                rng.moveToElementText(inp);
                var pos = -1;
                while (rng.inRange(srng)) {
                    rng.moveStart('character');
                    pos++;
                }
                return arguments[1] === true ? srng.text.replace(/\r\n/g, '\n').length + pos : pos;
            } else {
                var len = arguments[1] === true ? srng.text.length : 0;
                srng.moveStart('character', -inp.value.length);
                return len + srng.text.length;
            }
        } else {
            return arguments[1] === true ? inp.selectionEnd : inp.selectionStart;
        }
    }

    function isDefaultKeyEvent(editor, last) {
        var dom = editor.getDom();
        if (dom.tagName.toUpperCase() === 'INPUT') {
            return getCaret(dom) !== (last ? dom.value.length : 0);
        }
    }

    function keydown4list(evt) {
        var keyCode = evt.keyCode,
            list = evt.data;
        if (keyCode === EUI.KEY_RIGHT || keyCode === EUI.KEY_LEFT ||
            keyCode === EUI.KEY_TAB || keyCode === EUI.KEY_ENTER) {
            var property = list._property,
                editor = property["editor"];
            if (editor) {
                var rc = editor.args,
                    cell = property.dataTable.rows[rc[0]].cells[rc[1]],
                    nameNext = 'nextSibling',
                    nameChild = 'firstChild';
                if (keyCode === 39) {
                    if (isDefaultKeyEvent(editor, true)) return;
                } else if (keyCode === 37) {
                    if (isDefaultKeyEvent(editor, false)) return;
                    nameNext = 'previousSibling';
                    nameChild = 'lastChild';
                } else {
                    evt.preventDefault();
                }
                while (true) {
                    var ncell = cell[nameNext];
                    if (!ncell) {
                        var pelem = cell.parentNode;
                        ncell = pelem[nameNext];
                        if (!ncell) {
                            ncell = pelem.parentNode[nameChild];
                        }
                        ncell = ncell[nameChild];
                    }
                    if (property.headers[ncell.cellIndex].editor) {
                        list.stopEdit();
                        ncell.click();
                        break;
                    }
                    cell = ncell;
                }
            }
        } else if (keyCode === EUI.KEY_DOWN || keyCode === EUI.KEY_UP) {
            var property = list._property,
                editor = property["editor"];
            if (editor && editor.getDom().tagName.toUpperCase() === 'INPUT') {
                var rc = editor.args,
                    row = rc[0],
                    col = rc[1],
                    rows = property.dataTable.rows;
                if (keyCode === EUI.KEY_DOWN) {
                    if (row === rows.length - 1) {
                        property["headerTable"].querySelector('.ui-icon.font-icon-add.ui-icon-btn').click();
                        col = 0;
                        var headers = property.headers,
                            len = headers.length;
                        while (col < len) {
                            if (headers[col].editor) {
                                break;
                            }
                            col++;
                        }
                    }
                    row++;
                } else {
                    row = row === 0 ? rows.length - 1 : row - 1;
                }
                property.dataTable.rows[row].cells[col].click();
            }
        }
    }

    EUI.registKeyEvent = function(list) {
        EUI.bind(document.body, 'keydown', list, keydown4list);
    };
}