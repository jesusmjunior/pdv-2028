// database.js - Interface de banco de dados com suporte a PostgreSQL e fallback para localStorage
const db = (function() {
  // Configuração
  let config = {
    useLocalStorage: true, // Por padrão, usa localStorage como fallback
    apiUrl: 'https://api.orionpdv.com/api'
  };
  
  // Cache de dados
  const cache = {
    produtos: [],
    clientes: [],
    vendas: [],
    estoque: []
  };
  
  // Inicialização
  const init = async (configOptions = {}) => {
    // Mesclar configurações
    config = { ...config, ...configOptions };
    
    try {
      // Carregar dados do cache local
      if (config.useLocalStorage) {
        loadFromLocalStorage();
      }
      
      console.log('Banco de dados inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao inicializar banco de dados:', error);
      return false;
    }
  };
  
  // Carregar dados do localStorage
  const loadFromLocalStorage = () => {
    try {
      // Para cada entidade, tenta carregar do localStorage
      Object.keys(cache).forEach(entity => {
        const storedData = localStorage.getItem(`orion_${entity}`);
        if (storedData) {
          cache[entity] = JSON.parse(storedData);
        }
      });
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error);
    }
  };
  
  // Salvar dados no localStorage
  const saveToLocalStorage = (entity) => {
    try {
      if (cache[entity]) {
        localStorage.setItem(`orion_${entity}`, JSON.stringify(cache[entity]));
      }
    } catch (error) {
      console.error(`Erro ao salvar ${entity} no localStorage:`, error);
    }
  };
  
  // API para login
  const login = async (username, password) => {
    // Se estiver usando localStorage
    if (config.useLocalStorage) {
      const usuariosStr = localStorage.getItem('orion_usuarios');
      
      if (!usuariosStr) {
        // Criar usuário admin padrão se não existir nenhum
        const defaultAdmin = {
          id: 1,
          username: 'admin',
          password: 'admin', // Isso deveria ser hasheado em produção
          nome: 'Administrador',
          role: 'admin'
        };
        
        localStorage.setItem('orion_usuarios', JSON.stringify([defaultAdmin]));
        
        if (username === 'admin' && password === 'admin') {
          return {
            sucesso: true,
            usuario: { ...defaultAdmin, password: undefined },
            token: 'token_simulado'
          };
        }
      } else {
        try {
          const usuarios = JSON.parse(usuariosStr);
          const usuario = usuarios.find(u => u.username === username && u.password === password);
          
          if (usuario) {
            // Criar uma cópia sem a senha
            const usuarioSemSenha = { ...usuario };
            delete usuarioSemSenha.password;
            
            // Simular token
            localStorage.setItem('token', 'token_simulado');
            
            return {
              sucesso: true,
              usuario: usuarioSemSenha,
              token: 'token_simulado'
            };
          }
        } catch (error) {
          console.error('Erro ao processar login:', error);
        }
      }
      
      return {
        sucesso: false,
        mensagem: 'Usuário ou senha incorretos'
      };
    } 
    
    // Se não estiver usando localStorage, tenta API
    try {
      const response = await fetch(`${config.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao conectar com API:', error);
      return {
        sucesso: false,
        mensagem: 'Erro de conexão com o servidor'
      };
    }
  };
  
  // API para logout
  const logout = () => {
    // Ações específicas de logout, se necessário
    return true;
  };
  
  // Funções genéricas CRUD
  const getAll = async (entity) => {
    if (config.useLocalStorage) {
      return cache[entity] || [];
    }
    
    // Implementar chamada à API aqui
  };
  
  const getById = async (entity, id) => {
    if (config.useLocalStorage) {
      return (cache[entity] || []).find(item => item.id === id);
    }
    
    // Implementar chamada à API aqui
  };
  
  const create = async (entity, data) => {
    if (config.useLocalStorage) {
      const collection = cache[entity] || [];
      
      // Gerar novo ID
      const newId = collection.length > 0 
        ? Math.max(...collection.map(item => item.id)) + 1 
        : 1;
      
      const newItem = { ...data, id: newId };
      
      // Adicionar ao cache
      collection.push(newItem);
      cache[entity] = collection;
      
      // Salvar no localStorage
      saveToLocalStorage(entity);
      
      return newItem;
    }
    
    // Implementar chamada à API aqui
  };
  
  const update = async (entity, id, data) => {
    if (config.useLocalStorage) {
      const collection = cache[entity] || [];
      const index = collection.findIndex(item => item.id === id);
      
      if (index !== -1) {
        // Manter o ID original
        const updatedItem = { ...data, id };
        collection[index] = updatedItem;
        
        // Atualizar cache e localStorage
        cache[entity] = collection;
        saveToLocalStorage(entity);
        
        return updatedItem;
      }
      
      return null;
    }
    
    // Implementar chamada à API aqui
  };
  
  const remove = async (entity, id) => {
    if (config.useLocalStorage) {
      const collection = cache[entity] || [];
      const index = collection.findIndex(item => item.id === id);
      
      if (index !== -1) {
        // Remover do array
        collection.splice(index, 1);
        
        // Atualizar cache e localStorage
        cache[entity] = collection;
        saveToLocalStorage(entity);
        
        return true;
      }
      
      return false;
    }
    
    // Implementar chamada à API aqui
  };
  
  // Funções específicas de entidades (para facilitar o uso)
  // Produtos
  const getAllProdutos = () => getAll('produtos');
  const getProdutoById = (id) => getById('produtos', id);
  const createProduto = (data) => create('produtos', data);
  const updateProduto = (id, data) => update('produtos', id, data);
  const removeProduto = (id) => remove('produtos', id);
  
  // Clientes
  const getAllClientes = () => getAll('clientes');
  const getClienteById = (id) => getById('clientes', id);
  const createCliente = (data) => create('clientes', data);
  const updateCliente = (id, data) => update('clientes', id, data);
  const removeCliente = (id) => remove('clientes', id);
  
  // Vendas
  const getAllVendas = () => getAll('vendas');
  const getVendaById = (id) => getById('vendas', id);
  const createVenda = (data) => create('vendas', data);
  const updateVenda = (id, data) => update('vendas', id, data);
  const removeVenda = (id) => remove('vendas', id);
  
  // Estoque
  const getAllEstoque = () => getAll('estoque');
  const getEstoqueById = (id) => getById('estoque', id);
  const createEstoque = (data) => create('estoque', data);
  const updateEstoque = (id, data) => update('estoque', id, data);
  const removeEstoque = (id) => remove('estoque', id);
  
  // Configurar fallback para testes
  const setupDatabaseFallback = () => {
    // Limpar dados existentes
    Object.keys(cache).forEach(entity => {
      cache[entity] = [];
      localStorage.removeItem(`orion_${entity}`);
    });
    
    // Dados de exemplo para produtos
    const produtosExemplo = [
      { id: 1, nome: 'Produto 1', preco: 10.99, codigo: 'P001', categoria: 'Geral' },
      { id: 2, nome: 'Produto 2', preco: 25.50, codigo: 'P002', categoria: 'Geral' },
      { id: 3, nome: 'Produto 3', preco: 5.99, codigo: 'P003', categoria: 'Geral' }
    ];
    
    // Dados de exemplo para clientes
    const clientesExemplo = [
      { id: 1, nome: 'Cliente 1', email: 'cliente1@exemplo.com', telefone: '11999999999' },
      { id: 2, nome: 'Cliente 2', email: 'cliente2@exemplo.com', telefone: '11888888888' }
    ];
    
    // Atualizar cache e localStorage
    cache.produtos = produtosExemplo;
    cache.clientes = clientesExemplo;
    
    saveToLocalStorage('produtos');
    saveToLocalStorage('clientes');
    
    console.log('Banco de dados resetado com dados de exemplo');
  };
  
  // API pública
  return {
    init,
    login,
    logout,
    
    // Produtos
    getAllProdutos,
    getProdutoById,
    createProduto,
    updateProduto,
    removeProduto,
    
    // Clientes
    getAllClientes,
    getClienteById,
    createCliente,
    updateCliente,
    removeCliente,
    
    // Vendas
    getAllVendas,
    getVendaById,
    createVenda,
    updateVenda,
    removeVenda,
    
    // Estoque
    getAllEstoque,
    getEstoqueById,
    createEstoque,
    updateEstoque,
    removeEstoque,
    
    // Utilitários
    setupDatabaseFallback
  };
})();

// Inicializar e exportar para o escopo global
document.addEventListener('DOMContentLoaded', () => {
  db.init();
});

window.db = db;