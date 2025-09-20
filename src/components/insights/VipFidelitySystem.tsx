"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Award, Crown, TrendingUp, Calendar, Gift, Star, Trophy, Medal, Target, Users, DollarSign, Package, RotateCcw, Globe, Plus, Clock, ChevronDown, ChevronUp, History, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/order-parser';
import { format, addDays, parseISO, startOfWeek, startOfMonth, differenceInDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useVipSystem } from '@/hooks/useVipSystem';
import { useClientes } from '@/hooks/useSupabase';
import { Cliente } from '@/types/supabase';
import { EmptyState } from '@/components/shared/EmptyState';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VipHistorySheet } from './VipHistorySheet';

interface VipStatusDisplay {
  cliente_id: string;
  cliente_nome: string;
  is_vip: boolean;
  vip_combo_available: boolean;
  valor_gasto_semana: number;
  pedidos_semana: number;
  progresso_valor: number;
  progresso_pedidos: number;
  nivel_vip: string;
  meta_valor_semanal: number;
  meta_pedidos_semanal: number;
  weekEndDate: Date | null;
  monthEndDate: Date | null;
  daysUntilWeekEnd: number | null;
  daysUntilMonthEnd: number | null;
}

export function VipFidelitySystem() {
  const { 
    loading, 
    calcularStatusVip, 
    resetarStatusVipSemanal, 
    obterRankingSemanal, 
    obterRankingMensal, 
    configurarMetasCliente,
    obterHistoricoVip,
    getWeekEndDate, 
    getMonthEndDate, 
  } = useVipSystem();
  const { clientes, carregarClientes, atualizarDatasGlobaisClientes } = useClientes();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [rankingSemanal, setRankingSemanal] = useState<any[]>([]);
  const [rankingMensal, setRankingMensal] = useState<any[]>([]);
  const [vipStatusClientes, setVipStatusClientes] = useState<VipStatusDisplay[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | null>(null);

  const [isVipHistorySheetOpen, setIsVipHistorySheetOpen] = useState(false);
  const [selectedClientVipHistory, setSelectedClientVipHistory] = useState<any[]>([]);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Cliente | null>(null);
  const [currentWeekMonthVipStatus, setCurrentWeekMonthVipStatus] = useState<{ currentWeekStatus: any, currentMonthStatus: any } | null>(null);


  const [globalVipSettings, setGlobalVipSettings] = useState({
    default_meta_valor_semanal: 100,
    default_meta_pedidos_semanal: 4,
    valor_combo_vip: 27,
    default_week_start_date: format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd'),
    default_month_start_date: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const [clientPersonalSettings, setClientPersonalSettings] = useState({
    meta_valor_semanal: 0,
    meta_pedidos_semanal: 0,
    admin_set_week_start_date: '' as string | null,
    admin_set_month_start_date: '' as string | null,
  });

  const [globalDatesForm, setGlobalDatesForm] = useState({
    weekStartDate: '' as string | null,
    monthStartDate: '' as string | null,
  });

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  useEffect(() => {
    if (selectedClienteId) {
      const client = clientes.find(c => c.id === selectedClienteId);
      if (client) {
        setClientPersonalSettings({
          meta_valor_semanal: client.meta_valor_semanal || globalVipSettings.default_meta_valor_semanal,
          meta_pedidos_semanal: client.meta_pedidos_semanal || globalVipSettings.default_meta_pedidos_semanal,
          admin_set_week_start_date: client.admin_set_week_start_date || '',
          admin_set_month_start_date: client.admin_set_month_start_date || '',
        });
      }
    } else {
      setClientPersonalSettings({
        meta_valor_semanal: globalVipSettings.default_meta_valor_semanal,
        meta_pedidos_semanal: globalVipSettings.default_meta_pedidos_semanal,
        admin_set_week_start_date: '',
        admin_set_month_start_date: '',
      });
    }
  }, [selectedClienteId, clientes, globalVipSettings]);


  useEffect(() => {
    const fetchVipData = async () => {
      if (clientes.length > 0) {
        const today = startOfDay(new Date());
        const statusPromises = clientes.map(async (cliente) => {
          const effectiveWeekStartDateStr = cliente.admin_set_week_start_date || globalVipSettings.default_week_start_date;
          const effectiveMonthStartDateStr = cliente.admin_set_month_start_date || globalVipSettings.default_month_start_date;

          const status = await calcularStatusVip(
            cliente.id,
            effectiveWeekStartDateStr,
            effectiveMonthStartDateStr
          );

          const weekEndDate = getWeekEndDate(effectiveWeekStartDateStr);
          const monthEndDate = getMonthEndDate(effectiveMonthStartDateStr);
          const daysUntilWeekEnd = differenceInDays(weekEndDate, today);
          const daysUntilMonthEnd = differenceInDays(monthEndDate, today);
          
          return {
            cliente_id: cliente.id,
            cliente_nome: cliente.nome,
            is_vip: status?.is_vip || false,
            vip_combo_available: status?.vip_combo_available || false,
            valor_gasto_semana: status?.valor_gasto_semana || 0,
            pedidos_semana: status?.pedidos_semana || 0,
            progresso_valor: status?.progresso_valor || 0,
            progresso_pedidos: status?.progresso_pedidos || 0,
            nivel_vip: cliente.nivel_vip || 'Bronze',
            meta_valor_semanal: cliente.meta_valor_semanal || globalVipSettings.default_meta_valor_semanal,
            meta_pedidos_semanal: cliente.meta_pedidos_semanal || globalVipSettings.default_meta_pedidos_semanal,
            weekEndDate,
            monthEndDate,
            daysUntilWeekEnd,
            daysUntilMonthEnd,
          };
        });
        const results = await Promise.all(statusPromises);
        // Sort clients for ranking display by valor_gasto_semana
        results.sort((a, b) => (b.valor_gasto_semana || 0) - (a.valor_gasto_semana || 0));
        setVipStatusClientes(results);
      }
    };

    fetchVipData();
  }, [clientes, calcularStatusVip, globalVipSettings, getWeekEndDate, getMonthEndDate]);

  useEffect(() => {
    const fetchRankings = async () => {
      console.log('Fetching weekly ranking with default_week_start_date:', globalVipSettings.default_week_start_date);
      const semanal = await obterRankingSemanal(globalVipSettings.default_week_start_date);
      setRankingSemanal(semanal);

      const currentYear = parseInt(format(new Date(), 'yyyy'));
      const currentMonth = parseInt(format(new Date(), 'MM'));
      console.log('Fetching monthly ranking with year:', currentYear, 'month:', currentMonth);
      const mensal = await obterRankingMensal(
        currentYear,
        currentMonth
      );
      setRankingMensal(mensal);
    };
    fetchRankings();
  }, [obterRankingSemanal, obterRankingMensal, globalVipSettings.default_week_start_date]);

  const handleConfigurarMetas = async () => {
    if (!selectedClienteId) {
      toast.error('Selecione um cliente para configurar as metas.');
      return;
    }
    const cliente = clientes.find(c => c.id === selectedClienteId);
    if (!cliente) return;

    const success = await configurarMetasCliente(
      selectedClienteId,
      clientPersonalSettings.meta_valor_semanal,
      clientPersonalSettings.meta_pedidos_semanal,
      clientPersonalSettings.admin_set_week_start_date,
      clientPersonalSettings.admin_set_month_start_date
    );
    if (success) {
      carregarClientes(); // Recarregar clientes para atualizar a UI
    }
  };

  const handleResetSemanal = async () => {
    const success = await resetarStatusVipSemanal();
    if (success) {
      carregarClientes();
    }
  };

  const handleApplyGlobalDates = async () => {
    if (!globalDatesForm.weekStartDate && !globalDatesForm.monthStartDate) {
      toast.error('Selecione pelo menos uma data para aplicar globalmente.');
      return;
    }
    const result = await atualizarDatasGlobaisClientes(
      globalDatesForm.weekStartDate,
      globalDatesForm.monthStartDate
    );
    if (result) {
      setGlobalDatesForm({ weekStartDate: '', monthStartDate: '' }); // Clear form after applying
      carregarClientes(); // Reload clients to reflect global changes
    }
  };

  const handleViewVipHistory = async (cliente: Cliente) => {
    if (!cliente.id) return;
    setSelectedClientForHistory(cliente);
    const fullHistory = await obterHistoricoVip(cliente.id);
    if (fullHistory) {
      setSelectedClientVipHistory(fullHistory.historyData);
      setCurrentWeekMonthVipStatus({
        currentWeekStatus: fullHistory.currentWeekStatus,
        currentMonthStatus: fullHistory.currentMonthStatus,
      });
    } else {
      setSelectedClientVipHistory([]);
      setCurrentWeekMonthVipStatus(null);
    }
    setIsVipHistorySheetOpen(true);
  };

  const getRankingBadge = (posicao: number) => {
    if (posicao === 1) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (posicao === 2) return <Medal className="w-4 h-4 text-gray-400" />;
    if (posicao === 3) return <Award className="w-4 h-4 text-amber-600" />;
    return <span className="w-4 h-4 flex items-center justify-center text-sm font-bold">{posicao}</span>;
  };

  const getVipLevelBadge = (nivel: string, isVip: boolean) => {
    if (!isVip) return <Badge variant="outline">Cliente</Badge>;
    
    switch (nivel) {
      case 'Premium':
        return <Badge className="bg-yellow-500 text-yellow-900"><Crown className="w-3 h-3 mr-1" />Premium</Badge>;
      case 'VIP':
        return <Badge className="bg-purple-500 text-purple-100"><Star className="w-3 h-3 mr-1" />VIP</Badge>;
      case 'Regular':
        return <Badge className="bg-blue-500 text-blue-100"><Star className="w-3 h-3 mr-1" />Regular</Badge>;
      default:
        return <Badge className="bg-gray-500 text-gray-100"><Star className="w-3 h-3 mr-1" />Novo</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="vixxe-shadow rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Sistema de Fidelidade VIP
          </CardTitle>
          <CardDescription>
            Gerencie o programa de pontos e premiações para seus clientes mais fiéis.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 rounded-xl p-1 shadow-inner"> {/* Changed grid-cols-4 to grid-cols-3 */}
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="rankings-clientes" className="data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white"> {/* Renamed tab */}
            <Trophy className="w-4 h-4 mr-2" />
            Rankings e Clientes VIP
          </TabsTrigger>
          <TabsTrigger value="configuracoes" className="data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white">
            <Target className="w-4 h-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Crown className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Clientes VIP</p>
                    <p className="text-2xl font-bold">{vipStatusClientes.filter(c => c.is_vip).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Gift className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Combos Disponíveis</p>
                    <p className="text-2xl font-bold">{vipStatusClientes.filter(c => c.vip_combo_available).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Meta Semanal Padrão</p>
                    <p className="text-2xl font-bold">{formatCurrency(globalVipSettings.default_meta_valor_semanal)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Package className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Meta Pedidos Padrão</p>
                    <p className="text-2xl font-bold">{globalVipSettings.default_meta_pedidos_semanal}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Controle Semanal
              </CardTitle>
              <CardDescription>
                A semana VIP é calculada a partir da 'Data de Início da Semana' padrão.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Período Atual da Semana VIP</p>
                  <p className="font-semibold">
                    {format(parseISO(globalVipSettings.default_week_start_date), 'dd/MM/yyyy', { locale: ptBR })} - 
                    {format(getWeekEndDate(globalVipSettings.default_week_start_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                {differenceInDays(getWeekEndDate(globalVipSettings.default_week_start_date), startOfDay(new Date())) >= 0 && (
                  <Badge className="mt-2" variant="default">
                    <Clock className="w-3 h-3 mr-1" />
                    Faltam {differenceInDays(getWeekEndDate(globalVipSettings.default_week_start_date), startOfDay(new Date()))} dia(s)
                  </Badge>
                )}
                <Button onClick={handleResetSemanal} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Resetar Status Semanal
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rankings-clientes" className="space-y-6"> {/* Renamed tab content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Ranking Semanal
                </CardTitle>
                <CardDescription>
                  Top 10 clientes da semana atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Gastos</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankingSemanal.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          Nenhum cliente no ranking semanal.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rankingSemanal.map((item) => (
                        <TableRow key={item.cliente_id}>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {getRankingBadge(item.posicao)}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{item.cliente_nome}</TableCell>
                          <TableCell>{formatCurrency(item.valor_gasto)}</TableCell>
                          <TableCell>
                            {getVipLevelBadge(item.nivel_vip || 'Novo', item.is_vip || false)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Medal className="w-5 h-5 text-blue-500" />
                  Ranking Mensal
                </CardTitle>
                <CardDescription>
                  Top 10 clientes do mês atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Gastos</TableHead>
                      <TableHead>Pedidos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankingMensal.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          Nenhum cliente no ranking mensal.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rankingMensal.map((item) => (
                        <TableRow key={item.cliente_id}>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {getRankingBadge(item.posicao)}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{item.cliente_nome}</TableCell>
                          <TableCell>{formatCurrency(item.valor_gasto)}</TableCell>
                          <TableCell>{item.pedidos} pedidos</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Status VIP dos Clientes
              </CardTitle>
              <CardDescription>
                Visualize o progresso e status VIP de todos os clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                  Carregando status VIP dos clientes...
                </div>
              ) : vipStatusClientes.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Nenhum cliente encontrado"
                  description="Cadastre clientes para visualizar seu status VIP."
                  iconClassName="text-muted-foreground"
                />
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  <Accordion type="single" collapsible value={activeAccordionItem} onValueChange={setActiveAccordionItem}>
                    {vipStatusClientes.map((cliente, index) => (
                      <AccordionItem 
                        key={cliente.cliente_id} 
                        value={cliente.cliente_id} 
                        className="border-b last:border-b-0 mb-4 rounded-lg overflow-hidden vixxe-shadow hover:scale-[1.01] transition-transform duration-200"
                      >
                        <AccordionTrigger className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 flex items-center justify-center font-bold text-lg text-primary">
                              {index + 1}º
                            </div>
                            <div className="flex flex-col items-start">
                              <div className="font-medium text-base">{cliente.cliente_nome}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                {getVipLevelBadge(cliente.nivel_vip || 'Novo', cliente.is_vip)}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-bold text-lg text-primary">
                              {formatCurrency(cliente.valor_gasto_semana)}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="space-y-1 w-24"> {/* Compact progress bar for value */}
                                <Progress value={Math.min(cliente.progresso_valor, 100)} className="h-2" />
                                <p className="text-xs text-muted-foreground text-right">
                                  {Math.min(cliente.progresso_valor, 100).toFixed(0)}%
                                </p>
                              </div>
                              <div className="space-y-1 w-24"> {/* Compact progress bar for orders */}
                                <Progress value={Math.min(cliente.progresso_pedidos, 100)} className="h-2" />
                                <p className="text-xs text-muted-foreground text-right">
                                  {Math.min(cliente.progresso_pedidos, 100).toFixed(0)}%
                                </p>
                              </div>
                            </div>
                          </div>
                          {activeAccordionItem === cliente.cliente_id ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </AccordionTrigger>
                        <AccordionContent className="p-4 border-t bg-card/50 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Progresso Valor */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Valor Gasto Semanal</span>
                                <span>{formatCurrency(cliente.valor_gasto_semana || 0)} / {formatCurrency(cliente.meta_valor_semanal || globalVipSettings.default_meta_valor_semanal)}</span>
                              </div>
                              <Progress value={Math.min(cliente.progresso_valor, 100)} className="h-2" />
                            </div>
                            {/* Progresso Pedidos */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Pedidos Semanais</span>
                                <span>{cliente.pedidos_semana || 0} / {cliente.meta_pedidos_semanal || globalVipSettings.default_meta_pedidos_semanal}</span>
                              </div>
                              <Progress value={Math.min(cliente.progresso_pedidos, 100)} className="h-2" />
                            </div>
                          </div>

                          <Separator />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Combo Disponível */}
                            <div>
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <Gift className="w-4 h-4" /> Combo VIP
                              </h4>
                              {cliente.vip_combo_available ? (
                                <Badge className="bg-green-500 text-white">
                                  <Gift className="w-3 h-3 mr-1" />
                                  Disponível
                                </Badge>
                              ) : (
                                <Badge variant="outline">Indisponível</Badge>
                              )}
                            </div>
                            {/* Fim da Semana */}
                            <div>
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Fim da Semana VIP
                              </h4>
                              {cliente.weekEndDate && (
                                <div className="flex flex-col items-start">
                                  <span>{format(cliente.weekEndDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
                                  {cliente.daysUntilWeekEnd !== null && (
                                    <Badge variant="secondary" className="mt-1">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {cliente.daysUntilWeekEnd === 0 ? 'Hoje!' : `${cliente.daysUntilWeekEnd} dia(s)`}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            {/* Fim do Mês */}
                            <div>
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Fim do Mês VIP
                              </h4>
                              {cliente.monthEndDate && (
                                <div className="flex flex-col items-start">
                                  <span>{format(cliente.monthEndDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
                                  {cliente.daysUntilMonthEnd !== null && (
                                    <Badge variant="secondary" className="mt-1">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {cliente.daysUntilMonthEnd === 0 ? 'Hoje!' : `${cliente.daysUntilMonthEnd} dia(s)`}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-end mt-4">
                            <Button variant="outline" size="sm" onClick={() => handleViewVipHistory(clientes.find(c => c.id === cliente.cliente_id)!)}>
                              <History className="w-4 h-4 mr-2" />
                              Ver Histórico VIP
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuracoes" className="space-y-6">
          <Card className="vixxe-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Configuração Global de Períodos VIP
              </CardTitle>
              <CardDescription>
                Defina as datas de início padrão para o cálculo semanal e mensal de *todos* os clientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="global-week-start-date">Data de Início da Semana</Label>
                  <Input
                    id="global-week-start-date"
                    type="date"
                    value={globalDatesForm.weekStartDate || ''}
                    onChange={(e) => setGlobalDatesForm({ ...globalDatesForm, weekStartDate: e.target.value })}
                    title="Esta data será o ponto de partida para o cálculo semanal de todos os clientes."
                  />
                </div>
                <div>
                  <Label htmlFor="global-month-start-date">Data de Início do Mês</Label>
                  <Input
                    id="global-month-start-date"
                    type="date"
                    value={globalDatesForm.monthStartDate || ''}
                    onChange={(e) => setGlobalDatesForm({ ...globalDatesForm, monthStartDate: e.target.value })}
                    title="Esta data será o ponto de partida para o cálculo mensal de todos os clientes."
                  />
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full"
                    disabled={!globalDatesForm.weekStartDate && !globalDatesForm.monthStartDate}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Aplicar Datas Globalmente
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Aplicação Global</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja aplicar estas datas de início de cálculo para *todos* os clientes?
                      Esta ação irá sobrescrever as configurações individuais existentes para clientes que não têm datas personalizadas.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleApplyGlobalDates} className="bg-red-600 hover:bg-red-700">
                      Aplicar Globalmente
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <Card className="vixxe-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Configurações VIP por Cliente
              </CardTitle>
              <CardDescription>
                Configure metas e datas personalizadas para um cliente específico.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="select-client-config">Selecionar Cliente</Label>
                <Select
                  value={selectedClienteId || ''}
                  onValueChange={setSelectedClienteId}
                >
                  <SelectTrigger id="select-client-config">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClienteId && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="meta-valor">Meta de Valor Semanal (R$)</Label>
                      <Input
                        id="meta-valor"
                        type="number"
                        step="0.01"
                        value={clientPersonalSettings.meta_valor_semanal}
                        onChange={(e) => setClientPersonalSettings(prev => ({ ...prev, meta_valor_semanal: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meta-pedidos">Meta de Pedidos Semanal</Label>
                      <Input
                        id="meta-pedidos"
                        type="number"
                        value={clientPersonalSettings.meta_pedidos_semanal}
                        onChange={(e) => setClientPersonalSettings(prev => ({ ...prev, meta_pedidos_semanal: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data-inicio-semana-personalizada">Data de Início da Semana (Personalizada)</Label>
                      <Input
                        id="data-inicio-semana-personalizada"
                        type="date"
                        value={clientPersonalSettings.admin_set_week_start_date || ''}
                        onChange={(e) => setClientPersonalSettings(prev => ({ ...prev, admin_set_week_start_date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data-inicio-mes-personalizada">Data de Início do Mês (Personalizada)</Label>
                      <Input
                        id="data-inicio-mes-personalizada"
                        type="date"
                        value={clientPersonalSettings.admin_set_month_start_date || ''}
                        onChange={(e) => setClientPersonalSettings(prev => ({ ...prev, admin_set_month_start_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Como funciona o Sistema VIP:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>Meta Semanal:</strong> Cliente precisa gastar R${clientPersonalSettings.meta_valor_semanal} OU fazer {clientPersonalSettings.meta_pedidos_semanal} pedidos</li>
                      <li>• <strong>Período:</strong> A semana VIP é calculada a partir da 'Data de Início da Semana' (global ou personalizada)</li>
                      <li>• <strong>Premiação:</strong> Combo de até R${globalVipSettings.valor_combo_vip} quando atingir a meta</li>
                      <li>• <strong>Reset:</strong> O status semanal é resetado automaticamente com base na 'Data de Início da Semana'</li>
                    </ul>
                  </div>

                  <Button onClick={handleConfigurarMetas} className="w-full" disabled={loading}>
                    Salvar Configurações para Cliente
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <VipHistorySheet
        open={isVipHistorySheetOpen}
        onOpenChange={setIsVipHistorySheetOpen}
        client={selectedClientForHistory}
        historyData={selectedClientVipHistory}
        currentWeekMonthVipStatus={currentWeekMonthVipStatus}
      />
    </div>
  );
}