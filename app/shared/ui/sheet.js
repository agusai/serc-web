window.SERCUI = window.SERCUI || {};

window.SERCUI.showSheet = function (content) {
  let sheet = document.getElementById('sercSheet');
  if (!sheet) {
    sheet = document.createElement('aside');
    sheet.id = 'sercSheet';
    sheet.className = 'sheet';
    sheet.innerHTML = `
      <div class="sheet-header">
        <strong>Details</strong>
        <button type="button" class="sheet-close" aria-label="Close">✕</button>
      </div>
      <div class="sheet-body"></div>
    `;
    document.body.appendChild(sheet);
    sheet.querySelector('.sheet-close').addEventListener('click', () => {
      sheet.classList.remove('is-open');
    });
  }

  const body = sheet.querySelector('.sheet-body');
  body.innerHTML = content;
  sheet.classList.add('is-open');
};
