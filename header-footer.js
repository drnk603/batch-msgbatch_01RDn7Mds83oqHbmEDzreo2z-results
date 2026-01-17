(function () {
  var header = document.querySelector('.dr-header');
  if (!header) return;

  var burger = header.querySelector('.dr-header-burger');
  var nav = header.querySelector('.dr-nav');
  if (!burger || !nav) return;

  burger.addEventListener('click', function () {
    var isOpen = burger.classList.toggle('dr-is-open');
    nav.classList.toggle('dr-is-open', isOpen);
    burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
})();
