/* Validação de CPF/CNPJ e datas — feedback visual */
(function (global) {
  function soDigitos(v) {
    return String(v || '').replace(/\D/g, '');
  }

  function cpfValido(cpf) {
    var n = soDigitos(cpf);
    if (n.length !== 11 || /^(\d)\1+$/.test(n)) return false;
    var s = 0, i;
    for (i = 0; i < 9; i++) s += parseInt(n.charAt(i), 10) * (10 - i);
    var r = (s * 10) % 11;
    if (r === 10) r = 0;
    if (r !== parseInt(n.charAt(9), 10)) return false;
    s = 0;
    for (i = 0; i < 10; i++) s += parseInt(n.charAt(i), 10) * (11 - i);
    r = (s * 10) % 11;
    if (r === 10) r = 0;
    return r === parseInt(n.charAt(10), 10);
  }

  function cnpjValido(cnpj) {
    var n = soDigitos(cnpj);
    if (n.length !== 14 || /^(\d)\1+$/.test(n)) return false;
    var p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    var p2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    var s = 0, i;
    for (i = 0; i < 12; i++) s += parseInt(n.charAt(i), 10) * p1[i];
    var r = s % 11;
    r = r < 2 ? 0 : 11 - r;
    if (r !== parseInt(n.charAt(12), 10)) return false;
    s = 0;
    for (i = 0; i < 13; i++) s += parseInt(n.charAt(i), 10) * p2[i];
    r = s % 11;
    r = r < 2 ? 0 : 11 - r;
    return r === parseInt(n.charAt(13), 10);
  }

  function cpfCnpjStatus(valor) {
    var n = soDigitos(valor);
    if (!n) return { ok: null, msg: '' };
    if (n.length <= 11) {
      if (n.length < 11) return { ok: false, msg: 'CPF incompleto' };
      return cpfValido(n) ? { ok: true, msg: 'CPF válido' } : { ok: false, msg: 'CPF inválido' };
    }
    if (n.length < 14) return { ok: false, msg: 'CNPJ incompleto' };
    if (n.length > 14) return { ok: false, msg: 'Documento inválido' };
    return cnpjValido(n) ? { ok: true, msg: 'CNPJ válido' } : { ok: false, msg: 'CNPJ inválido' };
  }

  function dataStatus(valor) {
    if (!valor) return { ok: null, msg: '' };
    var d = new Date(valor + 'T12:00:00');
    if (isNaN(d.getTime())) return { ok: false, msg: 'Data inválida' };
    var hoje = new Date();
    if (d > hoje) return { ok: false, msg: 'Data no futuro' };
    var idade = (hoje - d) / (365.25 * 24 * 3600 * 1000);
    if (idade > 120) return { ok: false, msg: 'Data improvável' };
    return { ok: true, msg: 'Data válida' };
  }

  function aplicarFeedback(input, status) {
    var id = input.id + '-fb';
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement('span');
      el.id = id;
      el.className = 'campo-feedback';
      input.parentNode.insertBefore(el, input.nextSibling);
    }
    input.classList.remove('campo-ok', 'campo-erro');
    if (status.ok === true) {
      input.classList.add('campo-ok');
      el.textContent = status.msg;
      el.className = 'campo-feedback fb-ok';
    } else if (status.ok === false) {
      input.classList.add('campo-erro');
      el.textContent = status.msg;
      el.className = 'campo-feedback fb-erro';
    } else {
      el.textContent = '';
      el.className = 'campo-feedback';
    }
  }

  function ligarCpfCnpj(input) {
    if (!input) return;
    function checar() { aplicarFeedback(input, cpfCnpjStatus(input.value)); }
    input.addEventListener('input', checar);
    input.addEventListener('blur', checar);
  }

  function ligarData(input) {
    if (!input) return;
    function checar() { aplicarFeedback(input, dataStatus(input.value)); }
    input.addEventListener('change', checar);
    input.addEventListener('blur', checar);
  }

  global.Validacao = {
    cpfCnpjStatus: cpfCnpjStatus,
    dataStatus: dataStatus,
    ligarCpfCnpj: ligarCpfCnpj,
    ligarData: ligarData,
    soDigitos: soDigitos
  };
})(window);
