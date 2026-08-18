const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// Configurações nativas modernas para leitura de formulários e JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

// Conexão com o Banco de Dados Unificado
const db = new sqlite3.Database(path.join(__dirname, 'advocacia.db'), (err) => {
    if (err) console.error("Erro ao conectar ao SQLite:", err.message);
    else console.log("💾 Banco de dados 'advocacia.db' conectado com sucesso.");
});

// Inicialização das Tabelas
db.serialize(() => {
    // 1. Tabela do Fórum Público
    db.run(`CREATE TABLE IF NOT EXISTS sugestoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL,
        mensagem TEXT NOT NULL
    )`);

    // 2. Tabela de Controle de Acesso / Usuários (RH)
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL,
        nome TEXT NOT NULL,
        cargo TEXT NOT NULL,
        status TEXT DEFAULT 'Ativo'
    )`, (err) => {
        if (!err) {
            db.get("SELECT COUNT(*) as total FROM usuarios", [], (err, row) => {
                if (row && row.total === 0) {
                    const insertAdmin = "INSERT INTO usuarios (usuario, senha, nome, cargo, status) VALUES (?, ?, ?, ?, ?)";
                    db.run(insertAdmin, ['weleygb', '26042009', 'Wesley', 'Administrador', 'Ativo'], (insErr) => {
                        if (!insErr) {
                            console.log("-------------------------------------------------------");
                            console.log("➡️ ACESSO CONFIGURADO: Usuário: weleygb | Senha: 26042009");
                            console.log("-------------------------------------------------------");
                        }
                    });
                }
            });
        }
    });

    // Garante o usuário de acesso principal (atualiza se já existir)
    db.run(`INSERT INTO usuarios (usuario, senha, nome, cargo, status)
            VALUES ('weleygb', '26042009', 'Wesley', 'Administrador', 'Ativo')
            ON CONFLICT(usuario) DO UPDATE SET
                senha = excluded.senha,
                nome = excluded.nome,
                cargo = excluded.cargo,
                status = 'Ativo'`);

    // 3. Tabelas Operacionais Privadas
    db.run(`CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        cpf TEXT NOT NULL,
        telefone TEXT NOT NULL,
        endereco TEXT,
        email TEXT,
        data_nascimento TEXT
    )`);
    // Colunas extras para bancos já existentes
    db.run(`ALTER TABLE clientes ADD COLUMN endereco TEXT`, () => {});
    db.run(`ALTER TABLE clientes ADD COLUMN email TEXT`, () => {});
    db.run(`ALTER TABLE clientes ADD COLUMN data_nascimento TEXT`, () => {});
    db.run(`CREATE TABLE IF NOT EXISTS servicos (id INTEGER PRIMARY KEY AUTOINCREMENT, descricao TEXT NOT NULL, preco REAL NOT NULL, tempo_estimado INTEGER NOT NULL)`);
    db.run(`CREATE TABLE IF NOT EXISTS agendamentos (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL, cliente_id INTEGER NOT NULL, responsavel TEXT NOT NULL, total REAL NOT NULL, tempo_total INTEGER NOT NULL)`);
    db.run(`CREATE TABLE IF NOT EXISTS itens_agendamento (id INTEGER PRIMARY KEY AUTOINCREMENT, agendamento_id INTEGER NOT NULL, servico_id INTEGER NOT NULL, preco_cobrado REAL NOT NULL)`);
});

/* ==========================================================================
   ROTAS DE AUTENTICAÇÃO (LOGIN)
   ========================================================================== */
app.post('/autenticar', (req, res) => {
    const usuarioDigitado = req.body.usuario;
    const senhaDigitada = req.body.senha;

    console.log(`[Tentativa de Acesso] Usuário: ${usuarioDigitado}`);

    if (!usuarioDigitado || !senhaDigitada) {
        return res.send(`<script>alert('Preencha todos os campos!'); window.location.href='/login.html';</script>`);
    }

    const sql = "SELECT * FROM usuarios WHERE usuario = ? AND senha = ? AND status = 'Ativo'";
    db.get(sql, [usuarioDigitado, senhaDigitada], (err, row) => {
        if (err) return res.status(500).send("Erro interno no banco de dados.");
        if (row) {
            console.log(`✅ Acesso Permitido: ${row.nome}`);
            return res.redirect('/painel.html');
        } else {
            console.log("⚠️ Acesso Negado: Credenciais inválidas.");
            return res.send(`<script>alert('Usuário ou Senha incorretos!'); window.location.href='/login.html';</script>`);
        }
    });
});

/* ==========================================================================
   ROTAS PÚBLICAS (FÓRUM / SUGESÕES)
   ========================================================================== */
app.post('/salvar-sugestao', (req, res) => {
    const { nome, tipo, mensagem } = req.body;
    db.run('INSERT INTO sugestoes (nome, tipo, mensagem) VALUES (?, ?, ?)', [nome, tipo, mensagem], () => res.redirect('/sugestoes.html'));
});

app.get('/listar-sugestoes', (req, res) => {
    db.all('SELECT nome, tipo, mensagem FROM sugestoes ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

/* ==========================================================================
   ROTAS PRIVADAS (CLIENTES, SERVIÇOS E OPERAÇÕES)
   ========================================================================== */
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
    db.run('INSERT INTO servicos (descricao, preco, tempo_estimado) VALUES (?, ?, ?)', [descricao, parseFloat(preco), parseInt(tempo_estimado)], () => res.redirect('/servicos.html'));
});

app.get('/listar-servicos', (req, res) => {
    db.all('SELECT * FROM servicos ORDER BY descricao ASC', [], (err, rows) => res.json(rows));
});

app.post('/finalizar-agendamento', (req, res) => {
    const { cliente_id, data, responsavel, total, tempo_total, servicos } = req.body;
    db.run(`INSERT INTO agendamentos (data, cliente_id, responsavel, total, tempo_total) VALUES (?, ?, ?, ?, ?)`, 
    [data, cliente_id, responsavel, total, tempo_total], function(err) {
        if (err) return res.status(500).json({ success: false });
        const agendamentoId = this.lastID;
        if (!servicos || servicos.length === 0) return res.json({ success: true });
        
        let processados = 0;
        servicos.forEach(s => {
            db.run(`INSERT INTO itens_agendamento (agendamento_id, servico_id, preco_cobrado) VALUES (?, ?, ?)`, 
            [agendamentoId, s.id, s.preco], () => {
                processados++;
                if (processados === servicos.length) res.json({ success: true });
            });
        });
    });
});

app.get('/listar-agendamentos', (req, res) => {
    const sql = `SELECT a.id, a.data, a.responsavel, a.total, a.tempo_total, c.nome as nome_cliente FROM agendamentos a INNER JOIN clientes c ON a.cliente_id = c.id ORDER BY a.id DESC`;
    db.all(sql, [], (err, rows) => res.json(rows));
});

app.get('/detalhes-agendamento/:id', (req, res) => {
    const sql = `SELECT i.preco_cobrado, s.descricao, s.tempo_estimado FROM itens_agendamento i INNER JOIN servicos s ON i.servico_id = s.id WHERE i.agendamento_id = ?`;
    db.all(sql, [path.basename(req.params.id)], (err, rows) => res.json(rows));
});

app.listen(3000, () => {
    console.log("=======================================================");
    console.log("🚀 ADVOCACIA INTEGRADA ATIVA: http://localhost:3000");
    console.log("=======================================================");
});
