# 🚀 Guia de Deploy em Produção: Central Financeira

Este guia detalha o processo passo a passo para colocar a aplicação full-stack (Next.js, FastAPI, Supabase) no ar na internet de forma segura e resiliente.

---

## 📁 Arquitetura do Repositório (Monorepo)
Antes de enviar o código, certifique-se de que a estrutura de pastas local está organizada desta forma:
```text
family-financial-os/         <-- Raiz do projeto
├── .gitignore               <-- Ignorar envs locais e pastas temporárias
├── requirements.txt         <-- Dependências gerais do Python
├── backend/                 <-- Código do FastAPI
│   ├── .env                 <-- Variáveis locais do backend (IGNORADO)
│   └── ...
├── frontend/                <-- Código do Next.js
│   ├── .env.local           <-- Variáveis locais do frontend (IGNORADO)
│   └── ...
└── supabase/                <-- Migrações e SQLs do banco
```

---

## 🛠️ FASE 1: Configuração do Controle de Versão (GitHub)

Nesta fase, prepararemos o código local e faremos o upload para um repositório **privado** no GitHub para manter as configurações de desenvolvimento confidenciais.

### Passo 1.1: Criar o arquivo `.gitignore` na raiz
Crie um arquivo chamado `.gitignore` na pasta raiz (`family-financial-os/`) para evitar a publicação acidental de segredos:

```ini
# Ambientes virtuais
venv/
.venv/
env/
__pycache__/
*.pyc

# Arquivos de variáveis de ambiente (CRÍTICO)
.env
.env.local
.env.production
.env.development.local

# Banco de dados local SQLite
dev.db
*.db

# Pastas de build do Frontend
.next/
node_modules/
out/
build/
.turbo/
```

### Passo 1.2: Inicializar o repositório Git localmente
Abra o seu terminal na raiz do projeto e execute a sequência de comandos:

```bash
# Inicializar o repositório local
git init

# Adicionar todos os arquivos ao indexador (respeitando o .gitignore)
git add .

# Criar o primeiro commit da aplicação
git commit -m "feat: setup completo da aplicacao com autenticacao e seguranca"

# Renomear a branch padrão para main (padrão do GitHub)
git branch -M main
```

### Passo 1.3: Criar o Repositório no GitHub
1. Acesse o [GitHub](https://github.com/) e faça login.
2. No canto superior direito, clique no botão **`+`** e selecione **`New repository`**.
3. **Owner:** Selecione sua conta.
4. **Repository name:** `family-financial-os`
5. **Publicity:** Selecione **`Private`** (Essencial para a segurança do monorepo).
6. **Não** marque nenhuma opção de inicialização (como Add README ou .gitignore, pois já criamos localmente).
7. Clique em **`Create repository`**.

### Passo 1.4: Fazer o Push para o GitHub
Associe e envie o código executando os comandos abaixo (substitua pelo link do seu próprio repositório):

```bash
# Associar o repositório local ao repositório remoto do GitHub
git remote add origin https://github.com/SEU_USUARIO/family-financial-os.git

# Enviar os arquivos locais para a branch main do GitHub
git push -u origin main
```

---

## 🗄️ FASE 2: Configuração do Banco de Dados em Produção (Supabase)

Aqui, configuraremos o banco de dados PostgreSQL do Supabase em produção e aplicaremos a estrutura de tabelas e as políticas de segurança.

### Passo 2.1: Criar o projeto de Produção
1. Acesse o [Supabase Console](https://supabase.com/).
2. Clique em **`New project`** e defina:
   * **Project Name:** `batista-finance-os-prod`
   * **Database Password:** Defina uma senha forte e anote-a (será necessária para a string de conexão).
   * **Region:** Escolha a mais próxima aos servidores da hospedagem (ex: **`South America (São Paulo)`**).
3. Aguarde o provisionamento do banco terminar.

### Passo 2.2: Executar as Migrações de Tabelas e Políticas de RLS
Para criar todas as tabelas em produção:
1. No painel do Supabase, clique no menu lateral **`SQL Editor`** (ícone de terminal `>_`).
2. Clique em **`New query`** para abrir um editor em branco.
3. Copie o conteúdo de cada arquivo SQL abaixo localizados em seu projeto e execute-os no editor do Supabase na seguinte ordem:
   1. [init_schema.sql](file:///C:/Users/lucas/.gemini/antigravity/scratch/family-financial-os/supabase/migrations/20260522183500_init_schema.sql) (Criará as tabelas `users`, `expenses` e `participations`).
   2. [recurring_and_installments.sql](file:///C:/Users/lucas/.gemini/antigravity/scratch/family-financial-os/supabase/migrations/20260522193000_recurring_and_installments.sql) (Adicionará suporte a despesas fixas e recorrentes).
   3. [enable_rls_policies.sql](file:///C:/Users/lucas/.gemini/antigravity/scratch/family-financial-os/supabase/migrations/20260614112308_enable_rls_policies.sql) (Habilitará o **RLS** nas tabelas para restringir acesso).
4. Clique no botão verde **`Run`** no editor para cada query. Verifique se o resultado exibe `Success. No rows returned.`

### Passo 2.3: Coletar Credenciais de Produção
Vá em **`Project Settings`** (ícone de engrenagem) > **`API`** e salve:
* **`Project URL`**
* **`anon (public)` API Key**
* **`JWT Secret`** (em *JWT Settings*)

Vá em **`Project Settings`** > **`Database`** > seção **`Connection string`**:
* Selecione **`URI`** e salve o endereço de conexão PostgreSQL. Substitua `[YOUR-PASSWORD]` pela senha definida no passo 2.1. (Ex: `postgresql://postgres:senha_forte@db.xxxx.supabase.co:5432/postgres`).

---

## 🐍 FASE 3: Deploy do Back-end (Render ou Railway)

Nesta fase, faremos o deploy da API FastAPI utilizando a plataforma **Render** (uma das melhores opções gratuitas e de fácil integração).

### Passo 3.1: Conectar o GitHub à Render
1. Acesse o painel do [Render](https://dashboard.render.com/) e faça login usando sua conta do GitHub.
2. Clique no botão azul **`New +`** no topo da página e selecione **`Web Service`**.
3. Escolha **`Build and deploy from a Git repository`**.
4. Conecte sua conta do GitHub e dê permissão para o repositório privado `family-financial-os`.
5. Selecione o repositório na lista.

### Passo 3.2: Configurar o Build e Runtime do Python
Na tela de criação do serviço, preencha os seguintes campos:
* **Name:** `family-financial-api`
* **Region:** Selecione a mesma região do Supabase ou o local mais próximo (ex: `Ohio (us-east-2)` ou `Frankfurt`).
* **Branch:** `main`
* **Root Directory:** **`backend`** (Isso direciona o Render para a pasta correta do FastAPI).
* **Runtime:** `Python3` (Ou a versão padrão recomendada pelo Render).
* **Build Command:** `pip install -r ../requirements.txt`
* **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Passo 3.3: Inserir Variáveis de Ambiente (Environment Variables)
Clique no botão **`Advanced`** ou na aba **`Environment`** e adicione as seguintes chaves de ambiente:

| Variável | Valor | Finalidade |
| :--- | :--- | :--- |
| `ENV` | `production` | Muda a aplicação para modo produtivo (desativa criação automática de tabelas SQLite). |
| `DATABASE_URL` | *Sua Connection String do Supabase (Passo 2.3)* | Conecta a API FastAPI ao PostgreSQL do Supabase em produção. |
| `SUPABASE_URL` | *Sua Project URL do Supabase (Passo 2.3)* | Endereço base para buscar as chaves asimétricas. |
| `SUPABASE_ANON_KEY` | *Sua anon (public) Key do Supabase (Passo 2.3)* | Utilizada como cabeçalho para obter o JWKS. |
| `SUPABASE_JWT_SECRET` | *Seu JWT Secret do Supabase (Passo 2.3)* | Camada secundária de validação de assinatura de token. |

Clique em **`Create Web Service`**. O Render iniciará a build e fornecerá a URL pública da sua API (ex: `https://family-financial-api.onrender.com`). Guarde essa URL!

---

## ⚡ FASE 4: Deploy do Front-end (Vercel)

Por fim, faremos o deploy do frontend Next.js na **Vercel** com configurações otimizadas para o App Router.

### Passo 4.1: Conectar à Vercel
1. Acesse a [Vercel](https://vercel.com/) e crie uma conta usando o GitHub.
2. No painel, clique em **`Add New...`** > **`Project`**.
3. Selecione o repositório `family-financial-os` e clique em **`Import`**.

### Passo 4.2: Configurar o Diretório do Projeto
Na tela de configuração do projeto Vercel, ajuste os seguintes parâmetros:
* **Framework Preset:** `Next.js`
* **Root Directory:** Clique em **`Edit`** e selecione a pasta **`frontend`**.

### Passo 4.3: Inserir Variáveis de Ambiente
Expanda a seção **`Environment Variables`** e adicione as duas chaves necessárias para construir a build do Next.js de forma integrada:

| Nome da Variável | Valor |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | *A URL de produção gerada pelo Render na Fase 3* (Sem a barra `/` final. Ex: `https://family-financial-api.onrender.com`) |
| `NEXT_PUBLIC_SUPABASE_URL` | *Sua Project URL do Supabase (Passo 2.3)* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *Sua anon (public) Key do Supabase (Passo 2.3)* |

### Passo 4.4: Publicar (Deploy)
1. Clique no botão **`Deploy`**.
2. A Vercel executará a build do Next.js e gerará os arquivos estáticos e de servidor.
3. Assim que finalizar, ela fornecerá um link público de acesso (ex: `https://family-financial-os.vercel.app`).

---

## 🛡️ Ajuste de Segurança Final (Evitando Erros de CORS)
Para evitar que a API bloqueie o seu frontend em produção:
1. Copie o endereço do seu site gerado pela Vercel (ex: `https://family-financial-os.vercel.app`).
2. Vá nas configurações de variáveis de ambiente do seu serviço de API no painel da **Render** (Fase 3).
3. Encontre e edite a variável `BACKEND_CORS_ORIGINS` para incluir a URL oficial da Vercel (separada por vírgulas).
4. O Render fará um novo deploy automático rápido e a comunicação frontend-backend estará 100% autorizada e segura!
