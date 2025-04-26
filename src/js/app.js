// app.js - Funções centrais da aplicação

function resetDatabase() {
    try {
        // Configurar fallback com localStorage
        setupDatabaseFallback();
        
        // Recarregar a página
        window.location.reload();
    } catch (error) {
        console.error('Erro ao resetar banco de dados:', error);
        alert('Ocorreu um erro ao tentar redefinir o banco de dados.');
    }
}

// Redirecionamento para login
function redirectToLogin() {
    // Verificar se estamos na página de login ou index
    if (window.location.pathname.includes('login.html') || 
        window.location.pathname.includes('index.html')) {
        return;
    }
    
    window.location.href = 'login.html';
}

// Funções específicas para cada página
// (Estas funções são apenas placeholders e serão implementadas nos módulos específicos)

function initProdutoPage() {
    console.log('Inicializando página de produto');
}

function initVendaPage() {
    console.log('Inicializando página de venda');
}

function initEstoquePage() {
    console.log('Inicializando página de estoque');
}

function initClientePage() {
    console.log('Inicializando página de cliente');
}

function initReciboPage() {
    console.log('Inicializando página de recibo');
}

function initRelatorioPage() {
    console.log('Inicializando página de relatório');
}

function initConfigPage() {
    console.log('Inicializando página de configuração');
}

function initDashboardPage() {
    console.log('Inicializando página de dashboard');
}

function initLoginPage() {
    console.log('Inicializando página de login');
    
    // Se o usuário já estiver logado, redirecionar para o dashboard
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('usuarioLogado');
    
    if (token && userJson) {
        try {
            const user = JSON.parse(userJson);
            if (user && user.username) {
                console.log('Usuário já autenticado, redirecionando para dashboard');
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            console.error('Erro ao verificar autenticação na página de login:', error);
            // Limpar dados corrompidos
            localStorage.removeItem('token');
            localStorage.removeItem('usuarioLogado');
        }
    }
}

// Exportar funções úteis para o escopo global
window.core = {
    showToast: function(message, type = 'info', duration = 3000) {
        return window.util.showToast(message, type, duration);
    },
    formatMoney: function(value) {
        return window.util.formatMoney(value);
    },
    formatDate: function(dateString) {
        return window.util.formatDate(dateString);
    },
    formatDateTime: function(dateString) {
        return window.util.formatDateTime(dateString);
    },
    resetDatabase: resetDatabase
};