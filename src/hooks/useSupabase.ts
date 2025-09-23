const atualizarComanda = async (id: string, updates: ComandaUpdate) => {
  try {
    const { data, error } = await supabase
      .from('comandas')
      .update({
        ...updates,
        items: updates.items ? JSON.stringify(updates.items) : null, // Cast to Json
      })
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