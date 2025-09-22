import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BellRing, Edit, CheckCircle, Trash2, X, ShoppingCart, DollarSign, Smartphone, CreditCard, Banknote, MoreHorizontal, ChevronDown, ChevronUp, MessageSquare, Calendar, Clock, Truck } from 'lucide-react';
import { useComandas } from '@/hooks/useSupabase';
import { Comanda, ComandaUpdate } from '@/types/supabase';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/order-parser';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EditComandaSheet } from '@/components/modals/EditComandaSheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';

interface PendingComandasFABProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToComandaManagement: () => void;
  onComandaUpdated: () => void;
}

export function PendingComandasFAB({ open, onOpenChange, onNavigateToComandaManagement, onComandaUpdated }: PendingComandasFABProps) {
  const [editingComanda, setEditingComanda] = useState<Comanda | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | null>(null);

  const { comandas, loading, carregarComandas, atualizarComanda, excluirComanda, alterarFormaPagamento, confirmarPagamento, marcarEmRota, finalizarComanda } = useComandas();

  const pendingComandas = comandas.filter(c => c.status === 'Pendente');

  useEffect(() => {
    if (open) {
      carregarComandas({ status: 'Pendente' });
    }
  }, [open, carregarComandas]);

  // A função handleFabClick não é mais necessária aqui, pois o botão FAB foi removido.
  // A sheet será aberta diretamente pelo `onOpenChange` do componente pai.

  const handleEditComanda = (comanda: Comanda) => {
    setEditingComanda(comanda);
    setIsEditSheetOpen(true);
  };

  const handleSaveEdit = async (id: string, updates: ComandaUpdate) => {
    const result = await atualizarComanda(id, updates);
    if (result) {
      setIsEditSheetOpen(false);
      setEditingComanda(null);
      onComandaUpdated();
      carregarComandas({ status: 'Pendente' });
    }
  };

  const handleConfirmPayment = async (comanda: Comanda) => {
    const result = await confirmarPagamento(comanda.id);
    if (result) {
      onComandaUpdated();
      carregarComandas({ status: 'Pendente' });
    }
  };

  const handleMarkInRoute = async (comanda: Comanda) => {
    const result = await marcarEmRota(comanda.id);
    if (result) {
      onComandaUpdated();
      carregarComandas({ status: 'Pendente' });
    }
  };

  const handleFinalizeComanda = async (comanda: Comanda) => {
    const result = await finalizarComanda(comanda.id);
    if (result) {
      onComandaUpdated();
      carregarComandas({ status: 'Pendente' });
    }
  };

  const handleDeleteComanda = async (id: string, clienteNome: string) => {
    const result = await excluirComanda(id);
    if (result) {
      toast.success(`Comanda ${clienteNome} excluída!`);
      onComandaUpdated();
      carregarComandas({ status: 'Pendente' });
    }
  };

  const handleQuickPaymentChange = async (comandaId: string, novaForma: 'Pix' | 'Cartão' | 'Dinheiro' | 'Outros') => {
    const result = await alterarFormaPagamento(comandaId, novaForma);
    if (result) {
      toast.success(`Forma de pagamento da comanda atualizada para ${novaForma}!`);
      onComandaUpdated();
      carregarComandas({ status: 'Pendente' });
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Pix': return <Smartphone className="w-4 h-4" />;
      case 'Cartão': return <CreditCard className="w-4 h-4" />;
      case 'Dinheiro': return <Banknote className="w-4 h-4" />;
      default: return <MoreHorizontal className="w-4 h-4" />;
    }
  };

  const getPaymentMethodClass = (method: string) => {
    switch (method) {
      case 'Pix': return 'payment-pix';
      case 'Cartão': return 'payment-cartao';
      case 'Dinheiro': return 'payment-dinheiro';
      default: return 'payment-outros';
    }
  };

  return (
    <>
      {/* O botão FAB foi removido daqui. A sheet será aberta pelo botão no cabeçalho do POSSystem. */}

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <BellRing className="w-6 h-6 text-yellow-500" />
              Comandas Pendentes
            </SheetTitle>
            <SheetDescription>
              Gerencie rapidamente as comandas que ainda não foram finalizadas.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 py-4 -mr-6 pr-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando comandas pendentes...
              </div>
            ) : pendingComandas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>Nenhuma comanda pendente no momento!</p>
              </div>
            ) : (
              <Accordion type="single" collapsible value={activeAccordionItem} onValueChange={setActiveAccordionItem}>
                {pendingComandas.map(comanda => (
                  <AccordionItem key={comanda.id} value={comanda.id} className="border-b last:border-b-0">
                    <AccordionTrigger className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-start">
                        <div className="font-medium text-base">{comanda.cliente_nome}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(comanda.data), 'dd/MM/yyyy', { locale: ptBR })}
                          {comanda.horario && (
                            <>
                              <Clock className="w-3 h-3 ml-2" />
                              {comanda.horario.substring(0, 5)}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs flex items-center gap-1 ${getPaymentMethodClass(comanda.forma_pagamento)}`}
                        >
                          {getPaymentMethodIcon(comanda.forma_pagamento)}
                          {comanda.forma_pagamento}
                          {comanda.status_pagamento === 'Confirmado' && (
                            <CheckCircle className="w-3 h-3 text-green-500 ml-1" />
                          )}
                        </Badge>
                        <span className="font-bold text-lg text-primary">
                          {formatCurrency(comanda.valor)}
                        </span>
                        {activeAccordionItem === comanda.id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 border-t bg-card/50 space-y-4">
                      {/* Detalhes dos Itens */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4" /> Itens do Pedido
                        </h4>
                        <div className="space-y-2">
                          {comanda.items && (comanda.items as any[]).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm p-2 bg-background rounded">
                              <span>{item.qty}x {item.name}</span>
                              <span className="font-medium">{formatCurrency((item.price || 0) * item.qty)}</span>
                            </div>
                          ))}
                          {(!comanda.items || (comanda.items as any[]).length === 0) && (
                            <p className="text-sm text-muted-foreground">Nenhum item detalhado.</p>
                          )}
                        </div>
                      </div>

                      {/* Observações */}
                      {comanda.observacoes && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" /> Observações
                          </h4>
                          <p className="text-sm p-2 bg-background rounded">{comanda.observacoes}</p>
                        </div>
                      )}

                      <Separator />

                      {/* Ações */}
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => handleEditComanda(comanda)} title="Editar comanda">
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>

                        {comanda.status_pagamento === 'Pendente' && (
                          <Button variant="vixxe" size="sm" onClick={() => handleConfirmPayment(comanda)} title="Confirmar Pagamento">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Confirmar Pagamento
                          </Button>
                        )}

                        {comanda.status_pagamento === 'Confirmado' && comanda.tipo_servico === 'entrega' && comanda.status_entrega === 'Pendente' && (
                          <Button variant="vixxe" size="sm" onClick={() => handleMarkInRoute(comanda)} title="Marcar como Saiu para Entrega" className="bg-blue-600 hover:bg-blue-700">
                            <Truck className="w-4 h-4 mr-2" />
                            Saiu para Entrega
                          </Button>
                        )}

                        {(comanda.status_pagamento === 'Confirmado' && comanda.tipo_servico !== 'entrega') || 
                         (comanda.status_pagamento === 'Confirmado' && comanda.tipo_servico === 'entrega' && comanda.status_entrega === 'Em Rota') ? (
                          <Button variant="vixxe" size="sm" onClick={() => handleFinalizeComanda(comanda)} title="Finalizar Comanda" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Finalizar
                          </Button>
                        ) : null}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" title="Excluir comanda">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a comanda de <strong>{comanda.cliente_nome}</strong>?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteComanda(comanda.id, comanda.cliente_nome)} className="bg-red-600 hover:bg-red-700">
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </ScrollArea>

          <SheetFooter className="mt-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <EditComandaSheet
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        comanda={editingComanda}
        onSave={handleSaveEdit}
        loading={loading}
      />
    </>
  );
}