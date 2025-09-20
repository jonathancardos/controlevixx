import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CalendarDays, Users, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { format, parseISO, isPast, isToday, differenceInDays, startOfMonth, isBefore, isAfter, isSameDay, addDays, endOfMonth, startOfDay, endOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFinancialSupabase } from "@/hooks/useFinancialSupabase";
import { useClientInsights } from "@/hooks/useClientInsights";
import { Usuario } from "@/types/supabase";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useEffect, useMemo } from "react";

interface EmployeeDashboardCardProps {
  user: Usuario;
}

interface QuinzenaDisplayData {
  id: string;
  label: string;
  startDate: Date | null;
  endDate: Date | null;
  valorAcumulado: number;
  totalDeducoes: number;
  valorMeta: number;
  valorRestante: number;
  status: string;
  isConfigured: boolean;
  daysUntilPayment: number | null;
}

export function EmployeeDashboardCard({ user }: EmployeeDashboardCardProps) {
  const { pagamentosDiarios, quinzenasPagamento, loading: financialLoading, carregarPagamentosDiarios, carregarQuinzenasPagamento } = useFinancialSupabase();
  const { topClients, loading: clientsLoading } = useClientInsights();

  useEffect(() => {
    if (user?.id) {
      carregarPagamentosDiarios(user.id);
      carregarQuinzenasPagamento(user.id);
    }
  }, [user?.id, carregarPagamentosDiarios, carregarQuinzenasPagamento]);

  const quinzenasParaExibir = useMemo(() => {
    const today = startOfDay(new Date());
    const quinzenasAtivas: QuinzenaDisplayData[] = [];

    const activeAndFutureUserQuinzenas = quinzenasPagamento
      .filter(q => 
        q.usuario_id === user.id && 
        q.status === 'agendada' &&
        (isAfter(endOfDay(parseISO(q.data_fim)), today) || isSameDay(endOfDay(parseISO(q.data_fim)), today))
      )
      .sort((a, b) => parseISO(a.data_fim).getTime() - parseISO(b.data_fim).getTime());

    activeAndFutureUserQuinzenas.forEach(quinzenaConfig => {
      let quinzenaData: QuinzenaDisplayData = {
        id: quinzenaConfig.id,
        label: "Quinzena",
        startDate: null,
        endDate: null,
        valorAcumulado: 0,
        totalDeducoes: 0,
        valorMeta: 0,
        valorRestante: 0,
        status: 'N/A',
        isConfigured: true,
        daysUntilPayment: null
      };

      quinzenaData.endDate = endOfDay(parseISO(quinzenaConfig.data_fim));
      quinzenaData.valorMeta = quinzenaConfig.valor_meta || 0;
      quinzenaData.status = quinzenaConfig.status;

      quinzenaData.startDate = quinzenaConfig.data_inicio ? startOfDay(parseISO(quinzenaConfig.data_inicio)) : null;

      if (quinzenaData.startDate && quinzenaData.endDate) {
        quinzenaData.label = `Quinzena: ${format(quinzenaData.startDate, 'dd/MM', { locale: ptBR })} - ${format(quinzenaData.endDate, 'dd/MM', { locale: ptBR })}`;
        pagamentosDiarios
          .filter(p => p.usuario_id === user.id &&
                    (isAfter(startOfDay(parseISO(p.data_pagamento)), quinzenaData.startDate!) || isSameDay(startOfDay(parseISO(p.data_pagamento)), quinzenaData.startDate!)) &&
                    (isBefore(endOfDay(parseISO(p.data_pagamento)), quinzenaData.endDate) || isSameDay(endOfDay(parseISO(p.data_pagamento)), quinzenaData.endDate)))
          .forEach(p => {
            if (p.valor > 0) {
              quinzenaData.valorAcumulado += p.valor;
            } else {
              quinzenaData.totalDeducoes += p.valor;
            }
          });
        const totalPeriodValue = quinzenaData.valorAcumulado + quinzenaData.totalDeducoes;
        quinzenaData.valorRestante = quinzenaData.valorMeta - totalPeriodValue;
      }
      quinzenaData.daysUntilPayment = differenceInDays(quinzenaData.endDate, today);
      quinzenasAtivas.push(quinzenaData);
    });

    return quinzenasAtivas;
  }, [user, pagamentosDiarios, quinzenasPagamento]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'pago': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'agendada': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'diaria': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'deducao_falta': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'deducao_atraso': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="vixxe-shadow rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold bg-vixxe-gradient bg-clip-text text-transparent">
            <DollarSign className="w-6 h-6" />
            Meu Resumo Financeiro
          </CardTitle>
          <CardDescription>
            Informações sobre seus pagamentos e as próximas quinzenas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {financialLoading ? (
            <div className="text-center py-4 text-muted-foreground">Carregando financeiro...</div>
          ) : (
            <>
              {/* Cards das Quinzenas Ativas */}
              {quinzenasParaExibir.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quinzenasParaExibir.map((quinzenaData) => (
                    <div key={quinzenaData.id} className="p-4 bg-primary/10 rounded-lg flex flex-col items-start border border-primary/20">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="w-4 h-4" />
                        {quinzenaData.label}
                      </div>
                      <p className="text-2xl font-bold text-primary mt-1">
                        R$ {(quinzenaData.valorAcumulado + quinzenaData.totalDeducoes).toFixed(2).replace('.', ',')}
                      </p>
                      {quinzenaData.totalDeducoes < 0 && (
                        <Badge className="mt-2" variant="destructive">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Deduções: R$ {Math.abs(quinzenaData.totalDeducoes).toFixed(2).replace('.', ',')}
                        </Badge>
                      )}
                      <div className="mt-2 text-sm text-muted-foreground">
                        Meta: R$ {quinzenaData.valorMeta.toFixed(2).replace('.', ',')}
                        <p className={`font-bold ${quinzenaData.valorRestante <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Restante: R$ {quinzenaData.valorRestante.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">
                          Período: {quinzenaData.startDate ? format(quinzenaData.startDate, 'dd/MM', { locale: ptBR }) : 'N/A'} - {quinzenaData.endDate ? format(quinzenaData.endDate, 'dd/MM', { locale: ptBR }) : 'N/A'}
                        </Badge>
                        <Badge className={getStatusColor(quinzenaData.status)}>
                          {quinzenaData.status === 'agendada' ? 'Agendada' : 'Paga'}
                        </Badge>
                      </div>
                      {quinzenaData.daysUntilPayment !== null && (
                        <Badge className="mt-3" variant="default">
                          <Clock className="w-3 h-3 mr-1" />
                          {quinzenaData.daysUntilPayment === 0 ? 'É hoje!' : `Faltam ${quinzenaData.daysUntilPayment} dia(s)`}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-muted/30 rounded-lg text-center text-muted-foreground border border-dashed border-muted-foreground/50">
                  <CalendarDays className="w-8 h-8 mx-auto mb-2" />
                  <p>Nenhuma quinzena agendada para o futuro.</p>
                  <p className="text-sm">Aguarde o administrador configurar suas quinzenas.</p>
                </div>
              )}

              <Separator />

              {/* Últimos Lançamentos Financeiros */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Últimos Lançamentos</h3>
                <div className="space-y-2">
                  {pagamentosDiarios.slice(0, 5).map(p => (
                    <div key={p.id} className={cn(
                      p.tipo && p.tipo.startsWith('deducao') ? 'bg-red-500/5' : 'bg-muted/30',
                      'flex justify-between items-center p-3 rounded-lg'
                    )}>
                      <div>
                        <p className="font-medium">{format(parseISO(p.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getTipoColor(p.tipo || '')}>{p.tipo === 'diaria' ? 'Diária' : p.tipo === 'deducao_falta' ? 'Falta' : 'Atraso'}</Badge>
                          <Badge className={getStatusColor(p.status || '')}>{p.status === 'pendente' ? 'Pendente' : 'Pago'}</Badge>
                        </div>
                        {p.observacoes && <p className="text-xs text-muted-foreground mt-1">{p.observacoes}</p>}
                      </div>
                      <p className={cn("text-lg font-bold", p.valor < 0 ? 'text-red-600' : 'text-green-600')}>
                        R$ {p.valor.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  ))}
                  {pagamentosDiarios.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">Nenhum lançamento financeiro.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Clientes do Mês com Mais Compras */}
      <Card className="vixxe-shadow rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold bg-vixxe-gradient bg-clip-text text-transparent">
            <Users className="w-6 h-6" />
            Top Clientes do Mês
          </CardTitle>
          <CardDescription>
            Clientes com maior volume de compras neste mês.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {clientsLoading ? (
            <div className="text-center py-4 text-muted-foreground">Carregando clientes...</div>
          ) : topClients.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">Nenhum cliente com compras este mês ainda.</p>
          ) : (
            <div className="space-y-2">
              {topClients.map((client, index) => (
                <div key={client.cliente_nome} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="min-w-[25px] justify-center">{index + 1}º</Badge>
                    <p className="font-medium">{client.cliente_nome}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">
                      R$ {client.total_gasto.toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-xs text-muted-foreground">{client.total_pedidos} pedidos</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}