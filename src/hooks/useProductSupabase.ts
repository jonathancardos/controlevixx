import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Produto, ProdutoInsert, ProdutoUpdate, CategoriaProduto, CategoriaProdutoInsert, CategoriaProdutoUpdate } from '@/types/supabase';

export function useProductSupabase() {
  const [categoriasProdutos, setCategoriasProdutos] = useState<CategoriaProduto[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    console.log('useProductSupabase: Iniciando carregamento de dados...');
    try {
      // Carregar categorias de produtos
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('categorias_produtos')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (categoriasError) {
        console.error('useProductSupabase: Erro ao carregar categorias de produtos:', categoriasError);
        toast.error('Erro ao carregar categorias de produtos');
        return;
      }
      console.log('useProductSupabase: Categorias de produtos carregadas:', categoriasData);

      // Carregar produtos
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos')
        .select(`
          *,
          categorias_produtos (
            id,
            nome
          )
        `)
        .eq('ativo', true)
        .order('nome');

      if (produtosError) {
        console.error('useProductSupabase: Erro ao carregar produtos:', produtosError);
        toast.error('Erro ao carregar produtos');
        return;
      }
      console.log('useProductSupabase: Produtos carregados:', produtosData);

      setCategoriasProdutos(categoriasData || []);
      setProdutos(produtosData || []);
    } catch (error) {
      console.error('useProductSupabase: Erro ao carregar dados de produtos (catch):', error);
      toast.error('Erro ao carregar dados de produtos');
    } finally {
      setLoading(false);
      console.log('useProductSupabase: Carregamento de dados finalizado.');
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const criarCategoriaProduto = async (form: CategoriaProdutoInsert) => {
    if (!form.nome) {
      toast.error('Nome da categoria é obrigatório');
      return false;
    }
    try {
      const { error } = await supabase.from('categorias_produtos').insert(form);
      if (error) throw error;
      toast.success('Categoria de produto criada com sucesso!');
      carregarDados();
      return true;
    } catch (error: any) {
      console.error('useProductSupabase: Erro ao criar categoria de produto (catch):', error);
      toast.error(`Erro ao criar categoria: ${error.message}`);
      return false;
    }
  };

  const atualizarCategoriaProduto = async (id: string, updates: CategoriaProdutoUpdate) => {
    try {
      const { error } = await supabase.from('categorias_produtos').update(updates).eq('id', id);
      if (error) throw error;
      toast.success('Categoria de produto atualizada com sucesso!');
      carregarDados();
      return true;
    } catch (error: any) {
      console.error('useProductSupabase: Erro ao atualizar categoria de produto (catch):', error);
      toast.error(`Erro ao atualizar categoria: ${error.message}`);
      return false;
    }
  };

  const excluirCategoriaProduto = async (id: string) => {
    try {
      const { error } = await supabase.from('categorias_produtos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Categoria de produto excluída com sucesso!');
      carregarDados();
      return true;
    } catch (error: any) {
      console.error('useProductSupabase: Erro ao excluir categoria de produto (catch):', error);
      toast.error(`Erro ao excluir categoria: ${error.message}`);
      return false;
    }
  };

  const criarProduto = async (form: ProdutoInsert) => {
    if (!form.nome || !form.preco || !form.categoria_id) {
      toast.error('Nome, preço e categoria do produto são obrigatórios');
      return false;
    }
    try {
      const { error } = await supabase.from('produtos').insert(form);
      if (error) throw error;
      toast.success('Produto criado com sucesso!');
      carregarDados();
      return true;
    } catch (error: any) {
      console.error('useProductSupabase: Erro ao criar produto (catch):', error);
      toast.error(`Erro ao criar produto: ${error.message}`);
      return false;
    }
  };

  const atualizarProduto = async (id: string, updates: ProdutoUpdate) => {
    try {
      const { error } = await supabase.from('produtos').update(updates).eq('id', id);
      if (error) throw error;
      toast.success('Produto atualizado com sucesso!');
      carregarDados();
      return true;
    } catch (error: any) {
      console.error('useProductSupabase: Erro ao atualizar produto (catch):', error);
      toast.error(`Erro ao atualizar produto: ${error.message}`);
      return false;
    }
  };

  const excluirProduto = async (id: string) => {
    try {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Produto excluído com sucesso!');
      carregarDados();
      return true;
    } catch (error: any) {
      console.error('useProductSupabase: Erro ao excluir produto (catch):', error);
      toast.error(`Erro ao excluir produto: ${error.message}`);
      return false;
    }
  };

  return {
    categoriasProdutos,
    produtos,
    loading,
    carregarDados,
    criarCategoriaProduto,
    atualizarCategoriaProduto,
    excluirCategoriaProduto,
    criarProduto,
    atualizarProduto,
    excluirProduto,
  };
}