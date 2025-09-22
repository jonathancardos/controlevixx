import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, endOfMonth } from 'date-fns'; // Importar endOfMonth

interface TopClient {
  cliente_nome: string;
  total_gasto: number;
  total_pedidos: number;
}

export function useClientInsights() {
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTopClientsOfMonth = useCallback(async () => {
    setLoading(true);
    try {
      const startOfMonth = format(new Date(), 'yyyy-MM-01');
      const endOfMonthFormatted = format(endOfMonth(new Date()), 'yyyy-MM-dd'); // Corrigido aqui

      const { data, error } = await supabase
        .from('comandas')
        .select('cliente_nome, valor')
        .gte('data', startOfMonth)
        .lte('data', endOfMonthFormatted) // Usar a data formatada corretamente
        .eq('status', 'Processada');

      if (error) {
        console.error('Erro ao carregar comandas para insights de clientes:', error);
        toast.error('Erro ao carregar clientes do mês');
        return;
      }

      const clientAggregates: { [key: string]: { total_gasto: number; total_pedidos: number } } = {};

      data.forEach(comanda => {
        if (comanda.cliente_nome) {
          if (!clientAggregates[comanda.cliente_nome]) {
            clientAggregates[comanda.cliente_nome] = { total_gasto: 0, total_pedidos: 0 };
          }
          clientAggregates[comanda.cliente_nome].total_gasto += comanda.valor;
          clientAggregates[comanda.cliente_nome].total_pedidos += 1;
        }
      });

      const sortedClients: TopClient[] = Object.entries(clientAggregates)
        .map(([cliente_nome, aggregates]) => ({
          cliente_nome,
          total_gasto: aggregates.total_gasto,
          total_pedidos: aggregates.total_pedidos,
        }))
        .sort((a, b) => b.total_gasto - a.total_gasto)
        .slice(0, 5); // Top 5 clientes

      setTopClients(sortedClients);

    } catch (error) {
      console.error('Erro ao buscar top clientes do mês:', error);
      toast.error('Erro ao buscar top clientes do mês');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopClientsOfMonth();
  }, [fetchTopClientsOfMonth]);

  return {
    topClients,
    loading,
    fetchTopClientsOfMonth,
  };
}