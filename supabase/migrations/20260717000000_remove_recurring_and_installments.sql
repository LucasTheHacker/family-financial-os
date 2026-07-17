-- Migration: Remove Recurring Expenses & Installments
-- This script cleans up the database by dropping the recurring expenses tables and tracking columns from 'expenses'.

-- 1. Drop recurring tables (using CASCADE to clean up constraints automatically)
DROP TABLE IF EXISTS recurring_participations CASCADE;
DROP TABLE IF EXISTS recurring_expenses CASCADE;

-- 2. Drop columns from expenses table
ALTER TABLE expenses 
    DROP COLUMN IF EXISTS recurring_expense_id,
    DROP COLUMN IF EXISTS installment_number,
    DROP COLUMN IF EXISTS total_installments,
    DROP COLUMN IF EXISTS parent_installment_id;
