/**
 * 初始化右边添加/编辑型号工序的列表对象
 */
EUI.getCmp("list", {
  pelem: "con-gongxu",
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
    width: 200,
    name: "gx",
    caption: "名称",
    editable: true
  }, {
    caption: "工价",
    name: "price",
    editable: true,
    validator: function (value) {
      return /^\d+(\.\d+)?$/.test(value);
    }
  }, {
    caption: "货价",
    name: "income",
    editable: true,
    validator: function (value) {
      return /^\d+(\.\d+)?$/.test(value);
    }
  }, {
    width: 30,
    renderheader: function (headerCell, caption, header, i, doc) {
      var span = headerCell.appendChild(doc.createElement("span"));
      span.className = "ui-icon font-icon-add ui-icon-btn";
      span.title = "添加工序";
    },
    render: function (cell, value, name, i, ridx, list) {
      var span = cell.appendChild(list.doc.createElement("span"));
      span.className = "ui-icon font-icon-minus ui-icon-btn";
      span.title = "删除";
    }
  }],
  events: {
    click: function (evt) {
      var target = evt.target;
      if (target.nodeName.toUpperCase() === "SPAN") {
        var title = target.title;
        if (title === "添加工序") {
          evt.data.add();
        } else if (title === "删除") {
          evt.data.remove(target.parentNode.parentNode.rowIndex);
          return false
        }
      }
    }
  }
}, function (gongxuList) {
  EUI.registKeyEvent(gongxuList);
  /**
   * 初始化左边型号列表
   */
  EUI.getCmp("list", {
    pelem: "con-xinghao",
    data$index: true,
    height: "100%",
    datakey: "xh",
    headers: [{
      width: 60,
      caption: "序号"
    }, {
      name: "xh",
      caption: "型号"
    }, {
      width: 30,
      render: function (cell, value, name, i, ridx, list) {
        var span = cell.appendChild(list.doc.createElement("span"));
        span.className = "ui-icon font-icon-minus ui-icon-btn";
        span.title = "删除";
      }
    }],
    events: {
      click: function (evt) {
        var target = evt.target;
        if (target.nodeName.toUpperCase() === "SPAN" && target.title === "删除") {
          var ridx = target.parentNode.parentNode.rowIndex,
            list = evt.data,
            xh = list.getData(ridx, "xh");
          EUI.confirm("确定删除型号【" + xh + "】？", function () {
            EUI.ajax({
              url: "/xinghao?cmd=remove-xh&xh=" + xh,
              context: list,
              onfinish: function (result) {
                if (result === "OK") this.remove(ridx);
              }
            });
          })
          return false;
        }
      }
    },
    args4select: gongxuList,
    onselect: function (idx, row, select, list, gongxuList) {
      gongxuList.clear();
      if (select) {
        EUI.ajax({
          url: "/xinghao?cmd=list-gx&xh=" + (EUI.query("xh").value = list.getData(idx)),
          json: true,
          context: gongxuList,
          onfinish: function (xh) {
            if (xh.gxs) {
              EUI.query('yf').value = xh.yf
              this.add(xh.gxs)
            } else {
              EUI.query('yf').value = 0
              this.add(xh)
            }
          }
        });
      } else {
        EUI.query("xh").value = '';
        EUI.query("yf").value = '';
      }
    }
  }, function (list) {
    /**
     * 请求型号列表
     */
    EUI.ajax({
      url: "/xinghao?cmd=list-xh",
      json: true,
      context: list,
      onfinish: list.add
    });

    /**
     * 新增按钮，保存新建的型号工序
     */
    EUI.getCmp("button", {
      pelem: "con-gongxu",
      caption: "保存",
      args: [gongxuList, list],
      onclick: function (btn, gongxuList, xinghaoList) {
        var xinghao = EUI.query("xh").value;
        if (!xinghao) {
          EUI.alert("型号不能为空.");
          return;
        }
        var yunfei = +EUI.query('yf').value || 0
        var datas = gongxuList.getData(["gx", "price", "income"], true),
          len = datas.length;
        if (len) {
          for (var i = 0; i < len; i++) {
            var data = datas[i];
            if (!data["gx"]) {
              EUI.alert("第" + (i + 1) + "行工序未设置，请核实后保存.");
              return;
            } else if (!data["price"] || data["price"] == "0") {
              EUI.alert("第" + (i + 1) + "行单价不能为0，请核实后保存.");
              return;
            }
          }
          EUI.ajax({
            url: "/xinghao?cmd=update-xh&xh=" + xinghao + '&yf=' + yunfei + "&gxs=" + encodeURIComponent(JSON.stringify(datas)),
            context: xinghaoList,
            onfinish: function () {
              if (this.getIndex(xinghao, "xh") === -1) {
                this.add({
                  xh: xinghao
                });
              }
              EUI.alert("保存成功.");
            }
          });
        } else {
          EUI.alert("没有添加任何工序，请添加工序后保存.");
        }
      }
    }, function (btn) {
      btn.getContainer().style.cssText += '; position: absolute; margin-top: 10px; right: 50px;';
    });
  });
});