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

EUI.getCmp("list", {
  pelem: "con-list",
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
    caption: "型号"
  }, {
    width: 120,
    name: "count",
    caption: "数量"
  }, {
    width: 120,
    name: "income",
    caption: "货价",
    render: function (cell, value) {
      cell.innerHTML = EUI.toNumber(value, 2);
    }
  }, {
    width: 120,
    name: "price",
    caption: "工价",
    render: function (cell, value) {
      cell.innerHTML = EUI.toNumber(value, 2);
    }
  }, {
    width: 120,
    name: "yf",
    caption: "损耗",
    render: function (cell, value) {
      cell.innerHTML = EUI.toNumber(value, 2);
    }
  }, {
    width: 160,
    name: "total",
    caption: "利润",
    render: function (cell, value, name, i, ridx, list) {
      cell.innerText = EUI.toNumber(value);
      cell.style.color = value > 0 ? '#51688E' : '#F95A3E';
    }
  }]
}, function (list) {
  EUI.ajax({
    url: "/rw?cmd=list-rwzl&date=" + currentDate,
    json: true,
    onfinish: function (rwzl) {
      EUI.ajax({
        url: "/xinghao?cmd=list-xhjg&date=" + currentDate,
        json: true,
        onfinish (xhjg) {
          var data = []
          var totalIncome = 0
          var totalPrice = 0
          var totalYf = 0

          for (let i = 0, len = rwzl.length; i < len; i++) {
            var rw = rwzl[i]
            var xh = rw.xh
            var count = rw.count
            var jg = xhjg[xh]
            if (!jg) {
              data.push({ xh, count, income: '', price: '', yf: '', total: '' })
              continue
            }
            var price = EUI.toNumber((jg.price || 0) * count)
            var income = EUI.toNumber((jg.income || 0) * count)
            var yf = EUI.toNumber((jg.yf || 0) * count)
            totalPrice += price
            totalIncome += income
            totalYf += yf
            data.push({ xh, count, income, price, yf, total: EUI.toNumber(income - price - yf) })
          }
          list.add(data)

          EUI.ajax({
            url: "/salary?cmd=query-shouzhi&date=" + currentDate,
            json: true,
            onfinish: function (shouzhi) {
              var xiankuan = shouzhi.xiankuan || 0
              var koukuan = shouzhi.koukuan || 0
              EUI.query('income').innerText = EUI.toNumber(totalIncome)
              EUI.query('salary').innerText = EUI.toNumber(totalPrice)
              EUI.query('yf').innerText = EUI.toNumber(totalYf)
              EUI.query('total').innerText = EUI.toNumber(totalIncome - totalPrice - totalYf - xiankuan - koukuan)

              var xk = EUI.query('xiankuan')
              var kk = EUI.query('koukuan')
              xk.value = xiankuan
              kk.value = koukuan
              function onInputChange () {
                var xiankuan = +xk.value || 0
                var koukuan = +kk.value || 0
                EUI.query('total').innerText = EUI.toNumber(totalIncome - totalPrice - totalYf - xiankuan - koukuan)
              }
              EUI.bind(xk, 'input', onInputChange)
              EUI.bind(kk, 'input', onInputChange)
            }
          })
        }
      })
    }
  });

  /**
   * 保存
   */
  EUI.getCmp("button", {
    pelem: "con-list",
    caption: "保存",
    args: [list],
    onclick: function (btn, list) {
      var data = {
        income: EUI.toNumber(+EUI.query('income').innerText),
        salary: EUI.toNumber(+EUI.query('salary').innerText),
        yf: EUI.toNumber(+EUI.query('yf').innerText),
        xiankuan: EUI.toNumber(+EUI.query('xiankuan').value || 0),
        koukuan: EUI.toNumber(+EUI.query('koukuan').value || 0),
        total: EUI.toNumber(+EUI.query('total').innerText)
      }
      EUI.ajax({
        url: "/salary?cmd=save-shouzhi&date=" + currentDate + "&shouzhi=" + JSON.stringify(data),
        onfinish: function (datas) {
          if (datas === "OK") {
            EUI.alert("保存成功！");
          } else {
            EUI.alert(datas);
          }
        }
      });
    }
  }, function (btn) {
    btn.getContainer().style.cssText += '; position: absolute; margin: 10px 0 0 10px; right: 50px;';
  });

  EUI.getCmp('button', {
    pelem: 'con-list',
    caption: '打印',
    args: [list],
    onclick: function (btn, list) {
      const datas = list.getData(['xh', 'count', 'income', 'price', 'yf', 'total'], true)
      EUI.printShouzhi([
        { text: '总货款', value: EUI.toNumber(+EUI.query('income').innerText) },
        { text: '工资', value: EUI.toNumber(+EUI.query('salary').innerText) },
        { text: '损耗', value: EUI.toNumber(+EUI.query('yf').innerText) },
        { text: '线款', value: EUI.toNumber(+EUI.query('xiankuan').innerText) },
        { text: '扣款', value: EUI.toNumber(+EUI.query('koukuan').innerText) },
        { text: '总利润', value: EUI.toNumber(+EUI.query('total').innerText) },
      ], datas, [{
        width: '60px',
        text: '序号',
      }, {
        width: '',
        text: '型号',
        name: 'xh'
      }, {
        width: '120px',
        text: '数量',
        name: 'count'
      }, {
        width: '120px',
        text: '货价',
        name: 'income'
      }, {
        width: '120px',
        text: '工价',
        name: 'price'
      }, {
        width: '120px',
        text: '损耗',
        name: 'yf'
      }, {
        width: '160',
        text: '利润',
        name: 'total'
      }], currentDate)
    }
  }, function (btn) {
    btn.getContainer().style.cssText += '; position: absolute; margin: 10px 0 0 10px; right: 140px;';
  })

});