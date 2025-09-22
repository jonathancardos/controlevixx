import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Comanda, ComandaInsert, ComandaUpdate, Cliente, ClienteInsert, ClienteUpdate, FiltroComandas } from '@/types/supabase'; // Adicionado ClienteUpdate
import { toast } from 'sonner';
import { format, startOfWeek, startOfMonth } from 'date-fns'; // Importar format, startOfWeek, startOfMonth

export function useComandas() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarComandas = useCallback(async (filtros?: FiltroComandas) => {
    setLoading(true);
    try {
      let query = supabase
        .from('comandas')
        .select('*')
        .order('created_at', { ascending: false });

      if (filtros?.dataInicio) {
        query = query.gte('data', filtros.dataInicio);
      }
      if (filtros?.dataFim) {
        query = query.lte('data', filtros.dataFim);
      }
      if (filtros?.formaPagamento && filtros.formaPagamento !== 'all') {
        query = query.eq('forma_pagamento', filtros.formaPagamento);
      }
      if (filtros?.status && filtros.status !== 'all') {
        query = query.eq('status', filtros.status);
      }
      if (filtros?.clienteNome) {
        query = query.ilike('cliente_nome', `%${filtros.clienteNome}%`);
      }
      if (filtros?.cliente) {
        query = query.eq('cliente_id', filtros.cliente);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar comandas do Supabase:', error);
        toast.error(`Erro ao carregar comandas: ${error.message}`);
        return;
      }

      setComandas((data || []) as Comanda[]);
    } catch (error: any) {
      console.error('Erro inesperado ao carregar comandas:', error);
      toast.error(`Erro inesperado ao carregar comandas: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const salvarComanda = async (comanda: ComandaInsert) => {
    try {
      const { data, error } = await supabase
        .from('comandas')
        .insert([
          {
            ...comanda,
            items: comanda.items as any, // Cast para Json
            status_pagamento: comanda.status_pagamento || 'Pendente',
            status_entrega: comanda.status_entrega || 'Pendente',
            tipo_servico: comanda.tipo_servico || 'local',
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar comanda:', error.message);
        console.error('Detalhes do erro:', error.details);
        console.error('Sugestão do erro:', error.hint);
        toast.error(`Erro ao salvar comanda: ${error.message}`);
        return null;
      }

      toast.success('Comanda salva com sucesso!');
      carregarComandas();
      return data;
    } catch (error) {
      console.error('Erro ao salvar comanda:', error);
      toast.error('Erro ao salvar comanda');
      return null;
    }
  };

  const atualizarComanda = async (id: string, updates: ComandaUpdate) => {
    try {
      const { data, error } = await supabase
        .from('comandas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar comanda:', error);
        toast.error('Erro ao atualizar comanda');
        return null;
      }

      toast.success('Comanda atualizada com sucesso!');
      carregarComandas();
      return data;
    } catch (error) {
      console.error('Erro ao atualizar comanda:', error);
      toast.error('Erro ao atualizar comanda');
      return null;
    }
  };

  const excluirComanda = async (id: string) => {
    try {
      const { error } = await supabase
        .from('comandas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir comanda:', error);
        toast.error('Erro ao excluir comanda');
        return false;
      }

      toast.success('Comanda excluída com sucesso!');
      carregarComandas();
      return true;
    } catch (error) {
      console.error('Erro ao excluir comanda:', error);
      toast.error('Erro ao excluir comanda');
      return false;
    }
  };

  const alterarFormaPagamento = async (id: string, novaForma: 'Pix' | 'Cartão' | 'Dinheiro' | 'Outros') => {
    return await atualizarComanda(id, { forma_pagamento: novaForma });
  };

  const confirmarPagamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from('comandas')
        .update({ status_pagamento: 'Confirmado' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Pagamento confirmado!');
      carregarComandas();
      return true;
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      toast.error('Erro ao confirmar pagamento.');
      return false;
    }
  };

  const marcarEmRota = async (id: string) => {
    try {
      const { error } = await supabase
        .from('comandas')
        .update({ status_entrega: 'Em Rota' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Comanda marcada como "Em Rota"!');
      carregarComandas();
      return true;
    } catch (error) {
      console.error('Erro ao marcar como em rota:', error);
      toast.error('Erro ao marcar como em rota.');
      return false;
    }
  };

  const finalizarComanda = async (id: string) => {
    try {
      const { error } = await supabase
        .from('comandas')
        .update({ status: 'Processada', status_entrega: 'Entregue' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Comanda finalizada com sucesso!');
      carregarComandas();
      return true;
    } catch (error) {
      console.error('Erro ao finalizar comanda:', error);
      toast.error('Erro ao finalizar comanda.');
      return false;
    }
  };

  useEffect(() => {
    carregarComandas();
  }, [carregarComandas]);

  return {
    comandas,
    loading,
    carregarComandas,
    salvarComanda,
    atualizarComanda,
    excluirComanda,
    alterarFormaPagamento,
    confirmarPagamento,
    marcarEmRota,
    finalizarComanda,
  };
}

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarClientes = useCallback(async () => { // Adicionado useCallback
    setLoading(true);
    console.log('useClientes: Iniciando carregamento de clientes...');
    try {
      const { data, error } = await supabase
        .from('clientes') // Certifique-se de que está consultando a tabela correta 'clientes'
        .select(`
          *,
          total_gasto_semana,
          total_pedidos_semana,
          total_gasto_mes,
          total_pedidos_mes,
          is_vip,
          vip_combo_available,
          last_week_reset_date,
          last_month_reset_date,
          admin_set_week_start_date,
          admin_set_month_start_date,
          meta_valor_semanal,
          meta_pedidos_semanal,
          nivel_vip,
          historico_vip
        `) // Simplificado para apenas selecionar todas as colunas
        .order('total_gasto', { ascending: false });

      if (error) {
        console.error('useClientes: Erro ao carregar clientes:', error); // Log the full error object
        toast.error(`Erro ao carregar clientes: ${error.message}`);
        setClientes([]); // Garante que o estado seja limpo em caso de erro
        return;
      }

      console.log('useClientes: Clientes carregados do Supabase:', data);
      setClientes((data || []) as Cliente[]);
    } catch (error: any) { // Captura erros gerais também
      console.error('useClientes: Erro inesperado ao carregar clientes (catch):', error); // Log the full error object
      toast.error(`Erro inesperado ao carregar clientes: ${error.message || 'Erro desconhecido'}`);
      setClientes([]); // Garante que o estado seja limpo em caso de erro
    } finally {
      setLoading(false);
      console.log('useClientes: Finalizando carregamento de clientes.');
    }
  }, []); // Dependências vazias para que a função seja estável e não cause loops infinitos no useEffect

  const criarCliente = async (cliente: ClienteInsert): Promise<Cliente | null> => {
    try {
      // Verificar se já existe um cliente com o mesmo nome
      const { data: existingClient, error: checkError } = await supabase
        .from('clientes')
        .select('id')
        .eq('nome', cliente.nome)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 significa "nenhuma linha encontrada"
        console.error('Erro ao verificar cliente existente:', checkError);
        toast.error(`Erro ao verificar cliente: ${checkError.message}`);
        return null;
      }

      if (existingClient) {
        toast.error(`Já existe um cliente com o nome "${cliente.nome}".`);
        return null;
      }

      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nome: cliente.nome,
          telefone: cliente.telefone,
          // Definir valores padrão para as novas colunas VIP
          total_gasto_semana: 0,
          total_pedidos_semana: 0,
          total_gasto_mes: 0,
          total_pedidos_mes: 0,
          is_vip: false,
          vip_combo_available: false,
          last_week_reset_date: format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd'), // Domingo como início da semana
          last_month_reset_date: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
          meta_valor_semanal: 100,
          meta_pedidos_semanal: 4,
          nivel_vip: 'Novo',
          historico_vip: [],
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar cliente:', error);
        toast.error(`Erro ao criar cliente: ${error.message}`);
        return null;
      }

      toast.success('Cliente criado com sucesso!');
      carregarClientes(); // Recarregar a lista de clientes
      return data;
    } catch (error: any) {
      console.error('Erro ao criar cliente (catch):', error);
      toast.error(`Erro ao criar cliente: ${error.message || 'Erro desconhecido'}`);
      return null;
    }
  };

  const atualizarCliente = async (id: string, updates: ClienteUpdate): Promise<Cliente | null> => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar cliente:', error);
        toast.error(`Erro ao atualizar cliente: ${error.message}`);
        return null;
      }

      toast.success('Cliente atualizado com sucesso!');
      carregarClientes(); // Recarregar a lista de clientes
      return data;
    } catch (error: any) {
      console.error('Erro ao atualizar cliente (catch):', error);
      toast.error(`Erro ao atualizar cliente: ${error.message || 'Erro desconhecido'}`);
      return null;
    }
  };

  // Nova função para marcar o combo VIP como usado
  const marcarComboVIPUsado = async (clienteId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ vip_combo_available: false, combo_vip_usado_semana: true })
        .eq('id', clienteId);

      if (error) throw error;
      toast.success('Combo VIP marcado como usado!');
      carregarClientes();
      return true;
    } catch (error: any) {
      console.error('Erro ao marcar combo VIP como usado:', error);
      toast.error(`Erro ao marcar combo VIP como usado: ${error.message || 'Erro desconhecido'}`);
      return false;
    }
  };

  // Nova função para atualizar as datas de início de cálculo para TODOS os clientes
  const atualizarDatasGlobaisClientes = async (weekStartDate: string | null, monthStartDate: string | null): Promise<boolean> => {
    console.log('atualizarDatasGlobaisClientes: Chamado com raw weekStartDate:', weekStartDate, 'raw monthStartDate:', monthStartDate);
    console.log('atualizarDatasGlobaisClientes: Lembre-se que para esta atualização global funcionar, a política de RLS de UPDATE na tabela "clientes" deve permitir que o usuário autenticado atualize TODAS as linhas (ex: USING (true)).');
    try {
      const cleanedWeekStartDate = weekStartDate === '' ? null : weekStartDate;
      const cleanedMonthStartDate = monthStartDate === '' ? null : monthStartDate;

      const updates: Partial<ClienteUpdate> = {
        admin_set_week_start_date: cleanedWeekStartDate,
        admin_set_month_start_date: cleanedMonthStartDate,
      };
      console.log('atualizarDatasGlobaisClientes: Updates a serem enviados (cleaned):', updates);

      const { data, error } = await supabase
        .from('clientes')
        .update(updates)
        .neq('id', '00000000-0000-0000-0000-000000000000') // Adiciona uma condição que é sempre verdadeira para atualizar todas as linhas
        .select(); // Adicionado .select() para obter o retorno da operação

      if (error) {
        console.error('atualizarDatasGlobaisClientes: Erro ao atualizar datas globais dos clientes:', error);
        toast.error(`Erro ao atualizar datas globais: ${error.message}`);
        return false;
      }
      console.log('atualizarDatasGlobaisClientes: Datas atualizadas com sucesso no Supabase. Data retornada:', data); // Log do retorno
      toast.success('Datas de início de cálculo atualizadas para todos os clientes!');
      carregarClientes(); // Recarregar a lista de clientes
      return true;
    } catch (error: any) {
      console.error('atualizarDatasGlobaisClientes: Erro inesperado ao atualizar datas globais dos clientes:', error);
      toast.error(`Erro ao atualizar datas globais: ${error.message || 'Erro desconhecido'}`);
      return false;
    }
  };

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]); // Adicionado carregarClientes como dependência

  return {
    clientes,
    loading,
    carregarClientes,
    criarCliente,
    atualizarCliente,
    marcarComboVIPUsado, // Adicionado
    atualizarDatasGlobaisClientes, // Adicionado
  };
}

export function useRelatorios() {
  const [loading, setLoading] = useState(false);

  const obterRelatorioVendas = async (filtros?: FiltroComandas) => {
    setLoading(true);
    try {
      let query = supabase
        .from('comandas')
        .select('*')
        .eq('status', 'Processada');

      if (filtros?.dataInicio) {
        query = query.gte('data', filtros.dataInicio);
      }
      if (filtros?.dataFim) {
        query = query.lte('data', filtros.dataFim);
      }
      if (filtros?.formaPagamento && filtros.formaPagamento !== 'all') {
        query = query.eq('forma_pagamento', filtros.formaPagamento);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao obter relatório:', error);
        return null;
      }

      const comandas = data || [];
      const totalVendas = comandas.reduce((sum, c) => sum + c.valor, 0);
      const totalComandas = comandas.length;
      const ticketMedio = totalComandas > 0 ? totalVendas / totalComandas : 0;

      const vendasPorFormaPagamento = comandas.reduce((acc, c) => {
        acc[c.forma_pagamento] = (acc[c.forma_pagamento] || 0) + c.valor;
        return acc;
      }, {} as Record<string, number>);

      const vendasPorDia = comandas.reduce((acc, c) => {
        acc[c.data] = (acc[c.data] || 0) + c.valor;
        return acc;
      }, {} as Record<string, number>);

      return {
        comandas,
        totalVendas,
        totalComandas,
        ticketMedio,
        vendasPorFormaPagamento,
        vendasPorDia
      };
    } catch (error) {
      console.error('Erro ao obter relatório:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    obterRelatorioVendas
  };
}