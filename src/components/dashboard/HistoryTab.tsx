import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Comanda, FiltroComandas } from "@/types/supabase"; // Usar Comanda do Supabase
import { formatCurrency } from "@/lib/order-parser";
import { Eye, Trash2, Filter, History, RotateCcw, Smartphone, CreditCard, Banknote, MoreHorizontal, ChevronDown, ChevronUp, MessageSquare, Calendar, Clock, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useComandas } from "@/hooks/useSupabase"; // Importar useComandas
import { FiltrosAvancados } from "@/components/modals/FiltrosAvancados"; // Importar FiltrosAvancados
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EmptyState } from '@/components/shared/EmptyState';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from "@/components/ui/separator";

interface HistoryTabProps {
  onViewOrder: (comanda: Comanda) => void;
  onComandaUpdated: () => void; // Adicionado para notificar atualizações
}

export function HistoryTab({ onViewOrder, onComandaUpdated }: HistoryTabProps) {
  const { comandas, loading, carregarComandas, excluirComanda } = useComandas();
  const [filtros, setFiltros] = useState<FiltroComandas>({ status: 'Processada' }); // Filtro padrão para Processada
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | null>(null); // Estado para controlar o item do accordion aberto
  
  // Carregar comandas com base nos filtros
  useEffect(() => {
    carregarComandas(filtros);
  }, [filtros, carregarComandas]);

  const applyFilters = () => {
    carregarComandas(filtros);
    toast.success(`${comandas.length} registro(s) encontrado(s)`);
  };

  const clearFilters = () => {
    setFiltros({ status: 'Processada' }); // Limpa filtros, mas mantém o status Processada
    toast.info('Filtros limpos. Exibindo todas as comandas finalizadas.');
  };

  const handleDeleteComanda = async (id: string, clienteNome: string) => {
    await excluirComanda(id);
    onComandaUpdated(); // Notifica o componente pai
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Pix': return <Smartphone className="w-3 h-3" />;
      case 'Cartão': return <CreditCard className="w-3 h-3" />;
      case 'Dinheiro': return <Banknote className="w-3 h-3" />;
      default: return <MoreHorizontal className="w-3 h-3" />;
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

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Processada': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Pendente': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Cancelada': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <Card className="vixxe-shadow rounded-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Comandas Finalizadas
            </CardTitle>
            <CardDescription>
              Visualize e gerencie todas as comandas processadas ou canceladas.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <FiltrosAvancados
              filtros={filtros}
              onFiltrosChange={setFiltros}
              onAplicar={applyFilters}
            />
            {Object.keys(filtros).length > 1 && ( // Mais de 1 filtro significa que há filtros além do status 'Processada'
              <Button onClick={clearFilters} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Results Summary */}
        <div className="text-sm text-muted-foreground">
          Exibindo {comandas.length} registro(s)
        </div>

        {/* Orders Table */}
        <div className="rounded-md border">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
              Carregando comandas...
            </div>
          ) : comandas.length === 0 ? (
            <div className="h-24 text-center text-muted-foreground">
              <EmptyState
                icon={History}
                title="Nenhuma comanda finalizada"
                description="Comandas processadas ou canceladas aparecerão aqui."
                iconClassName="text-muted-foreground"
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
                        className={`text-xs ${getPaymentMethodClass(comanda.forma_pagamento)}`}
                      >
                        {getPaymentMethodIcon(comanda.forma_pagamento)}
                        {comanda.forma_pagamento}
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
                        onClick={() => onViewOrder(comanda)}
                        title="Visualizar comanda"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </Button>
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

        {/* Summary Stats */}
        {comandas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center p-4 bg-background/30 rounded-lg">
              <div className="text-2xl font-bold">
                {formatCurrency(comandas.reduce((sum, comanda) => sum + comanda.valor, 0))}
              </div>
              <div className="text-sm text-muted-foreground">Total Geral</div>
            </div>
            <div className="text-center p-4 bg-background/30 rounded-lg">
              <div className="text-2xl font-bold">
                {formatCurrency(
                  comandas.length > 0 
                    ? comandas.reduce((sum, comanda) => sum + comanda.valor, 0) / comandas.length
                    : 0
                )}
              </div>
              <div className="text-sm text-muted-foreground">Ticket Médio</div>
            </div>
            <div className="text-center p-4 bg-background/30 rounded-lg">
              <div className="text-2xl font-bold">{comandas.length}</div>
              <div className="text-sm text-muted-foreground">Total de Comandas</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}