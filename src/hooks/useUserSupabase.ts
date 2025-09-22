import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Usuario {
  id: string;
  nome_usuario: string;
  role: 'master' | 'admin' | 'gestor' | 'funcionario';
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface NovoUsuarioForm {
  nome_usuario: string;
  senha: string;
  role: 'master' | 'admin' | 'gestor' | 'funcionario';
}

export function useUserSupabase() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        // .eq('ativo', true) // Removido temporariamente para diagnóstico
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar usuários:', error); // Log detalhado do erro
        toast.error(`Erro ao carregar usuários: ${error.message}`); // Mensagem de erro mais específica
        return;
      }

      setUsuarios((data || []) as Usuario[]);
    } catch (error: any) { // Captura erros gerais também
      console.error('Erro ao carregar usuários (catch):', error);
      toast.error(`Erro ao carregar usuários: ${error.message || 'Erro desconhecido'}`);
      return;
    } finally {
      setLoading(false);
    }
  };

  const criarUsuario = async (form: NovoUsuarioForm) => {
    if (!form.nome_usuario || !form.senha) {
      toast.error('Preencha todos os campos obrigatórios');
      return false;
    }

    try {
      // Verificar se o usuário já existe
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id')
        .eq('nome_usuario', form.nome_usuario)
        .single();

      if (existingUser) {
        toast.error('Este nome de usuário já existe');
        return false;
      }

      const { error } = await supabase
        .from('usuarios')
        .insert({
          nome_usuario: form.nome_usuario,
          senha: form.senha,
          role: form.role
        });

      if (error) {
        console.error('Erro ao criar usuário:', error);
        toast.error('Erro ao criar usuário');
        return false;
      }

      toast.success('Usuário criado com sucesso!');
      await carregarUsuarios();
      return true;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast.error('Erro ao criar usuário');
      return false;
    }
  };

  const atualizarUsuario = async (id: string, updates: Partial<Usuario>) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar usuário:', error);
        toast.error('Erro ao atualizar usuário');
        return false;
      }

      toast.success('Usuário atualizado com sucesso!');
      await carregarUsuarios();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
      return false;
    }
  };

  const toggleUsuarioAtivo = async (id: string, ativo: boolean) => {
    return await atualizarUsuario(id, { ativo });
  };

  const excluirUsuario = async (id: string) => {
    try {
      // Primeiro verificar se não é um usuário master
      const usuario = usuarios.find(u => u.id === id);
      if (usuario?.role === 'master') {
        toast.error('Não é possível excluir o usuário master');
        return false;
      }

      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir usuário:', error);
        toast.error('Erro ao excluir usuário');
        return false;
      }

      toast.success('Usuário excluído com sucesso!');
      await carregarUsuarios();
      return true;
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
      return false;
    }
  };

  return {
    usuarios,
    loading,
    carregarUsuarios,
    criarUsuario,
    atualizarUsuario,
    toggleUsuarioAtivo,
    excluirUsuario
  };
}