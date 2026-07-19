-- =====================================================================
-- FAMILY FINANCIAL OS - USEFUL SQL QUERIES FOR SUPABASE SQL EDITOR
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Modificações de Estrutura (Atualizações do Banco)
-- ---------------------------------------------------------------------

-- 1.1 Adicionar a coluna de avatar de usuário
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(2048) NULL;

-- 1.2 Remover colunas antigas de recorrência caso ainda existam na tabela expenses
ALTER TABLE expenses DROP COLUMN IF EXISTS recurring_expense_id;
ALTER TABLE expenses DROP COLUMN IF EXISTS installment_number;
ALTER TABLE expenses DROP COLUMN IF EXISTS total_installments;
ALTER TABLE expenses DROP COLUMN IF EXISTS parent_installment_id;

-- 1.3 Remover tabelas antigas do motor de recorrência (se não tiver feito ainda)
DROP TABLE IF EXISTS recurring_participations;
DROP TABLE IF EXISTS recurring_expenses;


-- ---------------------------------------------------------------------
-- 2. Limpeza e Reset (Manutenção do Banco)
-- ---------------------------------------------------------------------

-- ATENÇÃO: Roda em cascata e apaga TUDO (participações, despesas e usuários)
-- TRUNCATE TABLE users, expenses, participations RESTART IDENTITY CASCADE;


-- ---------------------------------------------------------------------
-- 3. Consultas Básicas de Diagnóstico
-- ---------------------------------------------------------------------

-- 3.1 Ver todos os membros cadastrados, ordenados por data de criação
SELECT id, name, email, pix_key, avatar_url, created_at 
FROM users 
ORDER BY created_at DESC;

-- 3.2 Ver todas as despesas lançadas com o nome de quem pagou
SELECT e.id, e.title, e.total_amount, e.billing_cycle, e.date, u.name AS pagador
FROM expenses e
JOIN users u ON e.payer_id = u.id
ORDER BY e.date DESC;

-- 3.3 Ver os participantes de uma despesa específica (substitua o ID da despesa)
-- SELECT p.id, u.name AS participante, p.weight, p.value
-- FROM participations p
-- JOIN users u ON p.user_id = u.id
-- WHERE p.expense_id = 'COLE_O_ID_DA_DESPESA_AQUI';


-- ---------------------------------------------------------------------
-- 4. Consultas Analíticas (Cruzamento e Auditoria)
-- ---------------------------------------------------------------------

-- 4.1 Total de despesas acumuladas por mês/ciclo
SELECT billing_cycle, COUNT(*) AS quantidade_despesas, SUM(total_amount) AS total_gasto
FROM expenses
GROUP BY billing_cycle
ORDER BY billing_cycle DESC;

-- 4.2 Ranking de quem mais pagou contas em um ciclo específico (ex: '2026-05')
SELECT u.name AS membro, SUM(e.total_amount) AS total_pago
FROM expenses e
JOIN users u ON e.payer_id = u.id
WHERE e.billing_cycle = '2026-05'
GROUP BY u.name
ORDER BY total_pago DESC;

-- 4.3 Quanto cada um consumiu (participação) em um ciclo específico (ex: '2026-05')
SELECT u.name AS membro, SUM(p.value) AS total_consumido
FROM participations p
JOIN users u ON p.user_id = u.id
JOIN expenses e ON p.expense_id = e.id
WHERE e.billing_cycle = '2026-05'
GROUP BY u.name
ORDER BY total_consumido DESC;
