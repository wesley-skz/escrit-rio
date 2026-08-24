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

/* ===== CLIENTES ===== */
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
app.post('/atualizar-cliente', (req, res) => {
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
app.post('/excluir-cliente', (req, res) => {
    const { id } = req.body;
    db.run('DELETE FROM clientes WHERE id = ?', [id], function (err) {
        if (err) return res.json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

/* ===== SERVICOS ===== */
app.post('/salvar-servico', (req, res) => {
    const { descricao, preco, tempo_estimado } = req.body;
    db.run('INSERT INTO servicos (descricao, preco, tempo_estimado) VALUES (?, ?, ?)',
        [descricao, parseFloat(preco), parseInt(tempo_estimado)],
        () => res.redirect('/servicos.html'));
});
app.get('/listar-servicos', (req, res) => {
    db.all('SELECT * FROM servicos ORDER BY descricao ASC', [], (err, rows) => res.json(rows || []));
});
app.get('/servico/:id', (req, res) => {
    db.get('SELECT * FROM servicos WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Serviço não encontrado' });
        res.json(row);
    });
});
app.post('/atualizar-servico', (req, res) => {
    const { id, descricao, preco, tempo_estimado } = req.body;
    db.run('UPDATE servicos SET descricao = ?, preco = ?, tempo_estimado = ? WHERE id = ?',
        [descricao, parseFloat(preco), parseInt(tempo_estimado), id],
        function (err) {
            if (err) return res.json({ success: false });
            res.json({ success: true });
        });
});
app.post('/excluir-servico', (req, res) => {
    const { id } = req.body;
    db.run('DELETE FROM servicos WHERE id = ?', [id], () => res.json({ success: true }));
});

/* ===== PROFISSIONAIS ===== */
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
app.get('/profissional/:id', (req, res) => {
    db.get('SELECT * FROM profissionais WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Não encontrado' });
        res.json(row);
    });
});
app.post('/atualizar-profissional', (req, res) => {
    const { id, nome, cpf, telefone_profissional, telefone_pessoal, endereco, especializacao, email } = req.body;
    if (!id || !nome) return res.json({ success: false });
    db.run(
        `UPDATE profissionais SET nome=?, cpf=?, telefone_profissional=?, telefone_pessoal=?, endereco=?, especializacao=?, email=? WHERE id=?`,
        [nome, cpf || '', telefone_profissional || '', telefone_pessoal || '', endereco || '', especializacao || '', email || '', id],
        function (err) {
            if (err) return res.json({ success: false });
            res.json({ success: true });
        }
    );
});
app.post('/excluir-profissional', (req, res) => {
    const { id } = req.body;
    db.run('DELETE FROM profissionais WHERE id = ?', [id], () => res.json({ success: true }));
});

/* ===== AGENDAMENTOS ===== */
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

app.post('/atualizar-agendamento', (req, res) => {
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

app.post('/excluir-agendamento', (req, res) => {
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
