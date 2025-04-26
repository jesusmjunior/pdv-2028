const pool = require('../models/database');

/**
 * Controlador de sistema
 */
const systemController = {
  /**
   * Verificar status do sistema
   */
  getStatus: async (req, res) => {
    try {
      const client = await pool.connect();
      client.release();
      
      res.json({
        status: 'online',
        databaseConnected: true,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      res.json({
        status: 'online',
        databaseConnected: false,
        error: error.message,
        timestamp: new Date()
      });
    }
  },

  /**
   * Obter estatísticas gerais do sistema
   */
  getStats: async (req, res) => {
    try {
      // Total de produtos
      const produtosResult = await pool.query('SELECT COUNT(*) FROM produtos');
      
      // Total de clientes
      const clientesResult = await pool.query('SELECT COUNT(*) FROM clientes');
      
      // Total de vendas
      const vendasResult = await pool.query('SELECT COUNT(*) FROM vendas');
      
      // Valor total de vendas
      const valorResult = await pool.query('SELECT SUM(valor_total) FROM vendas WHERE status = \'concluida\'');
      
      // Produtos com estoque baixo
      const estoqueBaixoResult = await pool.query(
        'SELECT COUNT(*) FROM produtos WHERE estoque < estoque_minimo'
      );
      
      res.json({
        total_produtos: parseInt(produtosResult.rows[0].count),
        total_clientes: parseInt(clientesResult.rows[0].count),
        total_vendas: parseInt(vendasResult.rows[0].count),
        valor_total_vendas: parseFloat(valorResult.rows[0].sum || 0),
        produtos_estoque_baixo: parseInt(estoqueBaixoResult.rows[0].count)
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas do sistema:', error);
      res.status(500).json({ mensagem: 'Erro ao buscar estatísticas do sistema' });
    }
  }
};

module.exports = systemController;