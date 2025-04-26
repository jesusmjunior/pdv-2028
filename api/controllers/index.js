// Exportar todos os controladores
const authController = require('./authController');
const productController = require('./productController');
const clientController = require('./clientController');
const saleController = require('./saleController');
const systemController = require('./systemController');

module.exports = {
  auth: authController,
  product: productController,
  client: clientController,
  sale: saleController,
  system: systemController
};