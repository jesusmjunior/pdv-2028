// jwt.js - Módulo para gerenciamento de tokens JWT no frontend
const jwt = (function() {
  // Token atual
  let currentToken = localStorage.getItem('token');
  
  // Decodificar payload do token JWT sem validação
  // Nota: Isso é apenas para extrair informações, não valida o token
  const decodeToken = (token) => {
    try {
      if (!token) return null;
      
      // Dividir o token em suas partes e decodificar a parte do payload (segunda parte)
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''));
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Erro ao decodificar token JWT:', error);
      return null;
    }
  };
  
  // Verificar se o token está expirado
  const isTokenExpired = (token) => {
    const payload = decodeToken(token);
    
    if (!payload || !payload.exp) return true;
    
    // Verificar expiração
    const expirationDate = new Date(payload.exp * 1000); // converter de segundos para milissegundos
    return expirationDate <= new Date();
  };
  
  // Obter o token atual
  const getToken = () => {
    // Se o token existir e não estiver expirado, retorna o token
    if (currentToken && !isTokenExpired(currentToken)) {
      return currentToken;
    }
    
    // Se o token estiver expirado, limpa o token e retorna null
    if (currentToken && isTokenExpired(currentToken)) {
      localStorage.removeItem('token');
      currentToken = null;
    }
    
    return null;
  };
  
  // Definir um novo token
  const setToken = (token) => {
    currentToken = token;
    
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  };
  
  // Obter dados do usuário a partir do token
  const getUserData = () => {
    const token = getToken();
    if (!token) return null;
    
    const payload = decodeToken(token);
    return payload;
  };
  
  // Verificar se o usuário está autenticado
  const isAuthenticated = () => {
    return getToken() !== null;
  };
  
  // Verificar se o usuário tem uma determinada permissão
  const hasRole = (role) => {
    const userData = getUserData();
    if (!userData || !userData.role) return false;
    
    // Verificar se é uma array de papéis
    if (Array.isArray(userData.role)) {
      return userData.role.includes(role);
    }
    
    // Verificar se é uma string
    return userData.role === role;
  };
  
  // API pública
  return {
    getToken,
    setToken,
    getUserData,
    isAuthenticated,
    hasRole,
    decodeToken
  };
})();

// Exportar para uso global
window.jwt = jwt;