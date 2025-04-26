# Orion PDV - Sistema de Ponto de Venda

Sistema de Ponto de Venda (PDV) desenvolvido com JavaScript para front-end e Node.js/Express com PostgreSQL para back-end.

## Funcionalidades

- Autenticação de usuários
- Dashboard com indicadores
- Gestão de produtos
- Gestão de estoque
- Gestão de clientes
- Registro e controle de vendas
- Geração de recibos
- Relatórios

## Tecnologias Utilizadas

- **Front-end:** HTML5, CSS3, JavaScript Vanilla
- **Back-end:** Node.js, Express
- **Banco de Dados:** PostgreSQL
- **Autenticação:** JWT (JSON Web Tokens)
- **Hospedagem:** Render.com
- **Banco de Dados em Nuvem:** Google Cloud SQL (PostgreSQL)

## Estrutura do Projeto

```
/
├── api/                 # API Node.js/Express
│   ├── controllers/     # Controladores da API
│   ├── models/          # Modelos de dados
│   └── index.js         # Ponto de entrada da API
├── scripts/             # Scripts utilitários
│   └── setup-db.js      # Script para inicialização do banco de dados
├── src/                 # Aplicação front-end
│   ├── css/             # Estilos CSS
│   ├── js/              # JavaScript
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── core/        # Funções principais
│   │   └── modules/     # Módulos específicos
│   └── pages/           # Páginas HTML
├── .env.example         # Exemplo de variáveis de ambiente
├── package.json         # Dependências e scripts
└── render.yaml          # Configuração de deploy na Render
```

## Instruções para Desenvolvimento Local

1. Clone o repositório:
   ```bash
   git clone https://github.com/jesus-pdv/orion-pdv.git
   cd orion-pdv
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie um arquivo `.env` baseado no `.env.example` e configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com seus valores
   ```

4. Inicialize o banco de dados (certifique-se de ter o PostgreSQL configurado):
   ```bash
   npm run setup-db
   ```

5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

6. Acesse a aplicação em [http://localhost:3000](http://localhost:3000)

### Credenciais padrão:
- **Usuário:** admin
- **Senha:** admin

## Deploy na Render.com

O projeto está configurado para deploy automático na Render.com usando o arquivo `render.yaml`:

1. O front-end estático é hospedado como um serviço "Static Site"
2. A API Node.js/Express é hospedada como um serviço "Web Service"
3. O banco de dados PostgreSQL é provisionado automaticamente pela Render

Para configurar o deploy:

1. Faça fork deste repositório no GitHub
2. Crie uma conta no [Render.com](https://render.com)
3. Conecte seu repositório GitHub ao Render
4. Use a opção "Blueprint" do Render e selecione o arquivo `render.yaml`
5. Preencha as variáveis de ambiente secretas quando solicitado
6. Inicie o deploy

## Integração com Google Cloud PostgreSQL

Para usar o Google Cloud SQL como banco de dados:

1. Crie uma instância PostgreSQL no Google Cloud SQL
2. Configure as credenciais de acesso no Dashboard do Render ou no arquivo .env
3. Certifique-se de que as regras de firewall permitam conexões da Render

## Licença

Este projeto é licenciado sob a [MIT License](LICENSE).
