-- Corrigir funções com search_path adequado para segurança
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.atualizar_stats_cliente()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir ou atualizar cliente
  INSERT INTO public.clientes (nome, total_gasto, total_pedidos, ultimo_pedido)
  VALUES (NEW.cliente_nome, NEW.valor, 1, NEW.created_at)
  ON CONFLICT (nome) DO UPDATE SET
    total_gasto = public.clientes.total_gasto + NEW.valor,
    total_pedidos = public.clientes.total_pedidos + 1,
    ultimo_pedido = GREATEST(public.clientes.ultimo_pedido, NEW.created_at),
    updated_at = timezone('utc'::text, now());
  
  RETURN NEW;
END;
$$;