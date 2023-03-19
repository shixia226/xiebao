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
    width: 160,
    name: "count",
    caption: "数量"
  }, {
    width: 160,
    name: "income",
    caption: "货价"
  }, {
    width: 160,
    name: "price",
    caption: "工价"
  }, {
    width: 120,
    name: "yf",
    caption: "运费"
  }, {
    width: 160,
    name: "total",
    caption: "利润",
    render: function (cell, value, name, i, ridx, list) {
      cell.innerText = value;
      cell.style.color = value > 0 ? '#51688E' : '#F95A3E';
    }
  }]
}, function (list) {
  EUI.ajax({
    url: "/rw?cmd=list-rwzl&date=" + currentDate,
    json: true,
    onfinish: function (rwzl) {
      EUI.ajax({
        url: "/xinghao?cmd=list-xhjg",
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
            var price = toNumber((jg.price || 0) * count)
            var income = toNumber((jg.income || 0) * count)
            var yf = toNumber((jg.yf || 0) * count)
            totalPrice += price
            totalIncome += income
            totalYf += yf
            data.push({ xh, count, income, price, yf, total: income - price - yf })
          }
          list.add(data)

          EUI.ajax({
            url: "/salary?cmd=query-shouzhi&date=" + currentDate,
            json: true,
            onfinish: function (shouzhi) {
              var other = shouzhi.other || 0
              EUI.query('income').innerText = toNumber(totalIncome)
              EUI.query('salary').innerText = toNumber(totalPrice)
              EUI.query('yf').innerText = toNumber(totalYf)
              EUI.query('total').innerText = toNumber(totalIncome - totalPrice - totalYf - other)

              EUI.query('other').value = other
              EUI.bind(EUI.query('other'), 'input', function () {
                var other = +this.value || 0
                EUI.query('total').innerText = toNumber(totalIncome - totalPrice - totalYf - other)
              })
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
        income: toNumber(+EUI.query('income').innerText),
        salary: toNumber(+EUI.query('salary').innerText),
        yf: toNumber(+EUI.query('yf').innerText),
        other: toNumber(+EUI.query('other').value || 0),
        total: toNumber(+EUI.query('total').innerText)
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

});

function toNumber (num) {
  return Math.round(num * 1000) / 1000
}