const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'advocacia-integrada-sessao-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000
    }
}));

const PAGINAS_PRIVADAS = [
    'painel.html',
    'clientes.html',
    'servicos.html',
    'novo_agendamento.html',
    'agendamentos.html',
    'historico.html',
    'consulta_agendamentos.html',
    'relatorios.html'
];

const AREAS_PUBLICAS = ['civil', 'empresarial', 'trabalho'];
const DB_PATH = path.join(__dirname, 'advocacia.db');

function exigirLogin(req, res, next) {
    if (req.session && req.session.logado) return next();
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') !== -1)) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    return res.redirect('/login.html');
}

function headersSemCache(res) {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
}

function normalizarPublico(v) {
    return (v === true || v === 1 || v === '1' || v === 'on' || v === 'sim') ? 1 : 0;
}

function normalizarArea(area, publico) {
    if (!publico) return '';
    const a = String(area || '').toLowerCase().trim();
    return AREAS_PUBLICAS.includes(a) ? a : '';
}

app.use((req, res, next) => {
    const file = path.basename(req.path);
    if (PAGINAS_PRIVADAS.includes(file)) {
        if (!req.session || !req.session.logado) {
            headersSemCache(res);
            return res.redirect('/login.html');
        }
        headersSemCache(res);
    }
    next();
});

app.use(express.static(__dirname, {
    setHeaders: (res, filePath) => {
        if (PAGINAS_PRIVADAS.some(p => filePath.endsWith(p))) {
            headersSemCache(res);
        }
    }
}));

const db = new sqlite3.Database(DB_PATH, (err) => {
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
        email TEXT,
        publico INTEGER DEFAULT 0,
        area_publica TEXT DEFAULT ''
    )`);
    db.run(`ALTER TABLE profissionais ADD COLUMN publico INTEGER DEFAULT 0`, () => {});
    db.run(`ALTER TABLE profissionais ADD COLUMN area_publica TEXT DEFAULT ''`, () => {});

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
            if (row) {
                req.session.logado = true;
                req.session.usuario = row.usuario;
                req.session.nome = row.nome;
                return req.session.save(() => res.redirect('/painel.html'));
            }
            return res.send(`<script>alert('Usuário ou Senha incorretos!'); window.location.href='/login.html';</script>`);
        });
});

app.get('/sair', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        headersSemCache(res);
        res.redirect('/login.html');
    });
});

app.get('/api/sessao', (req, res) => {
    headersSemCache(res);
    if (req.session && req.session.logado) {
        return res.json({ logado: true, usuario: req.session.usuario, nome: req.session.nome });
    }
    res.status(401).json({ logado: false });
});

/* ===== BACKUP ===== */
app.get('/backup-db', exigirLogin, (req, res) => {
    if (!fs.existsSync(DB_PATH)) return res.status(404).send('Banco não encontrado.');
    const nome = 'advocacia-backup-' + new Date().toISOString().slice(0, 10) + '.db';
    res.download(DB_PATH, nome);
});

app.get('/backup-json', exigirLogin, (req, res) => {
    const tabelas = ['clientes', 'servicos', 'profissionais', 'agendamentos', 'itens_agendamento', 'usuarios'];
    const out = { gerado_em: new Date().toISOString(), dados: {} };
    let pendentes = tabelas.length;
    tabelas.forEach(t => {
        db.all('SELECT * FROM ' + t, [], (err, rows) => {
            out.dados[t] = err ? [] : (rows || []);
            pendentes--;
            if (pendentes === 0) {
                res.setHeader('Content-Disposition', 'attachment; filename=advocacia-backup-' + new Date().toISOString().slice(0, 10) + '.json');
                res.json(out);
            }
        });
    });
});

/* ===== RELATÓRIO ===== */
app.get('/api/relatorio', exigirLogin, (req, res) => {
    const resultado = {
        clientes: 0, servicos: 0, profissionais: 0, profissionaisPublicos: 0,
        agendamentos: 0, pendentes: 0, concluidos: 0, totalHonorarios: 0, ultimos: []
    };
    let passos = 6;
    function fim() {
        passos--;
        if (passos === 0) res.json(resultado);
    }
    db.get('SELECT COUNT(*) as n FROM clientes', [], (e, r) => { resultado.clientes = r ? r.n : 0; fim(); });
    db.get('SELECT COUNT(*) as n FROM servicos', [], (e, r) => { resultado.servicos = r ? r.n : 0; fim(); });
    db.get('SELECT COUNT(*) as n FROM profissionais', [], (e, r) => { resultado.profissionais = r ? r.n : 0; fim(); });
    db.get('SELECT COUNT(*) as n FROM profissionais WHERE IFNULL(publico,0)=1', [], (e, r) => { resultado.profissionaisPublicos = r ? r.n : 0; fim(); });
    db.all(`SELECT IFNULL(status,'Pendente') as st, COUNT(*) as n, SUM(total) as soma FROM agendamentos GROUP BY IFNULL(status,'Pendente')`, [], (e, rows) => {
        (rows || []).forEach(row => {
            resultado.agendamentos += row.n;
            resultado.totalHonorarios += parseFloat(row.soma || 0);
            if (row.st === 'Feito') resultado.concluidos = row.n;
            else resultado.pendentes += row.n;
        });
        fim();
    });
    db.all(`SELECT a.id, a.data, a.status, a.total, c.nome as nome_cliente
            FROM agendamentos a INNER JOIN clientes c ON a.cliente_id = c.id
            ORDER BY a.id DESC LIMIT 10`, [], (e, rows) => {
        resultado.ultimos = rows || [];
        fim();
    });
});

/* ===== CLIENTES ===== */
app.post('/salvar-cliente', exigirLogin, (req, res) => {
    const { nome, cpf, telefone, endereco, email, data_nascimento } = req.body;
    db.run(
        'INSERT INTO clientes (nome, cpf, telefone, endereco, email, data_nascimento) VALUES (?, ?, ?, ?, ?, ?)',
        [nome, cpf, telefone, endereco || '', email || '', data_nascimento || ''],
        () => res.redirect('/clientes.html')
    );
});
app.get('/listar-clientes', exigirLogin, (req, res) => {
    db.all('SELECT * FROM clientes ORDER BY nome ASC', [], (err, rows) => res.json(rows || []));
});
app.get('/cliente/:id', exigirLogin, (req, res) => {
    db.get('SELECT * FROM clientes WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Cliente não encontrado' });
        res.json(row);
    });
});
app.post('/atualizar-cliente', exigirLogin, (req, res) => {
    const { id, nome, cpf, telefone, endereco, email, data_nascimento } = req.body;
    if (!id || !nome || !cpf || !telefone) return res.json({ success: false, error: 'Campos obrigatórios' });
    db.run(
        `UPDATE clientes SET nome=?, cpf=?, telefone=?, endereco=?, email=?, data_nascimento=? WHERE id=?`,
        [nome, cpf, telefone, endereco || '', email || '', data_nascimento || '', id],
        function (err) {
            if (err) return res.json({ success: false, error: err.message });
            res.json({ success: true });
        }
    );
});
app.post('/excluir-cliente', exigirLogin, (req, res) => {
    const { id } = req.body;
    db.run('DELETE FROM clientes WHERE id = ?', [id], function (err) {
        if (err) return res.json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

/* ===== SERVICOS ===== */
app.post('/salvar-servico', exigirLogin, (req, res) => {
    const { descricao, preco, tempo_estimado } = req.body;
    db.run('INSERT INTO servicos (descricao, preco, tempo_estimado) VALUES (?, ?, ?)',
        [descricao, parseFloat(preco), parseInt(tempo_estimado)],
        () => res.redirect('/servicos.html'));
});
app.get('/listar-servicos', exigirLogin, (req, res) => {
    db.all('SELECT * FROM servicos ORDER BY descricao ASC', [], (err, rows) => res.json(rows || []));
});
app.get('/servico/:id', exigirLogin, (req, res) => {
    db.get('SELECT * FROM servicos WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Serviço não encontrado' });
        res.json(row);
    });
});
app.post('/atualizar-servico', exigirLogin, (req, res) => {
    const { id, descricao, preco, tempo_estimado } = req.body;
    db.run('UPDATE servicos SET descricao = ?, preco = ?, tempo_estimado = ? WHERE id = ?',
        [descricao, parseFloat(preco), parseInt(tempo_estimado), id],
        function (err) {
            if (err) return res.json({ success: false });
            res.json({ success: true });
        });
});
app.post('/excluir-servico', exigirLogin, (req, res) => {
    const { id } = req.body;
    db.run('DELETE FROM servicos WHERE id = ?', [id], () => res.json({ success: true }));
});

/* ===== PROFISSIONAIS ===== */
app.post('/salvar-profissional', exigirLogin, (req, res) => {
    const { nome, cpf, telefone_profissional, telefone_pessoal, endereco, especializacao, email, area_publica } = req.body;
    const publico = normalizarPublico(req.body.publico);
    const area = normalizarArea(area_publica, publico);
    if (publico && !area) {
        return res.send(`<script>alert('Selecione a área pública (Civil, Empresarial ou Trabalho).'); window.location.href='/servicos.html';</script>`);
    }
    db.run(
        `INSERT INTO profissionais (nome, cpf, telefone_profissional, telefone_pessoal, endereco, especializacao, email, publico, area_publica)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nome, cpf || '', telefone_profissional || '', telefone_pessoal || '', endereco || '', especializacao || '', email || '', publico, area],
        () => res.redirect('/servicos.html')
    );
});

app.get('/listar-profissionais', exigirLogin, (req, res) => {
    db.all('SELECT * FROM profissionais ORDER BY nome ASC', [], (err, rows) => res.json(rows || []));
});

app.get('/listar-profissionais-publicos', (req, res) => {
    db.all(
        `SELECT id, nome, telefone_profissional, especializacao, email, area_publica
         FROM profissionais
         WHERE IFNULL(publico, 0) = 1 AND IFNULL(area_publica, '') != ''
         ORDER BY nome ASC`,
        [],
        (err, rows) => res.json(rows || [])
    );
});

app.get('/profissional/:id', exigirLogin, (req, res) => {
    db.get('SELECT * FROM profissionais WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Não encontrado' });
        res.json(row);
    });
});

app.post('/atualizar-profissional', exigirLogin, (req, res) => {
    const { id, nome, cpf, telefone_profissional, telefone_pessoal, endereco, especializacao, email, area_publica } = req.body;
    if (!id || !nome) return res.json({ success: false });
    const publico = normalizarPublico(req.body.publico);
    const area = normalizarArea(area_publica, publico);
    if (publico && !area) return res.json({ success: false, error: 'Selecione a área pública' });
    db.run(
        `UPDATE profissionais SET nome=?, cpf=?, telefone_profissional=?, telefone_pessoal=?, endereco=?, especializacao=?, email=?, publico=?, area_publica=? WHERE id=?`,
        [nome, cpf || '', telefone_profissional || '', telefone_pessoal || '', endereco || '', especializacao || '', email || '', publico, area, id],
        function (err) {
            if (err) return res.json({ success: false });
            res.json({ success: true });
        }
    );
});

app.post('/excluir-profissional', exigirLogin, (req, res) => {
    const { id } = req.body;
    db.run('DELETE FROM profissionais WHERE id = ?', [id], () => res.json({ success: true }));
});

/* ===== AGENDAMENTOS ===== */
app.post('/finalizar-agendamento', exigirLogin, (req, res) => {
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

app.get('/listar-agendamentos', exigirLogin, (req, res) => {
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

app.get('/detalhes-agendamento/:id', exigirLogin, (req, res) => {
    const sql = `SELECT i.preco_cobrado, s.descricao, s.tempo_estimado
                 FROM itens_agendamento i
                 INNER JOIN servicos s ON i.servico_id = s.id
                 WHERE i.agendamento_id = ?`;
    db.all(sql, [path.basename(req.params.id)], (err, rows) => res.json(rows || []));
});

app.post('/concluir-agendamento', exigirLogin, (req, res) => {
    const { id } = req.body;
    db.run(`UPDATE agendamentos SET status = 'Feito' WHERE id = ?`, [id], function (err) {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

app.post('/atualizar-agendamento', exigirLogin, (req, res) => {
    const { id, data, horario, local, responsavel } = req.body;
    if (!id) return res.json({ success: false });
    const dataHora = horario ? `${String(data).split(' ')[0]} ${horario}` : data;
    db.run(
        `UPDATE agendamentos SET data=?, horario=?, local=?, responsavel=? WHERE id=?`,
        [dataHora, horario || '', local || '', responsavel || '', id],
        function (err) {
            if (err) return res.json({ success: false, error: err.message });
            res.json({ success: true });
        }
    );
});

app.post('/excluir-agendamento', exigirLogin, (req, res) => {
    const { id } = req.body;
    db.run('DELETE FROM itens_agendamento WHERE agendamento_id = ?', [id], () => {
        db.run('DELETE FROM agendamentos WHERE id = ?', [id], function (err) {
            if (err) return res.json({ success: false });
            res.json({ success: true });
        });
    });
});

app.listen(3000, () => {
    console.log("=======================================================");
    console.log("🚀 ADVOCACIA INTEGRADA ATIVA: http://localhost:3000");
    console.log("➡️ LOGIN: wesleygb | 26042009");
    console.log("=======================================================");
});
