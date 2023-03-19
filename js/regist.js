//获取用户信息
var ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.once('information', function (event, data) {
  data = data.split(':');
  document.querySelector('.serial').value = data[0];
  document.querySelector('.user').value = data[1] || '';
  document.querySelector('.identity').value = data[2] || '';
  if (!data[2]) {
    var trial = document.querySelector('.trial');
    trial.style.display = 'block';
    ipcRenderer.once('trial', function (evt, data) {
      if (data) {
        document.querySelector('.identity').value = data;
        EUI.alert('恭喜您获得为期3个月的免费试用！', function () {
          window.location.href = './index.html';
        }, '恭喜');
      } else {
        EUI.alert('无法获取免费试用！');
      }
    });
    trial.onclick = function () {
      var user = document.querySelector('.user').value;
      if (!user) {
        alert('用户名不能为空.');
        return;
      }
      trial.style.display = 'none';
      ipcRenderer.send('trial', 'user=' + user.replace(/[:, ]/g, '') + '&serial=' + data[0]);
    }
  } else {
    EUI.alert('注册码已过期，请重新申请.');
  }
});
ipcRenderer.send('information');

document.querySelector('.regist').onclick = function () {
  var user = document.querySelector('.user').value,
    identity = document.querySelector('.identity').value;
  if (!user) {
    alert('用户名不能为空.');
    return;
  }
  if (!identity) {
    alert('注册码不能为空.');
    return;
  }
  ipcRenderer.once('regist', function (evt, data) {
    if (data === 'OK') {
      window.location.href = './index.html';
    } else {
      alert('注册码不正确或已过期，请重新申请.');
    }
  });
  ipcRenderer.send('regist', 'user=' + user.replace(/[:, ]/g, '') + '&identity=' + identity);
}