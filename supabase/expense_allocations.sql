-- Run in Supabase SQL Editor after animals & expenses tables exist.
-- Splits species-wide and farm-wide expenses across active animals.

CREATE TABLE IF NOT EXISTS expense_allocations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id  UUID NOT NULL REFERENCES expenses (id) ON DELETE CASCADE,
  animal_id   UUID NOT NULL REFERENCES animals (id) ON DELETE CASCADE,
  amount      NUMERIC NOT NULL CHECK (amount >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (expense_id, animal_id)
);

CREATE INDEX IF NOT EXISTS idx_expense_allocations_expense_id ON expense_allocations (expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_allocations_animal_id ON expense_allocations (animal_id);

ALTER TABLE expense_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage expense_allocations"
  ON expense_allocations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
