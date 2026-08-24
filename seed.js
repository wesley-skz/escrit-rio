/**
 * Seed de dados fictícios — Advocacia Integrada
 *
 * No Codespace ou na máquina local:
 *   git pull origin main
 *   npm install
 *   npm run seed
 *   npm start
 *
 * Insere: 19 clientes, 16 serviços, 12 profissionais, 12 agendamentos
 * (apaga antes os dados operacionais; não apaga usuarios)
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'advocacia.db');
const db = new sqlite3.Database(dbPath);

const clientes = [
  ['Pedro Henrique Silva', '123.456.789-00', '(41) 98765-4321', 'Rua das Acácias, 10 - Curitiba', 'pedro.silva@email.com', '1985-03-12'],
  ['Maria Oliveira Santos', '234.567.890-11', '(41) 97654-3210', 'Av. Paraná, 250 - Curitiba', 'maria.santos@email.com', '1990-07-22'],
  ['José Carlos Pereira', '345.678.901-22', '(41) 96543-2109', 'Rua Visconde de Guarapuava, 500 - Curitiba', 'jose.pereira@email.com', '1978-11-05'],
  ['Empresa Alpha Ltda', '12.345.678/0001-90', '(41) 3333-2001', 'Rua Emiliano Perneta, 100 - Curitiba', 'contato@alpha.com.br', ''],
  ['Fernanda Rocha Alves', '456.789.012-33', '(41) 95432-1098', 'Rua Coronel Dulcídio, 80 - Curitiba', 'fernanda.alves@email.com', '1992-01-18'],
  ['Ricardo Mendes Souza', '567.890.123-44', '(41) 94321-0987', 'Av. Iguaçu, 1200 - Curitiba', 'ricardo.souza@email.com', '1980-09-30'],
  ['Construtora Beta S.A.', '23.456.789/0001-01', '(41) 3333-2002', 'Rua Cândido Lopes, 45 - Curitiba', 'juridico@beta.com.br', ''],
  ['Amanda Cristina Lopes', '678.901.234-55', '(41) 93210-9876', 'Rua Desembargador Westphalen, 220 - Curitiba', 'amanda.lopes@email.com', '1995-04-08'],
  ['Thiago Augusto Nunes', '789.012.345-66', '(41) 92109-8765', 'Rua Trajano Reis, 33 - Curitiba', 'thiago.nunes@email.com', '1988-12-14'],
  ['Comércio Gama ME', '34.567.890/0001-12', '(41) 3333-2003', 'Rua Benedito Novo, 15 - Curitiba', 'vendas@gama.com.br', ''],
  ['Juliana Ferreira Dias', '890.123.456-77', '(41) 91098-7654', 'Av. do Batel, 1400 - Curitiba', 'juliana.dias@email.com', '1993-06-25'],
  ['Eduardo Lima Barbosa', '901.234.567-88', '(41) 90987-6543', 'Rua Mateus Leme, 90 - Curitiba', 'eduardo.barbosa@email.com', '1975-02-17'],
  ['Patricia Gomes Costa', '012.345.678-99', '(41) 98876-5432', 'Rua Brigadeiro Franco, 300 - Curitiba', 'patricia.costa@email.com', '1987-08-03'],
  ['Transportes Delta Ltda', '45.678.901/0001-23', '(41) 3333-2004', 'Rod. BR-277, km 5 - Curitiba', 'rh@delta.com.br', ''],
  ['Lucas Martins Rocha', '135.246.357-00', '(41) 97765-4321', 'Rua Augusto Stresser, 70 - Curitiba', 'lucas.rocha@email.com', '1991-10-11'],
  ['Camila Duarte Pires', '246.357.468-11', '(41) 96654-3210', 'Av. Silva Jardim, 550 - Curitiba', 'camila.pires@email.com', '1994-05-19'],
  ['Indústria Épsilon S.A.', '56.789.012/0001-34', '(41) 3333-2005', 'Rua Professor Pedro Viriato, 200 - Curitiba', 'financeiro@epsilon.com.br', ''],
  ['Roberto Carlos Souza', '357.468.579-22', '(41) 95543-2109', 'Rua João Gualberto, 800 - Curitiba', 'roberto.souza@email.com', '1970-03-28'],
  ['Vanessa Almeida Cruz', '468.579.680-33', '(41) 94432-1098', 'Rua Comendador Araújo, 210 - Curitiba', 'vanessa.cruz@email.com', '1989-09-07'],
];

const servicos = [
  ['Consultoria jurídica inicial', 250, 60],
  ['Elaboração de contrato social', 800, 180],
  ['Ação de cobrança', 1200, 240],
  ['Defesa trabalhista', 1500, 300],
  ['Inventário extrajudicial', 2000, 360],
  ['Divórcio consensual', 1800, 240],
  ['Habeas corpus', 2500, 120],
  ['Recurso de apelação', 1600, 300],
  ['Acordo extrajudicial', 900, 90],
  ['Parecer jurídico escrito', 700, 150],
  ['Acompanhamento de audiência', 600, 120],
  ['Regularização de imóvel', 1400, 280],
  ['Defesa em processo criminal', 2200, 360],
  ['Ação de despejo', 1100, 200],
  ['Mediação familiar', 850, 120],
  ['Consultoria tributária', 1300, 180],
];

const profissionais = [
  ['Ana Paula Mendes', '111.222.333-44', '(41) 3333-1001', '(41) 99911-1001', 'Rua das Flores, 120 - Curitiba', 'Direito Civil', 'ana.mendes@adv.com'],
  ['Bruno Ferreira Costa', '222.333.444-55', '(41) 3333-1002', '(41) 99922-1002', 'Av. Brasil, 450 - Curitiba', 'Direito Trabalhista', 'bruno.costa@adv.com'],
  ['Carla Souza Lima', '333.444.555-66', '(41) 3333-1003', '(41) 99933-1003', 'Rua XV de Novembro, 88 - Curitiba', 'Direito de Família', 'carla.lima@adv.com'],
  ['Diego Alves Rocha', '444.555.666-77', '(41) 3333-1004', '(41) 99944-1004', 'Rua Marechal Deodoro, 200 - Curitiba', 'Direito Penal', 'diego.rocha@adv.com'],
  ['Elisa Martins Prado', '555.666.777-88', '(41) 3333-1005', '(41) 99955-1005', 'Av. Sete de Setembro, 900 - Curitiba', 'Direito Tributário', 'elisa.prado@adv.com'],
  ['Felipe Nogueira Dias', '666.777.888-99', '(41) 3333-1006', '(41) 99966-1006', 'Rua Comendador Araújo, 55 - Curitiba', 'Direito Empresarial', 'felipe.dias@adv.com'],
  ['Gabriela Torres Reis', '777.888.999-00', '(41) 3333-1007', '(41) 99977-1007', 'Rua Barão do Rio Branco, 310 - Curitiba', 'Direito Imobiliário', 'gabriela.reis@adv.com'],
  ['Henrique Pires Santos', '888.999.000-11', '(41) 3333-1008', '(41) 99988-1008', 'Av. República Argentina, 700 - Curitiba', 'Direito Civil', 'henrique.santos@adv.com'],
  ['Isabela Campos Duarte', '999.000.111-22', '(41) 3333-1009', '(41) 99999-1009', 'Rua Voluntários da Pátria, 150 - Curitiba', 'Direito Trabalhista', 'isabela.duarte@adv.com'],
  ['João Pedro Almeida', '101.202.303-40', '(41) 3333-1010', '(41) 99801-1010', 'Rua Mateus Leme, 420 - Curitiba', 'Direito Penal', 'joao.almeida@adv.com'],
  ['Larissa Barbosa Melo', '202.303.404-50', '(41) 3333-1011', '(41) 99802-1011', 'Av. Vicente Machado, 80 - Curitiba', 'Direito de Família', 'larissa.melo@adv.com'],
  ['Marcos Vinícius Teixeira', '303.404.505-60', '(41) 3333-1012', '(41) 99803-1012', 'Rua Padre Anchieta, 600 - Curitiba', 'Direito Empresarial', 'marcos.teixeira@adv.com'],
];

// [clienteIdx, data, horario, local, profIdx, servicoIdx, status]
const agendamentosPlan = [
  [0, '2026-08-25 09:00', '09:00', 'Sede', 0, 0, 'Pendente'],
  [1, '2026-08-26 10:30', '10:30', 'Sede', 2, 5, 'Pendente'],
  [3, '2026-08-27 14:00', '14:00', 'Sede', 5, 1, 'Pendente'],
  [2, '2026-08-28 11:00', '11:00', 'Fórum', 1, 3, 'Pendente'],
  [4, '2026-08-29 15:00', '15:00', 'Sede', 4, 15, 'Pendente'],
  [5, '2026-09-01 09:30', '09:30', 'Sede', 6, 11, 'Pendente'],
  [6, '2026-09-02 16:00', '16:00', 'Sede', 11, 9, 'Pendente'],
  [7, '2026-09-03 10:00', '10:00', 'Sede', 10, 14, 'Pendente'],
  [8, '2026-09-04 13:30', '13:30', 'Fórum', 3, 12, 'Feito'],
  [10, '2026-09-05 08:30', '08:30', 'Sede', 7, 2, 'Feito'],
  [11, '2026-09-08 11:30', '11:30', 'Sede', 8, 8, 'Feito'],
  [12, '2026-09-09 14:30', '14:30', 'Fórum', 9, 6, 'Feito'],
];

function run(sql, params) {
  return new Promise(function (resolve, reject) {
    db.run(sql, params || [], function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function main() {
  console.log('🌱 Populando banco:', dbPath);

  await run('CREATE TABLE IF NOT EXISTS clientes (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, cpf TEXT NOT NULL, telefone TEXT NOT NULL, endereco TEXT, email TEXT, data_nascimento TEXT)');
  await run('CREATE TABLE IF NOT EXISTS servicos (id INTEGER PRIMARY KEY AUTOINCREMENT, descricao TEXT NOT NULL, preco REAL NOT NULL, tempo_estimado INTEGER NOT NULL)');
  await run('CREATE TABLE IF NOT EXISTS profissionais (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, cpf TEXT, telefone_profissional TEXT, telefone_pessoal TEXT, endereco TEXT, especializacao TEXT, email TEXT)');
  await run('CREATE TABLE IF NOT EXISTS agendamentos (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL, horario TEXT, local TEXT, cliente_id INTEGER NOT NULL, responsavel TEXT NOT NULL, total REAL NOT NULL, tempo_total INTEGER NOT NULL, status TEXT DEFAULT \'Pendente\')');
  await run('CREATE TABLE IF NOT EXISTS itens_agendamento (id INTEGER PRIMARY KEY AUTOINCREMENT, agendamento_id INTEGER NOT NULL, servico_id INTEGER NOT NULL, preco_cobrado REAL NOT NULL)');

  await run('DELETE FROM itens_agendamento');
  await run('DELETE FROM agendamentos');
  await run('DELETE FROM clientes');
  await run('DELETE FROM servicos');
  await run('DELETE FROM profissionais');

  for (var i = 0; i < clientes.length; i++) {
    await run('INSERT INTO clientes (nome, cpf, telefone, endereco, email, data_nascimento) VALUES (?,?,?,?,?,?)', clientes[i]);
  }
  console.log('✅', clientes.length, 'clientes');

  for (var j = 0; j < servicos.length; j++) {
    await run('INSERT INTO servicos (descricao, preco, tempo_estimado) VALUES (?,?,?)', servicos[j]);
  }
  console.log('✅', servicos.length, 'serviços');

  for (var k = 0; k < profissionais.length; k++) {
    await run('INSERT INTO profissionais (nome, cpf, telefone_profissional, telefone_pessoal, endereco, especializacao, email) VALUES (?,?,?,?,?,?,?)', profissionais[k]);
  }
  console.log('✅', profissionais.length, 'profissionais');

  for (var m = 0; m < agendamentosPlan.length; m++) {
    var a = agendamentosPlan[m];
    var clienteId = a[0] + 1;
    var data = a[1];
    var horario = a[2];
    var local = a[3];
    var profNome = profissionais[a[4]][0];
    var servicoId = a[5] + 1;
    var status = a[6];
    var preco = servicos[a[5]][1];
    var tempo = servicos[a[5]][2];

    var r = await run(
      'INSERT INTO agendamentos (data, horario, local, cliente_id, responsavel, total, tempo_total, status) VALUES (?,?,?,?,?,?,?,?)',
      [data, horario, local, clienteId, profNome, preco, tempo, status]
    );
    await run(
      'INSERT INTO itens_agendamento (agendamento_id, servico_id, preco_cobrado) VALUES (?,?,?)',
      [r.lastID, servicoId, preco]
    );
  }
  console.log('✅', agendamentosPlan.length, 'agendamentos');
  console.log('🌱 Seed concluído. Agora rode: npm start');
  db.close();
}

main().catch(function (e) {
  console.error(e);
  db.close();
  process.exit(1);
});
