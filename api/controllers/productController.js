const pool = require('../models/database');

/**
 * Controlador de produtos
 */
const productController = {
  /**
   * Listar todos os produtos
   */
  getAll: async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM produtos ORDER BY nome');
      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      res.status(500).json({ mensagem: 'Erro ao buscar produtos' });
    }
  },

  /**
   * Obter produto por ID
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ mensagem: 'Produto não encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      res.status(500).json({ mensagem: 'Erro ao buscar produto' });
    }
  },

  /**
   * Buscar produto por código de barras
   */
  getByBarcode: async (req, res) => {
    try {
      const { codigo } = req.params;
      const result = await pool.query(
        'SELECT * FROM produtos WHERE codigo_barras = $1 OR codigo = $1', 
        [codigo]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ mensagem: 'Produto não encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao buscar produto por código de barras:', error);
      res.status(500).json({ mensagem: 'Erro ao buscar produto por código de barras' });
    }
  },

  /**
   * Criar novo produto
   */
  create: async (req, res) => {
    try {
      const { 
        nome, categoria, descricao, codigo, codigo_barras, 
        preco, preco_custo, estoque, estoque_minimo, unidade, imagem 
      } = req.body;
      
      // Validar dados obrigatórios
      if (!nome || !preco || !codigo_barras) {
        return res.status(400).json({ 
          mensagem: 'Nome, preço e código de barras são obrigatórios' 
        });
      }
      
      // Verificar se já existe produto com o mesmo código de barras
      const checkResult = await pool.query(
        'SELECT * FROM produtos WHERE codigo_barras = $1', 
        [codigo_barras]
      );
      
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ 
          mensagem: 'Já existe um produto com este código de barras' 
        });
      }
      
      const result = await pool.query(
        `INSERT INTO produtos (
          nome, categoria, descricao, codigo, codigo_barras,
          preco, preco_custo, estoque, estoque_minimo, unidade, imagem
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [nome, categoria, descricao, codigo, codigo_barras, 
         preco, preco_custo, estoque, estoque_minimo, unidade, imagem]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      res.status(500).json({ mensagem: 'Erro ao criar produto' });
    }
  },

  /**
   * Atualizar produto
   */
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        nome, categoria, descricao, codigo, codigo_barras, 
        preco, preco_custo, estoque, estoque_minimo, unidade, imagem 
      } = req.body;
      
      // Validar dados obrigatórios
      if (!nome || !preco || !codigo_barras) {
        return res.status(400).json({ 
          mensagem: 'Nome, preço e código de barras são obrigatórios' 
        });
      }
      
      // Verificar se já existe outro produto com o mesmo código de barras
      const checkResult = await pool.query(
        'SELECT * FROM produtos WHERE codigo_barras = $1 AND id != $2', 
        [codigo_barras, id]
      );
      
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ 
          mensagem: 'Já existe outro produto com este código de barras' 
        });
      }
      
      const result = await pool.query(
        `UPDATE produtos SET
          nome = $1, categoria = $2, descricao = $3, codigo = $4, codigo_barras = $5,
          preco = $6, preco_custo = $7, estoque = $8, estoque_minimo = $9, unidade = $10,
          imagem = $11, updated_at = NOW()
        WHERE id = $12 RETURNING *`,
        [nome, categoria, descricao, codigo, codigo_barras, 
         preco, preco_custo, estoque, estoque_minimo, unidade, imagem, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ mensagem: 'Produto não encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      res.status(500).json({ mensagem: 'Erro ao atualizar produto' });
    }
  },

  /**
   * Remover produto
   */
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('DELETE FROM produtos WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ mensagem: 'Produto não encontrado' });
      }
      
      res.json({ mensagem: 'Produto removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      res.status(500).json({ mensagem: 'Erro ao remover produto' });
    }
  },

  /**
   * Listar produtos com estoque baixo
   */
  getLowStock: async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT * FROM produtos WHERE estoque < estoque_minimo ORDER BY estoque ASC'
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar produtos com estoque baixo:', error);
      res.status(500).json({ mensagem: 'Erro ao buscar produtos com estoque baixo' });
    }
  }
};

module.exports = productController;