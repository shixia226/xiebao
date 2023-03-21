const process = require('child_process')
const fs = require('fs')

process.exec('uglifyjs ./main.js -c -m -o ./main.js')


function scanDir(dir) {
  fs.readdirSync(dir).forEach(function(name){
    if (/\.js/.test(name)) {
      process.exec(`uglifyjs ./${dir}/${name} -c -m -o ./${dir}/${name}`)
    } else {
      scanDir(dir+'/'+name)
    }
  })
}

scanDir('./js')
scanDir('./server')
fs.unlinkSync('./app.js')
fs.unlinkSync('./build.js')