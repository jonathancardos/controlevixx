import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Comanda } from '@/types/supabase';
import { format, parseISO } from 'date-fns'; // Import parseISO
import { ptBR } from 'date-fns/locale';
import { ShoppingCart, Calendar, Clock, DollarSign, MessageSquare, Eye, Smartphone, CreditCard, Banknote, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/order-parser';
import { EmptyState } from '@/components/shared/EmptyState';
import { useComandas } from '@/hooks/useSupabase'; // Importar useComandas
import { EditComandaSheet } from '@/components/modals/EditComandaSheet'; // Importar EditComandaSheet

interface ClientOrdersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string;
  startDate: string;
  endDate: string;
  title: string;
}

export function ClientOrdersSheet({
  open,
  onOpenChange,
  clienteId,
  startDate,
  endDate,
  title,
}: ClientOrdersSheetProps) {
  const { comandas, loading, carregarComandas } = useComandas();
  const [filteredComandas, setFilteredComandas] = useState<Comanda[]>([]);
  const [isEditComandaSheetOpen, setIsEditComandaSheetOpen] = useState(false);
  const [selectedComandaForView, setSelectedComandaForView] = useState<Comanda | null>(null);

  useEffect(() => {
    if (open && clienteId && startDate && endDate) {
      carregarComandas({
        cliente: clienteId,
        dataInicio: startDate,
        dataFim: endDate,
      });
    }
  }, [open, clienteId, startDate, endDate, carregarComandas]);

  useEffect(() => {
    if (clienteId) {
      setFilteredComandas(comandas.filter(c => c.cliente_id === clienteId));
    }
  }, [comandas, clienteId]);

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

  const handleViewComandaDetails = (comanda: Comanda) => {
    setSelectedComandaForView(comanda);
    setIsEditComandaSheetOpen(true);
  };

  // Função dummy para onSave, pois a sheet de visualização não salva diretamente
  const handleSaveViewedComanda = () => {
    // Não faz nada, pois esta sheet é apenas para visualização
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[500px] flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Pedidos do Cliente - {title}
            </SheetTitle>
            <SheetDescription>
              Lista de comandas para o cliente no período de {startDate && !isNaN(new Date(startDate).getTime()) ? format(parseISO(startDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Data inválida'} a {endDate && !isNaN(new Date(endDate).getTime()) ? format(parseISO(endDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Data inválida'}.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 py-6 -mr-6 pr-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                Carregando pedidos...
              </div>
            ) : filteredComandas.length > 0 ? (
              <div className="space-y-4">
                {filteredComandas.map((comanda) => (
                  <div key={comanda.id} className="p-4 bg-muted/30 rounded-lg border space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {comanda.data && !isNaN(new Date(comanda.data).getTime()) 
                            ? format(new Date(comanda.data), 'dd/MM/yyyy', { locale: ptBR })
                            : 'Data inválida'
                          }
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs flex items-center gap-1 ${getPaymentMethodClass(comanda.forma_pagamento || 'Outros')}`}
                      >
                        {getPaymentMethodIcon(comanda.forma_pagamento || 'Outros')}
                        {comanda.forma_pagamento}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Valor</Label>
                        <p className="font-medium">{formatCurrency(comanda.valor)}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <p className="font-medium">{comanda.status}</p>
                      </div>
                    </div>
                    {comanda.observacoes && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <Label className="text-xs text-muted-foreground">Observações</Label>
                        <p>{comanda.observacoes}</p>
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => handleViewComandaDetails(comanda)}>
                      <Eye className="w-4 h-4 mr-2" /> Ver Detalhes da Comanda
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ShoppingCart}
                title="Nenhum pedido encontrado"
                description="Não há pedidos registrados para este cliente no período selecionado."
                iconClassName="text-muted-foreground"
              />
            )}
          </ScrollArea>

          <SheetFooter className="mt-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Fechar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* EditComandaSheet para visualização */}
      <EditComandaSheet
        open={isEditComandaSheetOpen}
        onOpenChange={setIsEditComandaSheetOpen}
        comanda={selectedComandaForView}
        onSave={handleSaveViewedComanda} // Função dummy
        isViewOnly={true} // Ativa o modo de visualização
      />
    </>
  );
}