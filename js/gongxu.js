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
    },
    ondatachange: function (value, ovalue, name) {
      if (name === 'price') {
        EUI.query("price").innerText = EUI.toNumber((parseFloat(EUI.query('price').innerText)||0) + (+value||0) - (+ovalue || 0)) + ' 元'
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
              EUI.query('yf').value = xh.yf || ''
              EUI.query('income').value = xh.income || ''
              this.add(xh.gxs)
              EUI.query("price").innerText = EUI.toNumber(xh.gxs.reduce(function (sum, gx) {
                return sum + (+gx.price || 0)
              }, 0)) + ' 元'
            } else {
              EUI.query('yf').value = ''
              EUI.query('income').value = ''
              this.add(xh)
              EUI.query("price").innerText = EUI.toNumber(xh.reduce(function (sum, gx) {
                return sum + (+gx.price || 0)
              }, 0)) + ' 元'
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
        var income = EUI.toNumber(+EUI.query('income').value || 0)
        var yunfei = EUI.toNumber(+EUI.query('yf').value || 0)
        var datas = gongxuList.getData(["gx", "price"], true),
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
            url: "/xinghao?cmd=update-xh&xh=" + xinghao + '&income=' + income + '&yf=' + yunfei + "&gxs=" + encodeURIComponent(JSON.stringify(datas)),
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
      btn.getContainer().style.cssText += '; position: absolute; margin-top: 10px; right: 120px;';
    });
    EUI.getCmp("button", {
      pelem: "con-gongxu",
      caption: "备份所有",
      args: [gongxuList, list],
      onclick: function () {
        EUI.confirm("备份所有将清空所有可用工序，但不影响之前月份的工资数据？", function () {
          EUI.ajax({
            url: "/xinghao?cmd=backup&date=" + getBackupDate(),
            onfinish: function(data){
              if (data === 'OK') {
                EUI.alert('备份成功', function(){
                  window.location.reload()
                });
              } else {
                EUI.alert('该月份已经备份过，不能重复备份')
              }
            }
          })
        })
      }
    }, function (btn) {
      btn.getContainer().style.cssText += '; position: absolute; margin-top: 10px; right: 12px;';
    })
  });
});

var pad = (num, len) => {
  var str = new Array(len = len || 2).join('0') + num;
  return str.substr(str.length - len);
};
var getBackupDate = () => {
  var date = new Date();
  return date.getFullYear() + pad(date.getMonth(), 2);
}