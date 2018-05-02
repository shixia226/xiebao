var staff = EUI.parseUrl("staff"),
    xhgxs = null;
var resetHeader = function(date) {
    EUI.query("date-work").innerHTML = date.substr(0, 4) + "年" + date.substr(4) + "月";
};
var pad = function(num, len) {
    var str = new Array(len = len || 2).join('0') + num;
    return str.substr(str.length - len);
};
var currentDate = () => {
    var date = new Date();
    return date.getFullYear() + pad(1 + date.getMonth(), 2);
}
var date = EUI.parseUrl("date") || currentDate();
resetHeader(date);
document.getElementById('back').setAttribute('href', './rwzl.html?date=' + date);

EUI.ajax({
    url: "/salary?cmd=query-salary&staff=" + staff + "&date=" + date,
    json: true,
    onfinish: function(data) {
        EUI.query("name-staff").innerHTML = staff.split('-')[1];
        EUI.query("salary").innerHTML = EUI.round(data["salary"], 2) + " 元";
        xhgxs = data["xhgxs"];
        var xhs = {},
            gxs = {},
            prices = {};
        for (var i = 0, len = xhgxs.length; i < len; i++) {
            var xhgx = xhgxs[i],
                xh = xhgx["xh"],
                gx = xhgx["gx"],
                id = xh + "_" + gx;
            xhs[xh] = xh;
            (gxs[xh] = gxs[xh] || {})[gx] = gx;
            prices[id] = xhgx["price"];
        }

        EUI.getCmp("list", {
            pelem: "con-list",
            data$index: true,
            enableedit: true,
            height: "100%",
            datakey: "index",
            headers: [{
                width: 60,
                name: "index",
                caption: "序号"
            }, {
                width: 160,
                name: "xh",
                caption: "型号",
                editable: true,
                editor: "select.xh",
                texts: xhs
            }, {
                width: 160,
                name: "gx",
                caption: "工序",
                editable: true,
                editor: "select.gx",
                args4showeditor: gxs,
                onshoweditor: function(ridx, cidx, list, options) {
                    this.initOptions(options = options[list.getData(ridx, "xh")] || []);
                    return options;
                }
            }, {
                width: 160,
                name: "count",
                caption: "数量",
                editable: true
            }, {
                width: 100,
                name: "price",
                caption: "单价"
            }, {
                name: "profit",
                caption: "收益"
            }, {
                width: 30,
                renderheader: function(headerCell, caption, header, i, doc) {
                    var span = headerCell.appendChild(doc.createElement("span"));
                    span.className = "ui-icon font-icon-add ui-icon-btn";
                    span.title = "添加";
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
                        if (title === "添加") {
                            evt.data.add();
                        } else if (title === "删除") {
                            evt.data.remove(target.parentNode.parentNode.rowIndex);
                        }
                        return false;
                    }
                },
                ondataadd: function(ridx) {
                    var xh = this.getData(ridx, "xh"),
                        profit = 0,
                        price = '';
                    if (xh) {
                        price = prices[xh + "_" + this.getData(ridx, "gx")];
                        profit = EUI.round(this.getData(ridx, "count") * price, 2);
                    }
                    this.setData(price, ridx, "price");
                    this.setData(profit, ridx, "profit");
                },
                ondatachange: function(value, ovalue, name, ridx) {
                    var xh = null,
                        gx = null,
                        count = null;
                    if (name === "xh") {
                        if (!(gx = this.getData(ridx, "gx"))) return;
                        xh = value;
                        count = this.getData(ridx, "count");
                    } else if (name === "gx") {
                        if (!(xh = this.getData(ridx, "xh"))) return;
                        gx = value;
                        count = this.getData(ridx, "count");
                    } else if (name === "count") {
                        xh = this.getData(ridx, "xh");
                        gx = this.getData(ridx, "gx");
                        count = value;
                    } else {
                        return;
                    }
                    var price = prices[xh + "_" + gx],
                        nprofit = count ? EUI.round(count * price, 2) : 0,
                        profit = this.getData(ridx, 'profit') || 0;
                    this.setData(price, ridx, "price");
                    this.setData(nprofit, ridx, "profit");
                    EUI.query("salary").innerHTML = (parseFloat(EUI.query("salary").innerHTML, 10) || 0) + (nprofit - profit) + ' 元';
                }
            }
        }, function(list) {
            EUI.ajax({
                url: "/rw?cmd=list-rwxq&staff=" + staff + "&date=" + date,
                json: true,
                context: list,
                onfinish: list.add
            });

            EUI.getCmp("button", {
                pelem: "con-list",
                caption: "保存",
                args: [list],
                onclick: function(btn, list) {
                    var datas = list.getData(["xh", "gx", "count"], true),
                        len = datas.length;
                    if (len) {
                        for (var i = 0; i < len; i++) {
                            var data = datas[i];
                            if (!data["xh"]) {
                                EUI.alert("第" + (i + 1) + "行型号不能为空，请核实后重新保存.");
                                return;
                            }
                            if (!data["gx"]) {
                                EUI.alert("第" + (i + 1) + "行工序不能为空，请核实后重新保存.");
                                return;
                            }
                            if (!data["count"] || data["count"] == '0') {
                                EUI.alert("第" + (i + 1) + "行数量不能为0，请核实后保存.");
                                return;
                            }
                        }
                        EUI.ajax({
                            url: "/rw?cmd=update-rwxq&staff=" + staff + "&date=" + date + "&rwxqs=" + encodeURIComponent(JSON.stringify(datas)),
                            onfinish: function(salary) {
                                if (confirm("是否跳转到收益总览页面？")) {
                                    window.location.href = "rwzl.html";
                                }
                            }
                        });
                    } else {
                        EUI.alert("不需要保存.");
                    }
                }
            }, function(btn) {
                btn.getContainer().style.cssText += '; position: absolute; margin: 10px 0 0 10px;';

                EUI.getCmp('button', {
                    pelem: 'con-list',
                    caption: '打印',
                    args: [btn],
                    onclick: function(btn, saveBtn) {
                        var header = EUI.query('.header')[0];
                        header.style.display = 'none';
                        btn.getContainer().style.display = 'none';
                        saveBtn.getContainer().style.display = 'none';
                        document.body.style.paddingTop = '0';
                        window.print();
                        header.style.display = '';
                        btn.getContainer().style.display = '';
                        saveBtn.getContainer().style.display = '';
                        document.body.style.paddingTop = '';
                    }
                }, function(btn) {
                    btn.getContainer().style.cssText += '; position: absolute; left: 100px; margin: 10px 0 0 10px;';
                })
            });
            EUI.registKeyEvent(list);
        });
    }
});