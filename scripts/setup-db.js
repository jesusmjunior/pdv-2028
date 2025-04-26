// Script para inicializar o banco de dados PostgreSQL
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Configuração do PostgreSQL a partir das variáveis de ambiente
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// SQL para criação das tabelas
const createTableSQL = `
-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  categoria VARCHAR(50),
  descricao TEXT,
  codigo VARCHAR(50),
  codigo_barras VARCHAR(50) NOT NULL UNIQUE,
  preco DECIMAL(10, 2) NOT NULL,
  preco_custo DECIMAL(10, 2),
  estoque INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 5,
  unidade VARCHAR(10) DEFAULT 'un',
  imagem TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  documento VARCHAR(20),
  tipo_documento VARCHAR(10),
  email VARCHAR(100),
  telefone VARCHAR(20),
  endereco TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Vendas
CREATE TABLE IF NOT EXISTS vendas (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id),
  usuario_id INTEGER REFERENCES usuarios(id) NOT NULL,
  data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valor_total DECIMAL(10, 2) NOT NULL,
  desconto DECIMAL(10, 2) DEFAULT 0,
  forma_pagamento VARCHAR(20),
  status VARCHAR(20) DEFAULT 'concluida',
  observacao TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens da Venda
CREATE TABLE IF NOT EXISTS itens_venda (
  id SERIAL PRIMARY KEY,
  venda_id INTEGER REFERENCES vendas(id) NOT NULL,
  produto_id INTEGER REFERENCES produtos(id) NOT NULL,
  quantidade INTEGER NOT NULL,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  desconto DECIMAL(10, 2) DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// Criar usuário administrador padrão
const createDefaultAdmin = async (client) => {
  try {
    // Verificar se já existe um usuário admin
    const checkResult = await client.query("SELECT * FROM usuarios WHERE username = 'admin'");
    
    if (checkResult.rows.length === 0) {
      // Criar hash da senha
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash('admin', saltRounds);
      
      // Inserir usuário admin
      await client.query(`
        INSERT INTO usuarios (username, password, nome, email, role)
        VALUES ('admin', $1, 'Administrador', 'admin@orionpdv.com', 'admin')
      `, [passwordHash]);
      
      console.log('Usuário administrador criado com sucesso!');
    } else {
      console.log('Usuário administrador já existe.');
    }
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
    throw error;
  }
};

// Criar produtos de exemplo
const createSampleProducts = async (client) => {
  try {
    // Verificar se já existem produtos
    const checkResult = await client.query("SELECT COUNT(*) FROM produtos");
    
    if (parseInt(checkResult.rows[0].count) === 0) {
      // Inserir produtos de exemplo
      await client.query(`
        INSERT INTO produtos (nome, categoria, descricao, codigo, codigo_barras, preco, preco_custo, estoque, unidade)
        VALUES 
          ('Arroz 5kg', 'Alimentos', 'Arroz tipo 1', 'A001', '7891234567890', 22.90, 18.50, 50, 'un'),
          ('Feijão 1kg', 'Alimentos', 'Feijão carioca', 'A002', '7891234567891', 8.90, 6.50, 40, 'un'),
          ('Açúcar 1kg', 'Alimentos', 'Açúcar refinado', 'A003', '7891234567892', 4.50, 3.20, 30, 'un'),
          ('Café 500g', 'Alimentos', 'Café torrado e moído', 'A004', '7891234567893', 12.90, 9.50, 25, 'un'),
          ('Leite Integral 1L', 'Bebidas', 'Leite integral UHT', 'B001', '7891234567894', 4.99, 3.80, 60, 'un'),
          ('Refrigerante 2L', 'Bebidas', 'Refrigerante de cola', 'B002', '7891234567895', 8.50, 6.20, 35, 'un'),
          ('Detergente 500ml', 'Limpeza', 'Detergente líquido', 'L001', '7891234567896', 2.99, 1.80, 45, 'un'),
          ('Sabão em Pó 1kg', 'Limpeza', 'Sabão em pó multiação', 'L002', '7891234567897', 12.50, 9.30, 20, 'un')
      `);
      
      console.log('Produtos de exemplo criados com sucesso!');
    } else {
      console.log('Já existem produtos cadastrados.');
    }
  } catch (error) {
    console.error('Erro ao criar produtos de exemplo:', error);
    throw error;
  }
};

// Criar clientes de exemplo
const createSampleClients = async (client) => {
  try {
    // Verificar se já existem clientes
    const checkResult = await client.query("SELECT COUNT(*) FROM clientes");
    
    if (parseInt(checkResult.rows[0].count) === 0) {
      // Inserir clientes de exemplo
      await client.query(`
        INSERT INTO clientes (nome, documento, tipo_documento, email, telefone, endereco)
        VALUES 
          ('Cliente Padrão', '', '', '', '', ''),
          ('João da Silva', '12345678901', 'CPF', 'joao@email.com', '(11) 99999-8888', 'Rua A, 123'),
          ('Maria Santos', '98765432101', 'CPF', 'maria@email.com', '(11) 99999-7777', 'Rua B, 456')
      `);
      
      console.log('Clientes de exemplo criados com sucesso!');
    } else {
      console.log('Já existem clientes cadastrados.');
    }
  } catch (error) {
    console.error('Erro ao criar clientes de exemplo:', error);
    throw error;
  }
};

// Função principal
const setupDatabase = async () => {
  let client;
  
  try {
    // Conectar ao banco
    client = await pool.connect();
    console.log('Conectado ao PostgreSQL');
    
    // Criar tabelas
    await client.query(createTableSQL);
    console.log('Tabelas criadas com sucesso!');
    
    // Criar usuário administrador
    await createDefaultAdmin(client);
    
    // Criar produtos de exemplo
    await createSampleProducts(client);
    
    // Criar clientes de exemplo
    await createSampleClients(client);
    
    console.log('Configuração do banco de dados concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao configurar banco de dados:', error);
  } finally {
    if (client) {
      client.release();
    }
    // Encerrar conexão com o pool
    await pool.end();
  }
};

// Executar configuração
setupDatabase();
