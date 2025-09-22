import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Comanda, ComandaUpdate, Cliente } from '@/types/supabase'; // Importar Cliente
import { formatCurrency } from '@/lib/order-parser';
import { Calendar, Clock, User, DollarSign, CreditCard, FileText, MessageSquare, Plus, Trash2, Truck, Smartphone, Banknote, MoreHorizontal, CheckCircle, Info, Package } from 'lucide-react'; // Adicionado Info e Package
import { toast } from 'sonner';
import { OrderItem } from '@/types/dashboard';
import { Separator } from '@/components/ui/separator';
import { useProductSupabase } from '@/hooks/useProductSupabase';
import { useClientes } from '@/hooks/useSupabase'; // Importar useClientes
import { CreateClientSheet } from '@/components/clients/CreateClientSheet'; // Importar CreateClientSheet
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'; // Importar Accordion

interface EditComandaSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comanda: Comanda | null;
  onSave: (id: string, updates: ComandaUpdate) => void;
  loading?: boolean;
  isViewOnly?: boolean; // Nova prop para modo de visualização
}

export function EditComandaSheet({ 
  open, 
  onOpenChange, 
  comanda, 
  onSave, 
  loading = false,
  isViewOnly = false // Valor padrão false
}: EditComandaSheetProps) {
  const { produtos, categoriasProdutos } = useProductSupabase();
  const { clientes, carregarClientes } = useClientes(); // Usar o hook de clientes
  const [form, setForm] = useState<ComandaUpdate>({});
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  const [newItemForm, setNewItemForm] = useState({ 
    selectedCategoryId: '',
    productId: '',
    name: '', 
    qty: 1, 
    price: 0,
    category: '',
    observation: '' // Adicionado campo de observação
  });
  const [isCreateClientSheetOpen, setIsCreateClientSheetOpen] = useState(false); // Estado para a sheet de criação de cliente
  const [activeAccordionItems, setActiveAccordionItems] = useState<string[]>([]); // Inicializado como vazio para começar recolhido

  useEffect(() => {
    if (comanda) {
      setForm({
        cliente_id: comanda.cliente_id, // Adicionado cliente_id
        cliente_nome: comanda.cliente_nome,
        valor: comanda.valor,
        forma_pagamento: comanda.forma_pagamento,
        data: comanda.data,
        horario: comanda.horario?.substring(0, 5),
        status: comanda.status,
        observacoes: comanda.observacoes || '',
        tipo_servico: comanda.tipo_servico,
        status_pagamento: comanda.status_pagamento,
        status_entrega: comanda.status_entrega,
      });
      try {
        setEditedItems(comanda.items ? (comanda.items as unknown as OrderItem[]) : []);
      } catch (e) {
        console.error("Failed to parse comanda items:", e);
        setEditedItems([]);
      }
    }
  }, [comanda]);

  const handleCategorySelection = (categoryId: string) => {
    setNewItemForm(prev => ({
      ...prev,
      selectedCategoryId: categoryId,
      productId: '',
      name: '',
      price: 0,
      category: categoriasProdutos.find(c => c.id === categoryId)?.nome || ''
    }));
  };

  const handleProductSelection = (productId: string) => {
    const selectedProduct = produtos.find(p => p.id === productId);
    if (selectedProduct) {
      const category = categoriasProdutos.find(c => c.id === selectedProduct.categoria_id);
      setNewItemForm(prev => ({
        ...prev,
        productId: selectedProduct.id,
        name: selectedProduct.nome,
        price: selectedProduct.preco,
        category: category?.nome || 'Sem Categoria'
      }));
    } else {
      setNewItemForm(prev => ({
        ...prev,
        productId: '',
        name: '',
        price: 0,
        category: ''
      }));
    }
  };

  const handleAddItem = () => {
    if (!newItemForm.name.trim() || newItemForm.qty <= 0 || newItemForm.price < 0) {
      toast.error('Preencha todos os campos do item corretamente.');
      return;
    }
    setEditedItems(prev => [...prev, { 
      name: newItemForm.name, 
      qty: newItemForm.qty, 
      price: newItemForm.price,
      category: newItemForm.category,
      observation: newItemForm.observation.trim() || undefined // Adiciona a observação
    }]);
    setNewItemForm({ selectedCategoryId: '', productId: '', name: '', qty: 1, price: 0, category: '', observation: '' }); // Limpa a observação
    toast.success('Item adicionado à comanda!');
  };

  const handleRemoveItem = (index: number) => {
    setEditedItems(prev => prev.filter((_, i) => i !== index));
    toast.success('Item removido da comanda!');
  };

  const handleUpdateItem = (index: number, field: keyof OrderItem, value: any) => {
    setEditedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const calculateTotal = () => {
    return editedItems.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0);
  };

  const handleSaveClick = () => {
    if (!comanda) return;
    
    const updatedTotal = calculateTotal();

    const updates: ComandaUpdate = {
      ...form,
      valor: updatedTotal,
      items: editedItems as any,
    };
    
    onSave(comanda.id, updates);
  };

  const updateForm = (field: keyof ComandaUpdate, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const filteredProducts = produtos.filter(p => 
    newItemForm.selectedCategoryId === '' || p.categoria_id === newItemForm.selectedCategoryId
  );

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Pix': return <Smartphone className="w-4 h-4" />;
      case 'Cartão': return <CreditCard className="w-4 h-4" />;
      case 'Dinheiro': return <Banknote className="w-4 h-4" />;
      default: return <MoreHorizontal className="w-4 h-4" />;
    }
  };

  const handleClientCreated = (newClient: Cliente) => {
    carregarClientes(); // Recarrega a lista de clientes
    updateForm('cliente_id', newClient.id);
    updateForm('cliente_nome', newClient.nome);
    toast.success(`Cliente "${newClient.nome}" criado e selecionado!`);
  };

  if (!comanda) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {isViewOnly ? 'Detalhes da Comanda' : 'Editar Comanda'}
          </SheetTitle>
          <SheetDescription>
            {isViewOnly ? 'Visualize os detalhes da comanda selecionada.' : 'Edite os dados da comanda selecionada. As alterações são salvas automaticamente.'}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <Accordion type="single" collapsible value={activeAccordionItems[0]} onValueChange={(value) => setActiveAccordionItems(value ? [value] : [])} className="w-full">
            {/* Seção: Informações Básicas */}
            <AccordionItem value="basic-info" className="border-b-0 mb-4 rounded-lg overflow-hidden shadow-sm border">
              <AccordionTrigger className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  Informações Básicas
                </h3>
              </AccordionTrigger>
              <AccordionContent className="p-4 border-t bg-card/50 space-y-4">
                {/* Cliente */}
                <div className="space-y-2">
                  <Label htmlFor="cliente" className="flex items-center gap-2 text-accent">
                    <User className="w-4 h-4" />
                    Nome do Cliente
                  </Label>
                  <Select
                    value={form.cliente_id || ''}
                    onValueChange={(value) => {
                      if (value === 'new-client') {
                        setIsCreateClientSheetOpen(true);
                      } else {
                        const selectedClient = clientes.find(c => c.id === value);
                        updateForm('cliente_id', selectedClient?.id);
                        updateForm('cliente_nome', selectedClient?.nome || '');
                      }
                    }}
                    disabled={loading || isViewOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione ou crie um cliente">
                        {form.cliente_nome || 'Selecione um cliente'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new-client" className="font-semibold text-primary">
                        <Plus className="w-4 h-4 mr-2 inline-block" /> Criar Novo Cliente
                      </SelectItem>
                      <Separator />
                      {clientes.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Valor - Agora calculado automaticamente */}
                <div className="space-y-2">
                  <Label htmlFor="valor" className="flex items-center gap-2 text-accent">
                    <DollarSign className="w-4 h-4" />
                    Valor Total (Calculado)
                  </Label>
                  <Input
                    id="valor"
                    type="text"
                    value={formatCurrency(calculateTotal())}
                    disabled
                    className="bg-muted"
                  />
                </div>

                {/* Forma de Pagamento */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-accent">
                    <CreditCard className="w-4 h-4" />
                    Forma de Pagamento
                  </Label>
                  <Select
                    value={form.forma_pagamento || ''}
                    onValueChange={(value) => updateForm('forma_pagamento', value)}
                    disabled={loading || isViewOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pix">Pix</SelectItem>
                      <SelectItem value="Cartão">Cartão</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Data */}
                  <div className="space-y-2">
                    <Label htmlFor="data" className="flex items-center gap-2 text-accent">
                      <Calendar className="w-4 h-4" />
                      Data
                    </Label>
                    <Input
                      id="data"
                      type="date"
                      value={form.data || ''}
                      onChange={(e) => updateForm('data', e.target.value)}
                      disabled={loading || isViewOnly}
                    />
                  </div>

                  {/* Horário */}
                  <div className="space-y-2">
                    <Label htmlFor="horario" className="flex items-center gap-2 text-accent">
                      <Clock className="w-4 h-4" />
                      Horário
                    </Label>
                    <Input
                      id="horario"
                      type="time"
                      value={form.horario || ''}
                      onChange={(e) => updateForm('horario', e.target.value)}
                      disabled={loading || isViewOnly}
                    />
                  </div>
                </div>

                {/* Tipo de Serviço */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-accent">
                    <Truck className="w-4 h-4" />
                    Tipo de Serviço
                  </Label>
                  <Select
                    value={form.tipo_servico || 'local'}
                    onValueChange={(value: 'local' | 'retirada' | 'entrega') => updateForm('tipo_servico', value)}
                    disabled={loading || isViewOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Consumo Local</SelectItem>
                      <SelectItem value="retirada">Retirada</SelectItem>
                      <SelectItem value="entrega">Entrega</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status da Comanda */}
                <div className="space-y-2">
                  <Label className="text-accent">Status da Comanda</Label>
                  <Select
                    value={form.status || 'Pendente'}
                    onValueChange={(value) => updateForm('status', value)}
                    disabled={loading || isViewOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Processada">Processada</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status de Pagamento */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-accent">
                    {getPaymentMethodIcon(form.forma_pagamento || '')}
                    Status de Pagamento
                    {form.status_pagamento === 'Confirmado' && (
                      <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                    )}
                  </Label>
                  <Select
                    value={form.status_pagamento || 'Pendente'}
                    onValueChange={(value: 'Pendente' | 'Confirmado') => updateForm('status_pagamento', value)}
                    disabled={loading || isViewOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Confirmado">Confirmado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status de Entrega (apenas se for entrega) */}
                {form.tipo_servico === 'entrega' && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-accent">
                      <Truck className="w-4 h-4" />
                      Status de Entrega
                    </Label>
                    <Select
                      value={form.status_entrega || 'Pendente'}
                      onValueChange={(value: 'Pendente' | 'Em Rota' | 'Entregue') => updateForm('status_entrega', value)}
                      disabled={loading || isViewOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Em Rota">Em Rota</SelectItem>
                        <SelectItem value="Entregue">Entregue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Observações */}
                <div className="space-y-2">
                  <Label htmlFor="observacoes" className="flex items-center gap-2 text-accent">
                    <MessageSquare className="w-4 h-4" />
                    Observações
                  </Label>
                  <Textarea
                    id="observacoes"
                    value={form.observacoes || ''}
                    onChange={(e) => updateForm('observacoes', e.target.value)}
                    placeholder="Observações adicionais..."
                    rows={3}
                    disabled={loading || isViewOnly}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Seção: Itens da Comanda */}
            <AccordionItem value="items" className="border-b-0 mb-4 rounded-lg overflow-hidden shadow-sm border">
              <AccordionTrigger className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Itens do Pedido
                </h3>
              </AccordionTrigger>
              <AccordionContent className="p-4 border-t bg-card/50 space-y-4">
                <div className="space-y-3">
                  {editedItems.map((item, index) => (
                    <div key={index} className="flex flex-col p-3 bg-muted rounded-lg"> {/* Alterado para flex-col */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div className="col-span-2">
                            <Label className="text-xs text-accent">Nome do Item</Label>
                            <Input
                              value={item.name}
                              onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                              disabled={loading || isViewOnly}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-accent">Quantidade</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleUpdateItem(index, 'qty', parseInt(e.target.value) || 1)}
                              disabled={loading || isViewOnly}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-accent">Preço (R$)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.price || 0}
                              onChange={(e) => handleUpdateItem(index, 'price', parseFloat(e.target.value) || 0)}
                              disabled={loading || isViewOnly}
                            />
                          </div>
                        </div>
                        {!isViewOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      {/* Campo de observação para item existente */}
                      <div className="mt-2">
                        <Label className="text-xs text-accent">Observação do Item (opcional)</Label>
                        <Textarea
                          value={item.observation || ''}
                          onChange={(e) => handleUpdateItem(index, 'observation', e.target.value)}
                          placeholder="Ex: Sem cebola, bem passado, etc."
                          rows={1}
                          disabled={loading || isViewOnly}
                        />
                      </div>
                    </div>
                  ))}

                  {!isViewOnly && (
                    <div className="p-4 border rounded-lg space-y-3 bg-background">
                      <h4 className="font-medium text-sm">Adicionar Novo Item</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <Label className="text-xs text-accent">Categoria</Label>
                          <Select
                            value={newItemForm.selectedCategoryId}
                            onValueChange={handleCategorySelection}
                            disabled={loading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {categoriasProdutos.map(category => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs text-accent">Produto</Label>
                          <Select
                            value={newItemForm.productId}
                            onValueChange={handleProductSelection}
                            disabled={loading || newItemForm.selectedCategoryId === ''}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um produto" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredProducts.map(product => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.nome} - {formatCurrency(product.preco)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-accent">Quantidade</Label>
                          <Input
                            type="number"
                            min="1"
                            value={newItemForm.qty}
                            onChange={(e) => setNewItemForm(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-accent">Preço (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newItemForm.price}
                            onChange={(e) => setNewItemForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                            disabled={loading}
                          />
                        </div>
                        {/* Campo de observação para novo item */}
                        <div className="col-span-2">
                          <Label className="text-xs text-accent">Observação (opcional)</Label>
                          <Textarea
                            value={newItemForm.observation}
                            onChange={(e) => setNewItemForm(prev => ({ ...prev, observation: e.target.value }))}
                            placeholder="Ex: Sem cebola, bem passado, etc."
                            rows={1}
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <Button onClick={handleAddItem} className="w-full" size="sm" disabled={loading || !newItemForm.productId}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Item
                      </Button>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Seção: Texto Original (se existir) */}
            {comanda.texto_original && (
              <AccordionItem value="original-text" className="border-b-0 mb-4 rounded-lg overflow-hidden shadow-sm border">
                <AccordionTrigger className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Texto Original da Comanda
                  </h3>
                </AccordionTrigger>
                <AccordionContent className="p-4 border-t bg-card/50">
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {comanda.texto_original}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {isViewOnly ? 'Fechar' : 'Cancelar'}
          </Button>
          {!isViewOnly && (
            <Button onClick={handleSaveClick} disabled={loading} variant="vixxe">
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
      <CreateClientSheet
        open={isCreateClientSheetOpen}
        onOpenChange={setIsCreateClientSheetOpen}
        onClientCreated={handleClientCreated}
      />
    </Sheet>
  );
}