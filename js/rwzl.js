var resetHeader = (date) => {
    EUI.query("date-ym").innerHTML = date.substr(0, 4) + "年" + date.substr(4) + "月";
};
var pad = (num, len) => {
    var str = new Array(len = len || 2).join('0') + num;
    return str.substr(str.length - len);
};
var currentDate = () => {
    var date = new Date();
    return date.getFullYear() + pad(1 + date.getMonth(), 2);
}
var date = EUI.parseUrl("date") || currentDate();

resetHeader(date);

var historyBtn = document.getElementById('history');
if (historyBtn) {
    ipcRenderer.once('history', (evt, data) => {
        historyBtn.onclick = () => {
            EUI.getCmp('dialog.history', {
                caption: "切换月份",
                width: 260,
                height: 360,
                miniBtns: ["close"],
                btns: [{
                    caption: "关闭",
                    onclick: "hide"
                }],
                content: {
                    cmp: "list.history",
                    options: {
                        height: "100%",
                        headervisible: false,
                        headers: [{
                            name: 'text'
                        }],
                        events: {
                            clickcell: function(evt, cidx, ridx) {
                                window.location.href = window.location.pathname + '?date=' + this.getData(ridx, 'date');
                            }
                        }
                    }
                }
            }, (dlg) => {
                var list = dlg.getContent();
                if (list) {
                    list.clear();
                    var datas = data ? data.split(',') : [],
                        cdate = currentDate();
                    if (datas.indexOf(cdate) === -1) {
                        datas.unshift(cdate);
                    }
                    for (var i = 0, len = datas.length; i < len; i++) {
                        var date = datas[i];
                        datas[i] = {
                            date: date,
                            text: date.substr(0, 4) + '年' + date.substr(4) + '月' + (cdate === date ? ' (本月)' : '')
                        }
                    }
                    list.add(datas);
                }
                dlg.show(true);
            });
        }
    });
    ipcRenderer.send('history');
}

EUI.ajax({
    url: "/xinghao?cmd=list-xh",
    json: true,
    onfinish: function(datas) {
        var xhs = {};
        for (var i = 0, len = datas.length; i < len; i++) {
            var xh = datas[i]["xh"];
            xhs[xh] = xh;
        }

        EUI.getCmp("list", {
            pelem: "con-rwzl",
            data$index: true,
            enableedit: true,
            enableselect: false,
            datakey: "index",
            height: "100%",
            headers: [{
                width: 60,
                name: "index",
                caption: "序号"
            }, {
                name: "xh",
                caption: "型号",
                editable: true,
                texts: xhs,
                editor: "select"
            }, {
                width: 60,
                name: "count",
                caption: "数量",
                validator: /^\d+$/,
                editable: true
            }, {
                width: 30,
                renderheader: function(headerCell, caption, header, i, doc) {
                    var span = headerCell.appendChild(doc.createElement("span"));
                    span.className = "ui-icon font-icon-add ui-icon-btn";
                    span.title = "添加任务";
                },
                render: function(cell, value, name, i, ridx, list) {
                    var span = cell.appendChild(list.doc.createElement("span"));
                    span.className = "ui-icon font-icon-minus ui-icon-btn";
                    span.title = "删除";
                }
            }],
            events: {
                click: function(evt) {
                    var target = evt.target;
                    if (target.nodeName.toUpperCase() === "SPAN") {
                        var title = target.title;
                        if (title === "添加任务") {
                            evt.data.add();
                        } else if (title === "删除") {
                            var ridx = target.parentNode.parentNode.rowIndex;
                            if (confirm("确认删除序号【" + (ridx + 1) + "】的任务？")) {
                                evt.data.remove(ridx);
                            }
                        }
                    }
                }
            }
        }, function(list) {
            EUI.registKeyEvent(list);
            EUI.ajax({
                url: "/rw?cmd=list-rwzl&date=" + date,
                json: true,
                context: list,
                onfinish: list.add
            });
            /**
             * 保存
             */
            EUI.getCmp("button", {
                pelem: "con-rwzl",
                caption: "保存",
                args: [list],
                onclick: function(btn, list) {
                    var datas = list.getData(["xh", "count"], true),
                        len = datas.length;
                    if (len) {
                        for (var i = 0; i < len; i++) {
                            var data = datas[i];
                            if (!data["xh"]) {
                                EUI.alert("第" + (i + 1) + "行型号不能为空，请核实后重新保存.");
                                return;
                            } else if (!data["count"] || data["count"] == '0') {
                                EUI.alert("第" + (i + 1) + "行数量不能为0，请核实后保存.");
                                return;
                            }
                        }
                        EUI.ajax({
                            url: "/rw?cmd=update-rwzl&date=" + date + "&rwzls=" + JSON.stringify(datas),
                            onfinish: function(datas) {
                                if (datas === "OK") {
                                    EUI.alert("保存成功！");
                                } else {
                                    EUI.alert(datas);
                                }
                            }
                        });
                    } else {
                        EUI.alert("任务总量无任何修改，不需要保存.")
                    }
                }
            }, function(btn) {
                btn.getContainer().style.cssText += '; position: absolute; margin: 10px 0 0 10px;';
            });
            /**
             * 核算
             */
            EUI.getCmp("button", {
                pelem: "con-rwzl",
                caption: "核算",
                args: [list],
                onclick: function(btn, list) {
                    EUI.ajax({
                        url: "/rw?cmd=check-rw&date=" + date,
                        json: true,
                        onfinish: function(datas) {
                            if (datas.length === 0) {
                                EUI.alert("核算无误！");
                            } else {
                                EUI.getCmp("dialog.checkresult", {
                                    caption: "核算结果",
                                    width: 420,
                                    height: 360,
                                    miniBtns: ["close"],
                                    btns: [{
                                        caption: "关闭",
                                        onclick: "hide"
                                    }],
                                    content: {
                                        cmp: "list.checkresult",
                                        options: {
                                            data$index: true,
                                            height: "100%",
                                            headers: [{
                                                width: 40,
                                                caption: "序号"
                                            }, {
                                                width: 80,
                                                name: "xh",
                                                caption: "型号"
                                            }, {
                                                width: 80,
                                                name: "gx",
                                                caption: "工序"
                                            }, {
                                                width: 80,
                                                name: "count",
                                                caption: "实际量"
                                            }, {
                                                width: 80,
                                                name: "ocount",
                                                caption: "任务总量"
                                            }, {
                                                caption: "",
                                                render: function(cell, value, name, i, ridx, list) {
                                                    var count = list.getData(ridx, "count"),
                                                        ocount = list.getData(ridx, "ocount");
                                                    cell.innerHTML = '<span style="cursor: pointer; text-decoration: underline; margin-left: 10px; color: ' +
                                                        (count <= ocount ? '#51688E' : '#F95A3E') + '">详情</span>';
                                                }
                                            }],
                                            events: {
                                                clickcell: function(evt, cidx, ridx) {
                                                    if (cidx !== 5 || evt.target.tagName.toLowerCase() !== "span") return;
                                                    var count = this.getData(ridx, "count");
                                                    if (!count) {
                                                        EUI.alert("完成量为0，无详情.");
                                                        return;
                                                    }
                                                    EUI.ajax({
                                                        url: "/rw?cmd=list-rw&date=" + date + "&xh=" + this.getData(ridx, 'xh') + "&gx=" + this.getData(ridx, "gx"),
                                                        json: true,
                                                        context: this,
                                                        onfinish: function(datas) {
                                                            EUI.getCmp("dialog.rwdetail", {
                                                                caption: "核算结果",
                                                                width: 260,
                                                                height: 200,
                                                                miniBtns: ["close"],
                                                                btns: [{
                                                                    caption: "关闭",
                                                                    onclick: "hide"
                                                                }],
                                                                content: {
                                                                    cmp: "list.rwdetail",
                                                                    options: {
                                                                        data$index: true,
                                                                        height: "100%",
                                                                        headers: [{
                                                                            width: 40,
                                                                            caption: "序号"
                                                                        }, {
                                                                            name: "name",
                                                                            caption: "人员",
                                                                            render: function(cell, value, name, c, r, list) {
                                                                                cell.innerHTML = '<a href="rwxq.html?staff=' + list.getData(r, "staff") + '&date=' + date + '">' + value + '</a>';
                                                                            }
                                                                        }, {
                                                                            width: 80,
                                                                            name: "count",
                                                                            caption: "数量"
                                                                        }]
                                                                    }
                                                                },
                                                                callback: function(list) {
                                                                    list.add(datas);
                                                                }
                                                            }, function(dlg, caption) {
                                                                var list = dlg.getContent();
                                                                if (list) {
                                                                    list.clear();
                                                                    list.add(datas);
                                                                }
                                                                dlg.setCaption(caption);
                                                                dlg.show(true);
                                                            }, this.getData(ridx, "xh") + " : " + this.getData(ridx, "gx") + " 【" + count + " : " + this.getData(ridx, "ocount") + "】")
                                                        }
                                                    });
                                                }
                                            }
                                        },
                                        callback: function(list) {
                                            list.add(datas);
                                        }
                                    }
                                }, function(dlg) {
                                    var list = dlg.getContent();
                                    if (list) {
                                        list.clear();
                                        list.add(datas);
                                    }
                                    dlg.show(true);
                                });
                            }
                        }
                    });
                }
            }, function(btn) {
                btn.getContainer().style.cssText += '; position: absolute; margin: 10px 0 0 100px;';
            });
        });
    }
});

EUI.getCmp("list", {
    pelem: "con-pay",
    data$index: true,
    data$check: true,
    enableedit: true,
    height: "100%",
    headers: [{
        width: 60,
        caption: "序号"
    }, {
        width: 120,
        name: "name",
        caption: "员工",
        render: function(cell, value, name, c, r, list) {
            cell.innerHTML = '<a href="./rwxq.html?staff=' + list.getData(r, "staff") + '&date=' + date + '">' + value + '</a>';
        }
    }, {
        name: "salary",
        caption: "收益",
        render: function(cell, value) {
            cell.innerHTML = "￥" + EUI.round(value, 2);
        }
    }],
    events: {
        ondataadd: function(ridx) {
            var salary = this.getData(ridx, "salary") || 0,
                elem = EUI.query("total-salary");
            elem.innerHTML = EUI.round((parseFloat(elem.innerHTML, 10) || 0) + salary, 2);
        }
    }
}, function(list) {
    EUI.ajax({
        url: "/salary?cmd=list-salary&date=" + date,
        json: true,
        context: list,
        onfinish: list.add
    });

    /**
     * 导出
    EUI.getCmp("button", {
        pelem: "con-pay",
        caption: "导出",
        args: [list],
        onclick: function(btn, list) {
            var idxs = list.getSelected();
            if (idxs == null || idxs.length === 0) {
                EUI.alert("请至少选择一个员工.");
                return;
            }
            var staffs = [];
            for (var i = 0, len = idxs.length; i < len; i++) {
                staffs.push(list.getData(idxs[i], "staff"));
            }
            EUI.ajax({
                    url: '/rw?cmd=export-rwxq&date=' + date + '&staff=' + staffs.join(','),
                    onfinish: function() {

                    }
                })
                // EUI.form("/rw", {
                //     cmd: 'export-rwxq',
                //     date: date,
                //     staffs: staffs.join(',')
                // }, {
                //     method: "GET"
                // });
        }
    }, function(btn) {
        btn.getContainer().style.cssText += '; position: absolute; margin: 10px 0 0 10px;';
    });
    */
});

function showErrorData(datas) {
    EUI.getCmp("dialog.detail4error", {
        content: {
            cmp: "list",
            options: {},
            args: datas,
            callback: function(list, datas) {}
        }
    }, function(dlg) {});
}