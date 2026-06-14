-- Migration: Enable RLS and Create Policies for Authenticated Users
-- Enabling Row Level Security (RLS) for all tables and restricting access to authenticated users.

-- 1. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE participations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE financing ENABLE ROW LEVEL SECURITY;

-- Also enable RLS on the recurring templates tables to secure them
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_participations ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS Policies permitting ALL operations (SELECT, INSERT, UPDATE, DELETE)
-- only for authenticated users (role: 'authenticated'). All other requests (e.g. 'anon') are denied.

-- Users Table Policies
CREATE POLICY "Allow authenticated users full access to users"
ON users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Expenses Table Policies
CREATE POLICY "Allow authenticated users full access to expenses"
ON expenses
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Participations Table Policies
CREATE POLICY "Allow authenticated users full access to participations"
ON participations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Financing Table Policies
-- CREATE POLICY "Allow authenticated users full access to financing"
-- ON financing
-- FOR ALL
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- Recurring Expenses Table Policies
CREATE POLICY "Allow authenticated users full access to recurring_expenses"
ON recurring_expenses
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Recurring Participations Table Policies
CREATE POLICY "Allow authenticated users full access to recurring_participations"
ON recurring_participations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
