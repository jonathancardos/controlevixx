-- Enable RLS on tables that need it
ALTER TABLE public.categorias_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_novo_insumo ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for categorias_produtos
CREATE POLICY IF NOT EXISTS "Users can view categoria produtos" ON public.categorias_produtos FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated users can create categoria produtos" ON public.categorias_produtos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can update categoria produtos" ON public.categorias_produtos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can delete categoria produtos" ON public.categorias_produtos FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for settings  
CREATE POLICY IF NOT EXISTS "Users can view settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated users can create settings" ON public.settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can update settings" ON public.settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can delete settings" ON public.settings FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for solicitacoes_novo_insumo
CREATE POLICY IF NOT EXISTS "Users can view solicitacoes novo insumo" ON public.solicitacoes_novo_insumo FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated users can create solicitacoes novo insumo" ON public.solicitacoes_novo_insumo FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can update solicitacoes novo insumo" ON public.solicitacoes_novo_insumo FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can delete solicitacoes novo insumo" ON public.solicitacoes_novo_insumo FOR DELETE USING (auth.role() = 'authenticated');

-- Update functions to set search_path
CREATE OR REPLACE FUNCTION ranking_clientes_semanal(default_week_start_date date DEFAULT NULL)
RETURNS TABLE (
  cliente_id uuid,
  nome text,
  valor_gasto numeric,
  pedidos integer,
  foi_vip boolean,
  nivel_vip text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as cliente_id,
    c.nome,
    COALESCE(SUM(cmd.valor), 0) as valor_gasto,
    COUNT(cmd.id)::integer as pedidos,
    c.is_vip as foi_vip,
    COALESCE(c.nivel_vip, 'Bronze') as nivel_vip
  FROM clientes c
  LEFT JOIN comandas cmd ON c.id = cmd.cliente_id 
    AND cmd.data >= COALESCE(
      NULLIF(c.admin_set_week_start_date, ''), 
      COALESCE(c.last_week_reset_date, default_week_start_date::text, date_trunc('week', CURRENT_DATE)::text)
    )::date
    AND cmd.data < (COALESCE(
      NULLIF(c.admin_set_week_start_date, ''), 
      COALESCE(c.last_week_reset_date, default_week_start_date::text, date_trunc('week', CURRENT_DATE)::text)
    )::date + INTERVAL '7 days')::date
  GROUP BY c.id, c.nome, c.is_vip, c.nivel_vip
  ORDER BY valor_gasto DESC, pedidos DESC;
END;
$$;

CREATE OR REPLACE FUNCTION ranking_clientes_mensal(year_param integer, month_param integer)
RETURNS TABLE (
  cliente_id uuid,
  nome text,
  valor_gasto numeric,
  pedidos integer,
  foi_vip boolean,
  nivel_vip text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as cliente_id,
    c.nome,
    COALESCE(SUM(cmd.valor), 0) as valor_gasto,
    COUNT(cmd.id)::integer as pedidos,
    c.is_vip as foi_vip,
    COALESCE(c.nivel_vip, 'Bronze') as nivel_vip
  FROM clientes c
  LEFT JOIN comandas cmd ON c.id = cmd.cliente_id 
    AND EXTRACT(YEAR FROM cmd.data) = year_param
    AND EXTRACT(MONTH FROM cmd.data) = month_param
  GROUP BY c.id, c.nome, c.is_vip, c.nivel_vip
  ORDER BY valor_gasto DESC, pedidos DESC;
END;
$$;

-- Update other functions to set search_path
CREATE OR REPLACE FUNCTION public.calcular_status_vip(p_cliente_id uuid, p_data_inicio_semana date DEFAULT NULL::date)
RETURNS TABLE(is_vip boolean, vip_combo_available boolean, valor_gasto_semana numeric, pedidos_semana integer, progresso_valor numeric, progresso_pedidos numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cliente record;
    v_data_inicio date;
    v_data_fim date;
    v_valor_gasto numeric := 0;
    v_pedidos_count integer := 0;
    v_atingiu_meta boolean := false;
BEGIN
    -- Buscar dados do cliente
    SELECT * INTO v_cliente FROM clientes WHERE id = p_cliente_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, false, 0::numeric, 0, 0::numeric, 0::numeric;
        RETURN;
    END IF;
    
    -- Determinar período da semana (domingo como início da semana)
    IF p_data_inicio_semana IS NOT NULL THEN
        v_data_inicio := p_data_inicio_semana;
    ELSIF v_cliente.data_inicio_semana_personalizada IS NOT NULL THEN
        v_data_inicio := v_cliente.data_inicio_semana_personalizada;
    ELSE
        -- Calcular domingo da semana atual (para alinhar com weekStartsOn: 0 de date-fns)
        v_data_inicio := (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer * INTERVAL '1 day')::date;
    END IF;
    
    -- Semana vai de domingo a sábado (7 dias)
    v_data_fim := v_data_inicio + interval '6 days';
    
    -- Calcular gastos e pedidos na semana
    SELECT 
        COALESCE(SUM(valor), 0),
        COUNT(*)::integer -- Explicit cast to integer
    INTO v_valor_gasto, v_pedidos_count
    FROM comandas 
    WHERE cliente_id = p_cliente_id 
    AND data >= v_data_inicio 
    AND data <= v_data_fim
    AND status != 'Cancelada';
    
    -- Verificar se atingiu meta (valor OU pedidos)
    v_atingiu_meta := (
        v_valor_gasto >= COALESCE(v_cliente.meta_valor_semanal, 100.00) OR
        v_pedidos_count >= COALESCE(v_cliente.meta_pedidos_semanal, 4)
    );
    
    -- Calcular progresso
    RETURN QUERY SELECT 
        v_atingiu_meta,
        v_atingiu_meta AND NOT COALESCE(v_cliente.combo_vip_usado_semana, false),
        v_valor_gasto,
        v_pedidos_count,
        LEAST(v_valor_gasto / COALESCE(v_cliente.meta_valor_semanal, 100.00) * 100, 100)::numeric,
        LEAST(v_pedidos_count::numeric / COALESCE(v_cliente.meta_pedidos_semanal, 4) * 100, 100)::numeric;
END;
$$;

CREATE OR REPLACE FUNCTION public.marcar_combo_vip_usado(p_cliente_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE clientes 
    SET combo_vip_usado_semana = true,
        updated_at = now()
    WHERE id = p_cliente_id;
    
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.resetar_status_vip_semanal()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Resetar combo usado para todos os clientes
    UPDATE clientes 
    SET combo_vip_usado_semana = false,
        updated_at = now()
    WHERE combo_vip_usado_semana = true;
    
    -- Adicionar ao histórico VIP dos clientes que foram VIP na semana
    UPDATE clientes 
    SET historico_vip = historico_vip || jsonb_build_object(
        'semana', date_trunc('week', CURRENT_DATE - interval '1 week'),
        'foi_vip', is_vip,
        'valor_gasto', total_gasto_semana,
        'pedidos', total_pedidos_semana
    )
    WHERE is_vip = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.atualizar_status_vip_cliente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_status_vip record;
BEGIN
    -- Calcular novo status VIP
    SELECT * INTO v_status_vip 
    FROM calcular_status_vip(NEW.cliente_id);
    
    -- Atualizar cliente com novo status
    UPDATE clientes
    SET 
        is_vip = v_status_vip.is_vip,
        vip_combo_available = v_status_vip.vip_combo_available,
        total_gasto_semana = v_status_vip.valor_gasto_semana,
        total_pedidos_semana = v_status_vip.pedidos_semana,
        updated_at = now()
    WHERE id = NEW.cliente_id;
    
    RETURN NEW;
END;
$$;