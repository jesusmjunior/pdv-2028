// API para Sistema PDV
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');

// Importar controladores
const controllers = require('./controllers');

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar Express
const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../src')));

// Middleware de autenticação
const { authenticateToken } = controllers.auth;

// Rotas de sistema
app.get('/api/system/status', controllers.system.getStatus);
app.get('/api/system/stats', authenticateToken, controllers.system.getStats);

// Rotas de autenticação
app.post('/api/auth/login', controllers.auth.login);
app.post('/api/auth/logout', controllers.auth.logout);

// Rotas de produtos
app.get('/api/produtos', authenticateToken, controllers.product.getAll);
app.get('/api/produtos/baixo-estoque', authenticateToken, controllers.product.getLowStock);
app.get('/api/produtos/barcode/:codigo', authenticateToken, controllers.product.getByBarcode);
app.get('/api/produtos/:id', authenticateToken, controllers.product.getById);
app.post('/api/produtos', authenticateToken, controllers.product.create);
app.put('/api/produtos/:id', authenticateToken, controllers.product.update);
app.delete('/api/produtos/:id', authenticateToken, controllers.product.delete);

// Rotas de clientes
app.get('/api/clientes', authenticateToken, controllers.client.getAll);
app.get('/api/clientes/documento/:documento', authenticateToken, controllers.client.getByDocument);
app.get('/api/clientes/:id', authenticateToken, controllers.client.getById);
app.post('/api/clientes', authenticateToken, controllers.client.create);
app.put('/api/clientes/:id', authenticateToken, controllers.client.update);
app.delete('/api/clientes/:id', authenticateToken, controllers.client.delete);

// Rotas de vendas
app.get('/api/vendas', authenticateToken, controllers.sale.getAll);
app.get('/api/vendas/stats', authenticateToken, controllers.sale.getStats);
app.get('/api/vendas/:id', authenticateToken, controllers.sale.getById);
app.post('/api/vendas', authenticateToken, controllers.sale.create);
app.put('/api/vendas/:id/cancelar', authenticateToken, controllers.sale.cancel);

// Rota catchall para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/pages/index.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});