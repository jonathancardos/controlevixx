import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Comanda, ComandaUpdate } from "@/types/supabase";
import { formatCurrency } from "@/lib/order-parser";
import { Eye, Trash2, Filter, History, RotateCcw, Smartphone, CreditCard, Banknote, MoreHorizontal, Edit, CheckCircle, DollarSign, AlertTriangle, ChevronDown, ChevronUp, MessageSquare, Calendar, Clock, ShoppingCart, Truck } from "lucide-react"; // Adicionado Truck
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useComandas } from "@/hooks/useSupabase";
import { FiltrosAvancados } from "@/components/modals/FiltrosAvancados";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditComandaSheet } from '@/components/modals/EditComandaSheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/shared/EmptyState';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from "@/components/ui/separator";

interface ActiveComandasTabProps {
  onComandaUpdated: () => void;
}

export function ActiveComandasTab({ onComandaUpdated }: ActiveComandasTabProps) {
  const { comandas, loading, carregarComandas, atualizarComanda, excluirComanda, alterarFormaPagamento, confirmarPagamento, marcarEmRota, finalizarComanda } = useComandas();
  const [filtros, setFiltros] = useState<import('@/types/supabase').FiltroComandas>({ status: 'Pendente' }); // Filtro padrão para pendentes
  const [editingComanda, setEditingComanda] = useState<Comanda | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | null>(null); // Estado para controlar o item do accordion aberto

  useEffect(() => {
    carregarComandas(filtros);
  }, [filtros, carregarComandas]);

  const applyFilters = () => {
    carregarComandas(filtros);
    toast.success(`${comandas.length} registro(s) encontrado(s)`);
  };

  const clearFilters = () => {
    setFiltros({ status: 'Pendente' }); // Limpa filtros, mas mantém o status pendente
    toast.info('Filtros limpos. Exibindo todas as comandas pendentes.');
  };

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
      carregarComandas(filtros); // Recarrega a lista
    }
  };

  const handleConfirmPayment = async (comanda: Comanda) => {
    const result = await confirmarPagamento(comanda.id);
    if (result) {
      onComandaUpdated();
      carregarComandas(filtros);
    }
  };

  const handleMarkInRoute = async (comanda: Comanda) => {
    const result = await marcarEmRota(comanda.id);
    if (result) {
      onComandaUpdated();
      carregarComandas(filtros);
    }
  };

  const handleFinalizeComanda = async (comanda: Comanda) => {
    const result = await finalizarComanda(comanda.id);
    if (result) {
      onComandaUpdated();
      carregarComandas(filtros);
    }
  };

  const handleDeleteComanda = async (id: string, clienteNome: string) => {
    const result = await excluirComanda(id);
    if (result) {
      toast.success(`Comanda ${clienteNome} excluída!`);
      onComandaUpdated();
      carregarComandas(filtros);
    }
  };

  const handleQuickPaymentChange = async (comandaId: string, novaForma: 'Pix' | 'Cartão' | 'Dinheiro' | 'Outros') => {
    const result = await alterarFormaPagamento(comandaId, novaForma);
    if (result) {
      toast.success(`Forma de pagamento da comanda atualizada para ${novaForma}!`);
      onComandaUpdated();
      carregarComandas(filtros);
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
    <Card className="vixxe-shadow rounded-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Comandas Ativas (Pendentes)
            </CardTitle>
            <CardDescription>
              Visualize e gerencie comandas que ainda não foram finalizadas.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <FiltrosAvancados
              filtros={filtros}
              onFiltrosChange={(novosFiltros) => setFiltros(novosFiltros)}
              onAplicar={applyFilters}
            />
            {Object.keys(filtros).length > 1 && ( // Mais de 1 filtro significa que há filtros além do status 'Pendente'
              <Button onClick={clearFilters} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Exibindo {comandas.length} registro(s)
        </div>

        <div className="rounded-md border">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
              Carregando comandas...
            </div>
          ) : comandas.length === 0 ? (
            <div className="h-24 text-center text-muted-foreground">
              <EmptyState
                icon={AlertTriangle}
                title="Nenhuma comanda pendente"
                description="Todas as comandas foram processadas ou não há novas comandas pendentes."
                iconClassName="text-yellow-500"
              />
            </div>
          ) : (
            <Accordion type="single" collapsible value={activeAccordionItem} onValueChange={setActiveAccordionItem}>
              {comandas.map((comanda) => (
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditComanda(comanda)}
                        title="Editar comanda"
                      >
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
                          <Button
                            variant="destructive"
                            size="sm"
                            title="Excluir comanda"
                          >
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
        </div>
      </CardContent>

      <EditComandaSheet
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        comanda={editingComanda}
        onSave={handleSaveEdit}
        loading={loading}
      />
    </Card>
  );
}