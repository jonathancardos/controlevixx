-- Drop and recreate functions to fix parameter name conflicts

DROP FUNCTION IF EXISTS marcar_combo_vip_usado(uuid);
DROP FUNCTION IF EXISTS resetar_status_vip_semanal(uuid);
DROP FUNCTION IF EXISTS atualizar_status_vip_cliente(uuid);
DROP FUNCTION IF EXISTS calcular_status_vip(uuid, numeric, integer);

-- Recreate functions with correct search path
CREATE OR REPLACE FUNCTION calcular_status_vip(
  cliente_uuid uuid,
  valor_meta numeric DEFAULT 100.00,
  pedidos_meta integer DEFAULT 4
)
RETURNS TABLE (
  is_vip boolean,
  vip_combo_available boolean,
  valor_gasto_semana numeric,
  pedidos_semana integer,
  progresso_valor numeric,
  progresso_pedidos numeric,
  nivel_vip text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_record RECORD;
  start_date date;
  end_date date;
  valor_gasto numeric := 0;
  pedidos_count integer := 0;
BEGIN
  -- Get client data
  SELECT * INTO client_record FROM clientes WHERE id = cliente_uuid;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Determine week start date
  start_date := COALESCE(
    NULLIF(client_record.admin_set_week_start_date, NULL),
    client_record.last_week_reset_date::date,
    date_trunc('week', CURRENT_DATE)::date
  );
  
  end_date := start_date + INTERVAL '6 days';
  
  -- Calculate weekly stats
  SELECT 
    COALESCE(SUM(c.valor), 0),
    COUNT(c.id)
  INTO valor_gasto, pedidos_count
  FROM comandas c
  WHERE c.cliente_id = cliente_uuid
    AND c.data >= start_date
    AND c.data <= end_date;
  
  -- Return results
  RETURN QUERY SELECT
    (valor_gasto >= valor_meta AND pedidos_count >= pedidos_meta) as is_vip,
    (valor_gasto >= valor_meta AND pedidos_count >= pedidos_meta AND NOT COALESCE(client_record.combo_vip_usado_semana, false)) as vip_combo_available,
    valor_gasto as valor_gasto_semana,
    pedidos_count as pedidos_semana,
    LEAST(valor_gasto / valor_meta * 100, 100) as progresso_valor,
    LEAST(pedidos_count::numeric / pedidos_meta * 100, 100) as progresso_pedidos,
    CASE 
      WHEN valor_gasto >= valor_meta AND pedidos_count >= pedidos_meta THEN 'VIP'
      WHEN valor_gasto >= valor_meta * 0.7 OR pedidos_count >= pedidos_meta * 0.7 THEN 'Premium' 
      WHEN valor_gasto >= valor_meta * 0.3 OR pedidos_count >= pedidos_meta * 0.3 THEN 'Regular'
      ELSE 'Bronze'
    END as nivel_vip;
END;
$$;

CREATE OR REPLACE FUNCTION marcar_combo_vip_usado(cliente_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE clientes 
  SET combo_vip_usado_semana = true
  WHERE id = cliente_uuid;
  
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION resetar_status_vip_semanal(cliente_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE clientes 
  SET 
    total_gasto_semana = 0,
    total_pedidos_semana = 0,
    is_vip = false,
    vip_combo_available = false,
    combo_vip_usado_semana = false,
    last_week_reset_date = CURRENT_DATE
  WHERE id = cliente_uuid;
  
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION atualizar_status_vip_cliente(cliente_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  status_result RECORD;
  meta_valor numeric;
  meta_pedidos integer;
BEGIN
  -- Get client goals
  SELECT 
    COALESCE(meta_valor_semanal, 100.00) as meta_valor,
    COALESCE(meta_pedidos_semanal, 4) as meta_pedidos
  INTO meta_valor, meta_pedidos
  FROM clientes 
  WHERE id = cliente_uuid;
  
  -- Calculate current status
  SELECT * INTO status_result 
  FROM calcular_status_vip(cliente_uuid, meta_valor, meta_pedidos);
  
  -- Update client record
  UPDATE clientes 
  SET 
    is_vip = status_result.is_vip,
    vip_combo_available = status_result.vip_combo_available,
    total_gasto_semana = status_result.valor_gasto_semana,
    total_pedidos_semana = status_result.pedidos_semana,
    nivel_vip = status_result.nivel_vip,
    updated_at = timezone('utc'::text, now())
  WHERE id = cliente_uuid;
  
  RETURN FOUND;
END;
$$;