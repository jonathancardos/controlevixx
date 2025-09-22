import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PagamentoDiario, PagamentoDiarioInsert, QuinzenaPagamento, QuinzenaPagamentoInsert, Usuario } from '@/types/supabase';

export function useFinancialSupabase() {
  const [pagamentosDiarios, setPagamentosDiarios] = useState<PagamentoDiario[]>([]);
  const [quinzenasPagamento, setQuinzenasPagamento] = useState<QuinzenaPagamento[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarPagamentosDiarios = useCallback(async (usuarioId: string, dataInicio?: string, dataFim?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('pagamentos_diarios')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('data_pagamento', { ascending: false });

      if (dataInicio) {
        query = query.gte('data_pagamento', dataInicio);
      }
      if (dataFim) {
        query = query.lte('data_pagamento', dataFim);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar pagamentos diários:', error);
        toast.error('Erro ao carregar pagamentos diários');
        return [];
      }
      setPagamentosDiarios(data || []);
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar pagamentos diários:', error);
      toast.error('Erro ao carregar pagamentos diários');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarQuinzenasPagamento = useCallback(async (usuarioId: string, statusFilter?: 'agendada' | 'paga') => {
    setLoading(true);
    try {
      let query = supabase
        .from('quinzenas_pagamento')
        .select('*, valor_meta')
        .eq('usuario_id', usuarioId)
        .order('data_fim', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar quinzenas de pagamento:', error);
        toast.error('Erro ao carregar quinzenas de pagamento');
        return [];
      }
      console.log('Dados de quinzenas carregados do Supabase:', data);
      setQuinzenasPagamento(data || []);
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar quinzenas de pagamento:', error);
      toast.error('Erro ao carregar quinzenas de pagamento');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const criarPagamentoDiario = async (pagamento: PagamentoDiarioInsert) => {
    try {
      const { error } = await supabase
        .from('pagamentos_diarios')
        .insert({ ...pagamento, status: 'pendente', tipo: 'diaria' });

      if (error) {
        console.error('Erro ao criar pagamento diário:', error);
        toast.error(`Erro ao criar pagamento diário: ${error.message}`);
        return false;
      }
      toast.success('Pagamento diário registrado com sucesso!');
      carregarPagamentosDiarios(pagamento.usuario_id);
      return true;
    } catch (error: any) {
      console.error('Erro ao criar pagamento diário (catch):', error);
      toast.error(`Erro ao criar pagamento diário: ${error.message || 'Erro desconhecido'}`);
      return false;
    }
  };

  const criarQuinzenaPagamento = async (quinzena: QuinzenaPagamentoInsert) => {
    console.log('Objeto quinzena sendo inserido (FINAL):', quinzena);
    try {
      const { error } = await supabase
        .from('quinzenas_pagamento')
        .insert({ ...quinzena, status: 'agendada' });

      if (error) {
        console.error('Erro ao criar quinzena de pagamento:', error);
        toast.error(`Erro ao criar quinzena de pagamento: ${error.message}`);
        return false;
      }
      toast.success('Quinzena de pagamento registrada com sucesso!');
      carregarQuinzenasPagamento(quinzena.usuario_id);
      return true;
    } catch (error: any) {
      console.error('Erro ao criar quinzena de pagamento (catch):', error);
      toast.error(`Erro ao criar quinzena de pagamento: ${error.message || 'Erro desconhecido'}`);
      return false;
    }
  };

  const criarDeducao = async (usuarioId: string, valor: number, tipo: 'deducao_falta' | 'deducao_atraso' | 'deducao_outros', data: string, observacao?: string) => {
    try {
      const { error } = await supabase
        .from('pagamentos_diarios')
        .insert({
          usuario_id: usuarioId,
          valor: -Math.abs(valor),
          data_pagamento: data,
          tipo: tipo,
          status: 'pendente',
          observacoes: observacao
        });

      if (error) {
        console.error('Erro ao criar dedução:', error);
        toast.error(`Erro ao criar dedução: ${error.message}`);
        return false;
      }
      toast.success('Dedução registrada com sucesso!');
      carregarPagamentosDiarios(usuarioId);
      return true;
    } catch (error: any) {
      console.error('Erro ao criar dedução (catch):', error);
      toast.error(`Erro ao criar dedução: ${error.message || 'Erro desconhecido'}`);
      return false;
    }
  };

  const marcarPagamentoComoPago = async (id: string, usuarioId: string) => {
    try {
      const { error } = await supabase
        .from('pagamentos_diarios')
        .update({ status: 'pago' })
        .eq('id', id);

      if (error) {
        console.error('Erro ao marcar pagamento como pago:', error);
        toast.error('Erro ao marcar pagamento como pago');
        return false;
      }
      toast.success('Pagamento marcado como pago!');
      carregarPagamentosDiarios(usuarioId);
      return true;
    } catch (error) {
      console.error('Erro ao marcar pagamento como pago:', error);
      toast.error('Erro ao marcar pagamento como pago');
      return false;
    }
  };

  const atualizarStatusQuinzena = async (id: string, usuarioId: string, novoStatus: 'agendada' | 'paga') => {
    try {
      const { error } = await supabase
        .from('quinzenas_pagamento')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) {
        console.error(`Erro ao atualizar status da quinzena para ${novoStatus}:`, error);
        toast.error(`Erro ao atualizar status da quinzena para ${novoStatus}`);
        return false;
      }
      toast.success(`Quinzena marcada como ${novoStatus === 'paga' ? 'paga' : 'agendada'}!`);
      carregarQuinzenasPagamento(usuarioId); // Recarregar todas as quinzenas
      return true;
    } catch (error) {
      console.error(`Erro ao atualizar status da quinzena para ${novoStatus}:`, error);
      toast.error(`Erro ao atualizar status da quinzena para ${novoStatus}`);
      return false;
    }
  };

  const arquivarQuinzena = async (id: string, usuarioId: string) => {
    try {
      const { error } = await supabase
        .from('quinzenas_pagamento')
        .update({ status: 'paga' }) // Marcar como paga ao arquivar
        .eq('id', id);

      if (error) {
        console.error('Erro ao arquivar quinzena:', error);
        toast.error('Erro ao arquivar quinzena');
        return false;
      }
      toast.success('Quinzena arquivada com sucesso!');
      carregarQuinzenasPagamento(usuarioId); // Recarregar todas as quinzenas
      return true;
    } catch (error) {
      console.error('Erro ao arquivar quinzena:', error);
      toast.error('Erro ao arquivar quinzena');
      return false;
    }
  };

  const excluirPagamentoDiario = async (id: string, usuarioId: string) => {
    try {
      const { error } = await supabase
        .from('pagamentos_diarios')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir pagamento diário:', error);
        toast.error('Erro ao excluir pagamento diário');
        return false;
      }
      toast.success('Pagamento diário excluído com sucesso!');
      carregarPagamentosDiarios(usuarioId);
      return true;
    } catch (error) {
      console.error('Erro ao excluir pagamento diário:', error);
      toast.error('Erro ao excluir pagamento diário');
      return false;
    }
  };

  const excluirQuinzenaPagamento = async (id: string, usuarioId: string) => {
    try {
      const { error } = await supabase
        .from('quinzenas_pagamento')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir quinzena de pagamento:', error);
        toast.error('Erro ao excluir quinzena de pagamento');
        return false;
      }
      toast.success('Quinzena de pagamento excluída com sucesso!');
      carregarQuinzenasPagamento(usuarioId);
      return true;
    } catch (error) {
      console.error('Erro ao excluir quinzena de pagamento:', error);
      toast.error('Erro ao excluir quinzena de pagamento');
      return false;
    }
  };

  return {
    pagamentosDiarios,
    setPagamentosDiarios,
    quinzenasPagamento,
    setQuinzenasPagamento,
    loading,
    carregarPagamentosDiarios,
    carregarQuinzenasPagamento,
    criarPagamentoDiario,
    criarQuinzenaPagamento,
    criarDeducao,
    marcarPagamentoComoPago,
    atualizarStatusQuinzena,
    arquivarQuinzena, // Adicionado
    excluirPagamentoDiario,
    excluirQuinzenaPagamento,
  };
}