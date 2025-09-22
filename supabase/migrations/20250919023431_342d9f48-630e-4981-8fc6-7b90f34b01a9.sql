-- Fix database functions for VIP system

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS ranking_clientes_semanal(date);
DROP FUNCTION IF EXISTS ranking_clientes_mensal(integer, integer);

-- Create corrected weekly ranking function
CREATE OR REPLACE FUNCTION ranking_clientes_semanal(default_week_start_date date DEFAULT NULL)
RETURNS TABLE (
  cliente_id uuid,
  nome text,
  valor_gasto numeric,
  pedidos integer,
  foi_vip boolean,
  nivel_vip text
) AS $$
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
$$ LANGUAGE plpgsql;

-- Create corrected monthly ranking function
CREATE OR REPLACE FUNCTION ranking_clientes_mensal(year_param integer, month_param integer)
RETURNS TABLE (
  cliente_id uuid,
  nome text,
  valor_gasto numeric,
  pedidos integer,
  foi_vip boolean,
  nivel_vip text
) AS $$
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
$$ LANGUAGE plpgsql;