import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PedidoInsumo, ItemPedidoInsumo } from '@/types/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, DollarSign, Package } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EditPedidoInsumoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: PedidoInsumo | null;
  onSave: (id: string, updates: Partial<PedidoInsumo>) => void;
  loading?: boolean;
}

export function EditPedidoInsumoSheet({ 
  open, 
  onOpenChange, 
  pedido, 
  onSave, 
  loading = false 
}: EditPedidoInsumoSheetProps) {
  const [form, setForm] = useState<Partial<PedidoInsumo>>({});
  const [itensEditados, setItensEditados] = useState<ItemPedidoInsumo[]>([]);
  const [novoItemForm, setNovoItemForm] = useState({
    nome_insumo: '',
    quantidade: 1,
    unidade_medida: 'UN',
    preco_unitario_estimado: 0,
    categoria: '',
    observacoes: ''
  });

  useEffect(() => {
    if (pedido) {
      setForm({
        titulo: pedido.titulo,
        descricao: pedido.descricao || '',
        prioridade: pedido.prioridade,
        data_necessidade: pedido.data_necessidade,
        observacoes_admin: pedido.observacoes_admin || '',
        total_estimado: pedido.total_estimado,
        status: pedido.status,
        link_publico_compra: pedido.link_publico_compra || ''
      });
      setItensEditados(pedido.itens || []);
    }
  }, [pedido]);

  const updateForm = (field: keyof PedidoInsumo, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddItem = () => {
    if (!novoItemForm.nome_insumo || !novoItemForm.quantidade || !novoItemForm.unidade_medida) {
      toast.error('Preencha nome, quantidade e unidade do novo item.');
      return;
    }

    const newItem: ItemPedidoInsumo = {
      id: Math.random().toString(36).substring(2, 11), // Gerar um ID temporário
      pedido_id: pedido?.id || '', // Será atualizado ao salvar
      nome_insumo: novoItemForm.nome_insumo,
      quantidade: novoItemForm.quantidade,
      unidade_medida: novoItemForm.unidade_medida,
      preco_unitario_estimado: novoItemForm.preco_unitario_estimado,
      categoria: novoItemForm.categoria || 'Outros',
      observacoes: novoItemForm.observacoes || '',
      created_at: new Date().toISOString(),
      insumo_id: null // Pode ser nulo para itens novos
    };

    setItensEditados(prev => [...prev, newItem]);
    setNovoItemForm({
      nome_insumo: '',
      quantidade: 1,
      unidade_medida: 'UN',
      preco_unitario_estimado: 0,
      categoria: '',
      observacoes: ''
    });
    toast.success('Item adicionado à lista.');
  };

  const handleRemoveItem = (itemId: string) => {
    setItensEditados(prev => prev.filter(item => item.id !== itemId));
    toast.success('Item removido da lista.');
  };

  const handleSave = async () => {
    if (!pedido?.id) return;

    const totalEstimadoCalculado = itensEditados.reduce((sum, item) => sum + ((item.preco_unitario_estimado || 0) * item.quantidade), 0);

    const updates: Partial<PedidoInsumo> = {
      ...form,
      total_estimado: totalEstimadoCalculado,
    };

    try {
      // Atualizar o pedido principal
      await onSave(pedido.id, updates);

      // Sincronizar itens: deletar os removidos, adicionar os novos, atualizar os existentes
      const existingItemIds = new Set(pedido.itens?.map(item => item.id));
      const currentItemIds = new Set(itensEditados.map(item => item.id));

      // Deletar itens removidos
      for (const oldItem of (pedido.itens || [])) {
        if (!currentItemIds.has(oldItem.id)) {
          await supabase.from('itens_pedido_insumos').delete().eq('id', oldItem.id);
        }
      }

      // Adicionar ou atualizar itens
      for (const newItem of itensEditados) {
        if (!existingItemIds.has(newItem.id)) {
          // Adicionar novo item
          await supabase.from('itens_pedido_insumos').insert({
            ...newItem,
            pedido_id: pedido.id,
            id: undefined // Supabase irá gerar um novo ID
          });
        } else {
          // Atualizar item existente
          await supabase.from('itens_pedido_insumos').update({
            nome_insumo: newItem.nome_insumo,
            quantidade: newItem.quantidade,
            unidade_medida: newItem.unidade_medida,
            preco_unitario_estimado: newItem.preco_unitario_estimado,
            categoria: newItem.categoria,
            observacoes: newItem.observacoes,
            insumo_id: newItem.insumo_id
          }).eq('id', newItem.id);
        }
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar pedido e itens:', error);
      toast.error('Erro ao salvar pedido e itens.');
    }
  };

  if (!pedido) return null;

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'Baixa': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Normal': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Alta': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'Urgente': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Em Análise': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Aprovado': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Rejeitado': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Finalizado': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const totalEstimadoAtual = itensEditados.reduce((sum, item) => sum + ((item.preco_unitario_estimado || 0) * item.quantidade), 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Pedido de Insumos</SheetTitle>
          <SheetDescription>
            Ajuste os detalhes e itens do pedido #{pedido.id.substring(0, 8)}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Informações do Pedido */}
          <div className="space-y-2">
            <Label htmlFor="titulo">Título do Pedido</Label>
            <Input
              id="titulo"
              value={form.titulo || ''}
              onChange={(e) => updateForm('titulo', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={form.descricao || ''}
              onChange={(e) => updateForm('descricao', e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select
                value={form.prioridade || 'Normal'}
                onValueChange={(value: 'Baixa' | 'Normal' | 'Alta' | 'Urgente') => updateForm('prioridade', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_necessidade">Data de Necessidade</Label>
              <Input
                id="data_necessidade"
                type="date"
                value={form.data_necessidade || ''}
                onChange={(e) => updateForm('data_necessidade', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.status || 'Pendente'}
              onValueChange={(value: 'Pendente' | 'Em Análise' | 'Aprovado' | 'Rejeitado' | 'Finalizado') => updateForm('status', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Em Análise">Em Análise</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                <SelectItem value="Finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes_admin">Observações do Administrador</Label>
            <Textarea
              id="observacoes_admin"
              value={form.observacoes_admin || ''}
              onChange={(e) => updateForm('observacoes_admin', e.target.value)}
              rows={2}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link_publico_compra">Link Público de Compra</Label>
            <Input
              id="link_publico_compra"
              value={form.link_publico_compra || ''}
              onChange={(e) => updateForm('link_publico_compra', e.target.value)}
              placeholder="https://exemplo.com/carrinho-compras"
              disabled={loading}
            />
          </div>

          {/* Itens do Pedido */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Itens do Pedido
            </h3>
            <div className="space-y-3">
              {itensEditados.map((item, index) => (
                <div key={item.id || index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <Label className="text-xs">Nome do Insumo</Label>
                      <Input
                        value={item.nome_insumo}
                        onChange={(e) => {
                          const newItens = [...itensEditados];
                          newItens[index].nome_insumo = e.target.value;
                          setItensEditados(newItens);
                        }}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => {
                          const newItens = [...itensEditados];
                          newItens[index].quantidade = parseInt(e.target.value) || 1;
                          setItensEditados(newItens);
                        }}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Unidade</Label>
                      <Select
                        value={item.unidade_medida}
                        onValueChange={(value) => {
                          const newItens = [...itensEditados];
                          newItens[index].unidade_medida = value;
                          setItensEditados(newItens);
                        }}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UN">Unidade</SelectItem>
                          <SelectItem value="KG">Quilograma</SelectItem>
                          <SelectItem value="G">Grama</SelectItem>
                          <SelectItem value="L">Litro</SelectItem>
                          <SelectItem value="ML">Mililitro</SelectItem>
                          <SelectItem value="PCT">Pacote</SelectItem>
                          <SelectItem value="CX">Caixa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Preço Unitário Estimado (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.preco_unitario_estimado || 0}
                        onChange={(e) => {
                          const newItens = [...itensEditados];
                          newItens[index].preco_unitario_estimado = parseFloat(e.target.value) || 0;
                          setItensEditados(newItens);
                        }}
                        disabled={loading}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Observações do Item</Label>
                      <Textarea
                        value={item.observacoes || ''}
                        onChange={(e) => {
                          const newItens = [...itensEditados];
                          newItens[index].observacoes = e.target.value;
                          setItensEditados(newItens);
                        }}
                        rows={1}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(item.id || '')}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}

              {/* Adicionar Novo Item */}
              <div className="p-4 border rounded-lg space-y-3 bg-background">
                <h4 className="font-medium text-sm">Adicionar Novo Item</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <Label className="text-xs">Nome do Insumo</Label>
                    <Input
                      value={novoItemForm.nome_insumo}
                      onChange={(e) => setNovoItemForm(prev => ({ ...prev, nome_insumo: e.target.value }))}
                      placeholder="Nome do item"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={novoItemForm.quantidade}
                      onChange={(e) => setNovoItemForm(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 1 }))}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Unidade</Label>
                    <Select
                      value={novoItemForm.unidade_medida}
                      onValueChange={(value) => setNovoItemForm(prev => ({ ...prev, unidade_medida: value }))}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UN">Unidade</SelectItem>
                        <SelectItem value="KG">Quilograma</SelectItem>
                        <SelectItem value="G">Grama</SelectItem>
                        <SelectItem value="L">Litro</SelectItem>
                        <SelectItem value="ML">Mililitro</SelectItem>
                        <SelectItem value="PCT">Pacote</SelectItem>
                        <SelectItem value="CX">Caixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Preço Unitário Estimado (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={novoItemForm.preco_unitario_estimado}
                      onChange={(e) => setNovoItemForm(prev => ({ ...prev, preco_unitario_estimado: parseFloat(e.target.value) || 0 }))}
                      disabled={loading}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Categoria (opcional)</Label>
                    <Input
                      value={novoItemForm.categoria}
                      onChange={(e) => setNovoItemForm(prev => ({ ...prev, categoria: e.target.value }))}
                      placeholder="Ex: Carnes, Laticínios"
                      disabled={loading}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Observações (opcional)</Label>
                    <Textarea
                      value={novoItemForm.observacoes}
                      onChange={(e) => setNovoItemForm(prev => ({ ...prev, observacoes: e.target.value }))}
                      rows={1}
                      disabled={loading}
                    />
                  </div>
                </div>
                <Button onClick={handleAddItem} className="w-full" size="sm" disabled={loading}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
            </div>
          </div>

          {/* Total Estimado */}
          <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
            <span className="font-semibold text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Total Estimado:
            </span>
            <span className="text-xl font-bold text-primary">
              R$ {totalEstimadoAtual.toFixed(2)}
            </span>
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} variant="vixxe">
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}