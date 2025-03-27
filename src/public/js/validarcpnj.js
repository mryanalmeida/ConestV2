/**
 * validarcnpj.js
 */

document.getElementById('inputCnpjSupplier').addEventListener('input', function() {
    const cnpj = this.value.replace(/\D/g, ''); // Remove caracteres não numéricos
    const cnpjHelp = document.getElementById('cnpjHelp');
    const btnCreate = document.getElementById('btnCreate');

    if (validarCNPJ(cnpj)) {
        this.classList.remove('invalid');
        this.classList.add('valid');
        cnpjHelp.textContent = 'CNPJ válido';
        cnpjHelp.style.color = 'green';
        btnCreate.disabled = false;
    } else {
        this.classList.remove('valid');
        this.classList.add('invalid');
        cnpjHelp.textContent = 'CNPJ inválido';
        cnpjHelp.style.color = 'red';
        btnCreate.disabled = true;
    }
});

function validarCNPJ(cnpj) {
    //cnpj = cnpj.replace(/[^\d]+/g, '');

    if (cnpj === '') return false;

    // CNPJ deve ter 14 dígitos
    if (cnpj.length !== 14) return false;

    // CNPJs inválidos conhecidos
    const cnpjsInvalidos = [
        "00000000000000", "11111111111111", "22222222222222",
        "33333333333333", "44444444444444", "55555555555555",
        "66666666666666", "77777777777777", "88888888888888",
        "99999999999999"
    ];
    if (cnpjsInvalidos.includes(cnpj)) return false;

    // Validação dos dígitos verificadores
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1))) return false;

    return true;
}