window.SERCToast = {
  show(message, timeout = 2400) {
    let toast = document.getElementById('sercToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'sercToast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), timeout);
  }
};
