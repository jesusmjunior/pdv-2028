/**
 * Módulo de Scanner de Código de Barras
 * Versão 3.0 - Integrado com câmera e PostgreSQL
 * 
 * Este módulo implementa a leitura de códigos de barras usando a câmera do dispositivo
 * e integra diretamente com o banco de dados PostgreSQL para busca de produtos.
 */

// Namespace do Scanner
const BarcodeScanner = (function() {
  // Elementos DOM
  let video = null;
  let canvasElement = null;
  let canvas = null;
  let loadingMessage = null;
  let outputContainer = null;
  let outputMessage = null;
  let outputData = null;
  
  // Variáveis de controle
  let activeStream = null;
  let isScanning = false;
  let lastResult = '';
  let countResults = 0;
  let lastCodeFound = Date.now();
  
  // Configurações
  const config = {
    scanInterval: 100,        // milissegundos
    scanTimeout: 5000,        // Auto-desliga após 5 segundos sem uso
    autostart: true,          // Iniciar scanner automaticamente
    beepOnSuccess: true,      // Som ao ler código
    vibrateOnSuccess: true,   // Vibrar ao ler código
    codeValidTimeout: 2000,   // Tempo mínimo entre duas leituras do mesmo código
    cameraFacingMode: 'environment', // Usar câmera traseira
    selectByCode: true        // Selecionar produto automaticamente
  };
  
  // Som de beep
  const beepSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...'); // Base64 truncado do som
  
  /**
   * Inicializar o scanner
   * @param {Object} options - Opções de configuração
   */
  const init = function(options = {}) {
    console.log('Inicializando Scanner de Código de Barras v3.0');
    
    // Mesclar configurações
    Object.assign(config, options);
    
    // Obter referências DOM
    video = document.createElement('video');
    canvasElement = document.getElementById('canvas');
    canvas = canvasElement.getContext('2d');
    loadingMessage = document.getElementById('loadingMessage');
    outputContainer = document.getElementById('output');
    outputMessage = document.getElementById('outputMessage');
    outputData = document.getElementById('outputData');
    
    // Verificar se os elementos estão disponíveis
    if (!canvasElement || !outputContainer || !loadingMessage) {
      console.error('Elementos de scanner não encontrados no DOM');
      return false;
    }
    
    // Verificar suporte à câmera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      if (config.autostart) {
        start();
      }
      
      // Botões de controle
      const startButton = document.getElementById('startButton');
      const stopButton = document.getElementById('stopButton');
      
      if (startButton) {
        startButton.addEventListener('click', start);
      }
      
      if (stopButton) {
        stopButton.addEventListener('click', stop);
      }
      
      return true;
    } else {
      console.error('Navegador não suporta acesso à câmera');
      outputMessage.innerText = 'Seu dispositivo não suporta acesso à câmera.';
      loadingMessage.innerText = '';
      return false;
    }
  };
  
  /**
   * Iniciar o scanner
   */
  const start = async function() {
    isScanning = true;
    lastResult = '';
    
    try {
      // Configurar câmera
      const constraints = {
        video: { 
          facingMode: config.cameraFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      };
      
      // Solicitar permissão e iniciar stream de vídeo
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      activeStream = stream;
      
      video.srcObject = stream;
      video.setAttribute('playsinline', true);
      video.play();
      
      // Iniciar loop de escaneamento
      requestAnimationFrame(tick);
      loadingMessage.innerText = 'Iniciando câmera...';
      
      // Exibir elementos do scanner
      document.getElementById('scanner-container').style.display = 'block';
      
      console.log('Scanner iniciado com sucesso');
    } catch (err) {
      console.error('Erro ao iniciar scanner:', err);
      outputMessage.innerText = `Erro ao acessar câmera: ${err.message}`;
      loadingMessage.innerText = '';
    }
  };
  
  /**
   * Parar o scanner
   */
  const stop = function() {
    isScanning = false;
    
    // Parar todos os tracks de vídeo
    if (activeStream) {
      activeStream.getTracks().forEach(track => {
        track.stop();
      });
      activeStream = null;
    }
    
    // Ocultar elementos do scanner
    document.getElementById('scanner-container').style.display = 'none';
    
    console.log('Scanner parado');
  };
  
  /**
   * Loop principal de escaneamento
   */
  const tick = function() {
    if (!isScanning) return;
    
    // Verificar timeout de inatividade
    if (config.scanTimeout > 0 && Date.now() - lastCodeFound > config.scanTimeout) {
      console.log('Scanner timeout - desligando');
      stop();
      return;
    }
    
    loadingMessage.innerText = '';
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Exibir vídeo e ocultar mensagem de carregamento
      canvasElement.hidden = false;
      loadingMessage.hidden = true;
      
      // Ajustar tamanho do canvas ao vídeo
      canvasElement.height = video.videoHeight;
      canvasElement.width = video.videoWidth;
      
      // Desenhar frame atual no canvas
      canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
      
      try {
        // Tentar decodificar código de barras a cada intervalo
        if (countResults % 10 === 0) { // A cada 10 frames
          decodeBarcode();
        }
      } catch (e) {
        console.error('Erro ao decodificar:', e);
      }
      
      countResults++;
    }
    
    // Continuar loop
    setTimeout(() => {
      requestAnimationFrame(tick);
    }, config.scanInterval);
  };
  
  /**
   * Decodificar código de barras na imagem atual
   */
  const decodeBarcode = function() {
    try {
      const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      
      // Se um código for encontrado
      if (code) {
        // Desenhar caixa ao redor do código encontrado
        drawCodeOutline(code.location);
        
        // Validar e processar o código encontrado
        processCode(code.data);
      }
    } catch (e) {
      console.error('Erro ao decodificar código:', e);
    }
  };
  
  /**
   * Desenhar contorno do código encontrado
   */
  const drawCodeOutline = function(location) {
    canvas.beginPath();
    canvas.moveTo(location.topLeftCorner.x, location.topLeftCorner.y);
    canvas.lineTo(location.topRightCorner.x, location.topRightCorner.y);
    canvas.lineTo(location.bottomRightCorner.x, location.bottomRightCorner.y);
    canvas.lineTo(location.bottomLeftCorner.x, location.bottomLeftCorner.y);
    canvas.lineTo(location.topLeftCorner.x, location.topLeftCorner.y);
    canvas.lineWidth = 4;
    canvas.strokeStyle = '#00FF00';
    canvas.stroke();
  };
  
  /**
   * Processar código de barras encontrado
   * @param {string} code - Código de barras lido
   */
  const processCode = function(code) {
    // Verificar se é um novo código ou se passou tempo suficiente
    const now = Date.now();
    if (code !== lastResult || now - lastCodeFound > config.codeValidTimeout) {
      lastResult = code;
      lastCodeFound = now;
      
      // Notificações
      if (config.beepOnSuccess) {
        beepSound.play().catch(e => console.log('Erro ao tocar som:', e));
      }
      
      if (config.vibrateOnSuccess && navigator.vibrate) {
        navigator.vibrate(100);
      }
      
      // Exibir código encontrado
      outputMessage.hidden = true;
      outputData.parentElement.hidden = false;
      outputData.innerText = code;
      
      // Buscar produto no banco de dados
      fetchProductByBarcode(code);
      
      console.log('Código encontrado:', code);
    }
  };
  
  /**
   * Buscar produto pelo código de barras no PostgreSQL
   * @param {string} barcode - Código de barras
   */
  const fetchProductByBarcode = async function(barcode) {
    try {
      // Exibir mensagem de busca
      outputMessage.innerText = 'Buscando produto...';
      outputMessage.hidden = false;
      
      // Fazer requisição à API
      const response = await fetch(`/api/produtos/barcode/${barcode}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const product = await response.json();
      
      // Exibir informações do produto
      displayProduct(product);
      
      // Se configurado para selecionar automaticamente
      if (config.selectByCode && typeof window.selectProduct === 'function') {
        window.selectProduct(product);
      }
      
      return product;
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      outputMessage.innerText = `Produto não encontrado: ${barcode}`;
      outputMessage.hidden = false;
      outputData.parentElement.hidden = true;
      
      // Notificar erro
      if (app && app.notify) {
        app.notify(`Produto não encontrado: ${barcode}`, 'error');
      }
      
      return null;
    }
  };
  
  /**
   * Exibir informações do produto encontrado
   * @param {Object} product - Dados do produto
   */
  const displayProduct = function(product) {
    if (!product) return;
    
    // Atualizar interface com informações do produto
    const productInfo = document.getElementById('product-info');
    
    if (productInfo) {
      productInfo.innerHTML = `
        <div class="product-card">
          <h3>${product.nome}</h3>
          <div class="product-details">
            <p><strong>Código:</strong> ${product.codigo || product.codigo_barras}</p>
            <p><strong>Preço:</strong> ${app.formatMoney(product.preco)}</p>
            <p><strong>Estoque:</strong> ${product.estoque} ${product.unidade || 'un'}</p>
          </div>
          <div class="product-actions">
            <button class="btn-add" onclick="window.addToCart(${product.id}, 1)">
              Adicionar à Venda
            </button>
          </div>
        </div>
      `;
      
      productInfo.style.display = 'block';
    }
    
    // Ocultar mensagem de saída após encontrar produto
    outputMessage.hidden = true;
  };
  
  /**
   * API pública do módulo
   */
  return {
    init,
    start,
    stop,
    getLastCode: () => lastResult,
    isActive: () => isScanning,
    fetchProductByBarcode
  };
})();

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  // Verificar se estamos na página de scanner ou vendas
  const isValidPage = ['scan', 'venda-nova'].includes(window.location.pathname.split('/').pop().replace('.html', ''));
  
  if (isValidPage) {
    // Inicializar com opções personalizadas
    BarcodeScanner.init({
      autostart: true,
      beepOnSuccess: true,
      vibrateOnSuccess: true,
      selectByCode: true
    });
    
    // Adicionar à janela global para acesso de outros scripts
    window.BarcodeScanner = BarcodeScanner;
  }
});
