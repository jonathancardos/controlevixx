import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/order-parser";
import { TrendingUp, Calendar, Download, DollarSign, CreditCard, Banknote, Filter, RotateCcw, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { useComandas } from "@/hooks/useSupabase"; // Importar useComandas
import { Comanda, FiltroComandas } from "@/types/supabase"; // Importar Comanda e FiltroComandas
import { format, parseISO, subDays, isValid } from "date-fns"; // Importar subDays, endOfMonth e isValid
import { ptBR } from "date-fns/locale"; // Importar ptBR
import { supabase } from '@/integrations/supabase/client'; // Importar o cliente Supabase

interface PaymentSummary {
  method: string;
  total: number;
  count: number;
  percentage: number;
}

interface SalesData {
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  paymentSummary: PaymentSummary[];
  periodComparison: {
    previousTotal: number;
    growth: number;
    growthPercentage: number;
  };
}

export function SalesTab() {
  const { comandas, loading, carregarComandas } = useComandas(); // Usar useComandas
  const [filteredComandas, setFilteredComandas] = useState<Comanda[]>([]);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);

  // Set default dates (today) and load initial data
  useEffect(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    setStartDate(todayStr);
    setEndDate(todayStr);
    
    // Load initial data for today
    carregarComandas({ dataInicio: todayStr, dataFim: todayStr, status: 'Processada' });
  }, [carregarComandas]);

  // Recalculate sales data whenever 'comandas' from the hook changes
  useEffect(() => {
    setFilteredComandas(comandas); // Update filteredComandas with the latest fetched data
    calculateSalesData(comandas);
  }, [comandas]);

  const applyDateFilter = useCallback(() => {
    if (!startDate || !endDate) {
      toast.error("Selecione as datas inicial e final");
      return;
    }

    carregarComandas({ dataInicio: startDate, dataFim: endDate, status: 'Processada' });
    setIsFiltered(true);
    
    toast.success(`Vendas encontradas no período de ${format(parseISO(startDate), 'dd/MM/yyyy', { locale: ptBR })} a ${format(parseISO(endDate), 'dd/MM/yyyy', { locale: ptBR })}`);
  }, [startDate, endDate, carregarComandas]);

  const clearFilters = useCallback(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    setStartDate(todayStr);
    setEndDate(todayStr);
    carregarComandas({ dataInicio: todayStr, dataFim: todayStr, status: 'Processada' });
    setIsFiltered(false);
    toast.info('Filtro de datas limpo. Exibindo vendas de hoje.');
  }, [carregarComandas]);

  const calculateSalesData = useCallback((currentOrders: Comanda[]) => {
    const totalSales = currentOrders.reduce((sum, order) => sum + order.valor, 0);
    const totalOrders = currentOrders.length;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Payment method summary
    const paymentMethods: { [key: string]: { total: number; count: number } } = {};
    
    currentOrders.forEach(order => {
      const method = order.forma_pagamento || 'Não informado';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { total: 0, count: 0 };
      }
      paymentMethods[method].total += order.valor;
      paymentMethods[method].count += 1;
    });

    const paymentSummary: PaymentSummary[] = Object.entries(paymentMethods).map(([method, data]) => ({
      method,
      total: data.total,
      count: data.count,
      percentage: totalSales > 0 ? (data.total / totalSales) * 100 : 0
    })).sort((a, b) => b.total - a.total);

    // Period comparison (compare with same period length before)
    const parsedStartDate = parseISO(startDate);
    const parsedEndDate = parseISO(endDate);

    if (!isValid(parsedStartDate) || !isValid(parsedEndDate)) {
      console.error("Invalid start or end date for sales data calculation.");
      setSalesData(null); // Clear previous data if dates are invalid
      return;
    }

    const startDateObj = parsedStartDate;
    const endDateObj = parsedEndDate;
    const periodLengthMs = endDateObj.getTime() - startDateObj.getTime();
    const periodLengthDays = Math.max(1, Math.ceil(periodLengthMs / (1000 * 60 * 60 * 24)) + 1);

    const previousEndDate = subDays(startDateObj, 1);
    const previousStartDate = subDays(previousEndDate, periodLengthDays - 1);

    // Add explicit validity checks for previous dates
    if (!isValid(previousStartDate) || !isValid(previousEndDate)) {
      console.error("Invalid previous period dates generated for sales.");
      setSalesData({
        totalSales,
        totalOrders,
        averageTicket,
        paymentSummary,
        periodComparison: {
          previousTotal: 0,
          growth: totalSales,
          growthPercentage: totalSales > 0 ? 100 : 0
        }
      });
      return; // Exit early if previous dates are invalid
    }

    // Fetch previous period data from Supabase
    const fetchPreviousPeriodData = async () => {
      const { data: previousOrdersData, error } = await supabase
        .from('comandas')
        .select('valor')
        .gte('data', format(previousStartDate, 'yyyy-MM-dd'))
        .lte('data', format(previousEndDate, 'yyyy-MM-dd'))
        .eq('status', 'Processada');

      if (error) {
        console.error('Erro ao carregar dados do período anterior:', error);
        return { previousTotal: 0, previousOrdersCount: 0 };
      }

      const previousTotal = (previousOrdersData || []).reduce((sum, order) => sum + order.valor, 0);
      const previousOrdersCount = (previousOrdersData || []).length;
      return { previousTotal, previousOrdersCount };
    };

    fetchPreviousPeriodData().then(({ previousTotal, previousOrdersCount }) => {
      const growth = totalSales - previousTotal;
      const growthPercentage = previousTotal > 0 ? (growth / previousTotal) * 100 : 0;

      setSalesData({
        totalSales,
        totalOrders,
        averageTicket,
        paymentSummary,
        periodComparison: {
          previousTotal,
          growth,
          growthPercentage
        }
      });
    });
  }, [startDate, endDate, supabase]);

  const exportToCSV = useCallback(() => {
    if (filteredComandas.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    const csvContent = [
      ['ID', 'Cliente', 'Data', 'Total', 'Forma de Pagamento', 'Status'].join(','),
      ...filteredComandas.map(order => [
        order.id,
        `"${(order.cliente_nome || '').replace(/"/g, '""')}"`,
        order.data,
        order.valor.toString().replace('.', ','),
        `"${order.forma_pagamento || ''}"`,
        order.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vendas_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Relatório exportado com sucesso!");
  }, [filteredComandas, startDate, endDate]);

  const getPaymentIcon = (method: string) => {
    const normalizedMethod = method.toLowerCase();
    if (normalizedMethod.includes('pix')) return <DollarSign className="w-4 h-4" />;
    if (normalizedMethod.includes('cartão') || normalizedMethod.includes('card')) return <CreditCard className="w-4 h-4" />;
    if (normalizedMethod.includes('dinheiro')) return <Banknote className="w-4 h-4" />;
    return <DollarSign className="w-4 h-4" />;
  };

  const hasAnyData = filteredComandas.length > 0;

  return (
    <div className="space-y-6">
      {/* Date Filters */}
      <Card className="vixxe-shadow rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Filtros de Período
          </CardTitle>
          <CardDescription>
            Selecione o período para análise das vendas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={applyDateFilter} variant="vixxe" disabled={loading}>
                <Filter className="w-4 h-4" />
                Filtrar
              </Button>
              {isFiltered && (
                <Button onClick={clearFilters} variant="outline" disabled={loading}>
                  <RotateCcw className="w-4 h-4" />
                  Hoje
                </Button>
              )}
              {hasAnyData && (
                <Button onClick={exportToCSV} variant="outline" disabled={loading}>
                  <Download className="w-4 h-4" />
                  Exportar
                </Button>
              )}
            </div>
          </div>
          {isFiltered && (
            <div className="mt-3 text-sm text-muted-foreground">
              Período selecionado: {format(parseISO(startDate), 'dd/MM/yyyy', { locale: ptBR })} até {format(parseISO(endDate), 'dd/MM/yyyy', { locale: ptBR })}
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <Card className="vixxe-shadow rounded-xl">
          <CardContent className="text-center py-8 text-muted-foreground">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
            Carregando dados de vendas...
          </CardContent>
        </Card>
      ) : hasAnyData ? (
        <>
          {/* Sales Overview */}
          {salesData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="vixxe-shadow rounded-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Receita Total
                      </p>
                      <p className="text-2xl font-bold">{formatCurrency(salesData.totalSales)}</p>
                      {salesData.periodComparison.growthPercentage !== 0 && (
                        <Badge 
                          variant={salesData.periodComparison.growth >= 0 ? "default" : "destructive"} 
                          className="text-xs mt-1"
                        >
                          {salesData.periodComparison.growth >= 0 ? '+' : ''}{salesData.periodComparison.growthPercentage.toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="vixxe-shadow rounded-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <DollarSign className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Ticket Médio
                      </p>
                      <p className="text-2xl font-bold">{formatCurrency(salesData.averageTicket)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="vixxe-shadow rounded-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <CreditCard className="w-6 h-6 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total de Vendas
                      </p>
                      <p className="text-2xl font-bold">{salesData.totalOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="vixxe-shadow rounded-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted/10 rounded-lg">
                      <Banknote className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Período Anterior
                      </p>
                      <p className="text-2xl font-bold">{formatCurrency(salesData.periodComparison.previousTotal)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payment Methods Breakdown */}
          {salesData && salesData.paymentSummary.length > 0 && (
            <Card className="vixxe-shadow rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Vendas por Forma de Pagamento
                </CardTitle>
                <CardDescription>
                  Distribuição das vendas por método de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesData.paymentSummary.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-background/30 rounded-lg hover:bg-background/50 transition-colors hover-scale fade-in">
                      <div className="flex items-center gap-3">
                        {getPaymentIcon(payment.method)}
                        <div>
                          <p className="font-semibold">{payment.method}</p>
                          <p className="text-sm text-muted-foreground">{payment.count} transação{payment.count !== 1 ? 'ões' : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(payment.total)}</p>
                        <p className="text-sm text-muted-foreground">{payment.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress Visualization */}
          {salesData && salesData.paymentSummary.length > 0 && (
            <Card className="vixxe-shadow rounded-xl">
              <CardHeader>
                <CardTitle>Distribuição Visual</CardTitle>
                <CardDescription>
                  Representação visual da distribuição por forma de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {salesData.paymentSummary.map((payment, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          {getPaymentIcon(payment.method)}
                          {payment.method}
                        </span>
                        <span className="font-semibold">{payment.percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={payment.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="vixxe-shadow rounded-xl">
          <CardContent>
            <EmptyState
              icon={ShoppingCart}
              title="Nenhuma venda encontrada"
              description="Não há vendas registradas para o período selecionado. Tente ajustar os filtros ou registrar novas comandas."
              iconClassName="text-primary"
            >
              <Button onClick={clearFilters} variant="outline">
                Ver vendas de hoje
              </Button>
            </EmptyState>
          </CardContent>
        </Card>
      )}
    </div>
  );
}