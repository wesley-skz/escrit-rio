/* CPF/CNPJ: máscara automática + checagem só de formato/quantidade */
(function (global) {
  function soDigitos(v) {
    return String(v || '').replace(/\D/g, '');
  }

  /** Formata só com números: até 11 → CPF; 12–14 → CNPJ */
  function formatarCpfCnpj(valor) {
    var n = soDigitos(valor).slice(0, 14);
    if (n.length <= 11) {
      return n
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return n
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  /** Só quantidade: 11 = CPF ok | 14 = CNPJ ok — sem dígito verificador */
  function cpfCnpjStatus(valor) {
    var n = soDigitos(valor);
    if (!n) return { ok: null, msg: '' };

    if (n.length < 11) {
      return { ok: null, msg: 'Continue digitando… (CPF: 11 dígitos | CNPJ: 14)' };
    }
    if (n.length === 11) {
      return { ok: true, msg: 'Formato de CPF completo' };
    }
    if (n.length > 11 && n.length < 14) {
      return { ok: null, msg: 'Continue digitando… (CNPJ: 14 dígitos)' };
    }
    if (n.length === 14) {
      return { ok: true, msg: 'Formato de CNPJ completo' };
    }
    return { ok: false, msg: 'Quantidade de dígitos inválida' };
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
      el.textContent = status.msg || '';
      el.className = 'campo-feedback';
    }
  }

  function ligarCpfCnpj(input) {
    if (!input || input._cpfCnpjLigado) return;
    input._cpfCnpjLigado = true;
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('maxlength', '18');
    input.setAttribute('placeholder', 'Digite só os números');

    function aoDigitar() {
      var formatado = formatarCpfCnpj(input.value);
      input.value = formatado;
      aplicarFeedback(input, cpfCnpjStatus(formatado));
    }

    input.addEventListener('input', aoDigitar);
    input.addEventListener('blur', function () {
      aplicarFeedback(input, cpfCnpjStatus(input.value));
    });

    if (input.value) aoDigitar();
  }

  function ligarData(input) {
    if (!input || input._dataLigada) return;
    input._dataLigada = true;
    function checar() { aplicarFeedback(input, dataStatus(input.value)); }
    input.addEventListener('change', checar);
    input.addEventListener('blur', checar);
  }

  global.Validacao = {
    formatarCpfCnpj: formatarCpfCnpj,
    cpfCnpjStatus: cpfCnpjStatus,
    dataStatus: dataStatus,
    ligarCpfCnpj: ligarCpfCnpj,
    ligarData: ligarData,
    soDigitos: soDigitos
  };
})(window);
