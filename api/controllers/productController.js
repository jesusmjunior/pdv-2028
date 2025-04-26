/**
 * Controlador de Produtos
 * Versão 3.0 - Otimizado para scanner de código de barras
 */
const pool = require('../models/database');

/**
 * Controlador de produtos com suporte avançado para código de barras
 */
const productController = {
  /**
   * Obter todos os produtos
   */
  getAll: async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT p.*, c.nome as categoria_nome 
         FROM produtos p 
         LEFT JOIN categorias c ON p.categoria_id = c.id 
         WHERE p.ativo = true 
         ORDER BY p.nome`
      );
      
      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },

  /**
   * Obter produto por ID
   */
  getById: async (req, res) => {
    const { id } = req.params;
    
    try {
      const result = await pool.query(
        `SELECT p.*, c.nome as categoria_nome 
         FROM produtos p 
         LEFT JOIN categorias c ON p.categoria_id = c.id 
         WHERE p.id = $1 AND p.ativo = true`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ mensagem: 'Produto não encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },

  /**
   * Obter produto por código de barras (otimizado para scanner)
   * Suporta múltiplos formatos e busca indexada no PostgreSQL
   */
  getByBarcode: async (req, res) => {
    const { codigo } = req.params;
    
    try {
      // Validação básica do código
      if (!codigo || codigo.length < 3) {
        return res.status(400).json({ 
          mensagem: 'Código de barras inválido',
          status: 'error' 
        });
      }
      
      // Busca otimizada usando índices do PostgreSQL
      // Inclui correspondência parcial e eliminação de caracteres especiais
      const result = await pool.query(
        `SELECT p.*, c.nome as categoria_nome 
         FROM produtos p 
         LEFT JOIN categorias c ON p.categoria_id = c.id 
         WHERE (
           p.codigo_barras = $1 
           OR p.codigo = $1 
           OR p.codigo_barras LIKE $2
           OR replace(p.codigo_barras, '-', '') = replace($1, '-', '')
         ) AND p.ativo = true
         LIMIT 1`,
        [codigo, `%${codigo}%`]
      );
      
      if (result.rows.length === 0) {
        // Log para análise de códigos não encontrados
        console.log(`Produto não encontrado para código: ${codigo}`);
        
        return res.status(404).json({ 
          mensagem: 'Produto não encontrado',
          codigo: codigo,
          status: 'not_found'
        });
      }
      
      const produto = result.rows[0];
      
      // Registrar timestamp da última leitura (opcional, para analytics)
      await pool.query(
        `UPDATE produtos 
         SET ultima_leitura = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [produto.id]
      ).catch(err => console.error('Erro ao atualizar timestamp:', err));
      
      // Retornar produto com status de sucesso
      res.json({
        ...produto,
        status: 'success'
      });
    } catch (error) {
      console.error('Erro ao buscar produto por código de barras:', error);
      res.status(500).json({ 
        mensagem: 'Erro interno do servidor',
        status: 'error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Obter produtos com estoque baixo
   */
  getLowStock: async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT p.*, c.nome as categoria_nome 
         FROM produtos p 
         LEFT JOIN categorias c ON p.categoria_id = c.id 
         WHERE p.ativo = true AND p.estoque <= p.estoque_minimo 
         ORDER BY p.estoque ASC`
      );
      
      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar produtos com estoque baixo:', error);
      res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },

  /**
   * Criar produto com suporte aprimorado a código de barras
   */
  create: async (req, res) => {
    const {
      codigo,
      codigo_barras,
      nome,
      descricao,
      preco_custo,
      preco_venda,
      estoque,
      estoque_minimo,
      categoria_id,
      unidade = 'un'
    } = req.body;
    
    if (!nome || !preco_venda) {
      return res.status(400).json({ mensagem: 'Nome e preço de venda são obrigatórios' });
    }
    
    try {
      // Se não foi fornecido um código de barras, gerar um automático
      let finalBarcode = codigo_barras;
      
      if (!finalBarcode) {
        // Gerar código EAN-13 baseado no ID do produto
        // Esta é uma simplificação - numa implementação real usaria um algoritmo adequado
        const lastProductResult = await pool.query('SELECT MAX(id) as last_id FROM produtos');
        const lastId = lastProductResult.rows[0].last_id || 0;
        const newId = lastId + 1;
        
        // Formatar como EAN-13 (simplificado para exemplo)
        finalBarcode = `2000000${String(newId).padStart(6, '0')}`;
        
        // Na vida real você calcularia o dígito verificador aqui
      }
      
      // Verificar se código já existe
      if (codigo) {
        const codigoExiste = await pool.query('SELECT id FROM produtos WHERE codigo = $1', [codigo]);
        if (codigoExiste.rows.length > 0) {
          return res.status(400).json({ mensagem: 'Código já está em uso' });
        }
      }
      
      // Verificar se código de barras já existe
      if (finalBarcode) {
        const barcodeExiste = await pool.query('SELECT id FROM produtos WHERE codigo_barras = $1', [finalBarcode]);
        if (barcodeExiste.rows.length > 0) {
          return res.status(400).json({ mensagem: 'Código de barras já está em uso' });
        }
      }
      
      const result = await pool.query(
        `INSERT INTO produtos 
         (codigo, codigo_barras, nome, descricao, preco_custo, preco_venda, estoque, estoque_minimo, categoria_id, unidade) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         RETURNING *`,
        [codigo, finalBarcode, nome, descricao, preco_custo, preco_venda, estoque || 0, estoque_minimo || 5, categoria_id, unidade]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },

  /**
   * Atualizar produto
   */
  update: async (req, res) => {
    const { id } = req.params;
    const {
      codigo,
      codigo_barras,
      nome,
      descricao,
      preco_custo,
      preco_venda,
      estoque,
      estoque_minimo,
      categoria_id,
      ativo,
      unidade
    } = req.body;
    
    if (!nome || !preco_venda) {
      return res.status(400).json({ mensagem: 'Nome e preço de venda são obrigatórios' });
    }
    
    try {
      // Verificar se produto existe
      const produtoExiste = await pool.query('SELECT id FROM produtos WHERE id = $1', [id]);
      if (produtoExiste.rows.length === 0) {
        return res.status(404).json({ mensagem: 'Produto não encontrado' });
      }
      
      // Verificar se código já existe em outro produto
      if (codigo) {
        const codigoExiste = await pool.query('SELECT id FROM produtos WHERE codigo = $1 AND id != $2', [codigo, id]);
        if (codigoExiste.rows.length > 0) {
          return res.status(400).json({ mensagem: 'Código já está em uso por outro produto' });
        }
      }
      
      // Verificar se código de barras já existe em outro produto
      if (codigo_barras) {
        const barcodeExiste = await pool.query('SELECT id FROM produtos WHERE codigo_barras = $1 AND id != $2', [codigo_barras, id]);
        if (barcodeExiste.rows.length > 0) {
          return res.status(400).json({ mensagem: 'Código de barras já está em uso por outro produto' });
        }
      }
      
      const result = await pool.query(
        `UPDATE produtos SET 
          codigo = $1,
          codigo_barras = $2,
          nome = $3,
          descricao = $4,
          preco_custo = $5,
          preco_venda = $6,
          estoque = $7,
          estoque_minimo = $8,
          categoria_id = $9,
          ativo = $10,
          unidade = $11,
          atualizado_em = CURRENT_TIMESTAMP
         WHERE id = $12
         RETURNING *`,
        [codigo, codigo_barras, nome, descricao, preco_custo, preco_venda, estoque, estoque_minimo, categoria_id, 
          ativo !== undefined ? ativo : true, unidade || 'un', id]
      );
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  },

  /**
   * Excluir produto (soft delete)
   */
  deleteProduct: async (req, res) => {
    const { id } = req.params;
    
    try {
      // Verificar se produto existe
      const produtoExiste = await pool.query('SELECT id FROM produtos WHERE id = $1', [id]);
      if (produtoExiste.rows.length === 0) {
        return res.status(404).json({ mensagem: 'Produto não encontrado' });
      }
      
      // Marcar como inativo ao invés de excluir
      await pool.query(
        'UPDATE produtos SET ativo = false, atualizado_em = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
      
      res.json({ mensagem: 'Produto excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
  }
};

module.exports = {
  getAll: productController.getAll,
  getById: productController.getById,
  getByBarcode: productController.getByBarcode,
  getLowStock: productController.getLowStock,
  create: productController.create,
  update: productController.update,
  delete: productController.deleteProduct
};
