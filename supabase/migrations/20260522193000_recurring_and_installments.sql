-- Migration: Recurring Expenses & Installments
-- Create recurring templates and add tracking columns to expenses

-- 1. Create recurring_expenses table
CREATE TABLE IF NOT EXISTS recurring_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    payer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create recurring_participations table
CREATE TABLE IF NOT EXISTS recurring_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurring_expense_id UUID NOT NULL REFERENCES recurring_expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value NUMERIC(12, 2) CHECK (value >= 0),
    weight NUMERIC(10, 4) CHECK (weight >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure unique participation per user per template
    CONSTRAINT uq_recurring_expense_user UNIQUE (recurring_expense_id, user_id),
    -- Ensure either value or weight is provided
    CONSTRAINT check_recurring_value_or_weight CHECK (value IS NOT NULL OR weight IS NOT NULL)
);

-- 3. Add columns to expenses table
ALTER TABLE expenses 
    ADD COLUMN IF NOT EXISTS recurring_expense_id UUID REFERENCES recurring_expenses(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS installment_number INTEGER CHECK (installment_number >= 1),
    ADD COLUMN IF NOT EXISTS total_installments INTEGER CHECK (total_installments >= 1),
    ADD COLUMN IF NOT EXISTS parent_installment_id UUID;

-- 4. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_recurring_expense_id ON expenses(recurring_expense_id);
CREATE INDEX IF NOT EXISTS idx_expenses_parent_installment_id ON expenses(parent_installment_id);
CREATE INDEX IF NOT EXISTS idx_recurring_participations_template ON recurring_participations(recurring_expense_id);
CREATE INDEX IF NOT EXISTS idx_recurring_participations_user ON recurring_participations(user_id);
