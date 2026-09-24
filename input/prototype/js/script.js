document.addEventListener('DOMContentLoaded', function () {

  /* ---- collapsible sidebar filter groups ---- */
  document.querySelectorAll('[data-toggle]').forEach(function (head) {
    head.setAttribute('aria-expanded', 'true');
    head.addEventListener('click', function () {
      var body = head.nextElementSibling;
      var expanded = head.getAttribute('aria-expanded') === 'true';
      head.setAttribute('aria-expanded', String(!expanded));
      body.classList.toggle('collapsed', expanded);
    });
  });

  /* ---- tabs ---- */
  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('tab--active'); });
      tab.classList.add('tab--active');
    });
  });

  /* ---- favourite star toggle ---- */
  document.querySelectorAll('.fav').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var path = btn.querySelector('path');
      var active = btn.classList.toggle('fav--active');
      path.setAttribute('fill', active ? '#f4b400' : 'none');
    });
  });

  /* ---- notify modal ---- */
  var pillBtn = document.getElementById('notifyPillBtn');
  var overlay = document.getElementById('notifyModal');
  var closeBtn = document.getElementById('notifyCloseBtn');

  function openModal() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  pillBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  /* ---- mobile hamburger toggles main nav ---- */
  var hamburger = document.getElementById('hamburgerBtn');
  var mainnav = document.getElementById('mainnav');
  hamburger.addEventListener('click', function () {
    mainnav.classList.toggle('mainnav--open');
  });
});
