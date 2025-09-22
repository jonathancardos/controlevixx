import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, ShoppingCart, Calendar, Clock, DollarSign, MessageSquare, Eye, Smartphone, CreditCard, Banknote, MoreHorizontal, AlertTriangle, User } from 'lucide-react';
import { useComandas } from '@/hooks/useSupabase';
import { Comanda } from '@/types/supabase';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/order-parser';
import { EmptyState } from '@/components/shared/EmptyState';
import { getPaymentMethodClass } from '@/components/dashboard/PaymentMethodFilter';

interface GeneratedComandasListProps {
  onViewComanda: (comanda: Comanda) => void;
}

export function GeneratedComandasList({ onViewComanda }: GeneratedComandasListProps) {
  const { comandas, loading, carregarComandas } = useComandas();
  const [recentComandas, setRecentComandas] = useState<Comanda[]>([]);

  useEffect(() => {
    // Carregar comandas dos últimos 7 dias ou as 10 mais recentes
    const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    carregarComandas({ dataInicio: sevenDaysAgo });
  }, [carregarComandas]);

  useEffect(() => {
    // Filtrar e ordenar as comandas para mostrar as mais recentes
    const sortedComandas = [...comandas].sort((a, b) => {
      const dateA = parseISO(a.created_at).getTime();
      const dateB = parseISO(b.created_at).getTime();
      return dateB - dateA; // Mais recente primeiro
    });
    setRecentComandas(sortedComandas.slice(0, 10)); // Mostrar as 10 mais recentes
  }, [comandas]);

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Pix': return <Smartphone className="w-3 h-3" />;
      case 'Cartão': return <CreditCard className="w-3 h-3" />;
      case 'Dinheiro': return <Banknote className="w-3 h-3" />;
      default: return <MoreHorizontal className="w-3 h-3" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Processada': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Cancelada': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <Card className="vixxe-shadow rounded-xl flex flex-col h-[calc(100vh-180px)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Comandas Geradas Recentemente
        </CardTitle>
        <CardDescription>
          As últimas comandas que foram transferidas para o PDV.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        <ScrollArea className="flex-1 border rounded-lg p-4 bg-muted/20">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
              Carregando comandas...
            </div>
          ) : recentComandas.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Nenhuma comanda gerada"
              description="As comandas que você transferir para o PDV aparecerão aqui."
              iconClassName="text-muted-foreground"
            />
          ) : (
            <div className="space-y-4">
              {recentComandas.map(comanda => (
                <div key={comanda.id} className="p-4 bg-background rounded-lg border space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{comanda.cliente_nome}</span>
                    </div>
                    <Badge className={getStatusBadgeClass(comanda.status || 'Desconhecido')}>
                      {comanda.status}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{format(parseISO(comanda.data), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{comanda.horario?.substring(0, 5) || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-bold text-primary">{formatCurrency(comanda.valor)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(comanda.forma_pagamento || 'Outros')}
                      <Badge className={getPaymentMethodClass(comanda.forma_pagamento || 'Outros')}>
                        {comanda.forma_pagamento}
                      </Badge>
                    </div>
                  </div>
                  {comanda.observacoes && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {comanda.observacoes}
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => onViewComanda(comanda)}>
                    <Eye className="w-4 h-4 mr-2" /> Ver Detalhes
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}