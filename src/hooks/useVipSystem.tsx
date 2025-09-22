"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO, startOfWeek, startOfMonth, endOfWeek, endOfMonth, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Cliente } from '@/types/supabase';

interface VipStatusResult {
  is_vip: boolean;
  vip_combo_available: boolean;
  valor_gasto_semana: number;
  pedidos_semana: number;
  progresso_valor: number;
  progresso_pedidos: number;
  nivel_vip: string;
}

interface RankingEntry {
  cliente_id: string;
  cliente_nome: string;
  valor_gasto: number;
  pedidos: number;
  posicao: number;
  is_vip?: boolean;
  nivel_vip?: string;
}

// Nova interface para o histórico VIP processado
interface ProcessedVipHistoryEntry {
  startDate: string; // Formatted date string (yyyy-MM-dd)
  endDate: string;   // Formatted date string (yyyy-MM-dd)
  foi_vip: boolean;
  valor_gasto: number;
  pedidos: number;
  nivel_vip_display: string; // Derived level for display
}

// Nova interface para o retorno completo do histórico VIP, incluindo o status atual
interface FullVipHistory {
  currentWeekStatus: VipStatusResult | null;
  currentMonthStatus: VipStatusResult | null;
  historyData: ProcessedVipHistoryEntry[];
}

export function useVipSystem() {
  const [loading, setLoading] = useState(false);
  const [globalVipSettings, setGlobalVipSettings] = useState({
    default_meta_valor_semanal: 100,
    default_meta_pedidos_semanal: 4,
    valor_combo_vip: 27,
    default_week_start_date: format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd'), // Domingo como início da semana
    default_month_start_date: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  // Helper para calcular o fim da semana
  const getWeekEndDate = useCallback((startDateStr: string): Date => {
    const startDate = parseISO(startDateStr);
    return addDays(startDate, 6); // Semana de 7 dias (domingo a sábado)
  }, []);

  // Helper para calcular o fim do mês
  const getMonthEndDate = useCallback((startDateStr: string): Date => {
    const startDate = parseISO(startDateStr);
    return endOfMonth(startDate);
  }, []);

  const calcularStatusVip = useCallback(async (
    clienteId: string,
    effectiveWeekStartDateStr: string,
    effectiveMonthStartDateStr: string
  ): Promise<VipStatusResult | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('calcular_status_vip', {
        p_cliente_id: clienteId,
        p_data_inicio_semana: effectiveWeekStartDateStr,
      });

      if (error) {
        console.error('Erro ao calcular status VIP:', error);
        toast.error('Erro ao calcular status VIP.');
        return null;
      }

      if (data && data.length > 0) {
        const status = data[0];
        // Atualizar o nível VIP do cliente no banco de dados
        let nivel_vip_calculado = 'Bronze';
        if (status.is_vip) {
          if (status.valor_gasto_semana >= 500 || status.pedidos_semana >= 15) { // Exemplo de critério para Premium
            nivel_vip_calculado = 'Premium';
          } else if (status.valor_gasto_semana >= 100 || status.pedidos_semana >= 4) { // Exemplo de critério para VIP
            nivel_vip_calculado = 'VIP';
          } else {
            nivel_vip_calculado = 'Regular';
          }
        }

        await supabase.from('clientes').update({
          is_vip: status.is_vip,
          vip_combo_available: status.vip_combo_available,
          total_gasto_semana: status.valor_gasto_semana,
          total_pedidos_semana: status.pedidos_semana,
          nivel_vip: nivel_vip_calculado,
          last_week_reset_date: effectiveWeekStartDateStr, // Atualiza a data de reset da semana
          last_month_reset_date: effectiveMonthStartDateStr, // Atualiza a data de reset do mês
        }).eq('id', clienteId);

        return {
          is_vip: status.is_vip,
          vip_combo_available: status.vip_combo_available,
          valor_gasto_semana: status.valor_gasto_semana,
          pedidos_semana: status.pedidos_semana,
          progresso_valor: status.progresso_valor,
          progresso_pedidos: status.progresso_pedidos,
          nivel_vip: nivel_vip_calculado,
        };
      }
      return null;
    } catch (error) {
      console.error('Erro inesperado ao calcular status VIP:', error);
      toast.error('Erro inesperado ao calcular status VIP.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetarStatusVipSemanal = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('resetar_status_vip_semanal');
      if (error) {
        console.error('Erro ao resetar status VIP semanal:', error);
        toast.error('Erro ao resetar status VIP semanal.');
        return false;
      }
      toast.success('Status VIP semanal resetado para todos os clientes!');
      return true;
    } catch (error) {
      console.error('Erro inesperado ao resetar status VIP semanal:', error);
      toast.error('Erro inesperado ao resetar status VIP semanal.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const obterRankingSemanal = useCallback(async (p_data_inicio?: string): Promise<RankingEntry[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('ranking_clientes_semanal', {
        p_data_inicio: p_data_inicio,
        p_limite: 10,
      });

      if (error) {
        console.error('Erro ao obter ranking semanal:', error);
        toast.error('Erro ao obter ranking semanal.');
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Erro inesperado ao obter ranking semanal:', error);
      toast.error('Erro inesperado ao obter ranking semanal.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const obterRankingMensal = useCallback(async (p_ano?: number, p_mes?: number): Promise<RankingEntry[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('ranking_clientes_mensal', {
        p_ano: p_ano,
        p_mes: p_mes,
        p_limite: 10,
      });

      if (error) {
        console.error('Erro ao obter ranking mensal:', error);
        toast.error('Erro ao obter ranking mensal.');
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Erro inesperado ao obter ranking mensal:', error);
      toast.error('Erro inesperado ao obter ranking mensal.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const configurarMetasCliente = useCallback(async (
    clienteId: string,
    metaValorSemanal: number,
    metaPedidosSemanal: number,
    adminSetWeekStartDate: string | null,
    adminSetMonthStartDate: string | null
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const updates: Partial<Cliente> = {
        meta_valor_semanal: metaValorSemanal,
        meta_pedidos_semanal: metaPedidosSemanal,
        admin_set_week_start_date: adminSetWeekStartDate === '' ? null : adminSetWeekStartDate,
        admin_set_month_start_date: adminSetMonthStartDate === '' ? null : adminSetMonthStartDate,
      };

      const { error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', clienteId);

      if (error) {
        console.error('Erro ao configurar metas do cliente:', error);
        toast.error('Erro ao configurar metas do cliente.');
        return false;
      }
      toast.success('Metas do cliente configuradas com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro inesperado ao configurar metas do cliente:', error);
      toast.error('Erro inesperado ao configurar metas do cliente.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const obterHistoricoVip = useCallback(async (clienteId: string): Promise<FullVipHistory | null> => {
    setLoading(true);
    try {
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('historico_vip, admin_set_week_start_date, admin_set_month_start_date, meta_valor_semanal, meta_pedidos_semanal, last_week_reset_date, last_month_reset_date')
        .eq('id', clienteId)
        .single();

      if (clienteError) {
        console.error('Erro ao obter histórico VIP do cliente:', clienteError);
        toast.error('Erro ao obter histórico VIP.');
        return null;
      }

      const rawHistory = (clienteData?.historico_vip as any[]) || [];

      // Process raw history to include start/end dates and derived VIP level
      const processedHistory: ProcessedVipHistoryEntry[] = rawHistory.map(entry => {
        const semanaDate = parseISO(entry.semana);
        // Store in ISO format (yyyy-MM-dd)
        const startDate = format(semanaDate, 'yyyy-MM-dd'); 
        const endDate = format(endOfWeek(semanaDate, { weekStartsOn: 0 }), 'yyyy-MM-dd'); 

        let nivel_vip_display = 'Não VIP';
        if (entry.foi_vip) {
          if (entry.valor_gasto >= 500 || entry.pedidos >= 15) { // Critério para Premium
            nivel_vip_display = 'Premium';
          } else if (entry.valor_gasto >= 100 || entry.pedidos >= 4) { // Critério para VIP
            nivel_vip_display = 'VIP';
          } else {
            nivel_vip_display = 'Regular';
          }
        }

        return {
          startDate, // Now yyyy-MM-dd
          endDate,   // Now yyyy-MM-dd
          foi_vip: entry.foi_vip,
          valor_gasto: entry.valor_gasto,
          pedidos: entry.pedidos,
          nivel_vip_display,
        };
      }).sort((a, b) => parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime()); // Sort by ISO string directly

      // Get current week and month status
      const effectiveWeekStartDateStr = (clienteData?.admin_set_week_start_date === '' ? null : clienteData?.admin_set_week_start_date) || globalVipSettings.default_week_start_date;
      const effectiveMonthStartDateStr = (clienteData?.admin_set_month_start_date === '' ? null : clienteData?.admin_set_month_start_date) || globalVipSettings.default_month_start_date;

      const currentWeekStatus = await calcularStatusVip(clienteId, effectiveWeekStartDateStr, effectiveMonthStartDateStr);
      // For month status, we need to adjust the `calcular_status_vip` function or create a new one if the logic is different.
      // For simplicity, I'll just return the current week status as currentMonthStatus for now,
      // as the `calcular_status_vip` RPC is designed for weekly calculation.
      const currentMonthStatus = currentWeekStatus; // Placeholder for now

      return {
        currentWeekStatus,
        currentMonthStatus,
        historyData: processedHistory,
      };
    } catch (error) {
      console.error('Erro inesperado ao obter histórico VIP:', error);
      toast.error('Erro inesperado ao obter histórico VIP.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [calcularStatusVip, globalVipSettings, getWeekEndDate, getMonthEndDate]);

  return {
    loading,
    globalVipSettings,
    setGlobalVipSettings,
    calcularStatusVip,
    resetarStatusVipSemanal,
    obterRankingSemanal,
    obterRankingMensal,
    configurarMetasCliente,
    obterHistoricoVip,
    getWeekEndDate,
    getMonthEndDate,
  };
}