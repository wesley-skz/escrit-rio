/* Validação de formato CPF/CNPJ e datas — não verifica dígito verificador */
(function (global) {
  function soDigitos(v) {
    return String(v || '').replace(/\D/g, '');
  }

  /* Formatos aceitos:
     CPF:  000.000.000-00
     CNPJ: 00.000.000/0000-00
  */
  var RE_CPF  = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
  var RE_CNPJ = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

  function cpfCnpjStatus(valor) {
    var v = String(valor || '').trim();
    if (!v) return { ok: null, msg: '' };

    if (RE_CPF.test(v)) {
      return { ok: true, msg: 'Formato de CPF aceito' };
    }
    if (RE_CNPJ.test(v)) {
      return { ok: true, msg: 'Formato de CNPJ aceito' };
    }

    // Só dígitos ou máscara incompleta → inválido de formato
    var n = soDigitos(v);
    if (n.length > 0 && n.length <= 11 && !RE_CPF.test(v)) {
      return {
        ok: false,
        msg: 'Use o formato de CPF: 000.000.000-00'
      };
    }
    if (n.length > 11) {
      return {
        ok: false,
        msg: 'Use o formato de CNPJ: 00.000.000/0000-00'
      };
    }
    return {
      ok: false,
      msg: 'Formato inválido. CPF: 000.000.000-00 | CNPJ: 00.000.000/0000-00'
    };
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
