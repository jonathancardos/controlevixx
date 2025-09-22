"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ChartData, ClientData } from "@/types/dashboard";
import { formatCurrency } from "@/lib/order-parser";
import { BarChart3, TrendingUp, Users, DollarSign, MessageCircle, Crown, Calendar, PieChart as PieChartIcon, Send, LineChart as LineChartIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { toast } from "sonner";
import { TopClientsRanking } from "../insights/FidelityCard";
import { VipFidelitySystem } from "../insights/VipFidelitySystem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { useComandas, useClientes } from "@/hooks/useSupabase"; // Importar useComandas e useClientes
import { Comanda } from "@/types/supabase"; // Importar Comanda
import { format, parseISO, subDays, endOfMonth, isValid } from "date-fns"; // Importar subDays, endOfMonth e isValid
import { supabase } from '@/integrations/supabase/client'; // Importar o cliente Supabase

interface PaymentChartData {
  method: string;
  total: number;
  count: number;
  [key: string]: any;
}

interface PeriodInsights {
  currentRevenue: number;
  previousRevenue: number;
  growth: number;
  growthPercentage: number;
  currentOrders: number;
  previousOrders: number;
}

export function InsightsTab() {
  const { comandas, loading: comandasLoading, carregarComandas } = useComandas();
  const { clientes, loading: clientesLoading } = useClientes(); // Para obter dados de clientes
  const [filteredComandas, setFilteredComandas] = useState<Comanda[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [paymentChartData, setPaymentChartData] = useState<PaymentChartData[]>([]);
  const [topClients, setTopClients] = useState<ClientData[]>([]);
  const [periodInsights, setPeriodInsights] = useState<PeriodInsights | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Set default dates (last 30 days) and load initial data
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 29); // 30 days including today
    
    setStartDate(format(thirtyDaysAgo, 'yyyy-MM-dd'));
    setEndDate(format(today, 'yyyy-MM-dd'));
    
    // Load initial data
    carregarComandas({ dataInicio: format(thirtyDaysAgo, 'yyyy-MM-dd'), dataFim: format(today, 'yyyy-MM-dd'), status: 'Processada' });
  }, [carregarComandas]);

  // Recalculate insights whenever 'comandas' from the hook changes
  useEffect(() => {
    setFilteredComandas(comandas);
    processChartData(comandas);
    processPaymentData(comandas);
    processTopClients(comandas);
    processPeriodInsights(comandas);
  }, [comandas]);

  const loadInsights = useCallback(() => {
    carregarComandas({ dataInicio: startDate, dataFim: endDate, status: 'Processada' });
  }, [startDate, endDate, carregarComandas]);

  const processChartData = (currentOrders: Comanda[]) => {
    const dailyTotals: Record<string, number> = {};
    
    currentOrders.forEach(order => {
      const date = format(parseISO(order.data), 'dd/MM/yyyy'); // Format to dd/MM/yyyy for chart
      dailyTotals[date] = (dailyTotals[date] || 0) + order.valor;
    });

    const data = Object.entries(dailyTotals)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('/').map(Number);
        const [dayB, monthB, yearB] = b.date.split('/').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        return dateA.getTime() - dateB.getTime();
      });
    
    setChartData(data);
  };

  const processPaymentData = (currentOrders: Comanda[]) => {
    const paymentMethods: Record<string, { total: number; count: number }> = {};
    
    currentOrders.forEach(order => {
      const method = order.forma_pagamento || 'Não informado';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { total: 0, count: 0 };
      }
      paymentMethods[method].total += order.valor;
      paymentMethods[method].count += 1;
    });

    const data = Object.entries(paymentMethods)
      .map(([method, data]) => ({
        method,
        total: data.total,
        count: data.count
      }))
      .sort((a, b) => b.total - a.total);
    
    setPaymentChartData(data);
  };

  const processTopClients = (currentOrders: Comanda[]) => {
    const clientTotals: Record<string, number> = {};
    
    currentOrders.forEach(order => {
      const client = order.cliente_nome || 'Cliente sem nome';
      clientTotals[client] = (clientTotals[client] || 0) + order.valor;
    });

    const clientsData = Object.entries(clientTotals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    
    setTopClients(clientsData);
  };

  const processPeriodInsights = useCallback(async (currentOrders: Comanda[]) => {
    const currentRevenue = currentOrders.reduce((sum, order) => sum + order.valor, 0);
    const currentOrdersCount = currentOrders.length;

    // Calculate previous period
    const startDateObj = parseISO(startDate);
    const endDateObj = parseISO(endDate);
    
    if (!isValid(startDateObj) || !isValid(endDateObj)) {
      console.error("Invalid start or end date for insights period calculation.");
      setPeriodInsights(null);
      return;
    }

    const periodLengthMs = endDateObj.getTime() - startDateObj.getTime();
    const periodLengthDays = Math.ceil(periodLengthMs / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day

    const previousEndDate = subDays(startDateObj, 1);
    const previousStartDate = subDays(previousEndDate, periodLengthDays - 1);

    // Add explicit validity checks for previous dates
    if (!isValid(previousStartDate) || !isValid(previousEndDate)) {
      console.error("Invalid previous period dates generated for insights.");
      setPeriodInsights({
        currentRevenue,
        previousRevenue: 0,
        growth: currentRevenue,
        growthPercentage: currentRevenue > 0 ? 100 : 0,
        currentOrders: currentOrdersCount,
        previousOrders: 0
      });
      return; // Exit early
    }

    // Fetch previous period data from Supabase
    const { data: previousOrdersData, error } = await supabase
      .from('comandas')
      .select('valor')
      .gte('data', format(previousStartDate, 'yyyy-MM-dd'))
      .lte('data', format(previousEndDate, 'yyyy-MM-dd'))
      .eq('status', 'Processada');

    if (error) {
      console.error('Erro ao carregar dados do período anterior para insights:', error);
      toast.error('Erro ao carregar dados do período anterior.');
      return;
    }

    const previousRevenue = (previousOrdersData || []).reduce((sum, order) => sum + order.valor, 0);
    const previousOrdersCount = (previousOrdersData || []).length;

    const growth = currentRevenue - previousRevenue;
    const growthPercentage = previousRevenue > 0 ? (growth / previousRevenue) * 100 : 0;

    setPeriodInsights({
      currentRevenue,
      previousRevenue,
      growth,
      growthPercentage,
      currentOrders: currentOrdersCount,
      previousOrders: previousOrdersCount
    });
  }, [startDate, endDate, supabase]);

  const generateVipMessage = (client: ClientData) => {
    const clientName = client?.name || 'Cliente';
    const clientTotal = client?.total || 0;

    const messages = [
      `Olá ${clientName}! 🌟 Você é nosso cliente VIP com ${formatCurrency(clientTotal)} em compras! Obrigado pela sua fidelidade! 💜`,
      `${clientName}, você é incrível! 👑 Já são ${formatCurrency(clientTotal)} em pedidos conosco. Que tal experimentar nosso prato especial hoje?`,
      `Parabéns ${clientName}! 🎉 Você está entre nossos clientes mais especiais. Preparamos algo especial para você! 💫`,
      `Oi ${clientName}! 💜 Você já investiu ${formatCurrency(clientTotal)} em momentos deliciosos conosco. Obrigado por escolher sempre a gente!`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const openWhatsAppDialog = (client: ClientData) => {
    setSelectedClient(client);
    setWhatsappMessage(generateVipMessage(client));
    // Tenta encontrar o telefone do cliente no banco de dados
    const clientFromDb = clientes.find(c => c.nome === client.name);
    setWhatsappNumber(clientFromDb?.telefone || "");
  };

  const sendWhatsAppMessage = () => {
    if (!selectedClient) {
      toast.error("Nenhum cliente selecionado para enviar mensagem.");
      return;
    }
    if (!whatsappNumber.trim()) {
      toast.error("Digite o número do WhatsApp");
      return;
    }
    
    if (!whatsappMessage.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/55${whatsappNumber.replace(/\D/g, '')}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    setSelectedClient(null);
    toast.success("WhatsApp aberto com a mensagem!");
  };

  const totalRevenue = filteredComandas.reduce((sum, order) => sum + order.valor, 0);
  const averageOrder = filteredComandas.length > 0 ? totalRevenue / filteredComandas.length : 0;
  const todaysOrders = filteredComandas.filter(order => 
    order.data === format(new Date(), 'yyyy-MM-dd')
  ).length;

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const hasAnyData = filteredComandas.length > 0;

  return (
    <>
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 rounded-xl p-1 shadow-inner">
          <TabsTrigger value="analytics" className="data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="vip-system" className="data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white">
            <Crown className="w-4 h-4 mr-2" />
            Sistema VIP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <div className="space-y-6">
            {/* Date Filters */}
            <Card className="vixxe-shadow rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Período de Análise
                </CardTitle>
                <CardDescription>
                  Selecione o período para análise dos insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end flex-wrap">
                  <div className="flex-1 min-w-[150px]">
                    <Label htmlFor="insights-start-date">Data Inicial</Label>
                    <Input
                      id="insights-start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <Label htmlFor="insights-end-date">Data Final</Label>
                    <Input
                      id="insights-end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <Button onClick={loadInsights} variant="vixxe" disabled={comandasLoading}>
                    <TrendingUp className="w-4 h-4" />
                    Atualizar Insights
                  </Button>
                </div>
              </CardContent>
            </Card>

            {comandasLoading ? (
              <Card className="vixxe-shadow rounded-xl">
                <CardContent className="text-center py-8 text-muted-foreground">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                  Carregando dados de insights...
                </CardContent>
              </Card>
            ) : hasAnyData ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="vixxe-shadow rounded-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Receita Total
                          </p>
                          <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                          {periodInsights && (
                            <Badge 
                              variant={periodInsights.growth >= 0 ? "default" : "destructive"} 
                              className="text-xs mt-1"
                            >
                              {periodInsights.growth >= 0 ? '+' : ''}{periodInsights.growthPercentage.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                        <DollarSign className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="vixxe-shadow rounded-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Ticket Médio
                          </p>
                          <p className="text-2xl font-bold">{formatCurrency(averageOrder)}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="vixxe-shadow rounded-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Total de Pedidos
                          </p>
                          <p className="text-2xl font-bold">{filteredComandas.length}</p>
                          {periodInsights && (
                            <Badge 
                              variant={periodInsights.currentOrders >= periodInsights.previousOrders ? "default" : "destructive"} 
                              className="text-xs mt-1"
                            >
                              {periodInsights.currentOrders >= periodInsights.previousOrders ? '+' : ''} 
                              {periodInsights.currentOrders - periodInsights.previousOrders}
                            </Badge>
                          )}
                        </div>
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="vixxe-shadow rounded-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Pedidos Hoje
                          </p>
                          <p className="text-2xl font-bold">{todaysOrders}</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Line Chart */}
                  <Card className="vixxe-shadow rounded-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LineChartIcon className="w-5 h-5" />
                        Vendas por Data
                      </CardTitle>
                      <CardDescription>Evolução das vendas no período</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis 
                                dataKey="date" 
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                              />
                              <YAxis 
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickFormatter={(value) => `R$ ${value}`}
                              />
                              <Tooltip 
                                formatter={(value: number) => [formatCurrency(value), 'Total']}
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--card))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px'
                                }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="total" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={3}
                                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <EmptyState
                            icon={LineChartIcon}
                            title="Sem dados de vendas"
                            description="Não há dados suficientes para gerar o gráfico de vendas por data."
                            iconClassName="text-muted-foreground"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Methods Chart */}
                  <Card className="vixxe-shadow rounded-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5" />
                        Formas de Pagamento
                      </CardTitle>
                      <CardDescription>Distribuição por método de pagamento</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {paymentChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={paymentChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="total"
                                nameKey="method"
                              >
                                {paymentChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: number) => [formatCurrency(value), 'Total']}
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--card))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px'
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <EmptyState
                            icon={PieChartIcon}
                            title="Sem dados de pagamento"
                            description="Não há dados suficientes para gerar o gráfico de formas de pagamento."
                            iconClassName="text-muted-foreground"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Clients with WhatsApp Integration */}
                <Card className="vixxe-shadow rounded-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="w-5 h-5" />
                      Top Clientes VIP
                    </CardTitle>
                    <CardDescription>Clientes com maior volume de compras - Envie mensagens personalizadas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topClients.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {topClients.slice(0, 6).map((client, index) => (
                          <div key={client.name} className="p-4 bg-background/30 rounded-lg border hover:bg-background/50 transition-colors fade-in">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: COLORS[index % COLORS.length]} }
                                />
                                <span className="font-semibold">{client.name}</span>
                                {index < 3 && <Crown className="w-4 h-4 text-yellow-500" />}
                              </div>
                              <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                                {index === 0 ? "🥇 VIP" : index === 1 ? "🥈 Gold" : index === 2 ? "🥉 Silver" : "⭐ Top"}
                              </Badge>
                            </div>
                            <div className="text-right mb-3">
                              <p className="text-lg font-bold">{formatCurrency(client.total)}</p>
                              <p className="text-xs text-muted-foreground">Total em compras</p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => openWhatsAppDialog(client)}
                            >
                              <MessageCircle className="w-4 h-4" />
                              Enviar WhatsApp
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Crown}
                        title="Nenhum cliente VIP encontrado"
                        description="Comece a registrar vendas para identificar seus seus clientes mais valiosos."
                        iconClassName="text-yellow-500"
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Cartões de Fidelidade */}
                {topClients.length > 0 && (
                  <TopClientsRanking 
                    clientes={topClients.map((client, index) => ({
                      id: clientes.find(c => c.nome === client.name)?.id || (index + 1).toString(), // Usar ID real se encontrado
                      nome: client.name,
                      total_gasto: client.total,
                      total_pedidos: comandas.filter(c => c.cliente_nome === client.name).length, // Contagem real de pedidos
                      categoria: client.total >= 1000 ? 'premium' : client.total >= 500 ? 'vip' : client.total >= 200 ? 'regular' : 'novo',
                      pontos_fidelidade: Math.floor(client.total / 10), // 1 ponto a cada R$10
                      created_at: new Date().toISOString()
                    }))}
                  />
                )}
              </>
            ) : (
              <Card className="vixxe-shadow rounded-xl">
                <CardContent>
                  <EmptyState
                    icon={TrendingUp}
                    title="Sem dados de Insights"
                    description="Não há dados de vendas para gerar insights. Registre algumas comandas para começar a ver suas métricas!"
                    iconClassName="text-primary"
                  >
                    <Button onClick={() => { /* navigate to pdv tab */ }} variant="vixxe">
                      Registrar Comanda
                    </Button>
                  </EmptyState>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="vip-system">
          <VipFidelitySystem />
        </TabsContent>
      </Tabs>

      {/* WhatsApp Dialog - Moved outside TabsContent */}
      <Dialog open={selectedClient !== null} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Enviar Mensagem VIP para {selectedClient?.name}
            </DialogTitle>
            <DialogDescription>
              Cliente com {selectedClient && formatCurrency(selectedClient.total)} em compras
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="whatsapp-number">Número do WhatsApp (apenas números)</Label>
              <Input
                id="whatsapp-number"
                placeholder="11999999999"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="whatsapp-message">Mensagem</Label>
              <Textarea
                id="whatsapp-message"
                placeholder="Digite sua mensagem personalizada..."
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => selectedClient && setWhatsappMessage(generateVipMessage(selectedClient))}
              >
                Gerar Nova Mensagem
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedClient(null)}>
              Cancelar
            </Button>
            <Button onClick={sendWhatsAppMessage} className="vixxe-gradient">
              <Send className="w-4 h-4" />
              Enviar WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}