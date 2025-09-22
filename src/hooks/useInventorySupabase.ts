import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PedidoInsumo, ItemPedidoInsumo } from '@/types/supabase'; // Importar tipos

interface Categoria {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface Insumo {
  id: string;
  nome: string;
  categoria_id: string;
  descricao: string;
  unidade_medida: string;
  preco_unitario: number;
  estoque_minimo: number;
  estoque_atual: number;
  fornecedor: string;
  codigo_interno: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  categorias_insumos?: Categoria;
}

interface NovoInsumoForm {
  nome: string;
  categoria_id: string;
  descricao: string;
  unidade_medida: string;
  preco_unitario: number;
  estoque_minimo: number;
  estoque_atual: number;
  fornecedor: string;
  codigo_interno: string;
}

interface NovaCategoriaForm {
  nome: string;
  descricao: string;
}

export function useInventorySupabase() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    console.log('useInventorySupabase: Iniciando carregamento de dados...');
    try {
      // Carregar categorias
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('categorias_insumos')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (categoriasError) {
        console.error('useInventorySupabase: Erro ao carregar categorias:', categoriasError);
        toast.error('Erro ao carregar categorias');
        return;
      }
      console.log('useInventorySupabase: Categorias carregadas:', categoriasData);

      // Carregar insumos
      const { data: insumosData, error: insumosError } = await supabase
        .from('insumos')
        .select(`
          *,
          categorias_insumos (
            id,
            nome,
            descricao,
            ativo
          )
        `)
        .eq('ativo', true)
        .order('nome');

      if (insumosError) {
        console.error('useInventorySupabase: Erro ao carregar insumos:', insumosError);
        toast.error('Erro ao carregar insumos');
        return;
      }
      console.log('useInventorySupabase: Insumos carregados:', insumosData);

      setCategorias(categoriasData || []);
      setInsumos((insumosData || []) as Insumo[]);
    } catch (error) {
      console.error('useInventorySupabase: Erro ao carregar dados (catch):', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
      console.log('useInventorySupabase: Carregamento de dados finalizado.');
    }
  }, []); // Dependências vazias, pois não depende de props ou estados externos que mudam

  useEffect(() => {
    carregarDados();
  }, [carregarDados]); // Agora carregarDados é uma dependência estável

  const carregarPedidosPorUsuario = useCallback(async (usuarioId: string): Promise<PedidoInsumo[]> => {
    setLoading(true);
    console.log(`useInventorySupabase: Carregando pedidos para o usuário ${usuarioId}...`);
    try {
      const { data, error } = await supabase
        .from('pedidos_insumos')
        .select(`
          *,
          usuarios (
            nome_usuario
          ),
          itens_pedido_insumos (
            id,
            nome_insumo,
            categoria,
            quantidade,
            unidade_medida,
            preco_unitario_estimado,
            observacoes
          )
        `)
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('useInventorySupabase: Erro ao carregar pedidos do usuário:', error);
        toast.error('Erro ao carregar seus pedidos');
        return [];
      }
      console.log(`useInventorySupabase: Pedidos do usuário ${usuarioId} carregados:`, data);

      return data?.map(p => ({
        ...p,
        status: p.status as 'Pendente' | 'Em Análise' | 'Aprovado' | 'Rejeitado' | 'Finalizado',
        prioridade: p.prioridade as 'Baixa' | 'Normal' | 'Alta' | 'Urgente',
        itens: p.itens_pedido_insumos as ItemPedidoInsumo[]
      })) || [];
    } catch (error) {
      console.error('useInventorySupabase: Erro ao carregar pedidos do usuário (catch):', error);
      toast.error('Erro ao carregar seus pedidos');
      return [];
    } finally {
      setLoading(false);
      console.log(`useInventorySupabase: Carregamento de pedidos para o usuário ${usuarioId} finalizado.`);
    }
  }, []); // Dependências vazias, pois não depende de props ou estados externos que mudam

  const criarCategoria = async (form: NovaCategoriaForm) => {
    if (!form.nome) {
      toast.error('Nome da categoria é obrigatório');
      return false;
    }

    try {
      const { error } = await supabase
        .from('categorias_insumos')
        .insert({
          nome: form.nome,
          descricao: form.descricao
        });

      if (error) {
        console.error('useInventorySupabase: Erro ao criar categoria:', error);
        toast.error('Erro ao criar categoria');
        return false;
      }

      toast.success('Categoria criada com sucesso!');
      await carregarDados();
      return true;
    } catch (error) {
      console.error('useInventorySupabase: Erro ao criar categoria (catch):', error);
      toast.error('Erro ao criar categoria');
      return false;
    }
  };

  const criarInsumo = async (form: NovoInsumoForm) => {
    if (!form.nome || !form.categoria_id) {
      toast.error('Nome e categoria são obrigatórios');
      return false;
    }

    try {
      const { error } = await supabase
        .from('insumos')
        .insert(form);

      if (error) {
        console.error('useInventorySupabase: Erro ao criar insumo:', error);
        toast.error('Erro ao criar insumo');
        return false;
      }

      toast.success('Insumo criado com sucesso!');
      await carregarDados();
      return true;
    } catch (error) {
      console.error('useInventorySupabase: Erro ao criar insumo (catch):', error);
      toast.error('Erro ao criar insumo');
      return false;
    }
  };

  const atualizarInsumo = async (id: string, updates: Partial<NovoInsumoForm>) => {
    try {
      const { error } = await supabase
        .from('insumos')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('useInventorySupabase: Erro ao atualizar insumo:', error);
        toast.error('Erro ao atualizar insumo');
        return false;
      }

      toast.success('Insumo atualizado com sucesso!');
      await carregarDados();
      return true;
    } catch (error) {
      console.error('useInventorySupabase: Erro ao atualizar insumo (catch):', error);
      toast.error('Erro ao atualizar insumo');
      return false;
    }
  };

  const excluirInsumo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('insumos')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        console.error('useInventorySupabase: Erro ao excluir insumo:', error);
        toast.error('Erro ao excluir insumo');
        return false;
      }

      toast.success('Insumo excluído com sucesso!');
      await carregarDados();
      return true;
    } catch (error) {
      console.error('useInventorySupabase: Erro ao excluir insumo (catch):', error);
      toast.error('Erro ao excluir insumo');
      return false;
    }
  };

  return {
    categorias,
    insumos,
    loading,
    carregarDados,
    criarCategoria,
    criarInsumo,
    atualizarInsumo,
    excluirInsumo,
    carregarPedidosPorUsuario
  };
}