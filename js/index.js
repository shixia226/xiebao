EUI.bind(EUI.query('setting'), 'click', function () {
  EUI.ajax({
    url: "/config?cmd=fetch",
    json: true,
    onfinish: function (data) {
      const user = data.user || ''
      const company = data.company || ''
      EUI.getCmp("dialog.setting", {
        caption: "设置",
        width: 320,
        height: 200,
        miniBtns: ["close"],
        btns: [{
          caption: "取消",
          onclick: "hide"
        }, {
          caption: "更新",
          onclick: function () {
            const user = EUI.query('inp-user').value.replace(/[:, ]/g, '').trim()
            const company = EUI.query('inp-company').value.replace(/[:, ]/g, '').trim()
            if (!company) {
              alert('公司名不能为空.');
              return;
            }
            if (!user) {
              alert('用户名不能为空.');
              return;
            }
            EUI.ajax({
              url: "/config?cmd=update&user=" + user + "&company=" + company,
              context: this,
              onfinish () {
                this.hide()
                document.getElementById('user').innerText = '（' + user + '）'
                EUI.alert('更新成功！')
              }
            })
          }
        }],
      }, function (dlg) {
        const content = dlg.getContentDom()
        content.innerHTML = `<div class="item">
            <div class="title required">公司名：</div>
            <input id="inp-company" placeholder="请输入公司名" value="${company}" />
        </div>
        <div class="item">
            <div class="title required">用户名：</div>
            <input id="inp-user" placeholder="请输入用户名" value="${user}" />
        </div>`
        dlg.show(true);
      });
    }
  });
})