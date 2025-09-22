-- Função para calcular o status VIP de um cliente
CREATE OR REPLACE FUNCTION public.calcular_status_vip(
    p_cliente_id UUID,
    p_data_inicio_semana DATE DEFAULT NULL,
    p_data_inicio_mes DATE DEFAULT NULL
)
RETURNS TABLE (
    is_vip BOOLEAN,
    vip_combo_available BOOLEAN,
    valor_gasto_semana NUMERIC,
    pedidos_semana INTEGER,
    progresso_valor NUMERIC,
    progresso_pedidos NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cliente public.clientes;
    v_start_of_week DATE;
    v_end_of_week DATE;
    v_start_of_month DATE;
    v_end_of_month DATE;
    v_current_date DATE := CURRENT_DATE;
    v_gasto_semana NUMERIC := 0;
    v_pedidos_semana INTEGER := 0;
    v_gasto_mes NUMERIC := 0;
    v_pedidos_mes INTEGER := 0;
    v_is_vip BOOLEAN := FALSE;
    v_vip_combo_available BOOLEAN := FALSE;
    v_meta_valor NUMERIC;
    v_meta_pedidos INTEGER;
    v_nivel_vip TEXT;
    v_historico_vip JSONB;
BEGIN
    SELECT * INTO v_cliente FROM public.clientes WHERE id = p_cliente_id;

    IF v_cliente IS NULL THEN
        RAISE EXCEPTION 'Cliente com ID % não encontrado.', p_cliente_id;
    END IF;

    -- Determinar as datas de início da semana e do mês
    v_start_of_week := COALESCE(p_data_inicio_semana, v_cliente.admin_set_week_start_date, date_trunc('week', v_current_date)::DATE);
    v_end_of_week := v_start_of_week + INTERVAL '6 days'; -- Semana de 7 dias

    v_start_of_month := COALESCE(p_data_inicio_mes, v_cliente.admin_set_month_start_date, date_trunc('month', v_current_date)::DATE);
    v_end_of_month := date_trunc('month', v_current_date) + INTERVAL '1 month - 1 day';

    -- Reset semanal se a data de reset for anterior à semana atual
    IF v_cliente.last_week_reset_date < v_start_of_week THEN
        v_cliente.total_gasto_semana := 0;
        v_cliente.total_pedidos_semana := 0;
        v_cliente.vip_combo_available := FALSE;
        v_cliente.combo_vip_usado_semana := FALSE;
        v_cliente.last_week_reset_date := v_start_of_week;
    END IF;

    -- Reset mensal se a data de reset for anterior ao mês atual
    IF v_cliente.last_month_reset_date < v_start_of_month THEN
        v_cliente.total_gasto_mes := 0;
        v_cliente.total_pedidos_mes := 0;
        v_cliente.last_month_reset_date := v_start_of_month;
    END IF;

    -- Calcular gastos e pedidos da semana
    SELECT COALESCE(SUM(valor), 0), COALESCE(COUNT(id), 0)
    INTO v_gasto_semana, v_pedidos_semana
    FROM public.comandas
    WHERE cliente_id = p_cliente_id
      AND data BETWEEN v_start_of_week AND v_end_of_week
      AND status != 'Cancelada';

    -- Calcular gastos e pedidos do mês
    SELECT COALESCE(SUM(valor), 0), COALESCE(COUNT(id), 0)
    INTO v_gasto_mes, v_pedidos_mes
    FROM public.comandas
    WHERE cliente_id = p_cliente_id
      AND data BETWEEN v_start_of_month AND v_end_of_month
      AND status != 'Cancelada';

    -- Atualizar cliente com os novos totais (se houver mudança)
    IF v_gasto_semana IS DISTINCT FROM v_cliente.total_gasto_semana OR
       v_pedidos_semana IS DISTINCT FROM v_cliente.total_pedidos_semana OR
       v_gasto_mes IS DISTINCT FROM v_cliente.total_gasto_mes OR
       v_pedidos_mes IS DISTINCT FROM v_cliente.total_pedidos_mes OR
       v_cliente.last_week_reset_date IS DISTINCT FROM v_start_of_week OR
       v_cliente.last_month_reset_date IS DISTINCT FROM v_start_of_month
    THEN
        UPDATE public.clientes
        SET
            total_gasto_semana = v_gasto_semana,
            total_pedidos_semana = v_pedidos_semana,
            total_gasto_mes = v_gasto_mes,
            total_pedidos_mes = v_pedidos_mes,
            last_week_reset_date = v_start_of_week,
            last_month_reset_date = v_start_of_month
        WHERE id = p_cliente_id
        RETURNING * INTO v_cliente; -- Atualiza v_cliente com os novos valores
    END IF;

    -- Determinar metas (pode ser configurável por admin ou padrão)
    v_meta_valor := COALESCE(v_cliente.meta_valor_semanal, 100);
    v_meta_pedidos := COALESCE(v_cliente.meta_pedidos_semanal, 4);

    -- Lógica para determinar se é VIP e se o combo está disponível
    v_is_vip := (v_cliente.total_gasto_semana >= v_meta_valor OR v_cliente.total_pedidos_semana >= v_meta_pedidos);
    v_vip_combo_available := v_is_vip AND NOT COALESCE(v_cliente.combo_vip_usado_semana, FALSE);

    -- Determinar Nível VIP (exemplo simples)
    IF v_cliente.total_gasto >= 1000 OR v_cliente.total_pedidos >= 30 THEN
        v_nivel_vip := 'Premium';
    ELSIF v_cliente.total_gasto >= 500 OR v_cliente.total_pedidos >= 15 THEN
        v_nivel_vip := 'VIP';
    ELSIF v_cliente.total_pedidos >= 3 THEN
        v_nivel_vip := 'Regular';
    ELSE
        v_nivel_vip := 'Novo';
    END IF;

    -- Atualizar status VIP e combo no cliente
    IF v_is_vip IS DISTINCT FROM v_cliente.is_vip OR
       v_vip_combo_available IS DISTINCT FROM v_cliente.vip_combo_available OR
       v_nivel_vip IS DISTINCT FROM v_cliente.nivel_vip
    THEN
        UPDATE public.clientes
        SET
            is_vip = v_is_vip,
            vip_combo_available = v_vip_combo_available,
            nivel_vip = v_nivel_vip
        WHERE id = p_cliente_id;
    END IF;

    -- Retornar os resultados
    RETURN QUERY SELECT
        v_is_vip,
        v_vip_combo_available,
        v_gasto_semana,
        v_pedidos_semana,
        (v_gasto_semana / v_meta_valor) * 100 AS progresso_valor,
        (v_pedidos_semana::NUMERIC / v_meta_pedidos::NUMERIC) * 100 AS progresso_pedidos;

END;
$$;

-- Função para marcar o combo VIP como usado
CREATE OR REPLACE FUNCTION public.marcar_combo_vip_usado(p_cliente_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.clientes
    SET vip_combo_available = FALSE, combo_vip_usado_semana = TRUE
    WHERE id = p_cliente_id;
    RETURN TRUE;
END;
$$;

-- Função para resetar o status VIP semanal para todos os clientes
CREATE OR REPLACE FUNCTION public.resetar_status_vip_semanal()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.clientes
    SET
        total_gasto_semana = 0,
        total_pedidos_semana = 0,
        is_vip = FALSE,
        vip_combo_available = FALSE,
        combo_vip_usado_semana = FALSE,
        last_week_reset_date = CURRENT_DATE; -- Atualiza a data do último reset
END;
$$;

-- Função para resetar o status VIP mensal para todos os clientes
CREATE OR REPLACE FUNCTION public.resetar_status_vip_mensal()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.clientes
    SET
        total_gasto_mes = 0,
        total_pedidos_mes = 0,
        last_month_reset_date = CURRENT_DATE; -- Atualiza a data do último reset
END;
$$;

-- Função para ranking de clientes semanal
CREATE OR REPLACE FUNCTION public.ranking_clientes_semanal(
    p_data_inicio DATE DEFAULT NULL,
    p_limite INT DEFAULT 10
)
RETURNS TABLE (
    posicao BIGINT,
    cliente_id UUID,
    cliente_nome TEXT,
    valor_gasto NUMERIC,
    pedidos INTEGER,
    is_vip BOOLEAN,
    nivel_vip TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date DATE := COALESCE(p_data_inicio, date_trunc('week', CURRENT_DATE)::DATE);
    v_end_date DATE := v_start_date + INTERVAL '6 days';
BEGIN
    RETURN QUERY
    WITH RankedClients AS (
        SELECT
            c.id AS cliente_id,
            c.nome AS cliente_nome,
            COALESCE(SUM(com.valor), 0) AS valor_gasto,
            COALESCE(COUNT(com.id), 0) AS pedidos,
            c.is_vip,
            c.nivel_vip
        FROM public.clientes c
        LEFT JOIN public.comandas com ON c.id = com.cliente_id
        WHERE com.data BETWEEN v_start_date AND v_end_date
          AND com.status != 'Cancelada'
        GROUP BY c.id, c.nome, c.is_vip, c.nivel_vip
    )
    SELECT
        ROW_NUMBER() OVER (ORDER BY rc.valor_gasto DESC, rc.pedidos DESC) AS posicao,
        rc.cliente_id,
        rc.cliente_nome,
        rc.valor_gasto,
        rc.pedidos,
        rc.is_vip,
        rc.nivel_vip
    FROM RankedClients rc
    ORDER BY posicao
    LIMIT p_limite;
END;
$$;

-- Função para ranking de clientes mensal
CREATE OR REPLACE FUNCTION public.ranking_clientes_mensal(
    p_ano INT DEFAULT NULL,
    p_mes INT DEFAULT NULL,
    p_limite INT DEFAULT 10
)
RETURNS TABLE (
    posicao BIGINT,
    cliente_id UUID,
    cliente_nome TEXT,
    valor_gasto NUMERIC,
    pedidos INTEGER,
    is_vip BOOLEAN,
    nivel_vip TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_target_year INT := COALESCE(p_ano, EXTRACT(YEAR FROM CURRENT_DATE)::INT);
    v_target_month INT := COALESCE(p_mes, EXTRACT(MONTH FROM CURRENT_DATE)::INT);
BEGIN
    RETURN QUERY
    WITH RankedClients AS (
        SELECT
            c.id AS cliente_id,
            c.nome AS cliente_nome,
            COALESCE(SUM(com.valor), 0) AS valor_gasto,
            COALESCE(COUNT(com.id), 0) AS pedidos,
            c.is_vip,
            c.nivel_vip
        FROM public.clientes c
        LEFT JOIN public.comandas com ON c.id = com.cliente_id
        WHERE EXTRACT(YEAR FROM com.data) = v_target_year
          AND EXTRACT(MONTH FROM com.data) = v_target_month
          AND com.status != 'Cancelada'
        GROUP BY c.id, c.nome, c.is_vip, c.nivel_vip
    )
    SELECT
        ROW_NUMBER() OVER (ORDER BY rc.valor_gasto DESC, rc.pedidos DESC) AS posicao,
        rc.cliente_id,
        rc.cliente_nome,
        rc.valor_gasto,
        rc.pedidos,
        rc.is_vip,
        rc.nivel_vip
    FROM RankedClients rc
    ORDER BY posicao
    LIMIT p_limite;
END;
$$;