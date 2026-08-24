const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

const db = new sqlite3.Database(path.join(__dirname, 'advocacia.db'), (err) => {
    if (err) console.error("Erro ao conectar ao SQLite:", err.message);
    else console.log("💾 Banco de dados 'advocacia.db' conectado com sucesso.");
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS sugestoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL,
        mensagem TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL,
        nome TEXT NOT NULL,
        cargo TEXT NOT NULL,
        status TEXT DEFAULT 'Ativo'
    )`);

    db.run(
        `INSERT INTO usuarios (usuario, senha, nome, cargo, status)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(usuario) DO UPDATE SET
            senha = excluded.senha,
            nome = excluded.nome,
            cargo = excluded.cargo,
            status = 'Ativo'`,
        ['wesleygb', '26042009', 'Wesley', 'Administrador', 'Ativo'],
        (err) => {
            if (!err) {
                console.log("-------------------------------------------------------");
                console.log("➡️ LOGIN: usuário = wesleygb | senha = 26042009");
                console.log("-------------------------------------------------------");
            }
        }
    );
    db.run(`UPDATE usuarios SET senha = ?, status = 'Ativo' WHERE usuario = ?`, ['26042009', 'admin']);

    db.run(`CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        cpf TEXT NOT NULL,
        telefone TEXT NOT NULL,
        endereco TEXT,
        email TEXT,
        data_nascimento TEXT
    )`);
    db.run(`ALTER TABLE clientes ADD COLUMN endereco TEXT`, () => {});
    db.run(`ALTER TABLE clientes ADD COLUMN email TEXT`, () => {});
    db.run(`ALTER TABLE clientes ADD COLUMN data_nascimento TEXT`, () => {});

    db.run(`CREATE TABLE IF NOT EXISTS servicos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao TEXT NOT NULL,
        preco REAL NOT NULL,
        tempo_estimado INTEGER NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS profissionais (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        cpf TEXT,
        telefone_profissional TEXT,
        telefone_pessoal TEXT,
        endereco TEXT,
        especializacao TEXT,
        email TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS agendamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        horario TEXT,
        local TEXT,
        cliente_id INTEGER NOT NULL,
        responsavel TEXT NOT NULL,
        total REAL NOT NULL,
        tempo_total INTEGER NOT NULL,
        status TEXT DEFAULT 'Pendente'
    )`);
    db.run(`ALTER TABLE agendamentos ADD COLUMN horario TEXT`, () => {});
    db.run(`ALTER TABLE agendamentos ADD COLUMN local TEXT`, () => {});
    db.run(`ALTER TABLE agendamentos ADD COLUMN status TEXT DEFAULT 'Pendente'`, () => {});

    db.run(`CREATE TABLE IF NOT EXISTS itens_agendamento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agendamento_id INTEGER NOT NULL,
        servico_id INTEGER NOT NULL,
        preco_cobrado REAL NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS chat_colegas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        autor TEXT NOT NULL,
        mensagem TEXT NOT NULL,
        criado_em TEXT DEFAULT (datetime('now', 'localtime'))
    )`);
});

app.post('/autenticar', (req, res) => {
    const usuarioDigitado = String(req.body.usuario || '').trim();
    const senhaDigitada = String(req.body.senha || '').trim();
    if (!usuarioDigitado || !senhaDigitada) {
        return res.send(`<script>alert('Preencha todos os campos!'); window.location.href='/login.html';</script>`);
    }
    db.get("SELECT * FROM usuarios WHERE usuario = ? AND senha = ? AND status = 'Ativo'",
        [usuarioDigitado, senhaDigitada], (err, row) => {
            if (err) return res.status(500).send("Erro interno no banco de dados.");
            if (row) return res.redirect('/painel.html');
            return res.send(`<script>alert('Usuário ou Senha incorretos!'); window.location.href='/login.html';</script>`);
        });
});

app.post('/salvar-cliente', (req, res) => {
    const { nome, cpf, telefone, endereco, email, data_nascimento } = req.body;
    db.run(
        'INSERT INTO clientes (nome, cpf, telefone, endereco, email, data_nascimento) VALUES (?, ?, ?, ?, ?, ?)',
        [nome, cpf, telefone, endereco || '', email || '', data_nascimento || ''],
        () => res.redirect('/clientes.html')
    );
});
app.get('/listar-clientes', (req, res) => {
    db.all('SELECT * FROM clientes ORDER BY nome ASC', [], (err, rows) => res.json(rows || []));
});
app.get('/cliente/:id', (req, res) => {
    db.get('SELECT * FROM clientes WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Cliente não encontrado' });
        res.json(row);
    });
});

app.post('/salvar-servico', (req, res) => {
    const { descricao, preco, tempo_estimado } = req.body;
    db.run('INSERT INTO servicos (descricao, preco, tempo_estimado) VALUES (?, ?, ?)',
        [descricao, parseFloat(preco), parseInt(tempo_estimado)],
        () => res.redirect('/servicos.html'));
});
app.get('/listar-servicos', (req, res) => {
    db.all('SELECT * FROM servicos ORDER BY descricao ASC', [], (err, rows) => res.json(rows || []));
});
app.post('/atualizar-servico', (req, res) => {
    const { id, descricao, preco, tempo_estimado } = req.body;
    db.run('UPDATE servicos SET descricao = ?, preco = ?, tempo_estimado = ? WHERE id = ?',
        [descricao, parseFloat(preco), parseInt(tempo_estimado), id],
        () => res.json({ success: true }));
});
app.post('/excluir-servico', (req, res) => {
    const { id } = req.body;
    db.run('DELETE FROM servicos WHERE id = ?', [id], () => res.json({ success: true }));
});

app.post('/salvar-profissional', (req, res) => {
    const { nome, cpf, telefone_profissional, telefone_pessoal, endereco, especializacao, email } = req.body;
    db.run(
        `INSERT INTO profissionais (nome, cpf, telefone_profissional, telefone_pessoal, endereco, especializacao, email)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nome, cpf || '', telefone_profissional || '', telefone_pessoal || '', endereco || '', especializacao || '', email || ''],
        () => res.redirect('/servicos.html')
    );
});
app.get('/listar-profissionais', (req, res) => {
    db.all('SELECT * FROM profissionais ORDER BY nome ASC', [], (err, rows) => res.json(rows || []));
});

app.post('/finalizar-agendamento', (req, res) => {
    const { cliente_id, data, horario, local, responsavel, total, tempo_total, servicos } = req.body;
    const dataHora = horario ? `${data} ${horario}` : data;
    db.run(
        `INSERT INTO agendamentos (data, horario, local, cliente_id, responsavel, total, tempo_total, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Pendente')`,
        [dataHora, horario || '', local || '', cliente_id, responsavel, total, tempo_total],
        function (err) {
            if (err) return res.status(500).json({ success: false, error: err.message });
            const agendamentoId = this.lastID;
            if (!servicos || servicos.length === 0) return res.json({ success: true, id: agendamentoId });
            let processados = 0;
            servicos.forEach(s => {
                db.run(`INSERT INTO itens_agendamento (agendamento_id, servico_id, preco_cobrado) VALUES (?, ?, ?)`,
                    [agendamentoId, s.id, s.preco], () => {
                        processados++;
                        if (processados === servicos.length) res.json({ success: true, id: agendamentoId });
                    });
            });
        }
    );
});

app.get('/listar-agendamentos', (req, res) => {
    const status = req.query.status;
    let sql = `SELECT a.*, c.nome as nome_cliente
               FROM agendamentos a
               INNER JOIN clientes c ON a.cliente_id = c.id`;
    const params = [];
    if (status && status !== 'all') {
        sql += ` WHERE IFNULL(a.status, 'Pendente') = ?`;
        params.push(status);
    }
    sql += ` ORDER BY a.id DESC`;
    db.all(sql, params, (err, rows) => res.json(rows || []));
});

app.get('/detalhes-agendamento/:id', (req, res) => {
    const sql = `SELECT i.preco_cobrado, s.descricao, s.tempo_estimado
                 FROM itens_agendamento i
                 INNER JOIN servicos s ON i.servico_id = s.id
                 WHERE i.agendamento_id = ?`;
    db.all(sql, [path.basename(req.params.id)], (err, rows) => res.json(rows || []));
});

app.post('/concluir-agendamento', (req, res) => {
    const { id } = req.body;
    db.run(`UPDATE agendamentos SET status = 'Feito' WHERE id = ?`, [id], function (err) {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

/* Fórum / chat colegas */
app.post('/salvar-chat-colegas', (req, res) => {
    const autor = String(req.body.autor || 'Colega').trim().slice(0, 80);
    const mensagem = String(req.body.mensagem || '').trim().slice(0, 500);
    if (!mensagem) return res.json({ success: false });
    db.run('INSERT INTO chat_colegas (autor, mensagem) VALUES (?, ?)', [autor, mensagem], function (err) {
        if (err) return res.json({ success: false });
        res.json({ success: true, id: this.lastID });
    });
});

app.get('/listar-chat-colegas', (req, res) => {
    db.all('SELECT autor, mensagem, criado_em FROM chat_colegas ORDER BY id ASC LIMIT 100', [], (err, rows) => {
        res.json(rows || []);
    });
});

/* Assistente (consulta dados + FAQ sistema + orientações gerais) */
function responderAssistente(pergunta, ctx) {
    const p = (pergunta || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (/quantos? clientes|total de clientes|clientes cadastrados/.test(p)) {
        return `Há <strong>${ctx.nClientes}</strong> cliente(s) cadastrado(s) no sistema.` +
            (ctx.clientesNomes ? `<br>Exemplos: ${ctx.clientesNomes}` : '');
    }
    if (/quantos? servicos|servicos cadastrados|catalogo|honorarios/.test(p)) {
        return `Há <strong>${ctx.nServicos}</strong> serviço(s) no catálogo.` +
            (ctx.servicosLista ? `<br>${ctx.servicosLista}` : '');
    }
    if (/quantos? profissionais|equipe|advogados cadastrados/.test(p)) {
        return `Há <strong>${ctx.nProfissionais}</strong> profissional(is) cadastrado(s).` +
            (ctx.profNomes ? `<br>Equipe: ${ctx.profNomes}` : '');
    }
    if (/agendamento.*pendente|pendencias|o que falta|pendente/.test(p)) {
        return `Existem <strong>${ctx.nPendentes}</strong> agendamento(s) pendente(s) e <strong>${ctx.nFeitos}</strong> concluído(s).` +
            `<br>Veja a lista em <em>Agendamentos</em> e use <strong>Concluir</strong> para enviar ao Histórico.`;
    }
    if (/como.*(cadastrar|criar).*cliente/.test(p)) {
        return `Em <strong>Clientes</strong>: preencha nome/razão social, CPF/CNPJ, telefone (obrigatórios) e, se quiser, e-mail, endereço e data de nascimento. Depois clique em <em>Salvar Ficha do Cliente</em>.`;
    }
    if (/como.*(cadastrar|criar).*servico/.test(p)) {
        return `Em <strong>Serviços</strong>: informe a descrição, o honorário base (R$) e o prazo em minutos. Clique em <em>Inserir no Catálogo</em>. Profissionais são cadastrados na mesma página, na seção inferior.`;
    }
    if (/como.*(agendar|novo agendamento|marcar)/.test(p)) {
        return `Em <strong>Novo Agendamento</strong>: escolha cliente e profissional, data, horário e local; adicione atos do catálogo e confirme. O registro fica em <em>Agendamentos</em> como Pendente.`;
    }
    if (/como.*concluir|marcar como feito|historico/.test(p)) {
        return `Em <strong>Agendamentos</strong>, clique em <em>Concluir</em> no item pendente. Ele passa a status <strong>Feito</strong> e aparece em <em>Histórico</em>.`;
    }
    if (/login|senha|acessar|entrar/.test(p)) {
        return `Acesso: usuário <strong>wesleygb</strong> e senha configurada no servidor. O login só funciona com <code>npm start</code> (não só pelo GitHub Pages).`;
    }
    if (/forum|ouvidoria|chat|colegas/.test(p)) {
        return `Neste <strong>Fórum</strong>: à esquerda você troca mensagens com a equipe; à direita este assistente responde dúvidas do sistema e orientações gerais.`;
    }
    if (/prazo processual|prazo de recurso|contagem de prazo/.test(p)) {
        return `Orientação geral: prazos processuais costumam contar em dias úteis ou corridos conforme a lei e o tipo de ato (ex.: CPC). Confira sempre o tipo de prazo no processo e no tribunal competente. Isto <strong>não substitui</strong> consulta ao processo nem parecer formal.`;
    }
    if (/honorario|tabela de honorarios|oab/.test(p)) {
        return `Honorários podem seguir tabela da OAB do estado, contrato ou tabela interna do escritório. No sistema, o valor base de cada ato fica em <strong>Serviços</strong> e é usado ao montar o agendamento.`;
    }
    if (/cliente nao aparece|nao lista|lista vazia/.test(p)) {
        return `Listas vazias costumam indicar: (1) nada cadastrado ainda, ou (2) servidor parado. Rode <code>npm start</code> e atualize a página. Cadastros feitos só no Pages estático não gravam no banco.`;
    }
    if (/ajuda|o que voce faz|comandos|menu/.test(p)) {
        return `Posso informar totais de clientes, serviços, profissionais e agendamentos; explicar como usar Clientes, Serviços, Novo Agendamento, Agendamentos e Histórico; e dar orientações gerais (prazos, honorários) — sempre com ressalva de que não são aconselhamento jurídico formal.`;
    }

    return `Recebi: “${pergunta}”.<br><br>` +
        `Resumo do sistema agora: <strong>${ctx.nClientes}</strong> clientes, <strong>${ctx.nServicos}</strong> serviços, <strong>${ctx.nProfissionais}</strong> profissionais, <strong>${ctx.nPendentes}</strong> agendamentos pendentes.<br><br>` +
        `Pergunte, por exemplo: quantos clientes temos? como cadastrar serviço? como concluir agendamento? o que é prazo processual?<br><br>` +
        `<em>Respostas gerais de advocacia são apenas apoio interno e não substituem análise do caso concreto.</em>`;
}

app.post('/assistente', (req, res) => {
    const pergunta = String(req.body.pergunta || '').trim();
    if (!pergunta) return res.json({ resposta: 'Digite uma pergunta.' });

    const ctx = { nClientes: 0, nServicos: 0, nProfissionais: 0, nPendentes: 0, nFeitos: 0,
        clientesNomes: '', servicosLista: '', profNomes: '' };

    db.get('SELECT COUNT(*) as n FROM clientes', [], (e1, r1) => {
        ctx.nClientes = r1 ? r1.n : 0;
        db.get('SELECT COUNT(*) as n FROM servicos', [], (e2, r2) => {
            ctx.nServicos = r2 ? r2.n : 0;
            db.get('SELECT COUNT(*) as n FROM profissionais', [], (e3, r3) => {
                ctx.nProfissionais = r3 ? r3.n : 0;
                db.get(`SELECT COUNT(*) as n FROM agendamentos WHERE IFNULL(status,'Pendente')='Pendente'`, [], (e4, r4) => {
                    ctx.nPendentes = r4 ? r4.n : 0;
                    db.get(`SELECT COUNT(*) as n FROM agendamentos WHERE status='Feito'`, [], (e5, r5) => {
                        ctx.nFeitos = r5 ? r5.n : 0;
                        db.all('SELECT nome FROM clientes ORDER BY nome LIMIT 5', [], (e6, rowsC) => {
                            ctx.clientesNomes = (rowsC || []).map(x => x.nome).join(', ');
                            db.all('SELECT descricao, preco FROM servicos ORDER BY descricao LIMIT 6', [], (e7, rowsS) => {
                                ctx.servicosLista = (rowsS || []).map(s => `• ${s.descricao} (R$ ${Number(s.preco).toFixed(2)})`).join('<br>');
                                db.all('SELECT nome FROM profissionais ORDER BY nome LIMIT 8', [], (e8, rowsP) => {
                                    ctx.profNomes = (rowsP || []).map(x => x.nome).join(', ');
                                    const resposta = responderAssistente(pergunta, ctx);
                                    res.json({ resposta });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

app.listen(3000, () => {
    console.log("=======================================================");
    console.log("🚀 ADVOCACIA INTEGRADA ATIVA: http://localhost:3000");
    console.log("➡️ LOGIN: wesleygb | 26042009");
    console.log("=======================================================");
});
