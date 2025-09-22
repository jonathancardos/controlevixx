-- Criar sistema de pontos VIP para clientes
-- Atualizar tabela clientes para suportar sistema VIP aprimorado

-- Adicionar colunas para controle de VIP por semana personalizada
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS combo_vip_usado_semana boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS data_inicio_semana_personalizada date,
ADD COLUMN IF NOT EXISTS meta_valor_semanal numeric DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS meta_pedidos_semanal integer DEFAULT 4,
ADD COLUMN IF NOT EXISTS pontos_acumulados integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS nivel_vip text DEFAULT 'Bronze',
ADD COLUMN IF NOT EXISTS historico_vip jsonb DEFAULT '[]'::jsonb;

-- Função para calcular status VIP baseado nas regras
CREATE OR REPLACE FUNCTION public.calcular_status_vip(
    p_cliente_id uuid,
    p_data_inicio_semana date DEFAULT NULL
) RETURNS TABLE (
    is_vip boolean,
    vip_combo_available boolean,
    valor_gasto_semana numeric,
    pedidos_semana integer,
    progresso_valor numeric,
    progresso_pedidos numeric
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_cliente record;
    v_data_inicio date;
    v_data_fim date;
    v_valor_gasto numeric := 0;
    v_pedidos_count integer := 0;
    v_atingiu_meta boolean := false;
BEGIN
    -- Buscar dados do cliente
    SELECT * INTO v_cliente FROM public.clientes WHERE id = p_cliente_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, false, 0::numeric, 0, 0::numeric, 0::numeric;
        RETURN;
    END IF;
    
    -- Determinar período da semana
    IF p_data_inicio_semana IS NOT NULL THEN
        v_data_inicio := p_data_inicio_semana;
    ELSIF v_cliente.data_inicio_semana_personalizada IS NOT NULL THEN
        v_data_inicio := v_cliente.data_inicio_semana_personalizada;
    ELSE
        -- Calcular terça-feira da semana atual
        v_data_inicio := date_trunc('week', CURRENT_DATE)::date + interval '1 day';
    END IF;
    
    -- Semana vai de terça a sábado (5 dias)
    v_data_fim := v_data_inicio + interval '4 days';
    
    -- Calcular gastos e pedidos na semana
    SELECT 
        COALESCE(SUM(valor), 0),
        COUNT(*)
    INTO v_valor_gasto, v_pedidos_count
    FROM public.comandas 
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

-- Função para marcar combo VIP como usado
CREATE OR REPLACE FUNCTION public.marcar_combo_vip_usado(p_cliente_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE public.clientes 
    SET combo_vip_usado_semana = true,
        updated_at = now()
    WHERE id = p_cliente_id;
    
    RETURN FOUND;
END;
$$;

-- Função para resetar status VIP semanal (para ser executada aos domingos)
CREATE OR REPLACE FUNCTION public.resetar_status_vip_semanal()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Resetar combo usado para todos os clientes
    UPDATE public.clientes 
    SET combo_vip_usado_semana = false,
        updated_at = now()
    WHERE combo_vip_usado_semana = true;
    
    -- Adicionar ao histórico VIP dos clientes que foram VIP na semana
    UPDATE public.clientes 
    SET historico_vip = historico_vip || jsonb_build_object(
        'semana', date_trunc('week', CURRENT_DATE - interval '1 week'),
        'foi_vip', is_vip,
        'valor_gasto', total_gasto_semana,
        'pedidos', total_pedidos_semana
    )
    WHERE is_vip = true;
END;
$$;

-- Função para obter ranking semanal
CREATE OR REPLACE FUNCTION public.ranking_clientes_semanal(
    p_data_inicio date DEFAULT NULL,
    p_limite integer DEFAULT 10
) RETURNS TABLE (
    cliente_id uuid,
    cliente_nome text,
    valor_gasto numeric,
    pedidos integer,
    is_vip boolean,
    nivel_vip text,
    posicao integer
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_data_inicio date;
    v_data_fim date;
BEGIN
    -- Determinar período da semana
    IF p_data_inicio IS NOT NULL THEN
        v_data_inicio := p_data_inicio;
    ELSE
        -- Calcular terça-feira da semana atual
        v_data_inicio := date_trunc('week', CURRENT_DATE)::date + interval '1 day';
    END IF;
    
    v_data_fim := v_data_inicio + interval '4 days';
    
    RETURN QUERY
    SELECT 
        c.id,
        c.nome,
        COALESCE(stats.valor_gasto, 0) as valor_gasto,
        COALESCE(stats.pedidos, 0) as pedidos,
        (stats.is_vip_calc).is_vip,
        COALESCE(c.nivel_vip, 'Bronze'),
        ROW_NUMBER() OVER (ORDER BY COALESCE(stats.valor_gasto, 0) DESC)::integer
    FROM public.clientes c
    LEFT JOIN (
        SELECT 
            cmd.cliente_id,
            SUM(cmd.valor) as valor_gasto,
            COUNT(*) as pedidos,
            public.calcular_status_vip(cmd.cliente_id, v_data_inicio) as is_vip_calc
        FROM public.comandas cmd
        WHERE cmd.data >= v_data_inicio 
        AND cmd.data <= v_data_fim
        AND cmd.status != 'Cancelada'
        AND cmd.cliente_id IS NOT NULL
        GROUP BY cmd.cliente_id
    ) stats ON c.id = stats.cliente_id
    WHERE stats.valor_gasto > 0 OR stats.pedidos > 0
    ORDER BY valor_gasto DESC
    LIMIT p_limite;
END;
$$;

-- Função para obter ranking mensal
CREATE OR REPLACE FUNCTION public.ranking_clientes_mensal(
    p_ano integer DEFAULT NULL,
    p_mes integer DEFAULT NULL,
    p_limite integer DEFAULT 10
) RETURNS TABLE (
    cliente_id uuid,
    cliente_nome text,
    valor_gasto numeric,
    pedidos integer,
    posicao integer
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_data_inicio date;
    v_data_fim date;
BEGIN
    -- Determinar período do mês
    IF p_ano IS NOT NULL AND p_mes IS NOT NULL THEN
        v_data_inicio := make_date(p_ano, p_mes, 1);
    ELSE
        v_data_inicio := date_trunc('month', CURRENT_DATE)::date;
    END IF;
    
    v_data_fim := (v_data_inicio + interval '1 month' - interval '1 day')::date;
    
    RETURN QUERY
    SELECT 
        c.id,
        c.nome,
        COALESCE(stats.valor_gasto, 0) as valor_gasto,
        COALESCE(stats.pedidos, 0) as pedidos,
        ROW_NUMBER() OVER (ORDER BY COALESCE(stats.valor_gasto, 0) DESC)::integer
    FROM public.clientes c
    LEFT JOIN (
        SELECT 
            cmd.cliente_id,
            SUM(cmd.valor) as valor_gasto,
            COUNT(*) as pedidos
        FROM public.comandas cmd
        WHERE cmd.data >= v_data_inicio 
        AND cmd.data <= v_data_fim
        AND cmd.status != 'Cancelada'
        AND cmd.cliente_id IS NOT NULL
        GROUP BY cmd.cliente_id
    ) stats ON c.id = stats.cliente_id
    WHERE stats.valor_gasto > 0 OR stats.pedidos > 0
    ORDER BY valor_gasto DESC
    LIMIT p_limite;
END;
$$;

-- Trigger para atualizar status VIP automaticamente
CREATE OR REPLACE FUNCTION public.atualizar_status_vip_cliente()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_status_vip record;
BEGIN
    -- Calcular novo status VIP
    SELECT * INTO v_status_vip 
    FROM public.calcular_status_vip(NEW.cliente_id);
    
    -- Atualizar cliente com novo status
    UPDATE public.clientes
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

-- Criar trigger na tabela comandas
DROP TRIGGER IF EXISTS trigger_atualizar_status_vip ON public.comandas;
CREATE TRIGGER trigger_atualizar_status_vip
    AFTER INSERT OR UPDATE ON public.comandas
    FOR EACH ROW
    WHEN (NEW.cliente_id IS NOT NULL)
    EXECUTE FUNCTION public.atualizar_status_vip_cliente();