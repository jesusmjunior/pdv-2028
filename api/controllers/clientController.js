const pool = require('../models/database');

/**
 * Controlador de clientes
 */
const clientController = {
  /**
   * Listar todos os clientes
   */
  getAll: async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM clientes ORDER BY nome');
      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      res.status(500).json({ mensagem: 'Erro ao buscar clientes' });
    }
  },

  /**
   * Obter cliente por ID
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ mensagem: 'Cliente não encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      res.status(500).json({ mensagem: 'Erro ao buscar cliente' });
    }
  },

  /**
   * Criar novo cliente
   */
  create: async (req, res) => {
    try {
      const { 
        nome, documento, tipo_documento, email, telefone, endereco 
      } = req.body;
      
      // Validar dados
      if (!nome) {
        return res.status(400).json({ mensagem: 'Nome é obrigatório' });
      }
      
      const result = await pool.query(
        `INSERT INTO clientes (nome, documento, tipo_documento, email, telefone, endereco)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [nome, documento, tipo_documento, email, telefone, endereco]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      res.status(500).json({ mensagem: 'Erro ao criar cliente' });
    }
  },

  /**
   * Atualizar cliente
   */
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        nome, documento, tipo_documento, email, telefone, endereco 
      } = req.body;
      
      // Validar dados
      if (!nome) {
        return res.status(400).json({ mensagem: 'Nome é obrigatório' });
      }
      
      const result = await pool.query(
        `UPDATE clientes SET
          nome = $1, documento = $2, tipo_documento = $3, email = $4, 
          telefone = $5, endereco = $6, updated_at = NOW()
        WHERE id = $7 RETURNING *`,
        [nome, documento, tipo_documento, email, telefone, endereco, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ mensagem: 'Cliente não encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      res.status(500).json({ mensagem: 'Erro ao atualizar cliente' });
    }
  },

  /**
   * Remover cliente
   */
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar se há vendas associadas ao cliente
      const vendas = await pool.query('SELECT id FROM vendas WHERE cliente_id = $1 LIMIT 1', [id]);
      
      if (vendas.rows.length > 0) {
        return res.status(400).json({ 
          mensagem: 'Este cliente possui vendas associadas e não pode ser removido' 
        });
      }
      
      const result = await pool.query('DELETE FROM clientes WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ mensagem: 'Cliente não encontrado' });
      }
      
      res.json({ mensagem: 'Cliente removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover cliente:', error);
      res.status(500).json({ mensagem: 'Erro ao remover cliente' });
    }
  },

  /**
   * Buscar cliente por documento
   */
  getByDocument: async (req, res) => {
    try {
      const { documento } = req.params;
      const result = await pool.query('SELECT * FROM clientes WHERE documento = $1', [documento]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ mensagem: 'Cliente não encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao buscar cliente por documento:', error);
      res.status(500).json({ mensagem: 'Erro ao buscar cliente por documento' });
    }
  }
};

module.exports = clientController;