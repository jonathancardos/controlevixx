import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ComandaTemplate, ComandaTemplateInsert, ComandaTemplateUpdate } from '@/types/supabase';

export function useComandaTemplates() {
  const [templates, setTemplates] = useState<ComandaTemplate[]>([]);
  const [activeDailyTemplate, setActiveDailyTemplate] = useState<ComandaTemplate | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTemplates = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comanda_templates')
        .select('*')
        .eq('user_id', userId)
        .order('template_name', { ascending: true });

      if (error) throw error;

      setTemplates(data || []);
      const active = data?.find(t => t.is_active_daily) || null;
      setActiveDailyTemplate(active);
    } catch (error: any) {
      console.error('Erro ao carregar modelos de comanda:', error);
      toast.error(`Erro ao carregar modelos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTemplate = async (userId: string, templateName: string, templateContent: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('comanda_templates')
        .insert({
          user_id: userId,
          template_name: templateName,
          template_content: templateContent,
          is_active_daily: false, // Novo template não é ativo por padrão
        });

      if (error) throw error;

      toast.success(`Modelo "${templateName}" criado com sucesso!`);
      await loadTemplates(userId);
      return true;
    } catch (error: any) {
      console.error('Erro ao criar modelo de comanda:', error);
      toast.error(`Erro ao criar modelo: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateTemplate = async (templateId: string, userId: string, updates: ComandaTemplateUpdate): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('comanda_templates')
        .update(updates)
        .eq('id', templateId)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Modelo atualizado com sucesso!');
      await loadTemplates(userId);
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar modelo de comanda:', error);
      toast.error(`Erro ao atualizar modelo: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string, userId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('comanda_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Modelo excluído com sucesso!');
      await loadTemplates(userId);
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir modelo de comanda:', error);
      toast.error(`Erro ao excluir modelo: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const setComandaDailyTemplate = async (userId: string, templateId: string | null): Promise<boolean> => {
    setLoading(true);
    try {
      // Desativar todos os modelos diários existentes para este usuário
      await supabase
        .from('comanda_templates')
        .update({ is_active_daily: false })
        .eq('user_id', userId)
        .eq('is_active_daily', true);

      if (templateId) {
        // Ativar o modelo selecionado
        const { error } = await supabase
          .from('comanda_templates')
          .update({ is_active_daily: true })
          .eq('id', templateId)
          .eq('user_id', userId);

        if (error) throw error;
        toast.success('Modelo diário ativo definido!');
      } else {
        toast.info('Nenhum modelo diário ativo selecionado.');
      }
      
      await loadTemplates(userId);
      return true;
    } catch (error: any) {
      console.error('Erro ao definir modelo diário ativo:', error);
      toast.error(`Erro ao definir modelo diário ativo: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    templates,
    activeDailyTemplate,
    loading,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setComandaDailyTemplate,
  };
}