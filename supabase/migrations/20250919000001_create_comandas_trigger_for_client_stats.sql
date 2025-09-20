-- Função para atualizar as estatísticas do cliente na tabela 'clientes'
CREATE OR REPLACE FUNCTION public.update_client_stats_from_comanda()
RETURNS TRIGGER AS $$
DECLARE
    cliente_id_val UUID;
    old_valor NUMERIC;
    old_data DATE;
    new_valor NUMERIC;
    new_data DATE;
BEGIN
    IF TG_OP = 'INSERT' THEN
        cliente_id_val := NEW.cliente_id;
        new_valor := NEW.valor;
        new_data := NEW.data;
        
        UPDATE public.clientes
        SET
            total_gasto = COALESCE(total_gasto, 0) + new_valor,
            total_pedidos = COALESCE(total_pedidos, 0) + 1,
            ultimo_pedido = GREATEST(COALESCE(ultimo_pedido, new_data), new_data)
        WHERE id = cliente_id_val;

    ELSIF TG_OP = 'UPDATE' THEN
        cliente_id_val := NEW.cliente_id;
        new_valor := NEW.valor;
        new_data := NEW.data;
        old_valor := OLD.valor;
        old_data := OLD.data;

        -- Se o cliente_id mudou, ajustar ambos os clientes
        IF OLD.cliente_id IS DISTINCT FROM NEW.cliente_id THEN
            -- Decrementar do cliente antigo
            UPDATE public.clientes
            SET
                total_gasto = COALESCE(total_gasto, 0) - old_valor,
                total_pedidos = COALESCE(total_pedidos, 0) - 1
            WHERE id = OLD.cliente_id;

            -- Incrementar no novo cliente
            UPDATE public.clientes
            SET
                total_gasto = COALESCE(total_gasto, 0) + new_valor,
                total_pedidos = COALESCE(total_pedidos, 0) + 1,
                ultimo_pedido = GREATEST(COALESCE(ultimo_pedido, new_data), new_data)
            WHERE id = NEW.cliente_id;
        ELSE
            -- Se o cliente_id não mudou, apenas ajustar o valor e data
            UPDATE public.clientes
            SET
                total_gasto = COALESCE(total_gasto, 0) - old_valor + new_valor,
                total_pedidos = COALESCE(total_pedidos, 0) + (CASE WHEN OLD.status = 'Cancelada' AND NEW.status != 'Cancelada' THEN 1 WHEN OLD.status != 'Cancelada' AND NEW.status = 'Cancelada' THEN -1 ELSE 0 END),
                ultimo_pedido = GREATEST(COALESCE(ultimo_pedido, new_data), new_data)
            WHERE id = cliente_id_val;
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        cliente_id_val := OLD.cliente_id;
        old_valor := OLD.valor;
        
        UPDATE public.clientes
        SET
            total_gasto = COALESCE(total_gasto, 0) - old_valor,
            total_pedidos = COALESCE(total_pedidos, 0) - 1
        WHERE id = cliente_id_val;
    END IF;

    -- Recalcular ultimo_pedido para o cliente afetado se necessário (após DELETE ou UPDATE de cliente_id)
    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.cliente_id IS DISTINCT FROM NEW.cliente_id) THEN
        PERFORM public.recalculate_ultimo_pedido(cliente_id_val);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para recalcular ultimo_pedido
CREATE OR REPLACE FUNCTION public.recalculate_ultimo_pedido(p_cliente_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.clientes
    SET ultimo_pedido = (
        SELECT MAX(data)
        FROM public.comandas
        WHERE cliente_id = p_cliente_id AND status != 'Cancelada'
    )
    WHERE id = p_cliente_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para a tabela 'comandas'
CREATE OR REPLACE TRIGGER trg_comanda_change
AFTER INSERT OR UPDATE OR DELETE ON public.comandas
FOR EACH ROW
EXECUTE FUNCTION public.update_client_stats_from_comanda();