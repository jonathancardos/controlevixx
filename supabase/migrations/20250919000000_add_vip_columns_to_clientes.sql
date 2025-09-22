-- Adicionando colunas para o sistema VIP na tabela clientes
ALTER TABLE public.clientes
ADD COLUMN total_gasto_semana NUMERIC DEFAULT 0,
ADD COLUMN total_pedidos_semana INTEGER DEFAULT 0,
ADD COLUMN total_gasto_mes NUMERIC DEFAULT 0,
ADD COLUMN total_pedidos_mes INTEGER DEFAULT 0,
ADD COLUMN is_vip BOOLEAN DEFAULT FALSE,
ADD COLUMN vip_combo_available BOOLEAN DEFAULT FALSE,
ADD COLUMN last_week_reset_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN last_month_reset_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN admin_set_week_start_date DATE,
ADD COLUMN admin_set_month_start_date DATE,
ADD COLUMN meta_valor_semanal NUMERIC DEFAULT 100,
ADD COLUMN meta_pedidos_semanal INTEGER DEFAULT 4,
ADD COLUMN nivel_vip TEXT DEFAULT 'Bronze',
ADD COLUMN historico_vip JSONB DEFAULT '[]'::jsonb;

-- Criar índice para nome na tabela clientes para buscas mais rápidas
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON public.clientes (nome);

-- Atualizar `updated_at` automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();