const { app, BrowserWindow, nativeTheme, Menu, shell, ipcMain, dialog, globalShortcut } = require('electron/main')
const path = require('node:path')

// Importação módulo de conexão 
const { dbConnect, desconectar } = require('./database.js')
// status de conexão com o banco. No MongoDB é mais eficiente mantrer uma única conexão aberta durante todo o tempo de vida do aplicativo e usá-lo quando necessário. Fechar e reabrir constantemente a conexão aumenta a sobrecarga e reduz o desempenho do servidor.
// a variável abaixo é usada para garantir que o banco de dados inicie desconectado (evitar abrir outra instância).
let dbcon = null

// importação do Schema Clientes da camada model
const clienteModel = require('./src/models/Clientes.js')

// importação do Schema Fornecedores da camada model
const fornecedorModel = require('./src/models/Fornecedores.js')

// importação do Schema Produtos da camada model
const produtoModel = require('./src/models/Produtos.js')

// importar biblioteca nativa do JS para manipulação de arquivos e diretórios
const fs = require('fs')

// importar a biblioteca jspdf (instalar usando npm i jspdf)
const { jspdf, default: jsPDF } = require('jspdf')

// Janela Principal
let win
function createWindow() {
    nativeTheme.themeSource = 'light'
    win = new BrowserWindow({
        width: 1100, //largura
        height: 800, //altura
        resizable: false,  // Impede o redimensionamento manual
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    // Menu personalizado
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))

    win.loadFile('./src/views/index.html')

    // botões
    ipcMain.on('open-client', () => {
        clientWindow()
    })

    ipcMain.on('open-supplier', () => {
        supplierWindow()
    })

    ipcMain.on('open-products', () => {
        productsWindow()
    })

    ipcMain.on('open-reports', () => {
        reportsWindow()
    })
}

// Janela Sobre
function aboutWindow() {
    nativeTheme.themeSource = "light"
    const main = BrowserWindow.getFocusedWindow()
    let about
    if (main) {
        about = new BrowserWindow({
            width: 380,
            height: 250,
            autoHideMenuBar: true,
            resizable: false,
            minimizable: false,
            //titleBarStyle: "hidden" // Esconder a barra de estilo (ex: totem de auto atendimento)
            parent: main,
            modal: true,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js')
            }
        })
    }

    about.loadFile('./src/views/sobre.html')

    // Fechar a janela quando receber mensagem do processo de renderização.
    ipcMain.on('close-about', () => {
        if (about && !about.isDestroyed()) {
            about.close()
        }
    })

}

// Janela Clientes
let client
function clientWindow() {
    nativeTheme.themeSource = "light"
    const main = BrowserWindow.getFocusedWindow()
    if (main) {
        client = new BrowserWindow({
            width: 1100, //largura
            height: 800, //altura
            autoHideMenuBar: true, //menu dev
            resizable: true,
            minimizable: true,
            //titleBarStyle: "hidden" // Esconder a barra de estilo (ex: totem de auto atendimento)
            parent: main,
            modal: true,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js')
            }
        })
    }

    client.loadFile('./src/views/clientes.html')
}

// Janela Fornecedores
let supplier
function supplierWindow() {
    nativeTheme.themeSource = "light"
    const main = BrowserWindow.getFocusedWindow()
    if (main) {
        supplier = new BrowserWindow({
            width: 1100,
            height: 800,
            autoHideMenuBar: true,
            resizable: true,
            minimizable: true,
            //titleBarStyle: "hidden" // Esconder a barra de estilo (ex: totem de auto atendimento)
            parent: main,
            modal: true,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js')
            }
        })
    }

    supplier.loadFile('./src/views/fornecedores.html')
}

// Janela Produtos
let products
function productsWindow() {
    nativeTheme.themeSource = "light"
    const main = BrowserWindow.getFocusedWindow()
    if (main) {
        products = new BrowserWindow({
            width: 1100,
            height: 800,
            autoHideMenuBar: true,
            resizable: true,
            minimizable: true,
            //titleBarStyle: "hidden" // Esconder a barra de estilo (ex: totem de auto atendimento)
            parent: main,
            modal: true,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js')
            }
        })
    }

    products.loadFile('./src/views/produtos.html')
}

// Janela Relatórios
let reports
function reportsWindow() {
    nativeTheme.themeSource = "light"
    const main = BrowserWindow.getFocusedWindow()
    if (main) {
        reports = new BrowserWindow({
            width: 1100,
            height: 800,
            autoHideMenuBar: true,
            resizable: true,
            minimizable: true,
            //titleBarStyle: "hidden" // Esconder a barra de estilo (ex: totem de auto atendimento)
            parent: main,
            modal: true,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js')
            }
        })
    }

    reports.loadFile('./src/views/relatorios.html')

}

// Execução assíncrona do aplicativo electron
app.whenReady().then(() => {
    //Registrar atalho global para devtools em qualquer janela ativa
    globalShortcut.register('Ctrl+Shift+I', () => {
        //constante que captura a janela (não importa qual)
        const tools = BrowserWindow.getFocusedWindow()
        if (tools) {
            tools.webContents.openDevTools()
        }
    })

    // Desregistrar o atalho global antes de sair
    app.on('will-quit', () => {
        globalShortcut.unregisterAll()
    })

    createWindow()
    // Melhor local para estabelecer a conexão com o banco de dados
    // Importar antes o módulo de conexã no início do código

    // conexão com o banco de dados
    ipcMain.on('db-connect', async (event, message) => {
        // a linha abaixo estabelece a conexão com o banco
        dbcon = await dbConnect()
        // enviar ao renderizador uma mensagem para trocar o ícone do status do banco de dados
        //delay de 0,5 Seg para sincronizar
        setTimeout(() => {
            event.reply('db-message', "conectado")
        }, 500) //1000ms = 1s
    })

    // desconectar do banco de dados ao encerrar a aplicação
    app.on('before-quit', async () => {
        await desconectar(dbcon)
    })

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

// Encerrar a aplicação quando a janela for fechada (windows e linux)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

//reduzir logs não críticos (mensagens no console quando executar Devtools)
app.commandLine.appendSwitch('log-level', '3')

// Template do menu
const template = [
    {
        label: 'Cadastro',
        submenu: [
            {
                label: 'Clientes',
                click: () => clientWindow()
            },
            {
                label: 'Fornecedores',
                click: () => supplierWindow()
            },
            {
                label: 'Produtos',
                click: () => productsWindow()
            },
            {
                type: 'separator'
            },
            {
                label: 'Sair',
                accelerator: 'Alt+F4',
                click: () => app.quit()
            }

        ]
    },
    {
        label: 'Relatórios',
        submenu: [
            {
                label: 'Clientes',
                click: () => gerarRelatorioClientes()
            },
            {
                label: 'Fornecedores',
                click: () => gerarRelatorioFornecedores()
            },
            {
                label: 'Produtos',
                click: () => gerarRelatorioProdutos()
            },
        ]
    },
    {
        label: 'Ajuda',
        submenu: [
            {
                label: 'Repositório',
                click: () => shell.openExternal('https://github.com/andrewdantas/conestv3')
            },

            {
                label: 'Sobre',
                click: () => aboutWindow()
            }
        ]
    }
]

/****************************************/
/*************** Validação *************/
/**************************************/

// CRUD Read >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// CAMPO DE BUSCA (MENSAGEM 3X "Preencha um nome no campo de busca")
ipcMain.on('dialog-search', () => {
    dialog.showMessageBox({
        type: 'warning',
        title: 'Atenção!',
        message: 'Preencha o campo de busca',
        buttons: ['OK']
    })
})


/****************************************/
/*************** Clientes **************/
/**************************************/

// CRUD Create >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Recebimento dos dados do formulário do cliente
ipcMain.on('new-client', async (event, cliente) => {
    // Teste de recebimento dos dados (Passo 2 - slide) Importante!
    console.log(cliente)

    // Passo 3 - slide (cadastrar os dados do banco de dados)
    try {
        // Criar um novo objeto usando a classe modelo
        const novoCliente = new clienteModel({
            nomeCliente: cliente.nomeCli,
            dddCliente: cliente.dddCli,
            emailCliente: cliente.emailCli,
            cepCliente: cliente.cepCli,
            logradouroCliente: cliente.logradouroCli,
            numeroCliente: cliente.numeroCli,
            bairroCliente: cliente.bairroCli,
            cidadeCliente: cliente.cidadeCli,
            ufCliente: cliente.ufCli,
            telefoneCliente: cliente.telefoneCli,
            cpfCliente: cliente.cpfCli,
            complementoCliente: cliente.complementoCli
        })
        // A linha abaixo usa a biblioteca moongoose para salvar
        await novoCliente.save()

        // Confirmação  de cliente  adicionado no banco
        dialog.showMessageBox({
            type: 'info',
            title: 'Aviso',
            message: "Cliente Adicionado com Sucesso",
            buttons: ['OK']
        })
        // Enviar uma resposta para o renderizador resetar o formulário
        event.reply('reset-form')

    } catch (error) {
        //tratamento personalizado em caso de erro
        //11000 é o código referente ao erro de campos duplicados no banco de dados (unique)
        if (error.code = 11000) {
            dialog.showMessageBox({
                type: 'error',
                title: 'Atenção!',
                message: "O CPF já esta cadastrado\nVerfique se digitou corretamente",
                buttons: ['OK']
            }).then((result) => {
                if (result.response === 0) {
                    event.reply('clear-cpf') // Novo evento para limpar e focar o CPF
                }
            })
        } else {
            console.log(error)
        }
    }

})
// Fim CRUD Create <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// CRUD Read <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
ipcMain.on('search-client', async (event, cliNome) => {
    // teste de recebimento do nome do cliente a ser pesquisado (passo 2)
    console.log(cliNome)
    // Passo 3 e 4 - Pesquisar no banco de dados o client pelo nome
    // find() -> buscar no banco de dados (mongoose)
    // RegExp -> filtro pelo nome do cliente, 'i' insensitive ( maiúsculo ou minúsculo)
    // ATENÇÃO: nomeCliente -> model | cliNome -> renderizador
    try {
        const dadosCliente = await clienteModel.find({
            nomeCliente: new RegExp(cliNome, 'i')
        })
        console.log(dadosCliente) // teste do passo 3 e 4
        // Passo 5 - slide -> enviar os dados do cliente para o renderizador (JSON.stringify converte para JSON)
        // Melhoria na experiência do usuário (se não existir o cliente cadastrado, enviar mensagem e questionar se o usário deseja cadastrar um novo cliente)
        if (dadosCliente.length === 0) {
            dialog.showMessageBox({
                type: 'warning',
                title: 'Clientes',
                message: 'Cliente não cadastrado.\nDeseja cadastrar este cliente?', // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
                buttons: ['Sim', 'Não']
            }).then((result) => {
                console.log(result)
                if (result.response === 0) {
                    // Enviar ao renderizador um pedido para setar o nome do cliente (trazendo do campo de busca) e liberar o botão adicionar
                    event.reply('set-nameClient')
                } else {
                    // Enviar ao renderizador um pedido para limpar os campos do formulário
                    event.reply('reset-form')
                }
            })
        }
        event.reply('data-client', JSON.stringify(dadosCliente))
    } catch (error) {
        console.log(error)
    }
})
// Fim CRUD Read <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// CRUD Update >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
ipcMain.on('update-client', async (event, cliente) => {
    // Teste de recebimento dos dados (passo 2)
    console.log(cliente);

    try {
        const clienteEditado = await clienteModel.findByIdAndUpdate(
            cliente.idCli, {
                nomeCliente: cliente.nomeCli,
                dddCliente: cliente.dddCli,
                emailCliente: cliente.emailCli,
                cepCliente: cliente.cepCli,
                logradouroCliente: cliente.logradouroCli,
                numeroCliente: cliente.numeroCli,
                bairroCliente: cliente.bairroCli,
                cidadeCliente: cliente.cidadeCli,
                ufCliente: cliente.ufCli,
                telefoneCliente: cliente.telefoneCli,
                cpfCliente: cliente.cpfCli,
                complementoCliente: cliente.complementoCli
            },
            {
                new: true
            }
        );

        // Confirmação de sucesso
        dialog.showMessageBox(client, {
            type: 'info',
            message: 'Dados do cliente alterados com sucesso.',
            buttons: ['OK']
        }).then((result) => {
            if (result.response === 0) {
                event.reply('reset-form'); // Resetar o formulário após a edição
            }
        });

    } catch (error) {
        // Tratamento de erro para CPF duplicado
        if (error.code === 11000) {
            dialog.showMessageBox({
                type: 'error',
                title: 'Atenção!',
                message: "O CPF já está cadastrado\nVerifique se digitou corretamente",
                buttons: ['OK']
            }).then((result) => {
                if (result.response === 0) {
                    event.reply('clear-cpf'); // Enviar mensagem para limpar e destacar o campo CPF
                }
            });
        } else {
            console.log(error); // Outros erros
        }
    }
});
// Fim do CRUD Update <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// CRUD Delete <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
ipcMain.on('delete-client', async (event, idCliente) => {
    //Teste de recebimento do id do Cliente (passo 2 do slide)
    console.log(idCliente)
    // Confirmação antes de excluir o cliente *IMPORTANTE*
    // "client" é a variável ref a janela de cleintes
    const { response } = await dialog.showMessageBox(client, {
        type: 'warning',
        buttons: ['Cancelar', 'Excluir'], //[0,1]
        title: 'Atenção!',
        message: 'Tem certeza que deseja excluir esse cliente?'
    })
    // apoio a lógica
    console.log(response)
    if (response === 1) {
        // Passo 3 slide
        try {
            const clienteExcluido = await clienteModel.findByIdAndDelete(idCliente)
            dialog.showMessageBox({
                type: 'info',
                title: 'Aviso',
                message: 'Cliente excluído com sucesso!!!',
                buttons: ['OK']
            })
            event.reply('reset-form')
        } catch (error) {

        }
    }
})
// Fim do CRUD delete >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

/********************************************/
/*************** Fornecedores **************/
/******************************************/

//Acessar site externo (busca do url)
ipcMain.on('url-site', (event, site) => {
    let url = site.url
    //console.log(url)
    shell.openExternal(url)
})


// CRUD Create >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Recebimento dos dados do formulário do fornecedor
ipcMain.on('new-supplier', async (event, fornecedor) => {
    // Teste de recebimento dos dados (Passo 2 - slide) Importante!
    console.log(fornecedor);

    // Passo 3 - slide (cadastrar os dados do banco de dados)
    try {
        // Criar um novo objeto usando a classe modelo
        const novoFornecedor = new fornecedorModel({
            nomeFornecedor: fornecedor.nomeFor,
            dddFornecedor: fornecedor.dddFor,
            siteFornecedor: fornecedor.siteFor,
            cepFornecedor: fornecedor.cepFor,
            logradouroFornecedor: fornecedor.logradouroFor,
            numeroFornecedor: fornecedor.numeroFor,
            bairroFornecedor: fornecedor.bairroFor,
            cidadeFornecedor: fornecedor.cidadeFor,
            ufFornecedor: fornecedor.ufFor,
            cpnjFornecedor: fornecedor.cnpjFor,
            complementoFornecedor: fornecedor.complementoFor,
            telefoneFornecedor: fornecedor.telefoneFor
        });

        // A linha abaixo usa a biblioteca mongoose para salvar
        await novoFornecedor.save();

        // Confirmação de fornecedor adicionado no banco
        dialog.showMessageBox({
            type: 'info',
            title: 'Aviso',
            message: "Fornecedor Adicionado com Sucesso",
            buttons: ['OK']
        });

        // Enviar uma resposta para o renderizador resetar o formulário
        event.reply('reset-form');

    } catch (error) {
        // Tratamento de erro para CNPJ duplicado
        if (error.code === 11000) {
            dialog.showMessageBox({
                type: 'error',
                title: 'Atenção!',
                message: "O CNPJ já está cadastrado\nVerifique se digitou corretamente",
                buttons: ['OK']
            }).then((result) => {
                if (result.response === 0) {
                    event.reply('clear-cnpj'); // Enviar mensagem para limpar e destacar o campo CNPJ
                }
            });
        } else {
            console.log(error); // Outros erros
        }
    }
});
// Fim CRUD Create <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<


// CRUD Read >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

ipcMain.on('search-supplier', async (event, forNome) => {
    // teste de recebimento do nome do fornecedor a ser pesquisado (passo 2)
    console.log(forNome)
    // Passo 3 e 4 - Pesquisar no banco de dados o fornecedor pelo nome
    // find() -> buscar no banco de dados (mongoose)
    // RegExp -> filtro pelo nome do fornecedor, 'i' insensitive ( maiúsculo ou minúsculo)
    // ATENÇÃO: nomeFornecedor -> model | forNome -> renderizador
    try {
        const dadosFornecedor = await fornecedorModel.find({
            nomeFornecedor: new RegExp(forNome, 'i')
        })
        console.log(dadosFornecedor) // teste do passo 3 e 4
        // Passo 5 - slide -> enviar os dados do fornecedor para o renderizador (JSON.stringify converte para JSON)
        // Melhoria na experiência do usuário (se não existir o fornecedor cadastrado, enviar mensagem e questionar se o usário deseja cadastrar um novo fornecedor)
        if (dadosFornecedor.length === 0) {
            dialog.showMessageBox({
                type: 'warning',
                title: 'Fornecedor',
                message: 'Fornecedor não cadastrado.\nDeseja cadastrar este fornecedor?',
                buttons: ['Sim', 'Não']
            }).then((result) => {
                console.log(result)
                if (result.response === 0) {
                    // Enviar ao renderizador um pedido para setar o nome do fornecedor (trazendo do campo de busca) e liberar o botão adicionar
                    event.reply('set-nameSupplier')
                } else {
                    // Enviar ao renderizador um pedido para limpar os campos do formulário
                    event.reply('reset-form')
                }
            })
        }
        event.reply('data-supplier', JSON.stringify(dadosFornecedor))
    } catch (error) {
        console.log(error)
    }
})
// Fim CRUD Read <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// CRUD Update >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
ipcMain.on('update-supplier', async (event, fornecedor) => {
    // Teste de recebimento dos dados (passo 2)
    console.log(fornecedor);

    try {
        const fornecedorEditado = await fornecedorModel.findByIdAndUpdate(
            fornecedor.idFor, {
                nomeFornecedor: fornecedor.nomeFor,
                dddFornecedor: fornecedor.dddFor,
                siteFornecedor: fornecedor.siteFor,
                cepFornecedor: fornecedor.cepFor,
                logradouroFornecedor: fornecedor.logradouroFor,
                numeroFornecedor: fornecedor.numeroFor,
                bairroFornecedor: fornecedor.bairroFor,
                cidadeFornecedor: fornecedor.cidadeFor,
                ufFornecedor: fornecedor.ufFor,
                cpnjFornecedor: fornecedor.cnpjFor,
                complementoFornecedor: fornecedor.complementoFor,
                telefoneFornecedor: fornecedor.telefoneFor
            },
            {
                new: true
            }
        );

        // Confirmação de sucesso
        dialog.showMessageBox(supplier, {
            type: 'info',
            message: 'Dados do fornecedor alterados com sucesso.',
            buttons: ['OK']
        }).then((result) => {
            if (result.response === 0) {
                event.reply('reset-form'); // Resetar o formulário após a edição
            }
        });

    } catch (error) {
        // Tratamento de erro para CNPJ duplicado
        if (error.code === 11000) {
            dialog.showMessageBox({
                type: 'error',
                title: 'Atenção!',
                message: "O CNPJ já está cadastrado\nVerifique se digitou corretamente",
                buttons: ['OK']
            }).then((result) => {
                if (result.response === 0) {
                    event.reply('clear-cnpj'); // Enviar mensagem para limpar e destacar o campo CNPJ
                }
            });
        } else {
            console.log(error); // Outros erros
        }
    }
});
// Fim do CRUD Update <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// CRUD Delete <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
ipcMain.on('delete-supplier', async (event, idFornecedor) => {
    //Teste de recebimento do id do Fornecedor (passo 2 do slide)
    console.log(idFornecedor)
    // Confirmação antes de excluir o Fornecedor *IMPORTANTE*
    // "supplier" é a variável ref a janela de fornecedor
    const { response } = await dialog.showMessageBox(supplier, {
        type: 'warning',
        buttons: ['Cancelar', 'Excluir'], //[0,1]
        title: 'Atenção!',
        message: 'Tem certeza que deseja excluir esse fornecedor?'
    })
    // apoio a lógica
    console.log(response)
    if (response === 1) {
        // Passo 3 slide
        try {
            const fornecedorExcluido = await fornecedorModel.findByIdAndDelete(idFornecedor)
            dialog.showMessageBox({
                type: 'info',
                title: 'Aviso',
                message: 'Fornecedor excluído com sucesso!!!',
                buttons: ['OK']
            })
            event.reply('reset-form')
        } catch (error) {

        }
    }
})
// Fim do CRUD delete >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>



/********************************************/
/*************** Produtos ******************/
/******************************************/

// CRUD Create >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//obter caminho da imagem (executar o open dialog)
ipcMain.handle('open-file-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        title: "Selecionar imagem",
        properties: ['openFile'],
        filters: [
            {
                name: 'Imagens',
                extensions: ['png', 'jpg', 'jpeg']
            }
        ]
    })

    if (canceled === true || filePaths.length === 0) {
        return null
    } else {
        return filePaths[0] //retorna o caminho do arquivo      
    }

})

// Recebimento dos dados do formulário do produto
ipcMain.on('new-product', async (event, produto) => {
    // Teste de recebimento dos dados (Passo 2 - slide) Importante!
    console.log(produto);

    // Resolução de BUG (quando a imagem não for selecionada)
    let caminhoImagemSalvo = "";

    try {
        // Validação de imagens
        if (produto.caminhoImagemPro) {
            // Criar a pasta uploads se não existir
            const uploadDir = path.join(__dirname, 'uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir);
            }

            // Gerar um nome único para o arquivo (para não sobrescrever)
            const fileName = `${Date.now()}_${path.basename(produto.caminhoImagemPro)}`;
            const uploads = path.join(uploadDir, fileName);

            // Copiar o arquivo de imagem para a pasta uploads
            fs.copyFileSync(produto.caminhoImagemPro, uploads);

            // Alterar a variável caminhoImagemSalvo para uploads
            caminhoImagemSalvo = uploads;
        }

        // Cadastrar o produto no banco de dados
        const novoProduto = new produtoModel({
            nomeProduto: produto.nomePro,
            barcodeProduto: produto.barcodePro,
            precoProduto: produto.precoPro,
            fornecedorProduto: produto.fornecedorPro,
            quantidadeProduto: produto.quantidadePro,
            unidadeProduto: produto.unidadePro,
            localProduto: produto.localPro,
            caminhoImagemProduto: caminhoImagemSalvo // Salvando o caminho correto no banco
        });

        // Adicionar produto no banco
        await novoProduto.save();

        // Confirmação
        dialog.showMessageBox({
            type: 'info',
            message: "Produto Adicionado com Sucesso",
            buttons: ['OK']
        }).then((result) => {
            if (result.response === 0) {
                event.reply('reset-form'); // Resetar o formulário após o cadastro
            }
        });

    } catch (error) {
        // Tratamento de erro para barcode duplicado
        if (error.code === 11000) {
            dialog.showMessageBox({
                type: 'error',
                title: 'Atenção!',
                message: "O Barcode já está cadastrado\nVerifique se digitou corretamente",
                buttons: ['OK']
            }).then((result) => {
                if (result.response === 0) {
                    event.reply('clear-barcode'); // Enviar mensagem para limpar e destacar o campo barcode
                }
            });
        } else {
            console.log(error); // Outros erros
        }
    }
});
// Fim CRUD Create <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// CRUD Read - Nome produto >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
ipcMain.on('search-product', async (event, proNome) => {
    // teste de recebimento do nome do produto a ser pesquisado (passo 2)
    console.log(proNome);
    // Passo 3 e 4 - Pesquisar no banco de dados o produto pelo nome
    // find() -> buscar no banco de dados (mongoose)
    // RegExp -> filtro pelo nome do produto, 'i' insensitive ( maiúsculo ou minúsculo)
    // ATENÇÃO: nomeProduto -> model | proNome -> renderizador
    try {
        const dadosProduto = await produtoModel.find({
            nomeProduto: new RegExp(proNome, 'i')
        });
        console.log(dadosProduto); // teste do passo 3 e 4
        // Passo 5 - slide -> enviar os dados do produto para o renderizador (JSON.stringify converte para JSON)
        // Melhoria na experiência do usuário (se não existir o produto cadastrado, enviar mensagem e questionar se o usário deseja cadastrar um novo produto)
        if (dadosProduto.length === 0) {
            dialog.showMessageBox({
                type: 'warning',
                title: 'Produto',
                message: 'Produto não cadastrado.\nDeseja cadastrar este produto?',
                buttons: ['Sim', 'Não']
            }).then((result) => {
                console.log(result);
                if (result.response === 0) {
                    // Enviar ao renderizador um pedido para setar o nome do produto (trazendo do campo de busca) e liberar o botão adicionar
                    event.reply('set-nameProduct', proNome); // Envia o nome do produto para o renderizador
                } else {
                    // Enviar ao renderizador um pedido para limpar os campos do formulário
                    event.reply('reset-form');
                }
            });
        } else {
            event.reply('data-product', JSON.stringify(dadosProduto));
        }
    } catch (error) {
        console.log(error);
    }
});
// Fim CRUD Read <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// CRUD Delete - Nome produto <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
ipcMain.on('delete-product', async (event, idProduto) => {
    //Teste de recebimento do id do Produto (passo 2 do slide)
    console.log(idProduto)
    // Confirmação antes de excluir o Produto *IMPORTANTE*
    // "products" é a variável ref a janela de produtos
    const { response } = await dialog.showMessageBox(products, {
        type: 'warning',
        buttons: ['Cancelar', 'Excluir'], //[0,1]
        title: 'Atenção!',
        message: 'Tem certeza que deseja excluir esse produto?'
    })
    // apoio a lógica
    console.log(response)
    if (response === 1) {
        // Passo 3 slide
        try {
            const produtoExcluido = await produtoModel.findByIdAndDelete(idProduto)
            dialog.showMessageBox({
                type: 'info',
                title: 'Aviso',
                message: 'Produto excluído com sucesso!!!',
                buttons: ['OK']
            })
            event.reply('reset-form')
        } catch (error) {

        }
    }
})
// Fim do CRUD delete >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// CRUD Update produtos>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
ipcMain.on('update-product', async (event, produto) => {
    // Teste de recebimento dos dados (passo 2)
    console.log(produto);

    // Correção de bug com relação ao caminho da imagem
    // Estratégia: se o usuário não trocou a imagem, editar apenas os campos
    if (produto.caminhoImagemPro === "") {
        try {
            const produtoEditado = await produtoModel.findByIdAndUpdate(
                produto.idPro, {
                    nomeProduto: produto.nomePro,
                    barcodeProduto: produto.barcodePro,
                    precoProduto: produto.precoPro,
                    fornecedorProduto: produto.fornecedorPro,
                    quantidadeProduto: produto.quantidadePro,
                    unidadeProduto: produto.unidadePro,
                    localProduto: produto.localPro,
                    // caminhoImagemProduto: caminhoImagemSalvo // Salvando o caminho correto no banco
                },
                {
                    new: true
                }
            );

            // Confirmação de sucesso
            dialog.showMessageBox(products, {
                type: 'info',
                message: 'Dados do produto alterados com sucesso.',
                buttons: ['OK']
            }).then((result) => {
                if (result.response === 0) {
                    event.reply('reset-form'); // Resetar o formulário após a edição
                }
            });

        } catch (error) {
            // Tratamento de erro para barcode duplicado
            if (error.code === 11000) {
                dialog.showMessageBox({
                    type: 'error',
                    title: 'Atenção!',
                    message: "O Barcode já está cadastrado\nVerifique se digitou corretamente",
                    buttons: ['OK']
                }).then((result) => {
                    if (result.response === 0) {
                        event.reply('clear-barcode'); // Enviar mensagem para limpar e destacar o campo barcode
                    }
                });
            } else {
                console.log(error); // Outros erros
            }
        }
    } else {
        try {
            const produtoEditado = await produtoModel.findByIdAndUpdate(
                produto.idPro, {
                    nomeProduto: produto.nomePro,
                    barcodeProduto: produto.barcodePro,
                    precoProduto: produto.precoPro,
                    caminhoImagemProduto: produto.caminhoImagemPro,
                    fornecedorProduto: produto.fornecedorPro,
                    quantidadeProduto: produto.quantidadePro,
                    unidadeProduto: produto.unidadePro,
                    localProduto: produto.localPro,
                },
                {
                    new: true
                }
            );

            // Confirmação de sucesso
            dialog.showMessageBox(products, {
                type: 'info',
                message: 'Dados do produto alterados com sucesso.',
                buttons: ['OK']
            }).then((result) => {
                if (result.response === 0) {
                    event.reply('reset-form'); // Resetar o formulário após a edição
                }
            });

        } catch (error) {
            // Tratamento de erro para barcode duplicado
            if (error.code === 11000) {
                dialog.showMessageBox({
                    type: 'error',
                    title: 'Atenção!',
                    message: "O Barcode já está cadastrado\nVerifique se digitou corretamente",
                    buttons: ['OK']
                }).then((result) => {
                    if (result.response === 0) {
                        event.reply('clear-barcode'); // Enviar mensagem para limpar e destacar o campo barcode
                    }
                });
            } else {
                console.log(error); // Outros erros
            }
        }
    }
});
// Fim do CRUD Update <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

//***************************BARCODE********************************/
//****************************CRUD**********************************/
//>>>>>>>>>>>>>>>>>>>>>>>READ UPDATE CREATE>>>>>>>>>>>>>>>>>>>>>>>>*/


// CRUD Create >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Recebimento dos dados do formulário do produto
ipcMain.on('new-barcode', async (event, produto) => {
    // Teste de recebimento dos dados (Passo 2 - slide) Importante!
    console.log(produto)

    // Passo 3 - slide (cadastrar os dados do banco de dados)
    try {
        // Criar um novo objeto usando a classe modelo
        const novoBarcode = new produtoModel({
            nomeProduto: produto.nomePro,
            barcodeProduto: produto.barcodePro,
            precoProduto: produto.precoPro,
            fornecedorProduto: produto.fornecedorPro,
            quantidadeProduto: produto.quantidadePro,
            unidadeProduto: produto.unidadePro,
            localProduto: produto.localPro,
            caminhoImagemProduto: caminhoImagemSalvo //salvando o caminho correto no banco
        })
        // A linha abaixo usa a biblioteca moongoose para salvar
        await novoBarcode.save()

        // Confirmação  de produto adicionado no banco
        dialog.showMessageBox({
            type: 'info',
            title: 'Aviso',
            message: "Barcode Adicionado com Sucesso",
            buttons: ['OK']
        })
        // Enviar uma resposta para o renderizador resetar o formulário
        event.reply('reset-form')

    } catch (error) {
        console.log(error)
    }
})
// Fim CRUD Create <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// CRUD Read Barcode >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
ipcMain.on('search-barcode', async (event, barCode) => {
    // teste de recebimento do código de barras a ser pesquisado (passo 2)
    console.log(barCode);
    // Passo 3 e 4 - Pesquisar no banco de dados o produto pelo código de barras
    // find() -> buscar no banco de dados (mongoose)
    // RegExp -> filtro pelo código de barras, 'i' insensitive ( maiúsculo ou minúsculo)
    // ATENÇÃO: barcodeProduto -> model | barCode -> renderizador
    try {
        const dadosBarcode = await produtoModel.find({
            barcodeProduto: new RegExp(barCode, 'i')
        });
        console.log(dadosBarcode); // teste do passo 3 e 4
        // Passo 5 - slide -> enviar os dados do produto para o renderizador (JSON.stringify converte para JSON)
        // Melhoria na experiência do usuário (se não existir o produto cadastrado, enviar mensagem e questionar se o usário deseja cadastrar um novo produto)
        if (dadosBarcode.length === 0) {
            dialog.showMessageBox({
                type: 'warning',
                title: 'Barcode',
                message: 'Barcode não cadastrado.\nDeseja cadastrar este barcode?',
                defaultId: 0, //nova linha
                buttons: ['Sim', 'Não']
            }).then((result) => {
                console.log(result);
                if (result.response === 0) {
                    // Enviar ao renderizador um pedido para setar o código de barras e liberar o botão adicionar
                    event.reply('set-barcode', barCode); // Envia o código de barras para o renderizador
                } else {
                    // Enviar ao renderizador um pedido para limpar os campos do formulário
                    event.reply('reset-form');
                }
            });
        } else {
            event.reply('data-barcode', JSON.stringify(dadosBarcode));
        }
    } catch (error) {
        console.log(error);
    }
});

// Fim CRUD Read Barcode <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



/********************************************/
/*************** Relatorios ****************/
/******************************************/

// Relatório de clientes
async function gerarRelatorioClientes() {
    try {
        //listar os clientes por ordem alfabética
        const clientes = await clienteModel.find().sort({nomeCliente: 1})
        console.log(clientes)
        //formatação do documento
        const doc = new jsPDF('p', 'mm', 'a4') //p:portrait e l:landscape
        //tamanho da fonte
        doc.setFontSize(16)
        //escrever um texto (título)
        doc.text("Relatório de clientes", 14, 20) //x, y (mm)
        //Data
        const dataAtual = new Date().toLocaleDateString('pt-BR')
        doc.setFontSize(12)
        doc.text(`Data: ${dataAtual}`, 14, 30)
        //variável de apoio para formatação da altura do conteúdo
        let y = 45
        doc.text("Nome", 14, y)
        doc.text("Telefone", 80, y)
        doc.text("E-mail", 130, y)
        y += 5
        //desenhar uma linha
        doc.setLineWidth(0.5) //expessura da linha
        doc.line(10, y, 200, y) //inicio, fim
        y += 10
        //renderizar os clientes(vetor)
        clientes.forEach((c) => {
            //se ultrapassar o limite da folha  (A4 = 270mm) adicionar outra pagina
            if (y > 250) {
                doc.addPage()
                y = 20 //cabeçalho da outra página
            }
            doc.text(c.nomeCliente, 14, y)
            doc.text(c.telefoneCliente, 80, y)
            doc.text(c.emailCliente || "N/A",  130, y)
            y += 10 //quebra de linha
        })
        //Setar o caminho do arquivo temporário
        const tempDir = app.getPath('temp')
        const filePath = path.join(tempDir, 'clientes.pdf') //nome do arquivo
        //Salvar temporariamente o arquivo
        doc.save(filePath)
        //Abrir o arquivo no navegador padrão
        shell.openPath(filePath)
    } catch (error) {
        console.log(error)
    }
}

// Relatório de produtos
async function gerarRelatorioProdutos() {
    try {
        //listar os produtos por ordem alfabética
        const produtos = await produtoModel.find().sort({nomeProduto: 1})
        console.log(produtos)
        //formatação do documento
        const doc = new jsPDF('l', 'mm', 'a4') //p:portrait e l:landscape
        //tamanho da fonte
        doc.setFontSize(16)
        //escrever um texto (título)
        doc.text("Relatório de produtos", 14, 20) //x, y (mm)
        //Data
        const dataAtual = new Date().toLocaleDateString('pt-BR')
        doc.setFontSize(12)
        doc.text(`Data: ${dataAtual}`, 14, 30)
        //variável de apoio para formatação da altura do conteúdo
        let y = 45
        doc.text("Nome", 14, y)
        doc.text("Barcode", 50, y)
        doc.text("Preço", 100, y)
        doc.text("Fornecedor", 130, y)
        y += 5
        //desenhar uma linha
        doc.setLineWidth(0.5) //expessura da linha
        doc.line(10, y, 200, y) //inicio, fim
        y += 10
        //renderizar os produtos(vetor)
        produtos.forEach((c) => {
            //se ultrapassar o limite da folha  (A4 = 270mm) adicionar outra pagina
            if (y > 250) {
                doc.addPage()
                y = 20 //cabeçalho da outra página
            }
            doc.text(c.nomeProduto, 14, y)
            doc.text(c.barcodeProduto, 50, y)
            doc.text(c.precoProduto || "N/A",  100, y)
            doc.text(c.fornecedorProduto, 130, y)

            y += 10 //quebra de linha
        })
        //Setar o caminho do arquivo temporário
        const tempDir = app.getPath('temp')
        const filePath = path.join(tempDir, 'produtos.pdf') //nome do arquivo
        //Salvar temporariamente o arquivo
        doc.save(filePath)
        //Abrir o arquivo no navegador padrão
        shell.openPath(filePath)
    } catch (error) {
        console.log(error)
    }
}

// Relatório de Forncedores
async function gerarRelatorioFornecedores() {
    try {
        //listar os fornecedores por ordem alfabética
        const fornecedores = await fornecedorModel.find().sort({nomeFornecedor: 1})
        console.log(fornecedores)
        //formatação do documento
        const doc = new jsPDF('p', 'mm', 'a4') //p:portrait e l:landscape
        //tamanho da fonte
        doc.setFontSize(16)
        //escrever um texto (título)
        doc.text("Relatório de fornecedores", 14, 20) //x, y (mm)
        //Data
        const dataAtual = new Date().toLocaleDateString('pt-BR')
        doc.setFontSize(12)
        doc.text(`Data: ${dataAtual}`, 14, 30)
        //variável de apoio para formatação da altura do conteúdo
        let y = 45
        doc.text("Nome", 14, y)
        doc.text("Site", 60, y)
        doc.text("Telefone", 130, y)
        y += 5
        //desenhar uma linha
        doc.setLineWidth(0.5) //expessura da linha
        doc.line(10, y, 200, y) //inicio, fim
        y += 10
        //renderizar os fornecedores(vetor)
        fornecedores.forEach((c) => {
            //se ultrapassar o limite da folha  (A4 = 270mm) adicionar outra pagina
            if (y > 250) {
                doc.addPage()
                y = 20 //cabeçalho da outra página
            }
            doc.text(c.nomeFornecedor, 14, y)
            doc.text(c.siteFornecedor, 60, y)
            doc.text(c.telefoneFornecedor, 130, y)

            y += 10 //quebra de linha
        })
        //Setar o caminho do arquivo temporário
        const tempDir = app.getPath('temp')
        const filePath = path.join(tempDir, 'fornecedores.pdf') //nome do arquivo
        //Salvar temporariamente o arquivo
        doc.save(filePath)
        //Abrir o arquivo no navegador padrão
        shell.openPath(filePath)
    } catch (error) {
        console.log(error)
    }
}

//relatorios.html
// Adicione esses listeners junto com os outros existentes
ipcMain.on('gerar-relatorio-clientes', () => gerarRelatorioClientes());
ipcMain.on('gerar-relatorio-fornecedores', () => gerarRelatorioFornecedores());
ipcMain.on('gerar-relatorio-produtos', () => gerarRelatorioProdutos());

// Handler para carregar fornecedores
ipcMain.handle('carregar-fornecedores', async () => {
    try {
        const fornecedores = await fornecedorModel.find({}, 'nomeFornecedor').sort({ nomeFornecedor: 1 });
        return fornecedores.map(f => f.nomeFornecedor);
    } catch (error) {
        console.error('Erro ao buscar fornecedores:', error);
        return [];
    }
});
