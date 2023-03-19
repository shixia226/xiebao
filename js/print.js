if (window.EUI) {
  window.EUI.print = function (datas, date) {
    date = date.substr(0, 4) + '年' + date.substr(4) + '月'
    var container = document.body.appendChild(document.createElement('div'))
    container.style.cssText = '; position: fixed; left: 0; top: 0; width: 100%; height: 100%; background: #fff;'
    for (let i = 0, len = datas.length; i < len; i++) {
      const { name, salary, details } = datas[i]
      const header = container.appendChild(document.createElement('div'))
      header.style.cssText = '; height: 30px; padding: 5px; font-weight: bold; display: flex;'
      header.innerHTML = `<div>员工姓名：<span style="font-weight: normal; padding-left: 5px;">${name}</span></div>
          <div style="flex-grow: 1; text-align: center;">工作年月：<span style="font-weight: normal; padding-left: 5px;">${date}</span></div>
          <div>总工资：<span style="font-weight: normal; padding-left: 5px;">${salary} 元</span></div>`
      const table = container.appendChild(document.createElement('table'))
      table.style.cssText = '; border-collapse: collapse; width: 100%;'
      const thead = table.appendChild(document.createElement('thead'))
      initHeader(thead)
      initDetails(details, table)
      container.appendChild(document.createElement('hr')).className = 'page-break'
    }
    window.print()
    document.body.removeChild(container)
  }
}

function initDetails (details, table) {
  for (let i = 0, len = details.length; i < len; i++) {
    const row = table.insertRow(-1)
    initRow(details[i], row, i)
  }
}

function initRow (data, row, index) {
  for (let i = 0, len = Columns.length; i < len; i++) {
    const { name } = Columns[i]
    const cell = row.insertCell(-1)
    cell.style.cssText = '; height: 30px; border-bottom: 1px solid #999; '
    cell.appendChild(document.createTextNode(!name ? index : data[name]))
  }
}

function initHeader (thead) {
  for (let i = 0, len = Columns.length; i < len; i++) {
    const { width, text } = Columns[i]
    const th = thead.appendChild(document.createElement('th'))
    th.style.cssText = '; height: 30px; text-align: left; border-bottom: 1px solid #999; '
    th.style.width = width
    th.appendChild(document.createTextNode(text))
  }
}

const Columns = [{
  width: '60px',
  text: '序号',
}, {
  width: '160px',
  text: '型号',
  name: 'xh'
}, {
  width: '160px',
  text: '工序',
  name: 'gx'
}, {
  width: '160px',
  text: '数量',
  name: 'count'
}, {
  width: '100px',
  text: '单价',
  name: 'price'
}, {
  width: '',
  text: '收益',
  name: 'profit'
}]