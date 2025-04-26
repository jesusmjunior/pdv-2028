// postgresql.js - Módulo de conexão com PostgreSQL
const postgresql = (function() {
  // Configuração de conexão (carregada de .env no backend)
  // Em produção, as configurações serão obtidas do servidor
  
  // URL base da API
  const API_URL = '/api';
  
  // Token de autenticação
  let authToken = localStorage.getItem('token');
  
  // Função auxiliar para fazer requisições à API
  const apiRequest = async (endpoint, method = 'GET', data = null) => {
    try {
      const url = `${API_URL}${endpoint}`;
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Adicionar token de autenticação se disponível
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const options = {
        method,
        headers,
        credentials: 'include'
      };
      
      // Adicionar corpo da requisição para métodos não-GET
      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(url, options);
      
      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        // Tratar erro de autenticação
        if (response.status === 401) {
          // Limpar token inválido
          localStorage.removeItem('token');
          authToken = null;
          
          // Redirecionar para login se não for a página de login
          if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
          }
        }
        
        const errorText = await response.text();
        throw new Error(`Erro na requisição: ${response.status} - ${errorText}`);
      }
      
      // Parsear resposta como JSON
      return await response.json();
    } catch (error) {
      console.error('Erro na comunicação com API:', error);
      throw error;
    }
  };
  
  // Autenticação
  const login = async (username, password) => {
    try {
      const result = await apiRequest('/auth/login', 'POST', { username, password });
      
      if (result.token) {
        // Armazenar token
        authToken = result.token;
        localStorage.setItem('token', authToken);
      }
      
      return result;
    } catch (error) {
      console.error('Erro no login:', error);
      // Utilizar fallback local se a API não estiver disponível
      if (window.db && typeof window.db.login === 'function') {
        console.log('Utilizando autenticação local como fallback');
        return window.db.login(username, password);
      }
      
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao fazer login'
      };
    }
  };
  
  // Logout
  const logout = async () => {
    try {
      await apiRequest('/auth/logout', 'POST');
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Limpar dados de autenticação
      authToken = null;
      localStorage.removeItem('token');
    }
  };
  
  // Verificar conexão com PostgreSQL
  const testConnection = async () => {
    try {
      const result = await apiRequest('/system/status');
      return result.databaseConnected === true;
    } catch (error) {
      console.error('Erro ao verificar conexão com o banco de dados:', error);
      return false;
    }
  };
  
  // Funções CRUD genéricas
  
  // Obter todos os registros
  const getAll = async (entity) => {
    try {
      return await apiRequest(`/${entity}`);
    } catch (error) {
      console.error(`Erro ao obter ${entity}:`, error);
      
      // Utilizar fallback local se a API não estiver disponível
      if (window.db) {
        const fallbackMethod = window.db[`getAll${entity.charAt(0).toUpperCase() + entity.slice(1)}`];
        if (typeof fallbackMethod === 'function') {
          console.log(`Utilizando ${entity} local como fallback`);
          return fallbackMethod();
        }
      }
      
      return [];
    }
  };
  
  // Obter registro por ID
  const getById = async (entity, id) => {
    try {
      return await apiRequest(`/${entity}/${id}`);
    } catch (error) {
      console.error(`Erro ao obter ${entity} por ID:`, error);
      
      // Utilizar fallback local se a API não estiver disponível
      if (window.db) {
        const fallbackMethod = window.db[`get${entity.charAt(0).toUpperCase() + entity.slice(1)}ById`];
        if (typeof fallbackMethod === 'function') {
          console.log(`Utilizando ${entity} local como fallback`);
          return fallbackMethod(id);
        }
      }
      
      return null;
    }
  };
  
  // Criar registro
  const create = async (entity, data) => {
    try {
      return await apiRequest(`/${entity}`, 'POST', data);
    } catch (error) {
      console.error(`Erro ao criar ${entity}:`, error);
      
      // Utilizar fallback local se a API não estiver disponível
      if (window.db) {
        const fallbackMethod = window.db[`create${entity.charAt(0).toUpperCase() + entity.slice(1)}`];
        if (typeof fallbackMethod === 'function') {
          console.log(`Utilizando criação de ${entity} local como fallback`);
          return fallbackMethod(data);
        }
      }
      
      throw error;
    }
  };
  
  // Atualizar registro
  const update = async (entity, id, data) => {
    try {
      return await apiRequest(`/${entity}/${id}`, 'PUT', data);
    } catch (error) {
      console.error(`Erro ao atualizar ${entity}:`, error);
      
      // Utilizar fallback local se a API não estiver disponível
      if (window.db) {
        const fallbackMethod = window.db[`update${entity.charAt(0).toUpperCase() + entity.slice(1)}`];
        if (typeof fallbackMethod === 'function') {
          console.log(`Utilizando atualização de ${entity} local como fallback`);
          return fallbackMethod(id, data);
        }
      }
      
      throw error;
    }
  };
  
  // Remover registro
  const remove = async (entity, id) => {
    try {
      return await apiRequest(`/${entity}/${id}`, 'DELETE');
    } catch (error) {
      console.error(`Erro ao remover ${entity}:`, error);
      
      // Utilizar fallback local se a API não estiver disponível
      if (window.db) {
        const fallbackMethod = window.db[`remove${entity.charAt(0).toUpperCase() + entity.slice(1)}`];
        if (typeof fallbackMethod === 'function') {
          console.log(`Utilizando remoção de ${entity} local como fallback`);
          return fallbackMethod(id);
        }
      }
      
      throw error;
    }
  };
  
  // Buscar produto por código de barras
  const getProdutoPorCodigoBarras = async (codigoBarras) => {
    try {
      return await apiRequest(`/produtos/barcode/${codigoBarras}`);
    } catch (error) {
      console.error('Erro ao buscar produto por código de barras:', error);
      
      // Utilizar fallback local se a API não estiver disponível
      if (window.db && typeof window.db.getAllProdutos === 'function') {
        console.log('Utilizando busca local como fallback');
        const produtos = await window.db.getAllProdutos();
        return produtos.find(p => p.codigo_barras === codigoBarras || p.codigo === codigoBarras);
      }
      
      return null;
    }
  };
  
  // API pública
  return {
    login,
    logout,
    testConnection,
    
    // CRUD genérico
    getAll,
    getById,
    create,
    update,
    remove,
    
    // Funções específicas
    getProdutoPorCodigoBarras,
    
    // Acesso ao token atual
    getToken: () => authToken
  };
})();

// Exportar para uso global
window.pg = postgresql;