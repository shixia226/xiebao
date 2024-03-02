var resetHeader = (date) => {
  EUI.query("date-ym").innerHTML = date.substr(0, 4) + "年" + date.substr(4) + "月";
};
var pad = (num, len) => {
  var str = new Array(len = len || 2).join('0') + num;
  return str.substr(str.length - len);
};
var getCurrentDate = () => {
  var date = new Date();
  return date.getFullYear() + pad(1 + date.getMonth(), 2);
}
var currentDate = EUI.parseUrl("date") || getCurrentDate();

resetHeader(currentDate);

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
              name: 'text',
              render: function (cell, value, name, i, ridx, list) {
                cell.innerText = value
                if (list.getData(ridx, 'highlight')) {
                  cell.style.fontWeight = 'bold'
                }
              }
            }, {
              width: 30,
              render: function (cell, value, name, i, ridx, list) {
                if (ridx >= 3) {
                  var span = cell.appendChild(list.doc.createElement("span"));
                  span.className = "ui-icon font-icon-minus ui-icon-btn";
                  span.title = "删除该月记录";
                }
              }
            }],
            events: {
              clickcell: function (evt, cidx, ridx) {
                var target = evt.target;
                if (target.nodeName.toUpperCase() === "SPAN") {
                  var ridx = target.parentNode.parentNode.rowIndex;
                  EUI.confirm("确认删除【" + this.getData(ridx, 'text') + "】的数据？", function () {
                    EUI.ajax({
                      url: "/rw?cmd=remove-rw&date=" + this.getData(ridx, 'date'),
                      context: this,
                      onfinish: function () {
                        alert('删除成功！');
                        this.remove(ridx);
                      }
                    });
                  })
                } else {
                  window.location.href = window.location.pathname + '?date=' + this.getData(ridx, 'date');
                }
              }
            }
          }
        }
      }, (dlg) => {
        var list = dlg.getContent();
        if (list) {
          list.clear();
          var datas = data ? data.split(',') : [],
            cdate = getCurrentDate();
          if (datas.indexOf(cdate) === -1) {
            datas.unshift(cdate);
          }
          for (var i = 0, len = datas.length; i < len; i++) {
            var date = datas[i];
            datas[i] = {
              date: date,
              highlight: date === currentDate,
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
  onfinish: function (datas) {
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
        width: 120,
        name: "count",
        caption: "数量",
        validator: /^\d+$/,
        editable: true
      }, {
        width: 30,
        renderheader: function (headerCell, caption, header, i, doc) {
          var span = headerCell.appendChild(doc.createElement("span"));
          span.className = "ui-icon font-icon-add ui-icon-btn";
          span.title = "添加任务";
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
            const list = evt.data
            if (title === "添加任务") {
              list.add();
            } else if (title === "删除") {
              var ridx = target.parentNode.parentNode.rowIndex;
              EUI.confirm("确认删除序号【" + (ridx + 1) + "】的任务？", function () {
                list.remove(ridx);
              })
            }
          }
        },
        ondatachange: function (value, ovalue, name) {
          if (name === 'count') {
            EUI.query("rwzl").innerText = EUI.toNumber(parseFloat(EUI.query('rwzl').innerText) + (+value) - (+ovalue || 0))
          }
        }
      }
    }, function (list) {
      EUI.registKeyEvent(list);
      EUI.ajax({
        url: "/rw?cmd=list-rwzl&date=" + currentDate,
        json: true,
        context: list,
        onfinish (datas) {
          list.add(datas)
          EUI.query("rwzl").innerText = EUI.toNumber(datas.reduce(function (sum, data) {
            return sum + (+data.count || 0)
          }, 0))
        }
      });
      /**
       * 保存
       */
      EUI.getCmp("button", {
        pelem: "con-rwzl",
        caption: "保存",
        args: [list],
        onclick: function (btn, list) {
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
              url: "/rw?cmd=update-rwzl&date=" + currentDate + "&rwzls=" + JSON.stringify(datas),
              onfinish: function (datas) {
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
      }, function (btn) {
        btn.getContainer().style.cssText += '; position: absolute; margin: 10px 0 0 10px; right: 140px;';
      });
      /**
       * 核算
       */
      EUI.getCmp("button", {
        pelem: "con-rwzl",
        caption: "核算",
        args: [list],
        onclick: function (btn, list) {
          EUI.ajax({
            url: "/rw?cmd=check-rw&date=" + currentDate,
            json: true,
            onfinish: function (datas) {
              if (datas.length === 0) {
                EUI.alert("核算无误！");
              } else {
                EUI.getCmp("dialog.checkresult", {
                  caption: "核算结果",
                  width: 600,
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
                        width: 120,
                        name: "xh",
                        caption: "型号"
                      }, {
                        width: 120,
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
                        width: 80,
                        caption: "偏差",
                        render: function(cell, value, name, i, ridx, list) {
                          var count = list.getData(ridx, "count"),
                            ocount = list.getData(ridx, "ocount");
                          const num = count !== -1 ? count - ocount : 0
                          if (num !== 0) {
                            cell.innerHTML = `<span style="color: ${(num < 0 ? '#51688E' : '#F95A3E')};">${Math.abs(num)}</span>`;
                          }
                        }
                      }, {
                        caption: "",
                        render: function (cell, value, name, i, ridx, list) {
                          var count = list.getData(ridx, "count"),
                            ocount = list.getData(ridx, "ocount");
                          cell.innerHTML = '<span style="cursor: pointer; text-decoration: underline; margin-left: 10px; color: ' +
                            (count !== -1 && count <= ocount ? '#51688E' : '#F95A3E') + '">详情</span>';
                        }
                      }],
                      events: {
                        clickcell: function (evt, cidx, ridx) {
                          if (cidx !== 6 || evt.target.tagName.toLowerCase() !== "span") return;
                          var count = this.getData(ridx, "count");
                          if (count === -1) {
                            EUI.alert('该型号可能已被删除，无法核验')
                            return
                          }
                          if (!count) {
                            EUI.alert("完成量为0，无详情.");
                            return;
                          }
                          EUI.ajax({
                            url: "/rw?cmd=list-rw&date=" + currentDate + "&xh=" + this.getData(ridx, 'xh') + "&gx=" + this.getData(ridx, "gx"),
                            json: true,
                            context: this,
                            onfinish: function (datas) {
                              EUI.getCmp("dialog.rwdetail", {
                                caption: "核算结果",
                                width: 360,
                                height: 280,
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
                                      render: function (cell, value, name, c, r, list) {
                                        cell.innerHTML = '<a href="rwxq.html?staff=' + list.getData(r, "staff") + '&date=' + currentDate + '">' + value + '</a>';
                                      }
                                    }, {
                                      width: 80,
                                      name: "count",
                                      caption: "数量"
                                    }]
                                  }
                                },
                                callback: function (list) {
                                  list.add(datas);
                                }
                              }, function (dlg, caption) {
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
                    callback: function (list) {
                      list.add(datas);
                    }
                  }
                }, function (dlg) {
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
      }, function (btn) {
        btn.getContainer().style.cssText += '; position: absolute; margin: 10px 0 0 100px; right: 50px;';
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
    width: 80,
    caption: "序号"
  }, {
    width: 120,
    name: "factory",
    caption: "车间"
  }, {
    name: "name",
    caption: "员工",
    render: function (cell, value, name, c, r, list) {
      cell.innerHTML = '<a href="./rwxq.html?staff=' + list.getData(r, "staff") + '&date=' + currentDate + '&factory=' + (list.getData(r, 'factory') || '') + '">' + value + '</a>';
    }
  }, {
    width: 120,
    name: "salary",
    caption: "收益",
    render: function (cell, value) {
      cell.innerHTML = EUI.toNumber(value, 2);
    }
  }]
}, function (list) {
  EUI.ajax({
    url: "/salary?cmd=list-salary&date=" + currentDate,
    json: true,
    context: list,
    onfinish: function (salaries) {
      list.add(salaries)
      var salary = salaries.reduce(function (sum, salary) { return sum + salary.salary; }, 0)
      EUI.query("total-salary").innerHTML = EUI.toNumber(salary)
    }
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
  EUI.getCmp("button", {
    pelem: "con-pay",
    caption: "打印",
    args: [list],
    onclick: function (btn, list) {
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
        url: '/salary?cmd=list-salaries&date=' + currentDate + '&staff=' + staffs.join(','),
        json: true,
        onfinish: function (data) {
          EUI.printSalary(data, currentDate)
        }
      })
    }
  }, function (btn) {
    btn.getContainer().style.cssText += '; position: absolute; margin: 10px 0 0 10px; right: 50px;';
  });
});

function showErrorData (datas) {
  EUI.getCmp("dialog.detail4error", {
    content: {
      cmp: "list",
      options: {},
      args: datas,
      callback: function (list, datas) { }
    }
  }, function (dlg) { });
}