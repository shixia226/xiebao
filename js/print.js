if (window.EUI) {
  window.EUI.print = function (datas, date) {
    date = date.substr(0, 4) + '年' + date.substr(4) + '月'
    var container = document.body.appendChild(document.createElement('div'))
    container.className = 'print-container'
    for (let i = 0, len = datas.length; i < len; i++) {
      const { name, company, factory, salary, details } = datas[i]
      const page = container.appendChild(document.createElement('div'))
      const header = page.appendChild(document.createElement('div'))
      header.style.cssText = '; height: 30px; padding: 5px; font-weight: bold; display: flex; justify-content: space-between;'
      header.innerHTML = `<div>车间：<span style="font-weight: normal; padding-left: 5px;">${factory || '-'}</span></div>
          <div>员工：<span style="font-weight: normal; padding-left: 5px;">${name}</span></div>
          <div>月份：<span style="font-weight: normal; padding-left: 5px;">${date}</span></div>
          <div>总工资：<span style="font-weight: normal; padding-left: 5px;">${salary} 元</span></div>`
      const table = page.appendChild(document.createElement('table'))
      table.style.cssText = '; border-collapse: collapse; width: 100%;'
      const thead = table.appendChild(document.createElement('thead'))
      initHeader(thead)
      initDetails(details, table)
      page.className = 'page-break'
      const watermark = generateWatermark([company, factory, name])
      page.style.cssText = `background-size: ${watermark.width}px ${watermark.height}; background-image: url(${watermark.watermark})`
    }
    setTimeout(()=>{
      window.print()
      document.body.removeChild(container)
    })
  }
}

function initDetails (details, table) {
  for (let i = 0, len = details.length; i < len; i++) {
    const row = table.insertRow(-1)
    initRow(details[i], row, i + 1)
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

let canvasObj = null
const measureTextWidthByCanvas = function (text, font) {
  if (!text) return 0

  // 去除多余空格
  text = text.trim().replace(/ +/g, ' ')
  // canvas 对象
  const canvas = canvasObj || (canvasObj = document.createElement('canvas'))
  const context = canvas.getContext('2d')
  context.font = font
  return context.measureText(text).width
}


// 绘制常量
const devicePixelRatio = window.devicePixelRatio || 1
const GAP_VERTICAL = 20 * devicePixelRatio
const GAP_HORIZONTAL = 120 * devicePixelRatio
const FontSize = 16 * devicePixelRatio
const LineHeight = 22 * devicePixelRatio
const DEFAULT_FONT = `100 ${FontSize}px BlinkMacSystemFont, "PingFang SC", Helvetica, Tahoma, Arial, "Microsoft YaHei", 微软雅黑, 黑体, Heiti, sans-serif, SimSun, 宋体, serif`

const generateWatermark = function (texts) {
  texts = texts.filter(Boolean)
  const canvas = document.createElement('canvas')
  const centerIndex = (texts.length - 1) / 2

  const ctx = canvas.getContext('2d')
  const displayText = texts.map((str) => (str == null ? '' : String(str).slice(0, 200)))
  const width = displayText.reduce((width, text) => Math.max(width, measureTextWidthByCanvas(text, DEFAULT_FONT)), 0)
  const height = LineHeight * displayText.length
  const rotateAngleDeg = -15
  const rotateAngleRadian = (Math.PI / 180) * rotateAngleDeg
  const blockWidth = Math.ceil(Math.abs(Math.cos(rotateAngleRadian) * width) + Math.abs(Math.sin(rotateAngleRadian) * height))
  const blockHeight = Math.ceil(Math.abs(Math.sin(rotateAngleRadian) * width) + Math.abs(Math.cos(rotateAngleRadian) * height))

  canvas.width = (blockWidth + GAP_HORIZONTAL) * 2
  canvas.height = (blockHeight + GAP_VERTICAL) * 2
  ctx.font = DEFAULT_FONT
  ctx.textAlign = 'center'
  ctx.textBaseline = 'hanging'

  const rotateAt = function (x, y, deg) {
    ctx.translate(x, y)
    ctx.rotate((Math.PI / 180) * deg)
    ctx.translate(-x, -y)
  }

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const x = (col + 0.5) * blockWidth + col * GAP_HORIZONTAL
      const y = (row + 0.5) * blockHeight + row * GAP_VERTICAL
      const isVisible = (row + col) % 2 === 1
      ctx.save()
      ctx.fillStyle = isVisible ? 'rgba(18, 20, 22, 0.3)' : 'rgba(233, 235, 237, 0.08)'
      rotateAt(x, y, rotateAngleDeg)
      texts.forEach((line, i) => ctx.fillText(line, x, y + (i - centerIndex) * LineHeight))
      ctx.restore()
    }
  }

  let watermark = canvas.toDataURL('png')
  canvas.remove()

  if (typeof URL.createObjectURL === 'function') {
    watermark = URL.createObjectURL(dataURLtoFile(watermark, 'absolutely_not_watermark.png'))
  }

  return { watermark, width: canvas.width / devicePixelRatio, height: canvas.height / devicePixelRatio }
}

const dataURLtoFile = function (data, filename) {
  const arr = data.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])

  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }

  return new File([u8arr], filename, { type: mime })
}
