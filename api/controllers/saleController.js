const pool = require('../models/database');

/**
 * Controlador de vendas
 */
const saleController = {
  /**
   * Listar todas as vendas
   */
  getAll: async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT v.*, c.nome as cliente_nome
        FROM vendas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        ORDER BY v.data_venda DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      res.status(500).json({ mensagem: 'Erro ao buscar vendas' });
    }
  },

  /**
   * Obter venda por ID
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Buscar a venda
      const vendaResult = await pool.query(`
        SELECT v.*, c.nome as cliente_nome
        FROM vendas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        WHERE v.id = $1
      `, [id]);
      
      if (vendaResult.rows.length === 0) {
        return res.status(404).json({ mensagem: 'Venda não encontrada' });
      }
      
      const venda = vendaResult.rows[0];
      
      // Buscar os itens da venda
      const itensResult = await pool.query(`
        SELECT iv.*, p.nome as produto_nome, p.codigo as produto_codigo
        FROM itens_venda iv
        JOIN produtos p ON iv.produto_id = p.id
        WHERE iv.venda_id = $1
      `, [id]);
      
      // Retornar a venda com seus itens
      res.json({
        ...venda,
        itens: itensResult.rows
      });
    } catch (error) {
      console.error('Erro ao buscar venda:', error);
      res.status(500).json({ mensagem: 'Erro ao buscar venda' });
    }
  },

  /**
   * Criar nova venda
   */
  create: async (req, res) => {
    const client = await pool.connect();
    
    try {
      // Iniciar transação
      await client.query('BEGIN');
      
      const { 
        cliente_id, itens, forma_pagamento, desconto, observacao 
      } = req.body;
      
      // Verificar itens
      if (!itens || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ mensagem: 'É necessário informar itens para a venda' });
      }
      
      // Calcular valor total
      let valorTotal = 0;
      for (const item of itens) {
        valorTotal += (item.preco_unitario * item.quantidade) - (item.desconto || 0);
      }
      
      // Aplicar desconto geral
      const descontoFinal = desconto || 0;
      valorTotal -= descontoFinal;
      
      // Inserir venda
      const vendaResult = await client.query(
        `INSERT INTO vendas (
          cliente_id, usuario_id, valor_total, desconto, forma_pagamento, observacao
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [cliente_id, req.user.id, valorTotal, descontoFinal, forma_pagamento, observacao]
      );
      
      const venda = vendaResult.rows[0];
      
      // Inserir itens da venda
      for (const item of itens) {
        const subtotal = (item.preco_unitario * item.quantidade) - (item.desconto || 0);
        
        await client.query(
          `INSERT INTO itens_venda (
            venda_id, produto_id, quantidade, preco_unitario, desconto, subtotal
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            venda.id, 
            item.produto_id,
            item.quantidade,
            item.preco_unitario,
            item.desconto || 0,
            subtotal
          ]
        );
        
        // Atualizar estoque
        await client.query(
          'UPDATE produtos SET estoque = estoque - $1 WHERE id = $2',
          [item.quantidade, item.produto_id]
        );
      }
      
      // Finalizar transação
      await client.query('COMMIT');
      
      // Buscar a venda completa
      const resultFinal = await client.query(`
        SELECT v.*, c.nome as cliente_nome
        FROM vendas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        WHERE v.id = $1
      `, [venda.id]);
      
      res.status(201).json(resultFinal.rows[0]);
    } catch (error) {
      // Reverter transação em caso de erro
      await client.query('ROLLBACK');
      
      console.error('Erro ao criar venda:', error);
      res.status(500).json({ mensagem: 'Erro ao criar venda' });
    } finally {
      // Liberar cliente
      client.release();
    }
  },

  /**
   * Cancelar venda
   */
  cancel: async (req, res) => {
    const client = await pool.connect();
    
    try {
      // Iniciar transação
      await client.query('BEGIN');
      
      const { id } = req.params;
      
      // Verificar se a venda existe
      const checkResult = await client.query('SELECT * FROM vendas WHERE id = $1', [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ mensagem: 'Venda não encontrada' });
      }
      
      // Verificar se a venda já está cancelada
      if (checkResult.rows[0].status === 'cancelada') {
        return res.status(400).json({ mensagem: 'Esta venda já está cancelada' });
      }
      
      // Buscar itens da venda
      const itensResult = await client.query(
        'SELECT produto_id, quantidade FROM itens_venda WHERE venda_id = $1',
        [id]
      );
      
      // Retornar itens ao estoque
      for (const item of itensResult.rows) {
        await client.query(
          'UPDATE produtos SET estoque = estoque + $1 WHERE id = $2',
          [item.quantidade, item.produto_id]
        );
      }
      
      // Cancelar a venda
      await client.query(
        "UPDATE vendas SET status = 'cancelada', updated_at = NOW() WHERE id = $1",
        [id]
      );
      
      // Finalizar transação
      await client.query('COMMIT');
      
      res.json({ mensagem: 'Venda cancelada com sucesso' });
    } catch (error) {
      // Reverter transação em caso de erro
      await client.query('ROLLBACK');
      
      console.error('Erro ao cancelar venda:', error);
      res.status(500).json({ mensagem: 'Erro ao cancelar venda' });
    } finally {
      // Liberar cliente
      client.release();
    }
  },

  /**
   * Obter estatísticas de vendas
   */
  getStats: async (req, res) => {
    try {
      // Calcular total de vendas do dia
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const vendasHojeResult = await pool.query(
        "SELECT SUM(valor_total) as total FROM vendas WHERE data_venda >= $1 AND status = 'concluida'",
        [hoje]
      );
      
      // Calcular total de vendas do mês
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      
      const vendasMesResult = await pool.query(
        "SELECT SUM(valor_total) as total FROM vendas WHERE data_venda >= $1 AND status = 'concluida'",
        [inicioMes]
      );
      
      // Buscar últimas 5 vendas
      const ultimasVendasResult = await pool.query(`
        SELECT v.*, c.nome as cliente_nome
        FROM vendas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        ORDER BY v.data_venda DESC
        LIMIT 5
      `);
      
      res.json({
        vendas_hoje: parseFloat(vendasHojeResult.rows[0].total || 0),
        vendas_mes: parseFloat(vendasMesResult.rows[0].total || 0),
        ultimas_vendas: ultimasVendasResult.rows
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas de vendas:', error);
      res.status(500).json({ mensagem: 'Erro ao buscar estatísticas de vendas' });
    }
  }
};

module.exports = saleController;