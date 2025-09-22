import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Cliente } from '@/types/supabase';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History, Award, Calendar, DollarSign, ShoppingCart, Clock, TrendingUp, Eye, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/order-parser';
import { EmptyState } from '@/components/shared/EmptyState';
import { ClientOrdersSheet } from './ClientOrdersSheet';
import { useVipSystem } from '@/hooks/useVipSystem'; // Importar useVipSystem

// Nova interface para o histórico VIP processado
interface ProcessedVipHistoryEntry {
  startDate: string; // Assuming yyyy-MM-dd
  endDate: string;   // Assuming yyyy-MM-dd
  foi_vip: boolean;
  valor_gasto: number;
  pedidos: number;
  nivel_vip_display: string;
}

interface CurrentVipStatus {
  is_vip: boolean;
  vip_combo_available: boolean;
  valor_gasto_semana: number;
  pedidos_semana: number;
  progresso_valor: number;
  progresso_pedidos: number;
  nivel_vip: string;
}

interface VipHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Cliente | null;
  historyData: ProcessedVipHistoryEntry[];
  currentWeekMonthVipStatus: {
    currentWeekStatus: CurrentVipStatus | null;
    currentMonthStatus: CurrentVipStatus | null;
  } | null;
}

export function VipHistorySheet({
  open,
  onOpenChange,
  client,
  historyData,
  currentWeekMonthVipStatus
}: VipHistorySheetProps) {
  const { getWeekEndDate, getMonthEndDate } = useVipSystem(); // Obter as funções do hook
  const [isClientOrdersSheetOpen, setIsClientOrdersSheetOpen] = useState(false);
  const [clientOrdersPeriod, setClientOrdersPeriod] = useState({
    startDate: '',
    endDate: '',
    title: '',
  });

  if (!client) return null;

  const getVipLevelBadge = (nivel: string, foiVip: boolean) => {
    if (!foiVip) return <Badge variant="outline">Não VIP</Badge>;

    switch (nivel) {
      case 'Premium':
        return <Badge className="bg-yellow-500 text-yellow-900"><Award className="w-3 h-3 mr-1" />Premium</Badge>;
      case 'VIP':
        return <Badge className="bg-purple-500 text-purple-100"><Award className="w-3 h-3 mr-1" />VIP</Badge>;
      case 'Regular':
        return <Badge className="bg-blue-500 text-blue-100"><Award className="w-3 h-3 mr-1" />Regular</Badge>;
      default:
        return <Badge className="bg-gray-500 text-gray-100"><Award className="w-3 h-3 mr-1" />Novo</Badge>;
    }
  };

  const handleViewClientOrders = (startDate: string, endDate: string, title: string) => {
    setClientOrdersPeriod({ startDate, endDate, title });
    setIsClientOrdersSheetOpen(true);
  };

  const renderCurrentStatusCard = (title: string, status: CurrentVipStatus | null, clientData: Cliente, periodStartDate: string, periodEndDate: string) => {
    if (!status) return null;

    const metaValor = clientData.meta_valor_semanal || 100;
    const metaPedidos = clientData.meta_pedidos_semanal || 4;

    return (
      <div className="p-4 bg-primary/10 rounded-lg border space-y-3">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5" /> {title}
        </h3>
        <Separator />
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <Label className="text-xs text-muted-foreground">Valor Gasto</Label>
            <p className="font-medium">{formatCurrency(status.valor_gasto_semana)}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Pedidos</Label>
            <p className="font-medium">{status.pedidos_semana}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Meta Valor</Label>
            <p className="font-medium">{formatCurrency(metaValor)}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Meta Pedidos</Label>
            <p className="font-medium">{metaPedidos}</p>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2">
          {getVipLevelBadge(status.nivel_vip, status.is_vip)}
          {status.vip_combo_available && (
            <Badge className="bg-green-500 text-white">
              <Gift className="w-3 h-3 mr-1" /> Combo VIP Disponível
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3"
          onClick={() => handleViewClientOrders(periodStartDate, periodEndDate, title)}
        >
          <Eye className="w-4 h-4 mr-2" /> Ver Pedidos
        </Button>
      </div>
    );
  };

  // Obter as datas de início da semana e do mês atuais do cliente (ou globais)
  // Ensure these are always valid ISO strings (yyyy-MM-dd)
  const effectiveAdminWeekStartDate = client.admin_set_week_start_date === '' ? null : client.admin_set_week_start_date;
  const currentWeekStartDate = effectiveAdminWeekStartDate || format(parseISO(client.last_week_reset_date || new Date().toISOString()), 'yyyy-MM-dd');
  const actualCurrentWeekEndDate = getWeekEndDate(currentWeekStartDate);

  const effectiveAdminMonthStartDate = client.admin_set_month_start_date === '' ? null : client.admin_set_month_start_date;
  const currentMonthStartDate = effectiveAdminMonthStartDate || format(parseISO(client.last_month_reset_date || new Date().toISOString()), 'yyyy-MM-dd');
  const actualCurrentMonthEndDate = getMonthEndDate(currentMonthStartDate);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico VIP de {client.nome}
          </SheetTitle>
          <SheetDescription>
            Resumo do status VIP e atividades do cliente por período.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 py-6 -mr-6 pr-6">
          <div className="space-y-6">
            {/* Seção de Semana Atual */}
            {currentWeekMonthVipStatus?.currentWeekStatus && renderCurrentStatusCard(
              "Semana Atual",
              currentWeekMonthVipStatus.currentWeekStatus,
              client,
              currentWeekStartDate,
              format(actualCurrentWeekEndDate, 'yyyy-MM-dd') // Passar a data de fim correta
            )}

            {/* Seção de Mês Atual */}
            {currentWeekMonthVipStatus?.currentMonthStatus && renderCurrentStatusCard(
              "Mês Atual",
              currentWeekMonthVipStatus.currentMonthStatus,
              client,
              currentMonthStartDate,
              format(actualCurrentMonthEndDate, 'yyyy-MM-dd') // Passar a data de fim correta
            )}

            <Separator />

            <h3 className="font-semibold text-lg flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Semanas Anteriores
            </h3>
            {historyData && historyData.length > 0 ? (
              <div className="space-y-4">
                {historyData.map((entry, index) => (
                  <div key={index} className="p-4 bg-muted/30 rounded-lg border space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {format(parseISO(entry.startDate), 'dd/MM/yyyy', { locale: ptBR })} - {format(parseISO(entry.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      {getVipLevelBadge(entry.nivel_vip_display, entry.foi_vip)}
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Valor Gasto</Label>
                        <p className="font-medium">{formatCurrency(entry.valor_gasto)}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Pedidos</Label>
                        <p className="font-medium">{entry.pedidos}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => handleViewClientOrders(
                        entry.startDate, // Assuming entry.startDate is already 'yyyy-MM-dd'
                        entry.endDate,   // Assuming entry.endDate is already 'yyyy-MM-dd'
                        `Histórico: ${format(parseISO(entry.startDate), 'dd/MM/yyyy', { locale: ptBR })} - ${format(parseISO(entry.endDate), 'dd/MM/yyyy', { locale: ptBR })}`
                      )}
                    >
                      <Eye className="w-4 h-4 mr-2" /> Ver Pedidos
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={History}
                title="Nenhum histórico VIP"
                description="Este cliente ainda não possui registros de histórico VIP de semanas anteriores."
                iconClassName="text-muted-foreground"
              />
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="mt-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Fechar
          </Button>
        </SheetFooter>
      </SheetContent>

      {/* Client Orders Sheet */}
      {client && (
        <ClientOrdersSheet
          open={isClientOrdersSheetOpen}
          onOpenChange={setIsClientOrdersSheetOpen}
          clienteId={client.id}
          startDate={clientOrdersPeriod.startDate}
          endDate={clientOrdersPeriod.endDate}
          title={clientOrdersPeriod.title}
        />
      )}
    </Sheet>
  );
}