const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../models/database');

/**
 * Controlador de autenticação
 */
const authController = {
  /**
   * Login de usuário
   */
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Buscar usuário no banco
      const result = await pool.query(
        'SELECT * FROM usuarios WHERE username = $1',
        [username]
      );
      
      const user = result.rows[0];
      
      // Verificar se o usuário existe
      if (!user) {
        return res.status(401).json({ 
          sucesso: false, 
          mensagem: 'Usuário ou senha incorretos'
        });
      }
      
      // Verificar senha
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ 
          sucesso: false, 
          mensagem: 'Usuário ou senha incorretos'
        });
      }
      
      // Gerar token JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Remover senha do objeto de resposta
      delete user.password;
      
      // Retornar resposta
      res.json({
        sucesso: true,
        token,
        usuario: user
      });
      
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ 
        sucesso: false, 
        mensagem: 'Erro ao processar login'
      });
    }
  },

  /**
   * Logout (cliente apenas)
   */
  logout: (req, res) => {
    // No backend não há muito o que fazer para o logout,
    // pois o token é invalidado no frontend
    res.json({ sucesso: true });
  },

  /**
   * Middleware de autenticação
   */
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token de autenticação não fornecido' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Token inválido ou expirado' });
      }
      
      req.user = user;
      next();
    });
  }
};

module.exports = authController;