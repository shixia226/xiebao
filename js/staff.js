EUI.getCmp("list", {
    pelem: "con-list",
    data$index: true,
    enableedit: true,
    enableselect: false,
    height: "100%",
    datakey: "index",
    headers: [{
        width: 60,
        name: "index",
        caption: "序号"
    }, {
        width: 120,
        name: "name",
        caption: "姓名",
        editable: true
    }, {
        width: 160,
        name: "tel",
        caption: "电话",
        validator: /^\d{11}$/,
        editable: true
    }, {
        name: "msg",
        caption: "备注",
        editable: true
    }, {
        width: 60,
        name: "status",
        caption: "状态",
        editable: true,
        editor: "select",
        texts: {
            0: "离职",
            1: "在职"
        },
        render: function(cell, value, name, i, ridx, list) {
            var celldom = cell.lastChild;
            if (!celldom) {
                celldom = cell.appendChild(list.doc.createElement("div"));
            } else {
                EUI.clearNode(celldom);
            }
            celldom.appendChild(list.doc.createTextNode(value));
            celldom.className = value === "在职" ? "ui-list-edittext status-normal" : "ui-list-edittext status-quit";
        }
    }, {
        width: 30,
        renderheader: function(headerCell, caption, header, i, doc) {
            var span = headerCell.appendChild(doc.createElement("span"));
            span.className = "ui-icon font-icon-add ui-icon-btn";
            span.title = "添加员工";
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
                if (title === "添加员工") {
                    evt.data.add({
                        status: 1
                    });
                } else if (title === "删除") {
                    var ridx = target.parentNode.parentNode.rowIndex,
                        list = evt.data,
                        id = list.getData(ridx, "id");
                    if (id) {
                        if (confirm("确定删除员工【" + list.getData(ridx, "name") + "】？")) {
                            EUI.ajax({
                                url: "/staff?cmd=remove-staff&id=" + id,
                                context: list,
                                onfinish: function(result) {
                                    if (result === "OK") this.remove(ridx);
                                }
                            });
                        }
                    } else {
                        list.remove(ridx)
                    }
                    return false;
                }
            }
        }
    }
}, function(list) {
    EUI.ajax({
        url: "/staff?cmd=list-staff",
        json: true,
        context: list,
        onfinish: list.add
    });

    /**
     * 保存按钮，编辑选中员工信息
     */
    EUI.getCmp("button", {
        pelem: "con-list",
        caption: "保存",
        args: list,
        onclick: function(btn, list) {
            var datas = list.getData(["id", "name", "tel", "msg", "status"], true),
                len = datas.length;
            if (len) {
                for (var i = 0; i < len; i++) {
                    if (!datas[i]["name"]) {
                        EUI.alert("第" + (i + 1) + "行人员信息中姓名不能为空，请核实后重新保存.");
                        return;
                    }
                }
                EUI.ajax({
                    url: "/staff?cmd=update-staff&staffs=" + JSON.stringify(datas),
                    args: list,
                    json: true,
                    onfinish: function(datas, list) {
                        if (datas) {
                            list.clear();
                            list.add(datas);
                            EUI.alert("保存成功！");
                        } else {
                            EUI.alert("保存出错");
                        }
                    }
                });
            } else {
                EUI.alert("没有任何修改信息，不需要保存.");
            }
        }
    }, function(btn) {
        btn.getContainer().style.cssText += '; position: absolute; margin: 10px 0 0 10px;';
    });

    EUI.registKeyEvent(list);
});