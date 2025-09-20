import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, CalendarDays, TrendingUp, AlertTriangle, Clock, Wallet, MinusCircle, PlusCircle, Filter, RotateCcw } from 'lucide-react';
import { format, parseISO, isPast, isToday, differenceInDays, startOfMonth, isBefore, isAfter, isSameDay, addDays, endOfMonth, startOfDay, endOfDay, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinancialSupabase } from '@/hooks/useFinancialSupabase';
import { Usuario } from '@/types/supabase';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner'; // Importar toast

interface FinancialTabProps {
  user: Usuario;
}

interface DailyPaymentData {
  date: string;
  value: number;
}

export function FinancialTab({ user }: FinancialTabProps) {
  const { pagamentosDiarios, quinzenasPagamento, loading, carregarPagamentosDiarios, carregarQuinzenasPagamento } = useFinancialSupabase();
  const [dailyChartData, setDailyChartData] = useState<DailyPaymentData[]>([]);
  const [markedDates, setMarkedDates] = useState<Date[]>([]);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [isFiltered, setIsFiltered] = useState(false);

  const loadFinancialData = useCallback(async (startDate?: string, endDate?: string) => {
    if (user?.id) {
      await carregarPagamentosDiarios(user.id, startDate, endDate);
      await carregarQuinzenasPagamento(user.id);
    }
  }, [user?.id, carregarPagamentosDiarios, carregarQuinzenasPagamento]);

  useEffect(() => {
    // Set default dates to current month
    const today = new Date();
    const firstDayOfMonth = startOfMonth(today);
    setFilterStartDate(format(firstDayOfMonth, 'yyyy-MM-dd'));
    setFilterEndDate(format(today, 'yyyy-MM-dd'));
    
    loadFinancialData(format(firstDayOfMonth, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'));
  }, [loadFinancialData]);

  useEffect(() => {
    // Processar dados para o gráfico de pagamentos diários
    const dailyTotals: Record<string, number> = {};
    pagamentosDiarios.forEach(p => {
      const parsedDate = parseISO(p.data_pagamento);
      if (isValid(parsedDate)) {
        const date = format(parsedDate, 'dd/MM', { locale: ptBR });
        dailyTotals[date] = (dailyTotals[date] || 0) + p.valor;
      } else {
        console.warn(`Data inválida encontrada em pagamentosDiarios: ${p.data_pagamento}`);
      }
    });

    const sortedData = Object.entries(dailyTotals)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => {
        const [dayA, monthA] = a.date.split('/').map(Number);
        const [dayB, monthB] = b.date.split('/').map(Number);
        const dateA = new Date(new Date().getFullYear(), monthA - 1, dayA);
        const dateB = new Date(new Date().getFullYear(), monthB - 1, dayB);
        return dateA.getTime() - dateB.getTime();
      });
    setDailyChartData(sortedData);

    // Processar datas para o calendário de quinzenas
    const dates = quinzenasPagamento
      .map(q => {
        const parsedDate = parseISO(q.data_fim);
        return isValid(parsedDate) ? parsedDate : null;
      })
      .filter(Boolean) as Date[];
    setMarkedDates(dates);
  }, [pagamentosDiarios, quinzenasPagamento]);

  const {
    firstQuinzenaData,
    secondQuinzenaData,
    overallNextQuinzenaDate,
    daysUntilOverallNextQuinzena
  } = useMemo(() => {
    const today = startOfDay(new Date());

    // Get all *unpaid* quinzenas for the user, sorted chronologically by data_fim
    // Filtered to only include quinzenas that are 'agendada' and whose end date is today or in the future
    const activeAndFutureUserQuinzenas = quinzenasPagamento
      .filter(q => {
        const parsedEndDate = parseISO(q.data_fim);
        return q.usuario_id === user.id && 
               q.status === 'agendada' &&
               isValid(parsedEndDate) && // Check validity here
               (isAfter(endOfDay(parsedEndDate), today) || isSameDay(endOfDay(parsedEndDate), today));
      })
      .sort((a, b) => {
        const dateA = parseISO(a.data_fim);
        const dateB = parseISO(b.data_fim);
        if (!isValid(dateA) && !isValid(dateB)) return 0;
        if (!isValid(dateA)) return 1;
        if (!isValid(dateB)) return -1;
        return dateA.getTime() - dateB.getTime();
      });

    // The first and second upcoming quinzenas, regardless of month
    const firstUpcomingQuinzenaConfig = activeAndFutureUserQuinzenas[0];
    const secondUpcomingQuinzenaConfig = activeAndFutureUserQuinzenas[1];

    // Initialize data structures for display
    let firstQuinzenaData = {
      label: "1ª Próxima Quinzena",
      startDate: null as Date | null,
      endDate: null as Date | null,
      valorAcumulado: 0,
      totalDeducoes: 0,
      valorMeta: 0,
      valorRestante: 0,
      status: 'N/A',
      isConfigured: false
    };

    let secondQuinzenaData = {
      label: "2ª Próxima Quinzena",
      startDate: null as Date | null,
      endDate: null as Date | null,
      valorAcumulado: 0,
      totalDeducoes: 0,
      valorMeta: 0,
      valorRestante: 0,
      status: 'N/A',
      isConfigured: false
    };

    // Process 1st Upcoming Quinzena
    if (firstUpcomingQuinzenaConfig) {
      const parsedEndDate = parseISO(firstUpcomingQuinzenaConfig.data_fim);
      if (isValid(parsedEndDate)) {
        firstQuinzenaData.isConfigured = true;
        firstQuinzenaData.endDate = endOfDay(parsedEndDate);
        firstQuinzenaData.valorMeta = firstUpcomingQuinzenaConfig.valor_meta || 0;
        firstQuinzenaData.status = firstUpcomingQuinzenaConfig.status;

        const parsedStartDate = firstUpcomingQuinzenaConfig.data_inicio ? startOfDay(parseISO(firstUpcomingQuinzenaConfig.data_inicio)) : null;
        if (parsedStartDate && isValid(parsedStartDate)) {
          firstQuinzenaData.startDate = parsedStartDate;
        }

        if (firstQuinzenaData.startDate && firstQuinzenaData.endDate && isValid(firstQuinzenaData.startDate) && isValid(firstQuinzenaData.endDate)) {
          firstQuinzenaData.label = `Quinzena: ${format(firstQuinzenaData.startDate, 'dd/MM', { locale: ptBR })} - ${format(firstQuinzenaData.endDate, 'dd/MM', { locale: ptBR })}`;
          pagamentosDiarios
            .filter(p => {
              const parsedPaymentDate = startOfDay(parseISO(p.data_pagamento));
              return p.usuario_id === user.id &&
                     isValid(parsedPaymentDate) &&
                     (isAfter(parsedPaymentDate, firstQuinzenaData.startDate!) || isSameDay(parsedPaymentDate, firstQuinzenaData.startDate!)) &&
                     (isBefore(parsedPaymentDate, firstQuinzenaData.endDate) || isSameDay(parsedPaymentDate, firstQuinzenaData.endDate));
            })
            .forEach(p => {
              if (p.valor > 0) {
                firstQuinzenaData.valorAcumulado += p.valor;
              } else {
                firstQuinzenaData.totalDeducoes += p.valor;
              }
            });
          const totalPeriodValue = firstQuinzenaData.valorAcumulado + firstQuinzenaData.totalDeducoes;
          firstQuinzenaData.valorRestante = firstQuinzenaData.valorMeta - totalPeriodValue;
        }
      }
    }

    // Process 2nd Upcoming Quinzena
    if (secondUpcomingQuinzenaConfig) {
      const parsedEndDate = parseISO(secondUpcomingQuinzenaConfig.data_fim);
      if (isValid(parsedEndDate)) {
        secondQuinzenaData.isConfigured = true;
        secondQuinzenaData.endDate = endOfDay(parsedEndDate);
        secondQuinzenaData.valorMeta = secondUpcomingQuinzenaConfig.valor_meta || 0;
        secondQuinzenaData.status = secondUpcomingQuinzenaConfig.status;

        const parsedStartDate = secondUpcomingQuinzenaConfig.data_inicio ? startOfDay(parseISO(secondUpcomingQuinzenaConfig.data_inicio)) : null;
        if (parsedStartDate && isValid(parsedStartDate)) {
          secondQuinzenaData.startDate = parsedStartDate;
        }

        if (secondQuinzenaData.startDate && secondQuinzenaData.endDate && isValid(secondQuinzenaData.startDate) && isValid(secondQuinzenaData.endDate)) {
          secondQuinzenaData.label = `Quinzena: ${format(secondQuinzenaData.startDate, 'dd/MM', { locale: ptBR })} - ${format(secondQuinzenaData.endDate, 'dd/MM', { locale: ptBR })}`;
          pagamentosDiarios
            .filter(p => {
              const parsedPaymentDate = startOfDay(parseISO(p.data_pagamento));
              return p.usuario_id === user.id &&
                     isValid(parsedPaymentDate) &&
                     (isAfter(parsedPaymentDate, secondQuinzenaData.startDate!) || isSameDay(parsedPaymentDate, secondQuinzenaData.startDate!)) &&
                     (isBefore(parsedPaymentDate, secondQuinzenaData.endDate) || isSameDay(parsedPaymentDate, secondQuinzenaData.endDate));
            })
            .forEach(p => {
              if (p.valor > 0) {
                secondQuinzenaData.valorAcumulado += p.valor;
              } else {
                secondQuinzenaData.totalDeducoes += p.valor;
              }
            });
          const totalPeriodValue = secondQuinzenaData.valorAcumulado + secondQuinzenaData.totalDeducoes;
          secondQuinzenaData.valorRestante = secondQuinzenaData.valorMeta - totalPeriodValue;
        }
      }
    }

    // Determine the overall next quinzena (the very next one, regardless of month)
    const allUserQuinzenasSorted = quinzenasPagamento
      .filter(q => q.usuario_id === user.id)
      .sort((a, b) => {
        const dateA = parseISO(a.data_fim);
        const dateB = parseISO(b.data_fim);
        if (!isValid(dateA) && !isValid(dateB)) return 0;
        if (!isValid(dateA)) return 1;
        if (!isValid(dateB)) return -1;
        return dateA.getTime() - dateB.getTime();
      });

    let overallNextQuinzenaDateCalc: Date | null = null;
    let daysUntilOverallNextQuinzenaCalc: number | null = null;

    const upcomingOverallQuinzenas = allUserQuinzenasSorted.filter(q => {
      const quinzenaDate = startOfDay(parseISO(q.data_fim));
      return isValid(quinzenaDate) && (!isBefore(quinzenaDate, today) || isSameDay(quinzenaDate, today));
    });

    if (upcomingOverallQuinzenas.length > 0) {
      const parsedOverallNextQuinzenaDate = parseISO(upcomingOverallQuinzenas[0].data_fim);
      if (isValid(parsedOverallNextQuinzenaDate)) {
        overallNextQuinzenaDateCalc = parsedOverallNextQuinzenaDate;
        daysUntilOverallNextQuinzenaCalc = differenceInDays(overallNextQuinzenaDateCalc, today);
      }
    }

    return {
      firstQuinzenaData,
      secondQuinzenaData,
      overallNextQuinzenaDate: overallNextQuinzenaDateCalc,
      daysUntilOverallNextQuinzena: daysUntilOverallNextQuinzenaCalc
    };
  }, [user, pagamentosDiarios, quinzenasPagamento]);

  const totalDiariasRecebidas = pagamentosDiarios
    .filter(p => p.status === 'pago' && p.tipo === 'diaria')
    .reduce((sum, p) => sum + p.valor, 0);

  const totalDeducoes = pagamentosDiarios
    .filter(p => p.valor < 0)
    .reduce((sum, p) => sum + p.valor, 0); // Já é negativo, então soma diretamente

  const saldoLiquido = totalDiariasRecebidas + totalDeducoes; // Deduções já são negativas

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
      case 'deducao_outros': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'; // New color for 'outros'
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const handleApplyFilter = () => {
    if (!filterStartDate || !filterEndDate) {
      toast.error('Por favor, selecione as datas inicial e final para filtrar.');
      return;
    }
    loadFinancialData(filterStartDate, filterEndDate);
    setIsFiltered(true);
    toast.success('Filtro de datas aplicado!');
  };

  const handleClearFilter = () => {
    const today = new Date();
    const firstDayOfMonth = startOfMonth(today);
    setFilterStartDate(format(firstDayOfMonth, 'yyyy-MM-dd'));
    setFilterEndDate(format(today, 'yyyy-MM-dd'));
    loadFinancialData(format(firstDayOfMonth, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'));
    setIsFiltered(false);
    toast.info('Filtro de datas limpo. Exibindo o mês atual.');
  };

  return (
    <div className="space-y-6">
      <Card className="vixxe-shadow rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <DollarSign className="w-5 h-5" />
            Meu Financeiro
          </CardTitle>
          <CardDescription>
            Acompanhe seus pagamentos diários, deduções e datas de quinzena.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros de Período */}
          <Card className="vixxe-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Filtrar por Período
              </CardTitle>
              <CardDescription>
                Selecione o período para visualizar seus lançamentos financeiros.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end flex-wrap">
                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor="filter-start-date">Data Inicial</Label>
                  <Input
                    id="filter-start-date"
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor="filter-end-date">Data Final</Label>
                  <Input
                    id="filter-end-date"
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleApplyFilter} variant="vixxe">
                    <Filter className="w-4 h-4" />
                    Filtrar
                  </Button>
                  {isFiltered && (
                    <Button onClick={handleClearFilter} variant="outline">
                      <RotateCcw className="w-4 h-4" />
                      Mês Atual
                    </Button>
                  )}
                </div>
              </div>
              {isFiltered && (
                <div className="mt-3 text-sm text-muted-foreground">
                  Exibindo dados de {isValid(parseISO(filterStartDate)) ? format(parseISO(filterStartDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Data Inválida'} até {isValid(parseISO(filterEndDate)) ? format(parseISO(filterEndDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Data Inválida'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cards de Resumo Financeiro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {firstQuinzenaData.isConfigured && (
              <div className="p-4 bg-primary/10 rounded-lg flex flex-col items-start">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="w-4 h-4" />
                  {firstQuinzenaData.label}
                </div>
                <p className="text-2xl font-bold text-primary mt-1">
                  R$ {(firstQuinzenaData.valorAcumulado + firstQuinzenaData.totalDeducoes).toFixed(2).replace('.', ',')}
                </p>
                {firstQuinzenaData.totalDeducoes < 0 && (
                  <Badge className="mt-2" variant="destructive">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Deduções: R$ {Math.abs(firstQuinzenaData.totalDeducoes).toFixed(2).replace('.', ',')}
                  </Badge>
                )}
                <>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Meta: R$ {firstQuinzenaData.valorMeta.toFixed(2).replace('.', ',')}
                    <p className={`font-bold ${firstQuinzenaData.valorRestante <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Restante: R$ {firstQuinzenaData.valorRestante.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">
                      Período: {firstQuinzenaData.startDate && isValid(firstQuinzenaData.startDate) ? format(firstQuinzenaData.startDate, 'dd/MM', { locale: ptBR }) : 'N/A'} - {firstQuinzenaData.endDate && isValid(firstQuinzenaData.endDate) ? format(firstQuinzenaData.endDate, 'dd/MM', { locale: ptBR }) : 'N/A'}
                    </Badge>
                    <Badge className={getStatusColor(firstQuinzenaData.status)}>
                      {firstQuinzenaData.status === 'agendada' ? 'Agendada' : 'Paga'}
                    </Badge>
                  </div>
                </>
              </div>
            )}

            {secondQuinzenaData.isConfigured && (
              <div className="p-4 bg-primary/10 rounded-lg flex flex-col items-start">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="w-4 h-4" />
                  {secondQuinzenaData.label}
                </div>
                <p className="text-2xl font-bold text-primary mt-1">
                  R$ {(secondQuinzenaData.valorAcumulado + secondQuinzenaData.totalDeducoes).toFixed(2).replace('.', ',')}
                </p>
                {secondQuinzenaData.totalDeducoes < 0 && (
                  <Badge className="mt-2" variant="destructive">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Deduções: R$ {Math.abs(secondQuinzenaData.totalDeducoes).toFixed(2).replace('.', ',')}
                  </Badge>
                )}
                <>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Meta: R$ {secondQuinzenaData.valorMeta.toFixed(2).replace('.', ',')}
                    <p className={`font-bold ${secondQuinzenaData.valorRestante <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Restante: R$ {secondQuinzenaData.valorRestante.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">
                      Período: {secondQuinzenaData.startDate && isValid(secondQuinzenaData.startDate) ? format(secondQuinzenaData.startDate, 'dd/MM', { locale: ptBR }) : 'N/A'} - {secondQuinzenaData.endDate && isValid(secondQuinzenaData.endDate) ? format(secondQuinzenaData.endDate, 'dd/MM', { locale: ptBR }) : 'N/A'}
                    </Badge>
                    <Badge className={getStatusColor(secondQuinzenaData.status)}>
                      {secondQuinzenaData.status === 'agendada' ? 'Agendada' : 'Paga'}
                    </Badge>
                  </div>
                </>
              </div>
            )}

            {overallNextQuinzenaDate && isValid(overallNextQuinzenaDate) && (
              <div className="p-4 bg-blue-500/10 rounded-lg flex flex-col items-start">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="w-4 h-4" />
                  Próxima Quinzena
                </div >
                <p className="text-2xl font-bold text-blue-500 mt-1">
                  {format(overallNextQuinzenaDate, 'dd/MM/yyyy', { locale: ptBR })}
                </p>
                {daysUntilOverallNextQuinzena !== null && (
                  <Badge className="mt-2" variant="default">
                    <Clock className="w-3 h-3 mr-1" />
                    {daysUntilOverallNextQuinzena === 0 ? 'É hoje!' : `Faltam ${daysUntilOverallNextQuinzena} dia(s)`}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Gráfico de Pagamentos Diários */}
          <Card className="vixxe-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Lançamentos Financeiros
              </CardTitle>
              <CardDescription>
                Valores de diárias e deduções por dia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Carregando lançamentos...
                  </div>
                ) : dailyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(value) => `R$ ${value.toFixed(2).replace('.', ',')}`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`R$ ${value.toFixed(2).replace('.', ',')}`, 'Valor']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    icon={TrendingUp}
                    title="Sem lançamentos registrados"
                    description="Nenhum pagamento ou dedução foi registrado para você ainda."
                    iconClassName="text-primary"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Histórico Detalhado de Lançamentos */}
          <Card className="vixxe-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Resumo e Histórico de Pagamentos
              </CardTitle>
              <CardDescription>
                Seu resumo financeiro e todos os seus pagamentos e deduções.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Novo Card de Resumo de Totais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-500/10 rounded-lg flex flex-col items-start">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <PlusCircle className="w-4 h-4" />
                    Diárias Recebidas
                  </div>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    R$ {totalDiariasRecebidas.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div className="p-4 bg-red-500/10 rounded-lg flex flex-col items-start">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MinusCircle className="w-4 h-4" />
                    Total de Deduções
                  </div>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    R$ {Math.abs(totalDeducoes).toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div className="p-4 bg-blue-500/10 rounded-lg flex flex-col items-start">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    Saldo Líquido
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    R$ {saldoLiquido.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <h3 className="font-semibold text-lg mb-3">Lançamentos Detalhados</h3>
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center py-4 text-muted-foreground">Carregando histórico...</div>
                ) : pagamentosDiarios.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Nenhum lançamento financeiro.</p>
                ) : (
                  pagamentosDiarios.map(p => (
                    <div key={p.id} className={cn(
                      p.tipo && p.tipo.startsWith('deducao') ? 'bg-red-500/5 border border-red-500/20' : 'bg-muted/30',
                      'flex justify-between items-center p-3 rounded-lg'
                    )}>
                      <div>
                        <p className="font-medium">{isValid(parseISO(p.data_pagamento)) ? format(parseISO(p.data_pagamento), 'dd/MM/yyyy', { locale: ptBR }) : 'Data Inválida'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getTipoColor(p.tipo || '')}>
                            {p.tipo === 'diaria' ? 'Diária' : p.tipo === 'deducao_falta' ? 'Falta' : p.tipo === 'deducao_atraso' ? 'Atraso' : p.tipo === 'deducao_outros' ? 'Outros' : 'Desconhecido'}
                          </Badge>
                          <Badge className={getStatusColor(p.status || '')}>{p.status === 'pendente' ? 'Pendente' : 'Pago'}</Badge>
                        </div>
                        {p.observacoes && <p className="text-xs text-muted-foreground mt-1">{p.observacoes}</p>}
                      </div>
                      <p className={cn("text-lg font-bold", p.valor < 0 ? 'text-red-600' : 'text-green-600')}>
                        R$ {p.valor.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agenda de Quinzenas */}
          <Card className="vixxe-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Agenda de Quinzenas
              </CardTitle>
              <CardDescription>
                Suas datas de recebimento de quinzena.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {loading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Carregando agenda...
                </div>
              ) : markedDates.length > 0 ? (
                <Calendar
                  mode="multiple"
                  selected={markedDates}
                  className="rounded-md border"
                  locale={ptBR}
                  modifiers={{
                    quinzena: markedDates,
                  }}
                  modifiersClassNames={{
                    quinzena: 'bg-primary text-primary-foreground rounded-full',
                  }}
                />
              ) : (
                <EmptyState
                  icon={CalendarDays}
                  title="Sem quinzenas agendadas"
                  description="Nenhuma data de quinzena foi agendada para você ainda."
                  iconClassName="text-primary"
                />
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}