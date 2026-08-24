/* Verifica sessão e impede uso da área privada sem login */
(function () {
  function redirecionarLogin() {
    window.location.replace('/login.html');
  }
  fetch('/api/sessao', { credentials: 'same-origin', cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) redirecionarLogin();
    })
    .catch(function () {
      redirecionarLogin();
    });
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      fetch('/api/sessao', { credentials: 'same-origin', cache: 'no-store' })
        .then(function (r) { if (!r.ok) redirecionarLogin(); })
        .catch(redirecionarLogin);
    }
  });
})();
