ALTER TABLE public.comandas
ADD COLUMN order_number TEXT,
ADD COLUMN address TEXT,
ADD COLUMN reference TEXT,
ADD COLUMN delivery_fee NUMERIC,
ADD COLUMN amount_received NUMERIC,
ADD COLUMN change_amount NUMERIC,
ADD COLUMN prep_time_min INTEGER,
ADD COLUMN prep_time_max INTEGER;

-- Adicionar RLS policies para estas novas colunas se necessário, assumindo que as políticas existentes as cobrem.
-- Se não, políticas específicas podem ser necessárias. Por enquanto, assumindo que as políticas existentes são amplas o suficiente.