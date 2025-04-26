// auth.js - Sistema de autenticação para PostgreSQL
const auth = (function() {
  // URL da API
  const API_URL = 'https://api.orionpdv.com/api';
  
  // Token e usuário atual
  let currentToken = null;
  let currentUser = null;
  
  // Carregar dados salvos
  const init = () => {
    currentToken = localStorage.getItem('token');
    
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        currentUser = JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      // Limpar dados corrompidos
      localStorage.removeItem('user');
      currentUser = null;
    }
    
    return !!currentToken;
  };
  
  // Login
  const login = async (username, password) => {
    try {
      // Usar a API do banco para login
      const resultado = await window.db.login(username, password);
      
      if (resultado.sucesso && resultado.usuario) {
        currentUser = resultado.usuario;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
      
      return resultado;
    } catch (error) {
      console.error('Erro no login:', error);
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao fazer login'
      };
    }
  };
  
  // Logout
  const logout = () => {
    if (window.db && typeof window.db.logout === 'function') {
      window.db.logout();
    }
    
    currentToken = null;
    currentUser = null;
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Disparar evento de logout
    document.dispatchEvent(new CustomEvent('orion-logout'));
    
    return true;
  };
  
  // Verificar autenticação
  const isAuthenticated = () => {
    return !!currentToken && !!currentUser;
  };
  
  // Verificar permissão
  const hasRole = (role) => {
    if (!currentUser) return false;
    
    // Suportar ambos os formatos de campo para papel do usuário
    const userRole = currentUser.role || currentUser.perfil;
    return userRole === role;
  };
  
  // Obter usuário logado
  const getUsuarioLogado = () => {
    return currentUser;
  };
  
  // Obter token
  const getToken = () => {
    return currentToken;
  };
  
  // API pública
  return {
    init,
    login,
    logout,
    isAuthenticated,
    hasRole,
    getUsuarioLogado,
    getToken
  };
})();

// Inicializar ao carregar
document.addEventListener('DOMContentLoaded', () => {
  auth.init();
});

// Exportar para uso global
window.auth = auth;