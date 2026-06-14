-- Migration: Initialize Schema for User, Expense, and Participation
-- Create tables with UUID primary keys and standard constraints

-- Enable UUID extension if not enabled (Supabase usually has this by default in public schema)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    pix_key VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    payer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    expense_type VARCHAR(50) NOT NULL CHECK (expense_type IN ('Single', 'Fixed', 'Installment')),
    billing_cycle VARCHAR(7) NOT NULL CHECK (billing_cycle ~ '^[0-9]{4}-[0-9]{2}$'), -- Format: YYYY-MM
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Participations table
CREATE TABLE IF NOT EXISTS participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value NUMERIC(12, 2) CHECK (value >= 0),
    weight NUMERIC(10, 4) CHECK (weight >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure user doesn't have duplicate participations in the same expense
    CONSTRAINT uq_expense_user UNIQUE (expense_id, user_id),
    -- Ensure at least value or weight is provided
    CONSTRAINT check_value_or_weight CHECK (value IS NOT NULL OR weight IS NOT NULL)
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_payer_id ON expenses(payer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_billing_cycle ON expenses(billing_cycle);
CREATE INDEX IF NOT EXISTS idx_participations_expense_id ON participations(expense_id);
CREATE INDEX IF NOT EXISTS idx_participations_user_id ON participations(user_id);
