/**
 * Segurança e Desempenho
 */

const { contextBridge, ipcRenderer} = require('electron')

// Estabelecer a conexão com o banco (pedido para o main abrir a conexão com o banco de dados)
ipcRenderer.send('db-connect')

contextBridge.exposeInMainWorld('api', {
    
    dbMensagem: (message) => ipcRenderer.on('db-message', message),
    fecharJanela: () => ipcRenderer.send('close-about'),
    resetarFormulario: (args) => ipcRenderer.on('reset-form', args),
    validarBusca: () => ipcRenderer.send('dialog-search'),
    janelaClientes: () => ipcRenderer.send('open-client'),
    novoCliente: (cliente) => ipcRenderer.send('new-client', cliente),
    buscarCliente: (cliNome) => ipcRenderer.send('search-client', cliNome),
    renderizarCliente: (dadosCliente) => ipcRenderer.on('data-client', dadosCliente),
    deletarCliente: (idCliente) => ipcRenderer.send('delete-client', idCliente),
    editarCliente: (cliente) => ipcRenderer.send('update-client', cliente),
    setarNomeCliente: (args) => ipcRenderer.on('set-nameClient', args),
    clearCpf: (args) => ipcRenderer.on('clear-cpf', args),
    janelaFornecedores: () => ipcRenderer.send('open-supplier'),
    novoFornecedor: (fornecedor) => ipcRenderer.send('new-supplier', fornecedor),
    buscarFornecedor: (forNome) => ipcRenderer.send('search-supplier', forNome),
    renderizarFornecedor: (dadosFornecedor) => ipcRenderer.on('data-supplier', dadosFornecedor),
    deletarFornecedor: (idFornecedor) => ipcRenderer.send('delete-supplier', idFornecedor),
    editarFornecedor: (fornecedor) => ipcRenderer.send('update-supplier', fornecedor),
    setarNomeFornecedor: (args) => ipcRenderer.on('set-nameSupplier', args),
    abrirSite: (site) => ipcRenderer.send('url-site', site),
    clearCnpj: (args) => ipcRenderer.on('clear-cnpj', args),
    janelaProdutos: () => ipcRenderer.send('open-products'),
    novoProduto: (produto) => ipcRenderer.send('new-product', produto),
    buscarProduto: (proNome) => ipcRenderer.send('search-product', proNome),
    renderizarProduto: (dadosProduto) => ipcRenderer.on('data-product', dadosProduto),
    deletarProduto: (idProduto) => ipcRenderer.send('delete-product', idProduto),
    editarProduto: (produto) => ipcRenderer.send('update-product', produto),
    setarNomeProduto: (args) => ipcRenderer.on('set-nameProduct', args),
    carregarFornecedores: () => ipcRenderer.invoke('carregar-fornecedores'),
    novoBarcode: (produto) => ipcRenderer.send('new-barcode', produto),
    buscarProdutoPorBarcode: (barCode) => ipcRenderer.send('search-barcode', barCode),
    renderizarBarcode: (dadosBarcode) => ipcRenderer.on('data-barcode', dadosBarcode),
    setarBarcode: (args) => ipcRenderer.on('set-barcode', args),
    deletarBarcode: (idProduto) => ipcRenderer.send('delete-barcode', idProduto),
    editarBarcode: (produto) => ipcRenderer.send('update-barcode', produto),
    selecionarArquivo: () => ipcRenderer.invoke('open-file-dialog'),
    clearBarcode: (args) => ipcRenderer.on('clear-barcode', args),
    janelaRelatorios: () => ipcRenderer.send('open-reports'),
    gerarRelatorioClientes: () => ipcRenderer.send('gerar-relatorio-clientes'),
    gerarRelatorioFornecedores: () => ipcRenderer.send('gerar-relatorio-fornecedores'),
    gerarRelatorioProdutos: () => ipcRenderer.send('gerar-relatorio-produtos')
})