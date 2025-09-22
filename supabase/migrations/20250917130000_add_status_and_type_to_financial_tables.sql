-- Add 'status' and 'tipo' columns to pagamentos_diarios
ALTER TABLE public.pagamentos_diarios
ADD COLUMN status TEXT DEFAULT 'pendente' NOT NULL,
ADD COLUMN tipo TEXT DEFAULT 'diaria' NOT NULL;

-- Add 'status' column to quinzenas_pagamento
ALTER TABLE public.quinzenas_pagamento
ADD COLUMN status TEXT DEFAULT 'agendada' NOT NULL;