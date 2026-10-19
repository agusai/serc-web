document.addEventListener('DOMContentLoaded', () => {
  const message = document.querySelector('.topnav .button');
  if (message) {
    message.addEventListener('click', () => {
      document.body.classList.add('pulse');
    });
  }
});
