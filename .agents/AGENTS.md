# Regras do Projeto (Family Financial OS)

Você está trabalhando no **Family Financial OS**, uma aplicação de divisão de despesas e simplificação de dívidas da Família Batista.

## 🛠️ Stack Tecnológica

1. **Backend:** FastAPI (Python 3.12+), SQLAlchemy (2.0+) e PostgreSQL/Supabase (SQLite em ambiente de teste local).
2. **Frontend:** Next.js (16.2+ com app router), Tailwind CSS (v4) e React.

---

## ⚠️ Restrições de Arquitetura e Regras de Negócio

1. **Remoção Completa do Motor de Recorrência:**
   - O sistema **NÃO** possui mais suporte a despesas fixas, recorrentes ou parceladas. 
   - Apenas despesas do tipo `"Single"` (simples/únicas) são suportadas. 
   - Não crie código, models ou propriedades para `recurring_expense_id`, `installment_number`, `total_installments` ou `parent_installment_id`. Estes campos foram permanentemente removidos do banco de dados e dos models/schemas do Python.

2. **Tipos de Despesas válidos:**
   - A propriedade `expense_type` na criação de despesa deve ser obrigatoriamente `"Single"`.

3. **Cálculo de Dívidas (Simplificação):**
   - O algoritmo central calcula o balanço líquido de cada membro (`total_pago - total_consumido`).
   - Com base nisso, realiza o cruzamento de dívidas minimizando o número de transferências (devedores pagam diretamente aos credores).

---

## 🎨 Padrão de Design e Temas

1. **Tema Claro & Escuro (Manual):**
   - O app suporta temas claro e escuro. A alternância é feita adicionando/removendo a classe `.dark` no elemento raiz (`document.documentElement`).
   - As cores devem seguir as variáveis definidas em `globals.css` (ex: `--background`, `--foreground`, `--card-bg`, `--card-border`).
   - Use a classe `.glass-panel` para painéis com efeito translúcido (*glassmorphism*).

2. **Avatares dos Membros:**
   - A tabela `users` possui um campo opcional `avatar_url` (VARCHAR(2048)).
   - Sempre que renderizar o nome de um membro, certifique-se de exibir o componente `<UserAvatar>` importado de `@/components/expenses/ExpenseForm`. Ele exibirá a imagem da URL ou gerará automaticamente um avatar com iniciais via API do *Dicebear* se for nulo.

---

## 🧪 Como Testar e Rodar

* **Rodar os Testes Unitários do Backend:**
  ```powershell
  .\venv\Scripts\pytest backend/tests
  ```
* **Rodar o Servidor de Desenvolvimento Frontend:**
  ```powershell
  npm run dev
  ```
