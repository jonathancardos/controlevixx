-- Drop existing functions if they exist to allow recreation with new types
DROP FUNCTION IF EXISTS ranking_clientes_semanal(date, integer);
DROP FUNCTION IF EXISTS ranking_clientes_mensal(integer, integer, integer);

-- Function to calculate weekly client ranking
CREATE OR REPLACE FUNCTION ranking_clientes_semanal(
    p_data_inicio DATE DEFAULT (CURRENT_DATE - INTERVAL '7 days')::DATE,
    p_limite INTEGER DEFAULT 10
)
RETURNS TABLE (
    posicao BIGINT,
    cliente_id UUID,
    cliente_nome TEXT,
    valor_gasto NUMERIC,
    pedidos BIGINT,
    is_vip BOOLEAN,
    nivel_vip TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH RankedClients AS (
        SELECT
            c.id AS cliente_id,
            c.nome AS cliente_nome,
            COALESCE(SUM(com.valor), 0) AS valor_gasto,
            COUNT(com.id) AS pedidos,
            c.is_vip,
            c.nivel_vip,
            ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(com.valor), 0) DESC, COUNT(com.id) DESC) AS rn
        FROM
            public.clientes c
        LEFT JOIN
            public.comandas com ON c.id = com.cliente_id
        WHERE
            com.status = 'Processada'
            AND com.data >= p_data_inicio
            AND com.data < (p_data_inicio + INTERVAL '7 days')::DATE
        GROUP BY
            c.id, c.nome, c.is_vip, c.nivel_vip
    )
    SELECT
        rc.rn AS posicao,
        rc.cliente_id,
        rc.cliente_nome,
        rc.valor_gasto,
        rc.pedidos,
        rc.is_vip,
        rc.nivel_vip
    FROM
        RankedClients rc
    ORDER BY
        rc.rn
    LIMIT p_limite;
END;
$$;

-- Function to calculate monthly client ranking
CREATE OR REPLACE FUNCTION ranking_clientes_mensal(
    p_ano INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    p_mes INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
    p_limite INTEGER DEFAULT 10
)
RETURNS TABLE (
    posicao BIGINT,
    cliente_id UUID,
    cliente_nome TEXT,
    valor_gasto NUMERIC,
    pedidos BIGINT,
    is_vip BOOLEAN,
    nivel_vip TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH RankedClients AS (
        SELECT
            c.id AS cliente_id,
            c.nome AS cliente_nome,
            COALESCE(SUM(com.valor), 0) AS valor_gasto,
            COUNT(com.id) AS pedidos,
            c.is_vip,
            c.nivel_vip,
            ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(com.valor), 0) DESC, COUNT(com.id) DESC) AS rn
        FROM
            public.clientes c
        LEFT JOIN
            public.comandas com ON c.id = com.cliente_id
        WHERE
            com.status = 'Processada'
            AND EXTRACT(YEAR FROM com.data) = p_ano
            AND EXTRACT(MONTH FROM com.data) = p_mes
        GROUP BY
            c.id, c.nome, c.is_vip, c.nivel_vip
    )
    SELECT
        rc.rn AS posicao,
        rc.cliente_id,
        rc.cliente_nome,
        rc.valor_gasto,
        rc.pedidos,
        rc.is_vip,
        rc.nivel_vip
    FROM
        RankedClients rc
    ORDER BY
        rc.rn
    LIMIT p_limite;
END;
$$;