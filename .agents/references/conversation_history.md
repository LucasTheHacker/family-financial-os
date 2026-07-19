# Histórico de Desenvolvimento e Referência

Este arquivo documenta as decisões de design, correções de bugs, refatorações anteriores e o contexto de desenvolvimento do **Family Financial OS**.

---

## 📌 Histórico de Mudanças

### 1. Remoção do Motor de Recorrência
- **Contexto:** Inicialmente o sistema contava com suporte a despesas fixas mensais e parcelas que se auto-propagavam para os meses seguintes. Isso gerava uma complexidade desnecessária no backend e causava travamentos de concorrência no banco de dados.
- **Ação:** Removemos completamente todas as referências de backend (tabelas SQL, rotas FastAPI, models de recorrência e testes) e frontend (páginas de modelos fixos, caixas de parcelamento). O sistema agora suporta exclusivamente despesas simples e únicas (`"Single"`).

### 2. Modernização do Design (Visual Bynario)
- **Contexto:** A interface inicial parecia um MVP simples em tons de cinza/azul e layouts de tabelas comuns.
- **Ação:** Reestilizamos o visual com base no tema escuro moderno da **Bynario** (fundo preto puro, glows radiais violetas nas laterais/fundo, cards de vidro translúcido). Implementamos suporte nativo para Light/Dark mode por meio de uma classe `.dark` e persistência automática no `localStorage`.

### 3. Implementação de Avatares dos Membros
- **Contexto:** O usuário solicitou suporte para carregar a foto de perfil dos participantes da família.
- **Ação:** 
  - Adicionamos a coluna `avatar_url` na tabela `users`.
  - Desenvolvemos o componente `<UserAvatar>` no frontend que carrega a URL inserida pelo usuário ou gera automaticamente um avatar colorido de iniciais usando a API do **Dicebear** caso o campo esteja vazio.
  - Atualizamos a tela de cadastro e edição de membros para permitir inserir a URL da imagem.

---

## 🐞 Bugs Históricos Resolvidos

### Erro de Conexão com Supabase no Login
- **Sintoma:** `TypeError: Failed to fetch` ao tentar logar com Google Link mágico.
- **Causa:** O Supabase ficou temporariamente indisponível e as chaves de ambiente não estavam propagando corretamente no frontend.
- **Resolução:** Ajustamos o carregamento de variáveis de ambiente no Next.js e tratamos a desconexão do cliente de autenticação.

### Erro de Compilação/Deleção de Despesas
- **Sintoma:** O build da Vercel falhava com `Expected 1 arguments, but got 2` na deleção de despesas.
- **Causa:** O backend removeu o suporte a remoção em cascata (recorrência), mas o componente `ExpenseLedger.tsx` continuava passando dois parâmetros na chamada de deleção.
- **Resolução:** Refatoramos a chamada e o modal de exclusão para passar apenas o ID da despesa, limpando todo o código morto.

### Erro de Coluna Indefinida no Backend (`UndefinedColumn`)
- **Sintoma:** Chamadas ao backend quebravam com `sqlalchemy.exc.ProgrammingError: column expenses.recurring_expense_id does not exist`.
- **Causa:** As colunas foram removidas do banco de dados PostgreSQL pelas migrações, mas o model do SQLAlchemy (`Expense`) continuava declarando-as. O ORM gerava consultas solicitando colunas inexistentes.
- **Resolução:** Deletamos as colunas obsoletas do model Python (`Expense`) e do schema de resposta do FastAPI (`ExpenseResponse`).
