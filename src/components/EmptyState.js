(function(){ function render({icon='◌',title='Belum ada data',text='Data akan tampil di sini ketika tersedia.',actionHtml='' }={}){return `<div class="syka-empty"><div class="syka-empty-icon">${icon}</div><h3>${window.SYKA_UTILS.escapeHtml(title)}</h3><p>${window.SYKA_UTILS.escapeHtml(text)}</p>${actionHtml}</div>`} window.SYKA_EMPTY={render};})();


